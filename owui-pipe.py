"""
OWUI Toolset V2 - Pipeline Function
Forwards requests to the OWUI Toolset V2 server with streaming support.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Callable, Awaitable, Literal
import httpx
import json
import time


class Pipe:
    """OWUI Toolset V2 Pipeline - forwards requests to external toolset server."""

    class Valves(BaseModel):
        # Server
        TOOLSET_API_URL: str = Field(
            default="http://localhost:3000",
            description="URL of the OWUI Toolset V2 server",
        )
        TOOLSET_API_KEY: str = Field(
            default="",
            description="API key for authenticating with the toolset server",
        )

        # Tool Calling LLM (for requests that may use tools)
        TOOL_CALLING_LLM_PROVIDER: Literal["anthropic", "openai", "ollama"] = Field(
            default="anthropic",
            description="Provider for tool-calling requests",
        )
        TOOL_CALLING_LLM_MODEL: str = Field(
            default="claude-sonnet-4-5",
            description="Any model name for the selected provider (e.g. claude-sonnet-4-5, gpt-5.2, llama3.1:8b)",
        )

        # Conversational LLM (for simple chat without tools)
        CONVERSATIONAL_LLM_PROVIDER: Literal["anthropic", "openai", "ollama"] = Field(
            default="openai",
            description="Provider for simple chat (no tools)",
        )
        CONVERSATIONAL_LLM_MODEL: str = Field(
            default="gpt-5.2",
            description="Any model name for the selected provider (e.g. gpt-5.2, claude-haiku-4-5, llama3.1:8b)",
        )

        # Compaction LLM (for summarizing long conversations)
        COMPACTION_LLM_PROVIDER: Literal["anthropic", "openai", "ollama"] = Field(
            default="anthropic",
            description="Provider for conversation compaction (use a fast, cheap model)",
        )
        COMPACTION_LLM_MODEL: str = Field(
            default="claude-haiku-4-5",
            description="Model for compaction (e.g. claude-haiku-4-5, gpt-5, llama3.1:8b)",
        )
        ENABLE_COMPACTION: bool = Field(
            default=True,
            description="Enable automatic conversation compaction for long sessions",
        )

        # API Keys
        ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API key")
        OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")
        OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama base URL")
        TAVILY_API_KEY: str = Field(default="", description="Tavily API key for tools")

        # External Services
        DOCLING_BASE_URL: str = Field(default="http://localhost:5001", description="Docling server URL")
        COMFYUI_BASE_URL: str = Field(default="", description="ComfyUI server URL (e.g. http://10.0.0.25:8188)")

        # Custom System Prompt
        CUSTOM_SYSTEM_PROMPT: str = Field(default="", description="Additional system prompt (optional)")

        # Tool Toggles - Web Tools (require Tavily API key)
        ENABLE_WEB_SEARCH: bool = Field(default=True, description="Enable web search")
        ENABLE_WEB_SCRAPE: bool = Field(default=True, description="Enable web scraping")
        ENABLE_DEEP_RESEARCH: bool = Field(default=True, description="Enable deep research")
        ENABLE_SANDBOX: bool = Field(default=True, description="Enable sandboxed code execution")

        # Tool Toggles - Image Tools (require ComfyUI)
        ENABLE_IMAGE_GENERATION: bool = Field(default=True, description="Enable AI image generation")
        ENABLE_IMAGE_EDIT: bool = Field(default=True, description="Enable AI image editing")
        ENABLE_IMAGE_BLEND: bool = Field(default=True, description="Enable AI image blending")

        # Tool Toggles - Memory Tools (local, no external service needed)
        ENABLE_MEMORY: bool = Field(default=True, description="Enable user memory (LLM remembers facts about users across conversations)")

        # Tool Toggles - Date/Time Tools (local, no external service needed)
        ENABLE_DATE_TIME: bool = Field(default=True, description="Enable date/time tools (current time, date differences/calculations)")

        # Tool Toggles - File Recall (requires OpenAI vector store per instance)
        ENABLE_FILE_RECALL: bool = Field(default=False, description="Enable file recall (search internal documents via OpenAI vector store)")
        FILE_RECALL_INSTANCE_ID: str = Field(default="", description="Instance ID for file recall - isolates document libraries between clients")

    def __init__(self):
        self.valves = self.Valves()
        # Disable automatic citations - we emit custom citations via events
        self.citation = False

    def pipes(self) -> List[Dict[str, str]]:
        return [{"id": "owui-toolset-v2", "name": "OWUI Toolset V2"}]

    def _has_tools_enabled(self) -> bool:
        # Web tools require Tavily API key
        has_web_tools = (
            self.valves.TAVILY_API_KEY and (
                self.valves.ENABLE_WEB_SEARCH or
                self.valves.ENABLE_WEB_SCRAPE or
                self.valves.ENABLE_DEEP_RESEARCH
            )
        )
        # Image tools require ComfyUI URL
        has_image_tools = (
            self.valves.COMFYUI_BASE_URL and (
                self.valves.ENABLE_IMAGE_GENERATION or
                self.valves.ENABLE_IMAGE_EDIT or
                self.valves.ENABLE_IMAGE_BLEND
            )
        )
        has_file_recall = self.valves.FILE_RECALL_INSTANCE_ID and self.valves.ENABLE_FILE_RECALL
        return has_web_tools or has_image_tools or self.valves.ENABLE_SANDBOX or self.valves.ENABLE_MEMORY or self.valves.ENABLE_DATE_TIME or has_file_recall

    async def pipe(
        self,
        body: dict,
        __user__: dict,
        __metadata__: dict = None,
        __files__: List[dict] = None,
        __chat_id__: str = None,
        __event_emitter__: Callable[[dict], Awaitable[None]] = None,
    ) -> str:
        if not self.valves.TOOLSET_API_URL:
            return "Error: TOOLSET_API_URL not configured"
        if not self.valves.TOOLSET_API_KEY:
            return "Error: TOOLSET_API_KEY not configured"

        # Select LLM based on tools availability
        use_tools = self._has_tools_enabled()
        provider = self.valves.TOOL_CALLING_LLM_PROVIDER if use_tools else self.valves.CONVERSATIONAL_LLM_PROVIDER
        model = self.valves.TOOL_CALLING_LLM_MODEL if use_tools else self.valves.CONVERSATIONAL_LLM_MODEL

        payload = {
            **body,
            "conversation_id": __chat_id__ or (__metadata__ or {}).get("chat_id", "unknown"),
            "user_email": __user__.get("email", "unknown") if __user__ else "unknown",
            "owui_instance": (__metadata__ or {}).get("interface", "open-webui"),
            "files": __files__ or [],
            "config": {
                "llm_provider": provider,
                "llm_model": model,
                "use_tools": use_tools,
                "anthropic_api_key": self.valves.ANTHROPIC_API_KEY,
                "openai_api_key": self.valves.OPENAI_API_KEY,
                "ollama_base_url": self.valves.OLLAMA_BASE_URL,
                "tavily_api_key": self.valves.TAVILY_API_KEY,
                "docling_base_url": self.valves.DOCLING_BASE_URL,
                "comfyui_base_url": self.valves.COMFYUI_BASE_URL,
                "toolset_api_url": self.valves.TOOLSET_API_URL,
                "custom_system_prompt": self.valves.CUSTOM_SYSTEM_PROMPT,
                "compaction_provider": self.valves.COMPACTION_LLM_PROVIDER,
                "compaction_model": self.valves.COMPACTION_LLM_MODEL,
                "enable_compaction": self.valves.ENABLE_COMPACTION,
                "file_recall_instance_id": self.valves.FILE_RECALL_INSTANCE_ID,
                "tools": {
                    "web_search": self.valves.ENABLE_WEB_SEARCH,
                    "web_scrape": self.valves.ENABLE_WEB_SCRAPE,
                    "deep_research": self.valves.ENABLE_DEEP_RESEARCH,
                    "sandbox": self.valves.ENABLE_SANDBOX,
                    "image_generation": self.valves.ENABLE_IMAGE_GENERATION,
                    "image_edit": self.valves.ENABLE_IMAGE_EDIT,
                    "image_blend": self.valves.ENABLE_IMAGE_BLEND,
                    "memory": self.valves.ENABLE_MEMORY,
                    "date_time": self.valves.ENABLE_DATE_TIME,
                    "file_recall": self.valves.ENABLE_FILE_RECALL,
                },
            },
        }

        try:
            timeout = httpx.Timeout(connect=30.0, read=600.0, write=60.0, pool=30.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.valves.TOOLSET_API_URL}/api/v1/chat",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.valves.TOOLSET_API_KEY}",
                        "Content-Type": "application/json",
                    },
                ) as response:
                    response.raise_for_status()
                    current_event = None

                    # Batch token emissions to reduce event emitter overhead
                    # Instead of awaiting __event_emitter__ for every token (~7000 calls),
                    # accumulate text and flush periodically (~50 calls)
                    token_buffer = ""
                    last_flush = time.monotonic()
                    FLUSH_INTERVAL = 0.05  # Flush every 50ms

                    async def flush_buffer():
                        nonlocal token_buffer, last_flush
                        if token_buffer and __event_emitter__:
                            await __event_emitter__({"type": "message", "data": {"content": token_buffer}})
                            token_buffer = ""
                            last_flush = time.monotonic()

                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith('event: '):
                            current_event = line[7:].strip()
                            continue
                        if line.startswith('data: '):
                            data_str = line[6:]
                            if data_str == '[DONE]':
                                await flush_buffer()
                                break
                            try:
                                data = json.loads(data_str)
                                if current_event == 'status' and __event_emitter__:
                                    await flush_buffer()
                                    await __event_emitter__({"type": "status", "data": data.get('data', {})})
                                elif current_event == 'source' and __event_emitter__:
                                    await flush_buffer()
                                    await __event_emitter__({"type": "citation", "data": data.get('data', {})})
                                elif data.get('choices') and __event_emitter__:
                                    content = data['choices'][0].get('delta', {}).get('content', '')
                                    if content:
                                        token_buffer += content
                                        if time.monotonic() - last_flush >= FLUSH_INTERVAL:
                                            await flush_buffer()
                                current_event = None
                            except json.JSONDecodeError:
                                current_event = None

                    # Final flush in case stream ended without [DONE]
                    await flush_buffer()
            return ""
        except httpx.TimeoutException:
            return "Error: Request timed out"
        except httpx.ConnectError:
            return f"Error: Could not connect to {self.valves.TOOLSET_API_URL}"
        except httpx.HTTPStatusError as e:
            return f"Error: HTTP {e.response.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"
