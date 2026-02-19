# File Recall System - Implementation Plan

## Context

Multiple OWUI instances connect to a single OWUI Toolset deployment. Clients need the ability to upload internal documents (PDFs, DOCX, etc.) that become searchable by the LLM via OpenAI's vector store. Files are stored locally for dedup/tracking and synced to OpenAI for search. Each client instance is isolated with its own vector store and OpenAI API key.

The LLM gets a single **search** tool. All file management happens through a new dashboard at `/file-recall/` on the main API server (:3000).

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────────────────────────────┐
│  OWUI Instance A │────▶│                                              │
│  (instance_id=X) │     │         OWUI Toolset Server (:3000)          │
└─────────────────┘     │                                              │
┌─────────────────┐     │  /api/v1/chat  ──▶ LLM tool:                 │
│  OWUI Instance B │────▶│                    file_recall_search         │
│  (instance_id=Y) │     │                    (OpenAI vector store)      │
└─────────────────┘     │                                              │
                        │  /file-recall/ ──▶ Management Dashboard SPA   │
┌─────────────────┐     │                    (upload, delete, browse)    │
│  Admin / Users   │────▶│                                              │
│  (browser)       │     │  /api/v1/file-recall/* ──▶ Management API    │
└─────────────────┘     └──────────┬───────────────────────────────────┘
                                   │
                        ┌──────────▼───────────────────────────────────┐
                        │  data/file-recall/[instance_id]/             │
                        │    [hash16].[ext]  (flat, hash-based names)   │
                        │                                              │
                        │  OpenAI Vector Store (one per instance)       │
                        │    All search data served from OpenAI        │
                        └──────────────────────────────────────────────┘
```

**Key principles:**
- Local copies are only for dedup and tracking. LLM never reads local files.
- **Content hash is the only file identity.** Not filenames, not paths. Hash is truth.

---

## 1. Database Schema

**File: `src/database/schema.sql`** — Add:

```sql
CREATE TABLE IF NOT EXISTS file_recall_instances (
    id TEXT PRIMARY KEY,                    -- Instance ID slug (e.g. "client-acme")
    name TEXT NOT NULL,                     -- Display name
    openai_api_key TEXT NOT NULL,           -- OpenAI API key for this instance
    vector_store_id TEXT,                   -- OpenAI vector store ID (created on first upload)
    access_token TEXT NOT NULL UNIQUE,      -- Token for dashboard access
    file_count INTEGER DEFAULT 0,
    total_size_bytes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS file_recall_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id TEXT NOT NULL,
    filename TEXT NOT NULL,                 -- Original filename for display (e.g. "policy.pdf")
    storage_name TEXT NOT NULL UNIQUE,      -- Hash-based name on disk (e.g. "a1b2c3d4e5f6g7h8.pdf")
    file_hash TEXT NOT NULL,                -- SHA-256 content hash — THE identity
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    openai_file_id TEXT,                    -- OpenAI file ID
    openai_vs_file_id TEXT,                 -- OpenAI vector store file ID
    status TEXT DEFAULT 'processing',       -- processing | ready | error
    error_message TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instance_id) REFERENCES file_recall_instances(id) ON DELETE CASCADE,
    UNIQUE(instance_id, file_hash)          -- Dedup by content hash, NOT filename
);

CREATE INDEX IF NOT EXISTS idx_fr_files_instance ON file_recall_files(instance_id);
CREATE INDEX IF NOT EXISTS idx_fr_files_hash ON file_recall_files(instance_id, file_hash);
```

**Why `UNIQUE(instance_id, file_hash)` not filename?**
- Users upload from different folder structures — paths are unreliable
- Two files named `policy.pdf` with different content are genuinely different files
- The same file uploaded under any name should be detected as a duplicate
- Content hash is the only reliable identity

**Why `storage_name`?** Files stored flat on disk as `[sha256_first16].[ext]`. No filesystem conflicts regardless of how many files share the same base name.

**File: `src/database/database.js`** — Add methods:
- `getFileRecallInstance(id)` / `createFileRecallInstance(id, name, apiKey, token)` / `deleteFileRecallInstance(id)`
- `getFileRecallInstances()` / `getFileRecallInstanceByToken(token)`
- `getFileRecallFiles(instanceId)` / `getFileRecallFileByHash(instanceId, hash)`
- `insertFileRecallFile(instanceId, filename, storageName, hash, size, mimeType)`
- `deleteFileRecallFile(instanceId, fileId)`
- `updateFileRecallFileStatus(fileId, status, error, openaiFileId, vsFileId)`
- `updateFileRecallInstanceStats(instanceId)` — recalculate from files table
- `updateVectorStoreId(instanceId, vectorStoreId)`

---

## 2. File Storage

**Location:** `data/file-recall/[instance_id]/[sha256_first16].[ext]`

- **All files in one flat folder** per instance
- **Hash-based filenames** on disk — no conflicts possible
- Original filename stored in DB for display only
- Multiple files can share the same display name (different content = different hash)
- Excluded from existing "clear user files" dashboard action

**Supported file types** (OpenAI vector store compatible):

| Extension | Type |
|-----------|------|
| `.pdf` | PDF documents |
| `.docx` | Word documents |
| `.pptx` | PowerPoint presentations |
| `.txt` | Plain text |
| `.md` | Markdown |
| `.html` | HTML pages |
| `.json` | JSON data |
| `.tex` | LaTeX documents |

**Rejected:** spreadsheets (`.xlsx`, `.csv`, `.xls`), images, audio, video, archives, executables

---

## 3. Deduplication Strategy

**Simple: hash is the only check.**

```
For each file in upload batch:
  1. Compute SHA-256 of file content
  2. Check: does this HASH exist for this instance?
     → YES: Skip (identical content already indexed, regardless of filename)
     → Report: "Skipped — content already exists as [existing_filename]"
  3. No hash match: Upload as NEW file
     → Save locally + upload to OpenAI + insert DB record
```

**No automatic replace.** If a user updates a document (same name, new content), it uploads as a new file. The user can delete the old version via the dashboard. This avoids all ambiguity about "which file to replace" when filenames collide.

**Examples:**
| Upload | Existing in instance | Action |
|--------|---------------------|--------|
| `policy.pdf` (hash A) | Nothing | Upload new |
| `policy.pdf` (hash A) | `policy.pdf` (hash A) | Skip (same content) |
| `policy.pdf` (hash B) | `policy.pdf` (hash A) | Upload new (different content) |
| `report.pdf` (hash A) | `policy.pdf` (hash A) | Skip (same content, different name) |

---

## 4. OpenAI Vector Store Sync

**New file: `src/file-recall/openai-sync.js`**

- `getClient(apiKey)` — Create OpenAI SDK client
- `ensureVectorStore(client, instance, db)` — Create vector store on first upload, save ID
- `uploadFile(client, vectorStoreId, filePath, filename)` — Upload to OpenAI + add to vector store
- `deleteFile(client, vectorStoreId, openaiFileId)` — Remove from vector store + OpenAI
- `deleteVectorStore(client, vectorStoreId)` — Delete entire vector store (instance deletion)
- `searchVectorStore(client, vectorStoreId, query, maxResults)` — Direct search API

```javascript
async function searchVectorStore(client, vectorStoreId, query, maxResults = 10) {
  const results = await client.vectorStores.search(vectorStoreId, {
    query,
    max_num_results: maxResults
  });
  return results.data; // [{ file_id, filename, score, content: [{type, text}] }]
}
```

---

## 5. File Recall API Router

**New file: `src/file-recall/router.js`** — Express Router

### Admin Endpoints (`Authorization: Bearer API_SECRET_KEY`):

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/file-recall/instances` | Create instance → returns id + access_token |
| `GET` | `/api/v1/file-recall/instances` | List all instances |
| `PUT` | `/api/v1/file-recall/instances/:id` | Update (name, API key) |
| `DELETE` | `/api/v1/file-recall/instances/:id` | Delete instance + all files + vector store |

### Instance Endpoints (`X-Access-Token` header or `?token=`):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/file-recall/:id/files` | List all files |
| `POST` | `/api/v1/file-recall/:id/upload` | Upload files (multipart via multer) |
| `DELETE` | `/api/v1/file-recall/:id/files/:fileId` | Delete a file (local + OpenAI) |
| `GET` | `/api/v1/file-recall/:id/stats` | File count, size, vector store status |

---

## 6. Upload Flow

```
POST /api/v1/file-recall/:instanceId/upload
  → multipart/form-data with files[] field

Server:
  1. Validate access token → look up instance
  2. Ensure vector store exists (create on first upload)
  3. For each file:
     a. Validate file type (extension check against allowed list)
     b. Strip any path components — extract base filename only
     c. Compute SHA-256 hash of content
     d. Check hash in DB for this instance:
        - Hash exists → skip, add to results as "skipped"
        - Hash new → continue
     e. Generate storage_name: [hash_first16].[ext]
     f. Save to data/file-recall/[instanceId]/[storage_name]
     g. Upload to OpenAI → add to vector store
     h. Insert DB record with status
  4. Update instance stats (file_count, total_size_bytes)
  5. Return per-file results array: { filename, action: "uploaded"|"skipped"|"error", message }
```

---

## 7. LLM Tool Definition

**File: `src/tools/definitions.js`** — Add:

```javascript
file_recall_search: {
  name: 'file_recall_search',
  description: `Search the client's internal document library. Returns the most relevant text snippets from uploaded documents, ranked by relevance.

USE FOR: Finding information in internal documents, policies, procedures, reports, or stored knowledge.
DO NOT USE FOR: General web searches or questions not about the client's documents.`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query describing what to find'
      },
      max_results: {
        type: 'integer',
        description: 'Number of top snippets to return (default 10, max 50)',
        default: 10
      }
    },
    required: ['query']
  }
}
```

**`getEnabledToolNames()`:**
```javascript
if (config.tools.file_recall && config.file_recall_instance_id) {
  enabledTools.push('file_recall_search');
}
```

---

## 8. LLM Tool Execution

**File: `src/tools/executor.js`** — Add `file_recall_search` handler:

1. Get `instance_id` from `config.file_recall_instance_id`
2. Look up instance in DB → `vector_store_id` + `openai_api_key`
3. If no vector store → "No documents uploaded yet"
4. Call `searchVectorStore(client, vectorStoreId, query, maxResults)`
5. Format results with filenames, scores, and text snippets for LLM

**No status messages.** Tool shows via `onToolCall` detail blocks only.

---

## 9. Tool Display (Detail Blocks)

**File: `src/api/server.js`** — Add to `onToolCall` switch (both streaming + non-streaming):

```javascript
case 'file_recall_search':
  friendlyDesc = `📂 Searching documents: ${query}...`;
  break;
```

---

## 10. Pipeline Changes

**File: `owui-pipe.py`**:

```python
# Valves
FILE_RECALL_INSTANCE_ID: str = Field(
    default="",
    description="Instance ID for file recall - isolates document libraries between clients"
)
ENABLE_FILE_RECALL: bool = Field(
    default=False,
    description="Enable file recall (search internal documents via OpenAI vector store)"
)

# Config payload
"file_recall_instance_id": self.valves.FILE_RECALL_INSTANCE_ID,
"tools": { ..., "file_recall": self.valves.ENABLE_FILE_RECALL }

# _has_tools_enabled()
has_file_recall = self.valves.FILE_RECALL_INSTANCE_ID and self.valves.ENABLE_FILE_RECALL
return ... or has_file_recall
```

---

## 11. File Recall Dashboard (SPA)

**New file: `src/file-recall/public/index.html`**

Vanilla HTML/CSS/JS (no build step).

### Login: Instance ID + Access Token → sessionStorage

### Main View:
- **Upload Zone:** Drag-drop + "Select Files" + "Select Folder" (`webkitdirectory`)
  - Client-side file type filtering (reject unsupported before upload)
  - Per-file status: uploaded / skipped / error
- **File List Table:**
  - Columns: Name, Size, Type, Status, Date
  - When multiple files share a name, show short hash suffix for disambiguation: `policy.pdf (a1b2c3)`
  - Sortable columns, search/filter bar
  - Delete button per file (with confirmation)
- **Stats:** Total files, total size, supported types

---

## 12. Files Summary

### New:
| File | Purpose |
|------|---------|
| `src/file-recall/router.js` | Express Router — management API |
| `src/file-recall/openai-sync.js` | OpenAI vector store operations |
| `src/file-recall/public/index.html` | Dashboard SPA |

### Modified:
| File | Changes |
|------|---------|
| `src/database/schema.sql` | 2 tables + indexes |
| `src/database/database.js` | ~8 DB methods |
| `src/tools/definitions.js` | `file_recall_search` definition + enable |
| `src/tools/executor.js` | `file_recall_search` handler |
| `src/api/server.js` | Mount router, serve static, detail block case |
| `owui-pipe.py` | 2 valves + config + `_has_tools_enabled()` |

---

## 13. Verification Plan

1. **Instance CRUD:** Create/list/update/delete instances
2. **File upload:** PDF via dashboard → local copy + OpenAI sync
3. **Dedup - same content:** Re-upload identical file → "skipped"
4. **Dedup - same content different name:** Upload same content as `report.pdf` → "skipped"
5. **Same name different content:** Upload two `policy.pdf` files with different content → both uploaded
6. **Folder upload:** Select folder → all valid files uploaded, invalid rejected client-side
7. **LLM search:** `file_recall_search` → OpenAI snippets in `<details>` block
8. **Instance isolation:** Two instances → search only returns correct instance
9. **File deletion:** Delete from dashboard → removed locally + from OpenAI
10. **Dashboard:** Login, drag-drop, folder upload, file list with hash disambiguation, delete, stats
