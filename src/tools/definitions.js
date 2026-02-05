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
          description: 'Research depth: "mini" for quick overview, "pro" for comprehensive analysis',
          enum: ['mini', 'pro', 'auto'],
          default: 'auto'
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
          default: 15,
          minimum: 10,
          maximum: 50
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
          default: 15,
          minimum: 10,
          maximum: 50
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
          default: 15,
          minimum: 10,
          maximum: 50
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
    description: `Execute a shell command in a secure sandbox environment.

The sandbox provides:
- Ubuntu 24.04 with Python 3, Node.js 20, common tools
- 1GB memory limit, 2 CPUs, 5-minute timeout per command
- Internet access (no LAN access for security)
- Persistent /workspace directory

Pre-installed: numpy, pandas, matplotlib, pillow, requests, beautifulsoup4, openpyxl, PyPDF2, typescript, ffmpeg, imagemagick, pandoc, jq, sqlite3

Use for: running scripts, processing files, installing packages, data analysis, file conversion.

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

  return enabledTools;
}
