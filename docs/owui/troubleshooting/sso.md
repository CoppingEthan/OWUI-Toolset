# https://docs.openwebui.com/troubleshooting/sso

  * [](/)
  * [🛠️ Troubleshooting](/troubleshooting/)
  * Troubleshooting OAUTH / SSO Issues



On this page

# Troubleshooting OAUTH / SSO Issues

OAUTH or Single Sign-On (SSO) lets you secure Open WebUI with modern authentication, but when users encounter login problems, the solution is often simple—if you know where to look. Most of the time, one of these key issues below is the culprit. Here's how to hunt them down and fix SSO headaches fast! 🚦

## Common OAUTH/SSO Issues and How to Fix Them 🛠️​

### 1\. WebUI URL Not Configured in Admin Panel 🚪🔒​

Most OAUTH flows require the application's external URL ("redirect URI") so the provider knows where to send users after login. If this is missing, OAUTH won't be able to complete!

✅ Solution:

  * Navigate to: **Admin Settings > General**
  * Ensure your **WebUI URL** field is filled in and points to your deployed instance (e.g., `https://yourwebui.yourdomain.com`)



tip

Check for typos! OAUTH is strict—URLs must match exactly, including `https://`.

* * *

### 2\. Incorrect Environment Variable Configuration 📝🚫​

This is by far the **most common cause** of OAUTH breakage. If you misspell, omit, or set the wrong environment variable (especially for OIDC/OAUTH config), authentication can't work.

**Common Environment Variable Mistakes:**

#### ❌ Non-Existent Variables People Often Use:​

  * `OIDC_CONFIG` → Use `OPENID_PROVIDER_URL` instead
  * `WEBUI_OIDC_CLIENT_ID` → Use `OAUTH_CLIENT_ID` instead
  * `WEBUI_ENABLE_SSO` → Use `ENABLE_OAUTH_SIGNUP` instead
  * `WEBUI_AUTH_TYPE` → This doesn't exist - configure provider-specific variables instead
  * `OPENID_CLIENT_ID` → Use `OAUTH_CLIENT_ID` instead
  * `OPENID_CLIENT_SECRET` → Use `OAUTH_CLIENT_SECRET` instead



#### ✅ Correct OIDC Variables:​
    
    
      
    # Required for OIDC  
    OAUTH_CLIENT_ID=your_client_id  
    OAUTH_CLIENT_SECRET=your_client_secret  
    OPENID_PROVIDER_URL=https://your-provider/.well-known/openid-configuration  
    ENABLE_OAUTH_SIGNUP=true  
      
    # Optional but recommended  
    OAUTH_PROVIDER_NAME=Your Provider Name  
    OAUTH_SCOPES=openid email profile  
    OPENID_REDIRECT_URI=https://your-domain/oauth/oidc/callback  
    

#### ✅ Correct Microsoft Variables:​
    
    
      
    # Use these for Microsoft Entra ID  
    MICROSOFT_CLIENT_ID=your_client_id  
    MICROSOFT_CLIENT_SECRET=your_client_secret  
    MICROSOFT_CLIENT_TENANT_ID=your_tenant_id  
    OPENID_PROVIDER_URL=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0/.well-known/openid-configuration  
    ENABLE_OAUTH_SIGNUP=true  
    

✅ Solutions:

  * **Always reference the official[environment configuration documentation](https://docs.openwebui.com/getting-started/env-configuration/)** for exact variable names
  * Double-check your deployment environment:
    * Ensure all required environment variables are set exactly as documented
    * If self-hosting, confirm these variables are present in your Docker Compose, Kubernetes manifest, or `.env` file
  * Restart your backend/app after changing variables so the new values are loaded



tip

Most OAUTH errors (loops, 401s, unresponsiveness) are due to an environment variable incorrectly named, missing entirely, or using outdated variable names!

* * *

### 3\. Missing Required Variables 🚨⚠️​

#### OPENID_PROVIDER_URL is Mandatory for OIDC​

Many users forget this critical variable. Without it, OIDC authentication cannot work.

✅ **For Microsoft Entra ID:**
    
    
    OPENID_PROVIDER_URL=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0/.well-known/openid-configuration  
    

✅ **For Google:**
    
    
    OPENID_PROVIDER_URL=https://accounts.google.com/.well-known/openid-configuration  
    

✅ **For Authentik:**
    
    
    OPENID_PROVIDER_URL=https://your-authentik-domain/application/o/your-app-name/.well-known/openid-configuration  
    

#### Other Required Variables by Provider:​

  * **All OAuth providers:** `WEBUI_URL`, `ENABLE_OAUTH_SIGNUP=true`
  * **Microsoft:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_CLIENT_TENANT_ID`
  * **Google:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  * **OIDC:** `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OPENID_PROVIDER_URL`



* * *

### 4\. Persistent Configuration Conflicts 🔄💾​

**New Issue:** Many users don't realize that OAuth settings are stored in the database after the first launch when `ENABLE_OAUTH_PERSISTENT_CONFIG=true` (default).

#### Symptoms:​

  * Changes to environment variables don't take effect after restart
  * Authentication worked once but broke after configuration changes
  * "No token found in localStorage" errors after reconfiguration



✅ **Solutions:**

  1. **For Development/Testing:** Set `ENABLE_OAUTH_PERSISTENT_CONFIG=false` to always read from environment variables
  2. **For Production:** Either:
     * Configure settings through Admin Panel instead of environment variables, OR
     * Temporarily set `ENABLE_OAUTH_PERSISTENT_CONFIG=false`, restart to apply new env vars, then set back to `true`
  3. **Fresh Start:** Delete the database volume and restart with correct configuration



📌 **Example for Docker Compose:**
    
    
    environment:  
      - ENABLE_OAUTH_PERSISTENT_CONFIG=false  # Forces reading from env vars  
      - OAUTH_CLIENT_ID=your_client_id  
      - OAUTH_CLIENT_SECRET=your_secret  
      - OPENID_PROVIDER_URL=your_provider_url  
    

* * *

### 5\. OAUTH Misconfiguration on the Provider Side 🏢🔗​

Sometimes the issue is with the identity provider (e.g., Google, Okta, Auth0, Azure AD) not aligning with your WebUI's setup.

✅ Solutions:

  * Verify your application is correctly registered with the OAUTH provider. Confirm:
    * **Redirect URIs exactly match your deployed WebUI address**
      * OIDC: `https://your-domain/oauth/oidc/callback`
      * Microsoft: `https://your-domain/oauth/microsoft/callback`
      * Google: `https://your-domain/oauth/google/callback`
    * Client ID and secret match the values given in your environment settings
    * Scopes and allowed grant types (e.g., `authorization_code`) are set as required by Open WebUI
  * Check the provider's logs—misconfigured apps will often show clear error messages there



📌 **Redirect URI Format Examples:**
    
    
    ✅ Correct: https://ai.company.com/oauth/oidc/callback  
    ❌ Wrong: https://ai.company.com/oauth/callback/oidc  
    ❌ Wrong: https://ai.company.com/callback  
    

tip

When in doubt, recheck your provider registration and regenerate client secrets if needed.

* * *

### 6\. Server-Side Caching (A Hidden Trouble Spot!) 🧊🚦​

A **new and tricky problem** : If you use NGINX (or another reverse proxy) with server-side caching, OAUTH endpoints can misbehave. The result isn't always a total failure—often, users experience random or "weird" login bugs that are almost impossible to debug.

✅ Solutions:

  * In your NGINX (or proxy) configuration:
    * Make sure to **exclude** the following endpoints from server-side caching:
      * `/api`, `/oauth`, `/callback`, `/login`, `/ws`, `/websocket`
    * Any critical login/auth endpoint must remain uncached!
  * Reload the proxy config after making changes



**Example NGINX Configuration:**
    
    
      
    # Disable caching for login / OAuth / websockets endpoints  
    location ~* ^/(api|oauth|callback|login|ws|websocket) {  
        proxy_no_cache 1;  
        proxy_cache_bypass 1;  
        proxy_set_header Host $host;  
        proxy_set_header X-Real-IP $remote_addr;  
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
        proxy_set_header X-Forwarded-Proto $scheme;  
        proxy_http_version 1.1;  
        proxy_set_header Upgrade $http_upgrade;  
        proxy_set_header Connection "upgrade";  
        proxy_read_timeout 3600s;  
        proxy_send_timeout 3600s;  
        proxy_set_header Accept-Encoding "";  
    }  
    

warning

📌 Warning: Never cache OAUTH or login endpoints! Caching can "poison" the session or deliver stale tokens, causing bizarre auth errors.

* * *

### 7\. Cookie Configuration Issues 🍪⚙️​

**Common Problem:** Reverse proxy cookie settings can interfere with OAuth authentication, especially the `HttpOnly` and `SameSite` settings.

#### Symptoms:​

  * "No token found in localStorage" errors
  * Redirect loops after successful authentication
  * Authentication works but immediately redirects to login page



✅ **Solutions:**

#### For NGINX Proxy Manager:​
    
    
      
    # Remove or adjust problematic cookie settings  
      
    # ❌ Problematic:  
      
    # proxy_cookie_path / "/; Secure; HttpOnly; SameSite=None";  
      
    # ✅ Better:  
    proxy_cookie_flags ~ secure samesite=lax;  
      
    # or remove cookie manipulation entirely  
    

#### Environment Variable Cookie Settings:​
    
    
      
    # Recommended cookie settings for OAuth  
    WEBUI_SESSION_COOKIE_SAME_SITE=lax  
    WEBUI_AUTH_COOKIE_SAME_SITE=lax  
    WEBUI_SESSION_COOKIE_SECURE=true  # Set to false if using HTTP  
    WEBUI_AUTH_COOKIE_SECURE=true     # Set to false if using HTTP  
    

* * *

### 8\. Network Timeout Issues ⏱️🌐​

**New Issue:** OAuth providers may be slow to respond, causing timeout errors during the authentication handshake.

#### Symptoms:​

  * `httpcore.ReadTimeout` errors in logs
  * `CSRF Warning! State not equal in request and response` errors
  * OAuth login fails intermittently



✅ **Solutions:**
    
    
      
    # Increase OAuth timeouts  
    AIOHTTP_CLIENT_TIMEOUT=600         # Very high number is needed here, since model responses that take a lot of time also rely on this timeout variable (e.g., a model that is reasoning for 5+ minutes)  
    AIOHTTP_CLIENT_TIMEOUT_OPENAI_MODEL_LIST=30  
    

* * *

### 9\. Session State Mismatch (CSRF Errors) 🔐❌​

**Advanced Issue:** Session cookies not being properly maintained across OAuth redirect flow.

#### Symptoms:​

  * `CSRF Warning! State not equal in request and response`
  * `mismatching_state` errors in logs
  * Authentication appears successful but redirects to login



✅ **Solutions:**

  1. **Check Cookie Domain Configuration:**


    
    
      
    # Ensure cookies are set for the correct domain  
    WEBUI_URL=https://your-exact-domain.com  # Must match exactly - check if you have a different value set in the admin panel  
    

  2. **Session Configuration:**


    
    
      
    # Ensure session handling is properly configured  
    WEBUI_SECRET_KEY=your_very_secure_random_key_here  
    OAUTH_SESSION_TOKEN_ENCRYPTION_KEY=another_secure_key_here  
    

* * *

### 10\. Load Balancer and Multi-Instance Issues 🔀⚖️​

**Enterprise Issue:** In multi-instance deployments, OAuth sessions can fail if not properly synchronized.

#### Required Configuration for Clusters:​
    
    
      
    # Redis for session synchronization (required for multi-instance)  
    REDIS_URL=redis://your-redis:6379/0  
    WEBSOCKET_REDIS_URL=redis://your-redis:6379/0  
      
    # Shared secrets across all instances  
    WEBUI_SECRET_KEY=same_on_all_instances  
    OAUTH_SESSION_TOKEN_ENCRYPTION_KEY=same_on_all_instances  
      
    # WebSocket support for clusters  
    ENABLE_WEBSOCKET_SUPPORT=true  
    WEBSOCKET_MANAGER=redis  
    

* * *

### 11\. Provider-Specific Configuration Issues 🏢📋​

#### Microsoft Entra ID Common Issues:​

**Problem:** Using generic OIDC variables instead of Microsoft-specific ones.

✅ **Correct Microsoft Setup:**
    
    
      
    # Use Microsoft-specific variables, not generic OIDC  
    MICROSOFT_CLIENT_ID=your_azure_app_id  
    MICROSOFT_CLIENT_SECRET=your_azure_app_secret  
    MICROSOFT_CLIENT_TENANT_ID=your_tenant_id  
    MICROSOFT_OAUTH_SCOPE=openid email profile  
    MICROSOFT_REDIRECT_URI=https://your-domain/oauth/microsoft/callback  
      
    # Also required for a working Microsoft setup  
    OPENID_PROVIDER_URL=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0/.well-known/openid-configuration  
    ENABLE_OAUTH_SIGNUP=true  
    

#### Authentik Common Issues:​

**Problem:** Incorrect provider URL format.

✅ **Correct Authentik Setup:**
    
    
    OAUTH_CLIENT_ID=your_authentik_client_id  
    OAUTH_CLIENT_SECRET=your_authentik_client_secret  
    OPENID_PROVIDER_URL=https://your-authentik-domain/application/o/your-app-slug/.well-known/openid-configuration  
    OAUTH_PROVIDER_NAME=Authentik  
    OAUTH_SCOPES=openid email profile  
    

* * *

## 🧪 Advanced Troubleshooting Tips​

### Check Token Storage Method​

Recent versions of Open WebUI moved from URL-based tokens to cookie-based tokens. If you have authentication issues:

  1. **Clear browser cookies and cache completely**
  2. **Check browser Developer Tools:**
     * Look for `oauth_session_id` cookie (new method)
     * Check for any `oauth_id_token` cookie (legacy method)
     * Verify cookies have correct domain and path settings



### Debugging OAuth Flow​

Enable debug logging and trace the OAuth flow:
    
    
      
    # Enable detailed logging  
    GLOBAL_LOG_LEVEL=DEBUG  
      
    # Check logs for these key steps:  
      
    # 1. GET /oauth/{provider}/login - Should return 302 redirect  
      
    # 2. User authenticates with provider  
      
    # 3. GET /oauth/{provider}/callback?code=... - Should return 200 or redirect  
      
    # 4. User should be logged in  
    

### Database Debugging​

Check if user accounts are being created:
    
    
      
    # Access your container  
    docker exec -it your-openwebui-container sh  
      
    # Check if users are created (adjust path to your data directory)  
    ls -la /app/backend/data/  
    

### Test Without Reverse Proxy​

If using a reverse proxy, test OAuth directly against Open WebUI:

  1. Temporarily expose Open WebUI port directly
  2. Update OAuth provider redirect URI to point to direct port
  3. Test authentication without proxy
  4. If it works, the issue is in your proxy configuration



* * *

## 🧪 Pro Tip: Always Check the Logs​

  * Look at backend logs and browser network errors. The first error usually points to the misconfiguration (redirect URI mismatch, missing/invalid variable, provider-side error, or caching).
  * If unsure which side is the problem, try logging in from an incognito browser window and watch for any blocked or failed requests.



### Key Log Messages to Watch For:​

  * `OAuth callback error: mismatching_state` → Session/cookie issue
  * `httpcore.ReadTimeout` → Network timeout issue
  * `The email or password provided is incorrect` → Often means OAuth completed but session wasn't established
  * `404` on callback URLs → Redirect URI misconfiguration



* * *

## Summary Checklist ✅​

Problem| Fix  
---|---  
🔗 WebUI URL missing or wrong| Set correct WebUI URL in admin panel  
📝 Env var typo or missing| Double-check against official docs - avoid non-existent vars like `OIDC_CONFIG`  
🚨 Missing OPENID_PROVIDER_URL| Always required for OIDC - set to provider's `.well-known/openid-configuration`  
🔄 Persistent config conflicts| Set `ENABLE_OAUTH_PERSISTENT_CONFIG=false` or use admin panel  
🏢 Provider misconfigured| Confirm app registration, URIs & client IDs/secrets  
🧊 Proxy caching interfering| Exclude OAuth endpoints from all server-side caches  
🍪 Cookie configuration issues| Check reverse proxy cookie settings and env vars  
⏱️ Timeout problems| Increase `AIOHTTP_CLIENT_TIMEOUT` values  
🔐 CSRF/session issues| Verify `WEBUI_SECRET_KEY` and session configuration  
🔀 Multi-instance problems| Configure Redis and shared secrets  
Still stuck?| Check debug logs, test without proxy, verify provider setup  
  
* * *

By carefully configuring BOTH your OAuth provider and your WebUI environment—and keeping critical login endpoints immune to caching—you'll eliminate nearly all SSO/OAuth login problems. Don't let a typo, missing variable, or a hidden cache block your users from seamless, secure AI access! 🦾

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/troubleshooting/sso.mdx)

[PreviousTroubleshooting RAG (Retrieval-Augmented Generation)](/troubleshooting/rag)[NextTroubleshooting Web Search](/troubleshooting/web-search)

  * Common OAUTH/SSO Issues and How to Fix Them 🛠️
    * 1\. WebUI URL Not Configured in Admin Panel 🚪🔒
    * 2\. Incorrect Environment Variable Configuration 📝🚫
    * 3\. Missing Required Variables 🚨⚠️
    * 4\. Persistent Configuration Conflicts 🔄💾
    * 5\. OAUTH Misconfiguration on the Provider Side 🏢🔗
    * 6\. Server-Side Caching (A Hidden Trouble Spot!) 🧊🚦
    * 7\. Cookie Configuration Issues 🍪⚙️
    * 8\. Network Timeout Issues ⏱️🌐
    * 9\. Session State Mismatch (CSRF Errors) 🔐❌
    * 10\. Load Balancer and Multi-Instance Issues 🔀⚖️
    * 11\. Provider-Specific Configuration Issues 🏢📋
  * 🧪 Advanced Troubleshooting Tips
    * Check Token Storage Method
    * Debugging OAuth Flow
    * Database Debugging
    * Test Without Reverse Proxy
  * 🧪 Pro Tip: Always Check the Logs
    * Key Log Messages to Watch For:
  * Summary Checklist ✅


