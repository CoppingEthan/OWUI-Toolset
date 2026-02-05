# https://docs.openwebui.com/getting-started/quick-start/starting-with-openai

  * [](/)
  * [🚀 Getting Started](/getting-started/)
  * [Quick Start](/getting-started/quick-start/)
  * Starting With OpenAI



On this page

# Starting With OpenAI

## Overview​

Open WebUI makes it easy to connect and use OpenAI and other OpenAI-compatible APIs. This guide will walk you through adding your API key, setting the correct endpoint, and selecting models — so you can start chatting right away.

* * *

## Important: Protocols, Not Providers​

Open WebUI is a **protocol-centric** platform. While we provide first-class support for OpenAI models, we do so exclusively through the **OpenAI Chat Completions API protocol**.

We do **not** support proprietary, non-standard APIs such as OpenAI’s new stateful **Responses API**. Instead, Open WebUI focuses on universal standards that are shared across dozens of providers. This approach keeps Open WebUI fast, stable, and truly open-sourced.

* * *

## Step 1: Get Your OpenAI API Key​

To use OpenAI models (such as GPT-4 or o3-mini), you need an API key from a supported provider.

You can use:

  * **OpenAI** directly (<https://platform.openai.com/account/api-keys>)
  * **Azure OpenAI**
  * **Anthropic** (via their [OpenAI-compatible endpoint](https://platform.claude.com/docs/en/api/openai-sdk))
  * **Google Gemini** (via their [OpenAI-compatible endpoint](https://generativelanguage.googleapis.com/v1beta/openai/))
  * **DeepSeek** (<https://platform.deepseek.com/>)
  * **MiniMax** (<https://platform.minimax.io/>)
  * **Proxies & Aggregators**: OpenRouter, LiteLLM, Helicone.
  * **Local Servers** : Ollama, Llama.cpp, LM Studio, vLLM, LocalAI.



* * *

## Step 2: Add the API Connection in Open WebUI​

Once Open WebUI is running:

  1. Go to the ⚙️ **Admin Settings**.
  2. Navigate to **Connections > OpenAI > Manage** (look for the wrench icon).
  3. Click ➕ **Add New Connection**.



  * Standard / Compatible
  * Azure OpenAI



Use this for **OpenAI** , **DeepSeek** , **MiniMax** , **OpenRouter** , **LocalAI** , **FastChat** , **Helicone** , **LiteLLM** , etc.

  * **Connection Type** : External
  * **URL** : `https://api.openai.com/v1` (or your provider's endpoint)
  * **API Key** : Your secret key (usually starts with `sk-...`)



For Microsoft Azure OpenAI deployments.

  1. Find **Provider Type** and click the button labeled **OpenAI** to switch it to **Azure OpenAI**.
  2. **URL** : Your Azure Endpoint (e.g., `https://my-resource.openai.azure.com`).
  3. **API Version** : e.g., `2024-02-15-preview`.
  4. **API Key** : Your Azure API Key.
  5. **Model IDs (Deployments)** : You **must** add your specific Deployment Names here (e.g., `my-gpt4-deployment`).



### Advanced Configuration​

  * **Model IDs (Filter)** :

    * _Default (Empty)_ : Auto-detects all available models from the provider.
    * _Set_ : Acts as an **Allowlist**. Only the specific model IDs you enter here will be visible to users. Use this to hide older or expensive models.

OpenRouter Recommendation

When using **OpenRouter** , we **highly recommend** :

    1. **Use an allowlist** (add specific Model IDs). OpenRouter exposes thousands of models, which can clutter your model selector and slow down the admin panel if not filtered.
    2. **Enable Model Caching** (`Settings > Connections > Cache Base Model List` or `ENABLE_BASE_MODELS_CACHE=True`). Without caching, page loads can take 10-15+ seconds on first visit due to querying a large number of models. See the [Performance Guide](/troubleshooting/performance) for more details.

MiniMax Whitelisting

Some providers, like **MiniMax** , do not expose their models via a `/models` endpoint. For these providers, you **must** manually add the Model ID (e.g., `MiniMax-M2.1`) to the **Model IDs (Filter)** list for them to appear in the UI.

  * **Prefix ID** :

    * If you connect multiple providers that have models with the same name (e.g., two providers both offering `llama3`), add a prefix here (e.g., `groq/`) to distinguish them. The model will appear as `groq/llama3`.


  4. Click **Save** ✅.



This securely stores your credentials.

Connection Timeout Configuration

If your API provider is slow to respond or you're experiencing timeout issues, you can adjust the model list fetch timeout:
    
    
    # Increase timeout for slow networks (default is 10 seconds)  
    AIOHTTP_CLIENT_TIMEOUT_MODEL_LIST=15  
    

If you've saved an unreachable URL and the UI becomes unresponsive, see the [Model List Loading Issues](/troubleshooting/connection-error#%EF%B8%8F-model-list-loading-issues-slow-ui--unreachable-endpoints) troubleshooting guide for recovery options.

![OpenAI Connection Screen](/assets/images/manage-openai-e56ceeb637bb0fe62a1ab42c8541a135.png)

* * *

## Step 3: Start Using Models​

Once your connection is saved, you can start using models right inside Open WebUI.

🧠 You don’t need to download any models — just select one from the Model Selector and start chatting. If a model is supported by your provider, you’ll be able to use it instantly via their API.

Here’s what model selection looks like:

![OpenAI Model Selector](/assets/images/selector-openai-04d55db5c084bd38028e24b77d6272b9.png)

Simply choose GPT-4, o3-mini, or any compatible model offered by your provider.

* * *

## All Set!​

That’s it! Your OpenAI-compatible API connection is ready to use.

With Open WebUI and OpenAI, you get powerful language models, an intuitive interface, and instant access to chat capabilities — no setup headaches.

If you run into issues or need additional support, visit our [help section](/troubleshooting).

Happy prompting! 🎉

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/getting-started/quick-start/starting-with-openai.mdx)

[PreviousStarting With Ollama](/getting-started/quick-start/starting-with-ollama)[NextStarting with Llama.cpp](/getting-started/quick-start/starting-with-llama-cpp)

  * Overview
  * Important: Protocols, Not Providers
  * Step 1: Get Your OpenAI API Key
  * Step 2: Add the API Connection in Open WebUI
    * Advanced Configuration
  * Step 3: Start Using Models
  * All Set!


