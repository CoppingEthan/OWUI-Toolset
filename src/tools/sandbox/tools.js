/**
 * Sandbox Tool Handlers
 *
 * Implements the 6 sandbox tools:
 * - sandbox_execute: Run shell commands
 * - sandbox_write_file: Write files to workspace
 * - sandbox_read_file: Read files from workspace
 * - sandbox_list_files: List directory contents
 * - sandbox_diff_edit: Search/replace edit files
 * - sandbox_stats: Get resource usage
 */

import { containerManager } from './manager.js';
import { executeWithStreaming } from './executor.js';
import { formatToolResult } from '../prompts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get volume path for a chat session
 */
function getVolumePath(email, chatUid) {
  const safeEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
  const safeConvId = chatUid.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume');
}

/**
 * Resolve and validate path within workspace (prevent path traversal)
 */
function resolveWorkspacePath(volumePath, filePath) {
  // Remove /workspace prefix if present
  const relativePath = filePath.replace(/^\/workspace\/?/, '');
  const resolved = path.resolve(volumePath, relativePath);

  // Security check - ensure path is within volume
  if (!resolved.startsWith(volumePath)) {
    throw new Error('Path traversal not allowed');
  }

  return resolved;
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

/**
 * Escape string for use in regex
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tool Handlers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * sandbox_execute - Run shell command in sandbox
 */
export async function executeSandboxCommand(params, config, callbacks = {}) {
  const { command, workdir = '/workspace' } = params;
  const chatUid = config.CONVERSATION_ID;
  const email = config.USER_EMAIL;

  if (!command) {
    return {
      result: formatToolResult('sandbox_execute', 'No command provided', true),
      sources: [],
      error: 'No command provided'
    };
  }

  // Check prerequisites
  const [imageReady, networkReady] = await Promise.all([
    containerManager.isImageReady(),
    containerManager.isNetworkReady()
  ]);

  if (!imageReady) {
    return {
      result: formatToolResult('sandbox_execute', 'Sandbox image not found. Run deploy.sh on the server first.', true),
      sources: [],
      error: 'Sandbox image not found'
    };
  }

  if (!networkReady) {
    return {
      result: formatToolResult('sandbox_execute', 'Sandbox network not found. Run deploy.sh on the server first.', true),
      sources: [],
      error: 'Sandbox network not found'
    };
  }

  try {
    const result = await executeWithStreaming(chatUid, email, command, {
      workdir,
      onStdout: (chunk) => {
        if (callbacks.onProgress) {
          callbacks.onProgress({ type: 'output', chunk });
        }
      },
      onStderr: (chunk) => {
        if (callbacks.onProgress) {
          callbacks.onProgress({ type: 'output', chunk });
        }
      }
    });

    // Format output
    let output = '';
    if (result.stdout) output += result.stdout;
    if (result.stderr) {
      output += (output ? '\n--- stderr ---\n' : '') + result.stderr;
    }
    output += `\n\nExit code: ${result.exitCode}`;

    if (result.oomKilled) {
      output += '\n\n⚠️ OUT OF MEMORY: Process was killed because it exceeded the 1GB RAM limit. ' +
        'Consider: streaming data instead of loading at once, processing in smaller chunks, ' +
        'using generators, or reducing dataset size.';
    }
    if (result.timedOut) {
      output += '\n\n⚠️ TIMEOUT: Process was killed because it exceeded the 5-minute time limit.';
    }

    return {
      result: formatToolResult('sandbox_execute', output),
      sources: [],
      exitCode: result.exitCode,
      oomKilled: result.oomKilled,
      timedOut: result.timedOut,
      error: result.exitCode !== 0 ? `Exit code ${result.exitCode}` : null
    };

  } catch (err) {
    return {
      result: formatToolResult('sandbox_execute', `Failed: ${err.message}`, true),
      sources: [],
      error: err.message
    };
  }
}

/**
 * sandbox_write_file - Write file to workspace
 */
export async function writeFile(params, config) {
  const { path: filePath, content } = params;
  const chatUid = config.CONVERSATION_ID;
  const email = config.USER_EMAIL;

  if (!filePath || content === undefined) {
    return {
      result: formatToolResult('sandbox_write_file', 'Path and content are required', true),
      sources: [],
      error: 'Path and content are required'
    };
  }

  try {
    const volumePath = getVolumePath(email, chatUid);
    fs.mkdirSync(volumePath, { recursive: true });

    const resolvedPath = resolveWorkspacePath(volumePath, filePath);

    // Create parent directories if needed
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

    // Write file
    fs.writeFileSync(resolvedPath, content, 'utf8');

    // Format display path
    const displayPath = filePath.startsWith('/workspace') ? filePath : `/workspace/${filePath}`;

    return {
      result: formatToolResult('sandbox_write_file', `Written ${content.length} bytes to ${displayPath}`),
      sources: [],
      error: null
    };

  } catch (err) {
    return {
      result: formatToolResult('sandbox_write_file', `Failed: ${err.message}`, true),
      sources: [],
      error: err.message
    };
  }
}

/**
 * sandbox_read_file - Read file from workspace
 */
export async function readFile(params, config) {
  const { path: filePath, maxLines = 1000 } = params;
  const chatUid = config.CONVERSATION_ID;
  const email = config.USER_EMAIL;

  if (!filePath) {
    return {
      result: formatToolResult('sandbox_read_file', 'Path is required', true),
      sources: [],
      error: 'Path is required'
    };
  }

  try {
    const volumePath = getVolumePath(email, chatUid);
    const resolvedPath = resolveWorkspacePath(volumePath, filePath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        result: formatToolResult('sandbox_read_file', `File not found: ${filePath}`, true),
        sources: [],
        error: 'File not found'
      };
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      return {
        result: formatToolResult('sandbox_read_file', `Path is a directory, use sandbox_list_files instead`, true),
        sources: [],
        error: 'Path is a directory'
      };
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    const lines = content.split('\n');

    let output = content;
    if (lines.length > maxLines) {
      output = lines.slice(0, maxLines).join('\n');
      output += `\n\n... (truncated, showing ${maxLines} of ${lines.length} lines)`;
    }

    return {
      result: formatToolResult('sandbox_read_file', output),
      sources: [],
      error: null
    };

  } catch (err) {
    return {
      result: formatToolResult('sandbox_read_file', `Failed: ${err.message}`, true),
      sources: [],
      error: err.message
    };
  }
}

/**
 * sandbox_list_files - List directory contents
 */
export async function listFiles(params, config) {
  const { path: dirPath = '/workspace', recursive = false } = params;
  const chatUid = config.CONVERSATION_ID;
  const email = config.USER_EMAIL;

  try {
    const volumePath = getVolumePath(email, chatUid);
    fs.mkdirSync(volumePath, { recursive: true });

    const resolvedPath = resolveWorkspacePath(volumePath, dirPath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        result: formatToolResult('sandbox_list_files', `Directory not found: ${dirPath}`, true),
        sources: [],
        error: 'Directory not found'
      };
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return {
        result: formatToolResult('sandbox_list_files', `Path is a file, not a directory`, true),
        sources: [],
        error: 'Path is not a directory'
      };
    }

    // List directory with optional recursion
    const listDir = (dir, prefix = '', depth = 0) => {
      if (depth > 10) return '  (max depth reached)\n'; // Prevent infinite recursion

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let output = '';

      // Sort: directories first, then files, alphabetically
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        try {
          const entryStat = fs.statSync(fullPath);
          const size = entry.isDirectory() ? '<DIR>' : formatSize(entryStat.size);
          const modified = entryStat.mtime.toISOString().split('T')[0];

          output += `${prefix}${entry.name}${entry.isDirectory() ? '/' : ''} (${size}, ${modified})\n`;

          if (recursive && entry.isDirectory()) {
            output += listDir(fullPath, prefix + '  ', depth + 1);
          }
        } catch {
          output += `${prefix}${entry.name} (error reading)\n`;
        }
      }

      return output;
    };

    const output = listDir(resolvedPath) || '(empty directory)';
    const displayPath = dirPath.startsWith('/workspace') ? dirPath : `/workspace/${dirPath}`;

    return {
      result: formatToolResult('sandbox_list_files', `Contents of ${displayPath}:\n\n${output}`),
      sources: [],
      error: null
    };

  } catch (err) {
    return {
      result: formatToolResult('sandbox_list_files', `Failed: ${err.message}`, true),
      sources: [],
      error: err.message
    };
  }
}

/**
 * sandbox_diff_edit - Search and replace in file
 */
export async function diffEdit(params, config) {
  const { path: filePath, search, replace, all = false } = params;
  const chatUid = config.CONVERSATION_ID;
  const email = config.USER_EMAIL;

  if (!filePath || search === undefined || replace === undefined) {
    return {
      result: formatToolResult('sandbox_diff_edit', 'Path, search, and replace are required', true),
      sources: [],
      error: 'Path, search, and replace are required'
    };
  }

  try {
    const volumePath = getVolumePath(email, chatUid);
    const resolvedPath = resolveWorkspacePath(volumePath, filePath);

    if (!fs.existsSync(resolvedPath)) {
      return {
        result: formatToolResult('sandbox_diff_edit', `File not found: ${filePath}`, true),
        sources: [],
        error: 'File not found'
      };
    }

    let content = fs.readFileSync(resolvedPath, 'utf8');

    // Check if search string exists
    if (!content.includes(search)) {
      return {
        result: formatToolResult('sandbox_diff_edit', `Search string not found in file. Make sure the search string matches exactly (including whitespace and newlines).`, true),
        sources: [],
        error: 'Search string not found'
      };
    }

    // Count occurrences
    const regex = new RegExp(escapeRegex(search), 'g');
    const matches = content.match(regex);
    const count = matches ? matches.length : 0;

    // Perform replacement
    if (all) {
      content = content.split(search).join(replace);
    } else {
      content = content.replace(search, replace);
    }

    // Write back
    fs.writeFileSync(resolvedPath, content, 'utf8');

    const replacedCount = all ? count : 1;
    const displayPath = filePath.startsWith('/workspace') ? filePath : `/workspace/${filePath}`;

    return {
      result: formatToolResult('sandbox_diff_edit', `Replaced ${replacedCount} occurrence(s) in ${displayPath}`),
      sources: [],
      error: null
    };

  } catch (err) {
    return {
      result: formatToolResult('sandbox_diff_edit', `Failed: ${err.message}`, true),
      sources: [],
      error: err.message
    };
  }
}

/**
 * sandbox_stats - Get resource usage stats
 */
export async function getStats(params, config) {
  const chatUid = config.CONVERSATION_ID;
  const email = config.USER_EMAIL;

  try {
    // Ensure container exists (creates one if needed)
    await containerManager.getOrCreateContainer(chatUid, email);

    const stats = await containerManager.getContainerStats(chatUid);

    if (!stats) {
      return {
        result: formatToolResult('sandbox_stats', 'Could not retrieve stats - container may not be running', true),
        sources: [],
        error: 'Stats unavailable'
      };
    }

    const output = `Sandbox Resource Usage:

Container: ${stats.containerName} (${stats.containerId})

Resources:
  Memory:  ${stats.memory}
  CPU:     ${stats.cpu}
  PIDs:    ${stats.pids}

Storage:
  Workspace: ${stats.disk}
  Path: ${stats.volumePath}

Limits:
  Memory: 1GB (hard limit)
  CPU: 2 cores
  PIDs: 100 max
  Timeout: 5 min/command`;

    return {
      result: formatToolResult('sandbox_stats', output),
      sources: [],
      stats,
      error: null
    };

  } catch (err) {
    return {
      result: formatToolResult('sandbox_stats', `Failed: ${err.message}`, true),
      sources: [],
      error: err.message
    };
  }
}
