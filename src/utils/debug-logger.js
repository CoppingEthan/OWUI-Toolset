/**
 * Debug logger — only active when DEBUG_MODE=true.
 *
 * When enabled, verbose request/response/tool payloads land in
 * debug.log at the project root. The file is truncated on startup and
 * all calls become no-ops when DEBUG_MODE is off, so the log does not
 * grow unbounded in production.
 *
 * Console messages are always emitted (via console.log / console.error)
 * regardless — those respect the normal stdout/stderr log rotation of
 * whatever supervisor started the process.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const LOG_FILE = path.join(projectRoot, 'debug.log');

if (DEBUG_MODE) {
  fs.writeFileSync(LOG_FILE, `=== DEBUG LOG STARTED ${new Date().toISOString()} ===\n\n`);
}

function writeFile(content) {
  if (!DEBUG_MODE) return;
  try { fs.appendFileSync(LOG_FILE, content); } catch {}
}

export function log(...args) {
  console.log(...args);
  if (!DEBUG_MODE) return;
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
    }
    return String(arg);
  }).join(' ');
  writeFile(`[${timestamp}] ${message}\n`);
}

export function logRequest(provider, payload) {
  console.log(`📤 [${provider.toUpperCase()}] Sending request${DEBUG_MODE ? ' (see debug.log for full payload)' : ''}`);
  if (!DEBUG_MODE) return;
  const separator = '═'.repeat(80);
  writeFile(`\n${separator}\n[${new Date().toISOString()}] 📤 API REQUEST TO ${provider.toUpperCase()}\n${separator}\n${JSON.stringify(payload, null, 2)}\n${separator}\n\n`);
}

export function logResponse(provider, response) {
  console.log(`📥 [${provider.toUpperCase()}] Received response${DEBUG_MODE ? ' (see debug.log for full payload)' : ''}`);
  if (!DEBUG_MODE) return;
  const separator = '═'.repeat(80);
  writeFile(`\n${separator}\n[${new Date().toISOString()}] 📥 API RESPONSE FROM ${provider.toUpperCase()}\n${separator}\n${JSON.stringify(response, null, 2)}\n${separator}\n\n`);
}

export function logMessages(context, messages) {
  console.log(`💬 [${context}] ${messages.length} messages${DEBUG_MODE ? ' (see debug.log for content)' : ''}`);
  if (!DEBUG_MODE) return;
  const separator = '─'.repeat(80);
  let output = `\n${separator}\n[${new Date().toISOString()}] 💬 MESSAGES (${context})\n${separator}\n`;
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
          output += url.startsWith('data:')
            ? `[IMAGE]: data URL (${url.length} chars)\n`
            : `[IMAGE]: ${url}\n`;
        } else if (block.type === 'image') {
          if (block.source?.type === 'url')    output += `[IMAGE]: ${block.source.url}\n`;
          else if (block.source?.type === 'base64') output += `[IMAGE]: base64 (${block.source.data?.length || 0} chars)\n`;
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
  writeFile(output);
}

export function logSection(title) {
  console.log(`\n${'█'.repeat(40)}\n${title}\n${'█'.repeat(40)}`);
  if (!DEBUG_MODE) return;
  const separator = '█'.repeat(80);
  writeFile(`\n\n${separator}\n[${new Date().toISOString()}] ${title}\n${separator}\n\n`);
}

export function logToolCall(toolName, params, result = null, success = true, executionTime = 0) {
  console.log(`🔧 [TOOL] ${toolName} ${success ? '✅' : '❌'} (${executionTime}ms)${DEBUG_MODE ? ' - see debug.log for details' : ''}`);
  if (!DEBUG_MODE) return;
  const separator = '─'.repeat(80);
  let output = `\n${separator}\n[${new Date().toISOString()}] 🔧 TOOL CALL: ${toolName}\n${separator}\n`;
  output += `\n📥 Parameters:\n${JSON.stringify(params, null, 2)}\n`;
  if (result !== null) {
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    output += `\n📤 Result:\n`;
    output += resultStr.length > 5000
      ? resultStr.substring(0, 5000) + `\n... [truncated, ${resultStr.length} chars total]\n`
      : resultStr + '\n';
  }
  output += `\n📊 Status: ${success ? '✅ Success' : '❌ Failed'} | Execution Time: ${executionTime}ms\n${separator}\n\n`;
  writeFile(output);
}
