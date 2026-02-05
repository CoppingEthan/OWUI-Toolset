# https://docs.openwebui.com/getting-started/advanced-topics/https-encryption

  * [](/)
  * [🚀 Getting Started](/getting-started/)
  * [Advanced Topics](/getting-started/advanced-topics/)
  * Enabling HTTPS Encryption



On this page

# Secure Your Open WebUI with HTTPS 🔒

While **HTTPS is not strictly required** for basic local operation, it is **highly recommended** for all deployments and **mandatory** for enabling specific features like Voice Calls.

Critical Feature Dependency

Modern browsers require a **Secure Context** (HTTPS) to access the microphone. **Voice Calls will NOT work** if you access Open WebUI via `http://` (unless using `localhost`).

## Why HTTPS Matters 🛡️​

Enabling HTTPS encryption provides essential benefits:

  1. **🔒 Privacy & Security**: Encrypts all data between the user and the server, protecting chat history and credentials.
  2. **🎤 Feature Unlocking** : Enables browser restrictions for Microphone (Voice Mode) and Camera access.
  3. **💪 Integrity** : Ensures data is not tampered with in transit.
  4. **✅ Trust** : Displays the padlock icon, reassuring users that the service is secure.



## Choosing Your Solution 🛠️​

The best method depends on your infrastructure.

### 🏠 For Local/Docker Users​

If you are running Open WebUI with Docker, the standard approach is to use a **Reverse Proxy**. This sits in front of Open WebUI and handles the SSL encryption.

  * **[Nginx](/tutorials/https/nginx)** : The industry standard. Highly configurable, great performance.
  * **[Caddy](/tutorials/https/caddy)** : **Easiest option**. Automatically obtains and renews Let's Encrypt certificates with minimal config.
  * **[HAProxy](/tutorials/https/haproxy)** : Robust choice for advanced load balancing needs.



### ☁️ For Cloud Deployments​

  * **Cloud Load Balancers** : (AWS ALB, Google Cloud Load Balancing) often handle SSL termination natively.
  * **Cloudflare Tunnel** : Excellent for exposing localhost to the web securely without opening ports.



### 🧪 For Development​

  * **Ngrok** : Good for quickly testing Voice features locally. _Not for production._



## 📚 Implementation Guides​

Ready to set it up? Check out our dedicated tutorial category for step-by-step configurations:

### [Nginx SetupManual control and high performance.](../../../tutorials/https/nginx)### [Caddy SetupZero-config automatic HTTPS.](../../../tutorials/https/caddy)### [📂 View All HTTPS TutorialsBrowse the full category of guides.](../../../tutorials/https/)

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/getting-started/advanced-topics/https-encryption.md)

[PreviousLogging in Open WebUI](/getting-started/advanced-topics/logging)[NextAPI Keys & Monitoring](/getting-started/advanced-topics/monitoring/)

  * Why HTTPS Matters 🛡️
  * Choosing Your Solution 🛠️
    * 🏠 For Local/Docker Users
    * ☁️ For Cloud Deployments
    * 🧪 For Development
  * 📚 Implementation Guides


