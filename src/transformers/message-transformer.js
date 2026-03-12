/**
 * Message Utilities for OWUI Toolset V2
 *
 * Provides helpers for working with OWUI-formatted messages.
 * OWUI sends messages in OpenAI Chat Completions format:
 * - Simple: { role: "user", content: "text" }
 * - Multimodal: { role: "user", content: [
 *     { type: "text", text: "..." },
 *     { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
 *   ]}
 */

/**
 * Check if content is a multimodal array or simple string
 * @param {string | Array} content
 * @returns {boolean}
 */
export function isMultimodalContent(content) {
  return Array.isArray(content);
}
