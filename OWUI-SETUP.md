# OWUI Toolset V2 — OpenWebUI Setup Guide

Drop-in pipe for OpenWebUI that forwards chat requests to the toolset server, which orchestrates tool-calling (web search, sandbox, image gen, memory, etc.) across a local llama-server + Anthropic fallback.

---

## What's running where

| Service | Host | Port | Purpose |
|---|---|---|---|
| **OWUI Toolset V2 API** | `10.4.0.11` | `3000` | What the pipe talks to |
| **OWUI Toolset Dashboard** | `10.4.0.11` | `3001` | Metrics/logs UI (admin:admin) |
| **llama-server** (Qwen3.6-35B-A3B) | `10.0.0.23` | `8080` | Local LLM backing the toolset |

---

## 1. Install the pipe in OpenWebUI

1. In OWUI: **Admin Panel → Pipelines → Manage Functions (or Pipelines)**
2. Remove any old `OWUI Toolset V2` pipe you have
3. Create a new one and paste the contents of [owui-pipe.py](./owui-pipe.py) from this repo
4. Save

---

## 2. Configure the valves

Click the gear icon on the pipe to open valves. Set these:

### Required

| Valve | Value |
|---|---|
| `TOOLSET_API_URL` | `http://10.4.0.11:3000` |
| `TOOLSET_API_KEY` | *(get from `/opt/owui-toolset/.env` on the LXC, `API_SECRET_KEY=...`)* |
| `ANTHROPIC_API_KEY` | your Anthropic key (needed for escalation + vision) |
| `LLAMA_SERVER_URL` | `http://10.0.0.23:8080` |

### LLM selection

| Valve | Value | Notes |
|---|---|---|
| `MAIN_LLM_PROVIDER` | `llama-server` | Handles chat, tools, compaction |
| `MAIN_LLM_MODEL` | `qwen3.6-35b-a3b` | Must match `--alias` in llama-qwen.service |
| `ESCALATION_MODEL` | `claude-sonnet-4-6` | Anthropic model used when local escalates / falls back |
| `ENABLE_COMPACTION` | `true` | Auto-summarise long conversations |

### Tool integrations (optional — blank disables)

| Valve | Value |
|---|---|
| `TAVILY_API_KEY` | your Tavily key — enables web_search, web_scrape, deep_research |
| `DOCLING_BASE_URL` | `http://localhost:5001` if you run Docling, else blank |
| `COMFYUI_BASE_URL` | `http://10.0.0.25:8188` (or wherever your ComfyUI is) — enables image tools |

### Tool toggles (all default on)

`ENABLE_WEB_SEARCH`, `ENABLE_WEB_SCRAPE`, `ENABLE_DEEP_RESEARCH`, `ENABLE_SANDBOX`, `ENABLE_IMAGE_GENERATION`, `ENABLE_IMAGE_EDIT`, `ENABLE_IMAGE_BLEND`, `ENABLE_MEMORY`, `ENABLE_DATE_TIME`

(A tool won't actually work without its dependency: web tools need Tavily, image tools need ComfyUI, etc.)

### Advanced

| Valve | Default | Notes |
|---|---|---|
| `CUSTOM_SYSTEM_PROMPT` | `""` | Extra system prompt appended to the model's baseline |
| `ENABLE_FILE_RECALL` / `FILE_RECALL_INSTANCE_ID` | off | Only needed if you're running an OpenAI vector store for document search |

---

## 3. How it behaves in practice

- **Simple chat** ("hey", general questions): handled by Qwen3.6-35B-A3B locally, usually ~1 second.
- **Tool-using questions** (web search, image gen, sandbox code exec): Qwen decides when to call tools; the toolset server executes them and feeds results back. Most stay on Qwen.
- **When Qwen can't handle it**: the model can call `escalate_to_expert` to hand off to Claude Sonnet mid-conversation. You'll see a status indicator in the chat.
- **When llama-server is unavailable** (model still loading, network glitch, etc.): the toolset falls back to Claude with a clear status message (`⚠️ Local model unavailable — using Claude`). No silent hangs.

---

## 4. Status messages you might see in the chat

| Status | Meaning |
|---|---|
| `⏳ Local model warming up…` | llama-server didn't respond to a quick health probe. Giving it up to 10s. |
| `✅ Local model ready` | Health probe passed after warming up. Proceeding with Qwen. |
| `⚠️ Local model unavailable — using Claude` | llama-server couldn't be reached within 10s. Falling back. |
| `⚠️ Local model stopped mid-response — continuing with Claude...` | Qwen errored partway through. Claude continues the response. |

---

## 5. Swapping the local model

The LXC has two systemd units for llama-server. Only one can run at a time (they share port 8080):

| Service | Model | Notes |
|---|---|---|
| `llama-qwen` | Qwen3.6-35B-A3B (Q4_K_XL) | Current active. 23 GB VRAM, ~120 tok/s generation. |
| `llama-server` | gpt-oss-20b (Q8_0) | Legacy. 15 GB VRAM, ~170 tok/s generation. |

To swap:
```bash
ssh root@10.0.0.23
systemctl stop llama-qwen
systemctl start llama-server     # or the reverse
```

If you switch the model, also update:
- `MAIN_LLM_MODEL` in the OWUI pipe valve (to match the new `--alias`)
- `LLAMA_START_CMD` in `/opt/owui-toolset/.env` on the LXC (so auto-start hits the right unit)
- Restart owui-toolset: `systemctl restart owui-toolset`

---

## 6. Troubleshooting

**Chat takes 10+ seconds to start responding**
Usually Qwen's first request after idle. `⏳ Local model warming up…` status will show up. If it keeps happening, check llama-server: `ssh root@10.0.0.23 'journalctl -u llama-qwen -n 30 --no-pager'`.

**Every chat falls back to Claude**
Network path between the LXC and llama-host is flaky (known intermittent Proxmox issue). Check from the LXC: `ssh root@10.4.0.11 'curl http://10.0.0.23:8080/health'`. If that times out but ping works, it's a firewall/conntrack issue on the Proxmox host.

**Tools don't appear**
Check the tool-specific API key / service URL is set and that the `ENABLE_*` toggle is on. Tools silently disable themselves without their dependency.

**Dashboard shows weird costs for local model**
Local models (Qwen, gpt-oss, llama) are free — cost calculator treats them as zero. If you see non-zero costs for a local model, something has `claude` or `opus` in the model-name field by mistake.

---

## 7. Files to know

- [owui-pipe.py](./owui-pipe.py) — the OpenWebUI pipe
- [src/api/server.js](./src/api/server.js) — main toolset API server
- [src/tools/providers/llama-server.js](./src/tools/providers/llama-server.js) — llama-server streaming + tool loop
- [src/utils/llama-manager.js](./src/utils/llama-manager.js) — SSH lifecycle + health probes
- [tests/manual/owui-simulator.mjs](./tests/manual/owui-simulator.mjs) — end-to-end simulator replicating the pipe's exact payload (useful for debugging)
