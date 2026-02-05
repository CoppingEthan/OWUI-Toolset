# Docling Serve API Documentation

**Version:** 1.9.0

Docling Serve is a document processing and conversion API service that provides powerful capabilities for:

- **Document Conversion**: Convert documents from various formats (PDF, DOCX, etc.) to structured outputs
- **Document Chunking**: Split documents into semantic chunks using hybrid or hierarchical chunking strategies
- **Async Processing**: Handle large documents with async task processing
- **Health Monitoring**: Check service health and version information

## Base URL

```
http://10.0.0.26:5001
```

## API Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| general | `/openapi-3.0.json` | GET | Openapi 30 |
| health | `/health` | GET | Health |
| health | `/version` | GET | Version Info |
| convert | `/v1/convert/source` | POST | Process Url |
| convert | `/v1/convert/file` | POST | Process File |
| convert | `/v1/convert/source/async` | POST | Process Url Async |
| convert | `/v1/convert/file/async` | POST | Process File Async |
| chunk | `/v1/chunk/hybrid/source/async` | POST | Chunk Sources With Hybridchunker As Async Task |
| chunk | `/v1/chunk/hybrid/file/async` | POST | Chunk Files With Hybridchunker As Async Task |
| chunk | `/v1/chunk/hybrid/source` | POST | Chunk Sources With Hybridchunker |
| chunk | `/v1/chunk/hybrid/file` | POST | Chunk Files With Hybridchunker |
| chunk | `/v1/chunk/hierarchical/source/async` | POST | Chunk Sources With Hierarchicalchunker As Async Task |
| chunk | `/v1/chunk/hierarchical/file/async` | POST | Chunk Files With Hierarchicalchunker As Async Task |
| chunk | `/v1/chunk/hierarchical/source` | POST | Chunk Sources With Hierarchicalchunker |
| chunk | `/v1/chunk/hierarchical/file` | POST | Chunk Files With Hierarchicalchunker |
| tasks | `/v1/status/poll/{task_id}` | GET | Task Status Poll |
| tasks | `/v1/result/{task_id}` | GET | Task Result |
| clear | `/v1/clear/converters` | GET | Clear Converters |
| clear | `/v1/clear/results` | GET | Clear Results |

## Authentication

The API uses API Key authentication for secured endpoints. Include the API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

## Quick Links

- [Convert API](convert-api.md) - Document conversion endpoints
- [Chunk API](chunk-api.md) - Document chunking endpoints  
- [Tasks API](tasks-api.md) - Async task management
- [Health API](health-api.md) - Health and version endpoints
- [Schemas](schemas.md) - Data model reference
