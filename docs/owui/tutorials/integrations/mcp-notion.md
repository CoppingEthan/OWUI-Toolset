# https://docs.openwebui.com/tutorials/integrations/mcp-notion

  * [](/)
  * [🎓 Tutorials](/category/-tutorials)
  * [Integrations](/category/integrations)
  * Notion MCP Integration



On this page

# Notion (MCP)

This guide enables Open WebUI to interact with your Notion workspace—searching pages, reading content, creating docs, and managing databases—using the **Model Context Protocol (MCP)**.

Why this Integration?

This integration utilizes the official Notion MCP server, which specializes in **automatic Markdown conversion**. When the AI reads a Notion page, it receives clean, structured Markdown rather than raw JSON blocks, significantly improving the model's ability to understand and summarize your notes.

Community Contribution

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the [contributing tutorial](/tutorials/tips/contributing-tutorial/).

## Method 1: Streamable HTTP (Recommended)​

This method connects directly to Notion's hosted MCP endpoint (`https://mcp.notion.com/mcp`). It utilizes standard OAuth and is **natively supported** by Open WebUI without extra containers.

Preferred Method

**Streamable HTTP** is preferred for its simplicity and enhanced security. It handles authentication via Notion's official OAuth flow, meaning you do not need to manually manage secrets or integration tokens.

Critical for OAuth Persistence

You **MUST** set the `WEBUI_SECRET_KEY` environment variable in your Docker setup to a persistent value. If you do not, your Notion OAuth session will become invalid every time you restart the container, forcing you to re-authenticate repeatedly.

### 1\. Configure Tool​

You can automatically prefill the connection settings by importing the JSON configuration below.

  1. Navigate to **Admin Panel > Settings > External Tools**.
  2. Click the **+** (Plus) button to add a new tool.
  3. Click **Import** (top right of the modal).
  4. Paste the following JSON snippet:



Notion Remote MCP Configuration
    
    
    [  
      {  
        "type": "mcp",  
        "url": "https://mcp.notion.com/mcp",  
        "spec_type": "url",  
        "spec": "",  
        "path": "openapi.json",  
        "auth_type": "oauth_2.1",  
        "key": "",  
        "info": {  
          "id": "ntn",  
          "name": "Notion",  
          "description": "A note-taking and collaboration platform that allows users to create, organize, and share notes, databases, and other content."  
        }  
      }  
    ]  
    

  5. **Register:** Click the **Register Client** button (next to the Auth dropdown).
  6. Click **Save**.



![Open WebUI Tool Config: Shows the External Tools modal with the JSON imported and Register Client button highlighted.](/assets/images/notion-setup-step5-e779b18b664c718224f1316207f2881d.png)

### 2\. Authenticate & Grant Access​

Once the tool is added, you must authenticate to link your specific workspace.

  1. Open any chat window.
  2. Click the **+** (Plus) button in the chat input bar.
  3. Navigate to **Integrations > Tools**.
  4. Toggle the **Notion** switch to **ON**.



![Chat Interface Toggle: Shows the chat input bar with the &#39;+&#39; menu open, &#39;Integrations&#39; selected, and the &#39;Notion&#39; tool toggled ON.](/assets/images/notion-setup-step6-88a0da8103f38f94bcfe25473bf71e0f.png)

  5. **Authorize:** You will be redirected to a "Connect with Notion MCP" screen.
     * Ensure the correct **Workspace** is selected in the dropdown.
     * Click **Continue**.



Security: Frequent Re-authentication

For security reasons, Notion's OAuth session may expire after a period of inactivity or if you restart your Open WebUI instance. If this happens, you will see a `Failed to connect to MCP server 'ntn'` error.

This is **intended behavior** by Notion to keep your workspace secure. To refresh your session, revisit the steps above to complete the "Connect with Notion MCP" authorization flow again.

![Notion OAuth Screen: Shows the &#39;Connect with Notion MCP&#39; authorization page with the workspace dropdown selected.](/assets/images/notion-setup-step7-ca6534f8e6b1d550ef5ca352dddfe224.png)

* * *

## Method 2: Self-Hosted via MCPO (Advanced)​

This method is for advanced users who prefer to run the MCP server locally within their own infrastructure using **MCPO**. Unlike Streamable HTTP, this method requires you to manually manage your own credentials.

Direct local execution (stdio) of MCP servers is not natively supported in Open WebUI. To run the Notion MCP server locally (using Docker or Node.js) within your infrastructure, you must use **MCPO** to bridge the connection.

Prerequisites

To use this method, you must first create an internal integration to obtain a **Secret Key**. Please complete the **Creating an Internal Integration** section below before proceeding with the configuration steps here.

### 1\. Configure MCPO​

Follow the installation instructions in the [MCPO Repository](https://github.com/open-webui/mcpo) to get it running. Configure your MCPO instance to run the Notion server using one of the runtimes below by adding the JSON block to your `mcpo-config.json` file.

**Note:** Replace `secret_YOUR_KEY_HERE` with the secret obtained from the Creating an Internal Integration section.

  * Node (npx)
  * Docker



This configuration uses the official Node.js package.

mcpo-config.json
    
    
    {  
      "mcpServers": {  
        "notion": {  
          "command": "npx",  
          "args": [  
            "-y",  
            "@notionhq/notion-mcp-server"  
          ],  
          "env": {  
            "NOTION_TOKEN": "secret_YOUR_KEY_HERE"  
          }  
        }  
      }  
    }  
    

This configuration uses the official Docker image.

mcpo-config.json
    
    
    {  
      "mcpServers": {  
        "notion": {  
          "command": "docker",  
          "args": [  
            "run",  
            "--rm",  
            "-i",  
            "-e",  
            "NOTION_TOKEN",  
            "mcp/notion"  
          ],  
          "env": {  
            "NOTION_TOKEN": "secret_YOUR_KEY_HERE"  
          }  
        }  
      }  
    }  
    

### 2\. Connect Open WebUI​

Once MCPO is running and configured with Notion:

  1. Navigate to **Admin Panel > Settings > External Tools**.
  2. Click the **+** (Plus) button.
  3. Click **Import** (top right of the modal).
  4. Paste the following JSON snippet (update the URL with your MCPO address):



MCPO Connection JSON
    
    
    [  
      {  
        "type": "openapi",  
        "url": "http://<YOUR_MCPO_IP>:<PORT>/notion",  
        "spec_type": "url",  
        "spec": "",  
        "path": "openapi.json",  
        "auth_type": "none",  
        "info": {  
          "id": "notion-local",  
          "name": "Notion (Local)",  
          "description": "Local Notion integration via MCPO"  
        }  
      }  
    ]  
    

  5. Click **Save**.



* * *

## Creating an Internal Integration​

Required for **Method 2** , creating an internal integration within Notion ensures you have the necessary credentials and permission scopes readily available.

### 1\. Create Integration​

  1. Navigate to **[Notion My Integrations](https://www.notion.so/my-integrations)**.
  2. Click the **\+ New integration** button.
  3. Fill in the required fields:
     * **Integration Name:** Give it a recognizable name (e.g., "Open WebUI MCP").
     * **Associated workspace:** Select the specific workspace you want to connect.
     * **Type:** Select **Internal**.
     * **Logo:** Uploading a logo is optional but helps identify the integration.
  4. Click **Save**.



Important: Integration Type

You **must** select **Internal** for the integration type. Public integrations require a different OAuth flow that is not covered in this guide.

![Notion Integration Setup Form: Shows the &#39;New Integration&#39; screen with Name filled, Workspace selected, and &#39;Type&#39; set to Internal.](/assets/images/notion-setup-step1-a485bf8777f3b64f0f7309947269731d.png)

### 2\. Configure Capabilities & Copy Secret​

Once saved, you will be directed to the configuration page.

  1. **Copy Secret:** Locate the **Internal Integration Secret** field. Click **Show** and copy this key. You will need it for MCPO configuration.
  2. **Review Capabilities:** Ensure the following checkboxes are selected under the "Capabilities" section:
     * ✅ **Read content**
     * ✅ **Update content**
     * ✅ **Insert content**
     * _(Optional)_ Read user information including email addresses.
  3. Click **Save changes** if you modified any capabilities.



Security: Risk to Workspace Data

While the Notion MCP server limits the scope of the API (e.g., databases cannot be deleted), exposing your workspace to LLMs carries a **non-zero risk**.

**Security-conscious users** can create a safer, **Read-Only** integration by unchecking **Update content** and **Insert content**. The AI will be able to search and answer questions based on your notes but will be physically unable to modify or create pages.

Secret Safety

Your **Internal Integration Secret** allows access to your Notion data. Treat it like a password. Do not share it or commit it to public repositories.

![Notion Capabilities Config: Shows the Internal Integration Secret revealed and the three content capability checkboxes selected.](/assets/images/notion-setup-step2-70f35b00c97b6943d8faf7a51002d4c1.png)

### 3\. Grant Page Access (Manual)​

Critical Step: Permissions

By default, your new internal integration has **zero access** to your workspace. It cannot see _any_ pages until you explicitly invite it. If you skip this step, the AI will return "Object not found" errors.

You can grant access centrally or on a per-page basis.

#### Method A: Centralized Access (Recommended)​

Still in the Notion Integration dashboard:

  1. Click the **Access** tab (next to Configuration).
  2. Click the **Edit access** button.
  3. A modal will appear allowing you to select specific pages or "Select all" top-level pages.
  4. Check the pages you want the AI to read/edit and click **Save**.



![Notion Access Tab: Shows the &#39;Manage page access&#39; modal where specific pages like &#39;To Do List&#39; are being selected for the integration.](/assets/images/notion-setup-step3-ac47219fd1a20357417e05cdbbcd5c5f.png)

#### Method B: Page-Level Access​

  1. Go to a specific Notion Page or Database you want the AI to access.
  2. Click the **...** (three dots) menu in the top right corner of the page.
  3. Select **Connections** (in the "Add connections" section).
  4. Search for your integration name (e.g., "Open WebUI MCP") and click **Connect**.
  5. _You must repeat this for every root page or database you want the AI to be able to search or edit._



![Notion Page Connection: Shows a Notion page with the &#39;...&#39; menu open, the &#39;Connect&#39; submenu active, and the integration being selected.](/assets/images/notion-setup-step4-bcb11dfde764dedd7fe1548263102401.png)

* * *

## Configuration: Always On (Optional)​

By default, users must toggle the tool **ON** in the chat menu. You can configure a specific model to have Notion access enabled by default for every conversation.

  1. Go to **Workspace > Models**.
  2. Click the **pencil icon** to edit a model.
  3. Scroll down to the **Tools** section.
  4. Check the box for **Notion**.
  5. Click **Save & Update**.



## Building a Specialized Notion Agent (Optional)​

For the most reliable experience, we recommend creating a dedicated "Notion Assistant" model. This allows you to provide a specialized **System Prompt** , a helpful **Knowledge Base** , and quick-start **Prompt Suggestions** that teaches the model how to navigate Notion's structure.

### Step 1: Create a Knowledge Base for the Agent​

First, create a knowledge base with the official Notion MCP documentation. This will help the model understand its own capabilities.

  1. **Navigate to Knowledge:** Go to **Workspace > Knowledge**.
  2. **Create New Knowledge Base:** Click the **\+ New Knowledge** button.
  3. **Fill in Details:**
     * **Name:** `Notion MCP Docs`
     * **Description:** `Official documentation for Notion's MCP tools to improve agent accuracy.`
  4. Click **Create Knowledge**.



![Create Knowledge Base Form: Shows the form with &#39;Notion MCP Docs&#39; as the name and a relevant description.](/assets/images/notion-setup-step8-60c3e38cebc3807a7ba6f5e9ef35d49d.png)

  5. **Upload Content:**
     * Save the content from the [Notion MCP Documentation](https://developers.notion.com/docs/mcp-supported-tools) as a PDF or `.txt` file.
     * Inside your new knowledge base, click the **\+ Add Content** button and upload the file you saved.



Recommended: Optimize with Jina Reader

For optimal RAG performance, we recommend converting web documentation into clean Markdown. You can use **[Jina Reader](https://github.com/jina-ai/reader)** (or the hosted `https://r.jina.ai/` API) to strip clutter and format the page specifically for LLMs.

Simply visit `https://r.jina.ai/https://developers.notion.com/docs/mcp-supported-tools`, copy the output, and save it as a `.md` file to upload.

![Knowledge Base Content View: Shows the &#39;Notion MCP Docs&#39; knowledge base with the documentation file successfully uploaded.](/assets/images/notion-setup-step9-9434c372a9960490ca8bb140e31f29d8.png)

### Step 2: Create the Custom Model​

Now, create the dedicated agent and attach the knowledge base you just made.

  1. Go to **Workspace > Models > Create a Model**.
  2. **Name:** `Notion Assistant`
  3. **Description:** `An intelligent agent that manages your Notion workspace using MCP tools to search, read, and create content.`
  4. **Base Model:** Select your preferred local LLM (e.g., Llama 3.1).
  5. **Tools:** Enable **Notion**.
  6. **System Prompt:** Paste the following optimized prompt:

Click to view Optimized System Prompt
    
    
    You are the Notion Workspace Manager, an intelligent agent connected directly to the user's Notion workspace via the Model Context Protocol (MCP). Your goal is to help the user organize, retrieve, and generate content within their personal knowledge base.  
      
    ### CRITICAL OPERATIONAL RULES:  
      
    1. **SEARCH IS MANDATORY:**  
       - You cannot interact with a page or database without its unique ID or URL.  
       - If the user refers to a page by name (e.g., "Add this to my Todo list"), you MUST first run `notion-search` to find the correct page and retrieve its ID or URL.  
       - NEVER guess a Page ID.  
       - If a search returns multiple results (e.g., two pages named "Meeting Notes"), ask the user to clarify which one to use before proceeding.  
      
    2. **READ BEFORE ANSWERING:**  
       - If the user asks a question about their data (e.g., "What is the status of Project Alpha?"), do not answer from your internal training data.  
       - First `notion_search` for the relevant page, then `notion-read-page` to get the content, and finally answer based *strictly* on the tool output.  
       - Note: Page content is returned to you as Markdown. Preserve this structure in your response.  
      
    3. **CREATION PROTOCOLS:**  
       - When asked to create a page (`notion-create-page`), you must identify a Parent Page ID.  
       - If the user does not specify a location, search for a logical parent page (like "Dashboard", "Projects", or "Notes") or ask the user where to put it.  
      
    4. **CONTENT FORMATTING:**  
       - When appending content (`notion-append-block`) or creating pages, use clean Markdown.  
       - Structure complex information with headers, bullet points, and checkboxes to utilize Notion's block structure effectively.  
      
    ### ERROR HANDLING:  
    - If a tool returns "Object not found" or an empty search result, inform the user: "I cannot see that page. Please ensure you have connected it to the Open WebUI integration via the '...' menu > Connections in Notion."  
      
    ### BEHAVIORAL PERSONA:  
    - Be concise and action-oriented.  
    - Confirm actions after completion (e.g., "✅ I have added that task to your 'Tasks' database.").  
    - If you are analyzing a large amount of text from a Notion page, provide a structured summary unless asked for specific details.  
    

  7. **Attach Knowledge Base:**
     * In the **Knowledge** section, click **Select Knowledge**.
     * In the modal that appears, find and select the **Notion MCP Docs** knowledge base you created in Step 1.



Performance Tuning

While the knowledge base helps the model understand Notion's capabilities, injecting large amounts of documentation can sometimes interfere with tool calling on smaller models (overloading the context).

If you notice the model failing to call tools correctly or hallucinating parameters, **detach the knowledge base** and rely solely on the System Prompt provided above.

  8. **Add Prompt Suggestions:**



Under the **Prompts** section, click the **+** button to add a few helpful starting prompts.

#| Title| Subtitle| Prompt  
---|---|---|---  
1| Search my workspace| for a specific page| Search Notion for my **'Project Roadmap'** page.  
2| Summarize a page| after finding it first| First, search for the **'Onboarding Guide'** page, then read its content and give me a summary.  
3| Add a new task| to my main to‑do list| Find my **'To‑Do List'** page and add a new task: **“Follow up with the design team.”**  
  
![Model Prompts Config: Shows the &#39;Default Prompt Suggestions&#39; section with examples filled in.](/assets/images/notion-setup-step10-6aca229e7be27346cea30be15f87a5b4.png)

  9. Finally, **Save & Update** the model.



![Model Creation Screen: Shows the model settings with Name &#39;Notion Assistant&#39;, description, and the Notion System Prompt filled out.](/assets/images/notion-setup-step11-92bbb15b1ad9692b1db105a69fed22fe.png)

## Supported Tools​

Workflow Best Practice

LLMs cannot "browse" Notion like a human. For most actions, the model first needs to know the **Page ID or URL**. Always ask the model to **search** for a page first before asking it to read or modify it.

This integration supports a wide range of tools for searching, reading, creating, and updating Notion pages and databases.

For a complete list of available tools, their descriptions, and specific usage examples, please refer to the **[official Notion MCP documentation](https://developers.notion.com/docs/mcp-supported-tools)**.

## Rate Limits​

Standard [API request limits](https://developers.notion.com/reference/request-limits) apply to your use of Notion MCP, totaled across all tool calls.

  * **General Limit:** Average of **180 requests per minute** (3 requests per second).
  * **Search-Specific Limit:** **30 requests per minute**.



Rate Limits

If you encounter rate limit errors, prompt your model to reduce the number of parallel searches or operations. For example, instead of "Search for A, B, and C," try asking for them sequentially.

## Troubleshooting​

### Connection Errors​

#### `Failed to connect to MCP server 'ntn'`​

![MCP Connection Error: Shows a red error message in the chat &#39;Failed to connect to MCP server &#39;ntn&#39;.](/assets/images/notion-setup-step12-151656685d5ec5fb3c4d8dd849b6ca7e.png)

  * **Cause:** This usually indicates that your OAuth session with Notion has expired or the token needs a refresh. This often occurs after restarting Open WebUI or after a period of inactivity.
  * **Fix:**
    1. Open any chat.
    2. Click the **+** (Plus) button > **Integrations > Tools**.
    3. Toggle the **Notion** switch **ON**.
    4. This will trigger the redirect to Notion's authorization page to complete the "Connect with Notion MCP" authorization flow again.
    5. Once authorized successfully, the connection will work across all chats again, including for models with the tool enabled by default.



#### `OAuth callback failed: mismatching_state`​

![OAuth Error Toast: Shows the red error notification &#39;OAuth callback failed: mismatching_state: CSRF Warning! State not equal in request and response&#39;.](/assets/images/notion-setup-step13-bfc91fa01723e1150e17658414952636.png)

  * **Cause:** You are likely accessing Open WebUI via `localhost` (e.g., `http://localhost:3000`), but your instance is configured with a public domain via the `WEBUI_URL` environment variable (e.g., `https://chat.mydomain.com`). The OAuth session state created on `localhost` is lost when the callback redirects to your public domain.
  * **Fix:** Access your Open WebUI instance using the **exact URL** defined in `WEBUI_URL` (your public domain) and perform the setup again. **Do not use`localhost` for OAuth setups if a domain is configured.**



### Usage Errors​

#### `Object not found`​

  * **Cause:** The Integration Token is valid, but the specific page has not been shared with the integration.
  * **Fix:** In Notion, go to your Integration settings > **Access** tab and ensure the page is checked, or visit the page directly and check the **Connections** menu to ensure your integration is listed and selected.



#### `Tool execution failed` (Local Method)​

  * **Cause:** Open WebUI is unable to execute the local command (npx/docker) because it is missing from the container, or the configuration is incorrect.
  * **Fix:** Native local execution is not supported. Ensure you are using **MCPO** (Method 2) to bridge these commands, rather than entering them directly into Open WebUI's config, or switch to **Method 1 (Streamable HTTP)** in the Configuration section above. This runs on Notion's servers and requires no local dependencies.



#### `missing_property` when creating a page​

  * **Cause:** The model is trying to create a page without specifying a **Parent ID**. Notion requires every page to exist inside another page or database.
  * **Fix:** Instruct the model in your prompt: _"Search for my 'Notes' page first, get its ID, and create the new page inside there."_



#### `RateLimitedError` (429)​

  * **Cause:** You have exceeded Notion's API limits (approx. 3 requests/second).
  * **Fix:** Ask the model to perform actions sequentially rather than all at once (e.g., "Search for X, then wait, then search for Y").



[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/integrations/mcp-notion.mdx)

[PreviousOkta OIDC SSO Integration](/tutorials/integrations/okta-oidc-sso)[NextJupyter Notebook Integration](/tutorials/integrations/jupyter)

  * Method 1: Streamable HTTP (Recommended)
    * 1\. Configure Tool
    * 2\. Authenticate & Grant Access
  * Method 2: Self-Hosted via MCPO (Advanced)
    * 1\. Configure MCPO
    * 2\. Connect Open WebUI
  * Creating an Internal Integration
    * 1\. Create Integration
    * 2\. Configure Capabilities & Copy Secret
    * 3\. Grant Page Access (Manual)
  * Configuration: Always On (Optional)
  * Building a Specialized Notion Agent (Optional)
    * Step 1: Create a Knowledge Base for the Agent
    * Step 2: Create the Custom Model
  * Supported Tools
  * Rate Limits
  * Troubleshooting
    * Connection Errors
    * Usage Errors


