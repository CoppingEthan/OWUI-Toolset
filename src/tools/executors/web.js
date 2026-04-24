/**
 * Tavily-backed web tools: web_search, web_scrape, deep_research.
 *
 * deep_research additionally writes the final report as markdown (with
 * an optional PDF) into the per-conversation volume folder and returns
 * a download URL for the user.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tavily from '../tavily.js';
import { exportToPdf } from '../../utils/pdf-exporter.js';
import { formatToolResult, toolError, toolOk } from '../../utils/tool-result.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

export async function executeWebSearch(params, config) {
  const query = params.query;
  if (!query) return toolError('web_search', 'No search query provided');

  const apiKey = config.tavily_api_key;
  if (!apiKey) return toolError('web_search', 'Tavily API key not configured');

  const numResults = Math.min(10, Math.max(1, params.num_results || 3));
  const includeFullContent = params.include_full_content || false;
  const includeImages = params.include_images || false;

  const result = await tavily.search(apiKey, query, {
    maxResults: numResults,
    includeFullContent,
    includeImages,
  });
  if (result.error) return toolError('web_search', result.error);

  const formattedResults = tavily.formatResultsForLLM(result.results);
  const formattedImages  = result.images ? tavily.formatImagesForLLM(result.images) : '';
  const contentType = includeFullContent ? 'full page content' : 'snippets';
  const imageInfo = includeImages && result.images ? `, ${result.images.length} images` : '';

  return {
    result: formatToolResult('web_search',
      `Found ${result.results.length} results for "${query}" (${contentType}${imageInfo}):\n\n${formattedResults}${formattedImages}`),
    sources: result.sources,
    images: result.images,
    resultCount: result.results.length,
    imageCount: result.images?.length || 0,
    error: null,
  };
}

export async function executeWebScrape(params, config) {
  const urls = Array.isArray(params.urls) ? params.urls : (params.urls ? [params.urls] : []);
  if (urls.length === 0)   return toolError('web_scrape', 'No URLs provided');
  if (urls.length > 20)    return toolError('web_scrape', 'Maximum 20 URLs allowed');

  const apiKey = config.tavily_api_key;
  if (!apiKey) return toolError('web_scrape', 'Tavily API key not configured');

  const result = await tavily.extract(apiKey, urls, {
    includeImages: params.include_images || false,
    extractDepth: params.extract_depth || 'basic',
  });
  if (result.error) return toolError('web_scrape', result.error);

  const successCount = result.results.length;
  const failedCount  = result.failedResults.length;
  const formatted = tavily.formatExtractForLLM(result.results);
  let text = `Extracted content from ${successCount} URL(s)`;
  if (failedCount > 0) text += ` (${failedCount} failed)`;
  text += `:\n\n${formatted}`;

  const sources = result.results.map(r => {
    const titleMatch = r.content.match(/^#\s+(.+)$/m) || r.content.match(/^(.+)$/m);
    const extractedTitle = titleMatch ? titleMatch[1].substring(0, 100) : new URL(r.url).hostname;
    return {
      source: { name: r.url, url: r.url },
      document: [`# ${extractedTitle}\n\n${r.content}`],
      metadata: [{
        title: extractedTitle,
        url: r.url,
        date_accessed: new Date().toISOString(),
        type: 'web_scrape',
      }],
    };
  });

  return {
    result: formatToolResult('web_scrape', text),
    sources,
    successCount,
    failedCount,
    error: null,
  };
}

export async function executeDeepResearch(params, config, callbacks = {}) {
  const query = params.query;
  if (!query) return toolError('deep_research', 'No research query provided');

  const apiKey = config.tavily_api_key;
  if (!apiKey) return toolError('deep_research', 'Tavily API key not configured');

  const onProgress = callbacks.onProgress || (() => {});

  const result = await tavily.research(apiKey, query, {
    model: 'mini',
    onProgress: (update) => {
      if (update.type === 'content') onProgress({ type: 'content', chunk: update.chunk });
      else if (update.name)          onProgress({ type: 'status', tool: update.name, status: update.status });
    },
  });
  if (result.error) return toolError('deep_research', result.error);

  const userEmail = config.USER_EMAIL;
  const conversationId = config.CONVERSATION_ID;
  const toolsetApiUrl = config.TOOLSET_API_URL;

  // Save a markdown copy (and a PDF if PhantomJS is available) and
  // surface a download URL the user can click.
  let downloadUrl = null;
  if (result.report && userEmail && conversationId && toolsetApiUrl) {
    try {
      const timestamp = Date.now();
      const sanitisedQuery = query.substring(0, 50).replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
      const baseName = `research-${sanitisedQuery}-${timestamp}`;
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeConvId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const folderPath = path.join(projectRoot, 'data', safeEmail, safeConvId, 'volume', 'research');
      fs.mkdirSync(folderPath, { recursive: true });

      fs.writeFileSync(path.join(folderPath, `${baseName}.md`), result.report);

      let reportFile = `${baseName}.md`;
      try {
        const pdfPath = path.join(folderPath, `${baseName}.pdf`);
        await exportToPdf(result.report, pdfPath, {
          title: 'Deep Research Report',
          query,
          date: new Date().toISOString(),
        });
        reportFile = `${baseName}.pdf`;
        console.log(`📄 Saved research report: ${pdfPath}`);
      } catch (pdfError) {
        console.error('PDF generation failed, using markdown fallback:', pdfError.message);
      }

      fs.writeFileSync(path.join(folderPath, `${baseName}.meta.json`), JSON.stringify({
        id: baseName,
        name: reportFile,
        type: 'deep_research_report',
        query,
        source_count: result.sources.length,
        timestamp: new Date().toISOString(),
      }, null, 2));

      downloadUrl = `${toolsetApiUrl}/${safeEmail}/${safeConvId}/volume/research/${reportFile}`;
      console.log(`📎 Report download: ${downloadUrl}`);
    } catch (saveError) {
      console.error('Failed to save research report:', saveError.message);
    }
  }

  const citationSources = result.sources.map((s, i) => ({
    source: { name: s.url, url: s.url },
    document: [`# ${s.title || 'Research Source'}\n\nSource [${i + 1}] used in deep research synthesis.`],
    metadata: [{
      title: s.title || 'Research Source',
      source: s.title || 'Research Source',
      url: s.url,
      date_accessed: new Date().toISOString(),
      type: 'deep_research_citation',
    }],
  }));

  const sources = [...citationSources];
  if (downloadUrl) {
    sources.push({
      source: { name: `📄 Research Report: ${query.substring(0, 50)}...`, url: downloadUrl },
      document: [`# Deep Research Report\n\n**Query:** ${query}\n\nClick to download the full PDF report.`],
      metadata: [{
        title: 'Deep Research Report',
        query,
        url: downloadUrl,
        date_generated: new Date().toISOString(),
        type: 'deep_research_report',
        downloadable: true,
      }],
    });
  }

  let resultText = result.report;
  if (downloadUrl) resultText += `\n\n---\n📄 **Download Report:** ${downloadUrl}`;

  return {
    result: formatToolResult('deep_research', resultText),
    sources,
    report: result.report,
    downloadUrl,
    error: null,
  };
}
