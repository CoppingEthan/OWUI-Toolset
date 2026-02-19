# OWUI Toolset — Tool Reference

All tools the LLM can use during conversations. Each tool group is toggled independently via pipeline valves in Open WebUI.

---

## Web Search & Research

Requires: `TAVILY_API_KEY`

| Tool | Description |
|------|-------------|
| `web_search` | Search the web for current information. Returns snippets (or full page content) and optionally images. 1-10 results per query. |
| `web_scrape` | Extract full content from up to 20 URLs. Reads documentation, articles, and web pages in detail. |
| `deep_research` | Multi-query research synthesis. Automatically searches multiple angles, compiles a report with citations, and generates a downloadable PDF. |

**Valve:** `ENABLE_WEB_SEARCH`, `ENABLE_WEB_SCRAPE`, `ENABLE_DEEP_RESEARCH`

---

## Image Generation

Requires: `COMFYUI_BASE_URL`

| Tool | Description |
|------|-------------|
| `image_generation` | Text-to-image generation via ComfyUI (Flux). Supports custom resolution (512-1536px), negative prompts, and quality steps. |
| `image_edit` | Transform an existing image based on a text description. Style changes, enhancements, artistic transformations. |
| `image_blend` | Combine elements from two images. Style transfer, merging subjects, texture application. |

**Valve:** `ENABLE_IMAGE_GENERATION`, `ENABLE_IMAGE_EDIT`, `ENABLE_IMAGE_BLEND`

---

## Sandboxed Code Execution

Requires: Docker installed on the host.

| Tool | Description |
|------|-------------|
| `sandbox_execute` | Run any shell command in a secure Docker container. Ubuntu 24.04, Python 3, Node.js 20, internet access, 1GB RAM, 2 CPUs, 5-min timeout. 95+ pre-installed tools and libraries. |
| `sandbox_write_file` | Create or overwrite a file in the sandbox `/workspace`. |
| `sandbox_read_file` | Read a file from the sandbox workspace. |
| `sandbox_list_files` | List files and directories with sizes and dates. Supports recursive listing. |
| `sandbox_diff_edit` | Edit a file using exact search-and-replace. More efficient than rewriting entire files. |
| `sandbox_stats` | Get current sandbox resource usage: memory, CPU, process count, disk space. |

**Valve:** `ENABLE_SANDBOX`

### Pre-installed in the sandbox

- **System:** ffmpeg, imagemagick, ghostscript, poppler-utils, pandoc, wkhtmltopdf, libreoffice, jq, csvkit, sqlite3, curl, wget, httpie, git, ripgrep, build-essential, zip/7z
- **Python:** numpy, pandas, scipy, scikit-learn, matplotlib, seaborn, plotly, pillow, opencv, openpyxl, python-docx, PyPDF2, pdfplumber, python-pptx, requests, httpx, beautifulsoup4, lxml, and many more
- **Node.js:** typescript, esbuild, yarn, pnpm, prettier, marked, svgo

---

## User Memory

No external dependencies.

| Tool | Description |
|------|-------------|
| `memory_retrieve` | Retrieve all saved memories for the current user. Returns IDs, content, and timestamps. |
| `memory_create` | Save a new memory about the user. Persists across conversations. Subject to a per-user character limit. |
| `memory_update` | Update an existing memory by ID. Use to correct, consolidate, or refine stored facts. |
| `memory_delete` | Delete a memory by ID. Use to remove outdated or incorrect information. |

Memories are automatically injected into the system prompt at the start of each conversation. Character limit is controlled by the `MAX_MEMORY_CHARS` environment variable (default: 2000).

**Valve:** `ENABLE_MEMORY`

---

## Date & Time

No external dependencies.

| Tool | Description |
|------|-------------|
| `date_time_now` | Get the current date, time, day of week, and timezone. Supports any IANA timezone (default: Europe/London). |
| `date_time_diff` | Calculate the exact difference between two dates/times. Returns breakdown in years, months, days, hours, minutes, seconds, plus totals. Supports ISO 8601 and natural date formats. |

**Valve:** `ENABLE_DATE_TIME`

---

## File Recall

Requires: OpenAI API key (per instance), instance created via admin API.

| Tool | Description |
|------|-------------|
| `file_recall_search` | Search the client's uploaded document library. Returns the most relevant text snippets ranked by relevance. Powered by OpenAI vector stores. |

Supported file types: PDF, DOCX, PPTX, TXT, MD, HTML, JSON, TEX. Documents are uploaded via the File Recall dashboard at `/file-recall/`. Each client instance is isolated with its own vector store and access token.

**Valve:** `ENABLE_FILE_RECALL` + `FILE_RECALL_INSTANCE_ID`

---

## Tool Count Summary

| Category | Tools | External Dependency |
|----------|-------|-------------------|
| Web Search & Research | 3 | Tavily API |
| Image Generation | 3 | ComfyUI |
| Sandbox Code Execution | 6 | Docker |
| User Memory | 4 | None |
| Date & Time | 2 | None |
| File Recall | 1 | OpenAI API |
| **Total** | **19** | |
