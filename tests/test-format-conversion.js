import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertToAnthropicFormat } from '../src/utils/anthropic-format.js';

test('extracts system message out of the messages array', () => {
  const { system, messages } = convertToAnthropicFormat([
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Hi' },
  ]);
  assert.equal(system, 'You are helpful.');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
});

test('merges multiple system messages', () => {
  const { system } = convertToAnthropicFormat([
    { role: 'system', content: 'First.' },
    { role: 'system', content: 'Second.' },
    { role: 'user', content: 'Hi' },
  ]);
  assert.equal(system, 'First.\n\nSecond.');
});

test('plain user text becomes a text content block', () => {
  const { messages } = convertToAnthropicFormat([{ role: 'user', content: 'Hello' }]);
  assert.deepEqual(messages[0].content, [{ type: 'text', text: 'Hello' }]);
});

test('base64 data: URL image becomes an Anthropic base64 image block', () => {
  const { messages } = convertToAnthropicFormat([{
    role: 'user',
    content: [
      { type: 'text', text: 'Look' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,AAAA' } },
    ],
  }]);
  assert.deepEqual(messages[0].content[1], {
    type: 'image',
    source: { type: 'base64', media_type: 'image/png', data: 'AAAA' },
  });
});

test('HTTP(S) image_url becomes a URL-source image block', () => {
  const { messages } = convertToAnthropicFormat([{
    role: 'user',
    content: [{ type: 'image_url', image_url: { url: 'https://example.com/pic.jpg' } }],
  }]);
  assert.deepEqual(messages[0].content[0], {
    type: 'image',
    source: { type: 'url', url: 'https://example.com/pic.jpg' },
  });
});

test('assistant tool_calls become tool_use blocks with id preserved', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'Search for rain' },
    {
      role: 'assistant',
      content: 'Let me search.',
      tool_calls: [{
        id: 'call_abc123',
        function: { name: 'web_search', arguments: '{"query":"rain"}' },
      }],
    },
  ]);
  const assistant = messages[1];
  assert.equal(assistant.role, 'assistant');
  assert.equal(assistant.content[0].type, 'text');
  assert.equal(assistant.content[1].type, 'tool_use');
  assert.equal(assistant.content[1].id, 'call_abc123');
  assert.equal(assistant.content[1].name, 'web_search');
  assert.deepEqual(assistant.content[1].input, { query: 'rain' });
});

test('tool_call arguments are parsed from JSON strings', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'x' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'c1',
        function: { name: 'f', arguments: '{"nested":{"key":42}}' },
      }],
    },
  ]);
  assert.deepEqual(messages[1].content[0].input, { nested: { key: 42 } });
});

test('tool role messages become tool_result blocks on a user message', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'x' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [{ id: 'call_1', function: { name: 'f', arguments: '{}' } }],
    },
    { role: 'tool', tool_call_id: 'call_1', content: 'result text' },
  ]);
  const toolResultMsg = messages[messages.length - 1];
  assert.equal(toolResultMsg.role, 'user');
  assert.equal(toolResultMsg.content[0].type, 'tool_result');
  assert.equal(toolResultMsg.content[0].tool_use_id, 'call_1');
  assert.equal(toolResultMsg.content[0].content, 'result text');
});

test('consecutive tool messages group into a single user message with multiple tool_result blocks', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'x' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        { id: 'c1', function: { name: 'f', arguments: '{}' } },
        { id: 'c2', function: { name: 'g', arguments: '{}' } },
      ],
    },
    { role: 'tool', tool_call_id: 'c1', content: 'r1' },
    { role: 'tool', tool_call_id: 'c2', content: 'r2' },
  ]);
  const grouped = messages[messages.length - 1];
  assert.equal(grouped.role, 'user');
  assert.equal(grouped.content.length, 2);
  assert.equal(grouped.content[0].tool_use_id, 'c1');
  assert.equal(grouped.content[1].tool_use_id, 'c2');
});

test('consecutive same-role messages are merged (Anthropic requires alternation)', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'part 1' },
    { role: 'user', content: 'part 2' },
  ]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].role, 'user');
  assert.equal(messages[0].content.length, 2);
});

test('alternating user/assistant is preserved without merging', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'q1' },
    { role: 'assistant', content: 'a1' },
    { role: 'user', content: 'q2' },
    { role: 'assistant', content: 'a2' },
  ]);
  assert.equal(messages.length, 4);
  assert.deepEqual(messages.map(m => m.role), ['user', 'assistant', 'user', 'assistant']);
});

test('object-form tool_call arguments are kept as-is (not double-parsed)', () => {
  const { messages } = convertToAnthropicFormat([
    { role: 'user', content: 'x' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'c1',
        function: { name: 'f', arguments: { already: 'object' } },
      }],
    },
  ]);
  assert.deepEqual(messages[1].content[0].input, { already: 'object' });
});

test('full escalation round-trip: user → assistant+tool_call → tool_result → user', () => {
  const { system, messages } = convertToAnthropicFormat([
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'do a search' },
    {
      role: 'assistant',
      content: 'searching...',
      tool_calls: [{ id: 'c1', function: { name: 'web_search', arguments: '{"q":"x"}' } }],
    },
    { role: 'tool', tool_call_id: 'c1', content: 'found stuff' },
    { role: 'user', content: 'great, now analyse it' },
  ]);
  assert.equal(system, 'sys');
  // user → assistant(text+tool_use) → user(tool_result) → user(text, merged into prev)
  assert.deepEqual(messages.map(m => m.role), ['user', 'assistant', 'user']);
  // The tool_result message and the final user text message collapse into one user turn
  const lastUser = messages[messages.length - 1];
  assert.equal(lastUser.content.some(b => b.type === 'tool_result'), true);
  assert.equal(lastUser.content.some(b => b.type === 'text' && b.text === 'great, now analyse it'), true);
});
