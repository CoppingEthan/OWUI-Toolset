# OWUI Toolset V2

A multi-provider LLM backend for [Open WebUI](https://github.com/open-webui/open-webui) that adds native tool calling, web search, deep research, image generation, sandboxed code execution, and usage analytics.

## Features

- **Multi-Provider LLM Support** -- OpenAI, Anthropic (Claude), and Ollama with native tool calling via each provider's API
- **Web Search & Deep Research** -- Tavily-powered web search, URL scraping, and multi-query deep research with auto-generated PDF reports
- **Image Generation** -- Text-to-image, image editing, and image blending via ComfyUI (Flux workflows)
- **Sandboxed Code Execution** -- Docker-based sandbox with 95+ pre-installed tools (Python, Node.js, FFmpeg, Pandoc, LibreOffice, etc.), resource-limited and network-isolated
- **Content Extraction Engine** -- Converts uploaded files (PDF, DOCX, Excel, CSV, images, audio, code) to markdown for LLM ingestion
- **Usage Analytics Dashboard** -- Tracks tokens, costs, tool usage, and cache performance per model with a built-in web UI
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
| `DASHBOARD_PORT` | Dashboard port | `3001` |
| `API_SECRET_KEY` | Bearer token for API auth | -- |
| `DASHBOARD_USERNAME` | Dashboard login | `admin` |
| `DASHBOARD_PASSWORD` | Dashboard login | `change_this_password` |
| `OPENAI_API_KEY` | OpenAI API key | -- |
| `ANTHROPIC_API_KEY` | Anthropic API key | -- |
| `OLLAMA_BASE_URL` | Ollama server URL | -- |
| `TAVILY_API_KEY` | Enables web search tools | -- |
| `COMFYUI_BASE_URL` | Enables image generation tools | -- |
| `DOCLING_BASE_URL` | Enables PDF/DOCX extraction | -- |

## Start

```bash
cd /opt/owui-toolset
npm start
```

Then install `owui-pipe.py` as a pipeline in Open WebUI and configure its valves to point at your API server.

## Data & Updates

All user data is stored in the `data/` directory and is **never touched** by updates:

- `data/` -- SQLite database, uploaded files, generated images
- `.env` -- your configuration and API keys

Running `./deploy.sh` again pulls the latest code and only rebuilds the Docker sandbox image if the Dockerfile changed.

## Network Isolation

The sandbox Docker containers are network-isolated:

- **Internet**: Allowed (so sandboxed code can fetch packages/APIs)
- **LAN**: Blocked (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- **Localhost**: Blocked (127.0.0.0/8)

Sandbox resource limits: 1GB RAM, 2 CPUs, 100 PIDs, 5-minute execution timeout.
