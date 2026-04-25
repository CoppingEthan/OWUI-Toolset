/**
 * OpenAI provider (Responses API).
 *
 * Implements streamChat against the Responses API with:
 *   - native function tool calling (multi-round, chained via previous_response_id)
 *   - streaming text deltas
 *   - image_url passthrough
 *   - optional strict-schema tool mode
 */

import OpenAI from 'openai';
import { toOpenAITools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { curateOldToolResults } from '../../api/context-curator.js';
import { logRequest, logResponse, logMessages } from '../../utils/debug-logger.js';

function getClient(config) {
  return new OpenAI({ apiKey: config.OPENAI_API_KEY });
}

/**
 * Convert canonical messages → Responses API input items.
 */
function toResponsesInput(messages) {
  const input = [];
  for (const msg of messages) {
    if (msg.role === 'system') {
      input.push({
        type: 'message', role: 'system',
        content: typeof msg.content === 'string'
          ? msg.content
          : msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n'),
      });
    } else if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        input.push({ type: 'message', role: 'user', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const contentItems = [];
        for (const block of msg.content) {
          if (block.type === 'text') {
            contentItems.push({ type: 'input_text', text: block.text });
          } else if (block.type === 'image_url') {
            contentItems.push({
              type: 'input_image',
              image_url: block.image_url.url,
              detail: block.image_url.detail || 'auto',
            });
          }
        }
        input.push({ type: 'message', role: 'user', content: contentItems });
      }
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        if (msg.content) input.push({ type: 'message', role: 'assistant', content: msg.content });
        for (const tc of msg.tool_calls) {
          input.push({
            type: 'function_call',
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          });
        }
      } else {
        input.push({
          type: 'message', role: 'assistant',
          content: typeof msg.content === 'string'
            ? msg.content
            : msg.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || '',
        });
      }
    } else if (msg.role === 'tool') {
      input.push({ type: 'function_call_output', call_id: msg.tool_call_id, output: msg.content });
    }
  }
  return input;
}

async function runTools(toolCalls, config, { onToolCall, onToolResult, onToolOutput, onSource }) {
  const results = [];
  for (const tc of toolCalls) {
    const args = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments;

    if (onToolCall) {
      onToolCall({ type: 'tool_call', call_id: tc.call_id, name: tc.name, arguments: args });
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
    const exec = await executeToolCall(tc.name, args, config, toolCallbacks);
    const execMs = Date.now() - t0;
    if (outputStarted) onToolOutput('```\n\n');

    if (onSource && exec.sources && exec.sources.length > 0) {
      for (const source of exec.sources) onSource(source);
    }

    if (onToolResult) {
      onToolResult({
        name: tc.name,
        result: exec.result,
        error: exec.error,
        execution_time_ms: execMs,
      });
    }

    results.push({
      type: 'function_call_output',
      call_id: tc.call_id,
      output: exec.error
        ? JSON.stringify({ error: exec.error })
        : JSON.stringify({ result: exec.result, sources: exec.sources }),
    });
  }
  return results;
}

export async function streamChat({
  model,
  messages,
  enabledTools = [],
  config,
  maxIterations = 5,
  strictMode = false,
  curatorConfig = null,
  onText,
  onToolCall,
  onToolResult,
  onToolOutput,
  onSource,
  onCurationEvent,
}) {
  const client = getClient(config);
  const tools = enabledTools.length > 0 ? toOpenAITools(enabledTools, { strict: strictMode }) : null;

  // Maintain the full input history locally so the context curator can
  // manage it. Don't use previous_response_id chaining — it keeps state
  // server-side where we can't curate.
  let input = toResponsesInput(messages);

  const totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    prompt_tokens_details: { cached_tokens: 0 },
    completion_tokens_details: { reasoning_tokens: 0 },
  };

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const options = {
      model,
      input,
      reasoning: { effort: 'none' },
      text: { verbosity: 'medium' },
      ...(tools && { tools, tool_choice: 'auto' }),
      ...(strictMode && { parallel_tool_calls: false }),
      stream: true,
    };

    logMessages(`OPENAI iteration=${iteration}`, messages);
    logRequest('openai-stream', options);

    const stream = await client.responses.create(options);

    let accumulatedText = '';
    const toolCalls = [];
    let currentToolCall = null;
    let streamUsage = null;
    let assistantTextItem = null; // captured to append to history

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        if (event.delta && onText) { onText(event.delta); accumulatedText += event.delta; }
      } else if (event.type === 'response.function_call_arguments.delta') {
        if (currentToolCall && event.delta) currentToolCall.arguments += event.delta;
      } else if (event.type === 'response.output_item.added') {
        if (event.item?.type === 'function_call') {
          currentToolCall = { call_id: event.item.call_id, name: event.item.name, arguments: '' };
        }
      } else if (event.type === 'response.output_item.done') {
        if (event.item?.type === 'function_call') {
          toolCalls.push({
            call_id: event.item.call_id,
            name: event.item.name,
            arguments: event.item.arguments,
          });
          currentToolCall = null;
        } else if (event.item?.type === 'message' && event.item.role === 'assistant') {
          // Capture the assistant's text item for history.
          assistantTextItem = event.item;
        }
      } else if (event.type === 'response.completed') {
        if (event.response?.usage) streamUsage = event.response.usage;
        logResponse('openai-stream', event.response);
      }
    }

    if (streamUsage) {
      totalUsage.input_tokens += streamUsage.input_tokens || 0;
      totalUsage.output_tokens += streamUsage.output_tokens || 0;
      if (streamUsage.input_tokens_details?.cached_tokens) {
        totalUsage.prompt_tokens_details.cached_tokens += streamUsage.input_tokens_details.cached_tokens;
      }
      if (streamUsage.output_tokens_details?.reasoning_tokens) {
        totalUsage.completion_tokens_details.reasoning_tokens += streamUsage.output_tokens_details.reasoning_tokens;
      }
    }

    if (toolCalls.length > 0) {
      // Append assistant's text (if any) and the function_call items to history.
      if (assistantTextItem) input.push(assistantTextItem);
      for (const tc of toolCalls) {
        input.push({ type: 'function_call', call_id: tc.call_id, name: tc.name, arguments: tc.arguments });
      }
      const toolResults = await runTools(toolCalls, config, { onToolCall, onToolResult, onToolOutput, onSource });
      input.push(...toolResults);

      // Curate older tool results if accumulated context exceeds threshold.
      if (curatorConfig) {
        const { events } = await curateOldToolResults(input, curatorConfig, { iteration });
        if (events.length > 0 && onCurationEvent) {
          for (const ev of events) onCurationEvent(ev);
        }
      }
      continue;
    }

    return {
      content: accumulatedText,
      stop_reason: 'stop',
      usage: totalUsage,
      iterations: iteration,
    };
  }

  throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`);
}
