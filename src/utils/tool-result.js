/**
 * Wraps a tool execution result with [TOOL_RESULT] markers for the LLM.
 * Native tool calling tracks results via tool_use_id/tool_call_id, but these
 * markers help the model visually distinguish tool output from chat content.
 */
export function formatToolResult(toolName, result, isError = false) {
  const header = isError ? `[TOOL_RESULT: ${toolName}]\nError: ` : `[TOOL_RESULT: ${toolName}]\n`;
  return `${header}${result}\n[/TOOL_RESULT]`;
}

/**
 * Shorthand for error results from tool handlers.
 * Returns the standard { result, sources, error } shape.
 */
export function toolError(toolName, message) {
  return {
    result: formatToolResult(toolName, message, true),
    sources: [],
    error: message,
  };
}

/**
 * Shorthand for successful tool results with text output.
 */
export function toolOk(toolName, text, extras = {}) {
  return {
    result: formatToolResult(toolName, text),
    sources: [],
    error: null,
    ...extras,
  };
}
