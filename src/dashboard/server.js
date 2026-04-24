/**
 * Dashboard server factory.
 *
 * Returns an Express app; the caller binds it to a port. Shares the
 * DatabaseManager singleton with the API server — no cross-process merge.
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const DASHBOARD_USERNAME = process.env.DASHBOARD_USERNAME || 'admin';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'change_this_password';

/**
 * Constant-time compare that avoids both length leaks and short-circuit
 * byte compares when an attacker controls either side.
 */
function safeEquals(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still compare against bufA to keep time roughly constant.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Same-origin enforcement for mutations. Blocks CSRF: modern browsers
 * always set `Sec-Fetch-Site` for cross-origin requests, so any value
 * other than 'same-origin' or 'none' (direct navigation) means the
 * request came from another site's JS or an auto-submitted form.
 *
 * Dashboard AJAX uses fetch() from the same origin, which picks up
 * 'same-origin' automatically.
 */
function sameOriginOnly(req, res, next) {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next();
  const sfs = req.headers['sec-fetch-site'];
  if (sfs && sfs !== 'same-origin' && sfs !== 'none') {
    return res.status(403).json({ error: 'Cross-site request blocked' });
  }
  return next();
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;

  let credentials = null;
  if (authHeader?.startsWith('Basic ')) {
    try { credentials = Buffer.from(authHeader.slice(6), 'base64').toString(); } catch {}
  } else if (queryToken) {
    try { credentials = Buffer.from(queryToken, 'base64').toString(); } catch {}
  }

  if (!credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sep = credentials.indexOf(':');
  const username = sep >= 0 ? credentials.slice(0, sep) : credentials;
  const password = sep >= 0 ? credentials.slice(sep + 1) : '';

  if (safeEquals(username, DASHBOARD_USERNAME) && safeEquals(password, DASHBOARD_PASSWORD)) {
    return next();
  }
  res.status(401).json({ error: 'Invalid credentials' });
}

function getDirSize(dirPath) {
  let size = 0;
  try {
    for (const item of fs.readdirSync(dirPath)) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) size += getDirSize(itemPath);
      else size += stat.size;
    }
  } catch {}
  return size;
}

/**
 * Recalculate historical costs in place using current settings pricing.
 * Duplicates the provider/family matching logic from server.js intentionally —
 * this runs against the live DB without needing the API module.
 */
function recalculateHistoricalCosts(db) {
  const costs = db.getModelCosts();
  const multipliers = db.getCacheMultipliers();
  if (!costs || !Object.keys(costs).length) throw new Error('No model costs configured');

  const patterns = Object.keys(costs).sort((a, b) => b.length - a.length);
  const familyPatterns = ['opus', 'sonnet', 'haiku', 'gpt-5.2', 'gpt-5.1', 'gpt-5'];

  const calcCost = (model, provider, inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens) => {
    const modelLower = model.toLowerCase();
    const cacheReadMul = multipliers?.[provider]?.read ?? 0.1;
    const cacheWriteMul = multipliers?.[provider]?.write ?? (provider === 'anthropic' ? 1.25 : 1.0);
    const regularInputTokens = provider === 'openai'
      ? Math.max(0, inputTokens - cacheReadTokens)
      : inputTokens;

    let pricing = null;
    for (const pattern of patterns) {
      if (pattern === 'default') continue;
      if (modelLower.includes(pattern.toLowerCase())) { pricing = costs[pattern]; break; }
    }
    if (!pricing) {
      for (const family of familyPatterns) {
        if (modelLower.includes(family)) {
          for (const pattern of patterns) {
            if (pattern.toLowerCase().includes(family)) { pricing = costs[pattern]; break; }
          }
          if (pricing) break;
        }
      }
    }
    if (!pricing) pricing = costs['default'] || { input: 1.00, output: 3.00 };

    return (regularInputTokens / 1e6) * pricing.input
      + (outputTokens      / 1e6) * pricing.output
      + (cacheReadTokens   / 1e6) * pricing.input * cacheReadMul
      + (cacheCreationTokens / 1e6) * pricing.input * cacheWriteMul;
  };

  const rows = db.db.prepare(
    'SELECT id, model, provider, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens FROM request_metrics'
  );
  const updates = [];
  while (rows.step()) {
    const r = rows.getAsObject();
    updates.push({ id: r.id, cost: calcCost(r.model, r.provider, r.input_tokens, r.output_tokens, r.cache_read_tokens, r.cache_creation_tokens) });
  }
  rows.free();

  const updateStmt = db.db.prepare('UPDATE request_metrics SET cost = ? WHERE id = ?');
  for (const u of updates) updateStmt.run([u.cost, u.id]);
  updateStmt.free();
  db.save();
  return updates.length;
}

/**
 * Create the dashboard Express app. Does not listen — caller binds it.
 */
export function createDashboardApp(db) {
  const app = express();
  app.use(express.json());
  app.use(sameOriginOnly);
  app.use(express.static(path.join(__dirname, 'public')));

  // Health (unauthed)
  app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Conversations
  app.get('/api/conversations/recent', authenticate, (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const domain = req.query.domain || null;
      const timeRange = req.query.timeRange || null;
      res.json(db.getRecentConversations(limit, domain, timeRange));
    } catch (err) {
      console.error('conversations/recent:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/conversations/:id', authenticate, (req, res) => {
    try {
      res.json(db.getConversationRequests(req.params.id));
    } catch (err) {
      console.error('conversations/:id:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Per-request messages/tools (for conversation modal)
  app.get('/api/requests/:id/messages', authenticate, (req, res) => {
    try { res.json(db.getRequestMessages(parseInt(req.params.id))); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/requests/:id/tools', authenticate, (req, res) => {
    try { res.json(db.getToolCalls(parseInt(req.params.id))); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Stats
  app.get('/api/stats/timeseries/:timeRange', authenticate, (req, res) => {
    try {
      res.json(db.getTokenUsageTimeSeriesByDomainGroup(req.params.timeRange, req.query.domain || null));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/stats/domains', authenticate, (req, res) => {
    try { res.json(db.getUniqueDomains()); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/stats/tools', authenticate, (req, res) => {
    try { res.json(db.getToolUsageStatistics(req.query.domain || null)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/stats/tool-count', authenticate, (req, res) => {
    try { res.json({ count: db.getTotalToolCalls(req.query.domain || null) }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/stats/cache/:timeRange', authenticate, (req, res) => {
    try { res.json(db.getCacheStatistics(req.params.timeRange)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Note: this wildcard route must be registered AFTER all specific /api/stats/* routes.
  app.get('/api/stats/:timeRange', authenticate, (req, res) => {
    try { res.json(db.getStatistics(req.params.timeRange, req.query.domain || null)); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/stats/storage', authenticate, (req, res) => {
    try {
      const dataDir = path.join(projectRoot, 'data');
      if (!fs.existsSync(dataDir)) return res.json({ total: { sizeBytes: 0, sizeMB: '0.00' }, users: [] });

      const storage = [];
      let totalBytes = 0;
      for (const item of fs.readdirSync(dataDir)) {
        const itemPath = path.join(dataDir, item);
        if (item === 'metrics.db' || !fs.statSync(itemPath).isDirectory()) continue;
        let userSize = 0;
        let conversationCount = 0;
        try {
          for (const conv of fs.readdirSync(itemPath)) {
            const convPath = path.join(itemPath, conv);
            if (fs.statSync(convPath).isDirectory()) {
              conversationCount++;
              userSize += getDirSize(convPath);
            }
          }
        } catch (err) {
          console.error(`Error scanning ${itemPath}:`, err.message);
        }
        totalBytes += userSize;
        storage.push({ email: item, conversations: conversationCount, sizeBytes: userSize, sizeMB: (userSize / 1024 / 1024).toFixed(2) });
      }
      storage.sort((a, b) => b.sizeBytes - a.sizeBytes);
      res.json({
        total: {
          sizeBytes: totalBytes,
          sizeMB: (totalBytes / 1024 / 1024).toFixed(2),
          sizeGB: (totalBytes / 1024 / 1024 / 1024).toFixed(2),
        },
        users: storage,
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Destructive ops
  app.post('/api/settings/clear-metrics', authenticate, (req, res) => {
    try {
      const dbPath = db.dbPath;
      db.close();
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      console.log('🗑️ Deleted metrics database');
      // Re-initialise in place so the same singleton keeps working.
      db.initialize().then(() => res.json({ success: true, message: 'Metrics cleared successfully' }));
    } catch (err) {
      console.error('clear-metrics:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/clear-files', authenticate, (req, res) => {
    try {
      const dataDir = path.join(projectRoot, 'data');
      let deletedCount = 0;
      for (const item of fs.readdirSync(dataDir)) {
        if (item === 'metrics.db') continue;
        const itemPath = path.join(dataDir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) fs.rmSync(itemPath, { recursive: true, force: true });
        else fs.unlinkSync(itemPath);
        deletedCount++;
      }
      console.log(`✅ Deleted ${deletedCount} user files/folders`);
      res.json({ success: true, message: `Cleared ${deletedCount} user files/folders` });
    } catch (err) {
      console.error('clear-files:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/delete-all', authenticate, async (req, res) => {
    try {
      const dbPath = db.dbPath;
      const dataDir = path.join(projectRoot, 'data');
      db.close();
      let deletedCount = 0;
      for (const item of fs.readdirSync(dataDir)) {
        const itemPath = path.join(dataDir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) fs.rmSync(itemPath, { recursive: true, force: true });
        else fs.unlinkSync(itemPath);
        deletedCount++;
      }
      await db.initialize();
      console.log('✅ All data deleted and database reinitialized');
      res.json({ success: true, message: `Deleted all data (${deletedCount} items)` });
    } catch (err) {
      console.error('delete-all:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Cost settings
  app.get('/api/settings/costs', authenticate, (req, res) => {
    try { res.json(db.getModelCosts()); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/settings/costs', authenticate, (req, res) => {
    try {
      const { pattern, input, output } = req.body;
      if (!pattern || input === undefined || output === undefined) {
        return res.status(400).json({ error: 'Missing required fields: pattern, input, output' });
      }
      db.setModelCost(pattern, parseFloat(input), parseFloat(output));
      console.log(`💰 Updated cost for ${pattern}: $${input}/$${output} per 1M tokens`);
      res.json({ success: true, pattern, input, output });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete('/api/settings/costs/:pattern', authenticate, (req, res) => {
    try {
      db.deleteModelCost(req.params.pattern);
      console.log(`🗑️ Deleted cost for ${req.params.pattern}`);
      res.json({ success: true, pattern: req.params.pattern });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Cache multipliers
  app.get('/api/settings/cache-multipliers', authenticate, (req, res) => {
    try { res.json(db.getCacheMultipliers()); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/settings/cache-multipliers', authenticate, (req, res) => {
    try {
      const { provider, read, write } = req.body;
      if (!provider || (read === undefined && write === undefined)) {
        return res.status(400).json({ error: 'Missing required fields: provider, and at least one of read/write' });
      }
      if (read !== undefined)  db.setSetting(`cache_read_multiplier_${provider}`, parseFloat(read).toString());
      if (write !== undefined) db.setSetting(`cache_write_multiplier_${provider}`, parseFloat(write).toString());
      console.log(`💰 Updated cache multipliers for ${provider}: read=${read}, write=${write}`);
      res.json({ success: true, provider, read, write });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/settings/recalculate-costs', authenticate, (req, res) => {
    try {
      const updated = recalculateHistoricalCosts(db);
      console.log(`💰 Recalculated costs for ${updated} requests`);
      res.json({ success: true, updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Domain colours
  app.get('/api/settings/domain-colors', authenticate, (req, res) => {
    try { res.json(db.getDomainColors()); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/settings/domain-colors', authenticate, (req, res) => {
    try {
      const { domain, color } = req.body;
      if (!domain || !color) return res.status(400).json({ error: 'Missing required fields: domain, color' });
      db.setDomainColor(domain, color);
      res.json({ success: true, domain, color });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Version check (GitHub latest vs package.json)
  let versionCache = { data: null, fetchedAt: 0 };
  const VERSION_CACHE_MS = 60 * 60 * 1000;
  app.get('/api/version', authenticate, async (req, res) => {
    try {
      const localPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const current = localPkg.version;
      const upgradeAllowed = (process.env.ALLOW_REMOTE_UPGRADE || '').toLowerCase() === 'true';
      let latest = current;
      const now = Date.now();
      if (versionCache.data && (now - versionCache.fetchedAt) < VERSION_CACHE_MS) {
        latest = versionCache.data;
      } else {
        try {
          const resp = await fetch('https://raw.githubusercontent.com/CoppingEthan/OWUI-Toolset/main/package.json');
          if (resp.ok) {
            const remotePkg = await resp.json();
            latest = remotePkg.version;
            versionCache = { data: latest, fetchedAt: now };
          }
        } catch (err) {
          console.error('Version check failed:', err.message);
        }
      }
      const cmp = (a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
          if ((pa[i] || 0) < (pb[i] || 0)) return -1;
          if ((pa[i] || 0) > (pb[i] || 0)) return 1;
        }
        return 0;
      };
      const updateAvailable = cmp(current, latest) < 0;
      res.json({ current, latest, updateAvailable, upgradeAllowed });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/upgrade', authenticate, (req, res) => {
    const upgradeAllowed = (process.env.ALLOW_REMOTE_UPGRADE || '').toLowerCase() === 'true';
    if (!upgradeAllowed) {
      return res.status(403).json({ error: 'Remote upgrade is disabled. Set ALLOW_REMOTE_UPGRADE=true in .env to enable.' });
    }
    const deployScript = path.join(projectRoot, 'deploy.sh');
    if (!fs.existsSync(deployScript)) return res.status(404).json({ error: 'deploy.sh not found in project root' });

    console.log('🚀 Upgrade initiated from dashboard');
    const child = spawn('bash', [deployScript], { cwd: projectRoot, detached: true, stdio: 'ignore' });
    child.unref();
    res.json({ success: true, message: 'Upgrade started. The server will restart shortly.' });
  });

  // Dashboard HTML
  app.get('/', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}
