/**
 * ComfyUI API Client
 * Handles workflow execution and image retrieval for Flux.2 Klein 9B workflows
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// Workflow Node Mappings
// ═══════════════════════════════════════════════════════════════════════════

const TEXT_TO_IMAGE_NODES = {
  steps: '85',           // Flux2Scheduler.inputs.steps
  width: '91',           // PrimitiveInt.inputs.value
  height: '92',          // PrimitiveInt.inputs.value
  positive_prompt: '96', // CLIPTextEncode.inputs.text
  negative_prompt: '90', // CLIPTextEncode.inputs.text
  filename: '9',         // SaveImage.inputs.filename_prefix
  seed: '93'             // RandomNoise.inputs.noise_seed
};

const IMAGE_TO_IMAGE_NODES = {
  input_image: '76',     // LoadImage.inputs.image
  steps: '101',          // Flux2Scheduler.inputs.steps
  positive_prompt: '108',// CLIPTextEncode.inputs.text
  negative_prompt: '109',// CLIPTextEncode.inputs.text
  megapixels: '112',     // ImageScaleToTotalPixels.inputs.megapixels
  filename: '9',         // SaveImage.inputs.filename_prefix
  seed: '105'            // RandomNoise.inputs.noise_seed
};

const MULTI_IMAGE_NODES = {
  input_image_1: '76',   // LoadImage.inputs.image (first)
  input_image_2: '81',   // LoadImage.inputs.image (second)
  steps: '92:62',        // Flux2Scheduler.inputs.steps
  positive_prompt: '92:74', // CLIPTextEncode.inputs.text
  negative_prompt: '92:87', // CLIPTextEncode.inputs.text
  megapixels_1: '92:80', // ImageScaleToTotalPixels for image 1
  megapixels_2: '92:85', // ImageScaleToTotalPixels for image 2
  filename: '94',        // SaveImage.inputs.filename_prefix
  seed: '92:73'          // RandomNoise.inputs.noise_seed
};

// ═══════════════════════════════════════════════════════════════════════════
// Workflow Loading
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load a workflow template from the workflows directory
 * @param {string} workflowName - One of: 'text-to-image', 'image-to-image', 'multi-image'
 * @returns {Object} Parsed workflow JSON
 */
function loadWorkflow(workflowName) {
  const workflowPath = path.join(__dirname, '..', 'workflows', `flux-${workflowName}.json`);
  const content = fs.readFileSync(workflowPath, 'utf-8');
  return JSON.parse(content);
}

// ═══════════════════════════════════════════════════════════════════════════
// Parameter Validation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Round dimension to nearest multiple of 64
 * @param {number} value - Dimension value
 * @returns {number} Rounded value
 */
function roundTo64(value) {
  return Math.round(value / 64) * 64;
}

/**
 * Calculate megapixels from dimensions
 * @param {number} width
 * @param {number} height
 * @returns {number} Megapixels
 */
function calculateMegapixels(width, height) {
  return (width * height) / 1_000_000;
}

/**
 * Validate and adjust dimensions to stay within 2MP limit
 * @param {number} width - Requested width
 * @param {number} height - Requested height
 * @param {number} maxMP - Maximum megapixels (default 2)
 * @returns {{width: number, height: number}} Adjusted dimensions
 */
function validateDimensions(width, height, maxMP = 2) {
  // Round to multiples of 64
  width = roundTo64(width || 1024);
  height = roundTo64(height || 1024);

  // Clamp to reasonable bounds
  width = Math.max(512, Math.min(1536, width));
  height = Math.max(512, Math.min(1536, height));

  // Check if we exceed max megapixels
  const mp = calculateMegapixels(width, height);
  if (mp > maxMP) {
    // Scale down proportionally
    const scale = Math.sqrt(maxMP / mp);
    width = roundTo64(width * scale);
    height = roundTo64(height * scale);
  }

  return { width, height };
}

/**
 * Validate steps parameter
 * @param {number} steps - Requested steps
 * @param {number} defaultSteps - Default value
 * @param {number} maxSteps - Maximum allowed
 * @returns {number} Validated steps
 */
function validateSteps(steps, defaultSteps = 15, maxSteps = 50) {
  if (!steps || steps < 1) return defaultSteps;
  return Math.min(steps, maxSteps);
}

// ═══════════════════════════════════════════════════════════════════════════
// Workflow Modification
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Modify text-to-image workflow with user parameters
 * @param {Object} workflow - Workflow template
 * @param {Object} params - User parameters
 * @returns {Object} Modified workflow
 */
function modifyTextToImageWorkflow(workflow, params) {
  const nodes = TEXT_TO_IMAGE_NODES;
  const { width, height } = validateDimensions(params.width, params.height);
  const steps = validateSteps(params.steps);

  // Set dimensions
  workflow[nodes.width].inputs.value = width;
  workflow[nodes.height].inputs.value = height;

  // Set steps
  workflow[nodes.steps].inputs.steps = steps;

  // Set prompts
  workflow[nodes.positive_prompt].inputs.text = params.prompt || '';
  workflow[nodes.negative_prompt].inputs.text = params.negative_prompt || '';

  // Set filename prefix
  workflow[nodes.filename].inputs.filename_prefix = params.filename_prefix || 'generated';

  // Generate random seed
  workflow[nodes.seed].inputs.noise_seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

  return workflow;
}

/**
 * Modify image-to-image workflow with user parameters
 * @param {Object} workflow - Workflow template
 * @param {Object} params - User parameters
 * @returns {Object} Modified workflow
 */
function modifyImageToImageWorkflow(workflow, params) {
  const nodes = IMAGE_TO_IMAGE_NODES;
  const steps = validateSteps(params.steps);

  // Set input image filename (must be uploaded to ComfyUI first)
  workflow[nodes.input_image].inputs.image = params.input_image;

  // Set steps
  workflow[nodes.steps].inputs.steps = steps;

  // Set prompts
  workflow[nodes.positive_prompt].inputs.text = params.prompt || '';
  workflow[nodes.negative_prompt].inputs.text = params.negative_prompt || '';

  // Set megapixels (controls output resolution relative to input)
  const megapixels = params.megapixels || 1;
  workflow[nodes.megapixels].inputs.megapixels = Math.min(megapixels, 2);

  // Set filename prefix
  workflow[nodes.filename].inputs.filename_prefix = params.filename_prefix || 'edited';

  // Generate random seed
  workflow[nodes.seed].inputs.noise_seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

  return workflow;
}

/**
 * Modify multi-image workflow with user parameters
 * @param {Object} workflow - Workflow template
 * @param {Object} params - User parameters
 * @returns {Object} Modified workflow
 */
function modifyMultiImageWorkflow(workflow, params) {
  const nodes = MULTI_IMAGE_NODES;
  const steps = validateSteps(params.steps);

  // Set input images (must be uploaded to ComfyUI first)
  workflow[nodes.input_image_1].inputs.image = params.input_image_1;
  workflow[nodes.input_image_2].inputs.image = params.input_image_2;

  // Set steps
  workflow[nodes.steps].inputs.steps = steps;

  // Set prompts
  workflow[nodes.positive_prompt].inputs.text = params.prompt || '';
  workflow[nodes.negative_prompt].inputs.text = params.negative_prompt || '';

  // Set megapixels for both image scalers
  const megapixels = params.megapixels || 1;
  workflow[nodes.megapixels_1].inputs.megapixels = Math.min(megapixels, 2);
  workflow[nodes.megapixels_2].inputs.megapixels = Math.min(megapixels, 2);

  // Set filename prefix
  workflow[nodes.filename].inputs.filename_prefix = params.filename_prefix || 'blended';

  // Generate random seed
  workflow[nodes.seed].inputs.noise_seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

  return workflow;
}

// ═══════════════════════════════════════════════════════════════════════════
// ComfyUI API Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if ComfyUI server is available
 * @param {string} comfyUrl - ComfyUI base URL
 * @returns {Promise<boolean>} True if server is available
 */
async function checkHealth(comfyUrl) {
  try {
    const response = await fetch(`${comfyUrl}/system_stats`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Upload an image to ComfyUI's input folder
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {Buffer} imageBuffer - Image data
 * @param {string} filename - Desired filename
 * @returns {Promise<{name: string, subfolder: string, type: string}>} Upload result
 */
async function uploadImage(comfyUrl, imageBuffer, filename) {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, filename);
  formData.append('overwrite', 'true');

  const response = await fetch(`${comfyUrl}/upload/image`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Queue a workflow prompt for execution
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {Object} workflow - Modified workflow object
 * @returns {Promise<{prompt_id: string}>} Prompt execution result
 */
async function queuePrompt(comfyUrl, workflow) {
  const response = await fetch(`${comfyUrl}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: workflow })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to queue prompt: ${error}`);
  }

  return await response.json();
}

/**
 * Poll for workflow completion
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {string} promptId - Prompt ID to track
 * @param {number} maxWaitMs - Maximum wait time in milliseconds
 * @param {number} pollIntervalMs - Poll interval in milliseconds
 * @returns {Promise<Object>} Execution history/result
 */
async function pollForCompletion(comfyUrl, promptId, maxWaitMs = 300000, pollIntervalMs = 1000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${comfyUrl}/history/${promptId}`);

    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.statusText}`);
    }

    const history = await response.json();
    const result = history[promptId];

    if (result) {
      // Check if execution completed
      if (result.status?.completed || result.outputs) {
        return result;
      }

      // Check for errors
      if (result.status?.status_str === 'error') {
        throw new Error(`Workflow execution failed: ${JSON.stringify(result.status)}`);
      }
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Workflow execution timed out');
}

/**
 * Download a generated image from ComfyUI
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {string} filename - Image filename
 * @param {string} subfolder - Subfolder (usually empty for outputs)
 * @param {string} type - Image type ('output', 'input', 'temp')
 * @returns {Promise<Buffer>} Image data
 */
async function downloadImage(comfyUrl, filename, subfolder = '', type = 'output') {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type
  });

  const response = await fetch(`${comfyUrl}/view?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract output image info from execution result
 * @param {Object} result - Execution result from pollForCompletion
 * @returns {{filename: string, subfolder: string, type: string}|null} Image info or null
 */
function extractOutputImage(result) {
  if (!result.outputs) return null;

  // Find the SaveImage node output
  for (const nodeId of Object.keys(result.outputs)) {
    const output = result.outputs[nodeId];
    if (output.images && output.images.length > 0) {
      return output.images[0];
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// High-Level Generation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate an image from text
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {Object} params - Generation parameters
 * @param {string} params.prompt - Positive prompt
 * @param {string} [params.negative_prompt] - Negative prompt
 * @param {number} [params.width] - Image width (multiple of 64)
 * @param {number} [params.height] - Image height (multiple of 64)
 * @param {number} [params.steps] - Generation steps (default 15, max 50)
 * @param {string} [params.filename_prefix] - Output filename prefix
 * @param {Function} [onProgress] - Progress callback
 * @returns {Promise<{image: Buffer, filename: string, width: number, height: number}>}
 */
async function generateImage(comfyUrl, params, onProgress = () => {}) {
  onProgress({ status: 'loading_workflow', message: 'Loading workflow template...' });

  // Load and modify workflow
  const workflow = loadWorkflow('text-to-image');
  const { width, height } = validateDimensions(params.width, params.height);
  const modifiedWorkflow = modifyTextToImageWorkflow(workflow, {
    ...params,
    width,
    height
  });

  onProgress({ status: 'queuing', message: 'Queuing generation...' });

  // Queue the prompt
  const { prompt_id } = await queuePrompt(comfyUrl, modifiedWorkflow);

  onProgress({ status: 'generating', message: 'Generating image...', prompt_id });

  // Wait for completion
  const result = await pollForCompletion(comfyUrl, prompt_id);

  onProgress({ status: 'downloading', message: 'Downloading result...' });

  // Extract and download the output image
  const imageInfo = extractOutputImage(result);
  if (!imageInfo) {
    throw new Error('No output image found in result');
  }

  const imageBuffer = await downloadImage(comfyUrl, imageInfo.filename, imageInfo.subfolder, imageInfo.type);

  onProgress({ status: 'complete', message: 'Generation complete' });

  return {
    image: imageBuffer,
    filename: imageInfo.filename,
    width,
    height
  };
}

/**
 * Edit an existing image
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {Object} params - Edit parameters
 * @param {Buffer} params.inputImage - Source image buffer
 * @param {string} params.inputFilename - Source image filename
 * @param {string} params.prompt - Edit prompt
 * @param {string} [params.negative_prompt] - Negative prompt
 * @param {number} [params.steps] - Generation steps
 * @param {number} [params.megapixels] - Output resolution in MP
 * @param {string} [params.filename_prefix] - Output filename prefix
 * @param {Function} [onProgress] - Progress callback
 * @returns {Promise<{image: Buffer, filename: string}>}
 */
async function editImage(comfyUrl, params, onProgress = () => {}) {
  onProgress({ status: 'uploading', message: 'Uploading source image...' });

  // Upload the source image to ComfyUI
  const uploadResult = await uploadImage(comfyUrl, params.inputImage, params.inputFilename);

  onProgress({ status: 'loading_workflow', message: 'Loading workflow template...' });

  // Load and modify workflow
  const workflow = loadWorkflow('image-to-image');
  const modifiedWorkflow = modifyImageToImageWorkflow(workflow, {
    ...params,
    input_image: uploadResult.name
  });

  onProgress({ status: 'queuing', message: 'Queuing edit...' });

  // Queue the prompt
  const { prompt_id } = await queuePrompt(comfyUrl, modifiedWorkflow);

  onProgress({ status: 'generating', message: 'Editing image...', prompt_id });

  // Wait for completion
  const result = await pollForCompletion(comfyUrl, prompt_id);

  onProgress({ status: 'downloading', message: 'Downloading result...' });

  // Extract and download the output image
  const imageInfo = extractOutputImage(result);
  if (!imageInfo) {
    throw new Error('No output image found in result');
  }

  const imageBuffer = await downloadImage(comfyUrl, imageInfo.filename, imageInfo.subfolder, imageInfo.type);

  onProgress({ status: 'complete', message: 'Edit complete' });

  return {
    image: imageBuffer,
    filename: imageInfo.filename
  };
}

/**
 * Blend two images together
 * @param {string} comfyUrl - ComfyUI base URL
 * @param {Object} params - Blend parameters
 * @param {Buffer} params.inputImage1 - First source image buffer
 * @param {string} params.inputFilename1 - First source image filename
 * @param {Buffer} params.inputImage2 - Second source image buffer
 * @param {string} params.inputFilename2 - Second source image filename
 * @param {string} params.prompt - Blend prompt
 * @param {string} [params.negative_prompt] - Negative prompt
 * @param {number} [params.steps] - Generation steps
 * @param {number} [params.megapixels] - Output resolution in MP
 * @param {string} [params.filename_prefix] - Output filename prefix
 * @param {Function} [onProgress] - Progress callback
 * @returns {Promise<{image: Buffer, filename: string}>}
 */
async function blendImages(comfyUrl, params, onProgress = () => {}) {
  onProgress({ status: 'uploading', message: 'Uploading source images...' });

  // Upload both source images to ComfyUI
  const [upload1, upload2] = await Promise.all([
    uploadImage(comfyUrl, params.inputImage1, params.inputFilename1),
    uploadImage(comfyUrl, params.inputImage2, params.inputFilename2)
  ]);

  onProgress({ status: 'loading_workflow', message: 'Loading workflow template...' });

  // Load and modify workflow
  const workflow = loadWorkflow('multi-image');
  const modifiedWorkflow = modifyMultiImageWorkflow(workflow, {
    ...params,
    input_image_1: upload1.name,
    input_image_2: upload2.name
  });

  onProgress({ status: 'queuing', message: 'Queuing blend...' });

  // Queue the prompt
  const { prompt_id } = await queuePrompt(comfyUrl, modifiedWorkflow);

  onProgress({ status: 'generating', message: 'Blending images...', prompt_id });

  // Wait for completion
  const result = await pollForCompletion(comfyUrl, prompt_id);

  onProgress({ status: 'downloading', message: 'Downloading result...' });

  // Extract and download the output image
  const imageInfo = extractOutputImage(result);
  if (!imageInfo) {
    throw new Error('No output image found in result');
  }

  const imageBuffer = await downloadImage(comfyUrl, imageInfo.filename, imageInfo.subfolder, imageInfo.type);

  onProgress({ status: 'complete', message: 'Blend complete' });

  return {
    image: imageBuffer,
    filename: imageInfo.filename
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Low-level functions
  loadWorkflow,
  validateDimensions,
  validateSteps,
  modifyTextToImageWorkflow,
  modifyImageToImageWorkflow,
  modifyMultiImageWorkflow,
  checkHealth,
  uploadImage,
  queuePrompt,
  pollForCompletion,
  downloadImage,
  extractOutputImage,

  // High-level functions
  generateImage,
  editImage,
  blendImages,

  // Constants
  TEXT_TO_IMAGE_NODES,
  IMAGE_TO_IMAGE_NODES,
  MULTI_IMAGE_NODES
};
