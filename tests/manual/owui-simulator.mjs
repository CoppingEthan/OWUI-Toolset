#!/usr/bin/env node
// OWUI simulator — replicates owui-pipe.py behavior exactly against the dev service.
// Runs a scenario defined by SCENARIO env var, captures every SSE event with timing,
// reports status events, deltas, and any errors.
//
// Usage:
//   node --env-file=.env.local tests/manual/owui-simulator.mjs <scenario>
//
// Scenarios:
//   simple         - single-turn "hey" message
//   tools          - single-turn "what is the latest news" (triggers web_search)
//   multi-turn     - 3 sequential messages in same conversation (hey / tools list / news)
//   stress-loop    - 5 sequential news queries (stress the tool loop path)

import { setTimeout as delay } from 'timers/promises';

const API = process.env.OWUI_API_URL || 'http://10.4.0.11:3002';
const TOKEN = process.env.OWUI_API_KEY || 'kP7BMp14e7dlMfETtFqkpWAFwewkcyhT';
const scenario = process.argv[2] || 'simple';

function buildPayload(conversation_id, userMessage, priorMessages = []) {
  return {
    stream: true,
    conversation_id,
    user_email: 'sysadmin@dannybarker.co.uk',
    owui_instance: 'open-webui',
    files: [],
    messages: [...priorMessages, { role: 'user', content: userMessage }],
    config: {
      llm_provider: 'llama-server',
      llm_model: 'gpt-oss-20b',
      use_tools: true,
      anthropic_api_key: process.env.ANTHROPIC_API_KEY,
      llama_server_url: process.env.LLAMA_SERVER_URL,
      anthropic_expert_model: 'claude-sonnet-4-6',
      tavily_api_key: process.env.TAVILY_API_KEY || '',
      docling_base_url: 'http://localhost:5001',
      comfyui_base_url: process.env.COMFYUI_BASE_URL || '',
      toolset_api_url: API,
      custom_system_prompt: '',
      compaction_provider: 'llama-server',
      compaction_model: 'gpt-oss-20b',
      enable_compaction: true,
      file_recall_instance_id: '',
      tools: {
        web_search: true,
        web_scrape: true,
        deep_research: true,
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
}

async function sendTurn(label, payload, timeoutMs = 180000) {
  const t0 = Date.now();
  console.log(`\n━━━━━━━━━━ ${label} ━━━━━━━━━━`);
  console.log(`POST ${API}/api/v1/chat  msgs=${payload.messages.length}  prompt="${payload.messages[payload.messages.length - 1].content.slice(0, 60)}"`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`client timeout ${timeoutMs}ms`)), timeoutMs);

  let resp;
  try {
    resp = await fetch(`${API}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    console.log(`  [${Date.now() - t0}ms] ✗ fetch failed: ${e.message}`);
    return { ok: false, error: e.message };
  }
  console.log(`  [${Date.now() - t0}ms] status=${resp.status} ct=${resp.headers.get('content-type')}`);
  if (!resp.ok) {
    clearTimeout(timer);
    return { ok: false, error: `HTTP ${resp.status}: ${await resp.text()}` };
  }

  let firstByteAt = null, firstDeltaAt = null;
  let bytes = 0, events = 0, deltas = 0, doneSeen = false;
  let out = '';
  const statusEvents = [];
  const toolCalls = [];
  let buffer = '';
  let lastEventAt = t0;

  try {
    for await (const chunk of resp.body) {
      const now = Date.now();
      if (firstByteAt === null) {
        firstByteAt = now;
        console.log(`  [${now - t0}ms] first byte`);
      }
      if (now - lastEventAt > 10000) {
        console.log(`  [${now - t0}ms] ⚠ gap of ${now - lastEventAt}ms since last SSE event`);
      }
      lastEventAt = now;
      bytes += chunk.length;
      buffer += Buffer.from(chunk).toString('utf8');
      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const record = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        let eventName = null;
        for (const line of record.split('\n')) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) {
            events++;
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') { doneSeen = true; continue; }
            try {
              const j = JSON.parse(dataStr);
              if (eventName === 'status') {
                const desc = j.data?.description || JSON.stringify(j.data);
                statusEvents.push({ at: now - t0, desc });
                console.log(`  [${now - t0}ms] 📍 status: ${desc}`);
              } else if (eventName === 'source') {
                // citations
              } else {
                const delta = j.choices?.[0]?.delta?.content;
                if (delta) {
                  if (firstDeltaAt === null) {
                    firstDeltaAt = now;
                    console.log(`  [${now - t0}ms] first delta (${delta.length}ch)`);
                  }
                  // Detect tool-call markers embedded in the delta content (rendered as <details> blocks)
                  const toolMatch = delta.match(/🔧\s+(\w+):|🌐\s+Searching:|🔍\s+Deep Researching:|📄\s+Scraping:/);
                  if (toolMatch) {
                    toolCalls.push({ at: now - t0, marker: toolMatch[0] });
                    console.log(`  [${now - t0}ms] 🔧 tool marker: ${toolMatch[0]}`);
                  }
                  deltas++;
                  out += delta;
                }
              }
            } catch {}
          }
        }
      }
    }
  } catch (e) {
    clearTimeout(timer);
    const elapsed = Date.now() - t0;
    console.log(`  [${elapsed}ms] ✗ stream aborted: ${e.message} (${elapsed - (lastEventAt - t0)}ms since last event)`);
    return { ok: false, error: e.message, elapsed, deltas, bytes, out };
  }
  clearTimeout(timer);

  const total = Date.now() - t0;
  console.log(`  [${total}ms] ✓ complete  bytes=${bytes} events=${events} deltas=${deltas} done=${doneSeen}`);
  console.log(`     ttfb=${firstByteAt - t0}ms  first-delta=${firstDeltaAt ? firstDeltaAt - t0 : '-'}ms`);
  if (statusEvents.length) {
    console.log(`     status events: ${statusEvents.length}`);
  }
  console.log(`     output (${out.length}ch): ${out.slice(0, 200).replace(/\n/g, ' ')}${out.length > 200 ? '…' : ''}`);

  return { ok: true, elapsed: total, bytes, events, deltas, doneSeen, statusEvents, toolCalls, out, firstByteMs: firstByteAt - t0, firstDeltaMs: firstDeltaAt ? firstDeltaAt - t0 : null };
}

async function runScenario() {
  const convId = `sim-${scenario}-${Date.now()}`;
  const results = [];

  switch (scenario) {
    case 'simple': {
      results.push(await sendTurn('Turn 1: hey', buildPayload(convId, 'hey')));
      break;
    }
    case 'tools': {
      results.push(await sendTurn('Turn 1: latest news', buildPayload(convId, 'what is the latest news?'), 180000));
      break;
    }
    case 'multi-turn': {
      const priors = [];
      const r1 = await sendTurn('Turn 1: hey', buildPayload(convId, 'hey', priors));
      results.push(r1);
      if (r1.ok) priors.push({ role: 'user', content: 'hey' }, { role: 'assistant', content: r1.out });

      await delay(2000);
      const r2 = await sendTurn('Turn 2: tools list', buildPayload(convId, 'what tools do you have?', priors));
      results.push(r2);
      if (r2.ok) priors.push({ role: 'user', content: 'what tools do you have?' }, { role: 'assistant', content: r2.out });

      await delay(2000);
      const r3 = await sendTurn('Turn 3: news (tool use)', buildPayload(convId, 'what is the latest news?', priors), 180000);
      results.push(r3);
      break;
    }
    case 'stress-loop': {
      for (let i = 1; i <= 5; i++) {
        const r = await sendTurn(`News query ${i}`, buildPayload(`${convId}-${i}`, 'what is the latest news?'), 180000);
        results.push(r);
        await delay(3000);
      }
      break;
    }
    default:
      console.error(`Unknown scenario: ${scenario}`);
      process.exit(1);
  }

  // Summary
  console.log(`\n━━━━━━━━━━ SUMMARY ━━━━━━━━━━`);
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log(`  passed: ${pass}/${results.length}`);
  console.log(`  failed: ${fail}/${results.length}`);
  if (fail > 0) {
    results.forEach((r, i) => {
      if (!r.ok) console.log(`    turn ${i + 1}: ${r.error}`);
    });
  }
  results.forEach((r, i) => {
    if (r.ok) {
      console.log(`  turn ${i + 1}: ${r.elapsed}ms (ttfb=${r.firstByteMs}ms) ${r.deltas} deltas ${r.statusEvents.length} status events`);
    }
  });

  if (fail > 0) process.exit(1);
}

await runScenario();
