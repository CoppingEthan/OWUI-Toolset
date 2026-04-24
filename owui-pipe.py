"""
OWUI Toolset V2 - Pipeline Function

Forwards Open WebUI chat requests to the external OWUI Toolset V2 server
with streaming SSE support.

Configure via the Valves below. One model handles every chat (tool-using
or not); a separate, usually cheaper model handles background
conversation compaction.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Callable, Awaitable, Literal
import httpx
import json
import time


class Pipe:
    class Valves(BaseModel):
        # Toolset server --------------------------------------------------
        TOOLSET_API_URL: str = Field(
            default="http://localhost:3000",
            description="Base URL of the OWUI Toolset V2 server",
        )
        TOOLSET_API_KEY: str = Field(
            default="",
            description="Bearer token matching API_SECRET_KEY on the toolset server",
        )

        # Chat model (one model for everything — tools are enabled per request) -
        LLM_PROVIDER: Literal["anthropic", "openai"] = Field(
            default="anthropic",
            description="Chat LLM provider",
        )
        LLM_MODEL: str = Field(
            default="claude-sonnet-4-6",
            description="Any model ID for the selected provider (e.g. claude-sonnet-4-6, gpt-5.2)",
        )

        # Compaction model (runs in background when conversations get long) ---
        COMPACTION_PROVIDER: Literal["anthropic", "openai"] = Field(
            default="anthropic",
            description="Provider used for conversation compaction",
        )
        COMPACTION_MODEL: str = Field(
            default="claude-haiku-4-5",
            description="Cheaper/faster model for compaction (e.g. claude-haiku-4-5, gpt-5)",
        )
        ENABLE_COMPACTION: bool = Field(
            default=True,
            description="Enable automatic summarisation of long conversations",
        )

        # Provider credentials --------------------------------------------
        ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API key")
        OPENAI_API_KEY: str = Field(default="", description="OpenAI API key")

        # External tool services ------------------------------------------
        TAVILY_API_KEY: str = Field(default="", description="Tavily API key (web search / scrape / research)")
        DOCLING_BASE_URL: str = Field(default="", description="Docling server URL (PDF/DOCX extraction)")
        COMFYUI_BASE_URL: str = Field(default="", description="ComfyUI server URL (e.g. http://10.0.0.25:8188)")

        # System prompt add-on --------------------------------------------
        CUSTOM_SYSTEM_PROMPT: str = Field(default="", description="Prepended to the system prompt for this instance")

        # Tool toggles — Tavily-backed ------------------------------------
        ENABLE_WEB_SEARCH: bool = Field(default=True, description="Enable web search")
        ENABLE_WEB_SCRAPE: bool = Field(default=True, description="Enable web scraping")
        ENABLE_DEEP_RESEARCH: bool = Field(default=True, description="Enable deep research (multi-source synthesis + PDF)")

        # Tool toggles — sandboxed code execution -------------------------
        ENABLE_SANDBOX: bool = Field(default=True, description="Enable sandboxed code execution")

        # Tool toggles — ComfyUI image tools ------------------------------
        ENABLE_IMAGE_GENERATION: bool = Field(default=True, description="Enable AI image generation")
        ENABLE_IMAGE_EDIT: bool = Field(default=True, description="Enable AI image editing")
        ENABLE_IMAGE_BLEND: bool = Field(default=True, description="Enable AI image blending")

        # Tool toggles — persistent memory / time -------------------------
        ENABLE_MEMORY: bool = Field(default=True, description="Enable per-user memory tools")
        ENABLE_DATE_TIME: bool = Field(default=True, description="Enable current-time and date-difference tools")

        # Tool toggles — File Recall (OpenAI vector store) ----------------
        ENABLE_FILE_RECALL: bool = Field(default=False, description="Enable file recall over the document library")
        FILE_RECALL_INSTANCE_ID: str = Field(default="", description="File Recall instance ID for this client")

    def __init__(self):
        self.valves = self.Valves()
        # Emit citations ourselves via SSE source events.
        self.citation = False

    def pipes(self) -> List[Dict[str, str]]:
        return [{"id": "owui-toolset-v2", "name": "OWUI Toolset V2"}]

    def _any_tools_enabled(self) -> bool:
        v = self.valves
        has_web = bool(v.TAVILY_API_KEY) and (v.ENABLE_WEB_SEARCH or v.ENABLE_WEB_SCRAPE or v.ENABLE_DEEP_RESEARCH)
        has_img = bool(v.COMFYUI_BASE_URL) and (v.ENABLE_IMAGE_GENERATION or v.ENABLE_IMAGE_EDIT or v.ENABLE_IMAGE_BLEND)
        has_fr = v.ENABLE_FILE_RECALL and bool(v.FILE_RECALL_INSTANCE_ID)
        return has_web or has_img or v.ENABLE_SANDBOX or v.ENABLE_MEMORY or v.ENABLE_DATE_TIME or has_fr

    async def pipe(
        self,
        body: dict,
        __user__: dict,
        __metadata__: dict = None,
        __files__: List[dict] = None,
        __chat_id__: str = None,
        __event_emitter__: Callable[[dict], Awaitable[None]] = None,
    ) -> str:
        v = self.valves
        if not v.TOOLSET_API_URL:
            return "Error: TOOLSET_API_URL not configured"
        if not v.TOOLSET_API_KEY:
            return "Error: TOOLSET_API_KEY not configured"

        payload = {
            **body,
            "conversation_id": __chat_id__ or (__metadata__ or {}).get("chat_id", "unknown"),
            "user_email": __user__.get("email", "unknown") if __user__ else "unknown",
            "owui_instance": (__metadata__ or {}).get("interface", "open-webui"),
            "files": __files__ or [],
            "config": {
                "llm_provider": v.LLM_PROVIDER,
                "llm_model": v.LLM_MODEL,
                "use_tools": self._any_tools_enabled(),
                "anthropic_api_key": v.ANTHROPIC_API_KEY,
                "openai_api_key": v.OPENAI_API_KEY,
                "tavily_api_key": v.TAVILY_API_KEY,
                "docling_base_url": v.DOCLING_BASE_URL,
                "comfyui_base_url": v.COMFYUI_BASE_URL,
                "toolset_api_url": v.TOOLSET_API_URL,
                "custom_system_prompt": v.CUSTOM_SYSTEM_PROMPT,
                "compaction_provider": v.COMPACTION_PROVIDER,
                "compaction_model": v.COMPACTION_MODEL,
                "enable_compaction": v.ENABLE_COMPACTION,
                "file_recall_instance_id": v.FILE_RECALL_INSTANCE_ID,
                "tools": {
                    "web_search": v.ENABLE_WEB_SEARCH,
                    "web_scrape": v.ENABLE_WEB_SCRAPE,
                    "deep_research": v.ENABLE_DEEP_RESEARCH,
                    "sandbox": v.ENABLE_SANDBOX,
                    "image_generation": v.ENABLE_IMAGE_GENERATION,
                    "image_edit": v.ENABLE_IMAGE_EDIT,
                    "image_blend": v.ENABLE_IMAGE_BLEND,
                    "memory": v.ENABLE_MEMORY,
                    "date_time": v.ENABLE_DATE_TIME,
                    "file_recall": v.ENABLE_FILE_RECALL,
                },
            },
        }

        try:
            timeout = httpx.Timeout(connect=30.0, read=600.0, write=60.0, pool=30.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream(
                    "POST",
                    f"{v.TOOLSET_API_URL}/api/v1/chat",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {v.TOOLSET_API_KEY}",
                        "Content-Type": "application/json",
                    },
                ) as response:
                    response.raise_for_status()
                    current_event = None

                    # Batch token emissions to avoid one __event_emitter__ call
                    # per token. Accumulate and flush every ~50ms.
                    token_buffer = ""
                    last_flush = time.monotonic()
                    FLUSH_INTERVAL = 0.05

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

                    await flush_buffer()
            return ""
        except httpx.TimeoutException:
            return "Error: Request timed out"
        except httpx.ConnectError:
            return f"Error: Could not connect to {v.TOOLSET_API_URL}"
        except httpx.HTTPStatusError as e:
            return f"Error: HTTP {e.response.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"
