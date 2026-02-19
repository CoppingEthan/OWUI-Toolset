/**
 * File Recall - API Router
 * Handles instance management (admin) and file operations (per-instance)
 */

import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as openaiSync from './openai-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.pptx', '.txt', '.md', '.html', '.json', '.tex']);
const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.json': 'application/json',
  '.tex': 'application/x-tex'
};

// Multer stores files in memory for hash computation before saving
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per file
});

/**
 * Create the file recall router
 * @param {object} db - DatabaseManager instance
 * @returns {Router}
 */
export function createFileRecallRouter(db) {
  const router = Router();

  // ═══════════════════════════════════════════════════════════
  // Auth Middleware
  // ═══════════════════════════════════════════════════════════

  function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    const token = authHeader.split(' ')[1];
    if (token !== process.env.API_SECRET_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  }

  function instanceAuth(req, res, next) {
    const instanceId = req.params.id;
    const token = req.headers['x-access-token'] || req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Access token required (X-Access-Token header or ?token= param)' });
    }

    const instance = db.getFileRecallInstance(instanceId);
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    if (instance.access_token !== token) {
      return res.status(403).json({ error: 'Invalid access token' });
    }

    req.frInstance = instance;
    next();
  }

  // ═══════════════════════════════════════════════════════════
  // Admin Endpoints
  // ═══════════════════════════════════════════════════════════

  // Create instance
  router.post('/instances', adminAuth, (req, res) => {
    try {
      const { id, name, openai_api_key } = req.body;

      if (!id || !name || !openai_api_key) {
        return res.status(400).json({ error: 'id, name, and openai_api_key are required' });
      }

      // Validate ID format (slug-safe)
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(id) && !/^[a-z0-9]$/.test(id)) {
        return res.status(400).json({ error: 'ID must be lowercase alphanumeric with hyphens (e.g. "client-acme")' });
      }

      const existing = db.getFileRecallInstance(id);
      if (existing) {
        return res.status(409).json({ error: 'Instance already exists' });
      }

      const accessToken = crypto.randomBytes(32).toString('hex');
      const instance = db.createFileRecallInstance(id, name, openai_api_key, accessToken);

      // Create data directory
      const dataDir = path.join(projectRoot, 'data', 'file-recall', id);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      console.log(`📦 File Recall: Created instance "${id}" (${name})`);
      res.status(201).json(instance);
    } catch (error) {
      console.error('Create instance error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // List instances
  router.get('/instances', adminAuth, (req, res) => {
    try {
      const instances = db.getFileRecallInstances();
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update instance
  router.put('/instances/:id', adminAuth, (req, res) => {
    try {
      const instance = db.getFileRecallInstance(req.params.id);
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.openai_api_key) updates.openai_api_key = req.body.openai_api_key;

      db.updateFileRecallInstance(req.params.id, updates);
      res.json(db.getFileRecallInstance(req.params.id));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete instance
  router.delete('/instances/:id', adminAuth, async (req, res) => {
    try {
      const instance = db.getFileRecallInstance(req.params.id);
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }

      // Delete vector store from OpenAI
      if (instance.vector_store_id && instance.openai_api_key) {
        try {
          const client = openaiSync.getClient(instance.openai_api_key);
          await openaiSync.deleteVectorStore(client, instance.vector_store_id);
        } catch (e) {
          console.warn(`⚠️ Failed to delete OpenAI vector store for ${req.params.id}: ${e.message}`);
        }
      }

      // Delete local files
      const dataDir = path.join(projectRoot, 'data', 'file-recall', req.params.id);
      if (fs.existsSync(dataDir)) {
        fs.rmSync(dataDir, { recursive: true, force: true });
      }

      db.deleteFileRecallInstance(req.params.id);
      console.log(`🗑️ File Recall: Deleted instance "${req.params.id}"`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Instance Endpoints (token auth)
  // ═══════════════════════════════════════════════════════════

  // List files
  router.get('/:id/files', instanceAuth, (req, res) => {
    try {
      const files = db.getFileRecallFiles(req.frInstance.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get stats
  router.get('/:id/stats', instanceAuth, (req, res) => {
    try {
      const instance = req.frInstance;
      const stats = db.updateFileRecallInstanceStats(instance.id);
      res.json({
        instance_id: instance.id,
        name: instance.name,
        vector_store_id: instance.vector_store_id,
        file_count: stats.file_count,
        total_size_bytes: stats.total_size_bytes,
        supported_types: Array.from(ALLOWED_EXTENSIONS)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload files
  router.post('/:id/upload', instanceAuth, upload.array('files', 100), async (req, res) => {
    const instance = req.frInstance;
    const results = [];

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    try {
      const client = openaiSync.getClient(instance.openai_api_key);
      const vectorStoreId = await openaiSync.ensureVectorStore(client, instance, db);

      // Refresh instance after potential vector store creation
      const freshInstance = db.getFileRecallInstance(instance.id);

      const dataDir = path.join(projectRoot, 'data', 'file-recall', instance.id);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      for (const file of req.files) {
        // Extract base filename (strip any path components from folder uploads)
        const filename = path.basename(file.originalname);
        const ext = path.extname(filename).toLowerCase();

        // Validate file type
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          results.push({ filename, action: 'error', message: `Unsupported file type: ${ext}` });
          continue;
        }

        // Compute SHA-256 hash
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Check for duplicate (same content hash in this instance)
        const existing = db.getFileRecallFileByHash(instance.id, hash);
        if (existing) {
          if (existing.status === 'error') {
            // Previous upload failed — clean up and re-upload
            db.deleteFileRecallFile(instance.id, existing.id);
          } else {
            results.push({
              filename,
              action: 'skipped',
              message: `Content already exists as "${existing.filename}"`
            });
            continue;
          }
        }

        // Generate storage name: first 16 chars of hash + extension
        const storageName = `${hash.substring(0, 16)}${ext}`;
        const filePath = path.join(dataDir, storageName);

        try {
          // Save to disk
          fs.writeFileSync(filePath, file.buffer);

          // Insert DB record
          const mimeType = MIME_MAP[ext] || 'application/octet-stream';
          const fileId = db.insertFileRecallFile(instance.id, filename, storageName, hash, file.buffer.length, mimeType);

          // Upload to OpenAI
          const openaiResult = await openaiSync.uploadFile(client, vectorStoreId, filePath, filename);

          // Update record with OpenAI IDs
          db.updateFileRecallFileStatus(fileId, 'ready', null, openaiResult.fileId, openaiResult.vsFileId);

          results.push({ filename, action: 'uploaded', message: 'Successfully uploaded and indexed' });
        } catch (uploadError) {
          console.error(`❌ Upload failed for ${filename}:`, uploadError.message);

          // Clean up local file if OpenAI upload failed
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
          }

          // Try to clean up the DB record if it was inserted
          try {
            const dbFile = db.getFileRecallFileByHash(instance.id, hash);
            if (dbFile) {
              db.updateFileRecallFileStatus(dbFile.id, 'error', uploadError.message, null, null);
            }
          } catch {}

          results.push({ filename, action: 'error', message: uploadError.message });
        }
      }

      // Update instance stats
      db.updateFileRecallInstanceStats(instance.id);

      console.log(`📁 File Recall: Upload to "${instance.id}" — ${results.filter(r => r.action === 'uploaded').length} uploaded, ${results.filter(r => r.action === 'skipped').length} skipped, ${results.filter(r => r.action === 'error').length} errors`);
      res.json({ results });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({ error: error.message, results });
    }
  });

  // Delete a file
  router.delete('/:id/files/:fileId', instanceAuth, async (req, res) => {
    try {
      const instance = req.frInstance;
      const fileId = parseInt(req.params.fileId, 10);

      const file = db.getFileRecallFileById(instance.id, fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from OpenAI
      if (file.openai_file_id) {
        try {
          const client = openaiSync.getClient(instance.openai_api_key);
          await openaiSync.deleteFile(client, instance.vector_store_id, file.openai_file_id);
        } catch (e) {
          console.warn(`⚠️ Failed to delete from OpenAI: ${e.message}`);
        }
      }

      // Delete local file
      const filePath = path.join(projectRoot, 'data', 'file-recall', instance.id, file.storage_name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete DB record
      db.deleteFileRecallFile(instance.id, fileId);
      db.updateFileRecallInstanceStats(instance.id);

      console.log(`🗑️ File Recall: Deleted "${file.filename}" from "${instance.id}"`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
