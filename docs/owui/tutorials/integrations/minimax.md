# https://docs.openwebui.com/tutorials/integrations/minimax

  * [](/)
  * [🎓 Tutorials](/category/-tutorials)
  * [Integrations](/category/integrations)
  * Integrate with MiniMax M2.1



On this page

# Integrate with MiniMax M2.1

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case.

* * *

# Integrating Open WebUI with MiniMax M2.1

MiniMax is a leading AI company providing high-performance coding-focused models. Their latest model, **MiniMax M2.1** , is specifically optimized for coding, reasoning, and multi-turn dialogue. This guide covers how to set up MiniMax via their cost-effective **Coding Plan** and integrate it into Open WebUI.

## Step 1: Subscribe to a MiniMax Coding Plan​

MiniMax offers a "Coding Plan" subscription which is significantly more cost-effective for high-frequency programming than standard pay-as-you-go models.

  1. Visit the [MiniMax Coding Plan Subscription page](https://platform.minimax.io/subscribe/coding-plan).
  2. Choose a plan that fits your needs (e.g., the **Starter** plan for $10/month).
  3. Complete the subscription process.



info

The **Starter** plan provides 100 "prompts" every 5 hours. One prompt is roughly equivalent to 15 requests, offering substantial value compared to token-based billing.

Source: [MiniMax Coding Plan Official Documentation](https://platform.minimax.io/docs/coding-plan/intro)

## Step 2: Obtain Your Coding Plan API Key​

Once subscribed, you need your specialized API Key.

  1. Navigate to the [Account/Coding Plan page](https://platform.minimax.io/user-center/payment/coding-plan).
  2. Click on **Reset & Copy** to generate and copy your API Key.
  3. Safely store this key in a password manager.



![MiniMax Platform API Usage](/assets/images/minimax-platform-api-usage-b8a113db212036ba047e4ca6980bc0e8.png)

info

This API Key is exclusive to the Coding Plan and is not interchangeable with standard pay-as-you-go API Keys.

## Step 3: Configure Connection in Open WebUI​

Now, link MiniMax to your Open WebUI instance.

  1. Open Open WebUI and navigate to the **Admin Panel** > **Settings** > **Connections**.
  2. Click the **+** (plus) icon under the **OpenAI API** section.
  3. Enter the following details:
     * **API Base URL** : `https://api.minimax.io/v1`
     * **API Key** : `YOUR_CODING_PLAN_API_KEY`
  4. **Important** : MiniMax does not expose models via a `/models` endpoint, so you must whitelist the model manually.
  5. In the **Model Whitelist** , type `MiniMax-M2.1` and click the **+** icon.
  6. Click **Verify Connection** (you should see a success alert).
  7. Click **Save** on the connection popup, then scroll down and click **Save** on the main Connections page.



![MiniMax Connection Setup 1](/assets/images/minimax-connection-1-c9d35c39bb6eb5c2946220c873de4c86.png) ![MiniMax Connection Setup 2](/assets/images/minimax-connection-2-23075707130596c5cf81b4440afd5ccb.png)

## Step 4: Start Chatting​

You are now ready to use MiniMax M2.1!

  1. Start a new chat.
  2. Select **MiniMax-M2.1** from the model dropdown menu.
  3. Send a message. Reasoning and thinking work by default without any additional configuration.



![MiniMax Chat interface](/assets/images/minimax-chat-cfaac55a6540ed701c06c258826d6295.png)

* * *

Enjoy using one of the best and most affordable coding-focused models! 🚀

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/integrations/minimax.md)

[PreviousIntegrate with Amazon Bedrock](/tutorials/integrations/amazon-bedrock)[NextIntegrate with OneDrive & SharePoint](/tutorials/integrations/onedrive-sharepoint)

  * Step 1: Subscribe to a MiniMax Coding Plan
  * Step 2: Obtain Your Coding Plan API Key
  * Step 3: Configure Connection in Open WebUI
  * Step 4: Start Chatting


