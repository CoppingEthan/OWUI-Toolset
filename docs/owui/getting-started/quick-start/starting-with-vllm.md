# https://docs.openwebui.com/getting-started/quick-start/starting-with-vllm

  * [](/)
  * [🚀 Getting Started](/getting-started/)
  * [Quick Start](/getting-started/quick-start/)
  * Starting With vLLM



On this page

# Starting With vLLM

## Overview​

vLLM provides an OpenAI-compatible API, making it easy to connect to Open WebUI. This guide will show you how to connect your vLLM server.

* * *

## Step 1: Set Up Your vLLM Server​

Make sure your vLLM server is running and accessible. The default API base URL is typically:
    
    
    http://localhost:8000/v1  
    

For remote servers, use the appropriate hostname or IP address.

* * *

## Step 2: Add the API Connection in Open WebUI​

  1. Go to ⚙️ **Admin Settings**.
  2. Navigate to **Connections > OpenAI > Manage** (look for the wrench icon).
  3. Click ➕ **Add New Connection**.
  4. Select the **Standard / Compatible** tab (if available).
  5. Fill in the following:
     * **API URL** : `http://localhost:8000/v1` (or your vLLM server URL)
       * **Docker Users** : Use `http://host.docker.internal:8000/v1` if Open WebUI is in a container.
     * **API Key** : `none` (or leave empty if no key is configured)
  6. Click **Save**.



* * *

## Step 3: Start Using Models​

Select any model that's available on your vLLM server from the Model Selector and start chatting.

Connection Timeout Configuration

If your vLLM server is slow to respond (especially during model loading), you can adjust the timeout:
    
    
    # Increase timeout for slower model initialization (default is 10 seconds)  
    AIOHTTP_CLIENT_TIMEOUT_MODEL_LIST=30  
    

If you've saved an unreachable URL and the UI becomes unresponsive, see the [Model List Loading Issues](/troubleshooting/connection-error#%EF%B8%8F-model-list-loading-issues-slow-ui--unreachable-endpoints) troubleshooting guide.

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/getting-started/quick-start/starting-with-vllm.mdx)

[PreviousStarting with Llama.cpp](/getting-started/quick-start/starting-with-llama-cpp)[NextStarting with OpenAI-Compatible Servers](/getting-started/quick-start/starting-with-openai-compatible)

  * Overview
  * Step 1: Set Up Your vLLM Server
  * Step 2: Add the API Connection in Open WebUI
  * Step 3: Start Using Models


