/**
 * OWUI Toolset V2 - Main API Server
 *
 * Supports multiple LLM providers with unified message transformation:
 * - OpenAI: GPT-5, GPT-5.1, GPT-5.2
 * - Anthropic: Claude Opus 4.5, Sonnet 4.5, Haiku 4.5
 * - Ollama (local models via Chat API)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import DatabaseManager from '../database/database.js';
import { isMultimodalContent } from '../transformers/message-transformer.js';
import { detectImageType, compressForLLM } from '../utils/image-compressor.js';
import { extractContent } from '../cee/index.js';
// Native tool calling (replaces DIY text-based parsing)
import { chatCompletion } from '../tools/providers/index.js';
import { getEnabledToolNames } from '../tools/definitions.js';
import { logSection, logMessages, log } from '../utils/debug-logger.js';
import { containerManager } from '../tools/sandbox/manager.js';
import { createFileRecallRouter } from '../file-recall/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Default models per provider (used only when no model specified in config)
const DEFAULT_MODELS = {
  openai: 'gpt-5.2',
  anthropic: 'claude-sonnet-4-5',
  ollama: 'llama3.1:8b'
};

dotenv.config();

const DATA_DIR = path.join(projectRoot, 'data');
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// Initialize database with absolute path
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(projectRoot, process.env.DATABASE_PATH)
  : path.join(projectRoot, 'data', 'metrics.db');
console.log(`📁 API DB path: ${dbPath}`);
const db = new DatabaseManager(dbPath);
await db.initialize();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors({ origin: process.env.ENABLE_CORS === 'true' ? '*' : false }));

/**
 * Authentication Middleware
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
}

/**
 * IP Range Matching Utilities
 * Supports: exact match, wildcard (10.0.0.*), CIDR (10.0.0.0/8), and "any" (*)
 */
function parseAllowedInstances() {
  const instances = process.env.ALLOWED_OWUI_INSTANCES || '*';
  return instances.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function ipToNumber(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isIpInCidr(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = bits ? parseInt(bits, 10) : 32;
  if (isNaN(mask) || mask < 0 || mask > 32) return false;

  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  if (ipNum === null || rangeNum === null) return false;

  const maskBits = mask === 0 ? 0 : (~0 << (32 - mask)) >>> 0;
  return (ipNum & maskBits) === (rangeNum & maskBits);
}

function isIpMatchingWildcard(ip, pattern) {
  // Convert wildcard pattern to regex: 10.0.* -> ^10\.0\..*$
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(ip);
}

function isInstanceAllowed(instanceOrIp) {
  const allowedPatterns = parseAllowedInstances();

  // If "*" or empty, allow all
  if (allowedPatterns.includes('*') || allowedPatterns.length === 0) {
    return true;
  }

  // Extract IP from instance (could be "ip:port" or just "ip" or hostname)
  const ip = instanceOrIp.split(':')[0];

  for (const pattern of allowedPatterns) {
    const patternIp = pattern.split(':')[0];
    const patternPort = pattern.split(':')[1];
    const instancePort = instanceOrIp.split(':')[1];

    // Exact match (with optional port)
    if (pattern === instanceOrIp || patternIp === ip) {
      // If pattern has port, it must match
      if (patternPort && instancePort && patternPort !== instancePort) {
        continue;
      }
      return true;
    }

    // CIDR match (e.g., 10.0.0.0/8)
    if (patternIp.includes('/')) {
      if (isIpInCidr(ip, patternIp)) {
        return true;
      }
    }

    // Wildcard match (e.g., 10.0.0.* or 192.168.*)
    if (patternIp.includes('*')) {
      if (isIpMatchingWildcard(ip, patternIp)) {
        return true;
      }
    }
  }

  return false;
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// File Recall - Management API & Dashboard
app.use('/api/v1/file-recall', express.json(), createFileRecallRouter(db));
app.use('/file-recall', express.static(path.join(__dirname, '..', 'file-recall', 'public')));

/**
 * Debug Logging Helper - logs request details to understand OWUI data format
 * Only logs when DEBUG_MODE is enabled
 */
function logRequestDetails(label, data, maxDepth = 3) {
  if (!DEBUG_MODE) return;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📥 ${label}`);
  console.log(`${'='.repeat(60)}`);

  const sanitize = (obj, depth = 0) => {
    if (depth > maxDepth) return '[MAX_DEPTH]';
    if (obj === null) return null;
    if (obj === undefined) return undefined;
    if (typeof obj !== 'object') {
      // Truncate long strings
      if (typeof obj === 'string' && obj.length > 500) {
        return obj.substring(0, 500) + `... [${obj.length} chars total]`;
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      if (obj.length > 10) {
        return [...obj.slice(0, 5).map(i => sanitize(i, depth + 1)), `... [${obj.length} items total]`];
      }
      return obj.map(i => sanitize(i, depth + 1));
    }
    if (Buffer.isBuffer(obj)) {
      return `[Buffer: ${obj.length} bytes]`;
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive data
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
        result[key] = value ? '[REDACTED]' : '[EMPTY]';
      } else {
        result[key] = sanitize(value, depth + 1);
      }
    }
    return result;
  };

  console.log(JSON.stringify(sanitize(data), null, 2));
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Document Extraction Endpoint (External Document Loader)
 * OWUI sends raw binary with application/octet-stream
 */
app.put('/process', authenticate, express.raw({ type: '*/*', limit: '100mb' }), handleFileUpload);
app.post('/process', authenticate, express.raw({ type: '*/*', limit: '100mb' }), handleFileUpload);

async function handleFileUpload(req, res) {
  try {
    // Log full request details for debugging
    logRequestDetails('FILE UPLOAD - Headers', req.headers);
    logRequestDetails('FILE UPLOAD - Query', req.query);
    logRequestDetails('FILE UPLOAD - Body Type', {
      type: typeof req.body,
      isBuffer: Buffer.isBuffer(req.body),
      length: req.body?.length || 0
    });

    // Extract user context from OWUI headers (CEE sends these!)
    const userEmail = req.headers['x-openwebui-user-email'] || 'anonymous@localhost';

    // Get filename from headers
    const contentDisposition = req.headers['content-disposition'] || '';
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    let filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : null;

    // Try other headers if content-disposition doesn't have filename
    if (!filename) {
      filename = req.headers['x-filename'] || req.headers['x-file-name'] || `upload-${Date.now()}`;
    }

    // Decode URL-encoded filename
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      // Keep original if decode fails
    }

    // Extract file UUID from filename (OWUI format: UUID_filename.ext)
    // Example: "ffeb6bb9-0a30-4848-9136-fbe59614aed1_Christmas Shopping.md"
    const uuidMatch = filename.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(.+)$/i);
    let fileId = null;
    let cleanFilename = filename;

    if (uuidMatch) {
      fileId = uuidMatch[1];        // The UUID
      cleanFilename = uuidMatch[2]; // The actual filename without UUID prefix
    } else {
      // No UUID in filename, generate one
      fileId = `file-${Date.now()}`;
    }

    // Get raw body buffer
    let fileBuffer = req.body;

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No file data received' });
    }

    // Check if this is an image and compress if needed
    let compressionStats = null;
    const imageType = await detectImageType(fileBuffer);

    if (imageType.isImage) {
      try {
        const result = await compressImage(fileBuffer);
        if (result.compressed) {
          fileBuffer = result.buffer;
          compressionStats = result.stats;
          // Update filename to .jpg if we compressed
          const ext = path.extname(cleanFilename).toLowerCase();
          if (ext !== '.jpg' && ext !== '.jpeg') {
            cleanFilename = cleanFilename.replace(/\.[^.]+$/, '.jpg');
          }
        }
      } catch (compressError) {
        console.error('Image compression failed, using original:', compressError.message);
      }
    }

    // Sanitize email for folder name (replace unsafe chars)
    const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');

    // Use the file UUID as the folder ID (matches OWUI's internal ID)
    // Format: data/[email]/[file-uuid]/volume/uploaded/[filename]
    const userFolder = path.join(DATA_DIR, safeEmail, fileId, 'volume', 'uploaded');

    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    // Save file with clean filename (without UUID prefix)
    const finalPath = path.join(userFolder, cleanFilename);
    fs.writeFileSync(finalPath, fileBuffer);

    const size = fileBuffer.length;
    const mimetype = compressionStats ? 'image/jpeg' : (req.headers['content-type'] || 'application/octet-stream');

    console.log(`📄 CEE Extract: ${cleanFilename} (${(size / 1024).toFixed(1)}KB) → ${safeEmail}/${fileId}`);

    // Build public URL for file access
    const publicDomain = process.env.PUBLIC_DOMAIN || `http://localhost:${PORT}`;
    const publicUrl = `${publicDomain}/${safeEmail}/${fileId}/volume/uploaded/${encodeURIComponent(cleanFilename)}`;

    // Extract content using CEE (Content Extraction Engine)
    const extractedContent = await extractContent(fileBuffer, cleanFilename, mimetype, {
      publicUrl,
      savedPath: finalPath,
      userEmail,
      fileId,
      timestamp: new Date().toISOString()
    });

    // Return in OWUI Document format (Pydantic model expects page_content and metadata)
    res.json({
      page_content: extractedContent.markdown,
      metadata: {
        source: cleanFilename,
        filename: cleanFilename,
        mimetype: mimetype,
        size: size,
        saved_path: finalPath,
        public_url: publicUrl,
        user_email: userEmail,
        file_id: fileId,
        ...extractedContent.metadata
      }
    });

  } catch (error) {
    console.error('File upload error:', error.message);
    res.status(500).json({ error: 'File processing failed', message: error.message });
  }
}


/**
 * Main Chat Endpoint
 * Supports: GPT-5/5.1/5.2 (OpenAI), Claude Opus/Sonnet/Haiku 4.5 (Anthropic), Ollama (local)
 */
app.post('/api/v1/chat', authenticate, express.json({ limit: '50mb' }), async (req, res) => {
  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let modelUsed = 'unknown';

  try {
    // Log full request body for debugging OWUI data format
    logRequestDetails('CHAT REQUEST - Full Body', req.body);
    logRequestDetails('CHAT REQUEST - Files', req.body.files);

    const { conversation_id, user_email, owui_instance, messages, stream, config, files } = req.body;

    // Log parsed fields
    logRequestDetails('CHAT REQUEST - Parsed Fields', {
      conversation_id,
      user_email,
      owui_instance,
      message_count: messages?.length,
      stream,
      has_config: !!config,
      files_count: files?.length || 0,
      files_structure: files
    });

    if (!conversation_id || !messages || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate OWUI instance is allowed
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const instanceToCheck = owui_instance || clientIp;
    if (!isInstanceAllowed(instanceToCheck)) {
      console.log(`🚫 Rejected request from unauthorized instance: ${instanceToCheck}`);
      return res.status(403).json({ error: 'OWUI instance not authorized', instance: instanceToCheck });
    }

    // Process and store any attached files
    if (files && files.length > 0) {
      const safeEmail = (user_email || 'anonymous').replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeConvId = conversation_id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const convFolder = path.join(DATA_DIR, safeEmail, safeConvId, 'volume', 'uploaded');

      if (!fs.existsSync(convFolder)) {
        fs.mkdirSync(convFolder, { recursive: true });
      }

      for (const fileInfo of files) {
        const fileId = fileInfo.id;
        const fileName = fileInfo.name || fileInfo.file?.filename || 'unnamed';
        const fileContent = fileInfo.file?.data?.content;

        // Log file info for debugging
        console.log(`📎 Chat attachment: ${fileName} (file: ${fileId}, conv: ${safeConvId})`);

        // Check if file was uploaded via /process endpoint (stored under file UUID folder)
        // If so, move/copy it to the conversation folder
        const fileUuidFolder = path.join(DATA_DIR, safeEmail, fileId, 'volume', 'uploaded');
        const sourceFilePath = path.join(fileUuidFolder, fileName);
        const destFilePath = path.join(convFolder, fileName);

        if (fs.existsSync(sourceFilePath) && !fs.existsSync(destFilePath)) {
          // Copy file from file UUID folder to conversation folder
          try {
            fs.copyFileSync(sourceFilePath, destFilePath);
            console.log(`📁 Copied file to conversation: ${fileName} (${fileId} → ${safeConvId})`);
          } catch (copyErr) {
            console.error(`⚠️ Failed to copy file: ${copyErr.message}`);
          }
        }

        // Store metadata file with reference info
        const metaPath = path.join(convFolder, `${fileId || Date.now()}.meta.json`);
        fs.writeFileSync(metaPath, JSON.stringify({
          id: fileId,
          name: fileName,
          size: fileInfo.size,
          content_type: fileInfo.content_type,
          owui_path: fileInfo.file?.path,
          original_folder: fileId,  // Track where file was originally uploaded
          has_content: !!fileContent,
          timestamp: new Date().toISOString()
        }, null, 2));
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIMPLIFIED IMAGE HANDLING
    // - Save new images at full quality with data_hash for matching
    // - Create temp compressed proxy for LLM vision (deleted after response)
    // - Inject image context into user message (URLs persist for tools)
    // - Strip ALL image_url blocks (LLM uses URLs from context for tools)
    // ═══════════════════════════════════════════════════════════════════════
    const safeEmail = (user_email || 'anonymous').replace(/[^a-zA-Z0-9@._-]/g, '_');
    const safeConvId = conversation_id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const imgFolder = path.join(DATA_DIR, safeEmail, safeConvId, 'volume', 'uploaded');
    const tempFolder = path.join(DATA_DIR, safeEmail, safeConvId, 'volume', 'temp');
    const imgPublicDomain = process.env.PUBLIC_DOMAIN || `http://localhost:${PORT}`;
    const lastMessage = messages[messages.length - 1];

    // Track temp proxy files for cleanup after response
    const tempProxyFiles = [];

    // Track all available images in this conversation (from meta.json files)
    const availableImages = [];

    // Map of data_hash → meta for matching incoming data URLs
    const dataHashMap = new Map();

    console.log(`📥 [IMAGE] Processing chat request for conversation ${safeConvId}`);

    // Step 1: Load existing images from meta.json files
    if (fs.existsSync(imgFolder)) {
      try {
        const metaFiles = fs.readdirSync(imgFolder).filter(f => f.endsWith('.meta.json') && f.startsWith('img-'));
        console.log(`📂 [IMAGE] Found ${metaFiles.length} existing image meta file(s)`);

        for (const metaFile of metaFiles) {
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(imgFolder, metaFile), 'utf8'));
            if (meta.local_url && meta.timestamp) {
              availableImages.push({
                id: meta.id,
                filename: meta.filename || `${meta.id}.${meta.extension || 'jpg'}`,
                url: meta.local_url,
                timestamp: meta.timestamp,
                size: meta.file_size
              });
              // Build hash map for data URL matching
              if (meta.data_hash) {
                dataHashMap.set(meta.data_hash, meta);
              }
            }
          } catch (e) {
            console.log(`⚠️ [IMAGE] Failed to read meta file ${metaFile}: ${e.message}`);
          }
        }
        console.log(`📋 [IMAGE] Loaded ${availableImages.length} available image(s), ${dataHashMap.size} with hash`);
      } catch (e) {
        console.log(`⚠️ [IMAGE] Error reading image folder: ${e.message}`);
      }
    }

    // Step 2: Process NEW images in last message (save full quality + create temp proxy)
    const newImageProxies = []; // { url, filename, timestamp } for new images this turn

    if (lastMessage && isMultimodalContent(lastMessage.content)) {
      // Ensure folders exist
      if (!fs.existsSync(imgFolder)) {
        fs.mkdirSync(imgFolder, { recursive: true });
      }
      if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder, { recursive: true });
      }

      // Count image blocks for logging
      const imageBlocks = lastMessage.content.filter(b => b.type === 'image_url' && b.image_url?.url);
      console.log(`📥 [IMAGE] Last message has ${imageBlocks.length} image block(s)`);

      for (const block of lastMessage.content) {
        if (block.type === 'image_url' && block.image_url?.url) {
          const originalUrl = block.image_url.url;

          // Skip if already a local URL from our server
          if (originalUrl.includes('/volume/uploaded/') || originalUrl.includes('/volume/comfyui/')) {
            console.log(`⏭️ [IMAGE] Skipping local URL: ${originalUrl.substring(0, 80)}...`);
            continue;
          }

          try {
            let imageBuffer = null;
            let isDataUrl = false;

            // Handle base64 data URLs
            if (originalUrl.startsWith('data:')) {
              isDataUrl = true;
              const match = originalUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                imageBuffer = Buffer.from(match[2], 'base64');
                console.log(`📥 [IMAGE] Decoded data URL: ${(imageBuffer.length / 1024).toFixed(0)}KB`);

                // Check if we already have this image (by hash)
                const dataHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
                if (dataHashMap.has(dataHash)) {
                  const existingMeta = dataHashMap.get(dataHash);
                  console.log(`🔄 [IMAGE] Found existing image by hash: ${existingMeta.id}`);
                  // Image already exists, no need to save again
                  continue;
                }
              }
            } else if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
              // Handle external URLs - fetch the image
              console.log(`🌐 [IMAGE] Fetching external URL: ${originalUrl.substring(0, 80)}...`);
              try {
                const response = await fetch(originalUrl);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  imageBuffer = Buffer.from(arrayBuffer);
                  console.log(`✅ [IMAGE] Fetched: ${(imageBuffer.length / 1024).toFixed(0)}KB`);
                } else {
                  console.log(`⚠️ [IMAGE] Fetch failed: HTTP ${response.status}`);
                }
              } catch (fetchErr) {
                console.log(`⚠️ [IMAGE] Fetch error: ${fetchErr.message}`);
              }
            }

            if (imageBuffer) {
              // Generate unique ID
              const imageId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

              // Detect image type
              const typeInfo = await detectImageType(imageBuffer);
              const ext = typeInfo.ext || 'jpg';
              const filename = `${imageId}.${ext}`;

              // Calculate hash for data URL matching
              const dataHash = crypto.createHash('md5').update(imageBuffer).digest('hex');

              // Save FULL QUALITY image
              const imagePath = path.join(imgFolder, filename);
              fs.writeFileSync(imagePath, imageBuffer);
              console.log(`💾 [IMAGE] Saved full quality: ${filename} (${(imageBuffer.length / 1024).toFixed(0)}KB)`);

              // Build local URL for the full quality image
              const localUrl = `${imgPublicDomain}/${safeEmail}/${safeConvId}/volume/uploaded/${filename}`;
              const timestamp = new Date().toISOString();

              // Save metadata with data_hash
              const metaPath = path.join(imgFolder, `${imageId}.meta.json`);
              const metaData = {
                id: imageId,
                filename: filename,
                type: 'embedded_image',
                original_url: isDataUrl ? `data:${typeInfo.mime};base64:[omitted]` : originalUrl,
                local_url: localUrl,
                data_hash: dataHash,
                file_size: imageBuffer.length,
                mime_type: typeInfo.mime,
                extension: ext,
                message_role: lastMessage.role,
                timestamp: timestamp
              };
              fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
              console.log(`📝 [IMAGE] Created meta.json with hash: ${dataHash.substring(0, 8)}...`);

              // Create TEMP compressed proxy for LLM vision
              try {
                const compressed = await compressForLLM(imageBuffer);
                const proxyFilename = `proxy-${imageId}.jpg`;
                const proxyPath = path.join(tempFolder, proxyFilename);
                fs.writeFileSync(proxyPath, compressed.buffer);
                tempProxyFiles.push(proxyPath);
                console.log(`🗜️ [IMAGE] Created temp proxy: ${proxyFilename} (${(compressed.buffer.length / 1024).toFixed(0)}KB)`);

                // Build proxy URL for LLM vision
                const proxyUrl = `${imgPublicDomain}/${safeEmail}/${safeConvId}/volume/temp/${proxyFilename}`;

                // Track this new image with its proxy
                newImageProxies.push({
                  proxyUrl: proxyUrl,
                  permanentUrl: localUrl,
                  filename: filename,
                  timestamp: timestamp
                });
              } catch (compressErr) {
                console.log(`⚠️ [IMAGE] Compression failed, using original: ${compressErr.message}`);
                // Fall back to using original URL
                newImageProxies.push({
                  proxyUrl: localUrl,
                  permanentUrl: localUrl,
                  filename: filename,
                  timestamp: timestamp
                });
              }

              // Add to available images list
              availableImages.push({
                id: imageId,
                filename: filename,
                url: localUrl,
                timestamp: timestamp,
                size: imageBuffer.length
              });
            }
          } catch (imgError) {
            console.log(`⚠️ [IMAGE] Failed to process image: ${imgError.message}`);
          }
        }
      }
    }

    // Step 3: Build image context text
    let imageContextText = '';
    if (availableImages.length > 0) {
      // Sort by timestamp (oldest first)
      availableImages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const contextLines = availableImages.map((img, i) => {
        const date = new Date(img.timestamp);
        const timeStr = date.toLocaleString();
        return `${i + 1}. ${img.filename} | ${img.url} | Uploaded: ${timeStr}`;
      });

      imageContextText = `\n\n---\n[Images available in this conversation]\n${contextLines.join('\n')}\n---`;
      console.log(`📎 [IMAGE] Built context for ${availableImages.length} image(s)`);
    }

    // Step 4: Process all messages - strip image blocks, inject context into last user message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (Array.isArray(msg.content)) {
        // Filter out all image_url blocks, keep only text
        const textBlocks = msg.content.filter(b => b.type === 'text');
        const imageBlockCount = msg.content.length - textBlocks.length;

        if (imageBlockCount > 0) {
          console.log(`🧹 [IMAGE] Stripped ${imageBlockCount} image block(s) from message ${i + 1}`);
        }

        // If this is the last user message, inject context and temp proxies
        if (i === messages.length - 1 && msg.role === 'user') {
          // Combine text content
          let textContent = textBlocks.map(b => b.text).join('\n');

          // Add image context (URLs for tool use)
          if (imageContextText) {
            textContent += imageContextText;
          }

          // Add temp proxy images for LLM vision (new images this turn only)
          if (newImageProxies.length > 0) {
            // Rebuild content with text + proxy images
            const newContent = [{ type: 'text', text: textContent }];

            for (const proxy of newImageProxies) {
              newContent.push({
                type: 'image_url',
                image_url: { url: proxy.proxyUrl, detail: 'auto' }
              });
              console.log(`🔗 [IMAGE] Added temp proxy to request: ${proxy.proxyUrl}`);
            }

            msg.content = newContent;
          } else {
            // No new images, just text with context
            msg.content = textContent;
          }
        } else {
          // Not the last message - just combine text, no images
          msg.content = textBlocks.map(b => b.text).join('\n') || '';
        }
      } else if (typeof msg.content === 'string') {
        // String content - inject image context into last user message
        if (i === messages.length - 1 && msg.role === 'user' && imageContextText) {
          msg.content = msg.content + imageContextText;
          console.log(`📎 [IMAGE] Injected context into string message ${i + 1}`);
        }
      }
    }

    console.log(`✅ [IMAGE] Processing complete: ${availableImages.length} total images, ${newImageProxies.length} new, ${tempProxyFiles.length} temp proxies`);

    // DEBUG: Log final messages BEFORE sending to provider
    logSection(`SERVER.JS - FINAL MESSAGES FOR PROVIDER (conversation: ${safeConvId})`);
    logMessages('SERVER.JS FINAL OUTPUT', messages);
    log('📋 Image context injected:', imageContextText || '(none)');

    // Helper function to cleanup temp proxies (called after LLM response)
    const cleanupTempProxies = () => {
      for (const proxyPath of tempProxyFiles) {
        try {
          if (fs.existsSync(proxyPath)) {
            fs.unlinkSync(proxyPath);
            console.log(`🧹 [IMAGE] Deleted temp proxy: ${path.basename(proxyPath)}`);
          }
        } catch (e) {
          console.log(`⚠️ [IMAGE] Failed to delete temp proxy: ${e.message}`);
        }
      }
    };

    // Get LLM configuration from OWUI Valves
    // New format: llm_provider/llm_model with use_tools flag
    // Legacy format: conversational_llm_provider/tool_calling_llm_provider
    const llmProvider = (config.llm_provider || config.conversational_llm_provider || 'anthropic').toLowerCase();
    const llmModel = config.llm_model || null;  // May be null, resolved below
    const useTools = config.use_tools !== false;  // Default to true for backwards compatibility

    const openaiKey = config.openai_api_key;
    const anthropicKey = config.anthropic_api_key;
    const ollamaUrl = config.ollama_base_url || 'http://localhost:11434';

    console.log(`💬 Chat: ${user_email || 'unknown'} | ${messages.length} msgs | provider=${llmProvider} | tools=${useTools} | stream=${stream}`);

    // Validate the selected provider has required credentials
    if (llmProvider === 'openai' && (!openaiKey || openaiKey.length === 0)) {
      return res.status(400).json({ error: 'OpenAI selected but OPENAI_API_KEY not configured in Valves.' });
    }
    if (llmProvider === 'anthropic' && (!anthropicKey || anthropicKey.length === 0)) {
      return res.status(400).json({ error: 'Anthropic selected but ANTHROPIC_API_KEY not configured in Valves.' });
    }
    if (llmProvider === 'ollama' && (!ollamaUrl || ollamaUrl.length === 0)) {
      return res.status(400).json({ error: 'Ollama selected but OLLAMA_BASE_URL not configured in Valves.' });
    }

    const responseId = `chatcmpl-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    // Track tools used for metrics
    const toolsUsed = [];

    // Track messages and tool calls for database storage
    let userInputMessage = '';
    let assistantResponse = '';
    const toolCallRecords = []; // {tool_name, tool_params, tool_result, success, execution_time_ms}

    // Get enabled tools using native tool definitions
    // Only enable tools if useTools flag is true (from pipeline decision)
    const enabledToolNames = useTools ? getEnabledToolNames(config) : [];
    console.log(`🔧 Tools enabled: ${enabledToolNames.join(', ') || 'none'} (useTools=${useTools})`);

    // Add custom system prompt if configured
    let processedMessages = [...messages];
    if (config.custom_system_prompt) {
      const systemMsg = processedMessages.find(m => m.role === 'system');
      if (systemMsg) {
        systemMsg.content = `${config.custom_system_prompt}\n\n${systemMsg.content}`;
      } else {
        processedMessages.unshift({ role: 'system', content: config.custom_system_prompt });
      }
    }

    // Inject user memories into system prompt if memory tools are enabled
    if (config.tools?.memory && user_email) {
      try {
        const memories = db.getMemories(user_email);
        if (memories.length > 0) {
          const memoryBlock = memories.map(m => `- ${m.content}`).join('\n');
          const memoryNote = `\n\n[USER_MEMORIES]\nThings you remember about this user:\n${memoryBlock}\n[/USER_MEMORIES]`;

          const systemMsg = processedMessages.find(m => m.role === 'system');
          if (systemMsg) {
            systemMsg.content += memoryNote;
          } else {
            processedMessages.unshift({ role: 'system', content: memoryNote.trim() });
          }
        }
      } catch (e) {
        console.error('Failed to inject user memories:', e.message);
      }
    }

    // Inject sandbox file download context so the LLM can provide download links
    if (enabledToolNames.includes('sandbox_execute') && config.toolset_api_url) {
      const downloadBase = `${config.toolset_api_url}/${safeEmail}/${safeConvId}/volume`;
      const sandboxNote = `\n\n[Sandbox file downloads] Files created in /workspace are downloadable. ` +
        `To give the user a download link, use: ${downloadBase}/<filepath> ` +
        `(e.g. ${downloadBase}/chart.png). Use markdown links: [Download chart.png](${downloadBase}/chart.png)`;

      const systemMsg = processedMessages.find(m => m.role === 'system');
      if (systemMsg) {
        systemMsg.content += sandboxNote;
      } else {
        processedMessages.unshift({ role: 'system', content: sandboxNote.trim() });
      }
    }

    // Native tool calling - no need to inject tool prompts (provider handles this)

    // Capture the LAST user message for database storage
    // (OWUI sends full history, we only want the new message)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      if (typeof lastUserMsg.content === 'string') {
        userInputMessage = lastUserMsg.content;
      } else if (Array.isArray(lastUserMsg.content)) {
        // Multimodal - extract text parts
        userInputMessage = lastUserMsg.content
          .filter(p => p.type === 'text')
          .map(p => p.text)
          .join('\n');
      }
    }

    // Helper to send SSE chunks with proper flushing
    const sendChunk = (content, finishReason = null) => {
      try {
        const ok = res.write(`data: ${JSON.stringify({
          id: responseId,
          object: 'chat.completion.chunk',
          created,
          model: modelUsed,
          choices: [{ index: 0, delta: finishReason ? {} : { content }, finish_reason: finishReason }]
        })}\n\n`);
        // If write returns false, the buffer is full (backpressure)
        return ok;
      } catch {
        // Client disconnected mid-stream
        return false;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // NATIVE TOOL CALLING - Uses provider APIs instead of DIY text parsing
    // ═══════════════════════════════════════════════════════════════════════

    // Determine model based on provider
    // Priority: 1) llm_model from config (any model the user specifies), 2) default for provider
    let model;
    if (llmModel) {
      // Model explicitly specified in pipeline config - use it directly
      model = llmModel;
    } else {
      // Fall back to provider default
      model = DEFAULT_MODELS[llmProvider] || DEFAULT_MODELS.anthropic;
    }
    modelUsed = model;

    // Build config for native tool calling
    const publicDomain = process.env.PUBLIC_DOMAIN || `http://localhost:${PORT}`;
    const toolConfig = {
      OPENAI_API_KEY: config.openai_api_key,
      ANTHROPIC_API_KEY: config.anthropic_api_key,
      OLLAMA_BASE_URL: config.ollama_base_url || 'http://localhost:11434',
      tavily_api_key: config.tavily_api_key,
      comfyui_base_url: config.comfyui_base_url,
      ANTHROPIC_MAX_TOKENS: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '8192', 10),
      // Context for tool output saving (research PDFs, generated images)
      USER_EMAIL: user_email,
      CONVERSATION_ID: conversation_id,
      TOOLSET_API_URL: config.toolset_api_url || `http://localhost:${PORT}`,
      // Public domain for image URL references (used by providers to determine URL vs base64)
      PUBLIC_DOMAIN: publicDomain,
      // Tool toggles
      tools: config.tools,
      // Database instance for memory/file recall tools
      db: db,
      // File recall instance ID
      file_recall_instance_id: config.file_recall_instance_id
    };

    // For streaming: set up SSE headers early so we can send status events during compaction
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      res.on('error', () => {});
    }

    // Replace oversized user messages — checked on every request so no state needed.
    // OWUI resends the full conversation history, so an oversized message from turn 3
    // inflates every subsequent request. Replacing it keeps the rest of the conversation intact.
    if (MAX_USER_MESSAGE_TOKENS > 0) {
      const maxChars = Math.floor(MAX_USER_MESSAGE_TOKENS * 3.2);
      const notice = `[This message exceeded the maximum allowed length of ${MAX_USER_MESSAGE_TOKENS.toLocaleString()} tokens and was removed]`;
      for (const msg of processedMessages) {
        if (msg.role !== 'user') continue;

        if (typeof msg.content === 'string' && msg.content.length > maxChars) {
          msg.content = notice;
        } else if (Array.isArray(msg.content)) {
          // Check combined text length across all text blocks
          let textChars = 0;
          for (const block of msg.content) {
            if (block.type === 'text' && block.text) textChars += block.text.length;
          }
          if (textChars > maxChars) {
            // Replace all text blocks with the notice, keep image blocks
            msg.content = msg.content.filter(b => b.type !== 'text');
            msg.content.push({ type: 'text', text: notice });
          }
        }
      }
    }

    // Compact long conversations (before hard token trim)
    if (conversation_id && config.enable_compaction) {
      try {
        const onCompactionStatus = stream
          ? (done) => sendSSEEvent(res, 'status', { data: { description: 'Compacting conversation...', done } })
          : null;
        processedMessages = await compactMessages(processedMessages, config, db, conversation_id, onCompactionStatus, enabledToolNames.length);
      } catch (e) {
        console.error('⚠️ [COMPACTION] Failed, falling back to uncompacted messages:', e.message);
        if (stream) {
          sendSSEEvent(res, 'status', { data: { description: 'Compacting conversation...', done: true } });
        }
      }
    }

    // Enforce input token limit (trim old messages if over budget) — safety net
    processedMessages = trimMessagesToTokenLimit(processedMessages, MAX_INPUT_TOKENS, enabledToolNames.length);

    let detailId = 0;

    if (stream) {
      // ═══════════════════════════════════════════════════════════
      // STREAMING with Native Tool Calling
      // ═══════════════════════════════════════════════════════════

      try {
        const response = await chatCompletion({
          model,
          provider: llmProvider,
          messages: processedMessages,
          enabledTools: enabledToolNames,
          config: toolConfig,

          // Stream text chunks to client
          onText: (chunk) => {
            assistantResponse += chunk;
            sendChunk(chunk);
          },

          // Display tool calls in collapsible details
          onToolCall: (toolCall) => {
            const toolName = toolCall.name;
            const toolParams = toolCall.input || toolCall.arguments;

            // Format friendly tool description based on tool type
            const query = toolParams.query || toolParams.urls?.[0] || '';
            let friendlyDesc;
            switch (toolName) {
              case 'web_search':
                friendlyDesc = `🌐 Searching: ${query}...`;
                break;
              case 'deep_research':
                friendlyDesc = `🔍 Deep Researching: ${query}...`;
                break;
              case 'web_scrape':
                const urlCount = Array.isArray(toolParams.urls) ? toolParams.urls.length : 1;
                const urlDisplay = urlCount > 1 ? `${urlCount} URLs` : query;
                friendlyDesc = `📄 Scraping: ${urlDisplay}...`;
                break;
              case 'file_recall_search':
                friendlyDesc = `📂 Searching documents: ${query}...`;
                break;
              default:
                friendlyDesc = `🔧 ${toolName}: ${query}...`;
            }

            // Format tool call display with friendly description
            // Prepend newlines to ensure separation from any preceding text
            const paramsJson = JSON.stringify(toolParams, null, 2);
            const display = `\n\n<details id="__DETAIL_${detailId++}__">\n<summary>${friendlyDesc}</summary>\n\n\`\`\`json\n${paramsJson}\n\`\`\`\n</details>\n\n`;
            sendChunk(display);

            // Track tool usage
            if (!toolsUsed.includes(toolName)) {
              toolsUsed.push(toolName);
            }

            // Record for database
            toolCallRecords.push({
              tool_name: toolName,
              tool_params: toolParams,
              tool_result: '', // Will be filled by executor
              success: true,
              execution_time_ms: 0
            });
          },

          // Stream sandbox console output inside code blocks
          onToolOutput: (chunk) => {
            assistantResponse += chunk;
            sendChunk(chunk);
          },

          // Emit sources for OWUI citation panel
          // Pipeline extracts data.data, so wrap source in {data: source}
          onSource: (source) => {
            try {
              JSON.stringify(source);
              console.log(`📚 Emitting source: ${source.source?.name || source.source?.url || 'unknown'}`);
              sendSSEEvent(res, 'source', { data: source });
            } catch (e) {
              console.error('Failed to serialize source for SSE:', e.message);
            }
          },

          stream: true,
          maxIterations: MAX_TOOL_ITERATIONS
        });

        // Update usage stats
        if (response.usage) {
          inputTokens = response.usage.input_tokens || response.usage.prompt_tokens || 0;
          outputTokens = response.usage.output_tokens || response.usage.completion_tokens || 0;

          // Anthropic cache tokens
          cacheCreationTokens = response.usage.cache_creation_input_tokens || 0;
          cacheReadTokens = response.usage.cache_read_input_tokens || 0;

          // OpenAI cache tokens (nested in prompt_tokens_details)
          if (response.usage.prompt_tokens_details?.cached_tokens) {
            cacheReadTokens = response.usage.prompt_tokens_details.cached_tokens;
          }
        }

        console.log(`✅ Native streaming complete: ${response.iterations || 1} iterations, ${toolsUsed.length} tools, cache: ${cacheReadTokens} read / ${cacheCreationTokens} write`);

        sendChunk('', 'stop');
        res.write('data: [DONE]\n\n');
        res.end();

        // Cleanup temp proxy images
        cleanupTempProxies();

      } catch (llmError) {
        console.error('Native tool calling streaming error:', llmError.message);
        sendChunk(`\n\n❌ Error: ${llmError.message}\n\n`);
        sendChunk('', 'stop');
        res.write('data: [DONE]\n\n');
        res.end();

        // Cleanup temp proxy images even on error
        cleanupTempProxies();
      }

    } else {
      // ═══════════════════════════════════════════════════════════
      // NON-STREAMING with Native Tool Calling
      // ═══════════════════════════════════════════════════════════
      let toolCallsDisplay = '';

      try {
        const response = await chatCompletion({
          model,
          provider: llmProvider,
          messages: processedMessages,
          enabledTools: enabledToolNames,
          config: toolConfig,

          // Collect text
          onText: (chunk) => {
            assistantResponse += chunk;
          },

          // Collect tool calls display
          onToolCall: (toolCall) => {
            const toolName = toolCall.name;
            const toolParams = toolCall.input || toolCall.arguments;

            // Format friendly tool description based on tool type
            const query = toolParams.query || toolParams.urls?.[0] || '';
            let friendlyDesc;
            switch (toolName) {
              case 'web_search':
                friendlyDesc = `🌐 Searching: ${query}...`;
                break;
              case 'deep_research':
                friendlyDesc = `🔍 Deep Researching: ${query}...`;
                break;
              case 'web_scrape':
                const urlCount = Array.isArray(toolParams.urls) ? toolParams.urls.length : 1;
                const urlDisplay = urlCount > 1 ? `${urlCount} URLs` : query;
                friendlyDesc = `📄 Scraping: ${urlDisplay}...`;
                break;
              case 'file_recall_search':
                friendlyDesc = `📂 Searching documents: ${query}...`;
                break;
              default:
                friendlyDesc = `🔧 ${toolName}: ${query}...`;
            }

            // Format tool call display with friendly description
            const paramsJson = JSON.stringify(toolParams, null, 2);
            toolCallsDisplay += `\n\n<details>\n<summary>${friendlyDesc}</summary>\n\n\`\`\`json\n${paramsJson}\n\`\`\`\n</details>\n\n`;

            // Track tool usage
            if (!toolsUsed.includes(toolName)) {
              toolsUsed.push(toolName);
            }

            // Record for database
            toolCallRecords.push({
              tool_name: toolName,
              tool_params: toolParams,
              tool_result: '',
              success: true,
              execution_time_ms: 0
            });
          },

          // Collect sandbox console output for non-streaming response
          onToolOutput: (chunk) => {
            assistantResponse += chunk;
          },

          // Sources are collected but not sent in non-streaming mode
          // (OWUI pipeline always uses streaming, so this is mainly for API consistency)
          onSource: () => {
            // Non-streaming mode doesn't support SSE events
            // Sources would need to be included in response body if needed
          },

          stream: false,
          maxIterations: MAX_TOOL_ITERATIONS
        });

        // Update usage stats
        if (response.usage) {
          inputTokens = response.usage.input_tokens || response.usage.prompt_tokens || 0;
          outputTokens = response.usage.output_tokens || response.usage.completion_tokens || 0;

          // Anthropic cache tokens
          cacheCreationTokens = response.usage.cache_creation_input_tokens || 0;
          cacheReadTokens = response.usage.cache_read_input_tokens || 0;

          // OpenAI cache tokens (nested in prompt_tokens_details)
          if (response.usage.prompt_tokens_details?.cached_tokens) {
            cacheReadTokens = response.usage.prompt_tokens_details.cached_tokens;
          }
        }

        // Build final response with tool calls embedded
        const fullContent = toolCallsDisplay
          ? `${toolCallsDisplay}\n\n${assistantResponse}`
          : assistantResponse;

        console.log(`✅ Native non-streaming complete: ${response.iterations || 1} iterations, ${toolsUsed.length} tools`);

        // Cleanup temp proxy images
        cleanupTempProxies();

        res.json({
          id: responseId,
          object: 'chat.completion',
          created,
          model: modelUsed,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: fullContent },
            finish_reason: 'stop'
          }],
          usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens }
        });

      } catch (llmError) {
        console.error('Native tool calling error:', llmError.message);
        // Cleanup temp proxy images even on error
        cleanupTempProxies();
        res.status(500).json({ error: 'LLM request failed', message: llmError.message });
        return;
      }
    }

    // Log request to database
    const responseTime = Date.now() - startTime;
    try {
      // Insert request metric and get the ID
      const requestId = db.insertRequestMetric({
        conversation_id,
        user_email: user_email || 'unknown',
        owui_instance: owui_instance || 'open-webui',
        model: modelUsed,
        provider: llmProvider,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_read_tokens: cacheReadTokens,
        cache_creation_tokens: cacheCreationTokens,
        cost: calculateCost(modelUsed, inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, llmProvider),
        status: 'completed',
        error_message: null,
        response_time_ms: responseTime
      });

      // Store user input message
      if (userInputMessage) {
        db.insertRequestMessage(requestId, 'user', userInputMessage);
      }

      // Store assistant response
      if (assistantResponse) {
        db.insertRequestMessage(requestId, 'assistant', assistantResponse);
      }

      // Store all tool calls
      for (const toolCall of toolCallRecords) {
        db.insertToolCall(requestId, toolCall);
      }

      console.log(`📊 Logged: ${modelUsed} | ${inputTokens} in / ${outputTokens} out | cache: ${cacheReadTokens} read / ${cacheCreationTokens} write | ${toolCallRecords.length} tools | ${responseTime}ms`);
    } catch (dbError) {
      console.error('Database logging error:', dbError.message);
    }

  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Cost cache to avoid repeated database reads
let costCache = null;
let costCacheTime = 0;
const COST_CACHE_TTL = 60000; // Refresh costs from DB every 60 seconds

/**
 * Get model costs from database (with caching)
 * @returns {Object} Cost settings by pattern
 */
function getModelCostsFromDB() {
  const now = Date.now();
  if (costCache && (now - costCacheTime) < COST_CACHE_TTL) {
    return costCache;
  }
  try {
    costCache = db.getModelCosts();
    costCacheTime = now;
    return costCache;
  } catch (error) {
    console.error('Error loading costs from DB, using defaults:', error.message);
    return null;
  }
}

/**
 * Calculate cost based on model and token usage including cache tokens
 * Pricing per 1M tokens - reads from database settings, falls back to defaults
 *
 * Cache pricing:
 * - Anthropic: cache_read = 0.1x input, cache_write = 1.25x input
 * - OpenAI: cache_read = 0.1x input, cache_write = free (1.0x)
 *
 * Note: For OpenAI, input_tokens INCLUDES cached tokens, so we subtract them
 *       For Anthropic, input_tokens EXCLUDES cached tokens (separate fields)
 */
function calculateCost(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheCreationTokens = 0, provider = null) {
  const modelLower = model.toLowerCase();
  const dbCosts = getModelCostsFromDB();

  // Determine provider from model if not specified
  if (!provider) {
    if (modelLower.includes('claude') || modelLower.includes('opus') ||
        modelLower.includes('sonnet') || modelLower.includes('haiku')) {
      provider = 'anthropic';
    } else if (modelLower.includes('gpt')) {
      provider = 'openai';
    } else {
      provider = 'ollama';
    }
  }

  // Cache pricing multipliers
  const cacheReadMultiplier = provider === 'anthropic' ? 0.1 : 0.1;  // Both 90% discount
  const cacheWriteMultiplier = provider === 'anthropic' ? 1.25 : 1.0; // Anthropic 25% premium, OpenAI free

  // For OpenAI, input_tokens includes cached tokens - subtract them for regular pricing
  // For Anthropic, input_tokens is separate from cache tokens
  const regularInputTokens = provider === 'openai'
    ? Math.max(0, inputTokens - cacheReadTokens)
    : inputTokens;

  // Find base pricing
  let pricing = { input: 1.00, output: 3.00 };

  if (dbCosts) {
    // Check patterns in priority order (most specific first)
    const patterns = Object.keys(dbCosts).sort((a, b) => b.length - a.length);
    for (const pattern of patterns) {
      if (pattern === 'default') continue; // Skip default, use as fallback
      if (modelLower.includes(pattern.toLowerCase())) {
        pricing = dbCosts[pattern];
        break;
      }
    }
    // Check for Ollama/local models (contain ':' indicating a tag)
    if (modelLower.includes(':')) {
      if (dbCosts['ollama']) {
        pricing = dbCosts['ollama'];
      } else {
        return 0; // Local models are free
      }
    }
    // Use default if no match found and pricing wasn't set
    if (pricing.input === 1.00 && pricing.output === 3.00 && dbCosts['default']) {
      pricing = dbCosts['default'];
    }
  } else {
    // Hardcoded fallback if database not available
    if (modelLower.includes(':') || modelLower.startsWith('llama') || modelLower.startsWith('mistral')) {
      pricing = { input: 0, output: 0 };
    } else if (modelLower.includes('opus')) {
      pricing = { input: 5.00, output: 25.00 };
    } else if (modelLower.includes('sonnet')) {
      pricing = { input: 3.00, output: 15.00 };
    } else if (modelLower.includes('haiku')) {
      pricing = { input: 1.00, output: 5.00 };
    } else if (modelLower.includes('gpt-5.2')) {
      pricing = { input: 1.75, output: 14.00 };
    } else if (modelLower.includes('gpt-5')) {
      pricing = { input: 1.25, output: 10.00 };
    }
  }

  // Calculate costs
  const regularInputCost = (regularInputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  // Cache costs (relative to base input price)
  const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.input * cacheReadMultiplier;
  const cacheWriteCost = (cacheCreationTokens / 1_000_000) * pricing.input * cacheWriteMultiplier;

  return regularInputCost + outputCost + cacheReadCost + cacheWriteCost;
}

/**
 * Send a special SSE event (for sources/status)
 */
function sendSSEEvent(res, eventType, data) {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Maximum tool iterations to prevent infinite loops
 */
const MAX_TOOL_ITERATIONS = parseInt(process.env.MAX_TOOL_ITERATIONS || '5', 10);

/**
 * Maximum input tokens allowed per request (0 = unlimited)
 * Uses ~4 chars per token approximation to avoid needing a tokenizer
 */
const MAX_INPUT_TOKENS = parseInt(process.env.MAX_INPUT_TOKENS || '0', 10);

/**
 * Token threshold to trigger conversation compaction (0 = disabled).
 * When estimated input tokens exceed this, older messages are summarized.
 * Only takes effect when ENABLE_COMPACTION is on and a compaction model is configured in the pipeline.
 */
const COMPACTION_TOKEN_THRESHOLD = parseInt(process.env.COMPACTION_TOKEN_THRESHOLD || '65536', 10);

/**
 * Max tokens for any single user message (0 = disabled).
 * Messages exceeding this are replaced with a notice on every request.
 */
const MAX_USER_MESSAGE_TOKENS = parseInt(process.env.MAX_USER_MESSAGE_TOKENS || '8192', 10);

/**
 * Estimate token count for a message array.
 * Counts text (~3.2 chars/token), images (~500 tokens each),
 * tool_use/tool_result blocks, and per-message structure overhead.
 * @param {Array} messages - Message array
 * @param {object} [options] - Optional settings
 * @param {number} [options.toolCount=0] - Number of tool definitions in the API payload (~350 tokens each)
 */
function estimateTokens(messages, options = {}) {
  const { toolCount = 0 } = options;
  let chars = 0;

  for (const msg of messages) {
    // Per-message structure overhead (role, separators, metadata)
    chars += 48; // ~15 tokens

    if (typeof msg.content === 'string') {
      chars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text' && block.text) {
          chars += block.text.length;
        } else if (block.type === 'image_url' || block.type === 'image' || block.type === 'input_image') {
          chars += 1600; // ~500 tokens
        } else if (block.type === 'tool_use') {
          chars += (block.name || '').length + JSON.stringify(block.input || {}).length;
        } else if (block.type === 'tool_result') {
          const content = block.content;
          if (typeof content === 'string') {
            chars += content.length;
          } else if (Array.isArray(content)) {
            for (const sub of content) {
              if (sub.type === 'text' && sub.text) chars += sub.text.length;
            }
          }
        }
      }
    }
  }

  // Tool definitions overhead
  chars += toolCount * 1120; // ~350 tokens per tool definition

  return Math.ceil(chars / 3.2);
}

/**
 * Trim messages to fit within token budget.
 * Keeps: system messages (always), last user message (always).
 * Removes: oldest non-system messages first.
 */
function trimMessagesToTokenLimit(messages, maxTokens, toolCount = 0) {
  if (!maxTokens || maxTokens <= 0) return messages;

  const estimated = estimateTokens(messages, { toolCount });
  if (estimated <= maxTokens) return messages;

  // Separate system messages (always kept) from conversation messages
  const systemMsgs = messages.filter(m => m.role === 'system');
  const convMsgs = messages.filter(m => m.role !== 'system');

  if (convMsgs.length === 0) return messages;

  // Always keep the last message (current user turn)
  const lastMsg = convMsgs[convMsgs.length - 1];
  let trimmed = convMsgs.slice(0, -1);

  // Calculate budget: total max minus system messages minus last message minus tool definitions
  // toolCount only counted once here (not per-message)
  const systemTokens = estimateTokens(systemMsgs);
  const lastMsgTokens = estimateTokens([lastMsg]);
  const toolTokens = toolCount * 350;
  let budget = maxTokens - systemTokens - lastMsgTokens - toolTokens;

  // Keep as many recent messages as fit within budget (from newest to oldest)
  const kept = [];
  for (let i = trimmed.length - 1; i >= 0 && budget > 0; i--) {
    const msgTokens = estimateTokens([trimmed[i]]);
    if (msgTokens <= budget) {
      kept.unshift(trimmed[i]);
      budget -= msgTokens;
    } else {
      break; // Stop at first message that doesn't fit to keep contiguous history
    }
  }

  const removed = trimmed.length - kept.length;
  if (removed > 0) {
    console.log(`✂️ [TOKEN LIMIT] Trimmed ${removed} older messages (estimated ${estimated} → ~${maxTokens} tokens)`);
  }

  return [...systemMsgs, ...kept, lastMsg];
}

/**
 * Compact long conversations by summarizing old messages with a cheap LLM.
 * Stores rolling summaries in the database keyed by conversation_id.
 *
 * Flow:
 * 1. No summary exists + under threshold → pass through
 * 2. No summary exists + over threshold → first compaction
 * 3. Summary exists + summary + new msgs under threshold → use cached summary
 * 4. Summary exists + summary + new msgs over threshold → re-compact
 *
 * Always keeps the last 2 conversation messages (latest user/assistant exchange).
 */
async function compactMessages(processedMessages, config, database, conversationId, onStatus = null, toolCount = 0) {
  const threshold = COMPACTION_TOKEN_THRESHOLD;
  if (!threshold || threshold <= 0) return processedMessages;
  if (!config.enable_compaction) return processedMessages;
  if (!config.compaction_provider || !config.compaction_model) return processedMessages;

  // Separate system messages from conversation messages
  const systemMsgs = processedMessages.filter(m => m.role === 'system');
  const convMsgs = processedMessages.filter(m => m.role !== 'system');

  if (convMsgs.length <= 2) return processedMessages; // Nothing to compact

  // Check for existing summary
  const existing = database.getSummary(conversationId);

  if (existing && existing.watermark < convMsgs.length) {
    // We have a previous summary — replace old messages with it
    const summaryMsg = { role: 'system', content: `[CONVERSATION SUMMARY]\n${existing.summary}\n[/CONVERSATION SUMMARY]` };
    const newMsgsSinceWatermark = convMsgs.slice(existing.watermark);

    // Check if summary + new messages fit under threshold
    const estimated = estimateTokens([...systemMsgs, summaryMsg, ...newMsgsSinceWatermark], { toolCount });

    if (estimated <= threshold) {
      // Fits! Use cached summary + new messages, no re-compaction needed
      console.log(`📋 [COMPACTION] Using cached summary (watermark=${existing.watermark}) + ${newMsgsSinceWatermark.length} new messages (~${estimated} tokens)`);
      return [...systemMsgs, summaryMsg, ...newMsgsSinceWatermark];
    }

    // Over threshold even with summary — need to re-compact
    const recentCount = 2;
    const toSummarize = newMsgsSinceWatermark.slice(0, -recentCount);
    const recentMsgs = newMsgsSinceWatermark.slice(-recentCount);
    const recentStartIndex = convMsgs.length - recentCount;

    // Build messages for compaction LLM: include previous summary as context
    // Trim to MAX_INPUT_TOKENS so we don't exceed the compaction model's context window
    const msgsToProcess = trimMessagesToTokenLimit([summaryMsg, ...toSummarize], MAX_INPUT_TOKENS);
    console.log(`🔄 [COMPACTION] Re-compacting: prev summary + ${toSummarize.length} messages, keeping last ${recentCount}`);

    if (onStatus) onStatus(false);
    const summary = await callCompactionLLM(msgsToProcess, config);
    if (onStatus) onStatus(true);
    database.upsertSummary(conversationId, summary, recentStartIndex);

    const newSummaryMsg = { role: 'system', content: `[CONVERSATION SUMMARY]\n${summary}\n[/CONVERSATION SUMMARY]` };
    return [...systemMsgs, newSummaryMsg, ...recentMsgs];

  } else if (!existing) {
    // No existing summary — check if we need one
    const estimated = estimateTokens(processedMessages, { toolCount });
    if (estimated <= threshold) return processedMessages; // Under threshold, no compaction needed

    // Over threshold, first compaction
    const recentCount = 2;
    const toSummarize = convMsgs.slice(0, -recentCount);
    const recentMsgs = convMsgs.slice(-recentCount);
    const recentStartIndex = convMsgs.length - recentCount;

    // Trim to MAX_INPUT_TOKENS so we don't exceed the compaction model's context window
    const trimmedToSummarize = trimMessagesToTokenLimit(toSummarize, MAX_INPUT_TOKENS);
    console.log(`✂️ [COMPACTION] First compaction: summarizing ${trimmedToSummarize.length} messages (of ${toSummarize.length}), keeping last ${recentCount}`);

    if (onStatus) onStatus(false);
    const summary = await callCompactionLLM(trimmedToSummarize, config);
    if (onStatus) onStatus(true);
    database.upsertSummary(conversationId, summary, recentStartIndex);

    const summaryMsg = { role: 'system', content: `[CONVERSATION SUMMARY]\n${summary}\n[/CONVERSATION SUMMARY]` };
    return [...systemMsgs, summaryMsg, ...recentMsgs];
  }

  return processedMessages;
}

/**
 * Call a cheap/fast LLM to summarize conversation messages.
 * Uses the compaction_provider and compaction_model from pipeline config.
 */
async function callCompactionLLM(messagesToSummarize, config) {
  // Format the conversation as text for the compaction prompt
  const conversationText = messagesToSummarize.map(m => {
    const role = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System';
    const content = typeof m.content === 'string' ? m.content
      : Array.isArray(m.content)
        ? m.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        : '';
    return `${role}: ${content}`;
  }).join('\n\n');

  const compactionPrompt = [
    {
      role: 'system',
      content: 'You are a conversation summarizer. Create a concise but comprehensive summary of the conversation below. Preserve: key decisions, important facts, user preferences, action items, and any context the assistant would need to continue helping effectively. Do NOT include pleasantries or filler. Output only the summary, nothing else.'
    },
    {
      role: 'user',
      content: conversationText
    }
  ];

  const maxSummaryTokens = parseInt(process.env.COMPACTION_MAX_SUMMARY_TOKENS || '1024', 10);
  const compactionConfig = {
    ANTHROPIC_API_KEY: config.anthropic_api_key,
    OPENAI_API_KEY: config.openai_api_key,
    OLLAMA_BASE_URL: config.ollama_base_url || 'http://localhost:11434',
    ANTHROPIC_MAX_TOKENS: maxSummaryTokens,
  };

  let summaryText = '';
  const response = await chatCompletion({
    model: config.compaction_model,
    provider: config.compaction_provider,
    messages: compactionPrompt,
    enabledTools: [],
    config: compactionConfig,
    onText: (chunk) => { summaryText += chunk; },
    stream: false,
    maxIterations: 1,
  });

  // Prefer accumulated text from onText, fall back to response.content
  const finalSummary = summaryText || response.content || 'Unable to generate summary.';
  console.log(`📝 [COMPACTION] Summary generated: ${finalSummary.length} chars (~${Math.ceil(finalSummary.length / 4)} tokens)`);
  return finalSummary;
}

/**
 * Serve files from user volumes
 * Supports both:
 *   - /[email]/[conversation-id]/volume/... (chat-created files)
 *   - /[email]/session-[timestamp]/volume/... (CEE-uploaded files)
 */
app.get('/:user_email/:folder_id/volume/*', (req, res) => {
  const { user_email, folder_id } = req.params;
  const filePath = req.params[0];

  // Sanitize path components
  const safeEmail = user_email.replace(/[^a-zA-Z0-9@._-]/g, '_');
  const safeFolderId = folder_id.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Build and resolve path
  const fullPath = path.join(DATA_DIR, safeEmail, safeFolderId, 'volume', filePath);
  const resolvedPath = path.resolve(fullPath);

  // Security: ensure path stays within DATA_DIR
  if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
    console.log(`⚠️ Path traversal attempt blocked: ${resolvedPath}`);
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(resolvedPath)) {
    console.log(`📂 File not found: ${resolvedPath}`);
    return res.status(404).json({ error: 'File not found' });
  }

  console.log(`📥 Serving file: ${resolvedPath}`);
  res.sendFile(resolvedPath);
});

// Start server with extended timeout for long-running tool operations (e.g., ComfyUI)
const server = app.listen(PORT, HOST, () => {
  console.log(`\n✅ OWUI Toolset V2 API Server running on http://${HOST}:${PORT}\n`);
});

// Set server timeout to 10 minutes (default is 2 minutes, too short for image generation)
server.timeout = 600000; // 10 minutes in milliseconds
server.keepAliveTimeout = 120000; // 2 minutes keep-alive
server.headersTimeout = 620000; // Slightly longer than timeout

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');

  // Cleanup sandbox containers
  try {
    await containerManager.cleanupAll();
  } catch (err) {
    console.error('Error cleaning up containers:', err.message);
  }

  db.close(); // Flush pending saves and close database
  process.exit(0);
});

export default app;
