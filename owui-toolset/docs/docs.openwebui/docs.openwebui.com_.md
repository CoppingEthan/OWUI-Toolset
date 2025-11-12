🏡 Home | Open WebUI







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

* 🏡 Home

On this page

Open WebUI
==========

**Open WebUI is an [extensible](https://docs.openwebui.com/features/plugin/), feature-rich, and user-friendly self-hosted AI platform designed to operate entirely offline.** It supports various LLM runners like **Ollama** and **OpenAI-compatible APIs**, with **built-in inference engine** for RAG, making it a **powerful AI deployment solution**.

Passionate about open-source AI? [Join our team →](https://careers.openwebui.com/)

![GitHub stars](https://img.shields.io/github/stars/open-webui/open-webui?style=social)
![GitHub forks](https://img.shields.io/github/forks/open-webui/open-webui?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/open-webui/open-webui?style=social)
![GitHub repo size](https://img.shields.io/github/repo-size/open-webui/open-webui)
![GitHub language count](https://img.shields.io/github/languages/count/open-webui/open-webui)
![GitHub top language](https://img.shields.io/github/languages/top/open-webui/open-webui)
![GitHub last commit](https://img.shields.io/github/last-commit/open-webui/open-webui?color=red)
[![Discord](https://img.shields.io/badge/Discord-Open_WebUI-blue?logo=discord&logoColor=white)](https://discord.gg/5rJgQTnV4s)
[![Image Description](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/tjbck)

![Open WebUI Demo](/assets/images/demo-f704541c988ae735dde16b8baba17627.png)

tip

**Looking for an [Enterprise Plan](https://docs.openwebui.com/enterprise)?** — **[Speak with Our Sales Team Today!](https://docs.openwebui.com/enterprise)**

Get **enhanced capabilities**, including **custom theming and branding**, **Service Level Agreement (SLA) support**, **Long-Term Support (LTS) versions**, and **more!**

Sponsored by Open WebUI

[![Open WebUI](/sponsors/banners/placeholder.png)![Open WebUI](/sponsors/banners/placeholder-mobile.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

Quick Start with Docker 🐳[​](#quick-start-with-docker- "Direct link to Quick Start with Docker 🐳")
--------------------------------------------------------------------------------------------------

info

**WebSocket** support is required for Open WebUI to function correctly. Ensure that your network configuration allows WebSocket connections.

**If Ollama is on your computer**, use this command:

```
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

**To run Open WebUI with Nvidia GPU support**, use this command:

```
docker run -d -p 3000:8080 --gpus all --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:cuda
```

For environments with limited storage or bandwidth, Open WebUI offers slim image variants that exclude pre-bundled models. These images are significantly smaller but download required models on first use:

```
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main-slim
```

### Open WebUI Bundled with Ollama[​](#open-webui-bundled-with-ollama "Direct link to Open WebUI Bundled with Ollama")

This installation method uses a single container image that bundles Open WebUI with Ollama, allowing for a streamlined setup via a single command. Choose the appropriate command based on your hardware setup:

* **With GPU Support**:
  Utilize GPU resources by running the following command:

  ```
  docker run -d -p 3000:8080 --gpus=all -v ollama:/root/.ollama -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:ollama
  ```
* **For CPU Only**:
  If you're not using a GPU, use this command instead:

  ```
  docker run -d -p 3000:8080 -v ollama:/root/.ollama -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:ollama
  ```

Both commands facilitate a built-in, hassle-free installation of both Open WebUI and Ollama, ensuring that you can get everything up and running swiftly.

After installation, you can access Open WebUI at <http://localhost:3000>. Enjoy! 😄

### Using the Dev Branch 🌙[​](#using-the-dev-branch- "Direct link to Using the Dev Branch 🌙")

warning

The `:dev` branch contains the latest unstable features and changes. Use it at your own risk as it may have bugs or incomplete features.

If you want to try out the latest bleeding-edge features and are okay with occasional instability, you can use the `:dev` tag like this:

```
docker run -d -p 3000:8080 -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:dev
```

For the slim variant of the dev branch:

```
docker run -d -p 3000:8080 -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:dev-slim
```

### Updating Open WebUI[​](#updating-open-webui "Direct link to Updating Open WebUI")

To update Open WebUI container easily, follow these steps:

#### Manual Update[​](#manual-update "Direct link to Manual Update")

Use [Watchtower](https://containrrr.dev/watchtower) to update your Docker container manually:

```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --run-once open-webui
```

#### Automatic Updates[​](#automatic-updates "Direct link to Automatic Updates")

Keep your container updated automatically every 5 minutes:

```
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 300 open-webui
```

🔧 **Note**: Replace `open-webui` with your container name if it's different.

Manual Installation[​](#manual-installation "Direct link to Manual Installation")
---------------------------------------------------------------------------------

info

### Platform Compatibility[​](#platform-compatibility "Direct link to Platform Compatibility")

Open WebUI works on macOS, Linux (x86\_64 and ARM64, including Raspberry Pi and other ARM boards), and Windows.

There are two main ways to install and run Open WebUI: using the `uv` runtime manager or Python's `pip`. While both methods are effective, **we strongly recommend using `uv`** as it simplifies environment management and minimizes potential conflicts.

### Installation with `uv` (Recommended)[​](#installation-with-uv-recommended "Direct link to installation-with-uv-recommended")

The `uv` runtime manager ensures seamless Python environment management for applications like Open WebUI. Follow these steps to get started:

#### 1. Install `uv`[​](#1-install-uv "Direct link to 1-install-uv")

Pick the appropriate installation command for your operating system:

* **macOS/Linux**:

  ```
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
* **Windows**:

  ```
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

#### 2. Run Open WebUI[​](#2-run-open-webui "Direct link to 2. Run Open WebUI")

Once `uv` is installed, running Open WebUI is a breeze. Use the command below, ensuring to set the `DATA_DIR` environment variable to avoid data loss. Example paths are provided for each platform:

* **macOS/Linux**:

  ```
  DATA_DIR=~/.open-webui uvx --python 3.11 open-webui@latest serve
  ```
* **Windows**:

  ```
  $env:DATA_DIR="C:\open-webui\data"; uvx --python 3.11 open-webui@latest serve
  ```

note

**For PostgreSQL Support:**

The default installation now uses a slimmed-down package. If you need **PostgreSQL support**, install with all optional dependencies:

```
pip install open-webui[all]
```

### Installation with `pip`[​](#installation-with-pip "Direct link to installation-with-pip")

For users installing Open WebUI with Python's package manager `pip`, **it is strongly recommended to use Python runtime managers like `uv` or `conda`**. These tools help manage Python environments effectively and avoid conflicts.

Python 3.11 is the development environment. Python 3.12 seems to work but has not been thoroughly tested. Python 3.13 is entirely untested and some dependencies do not work with Python 3.13 yet—**use at your own risk**.

1. **Install Open WebUI**:

   Open your terminal and run the following command:

   ```
   pip install open-webui
   ```
2. **Start Open WebUI**:

   Once installed, start the server using:

   ```
   open-webui serve
   ```

### Updating Open WebUI[​](#updating-open-webui-1 "Direct link to Updating Open WebUI")

To update to the latest version, simply run:

```
pip install --upgrade open-webui
```

This method installs all necessary dependencies and starts Open WebUI, allowing for a simple and efficient setup. After installation, you can access Open WebUI at <http://localhost:8080>. Enjoy! 😄

Other Installation Methods[​](#other-installation-methods "Direct link to Other Installation Methods")
------------------------------------------------------------------------------------------------------

We offer various installation alternatives, including non-Docker native installation methods, Docker Compose, Kustomize, and Helm. Visit our [Open WebUI Documentation](https://docs.openwebui.com/getting-started/) or join our [Discord community](https://discord.gg/5rJgQTnV4s) for comprehensive guidance.

Continue with the full [getting started guide](/getting-started).

### Desktop App[​](#desktop-app "Direct link to Desktop App")

We also have an **experimental** desktop app, which is actively a **work in progress (WIP)**. While it offers a convenient way to run Open WebUI natively on your system without Docker or manual setup, it is **not yet stable**.

👉 For stability and production use, we strongly recommend installing via **Docker** or **Python (`uv` or `pip`)**.

Sponsors 🙌[​](#sponsors- "Direct link to Sponsors 🙌")
-----------------------------------------------------

Emerald

---

Jade

---

[Open WebUI](https://openwebui.com)

[![Open WebUI](/sponsors/sponsor.png)

On a mission to build the best AI user interface.](https://openwebui.com)

We are incredibly grateful for the generous support of our sponsors. Their contributions help us to maintain and improve our project, ensuring we can continue to deliver quality work to our community. Thank you!

Acknowledgements 🙏[​](#acknowledgements- "Direct link to Acknowledgements 🙏")
-----------------------------------------------------------------------------

We are deeply grateful for the generous grant support provided by:

[![A16z](/assets/images/a16z-58aeed7bc9f9a7894b5f3e59192d88d3.png)

A16z Open Source AI Grant 2025](https://a16z.com/advancing-open-source-ai-through-benchmarks-and-bold-experimentation/ "A16z Open Source AI Grant 2025")[![Mozilla](/assets/images/mozilla-c6f20205901846103930d13dd5f57ada.png)

Mozilla Builders 2024](https://builders.mozilla.org/ "Mozilla Builders 2024")[![GitHub](/assets/images/github-9561a29eaa5e059e087a198bedf703ce.png)

GitHub Accelerator 2024](https://github.com/accelerator "GitHub Accelerator 2024")

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/intro.mdx)

[Next

🚀 Getting Started](/getting-started/)

* [Quick Start with Docker 🐳](#quick-start-with-docker-)
  + [Open WebUI Bundled with Ollama](#open-webui-bundled-with-ollama)
  + [Using the Dev Branch 🌙](#using-the-dev-branch-)
  + [Updating Open WebUI](#updating-open-webui)
* [Manual Installation](#manual-installation)
  + [Platform Compatibility](#platform-compatibility)
  + [Installation with `uv` (Recommended)](#installation-with-uv-recommended)
  + [Installation with `pip`](#installation-with-pip)
  + [Updating Open WebUI](#updating-open-webui-1)
* [Other Installation Methods](#other-installation-methods)
  + [Desktop App](#desktop-app)
* [Sponsors 🙌](#sponsors-)
* [Acknowledgements 🙏](#acknowledgements-)

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
- https://docs.openwebui.com/features/plugin/
- https://careers.openwebui.com/
- https://discord.gg/5rJgQTnV4s
- https://github.com/sponsors/tjbck
- https://docs.openwebui.com/enterprise
- https://docs.openwebui.com/enterprise
- https://forms.gle/92mvG3ESYj47zzRL9
- #quick-start-with-docker-
- #open-webui-bundled-with-ollama
- http://localhost:3000
- #using-the-dev-branch-
- #updating-open-webui
- #manual-update
- https://containrrr.dev/watchtower
- #automatic-updates
- #manual-installation
- #platform-compatibility
- #installation-with-uv-recommended
- #1-install-uv
- #2-run-open-webui
- #installation-with-pip
- #updating-open-webui-1
- http://localhost:8080
- #other-installation-methods
- https://docs.openwebui.com/getting-started/
- https://discord.gg/5rJgQTnV4s
- /getting-started
- #desktop-app
- #sponsors-
- https://openwebui.com
- https://openwebui.com
- #acknowledgements-
- https://a16z.com/advancing-open-source-ai-through-benchmarks-and-bold-experimentation/
- https://builders.mozilla.org/
- https://github.com/accelerator
- https://github.com/open-webui/docs/blob/main/docs/intro.mdx
- /getting-started/
- #quick-start-with-docker-
- #open-webui-bundled-with-ollama
- #using-the-dev-branch-
- #updating-open-webui
- #manual-installation
- #platform-compatibility
- #installation-with-uv-recommended
- #installation-with-pip
- #updating-open-webui-1
- #other-installation-methods
- #desktop-app
- #sponsors-
- #acknowledgements-
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
