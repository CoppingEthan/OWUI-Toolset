🧰 Functions | Open WebUI







[Skip to main content](#__docusaurus_skipToContent_fallback)

[![](/images/logo.png)![](/images/logo-dark.png)

**Open WebUI**](/)[Blog](/blog)

[GitHub](https://github.com/open-webui/open-webui)[Discord](https://discord.com/invite/5rJgQTnV4s)

[![Open WebUI](/sponsors/banners/placeholder.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [🏡 Home](/)
* [🚀 Getting Started](/getting-started/)
* [⭐ Features](/features/)

  + [🔐 Federated Authentication](/features/auth/sso/)
  + [🛠️ Tools & Functions (Plugins)](/features/plugin/)

    - [🧰 Functions](/features/plugin/functions/)

      * [🚰 Pipe Function](/features/plugin/functions/pipe)
      * [🪄 Filter Function](/features/plugin/functions/filter)
      * [🎬 Action Function](/features/plugin/functions/action)
    - [⚙️ Tools](/features/plugin/tools/)
    - [⛑️ Events](/features/plugin/events/)
    - [🔄 Valves](/features/plugin/valves/)
    - [🚚 Migrating Tools & Functions: 0.4 to 0.5](/features/plugin/migration/)
  + [🖥️ Workspace](/features/workspace/)
  + [💬 Chat Features](/features/chat-features/)
  + [🔎 Retrieval Augmented Generation (RAG)](/features/rag/)
  + [🪪 Role-Based Access Control (RBAC)](/features/rbac/)
  + [🔌 Interface](/features/interface/banners)
  + [📝 Evaluation](/features/evaluation/)
  + [📢 Channels](/features/channels/)
  + [⚡ Pipelines](/features/pipelines/)
  + [🔌 Model Context Protocol (MCP)](/features/mcp)
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

* [⭐ Features](/features/)
* [🛠️ Tools & Functions (Plugins)](/features/plugin/)
* 🧰 Functions

On this page

🧰 Functions
===========

🚀 What Are Functions?[​](#-what-are-functions "Direct link to 🚀 What Are Functions?")
-------------------------------------------------------------------------------------

Functions are like **plugins** for Open WebUI. They help you **extend its capabilities**—whether it’s adding support for new AI model providers like Anthropic or Vertex AI, tweaking how messages are processed, or introducing custom buttons to the interface for better usability.

Unlike external tools that may require complex integrations, **Functions are built-in and run within the Open WebUI environment.** That means they are fast, modular, and don’t rely on external dependencies.

Think of Functions as **modular building blocks** that let you enhance how the WebUI works, tailored exactly to what you need. They’re lightweight, highly customizable, and written in **pure Python**, so you have the freedom to create anything—from new AI-powered workflows to integrations with anything you use, like Google Search or Home Assistant.

---

🏗️ Types of Functions[​](#️-types-of-functions "Direct link to 🏗️ Types of Functions")
--------------------------------------------------------------------------------------

There are **three types of Functions** in Open WebUI, each with a specific purpose. Let’s break them down and explain exactly what they do:

---

### 1. [**Pipe Function** – Create Custom "Agents/Models"](/features/plugin/functions/pipe)[​](#1-pipe-function--create-custom-agentsmodels "Direct link to 1-pipe-function--create-custom-agentsmodels")

A **Pipe Function** is how you create **custom agents/models** or integrations, which then appear in the interface as if they were standalone models.

**What does it do?**

* Pipes let you define complex workflows. For instance, you could create a Pipe that sends data to **Model A** and **Model B**, processes their outputs, and combines the results into one finalized answer.
* Pipes don’t even have to use AI! They can be setups for **search APIs**, **weather data**, or even systems like **Home Assistant**. Basically, anything you’d like to interact with can become part of Open WebUI.

**Use case example:**
Imagine you want to query Google Search directly from Open WebUI. You can create a Pipe Function that:

1. Takes your message as the search query.
2. Sends the query to Google Search’s API.
3. Processes the response and returns it to you inside the WebUI like a normal "model" response.

When enabled, **Pipe Functions show up as their own selectable model**. Use Pipes whenever you need custom functionality that works like a model in the interface.

For a detailed guide, see [**Pipe Functions**](/features/plugin/functions/pipe).

---

### 2. [**Filter Function** – Modify Inputs and Outputs](/features/plugin/functions/filter)[​](#2-filter-function--modify-inputs-and-outputs "Direct link to 2-filter-function--modify-inputs-and-outputs")

A **Filter Function** is like a tool for tweaking data before it gets sent to the AI **or** after it comes back.

**What does it do?**
Filters act as "hooks" in the workflow and have two main parts:

* **Inlet**: Adjust the input that is sent to the model. For example, adding additional instructions, keywords, or formatting tweaks.
* **Outlet**: Modify the output that you receive from the model. For instance, cleaning up the response, adjusting tone, or formatting data into a specific style.

**Use case example:**
Suppose you’re working on a project that needs precise formatting. You can use a Filter to ensure:

1. Your input is always transformed into the required format.
2. The output from the model is cleaned up before being displayed.

Filters are **linked to specific models** or can be enabled for all models **globally**, depending on your needs.

Check out the full guide for more examples and instructions: [**Filter Functions**](/features/plugin/functions/filter).

---

### 3. [**Action Function** – Add Custom Buttons](/features/plugin/functions/action)[​](#3-action-function--add-custom-buttons "Direct link to 3-action-function--add-custom-buttons")

An **Action Function** is used to add **custom buttons** to the chat interface.

**What does it do?**
Actions allow you to define **interactive shortcuts** that trigger specific functionality directly from the chat. These buttons appear underneath individual chat messages, giving you convenient, one-click access to the actions you define.

**Use case example:**
Let’s say you often need to summarize long messages or generate specific outputs like translations. You can create an Action Function to:

1. Add a “Summarize” button under every incoming message.
2. When clicked, it triggers your custom function to process that message and return the summary.

Buttons provide a **clean and user-friendly way** to interact with extended functionality you define.

Learn how to set them up in the [**Action Functions Guide**](/features/plugin/functions/action).

---

🛠️ How to Use Functions[​](#️-how-to-use-functions "Direct link to 🛠️ How to Use Functions")
--------------------------------------------------------------------------------------------

Here's how to put Functions to work in Open WebUI:

### 1. **Install Functions**[​](#1-install-functions "Direct link to 1-install-functions")

You can install Functions via the Open WebUI interface or by importing them manually. You can find community-created functions on the [Open WebUI Community Site](https://openwebui.com/functions).

⚠️ **Be cautious.** Only install Functions from trusted sources. Running unknown code poses security risks.

---

### 2. **Enable Functions**[​](#2-enable-functions "Direct link to 2-enable-functions")

Functions must be explicitly enabled after installation:

* When you enable a **Pipe Function**, it becomes available as its own **model** in the interface.
* For **Filter** and **Action Functions**, enabling them isn’t enough—you also need to assign them to specific models or enable them globally for all models.

---

### 3. **Assign Filters or Actions to Models**[​](#3-assign-filters-or-actions-to-models "Direct link to 3-assign-filters-or-actions-to-models")

* Navigate to `Workspace => Models` and assign your Filter or Action to the relevant model there.
* Alternatively, enable Functions for **all models globally** by going to `Workspace => Functions`, selecting the "..." menu, and toggling the **Global** switch.

---

### Quick Summary[​](#quick-summary "Direct link to Quick Summary")

* **Pipes** appear as standalone models you can interact with.
* **Filters** modify inputs/outputs for smoother AI interactions.
* **Actions** add clickable buttons to individual chat messages.

Once you’ve followed the setup process, Functions will seamlessly enhance your workflows.

---

✅ Why Use Functions?[​](#-why-use-functions "Direct link to ✅ Why Use Functions?")
----------------------------------------------------------------------------------

Functions are designed for anyone who wants to **unlock new possibilities** with Open WebUI:

* **Extend**: Add new models or integrate with non-AI tools like APIs, databases, or smart devices.
* **Optimize**: Tweak inputs and outputs to fit your use case perfectly.
* **Simplify**: Add buttons or shortcuts to make the interface intuitive and efficient.

Whether you’re customizing workflows for specific projects, integrating external data, or just making Open WebUI easier to use, Functions are the key to taking control of your instance.

---

### 📝 Final Notes:[​](#-final-notes "Direct link to 📝 Final Notes:")

1. Always install Functions from **trusted sources only**.
2. Make sure you understand the difference between Pipe, Filter, and Action Functions to use them effectively.
3. Explore the official guides:
   * [Pipe Functions Guide](/features/plugin/functions/pipe)
   * [Filter Functions Guide](/features/plugin/functions/filter)
   * [Action Functions Guide](/features/plugin/functions/action)

By leveraging Functions, you’ll bring entirely new capabilities to your Open WebUI setup. Start experimenting today! 🚀

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/plugin/functions/index.mdx)

[Previous

🛠️ Tools & Functions (Plugins)](/features/plugin/)[Next

🚰 Pipe Function](/features/plugin/functions/pipe)

* [🚀 What Are Functions?](#-what-are-functions)
* [🏗️ Types of Functions](#️-types-of-functions)
  + [1. **Pipe Function** – Create Custom "Agents/Models"](#1-pipe-function--create-custom-agentsmodels)
  + [2. **Filter Function** – Modify Inputs and Outputs](#2-filter-function--modify-inputs-and-outputs)
  + [3. **Action Function** – Add Custom Buttons](#3-action-function--add-custom-buttons)
* [🛠️ How to Use Functions](#️-how-to-use-functions)
  + [1. **Install Functions**](#1-install-functions)
  + [2. **Enable Functions**](#2-enable-functions)
  + [3. **Assign Filters or Actions to Models**](#3-assign-filters-or-actions-to-models)
  + [Quick Summary](#quick-summary)
* [✅ Why Use Functions?](#-why-use-functions)
  + [📝 Final Notes:](#-final-notes)

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
- /features/auth/sso/
- /features/plugin/
- /features/plugin/functions/
- /features/plugin/functions/pipe
- /features/plugin/functions/filter
- /features/plugin/functions/action
- /features/plugin/tools/
- /features/plugin/events/
- /features/plugin/valves/
- /features/plugin/migration/
- /features/workspace/
- /features/chat-features/
- /features/rag/
- /features/rbac/
- /features/interface/banners
- /features/evaluation/
- /features/channels/
- /features/pipelines/
- /features/mcp
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
- /features/
- /features/plugin/
- #-what-are-functions
- #️-types-of-functions
- /features/plugin/functions/pipe
- #1-pipe-function--create-custom-agentsmodels
- /features/plugin/functions/pipe
- /features/plugin/functions/filter
- #2-filter-function--modify-inputs-and-outputs
- /features/plugin/functions/filter
- /features/plugin/functions/action
- #3-action-function--add-custom-buttons
- /features/plugin/functions/action
- #️-how-to-use-functions
- #1-install-functions
- https://openwebui.com/functions
- #2-enable-functions
- #3-assign-filters-or-actions-to-models
- #quick-summary
- #-why-use-functions
- #-final-notes
- /features/plugin/functions/pipe
- /features/plugin/functions/filter
- /features/plugin/functions/action
- https://github.com/open-webui/docs/blob/main/docs/features/plugin/functions/index.mdx
- /features/plugin/
- /features/plugin/functions/pipe
- #-what-are-functions
- #️-types-of-functions
- #1-pipe-function--create-custom-agentsmodels
- #2-filter-function--modify-inputs-and-outputs
- #3-action-function--add-custom-buttons
- #️-how-to-use-functions
- #1-install-functions
- #2-enable-functions
- #3-assign-filters-or-actions-to-models
- #quick-summary
- #-why-use-functions
- #-final-notes
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
