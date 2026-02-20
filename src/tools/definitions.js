/**
 * Unified Tool Definitions
 * Master definitions for all tools in provider-agnostic format
 * Exported functions transform to OpenAI, Anthropic, and Ollama formats
 */

// ═══════════════════════════════════════════════════════════════════════════
// Master Tool Definitions (Provider-Agnostic)
// ═══════════════════════════════════════════════════════════════════════════

export const TOOL_DEFINITIONS = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for current information. Use this when you need up-to-date facts, news, weather, or information not in your training data. Can optionally include images in results.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query (e.g., "latest AI developments", "weather in Tokyo", "cat photos")'
        },
        num_results: {
          type: 'integer',
          description: 'Number of search results to return (1-10)',
          default: 3,
          minimum: 1,
          maximum: 10
        },
        include_full_content: {
          type: 'boolean',
          description: 'Fetch full page content instead of just snippets (costs more API credits)',
          default: false
        },
        include_images: {
          type: 'boolean',
          description: 'Include image URLs in search results (use for: "show me", "photos of", "images of", "diagram of")',
          default: false
        }
      },
      required: ['query']
    }
  },

  web_scrape: {
    name: 'web_scrape',
    description: 'Extract full content from specific URLs. Use this to read documentation, articles, or web pages in detail. Maximum 20 URLs per call.',
    parameters: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          description: 'Array of URLs to extract content from',
          items: {
            type: 'string',
            format: 'uri'
          },
          minItems: 1,
          maxItems: 20
        },
        include_images: {
          type: 'boolean',
          description: 'Extract image URLs from the pages',
          default: false
        }
      },
      required: ['urls']
    }
  },

  deep_research: {
    name: 'deep_research',
    description: `Perform comprehensive research with automatic multi-search synthesis. Generates a downloadable PDF report with citations.

USE FOR: thorough research, comprehensive reports, multi-angle investigation, market/competitive analysis.

BEFORE: Clarify scope - ask what aspects to focus on and desired depth (quick overview vs comprehensive).

OUTPUT: Full report content + PDF download link. AFTER completion: provide **[📄 Download Report](URL)** link and 2-3 sentence summary.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The research topic or question (e.g., "impact of AI on healthcare 2024-2026")'
        },
        model: {
          type: 'string',
          description: 'Research depth. Only "mini" is supported.',
          enum: ['mini'],
          default: 'mini'
        }
      },
      required: ['query']
    }
  },

  image_generation: {
    name: 'image_generation',
    description: `Generate an image from text. Write prompts as flowing prose, not keywords.

STRUCTURE: Subject → Setting → Details → Lighting → Atmosphere
LIGHTING IS KEY: "golden hour sunlight streaming through windows" > "good lighting"
FRONT-LOAD: Put most important elements first. Word order = priority.
STYLE: Include artistic style if relevant (oil painting, photography, anime, etc.)

NOTE: Generation runs server-side and typically takes 30-120 seconds. Wait for the result — do not call this tool again for the same request.
AFTER COMPLETION: Always display the generated image to the user using markdown format: ![Brief description](image_url)`,
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Natural language description. Example: "A weathered lighthouse stands on rocky cliffs, waves crashing below, dramatic storm clouds overhead, late afternoon light breaking through"'
        },
        negative_prompt: {
          type: 'string',
          description: 'What to avoid in the image (optional). Use to exclude unwanted elements.',
          default: ''
        },
        width: {
          type: 'integer',
          description: 'Image width in pixels (must be multiple of 64)',
          default: 1024,
          minimum: 512,
          maximum: 1536
        },
        height: {
          type: 'integer',
          description: 'Image height in pixels (must be multiple of 64)',
          default: 1024,
          minimum: 512,
          maximum: 1536
        },
        steps: {
          type: 'integer',
          description: 'Generation quality/detail level',
          default: 4,
          minimum: 3,
          maximum: 5
        }
      },
      required: ['prompt']
    }
  },

  image_edit: {
    name: 'image_edit',
    description: `Transform an existing image based on text description. Requires uploaded image URL.

USE FOR: style changes, enhancements, modifications, artistic transformations.
PROMPT: Describe the desired result, not the process. "A serene Japanese garden in watercolor style" not "convert to watercolor".
PRESERVE: Mention elements to keep. "maintaining the original composition" or "keeping the subject's pose".

NOTE: Editing runs server-side and typically takes 30-120 seconds. Wait for the result — do not call this tool again for the same request.
AFTER COMPLETION: Always display the edited image to the user using markdown format: ![Brief description](image_url)`,
    parameters: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'URL of source image from user\'s uploaded files'
        },
        prompt: {
          type: 'string',
          description: 'Describe the desired output. Example: "Transform into a vibrant pop art piece with bold colors and halftone dots, maintaining the original subject"'
        },
        negative_prompt: {
          type: 'string',
          description: 'What to avoid in the output (optional)',
          default: ''
        },
        steps: {
          type: 'integer',
          description: 'Generation quality/detail level',
          default: 4,
          minimum: 3,
          maximum: 5
        }
      },
      required: ['image_url', 'prompt']
    }
  },

  image_blend: {
    name: 'image_blend',
    description: `Combine elements from two images. Image 1 = main subject/composition, Image 2 = style/elements to transfer.

USE FOR: style transfer, merging subjects, texture application, creative combinations.
PROMPT: Describe the final result referencing both sources. Specify what to take from each.
Example: "The portrait from image 1 rendered in the impressionist painting style of image 2, with visible brushstrokes and vibrant colors"

NOTE: Blending runs server-side and typically takes 30-120 seconds. Wait for the result — do not call this tool again for the same request.
AFTER COMPLETION: Always display the blended image to the user using markdown format: ![Brief description](image_url)`,
    parameters: {
      type: 'object',
      properties: {
        image_url_1: {
          type: 'string',
          description: 'URL of first image (main subject/composition)'
        },
        image_url_2: {
          type: 'string',
          description: 'URL of second image (style/element to transfer)'
        },
        prompt: {
          type: 'string',
          description: 'Describe blended result. Example: "The architecture from image 1 with the moody, foggy atmosphere and color palette from image 2"'
        },
        negative_prompt: {
          type: 'string',
          description: 'What to avoid in the output (optional)',
          default: ''
        },
        steps: {
          type: 'integer',
          description: 'Generation quality/detail level',
          default: 4,
          minimum: 3,
          maximum: 5
        }
      },
      required: ['image_url_1', 'image_url_2', 'prompt']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Sandbox Code Execution Tools
  // ═══════════════════════════════════════════════════════════════════════════

  sandbox_execute: {
    name: 'sandbox_execute',
    description: `Execute a shell command in a secure sandbox environment. You have full control — install packages, run any code, process any files.

ENVIRONMENT: Ubuntu 24.04, Python 3, Node.js 20, 1GB RAM, 2 CPUs, 5-min timeout, internet access, persistent /workspace.

SYSTEM TOOLS: ffmpeg, imagemagick, ghostscript, poppler-utils, pandoc, wkhtmltopdf, libreoffice (calc+writer), jq, csvkit, sqlite3, curl, wget, httpie, git, ripgrep, build-essential (gcc/make), zip/unzip/tar/gzip/bzip2/xz/7z.

PYTHON (pre-installed): numpy, pandas, scipy, scikit-learn, matplotlib, seaborn, plotly, altair, bokeh, pillow, opencv-python-headless, openpyxl, xlrd, xlsxwriter, python-docx, PyPDF2, pypdf, pdfplumber, python-pptx, requests, httpx, beautifulsoup4, lxml, selenium, pyyaml, toml, xmltodict, chardet, ftfy, fuzzywuzzy, rapidfuzz, tqdm, rich, tabulate, python-dateutil, pytz, mutagen, ffmpeg-python, py7zr, rarfile.

NODE.JS (global): typescript, esbuild, yarn, pnpm, prettier, marked, svgo.

PERSISTENCE: Only /workspace survives across commands. pip-installed packages and other changes outside /workspace are temporary — if the sandbox resets after inactivity, you may need to reinstall them.

TIPS:
- PDF conversion: pandoc file.md -o file.pdf --pdf-engine=wkhtmltopdf
- Spreadsheet conversion: libreoffice --headless --convert-to xlsx file.csv
- pip install works directly (no flags needed)
- Use python (not python3) for scripts

IMPORTANT: If process is killed (exit 137), check if it was OOM (memory) or timeout. Adjust code accordingly.`,
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command to execute (e.g., "python script.py", "node index.js", "pip install package")'
        },
        workdir: {
          type: 'string',
          description: 'Working directory within /workspace (default: /workspace)',
          default: '/workspace'
        }
      },
      required: ['command']
    }
  },

  sandbox_write_file: {
    name: 'sandbox_write_file',
    description: 'Create or overwrite a file in the sandbox workspace. Use for writing code, configs, data files, or any text content.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path within /workspace (e.g., "script.py", "data/input.json", "src/main.ts")'
        },
        content: {
          type: 'string',
          description: 'File content to write'
        }
      },
      required: ['path', 'content']
    }
  },

  sandbox_read_file: {
    name: 'sandbox_read_file',
    description: 'Read the contents of a file from the sandbox workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path within /workspace to read'
        },
        maxLines: {
          type: 'integer',
          description: 'Maximum lines to read (default: 1000, use for large files)',
          default: 1000
        }
      },
      required: ['path']
    }
  },

  sandbox_list_files: {
    name: 'sandbox_list_files',
    description: 'List files and directories in the sandbox workspace. Shows file sizes and modification dates.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list (default: /workspace)',
          default: '/workspace'
        },
        recursive: {
          type: 'boolean',
          description: 'Include subdirectories recursively',
          default: false
        }
      },
      required: []
    }
  },

  sandbox_diff_edit: {
    name: 'sandbox_diff_edit',
    description: 'Edit a file using exact search and replace. More efficient than rewriting entire files - use this for small changes.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path within /workspace to edit'
        },
        search: {
          type: 'string',
          description: 'Exact string to find (must exist in file, match whitespace exactly)'
        },
        replace: {
          type: 'string',
          description: 'Replacement string'
        },
        all: {
          type: 'boolean',
          description: 'Replace all occurrences (default: first only)',
          default: false
        }
      },
      required: ['path', 'search', 'replace']
    }
  },

  sandbox_stats: {
    name: 'sandbox_stats',
    description: 'Get current sandbox resource usage including memory, CPU, process count, and disk space.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // User Memory Tools
  // ═══════════════════════════════════════════════════════════════════════════

  memory_retrieve: {
    name: 'memory_retrieve',
    description: 'Retrieve all saved memories for the current user. Use this to check what you already know about the user before saving new memories. Returns all stored memories with their IDs, content, and timestamps.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  memory_create: {
    name: 'memory_create',
    description: 'Save a new memory about the current user. Use this to remember important user preferences, facts, or context across conversations. Keep memories concise and factual (e.g., "Prefers Python over JavaScript", "Works at Acme Corp as a backend engineer"). Avoid duplicating existing memories - use memory_retrieve first to check. If near the character limit, use memory_update to consolidate or memory_delete to remove outdated entries.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The memory content to save (concise factual statement about the user)'
        }
      },
      required: ['content']
    }
  },

  memory_update: {
    name: 'memory_update',
    description: 'Update an existing memory by its ID. Use this to correct, consolidate, or refine stored memories. Retrieve memories first to get the ID.',
    parameters: {
      type: 'object',
      properties: {
        memory_id: {
          type: 'integer',
          description: 'The ID of the memory to update (from memory_retrieve results)'
        },
        content: {
          type: 'string',
          description: 'The updated memory content'
        }
      },
      required: ['memory_id', 'content']
    }
  },

  memory_delete: {
    name: 'memory_delete',
    description: 'Delete a memory by its ID. Use this to remove outdated or incorrect memories. Retrieve memories first to get the ID.',
    parameters: {
      type: 'object',
      properties: {
        memory_id: {
          type: 'integer',
          description: 'The ID of the memory to delete (from memory_retrieve results)'
        }
      },
      required: ['memory_id']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Date & Time Tools
  // ═══════════════════════════════════════════════════════════════════════════

  date_time_now: {
    name: 'date_time_now',
    description: 'Get the current date, time, and timezone. Defaults to Europe/London (UK) but any IANA timezone can be specified. Use this whenever the user asks for the current time, date, or day of the week.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone (e.g. "Europe/London", "America/New_York", "Asia/Tokyo"). Defaults to Europe/London.',
          default: 'Europe/London'
        }
      },
      required: []
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // File Recall Tools
  // ═══════════════════════════════════════════════════════════════════════════

  file_recall_search: {
    name: 'file_recall_search',
    description: `Search the client's internal document library. Returns the most relevant text snippets from uploaded documents, ranked by relevance.

USE FOR: Finding information in internal documents, policies, procedures, reports, or stored knowledge.
DO NOT USE FOR: General web searches or questions not about the client's documents.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query describing what to find'
        },
        max_results: {
          type: 'integer',
          description: 'Number of top snippets to return (default 10, max 50)',
          default: 10
        }
      },
      required: ['query']
    }
  },

  date_time_diff: {
    name: 'date_time_diff',
    description: `Calculate the exact difference between two dates/times. Returns years, months, days, hours, minutes, and seconds between two points in time.

USE FOR: "how long between X and Y", "how many days until", "exact seconds between two dates", age calculations, countdowns, duration calculations.

INPUT: Dates as ISO 8601 strings (e.g. "2019-04-03", "2023-06-21T14:30:00") or natural formats the tool will parse (e.g. "3rd April 2019", "June 21 2023"). Times default to 00:00:00 if not specified.`,
    parameters: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date/time (e.g. "2019-04-03", "2019-04-03T09:30:00", "March 15 2020")'
        },
        to: {
          type: 'string',
          description: 'End date/time (e.g. "2023-06-21", "2023-06-21T18:00:00", "December 25 2025")'
        },
        timezone: {
          type: 'string',
          description: 'IANA timezone for interpreting the dates (default: Europe/London)',
          default: 'Europe/London'
        }
      },
      required: ['from', 'to']
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OpenAI Format Transformers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform tool definitions to OpenAI Chat Completions format
 * Used for legacy Chat Completions API
 * @param {Array<string>} toolNames - Array of tool names to include
 * @param {Object} options - Transform options
 * @param {boolean} options.strict - Use strict schema validation (default: false)
 * @returns {Array} OpenAI Chat Completions formatted tools
 */
export function toOpenAIChatCompletionsTools(toolNames, options = {}) {
  const { strict = false } = options;

  return toolNames.map(name => {
    const def = TOOL_DEFINITIONS[name];
    if (!def) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const tool = {
      type: 'function',
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters
      }
    };

    if (strict) {
      tool.function.strict = true;
      // For strict mode, must include additionalProperties: false
      if (!tool.function.parameters.additionalProperties) {
        tool.function.parameters.additionalProperties = false;
      }
    }

    return tool;
  });
}

/**
 * Transform tool definitions to OpenAI Responses API format (FunctionTool)
 * The Responses API uses a flat format with type: 'function' directly
 * @param {Array<string>} toolNames - Array of tool names to include
 * @param {Object} options - Transform options
 * @param {boolean} options.strict - Use strict schema validation (default: true for Responses API)
 * @returns {Array} OpenAI Responses API formatted tools (FunctionTool[])
 */
export function toOpenAITools(toolNames, options = {}) {
  const { strict = true } = options;  // Responses API recommends strict: true by default

  return toolNames.map(name => {
    const def = TOOL_DEFINITIONS[name];
    if (!def) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // FunctionTool format for Responses API
    const tool = {
      type: 'function',
      name: def.name,
      description: def.description,
      parameters: def.parameters,
      strict: strict
    };

    // For strict mode, must include additionalProperties: false
    if (strict && !tool.parameters.additionalProperties) {
      tool.parameters = { ...tool.parameters, additionalProperties: false };
    }

    return tool;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Anthropic Format Transformer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform tool definitions to Anthropic format
 * @param {Array<string>} toolNames - Array of tool names to include
 * @param {Object} options - Transform options
 * @returns {Array} Anthropic-formatted tools
 */
export function toAnthropicTools(toolNames, options = {}) {
  return toolNames.map(name => {
    const def = TOOL_DEFINITIONS[name];
    if (!def) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return {
      name: def.name,
      description: def.description,
      input_schema: def.parameters
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Ollama Format Transformer (OpenAI Chat Completions Compatible)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform tool definitions to Ollama format (uses OpenAI Chat Completions format)
 * @param {Array<string>} toolNames - Array of tool names to include
 * @param {Object} options - Transform options
 * @returns {Array} Ollama-formatted tools
 */
export function toOllamaTools(toolNames, options = {}) {
  // Ollama uses OpenAI Chat Completions compatible format (not Responses API)
  return toOpenAIChatCompletionsTools(toolNames, { strict: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get enabled tool names from config
 * @param {Object} config - Configuration object with tools toggle
 * @returns {Array<string>} Array of enabled tool names
 */
export function getEnabledToolNames(config) {
  const enabledTools = [];

  if (!config.tools) {
    return enabledTools;
  }

  // Tavily-based tools require Tavily API key
  const hasTavilyKey = !!config.tavily_api_key;

  if (hasTavilyKey) {
    if (config.tools.web_search) {
      enabledTools.push('web_search');
    }

    if (config.tools.web_scrape) {
      enabledTools.push('web_scrape');
    }

    if (config.tools.deep_research) {
      enabledTools.push('deep_research');
    }
  }

  // ComfyUI-based image tools require ComfyUI URL
  const hasComfyUI = !!config.comfyui_base_url;

  if (hasComfyUI) {
    if (config.tools.image_generation) {
      enabledTools.push('image_generation');
    }

    if (config.tools.image_edit) {
      enabledTools.push('image_edit');
    }

    if (config.tools.image_blend) {
      enabledTools.push('image_blend');
    }
  }

  // Sandbox tools - always available when enabled (no external service dependency)
  if (config.tools.sandbox) {
    enabledTools.push(
      'sandbox_execute',
      'sandbox_write_file',
      'sandbox_read_file',
      'sandbox_list_files',
      'sandbox_diff_edit',
      'sandbox_stats'
    );
  }

  // Memory tools - always available when enabled (no external service dependency)
  if (config.tools.memory) {
    enabledTools.push(
      'memory_retrieve',
      'memory_create',
      'memory_update',
      'memory_delete'
    );
  }

  // File recall - requires instance ID to be configured
  if (config.tools.file_recall && config.file_recall_instance_id) {
    enabledTools.push('file_recall_search');
  }

  // Date/time tools - always available when enabled (no external service dependency)
  if (config.tools.date_time) {
    enabledTools.push(
      'date_time_now',
      'date_time_diff'
    );
  }

  return enabledTools;
}
