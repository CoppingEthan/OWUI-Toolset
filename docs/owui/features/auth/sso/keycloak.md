# https://docs.openwebui.com/features/auth/sso/keycloak

  * [](/)
  * [⭐ Features](/features/)
  * [Federated Authentication](/category/federated-authentication)
  * [SSO (OAuth, OIDC, Trusted Header)](/features/auth/sso/)
  * Keycloak



On this page

# Keycloak

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

This guide explains how to integrate Open WebUI with Keycloak for OIDC Single Sign-On (SSO).

## 1\. Environment Preparation and Port Change​

### Open WebUI Server Port​

  * **Default Port** : `8080`



### Keycloak Port Conflict Issue​

Keycloak also uses port `8080` by default, which causes a conflict. Change the Keycloak port to `9090`.
    
    
    bin/kc.sh start-dev --http-port=9090  
    

## 2\. Create a Keycloak Realm​

  1. Open your browser and go to `http://localhost:9090`. Create an administrator account.
  2. Log in to the admin console at `http://localhost:9090/admin`.
  3. From the realm dropdown at the top, click **Add realm**.
  4. Enter `openwebui` as the **Realm name** and click **Create**.



![create-realm](/assets/images/create-realm-de05af13ff3f50bf97a21a4636a5eb32.png)

## 3\. Create an OpenID Connect Client​

info

Make sure you have selected the `openwebui` realm. The default is `master`.

![select-realm](/assets/images/select-realm-a61522295d900bbc7f5132dd236f4983.png)

  1. Ensure the `openwebui` realm you just created is selected.
  2. In the left menu, click **Clients** → **Create client**.
  3. Set **Client ID** to `open-webui`.
  4. Keep **Client protocol** as `openid-connect`.
  5. Set **Access Type** to `confidential` and click **Save**.



![access-setting-client](/assets/images/access-setting-client-7c5bcaf414bff922b07d9758b01d8c68.png)

## 4\. Enable Client Authentication and Get Credentials​

By default, Keycloak 26.x sets Client Authentication to "None", so it needs to be configured manually.

  1. Go to **Clients** → **open-webui** → **Settings**.
  2. Check the **Client Authenticator** dropdown.
  3. Change "None" to **Client ID and secret** and click **Save**.
  4. Click the **Advanced** tab.
  5. In the **Client authentication** section, click **Reveal secret** and copy the secret.
  6. Paste this secret into the `OAUTH_CLIENT_SECRET` variable in your `.env` file.



## 5\. Create a Test User​

  1. In the left menu, go to **Users** → **Add user**.
  2. Fill in the **Username** , **Email** , etc., and click **Save**.
  3. Click on the newly created user, then go to the **Credentials** tab.
  4. Enter a new password, uncheck **Temporary** , and click **Set Password**.
     * _Example: Username`testuser`, Password `Test1234!`_



## 6\. Configure Open WebUI .env​

Add or modify the following variables in your `.env` file.
    
    
      
    # Enable OAuth2/OIDC Login  
    ENABLE_OAUTH_SIGNUP=true  
      
    # Keycloak Client Information  
    OAUTH_CLIENT_ID=open-webui  
    OAUTH_CLIENT_SECRET=<YOUR_COPIED_SECRET>  
      
    # OIDC Discovery Document URL  
    OPENID_PROVIDER_URL=http://localhost:9090/realms/openwebui/.well-known/openid-configuration  
      
    # (Optional) SSO Button Label  
    OAUTH_PROVIDER_NAME=Keycloak  
      
    # (Optional) OAuth Callback URL  
    OPENID_REDIRECT_URI=http://localhost:8080/oauth/oidc/callback  
    

**Restart the Open WebUI server after modifying the`.env` file.**

## 7\. HTTP vs. HTTPS​

  * **HTTP (Development/Test)** :
    * Scheme: `http://`
    * Example: `http://localhost:9090`
  * **HTTPS (Production Recommended)** :
    * Requires Keycloak TLS setup or a reverse proxy with SSL termination.
    
    bin/kc.sh start --https-port=9090 \  
      --https-key-store=keystore.jks \  
      --https-key-store-password=<password>  
    




## 8\. Test the Integration​

  1. Go to `http://localhost:8080`. You should see a "Continue with Keycloak" button.
  2. Click the button. You should be redirected to the Keycloak login page.
  3. Log in with `testuser` / `Test1234!`. You should be successfully redirected back to Open WebUI.



## 9\. Configure Keycloak Group Mapping​

### 9.1. Overview​

By default, Keycloak clients do not include group information in tokens. Follow these steps to pass group information.

### 9.2. Locate Mapper Creation​

  1. Go to the Keycloak Admin Console: `http://localhost:9090/admin`.

  2. Select the `openwebui` realm.

  3. Navigate to **Clients** and select the `open-webui` client.

  4. Go to the **Client scopes** tab.

  5. Select the scope that will contain the group information (e.g., `profile` or `open-webui-dedicated`).

![scope-client](/assets/images/scope-client-f17eea13654c2bbad34085b833f0f1ec.png)

  6. In the selected scope's details, go to the **Mappers** tab.




### 9.3. Create Mapper​

Click **Create** or **Add builtin** to start creating a new mapper.

### 9.4. Mapper Settings​

Configure the mapper with the appropriate settings to include group membership.

![mappers-setting-group-client](/assets/images/mappers-setting-group-client-67d1aad2d0859ae6cc47a525e58f1e35.png)

### 9.5. Save and Apply​

  * **Save** the mapper configuration.
  * **Restart** the Open WebUI server to apply the changes.



### 9.6. Configure Open WebUI Environment Variables​

Add or modify these variables in your `.env` file:
    
    
      
    # Enable group synchronization  
    ENABLE_OAUTH_GROUP_MANAGEMENT=true  
      
    # (Optional) Enable Just-In-Time group creation  
    ENABLE_OAUTH_GROUP_CREATION=true  
      
    # The claim key for groups in the token  
    OAUTH_GROUP_CLAIM=groups  
    

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/auth/sso/keycloak.mdx)

[PreviousSSO (OAuth, OIDC, Trusted Header)](/features/auth/sso/)[NextLDAP Authentication](/features/auth/ldap)

  * 1\. Environment Preparation and Port Change
    * Open WebUI Server Port
    * Keycloak Port Conflict Issue
  * 2\. Create a Keycloak Realm
  * 3\. Create an OpenID Connect Client
  * 4\. Enable Client Authentication and Get Credentials
  * 5\. Create a Test User
  * 6\. Configure Open WebUI .env
  * 7\. HTTP vs. HTTPS
  * 8\. Test the Integration
  * 9\. Configure Keycloak Group Mapping
    * 9.1. Overview
    * 9.2. Locate Mapper Creation
    * 9.3. Create Mapper
    * 9.4. Mapper Settings
    * 9.5. Save and Apply
    * 9.6. Configure Open WebUI Environment Variables


