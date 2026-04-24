/**
 * Conversation compaction + token budgeting.
 *
 * estimateTokens / trimMessagesToTokenLimit are generally useful — they
 * operate on message arrays and don't touch the DB.
 *
 * compactMessages keeps rolling summaries in the conversation_summaries
 * table and replaces old messages with the summary once the input
 * budget is exceeded. callCompactionLLM does the actual summarisation.
 */

import { streamChat } from '../tools/providers/index.js';

const MAX_INPUT_TOKENS = parseInt(process.env.MAX_INPUT_TOKENS || '0', 10);
const COMPACTION_TOKEN_THRESHOLD = parseInt(process.env.COMPACTION_TOKEN_THRESHOLD || '65536', 10);
const COMPACTION_MAX_SUMMARY_TOKENS = parseInt(process.env.COMPACTION_MAX_SUMMARY_TOKENS || '1024', 10);

/**
 * Rough token estimator (~3.2 chars/token for text, ~500 tokens/image,
 * ~350 tokens/tool definition). Good enough for budget decisions.
 */
export function estimateTokens(messages, { toolCount = 0 } = {}) {
  let chars = 0;
  for (const msg of messages) {
    chars += 48; // per-message structural overhead (~15 tokens)
    if (typeof msg.content === 'string') {
      chars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text' && block.text) {
          chars += block.text.length;
        } else if (block.type === 'image_url' || block.type === 'image' || block.type === 'input_image') {
          chars += 1600;
        } else if (block.type === 'tool_use') {
          chars += (block.name || '').length + JSON.stringify(block.input || {}).length;
        } else if (block.type === 'tool_result') {
          const content = block.content;
          if (typeof content === 'string') chars += content.length;
          else if (Array.isArray(content)) {
            for (const sub of content) {
              if (sub.type === 'text' && sub.text) chars += sub.text.length;
            }
          }
        }
      }
    }
  }
  chars += toolCount * 1120;
  return Math.ceil(chars / 3.2);
}

/**
 * Trim oldest non-system messages until estimated tokens fit. Always
 * keeps system messages and the last user turn.
 */
export function trimMessagesToTokenLimit(messages, maxTokens, toolCount = 0) {
  if (!maxTokens || maxTokens <= 0) return messages;
  if (estimateTokens(messages, { toolCount }) <= maxTokens) return messages;

  const systemMsgs = messages.filter(m => m.role === 'system');
  const convMsgs   = messages.filter(m => m.role !== 'system');
  if (convMsgs.length === 0) return messages;

  const lastMsg = convMsgs[convMsgs.length - 1];
  const trimmed = convMsgs.slice(0, -1);

  const systemTokens  = estimateTokens(systemMsgs);
  const lastMsgTokens = estimateTokens([lastMsg]);
  const toolTokens    = toolCount * 350;
  let budget = maxTokens - systemTokens - lastMsgTokens - toolTokens;

  const kept = [];
  for (let i = trimmed.length - 1; i >= 0 && budget > 0; i--) {
    const t = estimateTokens([trimmed[i]]);
    if (t > budget) break;
    kept.unshift(trimmed[i]);
    budget -= t;
  }

  const removed = trimmed.length - kept.length;
  if (removed > 0) {
    console.log(`✂️ [TOKEN LIMIT] Trimmed ${removed} older messages (~${maxTokens} tokens budget)`);
  }
  return [...systemMsgs, ...kept, lastMsg];
}

/**
 * Summarise the supplied messages via the compaction LLM.
 */
async function callCompactionLLM(messagesToSummarize, config) {
  const conversationText = messagesToSummarize.map(m => {
    const role = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System';
    const text = typeof m.content === 'string'
      ? m.content
      : Array.isArray(m.content)
        ? m.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        : '';
    return `${role}: ${text}`;
  }).join('\n\n');

  const prompt = [
    {
      role: 'system',
      content: 'You are a conversation summarizer. Create a concise but comprehensive summary of the conversation below. Preserve: key decisions, important facts, user preferences, action items, and any context the assistant would need to continue helping effectively. Do NOT include pleasantries or filler. Output only the summary, nothing else.',
    },
    { role: 'user', content: conversationText },
  ];

  let summaryText = '';
  const response = await streamChat({
    model: config.compaction_model,
    provider: config.compaction_provider,
    messages: prompt,
    enabledTools: [],
    config: {
      ANTHROPIC_API_KEY: config.anthropic_api_key,
      OPENAI_API_KEY: config.openai_api_key,
      ANTHROPIC_MAX_TOKENS: COMPACTION_MAX_SUMMARY_TOKENS,
    },
    onText: (chunk) => { summaryText += chunk; },
    maxIterations: 1,
  });

  const final = summaryText || response.content || 'Unable to generate summary.';
  console.log(`📝 [COMPACTION] Summary generated: ${final.length} chars`);
  return final;
}

/**
 * If the conversation exceeds the compaction threshold, summarise old
 * messages and return a trimmed list. Persists rolling summaries.
 */
export async function compactMessages(processedMessages, config, db, conversationId, onStatus = null, toolCount = 0) {
  if (!COMPACTION_TOKEN_THRESHOLD || COMPACTION_TOKEN_THRESHOLD <= 0) return processedMessages;
  if (!config.enable_compaction) return processedMessages;
  if (!config.compaction_provider || !config.compaction_model) return processedMessages;

  const systemMsgs = processedMessages.filter(m => m.role === 'system');
  const convMsgs   = processedMessages.filter(m => m.role !== 'system');
  if (convMsgs.length <= 2) return processedMessages;

  const threshold = COMPACTION_TOKEN_THRESHOLD;
  const existing = db.getSummary(conversationId);
  const RECENT_KEEP = 2;

  const makeSummaryMsg = (text) => ({
    role: 'system',
    content: `[CONVERSATION SUMMARY]\n${text}\n[/CONVERSATION SUMMARY]`,
  });

  if (existing && existing.watermark < convMsgs.length) {
    const summaryMsg = makeSummaryMsg(existing.summary);
    const newMsgsSinceWatermark = convMsgs.slice(existing.watermark);

    const estimated = estimateTokens([...systemMsgs, summaryMsg, ...newMsgsSinceWatermark], { toolCount });
    if (estimated <= threshold) {
      console.log(`📋 [COMPACTION] Using cached summary (watermark=${existing.watermark}) + ${newMsgsSinceWatermark.length} new messages (~${estimated} tokens)`);
      return [...systemMsgs, summaryMsg, ...newMsgsSinceWatermark];
    }

    // Re-compact: include previous summary as context
    const toSummarize = newMsgsSinceWatermark.slice(0, -RECENT_KEEP);
    const recentMsgs = newMsgsSinceWatermark.slice(-RECENT_KEEP);
    const recentStartIndex = convMsgs.length - RECENT_KEEP;
    const msgsToProcess = trimMessagesToTokenLimit([summaryMsg, ...toSummarize], MAX_INPUT_TOKENS);
    console.log(`🔄 [COMPACTION] Re-compacting: prev summary + ${toSummarize.length} messages, keeping last ${RECENT_KEEP}`);

    if (onStatus) onStatus(false);
    const summary = await callCompactionLLM(msgsToProcess, config);
    if (onStatus) onStatus(true);
    db.upsertSummary(conversationId, summary, recentStartIndex);
    return [...systemMsgs, makeSummaryMsg(summary), ...recentMsgs];
  }

  if (existing) return processedMessages; // summary covers everything

  // First compaction
  const estimated = estimateTokens(processedMessages, { toolCount });
  if (estimated <= threshold) return processedMessages;

  const toSummarize = convMsgs.slice(0, -RECENT_KEEP);
  const recentMsgs  = convMsgs.slice(-RECENT_KEEP);
  const recentStartIndex = convMsgs.length - RECENT_KEEP;
  const trimmedToSummarize = trimMessagesToTokenLimit(toSummarize, MAX_INPUT_TOKENS);
  console.log(`✂️ [COMPACTION] First compaction: ${trimmedToSummarize.length}/${toSummarize.length} messages, keeping last ${RECENT_KEEP}`);

  if (onStatus) onStatus(false);
  const summary = await callCompactionLLM(trimmedToSummarize, config);
  if (onStatus) onStatus(true);
  db.upsertSummary(conversationId, summary, recentStartIndex);
  return [...systemMsgs, makeSummaryMsg(summary), ...recentMsgs];
}

export { MAX_INPUT_TOKENS, COMPACTION_TOKEN_THRESHOLD };
