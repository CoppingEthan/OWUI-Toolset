🔎 Open WebUI RAG Tutorial | Open WebUI







[Skip to main content](#__docusaurus_skipToContent_fallback)

[![](/images/logo.png)![](/images/logo-dark.png)

**Open WebUI**](/)[Blog](/blog)

[GitHub](https://github.com/open-webui/open-webui)[Discord](https://discord.com/invite/5rJgQTnV4s)

[![Open WebUI](/sponsors/banners/placeholder.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [🏡 Home](/)
* [🚀 Getting Started](/getting-started/)
* [⭐ Features](/features/)
* [🔨 OpenAPI Tool Servers](/openapi-servers/)
* [🛠️ Troubleshooting](/troubleshooting/)
* [📝 Tutorials](/category/-tutorials)

  + [🔗 Integrations](/category/-integrations)
  + [🐳 Installing Docker](/tutorials/docker-install)
  + [🛠️ Maintenance](/category/️-maintenance)
  + [🎤 Speech To Text](/category/-speech-to-text)
  + [🗨️ Text-to-Speech](/category/️-text-to-speech)
  + [🎨 Image Generation](/tutorials/images)
  + [🌐 Web Search](/category/-web-search)
  + [🔌 Offline Mode](/tutorials/offline-mode)
  + [🔒 HTTPS](/category/-https)
  + [📦 Exporting and Importing Database](/tutorials/database)
  + [🪣 Switching to S3 Storage](/tutorials/s3-storage)
  + [🐍 Jupyter Notebook Integration](/tutorials/jupyter)
  + [💡 Tips & Tricks](/category/-tips--tricks)

    - [🤝 Contributing Tutorials](/tutorials/tips/contributing-tutorial)
    - [🔎 Open WebUI RAG Tutorial](/tutorials/tips/rag-tutorial)
    - [✂️ Reduce RAM Usage](/tutorials/tips/reduce-ram-usage)
    - [💠 SQLite Database Overview](/tutorials/tips/sqlite-database)
    - [⚡ Improve Local LLM Performance with Dedicated Task Models](/tutorials/tips/improve-performance-local)
    - [💡 Special Arguments](/tutorials/tips/special_arguments)
    - [🚀 One-Click Ollama + Open WebUI Launcher](/tutorials/tips/one-click-ollama-launcher)
  + [☁️ Deployment](/tutorials/deployment/)
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

* [📝 Tutorials](/category/-tutorials)
* [💡 Tips & Tricks](/category/-tips--tricks)
* 🔎 Open WebUI RAG Tutorial

On this page

🔎 Open WebUI RAG Tutorial
=========================

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

Tutorial: Configuring RAG with Open WebUI Documentation[​](#tutorial-configuring-rag-with-open-webui-documentation "Direct link to Tutorial: Configuring RAG with Open WebUI Documentation")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

In this tutorial, you will learn how to use **Retrieval-Augmented Generation (RAG)** with Open WebUI to load real-world documentation as a knowledge base. We will walk through how to use the latest **Open WebUI Documentation** as an example for this setup.

---

Overview[​](#overview "Direct link to Overview")
------------------------------------------------

### What is RAG?[​](#what-is-rag "Direct link to What is RAG?")

Retrieval-Augmented Generation (RAG) combines **LLMs** with **retrieved knowledge** from external sources. The system retrieves relevant data from uploaded documents or knowledge bases, enhancing the quality and accuracy of responses.

This tutorial demonstrates how to:

* Upload the latest Open WebUI Documentation as a knowledge base.
* Connect it to a custom model.
* Query the knowledge base for enhanced assistance.

---

Setup[​](#setup "Direct link to Setup")
---------------------------------------

### Step-by-Step Setup: Open WebUI Documentation as Knowledge Base[​](#step-by-step-setup-open-webui-documentation-as-knowledge-base "Direct link to Step-by-Step Setup: Open WebUI Documentation as Knowledge Base")

Follow these steps to set up RAG with **Open WebUI Documentation**:

1. **Download the Documentation**:

   * Download the latest documentation:
     <https://github.com/open-webui/docs/archive/refs/heads/main.zip>
2. **Extract the Files**:

   * Extract the `main.zip` file to get all documentation files.
3. **Locate the Markdown Files**:

   * In the extracted folder, locate all files with `.md` and `.mdx`extensions (tip: search for `*.md*`).
4. **Create a Knowledge Base**:

   * Navigate to **Workspace** > **Knowledge** > **+ Create a Knowledge Base**.
   * Name it: `Open WebUI Documentation`
   * Purpose: **Assistance**
   > Click **Create Knowledge**.
5. **Upload the Files**:

   * Drag and drop the `.md` and `.mdx` files from the extracted folder into the **Open WebUI Documentation** knowledge base.

---

Create and Configure the Model[​](#create-and-configure-the-model "Direct link to Create and Configure the Model")
------------------------------------------------------------------------------------------------------------------

### Create a Custom Model with the Knowledge Base[​](#create-a-custom-model-with-the-knowledge-base "Direct link to Create a Custom Model with the Knowledge Base")

1. **Navigate to Models**:

   * Go to **Workspace** > **Models** > **+ Add New Model**.
2. **Configure the Model**:

   * **Name**: `Open WebUI`
   * **Base Model**: *(Select the appropriate Llama or other available model)*
   * **Knowledge Source**: Select **Open WebUI Documentation** from the dropdown.
3. **Save the Model**.

---

Examples and Usage[​](#examples-and-usage "Direct link to Examples and Usage")
------------------------------------------------------------------------------

### Query the Open WebUI Documentation Model[​](#query-the-open-webui-documentation-model "Direct link to Query the Open WebUI Documentation Model")

1. **Start a New Chat**:

   * Navigate to **New Chat** and select the `Open WebUI` model.
2. **Example Queries**:

   ```
   User: "How do I configure environment variables?"  
   System: "Refer to Section 3.2: Use the `.env` file to manage configurations."
   ```

   ```
   User: "How do I update Open WebUI using Docker?"  
   System: "Refer to `docker/updating.md`: Use `docker pull` and restart the container."
   ```

   With the RAG-enabled model, the system retrieves the most relevant sections from the documentation to answer your query.

---

Next Steps[​](#next-steps "Direct link to Next Steps")
------------------------------------------------------

### Next Steps[​](#next-steps-1 "Direct link to Next Steps")

* **Add More Knowledge**: Continue expanding your knowledge base by adding more documents.

---

With this setup, you can effectively use the **Open WebUI Documentation** to assist users by retrieving relevant information for their queries. Enjoy building and querying your custom knowledge-enhanced models!

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/tips/rag-tutorial.md)

[Previous

🤝 Contributing Tutorials](/tutorials/tips/contributing-tutorial)[Next

✂️ Reduce RAM Usage](/tutorials/tips/reduce-ram-usage)

* [Tutorial: Configuring RAG with Open WebUI Documentation](#tutorial-configuring-rag-with-open-webui-documentation)
* [Overview](#overview)
  + [What is RAG?](#what-is-rag)
* [Setup](#setup)
  + [Step-by-Step Setup: Open WebUI Documentation as Knowledge Base](#step-by-step-setup-open-webui-documentation-as-knowledge-base)
* [Create and Configure the Model](#create-and-configure-the-model)
  + [Create a Custom Model with the Knowledge Base](#create-a-custom-model-with-the-knowledge-base)
* [Examples and Usage](#examples-and-usage)
  + [Query the Open WebUI Documentation Model](#query-the-open-webui-documentation-model)
* [Next Steps](#next-steps)
  + [Next Steps](#next-steps-1)

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
- /features/
- /openapi-servers/
- /troubleshooting/
- /category/-tutorials
- /category/-integrations
- /tutorials/docker-install
- /category/️-maintenance
- /category/-speech-to-text
- /category/️-text-to-speech
- /tutorials/images
- /category/-web-search
- /tutorials/offline-mode
- /category/-https
- /tutorials/database
- /tutorials/s3-storage
- /tutorials/jupyter
- /category/-tips--tricks
- /tutorials/tips/contributing-tutorial
- /tutorials/tips/rag-tutorial
- /tutorials/tips/reduce-ram-usage
- /tutorials/tips/sqlite-database
- /tutorials/tips/improve-performance-local
- /tutorials/tips/special_arguments
- /tutorials/tips/one-click-ollama-launcher
- /tutorials/deployment/
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
- /category/-tutorials
- /category/-tips--tricks
- #tutorial-configuring-rag-with-open-webui-documentation
- #overview
- #what-is-rag
- #setup
- #step-by-step-setup-open-webui-documentation-as-knowledge-base
- https://github.com/open-webui/docs/archive/refs/heads/main.zip
- #create-and-configure-the-model
- #create-a-custom-model-with-the-knowledge-base
- #examples-and-usage
- #query-the-open-webui-documentation-model
- #next-steps
- #next-steps-1
- https://github.com/open-webui/docs/blob/main/docs/tutorials/tips/rag-tutorial.md
- /tutorials/tips/contributing-tutorial
- /tutorials/tips/reduce-ram-usage
- #tutorial-configuring-rag-with-open-webui-documentation
- #overview
- #what-is-rag
- #setup
- #step-by-step-setup-open-webui-documentation-as-knowledge-base
- #create-and-configure-the-model
- #create-a-custom-model-with-the-knowledge-base
- #examples-and-usage
- #query-the-open-webui-documentation-model
- #next-steps
- #next-steps-1
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
