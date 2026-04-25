/**
 * Anthropic (Claude) provider.
 *
 * Implements streamChat against the Messages streaming API with:
 *   - native tool calling (multi-round)
 *   - prompt caching (system + trailing message breakpoint)
 *   - image handling (URL passthrough for HTTPS, inlined base64 for HTTP)
 */

import Anthropic from '@anthropic-ai/sdk';
import { toAnthropicTools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { curateOldToolResults } from '../../api/context-curator.js';
import { logRequest, logResponse, logMessages } from '../../utils/debug-logger.js';

const DEFAULT_MAX_TOKENS = 4096;

function getClient(config) {
  return new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
}

/**
 * Extract system messages for Anthropic's top-level `system` parameter.
 * Long system prompts are wrapped as a cache breakpoint.
 */
function extractSystem(messages) {
  const systemMessages = messages.filter(m => m.role === 'system');
  const rest = messages.filter(m => m.role !== 'system');

  if (systemMessages.length === 0) return { system: null, rest };

  const text = systemMessages.map(m => {
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.content)) {
      return m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    }
    return '';
  }).join('\n\n');

  // Anthropic caches prompts ≥1024 tokens; we just mark the breakpoint.
  const system = text.length > 500
    ? [{ type: 'text', text, cache_control: { type: 'ephemeral' } }]
    : text;
  return { system, rest };
}

function parseDataUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  return m ? { mediaType: m[1], data: m[2] } : null;
}

/**
 * Convert canonical messages to Anthropic's content-block format.
 * - image_url blocks → image blocks
 * - HTTPS URLs pass through; HTTP URLs get fetched + inlined as base64.
 */
async function toAnthropicMessages(messages) {
  const out = [];
  for (const msg of messages) {
    if (typeof msg.content === 'string' || !Array.isArray(msg.content)) {
      out.push(msg);
      continue;
    }
    const converted = [];
    for (const block of msg.content) {
      if (block.type === 'text' || block.type === 'image') {
        converted.push(block);
        continue;
      }
      if (block.type === 'image_url' && block.image_url?.url) {
        const url = block.image_url.url;
        const dataUrl = parseDataUrl(url);
        if (dataUrl) {
          converted.push({
            type: 'image',
            source: { type: 'base64', media_type: dataUrl.mediaType, data: dataUrl.data },
          });
        } else if (url.startsWith('https://')) {
          converted.push({ type: 'image', source: { type: 'url', url } });
        } else if (url.startsWith('http://')) {
          // Anthropic rejects http://; fetch and inline.
          try {
            const resp = await fetch(url);
            const buf = Buffer.from(await resp.arrayBuffer());
            converted.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: resp.headers.get('content-type') || 'image/jpeg',
                data: buf.toString('base64'),
              },
            });
          } catch (err) {
            console.error(`[anthropic] failed to inline image ${url}: ${err.message}`);
          }
        }
        continue;
      }
      converted.push(block);
    }
    out.push({ ...msg, content: converted });
  }
  return out;
}

/**
 * Apply prompt-caching breakpoints:
 *   - first message (mirrors where system cache is)
 *   - last message of the current turn (so next turn gets a cache hit)
 */
function applyCacheBreakpoints(messages) {
  if (messages.length === 0) return messages;

  // Strip existing breakpoints we set previously.
  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) delete block.cache_control;
    }
  }

  // First message: wrap string content ≥500 chars in a text block with cache_control.
  const first = messages[0];
  if (first) {
    if (typeof first.content === 'string' && first.content.length > 500) {
      messages[0] = {
        ...first,
        content: [{ type: 'text', text: first.content, cache_control: { type: 'ephemeral' } }],
      };
    } else if (Array.isArray(first.content) && first.content.length > 0) {
      const blocks = first.content.map((b, i) =>
        i === first.content.length - 1 && b.type === 'text'
          ? { ...b, cache_control: { type: 'ephemeral' } }
          : b
      );
      messages[0] = { ...first, content: blocks };
    }
  }

  // Last message: same treatment.
  const lastIdx = messages.length - 1;
  if (lastIdx > 0) {
    const last = messages[lastIdx];
    if (Array.isArray(last.content) && last.content.length > 0) {
      last.content[last.content.length - 1].cache_control = { type: 'ephemeral' };
    } else if (typeof last.content === 'string' && last.content.length > 500) {
      messages[lastIdx] = {
        ...last,
        content: [{ type: 'text', text: last.content, cache_control: { type: 'ephemeral' } }],
      };
    }
  }

  return messages;
}

function addToolsCacheControl(tools) {
  if (!tools || tools.length === 0) return tools;
  return tools.map((t, i) =>
    i === tools.length - 1 ? { ...t, cache_control: { type: 'ephemeral' } } : t
  );
}

/**
 * Execute a round of tool calls, stream their outputs, emit their
 * sources, return tool_result blocks to feed back into the model.
 */
async function runTools(toolUseBlocks, config, { onToolCall, onToolResult, onToolOutput, onSource }) {
  const results = [];
  for (const toolUse of toolUseBlocks) {
    if (onToolCall) {
      onToolCall({ type: 'tool_use', id: toolUse.id, name: toolUse.name, input: toolUse.input });
    }

    let outputStarted = false;
    const toolCallbacks = {};
    if (onToolOutput) {
      toolCallbacks.onProgress = ({ type, chunk }) => {
        if (type === 'output' && chunk) {
          if (!outputStarted) { onToolOutput('\n```\n'); outputStarted = true; }
          onToolOutput(chunk);
        }
      };
    }

    const t0 = Date.now();
    const exec = await executeToolCall(toolUse.name, toolUse.input, config, toolCallbacks);
    const execMs = Date.now() - t0;

    if (outputStarted) onToolOutput('```\n\n');

    if (onSource && exec.sources && exec.sources.length > 0) {
      for (const source of exec.sources) onSource(source);
    }

    if (onToolResult) {
      onToolResult({
        name: toolUse.name,
        result: exec.result,
        error: exec.error,
        execution_time_ms: execMs,
      });
    }

    results.push({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: exec.error
        ? JSON.stringify({ error: exec.error })
        : JSON.stringify({ result: exec.result, sources: exec.sources }),
      is_error: !!exec.error,
    });
  }
  return results;
}

/**
 * Anthropic streaming chat with tool loop.
 */
export async function streamChat({
  model,
  messages,
  enabledTools = [],
  config,
  maxIterations = 5,
  curatorConfig = null,
  onText,
  onToolCall,
  onToolResult,
  onToolOutput,
  onSource,
  onCurationEvent,
}) {
  const client = getClient(config);
  const rawTools = enabledTools.length > 0 ? toAnthropicTools(enabledTools) : null;
  const tools = rawTools ? addToolsCacheControl(rawTools) : null;
  const maxTokens = config.ANTHROPIC_MAX_TOKENS || DEFAULT_MAX_TOKENS;

  const { system, rest } = extractSystem(messages);
  const prepared = await toAnthropicMessages(rest);

  let conversation = applyCacheBreakpoints([...prepared]);

  const totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    if (iteration > 1) applyCacheBreakpoints(conversation);

    const payload = {
      model,
      max_tokens: maxTokens,
      ...(system && { system }),
      messages: conversation,
      ...(tools && { tools }),
    };

    logMessages(`ANTHROPIC iteration=${iteration}`, conversation);
    logRequest('anthropic-stream', payload);

    const stream = await client.messages.stream(payload);
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta' && onText) {
        onText(event.delta.text);
      }
    }
    const finalMessage = await stream.finalMessage();
    logResponse('anthropic-stream', finalMessage);

    if (finalMessage.usage) {
      totalUsage.input_tokens += finalMessage.usage.input_tokens || 0;
      totalUsage.output_tokens += finalMessage.usage.output_tokens || 0;
      totalUsage.cache_creation_input_tokens += finalMessage.usage.cache_creation_input_tokens || 0;
      totalUsage.cache_read_input_tokens += finalMessage.usage.cache_read_input_tokens || 0;
    }

    if (finalMessage.stop_reason === 'tool_use') {
      conversation.push({ role: 'assistant', content: finalMessage.content });
      const toolUseBlocks = finalMessage.content.filter(b => b.type === 'tool_use');
      const toolResults = await runTools(toolUseBlocks, config, { onToolCall, onToolResult, onToolOutput, onSource });
      conversation.push({ role: 'user', content: toolResults });

      // Curate older tool results if accumulated context exceeds threshold.
      if (curatorConfig) {
        const { events } = await curateOldToolResults(conversation, curatorConfig, { iteration });
        if (events.length > 0 && onCurationEvent) {
          for (const ev of events) onCurationEvent(ev);
        }
      }
      continue;
    }

    const text = finalMessage.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return {
      content: text,
      stop_reason: finalMessage.stop_reason,
      usage: totalUsage,
      iterations: iteration,
    };
  }

  // Iteration cap reached without natural termination. Make one final
  // tool-less call so the model produces a summary from what it gathered
  // rather than silently failing the request.
  console.warn(`⚠️ Tool loop hit ${maxIterations} iteration cap; requesting final summary.`);
  const exhaustionNote = {
    role: 'user',
    content: `[Tool iteration cap of ${maxIterations} reached.] Please provide your best final answer to the user's request based on the information already gathered. Do not request any more tools.`,
  };
  const finalPayload = {
    model,
    max_tokens: maxTokens,
    ...(system && { system }),
    messages: [...conversation, exhaustionNote],
  };
  const finalStream = await client.messages.stream(finalPayload);
  let finalText = '';
  for await (const event of finalStream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      if (onText) onText(event.delta.text);
      finalText += event.delta.text;
    }
  }
  const finalMsg = await finalStream.finalMessage();
  if (finalMsg.usage) {
    totalUsage.input_tokens += finalMsg.usage.input_tokens || 0;
    totalUsage.output_tokens += finalMsg.usage.output_tokens || 0;
    totalUsage.cache_creation_input_tokens += finalMsg.usage.cache_creation_input_tokens || 0;
    totalUsage.cache_read_input_tokens += finalMsg.usage.cache_read_input_tokens || 0;
  }
  return {
    content: finalText || '[Tool loop exceeded iteration cap before producing a final answer.]',
    stop_reason: 'iteration_cap',
    usage: totalUsage,
    iterations: maxIterations,
  };
}
