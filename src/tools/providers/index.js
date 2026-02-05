/**
 * Unified Provider Router
 *
 * Provides a consistent interface for tool calling across all providers.
 * Automatically routes to the appropriate provider based on configuration.
 */

import * as openai from './openai.js';
import * as anthropic from './anthropic.js';
import * as ollama from './ollama.js';

/**
 * Detect provider from model name or config
 * @param {string} model - Model name
 * @param {object} config - Configuration
 * @returns {string} - Provider name: 'openai', 'anthropic', or 'ollama'
 */
export function detectProvider(model, config) {
  // Check if model name starts with known prefixes
  if (model.startsWith('gpt-') || model.startsWith('o1-') || model.startsWith('o3-')) {
    return 'openai';
  }
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }

  // Check if it's an Ollama model (local models typically don't have provider prefixes)
  if (config.OLLAMA_BASE_URL || model.includes(':')) {
    return 'ollama';
  }

  // Default to OpenAI for unknown models
  return 'openai';
}

/**
 * Get provider module based on provider name
 * @param {string} provider - Provider name
 * @returns {object} - Provider module
 */
function getProviderModule(provider) {
  switch (provider) {
    case 'openai':
      return openai;
    case 'anthropic':
      return anthropic;
    case 'ollama':
      return ollama;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Execute chat completion with automatic provider routing
 * @param {object} params
 * @param {string} params.model - Model name
 * @param {array} params.messages - Message history
 * @param {array} params.enabledTools - Array of tool names to enable
 * @param {object} params.config - Configuration
 * @param {function} params.onText - Callback for text streaming
 * @param {function} params.onToolCall - Callback for tool call display
 * @param {function} params.onSource - Callback for source citations (OWUI citation format)
 * @param {boolean} params.stream - Enable streaming
 * @param {number} params.maxIterations - Max tool execution iterations
 * @param {boolean} params.strictMode - Use strict schema validation (OpenAI only)
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
  stream = false,
  maxIterations = 5,
  strictMode = false
}) {
  const provider = detectProvider(model, config);
  const providerModule = getProviderModule(provider);

  const params = {
    model,
    messages,
    enabledTools,
    config,
    onText,
    onToolCall,
    onSource,
    maxIterations,
    ...(provider === 'openai' && { strictMode })
  };

  if (stream) {
    return providerModule.chatCompletionStream(params);
  } else {
    return providerModule.chatCompletion(params);
  }
}

/**
 * Format tool call for display
 * @param {object} toolCall - Tool call object
 * @param {string} provider - Provider name
 * @returns {string} - Formatted HTML
 */
export function formatToolCallDisplay(toolCall, provider) {
  const providerModule = getProviderModule(provider);
  return providerModule.formatToolCallDisplay(toolCall);
}

/**
 * Get suggested models for a provider
 * Note: Users can specify ANY model - these are just common examples
 * @param {string} provider - Provider name
 * @param {object} config - Configuration
 * @returns {Promise<array>} - List of suggested model names
 */
export async function getAvailableModels(provider, config) {
  switch (provider) {
    case 'openai':
      return [
        'gpt-5',
        'gpt-5.1',
        'gpt-5.2'
      ];

    case 'anthropic':
      return [
        'claude-opus-4-5',
        'claude-sonnet-4-5',
        'claude-haiku-4-5'
      ];

    case 'ollama':
      // For Ollama, try to fetch actual installed models
      return ollama.getToolCapableModels(config);

    default:
      return [];
  }
}

/**
 * Test provider connection
 * @param {string} provider - Provider name
 * @param {object} config - Configuration
 * @returns {Promise<boolean>} - true if connection successful
 */
export async function testConnection(provider, config) {
  try {
    const models = await getAvailableModels(provider, config);
    return models.length > 0;
  } catch (error) {
    console.error(`Provider ${provider} connection test failed:`, error);
    return false;
  }
}
