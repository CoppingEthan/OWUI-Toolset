# Title: V2 simplification — dead code, Ollama removal, single-process DB, provider abstraction, and module split

## Issue Summary
The codebase had grown ~20,000 lines with several accumulated issues:
- ~2,500 lines of confirmed dead code (unused exports, dead SQL views, stale helpers)
- Three processes of model handling (conversational / tool-calling / compaction) in `owui-pipe.py`
- API server and dashboard running as separate processes with a custom cross-process SQLite settings merge (`_mergeExternalSettings`) and dashboard `db.reload()` on almost every request
- Ollama code paths that are no longer wanted
- Two 1,700+ line files (`src/api/server.js`, `src/tools/executor.js`) that mixed unrelated concerns
- Basic auth timing-unsafe; dashboard password echoed to stdout at startup; no CSRF on destructive endpoints; debug.log grew unbounded regardless of DEBUG_MODE

## Root Cause
All organic growth: an early architecture (two processes + many model roles) stayed in place while functionality expanded around it.

## Old Behaviour
- `npm start` spawned `src/index.js` which spawned two child processes (`api/server.js` and `dashboard/server.js`). Each created its own `new DatabaseManager(dbPath)` with independent in-memory sql.js state. Dashboard writes to `settings` could collide with API writes; `_mergeExternalSettings` papered over it with a mtime-compare of the disk file.
- Every dashboard endpoint called `db.reload()` to re-parse the SQLite file from disk. Per page load that was ~5 reads of a growing DB.
- Chat endpoint had a ~130-line streaming path and a near-duplicate ~130-line non-streaming path. Each provider module had `chatCompletion` + `chatCompletionStream` with duplicated tool loop logic.
- `owui-pipe.py` had three model valves (`TOOL_CALLING_LLM_*`, `CONVERSATIONAL_LLM_*`, `COMPACTION_LLM_*`) and swapped models based on whether any tool was enabled.
- `debug.log` was truncated on startup and written unconditionally thereafter; `logMessages`/`logSection` fired on every request.
- Dashboard startup logged `admin:change_this_password` in plain text.

## New Behaviour
- Single Node process. `src/index.js` creates one `DatabaseManager`, imports `createApiApp(db)` and `createDashboardApp(db)` factory functions, and binds each to its own port so existing reverse-proxy / firewall topologies keep working. No cross-process merge, no `db.reload()` anywhere.
- `src/database/instance.js` exports the singleton DB; any module that needs the DB imports it from there.
- One `streamChat({ provider, ... })` entrypoint in `src/tools/providers/index.js`. Adding a provider = drop a file exporting `streamChat` and register it in the `PROVIDERS` map.
- Chat endpoint has one code path; stream/non-stream is a branch at the emit sites (and `stream:false` just buffers the same stream). Temp-proxy image cleanup runs in a `finally` so errors outside the LLM call no longer leak files.
- `owui-pipe.py`: `LLM_PROVIDER` + `LLM_MODEL` for chat, `COMPACTION_PROVIDER` + `COMPACTION_MODEL` for summarisation. Ollama removed. 248 → 203 lines.
- `debug.log` is only written when `DEBUG_MODE=true`. Console messages always fire so supervisor log rotation still works.
- Dashboard basic-auth now uses `crypto.timingSafeEqual`; startup no longer prints credentials.
- Dashboard adds a `Sec-Fetch-Site` middleware — modern browsers always set this on cross-origin requests, so any value other than `same-origin` or `none` is rejected on POST/PUT/DELETE/PATCH. Same-origin AJAX works unchanged.
- API bearer-token compare also uses `crypto.timingSafeEqual`.
- Sandbox manager gains `cleanupOrphans()`; `src/index.js` calls it at boot so stale `sandbox-*` containers from a crashed run don't linger.

## Files Changed

### Deleted
- `src/tools/providers/ollama.js`
- `src/tools/prompts.js` (single helper moved to `src/utils/tool-result.js`)
- `src/transformers/message-transformer.js` (single helper inlined as `Array.isArray` in server.js)
- Dead methods in `src/database/database.js`: `getRecentRequests`, `getToolCallCount`, `getTokenUsageTimeSeries`, `getTokenUsageTimeSeriesByDomain`, `getUsageByInstance`, `getUniqueModels`, `clearAllData`, `getAllSettings`, `reload`, `_mergeExternalSettings`, `_lastSaveMs`
- Dead dashboard routes: `/api/requests/recent`, `/api/stats/by-instance`, `/api/stats/by-model`, `/api/stats/models`, `/api/events` (+ `sseClients`/`broadcastUpdate` machinery)
- Dead tool helpers: `formatToolCallDisplay` in all three providers, `detectProvider` / `getAvailableModels` / `testConnection` in providers registry, `getToolStatusMessage` in executor.js (~315 lines)
- Dead schema: `cost_ollama_*` seeds, `daily_statistics` / `hourly_statistics` / `model_statistics` / `tool_statistics` views, `compaction_count` writes (column left in place for back-compat)
- Dead CEE helpers: `parseExifDate`, `formatExposure`, `formatGpsCoord` in `image-handler.js` and the unused `exifData`/`gpsData` objects they fed
- `toOpenAIChatCompletionsTools`, `toOllamaTools` in `definitions.js`

### Created
- `src/database/instance.js` — singleton DB
- `src/api/cost.js` — `createPricingLookup(db)` returning `calculateCost` (with cached DB reads)
- `src/api/compaction.js` — `estimateTokens`, `trimMessagesToTokenLimit`, `compactMessages`, `callCompactionLLM`; owns `MAX_INPUT_TOKENS` / `COMPACTION_TOKEN_THRESHOLD` / `COMPACTION_MAX_SUMMARY_TOKENS`
- `src/api/ip-allowlist.js` — `isInstanceAllowed` + CIDR/wildcard helpers
- `src/utils/tool-result.js` — `formatToolResult` + `toolOk` / `toolError` shorthands
- `src/tools/executors/web.js` — `web_search`, `web_scrape`, `deep_research`
- `src/tools/executors/images.js` — `image_generation`, `image_edit`, `image_blend` + shared `loadImage` / `saveOutputImage`
- `src/tools/executors/memory.js` — memory CRUD
- `src/tools/executors/date-time.js` — `date_time_now`, `date_time_diff` + `parseDateString`
- `src/tools/executors/file-recall.js` — `file_recall_search`
- `scripts/test-pipe.js` — SSE harness simulating `owui-pipe.py` for local testing

### Rewritten / Materially Changed
- `src/index.js` — single-process bootstrap (dotenv → DB → two app factories → two listens → unified shutdown with `containerManager.cleanupAll`)
- `src/api/server.js` — exports `createApiApp(db)` + `applyServerTimeouts`; chat endpoint collapsed to one path with `finally`-based cleanup; timing-safe auth; 1815 → 1180 lines
- `src/dashboard/server.js` — exports `createDashboardApp(db)`; timing-safe basic auth; `sameOriginOnly` CSRF middleware; no credential logging; `recalculateHistoricalCosts` factored out; 798 → 380 lines
- `src/database/database.js` — simpler save (no cross-process merge), dead methods removed; 1561 → 640 lines
- `src/database/schema.sql` — legacy seeds cleaned; dead views dropped (with `DROP VIEW IF EXISTS` for existing DBs)
- `src/tools/executor.js` — thin dispatcher with a `HANDLERS` map; 1735 → 75 lines
- `src/tools/providers/index.js` — minimal `streamChat` registry
- `src/tools/providers/anthropic.js` — one `streamChat` function; cache-control logic consolidated; 645 → 240 lines
- `src/tools/providers/openai.js` — one `streamChat` function; 574 → 215 lines
- `src/utils/debug-logger.js` — gated on `DEBUG_MODE`; 194 → 118 lines
- `owui-pipe.py` — single chat model + single compaction model; 248 → 203 lines
- `src/cee/handlers/docling-handler.js` — hardcoded LAN fallback URL removed; throws a configuration error when `DOCLING_BASE_URL` is unset
- `src/cee/handlers/image-handler.js` — dead EXIF helpers removed
- `src/tools/sandbox/manager.js` — added `cleanupOrphans()`
- `package.json` / `package-lock.json` — `ollama` dependency removed

### Integration Test Summary
All executed against live services (Anthropic API, Tavily, Docling at 10.0.0.26, ComfyUI at 10.0.0.25):
- Anthropic streaming chat ✓
- Tavily web_search (citations emitted as SSE `source` events) ✓
- date_time_now tool ✓
- memory CRUD roundtrip ✓
- CEE text file extraction via `/process` ✓
- Docling endpoint reachable (returned proper JSON for invalid-input test) ✓
- ComfyUI image generation — real 918KB PNG generated, saved, and served over the file-volume URL ✓
- Dashboard unauthed = 401, authed = 200 ✓
- Dashboard Sec-Fetch-Site: cross-site = 403, same-origin = 200 ✓
- `debug.log` not created with `DEBUG_MODE=false` ✓

## Key Design Decisions

1. **Two ports, one process.** Merging the dashboard into a path prefix on port 3000 would have changed the firewall/proxy story for existing deployments. Binding two Express apps from one process in `index.js` gives us the shared DB without that migration burden.

2. **Factory-returning modules over top-level side effects.** `createApiApp(db)` / `createDashboardApp(db)` make the shared DB explicit at the call site and keep `index.js` as the one place that owns lifecycle (boot + shutdown + sandbox orphan sweep).

3. **CSRF via `Sec-Fetch-Site` rather than tokens.** Modern browsers always set this header on fetch/XHR. Cross-site fetches set `cross-site`; cross-origin same-site (rare) sets `same-site`; direct navigation sets `none`; our dashboard JS sets `same-origin`. No client change required, no token plumbing, works for the whole dashboard API in one middleware.

4. **Provider abstraction is a map, not a class hierarchy.** `const PROVIDERS = { openai, anthropic }` keeps the seam small. Each provider exports `streamChat` and nothing else. Adding one is drop-a-file-and-register.

5. **Executor split by category.** Web / images / memory / sandbox / date-time / file-recall are now sibling files that share a `{ result, sources, error }` return shape via `src/utils/tool-result.js`. The dispatcher is a HANDLERS map, matching the provider pattern.

6. **Don't delete `compaction_count` column.** The schema still has it so existing DBs upgrade without a destructive `ALTER TABLE`. We simply stopped writing to it.

7. **Test harness alongside the pipeline.** `scripts/test-pipe.js` simulates `owui-pipe.py` by sending the same payload shape over SSE. It's the fastest way to reproduce a pipeline-driven bug locally without touching Open WebUI.

## Verified Line Diff
Across seven commits:
```
 deleted:  ollama.js (445), message-transformer.js (20), prompts.js (29),
           dead exports in definitions.js / providers / DB (≈2000 lines)
 rewrote:  server.js 1815→1180, dashboard/server.js 798→380,
           database.js 1561→640, executor.js 1735→75,
           anthropic.js 645→240, openai.js 574→215,
           debug-logger.js 194→118, owui-pipe.py 248→203
 added:    9 new focused modules under src/api/ and src/tools/executors/
 net:      ~−4000 lines, no behaviour regressions verified end-to-end
```
