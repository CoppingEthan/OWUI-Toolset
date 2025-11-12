⚙️ Tools | Open WebUI







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
    - [⚙️ Tools](/features/plugin/tools/)

      * [🛠️ Development](/features/plugin/tools/development)
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
* ⚙️ Tools

On this page

⚙️ What are Tools?
==================

Tools are small Python scripts that add superpowers to your LLM. When enabled, they allow your chatbot to do amazing things — like search the web, scrape data, generate images, talk back using AI voices, and more.

Think of Tools as useful plugins that your AI can use when chatting with you.

---

🚀 What Can Tools Help Me Do?[​](#-what-can-tools-help-me-do "Direct link to 🚀 What Can Tools Help Me Do?")
----------------------------------------------------------------------------------------------------------

Here are just a few examples of what Tools let your AI assistant do:

* 🌍 Web Search: Get real-time answers by searching the internet.
* 🖼️ Image Generation: Create images from your prompts.
* 🔊 Voice Output: Generate AI voices using ElevenLabs.

Explore ready-to-use tools in the 🧰 [Tools Showcase](https://openwebui.com/tools)

---

📦 How to Install Tools[​](#-how-to-install-tools "Direct link to 📦 How to Install Tools")
-----------------------------------------------------------------------------------------

There are two easy ways to install Tools in Open WebUI:

1. Go to [Community Tool Library](https://openwebui.com/tools)
2. Choose a Tool, then click the Get button.
3. Enter your Open WebUI instance’s IP address or URL.
4. Click “Import to WebUI” — done!

warning

Safety Tip: Never import a Tool you don’t recognize or trust. These are Python scripts and might run unsafe code.

---

🔧 How to Use Tools in Open WebUI[​](#-how-to-use-tools-in-open-webui "Direct link to 🔧 How to Use Tools in Open WebUI")
-----------------------------------------------------------------------------------------------------------------------

Once you've installed Tools (we’ll show you how below), here’s how to enable and use them:

You have two ways to enable a Tool for your model:

### ➕ Option 1: Enable from the Chat Window[​](#-option-1-enable-from-the-chat-window "Direct link to ➕ Option 1: Enable from the Chat Window")

While chatting, click the ➕ icon in the input area. You’ll see a list of available Tools — you can enable any of them on the fly for that session.

tip

Tip: Enabling a Tool gives the model permission to use it — but it may not use it unless it's useful for the task.

### ✏️ Option 2: Enable by Default (Recommended for Frequent Use)[​](#️-option-2-enable-by-default-recommended-for-frequent-use "Direct link to ✏️ Option 2: Enable by Default (Recommended for Frequent Use)")

1. Go to: Workspace ➡️ Models
2. Choose the model you’re using (like GPT-4 or LLaMa2) and click the ✏️ edit icon.
3. Scroll down to the “Tools” section.
4. ✅ Check the Tools you want your model to have access to by default.
5. Click Save.

This ensures the model always has these Tools ready to use whenever you chat with it.

You can also let your LLM auto-select the right Tools using the AutoTool Filter:

🔗 [AutoTool Filter](https://openwebui.com/f/hub/autotool_filter/)

🎯 Note: Even when using AutoTool, you still need to enable your Tools using Option 2.

✅ And that’s it — your LLM is now Tool-powered! You're ready to supercharge your chats with web search, image generation, voice output, and more.

---

🧠 Choosing How Tools Are Used: Default vs Native[​](#-choosing-how-tools-are-used-default-vs-native "Direct link to 🧠 Choosing How Tools Are Used: Default vs Native")
----------------------------------------------------------------------------------------------------------------------------------------------------------------------

Once Tools are enabled for your model, Open WebUI gives you two different ways to let your LLM use them in conversations.

You can decide how the model should call Tools by choosing between:

* 🟡 Default Mode (Prompt-based)
* 🟢 Native Mode (Built-in function calling)

Let’s break it down:

### 🟡 Default Mode (Prompt-based Tool Triggering)[​](#-default-mode-prompt-based-tool-triggering "Direct link to 🟡 Default Mode (Prompt-based Tool Triggering)")

This is the default setting in Open WebUI.

Here, your LLM doesn’t need to natively support function calling. Instead, we guide the model using smart tool selection prompt template to select and use a Tool.

✅ Works with almost any model
✅ Great way to unlock Tools with basic or local models
❗ Not as reliable or flexible as Native Mode when chaining tools

### 🟢 Native Mode (Function Calling Built-In)[​](#-native-mode-function-calling-built-in "Direct link to 🟢 Native Mode (Function Calling Built-In)")

If your model does support “native” function calling (like GPT-4o or GPT-3.5-turbo-1106), you can use this powerful mode to let the LLM decide — in real time — when and how to call multiple Tools during a single chat message.

✅ Fast, accurate, and can chain multiple Tools in one response
✅ The most natural and advanced experience
❗ Requires a model that actually supports native function calling

### ✳️ How to Switch Between Modes[​](#️-how-to-switch-between-modes "Direct link to ✳️ How to Switch Between Modes")

Want to enable native function calling in your chats? Here's how:

![Chat Controls](/assets/images/chat-controls-28858e9a3b46384cbf7496bb159b653c.png)

1. Open the chat window with your model.
2. Click ⚙️ Chat Controls > Advanced Params.
3. Look for the Function Calling setting and switch it from Default → Native

That’s it! Your chat is now using true native Tool support (as long as the model supports it).

➡️ We recommend using GPT-4o or another OpenAI model for the best native function-calling experience.
🔎 Some local models may claim support, but often struggle with accurate or complex Tool usage.

💡 Summary:

| Mode | Who it’s for | Pros | Cons |
| --- | --- | --- | --- |
| Default | Any model | Broad compatibility, safer, flexible | May be less accurate or slower |
| Native | GPT-4o, etc. | Fast, smart, excellent tool chaining | Needs proper function call support |

Choose the one that works best for your setup — and remember, you can always switch on the fly via Chat Controls.

👏 And that's it — your LLM now knows how and when to use Tools, intelligently.

---

🧠 Summary[​](#-summary "Direct link to 🧠 Summary")
--------------------------------------------------

Tools are add-ons that help your AI model do much more than just chat. From answering real-time questions to generating images or speaking out loud — Tools bring your AI to life.

* Visit: <https://openwebui.com/tools> to discover new Tools.
* Install them manually or with one-click.
* Enable them per model from Workspace ➡️ Models.
* Use them in chat by clicking ➕

Now go make your AI waaaaay smarter 🤖✨

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/plugin/tools/index.mdx)

[Previous

🎬 Action Function](/features/plugin/functions/action)[Next

🛠️ Development](/features/plugin/tools/development)

* [🚀 What Can Tools Help Me Do?](#-what-can-tools-help-me-do)
* [ 📦 How to Install Tools](#-how-to-install-tools)
* [🔧 How to Use Tools in Open WebUI](#-how-to-use-tools-in-open-webui)
  + [➕ Option 1: Enable from the Chat Window](#-option-1-enable-from-the-chat-window)
  + [✏️ Option 2: Enable by Default (Recommended for Frequent Use)](#️-option-2-enable-by-default-recommended-for-frequent-use)
* [🧠 Choosing How Tools Are Used: Default vs Native](#-choosing-how-tools-are-used-default-vs-native)
  + [🟡 Default Mode (Prompt-based Tool Triggering)](#-default-mode-prompt-based-tool-triggering)
  + [🟢 Native Mode (Function Calling Built-In)](#-native-mode-function-calling-built-in)
  + [✳️ How to Switch Between Modes](#️-how-to-switch-between-modes)
* [🧠 Summary](#-summary)

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
- /features/plugin/tools/
- /features/plugin/tools/development
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
- #-what-can-tools-help-me-do
- https://openwebui.com/tools
- #-how-to-install-tools
- https://openwebui.com/tools
- #-how-to-use-tools-in-open-webui
- #-option-1-enable-from-the-chat-window
- #️-option-2-enable-by-default-recommended-for-frequent-use
- https://openwebui.com/f/hub/autotool_filter/
- #-choosing-how-tools-are-used-default-vs-native
- #-default-mode-prompt-based-tool-triggering
- #-native-mode-function-calling-built-in
- #️-how-to-switch-between-modes
- #-summary
- https://openwebui.com/tools
- https://github.com/open-webui/docs/blob/main/docs/features/plugin/tools/index.mdx
- /features/plugin/functions/action
- /features/plugin/tools/development
- #-what-can-tools-help-me-do
- #-how-to-install-tools
- #-how-to-use-tools-in-open-webui
- #-option-1-enable-from-the-chat-window
- #️-option-2-enable-by-default-recommended-for-frequent-use
- #-choosing-how-tools-are-used-default-vs-native
- #-default-mode-prompt-based-tool-triggering
- #-native-mode-function-calling-built-in
- #️-how-to-switch-between-modes
- #-summary
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
