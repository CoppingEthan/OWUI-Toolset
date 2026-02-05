/**
 * Tool Result Formatter
 *
 * Formats tool execution results for LLM consumption.
 * Used by executor.js to wrap tool outputs.
 *
 * Note: With native tool calling, the [TOOL_RESULT] tags are optional
 * since APIs track results via tool_use_id/tool_call_id. Kept for
 * backwards compatibility and clearer result formatting.
 */

/**
 * Format a tool result for the LLM
 * @param {string} toolName - Name of the tool
 * @param {string} result - Result text
 * @param {boolean} isError - Whether this is an error result
 * @returns {string}
 */
export function formatToolResult(toolName, result, isError = false) {
  if (isError) {
    return `[TOOL_RESULT: ${toolName}]
Error: ${result}
[/TOOL_RESULT]`;
  }

  return `[TOOL_RESULT: ${toolName}]
${result}
[/TOOL_RESULT]`;
}
