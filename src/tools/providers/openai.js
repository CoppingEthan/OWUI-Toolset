/**
 * OpenAI Responses API Provider
 *
 * Handles tool calling using OpenAI's Responses API with support for:
 * - Parallel tool calls
 * - Streaming with tool calls
 * - Reasoning effort and verbosity control for token efficiency
 * - Consistent image handling (fetch + compress like other providers)
 *
 * Note: Uses Responses API instead of Chat Completions for:
 * - Better CoT (chain of thought) handling between turns
 * - Improved intelligence and fewer reasoning tokens
 * - Higher cache hit rates and lower latency
 */

import OpenAI from 'openai';
import { toOpenAITools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { logRequest, logResponse, logMessages } from '../../utils/debug-logger.js';

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(config) {
  return new OpenAI({
    apiKey: config.OPENAI_API_KEY
  });
}

/**
 * Process messages for OpenAI API format
 *
 * SIMPLIFIED: server.js now handles all image processing:
 * - Strips old images from history
 * - Creates temp compressed proxies with public URLs
 * - Injects image context text with permanent URLs
 *
 * OpenAI format is already what server.js produces, so this mostly passes through.
 * Just logs for debugging.
 *
 * @param {array} messages - Messages (already processed by server.js)
 * @returns {Promise<array>} - Messages ready for OpenAI API
 */
async function processMessagesForOpenAI(messages) {
  const processedMessages = [];

  for (const msg of messages) {
    // String content - pass through
    if (typeof msg.content === 'string') {
      processedMessages.push(msg);
      continue;
    }

    // Not an array - pass through
    if (!Array.isArray(msg.content)) {
      processedMessages.push(msg);
      continue;
    }

    // Check for image_url blocks and log
    for (const block of msg.content) {
      if (block.type === 'image_url' && block.image_url?.url) {
        const url = block.image_url.url;
        if (url.startsWith('http')) {
          console.log(`📤 [OPENAI] Using URL: ${url}`);
        } else if (url.startsWith('data:')) {
          console.log(`📤 [OPENAI] Using base64 image`);
        }
      }
    }

    // Pass through as-is (already in correct format)
    processedMessages.push(msg);
  }

  return processedMessages;
}

/**
 * Convert messages array to Responses API input format
 * The Responses API uses an array of input items with different structure than Chat Completions
 *
 * @param {array} messages - Chat Completions format messages
 * @returns {array} - Responses API input items
 */
function convertMessagesToResponsesInput(messages) {
  const input = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      // System messages become system input items
      input.push({
        type: 'message',
        role: 'system',
        content: typeof msg.content === 'string' ? msg.content :
          msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
      });
    } else if (msg.role === 'user') {
      // User messages with mixed content
      if (typeof msg.content === 'string') {
        input.push({
          type: 'message',
          role: 'user',
          content: msg.content
        });
      } else if (Array.isArray(msg.content)) {
        // Convert content blocks to Responses API format
        const contentItems = [];
        for (const block of msg.content) {
          if (block.type === 'text') {
            contentItems.push({
              type: 'input_text',
              text: block.text
            });
          } else if (block.type === 'image_url') {
            contentItems.push({
              type: 'input_image',
              image_url: block.image_url.url,
              detail: block.image_url.detail || 'auto'
            });
          }
        }
        input.push({
          type: 'message',
          role: 'user',
          content: contentItems
        });
      }
    } else if (msg.role === 'assistant') {
      // Assistant messages - check for tool calls
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Add the assistant message with content if any
        if (msg.content) {
          input.push({
            type: 'message',
            role: 'assistant',
            content: msg.content
          });
        }
        // Add tool calls as function_call items
        for (const toolCall of msg.tool_calls) {
          input.push({
            type: 'function_call',
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          });
        }
      } else {
        input.push({
          type: 'message',
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content :
            msg.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || ''
        });
      }
    } else if (msg.role === 'tool') {
      // Tool results
      input.push({
        type: 'function_call_output',
        call_id: msg.tool_call_id,
        output: msg.content
      });
    }
  }

  return input;
}

/**
 * Handle tool calls in OpenAI's Responses API response
 * @param {array} toolCalls - Array of function_call items from response (with call_id)
 * @param {object} config - Configuration with API keys
 * @param {function} onToolCall - Callback for tool call display
 * @param {function} onSource - Callback for source citations
 * @returns {Promise<array>} - Tool result items for input (function_call_output format)
 */
async function handleToolCalls(toolCalls, config, onToolCall, onSource, onToolOutput) {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const results = [];

  for (const toolCall of toolCalls) {
    // Parse arguments
    const args = typeof toolCall.arguments === 'string'
      ? JSON.parse(toolCall.arguments)
      : toolCall.arguments;

    // Display tool call to user (use call_id from Responses API)
    if (onToolCall) {
      onToolCall({
        type: 'tool_call',
        call_id: toolCall.call_id,
        name: toolCall.name,
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
      toolCall.name,
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

    // Return function_call_output format for Responses API
    results.push({
      type: 'function_call_output',
      call_id: toolCall.call_id,
      output: executionResult.error
        ? JSON.stringify({ error: executionResult.error })
        : JSON.stringify({
            result: executionResult.result,
            sources: executionResult.sources
          })
    });
  }

  return results;
}

/**
 * Extract text content and tool calls from Responses API output
 * @param {array} output - Response output array
 * @returns {{ text: string, toolCalls: array }}
 */
function parseResponseOutput(output) {
  let text = '';
  const toolCalls = [];

  for (const item of output) {
    if (item.type === 'message' && item.content) {
      // Handle message content
      if (typeof item.content === 'string') {
        text += item.content;
      } else if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (block.type === 'output_text' || block.type === 'text') {
            text += block.text;
          }
        }
      }
    } else if (item.type === 'function_call') {
      // ResponseFunctionToolCall format: call_id is the ID to use for results
      toolCalls.push({
        call_id: item.call_id,
        name: item.name,
        arguments: item.arguments
      });
    }
  }

  return { text, toolCalls };
}

/**
 * Execute response with tool support using Responses API
 * @param {object} params
 * @param {string} params.model - OpenAI model name
 * @param {array} params.messages - Message history
 * @param {array} params.enabledTools - Array of tool names to enable
 * @param {object} params.config - Configuration
 * @param {function} params.onText - Callback for text streaming
 * @param {function} params.onToolCall - Callback for tool call display
 * @param {function} params.onSource - Callback for source citations
 * @param {number} params.maxIterations - Max tool execution iterations
 * @param {boolean} params.strictMode - Use strict schema validation
 * @returns {Promise<object>} - Final response
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
  maxIterations = 5,
  strictMode = false
}) {
  const openai = getOpenAIClient(config);
  const tools = enabledTools.length > 0
    ? toOpenAITools(enabledTools, { strict: strictMode })
    : null;

  // Process messages for OpenAI format
  // server.js already processed images - just pass through
  const processedMessages = await processMessagesForOpenAI(messages);

  // Convert to Responses API input format
  let input = convertMessagesToResponsesInput(processedMessages);

  let iteration = 0;
  let previousResponseId = null;
  let totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    // Responses API detailed token breakdown
    prompt_tokens_details: { cached_tokens: 0 },
    completion_tokens_details: { reasoning_tokens: 0 }
  };

  while (iteration < maxIterations) {
    iteration++;

    // Build request options
    const requestOptions = {
      model,
      input,
      // Token efficiency settings
      reasoning: { effort: 'none' },  // No reasoning overhead for tool calling
      text: { verbosity: 'medium' },
      ...(tools && { tools }),
      ...(tools && { tool_choice: 'auto' }),
      ...(strictMode && { parallel_tool_calls: false }),
      ...(previousResponseId && { previous_response_id: previousResponseId })
    };

    // DEBUG: Log exact request
    logMessages(`OPENAI REQUEST iteration=${iteration}`, processedMessages);
    logRequest('openai', requestOptions);

    // Make API call using Responses API
    const response = await openai.responses.create(requestOptions);

    // DEBUG: Log exact response
    logResponse('openai', response);

    // Track response ID for chaining
    previousResponseId = response.id;

    // Accumulate usage (Responses API format)
    if (response.usage) {
      totalUsage.input_tokens += response.usage.input_tokens || 0;
      totalUsage.output_tokens += response.usage.output_tokens || 0;
      // Detailed breakdown
      if (response.usage.input_tokens_details?.cached_tokens) {
        totalUsage.prompt_tokens_details.cached_tokens += response.usage.input_tokens_details.cached_tokens;
      }
      if (response.usage.output_tokens_details?.reasoning_tokens) {
        totalUsage.completion_tokens_details.reasoning_tokens += response.usage.output_tokens_details.reasoning_tokens;
      }
    }

    // Parse response output
    const { text, toolCalls } = parseResponseOutput(response.output);

    // Check for tool calls
    if (toolCalls.length > 0) {
      // Execute tools
      const toolResults = await handleToolCalls(toolCalls, config, onToolCall, onSource, onToolOutput);

      if (toolResults) {
        // For next iteration, only send tool results (use previous_response_id for context)
        input = toolResults;
        continue;
      }
    }

    // Final response - send all text at once (no artificial delay)
    if (onText && text) {
      onText(text);
    }

    return {
      content: text,
      finish_reason: response.status === 'completed' ? 'stop' : response.status,
      usage: totalUsage,
      iterations: iteration
    };
  }

  throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`);
}

/**
 * Execute response with streaming support using Responses API
 * @param {object} params - Same as chatCompletion
 * @returns {Promise<object>} - Final response
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
  maxIterations = 5,
  strictMode = false
}) {
  const openai = getOpenAIClient(config);
  const tools = enabledTools.length > 0
    ? toOpenAITools(enabledTools, { strict: strictMode })
    : null;

  // Process messages for OpenAI format
  // server.js already processed images - just pass through
  const processedMessages = await processMessagesForOpenAI(messages);

  // Convert to Responses API input format
  let input = convertMessagesToResponsesInput(processedMessages);

  let iteration = 0;
  let previousResponseId = null;
  let totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    // Responses API detailed token breakdown
    prompt_tokens_details: { cached_tokens: 0 },
    completion_tokens_details: { reasoning_tokens: 0 }
  };

  while (iteration < maxIterations) {
    iteration++;

    // Build request options
    const requestOptions = {
      model,
      input,
      // Token efficiency settings
      reasoning: { effort: 'none' },  // No reasoning overhead for tool calling
      text: { verbosity: 'medium' },
      ...(tools && { tools }),
      ...(tools && { tool_choice: 'auto' }),
      ...(strictMode && { parallel_tool_calls: false }),
      ...(previousResponseId && { previous_response_id: previousResponseId }),
      stream: true
    };

    // DEBUG: Log exact request
    logMessages(`OPENAI STREAM REQUEST iteration=${iteration}`, processedMessages);
    logRequest('openai-stream', requestOptions);

    // Start streaming with Responses API
    const stream = await openai.responses.create(requestOptions);

    let accumulatedText = '';
    const toolCalls = [];
    let currentToolCall = null;
    let responseId = null;
    let streamUsage = null;

    // Process stream events
    // Event types: https://platform.openai.com/docs/api-reference/responses-streaming
    for await (const event of stream) {
      // Track response ID
      if (event.response?.id) {
        responseId = event.response.id;
      }

      // Handle different event types
      if (event.type === 'response.output_text.delta') {
        // Stream text content
        if (event.delta && onText) {
          onText(event.delta);
          accumulatedText += event.delta;
        }
      } else if (event.type === 'response.function_call_arguments.delta') {
        // Accumulate function call arguments (correct event name)
        if (currentToolCall && event.delta) {
          currentToolCall.arguments += event.delta;
        }
      } else if (event.type === 'response.output_item.added') {
        // New output item started
        if (event.item?.type === 'function_call') {
          currentToolCall = {
            call_id: event.item.call_id,
            name: event.item.name,
            arguments: ''
          };
        }
      } else if (event.type === 'response.output_item.done') {
        // Output item completed
        if (event.item?.type === 'function_call') {
          toolCalls.push({
            call_id: event.item.call_id,
            name: event.item.name,
            arguments: event.item.arguments
          });
          currentToolCall = null;
        }
      } else if (event.type === 'response.completed') {
        // Response completed - capture usage (correct event name)
        if (event.response?.usage) {
          streamUsage = event.response.usage;
        }
        if (event.response?.id) {
          responseId = event.response.id;
        }
        // DEBUG: Log final response
        logResponse('openai-stream', event.response);
      }
    }

    // Update tracking
    previousResponseId = responseId;
    if (streamUsage) {
      totalUsage.input_tokens += streamUsage.input_tokens || 0;
      totalUsage.output_tokens += streamUsage.output_tokens || 0;
      // Detailed breakdown
      if (streamUsage.input_tokens_details?.cached_tokens) {
        totalUsage.prompt_tokens_details.cached_tokens += streamUsage.input_tokens_details.cached_tokens;
      }
      if (streamUsage.output_tokens_details?.reasoning_tokens) {
        totalUsage.completion_tokens_details.reasoning_tokens += streamUsage.output_tokens_details.reasoning_tokens;
      }
    }

    // Check for tool calls
    if (toolCalls.length > 0) {
      // Execute tools
      const toolResults = await handleToolCalls(toolCalls, config, onToolCall, onSource, onToolOutput);

      if (toolResults) {
        // For next iteration, only send tool results (use previous_response_id for context)
        input = toolResults;
        continue;
      }
    }

    // Final response
    return {
      content: accumulatedText,
      finish_reason: 'stop',
      usage: totalUsage,
      iterations: iteration
    };
  }

  throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`);
}

/**
 * Format tool call for display in OWUI
 * @param {object} toolCall - Tool call object
 * @returns {string} - Formatted HTML
 */
export function formatToolCallDisplay(toolCall) {
  const params = JSON.stringify(toolCall.arguments, null, 2);
  return `\n\n<details><summary>🔧 Tool: ${toolCall.name}</summary>\n\`\`\`json\n${params}\n\`\`\`\n</details>\n\n`;
}
