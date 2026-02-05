/**
 * Ollama Native Tool Calling Provider
 *
 * Handles tool calling using Ollama's hybrid parsing approach with support for:
 * - OpenAI-compatible tool format
 * - Streaming with tool calls
 * - Local model execution
 * - URL-based image handling (SDK fetches images automatically)
 *
 * Note: Only models from https://ollama.com/search?c=tools are supported
 */

import { Ollama } from 'ollama';
import { toOllamaTools } from '../definitions.js';
import { executeToolCall } from '../executor.js';
import { logRequest, logResponse, logMessages } from '../../utils/debug-logger.js';
// Note: Ollama SDK handles image fetching automatically when given URLs

/**
 * Initialize Ollama client
 */
function getOllamaClient(config) {
  return new Ollama({
    host: config.OLLAMA_BASE_URL || 'http://localhost:11434'
  });
}

/**
 * Extract base64 data from a data URL
 * @param {string} dataUrl - Data URL like "data:image/png;base64,..."
 * @returns {string | null} - Just the base64 data, or null if invalid
 */
function extractBase64FromDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : null;
}

/**
 * Convert messages to Ollama format with images array
 *
 * SIMPLIFIED: server.js now handles all image processing:
 * - Strips old images from history
 * - Creates temp compressed proxies with public URLs
 * - Injects image context text with permanent URLs
 *
 * Ollama needs images in a separate 'images' array on the message.
 * This function converts image_url blocks to that format.
 *
 * @param {array} messages - Messages (already processed by server.js)
 * @returns {Promise<array>} - Messages with Ollama-compatible images array
 */
async function convertImagesToOllamaFormat(messages) {
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

    const textParts = [];
    const images = [];

    for (const block of msg.content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      } else if (block.type === 'image_url' && block.image_url?.url) {
        const url = block.image_url.url;

        // Handle base64 data URLs - extract base64 for SDK
        const base64Data = extractBase64FromDataUrl(url);
        if (base64Data) {
          images.push(base64Data);
          console.log(`📤 [OLLAMA] Using base64 image`);
          continue;
        }

        // Handle HTTP URLs - pass directly to SDK (Ollama can fetch URLs)
        if (url.startsWith('http://') || url.startsWith('https://')) {
          images.push(url);
          console.log(`📤 [OLLAMA] Using URL: ${url}`);
        }
      }
    }

    // Build the converted message
    const converted = {
      ...msg,
      content: textParts.join('\n') || ''
    };

    // Only add images array if there are images
    if (images.length > 0) {
      converted.images = images;
    }

    convertedMessages.push(converted);
  }

  return convertedMessages;
}

/**
 * Handle tool calls in Ollama's response
 * @param {object} message - Message with tool_calls
 * @param {object} config - Configuration
 * @param {function} onToolCall - Callback for tool call display
 * @param {function} onSource - Callback for source citations
 * @returns {Promise<array>} - Tool result messages
 */
async function handleToolCalls(message, config, onToolCall, onSource) {
  if (!message.tool_calls || message.tool_calls.length === 0) {
    return null;
  }

  const results = [];

  for (const toolCall of message.tool_calls) {
    // Parse arguments
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

    // Execute the tool
    const executionResult = await executeToolCall(
      toolCall.function.name,
      args,
      config
    );

    // Emit sources for OWUI citation panel
    if (onSource && executionResult.sources && executionResult.sources.length > 0) {
      for (const source of executionResult.sources) {
        onSource(source);
      }
    }

    results.push({
      role: 'tool',
      content: executionResult.error
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
 * Execute chat completion with tool support
 * @param {object} params
 * @param {string} params.model - Ollama model name
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
  onSource,
  maxIterations = 5
}) {
  const ollama = getOllamaClient(config);
  const tools = enabledTools.length > 0 ? toOllamaTools(enabledTools) : null;

  // Convert image_url format to Ollama images array format (fetches HTTP URLs)
  const convertedMessages = await convertImagesToOllamaFormat(messages);

  let iteration = 0;
  let conversationMessages = [...convertedMessages];

  while (iteration < maxIterations) {
    iteration++;

    // Build request payload
    const requestPayload = {
      model,
      messages: conversationMessages,
      ...(tools && { tools }),
      stream: false
    };

    // DEBUG: Log exact request
    logMessages(`OLLAMA REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('ollama', requestPayload);

    // Make API call
    const response = await ollama.chat(requestPayload);

    // DEBUG: Log exact response
    logResponse('ollama', response);

    const message = response.message;

    if (!message) {
      throw new Error('No message in Ollama response');
    }

    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Add assistant's message to conversation
      conversationMessages.push(message);

      // Execute tools
      const toolResults = await handleToolCalls(message, config, onToolCall, onSource);

      if (toolResults) {
        // Add tool results to conversation
        conversationMessages.push(...toolResults);

        // Continue loop to get next response
        continue;
      }
    }

    // Final response - stream the text
    if (onText && message.content) {
      // Simulate streaming for consistency
      const words = message.content.split(' ');
      for (const word of words) {
        onText(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }

    return {
      content: message.content || '',
      done: response.done,
      usage: {
        prompt_tokens: response.prompt_eval_count || 0,
        completion_tokens: response.eval_count || 0
      },
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
  onSource,
  maxIterations = 5
}) {
  const ollama = getOllamaClient(config);
  const tools = enabledTools.length > 0 ? toOllamaTools(enabledTools) : null;

  // Convert image_url format to Ollama images array format (fetches HTTP URLs)
  const convertedMessages = await convertImagesToOllamaFormat(messages);

  let iteration = 0;
  let conversationMessages = [...convertedMessages];

  while (iteration < maxIterations) {
    iteration++;

    // Build request payload
    const streamPayload = {
      model,
      messages: conversationMessages,
      ...(tools && { tools }),
      stream: true
    };

    // DEBUG: Log exact request
    logMessages(`OLLAMA STREAM REQUEST iteration=${iteration}`, conversationMessages);
    logRequest('ollama-stream', streamPayload);

    // Start streaming
    const stream = await ollama.chat(streamPayload);

    let accumulatedMessage = {
      role: 'assistant',
      content: '',
      tool_calls: []
    };
    let streamUsage = null;

    // Process stream
    for await (const chunk of stream) {
      // Handle text content
      if (chunk.message?.content && onText) {
        onText(chunk.message.content);
        accumulatedMessage.content += chunk.message.content;
      }

      // Handle tool calls
      if (chunk.message?.tool_calls) {
        accumulatedMessage.tool_calls.push(...chunk.message.tool_calls);
      }

      // Capture usage from final chunk and break
      if (chunk.done) {
        streamUsage = {
          prompt_tokens: chunk.prompt_eval_count || 0,
          completion_tokens: chunk.eval_count || 0
        };
        // DEBUG: Log final response
        logResponse('ollama-stream', { message: accumulatedMessage, usage: streamUsage, done: true });
        break;
      }
    }

    // Check for tool calls
    if (accumulatedMessage.tool_calls.length > 0) {
      // Add assistant's message to conversation
      conversationMessages.push(accumulatedMessage);

      // Execute tools
      const toolResults = await handleToolCalls(
        accumulatedMessage,
        config,
        onToolCall,
        onSource
      );

      if (toolResults) {
        // Add tool results to conversation
        conversationMessages.push(...toolResults);

        // Continue loop to get next response
        continue;
      }
    }

    // Final response
    return {
      content: accumulatedMessage.content,
      done: true,
      usage: streamUsage,
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

/**
 * Get list of tool-capable models from Ollama
 * @param {object} config - Configuration
 * @returns {Promise<array>} - List of model names with tool support
 */
export async function getToolCapableModels(config) {
  const ollama = getOllamaClient(config);

  try {
    const modelList = await ollama.list();
    const allModels = modelList.models?.map(m => m.name) || [];

    // Known tool-capable model families
    const toolCapableFamilies = [
      'llama3.1', 'llama3.2', 'llama4',
      'qwen2.5', 'qwen3',
      'mistral-nemo', 'ministral',
      'devstral',
      'command-r', 'command-r-plus',
      'nexusraven',
      'functiongemma',
      'gpt-oss'
    ];

    // Filter models that match known tool-capable families
    return allModels.filter(name =>
      toolCapableFamilies.some(family =>
        name.toLowerCase().startsWith(family.toLowerCase())
      )
    );
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
}
