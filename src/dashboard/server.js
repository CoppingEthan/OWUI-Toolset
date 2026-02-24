/**
 * Dashboard Server for OWUI Toolset V2
 * Real-time analytics and monitoring dashboard
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import DatabaseManager from '../database/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;
const DASHBOARD_USERNAME = process.env.DASHBOARD_USERNAME || 'admin';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'change_this_password';

// Initialize database with absolute path
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(projectRoot, process.env.DATABASE_PATH)
  : path.join(projectRoot, 'data', 'metrics.db');
console.log(`📁 Dashboard DB path: ${dbPath}`);
const db = new DatabaseManager(dbPath);
await db.initialize();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store for Server-Sent Events connections
const sseClients = new Set();

/**
 * Basic Authentication Middleware
 * Supports both header-based auth and query parameter auth (for SSE)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const authToken = req.query.token; // For EventSource which can't send headers

  let credentials = null;

  // Try header auth first
  if (authHeader && authHeader.startsWith('Basic ')) {
    credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  }
  // Fall back to query param token (base64 encoded user:pass)
  else if (authToken) {
    try {
      credentials = Buffer.from(authToken, 'base64').toString();
    } catch (e) {
      // Invalid base64
    }
  }

  if (!credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Dashboard"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const [username, password] = credentials.split(':');

  if (username === DASHBOARD_USERNAME && password === DASHBOARD_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

/**
 * API Routes
 */

// Health check (no auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint (no auth)
app.get('/test', (req, res) => {
  res.send('Dashboard is running! Go to / and login with admin:admin');
});

// Get recent conversations (grouped by conversation_id with aggregated metrics)
app.get('/api/conversations/recent', authenticate, (req, res) => {
  try {
    db.reload();
    const limit = parseInt(req.query.limit) || 50;
    const domain = req.query.domain || null;
    const timeRange = req.query.timeRange || null;
    const conversations = db.getRecentConversations(limit, domain, timeRange);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    res.status(500).json({ error: 'Failed to fetch recent conversations' });
  }
});

// Get all requests for a specific conversation
app.get('/api/conversations/:id', authenticate, (req, res) => {
  try {
    db.reload();
    const conversationId = req.params.id;
    const requests = db.getConversationRequests(conversationId);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ error: 'Failed to fetch conversation details' });
  }
});

// Get recent requests (with optional domain and time range filters) - LEGACY, kept for backwards compatibility
app.get('/api/requests/recent', authenticate, (req, res) => {
  try {
    db.reload(); // Reload from disk to get latest data
    const limit = parseInt(req.query.limit) || 100;
    const domain = req.query.domain || null;
    const timeRange = req.query.timeRange || null;
    const requests = db.getRecentRequests(limit, domain, timeRange);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    res.status(500).json({ error: 'Failed to fetch recent requests' });
  }
});

// Get messages for a specific request
app.get('/api/requests/:id/messages', authenticate, (req, res) => {
  try {
    db.reload();
    const requestId = parseInt(req.params.id);
    const messages = db.getRequestMessages(requestId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching request messages:', error);
    res.status(500).json({ error: 'Failed to fetch request messages' });
  }
});

// Get tool calls for a specific request
app.get('/api/requests/:id/tools', authenticate, (req, res) => {
  try {
    db.reload();
    const requestId = parseInt(req.params.id);
    const toolCalls = db.getToolCalls(requestId);
    res.json(toolCalls);
  } catch (error) {
    console.error('Error fetching tool calls:', error);
    res.status(500).json({ error: 'Failed to fetch tool calls' });
  }
});

// Get statistics for a time range (with optional domain filter)
app.get('/api/stats/:timeRange', authenticate, (req, res) => {
  try {
    db.reload(); // Reload from disk to get latest data
    const { timeRange } = req.params;
    const domain = req.query.domain || null;
    const stats = db.getStatistics(timeRange, domain);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get token usage time series for charts (grouped by domain, with optional domain filter)
app.get('/api/stats/timeseries/:timeRange', authenticate, (req, res) => {
  try {
    db.reload(); // Reload from disk to get latest data
    const { timeRange } = req.params;
    const domain = req.query.domain || null;
    const data = db.getTokenUsageTimeSeriesByDomainGroup(timeRange, domain);
    res.json(data);
  } catch (error) {
    console.error('Error fetching time series:', error);
    res.status(500).json({ error: 'Failed to fetch time series data' });
  }
});

// Get unique email domains
app.get('/api/stats/domains', authenticate, (req, res) => {
  try {
    db.reload();
    const domains = db.getUniqueDomains();
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Get usage by OWUI instance
app.get('/api/stats/by-instance', authenticate, (req, res) => {
  try {
    db.reload(); // Reload from disk to get latest data
    const data = db.getUsageByInstance();
    res.json(data);
  } catch (error) {
    console.error('Error fetching instance usage:', error);
    res.status(500).json({ error: 'Failed to fetch instance usage' });
  }
});

// Get usage by model
app.get('/api/stats/by-model', authenticate, (req, res) => {
  try {
    db.reload(); // Reload from disk to get latest data
    const data = db.getUsageByModel();
    res.json(data);
  } catch (error) {
    console.error('Error fetching model usage:', error);
    res.status(500).json({ error: 'Failed to fetch model usage' });
  }
});

// Get tool usage statistics (with optional domain filter)
app.get('/api/stats/tools', authenticate, (req, res) => {
  try {
    db.reload(); // Reload from disk to get latest data
    const domain = req.query.domain || null;
    const data = db.getToolUsageStatistics(domain);
    res.json(data);
  } catch (error) {
    console.error('Error fetching tool usage:', error);
    res.status(500).json({ error: 'Failed to fetch tool usage' });
  }
});

// Get total tool call count (with optional domain filter)
app.get('/api/stats/tool-count', authenticate, (req, res) => {
  try {
    db.reload();
    const domain = req.query.domain || null;
    const count = db.getTotalToolCalls(domain);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching tool count:', error);
    res.status(500).json({ error: 'Failed to fetch tool count' });
  }
});

// Get cache statistics by provider
app.get('/api/stats/cache/:timeRange', authenticate, (req, res) => {
  try {
    db.reload();
    const { timeRange } = req.params;
    const data = db.getCacheStatistics(timeRange);
    res.json(data);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
});

// Get unique models used
app.get('/api/stats/models', authenticate, (req, res) => {
  try {
    db.reload();
    const models = db.getUniqueModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get storage usage per user/chat (for sandbox volumes)
app.get('/api/stats/storage', authenticate, (req, res) => {
  try {
    const dataDir = path.join(projectRoot, 'data');

    if (!fs.existsSync(dataDir)) {
      return res.json({ total: { sizeBytes: 0, sizeMB: '0.00' }, users: [] });
    }

    const storage = [];
    let totalBytes = 0;

    // Scan user folders
    const items = fs.readdirSync(dataDir);
    for (const item of items) {
      const itemPath = path.join(dataDir, item);

      // Skip non-directories and metrics.db
      if (item === 'metrics.db' || !fs.statSync(itemPath).isDirectory()) {
        continue;
      }

      // This is a user folder (email)
      let userSize = 0;
      let conversationCount = 0;

      try {
        const conversations = fs.readdirSync(itemPath);
        for (const conv of conversations) {
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
      storage.push({
        email: item,
        conversations: conversationCount,
        sizeBytes: userSize,
        sizeMB: (userSize / 1024 / 1024).toFixed(2)
      });
    }

    // Sort by size descending
    storage.sort((a, b) => b.sizeBytes - a.sizeBytes);

    res.json({
      total: {
        sizeBytes: totalBytes,
        sizeMB: (totalBytes / 1024 / 1024).toFixed(2),
        sizeGB: (totalBytes / 1024 / 1024 / 1024).toFixed(2)
      },
      users: storage
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

/**
 * Calculate directory size recursively
 */
function getDirSize(dirPath) {
  let size = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        size += getDirSize(itemPath);
      } else {
        size += stat.size;
      }
    }
  } catch (err) {
    // Ignore errors (permission issues, etc.)
  }
  return size;
}

// Clear metrics database only
app.post('/api/settings/clear-metrics', authenticate, async (req, res) => {
  try {
    const fs = await import('fs');
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(projectRoot, process.env.DATABASE_PATH)
      : path.join(projectRoot, 'data', 'metrics.db');

    // Close the current connection (without saving)
    if (db.db) {
      db.db.close();
    }

    // Delete the database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️ Deleted metrics database');
    }

    // Reinitialize with empty database
    await db.initialize();
    console.log('✅ Metrics database cleared and reinitialized');

    res.json({ success: true, message: 'Metrics cleared successfully' });
  } catch (error) {
    console.error('Error clearing metrics:', error);
    res.status(500).json({ error: 'Failed to clear metrics', message: error.message });
  }
});

// Clear user data folders only (keep database)
app.post('/api/settings/clear-files', authenticate, async (req, res) => {
  try {
    const fs = await import('fs');
    const dataDir = path.join(projectRoot, 'data');

    let deletedCount = 0;
    const items = fs.readdirSync(dataDir);
    for (const item of items) {
      const itemPath = path.join(dataDir, item);
      // Skip metrics.db
      if (item !== 'metrics.db') {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
          console.log(`🗑️ Deleted folder: ${item}`);
          deletedCount++;
        } else {
          fs.unlinkSync(itemPath);
          console.log(`🗑️ Deleted file: ${item}`);
          deletedCount++;
        }
      }
    }

    console.log(`✅ Deleted ${deletedCount} user files/folders`);
    res.json({ success: true, message: `Cleared ${deletedCount} user files/folders` });
  } catch (error) {
    console.error('Error clearing files:', error);
    res.status(500).json({ error: 'Failed to clear files', message: error.message });
  }
});

// Delete everything (metrics database + user files)
app.post('/api/settings/delete-all', authenticate, async (req, res) => {
  try {
    const fs = await import('fs');
    const dataDir = path.join(projectRoot, 'data');
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(projectRoot, process.env.DATABASE_PATH)
      : path.join(projectRoot, 'data', 'metrics.db');

    // Close database connection
    if (db.db) {
      db.db.close();
    }

    let deletedCount = 0;

    // Delete everything in data folder
    const items = fs.readdirSync(dataDir);
    for (const item of items) {
      const itemPath = path.join(dataDir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`🗑️ Deleted folder: ${item}`);
        deletedCount++;
      } else {
        fs.unlinkSync(itemPath);
        console.log(`🗑️ Deleted file: ${item}`);
        deletedCount++;
      }
    }

    // Reinitialize with empty database
    await db.initialize();
    console.log('✅ All data deleted and database reinitialized');

    res.json({ success: true, message: `Deleted all data (${deletedCount} items)` });
  } catch (error) {
    console.error('Error deleting all data:', error);
    res.status(500).json({ error: 'Failed to delete all data', message: error.message });
  }
});

// Get all model costs
app.get('/api/settings/costs', authenticate, (req, res) => {
  try {
    db.reload();
    const costs = db.getModelCosts();
    res.json(costs);
  } catch (error) {
    console.error('Error fetching costs:', error);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

// Update a model cost
app.post('/api/settings/costs', authenticate, (req, res) => {
  try {
    const { pattern, input, output } = req.body;
    if (!pattern || input === undefined || output === undefined) {
      return res.status(400).json({ error: 'Missing required fields: pattern, input, output' });
    }
    db.reload();
    db.setModelCost(pattern, parseFloat(input), parseFloat(output));
    console.log(`💰 Updated cost for ${pattern}: $${input}/$${output} per 1M tokens`);
    res.json({ success: true, pattern, input, output });
  } catch (error) {
    console.error('Error updating cost:', error);
    res.status(500).json({ error: 'Failed to update cost' });
  }
});

// Delete a model cost
app.delete('/api/settings/costs/:pattern', authenticate, (req, res) => {
  try {
    const { pattern } = req.params;
    db.reload();
    // Delete both input and output cost entries
    const stmt1 = db.db.prepare("DELETE FROM settings WHERE key = ?");
    stmt1.run([`cost_${pattern}_input`]);
    stmt1.free();
    const stmt2 = db.db.prepare("DELETE FROM settings WHERE key = ?");
    stmt2.run([`cost_${pattern}_output`]);
    stmt2.free();
    db.save();
    console.log(`🗑️ Deleted cost for ${pattern}`);
    res.json({ success: true, pattern });
  } catch (error) {
    console.error('Error deleting cost:', error);
    res.status(500).json({ error: 'Failed to delete cost' });
  }
});

// Get all domain colors
app.get('/api/settings/domain-colors', authenticate, (req, res) => {
  try {
    db.reload();
    const colors = db.getDomainColors();
    res.json(colors);
  } catch (error) {
    console.error('Error fetching domain colors:', error);
    res.status(500).json({ error: 'Failed to fetch domain colors' });
  }
});

// Update a domain color
app.post('/api/settings/domain-colors', authenticate, (req, res) => {
  try {
    const { domain, color } = req.body;
    if (!domain || !color) {
      return res.status(400).json({ error: 'Missing required fields: domain, color' });
    }
    db.reload();
    db.setDomainColor(domain, color);
    db.save();
    res.json({ success: true, domain, color });
  } catch (error) {
    console.error('Error updating domain color:', error);
    res.status(500).json({ error: 'Failed to update domain color' });
  }
});

// Version check - compare local version with GitHub
let versionCache = { data: null, fetchedAt: 0 };
const VERSION_CACHE_MS = 60 * 60 * 1000; // 1 hour

app.get('/api/version', authenticate, async (req, res) => {
  try {
    const localPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    const current = localPkg.version;
    const upgradeAllowed = (process.env.ALLOW_REMOTE_UPGRADE || '').toLowerCase() === 'true';

    let latest = current;
    let updateAvailable = false;

    // Check GitHub (cached for 1 hour)
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
      } catch (e) {
        console.error('Version check failed:', e.message);
      }
    }

    // Simple semver comparison (split on dots, compare numerically)
    const cmp = (a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) < (pb[i] || 0)) return -1;
        if ((pa[i] || 0) > (pb[i] || 0)) return 1;
      }
      return 0;
    };
    updateAvailable = cmp(current, latest) < 0;

    res.json({ current, latest, updateAvailable, upgradeAllowed });
  } catch (error) {
    console.error('Error checking version:', error);
    res.status(500).json({ error: 'Failed to check version' });
  }
});

// Trigger upgrade via deploy.sh
app.post('/api/upgrade', authenticate, (req, res) => {
  const upgradeAllowed = (process.env.ALLOW_REMOTE_UPGRADE || '').toLowerCase() === 'true';
  if (!upgradeAllowed) {
    return res.status(403).json({ error: 'Remote upgrade is disabled. Set ALLOW_REMOTE_UPGRADE=true in .env to enable.' });
  }

  const deployScript = path.join(projectRoot, 'deploy.sh');
  if (!fs.existsSync(deployScript)) {
    return res.status(404).json({ error: 'deploy.sh not found in project root' });
  }

  console.log('🚀 Upgrade initiated from dashboard');

  // Spawn deploy.sh as detached process - it will stop/restart this process
  const child = spawn('bash', [deployScript], {
    cwd: projectRoot,
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  res.json({ success: true, message: 'Upgrade started. The server will restart shortly.' });
});

// Server-Sent Events endpoint for real-time updates
app.get('/api/events', authenticate, (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add client to set
  sseClients.add(res);

  // Prevent crash from client connection errors
  res.on('error', () => {
    sseClients.delete(res);
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Remove client when connection closes
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Broadcast updates to all SSE clients (used internally)
function broadcastUpdate(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      sseClients.delete(client);
    }
  });
}

// Serve dashboard HTML
app.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Dashboard running (${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD})`);
});

// Graceful shutdown - Dashboard is READ-ONLY, don't save to avoid overwriting API data
process.on('SIGINT', () => {
  // Don't call db.close() as it saves, which would overwrite fresh API data with stale dashboard copy
  console.log('🛑 Dashboard shutting down (read-only, no save)');
  process.exit(0);
});

export { db, app };
