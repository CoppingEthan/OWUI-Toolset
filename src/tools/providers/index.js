/**
 * Provider registry.
 *
 * Every provider module exports a single function:
 *
 *   streamChat({
 *     model, messages, enabledTools, config, maxIterations,
 *     onText, onToolCall, onToolOutput, onSource,
 *   }) → Promise<{ content, usage, iterations, stop_reason }>
 *
 * Inputs use a canonical message format (OpenAI-ish):
 *   role: 'system' | 'user' | 'assistant'
 *   content: string | Array<{type: 'text'|'image_url', ...}>
 *
 * The provider converts to its native wire format internally. Streaming
 * deltas are delivered through onText; tool calls loop internally and
 * emit friendly onToolCall/onToolOutput/onSource events.
 *
 * Adding a provider: create ./<name>.js exporting streamChat, register
 * it below. That's the whole list of required changes.
 */

import * as openai from './openai.js';
import * as anthropic from './anthropic.js';

const PROVIDERS = {
  openai,
  anthropic,
};

export function listProviders() {
  return Object.keys(PROVIDERS);
}

/**
 * Stream a chat completion. Always streams internally — if a caller
 * wants a single blob of text it can buffer the onText callback.
 */
export async function streamChat({ provider, ...params }) {
  const mod = PROVIDERS[provider];
  if (!mod) {
    throw new Error(`Unknown provider: ${provider}. Supported: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return mod.streamChat(params);
}

