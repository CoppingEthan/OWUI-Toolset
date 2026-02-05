# https://docs.openwebui.com/getting-started/quick-start/starting-with-functions

  * [](/)
  * [🚀 Getting Started](/getting-started/)
  * [Quick Start](/getting-started/quick-start/)
  * Getting Started with Functions



On this page

# Getting Started with Functions

## Overview​

Did you know Open WebUI can connect to almost **anything** —not just OpenAI-compatible APIs?

Thanks to **Pipe Functions** , you can bring in services that don’t support the OpenAI API (like **Anthropic** , Home Assistant, Google Search, or _any_ Python codebase). No restrictions on LLMs or AI models: if you can automate it in Python, you can turn it into a plugin for Open WebUI!

This guide walks you through setting up your first Pipe Function, using the [Anthropic Pipe](https://openwebui.com/f/justinrahb/anthropic) plugin as an example.

## What are Pipe Functions?​

Pipe Functions are “bring-your-own-model (or tool)” plugins:

  * **Act like models** : They show up as selectable models in your Open WebUI sidebar.
  * **Flexible** : Integrate with _any_ backend, API, or workflow—no OpenAI compatibility required.
  * **No LLM required** : You can build plugins for search, home automation, weather, databases, or whatever you like.
  * **Pure Python** : All logic is Python code that runs _directly inside_ your WebUI (so be cautious with what you enable!).



## Step 1: Find a Pipe Function to Try​

Functions are powerful tools, and the community has created thousands of them! You can browse, search, and import them directly from our community hub.

Community Account Required

To search and import functions directly from **[Open WebUI Community](https://openwebui.com/search)** , you must be logged in with a registered community account.

  1. Go to **[Open WebUI Community Search](https://openwebui.com/search)**.
  2. Explore the library! You can find functions for:
     * **New Providers** : Anthropic, Google Gemini, Groq.
     * **Tools** : Web Search, Calculator, Home Assistant control.
     * **Utilities** : Auto-tagging, content filtering, and more.
  3. **Pro Tip** : Even if you don't find exactly what you need, you can use existing functions as **templates** to build your own!



For this guide, let's try integrating **Anthropic** (Claude models):

  1. Locate the [Anthropic Pipe](https://openwebui.com/f/justinrahb/anthropic) function.
  2. Click **Get**.



![Anthropic Pipe Function Page](/assets/images/pipe-anthropic-function-3917d86dce1d6581766b05f6ef136843.png)

## Step 2: Import the Function to Open WebUI​

A modal will appear:

  1. Enter your Open WebUI URL (e.g., `http://localhost:3000`) in the prompt.
  2. Click **Import to Open WebUI**.



![Import Modal Screenshot](/assets/images/pipe-import-modal-d8e17f9d0bc1ba55eb3db9571428ea4e.png)

You’ll be redirected **directly to the Functions Editor** within your running instance of Open WebUI.

## Step 3: Review & Save​

  * You’ll see all of the Pipe Function’s Python code and configuration.
  * **Important:** Functions run arbitrary Python! Review the code for safety, and only install from sources you trust.
  * If you’re happy with the code, click **Save** to add it to your instance.



![Function Editor Screenshot](/assets/images/pipe-function-editor-5ca0a71fc264c19c4467a1c627265c6b.png)

## Step 4: Enable the Function​

Your new Pipe Function is now available, but **must be enabled** :

  1. Switch the toggler to enable the function.



![Enable Function Screenshot](/assets/images/pipe-enable-731f3c6aceac939bd9b350914a1d0708.png)

## Step 5: Enter any Required API Keys via Valves​

Some functions need credentials (like Anthropic’s API key):

  1. Click on the Gear icon next to the switch to open the **Valves** configuration.

  2. Input your required API key(s) for the Pipe Function.

![Valves/API Key Screenshot](/assets/images/pipe-valves-a9a4610a8bc0577cc1e742102882a0bb.png)




## Step 6: Start Using Your New Plugin!​

  * The new function now appears as a selectable “model” in the chat interface.
  * Select `Anthropic` (or whatever you installed), and start chatting!



![Select Pipe Function as Model Screenshot](/assets/images/pipe-select-model-2a7e6bacb7056cc8b22590c32d4ed45a.png)

## 🎉 That’s It—You’re Plugged Into Anything!​

  * Pipe Functions open Open WebUI to _any_ API, model, or automation—not just OpenAI-compatible endpoints.
  * Think beyond LLMs: Integrate tools, APIs, local scripts, or your entire smart home.



## ⚠️ Security Notes​

  * **Always** review function code before enabling.
  * Only use plugins from trusted sources.
  * You have the power to enhance (or break!) your WebUI—use responsibly.



### Next Steps & Learn More​

Ready to build your own? Check out our detailed development guides:

  * **[Functions Overview](/features/plugin/functions/)** : Learn the basics of the Functions system.

  * **[Pipes Guide](/features/plugin/functions/pipe)** : Create custom model providers and logic pipelines.

  * **[Filters Guide](/features/plugin/functions/filter)** : Intercept and modify messages (Input/Output guards).

  * **[Actions Guide](/features/plugin/functions/action)** : Add buttons/actions to messages.

  * **[Tools Guide](/features/plugin/tools/)** : Build tools for LLMs to use (RAG, APIs).

  * **[Community Registry](https://openwebui.com/search)** : Browse hundreds of community-made functions.




🚀 With Pipe Functions, your Open WebUI is limited _only by your imagination_!

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/getting-started/quick-start/starting-with-functions.mdx)

[PreviousStarting with OpenAI-Compatible Servers](/getting-started/quick-start/starting-with-openai-compatible)[NextAdvanced Topics](/getting-started/advanced-topics/)

  * Overview
  * What are Pipe Functions?
  * Step 1: Find a Pipe Function to Try
  * Step 2: Import the Function to Open WebUI
  * Step 3: Review & Save
  * Step 4: Enable the Function
  * Step 5: Enter any Required API Keys via Valves
  * Step 6: Start Using Your New Plugin!
  * 🎉 That’s It—You’re Plugged Into Anything!
  * ⚠️ Security Notes
    * Next Steps & Learn More


