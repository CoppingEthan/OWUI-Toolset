/**
 * Database Manager for OWUI Toolset V2
 * Version 2.0 - Dashboard Overhaul
 * Handles all database operations for metrics, messages, and tool calls
 * Using sql.js (pure JavaScript, no native compilation needed)
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
    this._saveTimer = null;
    this._saveIntervalMs = 1000; // Throttle saves to once per second
    this._pendingSave = false;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize SQL.js
    this.SQL = await initSqlJs();

    // Load existing database or create new one
    const dbExists = fs.existsSync(this.dbPath);
    if (dbExists) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(buffer);
      console.log(`📂 Loaded existing database: ${this.dbPath}`);
    } else {
      this.db = new this.SQL.Database();
      console.log(`📂 Created new database: ${this.dbPath}`);
    }

    // Load and execute schema (CREATE IF NOT EXISTS - safe for existing DBs)
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);

    // Always save after schema to ensure tables exist on disk
    this.save();

    // Log current row count for debugging
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM request_metrics');
    stmt.step();
    const count = stmt.getAsObject().count;
    stmt.free();
    console.log(`✓ Database initialized (${count} existing records)`);
  }

  /**
   * Save database to disk immediately
   */
  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
    this._pendingSave = false;
  }

  /**
   * Save database to disk with throttling (max once per _saveIntervalMs)
   * This prevents excessive disk writes when multiple inserts happen in quick succession
   */
  saveThrottled() {
    this._pendingSave = true;
    if (this._saveTimer) {
      return; // Already scheduled
    }
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      if (this._pendingSave) {
        this.save();
      }
    }, this._saveIntervalMs);
  }

  /**
   * Flush any pending saves immediately (call before shutdown)
   */
  flush() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    if (this._pendingSave) {
      this.save();
    }
  }

  /**
   * Reload database from disk (for reading fresh data written by other processes)
   */
  reload() {
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      if (this.db) {
        this.db.close();
      }
      this.db = new this.SQL.Database(buffer);

      // Ensure schema exists after reload (CREATE IF NOT EXISTS is safe)
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSERT METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Insert a new request metric and return the inserted ID
   * @param {Object} metric - Request metric data
   * @returns {number} The inserted request ID
   */
  insertRequestMetric(metric) {
    const stmt = this.db.prepare(`
      INSERT INTO request_metrics (
        conversation_id, user_email, owui_instance,
        model, provider,
        input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens,
        cost, status, error_message, response_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      metric.conversation_id,
      metric.user_email,
      metric.owui_instance,
      metric.model,
      metric.provider,
      metric.input_tokens || 0,
      metric.output_tokens || 0,
      metric.cache_read_tokens || 0,
      metric.cache_creation_tokens || 0,
      metric.cost || 0,
      metric.status || 'completed',
      metric.error_message || null,
      metric.response_time_ms || 0
    ]);

    stmt.free();

    // Get the last inserted row ID
    const idStmt = this.db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const requestId = idStmt.getAsObject().id;
    idStmt.free();

    this.saveThrottled();
    return requestId;
  }

  /**
   * Insert a request message (user input or assistant response)
   * @param {number} requestId - The parent request ID
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - The message content
   */
  insertRequestMessage(requestId, role, content) {
    const stmt = this.db.prepare(`
      INSERT INTO request_messages (request_id, role, content)
      VALUES (?, ?, ?)
    `);

    stmt.run([requestId, role, content]);
    stmt.free();
    this.saveThrottled();
  }

  /**
   * Insert a tool call record
   * @param {number} requestId - The parent request ID
   * @param {Object} toolCall - Tool call data
   */
  insertToolCall(requestId, toolCall) {
    const stmt = this.db.prepare(`
      INSERT INTO tool_calls (
        request_id, tool_name, tool_params, tool_result,
        success, error_message, execution_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      requestId,
      toolCall.tool_name,
      typeof toolCall.tool_params === 'string' ? toolCall.tool_params : JSON.stringify(toolCall.tool_params),
      toolCall.tool_result || null,
      toolCall.success !== false ? 1 : 0,
      toolCall.error_message || null,
      toolCall.execution_time_ms || 0
    ]);

    stmt.free();
    this.saveThrottled();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get recent requests (for live table)
   * @param {number} limit - Max number of requests to return
   * @param {string} domain - Optional domain filter
   * @param {string} timeRange - Optional time range filter ('1h', '24h', '7d', '30d', '1y')
   */
  getRecentRequests(limit = 100, domain = null, timeRange = null) {
    const whereClauses = [];
    const params = [];

    // Time range filter
    if (timeRange) {
      let timeFilter;
      switch (timeRange) {
        case '1h':
          timeFilter = "timestamp >= datetime('now', '-1 hour')";
          break;
        case '24h':
          timeFilter = "timestamp >= datetime('now', '-24 hours')";
          break;
        case '7d':
          timeFilter = "timestamp >= datetime('now', '-7 days')";
          break;
        case '30d':
          timeFilter = "timestamp >= datetime('now', '-30 days')";
          break;
        case '1y':
          timeFilter = "timestamp >= datetime('now', '-1 year')";
          break;
        default:
          timeFilter = null;
      }
      if (timeFilter) {
        whereClauses.push(timeFilter);
      }
    }

    // Domain filter
    if (domain) {
      whereClauses.push("user_email LIKE '%@' || ?");
      params.push(domain);
    }

    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const stmt = this.db.prepare(`
      SELECT
        r.id,
        r.timestamp,
        r.conversation_id,
        r.user_email,
        r.owui_instance,
        r.model,
        r.provider,
        r.input_tokens,
        r.output_tokens,
        r.cache_read_tokens,
        r.cache_creation_tokens,
        r.cost,
        r.status,
        r.response_time_ms,
        (SELECT COUNT(*) FROM tool_calls WHERE request_id = r.id) as tool_count
      FROM request_metrics r
      ${whereClause}
      ORDER BY r.timestamp DESC
      LIMIT ?
    `);

    params.push(limit);
    stmt.bind(params);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  /**
   * Get messages for a specific request
   * @param {number} requestId - The request ID
   */
  getRequestMessages(requestId) {
    const stmt = this.db.prepare(`
      SELECT id, role, content, timestamp
      FROM request_messages
      WHERE request_id = ?
      ORDER BY id ASC
    `);

    stmt.bind([requestId]);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  /**
   * Get tool calls for a specific request
   * @param {number} requestId - The request ID
   */
  getToolCalls(requestId) {
    const stmt = this.db.prepare(`
      SELECT id, tool_name, tool_params, tool_result,
             success, error_message, execution_time_ms, timestamp
      FROM tool_calls
      WHERE request_id = ?
      ORDER BY id ASC
    `);

    stmt.bind([requestId]);

    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      // Parse tool_params if it's JSON
      try {
        row.tool_params = JSON.parse(row.tool_params);
      } catch (e) {
        // Keep as string if not valid JSON
      }
      rows.push(row);
    }

    stmt.free();
    return rows;
  }

  /**
   * Get tool call count for a request
   * @param {number} requestId - The request ID
   */
  getToolCallCount(requestId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM tool_calls WHERE request_id = ?
    `);
    stmt.bind([requestId]);
    stmt.step();
    const count = stmt.getAsObject().count;
    stmt.free();
    return count;
  }

  /**
   * Get statistics for a time range
   * @param {string} timeRange - '1h', '24h', '7d', '30d', '1y'
   * @param {string} [domain] - Optional email domain filter
   */
  getStatistics(timeRange, domain) {
    const whereClauses = ["status = 'completed'"];
    const params = [];

    switch (timeRange) {
      case '1h':
        whereClauses.push("timestamp >= datetime('now', '-1 hour')");
        break;
      case '24h':
        whereClauses.push("timestamp >= datetime('now', '-24 hours')");
        break;
      case '7d':
        whereClauses.push("timestamp >= datetime('now', '-7 days')");
        break;
      case '30d':
        whereClauses.push("timestamp >= datetime('now', '-30 days')");
        break;
      case '1y':
        whereClauses.push("timestamp >= datetime('now', '-1 year')");
        break;
    }

    if (domain) {
      whereClauses.push("user_email LIKE '%@' || ?");
      params.push(domain);
    }

    const whereSQL = 'WHERE ' + whereClauses.join(' AND ');

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cache_read_tokens) as total_cache_read_tokens,
        SUM(cache_creation_tokens) as total_cache_creation_tokens,
        SUM(cost) as total_cost,
        AVG(response_time_ms) as avg_response_time
      FROM request_metrics
      ${whereSQL}
    `);

    if (params.length > 0) stmt.bind(params);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();

    return result;
  }

  /**
   * Get token usage over time BY MODEL for charts
   * @param {string} timeRange - '1h', '24h', '7d', '30d', '1y'
   */
  getTokenUsageTimeSeries(timeRange) {
    let dateFormat, timeFilter;

    switch (timeRange) {
      case '1h':
        dateFormat = "STRFTIME('%Y-%m-%d %H:', timestamp) || PRINTF('%02d', (CAST(STRFTIME('%M', timestamp) AS INTEGER) / 5) * 5)";
        timeFilter = "timestamp >= datetime('now', '-1 hour')";
        break;
      case '24h':
        dateFormat = "STRFTIME('%Y-%m-%d %H:00', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-24 hours')";
        break;
      case '7d':
        dateFormat = "STRFTIME('%Y-%m-%d', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        dateFormat = "STRFTIME('%Y-%m-%d', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-30 days')";
        break;
      case '1y':
        dateFormat = "STRFTIME('%Y-%m', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-1 year')";
        break;
      default:
        dateFormat = "STRFTIME('%Y-%m-%d', timestamp)";
        timeFilter = '1=1';
    }

    // Get data grouped by time bucket AND model with input/output separated
    const stmt = this.db.prepare(`
      SELECT
        ${dateFormat} as time_bucket,
        model,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(cost) as cost
      FROM request_metrics
      WHERE ${timeFilter}
      AND status = 'completed'
      GROUP BY time_bucket, model
      ORDER BY time_bucket ASC, model ASC
    `);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  /**
   * Get usage statistics by model
   */
  getUsageByModel() {
    const stmt = this.db.prepare(`
      SELECT
        model,
        provider,
        COUNT(*) as usage_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost) as total_cost
      FROM request_metrics
      WHERE status = 'completed'
      GROUP BY model, provider
      ORDER BY usage_count DESC
    `);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  /**
   * Get usage by OWUI instance
   */
  getUsageByInstance() {
    const stmt = this.db.prepare(`
      SELECT
        owui_instance,
        COUNT(*) as total_requests,
        SUM(input_tokens + output_tokens) as total_tokens,
        SUM(cost) as total_cost
      FROM request_metrics
      WHERE status = 'completed'
      GROUP BY owui_instance
      ORDER BY total_cost DESC
    `);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  /**
   * Get tool usage statistics from tool_calls table
   * @param {string} [domain] - Optional email domain filter
   */
  getToolUsageStatistics(domain) {
    const params = [];
    let domainJoin = '';
    let domainFilter = '';

    if (domain) {
      domainJoin = 'JOIN request_metrics rm ON tool_calls.request_id = rm.id';
      domainFilter = "AND rm.user_email LIKE '%@' || ?";
      params.push(domain);
    }

    const stmt = this.db.prepare(`
      SELECT
        tool_name as tool,
        COUNT(*) as count,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count,
        AVG(execution_time_ms) as avg_execution_time
      FROM tool_calls
      ${domainJoin}
      WHERE 1=1 ${domainFilter}
      GROUP BY tool_name
      ORDER BY count DESC
    `);

    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  /**
   * Get total tool call count
   * @param {string} [domain] - Optional email domain filter
   */
  getTotalToolCalls(domain) {
    const params = [];
    let domainJoin = '';
    let domainFilter = '';

    if (domain) {
      domainJoin = 'JOIN request_metrics rm ON tool_calls.request_id = rm.id';
      domainFilter = "AND rm.user_email LIKE '%@' || ?";
      params.push(domain);
    }

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM tool_calls
      ${domainJoin}
      WHERE 1=1 ${domainFilter}
    `);

    if (params.length > 0) stmt.bind(params);
    stmt.step();
    const count = stmt.getAsObject().count;
    stmt.free();
    return count;
  }

  /**
   * Get list of unique models used
   */
  getUniqueModels() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT model FROM request_metrics ORDER BY model
    `);

    const models = [];
    while (stmt.step()) {
      models.push(stmt.getAsObject().model);
    }

    stmt.free();
    return models;
  }

  /**
   * Get recent conversations with aggregated metrics
   * @param {number} limit - Max number of conversations to return
   * @param {string} domain - Optional domain filter
   * @param {string} timeRange - Optional time range filter
   */
  getRecentConversations(limit = 50, domain = null, timeRange = null) {
    const whereClauses = [];
    const params = [];

    // Time range filter (based on last activity)
    if (timeRange) {
      let timeFilter;
      switch (timeRange) {
        case '1h':
          timeFilter = "MAX(timestamp) >= datetime('now', '-1 hour')";
          break;
        case '24h':
          timeFilter = "MAX(timestamp) >= datetime('now', '-24 hours')";
          break;
        case '7d':
          timeFilter = "MAX(timestamp) >= datetime('now', '-7 days')";
          break;
        case '30d':
          timeFilter = "MAX(timestamp) >= datetime('now', '-30 days')";
          break;
        case '1y':
          timeFilter = "MAX(timestamp) >= datetime('now', '-1 year')";
          break;
        default:
          timeFilter = null;
      }
      if (timeFilter) {
        whereClauses.push(timeFilter);
      }
    }

    // Domain filter
    if (domain) {
      whereClauses.push("user_email LIKE '%@' || ?");
      params.push(domain);
    }

    const havingClause = whereClauses.length > 0 ? 'HAVING ' + whereClauses.join(' AND ') : '';

    const stmt = this.db.prepare(`
      SELECT
        conversation_id,
        user_email,
        owui_instance,
        MIN(timestamp) as first_activity,
        MAX(timestamp) as last_activity,
        COUNT(*) as total_requests,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cache_read_tokens) as total_cache_read_tokens,
        SUM(cache_creation_tokens) as total_cache_creation_tokens,
        SUM(cost) as total_cost,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) as failed_requests,
        (SELECT COUNT(DISTINCT tool_name) FROM tool_calls tc
         JOIN request_metrics rm ON tc.request_id = rm.id
         WHERE rm.conversation_id = request_metrics.conversation_id) as unique_tools_used,
        (SELECT COUNT(*) FROM tool_calls tc
         JOIN request_metrics rm ON tc.request_id = rm.id
         WHERE rm.conversation_id = request_metrics.conversation_id) as total_tool_calls
      FROM request_metrics
      GROUP BY conversation_id, user_email, owui_instance
      ${havingClause}
      ORDER BY last_activity DESC
      LIMIT ?
    `);

    params.push(limit);
    stmt.bind(params);

    const conversations = [];
    while (stmt.step()) {
      conversations.push(stmt.getAsObject());
    }

    stmt.free();
    return conversations;
  }

  /**
   * Get all requests for a specific conversation
   * @param {string} conversationId - The conversation ID
   */
  getConversationRequests(conversationId) {
    const stmt = this.db.prepare(`
      SELECT
        r.id,
        r.timestamp,
        r.conversation_id,
        r.user_email,
        r.owui_instance,
        r.model,
        r.provider,
        r.input_tokens,
        r.output_tokens,
        r.cache_read_tokens,
        r.cache_creation_tokens,
        r.cost,
        r.status,
        r.error_message,
        r.response_time_ms,
        (SELECT COUNT(*) FROM tool_calls WHERE request_id = r.id) as tool_count
      FROM request_metrics r
      WHERE r.conversation_id = ?
      ORDER BY r.timestamp ASC
    `);

    stmt.bind([conversationId]);

    const requests = [];
    while (stmt.step()) {
      requests.push(stmt.getAsObject());
    }

    stmt.free();
    return requests;
  }

  /**
   * Get list of unique email domains (extracted from user_email) with counts
   */
  getUniqueDomains() {
    const stmt = this.db.prepare(`
      SELECT
        CASE
          WHEN INSTR(user_email, '@') > 0
          THEN SUBSTR(user_email, INSTR(user_email, '@') + 1)
          ELSE user_email
        END as domain,
        COUNT(*) as count
      FROM request_metrics
      WHERE user_email IS NOT NULL AND user_email != ''
      GROUP BY domain
      ORDER BY count DESC, domain ASC
    `);

    const domains = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.domain && row.domain.trim()) {
        domains.push({
          domain: row.domain,
          count: row.count
        });
      }
    }

    stmt.free();
    return domains;
  }

  /**
   * Get token usage time series filtered by domain
   */
  getTokenUsageTimeSeriesByDomain(timeRange, domain = null) {
    let dateFormat, timeFilter;

    switch (timeRange) {
      case '1h':
        dateFormat = "STRFTIME('%Y-%m-%d %H:', timestamp) || PRINTF('%02d', (CAST(STRFTIME('%M', timestamp) AS INTEGER) / 5) * 5)";
        timeFilter = "timestamp >= datetime('now', '-1 hour')";
        break;
      case '24h':
        dateFormat = "STRFTIME('%Y-%m-%d %H:00', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-24 hours')";
        break;
      case '7d':
        dateFormat = "STRFTIME('%Y-%m-%d', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        dateFormat = "STRFTIME('%Y-%m-%d', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-30 days')";
        break;
      case '1y':
        dateFormat = "STRFTIME('%Y-%m', timestamp)";
        timeFilter = "timestamp >= datetime('now', '-1 year')";
        break;
      default:
        dateFormat = "STRFTIME('%Y-%m-%d', timestamp)";
        timeFilter = '1=1';
    }

    let domainFilter = '';
    const params = [];
    if (domain) {
      domainFilter = "AND user_email LIKE '%@' || ?";
      params.push(domain);
    }

    const stmt = this.db.prepare(`
      SELECT
        ${dateFormat} as time_bucket,
        model,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(cost) as cost
      FROM request_metrics
      WHERE ${timeFilter}
      AND status = 'completed'
      ${domainFilter}
      GROUP BY time_bucket, model
      ORDER BY time_bucket ASC, model ASC
    `);

    if (params.length > 0) {
      stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAINTENANCE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clean old data based on retention policy
   * @param {number} retentionDays - Number of days to retain data
   */
  cleanOldData(retentionDays) {
    // Delete old tool calls first (foreign key)
    this.db.run(`
      DELETE FROM tool_calls
      WHERE request_id IN (
        SELECT id FROM request_metrics
        WHERE timestamp < datetime('now', '-' || ? || ' days')
      )
    `, [retentionDays]);

    // Delete old messages (foreign key)
    this.db.run(`
      DELETE FROM request_messages
      WHERE request_id IN (
        SELECT id FROM request_metrics
        WHERE timestamp < datetime('now', '-' || ? || ' days')
      )
    `, [retentionDays]);

    // Delete old metrics
    const stmt = this.db.prepare(`
      DELETE FROM request_metrics
      WHERE timestamp < datetime('now', '-' || ? || ' days')
    `);

    stmt.run([retentionDays]);
    const changes = this.db.getRowsModified();
    stmt.free();

    this.save();
    return changes;
  }

  /**
   * Clear all data from all tables
   */
  clearAllData() {
    // Delete in order to respect foreign keys
    this.db.run('DELETE FROM tool_calls');
    const toolsDeleted = this.db.getRowsModified();

    this.db.run('DELETE FROM request_messages');
    const messagesDeleted = this.db.getRowsModified();

    this.db.run('DELETE FROM request_metrics');
    const metricsDeleted = this.db.getRowsModified();

    // Clear conversation summaries (compaction cache)
    this.db.run('DELETE FROM conversation_summaries');

    // Vacuum to reclaim space
    this.db.run('VACUUM');

    this.save();

    console.log(`🗑️ Cleared ${metricsDeleted} metrics, ${messagesDeleted} messages, ${toolsDeleted} tool calls`);
    return { metricsDeleted, messagesDeleted, toolsDeleted };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get a setting value by key
   * @param {string} key - Setting key
   * @returns {string|null} Setting value or null if not found
   */
  getSetting(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind([key]);
    let value = null;
    if (stmt.step()) {
      value = stmt.getAsObject().value;
    }
    stmt.free();
    return value;
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   */
  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run([key, value, value]);
    stmt.free();
    this.save();
  }

  /**
   * Get all settings
   * @returns {Object} Key-value object of all settings
   */
  getAllSettings() {
    const stmt = this.db.prepare('SELECT key, value FROM settings ORDER BY key');
    const settings = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      settings[row.key] = row.value;
    }
    stmt.free();
    return settings;
  }

  /**
   * Get all model cost settings
   * @returns {Object} Cost settings organized by model pattern
   */
  getModelCosts() {
    const stmt = this.db.prepare("SELECT key, value FROM settings WHERE key LIKE 'cost_%' ORDER BY key");
    const costs = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      // Parse key: cost_{pattern}_{input|output}
      const match = row.key.match(/^cost_(.+)_(input|output)$/);
      if (match) {
        const pattern = match[1];
        const type = match[2];
        if (!costs[pattern]) {
          costs[pattern] = { input: 0, output: 0 };
        }
        costs[pattern][type] = parseFloat(row.value) || 0;
      }
    }
    stmt.free();
    return costs;
  }

  /**
   * Set a model cost
   * @param {string} pattern - Model pattern (e.g., 'gpt-5', 'sonnet', 'ollama')
   * @param {number} inputCost - Input cost per 1M tokens
   * @param {number} outputCost - Output cost per 1M tokens
   */
  setModelCost(pattern, inputCost, outputCost) {
    this.setSetting(`cost_${pattern}_input`, inputCost.toString());
    this.setSetting(`cost_${pattern}_output`, outputCost.toString());
  }

  /**
   * Get cache pricing multipliers
   * @returns {Object} Cache multipliers by provider
   */
  getCacheMultipliers() {
    return {
      anthropic: {
        read: parseFloat(this.getSetting('cache_read_multiplier_anthropic')) || 0.1,
        write: parseFloat(this.getSetting('cache_write_multiplier_anthropic')) || 1.25
      },
      openai: {
        read: parseFloat(this.getSetting('cache_read_multiplier_openai')) || 0.1,
        write: parseFloat(this.getSetting('cache_write_multiplier_openai')) || 1.0
      }
    };
  }

  /**
   * Get cache statistics for a time range
   * @param {string} timeRange - '1h', '24h', '7d', '30d', '1y'
   * @returns {Object} Cache statistics by provider
   */
  getCacheStatistics(timeRange) {
    let whereClause = '';

    switch (timeRange) {
      case '1h':
        whereClause = "WHERE timestamp >= datetime('now', '-1 hour')";
        break;
      case '24h':
        whereClause = "WHERE timestamp >= datetime('now', '-24 hours')";
        break;
      case '7d':
        whereClause = "WHERE timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        whereClause = "WHERE timestamp >= datetime('now', '-30 days')";
        break;
      case '1y':
        whereClause = "WHERE timestamp >= datetime('now', '-1 year')";
        break;
      default:
        whereClause = '';
    }

    const statusFilter = whereClause ? `${whereClause} AND status = 'completed'` : "WHERE status = 'completed'";

    const stmt = this.db.prepare(`
      SELECT
        provider,
        SUM(cache_read_tokens) as total_cache_reads,
        SUM(cache_creation_tokens) as total_cache_writes,
        SUM(input_tokens) as total_input_tokens
      FROM request_metrics
      ${statusFilter}
      GROUP BY provider
    `);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER MEMORY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all memories for a user
   * @param {string} userEmail
   * @returns {Array<{id: number, content: string, created_at: string, updated_at: string}>}
   */
  getMemories(userEmail) {
    const stmt = this.db.prepare(`
      SELECT id, content, created_at, updated_at
      FROM user_memories
      WHERE user_email = ?
      ORDER BY created_at ASC
    `);
    stmt.bind([userEmail]);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /**
   * Get total character count of all memories for a user
   * @param {string} userEmail
   * @returns {number}
   */
  getMemoryCharCount(userEmail) {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(LENGTH(content)), 0) as total_chars
      FROM user_memories
      WHERE user_email = ?
    `);
    stmt.bind([userEmail]);
    stmt.step();
    const result = stmt.getAsObject().total_chars;
    stmt.free();
    return result;
  }

  /**
   * Get a single memory by ID with ownership check
   * @param {number} memoryId
   * @param {string} userEmail
   * @returns {Object|null}
   */
  getMemoryById(memoryId, userEmail) {
    const stmt = this.db.prepare(`
      SELECT id, content, created_at, updated_at
      FROM user_memories
      WHERE id = ? AND user_email = ?
    `);
    stmt.bind([memoryId, userEmail]);

    let memory = null;
    if (stmt.step()) {
      memory = stmt.getAsObject();
    }
    stmt.free();
    return memory;
  }

  /**
   * Create a new memory for a user
   * @param {string} userEmail
   * @param {string} content
   * @returns {number} The new memory ID
   */
  createMemory(userEmail, content) {
    const stmt = this.db.prepare(`
      INSERT INTO user_memories (user_email, content)
      VALUES (?, ?)
    `);
    stmt.run([userEmail, content]);
    stmt.free();

    const idStmt = this.db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const memoryId = idStmt.getAsObject().id;
    idStmt.free();

    this.saveThrottled();
    return memoryId;
  }

  /**
   * Update an existing memory with ownership check
   * @param {number} memoryId
   * @param {string} userEmail
   * @param {string} content
   * @returns {boolean} True if updated
   */
  updateMemory(memoryId, userEmail, content) {
    const stmt = this.db.prepare(`
      UPDATE user_memories
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_email = ?
    `);
    stmt.run([content, memoryId, userEmail]);
    stmt.free();

    const changes = this.db.getRowsModified();
    if (changes > 0) {
      this.saveThrottled();
    }
    return changes > 0;
  }

  /**
   * Delete a memory with ownership check
   * @param {number} memoryId
   * @param {string} userEmail
   * @returns {boolean} True if deleted
   */
  deleteMemory(memoryId, userEmail) {
    const stmt = this.db.prepare(`
      DELETE FROM user_memories
      WHERE id = ? AND user_email = ?
    `);
    stmt.run([memoryId, userEmail]);
    stmt.free();

    const changes = this.db.getRowsModified();
    if (changes > 0) {
      this.saveThrottled();
    }
    return changes > 0;
  }

  // ═══════════════════════════════════════════════════════════
  // Conversation Summaries (compaction)
  // ═══════════════════════════════════════════════════════════

  /**
   * Get cached summary for a conversation
   * @param {string} conversationId
   * @returns {object|null} - { id, conversation_id, summary, watermark, compaction_count, ... }
   */
  getSummary(conversationId) {
    const stmt = this.db.prepare(
      'SELECT * FROM conversation_summaries WHERE conversation_id = ?'
    );
    stmt.bind([conversationId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  /**
   * Insert or update a conversation summary
   * @param {string} conversationId
   * @param {string} summary - The compacted summary text
   * @param {number} watermark - Number of conversation messages covered by this summary
   */
  upsertSummary(conversationId, summary, watermark) {
    const existing = this.getSummary(conversationId);
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE conversation_summaries
        SET summary = ?, watermark = ?,
            compaction_count = compaction_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ?
      `);
      stmt.run([summary, watermark, conversationId]);
      stmt.free();
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO conversation_summaries (conversation_id, summary, watermark)
        VALUES (?, ?, ?)
      `);
      stmt.run([conversationId, summary, watermark]);
      stmt.free();
    }
    this.saveThrottled();
  }

  // ═══════════════════════════════════════════════════════════
  // File Recall Methods
  // ═══════════════════════════════════════════════════════════

  getFileRecallInstance(id) {
    const stmt = this.db.prepare('SELECT * FROM file_recall_instances WHERE id = ?');
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  getFileRecallInstances() {
    const stmt = this.db.prepare('SELECT * FROM file_recall_instances ORDER BY created_at DESC');
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  getFileRecallInstanceByToken(token) {
    const stmt = this.db.prepare('SELECT * FROM file_recall_instances WHERE access_token = ?');
    stmt.bind([token]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  createFileRecallInstance(id, name, apiKey, token) {
    const stmt = this.db.prepare(`
      INSERT INTO file_recall_instances (id, name, openai_api_key, access_token)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([id, name, apiKey, token]);
    stmt.free();
    this.save();
    return this.getFileRecallInstance(id);
  }

  updateFileRecallInstance(id, updates) {
    const fields = [];
    const values = [];
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.openai_api_key !== undefined) { fields.push('openai_api_key = ?'); values.push(updates.openai_api_key); }
    if (fields.length === 0) return false;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = this.db.prepare(`UPDATE file_recall_instances SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(values);
    stmt.free();
    this.save();
    return this.db.getRowsModified() > 0;
  }

  deleteFileRecallInstance(id) {
    // Files are cascade-deleted by FK, but we do it explicitly for the count
    this.db.run('DELETE FROM file_recall_files WHERE instance_id = ?', [id]);
    const stmt = this.db.prepare('DELETE FROM file_recall_instances WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    const deleted = this.db.getRowsModified() > 0;
    this.save();
    return deleted;
  }

  updateVectorStoreId(instanceId, vectorStoreId) {
    const stmt = this.db.prepare(`
      UPDATE file_recall_instances
      SET vector_store_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run([vectorStoreId, instanceId]);
    stmt.free();
    this.save();
  }

  getFileRecallFiles(instanceId) {
    const stmt = this.db.prepare(`
      SELECT * FROM file_recall_files
      WHERE instance_id = ?
      ORDER BY uploaded_at DESC
    `);
    stmt.bind([instanceId]);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  getFileRecallFileByHash(instanceId, hash) {
    const stmt = this.db.prepare(`
      SELECT * FROM file_recall_files
      WHERE instance_id = ? AND file_hash = ?
    `);
    stmt.bind([instanceId, hash]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  getFileRecallFileById(instanceId, fileId) {
    const stmt = this.db.prepare(`
      SELECT * FROM file_recall_files
      WHERE instance_id = ? AND id = ?
    `);
    stmt.bind([instanceId, fileId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  insertFileRecallFile(instanceId, filename, storageName, hash, size, mimeType) {
    const stmt = this.db.prepare(`
      INSERT INTO file_recall_files (instance_id, filename, storage_name, file_hash, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([instanceId, filename, storageName, hash, size, mimeType]);
    stmt.free();
    const idStmt = this.db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const fileId = idStmt.getAsObject().id;
    idStmt.free();
    this.saveThrottled();
    return fileId;
  }

  updateFileRecallFileStatus(fileId, status, errorMessage, openaiFileId, vsFileId) {
    const stmt = this.db.prepare(`
      UPDATE file_recall_files
      SET status = ?, error_message = ?, openai_file_id = ?, openai_vs_file_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run([status, errorMessage || null, openaiFileId || null, vsFileId || null, fileId]);
    stmt.free();
    this.saveThrottled();
  }

  deleteFileRecallFile(instanceId, fileId) {
    const stmt = this.db.prepare('DELETE FROM file_recall_files WHERE instance_id = ? AND id = ?');
    stmt.run([instanceId, fileId]);
    stmt.free();
    const deleted = this.db.getRowsModified() > 0;
    if (deleted) this.saveThrottled();
    return deleted;
  }

  updateFileRecallInstanceStats(instanceId) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as file_count, COALESCE(SUM(file_size), 0) as total_size_bytes
      FROM file_recall_files
      WHERE instance_id = ? AND status != 'error'
    `);
    stmt.bind([instanceId]);
    stmt.step();
    const stats = stmt.getAsObject();
    stmt.free();

    const updateStmt = this.db.prepare(`
      UPDATE file_recall_instances
      SET file_count = ?, total_size_bytes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run([stats.file_count, stats.total_size_bytes, instanceId]);
    updateStmt.free();
    this.saveThrottled();
    return stats;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.flush(); // Ensure any pending saves are written
      this.db.close();
      console.log('✓ Database connection closed');
    }
  }
}

export default DatabaseManager;
