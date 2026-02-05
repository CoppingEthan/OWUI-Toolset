/**
 * Tavily Web Search API Wrapper
 * Provides web search functionality for the OWUI Toolset
 */

import axios from 'axios';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';
const TAVILY_EXTRACT_URL = 'https://api.tavily.com/extract';
const TAVILY_RESEARCH_URL = 'https://api.tavily.com/research';

/**
 * Execute a web search using Tavily API
 * @param {string} apiKey - Tavily API key
 * @param {string} query - Search query
 * @param {object} options - Optional search parameters
 * @param {number} options.maxResults - Max results (1-20, default 5)
 * @param {string} options.searchDepth - 'basic', 'advanced', 'fast', 'ultra-fast' (default 'basic')
 * @param {boolean} options.includeFullContent - Include full page content in markdown (default false, costs 2x credits)
 * @param {string} options.topic - 'general', 'news', 'finance' (default 'general')
 * @param {boolean} options.includeImages - Include images in search results (default false)
 * @returns {Promise<{results: Array, sources: Array, images?: Array, error?: string}>}
 */
async function search(apiKey, query, options = {}) {
  if (!apiKey) {
    return {
      results: [],
      sources: [],
      error: 'Tavily API key not configured'
    };
  }

  if (!query || query.trim().length === 0) {
    return {
      results: [],
      sources: [],
      error: 'Search query is empty'
    };
  }

  try {
    // Determine if we should request full page content
    const includeFullContent = options.includeFullContent || false;
    const includeImages = options.includeImages || false;

    const response = await axios.post(
      TAVILY_SEARCH_URL,
      {
        query: query.trim(),
        max_results: options.maxResults || 5,
        search_depth: includeFullContent ? 'advanced' : (options.searchDepth || 'basic'),
        topic: options.topic || 'general',
        include_answer: false,
        include_raw_content: includeFullContent ? 'markdown' : false,
        include_images: includeImages,
        include_image_descriptions: includeImages  // Always get descriptions when images requested
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const data = response.data;

    // Format results for LLM consumption
    // Use raw_content (full page) if available, otherwise use content (snippet)
    const results = (data.results || []).map((result, index) => ({
      index: index + 1,
      title: result.title || 'Untitled',
      url: result.url || '',
      content: result.raw_content || result.content || '',
      snippet: result.content || '',  // Always keep snippet for quick reference
      hasFullContent: !!result.raw_content,
      score: result.score || 0
    }));

    // Format sources for OWUI citation panel
    // Use title as source.name (keeps sources separate in OWUI)
    // URL goes in source.url for linking
    const sources = (data.results || []).map((result, index) => {
      const content = result.raw_content || result.content || '';
      const url = result.url || '';
      const title = result.title || 'Untitled';

      return {
        source: {
          name: url,  // URL for favicon lookup
          url: url
        },
        document: [`# ${title}\n\n${content}`],  // Title as heading + content
        metadata: [{
          title: title,
          date_accessed: new Date().toISOString(),
          source: title,
          url: url,
          relevance_score: result.score || 0,
          search_query: query
        }]
      };
    });

    // Extract images if available
    const images = (data.images || []).map((img, index) => ({
      index: index + 1,
      url: typeof img === 'string' ? img : img.url,
      description: typeof img === 'object' ? img.description : null
    }));

    return {
      results,
      sources,
      images: images.length > 0 ? images : null,
      responseTime: data.response_time,
      error: null
    };

  } catch (error) {
    let errorMessage = 'Search failed';

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail?.error || error.response.data?.message;

      switch (status) {
        case 401:
          errorMessage = 'Invalid Tavily API key';
          break;
        case 429:
          errorMessage = 'Tavily rate limit exceeded. Please try again later';
          break;
        case 432:
          errorMessage = 'Tavily usage limit exceeded. Please check your plan';
          break;
        case 433:
          errorMessage = 'Tavily pay-as-you-go limit exceeded';
          break;
        case 500:
          errorMessage = 'Tavily server error. Please try again';
          break;
        default:
          errorMessage = detail || `Search failed with status ${status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Search timed out. Please try again';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Could not connect to Tavily. Please check your internet connection';
    }

    console.error('Tavily search error:', error.message);

    return {
      results: [],
      sources: [],
      error: errorMessage
    };
  }
}

/**
 * Format search results as a string for LLM consumption
 * Uses markdown formatting for better readability
 * @param {Array} results - Search results from search()
 * @returns {string} Formatted results string in markdown
 */
function formatResultsForLLM(results) {
  if (!results || results.length === 0) {
    return 'No results found.';
  }

  return results.map(r => {
    const contentLabel = r.hasFullContent ? 'Full Content' : 'Summary';
    // Truncate very long content for LLM (keep under 5000 chars per result)
    const content = r.content.length > 5000
      ? r.content.substring(0, 5000) + '... [content truncated]'
      : r.content;

    return `### [${r.index}] ${r.title}
**URL:** ${r.url}
**${contentLabel}:**
${content}`;
  }).join('\n\n---\n\n');
}

/**
 * Format images for LLM consumption
 * @param {Array} images - Images from search() with {url, description}
 * @returns {string} Formatted images string in markdown
 */
function formatImagesForLLM(images) {
  if (!images || images.length === 0) {
    return '';
  }

  const formatted = images.map(img => {
    const desc = img.description ? `: ${img.description}` : '';
    return `[${img.index}] ${img.url}${desc}`;
  }).join('\n');

  return `\n\n## Images Found\n${formatted}`;
}

/**
 * Extract content from specific URLs using Tavily Extract API
 * @param {string} apiKey - Tavily API key
 * @param {string[]} urls - Array of URLs to extract (max 20)
 * @param {object} options - Optional extract parameters
 * @param {boolean} options.includeImages - Include images from pages (default false)
 * @param {string} options.extractDepth - 'basic' or 'advanced' (default 'basic', advanced costs 2x)
 * @returns {Promise<{results: Array, failedResults: Array, error?: string}>}
 */
async function extract(apiKey, urls, options = {}) {
  if (!apiKey) {
    return {
      results: [],
      failedResults: [],
      error: 'Tavily API key not configured'
    };
  }

  if (!urls || urls.length === 0) {
    return {
      results: [],
      failedResults: [],
      error: 'No URLs provided'
    };
  }

  if (urls.length > 20) {
    return {
      results: [],
      failedResults: [],
      error: 'Maximum 20 URLs allowed per request'
    };
  }

  try {
    const response = await axios.post(
      TAVILY_EXTRACT_URL,
      {
        urls: urls,
        include_images: options.includeImages || false,
        extract_depth: options.extractDepth || 'basic',
        format: 'markdown'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for extraction
      }
    );

    const data = response.data;

    // Format successful results
    const results = (data.results || []).map((result, index) => ({
      index: index + 1,
      url: result.url || '',
      content: result.raw_content || '',
      images: result.images || []
    }));

    // Format failed results
    const failedResults = (data.failed_results || []).map(result => ({
      url: result.url || '',
      error: result.error || 'Unknown error'
    }));

    return {
      results,
      failedResults,
      responseTime: data.response_time,
      error: null
    };

  } catch (error) {
    let errorMessage = 'Extract failed';

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail?.error || error.response.data?.message;

      switch (status) {
        case 401:
          errorMessage = 'Invalid Tavily API key';
          break;
        case 429:
          errorMessage = 'Tavily rate limit exceeded';
          break;
        case 432:
          errorMessage = 'Tavily usage limit exceeded';
          break;
        case 433:
          errorMessage = 'Tavily pay-as-you-go limit exceeded';
          break;
        case 500:
          errorMessage = 'Tavily server error';
          break;
        default:
          errorMessage = detail || `Extract failed with status ${status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Extract timed out';
    }

    console.error('Tavily extract error:', error.message);

    return {
      results: [],
      failedResults: [],
      error: errorMessage
    };
  }
}

/**
 * Format extract results for LLM consumption
 * @param {Array} results - Results from extract()
 * @returns {string} Formatted results in markdown
 */
function formatExtractForLLM(results) {
  if (!results || results.length === 0) {
    return 'No content extracted.';
  }

  return results.map(r => {
    // Truncate very long content
    const content = r.content.length > 8000
      ? r.content.substring(0, 8000) + '... [content truncated]'
      : r.content;

    return `### [${r.index}] ${r.url}\n${content}`;
  }).join('\n\n---\n\n');
}

/**
 * Execute deep research using Tavily Research API
 * @param {string} apiKey - Tavily API key
 * @param {string} query - Research question/topic
 * @param {object} options - Optional research parameters
 * @param {string} options.model - 'mini', 'pro', or 'auto' (default 'auto')
 * @param {function} options.onProgress - Callback for streaming progress updates
 * @returns {Promise<{report: string, sources: Array, error?: string}>}
 */
async function research(apiKey, query, options = {}) {
  if (!apiKey) {
    return {
      report: '',
      sources: [],
      error: 'Tavily API key not configured'
    };
  }

  if (!query || query.trim().length === 0) {
    return {
      report: '',
      sources: [],
      error: 'Research query is empty'
    };
  }

  const onProgress = options.onProgress || (() => {});
  const useStreaming = typeof onProgress === 'function';

  try {
    if (useStreaming) {
      // Streaming mode - use fetch for SSE
      const response = await fetch(TAVILY_RESEARCH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: query.trim(),
          model: options.model || 'auto',
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let report = '';
      let sources = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta;

              if (delta?.tool_calls) {
                // Progress update (Planning, WebSearch, etc.)
                const toolCall = delta.tool_calls;
                onProgress({
                  type: toolCall.type,
                  name: toolCall.tool_call?.[0]?.name || toolCall.tool_response?.[0]?.name,
                  status: toolCall.type === 'tool_call' ? 'started' : 'completed'
                });
              } else if (delta?.content) {
                // Report content chunk
                if (typeof delta.content === 'string') {
                  report += delta.content;
                  onProgress({ type: 'content', chunk: delta.content });
                }
              } else if (delta?.sources) {
                // Final sources
                sources = delta.sources.map(s => ({
                  url: s.url,
                  title: s.title
                }));
              }
            } catch (e) {
              // Skip malformed JSON
            }
          } else if (line === 'event: done') {
            break;
          }
        }
      }

      return {
        report,
        sources,
        error: null
      };

    } else {
      // Non-streaming mode - just get the task ID and poll
      const response = await axios.post(
        TAVILY_RESEARCH_URL,
        {
          input: query.trim(),
          model: options.model || 'auto',
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minute timeout for research
        }
      );

      // Non-streaming returns task info, need to poll for completion
      // For simplicity, we'll use streaming mode in the executor
      return {
        report: '',
        sources: [],
        taskId: response.data.request_id,
        status: response.data.status,
        error: 'Non-streaming research requires polling. Use streaming mode instead.'
      };
    }

  } catch (error) {
    let errorMessage = 'Research failed';

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail?.error || error.response.data?.message;

      switch (status) {
        case 401:
          errorMessage = 'Invalid Tavily API key';
          break;
        case 429:
          errorMessage = 'Tavily rate limit exceeded';
          break;
        case 432:
          errorMessage = 'Tavily usage limit exceeded';
          break;
        case 433:
          errorMessage = 'Tavily pay-as-you-go limit exceeded';
          break;
        case 500:
          errorMessage = 'Tavily server error';
          break;
        default:
          errorMessage = detail || `Research failed with status ${status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Research timed out';
    }

    console.error('Tavily research error:', error.message);

    return {
      report: '',
      sources: [],
      error: errorMessage
    };
  }
}

export {
  search,
  formatResultsForLLM,
  formatImagesForLLM,
  extract,
  formatExtractForLLM,
  research
};
