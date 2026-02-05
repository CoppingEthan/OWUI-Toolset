# https://docs.openwebui.com/features/web-search/searchapi

  * [](/)
  * [⭐ Features](/features/)
  * [Web Search](/category/web-search)
  * SearchApi



On this page

# SearchApi

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the contributing tutorial.

tip

For a comprehensive list of all environment variables related to Web Search (including concurrency settings, result counts, and more), please refer to the [Environment Configuration documentation](/getting-started/env-configuration#web-search).

Troubleshooting

Having issues with web search? Check out the [Web Search Troubleshooting Guide](/troubleshooting/web-search) for solutions to common problems like proxy configuration, connection timeouts, and empty content.

## SearchApi API​

[SearchApi](https://searchapi.io) is a collection of real-time SERP APIs. Any existing or upcoming SERP engine that returns `organic_results` is supported. The default web search engine is `google`, but it can be changed to `bing`, `baidu`, `google_news`, `bing_news`, `google_scholar`, `google_patents`, and others.

### Setup​

  1. Go to [SearchApi](https://searchapi.io), and log on or create a new account.
  2. Go to `Dashboard` and copy the API key.
  3. With `API key`, open `Open WebUI Admin panel` and click `Settings` tab, and then click `Web Search`.
  4. Enable `Web search` and set `Web Search Engine` to `searchapi`.
  5. Fill `SearchApi API Key` with the `API key` that you copied in step 2 from [SearchApi](https://www.searchapi.io/) dashboard.
  6. [Optional] Enter the `SearchApi engine` name you want to query. Example, `google`, `bing`, `baidu`, `google_news`, `bing_news`, `google_videos`, `google_scholar` and `google_patents.` By default, it is set to `google`.
  7. Click `Save`.



![Open WebUI Admin panel](/assets/images/tutorial_searchapi_search-22ed3f7aafe6863865286cfbd52db2ff.png)

#### Note​

You have to enable `Web search` in the prompt field, using plus (`+`) button to search the web using [SearchApi](https://www.searchapi.io/) engines.

![enable Web search](/assets/images/enable_web_search-3564ef982bd3e9306284e18448e56575.png)

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/web-search/searchapi.md)

[PreviousSave Search Results to Knowledge](/features/web-search/save-to-knowledge)[NextSearXNG](/features/web-search/searxng)

  * SearchApi API
    * Setup


