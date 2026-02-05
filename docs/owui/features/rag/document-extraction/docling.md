# https://docs.openwebui.com/features/rag/document-extraction/docling

  * [](/)
  * [⭐ Features](/features/)
  * [Retrieval Augmented Generation (RAG)](/features/rag/)
  * [Document Extraction](/features/rag/document-extraction/)
  * Docling Document Extraction



On this page

# Docling Document Extraction

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

## 🐤 Docling Document Extraction​

This documentation provides a step-by-step guide to integrating Docling with Open WebUI. Docling is a document processing library designed to transform a wide range of file formats—including PDFs, Word documents, spreadsheets, HTML, and images—into structured data such as JSON or Markdown. With built-in support for layout detection, table parsing, and language-aware processing, Docling streamlines document preparation for AI applications like search, summarization, and retrieval-augmented generation, all through a unified and extensible interface.

## Prerequisites​

  * Open WebUI instance
  * Docker installed on your system
  * Docker network set up for Open WebUI



## Integration Steps​

### Step 1: Run Docling-Serve Container​

**Basic CPU deployment:**
    
    
    docker run -p 5001:5001 \  
      -e DOCLING_SERVE_ENABLE_UI=true \  
      quay.io/docling-project/docling-serve  
    

**GPU deployment (NVIDIA CUDA):**
    
    
    docker run --gpus all -p 5001:5001 \  
      -e DOCLING_SERVE_ENABLE_UI=true \  
      quay.io/docling-project/docling-serve-cu128  
    

**Recommended production deployment with Docker Compose:**
    
    
    version: "3.8"  
    services:  
      docling-serve:  
        image: quay.io/docling-project/docling-serve-cu128:latest  
        container_name: docling-serve  
        ports:  
          - "5001:5001"  
        environment:  
          # Enable the web UI for testing  
          - DOCLING_SERVE_ENABLE_UI=true  
          # CRITICAL: Required for picture description with external LLM APIs  
          - DOCLING_SERVE_ENABLE_REMOTE_SERVICES=true  
          # Maximum wait time for sync requests (seconds) - increase for large documents  
          - DOCLING_SERVE_MAX_SYNC_WAIT=600  
          # Number of local engine workers  
          - DOCLING_SERVE_ENG_LOC_NUM_WORKERS=2  
          # CPU thread configuration  
          - OMP_NUM_THREADS=4  
          - MKL_NUM_THREADS=4  
          # IMPORTANT: Keep at 1 to avoid "Task Not Found" errors  
          - UVICORN_WORKERS=1  
        restart: unless-stopped  
        # For GPU support with NVIDIA:  
        deploy:  
          resources:  
            reservations:  
              devices:  
                - driver: nvidia  
                  count: all  
                  capabilities: [gpu]  
    

Important: UVICORN_WORKERS Setting

When using `UVICORN_WORKERS` greater than 1 with the default `LocalOrchestrator`, you will encounter **"Task Not Found (404)"** errors. This happens because each worker maintains its own in-memory task store, making tasks created by one worker inaccessible to another.

**Always use`UVICORN_WORKERS=1`** unless you have configured a shared state mechanism like Redis.

### Step 2: Configure Open WebUI​

  1. Log in to your Open WebUI instance
  2. Navigate to **Admin Panel** → **Settings** → **Documents**
  3. Change the **Default** content extraction engine dropdown to **Docling**
  4. Set the extraction engine URL to `http://host.docker.internal:5001` (Docker) or `http://localhost:5001` (native)
  5. Save the changes



### Step 3: Configure Picture Description (Optional)​

To enable AI-powered image description within documents:

  1. In the **Documents** tab, activate **Describe Pictures in Documents**
  2. Choose a description mode: `local` or `API`
     * **local** : Vision model runs within the Docling container itself
     * **API** : Docling calls an external service (e.g., Ollama, OpenAI-compatible endpoint)



Required for API Mode

When using `API` mode (calling external services like Ollama), you **MUST** set the following environment variable on docling-serve:
    
    
    DOCLING_SERVE_ENABLE_REMOTE_SERVICES=true  
    

Without this, Docling will reject requests to external services with an `OperationNotAllowed` error.

#### JSON Configuration Examples​

Make sure your configuration is **valid JSON**!

**Local Model Configuration:**
    
    
    {  
      "repo_id": "HuggingFaceTB/SmolVLM-256M-Instruct",  
      "generation_config": {  
        "max_new_tokens": 200,  
        "do_sample": false  
      },  
      "prompt": "Describe this image in a few sentences."  
    }  
    

**API Configuration (Ollama):**
    
    
    {  
      "url": "http://host.docker.internal:11434/v1/chat/completions",  
      "params": {  
        "model": "llava:7b"  
      },  
      "timeout": 60,  
      "prompt": "Describe this image in great detail."  
    }  
    

## Docling-Serve Environment Variables Reference​

Variable| Default| Description  
---|---|---  
`DOCLING_SERVE_ENABLE_UI`| `false`| Enable the web UI at `/ui` endpoint  
`DOCLING_SERVE_ENABLE_REMOTE_SERVICES`| `false`| **Required** for API-based picture description  
`DOCLING_SERVE_MAX_SYNC_WAIT`| `120`| Max seconds to wait for synchronous requests  
`DOCLING_SERVE_ENG_LOC_NUM_WORKERS`| `1`| Number of local engine workers  
`DOCLING_SERVE_ARTIFACTS_PATH`| `/app/data`| Path to store model artifacts  
`UVICORN_WORKERS`| `1`| Number of Uvicorn workers (**keep at 1!**)  
`OMP_NUM_THREADS`| `4`| OpenMP thread count for CPU processing  
`MKL_NUM_THREADS`| `4`| Intel MKL thread count  
  
## Docling Parameters Reference (Open WebUI)​

Configure via `DOCLING_PARAMS` JSON in **Admin Settings > Documents** or via environment variable.

Parameter| Type| Description| Allowed Values  
---|---|---|---  
`pdf_backend`| `string`| PDF parsing engine| `dlparse_v1`, `dlparse_v2`, `dlparse_v4`, `pypdfium2`  
`table_mode`| `string`| Table extraction quality| `fast`, `accurate`  
`ocr_engine`| `string`| OCR library| `tesseract`, `easyocr`, `ocrmac`, `rapidocr`  
`do_ocr`| `bool`| Enable OCR| `true`, `false`  
`force_ocr`| `bool`| Force OCR on digital PDFs| `true`, `false`  
`pipeline`| `string`| Processing complexity| `standard`, `fast`  
`ocr_lang`| `list[string]`| OCR languages| See note below  
  
Language Codes

  * **Tesseract** : 3-letter ISO 639-2 (e.g., `eng`, `deu`, `fra`)
  * **EasyOCR** : 2-letter ISO 639-1 (e.g., `en`, `de`, `fr`)



**Example Configuration:**
    
    
    {  
      "do_ocr": true,  
      "pdf_backend": "dlparse_v4",  
      "table_mode": "accurate",  
      "ocr_engine": "tesseract",  
      "ocr_lang": ["eng"]  
    }  
    

## Verifying the Integration​

  1. Access the Docling UI at `http://127.0.0.1:5001/ui`
  2. Upload a test document and verify it returns markdown output
  3. In Open WebUI, upload a file to a knowledge base and confirm processing completes



## Troubleshooting​

### "Task result not found. Please wait for a completion status."​

**Cause** : Multiple Uvicorn workers with in-memory task storage.

**Solution** : Set `UVICORN_WORKERS=1` in your docling-serve configuration.

### "Connections to remote services is only allowed when set explicitly"​

**Cause** : Picture description API mode requires explicit opt-in.

**Solution** : Add `DOCLING_SERVE_ENABLE_REMOTE_SERVICES=true` to your docling-serve environment.

### 404 Not Found on `/v1alpha/convert/file`​

**Cause** : Using outdated docling-serve version or Open WebUI version.

**Solution** :

  * Update Open WebUI to the latest version (uses `/v1/convert/file`)
  * Update docling-serve to v1.0+ (uses `/v1` API)



### Timeout errors on large documents​

**Cause** : `DOCLING_SERVE_MAX_SYNC_WAIT` is too low for document processing time.

**Solution** : Increase `DOCLING_SERVE_MAX_SYNC_WAIT` (e.g., `600` for 10 minutes).

### OCR not working or incorrect language detection​

**Cause** : Wrong `ocr_lang` format for the selected OCR engine.

**Solution** :

  * Tesseract uses 3-letter codes: `["eng", "deu"]`
  * EasyOCR uses 2-letter codes: `["en", "de"]`



### "Error calling Docling" with no specific details​

**Steps to diagnose:**

  1. Check docling-serve logs: `docker logs docling-serve`
  2. Test Docling directly via the UI at `http://localhost:5001/ui`
  3. Verify network connectivity between Open WebUI and docling-serve containers



## Conclusion​

Integrating Docling with Open WebUI enhances document processing capabilities significantly. Key points to remember:

  * **Always set`UVICORN_WORKERS=1`** to avoid task routing issues
  * **Enable`DOCLING_SERVE_ENABLE_REMOTE_SERVICES=true`** when using API-based picture description
  * **Increase`DOCLING_SERVE_MAX_SYNC_WAIT`** for large documents
  * **Validate JSON syntax** in all configuration fields



[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/rag/document-extraction/docling.md)

[PreviousApache Tika Extraction](/features/rag/document-extraction/apachetika)[NextMistral OCR](/features/rag/document-extraction/mistral-ocr)

  * 🐤 Docling Document Extraction
  * Prerequisites
  * Integration Steps
    * Step 1: Run Docling-Serve Container
    * Step 2: Configure Open WebUI
    * Step 3: Configure Picture Description (Optional)
  * Docling-Serve Environment Variables Reference
  * Docling Parameters Reference (Open WebUI)
  * Verifying the Integration
  * Troubleshooting
    * "Task result not found. Please wait for a completion status."
    * "Connections to remote services is only allowed when set explicitly"
    * 404 Not Found on `/v1alpha/convert/file`
    * Timeout errors on large documents
    * OCR not working or incorrect language detection
    * "Error calling Docling" with no specific details
  * Conclusion


