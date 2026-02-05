# Chunk API

The Chunk API allows you to split documents into semantic chunks for RAG (Retrieval-Augmented Generation) applications. Two chunking strategies are available:

- **Hybrid Chunker**: Combines multiple chunking strategies for optimal results
- **Hierarchical Chunker**: Preserves document structure hierarchy in chunks

## Chunking Strategies

### Hybrid Chunker

The Hybrid Chunker uses a combination of strategies to create chunks that balance:
- Semantic coherence
- Token limits
- Context preservation

### Hierarchical Chunker

The Hierarchical Chunker:
- Preserves document structure (headings, sections)
- Creates chunks that respect document hierarchy
- Ideal for structured documents

## Endpoints

### POST /v1/chunk/hybrid/source/async

**Chunk Sources With Hybridchunker As Async Task**

**Operation ID:** `Chunk_sources_with_HybridChunker_as_async_task_v1_chunk_hybrid_source_async_post`

#### Request Body

**Content-Type:** `application/json`

**Schema:** `HybridChunkerOptionsDocumentsRequest`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hybrid/file/async

**Chunk Files With Hybridchunker As Async Task**

**Operation ID:** `Chunk_files_with_HybridChunker_as_async_task_v1_chunk_hybrid_file_async_post`

#### Request Body

**Content-Type:** `multipart/form-data`

**Schema:** `Body_Chunk_files_with_HybridChunker_as_async_task_v1_chunk_hybrid_file_async_post`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hybrid/source

**Chunk Sources With Hybridchunker**

**Operation ID:** `Chunk_sources_with_HybridChunker_v1_chunk_hybrid_source_post`

#### Request Body

**Content-Type:** `application/json`

**Schema:** `HybridChunkerOptionsDocumentsRequest`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hybrid/file

**Chunk Files With Hybridchunker**

**Operation ID:** `Chunk_files_with_HybridChunker_v1_chunk_hybrid_file_post`

#### Request Body

**Content-Type:** `multipart/form-data`

**Schema:** `Body_Chunk_files_with_HybridChunker_v1_chunk_hybrid_file_post`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hierarchical/source/async

**Chunk Sources With Hierarchicalchunker As Async Task**

**Operation ID:** `Chunk_sources_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_source_async_post`

#### Request Body

**Content-Type:** `application/json`

**Schema:** `HierarchicalChunkerOptionsDocumentsRequest`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hierarchical/file/async

**Chunk Files With Hierarchicalchunker As Async Task**

**Operation ID:** `Chunk_files_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_file_async_post`

#### Request Body

**Content-Type:** `multipart/form-data`

**Schema:** `Body_Chunk_files_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_file_async_post`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hierarchical/source

**Chunk Sources With Hierarchicalchunker**

**Operation ID:** `Chunk_sources_with_HierarchicalChunker_v1_chunk_hierarchical_source_post`

#### Request Body

**Content-Type:** `application/json`

**Schema:** `HierarchicalChunkerOptionsDocumentsRequest`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

### POST /v1/chunk/hierarchical/file

**Chunk Files With Hierarchicalchunker**

**Operation ID:** `Chunk_files_with_HierarchicalChunker_v1_chunk_hierarchical_file_post`

#### Request Body

**Content-Type:** `multipart/form-data`

**Schema:** `Body_Chunk_files_with_HierarchicalChunker_v1_chunk_hierarchical_file_post`

#### Responses

- **200**: Successful Response
- **422**: Validation Error

---

## Example Usage

### Chunk from URL with Hybrid Chunker

```bash
curl -X POST "http://10.0.0.26:5001/v1/chunk/hybrid/source"   -H "Content-Type: application/json"   -d '{
    "http_sources": [
      {"url": "https://example.com/document.pdf"}
    ],
    "chunker_options": {
      "max_tokens": 512,
      "merge_peers": true
    }
  }'
```

### Chunk File with Hierarchical Chunker

```bash
curl -X POST "http://10.0.0.26:5001/v1/chunk/hierarchical/file"   -F "files=@/path/to/document.pdf"   -F "chunker_options={"include_metadata": true}"
```

### Async Chunking for Large Documents

```bash
# Start async chunking
curl -X POST "http://10.0.0.26:5001/v1/chunk/hybrid/source/async"   -H "Content-Type: application/json"   -d '{
    "http_sources": [{"url": "https://example.com/large-document.pdf"}],
    "chunker_options": {"max_tokens": 1024}
  }'

# Poll for status
curl "http://10.0.0.26:5001/v1/status/poll/{task_id}"

# Get chunked result
curl "http://10.0.0.26:5001/v1/result/{task_id}"
```

## Chunker Options

### HybridChunkerOptions

| Property | Type | Description |
|----------|------|-------------|
| max_tokens | integer | Maximum tokens per chunk |
| merge_peers | boolean | Merge peer elements when possible |

### HierarchicalChunkerOptions

| Property | Type | Description |
|----------|------|-------------|
| include_metadata | boolean | Include metadata in chunks |
| heading_as_metadata | boolean | Use headings as chunk metadata |
