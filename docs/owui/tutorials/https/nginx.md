# https://docs.openwebui.com/tutorials/https/nginx

  * [](/)
  * [🎓 Tutorials](/category/-tutorials)
  * [HTTPS](/category/https)
  * HTTPS using Nginx



On this page

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

# HTTPS using Nginx

Ensuring secure communication between your users and the Open WebUI is paramount. HTTPS (HyperText Transfer Protocol Secure) encrypts the data transmitted, protecting it from eavesdroppers and tampering. By configuring Nginx as a reverse proxy, you can seamlessly add HTTPS to your Open WebUI deployment, enhancing both security and trustworthiness.

This guide provides three methods to set up HTTPS:

  * **Self-Signed Certificates** : Ideal for development and internal use, using docker.
  * **Let's Encrypt** : Perfect for production environments requiring trusted SSL certificates, using docker.
  * **Windows+Self-Signed** : Simplified instructions for development and internal use on windows, no docker required.



Critical: Configure CORS for WebSocket Connections

A very common and difficult-to-debug issue with WebSocket connections is a misconfigured Cross-Origin Resource Sharing (CORS) policy. When running Open WebUI behind a reverse proxy like Nginx Proxy Manager, you **must** set the `CORS_ALLOW_ORIGIN` environment variable in your Open WebUI configuration.

Failure to do so will cause WebSocket connections to fail, even if you have enabled "Websockets support" in Nginx Proxy Manager.

### HTTP/2 and WebSockets​

If you enable **HTTP/2** on your Nginx server, ensure that your proxy configuration still uses **HTTP/1.1** for the connection to the Open WebUI backend. This is crucial as most WebUI features (like streaming and real-time updates) rely on WebSockets, which are more stable when handled via HTTP/1.1 `Upgrade` than over the newer RFC 8441 (WebSockets over H2) in many proxy environments.

In your Nginx location block, always include:
    
    
    proxy_http_version 1.1;  
    proxy_set_header Upgrade $http_upgrade;  
    proxy_set_header Connection "upgrade";  
    

Critical: Disable Proxy Buffering for SSE Streaming

**This is the most common cause of garbled markdown and broken streaming responses.**

When Nginx's `proxy_buffering` is enabled (the default!), it re-chunks SSE streams arbitrarily. This breaks markdown tokens across chunk boundaries—for example, `**bold**` becomes `**` \+ `bold` \+ `**`—causing corrupted output with visible `##`, `**`, or missing words.

**You MUST include these directives in your Nginx location block:**
    
    
     # CRITICAL: Disable buffering for SSE streaming  
    proxy_buffering off;  
    proxy_cache off;  
    

**Symptoms if you forget this:**

  * Raw markdown tokens visible (`##`, `**`, `###`)
  * Bold/heading markers appearing incorrectly
  * Words or sections randomly missing from responses
  * Streaming works perfectly when disabled, breaks when enabled



**Bonus:** Disabling buffering also makes streaming responses **significantly faster** , as content flows directly to the client without Nginx's buffering delay.

Choose the method that best fits your deployment needs.

  * Nginx Proxy Manager
  * Let's Encrypt
  * Self-Signed
  * Windows



### Nginx Proxy Manager​

Nginx Proxy Manager (NPM) allows you to easily manage reverse proxies and secure your local applications, like Open WebUI, with valid SSL certificates from Let's Encrypt. This setup enables HTTPS access, which is necessary for using voice input features on many mobile browsers due to their security requirements, without exposing the application's specific port directly to the internet.

#### Prerequisites​

  * A home server running Docker and open-webui container running.
  * A domain name (free options like DuckDNS or paid ones like Namecheap/GoDaddy).
  * Basic knowledge of Docker and DNS configuration.



#### Nginx Proxy Manager Steps​

  1. **Create Directories for Nginx Files:**
         
         mkdir ~/nginx_config  
         cd ~/nginx_config  
         

  2. **Set Up Nginx Proxy Manager with Docker:**
         
         nano docker-compose.yml  
         



    
    
    services:  
      app:  
        image: 'jc21/nginx-proxy-manager:latest'  
        restart: unless-stopped  
        ports:  
          - '80:80'  
          - '81:81'  
          - '443:443'  
        volumes:  
          - ./data:/data  
          - ./letsencrypt:/etc/letsencrypt  
    

Run the container:
    
    
    docker-compose up -d  
    

  3. **Configure DNS and Domain:**

     * Log in to your domain provider (e.g., DuckDNS) and create a domain.
     * Point the domain to your proxy’s local IP (e.g., 192.168.0.6).
     * If using DuckDNS, get an API token from their dashboard.



###### Here is a simple example how it's done in <https://www.duckdns.org/domains>​

  4. **Set Up SSL Certificates:**


  * Access Nginx Proxy Manager at http://server_ip:81. For example: `192.168.0.6:81`

  * Log in with the default credentials ([admin@example.com](mailto:admin@example.com) / changeme). Change them as asked.

  * Go to SSL Certificates → Add SSL Certificate → Let's Encrypt.

  * Write your email and domain name you got from DuckDNS. One domain name contains an asterisk and another does not. Example: `*.hello.duckdns.org` and `hello.duckdns.org`.

  * Select Use a DNS challenge, choose DuckDNS, and paste your API token. example: `dns_duckdns_token=f4e2a1b9-c78d-e593-b0d7-67f2e1c9a5b8`

  * Agree to Let’s Encrypt terms and save. Change propagation time **if needed** (120 seconds).



  5. **Create Proxy Hosts:**


  * For each service (e.g., openwebui, nextcloud), go to Hosts → Proxy Hosts → Add Proxy Host.

  * Fill in the domain name (e.g., openwebui.hello.duckdns.org).

  * Set the scheme to HTTP (default), enable `Websockets support` and point to your Docker IP (if docker with open-webui is running on the same computer as NGINX manager, this will be the same IP as earlier (example: `192.168.0.6`)

  * Select the SSL certificate generated earlier, force SSL, and enable HTTP/2.




Critical: Configure CORS for WebSocket Connections

A very common and difficult-to-debug issue with WebSocket connections is a misconfigured Cross-Origin Resource Sharing (CORS) policy. When running Open WebUI behind a reverse proxy like Nginx Proxy Manager, you **must** set the `CORS_ALLOW_ORIGIN` environment variable in your Open WebUI configuration.

Failure to do so will cause WebSocket connections to fail, even if you have enabled "Websockets support" in Nginx Proxy Manager.

Critical: Disable Proxy Buffering for Streaming

**This is the most common cause of garbled markdown and broken streaming responses.**

In Nginx Proxy Manager, go to your proxy host → **Advanced** tab → and add these directives to the **Custom Nginx Configuration** field:
    
    
    proxy_buffering off;  
    proxy_cache off;  
    

Without this, Nginx re-chunks SSE streams, breaking markdown formatting (visible `##`, `**`, missing words). This also makes streaming responses significantly faster.

Caching Best Practice

While Nginx Proxy Manager handles most configuration automatically, be aware that:

  * **Static assets** (CSS, JS, images) are cached by default for better performance
  * **Authentication endpoints** should never be cached
  * If you add custom caching rules in NPM's "Advanced" tab, ensure you exclude paths like `/api/`, `/auth/`, `/signup/` , `/signin/`, `/sso/`, `/admin/`, `/signout/`, `/oauth/`, `/login/`, and `/logout/`



The default NPM configuration handles this correctly - only modify caching if you know what you're doing.

**Example:** If you access your UI at `https://openwebui.hello.duckdns.org`, you must set:
    
    
    CORS_ALLOW_ORIGIN="https://openwebui.hello.duckdns.org"  
    

You can also provide a semicolon-separated list of allowed domains. **Do not skip this step.**

:::

  6. **Add your url to open-webui (otherwise getting HTTPS error):**


  * Go to your open-webui → Admin Panel → Settings → General
  * In the **Webhook URL** text field, enter your URL through which you will connect to your open-webui via Nginx reverse proxy. Example: `hello.duckdns.org` (not essential with this one) or `openwebui.hello.duckdns.org` (essential with this one).



#### Access the WebUI​

Access Open WebUI via HTTPS at either `hello.duckdns.org` or `openwebui.hello.duckdns.org` (in whatever way you set it up).

note

Firewall Note: Be aware that local firewall software (like Portmaster) might block internal Docker network traffic or required ports. If you experience issues, check your firewall rules to ensure necessary communication for this setup is allowed.

### Let's Encrypt​

Let's Encrypt provides free SSL certificates trusted by most browsers, ideal for securing your production environment. 🔐

This guide uses a two-phase approach:

  1. **Phase 1:** Temporarily run Nginx to prove you own the domain and get a certificate from Let's Encrypt.
  2. **Phase 2:** Reconfigure Nginx to use the new certificate for a secure HTTPS connection.



#### Prerequisites​

  * A **domain name** (e.g., `my-webui.com`) with a **DNS`A` record** pointing to your server's public IP address.
  * **Docker** and **Docker Compose** installed on your server.
  * Basic understanding of running commands in a terminal.



info

**Heads up!** Let's Encrypt **cannot** issue certificates for an IP address. You **must** use a domain name.

* * *

### Step 1: Initial Setup for Certificate Validation​

First, we'll set up the necessary files and a temporary Nginx configuration that allows Let's Encrypt's servers to verify your domain.

  1. **Make sure you followed thePrerequisites above.**

  2. **Create the Directory Structure**

From your project's root directory, run this command to create folders for your Nginx configuration and Let's Encrypt certificates:
         
         mkdir -p nginx/conf.d ssl/certbot/conf ssl/certbot/www  
         

  3. **Create a Temporary Nginx Configuration**

Create the file `nginx/conf.d/open-webui.conf`. This initial config only listens on port 80 and serves the validation files for Certbot.

⚠️ **Remember to replace`<YOUR_DOMAIN_NAME>`** with your actual domain.
         
         # nginx/conf.d/open-webui.conf  
           
         server {  
             listen 80;  
             listen [::]:80;  
             server_name <YOUR_DOMAIN_NAME>;  
           
             # Route for Let's Encrypt validation challenges  
             location /.well-known/acme-challenge/ {  
                 root /var/www/certbot;  
             }  
           
             # All other requests will be ignored for now  
             location / {  
                 return 404;  
             }  
         }  
         

  4. **Update Your`docker-compose.yml`**

Add the `nginx` service to your `docker-compose.yml` and ensure your `open-webui` service is configured to use the shared Docker network.
         
         services:  
           nginx:  
             image: nginx:alpine  
             restart: always  
             ports:  
               # Expose HTTP and HTTPS ports to the host machine  
               - "80:80"  
               - "443:443"  
             volumes:  
               # Mount Nginx configs and SSL certificate data  
               - ./nginx/conf.d:/etc/nginx/conf.d  
               - ./ssl/certbot/conf:/etc/letsencrypt  
               - ./ssl/certbot/www:/var/www/certbot  
             depends_on:  
               - open-webui  
             networks:  
               - open-webui-network  
           
           open-webui:  
             # Your existing open-webui configuration...  
             # ...  
             # Ensure it's on the same network  
             networks:  
               - open-webui-network  
             # Expose the port internally to the Docker network.  
             # You do NOT need to publish it to the host (e.g., no `ports` section is needed here).  
             expose:  
               - 8080  
           
         networks:  
             open-webui-network:  
                 driver: bridge  
         




* * *

### Step 2: Obtain the SSL Certificate​

Now we'll run a script that uses Docker to fetch the certificate.

  1. **Create the Certificate Request Script**

Create an executable script named `enable_letsencrypt.sh` in your project root.

⚠️ **Remember to replace`<YOUR_DOMAIN_NAME>` and `<YOUR_EMAIL_ADDRESS>`** with your actual information.
         
         #!/bin/bash  
         # enable_letsencrypt.sh  
           
         DOMAIN="<YOUR_DOMAIN_NAME>"  
         EMAIL="<YOUR_EMAIL_ADDRESS>"  
           
         echo "### Obtaining SSL certificate for $DOMAIN ###"  
           
         # Start Nginx to serve the challenge  
         docker compose up -d nginx  
           
         # Run Certbot in a container to get the certificate  
         docker run --rm \  
           -v "./ssl/certbot/conf:/etc/letsencrypt" \  
           -v "./ssl/certbot/www:/var/www/certbot" \  
           certbot/certbot certonly \  
           --webroot \  
           --webroot-path=/var/www/certbot \  
           --email "$EMAIL" \  
           --agree-tos \  
           --no-eff-email \  
           --force-renewal \  
           -d "$DOMAIN"  
           
         if [[ $? != 0 ]]; then  
             echo "Error: Failed to obtain SSL certificate."  
             docker compose stop nginx  
             exit 1  
         fi  
           
         # Stop Nginx before we apply the final config  
         docker compose stop nginx  
         echo "### Certificate obtained successfully! ###"  
         

  2. **Make the Script Executable**
         
         chmod +x enable_letsencrypt.sh  
         

  3. **Run the Script**

Execute the script. It will automatically start Nginx, request the certificate, and then stop Nginx.
         
         ./enable_letsencrypt.sh  
         




* * *

### Important: Caching Configuration​

When using NGINX with Open WebUI, proper caching is crucial for performance while ensuring authentication remains secure. The configuration below includes:

  * **Cached** : Static assets (CSS, JS, fonts, images) for better performance
  * **Not Cached** : Authentication endpoints, API calls, SSO/OAuth callbacks, and session data
  * **Result** : Faster page loads without breaking login functionality



The configuration below implements these rules automatically.

### Step 3: Finalize Nginx Configuration for HTTPS​

With the certificate saved in your `ssl` directory, you can now update the Nginx configuration to enable HTTPS.

  1. **Update the Nginx Configuration for SSL**

**Replace the entire contents** of `nginx/conf.d/open-webui.conf` with the final configuration below.

⚠️ **Replace all 4 instances of`<YOUR_DOMAIN_NAME>`** with your domain.
         
         # nginx/conf.d/open-webui.conf  
           
         # Redirect all HTTP traffic to HTTPS  
         server {  
             listen 80;  
             listen [::]:80;  
             server_name <YOUR_DOMAIN_NAME>;  
           
             location /.well-known/acme-challenge/ {  
                 root /var/www/certbot;  
             }  
           
             location / {  
                 return 301 https://$host$request_uri;  
             }  
         }  
           
         server {  
             listen 443 ssl;  
             listen [::]:443 ssl;  
             http2 on;  
             server_name <YOUR_DOMAIN_NAME>;  
           
             ssl_certificate /etc/letsencrypt/live/<YOUR_DOMAIN_NAME>/fullchain.pem;  
             ssl_certificate_key /etc/letsencrypt/live/<YOUR_DOMAIN_NAME>/privkey.pem;  
           
             ssl_protocols TLSv1.2 TLSv1.3;  
             ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256';  
             ssl_prefer_server_ciphers off;  
           
             location ~* ^/(auth|api|oauth|admin|signin|signup|signout|login|logout|sso)/ {  
                 proxy_pass http://open-webui:8080;  
                 proxy_http_version 1.1;  
                 proxy_set_header Upgrade $http_upgrade;  
                 proxy_set_header Connection "upgrade";  
                 proxy_set_header Host $host;  
                 proxy_set_header X-Real-IP $remote_addr;  
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                 proxy_set_header X-Forwarded-Proto $scheme;  
                 proxy_read_timeout 10m;  
                 proxy_buffering off;  
                 proxy_cache off;  
                 client_max_body_size 20M;  
           
                 proxy_no_cache 1;  
                 proxy_cache_bypass 1;  
                 add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;  
                 add_header Pragma "no-cache" always;  
                 expires -1;  
             }  
           
             location ~* \.(css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {  
                 proxy_pass http://open-webui:8080;  
                 proxy_http_version 1.1;  
                 proxy_set_header Host $host;  
                 proxy_set_header X-Real-IP $remote_addr;  
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                 proxy_set_header X-Forwarded-Proto $scheme;  
           
                 # Cache static assets for 7 days  
                 expires 7d;  
                 add_header Cache-Control "public, immutable";  
             }  
           
             location / {  
                 proxy_pass http://open-webui:8080;  
                 proxy_http_version 1.1;  
                 proxy_set_header Upgrade $http_upgrade;  
                 proxy_set_header Connection "upgrade";  
                 proxy_set_header Host $host;  
                 proxy_set_header X-Real-IP $remote_addr;  
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                 proxy_set_header X-Forwarded-Proto $scheme;  
                 proxy_read_timeout 10m;  
                 proxy_buffering off;  
                 proxy_cache off;  
                 client_max_body_size 20M;  
           
                 add_header Cache-Control "public, max-age=300, must-revalidate";  
             }  
         }  
         

  2. **Launch All Services**

Start both Nginx and Open WebUI with the final, secure configuration.
         
         docker compose up -d  
         




* * *

### Step 4: Access Your Secure WebUI​

You can now access your Open WebUI instance securely via HTTPS.

➡️ **`https://<YOUR_DOMAIN_NAME>`**

* * *

### (Optional) Step 5: Setting Up Automatic Renewal​

Let's Encrypt certificates expire every 90 days. You should set up a `cron` job to renew them automatically.

  1. Open the crontab editor:
         
         sudo crontab -e  
         

  2. Add the following line to run a renewal check every day at 3:30 AM. It will only renew if the certificate is close to expiring.
         
         30 3 * * * /usr/bin/docker run --rm -v "<absolute_path>/ssl/certbot/conf:/etc/letsencrypt" -v "<absolute_path>/ssl/certbot/www:/var/www/certbot" certbot/certbot renew --quiet --webroot --webroot-path=/var/www/certbot --deploy-hook "/usr/bin/docker compose -f <absolute_path>/docker-compose.yml restart nginx"  
         




### Self-Signed Certificate​

Using self-signed certificates is suitable for development or internal use where trust is not a critical concern.

#### Self-Signed Certificate Steps​

  1. **Create Directories for Nginx Files:**
         
         mkdir -p conf.d ssl  
         

  2. **Create Nginx Configuration File:**

**`conf.d/open-webui.conf`:**
         
         server {  
             listen 443 ssl;  
             server_name your_domain_or_IP;  
           
             ssl_certificate /etc/nginx/ssl/nginx.crt;  
             ssl_certificate_key /etc/nginx/ssl/nginx.key;  
             ssl_protocols TLSv1.2 TLSv1.3;  
           
             location ~* ^/(auth|api|oauth|admin|signin|signup|signout|login|logout|sso)/ {  
                 proxy_pass http://host.docker.internal:3000;  
           
                 proxy_http_version 1.1;  
                 proxy_set_header Upgrade $http_upgrade;  
                 proxy_set_header Connection "upgrade";  
           
                 proxy_set_header Host $host;  
                 proxy_set_header X-Real-IP $remote_addr;  
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                 proxy_set_header X-Forwarded-Proto $scheme;  
           
                 proxy_buffering off;  
                 proxy_cache off;  
                 client_max_body_size 20M;  
                 proxy_read_timeout 10m;  
           
                 # Disable caching for auth endpoints  
                 proxy_no_cache 1;  
                 proxy_cache_bypass 1;  
                 add_header Cache-Control "no-store, no-cache, must-revalidate" always;  
                 expires -1;  
             }  
           
             location ~* \.(css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {  
                 proxy_pass http://host.docker.internal:3000;  
                 proxy_http_version 1.1;  
                 proxy_set_header Host $host;  
           
                 expires 7d;  
                 add_header Cache-Control "public, immutable";  
             }  
           
             location / {  
                 proxy_pass http://host.docker.internal:3000;  
           
                 proxy_http_version 1.1;  
                 proxy_set_header Upgrade $http_upgrade;  
                 proxy_set_header Connection "upgrade";  
           
                 proxy_set_header Host $host;  
                 proxy_set_header X-Real-IP $remote_addr;  
                 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                 proxy_set_header X-Forwarded-Proto $scheme;  
           
                 proxy_buffering off;  
                 proxy_cache off;  
           
                 client_max_body_size 20M;  
                 proxy_read_timeout 10m;  
           
                 add_header Cache-Control "public, max-age=300, must-revalidate";  
             }  
         }  
         

  3. **Generate Self-Signed SSL Certificates:**
         
         openssl req -x509 -nodes -days 365 -newkey rsa:2048 \  
         -keyout ssl/nginx.key \  
         -out ssl/nginx.crt \  
         -subj "/CN=your_domain_or_IP"  
         

  4. **Update Docker Compose Configuration:**

Add the Nginx service to your `docker-compose.yml`:
         
         services:  
           nginx:  
             image: nginx:alpine  
             ports:  
               - "443:443"  
             volumes:  
               - ./conf.d:/etc/nginx/conf.d  
               - ./ssl:/etc/nginx/ssl  
             depends_on:  
               - open-webui  
         

  5. **Start Nginx Service:**
         
         docker compose up -d nginx  
         




#### Access the WebUI​

Access Open WebUI via HTTPS at:

<https://your_domain_or_IP>

* * *

### Using a Self-Signed Certificate and Nginx on Windows without Docker​

For basic internal/development installations, you can use nginx and a self-signed certificate to proxy Open WebUI to https, allowing use of features such as microphone input over LAN. (By default, most browsers will not allow microphone input on insecure non-localhost urls)

This guide assumes you installed Open WebUI using pip and are running `open-webui serve`

#### Step 1: Installing openssl for certificate generation​

You will first need to install openssl

You can download and install precompiled binaries from the [Shining Light Productions (SLP)](https://slproweb.com/) website.

Alternatively, if you have [Chocolatey](https://chocolatey.org/) installed, you can use it to install OpenSSL quickly:

  1. Open a command prompt or PowerShell.

  2. Run the following command to install OpenSSL:
         
         choco install openssl -y  
         




* * *

### **Verify Installation**​

After installation, open a command prompt and type:
    
    
    openssl version  
    

If it displays the OpenSSL version (e.g., `OpenSSL 3.x.x ...`), it is installed correctly.

#### Step 2: Installing nginx​

Download the official Nginx for Windows from [nginx.org](https://nginx.org) or use a package manager like Chocolatey. Extract the downloaded ZIP file to a directory (e.g., C:\nginx).

#### Step 3: Generate certificate​

Run the following command:
    
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx.key -out nginx.crt  
    

Move the generated nginx.key and nginx.crt files to a folder of your choice, or to the C:\nginx directory

#### Step 4: Configure nginx​

Open C:\nginx\conf\nginx.conf in a text editor

If you want Open WebUI to be accessible over your local LAN, be sure to note your LAN ip address using `ipconfig` e.g., 192.168.1.15

Set it up as follows:
    
    
      
    #user  nobody;  
    worker_processes  1;  
      
    #error_log  logs/error.log;  
      
    #error_log  logs/error.log  notice;  
      
    #error_log  logs/error.log  info;  
      
    #pid        logs/nginx.pid;  
      
    events {  
        worker_connections  1024;  
    }  
      
    http {  
        include       mime.types;  
        default_type  application/octet-stream;  
      
        sendfile        on;  
        keepalive_timeout  120;  
      
        map $http_upgrade $connection_upgrade {  
            default upgrade;  
            ''      close;  
        }  
      
        server {  
            listen 80;  
            server_name 192.168.1.15;  
      
            return 301 https://$host$request_uri;  
        }  
      
        server {  
            listen 443 ssl;  
            server_name 192.168.1.15;  
      
            ssl_certificate C:\\nginx\\nginx.crt;  
            ssl_certificate_key C:\\nginx\\nginx.key;  
            ssl_protocols TLSv1.2 TLSv1.3;  
            ssl_ciphers ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;  
            ssl_prefer_server_ciphers on;  
      
            location ~* ^/(auth|api|oauth|admin|signin|signup|signout|login|logout|sso)/ {  
                proxy_pass http://localhost:8080;  
      
                proxy_http_version 1.1;  
                proxy_set_header Upgrade $http_upgrade;  
                proxy_set_header Connection $connection_upgrade;  
      
                proxy_set_header Host $host;  
                proxy_set_header X-Real-IP $remote_addr;  
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                proxy_set_header X-Forwarded-Proto $scheme;  
      
                proxy_buffering off;  
                proxy_cache off;  
                client_max_body_size 20M;  
                proxy_read_timeout 10m;  
      
                add_header Cache-Control "no-store, no-cache, must-revalidate" always;  
                expires -1;  
            }  
      
            location ~* \.(css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {  
                proxy_pass http://localhost:8080;  
                proxy_http_version 1.1;  
                proxy_set_header Host $host;  
                  
                expires 7d;  
                add_header Cache-Control "public, immutable";  
            }  
      
            location / {  
                proxy_pass http://localhost:8080;  
      
                proxy_http_version 1.1;  
                proxy_set_header Upgrade $http_upgrade;  
                proxy_set_header Connection $connection_upgrade;  
      
                proxy_set_header Host $host;  
                proxy_set_header X-Real-IP $remote_addr;  
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
                proxy_set_header X-Forwarded-Proto $scheme;  
      
                proxy_buffering off;  
                proxy_cache off;  
                client_max_body_size 20M;  
                proxy_read_timeout 10m;  
      
                add_header Cache-Control "public, max-age=300, must-revalidate";  
            }  
        }  
    }  
    

Save the file, and check the configuration has no errors or syntax issues by running `nginx -t`. You may need to `cd C:\nginx` first depending on how you installed it

Run nginx by running `nginx`. If an nginx service is already started, you can reload new config by running `nginx -s reload`

* * *

You should now be able to access Open WebUI on <https://192.168.1.15> (or your own LAN ip as appropriate). Be sure to allow windows firewall access as needed.

## Next Steps​

After setting up HTTPS, access Open WebUI securely at:

  * <https://localhost>



Ensure that your DNS records are correctly configured if you're using a domain name. For production environments, it's recommended to use Let's Encrypt for trusted SSL certificates.

* * *

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/https/nginx.md)

[PreviousHTTPS](/category/https)[NextHTTPS using HAProxy](/tutorials/https/haproxy)

  * HTTP/2 and WebSockets
  * Nginx Proxy Manager
  * Let's Encrypt
  * Step 1: Initial Setup for Certificate Validation
  * Step 2: Obtain the SSL Certificate
  * Important: Caching Configuration
  * Step 3: Finalize Nginx Configuration for HTTPS
  * Step 4: Access Your Secure WebUI
  * (Optional) Step 5: Setting Up Automatic Renewal
  * Self-Signed Certificate
  * Using a Self-Signed Certificate and Nginx on Windows without Docker
  * **Verify Installation**
  * Next Steps


