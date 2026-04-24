/**
 * Simulates owui-pipe.py: sends a /api/v1/chat request and prints SSE events.
 * Usage:
 *   node scripts/test-pipe.js "your prompt here" [--tools] [--provider anthropic|openai] [--model claude-sonnet-4-6]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load .env.local if present, fall back to .env
const envLocal = path.join(projectRoot, '.env.local');
const envMain = path.join(projectRoot, '.env');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else if (fs.existsSync(envMain)) dotenv.config({ path: envMain });

const args = process.argv.slice(2);
const prompt = args.find(a => !a.startsWith('--')) || 'Say hello in three words.';
const useTools = args.includes('--tools');
const providerArg = args.find(a => a.startsWith('--provider'));
const modelArg = args.find(a => a.startsWith('--model'));
const provider = providerArg ? providerArg.split('=')[1] || args[args.indexOf(providerArg) + 1] : 'anthropic';
const model = modelArg ? modelArg.split('=')[1] || args[args.indexOf(modelArg) + 1] : 'claude-sonnet-4-6';

const PORT = process.env.PORT || 3000;
const URL = `http://127.0.0.1:${PORT}/api/v1/chat`;
const API_KEY = process.env.API_SECRET_KEY || 'local-test-secret';

const payload = {
  conversation_id: `test-${Date.now()}`,
  user_email: 'tester@example.com',
  owui_instance: '127.0.0.1:test',
  stream: true,
  messages: [{ role: 'user', content: prompt }],
  files: [],
  config: {
    llm_provider: provider,
    llm_model: model,
    use_tools: useTools,
    anthropic_api_key: process.env.ANTHROPIC_API_KEY,
    openai_api_key: process.env.OPENAI_API_KEY || '',
    tavily_api_key: process.env.TAVILY_API_KEY,
    docling_base_url: process.env.DOCLING_BASE_URL,
    comfyui_base_url: process.env.COMFYUI_BASE_URL,
    toolset_api_url: `http://127.0.0.1:${PORT}`,
    compaction_provider: provider,
    compaction_model: model,
    enable_compaction: true,
    file_recall_instance_id: '',
    tools: {
      web_search: true,
      web_scrape: true,
      deep_research: false,
      sandbox: true,
      image_generation: true,
      image_edit: true,
      image_blend: true,
      memory: true,
      date_time: true,
      file_recall: false,
    },
  },
};

console.log(`→ POST ${URL}`);
console.log(`→ provider=${provider} model=${model} tools=${useTools}`);
console.log(`→ prompt: ${prompt}\n`);

const res = await fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  console.error(`✗ HTTP ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let currentEvent = null;
let textOut = '';
let events = { text_chunks: 0, status: 0, source: 0, other: 0 };

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
      continue;
    }
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') { console.log('\n\n✓ [DONE]'); continue; }
      try {
        const j = JSON.parse(data);
        if (currentEvent === 'status') {
          events.status++;
          console.log(`\n[status] ${j.data?.description || JSON.stringify(j.data)}`);
        } else if (currentEvent === 'source') {
          events.source++;
          console.log(`\n[source] ${j.data?.source?.url || 'unknown'}`);
        } else if (j.choices?.[0]?.delta?.content) {
          const chunk = j.choices[0].delta.content;
          textOut += chunk;
          process.stdout.write(chunk);
          events.text_chunks++;
        } else {
          events.other++;
        }
      } catch {
        events.other++;
      }
      currentEvent = null;
    }
  }
}

console.log(`\n\n── summary ──`);
console.log(`text chunks: ${events.text_chunks}`);
console.log(`status events: ${events.status}`);
console.log(`source events: ${events.source}`);
console.log(`other events: ${events.other}`);
console.log(`total text length: ${textOut.length} chars`);
