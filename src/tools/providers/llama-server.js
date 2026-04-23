/**
 * llama-server Provider (OpenAI-Compatible)
 *
 * Primary local LLM provider using llama-server's OpenAI-compatible API.
 * Handles tool calling via Chat Completions format with support for:
 * - Streaming with tool calls
 * - escalate_to_expert: mid-conversation handoff to Anthropic Sonnet
 * - view_image: image metadata retrieval for blind-model escalation
 * - VRAM-aware fallback (health check → Anthropic when llama-server is down)
 */

import OpenAI from 'openai';
import { Agent, fetch as undiciFetch } from 'undici';
import { toOpenAIChatCompletionsTools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { logRequest, logResponse, logMessages } from '../../utils/debug-logger.js';
import { convertToAnthropicFormat } from '../../utils/anthropic-format.js';

/**
 * Dedicated undici dispatcher for llama-server.
 *
 * Isolated from the global fetch pool so our streaming aborts don't contaminate
 * other fetches. Short keep-alive (5s) balances two failure modes:
 *   - Too short (1ms) → rapid reconnects can overwhelm llama.cpp's httplib
 *     server, making even /health unreachable during bursts.
 *   - Too long (default 60s) → stale sockets persist across aborted streams
 *     and the next request hangs for ~10s with "Request timed out.".
 * 5s is long enough to reuse for back-to-back iterations in a tool loop but
 * short enough that idle stale sockets get pruned before the next user request.
 */
const llamaDispatcher = new Agent({
  keepAliveTimeout: 5_000,
  keepAliveMaxTimeout: 10_000,
  connect: { timeout: 10_000 },
});

function getLlamaClient(config) {
  return new OpenAI({
    baseURL: (config.LLAMA_SERVER_URL || 'http://localhost:8080') + '/v1',
    apiKey: 'not-needed',
    timeout: 600000,
    maxRetries: 0,
    fetch: (url, init) => undiciFetch(url, { ...init, dispatcher: llamaDispatcher }),
  });
}

/**
 * Probe /slots after an iteration ends and log the slot state + context usage.
 * Helps identify whether llama-server is properly freeing slots after our
 * self-abort, or whether KV cache is accumulating and never being released.
 */
async function probeSlotsAfter(iteration, config, reason) {
  const baseUrl = (config.LLAMA_SERVER_URL || 'http://localhost:8080');
  // Give llama-server a beat to finish releasing the slot after the response ended
  await new Promise(r => setTimeout(r, 200));
  try {
    const resp = await undiciFetch(`${baseUrl}/slots`, {
      dispatcher: llamaDispatcher,
      signal: AbortSignal.timeout(2000),
    });
    if (!resp.ok) return;
    const slots = await resp.json();
    const summary = slots.map(s => {
      const tokens = s.prompt?.tokens?.length ?? s.slot?.prompt?.tokens?.length ?? 0;
      return `${s.id}=${s.is_processing ? 'BUSY' : 'idle'}(ctx=${tokens})`;
    }).join(',');
    console.log(`🔍 [LLAMA-STREAM iter=${iteration}] slots after (${reason}): ${summary}`);
  } catch (err) {
    console.warn(`⚠️ [LLAMA-STREAM iter=${iteration}] /slots post-probe failed: ${err.message}`);
  }
}

/**
 * Strip image_url blocks from messages — llama-server has no vision.
 * Server-level auto-route should prevent images reaching here, but be defensive.
 * @param {array} messages
 * @returns {array}
 */
function stripImageBlocks(messages) {
  let stripped = false;
  const cleaned = messages.map(msg => {
    if (!Array.isArray(msg.content)) return msg;

    const filtered = msg.content.filter(block => {
      if (block.type === 'image_url') {
        stripped = true;
        return false;
      }
      return true;
    });

    // If only images remained, replace with placeholder text
    if (filtered.length === 0) {
      return { ...msg, content: '[Image content removed — this model has no vision capability]' };
    }

    // If we filtered some blocks, flatten to string if only text remains
    if (filtered.length === 1 && filtered[0].type === 'text') {
      return { ...msg, content: filtered[0].text };
    }

    return { ...msg, content: filtered };
  });

  if (stripped) {
    console.warn('⚠️ [LLAMA-SERVER] Stripped image_url blocks — llama-server has no vision');
  }

  return cleaned;
}

/**
 * Handle tool calls from llama-server response
 * @param {array} toolCalls - Tool calls from the response
 * @param {object} config - Configuration
 * @param {function} onToolCall - Callback for tool call display
 * @param {function} onSource - Callback for source citations
 * @param {function} onToolOutput - Callback for streaming tool output
 * @returns {Promise<array>} - Tool result messages in OpenAI CC format
 */
async function handleToolCalls(toolCalls, config, onToolCall, onSource, onToolOutput) {
  if (!toolCalls || toolCalls.length === 0) return null;

  const results = [];

  for (const toolCall of toolCalls) {
    const args = typeof toolCall.function.arguments === 'string'
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    // Display tool call to user
    if (onToolCall) {
      onToolCall({
        type: 'tool_call',
        name: toolCall.function.name,
        arguments: args
      });
    }

    // Build callbacks for sandbox output streaming
    let outputStarted = false;
    const toolCallbacks = {};
    if (onToolOutput) {
      toolCallbacks.onProgress = ({ type, chunk }) => {
        if (type === 'output' && chunk) {
          if (!outputStarted) {
            onToolOutput('\n```\n');
            outputStarted = true;
          }
          onToolOutput(chunk);
        }
      };
    }

    // Execute the tool
    const executionResult = await executeToolCall(
      toolCall.function.name,
      args,
      config,
      toolCallbacks
    );

    // Close code block if we streamed any output
    if (outputStarted) {
      onToolOutput('```\n\n');
    }

    // Emit sources for OWUI citation panel
    if (onSource && executionResult.sources && executionResult.sources.length > 0) {
      for (const source of executionResult.sources) {
        onSource(source);
      }
    }

    // Cap tool output going back to the model. Commands like `curl` against RSS feeds
    // or long web pages can produce 100KB+ of text which tokenizes to ~25K tokens —
    // enough to choke llama-server's request processing (15s+ just to parse the payload)
    // and to blow past usable context quickly across a few tool iterations.
    // 24000 chars ≈ 6000 tokens which is plenty for the model to work with.
    const MAX_TOOL_RESULT_CHARS = 24000;
    let resultPayload = executionResult.error
      ? JSON.stringify({ error: executionResult.error })
      : JSON.stringify({ result: executionResult.result, sources: executionResult.sources });
    if (resultPayload.length > MAX_TOOL_RESULT_CHARS) {
      const original = resultPayload.length;
      const head = resultPayload.slice(0, MAX_TOOL_RESULT_CHARS - 200);
      const tail = resultPayload.slice(-200);
      resultPayload = `${head}\n\n[... truncated ${original - MAX_TOOL_RESULT_CHARS} chars of tool output — full result was ${original} chars ...]\n\n${tail}`;
      console.warn(`✂️  [TOOL] Truncated ${toolCall.function.name} result from ${original} to ${resultPayload.length} chars`);
    }

    results.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: resultPayload,
    });
  }

  return results;
}

/**
 * Execute chat completion (non-streaming) with tool loop
 */
export async function chatCompletion({
  model,
  messages,
  enabledTools = [],
  config,
  onText,
  onToolCall,
  onToolOutput,
  onSource,
  maxIterations = 15
}) {
  const client = getLlamaClient(config);
  const tools = enabledTools.length > 0 ? toOpenAIChatCompletionsTools(enabledTools) : undefined;

  // Strip images — llama-server has no vision
  const cleanMessages = stripImageBlocks(messages);

  let iteration = 0;
  let conversationMessages = [...cleanMessages];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  while (iteration < maxIterations) {
    iteration++;

    const requestPayload = {
      model: config.llm_model || model || 'qwen3.6-35b-a3b',
      messages: conversationMessages,
      ...(tools && { tools, tool_choice: 'auto' }),
      stream: false,
      temperature: 1.0,
      top_p: 1.0,
    };

    logMessages(`LLAMA-SERVER REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('llama-server', requestPayload);

    const response = await client.chat.completions.create(requestPayload);

    logResponse('llama-server', response);

    const message = response.choices?.[0]?.message;
    if (!message) throw new Error('No message in llama-server response');

    // Accumulate usage
    totalPromptTokens += response.usage?.prompt_tokens || 0;
    totalCompletionTokens += response.usage?.completion_tokens || 0;

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Check for escalate_to_expert
      const escalation = message.tool_calls.find(tc => tc.function.name === 'escalate_to_expert');
      if (escalation) {
        return await handleEscalation({
          escalationCall: escalation,
          conversationMessages,
          assistantMessage: message,
          enabledTools: enabledTools,
          config,
          onText,
          onToolCall,
          onToolOutput,
          onSource,
          maxIterations,
          iteration,
          totalPromptTokens,
          totalCompletionTokens,
        });
      }

      // Normal tool calls
      conversationMessages.push(message);
      const toolResults = await handleToolCalls(message.tool_calls, config, onToolCall, onSource, onToolOutput);
      if (toolResults) {
        conversationMessages.push(...toolResults);
        continue;
      }
    }

    // Final response — stream text for consistency
    if (onText && message.content) {
      const words = message.content.split(' ');
      for (const word of words) {
        onText(word + ' ');
        await new Promise(r => setTimeout(r, 20));
      }
    }

    return {
      content: message.content || '',
      stop_reason: message.finish_reason || 'stop',
      usage: { prompt_tokens: totalPromptTokens, completion_tokens: totalCompletionTokens },
      iterations: iteration
    };
  }

  throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`);
}

/**
 * Execute chat completion with streaming support and tool loop
 */
export async function chatCompletionStream({
  model,
  messages,
  enabledTools = [],
  config,
  onText,
  onToolCall,
  onToolOutput,
  onSource,
  maxIterations = 15
}) {
  const client = getLlamaClient(config);
  const tools = enabledTools.length > 0 ? toOpenAIChatCompletionsTools(enabledTools) : undefined;

  // Strip images — llama-server has no vision
  const cleanMessages = stripImageBlocks(messages);

  let iteration = 0;
  let conversationMessages = [...cleanMessages];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  while (iteration < maxIterations) {
    iteration++;

    const streamPayload = {
      model: config.llm_model || model || 'qwen3.6-35b-a3b',
      messages: conversationMessages,
      ...(tools && { tools, tool_choice: 'auto' }),
      stream: true,
      temperature: 1.0,
      top_p: 1.0,
    };

    logMessages(`LLAMA-SERVER STREAM REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('llama-server-stream', streamPayload);

    const t0 = Date.now();
    const msgBytes = JSON.stringify(conversationMessages).length;
    console.log(`🔍 [LLAMA-STREAM iter=${iteration}] POST /v1/chat/completions (msgs=${conversationMessages.length}, ~${msgBytes}B, tools=${tools?.length || 0}, model=${streamPayload.model})`);

    // Probe slot state before firing — if slots are wedged from a previous abort,
    // we want to see that rather than have the create() hang opaquely.
    try {
      const baseUrl = (config.LLAMA_SERVER_URL || 'http://localhost:8080');
      const slotsResp = await undiciFetch(`${baseUrl}/slots`, {
        dispatcher: llamaDispatcher,
        signal: AbortSignal.timeout(2000),
      });
      if (slotsResp.ok) {
        const slots = await slotsResp.json();
        const summary = slots.map(s => `${s.id}=${s.is_processing ? 'BUSY' : 'idle'}`).join(',');
        console.log(`🔍 [LLAMA-STREAM iter=${iteration}] slots before: ${summary}`);
      }
    } catch (err) {
      console.warn(`⚠️ [LLAMA-STREAM iter=${iteration}] /slots probe failed: ${err.message}`);
    }

    // Hard 15s timeout on the initial create() — if llama-server doesn't return headers
    // by then, something's wrong (busy slot, cold start, network). Fail fast to fallback.
    let stream;
    try {
      stream = await Promise.race([
        client.chat.completions.create(streamPayload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('llama-server create() timeout after 15s')), 15000)),
      ]);
      console.log(`🔍 [LLAMA-STREAM iter=${iteration}] headers received at ${Date.now() - t0}ms`);
    } catch (err) {
      console.error(`❌ [LLAMA-STREAM iter=${iteration}] create() FAILED at ${Date.now() - t0}ms: ${err.name}: ${err.message}`);
      if (err.cause) console.error(`   cause: ${err.cause.code || err.cause.name}: ${err.cause.message}`);
      throw err;
    }

    // Accumulate the streamed response
    let accumulatedContent = '';
    let accumulatedReasoning = '';
    const accumulatedToolCalls = new Map(); // id → { id, type, function: { name, arguments } }
    let finishReason = null;
    let streamUsage = null;
    let chunkCount = 0;
    let firstChunkAt = null;
    let lastChunkAt = t0;

    // llama.cpp's OpenAI-compatible endpoint is unreliable about closing SSE streams
    // after tool_calls completion: sometimes it sends finish_reason but no [DONE], sometimes
    // it sends neither. Either way, the stream hangs until socket timeout (~60s) throwing
    // "terminated". Two safety nets:
    //   1. If we see finish_reason → abort 1.5s later (grace for trailing usage chunk)
    //   2. If no chunk arrives for 4s → abort (covers the "no finish_reason ever" case)
    let finishAbortTimer = null;
    let idleAbortTimer = null;
    let selfAborted = false;
    let selfAbortReason = '';
    const IDLE_TIMEOUT_MS = 4000;
    const scheduleFinishAbort = () => {
      if (finishAbortTimer !== null) return;
      finishAbortTimer = setTimeout(() => {
        selfAborted = true;
        selfAbortReason = 'finish_reason + 1.5s';
        console.log(`🔒 [LLAMA-STREAM iter=${iteration}] closing stream 1.5s after finish_reason — llama.cpp didn't send [DONE]`);
        try { stream.controller?.abort(); } catch {}
      }, 1500);
    };
    const resetIdleAbort = () => {
      if (idleAbortTimer !== null) clearTimeout(idleAbortTimer);
      idleAbortTimer = setTimeout(() => {
        selfAborted = true;
        selfAbortReason = `${IDLE_TIMEOUT_MS}ms idle`;
        console.log(`🔒 [LLAMA-STREAM iter=${iteration}] closing stream after ${IDLE_TIMEOUT_MS}ms of no chunks — llama.cpp stopped streaming without finish_reason`);
        try { stream.controller?.abort(); } catch {}
      }, IDLE_TIMEOUT_MS);
    };

    try {
      for await (const chunk of stream) {
        chunkCount++;
        const now = Date.now();
        if (firstChunkAt === null) {
          firstChunkAt = now;
          console.log(`🔍 [LLAMA-STREAM iter=${iteration}] first chunk at ${now - t0}ms`);
        }
        lastChunkAt = now;
        resetIdleAbort();

        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;

        // One-time debug log: dump the delta shape of the first chunk so we know what
        // fields the model is actually emitting (content vs reasoning_content vs other).
        if (chunkCount === 1 && delta) {
          const keys = Object.keys(delta);
          console.log(`🔬 [LLAMA-STREAM iter=${iteration}] first delta keys: ${JSON.stringify(keys)}`);
        }

        // Stream text content
        if (delta?.content && onText) {
          onText(delta.content);
          accumulatedContent += delta.content;
        }

        // Models with reasoning/thinking modes (Qwen3.x thinking, gpt-oss harmony)
        // separate chain-of-thought (`reasoning_content`) from the user-visible answer
        // (`content`). If only reasoning is flowing and no content arrives, fall back
        // to treating reasoning as content — better to show the user something than nothing.
        if (!delta?.content && delta?.reasoning_content && onText) {
          if (chunkCount === 1) {
            console.log(`🔬 [LLAMA-STREAM iter=${iteration}] model emitting reasoning_content (no content field yet)`);
          }
          // Buffer reasoning but don't stream yet — wait to see if real content follows
          accumulatedReasoning += delta.reasoning_content;
        }

        // Accumulate tool calls from deltas
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!accumulatedToolCalls.has(idx)) {
              accumulatedToolCalls.set(idx, {
                id: tc.id || '',
                type: 'function',
                function: { name: '', arguments: '' }
              });
            }
            const existing = accumulatedToolCalls.get(idx);
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.function.name += tc.function.name;
            if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
          }
        }

        if (choice.finish_reason) {
          finishReason = choice.finish_reason;
          console.log(`🔍 [LLAMA-STREAM iter=${iteration}] finish_reason=${finishReason} at chunk ${chunkCount}, ${now - t0}ms`);
          scheduleFinishAbort();
        }

        // Capture usage from the final chunk
        if (chunk.usage) {
          streamUsage = chunk.usage;
        }
      }
      if (finishAbortTimer) clearTimeout(finishAbortTimer);
      if (idleAbortTimer) clearTimeout(idleAbortTimer);
      console.log(`✅ [LLAMA-STREAM iter=${iteration}] stream complete: ${chunkCount} chunks, ${accumulatedContent.length} chars, ${[...accumulatedToolCalls.values()].length} tool_calls, ${Date.now() - t0}ms total`);
      // Post-stream slot probe — surfaces whether llama-server is properly
      // releasing the slot after our self-abort + stream end.
      probeSlotsAfter(iteration, config, 'normal').catch(() => {});
    } catch (err) {
      if (finishAbortTimer) clearTimeout(finishAbortTimer);
      if (idleAbortTimer) clearTimeout(idleAbortTimer);
      // If we self-aborted (either finish_reason+delay or idle timeout), that's a clean exit as long as we got content/tool_calls/reasoning.
      const haveResult = finishReason || accumulatedContent.length > 0 || accumulatedToolCalls.size > 0 || accumulatedReasoning.length > 0;
      if (selfAborted && haveResult) {
        console.log(`✅ [LLAMA-STREAM iter=${iteration}] stream closed (self-aborted: ${selfAbortReason}, finish=${finishReason || 'none'}): ${chunkCount} chunks, ${accumulatedContent.length} chars, ${accumulatedToolCalls.size} tool_calls, ${Date.now() - t0}ms total`);
        // If no finish_reason was delivered but we have tool_calls, treat as tool_calls
        if (!finishReason && accumulatedToolCalls.size > 0) finishReason = 'tool_calls';
        if (!finishReason && accumulatedContent.length > 0) finishReason = 'stop';
        probeSlotsAfter(iteration, config, 'self-abort').catch(() => {});
      } else {
        const elapsed = Date.now() - t0;
        const sinceLast = Date.now() - lastChunkAt;
        console.error(`❌ [LLAMA-STREAM iter=${iteration}] STREAM ABORTED at ${elapsed}ms (${sinceLast}ms since last chunk, got ${chunkCount} chunks so far)`);
        console.error(`   error: ${err.name}: ${err.message}`);
        if (err.cause) console.error(`   cause: ${err.cause.code || err.cause.name}: ${err.cause.message}`);
        if (err.stack) console.error(`   stack (first 3 frames): ${err.stack.split('\n').slice(0, 4).join('\n')}`);
        throw err;
      }
    }

    // Accumulate usage
    totalPromptTokens += streamUsage?.prompt_tokens || 0;
    totalCompletionTokens += streamUsage?.completion_tokens || 0;

    const toolCallsArray = [...accumulatedToolCalls.values()];

    // If llama.cpp served reasoning_content but never produced a final `content`, promote
    // the reasoning to the user-visible output rather than returning an empty response.
    // Happens when a thinking-mode model outputs its chain-of-thought but never reaches
    // the final answer stage before stopping.
    if (accumulatedContent.length === 0 && accumulatedToolCalls.size === 0 && accumulatedReasoning.length > 0) {
      console.log(`⚠️ [LLAMA-STREAM iter=${iteration}] no content emitted — promoting ${accumulatedReasoning.length} chars of reasoning to output`);
      accumulatedContent = accumulatedReasoning;
      if (onText) onText(accumulatedReasoning);
    }

    // Final safety net: if the model produced nothing at all, throw so the server.js
    // fallback kicks in. Better to get an Anthropic answer than to send empty.
    if (accumulatedContent.length === 0 && accumulatedToolCalls.size === 0) {
      throw new Error('llama-server returned empty response (no content, no tool_calls, no reasoning)');
    }

    logResponse('llama-server-stream', {
      content: accumulatedContent,
      tool_calls: toolCallsArray,
      finish_reason: finishReason,
      usage: streamUsage
    });

    // Check for tool calls
    if (toolCallsArray.length > 0) {
      // Build the assistant message for the conversation
      const assistantMsg = {
        role: 'assistant',
        content: accumulatedContent || null,
        tool_calls: toolCallsArray
      };

      // Check for escalation
      const escalation = toolCallsArray.find(tc => tc.function.name === 'escalate_to_expert');
      if (escalation) {
        return await handleEscalation({
          escalationCall: escalation,
          conversationMessages,
          assistantMessage: assistantMsg,
          enabledTools: enabledTools,
          config,
          onText,
          onToolCall,
          onToolOutput,
          onSource,
          maxIterations,
          iteration,
          totalPromptTokens,
          totalCompletionTokens,
        });
      }

      // Normal tool calls — add assistant message and results to conversation
      conversationMessages.push(assistantMsg);
      const toolResults = await handleToolCalls(toolCallsArray, config, onToolCall, onSource, onToolOutput);
      if (toolResults) {
        conversationMessages.push(...toolResults);
        continue;
      }
    }

    // Final response
    return {
      content: accumulatedContent,
      stop_reason: finishReason || 'stop',
      usage: { prompt_tokens: totalPromptTokens, completion_tokens: totalCompletionTokens },
      iterations: iteration
    };
  }

  throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`);
}

/**
 * Handle escalation to Anthropic expert model.
 * Converts conversation to Anthropic format and hands off to anthropic.chatCompletionStream().
 */
async function handleEscalation({
  escalationCall,
  conversationMessages,
  assistantMessage,
  enabledTools,
  config,
  onText,
  onToolCall,
  onToolOutput,
  onSource,
  maxIterations,
  iteration,
  totalPromptTokens,
  totalCompletionTokens,
}) {
  // Notify user of escalation
  onText('\n\n');
  if (onToolCall) {
    const args = typeof escalationCall.function.arguments === 'string'
      ? JSON.parse(escalationCall.function.arguments)
      : escalationCall.function.arguments;
    onToolCall({
      name: 'escalate_to_expert',
      arguments: args
    });
  }

  // Add the assistant message (with the escalation tool call) to conversation
  conversationMessages.push(assistantMessage);

  // Add a tool_result for the escalation call — Anthropic requires every
  // tool_use to have a corresponding tool_result in the next message
  conversationMessages.push({
    role: 'tool',
    tool_call_id: escalationCall.id,
    content: 'Escalation accepted. The expert model is now handling this task.'
  });

  // Convert full conversation to Anthropic format
  const { system, messages: anthropicMessages } = convertToAnthropicFormat(conversationMessages);

  // Import Anthropic provider
  const anthropic = await import('./anthropic.js');

  // Remove escalate_to_expert and view_image from tools for Sonnet
  const expertToolNames = enabledTools.filter(
    t => t !== 'escalate_to_expert' && t !== 'view_image'
  );

  const expertModel = config.ANTHROPIC_EXPERT_MODEL || config.anthropic_expert_model || 'claude-sonnet-4-6';

  // Build the messages for Anthropic — inject system as first user message context
  // since anthropic.chatCompletionStream handles system extraction internally
  let messagesForAnthropic = anthropicMessages;
  if (system) {
    // Prepend system as a system message so extractSystemMessages picks it up
    messagesForAnthropic = [
      { role: 'system', content: system },
      ...anthropicMessages
    ];
  }

  const result = await anthropic.chatCompletionStream({
    model: expertModel,
    messages: messagesForAnthropic,
    enabledTools: expertToolNames,
    config: { ...config, ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY || config.anthropic_api_key },
    onText,
    onToolCall,
    onToolOutput,
    onSource,
    maxIterations: maxIterations - iteration,
  });

  return {
    content: result.content,
    stop_reason: result.stop_reason,
    usage: {
      prompt_tokens: totalPromptTokens + (result.usage?.input_tokens || result.usage?.prompt_tokens || 0),
      completion_tokens: totalCompletionTokens + (result.usage?.output_tokens || result.usage?.completion_tokens || 0),
    },
    iterations: iteration + (result.iterations || 1),
    escalated: true,
    escalated_model: expertModel,
  };
}

/**
 * Format tool call for display in OWUI
 */
export function formatToolCallDisplay(toolCall) {
  const params = JSON.stringify(toolCall.arguments, null, 2);
  return `\n\n<details><summary>🔧 Tool: ${toolCall.name}</summary>\n\`\`\`json\n${params}\n\`\`\`\n</details>\n\n`;
}

/**
 * Get available models from llama-server
 */
export async function getToolCapableModels(config) {
  try {
    const client = getLlamaClient(config);
    const models = await client.models.list();
    return models.data?.map(m => m.id) || ['qwen3.6-35b-a3b'];
  } catch {
    return ['qwen3.6-35b-a3b'];
  }
}
