/**
 * Tool Executor
 * Dispatches tool calls to appropriate handlers and returns results
 */

import * as tavily from './tavily.js';
import * as comfyui from './comfyui.js';
import * as sandbox from './sandbox/tools.js';
import { formatToolResult } from './prompts.js';
import { exportToPdf } from '../utils/pdf-exporter.js';
import { logToolCall } from '../utils/debug-logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

/**
 * Execute a tool call and return the result
 * @param {string} toolName - Name of the tool to execute
 * @param {object} params - Parameters for the tool
 * @param {object} config - Configuration containing API keys and settings
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeToolCall(toolName, params, config, callbacks = {}) {
  const startTime = Date.now();
  let executionResult;

  try {
    switch (toolName) {
      case 'web_search':
        executionResult = await executeWebSearch(params, config);
        break;

      case 'web_scrape':
        executionResult = await executeWebScrape(params, config);
        break;

      case 'deep_research':
        executionResult = await executeDeepResearch(params, config, callbacks);
        break;

      case 'image_generation':
        executionResult = await executeImageGeneration(params, config, callbacks);
        break;

      case 'image_edit':
        executionResult = await executeImageEdit(params, config, callbacks);
        break;

      case 'image_blend':
        executionResult = await executeImageBlend(params, config, callbacks);
        break;

      // Sandbox code execution tools
      case 'sandbox_execute':
        executionResult = await sandbox.executeSandboxCommand(params, config, callbacks);
        break;

      case 'sandbox_write_file':
        executionResult = await sandbox.writeFile(params, config);
        break;

      case 'sandbox_read_file':
        executionResult = await sandbox.readFile(params, config);
        break;

      case 'sandbox_list_files':
        executionResult = await sandbox.listFiles(params, config);
        break;

      case 'sandbox_diff_edit':
        executionResult = await sandbox.diffEdit(params, config);
        break;

      case 'sandbox_stats':
        executionResult = await sandbox.getStats(params, config);
        break;

      // User memory tools
      case 'memory_retrieve':
        executionResult = await executeMemoryRetrieve(params, config);
        break;

      case 'memory_create':
        executionResult = await executeMemoryCreate(params, config);
        break;

      case 'memory_update':
        executionResult = await executeMemoryUpdate(params, config);
        break;

      case 'memory_delete':
        executionResult = await executeMemoryDelete(params, config);
        break;

      default:
        executionResult = {
          result: formatToolResult(toolName, `Unknown tool: ${toolName}`, true),
          sources: [],
          error: `Unknown tool: ${toolName}`
        };
    }

    const executionTime = Date.now() - startTime;
    const success = !executionResult.error;

    // Log the tool call with parameters and result
    logToolCall(toolName, params, executionResult.result, success, executionTime);

    return executionResult;

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logToolCall(toolName, params, error.message, false, executionTime);
    throw error;
  }
}

/**
 * Execute web search using Tavily
 * @param {object} params - Search parameters
 * @param {object} config - Configuration with API key
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeWebSearch(params, config) {
  const query = params.query;
  // Clamp num_results to 1-10, default to 3
  const numResults = Math.min(10, Math.max(1, params.num_results || 3));
  // Get full page content if requested (uses more credits)
  const includeFullContent = params.include_full_content || false;
  // Include images in search results
  const includeImages = params.include_images || false;

  if (!query) {
    return {
      result: formatToolResult('web_search', 'No search query provided', true),
      sources: [],
      error: 'No search query provided'
    };
  }

  const apiKey = config.tavily_api_key;
  if (!apiKey) {
    return {
      result: formatToolResult('web_search', 'Tavily API key not configured', true),
      sources: [],
      error: 'Tavily API key not configured'
    };
  }

  // Execute the search
  const searchResult = await tavily.search(apiKey, query, {
    maxResults: numResults,
    includeFullContent: includeFullContent,
    includeImages: includeImages
  });

  if (searchResult.error) {
    return {
      result: formatToolResult('web_search', searchResult.error, true),
      sources: [],
      error: searchResult.error
    };
  }

  // Format results for LLM
  const resultCount = searchResult.results.length;
  const formattedResults = tavily.formatResultsForLLM(searchResult.results);
  const formattedImages = searchResult.images ? tavily.formatImagesForLLM(searchResult.images) : '';

  // Indicate content type in result
  const contentType = includeFullContent ? 'full page content' : 'snippets';
  const imageInfo = includeImages && searchResult.images ? `, ${searchResult.images.length} images` : '';
  const resultText = `Found ${resultCount} results for "${query}" (${contentType}${imageInfo}):\n\n${formattedResults}${formattedImages}`;

  return {
    result: formatToolResult('web_search', resultText),
    sources: searchResult.sources,
    images: searchResult.images,
    resultCount,
    imageCount: searchResult.images?.length || 0,
    error: null
  };
}

/**
 * Execute web scrape (extract) using Tavily Extract
 * @param {object} params - Extract parameters
 * @param {object} config - Configuration with API key
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeWebScrape(params, config) {
  const urls = params.urls;

  if (!urls || urls.length === 0) {
    return {
      result: formatToolResult('web_scrape', 'No URLs provided', true),
      sources: [],
      error: 'No URLs provided'
    };
  }

  // Ensure urls is an array
  const urlArray = Array.isArray(urls) ? urls : [urls];

  if (urlArray.length > 20) {
    return {
      result: formatToolResult('web_scrape', 'Maximum 20 URLs allowed', true),
      sources: [],
      error: 'Maximum 20 URLs allowed'
    };
  }

  const apiKey = config.tavily_api_key;
  if (!apiKey) {
    return {
      result: formatToolResult('web_scrape', 'Tavily API key not configured', true),
      sources: [],
      error: 'Tavily API key not configured'
    };
  }

  // Execute the extraction
  const extractResult = await tavily.extract(apiKey, urlArray, {
    includeImages: params.include_images || false,
    extractDepth: params.extract_depth || 'basic'
  });

  if (extractResult.error) {
    return {
      result: formatToolResult('web_scrape', extractResult.error, true),
      sources: [],
      error: extractResult.error
    };
  }

  // Format results for LLM
  const successCount = extractResult.results.length;
  const failedCount = extractResult.failedResults.length;
  const formattedResults = tavily.formatExtractForLLM(extractResult.results);

  let resultText = `Extracted content from ${successCount} URL(s)`;
  if (failedCount > 0) {
    resultText += ` (${failedCount} failed)`;
  }
  resultText += `:\n\n${formattedResults}`;

  // Format sources for OWUI
  // Extract title from URL or use domain as fallback
  const sources = extractResult.results.map(r => {
    // Try to extract a title from the content (first heading or first line)
    const titleMatch = r.content.match(/^#\s+(.+)$/m) || r.content.match(/^(.+)$/m);
    const extractedTitle = titleMatch ? titleMatch[1].substring(0, 100) : new URL(r.url).hostname;

    return {
      source: {
        name: r.url,
        url: r.url
      },
      document: [`# ${extractedTitle}\n\n${r.content}`],
      metadata: [{
        title: extractedTitle,
        url: r.url,
        date_accessed: new Date().toISOString(),
        type: 'web_scrape'
      }]
    };
  });

  return {
    result: formatToolResult('web_scrape', resultText),
    sources,
    successCount,
    failedCount,
    error: null
  };
}

/**
 * Execute deep research using Tavily Research API
 * @param {object} params - Research parameters
 * @param {object} config - Configuration with API key and context
 * @param {object} callbacks - Optional callbacks for streaming
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeDeepResearch(params, config, callbacks = {}) {
  const query = params.query;

  if (!query) {
    return {
      result: formatToolResult('deep_research', 'No research query provided', true),
      sources: [],
      error: 'No research query provided'
    };
  }

  const apiKey = config.tavily_api_key;
  if (!apiKey) {
    return {
      result: formatToolResult('deep_research', 'Tavily API key not configured', true),
      sources: [],
      error: 'Tavily API key not configured'
    };
  }

  // Progress callback for streaming updates
  const onProgress = callbacks.onProgress || (() => {});

  // Execute the research with streaming
  const researchResult = await tavily.research(apiKey, query, {
    model: 'mini',
    onProgress: (update) => {
      // Forward progress updates
      if (update.type === 'content') {
        onProgress({ type: 'content', chunk: update.chunk });
      } else if (update.name) {
        onProgress({ type: 'status', tool: update.name, status: update.status });
      }
    }
  });

  if (researchResult.error) {
    return {
      result: formatToolResult('deep_research', researchResult.error, true),
      sources: [],
      error: researchResult.error
    };
  }

  // Get context for PDF saving
  const userEmail = config.USER_EMAIL;
  const conversationId = config.CONVERSATION_ID;
  const toolsetApiUrl = config.TOOLSET_API_URL;

  let downloadUrl = null;

  // Save PDF if we have the required context
  if (researchResult.report && userEmail && conversationId && toolsetApiUrl) {
    try {
      const timestamp = Date.now();
      const sanitizedQuery = query.substring(0, 50).replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
      const baseName = `research-${sanitizedQuery}-${timestamp}`;

      // Sanitize email and conversation ID for folder path
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');

      const folderPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', 'research');
      fs.mkdirSync(folderPath, { recursive: true });

      // Save markdown
      const mdPath = path.join(folderPath, `${baseName}.md`);
      fs.writeFileSync(mdPath, researchResult.report);

      // Try to generate PDF, fall back to markdown download
      let reportFile = `${baseName}.md`;
      try {
        const pdfPath = path.join(folderPath, `${baseName}.pdf`);
        await exportToPdf(researchResult.report, pdfPath, {
          title: 'Deep Research Report',
          query: query,
          date: new Date().toISOString()
        });
        reportFile = `${baseName}.pdf`;
        console.log(`📄 Saved research report: ${pdfPath}`);
      } catch (pdfError) {
        console.error('PDF generation failed, using markdown fallback:', pdfError.message);
      }

      // Save metadata
      const metaPath = path.join(folderPath, `${baseName}.meta.json`);
      fs.writeFileSync(metaPath, JSON.stringify({
        id: baseName,
        name: reportFile,
        type: 'deep_research_report',
        query: query,
        source_count: researchResult.sources.length,
        timestamp: new Date().toISOString()
      }, null, 2));

      // Build download URL (PDF if available, otherwise markdown)
      downloadUrl = `${toolsetApiUrl}/${safeEmail}/${safeConvId}/volume/research/${reportFile}`;

      console.log(`📎 Report download: ${downloadUrl}`);
    } catch (saveError) {
      console.error('Failed to save research report:', saveError.message);
      // Continue without download - don't fail the whole operation
    }
  }

  // Format sources for OWUI citations
  // Research sources: title + URL (minimal content to show in citation panel)
  const citationSources = researchResult.sources.map((s, index) => ({
    source: {
      name: s.url,
      url: s.url
    },
    document: [`# ${s.title || 'Research Source'}\n\nSource [${index + 1}] used in deep research synthesis.`],
    metadata: [{
      title: s.title || 'Research Source',
      source: s.title || 'Research Source',  // Required for OWUI citation display
      url: s.url,
      date_accessed: new Date().toISOString(),
      type: 'deep_research_citation'
    }]
  }));

  // Add report source with download link (if PDF was saved)
  const sources = [...citationSources];

  if (downloadUrl) {
    sources.push({
      source: {
        name: `📄 Research Report: ${query.substring(0, 50)}...`,
        url: downloadUrl
      },
      document: [`# Deep Research Report\n\n**Query:** ${query}\n\nClick to download the full PDF report.`],
      metadata: [{
        title: 'Deep Research Report',
        query: query,
        url: downloadUrl,
        date_generated: new Date().toISOString(),
        type: 'deep_research_report',
        downloadable: true
      }]
    });
  }

  // Include download URL in result text for LLM
  let resultText = researchResult.report;
  if (downloadUrl) {
    resultText += `\n\n---\n📄 **Download Report:** ${downloadUrl}`;
  }

  return {
    result: formatToolResult('deep_research', resultText),
    sources,
    report: researchResult.report,
    downloadUrl,
    error: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ComfyUI Image Generation Tools
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute image generation using ComfyUI
 * @param {object} params - Generation parameters
 * @param {object} config - Configuration with ComfyUI URL and context
 * @param {object} callbacks - Optional callbacks for progress
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeImageGeneration(params, config, callbacks = {}) {
  const prompt = params.prompt;

  if (!prompt) {
    return {
      result: formatToolResult('image_generation', 'No prompt provided', true),
      sources: [],
      error: 'No prompt provided'
    };
  }

  const comfyUrl = config.comfyui_base_url;
  if (!comfyUrl) {
    return {
      result: formatToolResult('image_generation', 'ComfyUI server not configured', true),
      sources: [],
      error: 'ComfyUI server not configured'
    };
  }

  // Check if ComfyUI is available
  const isHealthy = await comfyui.checkHealth(comfyUrl);
  if (!isHealthy) {
    return {
      result: formatToolResult('image_generation', 'ComfyUI server is not available', true),
      sources: [],
      error: 'ComfyUI server is not available'
    };
  }

  const onProgress = callbacks.onProgress || (() => {});

  try {
    // Generate the image
    const result = await comfyui.generateImage(comfyUrl, {
      prompt: prompt,
      negative_prompt: params.negative_prompt || '',
      width: params.width,
      height: params.height,
      steps: params.steps,
      filename_prefix: `gen-${Date.now()}`
    }, (progress) => {
      onProgress({ type: 'status', message: progress.message });
    });

    // Save the image to the user's comfyui folder
    const userEmail = config.USER_EMAIL;
    const conversationId = config.CONVERSATION_ID;
    const toolsetApiUrl = config.TOOLSET_API_URL;

    let imageUrl = null;

    if (userEmail && conversationId && toolsetApiUrl) {
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');

      const folderPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', 'comfyui');
      fs.mkdirSync(folderPath, { recursive: true });

      const filename = `generated-${Date.now()}.png`;
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, result.image);

      imageUrl = `${toolsetApiUrl}/${safeEmail}/${safeConvId}/volume/comfyui/${filename}`;

      // Save metadata
      const metaPath = path.join(folderPath, `${filename}.meta.json`);
      fs.writeFileSync(metaPath, JSON.stringify({
        type: 'image_generation',
        prompt: prompt,
        negative_prompt: params.negative_prompt || '',
        width: result.width,
        height: result.height,
        steps: params.steps || 15,
        timestamp: new Date().toISOString()
      }, null, 2));

      console.log(`🎨 Generated image saved: ${filePath}`);
    }

    const resultText = imageUrl
      ? `Image generated successfully!\n\n**Prompt:** ${prompt}\n**Resolution:** ${result.width}x${result.height}\n\n![Generated Image](${imageUrl})\n\n**Download:** ${imageUrl}`
      : `Image generated but could not save to storage. Check ComfyUI output folder.`;

    return {
      result: formatToolResult('image_generation', resultText),
      sources: imageUrl ? [{
        source: { name: 'Generated Image', url: imageUrl },
        document: [`# Generated Image\n\n**Prompt:** ${prompt}\n\n![Image](${imageUrl})`],
        metadata: [{ title: 'Generated Image', url: imageUrl, type: 'image_generation' }]
      }] : [],
      imageUrl,
      error: null
    };

  } catch (error) {
    console.error('Image generation failed:', error.message);
    return {
      result: formatToolResult('image_generation', `Generation failed: ${error.message}`, true),
      sources: [],
      error: error.message
    };
  }
}

/**
 * Execute image editing using ComfyUI
 * @param {object} params - Edit parameters
 * @param {object} config - Configuration with ComfyUI URL and context
 * @param {object} callbacks - Optional callbacks for progress
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeImageEdit(params, config, callbacks = {}) {
  const imageUrl = params.image_url;
  const prompt = params.prompt;

  if (!imageUrl) {
    return {
      result: formatToolResult('image_edit', 'No image URL provided', true),
      sources: [],
      error: 'No image URL provided'
    };
  }

  if (!prompt) {
    return {
      result: formatToolResult('image_edit', 'No edit prompt provided', true),
      sources: [],
      error: 'No edit prompt provided'
    };
  }

  const comfyUrl = config.comfyui_base_url;
  if (!comfyUrl) {
    return {
      result: formatToolResult('image_edit', 'ComfyUI server not configured', true),
      sources: [],
      error: 'ComfyUI server not configured'
    };
  }

  // Check if ComfyUI is available
  const isHealthy = await comfyui.checkHealth(comfyUrl);
  if (!isHealthy) {
    return {
      result: formatToolResult('image_edit', 'ComfyUI server is not available', true),
      sources: [],
      error: 'ComfyUI server is not available'
    };
  }

  const onProgress = callbacks.onProgress || (() => {});

  try {
    // Fetch the source image
    onProgress({ type: 'status', message: 'Fetching source image...' });

    let imageBuffer;
    let inputFilename;

    // Check if it's a local file URL (from our static server)
    if (imageUrl.includes('/volume/uploaded/') || imageUrl.includes('/volume/comfyui/')) {
      // Extract the file path from URL
      const urlParts = imageUrl.split('/volume/');
      if (urlParts.length >= 2) {
        const relativePath = 'volume/' + urlParts[1];
        // Parse the URL to get email and conversation ID
        const urlMatch = imageUrl.match(/\/([^/]+)\/([^/]+)\/volume\//);
        if (urlMatch) {
          const safeEmail = urlMatch[1];
          const safeConvId = urlMatch[2];
          const localPath = path.join(projectRoot, 'data', safeEmail, safeConvId, relativePath);

          if (fs.existsSync(localPath)) {
            imageBuffer = fs.readFileSync(localPath);
            inputFilename = path.basename(localPath);
          }
        }
      }
    }

    // If not found locally, try to fetch from URL
    if (!imageBuffer) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      inputFilename = `input-${Date.now()}.png`;
    }

    // Edit the image
    const result = await comfyui.editImage(comfyUrl, {
      inputImage: imageBuffer,
      inputFilename: inputFilename,
      prompt: prompt,
      negative_prompt: params.negative_prompt || '',
      steps: params.steps,
      filename_prefix: `edit-${Date.now()}`
    }, (progress) => {
      onProgress({ type: 'status', message: progress.message });
    });

    // Save the edited image
    const userEmail = config.USER_EMAIL;
    const conversationId = config.CONVERSATION_ID;
    const toolsetApiUrl = config.TOOLSET_API_URL;

    let outputUrl = null;

    if (userEmail && conversationId && toolsetApiUrl) {
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');

      const folderPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', 'comfyui');
      fs.mkdirSync(folderPath, { recursive: true });

      const filename = `edited-${Date.now()}.png`;
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, result.image);

      outputUrl = `${toolsetApiUrl}/${safeEmail}/${safeConvId}/volume/comfyui/${filename}`;

      // Save metadata
      const metaPath = path.join(folderPath, `${filename}.meta.json`);
      fs.writeFileSync(metaPath, JSON.stringify({
        type: 'image_edit',
        source_url: imageUrl,
        prompt: prompt,
        negative_prompt: params.negative_prompt || '',
        steps: params.steps || 15,
        timestamp: new Date().toISOString()
      }, null, 2));

      console.log(`🎨 Edited image saved: ${filePath}`);
    }

    const resultText = outputUrl
      ? `Image edited successfully!\n\n**Edit prompt:** ${prompt}\n\n![Edited Image](${outputUrl})\n\n**Download:** ${outputUrl}`
      : `Image edited but could not save to storage. Check ComfyUI output folder.`;

    return {
      result: formatToolResult('image_edit', resultText),
      sources: outputUrl ? [{
        source: { name: 'Edited Image', url: outputUrl },
        document: [`# Edited Image\n\n**Prompt:** ${prompt}\n\n![Image](${outputUrl})`],
        metadata: [{ title: 'Edited Image', url: outputUrl, type: 'image_edit' }]
      }] : [],
      imageUrl: outputUrl,
      error: null
    };

  } catch (error) {
    console.error('Image edit failed:', error.message);
    return {
      result: formatToolResult('image_edit', `Edit failed: ${error.message}`, true),
      sources: [],
      error: error.message
    };
  }
}

/**
 * Execute image blending using ComfyUI
 * @param {object} params - Blend parameters
 * @param {object} config - Configuration with ComfyUI URL and context
 * @param {object} callbacks - Optional callbacks for progress
 * @returns {Promise<{result: string, sources: Array, error?: string}>}
 */
async function executeImageBlend(params, config, callbacks = {}) {
  const imageUrl1 = params.image_url_1;
  const imageUrl2 = params.image_url_2;
  const prompt = params.prompt;

  if (!imageUrl1 || !imageUrl2) {
    return {
      result: formatToolResult('image_blend', 'Two image URLs are required', true),
      sources: [],
      error: 'Two image URLs are required'
    };
  }

  if (!prompt) {
    return {
      result: formatToolResult('image_blend', 'No blend prompt provided', true),
      sources: [],
      error: 'No blend prompt provided'
    };
  }

  const comfyUrl = config.comfyui_base_url;
  if (!comfyUrl) {
    return {
      result: formatToolResult('image_blend', 'ComfyUI server not configured', true),
      sources: [],
      error: 'ComfyUI server not configured'
    };
  }

  // Check if ComfyUI is available
  const isHealthy = await comfyui.checkHealth(comfyUrl);
  if (!isHealthy) {
    return {
      result: formatToolResult('image_blend', 'ComfyUI server is not available', true),
      sources: [],
      error: 'ComfyUI server is not available'
    };
  }

  const onProgress = callbacks.onProgress || (() => {});

  // Helper to fetch image from URL or local path
  async function fetchImage(url, index) {
    // Check if it's a local file URL
    if (url.includes('/volume/uploaded/') || url.includes('/volume/comfyui/')) {
      const urlParts = url.split('/volume/');
      if (urlParts.length >= 2) {
        const relativePath = 'volume/' + urlParts[1];
        const urlMatch = url.match(/\/([^/]+)\/([^/]+)\/volume\//);
        if (urlMatch) {
          const safeEmail = urlMatch[1];
          const safeConvId = urlMatch[2];
          const localPath = path.join(projectRoot, 'data', safeEmail, safeConvId, relativePath);

          if (fs.existsSync(localPath)) {
            return {
              buffer: fs.readFileSync(localPath),
              filename: path.basename(localPath)
            };
          }
        }
      }
    }

    // Fetch from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${index}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      filename: `input${index}-${Date.now()}.png`
    };
  }

  try {
    // Fetch both source images
    onProgress({ type: 'status', message: 'Fetching source images...' });

    const [image1, image2] = await Promise.all([
      fetchImage(imageUrl1, 1),
      fetchImage(imageUrl2, 2)
    ]);

    // Blend the images
    const result = await comfyui.blendImages(comfyUrl, {
      inputImage1: image1.buffer,
      inputFilename1: image1.filename,
      inputImage2: image2.buffer,
      inputFilename2: image2.filename,
      prompt: prompt,
      negative_prompt: params.negative_prompt || '',
      steps: params.steps,
      filename_prefix: `blend-${Date.now()}`
    }, (progress) => {
      onProgress({ type: 'status', message: progress.message });
    });

    // Save the blended image
    const userEmail = config.USER_EMAIL;
    const conversationId = config.CONVERSATION_ID;
    const toolsetApiUrl = config.TOOLSET_API_URL;

    let outputUrl = null;

    if (userEmail && conversationId && toolsetApiUrl) {
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');

      const folderPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', 'comfyui');
      fs.mkdirSync(folderPath, { recursive: true });

      const filename = `blended-${Date.now()}.png`;
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, result.image);

      outputUrl = `${toolsetApiUrl}/${safeEmail}/${safeConvId}/volume/comfyui/${filename}`;

      // Save metadata
      const metaPath = path.join(folderPath, `${filename}.meta.json`);
      fs.writeFileSync(metaPath, JSON.stringify({
        type: 'image_blend',
        source_url_1: imageUrl1,
        source_url_2: imageUrl2,
        prompt: prompt,
        negative_prompt: params.negative_prompt || '',
        steps: params.steps || 15,
        timestamp: new Date().toISOString()
      }, null, 2));

      console.log(`🎨 Blended image saved: ${filePath}`);
    }

    const resultText = outputUrl
      ? `Images blended successfully!\n\n**Blend prompt:** ${prompt}\n\n![Blended Image](${outputUrl})\n\n**Download:** ${outputUrl}`
      : `Images blended but could not save to storage. Check ComfyUI output folder.`;

    return {
      result: formatToolResult('image_blend', resultText),
      sources: outputUrl ? [{
        source: { name: 'Blended Image', url: outputUrl },
        document: [`# Blended Image\n\n**Prompt:** ${prompt}\n\n![Image](${outputUrl})`],
        metadata: [{ title: 'Blended Image', url: outputUrl, type: 'image_blend' }]
      }] : [],
      imageUrl: outputUrl,
      error: null
    };

  } catch (error) {
    console.error('Image blend failed:', error.message);
    return {
      result: formatToolResult('image_blend', `Blend failed: ${error.message}`, true),
      sources: [],
      error: error.message
    };
  }
}

/**
 * Get status message for a tool execution
 * @param {string} toolName - Name of the tool
 * @param {object} params - Tool parameters
 * @param {string} phase - 'start' or 'complete'
 * @param {object} result - Result object (for complete phase)
 * @returns {object} Status event data
 */
function getToolStatusMessage(toolName, params, phase, result = null) {
  switch (toolName) {
    case 'web_search':
      if (phase === 'start') {
        const imageNote = params.include_images ? ' (with images)' : '';
        return {
          type: 'status',
          data: {
            description: `Searching: "${params.query}"${imageNote}...`,
            done: false
          }
        };
      } else {
        const count = result?.resultCount || 0;
        const imageCount = result?.imageCount || 0;
        const imageNote = imageCount > 0 ? `, ${imageCount} images` : '';
        return {
          type: 'status',
          data: {
            description: `Found ${count} results${imageNote}`,
            done: true
          }
        };
      }

    case 'web_scrape':
      if (phase === 'start') {
        const urlCount = Array.isArray(params.urls) ? params.urls.length : 1;
        return {
          type: 'status',
          data: {
            description: `Extracting content from ${urlCount} URL(s)...`,
            done: false
          }
        };
      } else {
        const successCount = result?.successCount || 0;
        const failedCount = result?.failedCount || 0;
        const failedNote = failedCount > 0 ? `, ${failedCount} failed` : '';
        return {
          type: 'status',
          data: {
            description: `Extracted ${successCount} page(s)${failedNote}`,
            done: true
          }
        };
      }

    case 'deep_research':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Researching: "${params.query}"...`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'Research complete',
            done: true
          }
        };
      }

    case 'image_generation':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Generating image: "${params.prompt?.substring(0, 50)}..."`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'Image generated',
            done: true
          }
        };
      }

    case 'image_edit':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Editing image: "${params.prompt?.substring(0, 50)}..."`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'Image edited',
            done: true
          }
        };
      }

    case 'image_blend':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Blending images: "${params.prompt?.substring(0, 50)}..."`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'Images blended',
            done: true
          }
        };
      }

    // Sandbox code execution tools
    case 'sandbox_execute':
      if (phase === 'start') {
        const cmdPreview = params.command?.substring(0, 60);
        const ellipsis = params.command?.length > 60 ? '...' : '';
        return {
          type: 'status',
          data: {
            description: `Running: ${cmdPreview}${ellipsis}`,
            done: false
          }
        };
      } else {
        const exitInfo = result?.exitCode === 0 ? '' : ` (exit ${result?.exitCode})`;
        return {
          type: 'status',
          data: {
            description: `Command completed${exitInfo}`,
            done: true
          }
        };
      }

    case 'sandbox_write_file':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Writing ${params.path}...`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'File written',
            done: true
          }
        };
      }

    case 'sandbox_read_file':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Reading ${params.path}...`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'File read',
            done: true
          }
        };
      }

    case 'sandbox_list_files':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: 'Listing files...',
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'Files listed',
            done: true
          }
        };
      }

    case 'sandbox_diff_edit':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Editing ${params.path}...`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'File edited',
            done: true
          }
        };
      }

    case 'sandbox_stats':
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: 'Getting sandbox stats...',
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: 'Stats retrieved',
            done: true
          }
        };
      }

    case 'memory_retrieve':
      return {
        type: 'status',
        data: {
          description: phase === 'start' ? 'Retrieving memories...' : 'Memories retrieved',
          done: phase !== 'start'
        }
      };

    case 'memory_create':
      return {
        type: 'status',
        data: {
          description: phase === 'start' ? 'Saving memory...' : 'Memory saved',
          done: phase !== 'start'
        }
      };

    case 'memory_update':
      return {
        type: 'status',
        data: {
          description: phase === 'start' ? 'Updating memory...' : 'Memory updated',
          done: phase !== 'start'
        }
      };

    case 'memory_delete':
      return {
        type: 'status',
        data: {
          description: phase === 'start' ? 'Deleting memory...' : 'Memory deleted',
          done: phase !== 'start'
        }
      };

    default:
      if (phase === 'start') {
        return {
          type: 'status',
          data: {
            description: `Executing ${toolName}...`,
            done: false
          }
        };
      } else {
        return {
          type: 'status',
          data: {
            description: `${toolName} complete`,
            done: true
          }
        };
      }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// User Memory Tools
// ═══════════════════════════════════════════════════════════════════════════

const MAX_MEMORY_CHARS = parseInt(process.env.MAX_MEMORY_CHARS || '2000', 10);

async function executeMemoryRetrieve(params, config) {
  const userEmail = config.USER_EMAIL;
  const db = config.db;

  if (!userEmail || !db) {
    return {
      result: formatToolResult('memory_retrieve', 'User context not available', true),
      sources: [],
      error: 'User context not available'
    };
  }

  const memories = db.getMemories(userEmail);
  const totalChars = db.getMemoryCharCount(userEmail);

  if (memories.length === 0) {
    return {
      result: formatToolResult('memory_retrieve',
        `No memories stored for this user.\nCharacter usage: 0 / ${MAX_MEMORY_CHARS}`),
      sources: [],
      error: null
    };
  }

  const formatted = memories.map(m =>
    `[ID: ${m.id}] ${m.content} (created: ${m.created_at}, updated: ${m.updated_at})`
  ).join('\n');

  return {
    result: formatToolResult('memory_retrieve',
      `Found ${memories.length} memories (${totalChars} / ${MAX_MEMORY_CHARS} chars used):\n\n${formatted}`),
    sources: [],
    error: null
  };
}

async function executeMemoryCreate(params, config) {
  const userEmail = config.USER_EMAIL;
  const db = config.db;
  const content = params.content;

  if (!userEmail || !db) {
    return {
      result: formatToolResult('memory_create', 'User context not available', true),
      sources: [],
      error: 'User context not available'
    };
  }

  if (!content || content.trim().length === 0) {
    return {
      result: formatToolResult('memory_create', 'Memory content cannot be empty', true),
      sources: [],
      error: 'Memory content cannot be empty'
    };
  }

  const trimmedContent = content.trim();
  const currentChars = db.getMemoryCharCount(userEmail);
  const newTotal = currentChars + trimmedContent.length;

  if (newTotal > MAX_MEMORY_CHARS) {
    const remaining = MAX_MEMORY_CHARS - currentChars;
    return {
      result: formatToolResult('memory_create',
        `Cannot create memory: would exceed character limit. ` +
        `Current usage: ${currentChars} / ${MAX_MEMORY_CHARS} chars. ` +
        `New memory is ${trimmedContent.length} chars, but only ${remaining} chars remaining. ` +
        `Please consolidate or delete existing memories first using memory_update or memory_delete.`,
        true),
      sources: [],
      error: 'Character limit exceeded'
    };
  }

  const memoryId = db.createMemory(userEmail, trimmedContent);

  return {
    result: formatToolResult('memory_create',
      `Memory created successfully (ID: ${memoryId}). Character usage: ${newTotal} / ${MAX_MEMORY_CHARS}`),
    sources: [],
    error: null
  };
}

async function executeMemoryUpdate(params, config) {
  const userEmail = config.USER_EMAIL;
  const db = config.db;
  const memoryId = params.memory_id;
  const content = params.content;

  if (!userEmail || !db) {
    return {
      result: formatToolResult('memory_update', 'User context not available', true),
      sources: [],
      error: 'User context not available'
    };
  }

  if (!memoryId) {
    return {
      result: formatToolResult('memory_update', 'memory_id is required', true),
      sources: [],
      error: 'memory_id is required'
    };
  }

  if (!content || content.trim().length === 0) {
    return {
      result: formatToolResult('memory_update', 'Memory content cannot be empty', true),
      sources: [],
      error: 'Memory content cannot be empty'
    };
  }

  const trimmedContent = content.trim();

  const existing = db.getMemoryById(memoryId, userEmail);
  if (!existing) {
    return {
      result: formatToolResult('memory_update',
        `Memory with ID ${memoryId} not found or does not belong to this user.`, true),
      sources: [],
      error: 'Memory not found'
    };
  }

  const currentChars = db.getMemoryCharCount(userEmail);
  const sizeDelta = trimmedContent.length - existing.content.length;
  const newTotal = currentChars + sizeDelta;

  if (newTotal > MAX_MEMORY_CHARS) {
    const maxForUpdate = MAX_MEMORY_CHARS - currentChars + existing.content.length;
    return {
      result: formatToolResult('memory_update',
        `Cannot update memory: would exceed character limit. ` +
        `Current usage: ${currentChars} / ${MAX_MEMORY_CHARS} chars. ` +
        `New content is ${trimmedContent.length} chars (was ${existing.content.length}). ` +
        `Maximum for this update: ${maxForUpdate} chars.`,
        true),
      sources: [],
      error: 'Character limit exceeded'
    };
  }

  const updated = db.updateMemory(memoryId, userEmail, trimmedContent);

  if (!updated) {
    return {
      result: formatToolResult('memory_update', `Failed to update memory ID ${memoryId}.`, true),
      sources: [],
      error: 'Update failed'
    };
  }

  return {
    result: formatToolResult('memory_update',
      `Memory ID ${memoryId} updated successfully. Character usage: ${newTotal} / ${MAX_MEMORY_CHARS}`),
    sources: [],
    error: null
  };
}

async function executeMemoryDelete(params, config) {
  const userEmail = config.USER_EMAIL;
  const db = config.db;
  const memoryId = params.memory_id;

  if (!userEmail || !db) {
    return {
      result: formatToolResult('memory_delete', 'User context not available', true),
      sources: [],
      error: 'User context not available'
    };
  }

  if (!memoryId) {
    return {
      result: formatToolResult('memory_delete', 'memory_id is required', true),
      sources: [],
      error: 'memory_id is required'
    };
  }

  const deleted = db.deleteMemory(memoryId, userEmail);

  if (!deleted) {
    return {
      result: formatToolResult('memory_delete',
        `Memory with ID ${memoryId} not found or does not belong to this user.`, true),
      sources: [],
      error: 'Memory not found'
    };
  }

  const remainingChars = db.getMemoryCharCount(userEmail);

  return {
    result: formatToolResult('memory_delete',
      `Memory ID ${memoryId} deleted. Character usage: ${remainingChars} / ${MAX_MEMORY_CHARS}`),
    sources: [],
    error: null
  };
}

export {
  executeToolCall,
  getToolStatusMessage
};
