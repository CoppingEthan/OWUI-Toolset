/**
 * Anthropic Claude Native Tool Calling Provider
 *
 * Handles tool calling using Claude's native content block system with support for:
 * - Mixed text + tool responses (unique to Anthropic)
 * - Parallel tool calls
 * - Streaming with tool calls
 * - Proper tool result formatting
 */

import Anthropic from '@anthropic-ai/sdk';
import { toAnthropicTools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { logRequest, logResponse, logMessages, logError } from '../../utils/debug-logger.js';

/**
 * Initialize Anthropic client
 */
function getAnthropicClient(config) {
  return new Anthropic({
    apiKey: config.ANTHROPIC_API_KEY
  });
}

/**
 * Parse a base64 data URL into components
 * @param {string} dataUrl - Data URL like "data:image/png;base64,..."
 * @returns {{ mediaType: string, data: string } | null}
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

/**
 * Convert OpenAI-format image_url blocks to Anthropic image format
 *
 * SIMPLIFIED: server.js now handles all image processing:
 * - Strips old images from history
 * - Creates temp compressed proxies with public URLs
 * - Injects image context text with permanent URLs
 *
 * This function just converts the format for Anthropic's API.
 *
 * @param {array} messages - Messages (already processed by server.js)
 * @returns {Promise<array>} - Messages with Anthropic-compatible image blocks
 */
async function convertImagesToAnthropicFormat(messages) {
  const convertedMessages = [];

  for (const msg of messages) {
    // String content - pass through
    if (typeof msg.content === 'string') {
      convertedMessages.push(msg);
      continue;
    }

    // Not an array - pass through
    if (!Array.isArray(msg.content)) {
      convertedMessages.push(msg);
      continue;
    }

    const convertedContent = [];

    for (const block of msg.content) {
      // Text blocks - pass through
      if (block.type === 'text') {
        convertedContent.push(block);
        continue;
      }

      // Already Anthropic format - pass through
      if (block.type === 'image') {
        convertedContent.push(block);
        continue;
      }

      // Convert OpenAI image_url format to Anthropic image format
      if (block.type === 'image_url' && block.image_url?.url) {
        const url = block.image_url.url;

        // Handle base64 data URLs (shouldn't happen often now, but handle just in case)
        const parsed = parseDataUrl(url);
        if (parsed) {
          convertedContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: parsed.mediaType,
              data: parsed.data
            }
          });
          console.log(`📤 [ANTHROPIC] Converted base64 image`);
          continue;
        }

        // HTTPS URLs - use URL reference (Anthropic only accepts HTTPS)
        if (url.startsWith('https://')) {
          convertedContent.push({
            type: 'image',
            source: {
              type: 'url',
              url: url
            }
          });
          console.log(`📤 [ANTHROPIC] Using URL reference: ${url}`);
          continue;
        }

        // HTTP URLs (local/internal) - fetch and send as base64 (Anthropic rejects HTTP)
        if (url.startsWith('http://')) {
          try {
            const resp = await fetch(url);
            const arrayBuf = await resp.arrayBuffer();
            const base64 = Buffer.from(arrayBuf).toString('base64');
            const contentType = resp.headers.get('content-type') || 'image/jpeg';
            convertedContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: contentType,
                data: base64
              }
            });
            console.log(`📤 [ANTHROPIC] Fetched HTTP image and converted to base64: ${url}`);
          } catch (err) {
            console.error(`❌ [ANTHROPIC] Failed to fetch HTTP image ${url}:`, err.message);
          }
          continue;
        }
      }

      // Keep unknown blocks as-is
      convertedContent.push(block);
    }

    convertedMessages.push({ ...msg, content: convertedContent });
  }

  return convertedMessages;
}

/**
 * Add cache_control to messages for Anthropic prompt caching
 * Adds ephemeral cache control to:
 * - System messages (first message with role 'system' or long first user message)
 * - Large content blocks (>1000 chars) to enable caching
 *
 * Note: Anthropic requires minimum 2048 tokens for caching to activate,
 * but we add the markers anyway - they're ignored if below threshold.
 *
 * @param {array} messages - Original messages array
 * @returns {array} - Messages with cache_control added
 */
function addCacheControl(messages) {
  if (!messages || messages.length === 0) return messages;

  return messages.map((msg, index) => {
    // Only process the first message (usually contains system prompt or context)
    // and only if it's substantial enough to benefit from caching
    if (index === 0) {
      // If content is a string, convert to content block format with cache_control
      if (typeof msg.content === 'string' && msg.content.length > 500) {
        return {
          ...msg,
          content: [
            {
              type: 'text',
              text: msg.content,
              cache_control: { type: 'ephemeral' }
            }
          ]
        };
      }

      // If content is already an array, add cache_control to the last text block
      if (Array.isArray(msg.content) && msg.content.length > 0) {
        const updatedContent = msg.content.map((block, blockIndex) => {
          // Add cache_control to the last text block
          if (blockIndex === msg.content.length - 1 && block.type === 'text') {
            return {
              ...block,
              cache_control: { type: 'ephemeral' }
            };
          }
          return block;
        });
        return { ...msg, content: updatedContent };
      }
    }

    return msg;
  });
}

/**
 * Add cache_control to tools array for Anthropic prompt caching
 * Adds ephemeral cache control to the last tool definition
 *
 * @param {array} tools - Original tools array
 * @returns {array} - Tools with cache_control added to last tool
 */
function addToolsCacheControl(tools) {
  if (!tools || tools.length === 0) return tools;

  return tools.map((tool, index) => {
    // Add cache_control to the last tool
    if (index === tools.length - 1) {
      return {
        ...tool,
        cache_control: { type: 'ephemeral' }
      };
    }
    return tool;
  });
}

/**
 * Move the cache breakpoint to the last message in conversationMessages.
 * Removes any existing cache_control from message content blocks, then
 * adds cache_control to the last content block of the last message.
 * This ensures iterations 2+ get cache hits on previous conversation turns.
 *
 * @param {array} messages - The conversationMessages array (mutated in place)
 */
function refreshCacheBreakpoint(messages) {
  if (messages.length === 0) return;

  // Remove cache_control from all messages except the first one
  // (first message breakpoint is set by addCacheControl and should stay)
  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        delete block.cache_control;
      }
    }
  }

  // Add cache_control to the last content block of the last message
  const lastMsg = messages[messages.length - 1];
  if (Array.isArray(lastMsg.content) && lastMsg.content.length > 0) {
    lastMsg.content[lastMsg.content.length - 1].cache_control = { type: 'ephemeral' };
  } else if (typeof lastMsg.content === 'string' && lastMsg.content.length > 500) {
    // Convert string to content block format to attach cache_control
    lastMsg.content = [{ type: 'text', text: lastMsg.content, cache_control: { type: 'ephemeral' } }];
  }
}

/**
 * Handle tool calls in Claude's response
 * @param {object} response - Claude API response
 * @param {object} config - Configuration with API keys
 * @param {function} onToolCall - Callback for tool call display
 * @param {function} onSource - Callback for source citations
 * @returns {Promise<object>} - Tool execution results
 */
async function handleToolCalls(response, config, onToolCall, onSource, onToolOutput) {
  const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

  if (toolUseBlocks.length === 0) {
    return null;
  }

  const results = [];

  for (const toolUse of toolUseBlocks) {
    // Display tool call to user
    if (onToolCall) {
      onToolCall({
        type: 'tool_use',
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input
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
      toolUse.name,
      toolUse.input,
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
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: executionResult.error
        ? JSON.stringify({ error: executionResult.error })
        : JSON.stringify({
            result: executionResult.result,
            sources: executionResult.sources
          }),
      is_error: !!executionResult.error
    });
  }

  return results;
}

/**
 * Extract system messages and format for Anthropic API
 * Anthropic requires system as a separate parameter, not in messages array
 *
 * @param {array} messages - Original messages (may contain role='system')
 * @returns {object} - { system, messages } where messages has no system role
 */
function extractSystemMessages(messages) {
  const systemMessages = messages.filter(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  // Combine all system messages into one
  let systemPrompt = null;
  if (systemMessages.length > 0) {
    const text = systemMessages.map(m => {
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)) {
        return m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      }
      return '';
    }).join('\n\n');

    // Use array format with cache_control for long system prompts
    if (text.length > 500) {
      systemPrompt = [{ type: 'text', text, cache_control: { type: 'ephemeral' } }];
    } else {
      systemPrompt = text;
    }
  }

  return { system: systemPrompt, messages: otherMessages };
}

/**
 * Execute chat completion with tool support
 * @param {object} params
 * @param {string} params.model - Claude model name
 * @param {array} params.messages - Message history
 * @param {array} params.enabledTools - Array of tool names to enable
 * @param {object} params.config - Configuration
 * @param {function} params.onText - Callback for text streaming
 * @param {function} params.onToolCall - Callback for tool call display
 * @param {function} params.onSource - Callback for source citations
 * @param {number} params.maxIterations - Max tool execution iterations
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
  maxIterations = 5
}) {
  const anthropic = getAnthropicClient(config);
  const rawTools = enabledTools.length > 0 ? toAnthropicTools(enabledTools) : null;
  const tools = rawTools ? addToolsCacheControl(rawTools) : null;

  // Extract system messages for Anthropic's separate system parameter
  const { system, messages: filteredMessages } = extractSystemMessages(messages);

  // Convert image_url format to Anthropic image format
  // server.js already processed images - just convert format
  const convertedMessages = await convertImagesToAnthropicFormat(filteredMessages);

  let iteration = 0;
  // Add cache_control to initial messages for prompt caching
  let conversationMessages = addCacheControl([...convertedMessages]);

  // Accumulate usage across all tool loop iterations (each API call is billed)
  const totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0
  };

  while (iteration < maxIterations) {
    iteration++;

    // On iterations 2+, refresh cache breakpoint so previous turns get cached
    if (iteration > 1) {
      refreshCacheBreakpoint(conversationMessages);
    }

    // Build request payload
    const requestPayload = {
      model,
      max_tokens: config.ANTHROPIC_MAX_TOKENS || 4096,
      ...(system && { system }),
      messages: conversationMessages,
      ...(tools && { tools })
    };

    // DEBUG: Log exact request
    logMessages(`ANTHROPIC REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('anthropic', requestPayload);

    // Make API call
    const response = await anthropic.messages.create(requestPayload);

    // DEBUG: Log exact response
    logResponse('anthropic', response);

    // Accumulate usage from this iteration
    if (response.usage) {
      totalUsage.input_tokens += response.usage.input_tokens || 0;
      totalUsage.output_tokens += response.usage.output_tokens || 0;
      totalUsage.cache_creation_input_tokens += response.usage.cache_creation_input_tokens || 0;
      totalUsage.cache_read_input_tokens += response.usage.cache_read_input_tokens || 0;
    }

    // Send text content blocks to user (no artificial delay)
    const textBlocks = response.content.filter(b => b.type === 'text');
    for (const block of textBlocks) {
      if (onText && block.text) {
        onText(block.text);
      }
    }

    // Check for tool use
    if (response.stop_reason === 'tool_use') {
      // Add assistant's response to conversation
      conversationMessages.push({
        role: 'assistant',
        content: response.content
      });

      // Execute tools
      const toolResults = await handleToolCalls(response, config, onToolCall, onSource, onToolOutput);

      if (toolResults) {
        // Add tool results as user message
        conversationMessages.push({
          role: 'user',
          content: toolResults
        });

        // Continue loop to get next response
        continue;
      }
    }

    // Final response - no more tool calls
    return {
      content: textBlocks.map(b => b.text).join('\n'),
      stop_reason: response.stop_reason,
      usage: totalUsage,
      iterations: iteration
    };
  }

  throw new Error(`Tool execution loop exceeded ${maxIterations} iterations`);
}

/**
 * Execute chat completion with streaming support
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
  maxIterations = 5
}) {
  const anthropic = getAnthropicClient(config);
  const rawTools = enabledTools.length > 0 ? toAnthropicTools(enabledTools) : null;
  const tools = rawTools ? addToolsCacheControl(rawTools) : null;

  // Extract system messages for Anthropic's separate system parameter
  const { system, messages: filteredMessages } = extractSystemMessages(messages);

  // Convert image_url format to Anthropic image format
  // server.js already processed images - just convert format
  const convertedMessages = await convertImagesToAnthropicFormat(filteredMessages);

  let iteration = 0;
  // Add cache_control to initial messages for prompt caching
  let conversationMessages = addCacheControl([...convertedMessages]);

  // Accumulate usage across all tool loop iterations (each API call is billed)
  const totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0
  };

  while (iteration < maxIterations) {
    iteration++;

    // On iterations 2+, refresh cache breakpoint so previous turns get cached
    if (iteration > 1) {
      refreshCacheBreakpoint(conversationMessages);
    }

    // Build request payload
    const streamPayload = {
      model,
      max_tokens: config.ANTHROPIC_MAX_TOKENS || 4096,
      ...(system && { system }),
      messages: conversationMessages,
      ...(tools && { tools })
    };

    // DEBUG: Log exact request
    logMessages(`ANTHROPIC STREAM REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('anthropic-stream', streamPayload);

    // Start streaming
    const stream = await anthropic.messages.stream(streamPayload);

    let currentResponse = {
      content: [],
      stop_reason: null,
      usage: null
    };

    // Handle stream events
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta' && onText) {
          onText(event.delta.text);
        }
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use' && onToolCall) {
          // Tool use block started - we'll get the full data later
          currentResponse.content.push(event.content_block);
        } else if (event.content_block.type === 'text') {
          currentResponse.content.push(event.content_block);
        }
      } else if (event.type === 'message_delta') {
        currentResponse.stop_reason = event.delta.stop_reason;
      } else if (event.type === 'message_stop') {
        currentResponse.usage = event.usage;
      }
    }

    // Get final message - this contains the full usage data including cache tokens
    const finalMessage = await stream.finalMessage();
    currentResponse.content = finalMessage.content;
    currentResponse.usage = finalMessage.usage;

    // Accumulate usage from this iteration
    if (currentResponse.usage) {
      totalUsage.input_tokens += currentResponse.usage.input_tokens || 0;
      totalUsage.output_tokens += currentResponse.usage.output_tokens || 0;
      totalUsage.cache_creation_input_tokens += currentResponse.usage.cache_creation_input_tokens || 0;
      totalUsage.cache_read_input_tokens += currentResponse.usage.cache_read_input_tokens || 0;
    }

    // DEBUG: Log exact response
    logResponse('anthropic-stream', finalMessage);

    // Check for tool use
    if (currentResponse.stop_reason === 'tool_use') {
      // Add assistant's response to conversation
      conversationMessages.push({
        role: 'assistant',
        content: currentResponse.content
      });

      // Execute tools
      const toolResults = await handleToolCalls(
        { content: currentResponse.content },
        config,
        onToolCall,
        onSource,
        onToolOutput
      );

      if (toolResults) {
        // Add tool results as user message
        conversationMessages.push({
          role: 'user',
          content: toolResults
        });

        // Continue loop to get next response
        continue;
      }
    }

    // Final response
    const textBlocks = currentResponse.content.filter(b => b.type === 'text');
    return {
      content: textBlocks.map(b => b.text).join('\n'),
      stop_reason: currentResponse.stop_reason,
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
  const params = JSON.stringify(toolCall.input, null, 2);
  return `\n\n<details><summary>🔧 Tool: ${toolCall.name}</summary>\n\`\`\`json\n${params}\n\`\`\`\n</details>\n\n`;
}
