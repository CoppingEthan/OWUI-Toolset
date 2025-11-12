# OWUI Request Logger

A comprehensive logging system for Open WebUI that captures, stores, and visualizes all user requests and AI responses with file attachments.

## Features

- **Separate Request/Response Logging**: REQUEST and RESPONSE cards with distinct visual badges
- **Token Estimation**: Character count and estimated tokens (~4 chars/token) for each log
- **Expandable Content Viewer**: Click to view full prompts and responses with lazy loading
- **File Capture System**: Automatically captures and displays uploaded files (PDF, images, Excel, etc.)
- **Python Filter**: Intercepts all OWUI requests/responses using `__files__` parameter
- **Node.js API Server**: RESTful API for storing and retrieving logs
- **Web Dashboard**: Real-time web interface with search and auto-refresh
- **File Storage**: Structured storage in `/users/{username}/{logId}/`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start both servers
node server/api.js &    # API on port 3001
node server/web.js &    # Web dashboard on port 3000

# 3. Upload filter to Open WebUI
# Copy filter/request_logger_filter.py to OWUI and enable it

# 4. Access dashboard
# http://localhost:3000
```

## Installation

**Prerequisites:** Node.js 14+, Open WebUI running

```bash
# Install dependencies
npm install

# Start servers
node server/api.js &
node server/web.js &
```

**Configure OWUI Filter:**

1. In Open WebUI admin panel, go to **Functions** → **Add Function**
2. Upload `filter/request_logger_filter.py`
3. Enable the filter
4. Configure valves (optional):
   - `api_url`: `http://localhost:3001` (default)
   - `owui_base_url`: `http://localhost:8080` (your OWUI URL)
   - `capture_files`: `true`

## Dashboard Features

**Access:** `http://localhost:3000`

- **📊 Simplified View**: Card-based layout with:
  - REQUEST/RESPONSE badges (blue/green)
  - Character count & token estimates
  - Expandable full content viewer
  - File attachments with icons and sizes
  
- **🔧 Raw JSON View**: Full log data for debugging

- **Search & Filter**: By username, model, or content
- **Auto-refresh**: Real-time log monitoring
- **Statistics**: Total requests, active users, last model used

## API Endpoints (Port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/logs?limit=100` | List logs (filter by `username`) |
| `GET` | `/api/logs/:username/:logId` | Get specific log |
| `POST` | `/api/log` | Create log entry |
| `DELETE` | `/api/logs/clear` | Delete all logs |
| `GET` | `/api/stream` | SSE real-time stream |

## Data Structure

```
/users/{username}/{logId}/
├── metadata.json         # Type, model, timing, file summary
├── request.json          # User prompt (type: "request")
├── response.json         # AI response (type: "response")
└── files/
    ├── document.pdf      # Actual file content
    ├── document.pdf.meta.json
    └── data.xlsx
```

**metadata.json** includes:
- `type`: "request" or "response"
- `model`, `timestamp`, `responseTime`
- `files`: `{count: 2, files: [{filename, size, mime_type}, ...]}`
- User info: `{id, name, email, role}`

## Filter Configuration

**Python Filter Valves** (configure in OWUI):

```python
api_url: str = "http://localhost:3001"          # API server URL
owui_base_url: str = "http://localhost:8080"    # OWUI server URL
capture_files: bool = True                      # Capture uploaded files
debug: bool = False                             # Enable debug logging
```

The filter reads files from `/app/backend/data/uploads/` in the OWUI container using the `__files__` parameter.

## Project Structure

```
owui-toolset/
├── server/
│   ├── api.js                    # API server (port 3001)
│   ├── web.js                    # Web dashboard (port 3000)
│   └── package.json
├── filter/
│   └── request_logger_filter.py  # OWUI filter (upload to OWUI)
├── users/                        # Log storage directory
│   └── {username}/{logId}/
│       ├── metadata.json
│       ├── request.json
│       ├── response.json
│       └── files/
└── package.json
```

## Troubleshooting

**Servers won't start:**
```bash
# Check ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
pkill -f "node server"
```

**Filter not capturing:**
1. Check filter is enabled in OWUI
2. Verify API server is running: `curl http://localhost:3001/health`
3. Set `debug: true` in filter valves
4. Check `owui_base_url` matches your OWUI instance

**Files not captured:**
- Ensure `capture_files: true` in filter valves
- Verify OWUI uploads directory exists: `/app/backend/data/uploads/`
- Check filter has read access to the uploads directory

## Notes

- **Storage**: Each request creates files. Monitor disk usage.
- **Security**: No authentication by default. Restrict port access in production.
- **Token Estimation**: Uses rough approximation (~4 chars/token). Use tiktoken for accuracy.

---

Built for the Open WebUI community
