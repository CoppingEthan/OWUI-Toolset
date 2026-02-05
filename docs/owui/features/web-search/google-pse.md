# https://docs.openwebui.com/features/web-search/google-pse

  * [](/)
  * [⭐ Features](/features/)
  * [Web Search](/category/web-search)
  * Google PSE



On this page

# Google PSE

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

tip

For a comprehensive list of all environment variables related to Web Search (including concurrency settings, result counts, and more), please refer to the [Environment Configuration documentation](/getting-started/env-configuration#web-search).

Troubleshooting

Having issues with web search? Check out the [Web Search Troubleshooting Guide](/troubleshooting/web-search) for solutions to common problems like proxy configuration, connection timeouts, and empty content.

## Google PSE API​

### Setup​

  1. Go to Google Developers, use [Programmable Search Engine](https://developers.google.com/custom-search), and log on or create account.
  2. Go to [control panel](https://programmablesearchengine.google.com/controlpanel/all) and click `Add` button
  3. Enter a search engine name, set the other properties to suit your needs, verify you're not a robot and click `Create` button.
  4. Generate `API key` and get the `Search engine ID`. (Available after the engine is created)
  5. With `API key` and `Search engine ID`, open `Open WebUI Admin panel` and click `Settings` tab, and then click `Web Search`
  6. Enable `Web search` and Set `Web Search Engine` to `google_pse`
  7. Fill `Google PSE API Key` with the `API key` and `Google PSE Engine Id` (# 4)
  8. Click `Save`



![Open WebUI Admin panel](/assets/images/tutorial_google_pse1-94ef7e085e91377d88e015463a786162.png)

#### Note​

You have to enable `Web search` in the prompt field, using plus (`+`) button. Search the web ;-)

![enable Web search](/assets/images/tutorial_google_pse2-141dd0c9eb65b65ed2d05b5dfb18b1ca.png)

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/web-search/google-pse.md)

[PreviousExa AI](/features/web-search/exa)[NextJina](/features/web-search/jina)

  * Google PSE API
    * Setup


