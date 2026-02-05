/**
 * Debug Logger - Captures EVERYTHING for debugging
 * Logs to both console and debug.log file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const LOG_FILE = path.join(projectRoot, 'debug.log');

// Clear log file on startup
fs.writeFileSync(LOG_FILE, `=== DEBUG LOG STARTED ${new Date().toISOString()} ===\n\n`);

/**
 * Log to both console and file
 */
export function log(...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  // Console
  console.log(...args);

  // File
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

/**
 * Log API request - captures full request payload
 */
export function logRequest(provider, payload) {
  const timestamp = new Date().toISOString();
  const separator = '═'.repeat(80);

  let output = `\n${separator}\n`;
  output += `[${timestamp}] 📤 API REQUEST TO ${provider.toUpperCase()}\n`;
  output += `${separator}\n`;
  output += JSON.stringify(payload, null, 2);
  output += `\n${separator}\n\n`;

  console.log(`📤 [${provider.toUpperCase()}] Sending request (see debug.log for full payload)`);
  fs.appendFileSync(LOG_FILE, output);
}

/**
 * Log API response - captures full response
 */
export function logResponse(provider, response) {
  const timestamp = new Date().toISOString();
  const separator = '═'.repeat(80);

  let output = `\n${separator}\n`;
  output += `[${timestamp}] 📥 API RESPONSE FROM ${provider.toUpperCase()}\n`;
  output += `${separator}\n`;
  output += JSON.stringify(response, null, 2);
  output += `\n${separator}\n\n`;

  console.log(`📥 [${provider.toUpperCase()}] Received response (see debug.log for full payload)`);
  fs.appendFileSync(LOG_FILE, output);
}

/**
 * Log messages array - shows exactly what LLM sees
 */
export function logMessages(context, messages) {
  const timestamp = new Date().toISOString();
  const separator = '─'.repeat(80);

  let output = `\n${separator}\n`;
  output += `[${timestamp}] 💬 MESSAGES (${context})\n`;
  output += `${separator}\n`;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    output += `\n--- Message ${i + 1} (${msg.role}) ---\n`;

    if (typeof msg.content === 'string') {
      output += msg.content;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          output += `[TEXT]: ${block.text}\n`;
        } else if (block.type === 'image_url') {
          const url = block.image_url?.url || 'NO URL';
          if (url.startsWith('data:')) {
            output += `[IMAGE]: data URL (${url.length} chars)\n`;
          } else {
            output += `[IMAGE]: ${url}\n`;
          }
        } else if (block.type === 'image') {
          // Anthropic format
          if (block.source?.type === 'url') {
            output += `[IMAGE]: ${block.source.url}\n`;
          } else if (block.source?.type === 'base64') {
            output += `[IMAGE]: base64 (${block.source.data?.length || 0} chars)\n`;
          }
        } else {
          output += `[${block.type}]: ${JSON.stringify(block)}\n`;
        }
      }
    } else {
      output += JSON.stringify(msg.content, null, 2);
    }
    output += '\n';
  }

  output += `${separator}\n\n`;

  console.log(`💬 [${context}] ${messages.length} messages (see debug.log for content)`);
  fs.appendFileSync(LOG_FILE, output);
}

/**
 * Log error
 */
export function logError(context, error) {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] ❌ ERROR (${context}): ${error.message}\n${error.stack || ''}\n\n`;

  console.error(`❌ [${context}]`, error.message);
  fs.appendFileSync(LOG_FILE, output);
}

/**
 * Log a section header
 */
export function logSection(title) {
  const timestamp = new Date().toISOString();
  const separator = '█'.repeat(80);
  const output = `\n\n${separator}\n[${timestamp}] ${title}\n${separator}\n\n`;

  console.log(`\n${'█'.repeat(40)}\n${title}\n${'█'.repeat(40)}`);
  fs.appendFileSync(LOG_FILE, output);
}

/**
 * Log tool call with parameters and results
 */
export function logToolCall(toolName, params, result = null, success = true, executionTime = 0) {
  const timestamp = new Date().toISOString();
  const separator = '─'.repeat(80);

  let output = `\n${separator}\n`;
  output += `[${timestamp}] 🔧 TOOL CALL: ${toolName}\n`;
  output += `${separator}\n`;

  // Tool parameters
  output += `\n📥 Parameters:\n`;
  output += JSON.stringify(params, null, 2);
  output += '\n';

  // Tool result (if available)
  if (result !== null) {
    output += `\n📤 Result:\n`;
    // Truncate very long results
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    if (resultStr.length > 5000) {
      output += resultStr.substring(0, 5000) + `\n... [truncated, ${resultStr.length} chars total]\n`;
    } else {
      output += resultStr + '\n';
    }
  }

  // Execution stats
  output += `\n📊 Status: ${success ? '✅ Success' : '❌ Failed'} | Execution Time: ${executionTime}ms\n`;
  output += `${separator}\n\n`;

  console.log(`🔧 [TOOL] ${toolName} ${success ? '✅' : '❌'} (${executionTime}ms) - see debug.log for details`);
  fs.appendFileSync(LOG_FILE, output);
}

export default {
  log,
  logRequest,
  logResponse,
  logMessages,
  logError,
  logSection,
  logToolCall
};
