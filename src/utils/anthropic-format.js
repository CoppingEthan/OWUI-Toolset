/**
 * Convert OpenAI Chat Completions messages to Anthropic format for escalation.
 *
 * Used by the llama-server provider when it hands off a conversation to Sonnet
 * via `escalate_to_expert`. Kept as a pure utility (no external imports) so it
 * can be unit-tested in isolation.
 *
 * Key mappings:
 * - system messages → extracted as separate `system` parameter
 * - assistant with tool_calls → assistant with tool_use content blocks
 * - tool role messages → grouped into user messages with tool_result blocks
 * - consecutive same-role messages → merged (Anthropic requires alternating)
 *
 * @param {array} messages - OpenAI CC format messages
 * @returns {{ system: string|null, messages: array }}
 */
export function convertToAnthropicFormat(messages) {
  let systemText = null;
  const converted = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text = typeof msg.content === 'string'
        ? msg.content
        : (Array.isArray(msg.content)
          ? msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
          : '');
      systemText = systemText ? `${systemText}\n\n${text}` : text;
      continue;
    }

    if (msg.role === 'user') {
      const content = [];
      if (typeof msg.content === 'string') {
        content.push({ type: 'text', text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text') {
            content.push(block);
          } else if (block.type === 'image_url' && block.image_url?.url) {
            const url = block.image_url.url;
            const dataMatch = url.match(/^data:([^;]+);base64,(.+)$/);
            if (dataMatch) {
              content.push({
                type: 'image',
                source: { type: 'base64', media_type: dataMatch[1], data: dataMatch[2] }
              });
            } else {
              content.push({
                type: 'image',
                source: { type: 'url', url }
              });
            }
          }
        }
      }
      converted.push({ role: 'user', content });
      continue;
    }

    if (msg.role === 'assistant') {
      const content = [];

      if (msg.content) {
        const text = typeof msg.content === 'string' ? msg.content : '';
        if (text) {
          content.push({ type: 'text', text });
        }
      }

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          const input = typeof tc.function.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input
          });
        }
      }

      if (content.length > 0) {
        converted.push({ role: 'assistant', content });
      }
      continue;
    }

    if (msg.role === 'tool') {
      const toolResult = {
        type: 'tool_result',
        tool_use_id: msg.tool_call_id,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      };

      const last = converted[converted.length - 1];
      if (last && last.role === 'user' && Array.isArray(last.content) &&
          last.content.every(b => b.type === 'tool_result')) {
        last.content.push(toolResult);
      } else {
        converted.push({ role: 'user', content: [toolResult] });
      }
      continue;
    }
  }

  const merged = [];
  for (const msg of converted) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === msg.role) {
      if (Array.isArray(prev.content) && Array.isArray(msg.content)) {
        prev.content.push(...msg.content);
      } else if (Array.isArray(prev.content)) {
        if (typeof msg.content === 'string') {
          prev.content.push({ type: 'text', text: msg.content });
        }
      } else {
        const prevContent = typeof prev.content === 'string'
          ? [{ type: 'text', text: prev.content }]
          : [prev.content];
        const msgContent = Array.isArray(msg.content)
          ? msg.content
          : [typeof msg.content === 'string' ? { type: 'text', text: msg.content } : msg.content];
        prev.content = [...prevContent, ...msgContent];
      }
    } else {
      merged.push(msg);
    }
  }

  return { system: systemText, messages: merged };
}
