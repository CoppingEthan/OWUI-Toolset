# Convert API

The Convert API allows you to convert documents from various formats into structured outputs like Markdown, JSON, or DoclingDocument format.

## Endpoints

### POST /v1/convert/source

**Process Url**

**Operation ID:** `process_url_v1_convert_source_post`

#### Request Body

**Content-Type:** `application/json`

**Schema:** `ConvertDocumentsRequest`

**Properties:**

- **options** (`ConvertDocumentsRequestOptions`, optional) (default: `{'from_formats': ['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'csv', 'xlsx', 'xml_uspto', 'xml_jats', 'mets_gbs', 'json_docling', 'audio', 'vtt'], 'to_formats': ['md'], 'image_export_mode': 'embedded', 'do_ocr': True, 'force_ocr': False, 'ocr_engine': 'easyocr', 'pdf_backend': 'dlparse_v4', 'table_mode': 'accurate', 'table_cell_matching': True, 'pipeline': 'standard', 'page_range': [1, 9223372036854775807], 'document_timeout': 604800.0, 'abort_on_error': False, 'do_table_structure': True, 'include_images': True, 'images_scale': 2.0, 'md_page_break_placeholder': '', 'do_code_enrichment': False, 'do_formula_enrichment': False, 'do_picture_classification': False, 'do_picture_description': False, 'picture_description_area_threshold': 0.05}`): 
- **sources** (array of any, **required**): Sources
- **target** (, optional) (default: `{'kind': 'inbody'}`): Target

#### Responses

- **200**: Successful Response
- **422**: Validation Error
  - Schema: `HTTPValidationError`

---

### POST /v1/convert/file

**Process File**

**Operation ID:** `process_file_v1_convert_file_post`

#### Request Body

**Content-Type:** `multipart/form-data`

**Schema:** `Body_process_file_v1_convert_file_post`

**Properties:**

- **files** (array of string, **required**): Files
- **target_type** (`TargetName`, optional) (default: `inbody`): 
- **from_formats** (array of `InputFormat`, optional) (default: `['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'csv', 'xlsx', 'xml_uspto', 'xml_jats', 'mets_gbs', 'json_docling', 'audio', 'vtt']`): Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats.
- **to_formats** (array of `OutputFormat`, optional) (default: `['md']`): Output format(s) to convert to. String or list of strings. Allowed values: md, json, html, html_split_page, text, doctags. Optional, defaults to Markdown.
- **image_export_mode** (`ImageRefMode`, optional) (default: `embedded`): Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded.
- **do_ocr** (boolean, optional) (default: `True`): If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true
- **force_ocr** (boolean, optional) (default: `False`): If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false.
- **ocr_engine** (`ocr_engines_enum`, optional) (default: `easyocr`): The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr.
- **ocr_lang** (array | null, optional): List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty.
- **pdf_backend** (`PdfBackend`, optional) (default: `dlparse_v4`): The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4.
- **table_mode** (`TableFormerMode`, optional) (default: `accurate`): Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate.
- **table_cell_matching** (boolean, optional) (default: `True`): If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells.
- **pipeline** (`ProcessingPipeline`, optional) (default: `standard`): Choose the pipeline to process PDF or image files.
- **page_range** (array of any, optional) (default: `[1, 9223372036854775807]`): Only convert a range of pages. The page number starts at 1.
- **document_timeout** (number, optional) (default: `604800.0`): The timeout for processing each document, in seconds.
- **abort_on_error** (boolean, optional) (default: `False`): Abort on error if enabled. Boolean. Optional, defaults to false.
- **do_table_structure** (boolean, optional) (default: `True`): If enabled, the table structure will be extracted. Boolean. Optional, defaults to true.
- **include_images** (boolean, optional) (default: `True`): If enabled, images will be extracted from the document. Boolean. Optional, defaults to true.
- **images_scale** (number, optional) (default: `2.0`): Scale factor for images. Float. Optional, defaults to 2.0.
- **md_page_break_placeholder** (string, optional) (default: ``): Add this placeholder between pages in the markdown output.
- **do_code_enrichment** (boolean, optional) (default: `False`): If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false.
- **do_formula_enrichment** (boolean, optional) (default: `False`): If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false.
- **do_picture_classification** (boolean, optional) (default: `False`): If enabled, classify pictures in documents. Boolean. Optional, defaults to false.
- **do_picture_description** (boolean, optional) (default: `False`): If enabled, describe pictures in documents. Boolean. Optional, defaults to false.
- **picture_description_area_threshold** (number, optional) (default: `0.05`): Minimum percentage of the area for a picture to be processed with the models.
- **picture_description_local** (string, optional): Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api.
- **picture_description_api** (string, optional): API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local.
- **vlm_pipeline_model** (`VlmModelType` | null, optional): Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters.
- **vlm_pipeline_model_local** (string, optional): Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model.
- **vlm_pipeline_model_api** (string, optional): API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model.

#### Responses

- **200**: Successful Response
- **422**: Validation Error
  - Schema: `HTTPValidationError`

---

### POST /v1/convert/source/async

**Process Url Async**

**Operation ID:** `process_url_async_v1_convert_source_async_post`

#### Request Body

**Content-Type:** `application/json`

**Schema:** `ConvertDocumentsRequest`

**Properties:**

- **options** (`ConvertDocumentsRequestOptions`, optional) (default: `{'from_formats': ['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'csv', 'xlsx', 'xml_uspto', 'xml_jats', 'mets_gbs', 'json_docling', 'audio', 'vtt'], 'to_formats': ['md'], 'image_export_mode': 'embedded', 'do_ocr': True, 'force_ocr': False, 'ocr_engine': 'easyocr', 'pdf_backend': 'dlparse_v4', 'table_mode': 'accurate', 'table_cell_matching': True, 'pipeline': 'standard', 'page_range': [1, 9223372036854775807], 'document_timeout': 604800.0, 'abort_on_error': False, 'do_table_structure': True, 'include_images': True, 'images_scale': 2.0, 'md_page_break_placeholder': '', 'do_code_enrichment': False, 'do_formula_enrichment': False, 'do_picture_classification': False, 'do_picture_description': False, 'picture_description_area_threshold': 0.05}`): 
- **sources** (array of any, **required**): Sources
- **target** (, optional) (default: `{'kind': 'inbody'}`): Target

#### Responses

- **200**: Successful Response
  - Schema: `TaskStatusResponse`
- **422**: Validation Error
  - Schema: `HTTPValidationError`

---

### POST /v1/convert/file/async

**Process File Async**

**Operation ID:** `process_file_async_v1_convert_file_async_post`

#### Request Body

**Content-Type:** `multipart/form-data`

**Schema:** `Body_process_file_async_v1_convert_file_async_post`

**Properties:**

- **files** (array of string, **required**): Files
- **target_type** (`TargetName`, optional) (default: `inbody`): 
- **from_formats** (array of `InputFormat`, optional) (default: `['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'csv', 'xlsx', 'xml_uspto', 'xml_jats', 'mets_gbs', 'json_docling', 'audio', 'vtt']`): Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats.
- **to_formats** (array of `OutputFormat`, optional) (default: `['md']`): Output format(s) to convert to. String or list of strings. Allowed values: md, json, html, html_split_page, text, doctags. Optional, defaults to Markdown.
- **image_export_mode** (`ImageRefMode`, optional) (default: `embedded`): Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded.
- **do_ocr** (boolean, optional) (default: `True`): If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true
- **force_ocr** (boolean, optional) (default: `False`): If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false.
- **ocr_engine** (`ocr_engines_enum`, optional) (default: `easyocr`): The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr.
- **ocr_lang** (array | null, optional): List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty.
- **pdf_backend** (`PdfBackend`, optional) (default: `dlparse_v4`): The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4.
- **table_mode** (`TableFormerMode`, optional) (default: `accurate`): Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate.
- **table_cell_matching** (boolean, optional) (default: `True`): If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells.
- **pipeline** (`ProcessingPipeline`, optional) (default: `standard`): Choose the pipeline to process PDF or image files.
- **page_range** (array of any, optional) (default: `[1, 9223372036854775807]`): Only convert a range of pages. The page number starts at 1.
- **document_timeout** (number, optional) (default: `604800.0`): The timeout for processing each document, in seconds.
- **abort_on_error** (boolean, optional) (default: `False`): Abort on error if enabled. Boolean. Optional, defaults to false.
- **do_table_structure** (boolean, optional) (default: `True`): If enabled, the table structure will be extracted. Boolean. Optional, defaults to true.
- **include_images** (boolean, optional) (default: `True`): If enabled, images will be extracted from the document. Boolean. Optional, defaults to true.
- **images_scale** (number, optional) (default: `2.0`): Scale factor for images. Float. Optional, defaults to 2.0.
- **md_page_break_placeholder** (string, optional) (default: ``): Add this placeholder between pages in the markdown output.
- **do_code_enrichment** (boolean, optional) (default: `False`): If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false.
- **do_formula_enrichment** (boolean, optional) (default: `False`): If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false.
- **do_picture_classification** (boolean, optional) (default: `False`): If enabled, classify pictures in documents. Boolean. Optional, defaults to false.
- **do_picture_description** (boolean, optional) (default: `False`): If enabled, describe pictures in documents. Boolean. Optional, defaults to false.
- **picture_description_area_threshold** (number, optional) (default: `0.05`): Minimum percentage of the area for a picture to be processed with the models.
- **picture_description_local** (string, optional): Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api.
- **picture_description_api** (string, optional): API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local.
- **vlm_pipeline_model** (`VlmModelType` | null, optional): Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters.
- **vlm_pipeline_model_local** (string, optional): Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model.
- **vlm_pipeline_model_api** (string, optional): API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model.

#### Responses

- **200**: Successful Response
  - Schema: `TaskStatusResponse`
- **422**: Validation Error
  - Schema: `HTTPValidationError`

---

## Example Usage

### Convert a URL Source

```bash
curl -X POST "http://10.0.0.26:5001/v1/convert/source"   -H "Content-Type: application/json"   -d '{
    "http_sources": [
      {"url": "https://example.com/document.pdf"}
    ],
    "options": {
      "to_formats": ["md", "json"],
      "image_export_mode": "placeholder"
    }
  }'
```

### Convert a File Upload

```bash
curl -X POST "http://10.0.0.26:5001/v1/convert/file"   -F "files=@/path/to/document.pdf"   -F "options={"to_formats": ["md"]}"
```

### Async Conversion

For large documents, use async endpoints:

```bash
# Start async conversion
curl -X POST "http://10.0.0.26:5001/v1/convert/source/async"   -H "Content-Type: application/json"   -d '{
    "http_sources": [{"url": "https://example.com/large-document.pdf"}]
  }'

# Response contains task_id
# {"task_id": "abc123", "status": "pending"}

# Poll for status
curl "http://10.0.0.26:5001/v1/status/poll/abc123"

# Get result when complete
curl "http://10.0.0.26:5001/v1/result/abc123"
```
