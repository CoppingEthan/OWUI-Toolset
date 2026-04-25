-- ============================================
-- OWUI Toolset V2 - Database Schema
-- Version 2.0 - Dashboard Overhaul
-- ============================================

-- Request metrics table (simplified - single model per request)
CREATE TABLE IF NOT EXISTS request_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    conversation_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    owui_instance TEXT NOT NULL,

    -- Model used (single model per request)
    model TEXT NOT NULL,
    provider TEXT NOT NULL,

    -- Token usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,

    -- Cost (in USD)
    cost REAL DEFAULT 0.0,

    -- Request status
    status TEXT DEFAULT 'completed',
    error_message TEXT,

    -- Performance metrics
    response_time_ms INTEGER DEFAULT 0
);

-- Request messages table (stores user input and assistant response per request)
CREATE TABLE IF NOT EXISTS request_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Message content
    role TEXT NOT NULL,
    content TEXT NOT NULL,

    FOREIGN KEY (request_id) REFERENCES request_metrics(id) ON DELETE CASCADE
);

-- Tool calls table (stores tool executions with full results)
CREATE TABLE IF NOT EXISTS tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Tool info
    tool_name TEXT NOT NULL,
    tool_params TEXT NOT NULL,
    tool_result TEXT,

    -- Status
    success INTEGER DEFAULT 1,
    error_message TEXT,
    execution_time_ms INTEGER DEFAULT 0,

    FOREIGN KEY (request_id) REFERENCES request_metrics(id) ON DELETE CASCADE
);

-- Settings table for configuration (model costs, etc.)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One-time cleanup of legacy setting keys that no longer match any code path.
-- The DELETE is idempotent and cheap; a proper migration table would be overkill.
DELETE FROM settings WHERE key IN (
    'cost_opus_input', 'cost_opus_output',
    'cost_sonnet_input', 'cost_sonnet_output',
    'cost_haiku_input', 'cost_haiku_output',
    'cost_ollama_input', 'cost_ollama_output',
    'cache_read_multiplier_ollama', 'cache_write_multiplier_ollama'
);

-- Default model costs (per 1M tokens in USD) - exact model IDs
-- Key format: cost_{model_id}_{input|output}
INSERT OR IGNORE INTO settings (key, value) VALUES
    -- OpenAI GPT-5.2
    ('cost_gpt-5.2_input', '1.75'),
    ('cost_gpt-5.2_output', '14.00'),
    -- OpenAI GPT-5.1
    ('cost_gpt-5.1_input', '1.25'),
    ('cost_gpt-5.1_output', '10.00'),
    -- OpenAI GPT-5
    ('cost_gpt-5_input', '1.25'),
    ('cost_gpt-5_output', '10.00'),
    -- Anthropic Opus 4.6
    ('cost_claude-opus-4-6_input', '5.00'),
    ('cost_claude-opus-4-6_output', '25.00'),
    -- Anthropic Opus 4.5
    ('cost_claude-opus-4-5_input', '5.00'),
    ('cost_claude-opus-4-5_output', '25.00'),
    -- Anthropic Sonnet 4.6
    ('cost_claude-sonnet-4-6_input', '3.00'),
    ('cost_claude-sonnet-4-6_output', '15.00'),
    -- Anthropic Sonnet 4.5
    ('cost_claude-sonnet-4-5_input', '3.00'),
    ('cost_claude-sonnet-4-5_output', '15.00'),
    -- Anthropic Haiku 4.5
    ('cost_claude-haiku-4-5_input', '1.00'),
    ('cost_claude-haiku-4-5_output', '5.00'),
    -- Cache pricing multipliers (relative to base input price)
    -- Anthropic: read=0.1x (90% discount), write=1.25x (25% premium for 5min TTL)
    -- OpenAI: read=0.1x (90% discount), write=1.0x (free)
    ('cache_read_multiplier_anthropic', '0.1'),
    ('cache_write_multiplier_anthropic', '1.25'),
    ('cache_read_multiplier_openai', '0.1'),
    ('cache_write_multiplier_openai', '1.0');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_request_metrics_timestamp ON request_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_request_metrics_user_email ON request_metrics(user_email);
CREATE INDEX IF NOT EXISTS idx_request_metrics_owui_instance ON request_metrics(owui_instance);
CREATE INDEX IF NOT EXISTS idx_request_metrics_conversation_id ON request_metrics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_request_metrics_model ON request_metrics(model);
CREATE INDEX IF NOT EXISTS idx_request_metrics_provider ON request_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_request_messages_request_id ON request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_request_id ON tool_calls(request_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name ON tool_calls(tool_name);

-- User memories table (per-user persistent memories across conversations)
CREATE TABLE IF NOT EXISTS user_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_memories_user_email ON user_memories(user_email);

-- Conversation summaries for compaction (rolling summaries of long conversations)
CREATE TABLE IF NOT EXISTS conversation_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    watermark INTEGER NOT NULL,
    compaction_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conv_id ON conversation_summaries(conversation_id);

-- Curation events: one row per tool result curated within a request.
-- Lets the dashboard show how much context the within-loop curator
-- saved, and detect "thrashing" (same tool re-called after curation).
CREATE TABLE IF NOT EXISTS curation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    tool_name TEXT NOT NULL,
    iteration INTEGER DEFAULT 0,
    original_chars INTEGER DEFAULT 0,
    curated_chars INTEGER DEFAULT 0,
    chars_saved INTEGER DEFAULT 0,
    tokens_saved_estimate INTEGER DEFAULT 0,
    used_summary INTEGER DEFAULT 0,
    FOREIGN KEY (request_id) REFERENCES request_metrics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_curation_events_request_id ON curation_events(request_id);
CREATE INDEX IF NOT EXISTS idx_curation_events_tool_name ON curation_events(tool_name);

-- File Recall - Instance configuration (one per client)
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

-- File Recall - Uploaded files tracking
CREATE TABLE IF NOT EXISTS file_recall_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id TEXT NOT NULL,
    filename TEXT NOT NULL,                 -- Original filename for display
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


-- Drop legacy views that used to aggregate metrics but are unused.
DROP VIEW IF EXISTS daily_statistics;
DROP VIEW IF EXISTS hourly_statistics;
DROP VIEW IF EXISTS model_statistics;
DROP VIEW IF EXISTS tool_statistics;
