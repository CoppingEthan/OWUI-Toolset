/**
 * Unified Provider Router
 *
 * Routes to the appropriate provider based on configuration.
 * Two providers: llama-server (local, primary) and Anthropic (cloud, expert/vision).
 */

import * as llamaServer from './llama-server.js';
import * as anthropic from './anthropic.js';

/**
 * Detect provider from config
 * @param {string} model - Model name
 * @param {object} config - Configuration
 * @returns {string} - Provider name: 'llama-server' or 'anthropic'
 */
export function detectProvider(model, config) {
  // Explicit provider from pipeline config takes priority
  if (config.llm_provider) return config.llm_provider;

  // Check if model is a known Anthropic model
  if (model && model.startsWith('claude-')) {
    return 'anthropic';
  }

  // Default to llama-server
  return 'llama-server';
}

/**
 * Get provider module based on provider name
 * @param {string} provider - Provider name
 * @returns {object} - Provider module
 */
function getProviderModule(provider) {
  switch (provider) {
    case 'llama-server':
      return llamaServer;
    case 'anthropic':
      return anthropic;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Re-export for server.js pre-stream fallback
export { getProviderModule };

/**
 * Execute chat completion with automatic provider routing
 * @param {object} params
 * @param {string} params.model - Model name
 * @param {string} [params.provider] - Explicit provider name. If omitted, auto-detected.
 * @param {array} params.messages - Message history
 * @param {array} params.enabledTools - Array of tool names to enable
 * @param {object} params.config - Configuration
 * @param {function} params.onText - Callback for text streaming
 * @param {function} params.onToolCall - Callback for tool call display
 * @param {function} params.onSource - Callback for source citations (OWUI citation format)
 * @param {boolean} params.stream - Enable streaming
 * @param {number} params.maxIterations - Max tool execution iterations
 * @returns {Promise<object>} - Final response
 */
export async function chatCompletion({
  model,
  provider: explicitProvider,
  messages,
  enabledTools = [],
  config,
  onText,
  onToolCall,
  onToolOutput,
  onSource,
  stream = false,
  maxIterations = 15
}) {
  const provider = explicitProvider || detectProvider(model, config);
  const providerModule = getProviderModule(provider);

  const params = {
    model,
    messages,
    enabledTools,
    config,
    onText,
    onToolCall,
    onToolOutput,
    onSource,
    maxIterations,
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
 * @param {string} provider - Provider name
 * @param {object} config - Configuration
 * @returns {Promise<array>} - List of model names
 */
export async function getAvailableModels(provider, config) {
  switch (provider) {
    case 'llama-server':
      return llamaServer.getToolCapableModels(config);

    case 'anthropic':
      return [
        'claude-opus-4-5',
        'claude-sonnet-4-6',
        'claude-haiku-4-5'
      ];

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
