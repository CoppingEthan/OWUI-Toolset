🔗 Open WebUI Integration | Open WebUI







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

  + [🔗 Open WebUI Integration](/openapi-servers/open-webui)
  + [🛰️ MCP Support](/openapi-servers/mcp)
  + [❓ FAQ](/openapi-servers/faq)
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

* [🔨 OpenAPI Tool Servers](/openapi-servers/)
* 🔗 Open WebUI Integration

On this page

🔗 Open WebUI Integration
========================

Overview[​](#overview "Direct link to Overview")
------------------------------------------------

Open WebUI v0.6+ supports seamless integration with external tools via the OpenAPI servers — meaning you can easily extend your LLM workflows using custom or community-powered tool servers 🧰.

In this guide, you'll learn how to launch an OpenAPI-compatible tool server and connect it to Open WebUI through the intuitive user interface. Let’s get started! 🚀

---

Step 1: Launch an OpenAPI Tool Server[​](#step-1-launch-an-openapi-tool-server "Direct link to Step 1: Launch an OpenAPI Tool Server")
--------------------------------------------------------------------------------------------------------------------------------------

To begin, you'll need to start one of the reference tool servers available in the [openapi-servers repo](https://github.com/open-webui/openapi-servers). For quick testing, we’ll use the time tool server as an example.

🛠️ Example: Starting the `time` server locally

```
git clone https://github.com/open-webui/openapi-servers  
cd openapi-servers  
  
# Navigate to the time server  
cd servers/time  
  
# Install required dependencies  
pip install -r requirements.txt  
  
# Start the server  
uvicorn main:app --host 0.0.0.0 --reload
```

Once running, this will host a local OpenAPI server at <http://localhost:8000>, which you can point Open WebUI to.

![Time Server](/assets/images/time-server-5fc86a83929452344d1e53b2c60fe646.png)

---

Step 2: Connect Tool Server in Open WebUI[​](#step-2-connect-tool-server-in-open-webui "Direct link to Step 2: Connect Tool Server in Open WebUI")
--------------------------------------------------------------------------------------------------------------------------------------------------

Next, connect your running tool server to Open WebUI:

1. Open WebUI in your browser.
2. Open ⚙️ **Settings**.
3. Click on ➕ **Tools** to add a new tool server.
4. Enter the URL where your OpenAPI tool server is running (e.g., <http://localhost:8000>).
5. Click "Save".

![Settings Page](/assets/images/settings-302340c94556062c16a77b56f2caa4e7.png)

### 🧑‍💻 User Tool Servers vs. 🛠️ Global Tool Servers[​](#-user-tool-servers-vs-️-global-tool-servers "Direct link to 🧑‍💻 User Tool Servers vs. 🛠️ Global Tool Servers")

There are two ways to register tool servers in Open WebUI:

#### 1. User Tool Servers (added via regular Settings)[​](#1-user-tool-servers-added-via-regular-settings "Direct link to 1. User Tool Servers (added via regular Settings)")

* Only accessible to the user who registered the tool server.
* The connection is made directly from the browser (client-side) by the user.
* Perfect for personal workflows or when testing custom/local tools.

#### 2. Global Tool Servers (added via Admin Settings)[​](#2-global-tool-servers-added-via-admin-settings "Direct link to 2. Global Tool Servers (added via Admin Settings)")

Admins can manage shared tool servers available to all or selected users across the entire deployment:

* Go to 🛠️ **Admin Settings > Tools**.
* Add the tool server URL just as you would in user settings.
* These tools are treated similarly to Open WebUI’s built-in tools.

#### Main Difference: Where Are Requests Made From?[​](#main-difference-where-are-requests-made-from "Direct link to Main Difference: Where Are Requests Made From?")

The primary distinction between **User Tool Servers** and **Global Tool Servers** is where the API connection and requests are actually made:

* **User Tool Servers**

  + Requests to the tool server are performed **directly from your browser** (the client).
  + This means you can safely connect to localhost URLs (like `http://localhost:8000`)—even exposing private or development-only endpoints such as your local filesystem or dev tools—without risking exposure to the wider internet or other users.
  + Your connection is isolated; only your browser can access that tool server.
* **Global Tool Servers**

  + Requests are sent **from the Open WebUI backend/server** (not your browser).
  + The backend must be able to reach the tool server URL you specify—so `localhost` means the backend server's localhost, *not* your computer's.
  + Use this for sharing tools with other users across the deployment, but be mindful: since the backend makes the requests, you cannot access your personal local resources (like your own filesystem) through this method.
  + Think security! Only expose remote/global endpoints that are safe and meant to be accessed by multiple users.

**Summary Table:**

| Tool Server Type | Request Origin | Use Localhost? | Use Case Example |
| --- | --- | --- | --- |
| User Tool Server | User's Browser (Client-side) | Yes (private to you) | Personal tools, local dev/testing |
| Global Tool Server | Open WebUI Backend (Server-side) | No (unless running on the backend itself) | Team/shared tools, enterprise integrations |

tip

User Tool Servers are best for personal or experimental tools, especially those running on your own machine, while Global Tool Servers are ideal for production or shared environments where everyone needs access to the same tools.

### 👉 Optional: Using a Config File with mcpo[​](#-optional-using-a-config-file-with-mcpo "Direct link to 👉 Optional: Using a Config File with mcpo")

If you're running multiple tools through mcpo using a config file, take note:

🧩 Each tool is mounted under its own unique path!

For example, if you’re using memory and time tools simultaneously through mcpo, they’ll each be available at a distinct route:

* <http://localhost:8000/time>
* <http://localhost:8000/memory>

This means:

* When connecting a tool in Open WebUI, you must enter the full route to that specific tool — do NOT enter just the root URL (<http://localhost:8000>).
* Add each tool individually in Open WebUI Settings using their respective subpath URLs.

![MCPO Config Tools Setting](/assets/images/mcpo-config-tools-62585de6a0626ddfda9de36ebb2560be.png)

✅ Good:

<http://localhost:8000/time>
<http://localhost:8000/memory>

🚫 Not valid:

<http://localhost:8000>

This ensures Open WebUI recognizes and communicates with each tool server correctly.

---

Step 3: Confirm Your Tool Server Is Connected ✅[​](#step-3-confirm-your-tool-server-is-connected- "Direct link to Step 3: Confirm Your Tool Server Is Connected ✅")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------

Once your tool server is successfully connected, Open WebUI will display a 👇 tool server indicator directly in the message input area:

📍 You'll now see this icon below the input box:

![Tool Server Indicator](/assets/images/message-input-009988875c0685886bdf04eed96cc0d6.png)

Clicking this icon opens a popup where you can:

* View connected tool server information
* See which tools are available and which server they're provided by
* Debug or disconnect any tool if needed

🔍 Here’s what the tool information modal looks like:

![Tool Info Modal Expanded](/assets/images/info-modal-8627a2e312ca44e8ebc23cec640c05a5.png)

### 🛠️ Global Tool Servers Look Different — And Are Hidden by Default![​](#️-global-tool-servers-look-different--and-are-hidden-by-default "Direct link to 🛠️ Global Tool Servers Look Different — And Are Hidden by Default!")

If you've connected a Global Tool Server (i.e., one that’s admin-configured), it will not appear automatically in the input area like user tool servers do.

Instead:

* Global tools are hidden by default and must be explicitly activated per user.
* To enable them, you'll need to click on the ➕ button in the message input area (bottom left of the chat box), and manually toggle on the specific global tool(s) you want to use.

Here’s what that looks like:

![Global Tool Server Message Input](/assets/images/global-message-input-cec5e8fd2bfd2bf3d218f00372a00301.png)

⚠️ Important Notes for Global Tool Servers:

* They will not show up in the tool indicator popup until enabled from the ➕ menu.
* Each global tool must be individually toggled on to become active inside your current chat.
* Once toggled on, they function the same way as user tools.
* Admins can control access to global tools via role-based permissions.

This is ideal for team setups or shared environments, where commonly-used tools (e.g., document search, memory, or web lookup) should be centrally accessible by multiple users.

---

(Optional) Step 4: Use "Native" Function Calling (ReACT-style) Tool Use 🧠[​](#optional-step-4-use-native-function-calling-react-style-tool-use- "Direct link to (Optional) Step 4: Use \"Native\" Function Calling (ReACT-style) Tool Use 🧠")
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

info

For this to work effectively, **your selected model must support native tool calling**. Some local models claim support but often produce poor results. We strongly recommend using GPT-4o or another OpenAI model that supports function calling natively for the best experience.

Want to enable ReACT-style (Reasoning + Acting) native function calls directly inside your conversations? You can switch Open WebUI to use native function calling.

✳️ How to enable native function calling:

1. Open the chat window.
2. Go to ⚙️ **Chat Controls > Advanced Params**.
3. Change the **Function Calling** parameter from `Default` to `Native`.

![Native Tool Call](/assets/images/native-d3df4c62825e1bdbc17dbe38604a5a49.png)

---

Need More Tools? Explore & Expand! 🧱[​](#need-more-tools-explore--expand- "Direct link to Need More Tools? Explore & Expand! 🧱")
--------------------------------------------------------------------------------------------------------------------------------

The [openapi-servers repo](https://github.com/open-webui/openapi-servers) includes a variety of useful reference servers:

* 📂 Filesystem access
* 🧠 Memory & knowledge graphs
* 🗃️ Git repo browsing
* 🌎 Web search (WIP)
* 🛢️ Database querying (WIP)

You can run any of these in the same way and connect them to Open WebUI by repeating the steps above.

---

Troubleshooting & Tips 🧩[​](#troubleshooting--tips- "Direct link to Troubleshooting & Tips 🧩")
----------------------------------------------------------------------------------------------

* ❌ Not connecting? Make sure the URL is correct and accessible from the browser used to run Open WebUI.
* 🔒 If you're using remote servers, check firewalls and HTTPS configs!
* 📝 To make servers persist, consider deploying them in Docker or with system services.

Need help? Visit the 👉 [Discussions page](https://github.com/open-webui/openapi-servers/discussions) or [open an issue](https://github.com/open-webui/openapi-servers/issues).

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/openapi-servers/open-webui.mdx)

[Previous

🔨 OpenAPI Tool Servers](/openapi-servers/)[Next

🛰️ MCP Support](/openapi-servers/mcp)

* [Overview](#overview)
* [Step 1: Launch an OpenAPI Tool Server](#step-1-launch-an-openapi-tool-server)
* [Step 2: Connect Tool Server in Open WebUI](#step-2-connect-tool-server-in-open-webui)
  + [🧑‍💻 User Tool Servers vs. 🛠️ Global Tool Servers](#-user-tool-servers-vs-️-global-tool-servers)
  + [👉 Optional: Using a Config File with mcpo](#-optional-using-a-config-file-with-mcpo)
* [Step 3: Confirm Your Tool Server Is Connected ✅](#step-3-confirm-your-tool-server-is-connected-)
  + [🛠️ Global Tool Servers Look Different — And Are Hidden by Default!](#️-global-tool-servers-look-different--and-are-hidden-by-default)
* [(Optional) Step 4: Use "Native" Function Calling (ReACT-style) Tool Use 🧠](#optional-step-4-use-native-function-calling-react-style-tool-use-)
* [Need More Tools? Explore & Expand! 🧱](#need-more-tools-explore--expand-)
* [Troubleshooting & Tips 🧩](#troubleshooting--tips-)

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
- /openapi-servers/open-webui
- /openapi-servers/mcp
- /openapi-servers/faq
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
- /openapi-servers/
- #overview
- #step-1-launch-an-openapi-tool-server
- https://github.com/open-webui/openapi-servers
- http://localhost:8000
- #step-2-connect-tool-server-in-open-webui
- http://localhost:8000
- #-user-tool-servers-vs-️-global-tool-servers
- #1-user-tool-servers-added-via-regular-settings
- #2-global-tool-servers-added-via-admin-settings
- #main-difference-where-are-requests-made-from
- #-optional-using-a-config-file-with-mcpo
- http://localhost:8000/time
- http://localhost:8000/memory
- http://localhost:8000
- http://localhost:8000/time
- http://localhost:8000/memory
- http://localhost:8000
- #step-3-confirm-your-tool-server-is-connected-
- #️-global-tool-servers-look-different--and-are-hidden-by-default
- #optional-step-4-use-native-function-calling-react-style-tool-use-
- #need-more-tools-explore--expand-
- https://github.com/open-webui/openapi-servers
- #troubleshooting--tips-
- https://github.com/open-webui/openapi-servers/discussions
- https://github.com/open-webui/openapi-servers/issues
- https://github.com/open-webui/docs/blob/main/docs/openapi-servers/open-webui.mdx
- /openapi-servers/
- /openapi-servers/mcp
- #overview
- #step-1-launch-an-openapi-tool-server
- #step-2-connect-tool-server-in-open-webui
- #-user-tool-servers-vs-️-global-tool-servers
- #-optional-using-a-config-file-with-mcpo
- #step-3-confirm-your-tool-server-is-connected-
- #️-global-tool-servers-look-different--and-are-hidden-by-default
- #optional-step-4-use-native-function-calling-react-style-tool-use-
- #need-more-tools-explore--expand-
- #troubleshooting--tips-
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
