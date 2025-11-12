const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: false
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('combined'));

// Base paths
const USERS_DIR = path.join(__dirname, '..', 'users');
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const ACTIVITY_LOG = path.join(LOGS_DIR, 'activity.log');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(USERS_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

// Append to activity log
function appendActivityLog(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fsSync.appendFileSync(ACTIVITY_LOG, logLine);
}

// POST /api/log - Save a log entry
app.post('/api/log', async (req, res) => {
  try {
    const { type, username, request, response, metadata, files } = req.body;
    
    // Debug: Log what we receive
    console.log('[DEBUG] POST /api/log received:', {
      type,
      username,
      hasRequest: !!request,
      hasResponse: !!response,
      hasFiles: !!files,
      filesCount: files ? files.length : 0,
      bodyKeys: Object.keys(req.body)
    });
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Create unique log directory: yyyy-mm-dd-hh-mm-ss-{8char}
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-` +
      `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const uuid = randomUUID().replace(/-/g, '').slice(0, 8);
    const logId = `${ts}-${uuid}`;
    const userDir = path.join(USERS_DIR, username);
    const logDir = path.join(userDir, logId);
    const filesDir = path.join(logDir, 'files');

    await fs.mkdir(logDir, { recursive: true });
    await fs.mkdir(filesDir, { recursive: true });

    // Save request data (if present)
    if (request) {
      await fs.writeFile(
        path.join(logDir, 'request.json'),
        JSON.stringify(request, null, 2)
      );
    }

    // Save response data (if present)
    if (response) {
      await fs.writeFile(
        path.join(logDir, 'response.json'),
        JSON.stringify(response, null, 2)
      );
    }

    // Prepare file summary for metadata
    let fileSummary = null;
    if (files && Array.isArray(files) && files.length > 0) {
      fileSummary = {
        count: files.length,
        files: files.map(f => ({
          filename: f.filename,
          size: f.size,
          mime_type: f.mime_type
        }))
      };
    }

    // Save metadata with type field and file info
    const metadataToSave = {
      ...metadata,
      type: type || metadata?.type || 'combined',  // 'request', 'response', or 'combined'
      logId,
      username,
      timestamp: new Date().toISOString(),
      logPath: logDir,
      files: fileSummary  // Add file summary to metadata
    };
    await fs.writeFile(
      path.join(logDir, 'metadata.json'),
      JSON.stringify(metadataToSave, null, 2)
    );

    // Save files if any
    if (files && Array.isArray(files) && files.length > 0) {
      console.log(`[DEBUG] Processing ${files.length} file(s)`);
      for (const file of files) {
        // Skip if filename is missing
        if (!file.filename) {
          console.warn('[WARNING] Skipping file without filename:', JSON.stringify(file, null, 2));
          continue;
        }
        
        // Save file metadata even if no content
        const fileMetadataPath = path.join(filesDir, `${file.filename}.meta.json`);
        await fs.writeFile(
          fileMetadataPath,
          JSON.stringify({
            filename: file.filename,
            mime_type: file.mime_type,
            size: file.size,
            id: file.id,
            url: file.url,
            path: file.path,
            savedAt: new Date().toISOString()
          }, null, 2)
        );
        console.log(`[DEBUG] Saved metadata for: ${file.filename}`);
        
        // Save actual file content if present
        if (file.content) {
          const filePath = path.join(filesDir, file.filename);
          // Handle base64 encoded files
          const buffer = Buffer.from(file.content, 'base64');
          await fs.writeFile(filePath, buffer);
          console.log(`[DEBUG] Saved file content: ${file.filename} (${buffer.length} bytes)`);
        } else {
          console.log(`[DEBUG] No content for ${file.filename}, only metadata saved`);
        }
      }
    }

    // Log activity with type
    const typeLabel = type ? ` (${type})` : '';
    const activityMsg = `LOG_SAVED: user=${username}, logId=${logId}, model=${metadata?.model || 'unknown'}${typeLabel}`;
    appendActivityLog(activityMsg);

    res.json({
      success: true,
      logId,
      logPath: logDir,
      type: type || 'combined'
    });
  } catch (error) {
    console.error('Error saving log:', error);
    appendActivityLog(`ERROR: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/logs - List all logs
app.get('/api/logs', async (req, res) => {
  try {
    const { username, limit = 100 } = req.query;
    const logs = [];

    // Read all user directories
    const userDirs = await fs.readdir(USERS_DIR);
    
    for (const user of userDirs) {
      // Filter by username if provided
      if (username && user !== username) continue;

      const userPath = path.join(USERS_DIR, user);
      const stat = await fs.stat(userPath);
      if (!stat.isDirectory()) continue;

      // Read all log directories for this user
      const logDirs = await fs.readdir(userPath);
      
      for (const logDir of logDirs) {
        const logPath = path.join(userPath, logDir);
        const metadataPath = path.join(logPath, 'metadata.json');
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          logs.push({
            ...metadata,
            username: user,
            logId: logDir
          });
        } catch (err) {
          // Skip if metadata can't be read
          console.error(`Error reading metadata for ${logPath}:`, err.message);
        }
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    const limitedLogs = logs.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: limitedLogs.length,
      total: logs.length,
      logs: limitedLogs
    });
  } catch (error) {
    console.error('Error listing logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/logs/:username/:logId - Get specific log
app.get('/api/logs/:username/:logId', async (req, res) => {
  try {
    const { username, logId } = req.params;
    const logDir = path.join(USERS_DIR, username, logId);

    // Read all files in the log directory
    const request = await readJsonFile(path.join(logDir, 'request.json'));
    const response = await readJsonFile(path.join(logDir, 'response.json'));
    const metadata = await readJsonFile(path.join(logDir, 'metadata.json'));

    // List files if directory exists
    const filesDir = path.join(logDir, 'files');
    let files = [];
    try {
      files = await fs.readdir(filesDir);
    } catch (err) {
      // No files directory
    }

    res.json({
      success: true,
      logId,
      username,
      request,
      response,
      metadata,
      files
    });
  } catch (error) {
    console.error('Error getting log:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/activity - Get activity log
app.get('/api/activity', async (req, res) => {
  try {
    const { lines = 100 } = req.query;
    
    let content = '';
    try {
      content = await fs.readFile(ACTIVITY_LOG, 'utf-8');
    } catch (err) {
      // Log file doesn't exist yet
      return res.json({ success: true, lines: [] });
    }

    const allLines = content.split('\n').filter(line => line.trim());
    const recentLines = allLines.slice(-parseInt(lines));

    res.json({
      success: true,
      lines: recentLines
    });
  } catch (error) {
    console.error('Error reading activity log:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/logs/clear - Clear all logs (users + activity)
app.delete('/api/logs/clear', async (req, res) => {
  try {
    // Remove all user log directories
    try {
      const userDirs = await fs.readdir(USERS_DIR);
      for (const user of userDirs) {
        const userPath = path.join(USERS_DIR, user);
        await fs.rm(userPath, { recursive: true, force: true });
      }
    } catch (err) {
      console.error('Error clearing users directory:', err.message);
    }

    // Truncate activity log
    try {
      if (fsSync.existsSync(ACTIVITY_LOG)) {
        fsSync.writeFileSync(ACTIVITY_LOG, '');
      }
    } catch (err) {
      console.error('Error clearing activity log:', err.message);
    }

    appendActivityLog('LOGS_CLEARED');

    res.json({ success: true, message: 'All logs cleared' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stream - Server-Sent Events for real-time logs
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Watch activity log for changes
  const watcher = fsSync.watch(ACTIVITY_LOG, (eventType) => {
    if (eventType === 'change') {
      // Read last line
      try {
        const content = fsSync.readFileSync(ACTIVITY_LOG, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        const lastLine = lines[lines.length - 1];
        
        res.write(`data: ${JSON.stringify({ type: 'log', message: lastLine })}\n\n`);
      } catch (err) {
        console.error('Error reading log for stream:', err);
      }
    }
  });

  // Clean up on client disconnect
  req.on('close', () => {
    watcher.close();
  });
});

// Helper function to read JSON file
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'owui-logger-api' });
});

// Start server
ensureDirectories().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OWUI Logger API running on http://0.0.0.0:${PORT}`);
    appendActivityLog(`API_SERVER_STARTED on port ${PORT}`);
  });
});
