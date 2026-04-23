import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCost } from '../src/utils/cost-calculator.js';

const SONNET_COSTS = { sonnet: { input: 3.00, output: 15.00 } };
const OPUS_COSTS = { opus: { input: 5.00, output: 25.00 } };

test('local models are free (gpt-oss)', () => {
  assert.equal(calculateCost({ model: 'gpt-oss-20b', inputTokens: 1000, outputTokens: 500 }), 0);
});

test('local models are free (llama-server)', () => {
  assert.equal(calculateCost({ model: 'llama-server-local', inputTokens: 1000, outputTokens: 500 }), 0);
});

test('escalation combo string prices the Anthropic portion only', () => {
  const combo = calculateCost({
    model: 'gpt-oss-20b → claude-sonnet-4-6',
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    dbCosts: SONNET_COSTS,
  });
  const anthropicOnly = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    dbCosts: SONNET_COSTS,
  });
  assert.equal(combo, anthropicOnly);
  assert.equal(combo, 3.00 + 15.00);
});

test('unknown model defaults to llama-server (free), not the deleted openai path', () => {
  // 'gpt-4o' or any unrecognised 'gpt*' name used to default to openai pricing.
  // After the refactor it falls into the free tier.
  assert.equal(calculateCost({ model: 'gpt-4o-mini', inputTokens: 1000, outputTokens: 500 }), 0);
  assert.equal(calculateCost({ model: 'some-random-model', inputTokens: 1000, outputTokens: 500 }), 0);
});

test('Anthropic model picks up pricing from dbCosts by exact pattern', () => {
  const cost = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 1_000_000,
    outputTokens: 500_000,
    dbCosts: SONNET_COSTS,
  });
  assert.equal(cost, 3.00 + (500_000 / 1_000_000) * 15.00);
});

test('family-level fallback: claude-sonnet-4-6 matches a generic "sonnet" entry', () => {
  const cost = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 1_000_000,
    outputTokens: 0,
    dbCosts: { sonnet: { input: 3.00, output: 15.00 } },
  });
  assert.equal(cost, 3.00);
});

test('Opus pricing via dbCosts', () => {
  const cost = calculateCost({
    model: 'claude-opus-4-5',
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    dbCosts: OPUS_COSTS,
  });
  assert.equal(cost, 5.00 + 25.00);
});

test('cache read tokens priced using default 0.1x multiplier', () => {
  const cost = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 1_000_000,
    dbCosts: SONNET_COSTS,
  });
  assert.equal(cost, 3.00 * 0.1);
});

test('cache creation tokens priced using default 1.25x multiplier', () => {
  const cost = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 1_000_000,
    dbCosts: SONNET_COSTS,
  });
  assert.equal(cost, 3.00 * 1.25);
});

test('cache multipliers can be overridden from settings', () => {
  const cost = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 1_000_000,
    cacheCreationTokens: 1_000_000,
    dbCosts: SONNET_COSTS,
    cacheMultipliers: { anthropic: { read: 0.2, write: 2.0 } },
  });
  assert.equal(cost, (3.00 * 0.2) + (3.00 * 2.0));
});

test('hardcoded fallback pricing used when dbCosts is null', () => {
  const cost = calculateCost({
    model: 'claude-sonnet-4-6',
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
  });
  assert.equal(cost, 3.00 + 15.00);
});

test('nested escalation combo only counts the final API model', () => {
  // Defensive: if a combo gets built with more than two models.
  const cost = calculateCost({
    model: 'gpt-oss-20b → something-else → claude-sonnet-4-6',
    inputTokens: 1_000_000,
    outputTokens: 0,
    dbCosts: SONNET_COSTS,
  });
  assert.equal(cost, 3.00);
});

test('provider explicitly set takes priority over model-name detection', () => {
  // Name has no Anthropic marker, but provider='anthropic' routes it to paid pricing.
  const cost = calculateCost({
    model: 'custom-model-name',
    inputTokens: 1_000_000,
    outputTokens: 0,
    provider: 'anthropic',
    dbCosts: { 'custom-model-name': { input: 2.00, output: 8.00 } },
  });
  assert.equal(cost, 2.00);
});
