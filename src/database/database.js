/**
 * Database Manager (sql.js wrapper)
 *
 * In-memory SQLite with throttled writes to disk. Used as a singleton —
 * see src/database/instance.js.
 *
 * Saves are throttled to once per second; call flush() before shutdown.
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
    this._saveIntervalMs = 1000;
    this._pendingSave = false;
  }

  async initialize() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    this.SQL = await initSqlJs();

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(buffer);
      console.log(`📂 Loaded existing database: ${this.dbPath}`);
    } else {
      this.db = new this.SQL.Database();
      console.log(`📂 Created new database: ${this.dbPath}`);
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
    this.save();

    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM request_metrics');
    stmt.step();
    const count = stmt.getAsObject().count;
    stmt.free();
    console.log(`✓ Database initialized (${count} existing records)`);
  }

  save() {
    if (!this.db) return;
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
    this._pendingSave = false;
  }

  saveThrottled() {
    this._pendingSave = true;
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      if (this._pendingSave) this.save();
    }, this._saveIntervalMs);
  }

  flush() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    if (this._pendingSave) this.save();
  }

  close() {
    if (this.db) {
      this.flush();
      this.db.close();
      this.db = null;
      console.log('✓ Database connection closed');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Request metrics / messages / tool calls
  // ═══════════════════════════════════════════════════════════════════════════

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
      metric.response_time_ms || 0,
    ]);
    stmt.free();

    const idStmt = this.db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const requestId = idStmt.getAsObject().id;
    idStmt.free();

    this.saveThrottled();
    return requestId;
  }

  insertRequestMessage(requestId, role, content) {
    const stmt = this.db.prepare(`
      INSERT INTO request_messages (request_id, role, content) VALUES (?, ?, ?)
    `);
    stmt.run([requestId, role, content]);
    stmt.free();
    this.saveThrottled();
  }

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
      toolCall.execution_time_ms || 0,
    ]);
    stmt.free();
    this.saveThrottled();
  }

  getRequestMessages(requestId) {
    const stmt = this.db.prepare(`
      SELECT id, role, content, timestamp FROM request_messages
      WHERE request_id = ? ORDER BY id ASC
    `);
    stmt.bind([requestId]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  getToolCalls(requestId) {
    const stmt = this.db.prepare(`
      SELECT id, tool_name, tool_params, tool_result,
             success, error_message, execution_time_ms, timestamp
      FROM tool_calls WHERE request_id = ? ORDER BY id ASC
    `);
    stmt.bind([requestId]);
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      try { row.tool_params = JSON.parse(row.tool_params); } catch {}
      rows.push(row);
    }
    stmt.free();
    return rows;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Dashboard aggregates
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Maps a dashboard timeRange value to a SQLite datetime() expression.
   * Returns null for 'all' or unknown values.
   */
  _timeFilter(timeRange) {
    switch (timeRange) {
      case '1h':  return "datetime('now', '-1 hour')";
      case '24h': return "datetime('now', '-24 hours')";
      case '7d':  return "datetime('now', '-7 days')";
      case '30d': return "datetime('now', '-30 days')";
      case '1y':  return "datetime('now', '-1 year')";
      default:    return null;
    }
  }

  /**
   * Time-bucket SQL fragment for timeseries charts.
   */
  _bucketFormat(timeRange) {
    switch (timeRange) {
      case '1h':
        return "STRFTIME('%Y-%m-%d %H:', timestamp) || PRINTF('%02d', (CAST(STRFTIME('%M', timestamp) AS INTEGER) / 5) * 5)";
      case '24h':
        return "STRFTIME('%Y-%m-%d %H:00', timestamp)";
      case '1y':
        return "STRFTIME('%Y-%m', timestamp)";
      default:
        return "STRFTIME('%Y-%m-%d', timestamp)";
    }
  }

  getStatistics(timeRange, domain) {
    const whereClauses = ["status = 'completed'"];
    const params = [];
    const tf = this._timeFilter(timeRange);
    if (tf) whereClauses.push(`timestamp >= ${tf}`);
    if (domain) {
      whereClauses.push("user_email LIKE '%@' || ?");
      params.push(domain);
    }

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(input_tokens + cache_creation_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cache_read_tokens) as total_cache_read_tokens,
        SUM(cache_creation_tokens) as total_cache_creation_tokens,
        SUM(cost) as total_cost,
        AVG(response_time_ms) as avg_response_time
      FROM request_metrics
      WHERE ${whereClauses.join(' AND ')}
    `);
    if (params.length) stmt.bind(params);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }

  getUsageByModel() {
    const stmt = this.db.prepare(`
      SELECT
        model,
        provider,
        COUNT(*) as usage_count,
        SUM(input_tokens + cache_creation_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost) as total_cost
      FROM request_metrics
      WHERE status = 'completed'
      GROUP BY model, provider
      ORDER BY usage_count DESC
    `);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

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
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

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
      SELECT COUNT(*) as count FROM tool_calls ${domainJoin} WHERE 1=1 ${domainFilter}
    `);
    if (params.length) stmt.bind(params);
    stmt.step();
    const count = stmt.getAsObject().count;
    stmt.free();
    return count;
  }

  getRecentConversations(limit = 50, domain = null, timeRange = null) {
    const havingClauses = [];
    const params = [];
    const tf = this._timeFilter(timeRange);
    if (tf) havingClauses.push(`MAX(timestamp) >= ${tf}`);
    if (domain) {
      havingClauses.push("user_email LIKE '%@' || ?");
      params.push(domain);
    }
    const havingSql = havingClauses.length ? 'HAVING ' + havingClauses.join(' AND ') : '';

    const stmt = this.db.prepare(`
      SELECT
        conversation_id,
        user_email,
        owui_instance,
        MIN(timestamp) as first_activity,
        MAX(timestamp) as last_activity,
        COUNT(*) as total_requests,
        SUM(input_tokens + cache_creation_tokens) as total_input_tokens,
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
      ${havingSql}
      ORDER BY last_activity DESC
      LIMIT ?
    `);
    params.push(limit);
    stmt.bind(params);
    const conversations = [];
    while (stmt.step()) conversations.push(stmt.getAsObject());
    stmt.free();
    return conversations;
  }

  getConversationRequests(conversationId) {
    const stmt = this.db.prepare(`
      SELECT
        r.id, r.timestamp, r.conversation_id, r.user_email, r.owui_instance,
        r.model, r.provider,
        r.input_tokens, r.output_tokens, r.cache_read_tokens, r.cache_creation_tokens,
        r.cost, r.status, r.error_message, r.response_time_ms,
        (SELECT COUNT(*) FROM tool_calls WHERE request_id = r.id) as tool_count
      FROM request_metrics r
      WHERE r.conversation_id = ?
      ORDER BY r.timestamp ASC
    `);
    stmt.bind([conversationId]);
    const requests = [];
    while (stmt.step()) requests.push(stmt.getAsObject());
    stmt.free();
    return requests;
  }

  getUniqueDomains() {
    const stmt = this.db.prepare(`
      SELECT
        CASE
          WHEN INSTR(user_email, '@') > 0 THEN SUBSTR(user_email, INSTR(user_email, '@') + 1)
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
        domains.push({ domain: row.domain, count: row.count });
      }
    }
    stmt.free();
    return domains;
  }

  getTokenUsageTimeSeriesByDomainGroup(timeRange, domain = null) {
    const tf = this._timeFilter(timeRange);
    const dateFormat = this._bucketFormat(timeRange);
    const timeFilter = tf ? `timestamp >= ${tf}` : '1=1';

    let domainFilter = '';
    const params = [];
    if (domain) {
      domainFilter = "AND user_email LIKE '%@' || ?";
      params.push(domain);
    }

    const stmt = this.db.prepare(`
      SELECT
        ${dateFormat} as time_bucket,
        CASE
          WHEN INSTR(user_email, '@') > 0 THEN SUBSTR(user_email, INSTR(user_email, '@') + 1)
          ELSE user_email
        END as domain,
        SUM(input_tokens + cache_creation_tokens) as input_tokens,
        SUM(cache_read_tokens) as cache_read_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(cost) as cost
      FROM request_metrics
      WHERE ${timeFilter}
        AND status = 'completed'
        AND user_email != ''
        ${domainFilter}
      GROUP BY time_bucket, domain
      ORDER BY time_bucket ASC, domain ASC
    `);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  getCacheStatistics(timeRange) {
    const tf = this._timeFilter(timeRange);
    const where = tf ? `WHERE timestamp >= ${tf} AND status = 'completed'` : "WHERE status = 'completed'";
    const stmt = this.db.prepare(`
      SELECT
        provider,
        SUM(cache_read_tokens) as total_cache_reads,
        SUM(cache_creation_tokens) as total_cache_writes,
        SUM(input_tokens) as total_input_tokens
      FROM request_metrics ${where}
      GROUP BY provider
    `);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Maintenance
  // ═══════════════════════════════════════════════════════════════════════════

  cleanOldData(retentionDays) {
    this.db.run(
      `DELETE FROM tool_calls WHERE request_id IN (
         SELECT id FROM request_metrics WHERE timestamp < datetime('now', '-' || ? || ' days')
       )`,
      [retentionDays]
    );
    this.db.run(
      `DELETE FROM request_messages WHERE request_id IN (
         SELECT id FROM request_metrics WHERE timestamp < datetime('now', '-' || ? || ' days')
       )`,
      [retentionDays]
    );
    const stmt = this.db.prepare(`DELETE FROM request_metrics WHERE timestamp < datetime('now', '-' || ? || ' days')`);
    stmt.run([retentionDays]);
    const changes = this.db.getRowsModified();
    stmt.free();
    this.save();
    return changes;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Settings
  // ═══════════════════════════════════════════════════════════════════════════

  getSetting(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind([key]);
    const value = stmt.step() ? stmt.getAsObject().value : null;
    stmt.free();
    return value;
  }

  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run([key, value, value]);
    stmt.free();
    this.saveThrottled();
  }

  deleteSettingsByPrefix(prefix) {
    const stmt = this.db.prepare("DELETE FROM settings WHERE key LIKE ? || '%'");
    stmt.run([prefix]);
    stmt.free();
    this.saveThrottled();
  }

  getModelCosts() {
    const stmt = this.db.prepare("SELECT key, value FROM settings WHERE key LIKE 'cost_%' ORDER BY key");
    const costs = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const match = row.key.match(/^cost_(.+)_(input|output)$/);
      if (match) {
        const pattern = match[1];
        const type = match[2];
        if (!costs[pattern]) costs[pattern] = { input: 0, output: 0 };
        costs[pattern][type] = parseFloat(row.value) || 0;
      }
    }
    stmt.free();
    return costs;
  }

  setModelCost(pattern, inputCost, outputCost) {
    this.setSetting(`cost_${pattern}_input`, inputCost.toString());
    this.setSetting(`cost_${pattern}_output`, outputCost.toString());
  }

  deleteModelCost(pattern) {
    const stmt = this.db.prepare('DELETE FROM settings WHERE key = ? OR key = ?');
    stmt.run([`cost_${pattern}_input`, `cost_${pattern}_output`]);
    stmt.free();
    this.saveThrottled();
  }

  getCacheMultipliers() {
    return {
      anthropic: {
        read:  parseFloat(this.getSetting('cache_read_multiplier_anthropic'))  || 0.1,
        write: parseFloat(this.getSetting('cache_write_multiplier_anthropic')) || 1.25,
      },
      openai: {
        read:  parseFloat(this.getSetting('cache_read_multiplier_openai'))  || 0.1,
        write: parseFloat(this.getSetting('cache_write_multiplier_openai')) || 1.0,
      },
    };
  }

  getDomainColors() {
    const stmt = this.db.prepare("SELECT key, value FROM settings WHERE key LIKE 'domain_color_%' ORDER BY key");
    const colors = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      colors[row.key.replace('domain_color_', '')] = row.value;
    }
    stmt.free();
    return colors;
  }

  setDomainColor(domain, color) {
    this.setSetting(`domain_color_${domain}`, color);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // User memories
  // ═══════════════════════════════════════════════════════════════════════════

  getMemories(userEmail) {
    const stmt = this.db.prepare(`
      SELECT id, content, created_at, updated_at
      FROM user_memories WHERE user_email = ? ORDER BY created_at ASC
    `);
    stmt.bind([userEmail]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  getMemoryCharCount(userEmail) {
    const stmt = this.db.prepare(`
      SELECT COALESCE(SUM(LENGTH(content)), 0) as total_chars
      FROM user_memories WHERE user_email = ?
    `);
    stmt.bind([userEmail]);
    stmt.step();
    const total = stmt.getAsObject().total_chars;
    stmt.free();
    return total;
  }

  getMemoryById(memoryId, userEmail) {
    const stmt = this.db.prepare(`
      SELECT id, content, created_at, updated_at
      FROM user_memories WHERE id = ? AND user_email = ?
    `);
    stmt.bind([memoryId, userEmail]);
    const memory = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return memory;
  }

  createMemory(userEmail, content) {
    const stmt = this.db.prepare('INSERT INTO user_memories (user_email, content) VALUES (?, ?)');
    stmt.run([userEmail, content]);
    stmt.free();
    const idStmt = this.db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const memoryId = idStmt.getAsObject().id;
    idStmt.free();
    this.saveThrottled();
    return memoryId;
  }

  updateMemory(memoryId, userEmail, content) {
    const stmt = this.db.prepare(`
      UPDATE user_memories SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_email = ?
    `);
    stmt.run([content, memoryId, userEmail]);
    stmt.free();
    const changes = this.db.getRowsModified();
    if (changes > 0) this.saveThrottled();
    return changes > 0;
  }

  deleteMemory(memoryId, userEmail) {
    const stmt = this.db.prepare('DELETE FROM user_memories WHERE id = ? AND user_email = ?');
    stmt.run([memoryId, userEmail]);
    stmt.free();
    const changes = this.db.getRowsModified();
    if (changes > 0) this.saveThrottled();
    return changes > 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Conversation summaries (compaction)
  // ═══════════════════════════════════════════════════════════════════════════

  getSummary(conversationId) {
    const stmt = this.db.prepare('SELECT * FROM conversation_summaries WHERE conversation_id = ?');
    stmt.bind([conversationId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  upsertSummary(conversationId, summary, watermark) {
    const existing = this.getSummary(conversationId);
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE conversation_summaries
        SET summary = ?, watermark = ?, updated_at = CURRENT_TIMESTAMP
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

  // ═══════════════════════════════════════════════════════════════════════════
  // File Recall
  // ═══════════════════════════════════════════════════════════════════════════

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
    while (stmt.step()) rows.push(stmt.getAsObject());
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
    if (!fields.length) return false;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = this.db.prepare(`UPDATE file_recall_instances SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(values);
    stmt.free();
    this.save();
    return this.db.getRowsModified() > 0;
  }

  deleteFileRecallInstance(id) {
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
      UPDATE file_recall_instances SET vector_store_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run([vectorStoreId, instanceId]);
    stmt.free();
    this.save();
  }

  getFileRecallFiles(instanceId) {
    const stmt = this.db.prepare(`
      SELECT * FROM file_recall_files WHERE instance_id = ? ORDER BY uploaded_at DESC
    `);
    stmt.bind([instanceId]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  getFileRecallFileByHash(instanceId, hash) {
    const stmt = this.db.prepare('SELECT * FROM file_recall_files WHERE instance_id = ? AND file_hash = ?');
    stmt.bind([instanceId, hash]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  getFileRecallFileById(instanceId, fileId) {
    const stmt = this.db.prepare('SELECT * FROM file_recall_files WHERE instance_id = ? AND id = ?');
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
      FROM file_recall_files WHERE instance_id = ? AND status != 'error'
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
}

export default DatabaseManager;
