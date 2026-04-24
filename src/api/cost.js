/**
 * Cost calculation — model pricing + cache multipliers.
 *
 * Both model costs and cache multipliers live in the `settings` table
 * and are editable from the dashboard. Reads are cached in memory for
 * COST_CACHE_TTL ms to avoid hitting the DB on every request.
 *
 * Pricing is per 1M tokens in USD. Cache multipliers are relative to
 * the base input price (e.g. 0.1 = 90% discount for cache hits).
 *
 * Notes on provider accounting:
 *   - OpenAI's `input_tokens` INCLUDES cached tokens, so the regular
 *     input price is applied to (input - cache_read).
 *   - Anthropic reports cache tokens in separate fields, so input_tokens
 *     is already the uncached remainder.
 */

export const COST_CACHE_TTL = 60_000;

const DEFAULT_PRICING = { input: 1.00, output: 3.00 };
const FAMILY_PATTERNS = ['opus', 'sonnet', 'haiku', 'gpt-5.2', 'gpt-5.1', 'gpt-5'];

/**
 * Create a pricing lookup bound to a DatabaseManager instance. Returns
 * a closure that owns its own in-memory cache.
 */
export function createPricingLookup(db) {
  let costCache = null, costCacheTime = 0;
  let multCache = null, multCacheTime = 0;

  function getModelCosts() {
    const now = Date.now();
    if (costCache && (now - costCacheTime) < COST_CACHE_TTL) return costCache;
    try {
      costCache = db.getModelCosts();
      costCacheTime = now;
      return costCache;
    } catch (err) {
      console.error('Error loading costs from DB:', err.message);
      return null;
    }
  }

  function getCacheMultipliers() {
    const now = Date.now();
    if (multCache && (now - multCacheTime) < COST_CACHE_TTL) return multCache;
    try {
      multCache = db.getCacheMultipliers();
      multCacheTime = now;
      return multCache;
    } catch (err) {
      console.error('Error loading cache multipliers from DB:', err.message);
      return null;
    }
  }

  function calculateCost(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheCreationTokens = 0, provider = null) {
    const modelLower = model.toLowerCase();
    const costs = getModelCosts();

    if (!provider) {
      provider = /claude|opus|sonnet|haiku/.test(modelLower) ? 'anthropic' : 'openai';
    }

    const mults = getCacheMultipliers();
    const providerMults = mults?.[provider];
    const cacheReadMultiplier  = providerMults?.read  ?? 0.1;
    const cacheWriteMultiplier = providerMults?.write ?? (provider === 'anthropic' ? 1.25 : 1.0);

    const regularInputTokens = provider === 'openai'
      ? Math.max(0, inputTokens - cacheReadTokens)
      : inputTokens;

    let pricing = { ...DEFAULT_PRICING };
    if (costs) {
      const patterns = Object.keys(costs).sort((a, b) => b.length - a.length);
      let matched = false;
      for (const pattern of patterns) {
        if (pattern === 'default') continue;
        if (modelLower.includes(pattern.toLowerCase())) {
          pricing = costs[pattern];
          matched = true;
          break;
        }
      }
      if (!matched) {
        for (const family of FAMILY_PATTERNS) {
          if (!modelLower.includes(family)) continue;
          for (const pattern of patterns) {
            if (pattern.toLowerCase().includes(family)) {
              pricing = costs[pattern];
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
      if (!matched && costs['default']) pricing = costs['default'];
    } else {
      // Rare — DB unreachable. Use best-effort built-ins.
      if (modelLower.includes('opus'))       pricing = { input: 5.00, output: 25.00 };
      else if (modelLower.includes('sonnet')) pricing = { input: 3.00, output: 15.00 };
      else if (modelLower.includes('haiku'))  pricing = { input: 1.00, output: 5.00 };
      else if (modelLower.includes('gpt-5.2')) pricing = { input: 1.75, output: 14.00 };
      else if (modelLower.includes('gpt-5'))   pricing = { input: 1.25, output: 10.00 };
    }

    return (regularInputTokens   / 1e6) * pricing.input
         + (outputTokens         / 1e6) * pricing.output
         + (cacheReadTokens      / 1e6) * pricing.input * cacheReadMultiplier
         + (cacheCreationTokens  / 1e6) * pricing.input * cacheWriteMultiplier;
  }

  return { calculateCost, getModelCosts, getCacheMultipliers };
}
