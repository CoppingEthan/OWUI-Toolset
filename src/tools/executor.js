/**
 * Tool dispatcher.
 *
 * Every provider module calls executeToolCall(name, params, config, callbacks).
 * This file is a thin router — handlers live under ./executors/ and
 * ./sandbox/tools.js. To add a tool:
 *   1. Add its definition to src/tools/definitions.js
 *   2. Add its name + toggle to getEnabledToolNames() in definitions.js
 *   3. Implement a handler anywhere and add one case to HANDLERS below
 */

import * as sandbox from './sandbox/tools.js';
import { executeWebSearch, executeWebScrape, executeDeepResearch } from './executors/web.js';
import { executeImageGeneration, executeImageEdit, executeImageBlend } from './executors/images.js';
import { executeMemoryRetrieve, executeMemoryCreate, executeMemoryUpdate, executeMemoryDelete } from './executors/memory.js';
import { executeDateTimeNow, executeDateTimeDiff } from './executors/date-time.js';
import { executeFileRecallSearch } from './executors/file-recall.js';
import { formatToolResult } from '../utils/tool-result.js';
import { logToolCall } from '../utils/debug-logger.js';

const HANDLERS = {
  // Web (Tavily)
  web_search:         (p, c)    => executeWebSearch(p, c),
  web_scrape:         (p, c)    => executeWebScrape(p, c),
  deep_research:      (p, c, k) => executeDeepResearch(p, c, k),

  // ComfyUI images
  image_generation:   (p, c, k) => executeImageGeneration(p, c, k),
  image_edit:         (p, c, k) => executeImageEdit(p, c, k),
  image_blend:        (p, c, k) => executeImageBlend(p, c, k),

  // Sandbox
  sandbox_execute:    (p, c, k) => sandbox.executeSandboxCommand(p, c, k),
  sandbox_write_file: (p, c)    => sandbox.writeFile(p, c),
  sandbox_read_file:  (p, c)    => sandbox.readFile(p, c),
  sandbox_list_files: (p, c)    => sandbox.listFiles(p, c),
  sandbox_diff_edit:  (p, c)    => sandbox.diffEdit(p, c),
  sandbox_stats:      (p, c)    => sandbox.getStats(p, c),

  // Memory
  memory_retrieve:    (p, c) => executeMemoryRetrieve(p, c),
  memory_create:      (p, c) => executeMemoryCreate(p, c),
  memory_update:      (p, c) => executeMemoryUpdate(p, c),
  memory_delete:      (p, c) => executeMemoryDelete(p, c),

  // File recall
  file_recall_search: (p, c) => executeFileRecallSearch(p, c),

  // Date/time (synchronous)
  date_time_now:      (p) => executeDateTimeNow(p),
  date_time_diff:     (p) => executeDateTimeDiff(p),
};

/**
 * Execute a tool and return its standardized { result, sources, error } shape.
 * Timing and logging happen here so handlers don't need to bother with them.
 */
export async function executeToolCall(toolName, params, config, callbacks = {}) {
  const handler = HANDLERS[toolName];
  if (!handler) {
    const msg = `Unknown tool: ${toolName}`;
    logToolCall(toolName, params, msg, false, 0);
    return { result: formatToolResult(toolName, msg, true), sources: [], error: msg };
  }

  const startTime = Date.now();
  try {
    const executionResult = await handler(params, config, callbacks);
    const executionTime = Date.now() - startTime;
    logToolCall(toolName, params, executionResult.result, !executionResult.error, executionTime);
    return executionResult;
  } catch (err) {
    const executionTime = Date.now() - startTime;
    logToolCall(toolName, params, err.message, false, executionTime);
    throw err;
  }
}
