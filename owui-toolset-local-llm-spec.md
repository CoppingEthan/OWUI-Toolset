# OWUI-Toolset Local LLM Integration — Implementation Spec

## Overview

Replace the current single-provider-per-request architecture with a **local-first model** that can escalate to a cloud expert when needed. All requests route through a local gpt-oss-20b instance running on llama-server (llama.cpp). When the local model determines a task exceeds its capability (complex coding, vision, deep analysis), it calls an `escalate_to_expert` tool that seamlessly swaps to Anthropic Claude Sonnet 4.6 mid-conversation. The user sees one continuous streaming response — the provider swap is invisible.

Additionally, remove the OpenAI and Ollama providers to simplify the codebase down to two providers: **llama-server** (local, primary) and **Anthropic** (cloud, expert fallback + vision).

### Goals

- **Cost reduction**: Route 70-80% of requests through the free local model
- **Low latency**: First token from local model in ~5ms vs ~500ms from API
- **Quality preservation**: Complex tasks still get Sonnet 4.6 quality
- **Vision support**: Images automatically route to Sonnet via escalation
- **Seamless UX**: Users see one continuous response regardless of provider swap
- **ComfyUI coordination**: llama-server auto-stops when image generation needs VRAM, restarts after
- **Simplified codebase**: Two providers instead of four

### Hardware Context

The llama-server runs in an LXC container (`10.0.0.23:8080`) on a Proxmox host with an RTX 3090 (24GB). The gpt-oss-20b Q8_0 model (12GB) runs entirely on the 3090 with 2 slots × 128k context, achieving 121+ TPS per user under dual load. The 3060 (12GB) is reserved for Kokoro TTS, Docling, and other services.

---

## Architecture

```
Open WebUI
  │
  ▼
owui-pipe.py (always sends provider="llama-server")
  │
  ▼
server.js (/api/v1/chat)
  │  Image pre-check: if images in current message
  │  AND llama-server is the provider, auto-switch
  │  provider to "anthropic" before entering the
  │  provider loop (gpt-oss has no vision).
  │
  │  Pre-stream fallback: if llama-server unreachable
  │  (e.g. stopped for ComfyUI), route to Anthropic.
  │
  ▼
Provider Router (providers/index.js)
  │
  ├─► llama-server.js (PRIMARY)
  │     - gpt-oss-20b via OpenAI-compatible API
  │     - All tools available including escalate_to_expert + view_image
  │     - Tool loop up to 15 iterations
  │     - When escalate_to_expert is called:
  │         1. Collect full conversationMessages (including all tool results)
  │         2. Convert to Anthropic message format
  │         3. Call anthropic.chatCompletionStream() with same onText/onToolCall callbacks
  │         4. Sonnet streams through the same SSE connection
  │         5. Sonnet can also call tools (web search, sandbox, etc.)
  │         6. When Sonnet finishes, llama-server loop ends
  │         7. Sonnet's response IS the final response
  │
  └─► anthropic.js (EXPERT — called via escalation or vision auto-route)
        - Claude Sonnet 4.6
        - Full tool calling support
        - Vision support (multimodal messages)
        - Does NOT have escalate_to_expert or view_image tools

ComfyUI VRAM Coordination:
  image_generation/edit/blend tool called
    │
    ▼
  executor.js → LlamaServerManager.stop()
    │              → llama-server releases 3090 VRAM
    ▼
  ComfyUI workflow runs (~45 sec, uses 3090)
    │             → ComfyUI auto-unloads after generation
    ▼
  LlamaServerManager.start() (background, non-blocking)
    │             → llama-server reloads model (~5-10 sec)
    │             → during reload, new LLM requests → Sonnet fallback
    ▼
  Image result returned to user immediately
```

### Flow Example: Mixed Complexity Task

```
User: "Look into the latest mortgage rates and apply to my uploaded CSV"

1. llama-server receives request (gpt-oss, ~5ms TTFT)
2. gpt-oss streams: "I'll look into current mortgage rates..."
3. gpt-oss calls web_search("UK mortgage rates 2026")
   → Tool executes, results flow back (iteration 2)
4. gpt-oss streams: "Current rates are... Let me examine your CSV..."
5. gpt-oss calls sandbox_read_file("uploaded/data.csv")
   → Tool executes, CSV content flows back (iteration 3)
6. gpt-oss determines: "This needs data manipulation code — escalating"
7. gpt-oss calls escalate_to_expert({
     task: "Apply mortgage rates to CSV data and generate analysis",
     capabilities_needed: ["coding", "data_analysis"]
   })
8. Escalation handler:
   a. Takes full conversationMessages (system, user, all tool results)
   b. Converts to Anthropic format
   c. Calls Sonnet with same onText/onToolCall/onSource callbacks
   d. Sonnet sees: original question + web search results + CSV content
   e. Sonnet calls sandbox_execute to write and run analysis code
   f. Sonnet streams results through same SSE connection
9. User sees one seamless response with web results + code + analysis
```

### Flow Example: Vision Request

```
User: [attaches image] "What's in this image?"

1. server.js detects image_url blocks in processedMessages
2. Provider is llama-server → auto-switches to anthropic
3. Request goes directly to Sonnet (no gpt-oss involvement)
4. Sonnet analyses the image and responds
```

### Flow Example: Vision Re-analysis (Later Turn)

```
User: "Can you look at that image I uploaded earlier again?"

1. llama-server receives request (no image in current message)
2. gpt-oss sees user wants to re-examine a previous image
3. gpt-oss calls view_image({ image_id: "img-abc123" })
4. view_image tool returns the image proxy URL
5. Since gpt-oss can't process images, it calls escalate_to_expert
   with the image re-injected into the context
6. Sonnet receives the conversation + the image and analyses it
```

---

## File Changes

### Files to CREATE

#### 1. `src/tools/providers/llama-server.js` (~250 lines)

New provider module using the OpenAI SDK with `baseURL` override pointing at llama-server's OpenAI-compatible `/v1/chat/completions` endpoint.

**Template**: Use `ollama.js` as the structural template but with the OpenAI SDK instead of the Ollama SDK.

```javascript
import OpenAI from 'openai';

function getLlamaClient(config) {
  return new OpenAI({
    baseURL: config.LLAMA_SERVER_URL || 'http://localhost:8080/v1',
    apiKey: 'not-needed'  // llama-server doesn't require auth
  });
}
```

**Exports** (same interface as every other provider):

- `chatCompletion(params)` — non-streaming with tool loop
- `chatCompletionStream(params)` — streaming with tool loop
- `formatToolCallDisplay(toolCall)` — format for OWUI display
- `getToolCapableModels(config)` — return available models

**Tool format**: Use `toOpenAIChatCompletionsTools()` from `definitions.js` (same format llama-server expects).

**Tool calling loop**: Standard `while (iteration < maxIterations)` pattern. Use OpenAI Chat Completions streaming:

```javascript
const stream = await client.chat.completions.create({
  model: config.llm_model || 'gpt-oss-20b',
  messages: conversationMessages,
  tools: tools,
  tool_choice: 'auto',
  stream: true,
  temperature: 1.0,
  top_p: 1.0,
});

for await (const chunk of stream) {
  // Process delta.content (text) and delta.tool_calls
}
```

**Tool result format**: OpenAI Chat Completions format with `tool_call_id` correlation:

```javascript
conversationMessages.push({
  role: 'tool',
  tool_call_id: toolCall.id,
  content: JSON.stringify({ result: executionResult.result, sources: executionResult.sources })
});
```

**Image handling**: Do NOT convert images. If somehow image_url blocks reach this provider, strip them (the server-level auto-route should prevent this, but be defensive). Log a warning.

**escalate_to_expert handling**: When the tool loop encounters an `escalate_to_expert` tool call:

```javascript
if (toolCall.function.name === 'escalate_to_expert') {
  // 1. Stream a status message to the user
  onText('\n\n');
  if (callbacks.onToolCall) {
    callbacks.onToolCall({
      name: 'escalate_to_expert',
      arguments: JSON.parse(toolCall.function.arguments)
    });
  }

  // 2. Convert conversationMessages to Anthropic format
  const anthropicMessages = convertToAnthropicFormat(conversationMessages);

  // 3. Import and call Anthropic provider with same callbacks
  const anthropic = await import('./anthropic.js');

  // 4. Build Anthropic-compatible params
  // IMPORTANT: Remove escalate_to_expert and view_image from the tool list
  // Sonnet should NOT be able to escalate (infinite loop)
  const expertToolNames = enabledToolNames.filter(
    t => t !== 'escalate_to_expert' && t !== 'view_image'
  );

  const result = await anthropic.chatCompletionStream({
    model: config.ANTHROPIC_EXPERT_MODEL || 'claude-sonnet-4-6',
    messages: anthropicMessages,
    enabledToolNames: expertToolNames,
    config: { ...config, llm_provider: 'anthropic' },
    onText,        // Same callbacks — streams through same SSE connection
    onToolCall,
    onSource,
    onToolOutput,
    maxIterations: maxIterations - iteration,  // Remaining budget
  });

  // 5. Return Sonnet's result as the final result
  return {
    content: result.content,
    stop_reason: result.stop_reason,
    usage: {
      // Combine local + API usage for accurate tracking
      prompt_tokens: totalLocalPromptTokens + (result.usage?.prompt_tokens || 0),
      completion_tokens: totalLocalCompletionTokens + (result.usage?.completion_tokens || 0),
    },
    iterations: iteration + (result.iterations || 1),
    escalated: true,
    escalated_model: config.ANTHROPIC_EXPERT_MODEL || 'claude-sonnet-4-6',
  };
}
```

**Message format conversion function** (`convertToAnthropicFormat`):

Convert the OpenAI Chat Completions conversation history to Anthropic's format. Key mappings:

| OpenAI CC Format | Anthropic Format |
|---|---|
| `{ role: 'system', content: '...' }` | Extract as separate system parameter |
| `{ role: 'user', content: '...' }` | `{ role: 'user', content: [{ type: 'text', text: '...' }] }` |
| `{ role: 'assistant', content: '...', tool_calls: [...] }` | `{ role: 'assistant', content: [{ type: 'text', text: '...' }, { type: 'tool_use', id: '...', name: '...', input: {...} }] }` |
| `{ role: 'tool', tool_call_id: '...', content: '...' }` | Grouped into `{ role: 'user', content: [{ type: 'tool_result', tool_use_id: '...', content: '...' }] }` |

Important: Multiple consecutive `tool` messages should be grouped into a single `user` message with multiple `tool_result` content blocks (Anthropic requires alternating user/assistant).

**view_image handling**: When gpt-oss calls `view_image`, the tool result returns the image URL and metadata. Since gpt-oss can't see the image, the tool result text should include a hint: `"Image retrieved. You cannot view images directly — use escalate_to_expert if the user needs image analysis."` This guides gpt-oss to escalate.

**No prompt caching**: llama-server doesn't support it. Skip all cache_control logic.

**Usage reporting**: Map OpenAI CC format directly:

```javascript
usage: {
  prompt_tokens: response.usage?.prompt_tokens || 0,
  completion_tokens: response.usage?.completion_tokens || 0
}
```

---

### Files to MODIFY

#### 2. `owui-pipe.py` — Valve Changes

**Remove**:
- `OPENAI_API_KEY` valve
- `OLLAMA_BASE_URL` valve
- All references to `"openai"` and `"ollama"` in Literal types

**Add**:
- `LLAMA_SERVER_URL` valve (str, default `"http://localhost:8080"`)
- `ANTHROPIC_EXPERT_MODEL` valve (str, default `"claude-sonnet-4-6"`) — the model used when escalating

**Modify provider Literal types**:

```python
# Before:
TOOL_CALLING_LLM_PROVIDER: Literal["anthropic", "openai", "ollama"] = "anthropic"
CONVERSATIONAL_LLM_PROVIDER: Literal["anthropic", "openai", "ollama"] = "anthropic"
COMPACTION_LLM_PROVIDER: Literal["anthropic", "openai", "ollama"] = "anthropic"

# After:
TOOL_CALLING_LLM_PROVIDER: Literal["llama-server", "anthropic"] = "llama-server"
CONVERSATIONAL_LLM_PROVIDER: Literal["llama-server", "anthropic"] = "llama-server"
COMPACTION_LLM_PROVIDER: Literal["llama-server", "anthropic"] = "llama-server"
```

**Default models**:

```python
TOOL_CALLING_LLM_MODEL: str = "gpt-oss-20b"
CONVERSATIONAL_LLM_MODEL: str = "gpt-oss-20b"
COMPACTION_LLM_MODEL: str = "gpt-oss-20b"  # Compaction is simple summarisation — perfect for local
```

**Pass new config values** in the payload (line ~148):

```python
"llama_server_url": self.valves.LLAMA_SERVER_URL,
"anthropic_expert_model": self.valves.ANTHROPIC_EXPERT_MODEL,
```

#### 3. `src/tools/providers/index.js` — Router Simplification

**Remove**:
- `import * as openai from './openai.js'`
- `import * as ollama from './ollama.js'`
- All OpenAI/Ollama detection logic in `detectProvider()`
- OpenAI/Ollama cases in `getProviderModule()`

**Add**:
- `import * as llamaServer from './llama-server.js'`

**Simplified router**:

```javascript
export function detectProvider(model, config) {
  if (config.llm_provider) return config.llm_provider;

  // Default to llama-server
  return 'llama-server';
}

export function getProviderModule(provider) {
  switch (provider) {
    case 'llama-server':
      return llamaServer;
    case 'anthropic':
      return anthropic;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

#### 4. `src/tools/definitions.js` — New Tool Definitions

**Add two new tool definitions** to `TOOL_DEFINITIONS`:

```javascript
escalate_to_expert: {
  name: 'escalate_to_expert',
  description:
    'Escalate a task to a more powerful expert AI model (Claude Sonnet 4.6) when the current task ' +
    'requires capabilities beyond your ability. Use this for:\n' +
    '- Complex coding tasks (multi-file refactoring, architectural decisions, debugging intricate issues)\n' +
    '- Advanced data analysis or mathematical reasoning\n' +
    '- Tasks requiring deep domain expertise\n' +
    '- Image/vision analysis (you cannot see images — always escalate when image analysis is needed)\n' +
    '- Complex creative writing requiring nuanced style\n' +
    '- Any task where you are uncertain about the quality of your output\n\n' +
    'Do NOT escalate for:\n' +
    '- Simple questions, greetings, or basic factual queries\n' +
    '- Straightforward web searches or lookups\n' +
    '- Simple code snippets or explanations\n' +
    '- File reading, listing, or basic operations\n' +
    '- Memory operations\n' +
    '- Date/time queries\n\n' +
    'When you escalate, the expert model receives the full conversation context including all ' +
    'tool results you have already gathered. Gather as much information as possible (web searches, ' +
    'file reads, etc.) BEFORE escalating so the expert can focus on the complex part.',
  parameters: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'Brief description of what needs to be done by the expert model'
      },
      reason: {
        type: 'string',
        description: 'Why this task requires the expert model (e.g., "complex multi-file refactoring", "image analysis needed", "advanced mathematical proof")'
      }
    },
    required: ['task', 'reason']
  }
},

view_image: {
  name: 'view_image',
  description:
    'Retrieve a previously uploaded image for analysis. You cannot see images directly — ' +
    'this tool retrieves the image metadata and URL. After calling this tool, you should ' +
    'escalate to the expert model using escalate_to_expert for actual image analysis.\n\n' +
    'The image context in your system prompt lists all available images with their IDs and filenames.',
  parameters: {
    type: 'object',
    properties: {
      image_id: {
        type: 'string',
        description: 'The image filename or ID from the image context list (e.g., "img-abc123.png")'
      }
    },
    required: ['image_id']
  }
}
```

**Add to `getEnabledToolNames()`**: Both tools should always be enabled when provider is llama-server. They should NOT be included when provider is anthropic (to prevent Sonnet from trying to escalate to itself).

```javascript
// In getEnabledToolNames():
// Add escalate_to_expert and view_image only for llama-server provider
if (config.llm_provider === 'llama-server') {
  names.push('escalate_to_expert');
  names.push('view_image');
}
```

**Add to format converters**: Both `toAnthropicTools()` and `toOpenAIChatCompletionsTools()` should handle these new definitions. Since they follow the standard schema, no special conversion is needed — they'll be picked up automatically from `TOOL_DEFINITIONS`.

#### 5. `src/tools/executor.js` — New Tool Handlers

**Add two new cases** to the switch statement:

```javascript
case 'escalate_to_expert':
  // This is handled specially in the llama-server provider's tool loop.
  // If it somehow reaches the executor, return a message indicating it should
  // be handled at the provider level.
  executionResult = {
    result: formatToolResult('escalate_to_expert',
      'Escalation request received. The expert model will now handle this task.'),
    sources: [],
    error: null
  };
  break;

case 'view_image':
  executionResult = executeViewImage(params, config);
  break;
```

**Add `executeViewImage` function**:

```javascript
function executeViewImage(params, config) {
  const images = config.availableImages || [];
  const imageId = params.image_id;

  // Search by filename, ID, or partial match
  const target = images.find(img =>
    img.filename === imageId ||
    img.id === imageId ||
    img.filename?.includes(imageId) ||
    img.id?.includes(imageId)
  );

  if (!target) {
    const available = images.map(img => `${img.filename} (${img.id})`).join(', ');
    return {
      result: formatToolResult('view_image',
        `Image "${imageId}" not found. Available images: ${available || 'none'}`),
      sources: [],
      error: 'Image not found'
    };
  }

  return {
    result: formatToolResult('view_image',
      `Image found:\n` +
      `- Filename: ${target.filename}\n` +
      `- URL: ${target.url}\n` +
      `- Uploaded: ${target.timestamp || 'unknown'}\n` +
      `- Size: ${target.size || 'unknown'}\n\n` +
      `You cannot view images directly. Use escalate_to_expert to have the expert model analyse this image.`),
    sources: [],
    error: null,
    // Extra field for the provider to use when building the escalation
    imageUrl: target.url,
    imageFilename: target.filename
  };
}
```

#### 6. `src/api/server.js` — Routing & Config Changes

**Pass `availableImages` to tool config** (after image processing, ~line 800):

```javascript
toolConfig.availableImages = availableImages;
```

**Auto-route vision requests** (before the chatCompletion call, ~line 1045):

```javascript
// Auto-route to Anthropic if images are present and provider is llama-server
// gpt-oss has no vision capability
if (llmProvider === 'llama-server') {
  const lastMsg = processedMessages[processedMessages.length - 1];
  const hasImages = Array.isArray(lastMsg?.content) &&
    lastMsg.content.some(b => b.type === 'image_url');

  if (hasImages) {
    console.log('🔄 Auto-routing to Anthropic: images detected, llama-server has no vision');
    llmProvider = 'anthropic';
    model = config.anthropic_expert_model || 'claude-sonnet-4-6';
    // Remove escalate_to_expert and view_image from tools for Anthropic
    enabledToolNames = enabledToolNames.filter(
      t => t !== 'escalate_to_expert' && t !== 'view_image'
    );
  }
}
```

**Pre-stream fallback** (wrap the chatCompletion call):

```javascript
// If llama-server fails before streaming starts, fall back to Anthropic
let llmResult;
try {
  llmResult = await chatCompletion({ ... });
} catch (llmError) {
  if (llmProvider === 'llama-server') {
    console.log('🔄 llama-server failed, falling back to Anthropic:', llmError.message);
    llmProvider = 'anthropic';
    model = config.anthropic_expert_model || 'claude-sonnet-4-6';
    enabledToolNames = enabledToolNames.filter(
      t => t !== 'escalate_to_expert' && t !== 'view_image'
    );
    // Re-get provider module and retry
    const fallbackModule = getProviderModule('anthropic');
    llmResult = await fallbackModule.chatCompletionStream({ ... });
  } else {
    throw llmError;  // Re-throw if already on Anthropic
  }
}
```

**Update credential validation** (~line 777):

```javascript
// Remove OpenAI and Ollama validation
// Add llama-server validation
if (llmProvider === 'llama-server' && !config.llama_server_url) {
  return res.status(400).json({
    error: 'llama-server selected but LLAMA_SERVER_URL not configured'
  });
}
```

**Read new config values** (~line 760):

```javascript
const llamaServerUrl = config.llama_server_url;
const anthropicExpertModel = config.anthropic_expert_model;
```

**Update MAX_TOOL_ITERATIONS default** (~line 1514):

```javascript
// Change from 5 to 15
const maxIterations = parseInt(process.env.MAX_TOOL_ITERATIONS || '15', 10);
```

**Track escalation in metrics** — when the result includes `escalated: true`, log both models used:

```javascript
// After chatCompletion returns, check for escalation
if (llmResult.escalated) {
  // Log both the local model and the escalated model for cost tracking
  // The usage object already has combined tokens from both
  modelUsed = `${model} → ${llmResult.escalated_model}`;
}
```

**Add escalation guidance to system prompt injection** (~line 828, alongside existing memory/sandbox injections):

```javascript
// Only add when provider is llama-server
if (llmProvider === 'llama-server') {
  const escalationNote = '\n\n[ESCALATION GUIDANCE]\n' +
    'You are a capable AI assistant running locally. For most tasks you can handle everything directly. ' +
    'You have access to an escalate_to_expert tool that hands complex tasks to a more powerful model. ' +
    'Before escalating, always gather relevant information first (web searches, file reads, etc.) ' +
    'so the expert has full context. Only escalate when truly necessary — simple tasks, lookups, ' +
    'and basic coding do not need escalation.\n' +
    'You CANNOT see images. If the user asks about an image, use view_image to retrieve it, ' +
    'then escalate_to_expert for analysis.\n' +
    '[/ESCALATION GUIDANCE]';

  const systemMsg = processedMessages.find(m => m.role === 'system');
  if (systemMsg) {
    systemMsg.content += escalationNote;
  } else {
    processedMessages.unshift({ role: 'system', content: escalationNote.trim() });
  }
}
```

### ComfyUI VRAM Coordination

ComfyUI and llama-server both need the RTX 3090. ComfyUI loads models on demand (~19-21GB VRAM), generates an image in ~45 seconds, then auto-unloads. llama-server sits at ~14.6GB permanently. They cannot coexist.

The coordination logic lives in **`src/tools/executor.js`** — where the `executeImageGeneration`, `executeImageEdit`, and `executeImageBlend` handlers call into `comfyui.js`. The wrapper goes here (not in `comfyui.js`) because `executor.js` has access to the full `config` object (including `LLAMA_SERVER_URL`), while `comfyui.js` is a pure HTTP client that only receives `comfyUrl` as a bare parameter.

#### New file: `src/utils/llama-manager.js` (~80 lines)

A small utility that manages llama-server lifecycle via HTTP:

```javascript
/**
 * LlamaServerManager - Controls llama-server lifecycle for VRAM coordination
 * 
 * llama-server runs as a systemd service. This manager stops/starts it
 * when other GPU workloads (ComfyUI) need exclusive VRAM access.
 */

class LlamaServerManager {
  constructor(config) {
    this.baseUrl = config.LLAMA_SERVER_URL || 'http://localhost:8080';
    this.restarting = false;
  }

  /**
   * Check if llama-server is running and responsive
   */
  async isHealthy() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { 
        signal: AbortSignal.timeout(2000) 
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Stop llama-server to free VRAM
   * Uses systemd via SSH/exec to the Proxmox host, or a control endpoint
   */
  async stop() {
    if (this.restarting) return;
    this.restarting = true;
    try {
      // Option A: If llama-server runs as a systemd service in the LXC
      // Execute: systemctl stop llama-server (via SSH or local exec)
      // Option B: If a control API exists on the LXC host
      // POST to a control endpoint that stops the service
      
      // Implementation depends on deployment — see notes below
      console.log('🔄 Stopping llama-server to free VRAM for ComfyUI...');
      
      // Wait for VRAM to be released (poll nvidia-smi or just wait)
      await this.waitForShutdown(10000); // 10 second timeout
    } catch (err) {
      console.error('Failed to stop llama-server:', err.message);
    }
  }

  /**
   * Restart llama-server after VRAM is free
   */
  async start() {
    try {
      console.log('🔄 Restarting llama-server...');
      // Same mechanism as stop() but start the service
      
      // Wait for it to become healthy
      await this.waitForHealthy(30000); // 30 second timeout (model loading)
      this.restarting = false;
    } catch (err) {
      console.error('Failed to restart llama-server:', err.message);
      this.restarting = false;
    }
  }

  async waitForShutdown(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!(await this.isHealthy())) return;
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('llama-server shutdown timeout');
  }

  async waitForHealthy(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.isHealthy()) return;
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('llama-server startup timeout');
  }
}

export default LlamaServerManager;
```

**Deployment mechanism**: The exact stop/start command depends on how llama-server is deployed. The recommended approach is a **systemd service inside the LXC** with a simple HTTP control API (a tiny Express server or shell script listening on a port) that accepts `/stop` and `/start` commands. Alternatively, the OWUI-Toolset server can SSH into the LXC to run `systemctl stop/start llama-server`. The spec leaves this flexible — the `LlamaServerManager` class encapsulates the mechanism.

#### Modify: `src/tools/executor.js` — VRAM coordination wrapper

Wrap the `executeImageGeneration`, `executeImageEdit`, and `executeImageBlend` calls with llama-server stop/start:

```javascript
import LlamaServerManager from '../utils/llama-manager.js';

// In executor.js, wrapping the three image handler functions:
async function executeWithVRAMCoordination(config, workflowFn) {
  const llamaManager = new LlamaServerManager(config);
  const wasRunning = await llamaManager.isHealthy();
  
  try {
    // 1. Stop llama-server if it's running
    if (wasRunning) {
      await llamaManager.stop();
    }
    
    // 2. Execute the ComfyUI workflow (loads model, generates, auto-unloads)
    const result = await workflowFn();
    
    // 3. Restart llama-server
    if (wasRunning) {
      // Don't await — restart in background so the response isn't delayed
      // The pre-stream fallback handles any requests that arrive before it's ready
      llamaManager.start().catch(err => 
        console.error('Background llama-server restart failed:', err.message)
      );
    }
    
    return result;
  } catch (err) {
    // Restart llama-server even if ComfyUI failed
    if (wasRunning) {
      llamaManager.start().catch(e => 
        console.error('Background llama-server restart failed:', e.message)
      );
    }
    throw err;
  }
}
```

**Important**: The restart is fire-and-forget (`llamaManager.start()` not awaited). This means:
- The image generation response returns to the user immediately
- llama-server restarts in the background (~5-10 seconds to load the model)
- Any LLM requests during this window hit the pre-stream fallback → Sonnet handles them
- Once llama-server is healthy again, new requests route back to local

**Concurrent request handling**: While llama-server is down for ComfyUI, the `isHealthy()` check in the pre-stream fallback (server.js) returns false, so requests automatically go to Sonnet. No special locking needed — the health check IS the lock.

### Files to DELETE

#### 7. `src/tools/providers/openai.js`

Remove entirely. All references in `index.js` and `server.js` should be cleaned up.

#### 8. `src/tools/providers/ollama.js`

Remove entirely. All references in `index.js` and `server.js` should be cleaned up.

---

## Configuration Changes

### `.env.example` Updates

```env
# Remove:
# OPENAI_API_KEY=sk-...

# Keep:
ANTHROPIC_API_KEY=sk-ant-...

# Add:
LLAMA_SERVER_URL=http://10.0.0.23:8080
```

### Default Valve Configuration

| Valve | Default | Notes |
|---|---|---|
| `TOOL_CALLING_LLM_PROVIDER` | `llama-server` | Primary for all requests |
| `TOOL_CALLING_LLM_MODEL` | `gpt-oss-20b` | Local model |
| `CONVERSATIONAL_LLM_PROVIDER` | `llama-server` | Same — tools always enabled |
| `CONVERSATIONAL_LLM_MODEL` | `gpt-oss-20b` | Local model |
| `COMPACTION_LLM_PROVIDER` | `llama-server` | Compaction is simple summarisation |
| `COMPACTION_LLM_MODEL` | `gpt-oss-20b` | Local model |
| `LLAMA_SERVER_URL` | `http://localhost:8080` | llama-server endpoint |
| `ANTHROPIC_API_KEY` | (required) | For escalation |
| `ANTHROPIC_EXPERT_MODEL` | `claude-sonnet-4-6` | Model used for escalation |

---

## Implementation Notes

### Message Format Conversion (Critical)

The `convertToAnthropicFormat(conversationMessages)` function in `llama-server.js` is the most important piece. It must handle:

1. **System message extraction**: Pull out the system message and pass it as the `system` parameter to Anthropic, not in the messages array.

2. **Consecutive same-role messages**: Anthropic requires strictly alternating user/assistant. If the conversation has consecutive user or assistant messages (which can happen with tool results), merge them.

3. **Tool call/result conversion**:
   - OpenAI `assistant` message with `tool_calls` array → Anthropic `assistant` with `tool_use` content blocks
   - OpenAI `tool` role messages → Anthropic `user` message with `tool_result` content blocks
   - Group multiple `tool` messages into a single `user` message

4. **Tool call ID mapping**: OpenAI uses `toolCall.id`, Anthropic uses `tool_use.id` / `tool_result.tool_use_id`. Copy the IDs directly — they're just strings.

5. **Image blocks**: If any message contains `image_url` blocks, convert to Anthropic's `image` content block format. The Anthropic provider already handles URL → base64 conversion for local URLs.

### Tool Availability by Provider

| Tool | llama-server | anthropic (escalated) |
|---|---|---|
| web_search | Yes | Yes |
| web_scrape | Yes | Yes |
| deep_research | Yes | Yes |
| sandbox_* | Yes | Yes |
| memory_* | Yes | Yes |
| date_time_* | Yes | Yes |
| image_generation | Yes | Yes |
| image_edit | Yes | Yes |
| image_blend | Yes | Yes |
| file_recall_search | Yes | Yes |
| **escalate_to_expert** | **Yes** | **No** |
| **view_image** | **Yes** | **No** |

### Error Handling

1. **llama-server connection refused**: Fall back to Anthropic (pre-stream fallback in server.js)
2. **llama-server error mid-stream**: Stream error message to user (existing behaviour). Cannot retry mid-stream.
3. **Escalation fails (Anthropic error)**: The error propagates back through the llama-server provider and streams as an error message. The user sees whatever gpt-oss already streamed plus the error.
4. **Both providers fail**: User sees error message (existing behaviour).

### Iteration Budget

With `MAX_TOOL_ITERATIONS=15`:

- Typical no-tool request: 1 iteration
- Simple web search: 2-3 iterations
- Web search + escalation: 4-6 iterations (2-3 local + 1 escalation + 1-2 Sonnet)
- Complex multi-tool: 8-12 iterations (3-5 local + 1 escalation + 3-5 Sonnet)
- The remaining budget after escalation is passed to Sonnet: `maxIterations - currentIteration`

### Streaming Continuity

The `onText`, `onToolCall`, `onSource`, and `onToolOutput` callbacks are closures over the Express `res` object in `server.js`. They don't know or care which provider is calling them. When gpt-oss escalates to Sonnet, Sonnet calls the same callbacks — the user sees a seamless continuation of the SSE stream.

### Cost Tracking

When escalation occurs, the usage tracking should record:

- `model_used`: `"gpt-oss-20b → claude-sonnet-4-6"` (indicates escalation happened)
- `prompt_tokens`: Combined local + API tokens
- `completion_tokens`: Combined local + API tokens
- The dashboard already shows per-model costs — escalated requests will show the combined model string

### Dependencies

**Keep in `package.json`**:

```json
"openai": "^6.27.0"
```

The `openai` npm package is used by both the new llama-server provider (OpenAI-compatible API via `baseURL` override) AND `src/file-recall/openai-sync.js` (vector store operations). Do NOT remove it even though `src/tools/providers/openai.js` is deleted.

**Remove from `package.json`**:

```json
"ollama": "^0.5.0"
```

Only the `ollama` package is removed. Also remove dead test scripts that reference deleted providers (`test:openai`, `test:ollama`, `test:native-openai`, `test:native-ollama`).

---

## Testing Checklist

After implementation, verify:

1. **Basic chat** (no tools): Request goes to llama-server, responds at ~175 TPS, no escalation
2. **Web search**: llama-server calls web_search, gets results, responds — no escalation
3. **Simple code**: llama-server writes a basic function without escalating
4. **Complex code**: llama-server gathers context, then escalates to Sonnet for complex implementation
5. **Image upload (current turn)**: Auto-routes to Anthropic (server-level check), Sonnet analyses image
6. **Image re-analysis (later turn)**: llama-server calls view_image, then escalates with image context
7. **llama-server down**: Falls back to Anthropic transparently
8. **Concurrent users**: Two users chatting simultaneously, both getting responses
9. **Tool chain**: llama-server does web_search → sandbox_read_file → escalate_to_expert → Sonnet does sandbox_execute
10. **Compaction**: Long conversation gets compacted using llama-server (local, free)
11. **Metrics**: Dashboard shows escalated requests with combined model string and accurate token counts
12. **Image generation**: ComfyUI tool works — llama-server stops, ComfyUI generates, llama-server restarts
13. **Image gen during chat**: Second user's LLM request during image generation falls back to Sonnet
14. **llama-server restart**: After ComfyUI finishes, llama-server comes back healthy and serves requests again

---

## Implementation Notes — Code Review Findings

The following issues were identified during a full review of the codebase against this spec. Items 1, 2, and 7 have been resolved in the main body above. The remaining items are additional fixes needed during implementation.

### ~~1. Escalation guidance goes in `server.js`, not `prompts.js`~~ (RESOLVED above — section 6 now has the correct code)

### ~~2. `openai` npm package must NOT be removed~~ (RESOLVED above — Dependencies section now clarifies this)

### 3. `calculateCost()` needs a llama-server path

The cost calculation function in `server.js` (lines 1402-1500) auto-detects provider from model name. `gpt-oss-20b` contains `gpt` and would be misclassified as `'openai'` with OpenAI pricing. Needs:
- A `llama-server` case that returns cost 0 (local model = free)
- Handling for the escalation combo string `"gpt-oss-20b → claude-sonnet-4-6"` — split on `→`, price the Anthropic portion only

### 4. `compactionConfig` references OpenAI/Ollama

At `server.js` lines 1748-1753, the compaction config builds `OPENAI_API_KEY` and `OLLAMA_BASE_URL`. Since compaction defaults to llama-server, this needs to include `LLAMA_SERVER_URL` instead. Must also retain `ANTHROPIC_API_KEY` in case the admin sets compaction provider to anthropic.

### 5. `DEFAULT_MODELS` constant needs updating

At `server.js` lines 34-37, the defaults are `{ openai: 'gpt-5.2', anthropic: 'claude-sonnet-4-5', ollama: 'llama3.1:8b' }`. Replace with `{ 'llama-server': 'gpt-oss-20b', anthropic: 'claude-sonnet-4-6' }`.

### 6. Test scripts in `package.json` reference deleted providers

Scripts like `test:openai`, `test:ollama`, `test:native-openai`, `test:native-ollama` will be broken after provider deletion. The `tests/` directory doesn't exist in the repo, so these are dead entries — remove them and keep only `test`, `test:anthropic`, `test:native-anthropic`, and `test:tools`.

### ~~7. VRAM coordination wrapper placement~~ (RESOLVED above — ComfyUI section and architecture diagram now reference `executor.js`)

### 8. Comment/docstring cleanup in `server.js`

Lines 1-8 reference "OpenAI: GPT-5, GPT-5.1, GPT-5.2" and "Ollama (local models via Chat API)" in the file header. Line 370 same. These need updating to reflect the new two-provider architecture.

---

## Out of Scope (Future)

- **Systemd service for llama-server**: Auto-start on boot, auto-restart on crash. Currently assumed to be running manually or via a basic systemd unit — a production-hardened service definition with proper dependencies and logging is a follow-up task.
