/**
 * Cost calculator (pure) — extracted from server.js so it can be unit-tested.
 *
 * Pricing per 1M tokens. Values come from the dashboard-configurable settings
 * (`dbCosts`, `cacheMultipliers`), with hardcoded fallbacks for when the DB
 * has no matching entry. Anthropic usage reports cache tokens separately from
 * `input_tokens`, so no subtraction is needed.
 */

const DEFAULT_ANTHROPIC_CACHE_READ_MULTIPLIER = 0.1;
const DEFAULT_ANTHROPIC_CACHE_WRITE_MULTIPLIER = 1.25;

export function calculateCost({
  model,
  inputTokens,
  outputTokens,
  cacheReadTokens = 0,
  cacheCreationTokens = 0,
  provider = null,
  dbCosts = null,
  cacheMultipliers = null,
}) {
  const modelLower = model.toLowerCase();

  // Escalation combo strings like "gpt-oss-20b → claude-sonnet-4-6".
  // Local side is free; price only the API model.
  if (modelLower.includes('→')) {
    const parts = model.split('→').map(s => s.trim());
    const apiModel = parts[parts.length - 1];
    return calculateCost({
      model: apiModel,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      provider: 'anthropic',
      dbCosts,
      cacheMultipliers,
    });
  }

  // Local models are free
  if (modelLower.includes('gpt-oss') || modelLower.includes('llama-server')) {
    return 0;
  }

  if (!provider) {
    const isAnthropic = modelLower.includes('claude') ||
      modelLower.includes('opus') ||
      modelLower.includes('sonnet') ||
      modelLower.includes('haiku');
    provider = isAnthropic ? 'anthropic' : 'llama-server';
  }

  if (provider === 'llama-server') return 0;

  const providerMultipliers = cacheMultipliers && cacheMultipliers[provider];
  const cacheReadMultiplier = providerMultipliers
    ? providerMultipliers.read
    : DEFAULT_ANTHROPIC_CACHE_READ_MULTIPLIER;
  const cacheWriteMultiplier = providerMultipliers
    ? providerMultipliers.write
    : DEFAULT_ANTHROPIC_CACHE_WRITE_MULTIPLIER;

  let pricing = { input: 1.00, output: 3.00 };

  if (dbCosts) {
    const patterns = Object.keys(dbCosts).sort((a, b) => b.length - a.length);
    let matched = false;
    for (const pattern of patterns) {
      if (pattern === 'default') continue;
      if (modelLower.includes(pattern.toLowerCase())) {
        pricing = dbCosts[pattern];
        matched = true;
        break;
      }
    }
    // Family-level fallback — e.g. matches "claude-sonnet-4-6" against a "sonnet" entry
    if (!matched) {
      const familyPatterns = ['opus', 'sonnet', 'haiku'];
      for (const family of familyPatterns) {
        if (modelLower.includes(family)) {
          for (const pattern of patterns) {
            if (pattern.toLowerCase().includes(family)) {
              pricing = dbCosts[pattern];
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
      }
    }
    if (modelLower.includes(':')) {
      if (dbCosts['local'] || dbCosts['ollama']) {
        pricing = dbCosts['local'] || dbCosts['ollama'];
      } else {
        return 0;
      }
    }
    if (!matched && dbCosts['default']) {
      pricing = dbCosts['default'];
    }
  } else {
    if (modelLower.includes(':') || modelLower.startsWith('llama') || modelLower.startsWith('mistral')) {
      pricing = { input: 0, output: 0 };
    } else if (modelLower.includes('opus')) {
      pricing = { input: 5.00, output: 25.00 };
    } else if (modelLower.includes('sonnet')) {
      pricing = { input: 3.00, output: 15.00 };
    } else if (modelLower.includes('haiku')) {
      pricing = { input: 1.00, output: 5.00 };
    }
  }

  const regularInputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.input * cacheReadMultiplier;
  const cacheWriteCost = (cacheCreationTokens / 1_000_000) * pricing.input * cacheWriteMultiplier;

  return regularInputCost + outputCost + cacheReadCost + cacheWriteCost;
}
