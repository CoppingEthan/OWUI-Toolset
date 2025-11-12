🌍 Environment Variable Configuration | Open WebUI







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
* 🌍 Environment Variable Configuration

On this page

🌍 Environment Variable Configuration
====================================

Overview[​](#overview "Direct link to Overview")
------------------------------------------------

Open WebUI provides a large range of environment variables that allow you to customize and configure
various aspects of the application. This page serves as a comprehensive reference for all available
environment variables, providing their types, default values, and descriptions.
As new variables are introduced, this page will be updated to reflect the growing configuration options.

info

This page is up-to-date with Open WebUI release version [v0.6.32](https://github.com/open-webui/open-webui/releases/tag/v0.6.32), but is still a work in progress to later include more accurate descriptions, listing out options available for environment variables, defaults, and improving descriptions.

### Important Note on `PersistentConfig` Environment Variables[​](#important-note-on-persistentconfig-environment-variables "Direct link to important-note-on-persistentconfig-environment-variables")

note

When launching Open WebUI for the first time, all environment variables are treated equally and can be used to configure the application. However, for environment variables marked as `PersistentConfig`, their values are persisted and stored internally.

After the initial launch, if you restart the container, `PersistentConfig` environment variables will no longer use the external environment variable values. Instead, they will use the internally stored values.

In contrast, regular environment variables will continue to be updated and applied on each subsequent restart.

You can update the values of `PersistentConfig` environment variables directly from within Open WebUI, and these changes will be stored internally. This allows you to manage these configuration settings independently of the external environment variables.

Please note that `PersistentConfig` environment variables are clearly marked as such in the documentation below, so you can be aware of how they will behave.

To disable `PersistentConfig` and have Open WebUI treat all variables equally, you can set `ENABLE_PERSISTENT_CONFIG` to `False`.

App/Backend[​](#appbackend "Direct link to App/Backend")
--------------------------------------------------------

The following environment variables are used by `backend/open_webui/config.py` to provide Open WebUI startup
configuration. Please note that some variables may have different default values depending on
whether you're running Open WebUI directly or via Docker. For more information on logging
environment variables, see our [logging documentation](https://docs.openwebui.com/getting-started/advanced-topics/logging).

### General[​](#general "Direct link to General")

#### `WEBUI_URL`[​](#webui_url "Direct link to webui_url")

* Type: `str`
* Default: `http://localhost:3000`
* Description: Specifies the URL where your Open WebUI installation is reachable. Needed for search engine support and OAuth/SSO.
* Persistence: This environment variable is a `PersistentConfig` variable.

warning

This variable has to be set before you start using OAuth/SSO for authentication.
Since this is a persistent config environment variable, you can only change it through one of the following options:

* Temporarily disabling persistent config using `ENABLE_PERSISTENT_CONFIG`
* Changing `WEBUI_URL` in the admin panel > settings and changing "WebUI URL".

Failure to set WEBUI\_URL before using OAuth/SSO will result in failure to log in.

#### `ENABLE_SIGNUP`[​](#enable_signup "Direct link to enable_signup")

* Type: `bool`
* Default: `True`
* Description: Toggles user account creation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_SIGNUP_PASSWORD_CONFIRMATION`[​](#enable_signup_password_confirmation "Direct link to enable_signup_password_confirmation")

* Type: `bool`
* Default: `False`
* Description: If set to True, a "Confirm Password" field is added to the sign-up page to help users avoid typos when creating their password.

#### `ENABLE_LOGIN_FORM`[​](#enable_login_form "Direct link to enable_login_form")

* Type: `bool`
* Default: `True`
* Description: Toggles email, password, sign-in and "or" (only when `ENABLE_OAUTH_SIGNUP` is set to True) elements.
* Persistence: This environment variable is a `PersistentConfig` variable.

danger

This should **only** ever be set to `False` when [ENABLE\_OAUTH\_SIGNUP](https://docs.openwebui.com/getting-started/env-configuration/#enable_oauth_signup)
is also being used and set to `True`. Failure to do so will result in the inability to login.

#### `DEFAULT_LOCALE`[​](#default_locale "Direct link to default_locale")

* Type: `str`
* Default: `en`
* Description: Sets the default locale for the application.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DEFAULT_MODELS`[​](#default_models "Direct link to default_models")

* Type: `str`
* Default: Empty string (' '), since `None`.
* Description: Sets a default Language Model.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DEFAULT_USER_ROLE`[​](#default_user_role "Direct link to default_user_role")

* Type: `str`
* Options:
  + `pending` - New users are pending until their accounts are manually activated by an admin.
  + `user` - New users are automatically activated with regular user permissions.
  + `admin` - New users are automatically activated with administrator permissions.
* Default: `pending`
* Description: Sets the default role assigned to new users.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `PENDING_USER_OVERLAY_TITLE`[​](#pending_user_overlay_title "Direct link to pending_user_overlay_title")

* Type: `str`
* Default: Empty string (' ')
* Description: Sets a custom title for the pending user overlay.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `PENDING_USER_OVERLAY_CONTENT`[​](#pending_user_overlay_content "Direct link to pending_user_overlay_content")

* Type: `str`
* Default: Empty string (' ')
* Description: Sets a custom text content for the pending user overlay.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_CHANNELS`[​](#enable_channels "Direct link to enable_channels")

* Type: `bool`
* Default: `False`
* Description: Enables or disables channel support.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WEBHOOK_URL`[​](#webhook_url "Direct link to webhook_url")

* Type: `str`
* Description: Sets a webhook for integration with Discord/Slack/Microsoft Teams.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_ADMIN_EXPORT`[​](#enable_admin_export "Direct link to enable_admin_export")

* Type: `bool`
* Default: `True`
* Description: Controls whether admins can export data, chats and the database in the admin panel. Database exports only work for SQLite databases for now.

#### `ENABLE_ADMIN_CHAT_ACCESS`[​](#enable_admin_chat_access "Direct link to enable_admin_chat_access")

* Type: `bool`
* Default: `True`
* Description: Enables admin users to directly access the chats of other users. When disabled, admins can no longer accesss user's chats in the admin panel. If you disable this, consider disabling `ENABLE_ADMIN_EXPORT` too, if you are using SQLite, as the exports also contain user chats.

#### `BYPASS_ADMIN_ACCESS_CONTROL`[​](#bypass_admin_access_control "Direct link to bypass_admin_access_control")

* Type: `bool`
* Default: `True`
* Description: When disabled, admin users are treated like regular users for workspace access (models, knowledge, prompts and tools) and only see items they have **explicit permission to access** through the existing access control system. This also applies to the visibility of models in the model selector - admins will be treated as regular users: base models and custom models they do not have **explicit permission to access**, will be hidden. If set to `True` (Default), admins have access to **all created items** in the workspace area and all models in the model selector, **regardless of access permissions**.

#### `ENABLE_USER_WEBHOOKS`[​](#enable_user_webhooks "Direct link to enable_user_webhooks")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user webhooks.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RESPONSE_WATERMARK`[​](#response_watermark "Direct link to response_watermark")

* Type: `str`
* Default: Empty string (' ')
* Description: Sets a custom text that will be included when you copy a message in the chat. e.g., `"This text is AI generated"` -> will add "This text is AI generated" to every message, when copied.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `THREAD_POOL_SIZE`[​](#thread_pool_size "Direct link to thread_pool_size")

* Type: `int`
* Default: `0`
* Description: Sets the thread pool size for FastAPI/AnyIO blocking calls. By default (when set to `0`) FastAPI/AnyIO use `40` threads. In case of large instances and many concurrent users, it may be needed to increase `THREAD_POOL_SIZE` to prevent blocking.

#### `MODELS_CACHE_TTL`[​](#models_cache_ttl "Direct link to models_cache_ttl")

* Type: `int`
* Default: `1`
* Description: Sets the cache time-to-live in seconds for model list responses from OpenAI and Ollama endpoints. This reduces API calls by caching the available models list for the specified duration. Set to empty string to disable caching entirely.

info

This caches the external model lists retrieved from configured OpenAI-compatible and Ollama API endpoints (not Open WebUI's internal model configurations). Higher values improve performance by reducing redundant API requests to external providers but may delay visibility of newly added or removed models on those endpoints. A value of 0 disables caching and forces fresh API calls each time. In high-traffic scenarios, increasing this value (e.g., to 300 seconds) can significantly reduce load on external API endpoints while still providing reasonably fresh model data.

#### `SHOW_ADMIN_DETAILS`[​](#show_admin_details "Direct link to show_admin_details")

* Type: `bool`
* Default: `True`
* Description: Toggles whether to show admin user details in the interface.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ADMIN_EMAIL`[​](#admin_email "Direct link to admin_email")

* Type: `str`
* Description: Sets the admin email shown by `SHOW_ADMIN_DETAILS`
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENV`[​](#env "Direct link to env")

* Type: `str`
* Options:
  + `dev` - Enables the FastAPI API documentation on `/docs`
  + `prod` - Automatically configures several environment variables
* Default:
  + **Backend Default**: `dev`
  + **Docker Default**: `prod`
* Description: Environment setting.

#### `ENABLE_PERSISTENT_CONFIG`[​](#enable_persistent_config "Direct link to enable_persistent_config")

* Type: `bool`
* Default: `True`
* Description: If set to `False`, all `PersistentConfig` variables are treated as regular variables.

#### `CUSTOM_NAME`[​](#custom_name "Direct link to custom_name")

* Type: `str`
* Description: Sets `WEBUI_NAME` but polls **api.openwebui.com** for metadata.

#### `WEBUI_NAME`[​](#webui_name "Direct link to webui_name")

* Type: `str`
* Default: `Open WebUI`
* Description: Sets the main WebUI name. Appends `(Open WebUI)` if overridden.

#### `PORT`[​](#port "Direct link to port")

* Type: `int`
* Default: `8080`
* Description: Sets the port to run Open WebUI from.

info

If you're running the application via Python and using the `open-webui serve` command, you cannot set the port using the `PORT` configuration. Instead, you must specify it directly as a command-line argument using the `--port` flag. For example:

```
open-webui serve --port 9999
```

This will run the Open WebUI on port `9999`. The `PORT` environment variable is disregarded in this mode.

#### `ENABLE_REALTIME_CHAT_SAVE`[​](#enable_realtime_chat_save "Direct link to enable_realtime_chat_save")

* Type: `bool`
* Default: `False`
* Description: When enabled, the system saves each chunk of streamed chat data to the database in real time to ensure maximum data persistency. This feature provides robust data recovery and allows accurate session tracking. However, the tradeoff is increased latency, as saving to the database introduces a delay. Disabling this feature can improve performance and reduce delays, but it risks potential data loss in the event of a system failure or crash. Use based on your application's requirements and acceptable tradeoffs.

#### `CHAT_RESPONSE_STREAM_DELTA_CHUNK_SIZE`[​](#chat_response_stream_delta_chunk_size "Direct link to chat_response_stream_delta_chunk_size")

* Type: `int`
* Default: `1`
* Description: Sets a system-wide minimum value for the number of tokens to batch together before sending them to the client during a streaming response. This allows an administrator to enforce a baseline level of performance and stability across the entire system by preventing excessively small chunk sizes that can cause high CPU load. The final chunk size used for a response will be the highest value set among this global variable, the model's advanced parameters, or the per-chat settings. The default is 1, which applies no minimum batching at the global level.

info

It is recommended to set this to a high single-digit or low double-digit value if you run Open WebUI with high concurrency, many users, and very fast streaming models.

#### `BYPASS_MODEL_ACCESS_CONTROL`[​](#bypass_model_access_control "Direct link to bypass_model_access_control")

* Type: `bool`
* Default: `False`
* Description: Bypasses model access control. When set to `true`, all users (and admins alike) will have access to all models, regardless of the model's privacy setting (Private, Public, Shared with certain groups). This is useful for smaller or individual Open WebUI installations where model access restrictions may not be needed.

#### `WEBUI_BUILD_HASH`[​](#webui_build_hash "Direct link to webui_build_hash")

* Type: `str`
* Default: `dev-build`
* Description: Used for identifying the Git SHA of the build for releases.

#### `WEBUI_BANNERS`[​](#webui_banners "Direct link to webui_banners")

* Type: `list` of `dict`
* Default: `[]`
* Description: List of banners to show to users. The format for banners are:

```
[{"id": "string", "type": "string [info, success, warning, error]", "title": "string", "content": "string", "dismissible": false, "timestamp": 1000}]
```

* Persistence: This environment variable is a `PersistentConfig` variable.

info

When setting this environment variable in a `.env` file, make sure to escape the quotes by wrapping the entire value in double quotes and using escaped quotes (`\"`) for the inner quotes. Example:

```
WEBUI_BANNERS="[{\"id\": \"1\", \"type\": \"warning\", \"title\": \"Your messages are stored.\", \"content\": \"Your messages are stored and may be reviewed by human people. LLM's are prone to hallucinations, check sources.\", \"dismissible\": true, \"timestamp\": 1000}]"
```

#### `USE_CUDA_DOCKER`[​](#use_cuda_docker "Direct link to use_cuda_docker")

* Type: `bool`
* Default: `False`
* Description: Builds the Docker image with NVIDIA CUDA support. Enables GPU acceleration for local Whisper and embeddings.

#### `EXTERNAL_PWA_MANIFEST_URL`[​](#external_pwa_manifest_url "Direct link to external_pwa_manifest_url")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: When defined as a fully qualified URL (e.g., <https://path/to/manifest.webmanifest>), requests sent to /manifest.json will use the external manifest file. When not defined, the default manifest.json file will be used.

#### `ENABLE_TITLE_GENERATION`[​](#enable_title_generation "Direct link to enable_title_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables chat title generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LICENSE_KEY`[​](#license_key "Direct link to license_key")

* Type: `str`
* Default: `None`
* Description: Specifies the license key to use (for Enterprise users only).
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SSL_ASSERT_FINGERPRINT`[​](#ssl_assert_fingerprint "Direct link to ssl_assert_fingerprint")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the SSL assert fingerprint to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DEFAULT_PROMPT_SUGGESTIONS`[​](#default_prompt_suggestions "Direct link to default_prompt_suggestions")

* Type: `list` of `dict`
* Default: `[]` (which means to use the built-in default prompt suggestions)
* Description: List of prompt suggestions. The format for prompt suggestions are:

```
[{"title": ["Title part 1", "Title part 2"], "content": "prompt"}]
```

### AIOHTTP Client[​](#aiohttp-client "Direct link to AIOHTTP Client")

#### `AIOHTTP_CLIENT_TIMEOUT`[​](#aiohttp_client_timeout "Direct link to aiohttp_client_timeout")

* Type: `int`
* Default: `300`
* Description: Specifies the timeout duration in seconds for the AIOHTTP client. This impacts things
  such as connections to Ollama and OpenAI endpoints.

info

This is the maximum amount of time the client will wait for a response before timing out.
If set to an empty string (' '), the timeout will be set to `None`, effectively disabling the timeout and
allowing the client to wait indefinitely.

#### `AIOHTTP_CLIENT_TIMEOUT_MODEL_LIST`[​](#aiohttp_client_timeout_model_list "Direct link to aiohttp_client_timeout_model_list")

* Type: `int`
* Default: `10`
* Description: Sets the timeout in seconds for fetching the model list. This can be useful in cases where network latency requires a longer timeout duration to successfully retrieve the model list.

note

The AIOHTTP\_CLIENT\_TIMEOUT\_MODEL\_LIST is set to 10 seconds by default to help ensure that all necessary connections are available when opening the web UI. This duration allows enough time for retrieving the model list even in cases of higher network latency. You can lower this value if quicker timeouts are preferred, but keep in mind that doing so may lead to some connections being dropped, depending on your network conditions.

#### `AIOHTTP_CLIENT_TIMEOUT_OPENAI_MODEL_LIST`[​](#aiohttp_client_timeout_openai_model_list "Direct link to aiohttp_client_timeout_openai_model_list")

* Type: `int`
* Description: Sets the timeout in seconds for fetching the model list. This can be useful in cases where network latency requires a longer timeout duration to successfully retrieve the model list.

### Directories[​](#directories "Direct link to Directories")

#### `DATA_DIR`[​](#data_dir "Direct link to data_dir")

* Type: `str`
* Default: `./data`
* Description: Specifies the base directory for data storage, including uploads, cache, vector database, etc.

#### `FONTS_DIR`[​](#fonts_dir "Direct link to fonts_dir")

* Type: `str`
* Description: Specifies the directory for fonts.

#### `FRONTEND_BUILD_DIR`[​](#frontend_build_dir "Direct link to frontend_build_dir")

* Type: `str`
* Default: `../build`
* Description: Specifies the location of the built frontend files.

#### `STATIC_DIR`[​](#static_dir "Direct link to static_dir")

* Type: `str`
* Default: `./static`
* Description: Specifies the directory for static files, such as the favicon.

### Ollama[​](#ollama "Direct link to Ollama")

#### `ENABLE_OLLAMA_API`[​](#enable_ollama_api "Direct link to enable_ollama_api")

* Type: `bool`
* Default: `True`
* Description: Enables the use of Ollama APIs.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OLLAMA_BASE_URL` (`OLLAMA_API_BASE_URL` is deprecated)[​](#ollama_base_url "Direct link to ollama_base_url")

* Type: `str`
* Default: `http://localhost:11434`
* Docker Default:
  + If `K8S_FLAG` is set: `http://ollama-service.open-webui.svc.cluster.local:11434`
  + If `USE_OLLAMA_DOCKER=True`: `http://localhost:11434`
  + Else `http://host.docker.internal:11434`
* Description: Configures the Ollama backend URL.

#### `OLLAMA_BASE_URLS`[​](#ollama_base_urls "Direct link to ollama_base_urls")

* Type: `str`
* Description: Configures load-balanced Ollama backend hosts, separated by `;`. See
  [`OLLAMA_BASE_URL`](#ollama_base_url). Takes precedence over[`OLLAMA_BASE_URL`](#ollama_base_url).
* Example: `http://host-one:11434;http://host-two:11434`
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USE_OLLAMA_DOCKER`[​](#use_ollama_docker "Direct link to use_ollama_docker")

* Type: `bool`
* Default: `False`
* Description: Builds the Docker image with a bundled Ollama instance.

#### `K8S_FLAG`[​](#k8s_flag "Direct link to k8s_flag")

* Type: `bool`
* Default: `False`
* Description: If set, assumes Helm chart deployment and sets [`OLLAMA_BASE_URL`](#ollama_base_url) to `http://ollama-service.open-webui.svc.cluster.local:11434`

### OpenAI[​](#openai "Direct link to OpenAI")

#### `ENABLE_OPENAI_API`[​](#enable_openai_api "Direct link to enable_openai_api")

* Type: `bool`
* Default: `True`
* Description: Enables the use of OpenAI APIs.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OPENAI_API_BASE_URL`[​](#openai_api_base_url "Direct link to openai_api_base_url")

* Type: `str`
* Default: `https://api.openai.com/v1`
* Description: Configures the OpenAI base API URL.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OPENAI_API_BASE_URLS`[​](#openai_api_base_urls "Direct link to openai_api_base_urls")

* Type: `str`
* Description: Supports balanced OpenAI base API URLs, semicolon-separated.
* Example: `http://host-one:11434;http://host-two:11434`
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OPENAI_API_KEY`[​](#openai_api_key "Direct link to openai_api_key")

* Type: `str`
* Description: Sets the OpenAI API key.
* Example: `sk-124781258123`
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OPENAI_API_KEYS`[​](#openai_api_keys "Direct link to openai_api_keys")

* Type: `str`
* Description: Supports multiple OpenAI API keys, semicolon-separated.
* Example: `sk-124781258123;sk-4389759834759834`
* Persistence: This environment variable is a `PersistentConfig` variable.

### Tasks[​](#tasks "Direct link to Tasks")

#### `TASK_MODEL`[​](#task_model "Direct link to task_model")

* Type: `str`
* Description: The default model to use for tasks such as title and web search query generation
  when using Ollama models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TASK_MODEL_EXTERNAL`[​](#task_model_external "Direct link to task_model_external")

* Type: `str`
* Description: The default model to use for tasks such as title and web search query generation
  when using OpenAI-compatible endpoints.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TITLE_GENERATION_PROMPT_TEMPLATE`[​](#title_generation_prompt_template "Direct link to title_generation_prompt_template")

* Type: `str`
* Description: Prompt to use when generating chat titles.
* Default: The value of `DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE` environment variable.

`DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE`:

```
### Task:  
Generate a concise, 3-5 word title with an emoji summarizing the chat history.  
  
### Guidelines:  
- The title should clearly represent the main theme or subject of the conversation.  
- Use emojis that enhance understanding of the topic, but avoid quotation marks or special formatting.  
- Write the title in the chat's primary language; default to English if multilingual.  
- Prioritize accuracy over excessive creativity; keep it clear and simple.  
  
### Output:  
JSON format: { "title": "your concise title here" }  
  
### Examples:  
- { "title": "📉 Stock Market Trends" },  
- { "title": "🍪 Perfect Chocolate Chip Recipe" },  
- { "title": "Evolution of Music Streaming" },  
- { "title": "Remote Work Productivity Tips" },  
- { "title": "Artificial Intelligence in Healthcare" },  
- { "title": "🎮 Video Game Development Insights" }  
  
### Chat History:  
<chat_history>  
{{MESSAGES:END:2}}  
</chat_history>
```

* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_FOLLOW_UP_GENERATION`[​](#enable_follow_up_generation "Direct link to enable_follow_up_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables follow up generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `FOLLOW_UP_GENERATION_PROMPT_TEMPLATE`[​](#follow_up_generation_prompt_template "Direct link to follow_up_generation_prompt_template")

* Type: `str`
* Description: Prompt to use for generating several relevant follow-up questions.
* Default: The value of `DEFAULT_FOLLOW_UP_GENERATION_PROMPT_TEMPLATE` environment variable.

`DEFAULT_FOLLOW_UP_GENERATION_PROMPT_TEMPLATE`:

```
### Task:  
Suggest 3-5 relevant follow-up questions or prompts that the user might naturally ask next in this conversation as a **user**, based on the chat history, to help continue or deepen the discussion.  
  
### Guidelines:  
- Write all follow-up questions from the user’s point of view, directed to the assistant.  
- Make questions concise, clear, and directly related to the discussed topic(s).  
- Only suggest follow-ups that make sense given the chat content and do not repeat what was already covered.  
- If the conversation is very short or not specific, suggest more general (but relevant) follow-ups the user might ask.  
- Use the conversation's primary language; default to English if multilingual.  
- Response must be a JSON array of strings, no extra text or formatting.  
  
### Output:  
JSON format: { "follow_ups": ["Question 1?", "Question 2?", "Question 3?"] }  
  
### Chat History:  
<chat_history>  
{{MESSAGES:END:6}}  
</chat_history>"
```

* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TOOLS_FUNCTION_CALLING_PROMPT_TEMPLATE`[​](#tools_function_calling_prompt_template "Direct link to tools_function_calling_prompt_template")

* Type: `str`
* Description: Prompt to use when calling tools.
* Default: The value of `DEFAULT_TOOLS_FUNCTION_CALLING_PROMPT_TEMPLATE` environment variable.

`DEFAULT_TOOLS_FUNCTION_CALLING_PROMPT_TEMPLATE`:

```
Available Tools: {{TOOLS}}  
  
Your task is to choose and return the correct tool(s) from the list of available tools based on the query. Follow these guidelines:  
  
- Return only the JSON object, without any additional text or explanation.  
  
- If no tools match the query, return an empty array:  
   {  
     "tool_calls": []  
   }  
  
- If one or more tools match the query, construct a JSON response containing a "tool_calls" array with objects that include:  
   - "name": The tool's name.  
   - "parameters": A dictionary of required parameters and their corresponding values.  
  
The format for the JSON response is strictly:  
{  
  "tool_calls": [  
    {"name": "toolName1", "parameters": {"key1": "value1"}},  
    {"name": "toolName2", "parameters": {"key2": "value2"}}  
  ]  
}
```

* Persistence: This environment variable is a `PersistentConfig` variable.

### Code Execution[​](#code-execution "Direct link to Code Execution")

#### `ENABLE_CODE_EXECUTION`[​](#enable_code_execution "Direct link to enable_code_execution")

* Type: `bool`
* Default: `True`
* Description: Enables or disables code execution.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_EXECUTION_ENGINE`[​](#code_execution_engine "Direct link to code_execution_engine")

* Type: `str`
* Default: `pyodide`
* Description: Specifies the code execution engine to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_EXECUTION_JUPYTER_URL`[​](#code_execution_jupyter_url "Direct link to code_execution_jupyter_url")

* Type: `str`
* Default: `None`
* Description: Specifies the Jupyter URL to use for code execution.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_EXECUTION_JUPYTER_AUTH`[​](#code_execution_jupyter_auth "Direct link to code_execution_jupyter_auth")

* Type: `str`
* Default: `None`
* Description: Specifies the Jupyter authentication method to use for code execution.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_EXECUTION_JUPYTER_AUTH_TOKEN`[​](#code_execution_jupyter_auth_token "Direct link to code_execution_jupyter_auth_token")

* Type: `str`
* Default: `None`
* Description: Specifies the Jupyter authentication token to use for code execution.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_EXECUTION_JUPYTER_AUTH_PASSWORD`[​](#code_execution_jupyter_auth_password "Direct link to code_execution_jupyter_auth_password")

* Type: `str`
* Default: `None`
* Description: Specifies the Jupyter authentication password to use for code execution.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_EXECUTION_JUPYTER_TIMEOUT`[​](#code_execution_jupyter_timeout "Direct link to code_execution_jupyter_timeout")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the timeout for Jupyter code execution.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Code Interpreter[​](#code-interpreter "Direct link to Code Interpreter")

#### `ENABLE_CODE_INTERPRETER`[​](#enable_code_interpreter "Direct link to enable_code_interpreter")

* Type: `bool`
* Default: `True`
* Description: Enables or disables code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_ENGINE`[​](#code_interpreter_engine "Direct link to code_interpreter_engine")

* Type: `str`
* Default: `pyodide`
* Description: Specifies the code interpreter engine to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_BLACKLISTED_MODULES`[​](#code_interpreter_blacklisted_modules "Direct link to code_interpreter_blacklisted_modules")

* Type: `str` (comma-separated list of module names)
* Default: None
* Description: Specifies a comma-separated list of Python modules that are blacklisted and cannot be imported or used within the code interpreter. This enhances security by preventing access to potentially sensitive or system-level functionalities.

#### `CODE_INTERPRETER_PROMPT_TEMPLATE`[​](#code_interpreter_prompt_template "Direct link to code_interpreter_prompt_template")

* Type: `str`
* Default: `None`
* Description: Specifies the prompt template to use for code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_JUPYTER_URL`[​](#code_interpreter_jupyter_url "Direct link to code_interpreter_jupyter_url")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the Jupyter URL to use for code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_JUPYTER_AUTH`[​](#code_interpreter_jupyter_auth "Direct link to code_interpreter_jupyter_auth")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the Jupyter authentication method to use for code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_JUPYTER_AUTH_TOKEN`[​](#code_interpreter_jupyter_auth_token "Direct link to code_interpreter_jupyter_auth_token")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the Jupyter authentication token to use for code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_JUPYTER_AUTH_PASSWORD`[​](#code_interpreter_jupyter_auth_password "Direct link to code_interpreter_jupyter_auth_password")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the Jupyter authentication password to use for code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CODE_INTERPRETER_JUPYTER_TIMEOUT`[​](#code_interpreter_jupyter_timeout "Direct link to code_interpreter_jupyter_timeout")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the timeout for the Jupyter code interpreter.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Direct Connections (OpenAPI/MCPO Tool Servers)[​](#direct-connections-openapimcpo-tool-servers "Direct link to Direct Connections (OpenAPI/MCPO Tool Servers)")

#### `ENABLE_DIRECT_CONNECTIONS`[​](#enable_direct_connections "Direct link to enable_direct_connections")

* Type: `bool`
* Default: `True`
* Description: Enables or disables direct connections.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TOOL_SERVER_CONNECTIONS`[​](#tool_server_connections "Direct link to tool_server_connections")

* Type: `str` (JSON array)
* Default: `[]`
* Description: Specifies a JSON array of tool server connection configurations. Each connection should define the necessary parameters to connect to external tool servers that implement the OpenAPI/MCPO protocol. The JSON must be properly formatted or it will fallback to an empty array.
* Example: `'[{"name": "example-server", "url": "https://api.example.com", "api_key": "your-key"}]'`
* Persistence: This environment variable is a `PersistentConfig` variable.

### Autocomplete[​](#autocomplete "Direct link to Autocomplete")

#### `ENABLE_AUTOCOMPLETE_GENERATION`[​](#enable_autocomplete_generation "Direct link to enable_autocomplete_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables autocomplete generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

When enabling `ENABLE_AUTOCOMPLETE_GENERATION`, ensure that you also configure `AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH` and `AUTOCOMPLETE_GENERATION_PROMPT_TEMPLATE` accordingly.

#### `AUTOCOMPLETE_GENERATION_INPUT_MAX_LENGTH`[​](#autocomplete_generation_input_max_length "Direct link to autocomplete_generation_input_max_length")

* Type: `int`
* Default: `-1`
* Description: Sets the maximum input length for autocomplete generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUTOCOMPLETE_GENERATION_PROMPT_TEMPLATE`[​](#autocomplete_generation_prompt_template "Direct link to autocomplete_generation_prompt_template")

* Type: `str`
* Default: The value of the `DEFAULT_AUTOCOMPLETE_GENERATION_PROMPT_TEMPLATE` environment variable.

`DEFAULT_AUTOCOMPLETE_GENERATION_PROMPT_TEMPLATE`:

```
### Task:  
You are an autocompletion system. Continue the text in `<text>` based on the **completion type** in `<type>` and the given language.  
  
### **Instructions**:  
1. Analyze `<text>` for context and meaning.  
2. Use `<type>` to guide your output:  
   - **General**: Provide a natural, concise continuation.  
   - **Search Query**: Complete as if generating a realistic search query.  
3. Start as if you are directly continuing `<text>`. Do **not** repeat, paraphrase, or respond as a model. Simply complete the text.  
4. Ensure the continuation:  
   - Flows naturally from `<text>`.  
   - Avoids repetition, overexplaining, or unrelated ideas.  
5. If unsure, return: `{ "text": "" }`.  
  
### **Output Rules**:  
- Respond only in JSON format: `{ "text": "<your_completion>" }`.  
  
### **Examples**:  
  
#### Example 1:  
Input:  
<type>General</type>  
<text>The sun was setting over the horizon, painting the sky</text>  
Output:  
{ "text": "with vibrant shades of orange and pink." }  
  
#### Example 2:  
Input:  
<type>Search Query</type>  
<text>Top-rated restaurants in</text>  
Output:  
{ "text": "New York City for Italian cuisine." }  
  
---  
  
### Context:  
<chat_history>  
{{MESSAGES:END:6}}  
</chat_history>  
<type>{{TYPE}}</type>  
<text>{{PROMPT}}</text>  
  
#### Output:
```

* Description: Sets the prompt template for autocomplete generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Evaluation Arena Model[​](#evaluation-arena-model "Direct link to Evaluation Arena Model")

#### `ENABLE_EVALUATION_ARENA_MODELS`[​](#enable_evaluation_arena_models "Direct link to enable_evaluation_arena_models")

* Type: `bool`
* Default: `True`
* Description: Enables or disables evaluation arena models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_MESSAGE_RATING`[​](#enable_message_rating "Direct link to enable_message_rating")

* Type: `bool`
* Default: `True`
* Description: Enables message rating feature.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_COMMUNITY_SHARING`[​](#enable_community_sharing "Direct link to enable_community_sharing")

* Type: `bool`
* Default: `True`
* Description: Controls whether users are shown the share to community button.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Tags Generation[​](#tags-generation "Direct link to Tags Generation")

#### `ENABLE_TAGS_GENERATION`[​](#enable_tags_generation "Direct link to enable_tags_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables tag generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TAGS_GENERATION_PROMPT_TEMPLATE`[​](#tags_generation_prompt_template "Direct link to tags_generation_prompt_template")

* Type: `str`
* Default: The value of `DEFAULT_TAGS_GENERATION_PROMPT_TEMPLATE` environment variable.

`DEFAULT_TAGS_GENERATION_PROMPT_TEMPLATE`:

```
### Task:  
Generate 1-3 broad tags categorizing the main themes of the chat history, along with 1-3 more specific subtopic tags.  
  
### Guidelines:  
- Start with high-level domains (e.g., Science, Technology, Philosophy, Arts, Politics, Business, Health, Sports, Entertainment, Education)  
- Consider including relevant subfields/subdomains if they are strongly represented throughout the conversation  
- If content is too short (less than 3 messages) or too diverse, use only ["General"]  
- Use the chat's primary language; default to English if multilingual  
- Prioritize accuracy over specificity  
  
### Output:  
JSON format: { "tags": ["tag1", "tag2", "tag3"] }  
  
### Chat History:  
<chat_history>  
{{MESSAGES:END:6}}  
</chat_history>
```

* Description: Sets the prompt template for tag generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

### API Key Endpoint Restrictions[​](#api-key-endpoint-restrictions "Direct link to API Key Endpoint Restrictions")

#### `ENABLE_API_KEY`[​](#enable_api_key "Direct link to enable_api_key")

* Type: `bool`
* Default: `True`
* Description: Enables API key authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_API_KEY_ENDPOINT_RESTRICTIONS`[​](#enable_api_key_endpoint_restrictions "Direct link to enable_api_key_endpoint_restrictions")

* Type: `bool`
* Default: `False`
* Description: Enables API key endpoint restrictions for added security and configurability.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `API_KEY_ALLOWED_ENDPOINTS`[​](#api_key_allowed_endpoints "Direct link to api_key_allowed_endpoints")

* Type: `str`
* Description: Specifies a comma-separated list of allowed API endpoints when API key endpoint restrictions are enabled.
* Persistence: This environment variable is a `PersistentConfig` variable.

note

The value of `API_KEY_ALLOWED_ENDPOINTS` should be a comma-separated list of endpoint URLs, such as `/api/v1/messages, /api/v1/channels`.

#### `JWT_EXPIRES_IN`[​](#jwt_expires_in "Direct link to jwt_expires_in")

* Type: `str`
* Default: `4w`
* Description: Sets the JWT expiration time in seconds. Valid time units: `s`, `m`, `h`, `d`, `w` or `-1` for no expiration.
* Persistence: This environment variable is a `PersistentConfig` variable.

warning

Setting `JWT_EXPIRES_IN` to `-1` disables JWT expiration, making issued tokens valid forever. **This is extremely dangerous in production** and exposes your system to severe security risks if tokens are leaked or compromised.

**Always set a reasonable expiration time in production environments (e.g., `3600s`, `1h`, `7d` etc.) to limit the lifespan of authentication tokens.**

**NEVER use `-1` in a production environment.**

If you have already deployed with `JWT_EXPIRES_IN=-1`, you can rotate or change your `WEBUI_SECRET_KEY` to immediately invalidate all existing tokens.

Security Variables[​](#security-variables "Direct link to Security Variables")
------------------------------------------------------------------------------

#### `ENABLE_FORWARD_USER_INFO_HEADERS`[​](#enable_forward_user_info_headers "Direct link to enable_forward_user_info_headers")

* type: `bool`
* Default: `False`
* Description: Forwards user information (name, ID, email, role and chat-id) as X-headers to OpenAI API and Ollama API.
  If enabled, the following headers are forwarded:
  + `X-OpenWebUI-User-Name`
  + `X-OpenWebUI-User-Id`
  + `X-OpenWebUI-User-Email`
  + `X-OpenWebUI-User-Role`
  + `X-OpenWebUI-Chat-Id`

#### `ENABLE_WEB_LOADER_SSL_VERIFICATION`[​](#enable_web_loader_ssl_verification "Direct link to enable_web_loader_ssl_verification")

* Type: `bool`
* Default: `True`
* Description: Bypass SSL Verification for RAG on Websites.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WEBUI_SESSION_COOKIE_SAME_SITE`[​](#webui_session_cookie_same_site "Direct link to webui_session_cookie_same_site")

* Type: `str`
* Options:
  + `lax` - Sets the `SameSite` attribute to lax, allowing session cookies to be sent with
    requests initiated by third-party websites.
  + `strict` - Sets the `SameSite` attribute to strict, blocking session cookies from being sent
    with requests initiated by third-party websites.
  + `none` - Sets the `SameSite` attribute to none, allowing session cookies to be sent with
    requests initiated by third-party websites, but only over HTTPS.
* Default: `lax`
* Description: Sets the `SameSite` attribute for session cookies.

warning

When `ENABLE_OAUTH_SIGNUP` is enabled, setting `WEBUI_SESSION_COOKIE_SAME_SITE` to `strict` can cause login failures. This is because Open WebUI uses a session cookie to validate the callback from the OAuth provider, which helps prevent CSRF attacks.

However, a `strict` session cookie is not sent with the callback request, leading to potential login issues. If you experience this problem, use the default `lax` value instead.

#### `WEBUI_SESSION_COOKIE_SECURE`[​](#webui_session_cookie_secure "Direct link to webui_session_cookie_secure")

* Type: `bool`
* Default: `False`
* Description: Sets the `Secure` attribute for session cookies if set to `True`.

#### `WEBUI_AUTH_COOKIE_SAME_SITE`[​](#webui_auth_cookie_same_site "Direct link to webui_auth_cookie_same_site")

* Type: `str`
* Options:
  + `lax` - Sets the `SameSite` attribute to lax, allowing auth cookies to be sent with
    requests initiated by third-party websites.
  + `strict` - Sets the `SameSite` attribute to strict, blocking auth cookies from being sent
    with requests initiated by third-party websites.
  + `none` - Sets the `SameSite` attribute to none, allowing auth cookies to be sent with
    requests initiated by third-party websites, but only over HTTPS.
* Default: `lax`
* Description: Sets the `SameSite` attribute for auth cookies.

info

If the value is not set, `WEBUI_SESSION_COOKIE_SAME_SITE` will be used as a fallback.

#### `WEBUI_AUTH_COOKIE_SECURE`[​](#webui_auth_cookie_secure "Direct link to webui_auth_cookie_secure")

* Type: `bool`
* Default: `False`
* Description: Sets the `Secure` attribute for auth cookies if set to `True`.

info

If the value is not set, `WEBUI_SESSION_COOKIE_SECURE` will be used as a fallback.

#### `WEBUI_AUTH`[​](#webui_auth "Direct link to webui_auth")

* Type: `bool`
* Default: `True`
* Description: This setting enables or disables authentication.

danger

If set to `False`, authentication will be disabled for your Open WebUI instance. However, it's
important to note that turning off authentication is only possible for fresh installations without
any existing users. If there are already users registered, you cannot disable authentication
directly. Ensure that no users are present in the database if you intend to turn off `WEBUI_AUTH`.

#### `WEBUI_SECRET_KEY`[​](#webui_secret_key "Direct link to webui_secret_key")

* Type: `str`
* Default: `t0p-s3cr3t`
* Docker Default: Randomly generated on first start
* Description: Overrides the randomly generated string used for JSON Web Token.

info

This variable is always needed when using OAUTH, especially in clustered environments, but even in single-process environments.

Otherwise, OAUTH issues may occur.

#### `ENABLE_VERSION_UPDATE_CHECK`[​](#enable_version_update_check "Direct link to enable_version_update_check")

* Type: `bool`
* Default: `True`
* Description: When enabled, the application makes automatic update checks and notifies you about version updates.

info

If `OFFLINE_MODE` is enabled, this `ENABLE_VERSION_UPDATE_CHECK` flag is always set to `false` automatically.

#### `OFFLINE_MODE`[​](#offline_mode "Direct link to offline_mode")

* Type: `bool`
* Default: `False`
* Description: Disables Open WebUI's network connections for update checks and automatic model downloads.

info

**Disabled when enabled:**

* Automatic version update checks (see flag `ENABLE_VERSION_UPDATE_CHECK`)
* Downloads of embedding models from Hugging Face Hub
  + If you did not download an embedding model prior to activating `OFFLINE_MODE` any RAG, web search and document analysis functionality may not work properly
* Update notifications in the UI (see flag `ENABLE_VERSION_UPDATE_CHECK`)

**Still functional:**

* External LLM API connections (OpenAI, etc.)
* OAuth authentication providers
* Web search and RAG with external APIs

Read more about `offline mode` in the [offline mode guide](/tutorials/offline-mode).

#### `RESET_CONFIG_ON_START`[​](#reset_config_on_start "Direct link to reset_config_on_start")

* Type: `bool`
* Default: `False`
* Description: Resets the `config.json` file on startup.

#### `SAFE_MODE`[​](#safe_mode "Direct link to safe_mode")

* Type: `bool`
* Default: `False`
* Description: Enables safe mode, which disables potentially unsafe features, deactivating all functions.

#### `CORS_ALLOW_ORIGIN`[​](#cors_allow_origin "Direct link to cors_allow_origin")

* Type: `str`
* Default: `*`
* Description: Sets the allowed origins for Cross-Origin Resource Sharing (CORS).

#### `CORS_ALLOW_CUSTOM_SCHEME`[​](#cors_allow_custom_scheme "Direct link to cors_allow_custom_scheme")

* Type `str`
* Default: `""` (empty string)
* Description: Sets a list of further allowed schemes for Cross-Origin Resource Sharing (CORS). Allows you to specify additional custom URL schemes, beyond the standard `http` and `https`, that are permitted as valid origins for Cross-Origin Resource Sharing (CORS).

info

This is particularly useful for scenarios such as:

* Integrating with desktop applications that use custom protocols (e.g., `app://`, `custom-app-scheme://`).
* Local development environments or testing setups that might employ non-standard schemes (e.g., `file://` if applicable, or `electron://`).

Provide a semicolon-separated list of scheme names without the `://`. For example: `app;file;electron;my-custom-scheme`.

When configured, these custom schemes will be validated alongside `http` and `https` for any origins specified in `CORS_ALLOW_ORIGIN`.

#### `RAG_EMBEDDING_MODEL_TRUST_REMOTE_CODE`[​](#rag_embedding_model_trust_remote_code "Direct link to rag_embedding_model_trust_remote_code")

* Type: `bool`
* Default: `False`
* Description: Determines whether to allow custom models defined on the Hub in their own modeling files.

#### `RAG_RERANKING_MODEL_TRUST_REMOTE_CODE`[​](#rag_reranking_model_trust_remote_code "Direct link to rag_reranking_model_trust_remote_code")

* Type: `bool`
* Default: `False`
* Description: Determines whether to allow custom models defined on the Hub in their own.
  modeling files for reranking.

#### `RAG_EMBEDDING_MODEL_AUTO_UPDATE`[​](#rag_embedding_model_auto_update "Direct link to rag_embedding_model_auto_update")

* Type: `bool`
* Default: `True`
* Description: Toggles automatic update of the Sentence-Transformer model.

#### `RAG_RERANKING_MODEL_AUTO_UPDATE`[​](#rag_reranking_model_auto_update "Direct link to rag_reranking_model_auto_update")

* Type: `bool`
* Default: `True`
* Description: Toggles automatic update of the reranking model.

Vector Database[​](#vector-database "Direct link to Vector Database")
---------------------------------------------------------------------

#### `VECTOR_DB`[​](#vector_db "Direct link to vector_db")

* Type: `str`
* Options:
* `chroma`, `elasticsearch`, `milvus`, `opensearch`, `pgvector`, `qdrant`, `pinecone`, `s3vector`, `oracle23ai`
* Default: `chroma`
* Description: Specifies which vector database system to use. This setting determines which vector storage system will be used for managing embeddings.

note

PostgreSQL Dependencies
To use `pgvector`, ensure you have PostgreSQL dependencies installed:

```
pip install open-webui[all]
```

### ChromaDB[​](#chromadb "Direct link to ChromaDB")

#### `CHROMA_TENANT`[​](#chroma_tenant "Direct link to chroma_tenant")

* Type: `str`
* Default: The value of `chromadb.DEFAULT_TENANT` (a constant in the `chromadb` module)
* Description: Sets the tenant for ChromaDB to use for RAG embeddings.

#### `CHROMA_DATABASE`[​](#chroma_database "Direct link to chroma_database")

* Type: `str`
* Default: The value of `chromadb.DEFAULT_DATABASE` (a constant in the `chromadb` module)
* Description: Sets the database in the ChromaDB tenant to use for RAG embeddings.

#### `CHROMA_HTTP_HOST`[​](#chroma_http_host "Direct link to chroma_http_host")

* Type: `str`
* Description: Specifies the hostname of a remote ChromaDB Server. Uses a local ChromaDB instance if not set.

#### `CHROMA_HTTP_PORT`[​](#chroma_http_port "Direct link to chroma_http_port")

* Type: `int`
* Default: `8000`
* Description: Specifies the port of a remote ChromaDB Server.

#### `CHROMA_HTTP_HEADERS`[​](#chroma_http_headers "Direct link to chroma_http_headers")

* Type: `str`
* Description: A comma-separated list of HTTP headers to include with every ChromaDB request.
* Example: `Authorization=Bearer heuhagfuahefj,User-Agent=OpenWebUI`.

#### `CHROMA_HTTP_SSL`[​](#chroma_http_ssl "Direct link to chroma_http_ssl")

* Type: `bool`
* Default: `False`
* Description: Controls whether or not SSL is used for ChromaDB Server connections.

#### `CHROMA_CLIENT_AUTH_PROVIDER`[​](#chroma_client_auth_provider "Direct link to chroma_client_auth_provider")

* Type: `str`
* Description: Specifies an authentication provider for remote ChromaDB Server.
* Example: `chromadb.auth.basic_authn.BasicAuthClientProvider`

#### `CHROMA_CLIENT_AUTH_CREDENTIALS`[​](#chroma_client_auth_credentials "Direct link to chroma_client_auth_credentials")

* Type: `str`
* Description: Specifies auth credentials for remote ChromaDB Server.
* Example: `username:password`

### Elasticsearch[​](#elasticsearch "Direct link to Elasticsearch")

#### `ELASTICSEARCH_API_KEY`[​](#elasticsearch_api_key "Direct link to elasticsearch_api_key")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the Elasticsearch API key.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ELASTICSEARCH_CA_CERTS`[​](#elasticsearch_ca_certs "Direct link to elasticsearch_ca_certs")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the path to the CA certificates for Elasticsearch.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ELASTICSEARCH_CLOUD_ID`[​](#elasticsearch_cloud_id "Direct link to elasticsearch_cloud_id")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the Elasticsearch cloud ID.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ELASTICSEARCH_INDEX_PREFIX`[​](#elasticsearch_index_prefix "Direct link to elasticsearch_index_prefix")

* Type: `str`
* Default: `open_webui_collections`
* Description: Specifies the prefix for the Elasticsearch index.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ELASTICSEARCH_PASSWORD`[​](#elasticsearch_password "Direct link to elasticsearch_password")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the password for Elasticsearch.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ELASTICSEARCH_URL`[​](#elasticsearch_url "Direct link to elasticsearch_url")

* Type: `str`
* Default: `https://localhost:9200`
* Description: Specifies the URL for the Elasticsearch instance.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ELASTICSEARCH_USERNAME`[​](#elasticsearch_username "Direct link to elasticsearch_username")

* Type: `str`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the username for Elasticsearch.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Milvus[​](#milvus "Direct link to Milvus")

#### `MILVUS_URI`[​](#milvus_uri "Direct link to milvus_uri")

* Type: `str`
* Default: `${DATA_DIR}/vector_db/milvus.db`
* Description: Specifies the URI for connecting to the Milvus vector database. This can point to a local or remote Milvus server based on the deployment configuration.

#### `MILVUS_DB`[​](#milvus_db "Direct link to milvus_db")

* Type: `str`
* Default: `default`
* Description: Specifies the database to connect to within a Milvus instance.

#### `MILVUS_TOKEN`[​](#milvus_token "Direct link to milvus_token")

* Type: `str`
* Default: `None`
* Description: Specifies an optional connection token for Milvus.

#### `MILVUS_INDEX_TYPE`[​](#milvus_index_type "Direct link to milvus_index_type")

* Type: `str`
* Default: `HNSW`
* Options: `AUTOINDEX`, `FLAT`, `IVF_FLAT`, `HNSW`, `DISKANN`
* Description: Specifies the index type to use when creating a new collection in Milvus. `AUTOINDEX` is generally recommended for Milvus standalone. `HNSW` may offer better performance but requires a clustered Milvus setup and is not meant for standalone setups.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MILVUS_METRIC_TYPE`[​](#milvus_metric_type "Direct link to milvus_metric_type")

* Type: `str`
* Default: `COSINE`
* Options: `COSINE`, `IP`, `L2`
* Description: Specifies the metric type for vector similarity search in Milvus.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MILVUS_HNSW_M`[​](#milvus_hnsw_m "Direct link to milvus_hnsw_m")

* Type: `int`
* Default: `16`
* Description: Specifies the `M` parameter for the HNSW index type in Milvus. This influences the number of bi-directional links created for each new element during construction. Only applicable if `MILVUS_INDEX_TYPE` is `HNSW`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MILVUS_HNSW_EFCONSTRUCTION`[​](#milvus_hnsw_efconstruction "Direct link to milvus_hnsw_efconstruction")

* Type: `int`
* Default: `100`
* Description: Specifies the `efConstruction` parameter for the HNSW index type in Milvus. This influences the size of the dynamic list for the nearest neighbors during index construction. Only applicable if `MILVUS_INDEX_TYPE` is `HNSW`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MILVUS_IVF_FLAT_NLIST`[​](#milvus_ivf_flat_nlist "Direct link to milvus_ivf_flat_nlist")

* Type: `int`
* Default: `128`
* Description: Specifies the `nlist` parameter for the IVF\_FLAT index type in Milvus. This is the number of cluster units. Only applicable if `MILVUS_INDEX_TYPE` is `IVF_FLAT`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MILVUS_DISKANN_MAX_DEGREE`[​](#milvus_diskann_max_degree "Direct link to milvus_diskann_max_degree")

* Type: `int`
* Default: `56`
* Description: Sets the max degree for Milvus if Milvus is in DISKANN indexing mode. Generally recommended to leave as is.

#### `MILVUS_DISKANN_SEARCH_LIST_SIZE`[​](#milvus_diskann_search_list_size "Direct link to milvus_diskann_search_list_size")

* Type: `int`
* Default: `100`
* Description: Sets the Milvus DISKANN search list size. Generally recommended to leave as is.

#### `ENABLE_MILVUS_MULTITENANCY_MODE`[​](#enable_milvus_multitenancy_mode "Direct link to enable_milvus_multitenancy_mode")

* Type: `bool`
* Default: `false`
* Description: Enables multitenancy pattern for Milvus collections management, which significantly reduces RAM usage and computational overhead by consolidating similar vector data structures. Controls whether Milvus uses multitenancy collection architecture. When enabled, all vector data is consolidated into 5 shared collections (memories, knowledge, files, web\_search, hash\_based) instead of creating individual collections per resource. Data isolation is achieved via a resource\_id field rather than collection-level separation.

info

**Benefits of multitenancy mode:**

* Significantly reduced RAM consumption (5 collections vs potentially hundreds)
* Lower computational overhead from collection management
* Faster cold-start times
* Reduced index maintenance burden

**Technical implementation:**

* All memories go into `{prefix}_memories`
* All knowledge bases go into `{prefix}_knowledge`
* All uploaded files go into `{prefix}_files`
* Web search results go into `{prefix}_web_search`
* Hash-based collections go into `{prefix}_hash_based`
* Each entry includes a resource\_id field matching the original collection name
* Queries automatically filter by resource\_id to maintain data isolation

info

**Migration from Legacy Mode to Multitenancy**

**What happens when you enable multitenancy when you already have a normal milvus database with data in it:**

* Existing collections (pattern: `open_webui_{collection_name}`) remain in Milvus but **become inaccessible** to Open WebUI
* New data is written to the 5 shared multitenancy collections
* Application treats knowledge bases as empty until reindexed
* Files and memories are NOT automatically migrated to the new collection schema and will appear missing

**Clean migration path from normal Milvus to multitenancy milvus:**

* Before enabling multitenancy, export any critical knowledge content from the UI if possible
* Set `ENABLE_MILVUS_MULTITENANCY_MODE=true` and restart Open WebUI
* Navigate to `Admin Settings > Documents > Click Reindex Knowledge Base`

**This rebuilds ONLY knowledge base vectors into the new multitenancy collections**
**Files, user memories, and web search history are NOT migrated by this operation**

**Verify knowledge bases are accessible and functional**

* Re-upload files if file-based retrieval is critical (file metadata remains but vectors are not migrated)
* User chat memories will need to be regenerated through new conversations

**Cleaning up legacy collections:**
After successful migration (from milvus to multitenancy milvus), legacy collections still consume resources. Remove them manually:

* Connect to Milvus using the native client (pymilvus or Attu UI)
* Delete all old collections

**Current UI limitations:**

* No one-click "migrate and cleanup" button exists
* Vector DB reset from UI (Admin Settings > Documents > Reset Vector Storage/Knowledge) only affects the active mode's collections
* Legacy collections require manual cleanup via Milvus client tools

warning

**Critical Considerations**

**Before enabling multitenancy on an existing installation:**

* Data loss risk: File vectors and user memory vectors are NOT migrated automatically. Only knowledge base content can be reindexed (migrated).
* Collection naming dependency: Multitenancy relies on Open WebUI's internal collection naming conventions (user-memory-, file-, web-search-, hash patterns). **If Open WebUI changes these conventions in future updates, multitenancy routing may break, causing data corruption or incorrect data retrieval across isolated resources.**
* No automatic rollback: Disabling multitenancy after data is written will not restore access to the shared collections. Data would need manual extraction and re-import.

**For fresh installations:**

* Multitenancy is recommended and enabled by default (true)
* No migration concerns exist

**For existing installations with valuable data:**

* Do not migrate to multitenancy mode if you do not want to handle migration and risk data loss
* Understand that files and memories require re-upload/regeneration
* Test migration on a backup/staging environment first
* Consider if RAM savings justify the migration effort for your use case

**To perform a full reset and switch to multitenancy:**

* Backup any critical knowledge base content externally
* Navigate to `Admin Settings > Documents`
* Click `Reset Vector Storage/Knowledge` (this deletes all active mode collections and stored knowledge metadata)
* Set `ENABLE_MILVUS_MULTITENANCY_MODE=true`
* Restart Open WebUI
* Re-upload/re-create knowledge bases from scratch

#### `MILVUS_COLLECTION_PREFIX`[​](#milvus_collection_prefix "Direct link to milvus_collection_prefix")

* Type: `str`
* Default: `open_webui`
* Description: Sets the prefix for Milvus collection names. In multitenancy mode, collections become `{prefix}_memories`, `{prefix}_knowledge`, etc. In legacy mode, collections are `{prefix}_{collection_name}`. Changing this value creates an entirely separate namespace—existing collections with the old prefix become invisible to Open WebUI but remain in Milvus consuming resources. Use this for true multi-instance isolation on a shared Milvus server, not for migration between modes. Milvus only accepts underscores, hyphens/dashes are not possible and will cause errors.

### OpenSearch[​](#opensearch "Direct link to OpenSearch")

#### `OPENSEARCH_CERT_VERIFY`[​](#opensearch_cert_verify "Direct link to opensearch_cert_verify")

* Type: `bool`
* Default: `False`
* Description: Enables or disables OpenSearch certificate verification.

#### `OPENSEARCH_PASSWORD`[​](#opensearch_password "Direct link to opensearch_password")

* Type: `str`
* Default: `None`
* Description: Sets the password for OpenSearch.

#### `OPENSEARCH_SSL`[​](#opensearch_ssl "Direct link to opensearch_ssl")

* Type: `bool`
* Default: `True`
* Description: Enables or disables SSL for OpenSearch.

#### `OPENSEARCH_URI`[​](#opensearch_uri "Direct link to opensearch_uri")

* Type: `str`
* Default: `https://localhost:9200`
* Description: Sets the URI for OpenSearch.

#### `OPENSEARCH_USERNAME`[​](#opensearch_username "Direct link to opensearch_username")

* Type: `str`
* Default: `None`
* Description: Sets the username for OpenSearch.

### PGVector[​](#pgvector "Direct link to PGVector")

note

PostgreSQL Dependencies
To use `pgvector`, ensure you have PostgreSQL dependencies installed:

```
pip install open-webui[all]
```

#### `PGVECTOR_DB_URL`[​](#pgvector_db_url "Direct link to pgvector_db_url")

* Type: `str`
* Default: The value of the `DATABASE_URL` environment variable
* Description: Sets the database URL for model storage.

#### `PGVECTOR_INITIALIZE_MAX_VECTOR_LENGTH`[​](#pgvector_initialize_max_vector_length "Direct link to pgvector_initialize_max_vector_length")

* Type: `str`
* Default: `1536`
* Description: Specifies the maximum vector length for PGVector initialization.

#### `PGVECTOR_CREATE_EXTENSION`[​](#pgvector_create_extension "Direct link to pgvector_create_extension")

* Type: `str`
* Default `true`
* Description: Creates the vector extension in the database

info

If set to `false`, open-webui will assume the postgreSQL database where embeddings will be stored is pre-configured with the `vector` extension. This also allows open-webui to run as a non superuser database user.

### Qdrant[​](#qdrant "Direct link to Qdrant")

#### `QDRANT_API_KEY`[​](#qdrant_api_key "Direct link to qdrant_api_key")

* Type: `str`
* Description: Sets the API key for Qdrant.

#### `QDRANT_URI`[​](#qdrant_uri "Direct link to qdrant_uri")

* Type: `str`
* Description: Sets the URI for Qdrant.

#### `QDRANT_ON_DISK`[​](#qdrant_on_disk "Direct link to qdrant_on_disk")

* Type: `bool`
* Default: `False`
* Description: Enable the usage of memmap(also known as on-disk) storage

#### `QDRANT_PREFER_GRPC`[​](#qdrant_prefer_grpc "Direct link to qdrant_prefer_grpc")

* Type: `bool`
* Default: `False`
* Description: Use gPRC interface whenever possible.

info

If set to `True`, and `QDRANT_URI` points to a self-hosted server with TLS enabled and certificate signed by a private CA, set the environment variable `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH` to the path of your PEM-encoded CA certificates file. See the [gRPC Core Docs](https://grpc.github.io/grpc/core/md_doc_environment_variables.html) for more information.

#### `QDRANT_GRPC_PORT`[​](#qdrant_grpc_port "Direct link to qdrant_grpc_port")

* Type: `int`
* Default: `6334`
* Description: Sets the gRPC port number for Qdrant.

#### `QDRANT_TIMEOUT`[​](#qdrant_timeout "Direct link to qdrant_timeout")

* Type: `int`
* Default: `5`
* Description: Sets the timeout in seconds for all requests made to the Qdrant server, helping to prevent long-running queries from stalling the application.

#### `QDRANT_HNSW_M`[​](#qdrant_hnsw_m "Direct link to qdrant_hnsw_m")

* Type: `int`
* Default: `16`
* Description: Controls the HNSW (Hierarchical Navigable Small World) index construction. In standard mode, this sets the `m` parameter. In multi-tenancy mode, this value is used for the `payload_m` parameter to build indexes on the payload, as the global `m` is disabled for performance, following Qdrant best practices.

#### `ENABLE_QDRANT_MULTITENANCY_MODE`[​](#enable_qdrant_multitenancy_mode "Direct link to enable_qdrant_multitenancy_mode")

* Type: `bool`
* Default: `True`
* Description: Enables multitenancy pattern for Qdrant collections management, which significantly reduces RAM usage and computational overhead by consolidating similar vector data structures. Recommend turn on

info

This will disconect all Qdrant collections created in the previous pattern, which is non-multitenancy. Go to `Admin Settings` > `Documents` > `Reindex Knowledge Base` to migrate existing knowledges.

The Qdrant collections created in the previous pattern will still consume resources.

Currently, there is no button in the UI to only reset the vector DB. If you want to migrate knowledge to multitenancy:

* Remove all collections with the `open_webui-knowledge` prefix (or `open_webui` prefix to remove all collections related to Open WebUI) using the native Qdrant client
* Go to `Admin Settings` > `Documents` > `Reindex Knowledge Base` to migrate existing knowledge base

`Reindex Knowledge Base` will ONLY migrate the knowledge base

danger

If you decide to use the multitenancy pattern as your default and you don't need to migrate old knowledge, go to `Admin Settings` > `Documents` to reset vector and knowledge, which will delete all collections with the `open_webui` prefix and all stored knowledge.

#### `QDRANT_COLLECTION_PREFIX`[​](#qdrant_collection_prefix "Direct link to qdrant_collection_prefix")

* Type: `str`
* Default: `open-webui`
* Description: Sets the prefix for Qdrant collection names. Useful for namespacing or isolating collections, especially in multitenancy mode. Changing this value will cause the application to use a different set of collections in Qdrant. Existing collections with a different prefix will not be affected.

### Pinecone[​](#pinecone "Direct link to Pinecone")

When using Pinecone as the vector store, the following environment variables are used to control its behavior. Make sure to set these variables in your `.env` file or deployment environment.

#### `PINECONE_API_KEY`[​](#pinecone_api_key "Direct link to pinecone_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key used to authenticate with the Pinecone service.

#### `PINECONE_ENVIRONMENT`[​](#pinecone_environment "Direct link to pinecone_environment")

* Type: `str`
* Default: `None`
* Description: Specifies the Pinecone environment to connect to (e.g., `us-west1-gcp`, `gcp-starter`, etc.).

#### `PINECONE_INDEX_NAME`[​](#pinecone_index_name "Direct link to pinecone_index_name")

* Type: `str`
* Default: `open-webui-index`
* Description: Defines the name of the Pinecone index that will be used to store and query vector embeddings.

#### `PINECONE_DIMENSION`[​](#pinecone_dimension "Direct link to pinecone_dimension")

* Type: `int`
* Default: `1536`
* Description: The dimensionality of the vector embeddings. Must match the dimension expected by the index (commonly 768, 1024, 1536, or 3072 based on model used).

#### `PINECONE_METRIC`[​](#pinecone_metric "Direct link to pinecone_metric")

* Type: `str`
* Default: `cosine`
* Options: `cosine`, `dotproduct`, `euclidean`
* Description: Specifies the similarity metric to use for vector comparisons within the Pinecone index.

#### `PINECONE_CLOUD`[​](#pinecone_cloud "Direct link to pinecone_cloud")

* Type: `str`
* Default: `aws`
* Options: `aws`, `gcp`, `azure`
* Description: Specifies the cloud provider where the Pinecone index is hosted.

### Oracle 23ai Vector Search (oracle23ai)[​](#oracle-23ai-vector-search-oracle23ai "Direct link to Oracle 23ai Vector Search (oracle23ai)")

#### `ORACLE_DB_USE_WALLET`[​](#oracle_db_use_wallet "Direct link to oracle_db_use_wallet")

* **Type**: `bool`
* **Default**: `false`
* **Description**: Determines the connection method to the Oracle Database.
  + Set to `false` for direct connections (e.g., to Oracle Database 23ai Free or DBCS instances) using host, port, and service name in `ORACLE_DB_DSN`.
  + Set to `true` for wallet-based connections (e.g., to Oracle Autonomous Database (ADW/ATP)). When `true`, `ORACLE_WALLET_DIR` and `ORACLE_WALLET_PASSWORD` must also be configured.

#### `ORACLE_DB_USER`[​](#oracle_db_user "Direct link to oracle_db_user")

* **Type**: `str`
* **Default**: `DEMOUSER`
* **Description**: Specifies the username used to connect to the Oracle Database.

#### `ORACLE_DB_PASSWORD`[​](#oracle_db_password "Direct link to oracle_db_password")

* **Type**: `str`
* **Default**: `Welcome123456`
* **Description**: Specifies the password for the `ORACLE_DB_USER`.

#### `ORACLE_DB_DSN`[​](#oracle_db_dsn "Direct link to oracle_db_dsn")

* **Type**: `str`
* **Default**: `localhost:1521/FREEPDB1`
* **Description**: Defines the Data Source Name for the Oracle Database connection.
  + If `ORACLE_DB_USE_WALLET` is `false`, this should be in the format `hostname:port/service_name` (e.g., `localhost:1521/FREEPDB1`).
  + If `ORACLE_DB_USE_WALLET` is `true`, this can be a TNS alias (e.g., `medium` for ADW/ATP), or a full connection string.

#### `ORACLE_WALLET_DIR`[​](#oracle_wallet_dir "Direct link to oracle_wallet_dir")

* **Type**: `str`
* **Default**: Empty string (' ')
* **Description**: **Required when `ORACLE_DB_USE_WALLET` is `true`**. Specifies the absolute path to the directory containing the Oracle Cloud Wallet files (e.g., `cwallet.sso`, `sqlnet.ora`, `tnsnames.ora`).

#### `ORACLE_WALLET_PASSWORD`[​](#oracle_wallet_password "Direct link to oracle_wallet_password")

* **Type**: `str`
* **Default**: Empty string (' ')
* **Description**: **Required when `ORACLE_DB_USE_WALLET` is `true`**. Specifies the password for the Oracle Cloud Wallet.

#### `ORACLE_VECTOR_LENGTH`[​](#oracle_vector_length "Direct link to oracle_vector_length")

* **Type**: `int`
* **Default**: `768`
* **Description**: Sets the expected dimension or length of the vector embeddings stored in the Oracle Database. This must match the embedding model used.

#### `ORACLE_DB_POOL_MIN`[​](#oracle_db_pool_min "Direct link to oracle_db_pool_min")

* **Type**: `int`
* **Default**: `2`
* **Description**: The minimum number of connections to maintain in the Oracle Database connection pool.

#### `ORACLE_DB_POOL_MAX`[​](#oracle_db_pool_max "Direct link to oracle_db_pool_max")

* **Type**: `int`
* **Default**: `10`
* **Description**: The maximum number of connections allowed in the Oracle Database connection pool.

#### `ORACLE_DB_POOL_INCREMENT`[​](#oracle_db_pool_increment "Direct link to oracle_db_pool_increment")

* **Type**: `int`
* **Default**: `1`
* **Description**: The number of connections to create when the pool needs to grow.

### S3 Vector Bucket[​](#s3-vector-bucket "Direct link to S3 Vector Bucket")

When using S3 Vector Bucket as the vector store, the following environment variables are used to control its behavior. Make sure to set these variables in your `.env` file or deployment environment.

info

Note: this configuration assumes that AWS credentials will be available to your Open WebUI environment. This could be through environment variables like `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or through IAM role permissions.

#### `S3_VECTOR_BUCKET_NAME`[​](#s3_vector_bucket_name "Direct link to s3_vector_bucket_name")

* Type: `str`
* Description: Specifies the name of the S3 Vector Bucket to store vectors in.

#### `S3_VECTOR_REGION`[​](#s3_vector_region "Direct link to s3_vector_region")

* Type: `str`
* Description: Specifies the AWS region where the S3 Vector Bucket is hosted.

RAG Content Extraction Engine[​](#rag-content-extraction-engine "Direct link to RAG Content Extraction Engine")
---------------------------------------------------------------------------------------------------------------

#### `CONTENT_EXTRACTION_ENGINE`[​](#content_extraction_engine "Direct link to content_extraction_engine")

* Type: `str`
* Options:
  + Leave empty to use default
  + `external` - Use external loader
  + `tika` - Use a local Apache Tika server
  + `docling` - Use Docling engine
  + `document_intelligence` - Use Document Intelligence engine
  + `mistral_ocr` - Use Mistral OCR engine
* Description: Sets the content extraction engine to use for document ingestion.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MISTRAL_OCR_API_KEY`[​](#mistral_ocr_api_key "Direct link to mistral_ocr_api_key")

* Type: `str`
* Default: `None`
* Description: Specifies the Mistral OCR API key to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `EXTERNAL_DOCUMENT_LOADER_URL`[​](#external_document_loader_url "Direct link to external_document_loader_url")

* Type: `str`
* Default: `None`
* Description: Sets the URL for the external document loader service.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `EXTERNAL_DOCUMENT_LOADER_API_KEY`[​](#external_document_loader_api_key "Direct link to external_document_loader_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for authenticating with the external document loader service.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TIKA_SERVER_URL`[​](#tika_server_url "Direct link to tika_server_url")

* Type: `str`
* Default: `http://localhost:9998`
* Description: Sets the URL for the Apache Tika server.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DOCLING_SERVER_URL`[​](#docling_server_url "Direct link to docling_server_url")

* Type: `str`
* Default: `http://docling:5001`
* Description: Specifies the URL for the Docling server. Requires Docling version 1.0.0 or later.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DOCLING_OCR_ENGINE`[​](#docling_ocr_engine "Direct link to docling_ocr_engine")

* Type: `str`
* Default: `tesseract`
* Description: Specifies the OCR engine used by Docling.
  Supported values include: `tesseract` (default), `easyocr`, `ocrmac`, `rapidocr`, and `tesserocr`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DOCLING_OCR_LANG`[​](#docling_ocr_lang "Direct link to docling_ocr_lang")

* Type: `str`
* Default: `eng,fra,deu,spa` (when using the default `tesseract` engine)
* Description: Specifies the OCR language(s) to be used with the configured `DOCLING_OCR_ENGINE`.
  The format and available language codes depend on the selected OCR engine.
* Persistence: This environment variable is a `PersistentConfig` variable.

Retrieval Augmented Generation (RAG)[​](#retrieval-augmented-generation-rag "Direct link to Retrieval Augmented Generation (RAG)")
----------------------------------------------------------------------------------------------------------------------------------

### Core Configuration[​](#core-configuration "Direct link to Core Configuration")

#### `RAG_EMBEDDING_ENGINE`[​](#rag_embedding_engine "Direct link to rag_embedding_engine")

* Type: `str`
* Options:
  + Leave empty for `Default (SentenceTransformers)` - Uses SentenceTransformers for embeddings.
  + `ollama` - Uses the Ollama API for embeddings.
  + `openai` - Uses the OpenAI API for embeddings.
  + `azure_openai` - Uses Azure OpenAI Services for embeddings.
* Description: Selects an embedding engine to use for RAG.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_EMBEDDING_MODEL`[​](#rag_embedding_model "Direct link to rag_embedding_model")

* Type: `str`
* Default: `sentence-transformers/all-MiniLM-L6-v2`
* Description: Sets a model for embeddings. Locally, a Sentence-Transformer model is used.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_TOP_K`[​](#rag_top_k "Direct link to rag_top_k")

* Type: `int`
* Default: `3`
* Description: Sets the default number of results to consider for the embedding when using RAG.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_TOP_K_RERANKER`[​](#rag_top_k_reranker "Direct link to rag_top_k_reranker")

* Type: `int`
* Default: `3`
* Description: Sets the default number of results to consider for the reranker when using RAG.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_RELEVANCE_THRESHOLD`[​](#rag_relevance_threshold "Direct link to rag_relevance_threshold")

* Type: `float`
* Default: `0.0`
* Description: Sets the relevance threshold to consider for documents when used with reranking.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_RAG_HYBRID_SEARCH`[​](#enable_rag_hybrid_search "Direct link to enable_rag_hybrid_search")

* Type: `bool`
* Default: `False`
* Description: Enables the use of ensemble search with `BM25` + `ChromaDB`, with reranking using `sentence_transformers` models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_HYBRID_BM25_WEIGHT`[​](#rag_hybrid_bm25_weight "Direct link to rag_hybrid_bm25_weight")

* Type: `float`
* Default: `0.5`
* Description: Sets the weight given to the keyword search (BM25) during hybrid search. 1 means only keyword search, 0 means only vector search.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_TEMPLATE`[​](#rag_template "Direct link to rag_template")

* Type: `str`
* Default: The value of `DEFAULT_RAG_TEMPLATE` environment variable.

`DEFAULT_RAG_TEMPLATE`:

```
### Task:  
Respond to the user query using the provided context, incorporating inline citations in the format [id] **only when the <source> tag includes an explicit id attribute** (e.g., <source id="1">).  
  
### Guidelines:  
- If you don't know the answer, clearly state that.  
- If uncertain, ask the user for clarification.  
- Respond in the same language as the user's query.  
- If the context is unreadable or of poor quality, inform the user and provide the best possible answer.  
- If the answer isn't present in the context but you possess the knowledge, explain this to the user and provide the answer using your own understanding.  
- **Only include inline citations using [id] (e.g., [1], [2]) when the <source> tag includes an id attribute.**  
- Do not cite if the <source> tag does not contain an id attribute.  
- Do not use XML tags in your response.  
- Ensure citations are concise and directly related to the information provided.  
  
### Example of Citation:  
If the user asks about a specific topic and the information is found in a source with a provided id attribute, the response should include the citation like in the following example:  
* "According to the study, the proposed method increases efficiency by 20% [1]."  
  
### Output:  
Provide a clear and direct response to the user's query, including inline citations in the format [id] only when the <source> tag with id attribute is present in the context.  
  
<context>  
{{CONTEXT}}  
</context>  
  
<user_query>  
{{QUERY}}  
</user_query>
```

* Description: Template to use when injecting RAG documents into chat completion.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Document Processing[​](#document-processing "Direct link to Document Processing")

#### `CHUNK_SIZE`[​](#chunk_size "Direct link to chunk_size")

* Type: `int`
* Default: `1000`
* Description: Sets the document chunk size for embeddings.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `CHUNK_OVERLAP`[​](#chunk_overlap "Direct link to chunk_overlap")

* Type: `int`
* Default: `100`
* Description: Specifies how much overlap there should be between chunks.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_TEXT_SPLITTER`[​](#rag_text_splitter "Direct link to rag_text_splitter")

* Type: `str`
* Options:
  + `character`
  + `token`
  + `markdown_header`
* Default: `character`
* Description: Sets the text splitter for RAG models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TIKTOKEN_CACHE_DIR`[​](#tiktoken_cache_dir "Direct link to tiktoken_cache_dir")

* Type: `str`
* Default: `{CACHE_DIR}/tiktoken`
* Description: Sets the directory for TikToken cache.

#### `TIKTOKEN_ENCODING_NAME`[​](#tiktoken_encoding_name "Direct link to tiktoken_encoding_name")

* Type: `str`
* Default: `cl100k_base`
* Description: Sets the encoding name for TikToken.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `PDF_EXTRACT_IMAGES`[​](#pdf_extract_images "Direct link to pdf_extract_images")

* Type: `bool`
* Default: `False`
* Description: Extracts images from PDFs using OCR when loading documents.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_FILE_MAX_SIZE`[​](#rag_file_max_size "Direct link to rag_file_max_size")

* Type: `int`
* Description: Sets the maximum size of a file in megabytes that can be uploaded for document ingestion.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_FILE_MAX_COUNT`[​](#rag_file_max_count "Direct link to rag_file_max_count")

* Type: `int`
* Description: Sets the maximum number of files that can be uploaded at once for document ingestion.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_ALLOWED_FILE_EXTENSIONS`[​](#rag_allowed_file_extensions "Direct link to rag_allowed_file_extensions")

* Type: `list` of `str`
* Default: `[]` (which means all supported file types are allowed)
* Description: Specifies which file extensions are permitted for upload.

```
["pdf,docx,txt"]
```

* Persistence: This environment variable is a `PersistentConfig` variable.

info

When configuring `RAG_FILE_MAX_SIZE` and `RAG_FILE_MAX_COUNT`, ensure that the values are reasonable to prevent excessive file uploads and potential performance issues.

### Embedding Engine Configuration[​](#embedding-engine-configuration "Direct link to Embedding Engine Configuration")

#### General Embedding Settings[​](#general-embedding-settings "Direct link to General Embedding Settings")

#### `RAG_EMBEDDING_BATCH_SIZE`[​](#rag_embedding_batch_size "Direct link to rag_embedding_batch_size")

* Type: `int`
* Default: `1`
* Description: Sets the batch size for embedding in RAG (Retrieval-Augmented Generator) models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_EMBEDDING_CONTENT_PREFIX`[​](#rag_embedding_content_prefix "Direct link to rag_embedding_content_prefix")

* Type: `str`
* Default: `None`
* Description: Specifies the prefix for the RAG embedding content.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_EMBEDDING_PREFIX_FIELD_NAME`[​](#rag_embedding_prefix_field_name "Direct link to rag_embedding_prefix_field_name")

* Type: `str`
* Default: `None`
* Description: Specifies the field name for the RAG embedding prefix.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_EMBEDDING_QUERY_PREFIX`[​](#rag_embedding_query_prefix "Direct link to rag_embedding_query_prefix")

* Type: `str`
* Default: `None`
* Description: Specifies the prefix for the RAG embedding query.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### OpenAI Embeddings[​](#openai-embeddings "Direct link to OpenAI Embeddings")

#### `RAG_OPENAI_API_BASE_URL`[​](#rag_openai_api_base_url "Direct link to rag_openai_api_base_url")

* Type: `str`
* Default: `${OPENAI_API_BASE_URL}`
* Description: Sets the OpenAI base API URL to use for RAG embeddings.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_OPENAI_API_KEY`[​](#rag_openai_api_key "Direct link to rag_openai_api_key")

* Type: `str`
* Default: `${OPENAI_API_KEY}`
* Description: Sets the OpenAI API key to use for RAG embeddings.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_EMBEDDING_OPENAI_BATCH_SIZE`[​](#rag_embedding_openai_batch_size "Direct link to rag_embedding_openai_batch_size")

* Type: `int`
* Default: `1`
* Description: Sets the batch size for OpenAI embeddings.

#### Azure OpenAI Embeddings[​](#azure-openai-embeddings "Direct link to Azure OpenAI Embeddings")

#### `RAG_AZURE_OPENAI_BASE_URL`[​](#rag_azure_openai_base_url "Direct link to rag_azure_openai_base_url")

* Type: `str`
* Default: `None`
* Description: Sets the base URL for Azure OpenAI Services when using Azure OpenAI for RAG embeddings. Should be in the format `https://{your-resource-name}.openai.azure.com`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_AZURE_OPENAI_API_KEY`[​](#rag_azure_openai_api_key "Direct link to rag_azure_openai_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for Azure OpenAI Services when using Azure OpenAI for RAG embeddings.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_AZURE_OPENAI_API_VERSION`[​](#rag_azure_openai_api_version "Direct link to rag_azure_openai_api_version")

* Type: `str`
* Default: `None`
* Description: Sets the API version for Azure OpenAI Services when using Azure OpenAI for RAG embeddings. Common values include `2023-05-15`, `2023-12-01-preview`, or `2024-02-01`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### Ollama Embeddings[​](#ollama-embeddings "Direct link to Ollama Embeddings")

#### `RAG_OLLAMA_BASE_URL`[​](#rag_ollama_base_url "Direct link to rag_ollama_base_url")

* Type: `str`
* Description: Sets the base URL for Ollama API used in RAG models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_OLLAMA_API_KEY`[​](#rag_ollama_api_key "Direct link to rag_ollama_api_key")

* Type: `str`
* Description: Sets the API key for Ollama API used in RAG models.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Reranking[​](#reranking "Direct link to Reranking")

#### `RAG_RERANKING_MODEL`[​](#rag_reranking_model "Direct link to rag_reranking_model")

* Type: `str`
* Description: Sets a model for reranking results. Locally, a Sentence-Transformer model is used.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Query Generation[​](#query-generation "Direct link to Query Generation")

#### `ENABLE_RETRIEVAL_QUERY_GENERATION`[​](#enable_retrieval_query_generation "Direct link to enable_retrieval_query_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables retrieval query generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `QUERY_GENERATION_PROMPT_TEMPLATE`[​](#query_generation_prompt_template "Direct link to query_generation_prompt_template")

* Type: `str`
* Default: The value of `DEFAULT_QUERY_GENERATION_PROMPT_TEMPLATE` environment variable.

`DEFAULT_QUERY_GENERATION_PROMPT_TEMPLATE`:

```
### Task:  
Analyze the chat history to determine the necessity of generating search queries, in the given language. By default, **prioritize generating 1-3 broad and relevant search queries** unless it is absolutely certain that no additional information is required. The aim is to retrieve comprehensive, updated, and valuable information even with minimal uncertainty. If no search is unequivocally needed, return an empty list.  
  
### Guidelines:  
- Respond **EXCLUSIVELY** with a JSON object. Any form of extra commentary, explanation, or additional text is strictly prohibited.  
- When generating search queries, respond in the format: { "queries": ["query1", "query2"] }, ensuring each query is distinct, concise, and relevant to the topic.  
- If and only if it is entirely certain that no useful results can be retrieved by a search, return: { "queries": [] }.  
- Err on the side of suggesting search queries if there is **any chance** they might provide useful or updated information.  
- Be concise and focused on composing high-quality search queries, avoiding unnecessary elaboration, commentary, or assumptions.  
- Today's date is: {{CURRENT_DATE}}.  
- Always prioritize providing actionable and broad queries that maximize informational coverage.  
  
### Output:  
Strictly return in JSON format:  
{  
  "queries": ["query1", "query2"]  
}  
  
### Chat History:  
<chat_history>  
{{MESSAGES:END:6}}  
</chat_history>
```

* Description: Sets the prompt template for query generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Document Intelligence (Azure)[​](#document-intelligence-azure "Direct link to Document Intelligence (Azure)")

#### `DOCUMENT_INTELLIGENCE_ENDPOINT`[​](#document_intelligence_endpoint "Direct link to document_intelligence_endpoint")

* Type: `str`
* Default: `None`
* Description: Specifies the endpoint for document intelligence.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `DOCUMENT_INTELLIGENCE_KEY`[​](#document_intelligence_key "Direct link to document_intelligence_key")

* Type: `str`
* Default: `None`
* Description: Specifies the key for document intelligence.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Advanced Settings[​](#advanced-settings "Direct link to Advanced Settings")

#### `BYPASS_EMBEDDING_AND_RETRIEVAL`[​](#bypass_embedding_and_retrieval "Direct link to bypass_embedding_and_retrieval")

* Type: `bool`
* Default: `False`
* Description: Bypasses the embedding and retrieval process.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `RAG_FULL_CONTEXT`[​](#rag_full_context "Direct link to rag_full_context")

* Type: `bool`
* Default: `False`
* Description: Specifies whether to use the full context for RAG.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_RAG_LOCAL_WEB_FETCH`[​](#enable_rag_local_web_fetch "Direct link to enable_rag_local_web_fetch")

* Type: `bool`
* Default: `False`
* Description: Enables or disables local web fetch for RAG.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Google Drive[​](#google-drive "Direct link to Google Drive")

#### `ENABLE_GOOGLE_DRIVE_INTEGRATION`[​](#enable_google_drive_integration "Direct link to enable_google_drive_integration")

* Type: `bool`
* Default: `False`
* Description: Enables or disables Google Drive integration. If set to true, and `GOOGLE_DRIVE_CLIENT_ID` & `GOOGLE_DRIVE_API_KEY` are both configured, Google Drive will appear as an upload option in the chat UI.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

When enabling `GOOGLE_DRIVE_INTEGRATION`, ensure that you have configured `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_API_KEY` correctly, and have reviewed Google's terms of service and usage guidelines.

#### `GOOGLE_DRIVE_CLIENT_ID`[​](#google_drive_client_id "Direct link to google_drive_client_id")

* Type: `str`
* Description: Sets the client ID for Google Drive (client must be configured with Drive API and Picker API enabled).
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GOOGLE_DRIVE_API_KEY`[​](#google_drive_api_key "Direct link to google_drive_api_key")

* Type: `str`
* Description: Sets the API key for Google Drive integration.
* Persistence: This environment variable is a `PersistentConfig` variable.

### OneDrive[​](#onedrive "Direct link to OneDrive")

info

For a step-by-step setup guide, check out our tutorial: [Configuring OneDrive & SharePoint Integration](https://docs.openwebui.com/tutorials/integrations/onedrive-sharepoint/).

#### `ENABLE_ONEDRIVE_INTEGRATION`[​](#enable_onedrive_integration "Direct link to enable_onedrive_integration")

* Type: `bool`
* Default: `False`
* Description: Enables or disables the Microsoft OneDrive integration feature globally.
* Persistence: This environment variable is a `PersistentConfig` variable.

warning

Configuring OneDrive integration is a multi-step process that requires creating and correctly configuring an Azure App Registration.
The authentication flow also depends on a browser pop-up window. Please ensure that your browser's pop-up blocker is disabled for your Open WebUI domain to allow the authentication and file selection window to appear.

#### `ENABLE_ONEDRIVE_PERSONAL`[​](#enable_onedrive_personal "Direct link to enable_onedrive_personal")

* Type: `bool`
* Default: `True`
* Description: Controls whether the "Personal OneDrive" option appears in the attachment menu. Requires `ONEDRIVE_PERSONAL_CLIENT_ID` to be configured.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_ONEDRIVE_BUSINESS`[​](#enable_onedrive_business "Direct link to enable_onedrive_business")

* Type: `bool`
* Default: `True`
* Description: Controls whether the "Work/School OneDrive" option appears in the attachment menu. Requires `ONEDRIVE_CLIENT_ID` to be configured.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ONEDRIVE_CLIENT_ID`[​](#onedrive_client_id "Direct link to onedrive_client_id")

* Type: `str`
* Default: `None`
* Description: Generic environment variable for the OneDrive Client ID. You should rather use the specific `ONEDRIVE_CLIENT_ID_PERSONAL` or `ONEDRIVE_CLIENT_ID_BUSINESS` variables. This exists as a legacy option for backwards compatibility.

#### `ONEDRIVE_CLIENT_ID_PERSONAL`[​](#onedrive_client_id_personal "Direct link to onedrive_client_id_personal")

* Type: `str`
* Default: `None`
* Description: Specifies the Application (client) ID for the **Personal OneDrive** integration. This requires a separate Azure App Registration configured to support personal Microsoft accounts. **Do not put the business OneDrive client ID here!**

#### `ONEDRIVE_CLIENT_ID_BUSINESS`[​](#onedrive_client_id_business "Direct link to onedrive_client_id_business")

* Type: `str`
* Default: `None`
* Description: Specifies the Application (client) ID for the **Work/School (Business) OneDrive** integration. This requires a separate Azure App Registration configured to support personal Microsoft accounts. **Do not put the personal OneDrive client ID here!**

info

This Client ID (also known as Application ID) is obtained from an Azure App Registration within your Microsoft Entra ID (formerly Azure AD) tenant.
When configuring the App Registration in Azure, the Redirect URI must be set to the URL of your Open WebUI instance and configured as a **Single-page application (SPA)** type for the authentication to succeed.

#### `ONEDRIVE_SHAREPOINT_URL`[​](#onedrive_sharepoint_url "Direct link to onedrive_sharepoint_url")

* Type: `str`
* Default: `None`
* Description: Specifies the root SharePoint site URL for the work/school integration, e.g., `https://companyname.sharepoint.com`.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

This variable is essential for the work/school integration. It should point to the root SharePoint site associated with your tenant, enabling access to SharePoint document libraries.

#### `ONEDRIVE_SHAREPOINT_TENANT_ID`[​](#onedrive_sharepoint_tenant_id "Direct link to onedrive_sharepoint_tenant_id")

* Type: `str`
* Default: `None`
* Description: Specifies the Directory (tenant) ID for the work/school integration. This is obtained from your business-focused Azure App Registration.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

This Tenant ID (also known as Directory ID) is required for the work/school integration. You can find this value on the main overview page of your Azure App Registration in the Microsoft Entra ID portal.

Web Search[​](#web-search "Direct link to Web Search")
------------------------------------------------------

#### `ENABLE_WEB_SEARCH`[​](#enable_web_search "Direct link to enable_web_search")

* Type: `bool`
* Default: `False`
* Description: Enable web search toggle.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_SEARCH_QUERY_GENERATION`[​](#enable_search_query_generation "Direct link to enable_search_query_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables search query generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WEB_SEARCH_TRUST_ENV`[​](#web_search_trust_env "Direct link to web_search_trust_env")

* Type: `bool`
* Default: `False`
* Description: Enables proxy set by `http_proxy` and `https_proxy` during web search content fetching.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WEB_SEARCH_RESULT_COUNT`[​](#web_search_result_count "Direct link to web_search_result_count")

* Type: `int`
* Default: `3`
* Description: Maximum number of search results to crawl.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WEB_LOADER_CONCURRENT_REQUESTS`[​](#web_loader_concurrent_requests "Direct link to web_loader_concurrent_requests")

* Type: `int`
* Default: `10`
* Description: Specifies the number of concurrent requests used by the web loader to fetch content from web pages returned by search results. This directly impacts how many pages can be crawled simultaneously.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

This environment variable was previously named "WEB\_SEARCH\_CONCURRENT\_REQUESTS". If you were using the old name, please update your configurations to use "WEB\_LOADER\_CONCURRENT\_REQUESTS" as the old variable name is now deprecated and will not be recognized. This renaming clarifies its function, as it specifically controls the concurrency of the web *loader* component that fetches content from search results, not the initial search engine query itself.

#### `WEB_SEARCH_ENGINE`[​](#web_search_engine "Direct link to web_search_engine")

* Type: `str`
* Options:
  + `searxng` - Uses the [SearXNG](https://github.com/searxng/searxng) search engine.
  + `google_pse` - Uses the [Google Programmable Search Engine](https://programmablesearchengine.google.com/about/).
  + `brave` - Uses the [Brave search engine](https://brave.com/search/api/).
  + `kagi` - Uses the [Kagi](https://www.kagi.com/) search engine.
  + `mojeek` - Uses the [Mojeek](https://www.mojeek.com/) search engine.
  + `bocha` - Uses the Bocha search engine.
  + `serpstack` - Uses the [Serpstack](https://serpstack.com/) search engine.
  + `serper` - Uses the [Serper](https://serper.dev/) search engine.
  + `serply` - Uses the [Serply](https://serply.io/) search engine.
  + `searchapi` - Uses the [SearchAPI](https://www.searchapi.io/) search engine.
  + `serpapi` - Uses the [SerpApi](https://serpapi.com/) search engine.
  + `duckduckgo` - Uses the [DuckDuckGo](https://duckduckgo.com/) search engine.
  + `tavily` - Uses the [Tavily](https://tavily.com/) search engine.
  + `jina` - Uses the [Jina](https://jina.ai/) search engine.
  + `bing` - Uses the [Bing](https://www.bing.com/) search engine.
  + `exa` - Uses the [Exa](https://exa.ai/) search engine.
  + `perplexity` - Uses the [Perplexity API](https://www.perplexity.ai/) to access perplexity's AI models. Calls their AI models, which execute a search and also return a full response.
  + `perplexity_search` - Uses the [Perplexity Search API](https://www.perplexity.ai/) search engine. In contrast to the `perplexity` option, this uses Perplexity's web search API for searching the web and retrieving results.
  + `sougou` - Uses the [Sougou](https://www.sogou.com/) search engine.
  + `ollama_cloud` - Uses the [Ollama Cloud](https://ollama.com/blog/web-search) search engine.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `BYPASS_WEB_SEARCH_EMBEDDING_AND_RETRIEVAL`[​](#bypass_web_search_embedding_and_retrieval "Direct link to bypass_web_search_embedding_and_retrieval")

* Type: `bool`
* Default: `False`
* Description: Bypasses the web search embedding and retrieval process.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SEARXNG_QUERY_URL`[​](#searxng_query_url "Direct link to searxng_query_url")

* Type: `str`
* Description: The [SearXNG search API](https://docs.searxng.org/dev/search_api.html) URL supporting JSON output. `<query>` is replaced with
  the search query. Example: `http://searxng.local/search?q=<query>`
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GOOGLE_PSE_API_KEY`[​](#google_pse_api_key "Direct link to google_pse_api_key")

* Type: `str`
* Description: Sets the API key for the Google Programmable Search Engine (PSE) service.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GOOGLE_PSE_ENGINE_ID`[​](#google_pse_engine_id "Direct link to google_pse_engine_id")

* Type: `str`
* Description: The engine ID for the Google Programmable Search Engine (PSE) service.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `BRAVE_SEARCH_API_KEY`[​](#brave_search_api_key "Direct link to brave_search_api_key")

* Type: `str`
* Description: Sets the API key for the Brave Search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `KAGI_SEARCH_API_KEY`[​](#kagi_search_api_key "Direct link to kagi_search_api_key")

* Type: `str`
* Description: Sets the API key for Kagi Search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MOJEEK_SEARCH_API_KEY`[​](#mojeek_search_api_key "Direct link to mojeek_search_api_key")

* Type: `str`
* Description: Sets the API key for Mojeek Search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SERPSTACK_API_KEY`[​](#serpstack_api_key "Direct link to serpstack_api_key")

* Type: `str`
* Description: Sets the API key for Serpstack search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SERPSTACK_HTTPS`[​](#serpstack_https "Direct link to serpstack_https")

* Type: `bool`
* Default: `True`
* Description: Configures the use of HTTPS for Serpstack requests. Free tier requests are restricted to HTTP only.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SERPER_API_KEY`[​](#serper_api_key "Direct link to serper_api_key")

* Type: `str`
* Description: Sets the API key for Serper search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SERPLY_API_KEY`[​](#serply_api_key "Direct link to serply_api_key")

* Type: `str`
* Description: Sets the API key for Serply search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SEARCHAPI_API_KEY`[​](#searchapi_api_key "Direct link to searchapi_api_key")

* Type: `str`
* Description: Sets the API key for SearchAPI.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SEARCHAPI_ENGINE`[​](#searchapi_engine "Direct link to searchapi_engine")

* Type: `str`
* Description: Sets the SearchAPI engine.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TAVILY_API_KEY`[​](#tavily_api_key "Direct link to tavily_api_key")

* Type: `str`
* Description: Sets the API key for Tavily search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `JINA_API_KEY`[​](#jina_api_key "Direct link to jina_api_key")

* Type: `str`
* Description: Sets the API key for Jina.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `BING_SEARCH_V7_ENDPOINT`[​](#bing_search_v7_endpoint "Direct link to bing_search_v7_endpoint")

* Type: `str`
* Description: Sets the endpoint for Bing Search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `BING_SEARCH_V7_SUBSCRIPTION_KEY`[​](#bing_search_v7_subscription_key "Direct link to bing_search_v7_subscription_key")

* Type: `str`
* Default: `https://api.bing.microsoft.com/v7.0/search`
* Description: Sets the subscription key for Bing Search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `BOCHA_SEARCH_API_KEY`[​](#bocha_search_api_key "Direct link to bocha_search_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for Bocha Search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `EXA_API_KEY`[​](#exa_api_key "Direct link to exa_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for Exa search API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SERPAPI_API_KEY`[​](#serpapi_api_key "Direct link to serpapi_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for SerpAPI.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SERPAPI_ENGINE`[​](#serpapi_engine "Direct link to serpapi_engine")

* Type: `str`
* Default: `None`
* Description: Specifies the search engine to use for SerpAPI.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SOUGOU_API_SID`[​](#sougou_api_sid "Direct link to sougou_api_sid")

* Type: `str`
* Default: `None`
* Description: Sets the Sogou API SID.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SOUGOU_API_SK`[​](#sougou_api_sk "Direct link to sougou_api_sk")

* Type: `str`
* Default: `None`
* Description: Sets the Sogou API SK.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OLLAMA_CLOUD_WEB_SEARCH_API_KEY`[​](#ollama_cloud_web_search_api_key "Direct link to ollama_cloud_web_search_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the Ollama Cloud Web Search API Key.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `TAVILY_EXTRACT_DEPTH`[​](#tavily_extract_depth "Direct link to tavily_extract_depth")

* Type: `str`
* Default: `basic`
* Description: Specifies the extract depth for Tavily search results.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Web Loader Configuration[​](#web-loader-configuration "Direct link to Web Loader Configuration")

#### `WEB_LOADER_ENGINE`[​](#web_loader_engine "Direct link to web_loader_engine")

* Type: `str`
* Default: `safe_web`
* Description: Specifies the loader to use for retrieving and processing web content.
* Options:
  + `requests` - Uses the Requests module with enhanced error handling.
  + `playwright` - Uses Playwright for more advanced web page rendering and interaction.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

When using `playwright`, you have two options:

1. If `PLAYWRIGHT_WS_URI` is not set, Playwright with Chromium dependencies will be automatically installed in the Open WebUI container on launch.
2. If `PLAYWRIGHT_WS_URI` is set, Open WebUI will connect to a remote browser instance instead of installing dependencies locally.

#### `PLAYWRIGHT_WS_URL`[​](#playwright_ws_url "Direct link to playwright_ws_url")

* Type: `str`
* Default: `None`
* Description: Specifies the WebSocket URI of a remote Playwright browser instance. When set, Open WebUI will use this remote browser instead of installing browser dependencies locally. This is particularly useful in containerized environments where you want to keep the Open WebUI container lightweight and separate browser concerns. Example: `ws://playwright:3000`
* Persistence: This environment variable is a `PersistentConfig` variable.

tip

Using a remote Playwright browser via `PLAYWRIGHT_WS_URL` can be beneficial for:

* Reducing the size of the Open WebUI container
* Using a different browser other than the default Chromium
* Connecting to a non-headless (GUI) browser

#### `FIRECRAWL_API_BASE_URL`[​](#firecrawl_api_base_url "Direct link to firecrawl_api_base_url")

* Type: `str`
* Default: `https://api.firecrawl.dev`
* Description: Sets the base URL for Firecrawl API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `FIRECRAWL_API_KEY`[​](#firecrawl_api_key "Direct link to firecrawl_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for Firecrawl API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `PERPLEXITY_API_KEY`[​](#perplexity_api_key "Direct link to perplexity_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the API key for Perplexity API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `PLAYWRIGHT_TIMEOUT`[​](#playwright_timeout "Direct link to playwright_timeout")

* Type: `int`
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the timeout for Playwright requests.
* Persistence: This environment variable is a `PersistentConfig` variable.

### YouTube Loader[​](#youtube-loader "Direct link to YouTube Loader")

#### `YOUTUBE_LOADER_PROXY_URL`[​](#youtube_loader_proxy_url "Direct link to youtube_loader_proxy_url")

* Type: `str`
* Description: Sets the proxy URL for YouTube loader.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `YOUTUBE_LOADER_LANGUAGE`[​](#youtube_loader_language "Direct link to youtube_loader_language")

* Type: `str`
* Default: `en`
* Description: Comma-separated list of language codes to try when fetching YouTube video transcriptions, in priority order.
* Example: If set to `es,de`, Spanish transcriptions will be attempted first, then German if Spanish was not available, and lastly English.

note

Note: If none of the specified languages are available and `en` was not in your list, the system will automatically try English as a final fallback.

* Persistence: This environment variable is a `PersistentConfig` variable.

Audio[​](#audio "Direct link to Audio")
---------------------------------------

### Whisper Speech-to-Text (Local)[​](#whisper-speech-to-text-local "Direct link to Whisper Speech-to-Text (Local)")

#### `WHISPER_MODEL`[​](#whisper_model "Direct link to whisper_model")

* Type: `str`
* Default: `base`
* Description: Sets the Whisper model to use for Speech-to-Text. The backend used is faster\_whisper with quantization to `int8`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WHISPER_MODEL_DIR`[​](#whisper_model_dir "Direct link to whisper_model_dir")

* Type: `str`
* Default: `${DATA_DIR}/cache/whisper/models`
* Description: Specifies the directory to store Whisper model files.

#### `WHISPER_VAD_FILTER`[​](#whisper_vad_filter "Direct link to whisper_vad_filter")

* Type: `bool`
* Default: `False`
* Description: Specifies whether to apply a Voice Activity Detection (VAD) filter to Whisper Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `WHISPER_MODEL_AUTO_UPDATE`[​](#whisper_model_auto_update "Direct link to whisper_model_auto_update")

* Type: `bool`
* Default: `False`
* Description: Toggles automatic update of the Whisper model.

#### `WHISPER_LANGUAGE`[​](#whisper_language "Direct link to whisper_language")

* Type: `str`
* Default: `None`
* Description: Specifies the ISO 639-1 language Whisper uses for STT (ISO 639-2 for Hawaiian and Cantonese). Whisper predicts the language by default.

### Speech-to-Text (OpenAI)[​](#speech-to-text-openai "Direct link to Speech-to-Text (OpenAI)")

#### `AUDIO_STT_ENGINE`[​](#audio_stt_engine "Direct link to audio_stt_engine")

* Type: `str`
* Options:
  + Leave empty to use the built-in local Whisper engine for Speech-to-Text.
  + `openai` - Uses OpenAI engine for Speech-to-Text.
  + `deepgram`- Uses Deepgram engine for Speech-to-Text.
  + `azure` Uses Azure engine for Speech-to-Text.
* Description: Specifies the Speech-to-Text engine to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_STT_MODEL`[​](#audio_stt_model "Direct link to audio_stt_model")

* Type: `str`
* Default: `whisper-1`
* Description: Specifies the Speech-to-Text model to use for OpenAI-compatible endpoints.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_STT_OPENAI_API_BASE_URL`[​](#audio_stt_openai_api_base_url "Direct link to audio_stt_openai_api_base_url")

* Type: `str`
* Default: `${OPENAI_API_BASE_URL}`
* Description: Sets the OpenAI-compatible base URL to use for Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_STT_OPENAI_API_KEY`[​](#audio_stt_openai_api_key "Direct link to audio_stt_openai_api_key")

* Type: `str`
* Default: `${OPENAI_API_KEY}`
* Description: Sets the OpenAI API key to use for Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Speech-to-Text (Azure)[​](#speech-to-text-azure "Direct link to Speech-to-Text (Azure)")

#### `AUDIO_STT_AZURE_API_KEY`[​](#audio_stt_azure_api_key "Direct link to audio_stt_azure_api_key")

* Type: `str`
* Default: `None`
* Description: Specifies the Azure API key to use for Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_STT_AZURE_REGION`[​](#audio_stt_azure_region "Direct link to audio_stt_azure_region")

* Type: `str`
* Default: `None`
* Description: Specifies the Azure region to use for Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_STT_AZURE_LOCALES`[​](#audio_stt_azure_locales "Direct link to audio_stt_azure_locales")

* Type: `str`
* Default: `None`
* Description: Specifies the locales to use for Azure Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Speech-to-Text (Deepgram)[​](#speech-to-text-deepgram "Direct link to Speech-to-Text (Deepgram)")

#### `DEEPGRAM_API_KEY`[​](#deepgram_api_key "Direct link to deepgram_api_key")

* Type: `str`
* Default: `None`
* Description: Specifies the Deepgram API key to use for Speech-to-Text.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Text-to-Speech[​](#text-to-speech "Direct link to Text-to-Speech")

#### `AUDIO_TTS_API_KEY`[​](#audio_tts_api_key "Direct link to audio_tts_api_key")

* Type: `str`
* Description: Sets the API key for Text-to-Speech.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_TTS_ENGINE`[​](#audio_tts_engine "Direct link to audio_tts_engine")

* Type: `str`
* Options:
  + Leave empty to use the built-in WebAPI engine for Text-to-Speech.
  + `azure` - Uses Azure engine for Text-to-Speech.
  + `elevenlabs` - Uses ElevenLabs engine for Text-to-Speech
  + `openai` - Uses OpenAI engine for Text-to-Speech.
  + `transformers` - Uses SentenceTransformers for Text-to-Speech.
* Description: Specifies the Text-to-Speech engine to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_TTS_MODEL`[​](#audio_tts_model "Direct link to audio_tts_model")

* Type: `str`
* Default: `tts-1`
* Description: Specifies the OpenAI text-to-speech model to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_TTS_VOICE`[​](#audio_tts_voice "Direct link to audio_tts_voice")

* Type: `str`
* Default: `alloy`
* Description: Sets the OpenAI text-to-speech voice to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_TTS_SPLIT_ON`[​](#audio_tts_split_on "Direct link to audio_tts_split_on")

* Type: `str`
* Default: `punctuation`
* Description: Sets the OpenAI text-to-speech split on to use.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Azure Text-to-Speech[​](#azure-text-to-speech "Direct link to Azure Text-to-Speech")

#### `AUDIO_TTS_AZURE_SPEECH_REGION`[​](#audio_tts_azure_speech_region "Direct link to audio_tts_azure_speech_region")

* Type: `str`
* Description: Sets the region for Azure Text to Speech.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_TTS_AZURE_SPEECH_OUTPUT_FORMAT`[​](#audio_tts_azure_speech_output_format "Direct link to audio_tts_azure_speech_output_format")

* Type: `str`
* Description: Sets the output format for Azure Text to Speech.
* Persistence: This environment variable is a `PersistentConfig` variable.

### OpenAI Text-to-Speech[​](#openai-text-to-speech "Direct link to OpenAI Text-to-Speech")

#### `AUDIO_TTS_OPENAI_API_BASE_URL`[​](#audio_tts_openai_api_base_url "Direct link to audio_tts_openai_api_base_url")

* Type: `str`
* Default: `${OPENAI_API_BASE_URL}`
* Description: Sets the OpenAI-compatible base URL to use for text-to-speech.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUDIO_TTS_OPENAI_API_KEY`[​](#audio_tts_openai_api_key "Direct link to audio_tts_openai_api_key")

* Type: `str`
* Default: `${OPENAI_API_KEY}`
* Description: Sets the API key to use for text-to-speech.
* Persistence: This environment variable is a `PersistentConfig` variable.

Image Generation[​](#image-generation "Direct link to Image Generation")
------------------------------------------------------------------------

#### `IMAGE_GENERATION_ENGINE`[​](#image_generation_engine "Direct link to image_generation_engine")

* Type: `str`
* Options:
  + `openai` - Uses OpenAI DALL-E for image generation.
  + `comfyui` - Uses ComfyUI engine for image generation.
  + `automatic1111` - Uses AUTOMATIC1111 engine for image generation.
  + `gemini` - Uses Gemini for image generation.
* Default: `openai`
* Description: Specifies the engine to use for image generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_IMAGE_GENERATION`[​](#enable_image_generation "Direct link to enable_image_generation")

* Type: `bool`
* Default: `False`
* Description: Enables or disables image generation features.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_IMAGE_PROMPT_GENERATION`[​](#enable_image_prompt_generation "Direct link to enable_image_prompt_generation")

* Type: `bool`
* Default: `True`
* Description: Enables or disables image prompt generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE`[​](#image_prompt_generation_prompt_template "Direct link to image_prompt_generation_prompt_template")

* Type: `str`
* Default: `None`
* Description: Specifies the template to use for generating image prompts.
* Persistence: This environment variable is a `PersistentConfig` variable.

`DEFAULT_IMAGE_PROMPT_GENERATION_PROMPT_TEMPLATE`:

```
### Task:  
Generate a detailed prompt for am image generation task based on the given language and context. Describe the image as if you were explaining it to someone who cannot see it. Include relevant details, colors, shapes, and any other important elements.  
  
### Guidelines:  
- Be descriptive and detailed, focusing on the most important aspects of the image.  
- Avoid making assumptions or adding information not present in the image.  
- Use the chat's primary language; default to English if multilingual.  
- If the image is too complex, focus on the most prominent elements.  
  
### Output:  
Strictly return in JSON format:  
{  
    "prompt": "Your detailed description here."  
}  
  
### Chat History:  
<chat_history>  
{{MESSAGES:END:6}}  
</chat_history>
```

#### `IMAGE_SIZE`[​](#image_size "Direct link to image_size")

* Type: `str`
* Default: `512x512`
* Description: Sets the default image size to generate.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGE_STEPS`[​](#image_steps "Direct link to image_steps")

* Type: `int`
* Default: `50`
* Description: Sets the default iteration steps for image generation. Used for ComfyUI and AUTOMATIC1111.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGE_GENERATION_MODEL`[​](#image_generation_model "Direct link to image_generation_model")

* Type: `str`
* Description: Default model to use for image generation
* Persistence: This environment variable is a `PersistentConfig` variable.

### AUTOMATIC1111[​](#automatic1111 "Direct link to AUTOMATIC1111")

#### `AUTOMATIC1111_BASE_URL`[​](#automatic1111_base_url "Direct link to automatic1111_base_url")

* Type: `str`
* Description: Specifies the URL to AUTOMATIC1111's Stable Diffusion API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUTOMATIC1111_API_AUTH`[​](#automatic1111_api_auth "Direct link to automatic1111_api_auth")

* Type: `str`
* Description: Sets the AUTOMATIC1111 API authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUTOMATIC1111_CFG_SCALE`[​](#automatic1111_cfg_scale "Direct link to automatic1111_cfg_scale")

* Type: `float`
* Description: Sets the scale for AUTOMATIC1111 inference.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUTOMATIC1111_SAMPLER`[​](#automatic1111_sampler "Direct link to automatic1111_sampler")

* Type: `str`
* Description: Sets the sampler for AUTOMATIC1111 inference.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `AUTOMATIC1111_SCHEDULER`[​](#automatic1111_scheduler "Direct link to automatic1111_scheduler")

* Type: `str`
* Description: Sets the scheduler for AUTOMATIC1111 inference.
* Persistence: This environment variable is a `PersistentConfig` variable.

### ComfyUI[​](#comfyui "Direct link to ComfyUI")

#### `COMFYUI_BASE_URL`[​](#comfyui_base_url "Direct link to comfyui_base_url")

* Type: `str`
* Description: Specifies the URL to the ComfyUI image generation API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `COMFYUI_API_KEY`[​](#comfyui_api_key "Direct link to comfyui_api_key")

* Type: `str`
* Description: Sets the API key for ComfyUI.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `COMFYUI_WORKFLOW`[​](#comfyui_workflow "Direct link to comfyui_workflow")

* Type: `str`
* Default:

```
{  
  "3": {  
    "inputs": {  
      "seed": 0,  
      "steps": 20,  
      "cfg": 8,  
      "sampler_name": "euler",  
      "scheduler": "normal",  
      "denoise": 1,  
      "model": [  
        "4",  
        0  
      ],  
      "positive": [  
        "6",  
        0  
      ],  
      "negative": [  
        "7",  
        0  
      ],  
      "latent_image": [  
        "5",  
        0  
      ]  
    },  
    "class_type": "KSampler",  
    "_meta": {  
      "title": "KSampler"  
    }  
  },  
  "4": {  
    "inputs": {  
      "ckpt_name": "model.safetensors"  
    },  
    "class_type": "CheckpointLoaderSimple",  
    "_meta": {  
      "title": "Load Checkpoint"  
    }  
  },  
  "5": {  
    "inputs": {  
      "width": 512,  
      "height": 512,  
      "batch_size": 1  
    },  
    "class_type": "EmptyLatentImage",  
    "_meta": {  
      "title": "Empty Latent Image"  
    }  
  },  
  "6": {  
    "inputs": {  
      "text": "Prompt",  
      "clip": [  
        "4",  
        1  
      ]  
    },  
    "class_type": "CLIPTextEncode",  
    "_meta": {  
      "title": "CLIP Text Encode (Prompt)"  
    }  
  },  
  "7": {  
    "inputs": {  
      "text": "",  
      "clip": [  
        "4",  
        1  
      ]  
    },  
    "class_type": "CLIPTextEncode",  
    "_meta": {  
      "title": "CLIP Text Encode (Prompt)"  
    }  
  },  
  "8": {  
    "inputs": {  
      "samples": [  
        "3",  
        0  
      ],  
      "vae": [  
        "4",  
        2  
      ]  
    },  
    "class_type": "VAEDecode",  
    "_meta": {  
      "title": "VAE Decode"  
    }  
  },  
  "9": {  
    "inputs": {  
      "filename_prefix": "ComfyUI",  
      "images": [  
        "8",  
        0  
      ]  
    },  
    "class_type": "SaveImage",  
    "_meta": {  
      "title": "Save Image"  
    }  
  }  
}
```

* Description: Sets the ComfyUI workflow.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Gemini[​](#gemini "Direct link to Gemini")

#### `GEMINI_API_BASE_URL`[​](#gemini_api_base_url "Direct link to gemini_api_base_url")

* Type: `str`
* Default: `None`
* Description: Specifies the URL to Gemini's API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GEMINI_API_KEY`[​](#gemini_api_key "Direct link to gemini_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the Gemini API key.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGES_GEMINI_API_BASE_URL`[​](#images_gemini_api_base_url "Direct link to images_gemini_api_base_url")

* Type: `str`
* Default: `None`
* Description: Specifies the URL to Gemini's image generation API.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGES_GEMINI_API_KEY`[​](#images_gemini_api_key "Direct link to images_gemini_api_key")

* Type: `str`
* Default: `None`
* Description: Sets the Gemini API key for image generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

### OpenAI DALL-E[​](#openai-dall-e "Direct link to OpenAI DALL-E")

#### `IMAGES_OPENAI_API_BASE_URL`[​](#images_openai_api_base_url "Direct link to images_openai_api_base_url")

* Type: `str`
* Default: `${OPENAI_API_BASE_URL}`
* Description: Sets the OpenAI-compatible base URL to use for DALL-E image generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGES_OPENAI_API_VERSION`[​](#images_openai_api_version "Direct link to images_openai_api_version")

* Type: `str`
* Default: `${OPENAI_API_VERSION}`
* Description: Optional setting. If provided it sets the `api-version` query parameter when calling the image generation. If the Azure OpenAI service is used, this needs to be configured.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `IMAGES_OPENAI_API_KEY`[​](#images_openai_api_key "Direct link to images_openai_api_key")

* Type: `str`
* Default: `${OPENAI_API_KEY}`
* Description: Sets the API key to use for DALL-E image generation.
* Persistence: This environment variable is a `PersistentConfig` variable.

OAuth[​](#oauth "Direct link to OAuth")
---------------------------------------

info

You can only configure one OAUTH provider at a time. You cannot have two or more OAUTH providers configured simultaneously.

#### `ENABLE_OAUTH_SIGNUP`[​](#enable_oauth_signup "Direct link to enable_oauth_signup")

* Type: `bool`
* Default: `False`
* Description: Enables account creation when signing up via OAuth. Distinct from `ENABLE_SIGNUP`.
* Persistence: This environment variable is a `PersistentConfig` variable.

danger

`ENABLE_LOGIN_FORM` must be set to `False` when `ENABLE_OAUTH_SIGNUP` is set to `True`. Failure to do so will result in the inability to login.

#### `ENABLE_OAUTH_PERSISTENT_CONFIG`[​](#enable_oauth_persistent_config "Direct link to enable_oauth_persistent_config")

* Type: `bool`
* Default: `True`
* Description: Controls whether OAuth-related settings are persisted in the database after the first launch.

info

By default, OAuth configurations are stored in the database and managed via the Admin Panel after the initial setup. Set this variable to `False` to force Open WebUI to **always** read OAuth settings from the environment variables on every restart. This is ideal for environments using GitOps or immutable infrastructure where configuration is managed exclusively through external files (e.g., Docker Compose, Kubernetes ConfigMaps).

#### `OAUTH_SUB_CLAIM`[​](#oauth_sub_claim "Direct link to oauth_sub_claim")

* Type: `str`
* Default: `None`
* Description: Overrides the default claim used to identify a user's unique ID (`sub`) from the OAuth/OIDC provider's user info response. By default, Open WebUI attempts to infer this from the provider's configuration. This variable allows you to explicitly specify which claim to use. For example, if your identity provider uses 'employee\_id' as the unique identifier, you would set this variable to 'employee\_id'.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_MERGE_ACCOUNTS_BY_EMAIL`[​](#oauth_merge_accounts_by_email "Direct link to oauth_merge_accounts_by_email")

* Type: `bool`
* Default: `False`
* Description: If enabled, merges OAuth accounts with existing accounts using the same email
  address. This is considered unsafe as not all OAuth providers will verify email addresses and can lead to potential account takeovers.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_OAUTH_WITHOUT_EMAIL`[​](#enable_oauth_without_email "Direct link to enable_oauth_without_email")

* Type: `bool`
* Default: `False`
* Description: Enables authentication with OpenID Connect (OIDC) providers that do not support or expose an email scope. When enabled, Open WebUI will create and manage user accounts without requiring an email address from the OAuth provider.
* Persistence: This environment variable is a `PersistentConfig` variable.

warning

**Use with Caution**

Enabling this option bypasses email-based user identification, which is the standard method for uniquely identifying users across authentication systems. When enabled:

* User accounts will be created using the `sub` claim (or the claim specified in `OAUTH_SUB_CLAIM`) as the primary identifier
* Email-based features such as password recovery, email notifications, and account merging via `OAUTH_MERGE_ACCOUNTS_BY_EMAIL` will not function properly
* Ensure your OIDC provider's `sub` claim is stable and unique to prevent authentication conflicts

Only enable this if your identity provider does not support email scope and you have alternative user identification mechanisms in place.

This setting is designed for enterprise environments using identity providers that:

* Use employee IDs, usernames, or other non-email identifiers as the primary user claim
* Have privacy policies that prevent sharing email addresses via OAuth
* Operate in air-gapped or highly restricted networks where email-based services are unavailable

For most standard OAuth providers (Google, Microsoft, GitHub, etc.), this setting should remain `False`.

#### `OAUTH_UPDATE_PICTURE_ON_LOGIN`[​](#oauth_update_picture_on_login "Direct link to oauth_update_picture_on_login")

* Type: `bool`
* Default: `False`
* Description: If enabled, updates the local user profile picture with the OAuth-provided picture on login.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

If the OAuth picture claim is disabled by setting `OAUTH_PICTURE_CLAIM` to `''` (empty string), then setting this variable to `true` will not update the user profile pictures.

#### `ENABLE_OAUTH_ID_TOKEN_COOKIE`[​](#enable_oauth_id_token_cookie "Direct link to enable_oauth_id_token_cookie")

* Type: `bool`
* Default: `True`
* Description: Controls whether the **legacy** `oauth_id_token` cookie (unsafe, not recommended, token can go stale/orphaned) is set in the browser upon a successful OAuth login. This is provided for **backward compatibility** with custom tools or older versions that might rely on scraping this cookie. **The new, recommended approach is to use the server-side session management.**
* Usage: For new and secure deployments, **it is recommended to set this to `False`** to minimize the information exposed to the client-side. Keep it as `True` only if you have integrations that depend on the old cookie-based method.

#### `OAUTH_CLIENT_INFO_ENCRYPTION_KEY`[​](#oauth_client_info_encryption_key "Direct link to oauth_client_info_encryption_key")

* Type: `str`
* Default: Falls back to the value of `WEBUI_SECRET_KEY`.
* Description: Specifies the secret key used to encrypt and decrypt OAuth client tokens stored server-side in the database. This is a critical security component for OAuth client tokens. If not set, it defaults to using the main `WEBUI_SECRET_KEY`, but it is highly recommended to set it to a unique, securely generated value for production environments. `OAUTH_CLIENT_INFO_ENCRYPTION_KEY` is used in conjunction with OAuth 2.1 MCP server authentication.

#### `OAUTH_SESSION_TOKEN_ENCRYPTION_KEY`[​](#oauth_session_token_encryption_key "Direct link to oauth_session_token_encryption_key")

* Type: `str`
* Default: Falls back to the value of `WEBUI_SECRET_KEY`.
* Description: Specifies the secret key used to encrypt and decrypt OAuth tokens stored server-side in the database. This is a critical security component for protecting user credentials at rest. If not set, it defaults to using the main `WEBUI_SECRET_KEY`, but it is highly recommended to set it to a unique, securely generated value for production environments.

warning

**Required for Multi-Replica Deployments**
In any production environment running more than one instance of Open WebUI (e.g., Docker Swarm, Kubernetes), this variable **MUST** be explicitly set to a persistent, shared secret. If left unset, each replica will generate or use a different key, causing session decryption to fail intermittently as user requests are load-balanced across instances.

#### `WEBUI_AUTH_TRUSTED_EMAIL_HEADER`[​](#webui_auth_trusted_email_header "Direct link to webui_auth_trusted_email_header")

* Type: `str`
* Description: Defines the trusted request header for authentication. See [SSO docs](/features/auth/sso).

#### `WEBUI_AUTH_TRUSTED_NAME_HEADER`[​](#webui_auth_trusted_name_header "Direct link to webui_auth_trusted_name_header")

* Type: `str`
* Description: Defines the trusted request header for the username of anyone registering with the
  `WEBUI_AUTH_TRUSTED_EMAIL_HEADER` header. See [SSO docs](/features/auth/sso).

#### `WEBUI_AUTH_TRUSTED_GROUPS_HEADER`[​](#webui_auth_trusted_groups_header "Direct link to webui_auth_trusted_groups_header")

* Type: `str`
* Description: Defines the trusted request header containing a comma-separated list of group memberships for the user when using trusted header authentication. See [SSO docs](/features/auth/sso).

### Google[​](#google "Direct link to Google")

See <https://support.google.com/cloud/answer/6158849?hl=en>

info

You must also set `OPENID_PROVIDER_URL` or otherwise logout may not work.

#### `GOOGLE_CLIENT_ID`[​](#google_client_id "Direct link to google_client_id")

* Type: `str`
* Description: Sets the client ID for Google OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GOOGLE_CLIENT_SECRET`[​](#google_client_secret "Direct link to google_client_secret")

* Type: `str`
* Description: Sets the client secret for Google OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GOOGLE_OAUTH_SCOPE`[​](#google_oauth_scope "Direct link to google_oauth_scope")

* Type: `str`
* Default: `openid email profile`
* Description: Sets the scope for Google OAuth authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GOOGLE_REDIRECT_URI`[​](#google_redirect_uri "Direct link to google_redirect_uri")

* Type: `str`
* Default: `<backend>/oauth/google/callback`
* Description: Sets the redirect URI for Google OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Microsoft[​](#microsoft "Direct link to Microsoft")

See <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

info

You must also set `OPENID_PROVIDER_URL` or otherwise logout may not work.

#### `MICROSOFT_CLIENT_ID`[​](#microsoft_client_id "Direct link to microsoft_client_id")

* Type: `str`
* Description: Sets the client ID for Microsoft OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MICROSOFT_CLIENT_SECRET`[​](#microsoft_client_secret "Direct link to microsoft_client_secret")

* Type: `str`
* Description: Sets the client secret for Microsoft OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MICROSOFT_CLIENT_TENANT_ID`[​](#microsoft_client_tenant_id "Direct link to microsoft_client_tenant_id")

* Type: `str`
* Description: Sets the tenant ID for Microsoft OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MICROSOFT_OAUTH_SCOPE`[​](#microsoft_oauth_scope "Direct link to microsoft_oauth_scope")

* Type: `str`
* Default: `openid email profile`
* Description: Sets the scope for Microsoft OAuth authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `MICROSOFT_REDIRECT_URI`[​](#microsoft_redirect_uri "Direct link to microsoft_redirect_uri")

* Type: `str`
* Default: `<backend>/oauth/microsoft/callback`
* Description: Sets the redirect URI for Microsoft OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

### GitHub[​](#github "Direct link to GitHub")

See <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps>

info

You must also set `OPENID_PROVIDER_URL` or otherwise logout may not work.

#### `GITHUB_CLIENT_ID`[​](#github_client_id "Direct link to github_client_id")

* Type: `str`
* Description: Sets the client ID for GitHub OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GITHUB_CLIENT_SECRET`[​](#github_client_secret "Direct link to github_client_secret")

* Type: `str`
* Description: Sets the client secret for GitHub OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GITHUB_CLIENT_SCOPE`[​](#github_client_scope "Direct link to github_client_scope")

* Type: `str`
* Default: `user:email`
* Description: Specifies the scope for GitHub OAuth authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `GITHUB_CLIENT_REDIRECT_URI`[​](#github_client_redirect_uri "Direct link to github_client_redirect_uri")

* Type: `str`
* Default: `<backend>/oauth/github/callback`
* Description: Sets the redirect URI for GitHub OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Feishu[​](#feishu "Direct link to Feishu")

See <https://open.feishu.cn/document/sso/web-application-sso/login-overview>

#### `FEISHU_CLIENT_ID`[​](#feishu_client_id "Direct link to feishu_client_id")

* Type: `str`
* Description: Sets the client ID for Feishu OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `FEISHU_CLIENT_SECRET`[​](#feishu_client_secret "Direct link to feishu_client_secret")

* Type: `str`
* Description: Sets the client secret for Feishu OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `FEISHU_CLIENT_SCOPE`[​](#feishu_client_scope "Direct link to feishu_client_scope")

* Type: `str`
* Default: `contact:user.base:readonly`
* Description: Specifies the scope for Feishu OAuth authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `FEISHU_CLIENT_REDIRECT_URI`[​](#feishu_client_redirect_uri "Direct link to feishu_client_redirect_uri")

* Type: `str`
* Description: Sets the redirect URI for Feishu OAuth.
* Persistence: This environment variable is a `PersistentConfig` variable.

### OpenID (OIDC)[​](#openid-oidc "Direct link to OpenID (OIDC)")

#### `OAUTH_CLIENT_ID`[​](#oauth_client_id "Direct link to oauth_client_id")

* Type: `str`
* Description: Sets the client ID for OIDC.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_CLIENT_SECRET`[​](#oauth_client_secret "Direct link to oauth_client_secret")

* Type: `str`
* Description: Sets the client secret for OIDC.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OPENID_PROVIDER_URL`[​](#openid_provider_url "Direct link to openid_provider_url")

* Type: `str`
* Description: Path to the `.well-known/openid-configuration` endpoint
* Persistence: This environment variable is a `PersistentConfig` variable.

danger

The environment variable `OPENID_PROVIDER_URL` MUST be configured, otherwise the logout functionality will not work for most providers.
Even when using Microsoft, GitHub or other providers, you MUST set the `OPENID_PROVIDER_URL` environment variable.

#### `OPENID_REDIRECT_URI`[​](#openid_redirect_uri "Direct link to openid_redirect_uri")

* Type: `str`
* Default: `<backend>/oauth/oidc/callback`
* Description: Sets the redirect URI for OIDC
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_SCOPES`[​](#oauth_scopes "Direct link to oauth_scopes")

* Type: `str`
* Default: `openid email profile`
* Description: Sets the scope for OIDC authentication. `openid` and `email` are required.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_CODE_CHALLENGE_METHOD`[​](#oauth_code_challenge_method "Direct link to oauth_code_challenge_method")

* Type: `str`
* Options:
  + `S256` - Hash `code_verifier` with SHA-256.
* Default: Empty string (' '), since `None` is set as default.
* Description: Specifies the code challenge method for OAuth authentication. Set to `S256` when PKCE is required by the provider.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_PROVIDER_NAME`[​](#oauth_provider_name "Direct link to oauth_provider_name")

* Type: `str`
* Default: `SSO`
* Description: Sets the name for the OIDC provider.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_USERNAME_CLAIM`[​](#oauth_username_claim "Direct link to oauth_username_claim")

* Type: `str`
* Default: `name`
* Description: Set username claim for OpenID.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_EMAIL_CLAIM`[​](#oauth_email_claim "Direct link to oauth_email_claim")

* Type: `str`
* Default: `email`
* Description: Set email claim for OpenID.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_PICTURE_CLAIM`[​](#oauth_picture_claim "Direct link to oauth_picture_claim")

* Type: `str`
* Default: `picture`
* Description: Set picture (avatar) claim for OpenID.
* Persistence: This environment variable is a `PersistentConfig` variable.

info

If `OAUTH_PICTURE_CLAIM` is set to `''` (empty string), then the OAuth picture claim is disabled and the user profile pictures will not be saved.

#### `OAUTH_GROUP_CLAIM`[​](#oauth_group_claim "Direct link to oauth_group_claim")

* Type: `str`
* Default: `groups`
* Description: Specifies the group claim for OAuth authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_OAUTH_ROLE_MANAGEMENT`[​](#enable_oauth_role_management "Direct link to enable_oauth_role_management")

* Type: `bool`
* Default: `False`
* Description: Enables role management for OAuth delegation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_OAUTH_GROUP_MANAGEMENT`[​](#enable_oauth_group_management "Direct link to enable_oauth_group_management")

* Type: `bool`
* Default: `False`
* Description: Enables or disables OAuth group management.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_ROLES_CLAIM`[​](#oauth_roles_claim "Direct link to oauth_roles_claim")

* Type: `str`
* Default: `roles`
* Description: Sets the roles claim to look for in the OIDC token.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_ALLOWED_ROLES`[​](#oauth_allowed_roles "Direct link to oauth_allowed_roles")

* Type: `str`
* Default: `user,admin`
* Description: Sets the roles that are allowed access to the platform.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_ADMIN_ROLES`[​](#oauth_admin_roles "Direct link to oauth_admin_roles")

* Type: `str`
* Default: `admin`
* Description: Sets the roles that are considered administrators.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `OAUTH_ALLOWED_DOMAINS`[​](#oauth_allowed_domains "Direct link to oauth_allowed_domains")

* Type: `str`
* Default: `*`
* Description: Specifies the allowed domains for OAuth authentication. (e.g., "example1.com,example2.com").
* Persistence: This environment variable is a `PersistentConfig` variable.

LDAP[​](#ldap "Direct link to LDAP")
------------------------------------

#### `ENABLE_LDAP`[​](#enable_ldap "Direct link to enable_ldap")

* Type: `bool`
* Default: `False`
* Description: Enables or disables LDAP authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_SERVER_LABEL`[​](#ldap_server_label "Direct link to ldap_server_label")

* Type: `str`
* Description: Sets the label of the LDAP server.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_SERVER_HOST`[​](#ldap_server_host "Direct link to ldap_server_host")

* Type: `str`
* Default: `localhost`
* Description: Sets the hostname of the LDAP server.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_SERVER_PORT`[​](#ldap_server_port "Direct link to ldap_server_port")

* Type: `int`
* Default: `389`
* Description: Sets the port number of the LDAP server.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_ATTRIBUTE_FOR_MAIL`[​](#ldap_attribute_for_mail "Direct link to ldap_attribute_for_mail")

* Type: `str`
* Description: Sets the attribute to use as mail for LDAP authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_ATTRIBUTE_FOR_USERNAME`[​](#ldap_attribute_for_username "Direct link to ldap_attribute_for_username")

* Type: `str`
* Description: Sets the attribute to use as a username for LDAP authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_APP_DN`[​](#ldap_app_dn "Direct link to ldap_app_dn")

* Type: `str`
* Description: Sets the distinguished name for the LDAP application.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_APP_PASSWORD`[​](#ldap_app_password "Direct link to ldap_app_password")

* Type: `str`
* Description: Sets the password for the LDAP application.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_SEARCH_BASE`[​](#ldap_search_base "Direct link to ldap_search_base")

* Type: `str`
* Description: Sets the base to search for LDAP authentication.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_SEARCH_FILTER`[​](#ldap_search_filter "Direct link to ldap_search_filter")

* Type: `str`
* Default: `None`
* Description: Sets a single filter to use for LDAP search. Alternative to `LDAP_SEARCH_FILTERS`.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_SEARCH_FILTERS`[​](#ldap_search_filters "Direct link to ldap_search_filters")

* Type: `str`
* Description: Sets the filter to use for LDAP search.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_USE_TLS`[​](#ldap_use_tls "Direct link to ldap_use_tls")

* Type: `bool`
* Default: `True`
* Description: Enables or disables TLS for LDAP connection.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_CA_CERT_FILE`[​](#ldap_ca_cert_file "Direct link to ldap_ca_cert_file")

* Type: `str`
* Description: Sets the path to the LDAP CA certificate file.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_VALIDATE_CERT`[​](#ldap_validate_cert "Direct link to ldap_validate_cert")

* Type: `bool`
* Description: Sets whether to validate the LDAP CA certificate.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_CIPHERS`[​](#ldap_ciphers "Direct link to ldap_ciphers")

* Type: `str`
* Default: `ALL`
* Description: Sets the ciphers to use for LDAP connection.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_LDAP_GROUP_MANAGEMENT`[​](#enable_ldap_group_management "Direct link to enable_ldap_group_management")

* Type: `bool`
* Default: `False`
* Description: Enables the group management feature.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `ENABLE_LDAP_GROUP_CREATION`[​](#enable_ldap_group_creation "Direct link to enable_ldap_group_creation")

* Type: `bool`
* Default: `False`
* Description: If a group from LDAP does not exist in Open WebUI, it will be created automatically.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `LDAP_ATTRIBUTE_FOR_GROUPS`[​](#ldap_attribute_for_groups "Direct link to ldap_attribute_for_groups")

* Type: `str`
* Default: `memberOf`
* Description: Specifies the LDAP attribute that contains the user's group memberships. `memberOf` is a standard attribute for this purpose in Active Directory environments.
* Persistence: This environment variable is a `PersistentConfig` variable.

SCIM[​](#scim "Direct link to SCIM")
------------------------------------

#### `SCIM_ENABLED`[​](#scim_enabled "Direct link to scim_enabled")

* Type: `bool`
* Default: `False`
* Description: Enables or disables SCIM 2.0 (System for Cross-domain Identity Management) support for automated user and group provisioning from identity providers like Okta, Azure AD, and Google Workspace.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `SCIM_TOKEN`[​](#scim_token "Direct link to scim_token")

* Type: `str`
* Default: `""`
* Description: Sets the bearer token for SCIM authentication. This token must be provided by identity providers when making SCIM API requests. Generate a secure random token (e.g., using `openssl rand -base64 32`) and configure it in both Open WebUI and your identity provider.
* Persistence: This environment variable is a `PersistentConfig` variable.

User Permissions[​](#user-permissions "Direct link to User Permissions")
------------------------------------------------------------------------

### Chat Permissions[​](#chat-permissions "Direct link to Chat Permissions")

#### `USER_PERMISSIONS_CHAT_CONTROLS`[​](#user_permissions_chat_controls "Direct link to user_permissions_chat_controls")

* Type: `bool`
* Default: `True`
* Description: Acts as a master switch to enable or disable the main "Controls" button and panel in the chat interface. **If this is set to False, users will not see the Controls button, and the granular permissions below will have no effect**.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_VALVES`[​](#user_permissions_chat_valves "Direct link to user_permissions_chat_valves")

* Type: `bool`
* Default: `True`
* Description: When `USER_PERMISSIONS_CHAT_CONTROLS` is enabled, this setting specifically controls the visibility of the "Valves" section within the chat controls panel.

#### `USER_PERMISSIONS_CHAT_SYSTEM_PROMPT`[​](#user_permissions_chat_system_prompt "Direct link to user_permissions_chat_system_prompt")

* Type: `bool`
* Default: `True`
* Description: When `USER_PERMISSIONS_CHAT_CONTROLS` is enabled, this setting specifically controls the visibility of the customizable "System Prompt" section within the chat controls panel, folders and the user settings.

#### `USER_PERMISSIONS_CHAT_PARAMS`[​](#user_permissions_chat_params "Direct link to user_permissions_chat_params")

* Type: `bool`
* Default: `True`
* Description: When `USER_PERMISSIONS_CHAT_CONTROLS` is enabled, this setting specifically controls the visibility of the "Advanced Parameters" section within the chat controls panel.

#### `USER_PERMISSIONS_CHAT_FILE_UPLOAD`[​](#user_permissions_chat_file_upload "Direct link to user_permissions_chat_file_upload")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to upload files to chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_DELETE`[​](#user_permissions_chat_delete "Direct link to user_permissions_chat_delete")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to delete chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_EDIT`[​](#user_permissions_chat_edit "Direct link to user_permissions_chat_edit")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to edit chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_DELETE_MESSAGE`[​](#user_permissions_chat_delete_message "Direct link to user_permissions_chat_delete_message")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to delete individual messages within chats. This provides granular control over message deletion capabilities separate from full chat deletion.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_CONTINUE_RESPONSE`[​](#user_permissions_chat_continue_response "Direct link to user_permissions_chat_continue_response")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to continue AI responses. When disabled, users cannot use the "Continue Response" button, which helps prevent potential system prompt leakage through response continuation manipulation.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_REGENERATE_RESPONSE`[​](#user_permissions_chat_regenerate_response "Direct link to user_permissions_chat_regenerate_response")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to regenerate AI responses. Controls access to both the standard regenerate button and the guided regeneration menu.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_RATE_RESPONSE`[​](#user_permissions_chat_rate_response "Direct link to user_permissions_chat_rate_response")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to rate AI responses using the thumbs up/down feedback system. This controls access to the response rating functionality for evaluation and feedback collection.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_STT`[​](#user_permissions_chat_stt "Direct link to user_permissions_chat_stt")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to use Speech-to-Text in chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_TTS`[​](#user_permissions_chat_tts "Direct link to user_permissions_chat_tts")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to use Text-to-Speech in chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_CALL`[​](#user_permissions_chat_call "Direct link to user_permissions_chat_call")

* Type: `str`
* Default: `True`
* Description: Enables or disables user permission to make calls in chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_MULTIPLE_MODELS`[​](#user_permissions_chat_multiple_models "Direct link to user_permissions_chat_multiple_models")

* Type: `str`
* Default: `True`
* Description: Enables or disables user permission to use multiple models in chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_TEMPORARY`[​](#user_permissions_chat_temporary "Direct link to user_permissions_chat_temporary")

* Type: `bool`
* Default: `True`
* Description: Enables or disables user permission to create temporary chats.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_CHAT_TEMPORARY_ENFORCED`[​](#user_permissions_chat_temporary_enforced "Direct link to user_permissions_chat_temporary_enforced")

* Type: `str`
* Default: `False`
* Description: Enables or disables enforced temporary chats for users.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Feature Permissions[​](#feature-permissions "Direct link to Feature Permissions")

#### `USER_PERMISSIONS_FEATURES_DIRECT_TOOL_SERVERS`[​](#user_permissions_features_direct_tool_servers "Direct link to user_permissions_features_direct_tool_servers")

* Type: `str`
* Default: `False`
* Description: Enables or disables user permission to access direct tool servers.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_FEATURES_WEB_SEARCH`[​](#user_permissions_features_web_search "Direct link to user_permissions_features_web_search")

* Type: `str`
* Default: `True`
* Description: Enables or disables user permission to use the web search feature.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_FEATURES_IMAGE_GENERATION`[​](#user_permissions_features_image_generation "Direct link to user_permissions_features_image_generation")

* Type: `str`
* Default: `True`
* Description: Enables or disables user permission to use the image generation feature.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_FEATURES_CODE_INTERPRETER`[​](#user_permissions_features_code_interpreter "Direct link to user_permissions_features_code_interpreter")

* Type: `str`
* Default: `True`
* Description: Enables or disables user permission to use code interpreter feature.
* Persistence: This environment variable is a `PersistentConfig` variable.

### Workspace Permissions[​](#workspace-permissions "Direct link to Workspace Permissions")

#### `USER_PERMISSIONS_WORKSPACE_MODELS_ACCESS`[​](#user_permissions_workspace_models_access "Direct link to user_permissions_workspace_models_access")

* Type: `bool`
* Default: `False`
* Description: Enables or disables user permission to access workspace models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_KNOWLEDGE_ACCESS`[​](#user_permissions_workspace_knowledge_access "Direct link to user_permissions_workspace_knowledge_access")

* Type: `bool`
* Default: `False`
* Description: Enables or disables user permission to access workspace knowledge.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_PROMPTS_ACCESS`[​](#user_permissions_workspace_prompts_access "Direct link to user_permissions_workspace_prompts_access")

* Type: `bool`
* Default: `False`
* Description: Enables or disables user permission to access workspace prompts.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_TOOLS_ACCESS`[​](#user_permissions_workspace_tools_access "Direct link to user_permissions_workspace_tools_access")

* Type: `bool`
* Default: `False`
* Description: Enables or disables user permission to access workspace tools.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_MODELS_ALLOW_PUBLIC_SHARING`[​](#user_permissions_workspace_models_allow_public_sharing "Direct link to user_permissions_workspace_models_allow_public_sharing")

* Type: `str`
* Default: `False`
* Description: Enables or disables public sharing of workspace models.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_KNOWLEDGE_ALLOW_PUBLIC_SHARING`[​](#user_permissions_workspace_knowledge_allow_public_sharing "Direct link to user_permissions_workspace_knowledge_allow_public_sharing")

* Type: `str`
* Default: `False`
* Description: Enables or disables public sharing of workspace knowledge.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_PROMPTS_ALLOW_PUBLIC_SHARING`[​](#user_permissions_workspace_prompts_allow_public_sharing "Direct link to user_permissions_workspace_prompts_allow_public_sharing")

* Type: `str`
* Default: `False`
* Description: Enables or disables public sharing of workspace prompts.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_WORKSPACE_TOOLS_ALLOW_PUBLIC_SHARING`[​](#user_permissions_workspace_tools_allow_public_sharing "Direct link to user_permissions_workspace_tools_allow_public_sharing")

* Type: `str`
* Default: `False`
* Description: Enables or disables public sharing of workspace tools.
* Persistence: This environment variable is a `PersistentConfig` variable.

#### `USER_PERMISSIONS_NOTES_ALLOW_PUBLIC_SHARING`[​](#user_permissions_notes_allow_public_sharing "Direct link to user_permissions_notes_allow_public_sharing")

* Type: `str`
* Default: `True`
* Description: Enables or disables public sharing of notes.

Misc Environment Variables[​](#misc-environment-variables "Direct link to Misc Environment Variables")
------------------------------------------------------------------------------------------------------

These variables are not specific to Open WebUI but can still be valuable in certain contexts.

### Cloud Storage[​](#cloud-storage "Direct link to Cloud Storage")

#### `STORAGE_PROVIDER`[​](#storage_provider "Direct link to storage_provider")

* Type: `str`
* Options:
  + `s3` - uses the S3 client library and related environment variables mentioned in [Amazon S3 Storage](#amazon-s3-storage)
  + `gcs` - uses the GCS client library and related environment variables mentioned in [Google Cloud Storage](#google-cloud-storage)
  + `azure` - uses the Azure client library and related environment variables mentioned in [Microsoft Azure Storage](#microsoft-azure-storage)
* Default: empty string (' '), which defaults to `local`
* Description: Sets the storage provider.

#### Amazon S3 Storage[​](#amazon-s3-storage "Direct link to Amazon S3 Storage")

#### `S3_ACCESS_KEY_ID`[​](#s3_access_key_id "Direct link to s3_access_key_id")

* Type: `str`
* Description: Sets the access key ID for S3 storage.

#### `S3_ADDRESSING_STYLE`[​](#s3_addressing_style "Direct link to s3_addressing_style")

* Type: `str`
* Default: `None`
* Description: Specifies the addressing style to use for S3 storage (e.g., 'path', 'virtual').

#### `S3_BUCKET_NAME`[​](#s3_bucket_name "Direct link to s3_bucket_name")

* Type: `str`
* Description: Sets the bucket name for S3 storage.

#### `S3_ENDPOINT_URL`[​](#s3_endpoint_url "Direct link to s3_endpoint_url")

* Type: `str`
* Description: Sets the endpoint URL for S3 storage.

info

If the endpoint is an S3-compatible provider like MinIO that uses a TLS certificate signed by a private CA, set the environment variable `AWS_CA_BUNDLE` to the path of your PEM-encoded CA certificates file. See the [Amazon SDK Docs](https://docs.aws.amazon.com/sdkref/latest/guide/feature-gen-config.html) for more information.

#### `S3_KEY_PREFIX`[​](#s3_key_prefix "Direct link to s3_key_prefix")

* Type: `str`
* Description: Sets the key prefix for a S3 object.

#### `S3_REGION_NAME`[​](#s3_region_name "Direct link to s3_region_name")

* Type: `str`
* Description: Sets the region name for S3 storage.

#### `S3_SECRET_ACCESS_KEY`[​](#s3_secret_access_key "Direct link to s3_secret_access_key")

* Type: `str`
* Description: Sets the secret access key for S3 storage.

#### `S3_USE_ACCELERATE_ENDPOINT`[​](#s3_use_accelerate_endpoint "Direct link to s3_use_accelerate_endpoint")

* Type: `str`
* Default: `False`
* Description: Specifies whether to use the accelerated endpoint for S3 storage.

#### `S3_ENABLE_TAGGING`[​](#s3_enable_tagging "Direct link to s3_enable_tagging")

* Type: `str`
* Default: `False`
* Description: Enables S3 object tagging after uploads for better organization, searching, and integration with file management policies. Always set to `False` when using Cloudflare R2, as R2 does not support object tagging.

#### Google Cloud Storage[​](#google-cloud-storage "Direct link to Google Cloud Storage")

#### `GOOGLE_APPLICATION_CREDENTIALS_JSON`[​](#google_application_credentials_json "Direct link to google_application_credentials_json")

* Type: `str`
* Description: Contents of Google Application Credentials JSON file.
  + Optional - if not provided, credentials will be taken from the environment. User credentials if run locally and Google Metadata server if run on a Google Compute Engine.
  + A file can be generated for a service account following this [guide.](https://developers.google.com/workspace/guides/create-credentials#service-account)

#### `GCS_BUCKET_NAME`[​](#gcs_bucket_name "Direct link to gcs_bucket_name")

* Type: `str`
* Description: Sets the bucket name for Google Cloud Storage. Bucket must already exist.

#### Microsoft Azure Storage[​](#microsoft-azure-storage "Direct link to Microsoft Azure Storage")

#### `AZURE_STORAGE_ENDPOINT`[​](#azure_storage_endpoint "Direct link to azure_storage_endpoint")

* Type: `str`
* Description: Sets the endpoint URL for Azure Storage.

#### `AZURE_STORAGE_CONTAINER_NAME`[​](#azure_storage_container_name "Direct link to azure_storage_container_name")

* Type: `str`
* Description: Sets the container name for Azure Storage.

#### `AZURE_STORAGE_KEY`[​](#azure_storage_key "Direct link to azure_storage_key")

* Type: `str`
* Description: Set the access key for Azure Storage.
  + Optional - if not provided, credentials will be taken from the environment. User credentials if run locally and Managed Identity if run in Azure services.

### OpenTelemetry Configuration[​](#opentelemetry-configuration "Direct link to OpenTelemetry Configuration")

#### `ENABLE_OTEL`[​](#enable_otel "Direct link to enable_otel")

* Type: `bool`
* Default: `False`
* Description: Enables or disables OpenTelemetry for observability. When enabled, tracing, metrics, and logging data can be collected and exported to an OTLP endpoint.

#### `ENABLE_OTEL_TRACES`[​](#enable_otel_traces "Direct link to enable_otel_traces")

* Type: `bool`
* Default: `False`
* Description: Enables or disables OpenTelemetry traces collection and export. This variable works in conjunction with `ENABLE_OTEL`.

#### `ENABLE_OTEL_METRICS`[​](#enable_otel_metrics "Direct link to enable_otel_metrics")

* Type: `bool`
* Default: `False`
* Description: Enables or disables OpenTelemetry metrics collection and export. This variable works in conjunction with `ENABLE_OTEL`.

#### `ENABLE_OTEL_LOGS`[​](#enable_otel_logs "Direct link to enable_otel_logs")

* Type: `bool`
* Default: `False`
* Description: Enables or disables OpenTelemetry logging export. When enabled, application logs are sent to the configured OTLP endpoint. This variable works in conjunction with `ENABLE_OTEL`.

#### `OTEL_EXPORTER_OTLP_ENDPOINT`[​](#otel_exporter_otlp_endpoint "Direct link to otel_exporter_otlp_endpoint")

* Type: `str`
* Default: `http://localhost:4317`
* Description: Specifies the default OTLP (OpenTelemetry Protocol) endpoint for exporting traces, metrics, and logs. This can be overridden for metrics if `OTEL_METRICS_EXPORTER_OTLP_ENDPOINT` is set, and for logs if `OTEL_LOGS_EXPORTER_OTLP_ENDPOINT` is set.

#### `OTEL_METRICS_EXPORTER_OTLP_ENDPOINT`[​](#otel_metrics_exporter_otlp_endpoint "Direct link to otel_metrics_exporter_otlp_endpoint")

* Type: `str`
* Default: Value of `OTEL_EXPORTER_OTLP_ENDPOINT`
* Description: Specifies the dedicated OTLP endpoint for exporting OpenTelemetry metrics. If not set, it defaults to the value of `OTEL_EXPORTER_OTLP_ENDPOINT`. This is useful when separate endpoints for traces and metrics are used.

#### `OTEL_LOGS_EXPORTER_OTLP_ENDPOINT`[​](#otel_logs_exporter_otlp_endpoint "Direct link to otel_logs_exporter_otlp_endpoint")

* Type: `str`
* Default: Value of `OTEL_EXPORTER_OTLP_ENDPOINT`
* Description: Specifies the dedicated OTLP endpoint for exporting OpenTelemetry logs. If not set, it defaults to the value of `OTEL_EXPORTER_OTLP_ENDPOINT`. This is useful when separate endpoints for logs, traces, and metrics are used.

#### `OTEL_EXPORTER_OTLP_INSECURE`[​](#otel_exporter_otlp_insecure "Direct link to otel_exporter_otlp_insecure")

* Type: `bool`
* Default: `False`
* Description: If set to `True`, the OTLP exporter will use an insecure connection (e.g., HTTP for gRPC) for traces. For metrics, its behavior is governed by `OTEL_METRICS_EXPORTER_OTLP_INSECURE`, and for logs by `OTEL_LOGS_EXPORTER_OTLP_INSECURE`.

#### `OTEL_METRICS_EXPORTER_OTLP_INSECURE`[​](#otel_metrics_exporter_otlp_insecure "Direct link to otel_metrics_exporter_otlp_insecure")

* Type: `bool`
* Default: Value of `OTEL_EXPORTER_OTLP_INSECURE`
* Description: If set to `True`, the OTLP exporter will use an insecure connection for metrics. If not specified, it uses the value of `OTEL_EXPORTER_OTLP_INSECURE`.

#### `OTEL_LOGS_EXPORTER_OTLP_INSECURE`[​](#otel_logs_exporter_otlp_insecure "Direct link to otel_logs_exporter_otlp_insecure")

* Type: `bool`
* Default: Value of `OTEL_EXPORTER_OTLP_INSECURE`
* Description: If set to `True`, the OTLP exporter will use an insecure connection for logs. If not specified, it uses the value of `OTEL_EXPORTER_OTLP_INSECURE`.

#### `OTEL_SERVICE_NAME`[​](#otel_service_name "Direct link to otel_service_name")

* Type: `str`
* Default: `open-webui`
* Description: Sets the service name that will be reported to your OpenTelemetry collector or observability platform. This helps identify your Open WebUI instance.

#### `OTEL_RESOURCE_ATTRIBUTES`[​](#otel_resource_attributes "Direct link to otel_resource_attributes")

* Type: `str`
* Default: Empty string (' ')
* Description: Allows you to define additional resource attributes to be attached to all telemetry data, in a comma-separated `key1=val1,key2=val2` format.

#### `OTEL_TRACES_SAMPLER`[​](#otel_traces_sampler "Direct link to otel_traces_sampler")

* Type: `str`
* Options: `parentbased_always_on`, `always_on`, `always_off`, `parentbased_always_off`, etc.
* Default: `parentbased_always_on`
* Description: Configures the sampling strategy for OpenTelemetry traces. This determines which traces are collected and exported to reduce data volume.

#### `OTEL_BASIC_AUTH_USERNAME`[​](#otel_basic_auth_username "Direct link to otel_basic_auth_username")

* Type: `str`
* Default: Empty string (' ')
* Description: Sets the username for basic authentication with the default OTLP endpoint. This applies to traces, and by default, to metrics and logs unless overridden by their specific authentication variables.

#### `OTEL_BASIC_AUTH_PASSWORD`[​](#otel_basic_auth_password "Direct link to otel_basic_auth_password")

* Type: `str`
* Default: Empty string (' ')
* Description: Sets the password for basic authentication with the default OTLP endpoint. This applies to traces, and by default, to metrics and logs unless overridden by their specific authentication variables.

#### `OTEL_METRICS_BASIC_AUTH_USERNAME`[​](#otel_metrics_basic_auth_username "Direct link to otel_metrics_basic_auth_username")

* Type: `str`
* Default: Value of `OTEL_BASIC_AUTH_USERNAME`
* Description: Sets the username for basic authentication specifically for the OTLP metrics endpoint. If not specified, it uses the value of `OTEL_BASIC_AUTH_USERNAME`.

#### `OTEL_METRICS_BASIC_AUTH_PASSWORD`[​](#otel_metrics_basic_auth_password "Direct link to otel_metrics_basic_auth_password")

* Type: `str`
* Default: Value of `OTEL_BASIC_AUTH_PASSWORD`
* Description: Sets the password for basic authentication specifically for the OTLP metrics endpoint. If not specified, it uses the value of `OTEL_BASIC_AUTH_PASSWORD`.

#### `OTEL_LOGS_BASIC_AUTH_USERNAME`[​](#otel_logs_basic_auth_username "Direct link to otel_logs_basic_auth_username")

* Type: `str`
* Default: Value of `OTEL_BASIC_AUTH_USERNAME`
* Description: Sets the username for basic authentication specifically for the OTLP logs endpoint. If not specified, it uses the value of `OTEL_BASIC_AUTH_USERNAME`.

#### `OTEL_LOGS_BASIC_AUTH_PASSWORD`[​](#otel_logs_basic_auth_password "Direct link to otel_logs_basic_auth_password")

* Type: `str`
* Default: Value of `OTEL_BASIC_AUTH_PASSWORD`
* Description: Sets the password for basic authentication specifically for the OTLP logs endpoint. If not specified, it uses the value of `OTEL_BASIC_AUTH_PASSWORD`.

#### `OTEL_OTLP_SPAN_EXPORTER`[​](#otel_otlp_span_exporter "Direct link to otel_otlp_span_exporter")

* Type: `str`
* Options: `grpc`, `http`
* Default: `grpc`
* Description: Specifies the default protocol for exporting OpenTelemetry traces (gRPC or HTTP). This can be overridden for metrics if `OTEL_METRICS_OTLP_SPAN_EXPORTER` is set, and for logs if `OTEL_LOGS_OTLP_SPAN_EXPORTER` is set.

#### `OTEL_METRICS_OTLP_SPAN_EXPORTER`[​](#otel_metrics_otlp_span_exporter "Direct link to otel_metrics_otlp_span_exporter")

* Type: `str`
* Options: `grpc`, `http`
* Default: Value of `OTEL_OTLP_SPAN_EXPORTER`
* Description: Specifies the protocol for exporting OpenTelemetry metrics (gRPC or HTTP). If not specified, it uses the value of `OTEL_OTLP_SPAN_EXPORTER`.

#### `OTEL_LOGS_OTLP_SPAN_EXPORTER`[​](#otel_logs_otlp_span_exporter "Direct link to otel_logs_otlp_span_exporter")

* Type: `str`
* Options: `grpc`, `http`
* Default: Value of `OTEL_OTLP_SPAN_EXPORTER`
* Description: Specifies the protocol for exporting OpenTelemetry logs (gRPC or HTTP). If not specified, it uses the value of `OTEL_OTLP_SPAN_EXPORTER`.

### Database Pool[​](#database-pool "Direct link to Database Pool")

#### `DATABASE_URL`[​](#database_url "Direct link to database_url")

* Type: `str`
* Default: `sqlite:///${DATA_DIR}/webui.db`
* Description: Specifies the complete database connection URL, following SQLAlchemy's URL scheme. This variable takes precedence over individual database connection parameters if explicitly set.

info

**For PostgreSQL support, ensure you installed with `pip install open-webui[all]` instead of the basic installation.**
Supports SQLite, Postgres, and encrypted SQLite via SQLCipher.
**Changing the URL does not migrate data between databases.**

Documentation on the URL scheme is available [here](https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls).

If your database password contains special characters, please ensure they are properly URL-encoded. For example, a password like `p@ssword` should be encoded as `p%40ssword`.

For configuration using individual parameters or encrypted SQLite, see the relevant sections below.

#### `DATABASE_TYPE`[​](#database_type "Direct link to database_type")

* Type: `str`
* Default: `None` (automatically set to `sqlite` if `DATABASE_URL` uses default SQLite path)
* Description: Specifies the database type (e.g., `sqlite`, `postgresql`, `sqlite+sqlcipher`). This is used in conjunction with other individual parameters to construct the `DATABASE_URL` if a complete `DATABASE_URL` is not explicitly defined.
* Persistence: No

#### `DATABASE_USER`[​](#database_user "Direct link to database_user")

* Type: `str`
* Default: `None`
* Description: Specifies the username for database authentication. This is used to construct the `DATABASE_URL` when a complete `DATABASE_URL` is not explicitly defined.
* Persistence: No

#### `DATABASE_PASSWORD`[​](#database_password "Direct link to database_password")

* Type: `str`
* Default: `None`
* Description: Specifies the password for database authentication. This is used to construct the `DATABASE_URL` when a complete `DATABASE_URL` is not explicitly defined. If your password contains special characters, please ensure they are properly URL-encoded.
* Persistence: No

#### `DATABASE_HOST`[​](#database_host "Direct link to database_host")

* Type: `str`
* Default: `None`
* Description: Specifies the hostname or IP address of the database server. This is used to construct the `DATABASE_URL` when a complete `DATABASE_URL` is not explicitly defined.
* Persistence: No

#### `DATABASE_PORT`[​](#database_port "Direct link to database_port")

* Type: `int`
* Default: `None`
* Description: Specifies the port number of the database server. This is used to construct the `DATABASE_URL` when a complete `DATABASE_URL` is not explicitly defined.
* Persistence: No

#### `DATABASE_NAME`[​](#database_name "Direct link to database_name")

* Type: `str`
* Default: `None`
* Description: Specifies the name of the database to connect to. This is used to construct the `DATABASE_URL` when a complete `DATABASE_URL` is not explicitly defined.
* Persistence: No

info

When `DATABASE_URL` is not explicitly set, Open WebUI will attempt to construct it using a combination of `DATABASE_TYPE`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`, and `DATABASE_NAME`. For this automatic construction to occur, **all** of these individual parameters must be provided. If any are missing, the default `DATABASE_URL` (SQLite file) or any explicitly set `DATABASE_URL` will be used instead.

### Encrypted SQLite with SQLCipher[​](#encrypted-sqlite-with-sqlcipher "Direct link to Encrypted SQLite with SQLCipher")

For enhanced security, Open WebUI supports at-rest encryption for its primary SQLite database using SQLCipher. This is recommended for deployments handling sensitive data where using a larger database like PostgreSQL is not needed.

To enable encryption, you must configure two environment variables:

1. Set `DATABASE_TYPE="sqlite+sqlcipher"`.
2. Set `DATABASE_PASSWORD="your-secure-password"`.

When these are set and a full `DATABASE_URL` is **not** explicitly defined, Open WebUI will automatically create and use an encrypted database file at `./data/webui.db`.

danger

* The **`DATABASE_PASSWORD`** environment variable is **required** when using `sqlite+sqlcipher`.
* The **`DATABASE_TYPE`** variable tells Open WebUI which connection logic to use. Setting it to `sqlite+sqlcipher` activates the encryption feature.

Ensure the database password is kept secure, as it is needed to decrypt and access all application data.

#### `DATABASE_SCHEMA`[​](#database_schema "Direct link to database_schema")

* Type: `str`
* Default: `None`
* Description: Specifies the database schema to connect to.

#### `DATABASE_POOL_SIZE`[​](#database_pool_size "Direct link to database_pool_size")

* Type: `int`
* Default: `None`
* Description: Specifies the pooling strategy and size of the database pool. By default SQLAlchemy will automatically chose the proper pooling strategy for the selected database connection. A value of `0` disables pooling. A value larger `0` will set the pooling strategy to `QueuePool` and the pool size accordingly.

#### `DATABASE_POOL_MAX_OVERFLOW`[​](#database_pool_max_overflow "Direct link to database_pool_max_overflow")

* Type: `int`
* Default: `0`
* Description: Specifies the database pool max overflow.

info

More information about this setting can be found [here](https://docs.sqlalchemy.org/en/20/core/pooling.html#sqlalchemy.pool.QueuePool.params.max_overflow).

#### `DATABASE_POOL_TIMEOUT`[​](#database_pool_timeout "Direct link to database_pool_timeout")

* Type: `int`
* Default: `30`
* Description: Specifies the database pool timeout in seconds to get a connection.

info

More information about this setting can be found [here](https://docs.sqlalchemy.org/en/20/core/pooling.html#sqlalchemy.pool.QueuePool.params.timeout).

#### `DATABASE_POOL_RECYCLE`[​](#database_pool_recycle "Direct link to database_pool_recycle")

* Type: `int`
* Default: `3600`
* Description: Specifies the database pool recycle time in seconds.

info

More information about this setting can be found [here](https://docs.sqlalchemy.org/en/20/core/pooling.html#setting-pool-recycle).

#### `DATABASE_ENABLE_SQLITE_WAL`[​](#database_enable_sqlite_wal "Direct link to database_enable_sqlite_wal")

* Type: `bool`
* Default: `False`
* Description: Enables or disables SQLite WAL (Write-Ahead Logging) mode. When enabled, SQLite transactions can be managed more efficiently, allowing multiple readers and one writer concurrently, which can improve database performance, especially under high concurrency. **This setting only applies to SQLite databases.**

#### `DATABASE_DEDUPLICATE_INTERVAL`[​](#database_deduplicate_interval "Direct link to database_deduplicate_interval")

* Type: `float`
* Default: `0.0`
* Description: Sets a time interval in seconds during which certain database write operations (e.g., updating a user's `last_active_at` timestamp) will be deduplicated. If a write operation is attempted within this interval for the same entity, it will be skipped. A value of `0.0` disables deduplication. Enabling this can reduce write conflicts and improve performance, but may result in less real-time accuracy for the affected fields.

### Redis[​](#redis "Direct link to Redis")

#### `REDIS_URL`[​](#redis_url "Direct link to redis_url")

* Type: `str`
* Description: Specifies the URL of the Redis instance or cluster host for storing application state.
* Examples:
  + `redis://localhost:6379/0`
  + `rediss://:password@localhost:6379/0` *(with password and TLS)*
  + `rediss://redis-cluster.redis.svc.cluster.local:6379/0 ?ssl_cert_reqs=required&ssl_certfile=/tls/redis/tls.crt &ssl_keyfile=/tls/redis/tls.key&ssl_ca_certs=/tls/redis/ca.crt` *(with mTLS)*

info

When deploying Open WebUI in a multi-node/worker cluster with a load balancer, you must ensure that the REDIS\_URL value is set. Without it, session, persistency and consistency issues in the app state will occur as the workers would be unable to communicate.

#### `REDIS_SENTINEL_HOSTS`[​](#redis_sentinel_hosts "Direct link to redis_sentinel_hosts")

* Type: `str`
* Description: Comma-separated list of Redis Sentinels for app state. If specified, the "hostname" in `REDIS_URL` will be interpreted as the Sentinel service name.

#### `REDIS_SENTINEL_PORT`[​](#redis_sentinel_port "Direct link to redis_sentinel_port")

* Type: `int`
* Default: `26379`
* Description: Sentinel port for app state Redis.

#### `REDIS_CLUSTER`[​](#redis_cluster "Direct link to redis_cluster")

* Type: `bool`
* Default: `False`
* Description: Connect to a Redis Cluster instead of a single instance or using Redis Sentinels. If `True`, `REDIS_URL` must also be defined.

info

This option has no effect if `REDIS_SENTINEL_HOSTS` is defined.

#### `REDIS_KEY_PREFIX`[​](#redis_key_prefix "Direct link to redis_key_prefix")

* Type: `str`
* Default: `open-webui`
* Description: Customizes the Redis key prefix used for storing configuration values. This allows multiple Open WebUI instances to share the same Redis instance without key conflicts. When operating in Redis cluster mode, the prefix is formatted as `{prefix}:` (e.g., `{open-webui}:config:*`) to enable multi-key operations on configuration keys within the same hash slot.

#### `ENABLE_WEBSOCKET_SUPPORT`[​](#enable_websocket_support "Direct link to enable_websocket_support")

* Type: `bool`
* Default: `True`
* Description: Enables websocket support in Open WebUI.

info

When deploying Open WebUI in a multi-node/worker cluster with a load balancer, you must ensure that the ENABLE\_WEBSOCKET\_SUPPORT value is set. Without it, websocket consistency and persistency issues will occur.

#### `WEBSOCKET_MANAGER`[​](#websocket_manager "Direct link to websocket_manager")

* Type: `str`
* Default: `redis`
* Description: Specifies the websocket manager to use (in this case, Redis).

info

When deploying Open WebUI in a multi-node/worker cluster with a load balancer, you must ensure that the WEBSOCKET\_MANAGER value is set and a key-value NoSQL database like Redis is used. Without it, websocket consistency and persistency issues will occur.

#### `WEBSOCKET_REDIS_URL`[​](#websocket_redis_url "Direct link to websocket_redis_url")

* Type: `str`
* Default: `${REDIS_URL}`
* Description: Specifies the URL of the Redis instance or cluster host for websocket communication. It is distinct from `REDIS_URL` and in practice, it is recommended to set both.

info

When deploying Open WebUI in a multi-node/worker cluster with a load balancer, you must ensure that the WEBSOCKET\_REDIS\_URL value is set and a key-value NoSQL database like Redis is used. Without it, websocket consistency and persistency issues will occur.

#### `WEBSOCKET_SENTINEL_HOSTS`[​](#websocket_sentinel_hosts "Direct link to websocket_sentinel_hosts")

* Type: `str`
* Description: Comma-separated list of Redis Sentinels for websocket. If specified, the "hostname" in `WEBSOCKET_REDIS_URL` will be interpreted as the Sentinel service name.

#### `WEBSOCKET_SENTINEL_PORT`[​](#websocket_sentinel_port "Direct link to websocket_sentinel_port")

* Type: `int`
* Default: `26379`
* Description: Sentinel port for websocket Redis.

#### `WEBSOCKET_REDIS_CLUSTER`[​](#websocket_redis_cluster "Direct link to websocket_redis_cluster")

* Type: `bool`
* Default: `${REDIS_CLUSTER}`
* Description: Specifies that websocket should communicate with a Redis Cluster instead of a single instance or using Redis Sentinels. If `True`, `WEBSOCKET_REDIS_URL` and/or `REDIS_URL` must also be defined.

info

This option has no effect if `WEBSOCKET_SENTINEL_HOSTS` is defined.

#### `ENABLE_STAR_SESSIONS_MIDDLEWARE`[​](#enable_star_sessions_middleware "Direct link to enable_star_sessions_middleware")

* Type: `bool`
* Default: `False`
* Description: Enables Redis-based session storage for OAuth authentication flows using the StarSessions middleware. When enabled, OAuth session state is stored in Redis instead of browser cookies, which can help resolve CSRF errors in multi-replica deployments where session data needs to be shared across pods.
* Persistence: This is an experimental environment variable.

warning

**Experimental Feature - Known Limitations**

This feature is currently experimental and has known compatibility issues:

* **Redis Sentinel and Redis Cluster configurations are not yet supported** and will cause authentication failures if this setting is enabled
* Only basic Redis setups (single instance or standard Redis URL) are currently compatible
* This feature was introduced to address CSRF "mismatching\_state" errors in multi-pod deployments, but it is disabled by default due to ongoing compatibility work

**Only enable this setting if:**

* You are experiencing persistent CSRF errors during OAuth login in a multi-replica deployment
* You are using a basic Redis setup (not Sentinel or Cluster)
* You have confirmed that `WEBUI_SECRET_KEY` is set to the same value across all replicas
* You understand this is an experimental feature that may change or be removed in future releases

For most deployments, the default browser cookie-based session management is sufficient and more stable.

### Uvicorn Settings[​](#uvicorn-settings "Direct link to Uvicorn Settings")

#### `UVICORN_WORKERS`[​](#uvicorn_workers "Direct link to uvicorn_workers")

* Type: `int`
* Default: `1`
* Description: Controls the number of worker processes that Uvicorn spawns to handle requests. Each worker runs its own instance of the application in a separate process.

info

When deploying in orchestrated environments like Kubernetes or using Helm charts, it's recommended to keep UVICORN\_WORKERS set to 1. Container orchestration platforms already provide their own scaling mechanisms through pod replication, and using multiple workers inside containers can lead to resource allocation issues and complicate horizontal scaling strategies.

If you use UVICORN\_WORKERS, you also need to ensure that related environment variables for scalable multi-instance setups are set accordingly.

### Cache Settings[​](#cache-settings "Direct link to Cache Settings")

#### `CACHE_CONTROL`[​](#cache_control "Direct link to cache_control")

* Type: `str`
* Default: Not set (no Cache-Control header added)
* Description: Sets the Cache-Control header for all HTTP responses. Supports standard directives like `public`, `private`, `no-cache`, `no-store`, `must-revalidate`, `max-age=seconds`, etc. If an invalid value is provided, defaults to `"no-store, max-age=0"` (no caching).
* Examples:
  + `"private, max-age=86400"` - Cache privately for 24 hours
  + `"public, max-age=3600, must-revalidate"` - Cache publicly for 1 hour, then revalidate
  + `"no-cache, no-store, must-revalidate"` - Never cache

### Proxy Settings[​](#proxy-settings "Direct link to Proxy Settings")

Open WebUI supports using proxies for HTTP and HTTPS retrievals. To specify proxy settings,
Open WebUI uses the following environment variables:

#### `http_proxy`[​](#http_proxy "Direct link to http_proxy")

* Type: `str`
* Description: Sets the URL for the HTTP proxy.

#### `https_proxy`[​](#https_proxy "Direct link to https_proxy")

* Type: `str`
* Description: Sets the URL for the HTTPS proxy.

#### `no_proxy`[​](#no_proxy "Direct link to no_proxy")

* Type: `str`
* Description: Lists domain extensions (or IP addresses) for which the proxy should not be used,
  separated by commas. For example, setting no\_proxy to '.mit.edu' ensures that the proxy is
  bypassed when accessing documents from MIT.

### Install Required Python Packages[​](#install-required-python-packages "Direct link to Install Required Python Packages")

Open WebUI provides environment variables to customize the pip installation process. Below are the environment variables used by Open WebUI for adjusting package installation behavior:

#### `PIP_OPTIONS`[​](#pip_options "Direct link to pip_options")

* Type: `str`
* Description: Specifies additional command-line options that pip should use when installing packages. For example, you can include flags such as `--upgrade`, `--user`, or `--no-cache-dir` to control the installation process.

#### `PIP_PACKAGE_INDEX_OPTIONS`[​](#pip_package_index_options "Direct link to pip_package_index_options")

* Type: `str`
* Description: Defines custom package index behavior for pip. This can include specifying additional or alternate index URLs (e.g., `--extra-index-url`), authentication credentials, or other parameters to manage how packages are retrieved from different locations.

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/getting-started/env-configuration.mdx)

[Previous

🔭 OpenTelemetry](/getting-started/advanced-topics/monitoring/otel)[Next

🔄 Updating Open WebUI](/getting-started/updating)

* [Overview](#overview)
  + [Important Note on `PersistentConfig` Environment Variables](#important-note-on-persistentconfig-environment-variables)
* [App/Backend](#appbackend)
  + [General](#general)
  + [AIOHTTP Client](#aiohttp-client)
  + [Directories](#directories)
  + [Ollama](#ollama)
  + [OpenAI](#openai)
  + [Tasks](#tasks)
  + [Code Execution](#code-execution)
  + [Code Interpreter](#code-interpreter)
  + [Direct Connections (OpenAPI/MCPO Tool Servers)](#direct-connections-openapimcpo-tool-servers)
  + [Autocomplete](#autocomplete)
  + [Evaluation Arena Model](#evaluation-arena-model)
  + [Tags Generation](#tags-generation)
  + [API Key Endpoint Restrictions](#api-key-endpoint-restrictions)
* [Security Variables](#security-variables)
* [Vector Database](#vector-database)
  + [ChromaDB](#chromadb)
  + [Elasticsearch](#elasticsearch)
  + [Milvus](#milvus)
  + [OpenSearch](#opensearch)
  + [PGVector](#pgvector)
  + [Qdrant](#qdrant)
  + [Pinecone](#pinecone)
  + [Oracle 23ai Vector Search (oracle23ai)](#oracle-23ai-vector-search-oracle23ai)
  + [S3 Vector Bucket](#s3-vector-bucket)
* [RAG Content Extraction Engine](#rag-content-extraction-engine)
* [Retrieval Augmented Generation (RAG)](#retrieval-augmented-generation-rag)
  + [Core Configuration](#core-configuration)
  + [Document Processing](#document-processing)
  + [Embedding Engine Configuration](#embedding-engine-configuration)
  + [Reranking](#reranking)
  + [Query Generation](#query-generation)
  + [Document Intelligence (Azure)](#document-intelligence-azure)
  + [Advanced Settings](#advanced-settings)
  + [Google Drive](#google-drive)
  + [OneDrive](#onedrive)
* [Web Search](#web-search)
  + [Web Loader Configuration](#web-loader-configuration)
  + [YouTube Loader](#youtube-loader)
* [Audio](#audio)
  + [Whisper Speech-to-Text (Local)](#whisper-speech-to-text-local)
  + [Speech-to-Text (OpenAI)](#speech-to-text-openai)
  + [Speech-to-Text (Azure)](#speech-to-text-azure)
  + [Speech-to-Text (Deepgram)](#speech-to-text-deepgram)
  + [Text-to-Speech](#text-to-speech)
  + [Azure Text-to-Speech](#azure-text-to-speech)
  + [OpenAI Text-to-Speech](#openai-text-to-speech)
* [Image Generation](#image-generation)
  + [AUTOMATIC1111](#automatic1111)
  + [ComfyUI](#comfyui)
  + [Gemini](#gemini)
  + [OpenAI DALL-E](#openai-dall-e)
* [OAuth](#oauth)
  + [Google](#google)
  + [Microsoft](#microsoft)
  + [GitHub](#github)
  + [Feishu](#feishu)
  + [OpenID (OIDC)](#openid-oidc)
* [LDAP](#ldap)
* [SCIM](#scim)
* [User Permissions](#user-permissions)
  + [Chat Permissions](#chat-permissions)
  + [Feature Permissions](#feature-permissions)
  + [Workspace Permissions](#workspace-permissions)
* [Misc Environment Variables](#misc-environment-variables)
  + [Cloud Storage](#cloud-storage)
  + [OpenTelemetry Configuration](#opentelemetry-configuration)
  + [Database Pool](#database-pool)
  + [Encrypted SQLite with SQLCipher](#encrypted-sqlite-with-sqlcipher)
  + [Redis](#redis)
  + [Uvicorn Settings](#uvicorn-settings)
  + [Cache Settings](#cache-settings)
  + [Proxy Settings](#proxy-settings)
  + [Install Required Python Packages](#install-required-python-packages)

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
- #overview
- https://github.com/open-webui/open-webui/releases/tag/v0.6.32
- #important-note-on-persistentconfig-environment-variables
- #appbackend
- https://docs.openwebui.com/getting-started/advanced-topics/logging
- #general
- #webui_url
- #enable_signup
- #enable_signup_password_confirmation
- #enable_login_form
- https://docs.openwebui.com/getting-started/env-configuration/#enable_oauth_signup
- #default_locale
- #default_models
- #default_user_role
- #pending_user_overlay_title
- #pending_user_overlay_content
- #enable_channels
- #webhook_url
- #enable_admin_export
- #enable_admin_chat_access
- #bypass_admin_access_control
- #enable_user_webhooks
- #response_watermark
- #thread_pool_size
- #models_cache_ttl
- #show_admin_details
- #admin_email
- #env
- #enable_persistent_config
- #custom_name
- #webui_name
- #port
- #enable_realtime_chat_save
- #chat_response_stream_delta_chunk_size
- #bypass_model_access_control
- #webui_build_hash
- #webui_banners
- #use_cuda_docker
- #external_pwa_manifest_url
- https://path/to/manifest.webmanifest
- #enable_title_generation
- #license_key
- #ssl_assert_fingerprint
- #default_prompt_suggestions
- #aiohttp-client
- #aiohttp_client_timeout
- #aiohttp_client_timeout_model_list
- #aiohttp_client_timeout_openai_model_list
- #directories
- #data_dir
- #fonts_dir
- #frontend_build_dir
- #static_dir
- #ollama
- #enable_ollama_api
- #ollama_base_url
- #ollama_base_urls
- #ollama_base_url
- #ollama_base_url
- #use_ollama_docker
- #k8s_flag
- #ollama_base_url
- #openai
- #enable_openai_api
- #openai_api_base_url
- #openai_api_base_urls
- #openai_api_key
- #openai_api_keys
- #tasks
- #task_model
- #task_model_external
- #title_generation_prompt_template
- #enable_follow_up_generation
- #follow_up_generation_prompt_template
- #tools_function_calling_prompt_template
- #code-execution
- #enable_code_execution
- #code_execution_engine
- #code_execution_jupyter_url
- #code_execution_jupyter_auth
- #code_execution_jupyter_auth_token
- #code_execution_jupyter_auth_password
- #code_execution_jupyter_timeout
- #code-interpreter
- #enable_code_interpreter
- #code_interpreter_engine
- #code_interpreter_blacklisted_modules
- #code_interpreter_prompt_template
- #code_interpreter_jupyter_url
- #code_interpreter_jupyter_auth
- #code_interpreter_jupyter_auth_token
- #code_interpreter_jupyter_auth_password
- #code_interpreter_jupyter_timeout
- #direct-connections-openapimcpo-tool-servers
- #enable_direct_connections
- #tool_server_connections
- #autocomplete
- #enable_autocomplete_generation
- #autocomplete_generation_input_max_length
- #autocomplete_generation_prompt_template
- #evaluation-arena-model
- #enable_evaluation_arena_models
- #enable_message_rating
- #enable_community_sharing
- #tags-generation
- #enable_tags_generation
- #tags_generation_prompt_template
- #api-key-endpoint-restrictions
- #enable_api_key
- #enable_api_key_endpoint_restrictions
- #api_key_allowed_endpoints
- #jwt_expires_in
- #security-variables
- #enable_forward_user_info_headers
- #enable_web_loader_ssl_verification
- #webui_session_cookie_same_site
- #webui_session_cookie_secure
- #webui_auth_cookie_same_site
- #webui_auth_cookie_secure
- #webui_auth
- #webui_secret_key
- #enable_version_update_check
- #offline_mode
- /tutorials/offline-mode
- #reset_config_on_start
- #safe_mode
- #cors_allow_origin
- #cors_allow_custom_scheme
- #rag_embedding_model_trust_remote_code
- #rag_reranking_model_trust_remote_code
- #rag_embedding_model_auto_update
- #rag_reranking_model_auto_update
- #vector-database
- #vector_db
- #chromadb
- #chroma_tenant
- #chroma_database
- #chroma_http_host
- #chroma_http_port
- #chroma_http_headers
- #chroma_http_ssl
- #chroma_client_auth_provider
- #chroma_client_auth_credentials
- #elasticsearch
- #elasticsearch_api_key
- #elasticsearch_ca_certs
- #elasticsearch_cloud_id
- #elasticsearch_index_prefix
- #elasticsearch_password
- #elasticsearch_url
- #elasticsearch_username
- #milvus
- #milvus_uri
- #milvus_db
- #milvus_token
- #milvus_index_type
- #milvus_metric_type
- #milvus_hnsw_m
- #milvus_hnsw_efconstruction
- #milvus_ivf_flat_nlist
- #milvus_diskann_max_degree
- #milvus_diskann_search_list_size
- #enable_milvus_multitenancy_mode
- #milvus_collection_prefix
- #opensearch
- #opensearch_cert_verify
- #opensearch_password
- #opensearch_ssl
- #opensearch_uri
- #opensearch_username
- #pgvector
- #pgvector_db_url
- #pgvector_initialize_max_vector_length
- #pgvector_create_extension
- #qdrant
- #qdrant_api_key
- #qdrant_uri
- #qdrant_on_disk
- #qdrant_prefer_grpc
- https://grpc.github.io/grpc/core/md_doc_environment_variables.html
- #qdrant_grpc_port
- #qdrant_timeout
- #qdrant_hnsw_m
- #enable_qdrant_multitenancy_mode
- #qdrant_collection_prefix
- #pinecone
- #pinecone_api_key
- #pinecone_environment
- #pinecone_index_name
- #pinecone_dimension
- #pinecone_metric
- #pinecone_cloud
- #oracle-23ai-vector-search-oracle23ai
- #oracle_db_use_wallet
- #oracle_db_user
- #oracle_db_password
- #oracle_db_dsn
- #oracle_wallet_dir
- #oracle_wallet_password
- #oracle_vector_length
- #oracle_db_pool_min
- #oracle_db_pool_max
- #oracle_db_pool_increment
- #s3-vector-bucket
- #s3_vector_bucket_name
- #s3_vector_region
- #rag-content-extraction-engine
- #content_extraction_engine
- #mistral_ocr_api_key
- #external_document_loader_url
- #external_document_loader_api_key
- #tika_server_url
- #docling_server_url
- #docling_ocr_engine
- #docling_ocr_lang
- #retrieval-augmented-generation-rag
- #core-configuration
- #rag_embedding_engine
- #rag_embedding_model
- #rag_top_k
- #rag_top_k_reranker
- #rag_relevance_threshold
- #enable_rag_hybrid_search
- #rag_hybrid_bm25_weight
- #rag_template
- #document-processing
- #chunk_size
- #chunk_overlap
- #rag_text_splitter
- #tiktoken_cache_dir
- #tiktoken_encoding_name
- #pdf_extract_images
- #rag_file_max_size
- #rag_file_max_count
- #rag_allowed_file_extensions
- #embedding-engine-configuration
- #general-embedding-settings
- #rag_embedding_batch_size
- #rag_embedding_content_prefix
- #rag_embedding_prefix_field_name
- #rag_embedding_query_prefix
- #openai-embeddings
- #rag_openai_api_base_url
- #rag_openai_api_key
- #rag_embedding_openai_batch_size
- #azure-openai-embeddings
- #rag_azure_openai_base_url
- #rag_azure_openai_api_key
- #rag_azure_openai_api_version
- #ollama-embeddings
- #rag_ollama_base_url
- #rag_ollama_api_key
- #reranking
- #rag_reranking_model
- #query-generation
- #enable_retrieval_query_generation
- #query_generation_prompt_template
- #document-intelligence-azure
- #document_intelligence_endpoint
- #document_intelligence_key
- #advanced-settings
- #bypass_embedding_and_retrieval
- #rag_full_context
- #enable_rag_local_web_fetch
- #google-drive
- #enable_google_drive_integration
- #google_drive_client_id
- #google_drive_api_key
- #onedrive
- https://docs.openwebui.com/tutorials/integrations/onedrive-sharepoint/
- #enable_onedrive_integration
- #enable_onedrive_personal
- #enable_onedrive_business
- #onedrive_client_id
- #onedrive_client_id_personal
- #onedrive_client_id_business
- #onedrive_sharepoint_url
- #onedrive_sharepoint_tenant_id
- #web-search
- #enable_web_search
- #enable_search_query_generation
- #web_search_trust_env
- #web_search_result_count
- #web_loader_concurrent_requests
- #web_search_engine
- https://github.com/searxng/searxng
- https://programmablesearchengine.google.com/about/
- https://brave.com/search/api/
- https://www.kagi.com/
- https://www.mojeek.com/
- https://serpstack.com/
- https://serper.dev/
- https://serply.io/
- https://www.searchapi.io/
- https://serpapi.com/
- https://duckduckgo.com/
- https://tavily.com/
- https://jina.ai/
- https://www.bing.com/
- https://exa.ai/
- https://www.perplexity.ai/
- https://www.perplexity.ai/
- https://www.sogou.com/
- https://ollama.com/blog/web-search
- #bypass_web_search_embedding_and_retrieval
- #searxng_query_url
- https://docs.searxng.org/dev/search_api.html
- #google_pse_api_key
- #google_pse_engine_id
- #brave_search_api_key
- #kagi_search_api_key
- #mojeek_search_api_key
- #serpstack_api_key
- #serpstack_https
- #serper_api_key
- #serply_api_key
- #searchapi_api_key
- #searchapi_engine
- #tavily_api_key
- #jina_api_key
- #bing_search_v7_endpoint
- #bing_search_v7_subscription_key
- #bocha_search_api_key
- #exa_api_key
- #serpapi_api_key
- #serpapi_engine
- #sougou_api_sid
- #sougou_api_sk
- #ollama_cloud_web_search_api_key
- #tavily_extract_depth
- #web-loader-configuration
- #web_loader_engine
- #playwright_ws_url
- #firecrawl_api_base_url
- #firecrawl_api_key
- #perplexity_api_key
- #playwright_timeout
- #youtube-loader
- #youtube_loader_proxy_url
- #youtube_loader_language
- #audio
- #whisper-speech-to-text-local
- #whisper_model
- #whisper_model_dir
- #whisper_vad_filter
- #whisper_model_auto_update
- #whisper_language
- #speech-to-text-openai
- #audio_stt_engine
- #audio_stt_model
- #audio_stt_openai_api_base_url
- #audio_stt_openai_api_key
- #speech-to-text-azure
- #audio_stt_azure_api_key
- #audio_stt_azure_region
- #audio_stt_azure_locales
- #speech-to-text-deepgram
- #deepgram_api_key
- #text-to-speech
- #audio_tts_api_key
- #audio_tts_engine
- #audio_tts_model
- #audio_tts_voice
- #audio_tts_split_on
- #azure-text-to-speech
- #audio_tts_azure_speech_region
- #audio_tts_azure_speech_output_format
- #openai-text-to-speech
- #audio_tts_openai_api_base_url
- #audio_tts_openai_api_key
- #image-generation
- #image_generation_engine
- #enable_image_generation
- #enable_image_prompt_generation
- #image_prompt_generation_prompt_template
- #image_size
- #image_steps
- #image_generation_model
- #automatic1111
- #automatic1111_base_url
- #automatic1111_api_auth
- #automatic1111_cfg_scale
- #automatic1111_sampler
- #automatic1111_scheduler
- #comfyui
- #comfyui_base_url
- #comfyui_api_key
- #comfyui_workflow
- #gemini
- #gemini_api_base_url
- #gemini_api_key
- #images_gemini_api_base_url
- #images_gemini_api_key
- #openai-dall-e
- #images_openai_api_base_url
- #images_openai_api_version
- #images_openai_api_key
- #oauth
- #enable_oauth_signup
- #enable_oauth_persistent_config
- #oauth_sub_claim
- #oauth_merge_accounts_by_email
- #enable_oauth_without_email
- #oauth_update_picture_on_login
- #enable_oauth_id_token_cookie
- #oauth_client_info_encryption_key
- #oauth_session_token_encryption_key
- #webui_auth_trusted_email_header
- /features/auth/sso
- #webui_auth_trusted_name_header
- /features/auth/sso
- #webui_auth_trusted_groups_header
- /features/auth/sso
- #google
- https://support.google.com/cloud/answer/6158849?hl=en
- #google_client_id
- #google_client_secret
- #google_oauth_scope
- #google_redirect_uri
- #microsoft
- https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
- #microsoft_client_id
- #microsoft_client_secret
- #microsoft_client_tenant_id
- #microsoft_oauth_scope
- #microsoft_redirect_uri
- #github
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- #github_client_id
- #github_client_secret
- #github_client_scope
- #github_client_redirect_uri
- #feishu
- https://open.feishu.cn/document/sso/web-application-sso/login-overview
- #feishu_client_id
- #feishu_client_secret
- #feishu_client_scope
- #feishu_client_redirect_uri
- #openid-oidc
- #oauth_client_id
- #oauth_client_secret
- #openid_provider_url
- #openid_redirect_uri
- #oauth_scopes
- #oauth_code_challenge_method
- #oauth_provider_name
- #oauth_username_claim
- #oauth_email_claim
- #oauth_picture_claim
- #oauth_group_claim
- #enable_oauth_role_management
- #enable_oauth_group_management
- #oauth_roles_claim
- #oauth_allowed_roles
- #oauth_admin_roles
- #oauth_allowed_domains
- #ldap
- #enable_ldap
- #ldap_server_label
- #ldap_server_host
- #ldap_server_port
- #ldap_attribute_for_mail
- #ldap_attribute_for_username
- #ldap_app_dn
- #ldap_app_password
- #ldap_search_base
- #ldap_search_filter
- #ldap_search_filters
- #ldap_use_tls
- #ldap_ca_cert_file
- #ldap_validate_cert
- #ldap_ciphers
- #enable_ldap_group_management
- #enable_ldap_group_creation
- #ldap_attribute_for_groups
- #scim
- #scim_enabled
- #scim_token
- #user-permissions
- #chat-permissions
- #user_permissions_chat_controls
- #user_permissions_chat_valves
- #user_permissions_chat_system_prompt
- #user_permissions_chat_params
- #user_permissions_chat_file_upload
- #user_permissions_chat_delete
- #user_permissions_chat_edit
- #user_permissions_chat_delete_message
- #user_permissions_chat_continue_response
- #user_permissions_chat_regenerate_response
- #user_permissions_chat_rate_response
- #user_permissions_chat_stt
- #user_permissions_chat_tts
- #user_permissions_chat_call
- #user_permissions_chat_multiple_models
- #user_permissions_chat_temporary
- #user_permissions_chat_temporary_enforced
- #feature-permissions
- #user_permissions_features_direct_tool_servers
- #user_permissions_features_web_search
- #user_permissions_features_image_generation
- #user_permissions_features_code_interpreter
- #workspace-permissions
- #user_permissions_workspace_models_access
- #user_permissions_workspace_knowledge_access
- #user_permissions_workspace_prompts_access
- #user_permissions_workspace_tools_access
- #user_permissions_workspace_models_allow_public_sharing
- #user_permissions_workspace_knowledge_allow_public_sharing
- #user_permissions_workspace_prompts_allow_public_sharing
- #user_permissions_workspace_tools_allow_public_sharing
- #user_permissions_notes_allow_public_sharing
- #misc-environment-variables
- #cloud-storage
- #storage_provider
- #amazon-s3-storage
- #google-cloud-storage
- #microsoft-azure-storage
- #amazon-s3-storage
- #s3_access_key_id
- #s3_addressing_style
- #s3_bucket_name
- #s3_endpoint_url
- https://docs.aws.amazon.com/sdkref/latest/guide/feature-gen-config.html
- #s3_key_prefix
- #s3_region_name
- #s3_secret_access_key
- #s3_use_accelerate_endpoint
- #s3_enable_tagging
- #google-cloud-storage
- #google_application_credentials_json
- https://developers.google.com/workspace/guides/create-credentials#service-account
- #gcs_bucket_name
- #microsoft-azure-storage
- #azure_storage_endpoint
- #azure_storage_container_name
- #azure_storage_key
- #opentelemetry-configuration
- #enable_otel
- #enable_otel_traces
- #enable_otel_metrics
- #enable_otel_logs
- #otel_exporter_otlp_endpoint
- #otel_metrics_exporter_otlp_endpoint
- #otel_logs_exporter_otlp_endpoint
- #otel_exporter_otlp_insecure
- #otel_metrics_exporter_otlp_insecure
- #otel_logs_exporter_otlp_insecure
- #otel_service_name
- #otel_resource_attributes
- #otel_traces_sampler
- #otel_basic_auth_username
- #otel_basic_auth_password
- #otel_metrics_basic_auth_username
- #otel_metrics_basic_auth_password
- #otel_logs_basic_auth_username
- #otel_logs_basic_auth_password
- #otel_otlp_span_exporter
- #otel_metrics_otlp_span_exporter
- #otel_logs_otlp_span_exporter
- #database-pool
- #database_url
- https://docs.sqlalchemy.org/en/20/core/engines.html#database-urls
- #database_type
- #database_user
- #database_password
- #database_host
- #database_port
- #database_name
- #encrypted-sqlite-with-sqlcipher
- #database_schema
- #database_pool_size
- #database_pool_max_overflow
- https://docs.sqlalchemy.org/en/20/core/pooling.html#sqlalchemy.pool.QueuePool.params.max_overflow
- #database_pool_timeout
- https://docs.sqlalchemy.org/en/20/core/pooling.html#sqlalchemy.pool.QueuePool.params.timeout
- #database_pool_recycle
- https://docs.sqlalchemy.org/en/20/core/pooling.html#setting-pool-recycle
- #database_enable_sqlite_wal
- #database_deduplicate_interval
- #redis
- #redis_url
- #redis_sentinel_hosts
- #redis_sentinel_port
- #redis_cluster
- #redis_key_prefix
- #enable_websocket_support
- #websocket_manager
- #websocket_redis_url
- #websocket_sentinel_hosts
- #websocket_sentinel_port
- #websocket_redis_cluster
- #enable_star_sessions_middleware
- #uvicorn-settings
- #uvicorn_workers
- #cache-settings
- #cache_control
- #proxy-settings
- #http_proxy
- #https_proxy
- #no_proxy
- #install-required-python-packages
- #pip_options
- #pip_package_index_options
- https://github.com/open-webui/docs/blob/main/docs/getting-started/env-configuration.mdx
- /getting-started/advanced-topics/monitoring/otel
- /getting-started/updating
- #overview
- #important-note-on-persistentconfig-environment-variables
- #appbackend
- #general
- #aiohttp-client
- #directories
- #ollama
- #openai
- #tasks
- #code-execution
- #code-interpreter
- #direct-connections-openapimcpo-tool-servers
- #autocomplete
- #evaluation-arena-model
- #tags-generation
- #api-key-endpoint-restrictions
- #security-variables
- #vector-database
- #chromadb
- #elasticsearch
- #milvus
- #opensearch
- #pgvector
- #qdrant
- #pinecone
- #oracle-23ai-vector-search-oracle23ai
- #s3-vector-bucket
- #rag-content-extraction-engine
- #retrieval-augmented-generation-rag
- #core-configuration
- #document-processing
- #embedding-engine-configuration
- #reranking
- #query-generation
- #document-intelligence-azure
- #advanced-settings
- #google-drive
- #onedrive
- #web-search
- #web-loader-configuration
- #youtube-loader
- #audio
- #whisper-speech-to-text-local
- #speech-to-text-openai
- #speech-to-text-azure
- #speech-to-text-deepgram
- #text-to-speech
- #azure-text-to-speech
- #openai-text-to-speech
- #image-generation
- #automatic1111
- #comfyui
- #gemini
- #openai-dall-e
- #oauth
- #google
- #microsoft
- #github
- #feishu
- #openid-oidc
- #ldap
- #scim
- #user-permissions
- #chat-permissions
- #feature-permissions
- #workspace-permissions
- #misc-environment-variables
- #cloud-storage
- #opentelemetry-configuration
- #database-pool
- #encrypted-sqlite-with-sqlcipher
- #redis
- #uvicorn-settings
- #cache-settings
- #proxy-settings
- #install-required-python-packages
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
