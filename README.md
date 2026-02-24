# OWUI Toolset V2

A multi-provider LLM backend for [Open WebUI](https://github.com/open-webui/open-webui) that adds native tool calling, web search, deep research, image generation, sandboxed code execution, and usage analytics.

## Features

- **Multi-Provider LLM Support** -- OpenAI, Anthropic (Claude), and Ollama with native tool calling via each provider's API
- **Web Search & Deep Research** -- Tavily-powered web search, URL scraping, and multi-query deep research with auto-generated PDF reports
- **Image Generation** -- Text-to-image, image editing, and image blending via ComfyUI (Flux workflows)
- **Sandboxed Code Execution** -- Docker-based sandbox with 95+ pre-installed tools (Python, Node.js, FFmpeg, Pandoc, LibreOffice, etc.), resource-limited and network-isolated
- **Content Extraction Engine** -- Converts uploaded files (PDF, DOCX, Excel, CSV, images, audio, code) to markdown for LLM ingestion
- **Usage Analytics Dashboard** -- Tracks tokens, costs, tool usage, and cache performance per model with a built-in web UI
- **User Memory** -- Persistent per-user memories stored and injected automatically across conversations
- **Date & Time Tools** -- Current time with timezone support and date difference calculations
- **Streaming Responses** -- Real-time token-by-token SSE streaming back to Open WebUI

## Deploy

**One-liner install** (clones repo, installs all dependencies, builds sandbox, configures network):

```bash
curl -fsSL https://raw.githubusercontent.com/CoppingEthan/OWUI-Toolset/main/deploy.sh | sudo bash
```

**Update an existing instance** (pulls latest code, preserves all data):

```bash
cd /opt/owui-toolset && ./deploy.sh
```

The deploy script handles: Git, Docker, Node.js 20, iptables, npm dependencies, sandbox image build, and network isolation. Supports Ubuntu/Debian, CentOS/RHEL/Fedora, and Arch Linux.

Custom install location:
```bash
curl -fsSL https://raw.githubusercontent.com/CoppingEthan/OWUI-Toolset/main/deploy.sh | OWUI_INSTALL_DIR=/home/user/owui sudo -E bash
```

## Configuration

After deploying, create a `.env` file:

```bash
nano /opt/owui-toolset/.env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3000` |
| `HOST` | Listen address | `0.0.0.0` |
| `DASHBOARD_PORT` | Dashboard port | `3001` |
| `PUBLIC_DOMAIN` | Public API URL (used in image links) | `http://localhost:3000` |
| `API_SECRET_KEY` | Bearer token for API auth | -- |
| `DASHBOARD_USERNAME` | Dashboard login | `admin` |
| `DASHBOARD_PASSWORD` | Dashboard login | `change_this_password` |
| `ALLOWED_OWUI_INSTANCES` | IP allowlist for pipeline connections | `*` |
| `ENABLE_CORS` | Enable CORS headers | `false` |
| `DATABASE_PATH` | SQLite database location | `data/metrics.db` |
| `DOCLING_BASE_URL` | Enables PDF/DOCX extraction via Docling | -- |
| `ANTHROPIC_MAX_TOKENS` | Max output tokens for Anthropic models | `8192` |
| `MAX_TOOL_ITERATIONS` | Max tool call loops per request | `5` |
| `MAX_MEMORY_CHARS` | Per-user memory character limit | `2000` |
| `MAX_INPUT_TOKENS` | Truncate input tokens (0 = off) | `0` |
| `MAX_USER_MESSAGE_TOKENS` | Per-message and per-file token cap; scales with file count (0 = off) | `8192` |
| `COMPACTION_TOKEN_THRESHOLD` | Auto-summarize conversations above this threshold (0 = off) | `65536` |
| `COMPACTION_MAX_SUMMARY_TOKENS` | Max tokens for compaction summaries | `1024` |
| `ALLOW_REMOTE_UPGRADE` | Allow one-click upgrade from dashboard | `false` |
| `DEBUG_MODE` | Enable verbose debug logging | `false` |

> **Note:** LLM API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_BASE_URL`) and tool service URLs (`TAVILY_API_KEY`, `COMFYUI_BASE_URL`) are configured as **pipeline valves** in Open WebUI on `owui-pipe.py`, not in the `.env` file.

## Start

```bash
cd /opt/owui-toolset
npm start
```

Then install `owui-pipe.py` as a pipeline in Open WebUI and configure its valves to point at your API server.

See [TOOLS.md](TOOLS.md) for a full reference of all available tools.

## Data & Updates

All user data is stored in the `data/` directory and is **never touched** by updates:

- `data/` -- SQLite database, uploaded files, generated images
- `.env` -- your configuration and API keys

Running `./deploy.sh` again pulls the latest code and only rebuilds the Docker sandbox image if the Dockerfile changed.

## File Recall

File Recall lets each OWUI instance search its own library of uploaded documents (PDF, DOCX, PPTX, TXT, MD, HTML, JSON, TEX) via an OpenAI vector store. Each instance is isolated with its own API key, vector store, and access token.

### 1. Create an instance

```bash
curl -X POST http://localhost:3000/api/v1/file-recall/instances \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "client-acme",
    "name": "Acme Corp",
    "openai_api_key": "sk-..."
  }'
```

Save the `access_token` from the response — clients use it to log into the dashboard.

### 2. Configure the OWUI pipeline

In Open WebUI, set these valves on `owui-pipe.py`:

| Valve | Value |
|-------|-------|
| `ENABLE_FILE_RECALL` | `true` |
| `FILE_RECALL_INSTANCE_ID` | `client-acme` |

### 3. Upload documents

Open `http://localhost:3000/file-recall/` in a browser, enter the instance ID and access token, then drag-and-drop files or select folders. Duplicate files (by content hash) are automatically skipped.

### 4. Use in chat

Once documents are uploaded, the LLM receives a `file_recall_search` tool and will automatically search the document library when relevant.

### Admin API

All admin endpoints require `Authorization: Bearer API_SECRET_KEY`.

| Action | Method | Endpoint |
|--------|--------|----------|
| Create instance | `POST` | `/api/v1/file-recall/instances` |
| List instances | `GET` | `/api/v1/file-recall/instances` |
| Update instance | `PUT` | `/api/v1/file-recall/instances/:id` |
| Delete instance | `DELETE` | `/api/v1/file-recall/instances/:id` |

## Network Isolation

The sandbox Docker containers are network-isolated:

- **Internet**: Allowed (so sandboxed code can fetch packages/APIs)
- **LAN**: Blocked (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- **Localhost**: Blocked (127.0.0.0/8)

Sandbox resource limits: 1GB RAM, 2 CPUs, 100 PIDs, 5-minute execution timeout.
