/**
 * Provider-agnostic context curator.
 *
 * Within a single tool-loop, when accumulated context exceeds
 * CURATION_TRIGGER_TOKENS, replaces older tool results with short
 * summaries written by the configured compaction LLM (defaults to
 * Haiku). The most recent CURATION_KEEP_RECENT tool results are always
 * preserved at full fidelity. Excluded tools (memory ops by default)
 * are never curated.
 *
 * Operates on two formats:
 *   - Anthropic native: tool_result blocks inside user-role messages
 *   - OpenAI Responses input: top-level function_call_output items
 *
 * Returns the (mutated) messages array plus a list of curation events
 * that the caller logs to the DB.
 */

import { streamChat } from '../tools/providers/index.js';
import { estimateTokens } from './compaction.js';

const CURATION_TRIGGER_TOKENS = parseInt(process.env.CURATION_TRIGGER_TOKENS || '100000', 10);
const CURATION_KEEP_RECENT    = parseInt(process.env.CURATION_KEEP_RECENT    || '5', 10);
const CURATION_MIN_RESULT_SIZE = parseInt(process.env.CURATION_MIN_RESULT_SIZE || '500', 10);
const CURATION_SUMMARY_TARGET_TOKENS = parseInt(process.env.CURATION_SUMMARY_TARGET_TOKENS || '200', 10);
const CURATION_EXCLUDE_TOOLS = (process.env.CURATION_EXCLUDE_TOOLS || 'memory_retrieve,memory_create,memory_update,memory_delete')
  .split(',').map(s => s.trim()).filter(Boolean);

const CURATION_PREFIX = '[Tool result curated to save context]';

const SUMMARIZER_SYSTEM_PROMPT = (
  'You are a tool-result summarizer for an agent. Compress the tool output below to ' +
  `approximately ${CURATION_SUMMARY_TARGET_TOKENS} tokens, preserving:\n` +
  '- key facts, numbers, names, dates, URLs, identifiers\n' +
  '- specific data the agent might need to cite or reference later\n' +
  '- error messages or limitations encountered\n\n' +
  'Drop:\n' +
  '- formatting, headers, navigation, marketing copy\n' +
  '- repetition and redundant phrasing\n\n' +
  'Output ONLY the summary content. No preamble like "Here is the summary:".'
);

function isAlreadyCurated(text) {
  return typeof text === 'string' && text.startsWith(CURATION_PREFIX);
}

/**
 * Find tool-result references in messages, handling both Anthropic
 * (tool_result blocks in user messages) and OpenAI Responses
 * (function_call_output top-level items) formats.
 *
 * Returns refs in chronological order. Each ref carries enough info to
 * read its current text and rewrite it.
 */
function findToolResults(messages) {
  const refs = [];

  for (let mi = 0; mi < messages.length; mi++) {
    const msg = messages[mi];

    // OpenAI Responses input format
    if (msg && msg.type === 'function_call_output') {
      let toolName = null;
      let toolInput = null;
      // Walk backwards to find matching function_call
      for (let pmi = mi - 1; pmi >= 0; pmi--) {
        const prev = messages[pmi];
        if (prev && prev.type === 'function_call' && prev.call_id === msg.call_id) {
          toolName = prev.name;
          try { toolInput = JSON.parse(prev.arguments || '{}'); } catch { toolInput = {}; }
          break;
        }
      }
      refs.push({ format: 'openai_responses', messageIndex: mi, blockIndex: -1, toolName, toolInput });
      continue;
    }

    // Anthropic native format
    if (msg && msg.role === 'user' && Array.isArray(msg.content)) {
      for (let bi = 0; bi < msg.content.length; bi++) {
        const block = msg.content[bi];
        if (block && block.type === 'tool_result') {
          // Find matching tool_use in the most recent assistant message
          let toolName = null;
          let toolInput = null;
          for (let pmi = mi - 1; pmi >= 0; pmi--) {
            const prev = messages[pmi];
            if (prev && prev.role === 'assistant' && Array.isArray(prev.content)) {
              const tu = prev.content.find(b => b && b.type === 'tool_use' && b.id === block.tool_use_id);
              if (tu) { toolName = tu.name; toolInput = tu.input || {}; break; }
            }
          }
          refs.push({ format: 'anthropic', messageIndex: mi, blockIndex: bi, toolName, toolInput });
        }
      }
    }
  }

  return refs;
}

function readResultText(ref, messages) {
  const msg = messages[ref.messageIndex];
  if (ref.format === 'openai_responses') {
    return typeof msg.output === 'string' ? msg.output : JSON.stringify(msg.output || '');
  }
  // anthropic
  const block = msg.content[ref.blockIndex];
  const c = block.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c.map(b => (typeof b === 'string' ? b : (b && b.type === 'text' ? (b.text || '') : ''))).join('\n');
  }
  return '';
}

function writeResultText(ref, messages, newText) {
  const msg = messages[ref.messageIndex];
  if (ref.format === 'openai_responses') {
    msg.output = newText;
    return;
  }
  // anthropic
  const block = msg.content[ref.blockIndex];
  block.content = newText;
}

async function summarizeOne(toolName, toolInput, resultText, config) {
  if (!config?.compaction_provider || !config?.compaction_model) return null;

  // Cap input to the summarizer to avoid unbounded summarizer cost.
  const truncated = resultText.length > 60000
    ? resultText.slice(0, 60000) + '\n...[input to summarizer truncated]'
    : resultText;

  const prompt = [
    { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `Tool: ${toolName || 'unknown'}\n` +
        `Parameters: ${JSON.stringify(toolInput || {}).slice(0, 500)}\n\n` +
        `Result to summarize:\n${truncated}`,
    },
  ];

  let summaryText = '';
  try {
    await streamChat({
      provider: config.compaction_provider,
      model: config.compaction_model,
      messages: prompt,
      enabledTools: [],
      config: {
        ANTHROPIC_API_KEY: config.anthropic_api_key,
        OPENAI_API_KEY: config.openai_api_key,
        ANTHROPIC_MAX_TOKENS: Math.max(256, CURATION_SUMMARY_TARGET_TOKENS + 64),
      },
      onText: (chunk) => { summaryText += chunk; },
      maxIterations: 1,
    });
  } catch (err) {
    console.error(`[CURATION] Summarizer failed for ${toolName}:`, err.message);
    return null;
  }

  const cleaned = summaryText.trim();
  return cleaned || null;
}

function buildCuratedBody(toolName, toolInput, summary) {
  const params = JSON.stringify(toolInput || {}).slice(0, 200);
  if (summary) {
    return (
      `${CURATION_PREFIX}\n` +
      `Tool: ${toolName || 'unknown'}\n` +
      `Params: ${params}\n\n` +
      `Summary: ${summary}\n\n` +
      `(Re-call this tool if you need the full original result.)`
    );
  }
  return (
    `${CURATION_PREFIX}\n` +
    `Tool: ${toolName || 'unknown'}\n` +
    `Params: ${params}\n\n` +
    `(Result content cleared to save context. Re-call this tool if you need the data.)`
  );
}

/**
 * Curate old tool results in the messages array (mutates in place).
 *
 * @param {Array} messages - Anthropic conversation OR OpenAI Responses input
 * @param {Object} config  - { compaction_provider, compaction_model, anthropic_api_key, openai_api_key }
 * @param {Object} opts    - { iteration } context for telemetry
 * @returns {Promise<{ events: Array }>}
 */
export async function curateOldToolResults(messages, config, opts = {}) {
  if (!CURATION_TRIGGER_TOKENS || CURATION_TRIGGER_TOKENS <= 0) {
    return { events: [] };
  }

  const tokens = estimateTokens(messages);
  const refs = findToolResults(messages);
  console.log(
    `[CURATION CHECK] iter=${opts.iteration || '?'} tokens=~${tokens} ` +
    `(threshold=${CURATION_TRIGGER_TOKENS}) tool_results=${refs.length} ` +
    `(keep_recent=${CURATION_KEEP_RECENT})`,
  );

  if (tokens < CURATION_TRIGGER_TOKENS) {
    return { events: [] };
  }

  if (refs.length <= CURATION_KEEP_RECENT) {
    return { events: [] };
  }

  // Strict keep_recent: never curate the most recent N tool results.
  const candidates = refs.slice(0, refs.length - CURATION_KEEP_RECENT);

  const toCurate = candidates.filter((ref) => {
    if (ref.toolName && CURATION_EXCLUDE_TOOLS.includes(ref.toolName)) return false;
    const text = readResultText(ref, messages);
    if (!text || text.length < CURATION_MIN_RESULT_SIZE) return false;
    if (isAlreadyCurated(text)) return false;
    return true;
  });

  if (toCurate.length === 0) {
    return { events: [] };
  }

  console.log(
    `✂️ [CURATION] Triggered: ~${tokens} tokens > ${CURATION_TRIGGER_TOKENS} threshold. ` +
    `Curating ${toCurate.length}/${refs.length} tool results (keeping ${CURATION_KEEP_RECENT} most recent).`,
  );

  // Run summarizer calls in parallel.
  const work = toCurate.map(async (ref) => {
    const original = readResultText(ref, messages);
    const summary = await summarizeOne(ref.toolName, ref.toolInput, original, config);
    return { ref, original, summary };
  });

  const results = await Promise.all(work);

  const events = [];
  let summarized = 0;
  let placeholdered = 0;
  let totalSavedChars = 0;

  for (const { ref, original, summary } of results) {
    const newText = buildCuratedBody(ref.toolName, ref.toolInput, summary);
    writeResultText(ref, messages, newText);

    const savedChars = original.length - newText.length;
    totalSavedChars += Math.max(0, savedChars);
    if (summary) summarized++; else placeholdered++;

    events.push({
      tool_name: ref.toolName || 'unknown',
      iteration: opts.iteration || 0,
      original_chars: original.length,
      curated_chars: newText.length,
      chars_saved: Math.max(0, savedChars),
      tokens_saved_estimate: Math.max(0, Math.round(savedChars / 3.2)),
      used_summary: !!summary,
    });
  }

  const tokensAfter = estimateTokens(messages);
  console.log(
    `✂️ [CURATION] Done: ~${Math.round(totalSavedChars / 3.2)} tokens saved ` +
    `(~${tokens} → ~${tokensAfter}). ${summarized} summarized, ${placeholdered} placeholder.`,
  );

  return { events };
}

export {
  CURATION_TRIGGER_TOKENS,
  CURATION_KEEP_RECENT,
  CURATION_MIN_RESULT_SIZE,
  CURATION_SUMMARY_TARGET_TOKENS,
  CURATION_EXCLUDE_TOOLS,
  CURATION_PREFIX,
};
