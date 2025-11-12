"""
title: Request Logger Filter
author: OWUI Toolset
version: 1.0.0
description: Logs all OWUI requests and responses to a Node.js API backend
"""

from pydantic import BaseModel, Field
from typing import Optional, Callable, Any, Awaitable
import aiohttp
import json
import base64
import time
from datetime import datetime

class Filter:
    class Valves(BaseModel):
        priority: int = Field(
            default=0,
            description="Priority level for the filter operations."
        )
        api_url: str = Field(
            default="http://localhost:3001",
            description="URL of the Node.js logging API server"
        )
        owui_base_url: str = Field(
            default="http://localhost:8080",
            description="Base URL of Open WebUI (for downloading files)"
        )
        enabled: bool = Field(
            default=True,
            description="Enable or disable request logging"
        )
        log_request: bool = Field(
            default=True,
            description="Log incoming requests (inlet)"
        )
        log_response: bool = Field(
            default=True,
            description="Log outgoing responses (outlet)"
        )
        capture_files: bool = Field(
            default=True,
            description="Capture and save uploaded files/images"
        )
        debug: bool = Field(
            default=False,
            description="Enable debug logging to console"
        )

    def __init__(self):
        self.name = "Request Logger Filter"
        self.valves = self.Valves()
        self.request_start_time = None
        self.request_data = {}

    def _log(self, message: str):
        """Internal logging helper"""
        if self.valves.debug:
            print(f"[RequestLogger] {message}")

    def _extract_message_content(self, messages: list) -> str:
        """Extract the last user message content"""
        if not messages:
            return ""
        
        # Get last user message
        for msg in reversed(messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                
                # Handle string content
                if isinstance(content, str):
                    return content
                
                # Handle array content (multimodal messages)
                if isinstance(content, list):
                    text_parts = []
                    for part in content:
                        if isinstance(part, dict) and part.get("type") == "text":
                            text_parts.append(part.get("text", ""))
                    return " ".join(text_parts)
        
        return ""

    def _extract_files_from_messages(self, messages: list) -> list:
        """Extract file/image references from messages.

        Supports:
        - image_url with data: URIs
        - generic file parts with base64 content
        - OWUI-style attachments if present in message metadata
        """
        files = []

        for msg in messages:
            content = msg.get("content", [])

            # 1) Handle array content (multimodal)
            if isinstance(content, list):
                for part in content:
                    if not isinstance(part, dict):
                        continue

                    ptype = part.get("type")

                    # Image content via data URI
                    if ptype == "image_url":
                        image_url = part.get("image_url", {})
                        url = image_url.get("url", "") if isinstance(image_url, dict) else image_url

                        if isinstance(url, str) and url.startswith("data:"):
                            try:
                                header, data = url.split(",", 1)
                                mime_type = header.split(";")[0].split(":")[1]
                                ext = mime_type.split("/")[-1] or "bin"
                                files.append({
                                    "type": "image",
                                    "mime_type": mime_type,
                                    "content": data,
                                    "filename": f"image_{len(files)}.{ext}"
                                })
                            except Exception as e:
                                self._log(f"Error parsing image data: {e}")

                    # Generic file blobs (if OWUI or tools embed them)
                    elif ptype in ("file", "uploaded_file", "attachment"):
                        # Expecting either raw base64 content or data URI
                        raw = part.get("content") or part.get("data") or ""
                        filename = part.get("filename") or part.get("name") or f"file_{len(files)}"

                        if isinstance(raw, str) and raw.startswith("data:"):
                            try:
                                header, data = raw.split(",", 1)
                                mime_type = header.split(";")[0].split(":")[1]
                                ext = mime_type.split("/")[-1] or "bin"
                                if not filename.endswith(ext):
                                    filename = f"{filename}.{ext}"
                                files.append({
                                    "type": "file",
                                    "mime_type": mime_type,
                                    "content": data,
                                    "filename": filename,
                                })
                                continue
                            except Exception as e:
                                self._log(f"Error parsing file data URI: {e}")

                        # Assume already base64 if it's a non-empty string
                        if isinstance(raw, str) and raw:
                            files.append({
                                "type": "file",
                                "content": raw,
                                "filename": filename,
                            })

            # 2) Optionally: handle top-level attachments metadata if OWUI adds such fields
            # If your OWUI payload includes something like msg.get("attachments"),
            # we can extend here in the future.

        return files

    def _read_file_from_disk(self, file_path: str) -> Optional[str]:
        """Read file from OWUI uploads directory and return as base64"""
        try:
            # OWUI stores files at the path provided in the file metadata
            # This is usually /app/backend/data/uploads/... inside the container
            # or a local path if running directly
            import os
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    content_bytes = f.read()
                    encoded = base64.b64encode(content_bytes).decode('utf-8')
                    self._log(f"Read {len(content_bytes)} bytes from disk: {file_path}")
                    return encoded
            else:
                self._log(f"File not found on disk: {file_path}")
                return None
        except Exception as e:
            self._log(f"Error reading file from disk {file_path}: {str(e)}")
            return None

    async def _download_file_content(self, file_id: str, file_url: str, session: aiohttp.ClientSession) -> Optional[str]:
        """Download file content from OWUI and return as base64"""
        try:
            # Construct full URL using the configured OWUI base URL
            url = f"{self.valves.owui_base_url}{file_url}/content"
            self._log(f"Downloading file from: {url}")
            
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
                if response.status == 200:
                    content_bytes = await response.read()
                    encoded = base64.b64encode(content_bytes).decode('utf-8')
                    self._log(f"Successfully downloaded {len(content_bytes)} bytes")
                    return encoded
                else:
                    self._log(f"File download failed with status {response.status}")
                    return None
        except Exception as e:
            self._log(f"Error downloading file {file_id}: {str(e)}")
            return None

    async def _send_to_api(self, data: dict):
        """Send log data to the Node.js API"""
        if not self.valves.enabled:
            return
        
        try:
            timeout = aiohttp.ClientTimeout(total=30)  # Increased timeout for file downloads
            async with aiohttp.ClientSession(timeout=timeout) as session:
                # Get file contents if present
                files = data.get('files', [])
                if files and self.valves.capture_files:
                    for file_data in files:
                        # Check if file has no content yet
                        if not file_data.get('content'):
                            filename = file_data.get('filename', 'unknown')
                            
                            # Try 1: Read from disk if we have the path
                            file_path = file_data.get('path')
                            if file_path:
                                self._log(f"Attempting to read file from disk: {file_path}")
                                content = self._read_file_from_disk(file_path)
                                if content:
                                    file_data['content'] = content
                                    self._log(f"Successfully read {len(content)} bytes (base64) from disk")
                                    continue
                            
                            # Try 2: Download from OWUI API
                            file_id = file_data.get('id')
                            file_url = file_data.get('url')
                            if file_id and file_url:
                                self._log(f"Attempting to download file via API: {filename}")
                                content = await self._download_file_content(file_id, file_url, session)
                                if content:
                                    file_data['content'] = content
                                    self._log(f"Successfully downloaded {len(content)} bytes (base64)")
                                    continue
                            
                            self._log(f"Could not get content for file: {filename}")
                
                # Send to API
                async with session.post(
                    f"{self.valves.api_url}/api/log",
                    json=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        self._log(f"Log saved successfully: {result.get('logId')}")
                    else:
                        error_text = await response.text()
                        self._log(f"Error saving log: {response.status} - {error_text}")
        except Exception as e:
            self._log(f"Exception sending to API: {str(e)}")

    async def inlet(
        self,
        body: dict,
        __user__: Optional[dict] = None,
        __event_emitter__: Optional[Callable[[Any], Awaitable[None]]] = None,
        __files__: Optional[list] = None
    ) -> dict:
        """Capture incoming request data"""
        
        if not self.valves.enabled or not self.valves.log_request:
            return body
        
        self.request_start_time = time.time()
        
        # Extract user information
        username = "anonymous"
        user_info = {}
        
        if __user__:
            username = __user__.get("name", __user__.get("email", __user__.get("id", "anonymous")))
            user_info = {
                "id": __user__.get("id"),
                "name": __user__.get("name"),
                "email": __user__.get("email"),
                "role": __user__.get("role")
            }
        
        # Extract message content
        messages = body.get("messages", [])
        last_message = self._extract_message_content(messages)
        
        # Debug: Log structure
        if self.valves.debug:
            self._log(f"Body keys: {list(body.keys())}")
            self._log(f"__files__ provided: {__files__ is not None}, count: {len(__files__) if __files__ else 0}")
            if messages and len(messages) > 0:
                last_msg = messages[-1]
                self._log(f"Last message type: {type(last_msg.get('content'))}, keys: {list(last_msg.keys()) if isinstance(last_msg, dict) else 'N/A'}")
        
        # Extract files if enabled
        files = []
        if self.valves.capture_files:
            # First priority: Use __files__ parameter (OWUI's proper way)
            if __files__:
                if not isinstance(__files__, list):
                    self._log(f"Warning: __files__ is not a list, type: {type(__files__)}")
                else:
                    self._log(f"Found {len(__files__)} file(s) via __files__ parameter")
                    for idx, file_data in enumerate(__files__):
                        if not isinstance(file_data, dict):
                            self._log(f"Warning: __files__[{idx}] is not a dict, type: {type(file_data)}, value: {str(file_data)[:100]}")
                            continue
                        
                        # OWUI file structure from __files__
                        try:
                            normalized_file = {
                                "type": "file",
                                "filename": file_data.get('filename') or file_data.get('name', 'unknown'),
                                "mime_type": file_data.get('type') or file_data.get('content_type', 'application/octet-stream'),
                                "size": file_data.get('size', 0),
                                "id": file_data.get('id'),
                                "url": file_data.get('url'),
                                "path": file_data.get('path')
                            }
                            files.append(normalized_file)
                            self._log(f"Added file from __files__: {normalized_file['filename']} (ID: {normalized_file.get('id')})")
                        except Exception as e:
                            self._log(f"Error processing __files__[{idx}]: {str(e)}")
            
            # Fallback: Check messages for embedded files
            if not files:
                files = self._extract_files_from_messages(messages)
            
            # Fallback: Check body level
            if not files:
                body_files = body.get("files")
                if body_files and isinstance(body_files, list):
                    self._log(f"Found {len(body_files)} file(s) at body level")
                    for file_data in body_files:
                        if isinstance(file_data, dict):
                            normalized_file = {
                                "type": "file",
                                "filename": file_data.get('name') or file_data.get('file', {}).get('filename', 'unknown'),
                                "mime_type": file_data.get('file', {}).get('meta', {}).get('content_type', 'application/octet-stream'),
                                "size": file_data.get('size', 0),
                                "id": file_data.get('id'),
                                "url": file_data.get('url'),
                                "path": file_data.get('file', {}).get('path')
                            }
                            files.append(normalized_file)
                            self._log(f"Added file from body: {normalized_file['filename']} (ID: {normalized_file['id']})")
        
        # Create request-only log entry
        request_log = {
            "type": "request",  # Mark as request
            "username": username,
            "user_info": user_info,
            "timestamp": datetime.utcnow().isoformat(),
            "request": {
                "model": body.get("model"),
                "messages": messages,
                "chat_id": body.get("chat_id"),
                "stream": body.get("stream"),
                "temperature": body.get("temperature"),
                "max_tokens": body.get("max_tokens"),
                "message_count": len(messages),
                "last_message": last_message
            },
            "metadata": {
                "model": body.get("model", "unknown"),
                "lastMessage": last_message,
                "user": user_info,
                "timestamp": datetime.utcnow().isoformat(),
                "logType": "request"
            },
            "files": files
        }
        
        # Send request log immediately
        await self._send_to_api(request_log)
        
        # Store data for outlet response
        self.request_data = {
            "username": username,
            "user_info": user_info,
            "model": body.get("model"),
            "chat_id": body.get("chat_id"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self._log(f"Inlet captured: user={username}, model={body.get('model')}")
        
        return body

    async def outlet(
        self,
        body: dict,
        __user__: Optional[dict] = None,
        __event_emitter__: Optional[Callable[[Any], Awaitable[None]]] = None
    ) -> dict:
        """Capture outgoing response data and send to API"""
        
        if not self.valves.enabled or not self.valves.log_response:
            return body
        
        end_time = time.time()
        response_time = end_time - self.request_start_time if self.request_start_time else 0
        
        # Extract response messages
        messages = body.get("messages", [])
        
        # Get last assistant message
        assistant_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "assistant":
                content = msg.get("content", "")
                if isinstance(content, str):
                    assistant_message = content
                break
        
        # Prepare response-only log entry
        response_log = {
            "type": "response",  # Mark as response
            "username": self.request_data.get("username", "anonymous"),
            "user_info": self.request_data.get("user_info", {}),
            "timestamp": datetime.utcnow().isoformat(),
            "response": {
                "messages": messages,
                "message_count": len(messages),
                "last_assistant_message": assistant_message,
                "response_time_seconds": response_time
            },
            "metadata": {
                "model": self.request_data.get("model", "unknown"),
                "responseTime": response_time,
                "responseLength": len(assistant_message),
                "logType": "response",
                "timestamp": datetime.utcnow().isoformat(),
                "chatId": self.request_data.get("chat_id")
            }
        }
        
        # Send response log to API
        await self._send_to_api(response_log)
        
        self._log(f"Outlet captured: response_time={response_time:.2f}s")
        
        return body
