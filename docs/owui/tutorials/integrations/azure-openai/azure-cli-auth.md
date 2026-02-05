# https://docs.openwebui.com/tutorials/integrations/azure-openai/azure-cli-auth

  * [](/)
  * [🎓 Tutorials](/category/-tutorials)
  * [Integrations](/category/integrations)
  * [Azure OpenAI with EntraID](/tutorials/integrations/azure-openai/)
  * Azure CLI Authentication



On this page

# Azure CLI Authentication

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

This guide explains how to configure Open WebUI to authenticate with Azure OpenAI using Azure CLI and Entra ID authentication.

## Prerequisites​

  * **Azure CLI** : Install from [Microsoft Learn](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
  * **Open WebUI** : Version 0.6.30 or later
  * **Azure Subscription** : With access to Azure OpenAI resources
  * **RBAC Role** : Your user or group must have the `Cognitive Services OpenAI User` role assigned to your Azure OpenAI instance



## Authentication Steps​

### 1\. Login with Azure CLI​

Run the following command to authenticate with your Azure subscription:
    
    
    az login  
    

This will open a browser window for you to log in with your Azure credentials.

### 2\. Verify RBAC Permissions​

Ensure your user account or group has been assigned the `Cognitive Services OpenAI User` role for your Azure OpenAI resource. You can verify this in the Azure Portal:

  1. Navigate to your Azure OpenAI resource
  2. Go to **Access control (IAM)**
  3. Check **Role assignments** to confirm you have the required role



## Docker Configuration​

### Dockerfile​

Create or modify your Dockerfile to include Azure CLI:

Dockerfile
    
    
    FROM --platform=$BUILDPLATFORM ghcr.io/open-webui/open-webui:${WEBUI_DOCKER_TAG-main}  
    RUN pip install azure-cli  
    CMD [ "bash", "start.sh"]  
    

### Docker Compose​

Configure your `docker-compose.yml` to mount the Azure CLI configuration and set the appropriate environment variable:

docker-compose.yml
    
    
    services:  
      ollama:  
        volumes:  
          - ollama:/root/.ollama  
        container_name: ollama  
        pull_policy: always  
        tty: true  
        restart: unless-stopped  
        image: ollama/ollama:${OLLAMA_DOCKER_TAG-latest}  
      
      open-webui:  
        build:  
          context: .  
          args:  
            OLLAMA_BASE_URL: '/ollama'  
          dockerfile: Dockerfile  
        container_name: open-webui  
        volumes:  
          - open-webui:/app/backend/data  
          - ${HOME}/.azure:/app/.azure # THIS IS THE IMPORTANT BIT, FOR WINDOWS REPLACE ${HOME}/.azure with %USERPROFILE%\.azure*  
        depends_on:  
          - ollama  
        ports:  
          - ${OPEN_WEBUI_PORT-3000}:8080  
        environment:  
          - 'OLLAMA_BASE_URL=http://ollama:11434/'  
          - AZURE_CONFIG_DIR=/app/.azure # THIS IS THE IMPORTANT BIT*  
          - 'WEBUI_SECRET_KEY='  
        extra_hosts:  
          - host.docker.internal:host-gateway  
        restart: unless-stopped  
      
    volumes:  
      ollama: {}  
      open-webui: {}  
    

This configuration:

  * Mounts your local Azure CLI credentials (`~/.azure` on linux, or `%USERPROFILE%\.azure` on windows) into the container
  * Sets the `AZURE_CONFIG_DIR` environment variable so Open WebUI can locate the credentials



### Start the compose stack​

Start the docker compose services using:
    
    
    docker compose up  
    

### UI Configuration​

Once your Docker container is running:

  1. Navigate to **Admin Panel** → **Connections**
  2. Click **Add Connection**
  3. Select **Azure OpenAI** as the provider
  4. Choose **Entra ID** as the authentication type
  5. Configure your Azure OpenAI endpoint and deployment details
  6. Save the connection



## Troubleshooting​

If you encounter authentication issues:

  1. **Verify Azure CLI login** : Run `az account show` to confirm you're logged in
  2. **Check permissions** : Ensure the `Cognitive Services OpenAI User` role is assigned
  3. **Volume mounting** : Verify the `.azure` directory is correctly mounted in the container
  4. **Environment variable** : Confirm `AZURE_CONFIG_DIR` is set to `/app/.azure`



[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/integrations/azure-openai/azure-cli-auth.mdx)

[PreviousAzure OpenAI with EntraID](/tutorials/integrations/azure-openai/)[NextWorkload Identity Authentication](/tutorials/integrations/azure-openai/workload-identity-auth)

  * Prerequisites
  * Authentication Steps
    * 1\. Login with Azure CLI
    * 2\. Verify RBAC Permissions
  * Docker Configuration
    * Dockerfile
    * Docker Compose
    * Start the compose stack
    * UI Configuration
  * Troubleshooting


