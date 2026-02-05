# https://docs.openwebui.com/features/memory

  * [](/)
  * [⭐ Features](/features/)
  * Memory & Personalization



On this page

# Memory & Personalization 🧠

Experimental Feature

The Memory system is currently in **Beta/Experimental** stage. You may encounter inconsistencies in how models store or retrieve information, and storage formats may change in future updates.

Open WebUI includes a sophisticated memory system that allows models to remember facts, preferences, and context across different conversations. With the introduction of **Native Tool Calling** , this system has been upgraded from a passive injection mechanism to an active, model-managed "long-term memory."

## How it Works​

The memory system stores snippets of information about you (e.g., "I prefer Python for backend tasks" or "I live in Vienna"). There are two ways these memories are used:

### 1\. Manual Management (Settings)​

Users can manually add, edit, or delete memories by navigating to: **Settings > Personalization > Memory**

### 2\. Native Memory Tools (Agentic Mode)​

When using a model with **Native Function Calling (Agentic Mode)** enabled, quality models can manage your memory autonomously using three built-in tools. For a detailed breakdown of how administrators can configure and manage these system-level tools, see the [**Central Tool Calling Guide**](/features/plugin/tools#tool-calling-modes-default-vs-native).

Quality Models for Memory Management

Autonomous memory management works best with frontier models (GPT-5, Claude 4.5+, Gemini 3+) that can intelligently decide what facts are worth saving and when to recall relevant memories. Small local models may struggle with appropriate memory selection.

  * **`add_memory`** : Allows the model to proactively save a new fact it learned about you during the conversation.
  * **`search_memories`** : Allows the model to search your memory bank for relevant context. Results include a unique `id` for each memory snippet. The model can optionally specify how many memories to return (default is 5).
  * **`replace_memory_content`** : Allows the model to update or correct a specific existing memory using its `id`.



## Benefits of the New Memory System​

  * **Proactive Learning** : Instead of you manually typing preferences, a model can say: _"I'll remember that you prefer dark mode for your UI projects"_ and call `add_memory` behind the scenes.
  * **Contextual Retrieval** : If a conversation drifts into a topic mentioned months ago, the model can "search its brain" using `search_memories` to find those past details.
  * **Dynamic Correction** : If the model remembers something incorrectly, it can use `replace_memory_content` to fix the fact rather than creating a duplicate.
  * **User Control** : Even though models can add memories, users retain full control. Every memory added by a model can be reviewed and deleted in the Personalization settings.



## Enabling Memory Tools​

  1. **Administrative Enablement** : Ensure the Memory feature is enabled globally by an administrator and that you have the required permissions.
  2. **Native Mode (Agentic Mode)** : Enable **Native Function Calling** in the model's advanced parameters (**Admin Panel > Settings > Models > Model Specific Settings > Advanced Parameters**).
  3. **Quality Models Required** : To unlock these features effectively, use frontier models with strong reasoning capabilities (e.g., GPT-5, Claude 4.5 Sonnet, Gemini 3 Flash, MiniMax M2.1) for the best experience. Small local models may not effectively manage memories autonomously.



Central Tool Documentation

For complete details on all built-in agentic tools (including memory, web search, and knowledge bases) and how to configure them, see the [**Native/Agentic Mode Tools Guide**](/features/plugin/tools#built-in-system-tools-nativeagentic-mode).

## Administrative Controls​

Administrators have full control over the Memory feature, including the ability to disable it globally or restrict it to specific user groups.

### Global Toggle​

The Memory feature can be toggled on or off for the entire instance. When disabled, the "Personalization" tab is hidden from all users, and the memory-related API endpoints are blocked.

  * **Admin UI** : Admin Panel > Settings > General > Features > **Memories**
  * **Environment Variable** : [`ENABLE_MEMORIES`](/getting-started/env-configuration#enable_memories) (Default: `True`)



### Granular Permissions​

Administrators can also control Memory access on a per-role or per-group basis from the Permissions interface.

  * **Admin UI** : Admin Panel > Users > Permissions > Features > **Memories**
  * **Environment Variable** : [`USER_PERMISSIONS_FEATURES_MEMORIES`](/getting-started/env-configuration#user_permissions_features_memories) (Default: `True`)



## Privacy & Security​

Memories are stored locally in your Open WebUI database and are specific to your user account. They are never shared across users, and you can clear your entire memory bank at any time.

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/memory.mdx)

[PreviousPerplexity Search](/features/web-search/perplexity_search)[NextInterface](/category/interface)

  * How it Works
    * 1\. Manual Management (Settings)
    * 2\. Native Memory Tools (Agentic Mode)
  * Benefits of the New Memory System
  * Enabling Memory Tools
  * Administrative Controls
    * Global Toggle
    * Granular Permissions
  * Privacy & Security


