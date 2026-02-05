# Complete API Reference

This document contains the complete API reference with all request and response details.

## API Information

| Field | Value |
|-------|-------|
| Title | Docling Serve |
| Version | 1.9.0 |
| OpenAPI | 3.1.0 |

---

## GET `/openapi-3.0.json`

**Openapi 30**

- **Operation ID:** `openapi_30_openapi_3_0_json_get`
- **Tags:** none

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

---

## GET `/health`

**Health**

- **Operation ID:** `health_health_get`
- **Tags:** health

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [HealthCheckResponse](schemas.md#healthcheckresponse)

---

## GET `/version`

**Version Info**

- **Operation ID:** `version_info_version_get`
- **Tags:** health

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

---

## POST `/v1/convert/source`

**Process Url**

- **Operation ID:** `process_url_v1_convert_source_post`
- **Tags:** convert
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `application/json`

**Schema:** [ConvertDocumentsRequest](schemas.md#convertdocumentsrequest)

```json
{
  "options": "ConvertDocumentsRequestOptions",
  "sources": [
    "any"
  ],
  "target": "any"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** One of:
- [ConvertDocumentResponse](schemas.md#convertdocumentresponse)
- [PresignedUrlConvertDocumentResponse](schemas.md#presignedurlconvertdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/convert/file`

**Process File**

- **Operation ID:** `process_file_v1_convert_file_post`
- **Tags:** convert
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `multipart/form-data`

**Schema:** [Body_process_file_v1_convert_file_post](schemas.md#body_process_file_v1_convert_file_post)

```json
{
  "files": [
    "string"
  ],
  "target_type": "TargetName",
  "from_formats": [
    "InputFormat"
  ],
  "to_formats": [
    "OutputFormat"
  ],
  "image_export_mode": "ImageRefMode",
  "do_ocr": "boolean (default: True)",
  "force_ocr": "boolean (default: False)",
  "ocr_engine": "ocr_engines_enum",
  "ocr_lang": "multiple types",
  "pdf_backend": "PdfBackend",
  "table_mode": "TableFormerMode",
  "table_cell_matching": "boolean (default: True)",
  "pipeline": "ProcessingPipeline",
  "page_range": [
    "any"
  ],
  "document_timeout": "number (default: 604800.0)",
  "abort_on_error": "boolean (default: False)",
  "do_table_structure": "boolean (default: True)",
  "include_images": "boolean (default: True)",
  "images_scale": "number (default: 2.0)",
  "md_page_break_placeholder": "string (default: )",
  "do_code_enrichment": "boolean (default: False)",
  "do_formula_enrichment": "boolean (default: False)",
  "do_picture_classification": "boolean (default: False)",
  "do_picture_description": "boolean (default: False)",
  "picture_description_area_threshold": "number (default: 0.05)",
  "picture_description_local": "string",
  "picture_description_api": "string",
  "vlm_pipeline_model": "multiple types",
  "vlm_pipeline_model_local": "string",
  "vlm_pipeline_model_api": "string"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** One of:
- [ConvertDocumentResponse](schemas.md#convertdocumentresponse)
- [PresignedUrlConvertDocumentResponse](schemas.md#presignedurlconvertdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/convert/source/async`

**Process Url Async**

- **Operation ID:** `process_url_async_v1_convert_source_async_post`
- **Tags:** convert
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `application/json`

**Schema:** [ConvertDocumentsRequest](schemas.md#convertdocumentsrequest)

```json
{
  "options": "ConvertDocumentsRequestOptions",
  "sources": [
    "any"
  ],
  "target": "any"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/convert/file/async`

**Process File Async**

- **Operation ID:** `process_file_async_v1_convert_file_async_post`
- **Tags:** convert
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `multipart/form-data`

**Schema:** [Body_process_file_async_v1_convert_file_async_post](schemas.md#body_process_file_async_v1_convert_file_async_post)

```json
{
  "files": [
    "string"
  ],
  "target_type": "TargetName",
  "from_formats": [
    "InputFormat"
  ],
  "to_formats": [
    "OutputFormat"
  ],
  "image_export_mode": "ImageRefMode",
  "do_ocr": "boolean (default: True)",
  "force_ocr": "boolean (default: False)",
  "ocr_engine": "ocr_engines_enum",
  "ocr_lang": "multiple types",
  "pdf_backend": "PdfBackend",
  "table_mode": "TableFormerMode",
  "table_cell_matching": "boolean (default: True)",
  "pipeline": "ProcessingPipeline",
  "page_range": [
    "any"
  ],
  "document_timeout": "number (default: 604800.0)",
  "abort_on_error": "boolean (default: False)",
  "do_table_structure": "boolean (default: True)",
  "include_images": "boolean (default: True)",
  "images_scale": "number (default: 2.0)",
  "md_page_break_placeholder": "string (default: )",
  "do_code_enrichment": "boolean (default: False)",
  "do_formula_enrichment": "boolean (default: False)",
  "do_picture_classification": "boolean (default: False)",
  "do_picture_description": "boolean (default: False)",
  "picture_description_area_threshold": "number (default: 0.05)",
  "picture_description_local": "string",
  "picture_description_api": "string",
  "vlm_pipeline_model": "multiple types",
  "vlm_pipeline_model_local": "string",
  "vlm_pipeline_model_api": "string"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hybrid/source/async`

**Chunk Sources With Hybridchunker As Async Task**

- **Operation ID:** `Chunk_sources_with_HybridChunker_as_async_task_v1_chunk_hybrid_source_async_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `application/json`

**Schema:** [HybridChunkerOptionsDocumentsRequest](schemas.md#hybridchunkeroptionsdocumentsrequest)

```json
{
  "convert_options": "ConvertDocumentsRequestOptions",
  "sources": [
    "any"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target": "any",
  "chunking_options": "HybridChunkerOptions"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hybrid/file/async`

**Chunk Files With Hybridchunker As Async Task**

- **Operation ID:** `Chunk_files_with_HybridChunker_as_async_task_v1_chunk_hybrid_file_async_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `multipart/form-data`

**Schema:** [Body_Chunk_files_with_HybridChunker_as_async_task_v1_chunk_hybrid_file_async_post](schemas.md#body_chunk_files_with_hybridchunker_as_async_task_v1_chunk_hybrid_file_async_post)

```json
{
  "files": [
    "string"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target_type": "TargetName",
  "convert_from_formats": [
    "InputFormat"
  ],
  "convert_image_export_mode": "ImageRefMode",
  "convert_do_ocr": "boolean (default: True)",
  "convert_force_ocr": "boolean (default: False)",
  "convert_ocr_engine": "ocr_engines_enum",
  "convert_ocr_lang": "multiple types",
  "convert_pdf_backend": "PdfBackend",
  "convert_table_mode": "TableFormerMode",
  "convert_table_cell_matching": "boolean (default: True)",
  "convert_pipeline": "ProcessingPipeline",
  "convert_page_range": [
    "any"
  ],
  "convert_document_timeout": "number (default: 604800.0)",
  "convert_abort_on_error": "boolean (default: False)",
  "convert_do_table_structure": "boolean (default: True)",
  "convert_include_images": "boolean (default: True)",
  "convert_images_scale": "number (default: 2.0)",
  "convert_md_page_break_placeholder": "string (default: )",
  "convert_do_code_enrichment": "boolean (default: False)",
  "convert_do_formula_enrichment": "boolean (default: False)",
  "convert_do_picture_classification": "boolean (default: False)",
  "convert_do_picture_description": "boolean (default: False)",
  "convert_picture_description_area_threshold": "number (default: 0.05)",
  "convert_picture_description_local": "string",
  "convert_picture_description_api": "string",
  "convert_vlm_pipeline_model": "multiple types",
  "convert_vlm_pipeline_model_local": "string",
  "convert_vlm_pipeline_model_api": "string",
  "chunking_use_markdown_tables": "boolean (default: False)",
  "chunking_include_raw_text": "boolean (default: False)",
  "chunking_max_tokens": "multiple types",
  "chunking_tokenizer": "string (default: sentence-transformers/all-MiniLM-L6-v2)",
  "chunking_merge_peers": "boolean (default: True)"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hybrid/source`

**Chunk Sources With Hybridchunker**

- **Operation ID:** `Chunk_sources_with_HybridChunker_v1_chunk_hybrid_source_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `application/json`

**Schema:** [HybridChunkerOptionsDocumentsRequest](schemas.md#hybridchunkeroptionsdocumentsrequest)

```json
{
  "convert_options": "ConvertDocumentsRequestOptions",
  "sources": [
    "any"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target": "any",
  "chunking_options": "HybridChunkerOptions"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [ChunkDocumentResponse](schemas.md#chunkdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hybrid/file`

**Chunk Files With Hybridchunker**

- **Operation ID:** `Chunk_files_with_HybridChunker_v1_chunk_hybrid_file_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `multipart/form-data`

**Schema:** [Body_Chunk_files_with_HybridChunker_v1_chunk_hybrid_file_post](schemas.md#body_chunk_files_with_hybridchunker_v1_chunk_hybrid_file_post)

```json
{
  "files": [
    "string"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target_type": "TargetName",
  "convert_from_formats": [
    "InputFormat"
  ],
  "convert_image_export_mode": "ImageRefMode",
  "convert_do_ocr": "boolean (default: True)",
  "convert_force_ocr": "boolean (default: False)",
  "convert_ocr_engine": "ocr_engines_enum",
  "convert_ocr_lang": "multiple types",
  "convert_pdf_backend": "PdfBackend",
  "convert_table_mode": "TableFormerMode",
  "convert_table_cell_matching": "boolean (default: True)",
  "convert_pipeline": "ProcessingPipeline",
  "convert_page_range": [
    "any"
  ],
  "convert_document_timeout": "number (default: 604800.0)",
  "convert_abort_on_error": "boolean (default: False)",
  "convert_do_table_structure": "boolean (default: True)",
  "convert_include_images": "boolean (default: True)",
  "convert_images_scale": "number (default: 2.0)",
  "convert_md_page_break_placeholder": "string (default: )",
  "convert_do_code_enrichment": "boolean (default: False)",
  "convert_do_formula_enrichment": "boolean (default: False)",
  "convert_do_picture_classification": "boolean (default: False)",
  "convert_do_picture_description": "boolean (default: False)",
  "convert_picture_description_area_threshold": "number (default: 0.05)",
  "convert_picture_description_local": "string",
  "convert_picture_description_api": "string",
  "convert_vlm_pipeline_model": "multiple types",
  "convert_vlm_pipeline_model_local": "string",
  "convert_vlm_pipeline_model_api": "string",
  "chunking_use_markdown_tables": "boolean (default: False)",
  "chunking_include_raw_text": "boolean (default: False)",
  "chunking_max_tokens": "multiple types",
  "chunking_tokenizer": "string (default: sentence-transformers/all-MiniLM-L6-v2)",
  "chunking_merge_peers": "boolean (default: True)"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [ChunkDocumentResponse](schemas.md#chunkdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hierarchical/source/async`

**Chunk Sources With Hierarchicalchunker As Async Task**

- **Operation ID:** `Chunk_sources_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_source_async_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `application/json`

**Schema:** [HierarchicalChunkerOptionsDocumentsRequest](schemas.md#hierarchicalchunkeroptionsdocumentsrequest)

```json
{
  "convert_options": "ConvertDocumentsRequestOptions",
  "sources": [
    "any"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target": "any",
  "chunking_options": "HierarchicalChunkerOptions"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hierarchical/file/async`

**Chunk Files With Hierarchicalchunker As Async Task**

- **Operation ID:** `Chunk_files_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_file_async_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `multipart/form-data`

**Schema:** [Body_Chunk_files_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_file_async_post](schemas.md#body_chunk_files_with_hierarchicalchunker_as_async_task_v1_chunk_hierarchical_file_async_post)

```json
{
  "files": [
    "string"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target_type": "TargetName",
  "convert_from_formats": [
    "InputFormat"
  ],
  "convert_image_export_mode": "ImageRefMode",
  "convert_do_ocr": "boolean (default: True)",
  "convert_force_ocr": "boolean (default: False)",
  "convert_ocr_engine": "ocr_engines_enum",
  "convert_ocr_lang": "multiple types",
  "convert_pdf_backend": "PdfBackend",
  "convert_table_mode": "TableFormerMode",
  "convert_table_cell_matching": "boolean (default: True)",
  "convert_pipeline": "ProcessingPipeline",
  "convert_page_range": [
    "any"
  ],
  "convert_document_timeout": "number (default: 604800.0)",
  "convert_abort_on_error": "boolean (default: False)",
  "convert_do_table_structure": "boolean (default: True)",
  "convert_include_images": "boolean (default: True)",
  "convert_images_scale": "number (default: 2.0)",
  "convert_md_page_break_placeholder": "string (default: )",
  "convert_do_code_enrichment": "boolean (default: False)",
  "convert_do_formula_enrichment": "boolean (default: False)",
  "convert_do_picture_classification": "boolean (default: False)",
  "convert_do_picture_description": "boolean (default: False)",
  "convert_picture_description_area_threshold": "number (default: 0.05)",
  "convert_picture_description_local": "string",
  "convert_picture_description_api": "string",
  "convert_vlm_pipeline_model": "multiple types",
  "convert_vlm_pipeline_model_local": "string",
  "convert_vlm_pipeline_model_api": "string",
  "chunking_use_markdown_tables": "boolean (default: False)",
  "chunking_include_raw_text": "boolean (default: False)",
  "chunking_max_tokens": "multiple types",
  "chunking_tokenizer": "string (default: sentence-transformers/all-MiniLM-L6-v2)",
  "chunking_merge_peers": "boolean (default: True)"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hierarchical/source`

**Chunk Sources With Hierarchicalchunker**

- **Operation ID:** `Chunk_sources_with_HierarchicalChunker_v1_chunk_hierarchical_source_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `application/json`

**Schema:** [HierarchicalChunkerOptionsDocumentsRequest](schemas.md#hierarchicalchunkeroptionsdocumentsrequest)

```json
{
  "convert_options": "ConvertDocumentsRequestOptions",
  "sources": [
    "any"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target": "any",
  "chunking_options": "HierarchicalChunkerOptions"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [ChunkDocumentResponse](schemas.md#chunkdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## POST `/v1/chunk/hierarchical/file`

**Chunk Files With Hierarchicalchunker**

- **Operation ID:** `Chunk_files_with_HierarchicalChunker_v1_chunk_hierarchical_file_post`
- **Tags:** chunk
- **Authentication:** Required (API Key)

### Request Body

**Required**

**Content-Type:** `multipart/form-data`

**Schema:** [Body_Chunk_files_with_HierarchicalChunker_v1_chunk_hierarchical_file_post](schemas.md#body_chunk_files_with_hierarchicalchunker_v1_chunk_hierarchical_file_post)

```json
{
  "files": [
    "string"
  ],
  "include_converted_doc": "boolean (default: False)",
  "target_type": "TargetName",
  "convert_from_formats": [
    "InputFormat"
  ],
  "convert_image_export_mode": "ImageRefMode",
  "convert_do_ocr": "boolean (default: True)",
  "convert_force_ocr": "boolean (default: False)",
  "convert_ocr_engine": "ocr_engines_enum",
  "convert_ocr_lang": "multiple types",
  "convert_pdf_backend": "PdfBackend",
  "convert_table_mode": "TableFormerMode",
  "convert_table_cell_matching": "boolean (default: True)",
  "convert_pipeline": "ProcessingPipeline",
  "convert_page_range": [
    "any"
  ],
  "convert_document_timeout": "number (default: 604800.0)",
  "convert_abort_on_error": "boolean (default: False)",
  "convert_do_table_structure": "boolean (default: True)",
  "convert_include_images": "boolean (default: True)",
  "convert_images_scale": "number (default: 2.0)",
  "convert_md_page_break_placeholder": "string (default: )",
  "convert_do_code_enrichment": "boolean (default: False)",
  "convert_do_formula_enrichment": "boolean (default: False)",
  "convert_do_picture_classification": "boolean (default: False)",
  "convert_do_picture_description": "boolean (default: False)",
  "convert_picture_description_area_threshold": "number (default: 0.05)",
  "convert_picture_description_local": "string",
  "convert_picture_description_api": "string",
  "convert_vlm_pipeline_model": "multiple types",
  "convert_vlm_pipeline_model_local": "string",
  "convert_vlm_pipeline_model_api": "string",
  "chunking_use_markdown_tables": "boolean (default: False)",
  "chunking_include_raw_text": "boolean (default: False)",
  "chunking_max_tokens": "multiple types",
  "chunking_tokenizer": "string (default: sentence-transformers/all-MiniLM-L6-v2)",
  "chunking_merge_peers": "boolean (default: True)"
}
```

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [ChunkDocumentResponse](schemas.md#chunkdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## GET `/v1/status/poll/{task_id}`

**Task Status Poll**

- **Operation ID:** `task_status_poll_v1_status_poll__task_id__get`
- **Tags:** tasks
- **Authentication:** Required (API Key)

### Parameters

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| task_id | path | string | Yes | - |
| wait | query | number | No | Number of seconds to wait for a completed status. |

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [TaskStatusResponse](schemas.md#taskstatusresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## GET `/v1/result/{task_id}`

**Task Result**

- **Operation ID:** `task_result_v1_result__task_id__get`
- **Tags:** tasks
- **Authentication:** Required (API Key)

### Parameters

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| task_id | path | string | Yes | - |

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** One of:
- [ConvertDocumentResponse](schemas.md#convertdocumentresponse)
- [PresignedUrlConvertDocumentResponse](schemas.md#presignedurlconvertdocumentresponse)
- [ChunkDocumentResponse](schemas.md#chunkdocumentresponse)

**Content-Type:** `application/zip`

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

## GET `/v1/clear/converters`

**Clear Converters**

- **Operation ID:** `clear_converters_v1_clear_converters_get`
- **Tags:** clear
- **Authentication:** Required (API Key)

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [ClearResponse](schemas.md#clearresponse)

---

## GET `/v1/clear/results`

**Clear Results**

- **Operation ID:** `clear_results_v1_clear_results_get`
- **Tags:** clear
- **Authentication:** Required (API Key)

### Parameters

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| older_then | query | number | No | - |

### Responses

#### 200 - Successful Response

**Content-Type:** `application/json`

**Schema:** [ClearResponse](schemas.md#clearresponse)

#### 422 - Validation Error

**Content-Type:** `application/json`

**Schema:** [HTTPValidationError](schemas.md#httpvalidationerror)

---

