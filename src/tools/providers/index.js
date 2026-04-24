/**
 * Provider registry.
 *
 * Each provider module exports:
 *   - chatCompletionStream(params) — streaming path (what OWUI pipeline uses)
 *   - chatCompletion(params) — non-streaming fallback (collects same stream)
 *
 * To add a provider:
 *   1. Create ./<name>.js exporting the two functions above
 *   2. Register it in the PROVIDERS map below
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
 * Dispatch a chat completion to the named provider.
 *
 * @param {object} params
 * @param {string} params.provider - 'openai' | 'anthropic'
 * @param {boolean} [params.stream=false]
 * ...other params forwarded to the provider module.
 */
export async function chatCompletion({ provider, stream = false, ...params }) {
  const mod = PROVIDERS[provider];
  if (!mod) {
    throw new Error(`Unknown provider: ${provider}. Supported: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return stream ? mod.chatCompletionStream(params) : mod.chatCompletion(params);
}
