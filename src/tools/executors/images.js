/**
 * ComfyUI image tools: image_generation, image_edit, image_blend.
 *
 * All three call the same server, just with different Flux workflows.
 * Output images are saved under data/<email>/<conv>/volume/comfyui/.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as comfyui from '../comfyui.js';
import { formatToolResult, toolError } from '../../utils/tool-result.js';
import { compressForLLM } from '../../utils/image-compressor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

/**
 * Resolve a uploaded image URL to a local buffer where possible; else
 * fetch from network.
 */
async function loadImage(url, fallbackName) {
  if (url.includes('/volume/uploaded/') || url.includes('/volume/comfyui/')) {
    const urlParts = url.split('/volume/');
    if (urlParts.length >= 2) {
      const relativePath = 'volume/' + urlParts[1];
      const m = url.match(/\/([^/]+)\/([^/]+)\/volume\//);
      if (m) {
        const safeEmail = m[1];
        const safeConvId = m[2];
        const localPath = path.join(projectRoot, 'data', safeEmail, safeConvId, relativePath);
        if (fs.existsSync(localPath)) {
          return { buffer: fs.readFileSync(localPath), filename: path.basename(localPath) };
        }
      }
    }
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), filename: fallbackName || `input-${Date.now()}.png` };
}

/**
 * Save a generated image and return its metadata.
 */
function saveOutputImage(buffer, namePrefix, config) {
  const { USER_EMAIL: userEmail, CONVERSATION_ID: conversationId, TOOLSET_API_URL: toolsetApiUrl } = config;
  if (!userEmail || !conversationId || !toolsetApiUrl) return null;

  const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
  const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const folderPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', 'comfyui');
  fs.mkdirSync(folderPath, { recursive: true });

  const filename = `${namePrefix}-${Date.now()}.png`;
  const filePath = path.join(folderPath, filename);
  fs.writeFileSync(filePath, buffer);

  const url = `${toolsetApiUrl}/${safeEmail}/${safeConvId}/volume/comfyui/${filename}`;
  return { filename, filePath, url };
}

function writeMetadata(filePath, metadata) {
  fs.writeFileSync(`${filePath}.meta.json`, JSON.stringify({ ...metadata, timestamp: new Date().toISOString() }, null, 2));
}

async function withComfyUI(toolName, config, callbacks, fn) {
  const comfyUrl = config.comfyui_base_url;
  if (!comfyUrl) return toolError(toolName, 'ComfyUI server not configured');

  if (!(await comfyui.checkHealth(comfyUrl))) {
    return toolError(toolName, 'ComfyUI server is not available');
  }

  const onProgress = callbacks.onProgress || (() => {});
  try {
    return await fn(comfyUrl, onProgress);
  } catch (err) {
    console.error(`${toolName} failed:`, err.message);
    return toolError(toolName, `${toolName.replace('image_', '').replace(/^\w/, c => c.toUpperCase())} failed: ${err.message}`);
  }
}

export async function executeImageGeneration(params, config, callbacks = {}) {
  const prompt = params.prompt;
  if (!prompt) return toolError('image_generation', 'No prompt provided');

  return withComfyUI('image_generation', config, callbacks, async (comfyUrl, onProgress) => {
    const result = await comfyui.generateImage(comfyUrl, {
      prompt,
      negative_prompt: params.negative_prompt || '',
      width: params.width,
      height: params.height,
      steps: params.steps,
      filename_prefix: `gen-${Date.now()}`,
    }, (p) => onProgress({ type: 'status', message: p.message }));

    const saved = saveOutputImage(result.image, 'generated', config);
    const imageUrl = saved?.url || null;
    if (saved) {
      writeMetadata(saved.filePath, {
        type: 'image_generation',
        prompt,
        negative_prompt: params.negative_prompt || '',
        width: result.width,
        height: result.height,
        steps: params.steps || 15,
      });
      console.log(`🎨 Generated image saved: ${saved.filePath}`);
    }

    const resultText = imageUrl
      ? `Image generated successfully!\n\n**Prompt:** ${prompt}\n**Resolution:** ${result.width}x${result.height}\n\n![Generated Image](${imageUrl})\n\n**Download:** ${imageUrl}`
      : `Image generated but could not save to storage. Check ComfyUI output folder.`;

    return {
      result: formatToolResult('image_generation', resultText),
      sources: imageUrl ? [{
        source: { name: 'Generated Image', url: imageUrl },
        document: [`# Generated Image\n\n**Prompt:** ${prompt}\n\n![Image](${imageUrl})`],
        metadata: [{ title: 'Generated Image', url: imageUrl, type: 'image_generation' }],
      }] : [],
      imageUrl,
      error: null,
    };
  });
}

export async function executeImageEdit(params, config, callbacks = {}) {
  const { image_url: sourceUrl, prompt } = params;
  if (!sourceUrl) return toolError('image_edit', 'No image URL provided');
  if (!prompt)    return toolError('image_edit', 'No edit prompt provided');

  return withComfyUI('image_edit', config, callbacks, async (comfyUrl, onProgress) => {
    onProgress({ type: 'status', message: 'Fetching source image...' });
    const source = await loadImage(sourceUrl);

    const result = await comfyui.editImage(comfyUrl, {
      inputImage: source.buffer,
      inputFilename: source.filename,
      prompt,
      negative_prompt: params.negative_prompt || '',
      steps: params.steps,
      filename_prefix: `edit-${Date.now()}`,
    }, (p) => onProgress({ type: 'status', message: p.message }));

    const saved = saveOutputImage(result.image, 'edited', config);
    const outputUrl = saved?.url || null;
    if (saved) {
      writeMetadata(saved.filePath, {
        type: 'image_edit',
        source_url: sourceUrl,
        prompt,
        negative_prompt: params.negative_prompt || '',
        steps: params.steps || 15,
      });
      console.log(`🎨 Edited image saved: ${saved.filePath}`);
    }

    const resultText = outputUrl
      ? `Image edited successfully!\n\n**Edit prompt:** ${prompt}\n\n![Edited Image](${outputUrl})\n\n**Download:** ${outputUrl}`
      : `Image edited but could not save to storage. Check ComfyUI output folder.`;

    return {
      result: formatToolResult('image_edit', resultText),
      sources: outputUrl ? [{
        source: { name: 'Edited Image', url: outputUrl },
        document: [`# Edited Image\n\n**Prompt:** ${prompt}\n\n![Image](${outputUrl})`],
        metadata: [{ title: 'Edited Image', url: outputUrl, type: 'image_edit' }],
      }] : [],
      imageUrl: outputUrl,
      error: null,
    };
  });
}

/**
 * Re-inline an image from this conversation so the LLM can look at it again.
 *
 * Reads the full-quality file from disk, compresses for vision, and returns
 * the bytes via the executor's `images` channel — runTools in each provider
 * converts that into the right inline format (Anthropic: image block in
 * tool_result; OpenAI: synthetic input_image user message).
 *
 * Security: the URL must match the calling user+conversation. No cross-conv,
 * no cross-user, no path traversal.
 */
export async function executeViewImage(params, config) {
  const url = params?.image_url;
  if (!url || typeof url !== 'string') {
    return toolError('view_image', 'No image_url provided');
  }

  const { USER_EMAIL: userEmail, CONVERSATION_ID: conversationId } = config || {};
  if (!userEmail || !conversationId) {
    return toolError('view_image', 'Internal error: missing user or conversation context');
  }

  const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
  const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Expected URL shape: <host>/<email>/<conv>/volume/(uploaded|comfyui)/<filename>
  const m = url.match(/\/([^/]+)\/([^/?#]+)\/volume\/(uploaded|comfyui)\/([^/?#]+)$/);
  if (!m) {
    return toolError(
      'view_image',
      'Invalid image URL — must be a /volume/uploaded/ or /volume/comfyui/ path from this conversation',
    );
  }
  const [, urlEmail, urlConv, folder, filename] = m;
  if (urlEmail !== safeEmail || urlConv !== safeConvId) {
    return toolError('view_image', 'Image does not belong to this conversation');
  }

  const localPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', folder, filename);
  const resolvedPath = path.resolve(localPath);
  const dataDir = path.resolve(path.join(projectRoot, 'data'));
  if (!resolvedPath.startsWith(dataDir + path.sep) && resolvedPath !== dataDir) {
    return toolError('view_image', 'Path traversal blocked');
  }
  if (!fs.existsSync(resolvedPath)) {
    return toolError('view_image', `Image not found: ${filename}`);
  }

  let buffer;
  try {
    buffer = fs.readFileSync(resolvedPath);
  } catch (err) {
    return toolError('view_image', `Failed to read image: ${err.message}`);
  }

  let compressed;
  try {
    compressed = await compressForLLM(buffer);
  } catch (err) {
    return toolError('view_image', `Failed to compress image: ${err.message}`);
  }

  const sizeKB = Math.round(compressed.buffer.length / 1024);
  console.log(`👁️ [VIEW_IMAGE] Re-inlined ${filename} (${sizeKB}KB ${compressed.mediaType})`);

  return {
    result: formatToolResult(
      'view_image',
      `Image loaded: ${filename} (${sizeKB}KB ${compressed.mediaType}). The image is now visible in the next message.`,
    ),
    sources: [],
    error: null,
    images: [{
      mediaType: compressed.mediaType,
      base64: compressed.base64,
      filename,
    }],
  };
}

export async function executeImageBlend(params, config, callbacks = {}) {
  const { image_url_1, image_url_2, prompt } = params;
  if (!image_url_1 || !image_url_2) return toolError('image_blend', 'Two image URLs are required');
  if (!prompt) return toolError('image_blend', 'No blend prompt provided');

  return withComfyUI('image_blend', config, callbacks, async (comfyUrl, onProgress) => {
    onProgress({ type: 'status', message: 'Fetching source images...' });
    const [image1, image2] = await Promise.all([
      loadImage(image_url_1, `input1-${Date.now()}.png`),
      loadImage(image_url_2, `input2-${Date.now()}.png`),
    ]);

    const result = await comfyui.blendImages(comfyUrl, {
      inputImage1: image1.buffer,
      inputFilename1: image1.filename,
      inputImage2: image2.buffer,
      inputFilename2: image2.filename,
      prompt,
      negative_prompt: params.negative_prompt || '',
      steps: params.steps,
      filename_prefix: `blend-${Date.now()}`,
    }, (p) => onProgress({ type: 'status', message: p.message }));

    const saved = saveOutputImage(result.image, 'blended', config);
    const outputUrl = saved?.url || null;
    if (saved) {
      writeMetadata(saved.filePath, {
        type: 'image_blend',
        source_url_1: image_url_1,
        source_url_2: image_url_2,
        prompt,
        negative_prompt: params.negative_prompt || '',
        steps: params.steps || 15,
      });
      console.log(`🎨 Blended image saved: ${saved.filePath}`);
    }

    const resultText = outputUrl
      ? `Images blended successfully!\n\n**Blend prompt:** ${prompt}\n\n![Blended Image](${outputUrl})\n\n**Download:** ${outputUrl}`
      : `Images blended but could not save to storage. Check ComfyUI output folder.`;

    return {
      result: formatToolResult('image_blend', resultText),
      sources: outputUrl ? [{
        source: { name: 'Blended Image', url: outputUrl },
        document: [`# Blended Image\n\n**Prompt:** ${prompt}\n\n![Image](${outputUrl})`],
        metadata: [{ title: 'Blended Image', url: outputUrl, type: 'image_blend' }],
      }] : [],
      imageUrl: outputUrl,
      error: null,
    };
  });
}
