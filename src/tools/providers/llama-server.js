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
import { toOpenAIChatCompletionsTools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { logRequest, logResponse, logMessages } from '../../utils/debug-logger.js';

/**
 * Initialize OpenAI client pointed at llama-server
 */
function getLlamaClient(config) {
  return new OpenAI({
    baseURL: (config.LLAMA_SERVER_URL || 'http://localhost:8080') + '/v1',
    apiKey: 'not-needed'
  });
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
 * Convert OpenAI Chat Completions messages to Anthropic format for escalation.
 *
 * Key mappings:
 * - system messages → extracted as separate system parameter
 * - assistant with tool_calls → assistant with tool_use content blocks
 * - tool role messages → grouped into user messages with tool_result blocks
 * - consecutive same-role messages → merged (Anthropic requires alternating)
 *
 * @param {array} messages - OpenAI CC format messages
 * @returns {{ system: string|null, messages: array }}
 */
function convertToAnthropicFormat(messages) {
  let systemText = null;
  const converted = [];

  for (const msg of messages) {
    // Extract system messages
    if (msg.role === 'system') {
      const text = typeof msg.content === 'string'
        ? msg.content
        : (Array.isArray(msg.content)
          ? msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
          : '');
      systemText = systemText ? `${systemText}\n\n${text}` : text;
      continue;
    }

    // Convert user messages
    if (msg.role === 'user') {
      const content = [];
      if (typeof msg.content === 'string') {
        content.push({ type: 'text', text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text') {
            content.push(block);
          } else if (block.type === 'image_url' && block.image_url?.url) {
            // Convert to Anthropic image format
            const url = block.image_url.url;
            const dataMatch = url.match(/^data:([^;]+);base64,(.+)$/);
            if (dataMatch) {
              content.push({
                type: 'image',
                source: { type: 'base64', media_type: dataMatch[1], data: dataMatch[2] }
              });
            } else {
              // HTTP/HTTPS URL — Anthropic provider will handle fetching if needed
              content.push({
                type: 'image',
                source: { type: 'url', url }
              });
            }
          }
        }
      }
      converted.push({ role: 'user', content });
      continue;
    }

    // Convert assistant messages (may contain tool_calls)
    if (msg.role === 'assistant') {
      const content = [];

      // Add text content
      if (msg.content) {
        const text = typeof msg.content === 'string' ? msg.content : '';
        if (text) {
          content.push({ type: 'text', text });
        }
      }

      // Convert tool_calls to tool_use blocks
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          const input = typeof tc.function.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input
          });
        }
      }

      if (content.length > 0) {
        converted.push({ role: 'assistant', content });
      }
      continue;
    }

    // Convert tool result messages → user message with tool_result blocks
    if (msg.role === 'tool') {
      const toolResult = {
        type: 'tool_result',
        tool_use_id: msg.tool_call_id,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      };

      // Group with previous user message if it already has tool_result blocks
      const last = converted[converted.length - 1];
      if (last && last.role === 'user' && Array.isArray(last.content) &&
          last.content.every(b => b.type === 'tool_result')) {
        last.content.push(toolResult);
      } else {
        converted.push({ role: 'user', content: [toolResult] });
      }
      continue;
    }
  }

  // Merge consecutive same-role messages (Anthropic requires alternating)
  const merged = [];
  for (const msg of converted) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === msg.role) {
      // Merge content arrays
      if (Array.isArray(prev.content) && Array.isArray(msg.content)) {
        prev.content.push(...msg.content);
      } else if (Array.isArray(prev.content)) {
        if (typeof msg.content === 'string') {
          prev.content.push({ type: 'text', text: msg.content });
        }
      } else {
        // Convert prev to array and merge
        const prevContent = typeof prev.content === 'string'
          ? [{ type: 'text', text: prev.content }]
          : [prev.content];
        const msgContent = Array.isArray(msg.content)
          ? msg.content
          : [typeof msg.content === 'string' ? { type: 'text', text: msg.content } : msg.content];
        prev.content = [...prevContent, ...msgContent];
      }
    } else {
      merged.push(msg);
    }
  }

  return { system: systemText, messages: merged };
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

    results.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: executionResult.error
        ? JSON.stringify({ error: executionResult.error })
        : JSON.stringify({ result: executionResult.result, sources: executionResult.sources })
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
      model: config.llm_model || model || 'gpt-oss-20b',
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
      model: config.llm_model || model || 'gpt-oss-20b',
      messages: conversationMessages,
      ...(tools && { tools, tool_choice: 'auto' }),
      stream: true,
      temperature: 1.0,
      top_p: 1.0,
    };

    logMessages(`LLAMA-SERVER STREAM REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('llama-server-stream', streamPayload);

    const stream = await client.chat.completions.create(streamPayload);

    // Accumulate the streamed response
    let accumulatedContent = '';
    const accumulatedToolCalls = new Map(); // id → { id, type, function: { name, arguments } }
    let finishReason = null;
    let streamUsage = null;

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;

      const delta = choice.delta;

      // Stream text content
      if (delta?.content && onText) {
        onText(delta.content);
        accumulatedContent += delta.content;
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
      }

      // Capture usage from the final chunk
      if (chunk.usage) {
        streamUsage = chunk.usage;
      }
    }

    // Accumulate usage
    totalPromptTokens += streamUsage?.prompt_tokens || 0;
    totalCompletionTokens += streamUsage?.completion_tokens || 0;

    const toolCallsArray = [...accumulatedToolCalls.values()];

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
    return models.data?.map(m => m.id) || ['gpt-oss-20b'];
  } catch {
    return ['gpt-oss-20b'];
  }
}
