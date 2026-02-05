# Schemas Reference

This document contains all data models used in the Docling Serve API.

## Table of Contents

### Core Models
- [DoclingDocument](#doclingdocument) - Main document representation
- [ConvertDocumentResponse](#convertdocumentresponse) - Conversion response
- [ChunkDocumentResponse](#chunkdocumentresponse) - Chunking response

### Request Models
- [ConvertDocumentsRequest](#convertdocumentsrequest) - Conversion request
- [HttpSourceRequest](#httpsourcerequest) - HTTP source specification
- [FileSourceRequest](#filesourcerequest) - File source specification
- [S3SourceRequest](#s3sourcerequest) - S3 source specification

### Options
- [ConvertDocumentsRequestOptions](#convertdocumentsrequestoptions) - Conversion options
- [HybridChunkerOptions](#hybridchunkeroptions) - Hybrid chunker configuration
- [HierarchicalChunkerOptions](#hierarchicalchunkeroptions) - Hierarchical chunker configuration

### Document Elements
- [TextItem](#textitem) - Text content
- [TableItem](#tableitem) - Table content
- [PictureItem](#pictureitem) - Image content
- [CodeItem](#codeitem) - Code blocks
- [FormulaItem](#formulaitem) - Mathematical formulas

### Enums
- [InputFormat](#inputformat) - Supported input formats
- [OutputFormat](#outputformat) - Supported output formats
- [ConversionStatus](#conversionstatus) - Processing status values

---

## BaseMeta

Base class for metadata.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| summary | [SummaryMetaField](#summarymetafield) | null | No | - | - |

---

## Body_Chunk_files_with_HierarchicalChunker_as_async_task_v1_chunk_hierarchical_file_async_post

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| files | array of string | Yes | - | Files |
| include_converted_doc | boolean | No | `false` | If true, the output will include both the chunks and the converted document. |
| target_type | [TargetName](#targetname) | No | `inbody` | Specification for the type of output target. |
| convert_from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| convert_image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| convert_do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| convert_force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| convert_ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| convert_ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| convert_pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| convert_table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| convert_table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| convert_pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| convert_page_range | array of any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| convert_document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| convert_abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| convert_do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| convert_include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| convert_images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| convert_md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| convert_do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| convert_do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| convert_do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| convert_do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| convert_picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| convert_picture_description_local | string | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| convert_picture_description_api | string | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| convert_vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| convert_vlm_pipeline_model_local | string | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| convert_vlm_pipeline_model_api | string | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |
| chunking_use_markdown_tables | boolean | No | `false` | Use markdown table format instead of triplets for table serialization. |
| chunking_include_raw_text | boolean | No | `false` | Include both raw_text and text (contextualized) in response. If False, only text is included. |
| chunking_max_tokens | integer | null | No | - | Maximum number of tokens per chunk. When left to none, the value is automatically extracted from the tokenizer. |
| chunking_tokenizer | string | No | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model name for custom tokenization. If not specified, uses 'sentence-transformers/all-MiniLM-L6-v2' as default. |
| chunking_merge_peers | boolean | No | `true` | Merge undersized successive chunks with same headings. |

---

## Body_Chunk_files_with_HierarchicalChunker_v1_chunk_hierarchical_file_post

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| files | array of string | Yes | - | Files |
| include_converted_doc | boolean | No | `false` | If true, the output will include both the chunks and the converted document. |
| target_type | [TargetName](#targetname) | No | `inbody` | Specification for the type of output target. |
| convert_from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| convert_image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| convert_do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| convert_force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| convert_ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| convert_ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| convert_pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| convert_table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| convert_table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| convert_pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| convert_page_range | array of any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| convert_document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| convert_abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| convert_do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| convert_include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| convert_images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| convert_md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| convert_do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| convert_do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| convert_do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| convert_do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| convert_picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| convert_picture_description_local | string | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| convert_picture_description_api | string | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| convert_vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| convert_vlm_pipeline_model_local | string | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| convert_vlm_pipeline_model_api | string | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |
| chunking_use_markdown_tables | boolean | No | `false` | Use markdown table format instead of triplets for table serialization. |
| chunking_include_raw_text | boolean | No | `false` | Include both raw_text and text (contextualized) in response. If False, only text is included. |
| chunking_max_tokens | integer | null | No | - | Maximum number of tokens per chunk. When left to none, the value is automatically extracted from the tokenizer. |
| chunking_tokenizer | string | No | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model name for custom tokenization. If not specified, uses 'sentence-transformers/all-MiniLM-L6-v2' as default. |
| chunking_merge_peers | boolean | No | `true` | Merge undersized successive chunks with same headings. |

---

## Body_Chunk_files_with_HybridChunker_as_async_task_v1_chunk_hybrid_file_async_post

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| files | array of string | Yes | - | Files |
| include_converted_doc | boolean | No | `false` | If true, the output will include both the chunks and the converted document. |
| target_type | [TargetName](#targetname) | No | `inbody` | Specification for the type of output target. |
| convert_from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| convert_image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| convert_do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| convert_force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| convert_ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| convert_ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| convert_pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| convert_table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| convert_table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| convert_pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| convert_page_range | array of any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| convert_document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| convert_abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| convert_do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| convert_include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| convert_images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| convert_md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| convert_do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| convert_do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| convert_do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| convert_do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| convert_picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| convert_picture_description_local | string | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| convert_picture_description_api | string | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| convert_vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| convert_vlm_pipeline_model_local | string | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| convert_vlm_pipeline_model_api | string | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |
| chunking_use_markdown_tables | boolean | No | `false` | Use markdown table format instead of triplets for table serialization. |
| chunking_include_raw_text | boolean | No | `false` | Include both raw_text and text (contextualized) in response. If False, only text is included. |
| chunking_max_tokens | integer | null | No | - | Maximum number of tokens per chunk. When left to none, the value is automatically extracted from the tokenizer. |
| chunking_tokenizer | string | No | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model name for custom tokenization. If not specified, uses 'sentence-transformers/all-MiniLM-L6-v2' as default. |
| chunking_merge_peers | boolean | No | `true` | Merge undersized successive chunks with same headings. |

---

## Body_Chunk_files_with_HybridChunker_v1_chunk_hybrid_file_post

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| files | array of string | Yes | - | Files |
| include_converted_doc | boolean | No | `false` | If true, the output will include both the chunks and the converted document. |
| target_type | [TargetName](#targetname) | No | `inbody` | Specification for the type of output target. |
| convert_from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| convert_image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| convert_do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| convert_force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| convert_ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| convert_ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| convert_pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| convert_table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| convert_table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| convert_pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| convert_page_range | array of any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| convert_document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| convert_abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| convert_do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| convert_include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| convert_images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| convert_md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| convert_do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| convert_do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| convert_do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| convert_do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| convert_picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| convert_picture_description_local | string | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| convert_picture_description_api | string | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| convert_vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| convert_vlm_pipeline_model_local | string | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| convert_vlm_pipeline_model_api | string | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |
| chunking_use_markdown_tables | boolean | No | `false` | Use markdown table format instead of triplets for table serialization. |
| chunking_include_raw_text | boolean | No | `false` | Include both raw_text and text (contextualized) in response. If False, only text is included. |
| chunking_max_tokens | integer | null | No | - | Maximum number of tokens per chunk. When left to none, the value is automatically extracted from the tokenizer. |
| chunking_tokenizer | string | No | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model name for custom tokenization. If not specified, uses 'sentence-transformers/all-MiniLM-L6-v2' as default. |
| chunking_merge_peers | boolean | No | `true` | Merge undersized successive chunks with same headings. |

---

## Body_process_file_async_v1_convert_file_async_post

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| files | array of string | Yes | - | Files |
| target_type | [TargetName](#targetname) | No | `inbody` | - |
| from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| to_formats | array of [OutputFormat](#outputformat) | No | `["md"]` | Output format(s) to convert to. String or list of strings. Allowed values: md, json, html, html_split_page, text, doctags. Optional, defaults to Markdown. |
| image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| page_range | array of any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| picture_description_local | string | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| picture_description_api | string | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| vlm_pipeline_model_local | string | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| vlm_pipeline_model_api | string | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |

---

## Body_process_file_v1_convert_file_post

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| files | array of string | Yes | - | Files |
| target_type | [TargetName](#targetname) | No | `inbody` | - |
| from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| to_formats | array of [OutputFormat](#outputformat) | No | `["md"]` | Output format(s) to convert to. String or list of strings. Allowed values: md, json, html, html_split_page, text, doctags. Optional, defaults to Markdown. |
| image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| page_range | array of any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| picture_description_local | string | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| picture_description_api | string | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| vlm_pipeline_model_local | string | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| vlm_pipeline_model_api | string | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |

---

## BoundingBox

BoundingBox.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| l | number | Yes | - | L |
| t | number | Yes | - | T |
| r | number | Yes | - | R |
| b | number | Yes | - | B |
| coord_origin | [CoordOrigin](#coordorigin) | No | `TOPLEFT` | - |

---

## ChartBar

Represents a bar in a bar chart.

Attributes:
    label (str): The label for the bar.
    values (float): The value associated with the bar.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| label | string | Yes | - | Label |
| values | number | Yes | - | Values |

---

## ChartLine

Represents a line in a line chart.

Attributes:
    label (str): The label for the line.
    values (List[Tuple[float, float]]): A list of (x, y) coordinate pairs
        representing the line's data points.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| label | string | Yes | - | Label |
| values | array of array of any | Yes | - | Values |

---

## ChartPoint

Represents a point in a scatter chart.

Attributes:
    value (Tuple[float, float]): A (x, y) coordinate pair representing a point in a
        chart.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| value | array of any | Yes | - | Value |

---

## ChartSlice

Represents a slice in a pie chart.

Attributes:
    label (str): The label for the slice.
    value (float): The value represented by the slice.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| label | string | Yes | - | Label |
| value | number | Yes | - | Value |

---

## ChartStackedBar

Represents a stacked bar in a stacked bar chart.

Attributes:
    label (List[str]): The labels for the stacked bars. Multiple values are stored
        in cases where the chart is "double stacked," meaning bars are stacked both
        horizontally and vertically.
    values (List[Tuple[str, int]]): A list of values representing different segments
        of the stacked bar along with their label.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| label | array of string | Yes | - | Label |
| values | array of array of any | Yes | - | Values |

---

## ChunkDocumentResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| chunks | array of [ChunkedDocumentResultItem](#chunkeddocumentresultitem) | Yes | - | Chunks |
| documents | array of [ExportResult](#exportresult) | Yes | - | Documents |
| processing_time | number | Yes | - | Processing Time |

---

## ChunkedDocumentResultItem

A single chunk of a document with its metadata and content.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| filename | string | Yes | - | Filename |
| chunk_index | integer | Yes | - | Chunk Index |
| text | string | Yes | - | The chunk text with structural context (headers, formatting) |
| raw_text | string | null | No | - | Raw chunk text without additional formatting or context |
| num_tokens | integer | null | No | - | Number of tokens in the text, if the chunker is aware of tokens |
| headings | array of string | null | No | - | List of headings for this chunk |
| captions | array of string | null | No | - | List of captions for this chunk (e.g. for pictures and tables) |
| doc_items | array of string | Yes | - | List of doc items references |
| page_numbers | array of integer | null | No | - | Page numbers where this chunk content appears |
| metadata | object | null | No | - | Additional metadata associated with this chunk |

---

## ClearResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| status | string | No | `ok` | Status |

---

## CodeItem

CodeItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [FloatingMeta](#floatingmeta) | null | No | - | - |
| label | string | No | `code` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| orig | string | Yes | - | Orig |
| text | string | Yes | - | Text |
| formatting | [Formatting](#formatting) | null | No | - | - |
| hyperlink | string | string | null | No | - | Hyperlink |
| captions | array of [RefItem](#refitem) | No | `[]` | Captions |
| references | array of [RefItem](#refitem) | No | `[]` | References |
| footnotes | array of [RefItem](#refitem) | No | `[]` | Footnotes |
| image | [ImageRef](#imageref) | null | No | - | - |
| code_language | [CodeLanguageLabel](#codelanguagelabel) | No | `unknown` | - |

---

## CodeLanguageLabel

CodeLanguageLabel.

**Type:** `string` (enum)

**Values:**

- `Ada`
- `Awk`
- `Bash`
- `bc`
- `C`
- `C#`
- `C++`
- `CMake`
- `COBOL`
- `CSS`
- `Ceylon`
- `Clojure`
- `Crystal`
- `Cuda`
- `Cython`
- `D`
- `Dart`
- `dc`
- `Dockerfile`
- `Elixir`
- `Erlang`
- `FORTRAN`
- `Forth`
- `Go`
- `HTML`
- `Haskell`
- `Haxe`
- `Java`
- `JavaScript`
- `JSON`
- `Julia`
- `Kotlin`
- `Lisp`
- `Lua`
- `Matlab`
- `MoonScript`
- `Nim`
- `OCaml`
- `ObjectiveC`
- `Octave`
- `PHP`
- `Pascal`
- `Perl`
- `Prolog`
- `Python`
- `Racket`
- `Ruby`
- `Rust`
- `SML`
- `SQL`
- `Scala`
- `Scheme`
- `Swift`
- `TypeScript`
- `unknown`
- `VisualBasic`
- `XML`
- `YAML`

---

## ContentLayer

ContentLayer.

**Type:** `string` (enum)

**Values:**

- `body`
- `furniture`
- `background`
- `invisible`
- `notes`

---

## ConversionStatus

**Type:** `string` (enum)

**Values:**

- `pending`
- `started`
- `failure`
- `success`
- `partial_success`
- `skipped`

---

## ConvertDocumentResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| document | [ExportDocumentResponse](#exportdocumentresponse) | Yes | - | - |
| status | [ConversionStatus](#conversionstatus) | Yes | - | - |
| errors | array of [ErrorItem](#erroritem) | No | `[]` | Errors |
| processing_time | number | Yes | - | Processing Time |
| timings | object | No | `{}` | Timings |

---

## ConvertDocumentsRequest

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| options | [ConvertDocumentsRequestOptions](#convertdocumentsrequestoptions) | No | `{"from_formats": ["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"], "to_formats": ["md"], "image_export_mode": "embedded", "do_ocr": true, "force_ocr": false, "ocr_engine": "easyocr", "pdf_backend": "dlparse_v4", "table_mode": "accurate", "table_cell_matching": true, "pipeline": "standard", "page_range": [1, 9223372036854775807], "document_timeout": 604800.0, "abort_on_error": false, "do_table_structure": true, "include_images": true, "images_scale": 2.0, "md_page_break_placeholder": "", "do_code_enrichment": false, "do_formula_enrichment": false, "do_picture_classification": false, "do_picture_description": false, "picture_description_area_threshold": 0.05}` | - |
| sources | array of any | Yes | - | Sources |
| target | any | No | `{"kind": "inbody"}` | Target |

---

## ConvertDocumentsRequestOptions

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| from_formats | array of [InputFormat](#inputformat) | No | `["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"]` | Input format(s) to convert from. String or list of strings. Allowed values: docx, pptx, html, image, pdf, asciidoc, md, csv, xlsx, xml_uspto, xml_jats, mets_gbs, json_docling, audio, vtt. Optional, defaults to all formats. |
| to_formats | array of [OutputFormat](#outputformat) | No | `["md"]` | Output format(s) to convert to. String or list of strings. Allowed values: md, json, html, html_split_page, text, doctags. Optional, defaults to Markdown. |
| image_export_mode | [ImageRefMode](#imagerefmode) | No | `embedded` | Image export mode for the document (in case of JSON, Markdown or HTML). Allowed values: placeholder, embedded, referenced. Optional, defaults to Embedded. |
| do_ocr | boolean | No | `true` | If enabled, the bitmap content will be processed using OCR. Boolean. Optional, defaults to true |
| force_ocr | boolean | No | `false` | If enabled, replace existing text with OCR-generated text over content. Boolean. Optional, defaults to false. |
| ocr_engine | [ocr_engines_enum](#ocr_engines_enum) | No | `easyocr` | The OCR engine to use. String. Allowed values: auto, easyocr, ocrmac, rapidocr, tesserocr, tesseract. Optional, defaults to easyocr. |
| ocr_lang | array of string | null | No | - | List of languages used by the OCR engine. Note that each OCR engine has different values for the language names. String or list of strings. Optional, defaults to empty. |
| pdf_backend | [PdfBackend](#pdfbackend) | No | `dlparse_v4` | The PDF backend to use. String. Allowed values: pypdfium2, dlparse_v1, dlparse_v2, dlparse_v4. Optional, defaults to dlparse_v4. |
| table_mode | [TableFormerMode](#tableformermode) | No | `accurate` | Mode to use for table structure, String. Allowed values: fast, accurate. Optional, defaults to accurate. |
| table_cell_matching | boolean | No | `true` | If true, matches table cells predictions back to PDF cells. Can break table output if PDF cells are merged across table columns. If false, let table structure model define the text cells, ignore PDF cells. |
| pipeline | [ProcessingPipeline](#processingpipeline) | No | `standard` | Choose the pipeline to process PDF or image files. |
| page_range | any | No | `[1, 9223372036854775807]` | Only convert a range of pages. The page number starts at 1. |
| document_timeout | number | No | `604800.0` | The timeout for processing each document, in seconds. |
| abort_on_error | boolean | No | `false` | Abort on error if enabled. Boolean. Optional, defaults to false. |
| do_table_structure | boolean | No | `true` | If enabled, the table structure will be extracted. Boolean. Optional, defaults to true. |
| include_images | boolean | No | `true` | If enabled, images will be extracted from the document. Boolean. Optional, defaults to true. |
| images_scale | number | No | `2.0` | Scale factor for images. Float. Optional, defaults to 2.0. |
| md_page_break_placeholder | string | No | `""` | Add this placeholder between pages in the markdown output. |
| do_code_enrichment | boolean | No | `false` | If enabled, perform OCR code enrichment. Boolean. Optional, defaults to false. |
| do_formula_enrichment | boolean | No | `false` | If enabled, perform formula OCR, return LaTeX code. Boolean. Optional, defaults to false. |
| do_picture_classification | boolean | No | `false` | If enabled, classify pictures in documents. Boolean. Optional, defaults to false. |
| do_picture_description | boolean | No | `false` | If enabled, describe pictures in documents. Boolean. Optional, defaults to false. |
| picture_description_area_threshold | number | No | `0.05` | Minimum percentage of the area for a picture to be processed with the models. |
| picture_description_local | [PictureDescriptionLocal](#picturedescriptionlocal) | null | No | - | Options for running a local vision-language model in the picture description. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with picture_description_api. |
| picture_description_api | [PictureDescriptionApi](#picturedescriptionapi) | null | No | - | API details for using a vision-language model in the picture description. This parameter is mutually exclusive with picture_description_local. |
| vlm_pipeline_model | [VlmModelType](#vlmmodeltype) | null | No | - | Preset of local and API models for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model_api. Use the other options for more parameters. |
| vlm_pipeline_model_local | [VlmModelLocal](#vlmmodellocal) | null | No | - | Options for running a local vision-language model for the vlm pipeline. The parameters refer to a model hosted on Hugging Face. This parameter is mutually exclusive with vlm_pipeline_model_api and vlm_pipeline_model. |
| vlm_pipeline_model_api | [VlmModelApi](#vlmmodelapi) | null | No | - | API details for using a vision-language model for the vlm pipeline. This parameter is mutually exclusive with vlm_pipeline_model_local and vlm_pipeline_model. |

---

## CoordOrigin

CoordOrigin.

**Type:** `string` (enum)

**Values:**

- `TOPLEFT`
- `BOTTOMLEFT`

---

## DescriptionAnnotation

DescriptionAnnotation.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `description` | Kind |
| text | string | Yes | - | Text |
| provenance | string | Yes | - | Provenance |

---

## DescriptionMetaField

Description metadata field.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| confidence | number | No | - | The confidence of the prediction. |
| created_by | string | null | No | - | The origin of the prediction. |
| text | string | Yes | - | Text |

---

## DoclingComponentType

**Type:** `string` (enum)

**Values:**

- `document_backend`
- `model`
- `doc_assembler`
- `user_input`
- `pipeline`

---

## DoclingDocument

DoclingDocument.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| schema_name | string | No | `DoclingDocument` | Schema Name |
| version | string | No | `1.8.0` | Version |
| name | string | Yes | - | Name |
| origin | [DocumentOrigin](#documentorigin) | null | No | - | - |
| furniture | [GroupItem](#groupitem) | No | `{"self_ref": "#/furniture", "children": [], "content_layer": "furniture", "name": "_root_", "label": "unspecified"}` | - |
| body | [GroupItem](#groupitem) | No | `{"self_ref": "#/body", "children": [], "content_layer": "body", "name": "_root_", "label": "unspecified"}` | - |
| groups | array of [ListGroup](#listgroup) | [InlineGroup](#inlinegroup) | [GroupItem](#groupitem) | No | `[]` | Groups |
| texts | array of [TitleItem](#titleitem) | [SectionHeaderItem](#sectionheaderitem) | [ListItem](#listitem) | [CodeItem](#codeitem) | [FormulaItem](#formulaitem) | [TextItem](#textitem) | No | `[]` | Texts |
| pictures | array of [PictureItem](#pictureitem) | No | `[]` | Pictures |
| tables | array of [TableItem](#tableitem) | No | `[]` | Tables |
| key_value_items | array of [KeyValueItem](#keyvalueitem) | No | `[]` | Key Value Items |
| form_items | array of [FormItem](#formitem) | No | `[]` | Form Items |
| pages | object | No | `{}` | Pages |

---

## DocumentOrigin

FileSource.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| mimetype | string | Yes | - | Mimetype |
| binary_hash | integer | Yes | - | Binary Hash |
| filename | string | Yes | - | Filename |
| uri | string | null | No | - | Uri |

---

## ErrorItem

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| component_type | [DoclingComponentType](#doclingcomponenttype) | Yes | - | - |
| module_name | string | Yes | - | Module Name |
| error_message | string | Yes | - | Error Message |

---

## ExportDocumentResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| filename | string | Yes | - | Filename |
| md_content | string | null | No | - | Md Content |
| json_content | [DoclingDocument](#doclingdocument) | null | No | - | - |
| html_content | string | null | No | - | Html Content |
| text_content | string | null | No | - | Text Content |
| doctags_content | string | null | No | - | Doctags Content |

---

## ExportResult

Container of all exported content.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `ExportResult` | Kind |
| content | [ExportDocumentResponse](#exportdocumentresponse) | Yes | - | - |
| status | [ConversionStatus](#conversionstatus) | Yes | - | - |
| errors | array of [ErrorItem](#erroritem) | No | `[]` | Errors |
| timings | object | No | `{}` | Timings |

---

## FileSourceRequest

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| base64_string | string | Yes | - | Content of the file serialized in base64. For example it can be obtained via `base64 -w 0 /path/to/file/pdf-to-convert.pdf`. |
| filename | string | Yes | - | Filename of the uploaded document |
| kind | string | No | `file` | Kind |

---

## FloatingMeta

Metadata model for floating.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| summary | [SummaryMetaField](#summarymetafield) | null | No | - | - |
| description | [DescriptionMetaField](#descriptionmetafield) | null | No | - | - |

---

## FormItem

FormItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [FloatingMeta](#floatingmeta) | null | No | - | - |
| label | string | No | `form` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| captions | array of [RefItem](#refitem) | No | `[]` | Captions |
| references | array of [RefItem](#refitem) | No | `[]` | References |
| footnotes | array of [RefItem](#refitem) | No | `[]` | Footnotes |
| image | [ImageRef](#imageref) | null | No | - | - |
| graph | [GraphData](#graphdata) | Yes | - | - |

---

## Formatting

Formatting.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| bold | boolean | No | `false` | Bold |
| italic | boolean | No | `false` | Italic |
| underline | boolean | No | `false` | Underline |
| strikethrough | boolean | No | `false` | Strikethrough |
| script | [Script](#script) | No | `baseline` | - |

---

## FormulaItem

FormulaItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| label | string | No | `formula` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| orig | string | Yes | - | Orig |
| text | string | Yes | - | Text |
| formatting | [Formatting](#formatting) | null | No | - | - |
| hyperlink | string | string | null | No | - | Hyperlink |

---

## GraphCell

GraphCell.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| label | [GraphCellLabel](#graphcelllabel) | Yes | - | - |
| cell_id | integer | Yes | - | Cell Id |
| text | string | Yes | - | Text |
| orig | string | Yes | - | Orig |
| prov | [ProvenanceItem](#provenanceitem) | null | No | - | - |
| item_ref | [RefItem](#refitem) | null | No | - | - |

---

## GraphCellLabel

GraphCellLabel.

**Type:** `string` (enum)

**Values:**

- `unspecified`
- `key`
- `value`
- `checkbox`

---

## GraphData

GraphData.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| cells | array of [GraphCell](#graphcell) | No | - | Cells |
| links | array of [GraphLink](#graphlink) | No | - | Links |

---

## GraphLink

GraphLink.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| label | [GraphLinkLabel](#graphlinklabel) | Yes | - | - |
| source_cell_id | integer | Yes | - | Source Cell Id |
| target_cell_id | integer | Yes | - | Target Cell Id |

---

## GraphLinkLabel

GraphLinkLabel.

**Type:** `string` (enum)

**Values:**

- `unspecified`
- `to_value`
- `to_key`
- `to_parent`
- `to_child`

---

## GroupItem

GroupItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| name | string | No | `group` | Name |
| label | [GroupLabel](#grouplabel) | No | `unspecified` | - |

---

## GroupLabel

GroupLabel.

**Type:** `string` (enum)

**Values:**

- `unspecified`
- `list`
- `ordered_list`
- `chapter`
- `section`
- `sheet`
- `slide`
- `form_area`
- `key_value_area`
- `comment_section`
- `inline`
- `picture_area`

---

## HTTPValidationError

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| detail | array of [ValidationError](#validationerror) | No | - | Detail |

---

## HealthCheckResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| status | string | No | `ok` | Status |

---

## HierarchicalChunkerOptions

Configuration options for the HierarchicalChunker.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| chunker | string | No | `hierarchical` | Chunker |
| use_markdown_tables | boolean | No | `false` | Use markdown table format instead of triplets for table serialization. |
| include_raw_text | boolean | No | `false` | Include both raw_text and text (contextualized) in response. If False, only text is included. |

---

## HierarchicalChunkerOptionsDocumentsRequest

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| convert_options | [ConvertDocumentsRequestOptions](#convertdocumentsrequestoptions) | No | `{"from_formats": ["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"], "to_formats": ["md"], "image_export_mode": "embedded", "do_ocr": true, "force_ocr": false, "ocr_engine": "easyocr", "pdf_backend": "dlparse_v4", "table_mode": "accurate", "table_cell_matching": true, "pipeline": "standard", "page_range": [1, 9223372036854775807], "document_timeout": 604800.0, "abort_on_error": false, "do_table_structure": true, "include_images": true, "images_scale": 2.0, "md_page_break_placeholder": "", "do_code_enrichment": false, "do_formula_enrichment": false, "do_picture_classification": false, "do_picture_description": false, "picture_description_area_threshold": 0.05}` | Conversion options. |
| sources | array of any | Yes | - | List of input document sources to process. |
| include_converted_doc | boolean | No | `false` | If true, the output will include both the chunks and the converted document. |
| target | any | No | `{"kind": "inbody"}` | Specification for the type of output target. |
| chunking_options | [HierarchicalChunkerOptions](#hierarchicalchunkeroptions) | No | - | Options specific to the chunker. |

---

## HttpSourceRequest

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| url | string | Yes | - | HTTP url to process |
| headers | object | No | `{}` | Additional headers used to fetch the urls, e.g. authorization, agent, etc |
| kind | string | No | `http` | Kind |

---

## HybridChunkerOptions

Configuration options for the HybridChunker.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| chunker | string | No | `hybrid` | Chunker |
| use_markdown_tables | boolean | No | `false` | Use markdown table format instead of triplets for table serialization. |
| include_raw_text | boolean | No | `false` | Include both raw_text and text (contextualized) in response. If False, only text is included. |
| max_tokens | integer | null | No | - | Maximum number of tokens per chunk. When left to none, the value is automatically extracted from the tokenizer. |
| tokenizer | string | No | `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace model name for custom tokenization. If not specified, uses 'sentence-transformers/all-MiniLM-L6-v2' as default. |
| merge_peers | boolean | No | `true` | Merge undersized successive chunks with same headings. |

---

## HybridChunkerOptionsDocumentsRequest

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| convert_options | [ConvertDocumentsRequestOptions](#convertdocumentsrequestoptions) | No | `{"from_formats": ["docx", "pptx", "html", "image", "pdf", "asciidoc", "md", "csv", "xlsx", "xml_uspto", "xml_jats", "mets_gbs", "json_docling", "audio", "vtt"], "to_formats": ["md"], "image_export_mode": "embedded", "do_ocr": true, "force_ocr": false, "ocr_engine": "easyocr", "pdf_backend": "dlparse_v4", "table_mode": "accurate", "table_cell_matching": true, "pipeline": "standard", "page_range": [1, 9223372036854775807], "document_timeout": 604800.0, "abort_on_error": false, "do_table_structure": true, "include_images": true, "images_scale": 2.0, "md_page_break_placeholder": "", "do_code_enrichment": false, "do_formula_enrichment": false, "do_picture_classification": false, "do_picture_description": false, "picture_description_area_threshold": 0.05}` | Conversion options. |
| sources | array of any | Yes | - | List of input document sources to process. |
| include_converted_doc | boolean | No | `false` | If true, the output will include both the chunks and the converted document. |
| target | any | No | `{"kind": "inbody"}` | Specification for the type of output target. |
| chunking_options | [HybridChunkerOptions](#hybridchunkeroptions) | No | - | Options specific to the chunker. |

---

## ImageRef

ImageRef.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| mimetype | string | Yes | - | Mimetype |
| dpi | integer | Yes | - | Dpi |
| size | [Size](#size) | Yes | - | - |
| uri | string | string | Yes | - | Uri |

---

## ImageRefMode

ImageRefMode.

**Type:** `string` (enum)

**Values:**

- `placeholder`
- `embedded`
- `referenced`

---

## InBodyTarget

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `inbody` | Kind |

---

## InferenceFramework

**Type:** `string` (enum)

**Values:**

- `mlx`
- `transformers`
- `vllm`

---

## InlineGroup

InlineGroup.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| name | string | No | `group` | Name |
| label | string | No | `inline` | Label |

---

## InputFormat

A document format supported by document backend parsers.

**Type:** `string` (enum)

**Values:**

- `docx`
- `pptx`
- `html`
- `image`
- `pdf`
- `asciidoc`
- `md`
- `csv`
- `xlsx`
- `xml_uspto`
- `xml_jats`
- `mets_gbs`
- `json_docling`
- `audio`
- `vtt`

---

## KeyValueItem

KeyValueItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [FloatingMeta](#floatingmeta) | null | No | - | - |
| label | string | No | `key_value_region` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| captions | array of [RefItem](#refitem) | No | `[]` | Captions |
| references | array of [RefItem](#refitem) | No | `[]` | References |
| footnotes | array of [RefItem](#refitem) | No | `[]` | Footnotes |
| image | [ImageRef](#imageref) | null | No | - | - |
| graph | [GraphData](#graphdata) | Yes | - | - |

---

## ListGroup

ListGroup.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| name | string | No | `group` | Name |
| label | string | No | `list` | Label |

---

## ListItem

SectionItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| label | string | No | `list_item` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| orig | string | Yes | - | Orig |
| text | string | Yes | - | Text |
| formatting | [Formatting](#formatting) | null | No | - | - |
| hyperlink | string | string | null | No | - | Hyperlink |
| enumerated | boolean | No | `false` | Enumerated |
| marker | string | No | - | Marker |

---

## MiscAnnotation

MiscAnnotation.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `misc` | Kind |
| content | object | Yes | - | Content |

---

## MoleculeMetaField

Molecule metadata field.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| confidence | number | No | - | The confidence of the prediction. |
| created_by | string | null | No | - | The origin of the prediction. |
| smi | string | Yes | - | The SMILES representation of the molecule. |

---

## OutputFormat

**Type:** `string` (enum)

**Values:**

- `md`
- `json`
- `html`
- `html_split_page`
- `text`
- `doctags`

---

## PageItem

PageItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| size | [Size](#size) | Yes | - | - |
| image | [ImageRef](#imageref) | null | No | - | - |
| page_no | integer | Yes | - | Page No |

---

## PdfBackend

Enum of valid PDF backends.

**Type:** `string` (enum)

**Values:**

- `pypdfium2`
- `dlparse_v1`
- `dlparse_v2`
- `dlparse_v4`

---

## PictureBarChartData

Represents data of a bar chart.

Attributes:
    kind (Literal["bar_chart_data"]): The type of the chart.
    x_axis_label (str): The label for the x-axis.
    y_axis_label (str): The label for the y-axis.
    bars (List[ChartBar]): A list of bars in the chart.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `bar_chart_data` | Kind |
| title | string | Yes | - | Title |
| x_axis_label | string | Yes | - | X Axis Label |
| y_axis_label | string | Yes | - | Y Axis Label |
| bars | array of [ChartBar](#chartbar) | Yes | - | Bars |

---

## PictureClassificationClass

PictureClassificationData.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| class_name | string | Yes | - | Class Name |
| confidence | number | Yes | - | Confidence |

---

## PictureClassificationData

PictureClassificationData.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `classification` | Kind |
| provenance | string | Yes | - | Provenance |
| predicted_classes | array of [PictureClassificationClass](#pictureclassificationclass) | Yes | - | Predicted Classes |

---

## PictureClassificationMetaField

Picture classification metadata field.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| predictions | array of [PictureClassificationPrediction](#pictureclassificationprediction) | No | - | Predictions |

---

## PictureClassificationPrediction

Picture classification instance.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| confidence | number | No | - | The confidence of the prediction. |
| created_by | string | null | No | - | The origin of the prediction. |
| class_name | string | Yes | - | Class Name |

---

## PictureDescriptionApi

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| url | string | Yes | - | Endpoint which accepts openai-api compatible requests. |
| headers | object | No | `{}` | Headers used for calling the API endpoint. For example, it could include authentication headers. |
| params | object | No | `{}` | Model parameters. |
| timeout | number | No | `20` | Timeout for the API request. |
| concurrency | integer | No | `1` | Maximum number of concurrent requests to the API. |
| prompt | string | No | `Describe this image in a few sentences.` | Prompt used when calling the vision-language model. |

---

## PictureDescriptionLocal

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| repo_id | string | Yes | - | Repository id from the Hugging Face Hub. |
| prompt | string | No | `Describe this image in a few sentences.` | Prompt used when calling the vision-language model. |
| generation_config | object | No | `{"max_new_tokens": 200, "do_sample": false}` | Config from https://huggingface.co/docs/transformers/en/main_classes/text_generation#transformers.GenerationConfig |

---

## PictureItem

PictureItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [PictureMeta](#picturemeta) | null | No | - | - |
| label | string (enum) | No | `picture` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| captions | array of [RefItem](#refitem) | No | `[]` | Captions |
| references | array of [RefItem](#refitem) | No | `[]` | References |
| footnotes | array of [RefItem](#refitem) | No | `[]` | Footnotes |
| image | [ImageRef](#imageref) | null | No | - | - |
| annotations | array of any | No | `[]` | Annotations |

---

## PictureLineChartData

Represents data of a line chart.

Attributes:
    kind (Literal["line_chart_data"]): The type of the chart.
    x_axis_label (str): The label for the x-axis.
    y_axis_label (str): The label for the y-axis.
    lines (List[ChartLine]): A list of lines in the chart.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `line_chart_data` | Kind |
| title | string | Yes | - | Title |
| x_axis_label | string | Yes | - | X Axis Label |
| y_axis_label | string | Yes | - | Y Axis Label |
| lines | array of [ChartLine](#chartline) | Yes | - | Lines |

---

## PictureMeta

Metadata model for pictures.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| summary | [SummaryMetaField](#summarymetafield) | null | No | - | - |
| description | [DescriptionMetaField](#descriptionmetafield) | null | No | - | - |
| classification | [PictureClassificationMetaField](#pictureclassificationmetafield) | null | No | - | - |
| molecule | [MoleculeMetaField](#moleculemetafield) | null | No | - | - |
| tabular_chart | [TabularChartMetaField](#tabularchartmetafield) | null | No | - | - |

---

## PictureMoleculeData

PictureMoleculeData.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `molecule_data` | Kind |
| smi | string | Yes | - | Smi |
| confidence | number | Yes | - | Confidence |
| class_name | string | Yes | - | Class Name |
| segmentation | array of array of any | Yes | - | Segmentation |
| provenance | string | Yes | - | Provenance |

---

## PicturePieChartData

Represents data of a pie chart.

Attributes:
    kind (Literal["pie_chart_data"]): The type of the chart.
    slices (List[ChartSlice]): A list of slices in the pie chart.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `pie_chart_data` | Kind |
| title | string | Yes | - | Title |
| slices | array of [ChartSlice](#chartslice) | Yes | - | Slices |

---

## PictureScatterChartData

Represents data of a scatter chart.

Attributes:
    kind (Literal["scatter_chart_data"]): The type of the chart.
    x_axis_label (str): The label for the x-axis.
    y_axis_label (str): The label for the y-axis.
    points (List[ChartPoint]): A list of points in the scatter chart.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `scatter_chart_data` | Kind |
| title | string | Yes | - | Title |
| x_axis_label | string | Yes | - | X Axis Label |
| y_axis_label | string | Yes | - | Y Axis Label |
| points | array of [ChartPoint](#chartpoint) | Yes | - | Points |

---

## PictureStackedBarChartData

Represents data of a stacked bar chart.

Attributes:
    kind (Literal["stacked_bar_chart_data"]): The type of the chart.
    x_axis_label (str): The label for the x-axis.
    y_axis_label (str): The label for the y-axis.
    stacked_bars (List[ChartStackedBar]): A list of stacked bars in the chart.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `stacked_bar_chart_data` | Kind |
| title | string | Yes | - | Title |
| x_axis_label | string | Yes | - | X Axis Label |
| y_axis_label | string | Yes | - | Y Axis Label |
| stacked_bars | array of [ChartStackedBar](#chartstackedbar) | Yes | - | Stacked Bars |

---

## PictureTabularChartData

Base class for picture chart data.

Attributes:
    title (str): The title of the chart.
    chart_data (TableData): Chart data in the table format.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `tabular_chart_data` | Kind |
| title | string | Yes | - | Title |
| chart_data | [TableData](#tabledata) | Yes | - | - |

---

## PresignedUrlConvertDocumentResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| processing_time | number | Yes | - | Processing Time |
| num_converted | integer | Yes | - | Num Converted |
| num_succeeded | integer | Yes | - | Num Succeeded |
| num_failed | integer | Yes | - | Num Failed |

---

## ProcessingPipeline

**Type:** `string` (enum)

**Values:**

- `legacy`
- `standard`
- `vlm`
- `asr`

---

## ProfilingItem

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| scope | [ProfilingScope](#profilingscope) | Yes | - | - |
| count | integer | No | `0` | Count |
| times | array of number | No | `[]` | Times |
| start_timestamps | array of string | No | `[]` | Start Timestamps |

---

## ProfilingScope

**Type:** `string` (enum)

**Values:**

- `page`
- `document`

---

## ProvenanceItem

ProvenanceItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| page_no | integer | Yes | - | Page No |
| bbox | [BoundingBox](#boundingbox) | Yes | - | - |
| charspan | array of any | Yes | - | Charspan |

---

## PutTarget

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `put` | Kind |
| url | string | Yes | - | Url |

---

## RefItem

RefItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| $ref | string | Yes | - | $Ref |

---

## ResponseFormat

**Type:** `string` (enum)

**Values:**

- `doctags`
- `markdown`
- `html`
- `otsl`
- `plaintext`

---

## RichTableCell

RichTableCell.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| bbox | [BoundingBox](#boundingbox) | null | No | - | - |
| row_span | integer | No | `1` | Row Span |
| col_span | integer | No | `1` | Col Span |
| start_row_offset_idx | integer | Yes | - | Start Row Offset Idx |
| end_row_offset_idx | integer | Yes | - | End Row Offset Idx |
| start_col_offset_idx | integer | Yes | - | Start Col Offset Idx |
| end_col_offset_idx | integer | Yes | - | End Col Offset Idx |
| text | string | Yes | - | Text |
| column_header | boolean | No | `false` | Column Header |
| row_header | boolean | No | `false` | Row Header |
| row_section | boolean | No | `false` | Row Section |
| fillable | boolean | No | `false` | Fillable |
| ref | [RefItem](#refitem) | Yes | - | - |

---

## S3SourceRequest

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| endpoint | string | Yes | - | S3 service endpoint, without protocol. Required. |
| verify_ssl | boolean | No | `true` | If enabled, SSL will be used to connect to s3. Boolean. Optional, defaults to true |
| access_key | string | Yes | - | S3 access key. Required. |
| secret_key | string | Yes | - | S3 secret key. Required. |
| bucket | string | Yes | - | S3 bucket name. Required. |
| key_prefix | string | No | `""` | Prefix for the object keys on s3. Optional, defaults to empty. |
| kind | string | No | `s3` | Kind |

---

## S3Target

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| endpoint | string | Yes | - | S3 service endpoint, without protocol. Required. |
| verify_ssl | boolean | No | `true` | If enabled, SSL will be used to connect to s3. Boolean. Optional, defaults to true |
| access_key | string | Yes | - | S3 access key. Required. |
| secret_key | string | Yes | - | S3 secret key. Required. |
| bucket | string | Yes | - | S3 bucket name. Required. |
| key_prefix | string | No | `""` | Prefix for the object keys on s3. Optional, defaults to empty. |
| kind | string | No | `s3` | Kind |

---

## Script

Text script position.

**Type:** `string` (enum)

**Values:**

- `baseline`
- `sub`
- `super`

---

## SectionHeaderItem

SectionItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| label | string | No | `section_header` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| orig | string | Yes | - | Orig |
| text | string | Yes | - | Text |
| formatting | [Formatting](#formatting) | null | No | - | - |
| hyperlink | string | string | null | No | - | Hyperlink |
| level | integer | No | `1` | Level |

---

## Size

Size.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| width | number | No | - | Width |
| height | number | No | - | Height |

---

## SummaryMetaField

Summary data.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| confidence | number | No | - | The confidence of the prediction. |
| created_by | string | null | No | - | The origin of the prediction. |
| text | string | Yes | - | Text |

---

## TableCell

TableCell.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| bbox | [BoundingBox](#boundingbox) | null | No | - | - |
| row_span | integer | No | `1` | Row Span |
| col_span | integer | No | `1` | Col Span |
| start_row_offset_idx | integer | Yes | - | Start Row Offset Idx |
| end_row_offset_idx | integer | Yes | - | End Row Offset Idx |
| start_col_offset_idx | integer | Yes | - | Start Col Offset Idx |
| end_col_offset_idx | integer | Yes | - | End Col Offset Idx |
| text | string | Yes | - | Text |
| column_header | boolean | No | `false` | Column Header |
| row_header | boolean | No | `false` | Row Header |
| row_section | boolean | No | `false` | Row Section |
| fillable | boolean | No | `false` | Fillable |

---

## TableData

BaseTableData.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| table_cells | array of [RichTableCell](#richtablecell) | [TableCell](#tablecell) | No | `[]` | Table Cells |
| num_rows | integer | No | `0` | Num Rows |
| num_cols | integer | No | `0` | Num Cols |
| grid | array of array of [TableCell](#tablecell) | Yes | - | grid. |

---

## TableFormerMode

Modes for the TableFormer model.

**Type:** `string` (enum)

**Values:**

- `fast`
- `accurate`

---

## TableItem

TableItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [FloatingMeta](#floatingmeta) | null | No | - | - |
| label | string (enum) | No | `table` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| captions | array of [RefItem](#refitem) | No | `[]` | Captions |
| references | array of [RefItem](#refitem) | No | `[]` | References |
| footnotes | array of [RefItem](#refitem) | No | `[]` | Footnotes |
| image | [ImageRef](#imageref) | null | No | - | - |
| data | [TableData](#tabledata) | Yes | - | - |
| annotations | array of any | No | `[]` | Annotations |

---

## TabularChartMetaField

Tabular chart metadata field.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| confidence | number | No | - | The confidence of the prediction. |
| created_by | string | null | No | - | The origin of the prediction. |
| title | string | null | No | - | Title |
| chart_data | [TableData](#tabledata) | Yes | - | - |

---

## TargetName

**Type:** `string` (enum)

**Values:**

- `inbody`
- `zip`

---

## TaskProcessingMeta

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| num_docs | integer | Yes | - | Num Docs |
| num_processed | integer | No | `0` | Num Processed |
| num_succeeded | integer | No | `0` | Num Succeeded |
| num_failed | integer | No | `0` | Num Failed |

---

## TaskStatusResponse

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| task_id | string | Yes | - | Task Id |
| task_type | [TaskType](#tasktype) | Yes | - | - |
| task_status | string | Yes | - | Task Status |
| task_position | integer | null | No | - | Task Position |
| task_meta | [TaskProcessingMeta](#taskprocessingmeta) | null | No | - | - |

---

## TaskType

**Type:** `string` (enum)

**Values:**

- `convert`
- `chunk`

---

## TextItem

TextItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| label | string (enum) | Yes | - | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| orig | string | Yes | - | Orig |
| text | string | Yes | - | Text |
| formatting | [Formatting](#formatting) | null | No | - | - |
| hyperlink | string | string | null | No | - | Hyperlink |

---

## TitleItem

TitleItem.

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| self_ref | string | Yes | - | Self Ref |
| parent | [RefItem](#refitem) | null | No | - | - |
| children | array of [RefItem](#refitem) | No | `[]` | Children |
| content_layer | [ContentLayer](#contentlayer) | No | `body` | - |
| meta | [BaseMeta](#basemeta) | null | No | - | - |
| label | string | No | `title` | Label |
| prov | array of [ProvenanceItem](#provenanceitem) | No | `[]` | Prov |
| orig | string | Yes | - | Orig |
| text | string | Yes | - | Text |
| formatting | [Formatting](#formatting) | null | No | - | - |
| hyperlink | string | string | null | No | - | Hyperlink |

---

## TransformersModelType

**Type:** `string` (enum)

**Values:**

- `automodel`
- `automodel-vision2seq`
- `automodel-causallm`
- `automodel-imagetexttotext`

---

## ValidationError

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| loc | array of string | integer | Yes | - | Location |
| msg | string | Yes | - | Message |
| type | string | Yes | - | Error Type |

---

## VlmModelApi

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| url | string | Yes | - | Endpoint which accepts openai-api compatible requests. |
| headers | object | No | `{}` | Headers used for calling the API endpoint. For example, it could include authentication headers. |
| params | object | No | `{}` | Model parameters. |
| timeout | number | No | `60` | Timeout for the API request. |
| concurrency | integer | No | `1` | Maximum number of concurrent requests to the API. |
| prompt | string | No | `Convert this page to docling.` | Prompt used when calling the vision-language model. |
| scale | number | No | `2.0` | Scale factor of the images used. |
| response_format | [ResponseFormat](#responseformat) | Yes | - | Type of response generated by the model. |
| temperature | number | No | `0.0` | Temperature parameter controlling the reproducibility of the result. |

---

## VlmModelLocal

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| repo_id | string | Yes | - | Repository id from the Hugging Face Hub. |
| prompt | string | No | `Convert this page to docling.` | Prompt used when calling the vision-language model. |
| scale | number | No | `2.0` | Scale factor of the images used. |
| response_format | [ResponseFormat](#responseformat) | Yes | - | Type of response generated by the model. |
| inference_framework | [InferenceFramework](#inferenceframework) | Yes | - | Inference framework to use. |
| transformers_model_type | [TransformersModelType](#transformersmodeltype) | No | `automodel` | Type of transformers auto-model to use. |
| extra_generation_config | object | No | `{"max_new_tokens": 800, "do_sample": false}` | Config from https://huggingface.co/docs/transformers/en/main_classes/text_generation#transformers.GenerationConfig |
| temperature | number | No | `0.0` | Temperature parameter controlling the reproducibility of the result. |

---

## VlmModelType

**Type:** `string` (enum)

**Values:**

- `smoldocling`
- `smoldocling_vllm`
- `granite_vision`
- `granite_vision_vllm`
- `granite_vision_ollama`
- `got_ocr_2`
- `granite_docling`
- `granite_docling_vllm`

---

## ZipTarget

**Type:** `object`

**Properties:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| kind | string | No | `zip` | Kind |

---

## ocr_engines_enum

**Type:** `string` (enum)

**Values:**

- `auto`
- `easyocr`
- `ocrmac`
- `rapidocr`
- `tesserocr`
- `tesseract`

---

