/**
 * Unified Message Transformer for OWUI Toolset V2
 *
 * Transforms OWUI-formatted messages to provider-specific formats.
 * OWUI sends messages in OpenAI Chat Completions format, but each provider
 * (OpenAI Responses API, Anthropic, Ollama) expects different structures.
 *
 * OWUI Input Format:
 * - Simple: { role: "user", content: "text" }
 * - Multimodal: { role: "user", content: [
 *     { type: "text", text: "..." },
 *     { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
 *   ]}
 */

/**
 * Parse a base64 data URL into components
 * @param {string} dataUrl - Data URL like "data:image/png;base64,..."
 * @returns {{ mediaType: string, data: string } | null}
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mediaType: match[1],
    data: match[2]
  };
}

/**
 * Check if content is a multimodal array or simple string
 * @param {string | Array} content
 * @returns {boolean}
 */
export function isMultimodalContent(content) {
  return Array.isArray(content);
}

/**
 * Extract images from OWUI multimodal content
 * @param {Array} contentArray - OWUI content array
 * @returns {Array<{ mediaType: string, data: string, url: string }>}
 */
export function extractImages(contentArray) {
  if (!Array.isArray(contentArray)) return [];

  return contentArray
    .filter(item => item.type === 'image_url' && item.image_url?.url)
    .map(item => {
      const url = item.image_url.url;
      const parsed = parseDataUrl(url);
      return {
        url,
        mediaType: parsed?.mediaType || 'image/png',
        data: parsed?.data || ''
      };
    })
    .filter(img => img.data); // Only keep valid base64 images
}

/**
 * Extract text from OWUI content (handles both string and array)
 * @param {string | Array} content
 * @returns {string}
 */
function extractText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .filter(item => item.type === 'text')
    .map(item => item.text)
    .join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// OpenAI Responses API Transformer (GPT-5.2)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform OWUI messages to OpenAI Responses API format for GPT-5.2
 *
 * GPT-5.2 Responses API expects:
 * - instructions: string (system prompt)
 * - input: string (single turn) OR array of message objects (multi-turn)
 * - Message format: { role: "user"|"assistant", content: string | array }
 * - For text-only: content can be a plain string
 * - For multimodal: content array with { type: "input_text", text: "..." } and { type: "input_image", image_url: "..." }
 *
 * @param {Array} messages - OWUI messages
 * @param {Object} options - Transform options
 * @param {boolean} options.keepImagesInHistory - Keep images in older messages (default: false)
 * @param {number} options.maxImageMessages - Max messages to keep images in (default: 1)
 * @returns {{ instructions: string, input: string | Array }}
 */
export function transformToOpenAI(messages, options = {}) {
  const { keepImagesInHistory = false, maxImageMessages = 1 } = options;

  let instructions = '';
  const input = [];

  // Find and extract system message as instructions
  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg) {
    instructions = extractText(systemMsg.content);
  }

  // Process non-system messages
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  const totalMessages = nonSystemMessages.length;

  nonSystemMessages.forEach((msg, index) => {
    const role = msg.role;

    // Determine if we should keep images in this message
    const isRecentMessage = (totalMessages - index) <= maxImageMessages;
    const shouldKeepImages = keepImagesInHistory || isRecentMessage;

    if (isMultimodalContent(msg.content)) {
      const content = [];

      // Add text content (use input_text for content arrays)
      const text = extractText(msg.content);
      if (text) {
        content.push({ type: 'input_text', text });
      }

      // Add images (only for recent messages unless keepImagesInHistory)
      if (shouldKeepImages) {
        const images = extractImages(msg.content);
        images.forEach(img => {
          content.push({
            type: 'input_image',
            image_url: img.url,
            detail: 'auto'
          });
        });
      }

      // If we stripped images and there's no text, add a placeholder
      if (content.length === 0) {
        content.push({ type: 'input_text', text: '[Image was here]' });
      }

      input.push({ role, content });
    } else {
      // Simple text message - just use string content directly
      input.push({
        role,
        content: msg.content || ''
      });
    }
  });

  // For single message, can return just the string
  // But for multi-turn, return array
  return { instructions, input };
}

// ═══════════════════════════════════════════════════════════════════════════
// Anthropic Messages API Transformer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform OWUI messages to Anthropic Messages API format
 *
 * Anthropic expects:
 * - system: string (separate from messages)
 * - messages: [{ role: "user"|"assistant", content: string | array }]
 * - Content array: [{ type: "text", text: "..." }, { type: "image", source: { type: "base64", media_type: "...", data: "..." } }]
 *
 * @param {Array} messages - OWUI messages
 * @param {Object} options - Transform options
 * @param {boolean} options.keepImagesInHistory - Keep images in older messages (default: false)
 * @param {number} options.maxImageMessages - Max messages to keep images in (default: 1)
 * @returns {{ system: string, messages: Array }}
 */
export function transformToAnthropic(messages, options = {}) {
  const { keepImagesInHistory = false, maxImageMessages = 1 } = options;

  let system = '';
  const anthropicMessages = [];

  // Find and extract system message
  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg) {
    system = extractText(systemMsg.content);
  }

  // Process non-system messages
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  const totalMessages = nonSystemMessages.length;

  nonSystemMessages.forEach((msg, index) => {
    // Determine if we should keep images in this message
    const isRecentMessage = (totalMessages - index) <= maxImageMessages;
    const shouldKeepImages = keepImagesInHistory || isRecentMessage;

    if (isMultimodalContent(msg.content)) {
      const content = [];

      // Add text content
      const text = extractText(msg.content);
      if (text) {
        content.push({ type: 'text', text });
      }

      // Add images (only for recent messages unless keepImagesInHistory)
      if (shouldKeepImages) {
        const images = extractImages(msg.content);
        images.forEach(img => {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType,
              data: img.data
            }
          });
        });
      }

      // If we stripped images and there's no text, add a placeholder
      if (content.length === 0) {
        content.push({ type: 'text', text: '[Image was here]' });
      }

      anthropicMessages.push({ role: msg.role, content });
    } else {
      // Simple text message - can be string or array
      anthropicMessages.push({
        role: msg.role,
        content: msg.content || ''
      });
    }
  });

  return { system, messages: anthropicMessages };
}

// ═══════════════════════════════════════════════════════════════════════════
// Ollama Chat API Transformer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform OWUI messages to Ollama Chat API format
 *
 * Ollama expects:
 * - messages: [{ role: "system"|"user"|"assistant", content: "text", images?: ["base64"] }]
 * - Images are in a separate "images" array per message (just base64 data, no data URL prefix)
 *
 * @param {Array} messages - OWUI messages
 * @param {Object} options - Transform options
 * @param {boolean} options.keepImagesInHistory - Keep images in older messages (default: false)
 * @param {number} options.maxImageMessages - Max messages to keep images in (default: 1)
 * @returns {{ messages: Array }}
 */
export function transformToOllama(messages, options = {}) {
  const { keepImagesInHistory = false, maxImageMessages = 1 } = options;

  const ollamaMessages = [];

  // Process all messages (including system - Ollama supports system role)
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  const totalMessages = nonSystemMessages.length;

  // Add system message first if present
  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg) {
    ollamaMessages.push({
      role: 'system',
      content: extractText(systemMsg.content)
    });
  }

  nonSystemMessages.forEach((msg, index) => {
    // Determine if we should keep images in this message
    const isRecentMessage = (totalMessages - index) <= maxImageMessages;
    const shouldKeepImages = keepImagesInHistory || isRecentMessage;

    const ollamaMsg = {
      role: msg.role,
      content: extractText(msg.content)
    };

    // Add images array if present and should keep
    if (shouldKeepImages && isMultimodalContent(msg.content)) {
      const images = extractImages(msg.content);
      if (images.length > 0) {
        // Ollama wants just the base64 data, not the data URL
        ollamaMsg.images = images.map(img => img.data);
      }
    }

    ollamaMessages.push(ollamaMsg);
  });

  return { messages: ollamaMessages };
}

// ═══════════════════════════════════════════════════════════════════════════
// Unified Transformer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform OWUI messages to the specified provider format
 *
 * @param {Array} messages - OWUI formatted messages
 * @param {'openai' | 'anthropic' | 'ollama'} provider - Target provider
 * @param {Object} options - Transform options
 * @returns {Object} Provider-specific message format
 */
export function transformMessages(messages, provider, options = {}) {
  switch (provider) {
    case 'openai':
      return transformToOpenAI(messages, options);
    case 'anthropic':
      return transformToAnthropic(messages, options);
    case 'ollama':
      return transformToOllama(messages, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// NOTE: Only extractImages and isMultimodalContent are currently used by the API server.
// Token estimation is handled by estimateTokens() in src/api/server.js.
// The transformer functions (transformToOpenAI, transformToAnthropic, transformToOllama)
// were designed for a different architecture and are not currently integrated.
// The LLM providers handle their own message formatting internally.
