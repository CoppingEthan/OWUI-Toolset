/**
 * OWUI Toolset V2 - Main API Server
 *
 * Hosts:
 *   - POST /api/v1/chat          — streaming chat with tool calling
 *   - PUT|POST /process          — CEE file extraction for Open WebUI
 *   - GET  /:email/:id/volume/*  — serves per-conversation files
 *   - /api/v1/file-recall/*      — document library management
 *
 * Supported LLM providers: OpenAI, Anthropic. Adding a new provider only
 * requires creating src/tools/providers/<name>.js and registering it in
 * src/tools/providers/index.js.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { detectImageType, compressForLLM, compressImage } from '../utils/image-compressor.js';
import { extractContent } from '../cee/index.js';
import { streamChat } from '../tools/providers/index.js';
import { getEnabledToolNames } from '../tools/definitions.js';
import { logSection, logMessages, log } from '../utils/debug-logger.js';
import { createFileRecallRouter } from '../file-recall/router.js';
import { isInstanceAllowed } from './ip-allowlist.js';
import { createPricingLookup } from './cost.js';
import { compactMessages, trimMessagesToTokenLimit, estimateTokens, MAX_INPUT_TOKENS } from './compaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Default models per provider (used only when the pipeline omits llm_model).
const DEFAULT_MODELS = {
  openai: 'gpt-5.2',
  anthropic: 'claude-sonnet-4-6',
};

const DATA_DIR = path.join(projectRoot, 'data');
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

/**
 * Express app factory. Returns the configured API app ready to listen.
 * Caller provides a shared DatabaseManager instance.
 */
export function createApiApp(db) {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const { calculateCost } = createPricingLookup(db);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  app.use(cors({ origin: process.env.ENABLE_CORS === 'true' ? '*' : false }));

/**
 * Authentication Middleware — timing-safe bearer-token compare.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  const expected = process.env.API_SECRET_KEY || '';
  const a = Buffer.from(token, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
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

    // Truncate extracted content if it exceeds the per-file token budget.
    // Keeps first half + truncation notice + last half so the LLM sees the
    // beginning and end of the document. It can read the full file via sandbox.
    let pageContent = extractedContent.markdown;
    if (MAX_USER_MESSAGE_TOKENS > 0) {
      const maxCeeChars = Math.floor(MAX_USER_MESSAGE_TOKENS * 3.2);
      if (pageContent.length > maxCeeChars) {
        const halfChars = Math.floor(maxCeeChars / 2);
        const originalTokens = Math.ceil(pageContent.length / 3.2).toLocaleString();
        const truncNotice = `\n\n✂️ [File content truncated — showing first and last portions of ~${originalTokens} tokens. The full file is available in the sandbox at /workspace/uploaded/${cleanFilename}]\n\n`;
        pageContent = pageContent.substring(0, halfChars) + truncNotice + pageContent.substring(pageContent.length - halfChars);
        console.log(`✂️ CEE Truncated: ${cleanFilename} (${originalTokens} tokens → ~${MAX_USER_MESSAGE_TOKENS} tokens)`);
      }
    }

    // Return in OWUI Document format (Pydantic model expects page_content and metadata)
    res.json({
      page_content: pageContent,
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
 * Main chat endpoint. Streams SSE events to the caller (the OWUI pipeline).
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

    if (lastMessage && Array.isArray(lastMessage.content)) {
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
    const llmProvider = (config.llm_provider || 'anthropic').toLowerCase();
    const llmModel = config.llm_model || null;  // May be null, resolved below
    const useTools = config.use_tools !== false;  // Default to true

    const openaiKey = config.openai_api_key;
    const anthropicKey = config.anthropic_api_key;

    console.log(`💬 Chat: ${user_email || 'unknown'} | ${messages.length} msgs | provider=${llmProvider} | tools=${useTools} | stream=${stream}`);

    // Validate the selected provider has required credentials
    if (llmProvider === 'openai' && (!openaiKey || openaiKey.length === 0)) {
      return res.status(400).json({ error: 'OpenAI selected but OPENAI_API_KEY not configured in Valves.' });
    }
    if (llmProvider === 'anthropic' && (!anthropicKey || anthropicKey.length === 0)) {
      return res.status(400).json({ error: 'Anthropic selected but ANTHROPIC_API_KEY not configured in Valves.' });
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

    // Truncate oversized user messages — checked on every request so no state needed.
    // OWUI resends the full conversation history, so an oversized message from turn 3
    // inflates every subsequent request. Older messages are replaced with a short notice.
    // The LAST user message (current turn) is truncated instead of replaced — first half
    // + notice + last half — so the user's question and file context are preserved.
    // The limit for the last message scales with attached files (8k per file on top of 8k base).
    if (MAX_USER_MESSAGE_TOKENS > 0) {
      const baseMaxChars = Math.floor(MAX_USER_MESSAGE_TOKENS * 3.2);
      const fileCount = files?.length || 0;
      const lastMsgMaxChars = Math.floor(MAX_USER_MESSAGE_TOKENS * (1 + fileCount) * 3.2);
      const notice = `[This message exceeded the maximum allowed length of ${MAX_USER_MESSAGE_TOKENS.toLocaleString()} tokens and was removed]`;

      // Find the last user message index (current turn)
      let lastUserIdx = -1;
      for (let i = processedMessages.length - 1; i >= 0; i--) {
        if (processedMessages[i].role === 'user') { lastUserIdx = i; break; }
      }

      for (let i = 0; i < processedMessages.length; i++) {
        const msg = processedMessages[i];
        if (msg.role !== 'user') continue;
        const isLatest = (i === lastUserIdx);
        const maxChars = isLatest ? lastMsgMaxChars : baseMaxChars;

        if (typeof msg.content === 'string' && msg.content.length > maxChars) {
          if (isLatest) {
            // Truncate: keep first half + notice + last half (preserves question at start, context at end)
            const halfChars = Math.floor(maxChars / 2);
            const originalTokens = Math.ceil(msg.content.length / 3.2).toLocaleString();
            msg.content = msg.content.substring(0, halfChars) +
              `\n\n✂️ [Message truncated — original was ~${originalTokens} tokens. First and last portions preserved.]\n\n` +
              msg.content.substring(msg.content.length - halfChars);
            console.log(`✂️ [MSG LIMIT] Truncated current user message: ~${originalTokens} → ~${MAX_USER_MESSAGE_TOKENS * (1 + fileCount)} tokens`);
            if (stream) {
              sendSSEEvent(res, 'status', { data: { description: `✂️ Your message was too long (~${originalTokens} tokens) and has been truncated`, done: true } });
            }
          } else {
            msg.content = notice;
          }
        } else if (Array.isArray(msg.content)) {
          // Check combined text length across all text blocks
          let textChars = 0;
          for (const block of msg.content) {
            if (block.type === 'text' && block.text) textChars += block.text.length;
          }
          if (textChars > maxChars) {
            if (isLatest) {
              // Truncate text blocks, keep image/other blocks intact
              const halfChars = Math.floor(maxChars / 2);
              const originalTokens = Math.ceil(textChars / 3.2).toLocaleString();
              let remaining = halfChars;
              const endBudget = halfChars;

              // Collect all text into one string for end-portion extraction
              const allText = msg.content.filter(b => b.type === 'text' && b.text).map(b => b.text).join('\n');
              const endPortion = allText.substring(allText.length - endBudget);

              // Truncate text blocks from the front
              for (const block of msg.content) {
                if (block.type === 'text' && block.text) {
                  if (remaining <= 0) {
                    block.text = '';
                  } else if (block.text.length > remaining) {
                    block.text = block.text.substring(0, remaining) +
                      `\n\n✂️ [Message truncated — original text was ~${originalTokens} tokens. First and last portions preserved.]\n\n` +
                      endPortion;
                    remaining = 0;
                  } else {
                    remaining -= block.text.length;
                  }
                }
              }
              // Remove emptied text blocks
              msg.content = msg.content.filter(b => b.type !== 'text' || (b.text && b.text.length > 0));
              console.log(`✂️ [MSG LIMIT] Truncated current user message (multimodal): ~${originalTokens} → ~${MAX_USER_MESSAGE_TOKENS * (1 + fileCount)} text tokens`);
              if (stream) {
                sendSSEEvent(res, 'status', { data: { description: `✂️ Your message was too long (~${originalTokens} tokens) and has been truncated`, done: true } });
              }
            } else {
              // Replace all text blocks with the notice, keep image blocks
              msg.content = msg.content.filter(b => b.type !== 'text');
              msg.content.push({ type: 'text', text: notice });
            }
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

    // ═══════════════════════════════════════════════════════════
    // Chat — always runs against the streaming provider API. If the
    // caller wanted JSON, we buffer and respond once at the end.
    // ═══════════════════════════════════════════════════════════

    let toolCallsDisplay = '';
    let keepAliveInterval = null;
    if (stream) {
      keepAliveInterval = setInterval(() => {
        try { res.write(': keepalive\n\n'); } catch { clearInterval(keepAliveInterval); }
      }, 15000);
    }

    try {
      const response = await streamChat({
        model,
        provider: llmProvider,
        messages: processedMessages,
        enabledTools: enabledToolNames,
        config: toolConfig,
        maxIterations: MAX_TOOL_ITERATIONS,

        onText: (chunk) => {
          assistantResponse += chunk;
          if (stream) sendChunk(chunk);
        },

        onToolCall: (toolCall) => {
          const toolName = toolCall.name;
          const toolParams = toolCall.input || toolCall.arguments;
          const query = toolParams.query || toolParams.urls?.[0] || '';
          let friendlyDesc;
          switch (toolName) {
            case 'web_search':
              friendlyDesc = `🌐 Searching: ${query}...`; break;
            case 'deep_research':
              friendlyDesc = `🔍 Deep Researching: ${query}...`; break;
            case 'web_scrape': {
              const urlCount = Array.isArray(toolParams.urls) ? toolParams.urls.length : 1;
              const urlDisplay = urlCount > 1 ? `${urlCount} URLs` : query;
              friendlyDesc = `📄 Scraping: ${urlDisplay}...`;
              break;
            }
            case 'file_recall_search':
              friendlyDesc = `📂 Searching documents: ${query}...`; break;
            default:
              friendlyDesc = `🔧 ${toolName}: ${query}...`;
          }
          const paramsJson = JSON.stringify(toolParams, null, 2);
          const display = stream
            ? `\n\n<details id="__DETAIL_${detailId++}__">\n<summary>${friendlyDesc}</summary>\n\n\`\`\`json\n${paramsJson}\n\`\`\`\n</details>\n\n`
            : `\n\n<details>\n<summary>${friendlyDesc}</summary>\n\n\`\`\`json\n${paramsJson}\n\`\`\`\n</details>\n\n`;
          if (stream) sendChunk(display);
          else toolCallsDisplay += display;

          if (!toolsUsed.includes(toolName)) toolsUsed.push(toolName);
          toolCallRecords.push({
            tool_name: toolName,
            tool_params: toolParams,
            tool_result: '',
            success: true,
            execution_time_ms: 0,
          });
        },

        onToolOutput: (chunk) => {
          assistantResponse += chunk;
          if (stream) sendChunk(chunk);
        },

        onSource: (source) => {
          if (!stream) return; // non-streaming replies don't carry citations
          try {
            JSON.stringify(source);
            console.log(`📚 Emitting source: ${source.source?.name || source.source?.url || 'unknown'}`);
            sendSSEEvent(res, 'source', { data: source });
          } catch (e) {
            console.error('Failed to serialize source for SSE:', e.message);
          }
        },
      });

      if (response.usage) {
        inputTokens  = response.usage.input_tokens  || response.usage.prompt_tokens     || 0;
        outputTokens = response.usage.output_tokens || response.usage.completion_tokens || 0;
        cacheCreationTokens = response.usage.cache_creation_input_tokens || 0;
        cacheReadTokens     = response.usage.cache_read_input_tokens     || 0;
        if (response.usage.prompt_tokens_details?.cached_tokens) {
          cacheReadTokens = response.usage.prompt_tokens_details.cached_tokens;
        }
      }

      console.log(`✅ Chat complete: ${response.iterations || 1} iterations, ${toolsUsed.length} tools, cache: ${cacheReadTokens}r / ${cacheCreationTokens}w`);

      if (stream) {
        sendChunk('', 'stop');
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const fullContent = toolCallsDisplay ? `${toolCallsDisplay}\n\n${assistantResponse}` : assistantResponse;
        res.json({
          id: responseId,
          object: 'chat.completion',
          created,
          model: modelUsed,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: fullContent },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
        });
      }
    } catch (llmError) {
      console.error('LLM error:', llmError.message);
      if (stream) {
        sendChunk(`\n\n❌ Error: ${llmError.message}\n\n`);
        sendChunk('', 'stop');
        res.write('data: [DONE]\n\n');
        res.end();
      } else if (!res.headersSent) {
        res.status(500).json({ error: 'LLM request failed', message: llmError.message });
      }
    } finally {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      cleanupTempProxies();
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
 * Max tokens for any single user message (0 = disabled).
 * Also used as the per-file CEE content budget at the /process endpoint.
 *
 * Chat endpoint behavior:
 * - Last user message: truncated (first half + notice + last half) with a dynamic
 *   limit of MAX_USER_MESSAGE_TOKENS × (1 + fileCount) to accommodate file content.
 * - Older user messages: replaced entirely with a short notice to prevent history bloat.
 */
const MAX_USER_MESSAGE_TOKENS = parseInt(process.env.MAX_USER_MESSAGE_TOKENS || '8192', 10);


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

  return app;
}

/**
 * Apply long-lived server timeouts suitable for image generation and
 * deep research (each can run for minutes).
 */
export function applyServerTimeouts(server) {
  server.timeout = 600000;          // 10 minutes total request budget
  server.keepAliveTimeout = 120000; // 2 minutes keep-alive
  server.headersTimeout = 620000;   // slightly longer than timeout
  return server;
}
