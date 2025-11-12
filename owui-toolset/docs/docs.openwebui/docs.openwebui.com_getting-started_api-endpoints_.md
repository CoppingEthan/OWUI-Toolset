🔗 API Endpoints | Open WebUI







[Skip to main content](#__docusaurus_skipToContent_fallback)

[![](/images/logo.png)![](/images/logo-dark.png)

**Open WebUI**](/)[Blog](/blog)

[GitHub](https://github.com/open-webui/open-webui)[Discord](https://discord.com/invite/5rJgQTnV4s)

[![Open WebUI](/sponsors/banners/placeholder.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [🏡 Home](/)
* [🚀 Getting Started](/getting-started/)

  + [⏱️ Quick Start](/getting-started/quick-start/)
  + [📚 Advanced Topics](/getting-started/advanced-topics/)
  + [🌍 Environment Variable Configuration](/getting-started/env-configuration)
  + [🔄 Updating Open WebUI](/getting-started/updating)
  + [🔗 API Endpoints](/getting-started/api-endpoints)
* [⭐ Features](/features/)
* [🔨 OpenAPI Tool Servers](/openapi-servers/)
* [🛠️ Troubleshooting](/troubleshooting/)
* [📝 Tutorials](/category/-tutorials)
* [📋 FAQ](/faq)
* [🛣️ Roadmap](/roadmap)
* [🔒 Security Policy](/security)
* [🤝 Contributing](/contributing)
* [🌐 Sponsorships](/sponsorships)
* [🎨 Design Guidelines](/brand)
* [⚖️ Open WebUI License](/license)
* [🏢 Open WebUI for Enterprises](/enterprise/)
* [🎯 Our Mission](/mission)
* [👥 Our Team](/team)

Sponsored by Open WebUI

[![Open WebUI](/sponsors/banners/placeholder-mobile.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [🚀 Getting Started](/getting-started/)
* 🔗 API Endpoints

On this page

🔗 API Endpoints
===============

This guide provides essential information on how to interact with the API endpoints effectively to achieve seamless integration and automation using our models. Please note that this is an experimental setup and may undergo future updates for enhancement.

Authentication[​](#authentication "Direct link to Authentication")
------------------------------------------------------------------

To ensure secure access to the API, authentication is required 🛡️. You can authenticate your API requests using the Bearer Token mechanism. Obtain your API key from **Settings > Account** in the Open WebUI, or alternatively, use a JWT (JSON Web Token) for authentication.

Swagger Documentation Links[​](#swagger-documentation-links "Direct link to Swagger Documentation Links")
---------------------------------------------------------------------------------------------------------

important

Make sure to set the `ENV` environment variable to `dev` in order to access the Swagger documentation for any of these services. Without this configuration, the documentation will not be available.

Access detailed API documentation for different services provided by Open WebUI:

| Application | Documentation Path |
| --- | --- |
| Main | `/docs` |

Notable API Endpoints[​](#notable-api-endpoints "Direct link to Notable API Endpoints")
---------------------------------------------------------------------------------------

### 📜 Retrieve All Models[​](#-retrieve-all-models "Direct link to 📜 Retrieve All Models")

* **Endpoint**: `GET /api/models`
* **Description**: Fetches all models created or added via Open WebUI.
* **Example**:

  ```
  curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/models
  ```

### 💬 Chat Completions[​](#-chat-completions "Direct link to 💬 Chat Completions")

* **Endpoint**: `POST /api/chat/completions`
* **Description**: Serves as an OpenAI API compatible chat completion endpoint for models on Open WebUI including Ollama models, OpenAI models, and Open WebUI Function models.
* **Curl Example**:

  ```
  curl -X POST http://localhost:3000/api/chat/completions \  
  -H "Authorization: Bearer YOUR_API_KEY" \  
  -H "Content-Type: application/json" \  
  -d '{  
        "model": "llama3.1",  
        "messages": [  
          {  
            "role": "user",  
            "content": "Why is the sky blue?"  
          }  
        ]  
      }'
  ```
* **Python Example**:

  ```
  import requests  
    
  def chat_with_model(token):  
      url = 'http://localhost:3000/api/chat/completions'  
      headers = {  
          'Authorization': f'Bearer {token}',  
          'Content-Type': 'application/json'  
      }  
      data = {  
        "model": "granite3.1-dense:8b",  
        "messages": [  
          {  
            "role": "user",  
            "content": "Why is the sky blue?"  
          }  
        ]  
      }  
      response = requests.post(url, headers=headers, json=data)  
      return response.json()
  ```

### 🦙 Ollama API Proxy Support[​](#-ollama-api-proxy-support "Direct link to 🦙 Ollama API Proxy Support")

If you want to interact directly with Ollama models—including for embedding generation or raw prompt streaming—Open WebUI offers a transparent passthrough to the native Ollama API via a proxy route.

* **Base URL**: `/ollama/<api>`
* **Reference**: [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)

#### 🔁 Generate Completion (Streaming)[​](#-generate-completion-streaming "Direct link to 🔁 Generate Completion (Streaming)")

```
curl http://localhost:3000/ollama/api/generate -d '{  
  "model": "llama3.2",  
  "prompt": "Why is the sky blue?"  
}'
```

#### 📦 List Available Models[​](#-list-available-models "Direct link to 📦 List Available Models")

```
curl http://localhost:3000/ollama/api/tags
```

#### 🧠 Generate Embeddings[​](#-generate-embeddings "Direct link to 🧠 Generate Embeddings")

```
curl -X POST http://localhost:3000/ollama/api/embed -d '{  
  "model": "llama3.2",  
  "input": ["Open WebUI is great!", "Let's generate embeddings."]  
}'
```

This is ideal for building search indexes, retrieval systems, or custom pipelines using Ollama models behind the Open WebUI.

### 🧩 Retrieval Augmented Generation (RAG)[​](#-retrieval-augmented-generation-rag "Direct link to 🧩 Retrieval Augmented Generation (RAG)")

The Retrieval Augmented Generation (RAG) feature allows you to enhance responses by incorporating data from external sources. Below, you will find the methods for managing files and knowledge collections via the API, and how to use them in chat completions effectively.

#### Uploading Files[​](#uploading-files "Direct link to Uploading Files")

To utilize external data in RAG responses, you first need to upload the files. The content of the uploaded file is automatically extracted and stored in a vector database.

* **Endpoint**: `POST /api/v1/files/`
* **Curl Example**:

  ```
  curl -X POST -H "Authorization: Bearer YOUR_API_KEY" -H "Accept: application/json" \  
  -F "file=@/path/to/your/file" http://localhost:3000/api/v1/files/
  ```
* **Python Example**:

  ```
  import requests  
    
  def upload_file(token, file_path):  
      url = 'http://localhost:3000/api/v1/files/'  
      headers = {  
          'Authorization': f'Bearer {token}',  
          'Accept': 'application/json'  
      }  
      files = {'file': open(file_path, 'rb')}  
      response = requests.post(url, headers=headers, files=files)  
      return response.json()
  ```

#### Adding Files to Knowledge Collections[​](#adding-files-to-knowledge-collections "Direct link to Adding Files to Knowledge Collections")

After uploading, you can group files into a knowledge collection or reference them individually in chats.

* **Endpoint**: `POST /api/v1/knowledge/{id}/file/add`
* **Curl Example**:

  ```
  curl -X POST http://localhost:3000/api/v1/knowledge/{knowledge_id}/file/add \  
  -H "Authorization: Bearer YOUR_API_KEY" \  
  -H "Content-Type: application/json" \  
  -d '{"file_id": "your-file-id-here"}'
  ```
* **Python Example**:

  ```
  import requests  
    
  def add_file_to_knowledge(token, knowledge_id, file_id):  
      url = f'http://localhost:3000/api/v1/knowledge/{knowledge_id}/file/add'  
      headers = {  
          'Authorization': f'Bearer {token}',  
          'Content-Type': 'application/json'  
      }  
      data = {'file_id': file_id}  
      response = requests.post(url, headers=headers, json=data)  
      return response.json()
  ```

#### Using Files and Collections in Chat Completions[​](#using-files-and-collections-in-chat-completions "Direct link to Using Files and Collections in Chat Completions")

You can reference both individual files or entire collections in your RAG queries for enriched responses.

##### Using an Individual File in Chat Completions[​](#using-an-individual-file-in-chat-completions "Direct link to Using an Individual File in Chat Completions")

This method is beneficial when you want to focus the chat model's response on the content of a specific file.

* **Endpoint**: `POST /api/chat/completions`
* **Curl Example**:

  ```
  curl -X POST http://localhost:3000/api/chat/completions \  
  -H "Authorization: Bearer YOUR_API_KEY" \  
  -H "Content-Type: application/json" \  
  -d '{  
        "model": "gpt-4-turbo",  
        "messages": [  
          {"role": "user", "content": "Explain the concepts in this document."}  
        ],  
        "files": [  
          {"type": "file", "id": "your-file-id-here"}  
        ]  
      }'
  ```
* **Python Example**:

  ```
  import requests  
    
  def chat_with_file(token, model, query, file_id):  
      url = 'http://localhost:3000/api/chat/completions'  
      headers = {  
          'Authorization': f'Bearer {token}',  
          'Content-Type': 'application/json'  
      }  
      payload = {  
          'model': model,  
          'messages': [{'role': 'user', 'content': query}],  
          'files': [{'type': 'file', 'id': file_id}]  
      }  
      response = requests.post(url, headers=headers, json=payload)  
      return response.json()
  ```

##### Using a Knowledge Collection in Chat Completions[​](#using-a-knowledge-collection-in-chat-completions "Direct link to Using a Knowledge Collection in Chat Completions")

Leverage a knowledge collection to enhance the response when the inquiry may benefit from a broader context or multiple documents.

* **Endpoint**: `POST /api/chat/completions`
* **Curl Example**:

  ```
  curl -X POST http://localhost:3000/api/chat/completions \  
  -H "Authorization: Bearer YOUR_API_KEY" \  
  -H "Content-Type: application/json" \  
  -d '{  
        "model": "gpt-4-turbo",  
        "messages": [  
          {"role": "user", "content": "Provide insights on the historical perspectives covered in the collection."}  
        ],  
        "files": [  
          {"type": "collection", "id": "your-collection-id-here"}  
        ]  
      }'
  ```
* **Python Example**:

  ```
  import requests  
    
  def chat_with_collection(token, model, query, collection_id):  
      url = 'http://localhost:3000/api/chat/completions'  
      headers = {  
          'Authorization': f'Bearer {token}',  
          'Content-Type': 'application/json'  
      }  
      payload = {  
          'model': model,  
          'messages': [{'role': 'user', 'content': query}],  
          'files': [{'type': 'collection', 'id': collection_id}]  
      }  
      response = requests.post(url, headers=headers, json=payload)  
      return response.json()
  ```

These methods enable effective utilization of external knowledge via uploaded files and curated knowledge collections, enhancing chat applications' capabilities using the Open WebUI API. Whether using files individually or within collections, you can customize the integration based on your specific needs.

Advantages of Using Open WebUI as a Unified LLM Provider[​](#advantages-of-using-open-webui-as-a-unified-llm-provider "Direct link to Advantages of Using Open WebUI as a Unified LLM Provider")
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Open WebUI offers a myriad of benefits, making it an essential tool for developers and businesses alike:

* **Unified Interface**: Simplify your interactions with different LLMs through a single, integrated platform.
* **Ease of Implementation**: Quick start integration with comprehensive documentation and community support.

By following these guidelines, you can swiftly integrate and begin utilizing the Open WebUI API. Should you encounter any issues or have questions, feel free to reach out through our Discord Community or consult the FAQs. Happy coding! 🌟

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/getting-started/api-endpoints.md)

[Previous

🔄 Updating Open WebUI](/getting-started/updating)[Next

⭐ Features](/features/)

* [Authentication](#authentication)
* [Swagger Documentation Links](#swagger-documentation-links)
* [Notable API Endpoints](#notable-api-endpoints)
  + [📜 Retrieve All Models](#-retrieve-all-models)
  + [💬 Chat Completions](#-chat-completions)
  + [🦙 Ollama API Proxy Support](#-ollama-api-proxy-support)
  + [🧩 Retrieval Augmented Generation (RAG)](#-retrieval-augmented-generation-rag)
* [Advantages of Using Open WebUI as a Unified LLM Provider](#advantages-of-using-open-webui-as-a-unified-llm-provider)

Docs

* [Getting Started](/getting-started)
* [FAQ](/faq)
* [Help Improve The Docs](https://github.com/open-webui/docs)

Community

* [GitHub](https://github.com/open-webui/open-webui)
* [Discord](https://discord.gg/5rJgQTnV4s)
* [Reddit](https://www.reddit.com/r/OpenWebUI/)
* [𝕏](https://x.com/OpenWebUI)

More

* [Release Notes](https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md)
* [About](https://openwebui.com)
* [Report a Vulnerability / Responsible Disclosure](https://openwebui.com)

![](/images/logo-dark.png)![](/images/logo-dark.png)

---

### Referenced Links
- #__docusaurus_skipToContent_fallback
- /
- /blog
- https://github.com/open-webui/open-webui
- https://discord.com/invite/5rJgQTnV4s
- https://forms.gle/92mvG3ESYj47zzRL9
- /
- /getting-started/
- /getting-started/quick-start/
- /getting-started/advanced-topics/
- /getting-started/env-configuration
- /getting-started/updating
- /getting-started/api-endpoints
- /features/
- /openapi-servers/
- /troubleshooting/
- /category/-tutorials
- /faq
- /roadmap
- /security
- /contributing
- /sponsorships
- /brand
- /license
- /enterprise/
- /mission
- /team
- https://forms.gle/92mvG3ESYj47zzRL9
- /
- /getting-started/
- #authentication
- #swagger-documentation-links
- #notable-api-endpoints
- #-retrieve-all-models
- #-chat-completions
- #-ollama-api-proxy-support
- https://github.com/ollama/ollama/blob/main/docs/api.md
- #-generate-completion-streaming
- #-list-available-models
- #-generate-embeddings
- #-retrieval-augmented-generation-rag
- #uploading-files
- #adding-files-to-knowledge-collections
- #using-files-and-collections-in-chat-completions
- #using-an-individual-file-in-chat-completions
- #using-a-knowledge-collection-in-chat-completions
- #advantages-of-using-open-webui-as-a-unified-llm-provider
- https://github.com/open-webui/docs/blob/main/docs/getting-started/api-endpoints.md
- /getting-started/updating
- /features/
- #authentication
- #swagger-documentation-links
- #notable-api-endpoints
- #-retrieve-all-models
- #-chat-completions
- #-ollama-api-proxy-support
- #-retrieval-augmented-generation-rag
- #advantages-of-using-open-webui-as-a-unified-llm-provider
- /getting-started
- /faq
- https://github.com/open-webui/docs
- https://github.com/open-webui/open-webui
- https://discord.gg/5rJgQTnV4s
- https://www.reddit.com/r/OpenWebUI/
- https://x.com/OpenWebUI
- https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md
- https://openwebui.com
- https://openwebui.com
