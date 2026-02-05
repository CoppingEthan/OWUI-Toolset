# OpenWebUI Documentation - Local Copy

## Overview

This directory contains a complete local copy of the OpenWebUI documentation from https://docs.openwebui.com/

**Downloaded on:** 1768218328.691999
**Total files:** 194 markdown files

## Source

All documentation is scraped from the official OpenWebUI documentation site:
- **URL:** https://docs.openwebui.com/
- **Method:** Automated web scraping with `scrape_owui_docs.py`
- **Format:** Converted from HTML to Markdown

## Directory Structure

```
docs/owui/
├── category
│   ├── -tutorials.md
│   ├── create--edit-images.md
│   ├── development.md
│   ├── federated-authentication.md
│   ├── https.md
│   ├── integrations.md
│   ├── interface.md
│   ├── maintenance.md
│   ├── speech-to-text--text-to-speech.md
│   ├── speech-to-text.md
│   ├── text-to-speech.md
│   ├── tips--tricks.md
│   └── web-search.md
├── enterprise
│   ├── customers
│   │   └── samsung-semiconductor.md
│   ├── architecture.md
│   ├── customers.md
│   ├── customization.md
│   ├── integration.md
│   ├── partners.md
│   ├── security.md
│   └── support.md
├── features
│   ├── audio
│   │   ├── speech-to-text
│   │   │   ├── env-variables.md
│   │   │   ├── mistral-voxtral-integration.md
│   │   │   ├── openai-stt-integration.md
│   │   │   └── stt-config.md
│   │   └── text-to-speech
│   │       ├── Kokoro-FastAPI-integration.md
│   │       ├── chatterbox-tts-api-integration.md
│   │       ├── kokoro-web-integration.md
│   │       ├── openai-edge-tts-integration.md
│   │       ├── openai-tts-integration.md
│   │       └── openedai-speech-integration.md
│   ├── auth
│   │   ├── sso
│   │   │   └── keycloak.md
│   │   ├── ldap.md
│   │   ├── scim.md
│   │   └── sso.md
│   ├── chat-features
│   │   ├── code-execution
│   │   │   ├── artifacts.md
│   │   │   ├── mermaid.md
│   │   │   └── python.md
│   │   ├── autocomplete.md
│   │   ├── chat-params.md
│   │   ├── chatshare.md
│   │   ├── code-execution.md
│   │   ├── conversation-organization.md
│   │   ├── history-search.md
│   │   ├── multi-model-chats.md
│   │   ├── reasoning-models.md
│   │   ├── temporal-awareness.md
│   │   └── url-params.md
│   ├── experimental
│   │   └── direct-connections.md
│   ├── image-generation-and-editing
│   │   ├── automatic1111.md
│   │   ├── comfyui.md
│   │   ├── gemini.md
│   │   ├── image-router.md
│   │   ├── openai.md
│   │   └── usage.md
│   ├── interface
│   │   ├── banners.md
│   │   └── webhooks.md
│   ├── pipelines
│   │   ├── filters.md
│   │   ├── pipes.md
│   │   ├── tutorials.md
│   │   └── valves.md
│   ├── plugin
│   │   ├── development
│   │   │   ├── events.md
│   │   │   ├── reserved-args.md
│   │   │   └── valves.md
│   │   ├── functions
│   │   │   ├── action.md
│   │   │   ├── filter.md
│   │   │   └── pipe.md
│   │   ├── tools
│   │   │   ├── openapi-servers
│   │   │   │   ├── faq.md
│   │   │   │   ├── mcp.md
│   │   │   │   └── open-webui.md
│   │   │   ├── development.md
│   │   │   └── openapi-servers.md
│   │   ├── functions.md
│   │   ├── migration.md
│   │   └── tools.md
│   ├── rag
│   │   ├── document-extraction
│   │   │   ├── docling.md
│   │   │   └── mistral-ocr.md
│   │   └── document-extraction.md
... (130 more items)
```

## Main Sections

### Top-Level Documentation
- **index.md** - Homepage and quick start guide
- **getting-started.md** - Installation and setup
- **features.md** - Platform features overview
- **troubleshooting.md** - Common issues and solutions
- **faq.md** - Frequently asked questions
- **contributing.md** - Contribution guidelines
- **security.md** - Security policy
- **license.md** - License information
- **mission.md** - Project mission
- **team.md** - Team information
- **roadmap.md** - Development roadmap
- **brand.md** - Brand guidelines
- **sponsorships.md** - Sponsorship information
- **enterprise.md** - Enterprise offerings

### Main Categories

#### getting-started/
Installation methods, configuration, API endpoints, and advanced topics including:
- Docker installation
- Manual installation (pip, uv)
- Environment configuration
- Development setup
- Kubernetes deployment
- Cloud deployments

#### features/
Detailed documentation of all OpenWebUI features:
- **Audio** - Speech-to-text and text-to-speech
- **Channels** - Communication channels
- **Chat Features** - Chat functionality
- **Evaluation** - Model evaluation
- **MCP** - Model Context Protocol
- **Memory** - Conversation memory
- **Notes** - Note-taking features
- **Pipelines** - Processing pipelines
- **Plugins** - Extension system
- **RAG** - Retrieval Augmented Generation
- **RBAC** - Role-Based Access Control
- **Workspace** - Workspace management
- **Image Generation** - AI image creation
- **Web Search** - Web search integration

#### tutorials/
Step-by-step guides and tutorials:
- Community Pipelines
- Integration guides
- Third-party integrations
- Advanced usage examples

#### troubleshooting/
Problem-solving guides for:
- Installation issues
- Configuration problems
- Common errors
- Performance optimization

#### enterprise/
Enterprise-specific documentation:
- Custom theming and branding
- SLA support
- Long-Term Support (LTS) versions
- Enterprise features

## Usage

These files can be:
1. Referenced offline without internet connection
2. Searched locally using text search tools
3. Used with AI assistants for context
4. Version-controlled alongside your project
5. Read in any markdown viewer

## Updating

To update the documentation to the latest version, run:

```bash
python scrape_owui_docs.py
```

This will re-download all documentation pages from the official site.

## License

The documentation content is property of OpenWebUI and subject to their license terms.
This is a local copy for reference purposes only.

## Links

- **Official Documentation:** https://docs.openwebui.com/
- **GitHub Repository:** https://github.com/open-webui/open-webui
- **Discord Community:** https://discord.com/invite/5rJgQTnV4s
- **Official Website:** https://openwebui.com/
