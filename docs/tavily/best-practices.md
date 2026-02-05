# SDK Reference

> Integrate Tavily's powerful APIs natively in your JavaScript/TypeScript projects.

## Instantiating a client

To interact with Tavily in JavaScript, you must instatiate a client with your API key. Our client is asynchronous by default.

Once you have instantiated a client, call one of our supported methods (detailed below) to access the API.

```javascript  theme={null}
const { tavily } = require("@tavily/core");

client = tavily({ apiKey: "tvly-YOUR_API_KEY" });
```

### Proxies

If you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.

Proxy configuration is available in both the synchronous and asynchronous clients.

```javascript  theme={null}
const { tavily } = require("@tavily/core");

const proxies = {
  http: "<your HTTP proxy>",
  https: "<your HTTPS proxy>",
};

client = tavily({ apiKey: "tvly-YOUR_API_KEY", proxies });
```

Alternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.

## Tavily Search

<Tip>
  **NEW!** Try our interactive [API
  Playground](https://app.tavily.com/playground) to see each parameter in
  action, and generate ready-to-use JavaScript snippets.
</Tip>

You can access Tavily Search in JavaScript through the client's `search` function.

### Parameters

| Parameter                  | Type                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Default     |
| :------------------------- | :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| `query` **(required)**     | `string`              | The query to run a search on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | —           |
| `auto_parameters`          | `boolean`             | When `auto_parameters` is enabled, Tavily automatically configures search parameters based on your query's content and intent. You can still set other parameters manually, and your explicit values will override the automatic ones. The parameters `include_answer`, `include_raw_content`, and `max_results` must always be set manually, as they directly affect response size. Note: `search_depth` may be automatically set to advanced when it's likely to improve results. This uses 2 API credits per request. To avoid the extra cost, you can explicitly set `search_depth` to `basic`. | `false`     |
| `searchDepth`              | `string`              | The depth of the search. It can be `"basic"` or `"advanced"`. `"advanced"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `"basic"` search provides generic content snippets from each source.                                                                                                                                                                                                                                                                                                                                               | `"basic"`   |
| `topic`                    | `string`              | The category of the search. Determines which agent will be used. Supported values are `"general"` , `"news"` and `"finance"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"general"` |
| `timeRange`                | `string`              | The time range back from the current date based on publish date or last updated date. Accepted values include `"day"`, `"week"`, `"month"`, `"year"` or shorthand values `"d"`, `"w"`, `"m"`, `"y"`.                                                                                                                                                                                                                                                                                                                                                                                                | —           |
| `startDate`                | `string`              | Will return all results after the specified start date based on publish date or last updated date. Required to be written in the format YYYY-MM-DD                                                                                                                                                                                                                                                                                                                                                                                                                                                  | —           |
| `endDate`                  | `string`              | Will return all results before the specified end date based on publish date or last updated date. Required to be written in the format YYYY-MM-DD.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | —           |
| `maxResults`               | `number`              | The maximum number of search results to return. It must be between `0` and `20`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `5`         |
| `chunksPerSource`          | `number`              | Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use `chunksPerSource` to define the maximum number of relevant chunks returned per source and to control the `content` length. Chunks will appear in the `content` field as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`. Available only when `searchDepth` is `"advanced"`.                                                                                                                                                                                                                       | `3`         |
| `includeImages`            | `boolean`             | Include a list of query-related images in the response.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `false`     |
| `includeImageDescriptions` | `boolean`             | Include a list of query-related images and their descriptions in the response.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `false`     |
| `includeAnswer`            | `boolean` or `string` | Include an answer to the query generated by an LLM based on search results. A `"basic"` (or `true`) answer is quick but less detailed; an `"advanced"` answer is more detailed.                                                                                                                                                                                                                                                                                                                                                                                                                     | `false`     |
| `includeRawContent`        | `boolean` or `string` | Include the cleaned and parsed HTML content of each search result. `"markdown"` or `True` returns search result content in markdown format. `"text"` returns the plain text from the results and may increase latency.                                                                                                                                                                                                                                                                                                                                                                              | `False`     |
| `includeDomains`           | `string[]`            | A list of domains to specifically include in the search results. Maximum 300 domains.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `[]`        |
| `excludeDomains`           | `string[]`            | A list of domains to specifically exclude from the search results. Maximum 150 domains.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `[]`        |
| `country`                  | `string`              | Boost search results from a specific country. This will prioritize content from the selected country in the search results. Available only if topic is `general`.                                                                                                                                                                                                                                                                                                                                                                                                                                   | —           |
| `timeout`                  | `number`              | A timeout to be used in requests to the Tavily API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `60`        |
| `includeFavicon`           | `boolean`             | Whether to include the favicon URL for each result.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `false`     |
| `includeUsage`             | `boolean`             | Whether to include credit usage information in the response.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `false`     |

### Response format

The response object you receive will be in the following format:

| Key                  | Type                          | Description                                                                                                                                                                          |
| :------------------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `results`            | `Result[]`                    | A list of sorted search results ranked by relevancy.                                                                                                                                 |
| `query`              | `string`                      | Your search query.                                                                                                                                                                   |
| `responseTime`       | `number`                      | Your search result response time.                                                                                                                                                    |
| `requestId`          | `string`                      | A unique request identifier you can share with customer support to help resolve issues with specific requests.                                                                       |
| `answer` (optional)  | `string`                      | The answer to your search query, generated by an LLM based on Tavily's search results. This is only available if `includeAnswer` is set to `true`.                                   |
| `images` (optional)  | `string[]` or `ImageResult[]` | This is only available if `includeImages` is set to `true`. A list of query-related image URLs. If `includeImageDescriptions` is set to `true`, each entry will be an `ImageResult`. |
| `favicon` (optional) | `string`                      | The favicon URL for the search result.                                                                                                                                               |

### Results

Each result in the `results` list will be in the following `Result` format:

| Key                        | Type     | Description                                                                                                                                             |
| :------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`                    | `string` | The title of the search result.                                                                                                                         |
| `url`                      | `string` | The URL of the search result.                                                                                                                           |
| `content`                  | `string` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |
| `score`                    | `float`  | The relevance score of the search result.                                                                                                               |
| `rawContent` (optional)    | `string` | The parsed and cleaned HTML content of the site. This is only available if `includeRawContent` is set to `true`.                                        |
| `publishedDate` (optional) | `string` | The publication date of the source. This is only available if the search `topic` is set to `news`.                                                      |
| `favicon` (optional)       | `string` | "The favicon URL for the result.                                                                                                                        |

#### Image Results

Each image in the `images` list will be in the following `ImageResult` format:

| Key                      | Type     | Description                                                                                                       |
| :----------------------- | :------- | :---------------------------------------------------------------------------------------------------------------- |
| `url`                    | `string` | The URL of the image.                                                                                             |
| `description` (optional) | `string` | This is only available if `includeImageDescriptions` is set to `true`. An LLM-generated description of the image. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```javascript  theme={null}
    const { tavily } = require("@tavily/core");

    // Step 1. Instantiating your Tavily client
    const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

    // Step 2. Executing a simple search query
    const response = await tvly.search("Who is Leo Messi?");

    // Step 3. That's it! You've done a Tavily Search!
    console.log(response);
    ```
  </Accordion>

  <Accordion title="Response">
    ```json  theme={null}
    {
      "query": "Who is Leo Messi?",
      "images": [
        {
          "url": "Image 1 URL",
          "description": "Image 1 Description"
        },
        {
          "url": "Image 2 URL",
          "description": "Image 2 Description"
        },
        {
          "url": "Image 3 URL",
          "description": "Image 3 Description"
        },
        {
          "url": "Image 4 URL",
          "description": "Image 4 Description"
        },
        {
          "url": "Image 5 URL",
          "description": "Image 5 Description"
        }
      ],
      "results": [
        {
          "title": "Source 1 Title",
          "url": "Source 1 URL",
          "content": "Source 1 Content",
          "score": 0.99,
          "favicon": "https://source1.com/favicon.ico"
        },
        {
          "title": "Source 2 Title",
          "url": "Source 2 URL",
          "content": "Source 2 Content",
          "score": 0.97,
          "favicon": "https://source2.com/favicon.ico"
        }
      ],
      "responseTime": 1.09,
      "requestId": "123e4567-e89b-12d3-a456-426614174111"
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Extract

You can access Tavily Extract in JavaScript through the client's `extract` function.

### Parameters

| Parameter             | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                        | Default      |
| :-------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| `urls` **(required)** | `string[]` | The URLs you want to extract. The list must not contain more than 20 URLs.                                                                                                                                                                                                                                                                                                                         | —            |
| `includeImages`       | `boolean`  | Include a list of images extracted from the URLs in the response.                                                                                                                                                                                                                                                                                                                                  | `false`      |
| `extractDepth`        | `string`   | The depth of the extraction process. You may experience higher latency with `"advanced"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `"basic"` extraction costs 1 API Credit per 5 successful URL extractions, while `"advanced"` extraction costs 2 API Credits per 5 successful URL extractions.                      | `"basic"`    |
| `format`              | `str`      | The format of the extracted web page content. `"markdown"` returns content in markdown format. `"text"` returns plain text and may increase latency.                                                                                                                                                                                                                                               | `"markdown"` |
| `timeout`             | `number`   | A timeout to be used in requests to the Tavily API.  Maximum time in seconds to wait for the URL extraction before timing out. Must be between 1.0 and 60.0 seconds. If not specified, default timeouts are applied based on extract\_depth: 10 seconds for basic extraction and 30 seconds for advanced extraction.                                                                               | `None`       |
| `includeFavicon`      | `boolean`  | Whether to include the favicon URL for each result.                                                                                                                                                                                                                                                                                                                                                | `false`      |
| `includeUsage`        | `boolean`  | Whether to include credit usage information in the response.`NOTE:`The value may be 0 if the total successful URL extractions has not yet reached 5 calls. See our [Credits & Pricing documentation](https://docs.tavily.com/documentation/api-credits) for details.                                                                                                                               | `false`      |
| `query`               | `string`   | User intent for reranking extracted content chunks. When provided, chunks are reranked based on relevance to this query.                                                                                                                                                                                                                                                                           | —            |
| `chunksPerSource`     | `number`   | Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use `chunksPerSource` to define the maximum number of relevant chunks returned per source and to control the `rawContent` length. Chunks will appear in the `rawContent` field as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`. Available only when `query` is provided. Must be between 1 and 5. | `3`          |

### Response format

The response object you receive will be in the following format:

| Key              | Type                 | Description                                                                                                    |
| :--------------- | :------------------- | :------------------------------------------------------------------------------------------------------------- |
| `results`        | `SuccessfulResult[]` | A list of extracted content.                                                                                   |
| `failed_results` | `FailedResult[]`     | A list of URLs that could not be processed.                                                                    |
| `response_time`  | `number`             | The search result response time.                                                                               |
| `requestId`      | `string`             | A unique request identifier you can share with customer support to help resolve issues with specific requests. |

#### Successful Results

Each successful result in the `results` list will be in the following `SuccessfulResult` format:

| Key                  | Type       | Description                                                                                                      |
| :------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------- |
| `url`                | `string`   | The URL of the webpage.                                                                                          |
| `raw_content`        | `string`   | The raw content extracted. When `query` is provided, contains the top-ranked chunks joined by `[...]` separator. |
| `images` (optional)  | `string[]` | This is only available if `includeImages` is set to `true`. A list of extracted image URLs.                      |
| `favicon` (optional) | `string`   | The favicon URL for the result.                                                                                  |

#### Failed Results

Each failed result in the `results` list will be in the following `FailedResult` format:

| Key     | Type     | Description                                                |
| :------ | :------- | :--------------------------------------------------------- |
| `url`   | `string` | The URL that failed.                                       |
| `error` | `string` | An error message describing why it could not be processed. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```python  theme={null}
    from tavily import TavilyClient

    # Step 1. Instantiating your TavilyClient
    tavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")

    # Step 2. Defining the list of URLs to extract content from
    urls = [
        "https://en.wikipedia.org/wiki/Artificial_intelligence",
        "https://en.wikipedia.org/wiki/Machine_learning",
        "https://en.wikipedia.org/wiki/Data_science",
    ]

    # Step 3. Executing the extract request
    response = tavily_client.extract(urls=urls, include_images=True)

    # Step 4. Printing the extracted raw content
    print(response)
    ```
  </Accordion>

  <Accordion title="Response">
    ```javascript  theme={null}
    {
      "results": [
        {
          "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
          "rawContent": "URL 1 raw content",
          "images": [
            "Image 1 URL",
            "Image 2 URL"
          ],
          "favicon": "https://en.wikipedia.org/favicon.ico"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Machine_learning",
          "rawContent": "URL 2 raw content",
          "images": [
            "Image 3 URL",
            "Image 4 URL"
          ],
          "favicon": "https://en.wikipedia.org/favicon.ico"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Data_science",
          "rawContent": "URL 3 raw content",
          "images": [
            "Image 5 URL",
            "Image 6 URL"
          ],
          "favicon": "https://en.wikipedia.org/favicon.ico"
        }
      ],
      "failedResults": [],
      "responseTime": 1.23,
      "requestId": "123e4567-e89b-12d3-a456-426614174111"
    }
    ```
  </Accordion>
</AccordionGroup>

## Tavily Crawl

You can access Tavily Crawl in JavaScript through the client's `crawl` function.

### Parameters

| Parameter            | Type       | Description                                                                                                                                                                                                                                                                                                                                               | Default      |
| :------------------- | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| `url` **(required)** | `string`   | The root URL to begin the crawl.                                                                                                                                                                                                                                                                                                                          | —            |
| `maxDepth`           | `number`   | Max depth of the crawl. Defines how far from the base URL the crawler can explore.                                                                                                                                                                                                                                                                        | `1`          |
| `maxBreadth`         | `number`   | Max number of links to follow **per level** of the tree (i.e., per page).                                                                                                                                                                                                                                                                                 | `20`         |
| `limit`              | `number`   | Total number of links the crawler will process before stopping.                                                                                                                                                                                                                                                                                           | `50`         |
| `instructions`       | `string`   | Natural language instructions for the crawler.                                                                                                                                                                                                                                                                                                            | —            |
| `selectPaths`        | `string[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `"/docs/.*"`, `"/api/v1.*"`).                                                                                                                                                                                                                                                   | `[]`         |
| `selectDomains`      | `string[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `"^docs\.example\.com$"`).                                                                                                                                                                                                                                                 | `[]`         |
| `excludePaths`       | `string[]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `"/admin/.*"`, `"/private/.*"`).                                                                                                                                                                                                                                                    | `[]`         |
| `excludeDomains`     | `string[]` | **Regex patterns** to exclude specific domains or subdomains from crawling (e.g., `"^admin\.example\.com$"`).                                                                                                                                                                                                                                             | `[]`         |
| `allowExternal`      | `boolean`  | Whether to return links from external domains in crawl output.                                                                                                                                                                                                                                                                                            | `true`       |
| `includeImages`      | `boolean`  | Whether to extract image URLs from the crawled pages.                                                                                                                                                                                                                                                                                                     | `false`      |
| `extractDepth`       | `string`   | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `"basic"` or `"advanced"`.                                                                                                                                                                                         | `"basic"`    |
| `format`             | `str`      | The format of the extracted web page content. `"markdown"` returns content in markdown format. `"text"` returns plain text and may increase latency.                                                                                                                                                                                                      | `"markdown"` |
| `timeout`            | `number`   | Maximum time in seconds to wait for the crawl operation before timing out. Must be between 10 and 150 seconds.                                                                                                                                                                                                                                            | `150`        |
| `includeFavicon`     | `boolean`  | Whether to include the favicon URL for each result.                                                                                                                                                                                                                                                                                                       | `false`      |
| `includeUsage`       | `boolean`  | Whether to include credit usage information in the response.`NOTE:`The value may be 0 if the total use of /extract and /map calls has not yet reached minimum needed. See our [Credits & Pricing documentation](https://docs.tavily.com/documentation/api-credits) for details.                                                                           | `false`      |
| `chunksPerSource`    | `number`   | Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use `chunksPerSource` to define the maximum number of relevant chunks returned per source and to control the `rawContent` length. Chunks will appear in the `rawContent` field as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`. Must be between 1 and 5. | `3`          |

### Response format

The response object you receive will be in the following format:

| Key            | Type       | Description                                                                                                    |
| :------------- | :--------- | :------------------------------------------------------------------------------------------------------------- |
| `baseUrl`      | `string`   | The URL you started the crawl from.                                                                            |
| `results`      | `Result[]` | A list of crawled pages.                                                                                       |
| `responseTime` | `number`   | The crawl response time.                                                                                       |
| `requestId`    | `string`   | A unique request identifier you can share with customer support to help resolve issues with specific requests. |

#### Results

Each successful result in the `results` list will be in the following `Result` format:

| Key                  | Type       | Description                         |
| :------------------- | :--------- | :---------------------------------- |
| `url`                | `string`   | The URL of the webpage.             |
| `rawContent`         | `string`   | The raw content extracted.          |
| `images`             | `string[]` | Image URLs extracted from the page. |
| `favicon` (optional) | `string`   | The favicon URL for the result.     |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```javascript  theme={null}
    const { tavily } = require("@tavily/core");

    // Step 1. Instantiating your Tavily client
    const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

    // Step 2. Defining the starting URL of the crawl
    const url = "https://docs.tavily.com";

    // Step 3. Executing the crawl with some guidance parameters
    const response = await client.crawl(url, { instructions: "Find all info on the Python SDK" });
      
    // Step 4. Printing the crawled results
    console.log(response);
    ```
  </Accordion>

  <Accordion title="Response">
    ````javascript  theme={null}
    {
      responseTime: 9.09,
      baseUrl: "https://docs.tavily.com",
      results: [
        {
          "url": "https://docs.tavily.com/sdk/python/reference",
          "raw_content": "SDK Reference - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\nPython\n\nSDK Reference\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\n- [API Playground](https://app.tavily.com/playground)\n- [Community](https://community.tavily.com)\n- [Blog](https://blog.tavily.com)\n\n##### Python\n\n- [Quickstart](/sdk/python/quick-start)\n- [SDK Reference](/sdk/python/reference)\n\n##### JavaScript\n\n- [Quickstart](/sdk/javascript/quick-start)\n- [SDK Reference](/sdk/javascript/reference)\n\nPython\n\n# SDK Reference\n\nIntegrate Tavily's powerful APIs natively in your Python apps.\n\n## [​](#instantiating-a-client) Instantiating a client\n\nTo interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.\n\nOnce you have instantiated a client, call one of our supported methods (detailed below) to access the API.\n\n### [​](#synchronous-client) Synchronous Client\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\nclient = TavilyClient(\"tvly-YOUR_API_KEY\")\n\n```\n\n### [​](#asynchronous-client) Asynchronous Client\n\nCopy\n\n```\nfrom tavily import AsyncTavilyClient\n\nclient = AsyncTavilyClient(\"tvly-YOUR_API_KEY\")\n\n```\n\n### [​](#proxies) Proxies\n\nIf you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.\n\nProxy configuration is available in both the synchronous and asynchronous clients.\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\nproxies = {\n  \"http\": \"<your HTTP proxy>\",\n  \"https\": \"<your HTTPS proxy>\",\n}\n\nclient = TavilyClient(\"tvly-YOUR_API_KEY\", proxies=proxies)\n\n```\n\nAlternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.\n\n## [​](#tavily-search) Tavily Search\n\n**NEW!** Try our interactive [API\nPlayground](https://app.tavily.com/playground) to see each parameter in\naction, and generate ready-to-use Python snippets.\n\nYou can access Tavily Search in Python through the client's `search` function.\n\n### [​](#parameters) Parameters\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `query` **(required)** | `str` | The query to run a search on. | — |  |\n| `search_depth` | `str` | The depth of the search. It can be `\"basic\"` or `\"advanced\"`. `\"advanced\"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `\"basic\"` search provides generic content snippets from each source. | `\"basic\"` |  |\n| `topic` | `str` | The category of the search. Determines which agent will be used. Supported values are `\"general\"` and `\"news\"`. | `\"general\"` |  |\n| `days` | `int` | The number of days back from the current date to include in the results. Available only when using the `\"news\"` topic. | `7` |  |\n| `time_range` | `str` | The time range back from the current date. Accepted values include `\"day\"`, `\"week\"`, `\"month\"`, `\"year\"` or shorthand values `\"d\"`, `\"w\"`, `\"m\"`, `\"y\"`. | — |  |\n| `max_results` | `int` | The maximum number of search results to return. It must be between `0` and `20`. | `5` |  |\n| `chunks_per_source` | `int` | The number of `content` chunks to retrieve from each source. Each chunk's length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`. | `3` |  |\n| `include_images` | `bool` | Include a list of query-related images in the response. | `False` |  |\n| `include_image_descriptions` | `bool` | Include a list of query-related images and their descriptions in the response. | `False` |  |\n| `include_answer` | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `\"basic\"` (or `True`) answer is quick but less detailed; an `\"advanced\"` answer is more detailed. | `False` |  |\n| `include_raw_content` | `bool` | Include the cleaned and parsed HTML content of each search result. | `False` |  |\n| `include_domains` | `list[str]` | A list of domains to specifically include in the search results. | `[]` |  |\n| `exclude_domains` | `list[str]` | A list of domains to specifically exclude from the search results. | `[]` |  |\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\n\n### [​](#response-format) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `results` | `list[Result]` | A list of sorted search results ranked by relevancy. |\n| `query` | `str` | Your search query. |\n| `response_time` | `float` | Your search result response time. |\n| `answer` (optional) | `str` | The answer to your search query, generated by an LLM based on Tavily's search results. This is only available if `include_answer` is set to `True`. |\n| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |\n\n### [​](#results) Results\n\n| `Key` | `Type` | Description |\n| --- | --- | --- |\n| `title` | `str` | The title of the search result. |\n| `url` | `str` | The URL of the search result. |\n| `content` | `str` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |\n| `score` | `float` | The relevance score of the search result. |\n| `raw_content` (optional) | `str` | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`. |\n| `published_date` (optional) | `str` | The publication date of the source. This is only available if the search `topic` is set to `\"news\"`. |\n\n#### [​](#image-results) Image Results\n\nIf `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `string` | The URL of the image. |\n| `description` | `string` | An LLM-generated description of the image. |\n\n### [​](#example) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Executing the search request\nresponse = tavily_client.search(\"Who is Leo Messi?\", include_images=True, include_image_descriptions=True)\n\n# Step 3. Printing the search results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n  \"query\": \"Who is Leo Messi?\",\n  \"images\": [\n    {\n      \"url\": \"Image 1 URL\",\n      \"description\": \"Image 1 Description\",\n    },\n    {\n      \"url\": \"Image 2 URL\",\n      \"description\": \"Image 2 Description\",\n    },\n    {\n      \"url\": \"Image 3 URL\",\n      \"description\": \"Image 3 Description\",\n    },\n    {\n      \"url\": \"Image 4 URL\",\n      \"description\": \"Image 4 Description\",\n    },\n    {\n      \"url\": \"Image 5 URL\",\n      \"description\": \"Image 5 Description\",\n    }\n  ],\n  \"results\": [\n    {\n      \"title\": \"Source 1 Title\",\n      \"url\": \"Source 1 URL\",\n      \"content\": \"Source 1 Content\",\n      \"score\": 0.99\n    },\n    {\n      \"title\": \"Source 2 Title\",\n      \"url\": \"Source 2 URL\",\n      \"content\": \"Source 2 Content\",\n      \"score\": 0.97\n    }\n  ],\n  \"response_time\": 1.09\n}\n\n```\n\n## [​](#tavily-extract) Tavily Extract\n\nYou can access Tavily Extract in Python through the client's `extract` function.\n\n### [​](#parameters-2) Parameters\n\n| Parameter | Type | Description | Default |  |\n| --- | --- | --- | --- | --- |\n| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs. | — |  |\n| `include_images` | `bool` | Include a list of images extracted from the URLs in the response. | `False` |  |\n| `extract_depth` | `str` | The depth of the extraction process. You may experience higher latency with `\"advanced\"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `\"basic\"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `\"basic\"` |  |\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\n\n### [​](#response-format-2) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `results` | `list[SuccessfulResult]` | A list of extracted content. |\n| `failed_results` | `list[FailedResult]` | A list of URLs that could not be processed. |\n| `response_time` | `float` | The search result response time. |\n\n#### [​](#successful-results) Successful Results\n\nEach successful result in the `results` list will be in the following `SuccessfulResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL of the webpage. |\n| `raw_content` | `str` | The raw content extracted. |\n| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |\n\n#### [​](#failed-results) Failed Results\n\nEach failed result in the `results` list will be in the following `FailedResult` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL that failed. |\n| `error` | `str` | An error message describing why it could not be processed. |\n\n### [​](#example-2) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the list of URLs to extract content from\nurls = [\n    \"https://en.wikipedia.org/wiki/Artificial_intelligence\",\n    \"https://en.wikipedia.org/wiki/Machine_learning\",\n    \"https://en.wikipedia.org/wiki/Data_science\",\n]\n\n# Step 3. Executing the extract request\nresponse = tavily_client.extract(urls=urls, include_images=True)\n\n# Step 4. Printing the extracted raw content\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    \"results\": [\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Artificial_intelligence\",\n            \"raw_content\": \"URL 1 raw content\",\n            \"images\": [\n                \"Image 1 URL\",\n                \"Image 2 URL\"\n            ]\n        },\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Machine_learning\",\n            \"raw_content\": \"URL 2 raw content\",\n            \"images\": [\n                \"Image 3 URL\",\n                \"Image 4 URL\"\n            ]\n        },\n        {\n            \"url\": \"https://en.wikipedia.org/wiki/Data_science\",\n            \"raw_content\": \"URL 3 raw content\",\n            \"images\": [\n                \"Image 5 URL\",\n                \"Image 6 URL\"\n            ]\n        }\n    ],\n    \"failed_results\": [],\n    \"response_time\": 1.23\n}\n\n```\n\n## [​](#tavily-crawl) Tavily Crawl\n\nYou can access Tavily Crawl in Python through the `crawl` function.\n\n### [​](#parameters-3) Parameters\n\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `url` **(required)** | `str` | The root URL to begin the crawl. | — |\n| `max_depth` | `int` | Max depth of the crawl. Defines how far from the base URL the crawler can explore. | `1` |\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\n| `query` | `str` | Natural language instructions for the crawler. | — |\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\.example\\.com$\"`). | `None` |\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\n| `include_images` | `bool` | Whether to extract image URLs from the crawled pages. | `False` |\n| `extract_depth` | `str` | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `\"basic\"` or `\"advanced\"`. | `\"basic\"` |\n\n### [​](#response-format-3) Response format\n\nThe response object you receive will be in the following format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `base_url` | `str` | The URL you started the crawl from. |\n| `results` | `list[Result]` | A list of crawled pages. |\n| `response_time` | `float` | The crawl response time. |\n\n#### [​](#results-2) Results\n\nEach successful result in the `results` list will be in the following `Result` format:\n\n| Key | Type | Description |\n| --- | --- | --- |\n| `url` | `str` | The URL of the webpage. |\n| `raw_content` | `str` | The raw content extracted. |\n| `images` | `list[str]` | Image URLs extracted from the page. |\n\n### [​](#example-3) Example\n\nRequest\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\n# Step 1. Instantiating your TavilyClient\ntavily_client = TavilyClient(api_key=\"tvly-YOUR_API_KEY\")\n\n# Step 2. Defining the starting URL of the crawl\nurl = \"https://docs.tavily.com\"\n\n# Step 3. Executing the crawl with some guidance parameters\nresponse = tavily_client.crawl(url, query=\"Python SDK\")\n\n# Step 4. Printing the crawled results\nprint(response)\n\n```\n\nResponse\n\nCopy\n\n```\n{\n    \"base_url\": \"https://docs.tavily.com\",\n    \"results\": [\n        {\n            \"url\": \"https://docs.tavily.com/sdk/python/reference\",\n            \"raw_content\": \"SDK Reference - Tavily Docs\\n\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\n\\nSearch or ask...\\n\\nCtrl K\\n\\n- [Support](mailto:support@tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n\\nSearch...\\n\\nNavigation\\n\\nPython\\n\\nSDK Reference\\n\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\n\\n- [API Playground](https://app.tavily.com/playground)\\n- [Community](https://community.tavily.com)\\n- [Blog](https://blog.tavily.com)\\n\\n##### Python\\n\\n- [Quickstart](/sdk/python/quick-start)\\n- [SDK Reference](/sdk/python/reference)\\n\\n##### JavaScript\\n\\n- [Quickstart](/sdk/javascript/quick-start)\\n- [SDK Reference](/sdk/javascript/reference)\\n\\nPython\\n\\n# SDK Reference\\n\\nIntegrate Tavily's powerful APIs natively in your Python apps.\\n\\n## [\\u200b](#instantiating-a-client) Instantiating a client\\n\\nTo interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.\\n\\nOnce you have instantiated a client, call one of our supported methods (detailed below) to access the API.\\n\\n### [\\u200b](#synchronous-client) Synchronous Client\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\nclient = TavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\n### [\\u200b](#asynchronous-client) Asynchronous Client\\n\\nCopy\\n\\n```\\nfrom tavily import AsyncTavilyClient\\n\\nclient = AsyncTavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\n### [\\u200b](#proxies) Proxies\\n\\nIf you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.\\n\\nProxy configuration is available in both the synchronous and asynchronous clients.\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\nproxies = {\\n  \\\"http\\\": \\\"<your HTTP proxy>\\\",\\n  \\\"https\\\": \\\"<your HTTPS proxy>\\\",\\n}\\n\\nclient = TavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\nAlternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.\\n\\n## [\\u200b](#tavily-search) Tavily Search\\n\\n**NEW!** Try our interactive [API\\nPlayground](https://app.tavily.com/playground) to see each parameter in\\naction, and generate ready-to-use Python snippets.\\n\\nYou can access Tavily Search in Python through the client's `search` function.\\n\\n### [\\u200b](#parameters) Parameters\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `query` **(required)** | `str` | The query to run a search on. |  |  |\\n| `search_depth` | `str` | The depth of the search. It can be `\\\"basic\\\"` or `\\\"advanced\\\"`. `\\\"advanced\\\"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `\\\"basic\\\"` search provides generic content snippets from each source. | `\\\"basic\\\"` |  |\\n| `topic` | `str` | The category of the search. Determines which agent will be used. Supported values are `\\\"general\\\"` and `\\\"news\\\"`. | `\\\"general\\\"` |  |\\n| `days` | `int` | The number of days back from the current date to include in the results. Available only when using the `\\\"news\\\"` topic. | `7` |  |\\n| `time_range` | `str` | The time range back from the current date. Accepted values include `\\\"day\\\"`, `\\\"week\\\"`, `\\\"month\\\"`, `\\\"year\\\"` or shorthand values `\\\"d\\\"`, `\\\"w\\\"`, `\\\"m\\\"`, `\\\"y\\\"`. |  |  |\\n| `max_results` | `int` | The maximum number of search results to return. It must be between `0` and `20`. | `5` |  |\\n| `chunks_per_source` | `int` | The number of `content` chunks to retrieve from each source. Each chunk's length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`. | `3` |  |\\n| `include_images` | `bool` | Include a list of query-related images in the response. | `False` |  |\\n| `include_image_descriptions` | `bool` | Include a list of query-related images and their descriptions in the response. | `False` |  |\\n| `include_answer` | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `\\\"basic\\\"` (or `True`) answer is quick but less detailed; an `\\\"advanced\\\"` answer is more detailed. | `False` |  |\\n| `include_raw_content` | `bool` | Include the cleaned and parsed HTML content of each search result. | `False` |  |\\n| `include_domains` | `list[str]` | A list of domains to specifically include in the search results. Maximum 300 domains.  | `[]` |  |\\n| `exclude_domains` | `list[str]` | A list of domains to specifically exclude from the search results. Maximum 150 domains. | `[]` |  |\\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\\n\\n### [\\u200b](#response-format) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `results` | `list[Result]` | A list of sorted search results ranked by relevancy. |\\n| `query` | `str` | Your search query. |\\n| `response_time` | `float` | Your search result response time. |\\n| `answer` (optional) | `str` | The answer to your search query, generated by an LLM based on Tavily's search results. This is only available if `include_answer` is set to `True`. |\\n| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |\\n\\n### [\\u200b](#results) Results\\n\\n| `Key` | `Type` | Description |\\n| --- | --- | --- |\\n| `title` | `str` | The title of the search result. |\\n| `url` | `str` | The URL of the search result. |\\n| `content` | `str` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |\\n| `score` | `float` | The relevance score of the search result. |\\n| `raw_content` (optional) | `str` | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`. |\\n| `published_date` (optional) | `str` | The publication date of the source. This is only available if the search `topic` is set to `\\\"news\\\"`. |\\n\\n#### [\\u200b](#image-results) Image Results\\n\\nIf `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `string` | The URL of the image. |\\n| `description` | `string` | An LLM-generated description of the image. |\\n\\n### [\\u200b](#example) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Executing the search request\\nresponse = tavily_client.search(\\\"Who is Leo Messi?\\\", include_images=True, include_image_descriptions=True)\\n\\n# Step 3. Printing the search results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n  \\\"query\\\": \\\"Who is Leo Messi?\\\",\\n  \\\"images\\\": [\\n    {\\n      \\\"url\\\": \\\"Image 1 URL\\\",\\n      \\\"description\\\": \\\"Image 1 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 2 URL\\\",\\n      \\\"description\\\": \\\"Image 2 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 3 URL\\\",\\n      \\\"description\\\": \\\"Image 3 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 4 URL\\\",\\n      \\\"description\\\": \\\"Image 4 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 5 URL\\\",\\n      \\\"description\\\": \\\"Image 5 Description\\\",\\n    }\\n  ],\\n  \\\"results\\\": [\\n    {\\n      \\\"title\\\": \\\"Source 1 Title\\\",\\n      \\\"url\\\": \\\"Source 1 URL\\\",\\n      \\\"content\\\": \\\"Source 1 Content\\\",\\n      \\\"score\\\": 0.99\\n    },\\n    {\\n      \\\"title\\\": \\\"Source 2 Title\\\",\\n      \\\"url\\\": \\\"Source 2 URL\\\",\\n      \\\"content\\\": \\\"Source 2 Content\\\",\\n      \\\"score\\\": 0.97\\n    }\\n  ],\\n  \\\"response_time\\\": 1.09\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-extract) Tavily Extract\\n\\nYou can access Tavily Extract in Python through the client's `extract` function.\\n\\n### [\\u200b](#parameters-2) Parameters\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs. |  |  |\\n| `include_images` | `bool` | Include a list of images extracted from the URLs in the response. | `False` |  |\\n| `extract_depth` | `str` | The depth of the extraction process. You may experience higher latency with `\\\"advanced\\\"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `\\\"basic\\\"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `\\\"basic\\\"` |  |\\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\\n\\n### [\\u200b](#response-format-2) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `results` | `list[SuccessfulResult]` | A list of extracted content. |\\n| `failed_results` | `list[FailedResult]` | A list of URLs that could not be processed. |\\n| `response_time` | `float` | The search result response time. |\\n\\n#### [\\u200b](#successful-results) Successful Results\\n\\nEach successful result in the `results` list will be in the following `SuccessfulResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL of the webpage. |\\n| `raw_content` | `str` | The raw content extracted. |\\n| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |\\n\\n#### [\\u200b](#failed-results) Failed Results\\n\\nEach failed result in the `results` list will be in the following `FailedResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL that failed. |\\n| `error` | `str` | An error message describing why it could not be processed. |\\n\\n### [\\u200b](#example-2) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the list of URLs to extract content from\\nurls = [\\n    \\\"https://en.wikipedia.org/wiki/Artificial_intelligence\\\",\\n    \\\"https://en.wikipedia.org/wiki/Machine_learning\\\",\\n    \\\"https://en.wikipedia.org/wiki/Data_science\\\",\\n]\\n\\n# Step 3. Executing the extract request\\nresponse = tavily_client.extract(urls=urls, include_images=True)\\n\\n# Step 4. Printing the extracted raw content\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    \"results\": [\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Artificial_intelligence\\\",\\n            \\\"raw_content\\\": \\\"URL 1 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 1 URL\\\",\\n                \\\"Image 2 URL\\\"\\n            ]\\n        },\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Machine_learning\\\",\\n            \\\"raw_content\\\": \\\"URL 2 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 3 URL\\\",\\n                \\\"Image 4 URL\\\"\\n            ]\\n        },\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Data_science\\\",\\n            \\\"raw_content\\\": \\\"URL 3 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 5 URL\\\",\\n                \\\"Image 6 URL\\\"\\n            ]\\n        }\\n    ],\\n    \"failed_results\": [],\\n    \"response_time\": 1.23\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-crawl) Tavily Crawl\\n\\nYou can access Tavily Crawl in Python through the `crawl` function.\\n\\n### [\\u200b](#parameters-3) Parameters\\n\\n| Parameter | Type | Description | Default |\n| --- | --- | --- | --- |\n| `url` **(required)** | `str` | The root URL to begin the crawl. | — |\n| `max_depth` | `int` | Max depth of the crawl. Defines how far from the base URL the crawler can explore. | `1` |\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\n| `query` | `str` | Natural language instructions for the crawler. | — |\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\.example\\.com$\"`). | `None` |\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\n| `include_images` | `bool` | Whether to extract image URLs from the crawled pages. | `False` |\n| `extract_depth` | `str` | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `\"basic\"` or `\"advanced\"`. | `\"basic\"` |\n\n### [\\u200b](#response-format-3) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `base_url` | `str` | The URL you started the crawl from. |\\n| `results` | `list[Result]` | A list of crawled pages. |\\n| `response_time` | `float` | The crawl response time. |\\n\\n#### [\\u200b](#results-2) Results\\n\\nEach successful result in the `results` list will be in the following `Result` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL of the webpage. |\\n| `raw_content` | `str` | The raw content extracted. |\\n| `images` | `list[str]` | Image URLs extracted from the page. |\\n\\n### [\\u200b](#example-3) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the starting URL of the crawl\\nurl = \\\"https://docs.tavily.com\\\"\\n\\n# Step 3. Executing the crawl with some guidance parameters\\nresponse = tavily_client.crawl(url, query=\\\"Python SDK\\\")\\n\\n# Step 4. Printing the crawled results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    \"base_url\": \"https://docs.tavily.com\",\\n    \"results\": [\\n        {\\n            \"url\": \"https://docs.tavily.com/sdk/python/reference\",\\n            \"raw_content\": \"SDK Reference - Tavily Docs\\n\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\n\\nSearch or ask...\\n\\nCtrl K\\n\\n- [Support](mailto:support@tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n\\nSearch...\\n\\nNavigation\\n\\nPython\\n\\nSDK Reference\\n\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\n\\n- [API Playground](https://app.tavily.com/playground)\\n- [Community](https://community.tavily.com)\\n- [Blog](https://blog.tavily.com)\\n\\n##### Python\\n\\n- [Quickstart](/sdk/python/quick-start)\\n- [SDK Reference](/sdk/python/reference)\\n\\n##### JavaScript\\n\\n- [Quickstart](/sdk/javascript/quick-start)\\n- [SDK Reference](/sdk/javascript/reference)\\n\\nPython\\n\\n# SDK Reference\\n\\nIntegrate Tavily's powerful APIs natively in your Python apps.\\n\\n## [\\u200b](#instantiating-a-client) Instantiating a client\\n\\nTo interact with Tavily in Python, you must instatiate a client with your API key. For greater flexibility, we provide both a synchronous and an asynchronous client class.\\n\\nOnce you have instantiated a client, call one of our supported methods (detailed below) to access the API.\\n\\n### [\\u200b](#synchronous-client) Synchronous Client\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\nclient = TavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\n### [\\u200b](#asynchronous-client) Asynchronous Client\\n\\nCopy\\n\\n```\\nfrom tavily import AsyncTavilyClient\\n\\nclient = AsyncTavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\n### [\\u200b](#proxies) Proxies\\n\\nIf you would like to specify a proxy to be used when making requests, you can do so by passing in a proxy parameter on client instantiation.\\n\\nProxy configuration is available in both the synchronous and asynchronous clients.\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\nproxies = {\\n  \\\"http\\\": \\\"<your HTTP proxy>\\\",\\n  \\\"https\\\": \\\"<your HTTPS proxy>\\\",\\n}\\n\\nclient = TavilyClient(\\\"tvly-YOUR_API_KEY\\\", proxies=proxies)\\n\\n```\\n\\nAlternatively, you can specify which proxies to use by setting the `TAVILY_HTTP_PROXY` and `TAVILY_HTTPS_PROXY` variables in your environment file.\\n\\n## [\\u200b](#tavily-search) Tavily Search\\n\\n**NEW!** Try our interactive [API\\nPlayground](https://app.tavily.com/playground) to see each parameter in\\naction, and generate ready-to-use Python snippets.\\n\\nYou can access Tavily Search in Python through the client's `search` function.\\n\\n### [\\u200b](#parameters) Parameters\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `query` **(required)** | `str` | The query to run a search on. |  |  |\\n| `search_depth` | `str` | The depth of the search. It can be `\\\"basic\\\"` or `\\\"advanced\\\"`. `\\\"advanced\\\"` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `\\\"basic\\\"` search provides generic content snippets from each source. | `\\\"basic\\\"` |  |\\n| `topic` | `str` | The category of the search. Determines which agent will be used. Supported values are `\\\"general\\\"` and `\\\"news\\\"`. | `\\\"general\\\"` |  |\\n| `days` | `int` | The number of days back from the current date to include in the results. Available only when using the `\\\"news\\\"` topic. | `7` |  |\\n| `time_range` | `str` | The time range back from the current date. Accepted values include `\\\"day\\\"`, `\\\"week\\\"`, `\\\"month\\\"`, `\\\"year\\\"` or shorthand values `\\\"d\\\"`, `\\\"w\\\"`, `\\\"m\\\"`, `\\\"y\\\"`. |  |  |\\n| `max_results` | `int` | The maximum number of search results to return. It must be between `0` and `20`. | `5` |  |\\n| `chunks_per_source` | `int` | The number of `content` chunks to retrieve from each source. Each chunk's length is maximum 500 characters. It must be between `1` and `3`. Available only when `search_depth` is `advanced`. | `3` |  |\\n| `include_images` | `bool` | Include a list of query-related images in the response. | `False` |  |\\n| `include_image_descriptions` | `bool` | Include a list of query-related images and their descriptions in the response. | `False` |  |\\n| `include_answer` | `bool` or `str` | Include an answer to the query generated by an LLM based on search results. A `\\\"basic\\\"` (or `True`) answer is quick but less detailed; an `\\\"advanced\\\"` answer is more detailed. | `False` |  |\\n| `include_raw_content` | `bool` | Include the cleaned and parsed HTML content of each search result. | `False` |  |\\n| `include_domains` | `list[str]` | A list of domains to specifically include in the search results. | `[]` |  |\\n| `exclude_domains` | `list[str]` | A list of domains to specifically exclude from the search results. | `[]` |  |\\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\\n\\n### [\\u200b](#response-format) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `results` | `list[Result]` | A list of sorted search results ranked by relevancy. |\\n| `query` | `str` | Your search query. |\\n| `response_time` | `float` | Your search result response time. |\\n| `answer` (optional) | `str` | The answer to your search query, generated by an LLM based on Tavily's search results. This is only available if `include_answer` is set to `True`. |\\n| `images` (optional) | `list[str]` or `list[ImageResult]` | This is only available if `include_images` is set to `True`. A list of query-related image URLs. If `include_image_descriptions` is set to `True`, each entry will be an `ImageResult`. |\\n\\n### [\\u200b](#results) Results\\n\\n| `Key` | `Type` | Description |\\n| --- | --- | --- |\\n| `title` | `str` | The title of the search result. |\\n| `url` | `str` | The URL of the search result. |\\n| `content` | `str` | The most query-related content from the scraped URL. Tavily uses proprietary AI to extract the most relevant content based on context quality and size. |\\n| `score` | `float` | The relevance score of the search result. |\\n| `raw_content` (optional) | `str` | The parsed and cleaned HTML content of the site. This is only available if `include_raw_content` is set to `True`. |\\n| `published_date` (optional) | `str` | The publication date of the source. This is only available if the search `topic` is set to `\\\"news\\\"`. |\\n\\n#### [\\u200b](#image-results) Image Results\\n\\nIf `includeImageDescriptions` is set to `true`, each image in the `images` list will be in the following `ImageResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `string` | The URL of the image. |\\n| `description` | `string` | An LLM-generated description of the image. |\\n\\n### [\\u200b](#example) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Executing the search request\\nresponse = tavily_client.search(\\\"Who is Leo Messi?\\\", include_images=True, include_image_descriptions=True)\\n\\n# Step 3. Printing the search results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n  \\\"query\\\": \\\"Who is Leo Messi?\\\",\\n  \\\"images\\\": [\\n    {\\n      \\\"url\\\": \\\"Image 1 URL\\\",\\n      \\\"description\\\": \\\"Image 1 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 2 URL\\\",\\n      \\\"description\\\": \\\"Image 2 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 3 URL\\\",\\n      \\\"description\\\": \\\"Image 3 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 4 URL\\\",\\n      \\\"description\\\": \\\"Image 4 Description\\\",\\n    },\\n    {\\n      \\\"url\\\": \\\"Image 5 URL\\\",\\n      \\\"description\\\": \\\"Image 5 Description\\\",\\n    }\\n  ],\\n  \\\"results\\\": [\\n    {\\n      \\\"title\\\": \\\"Source 1 Title\\\",\\n      \\\"url\\\": \\\"Source 1 URL\\\",\\n      \\\"content\\\": \\\"Source 1 Content\\\",\\n      \\\"score\\\": 0.99\\n    },\\n    {\\n      \\\"title\\\": \\\"Source 2 Title\\\",\\n      \\\"url\\\": \\\"Source 2 URL\\\",\\n      \\\"content\\\": \\\"Source 2 Content\\\",\\n      \\\"score\\\": 0.97\\n    }\\n  ],\\n  \\\"response_time\\\": 1.09\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-extract) Tavily Extract\\n\\nYou can access Tavily Extract in Python through the client's `extract` function.\\n\\n### [\\u200b](#parameters-2) Parameters\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `urls` **(required)** | `str` or `list[str]` | The URL (or URLs) you want to extract. If a list is provided, it must not contain more than 20 URLs. |  |  |\\n| `include_images` | `bool` | Include a list of images extracted from the URLs in the response. | `False` |  |\\n| `extract_depth` | `str` | The depth of the extraction process. You may experience higher latency with `\\\"advanced\\\"` extraction, but it offers a higher success rate and retrieves more data from the URL (e.g., tables, embedded content). `\\\"basic\\\"` extraction costs 1 API Credit per 5 successful URL extractions, while `advanced` extraction costs 2 API Credits per 5 successful URL extractions. | `\\\"basic\\\"` |  |\\n| `timeout` | `int` | A timeout to be used in requests to the Tavily API. | `60` |  |\\n\\n### [\\u200b](#response-format-2) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `results` | `list[SuccessfulResult]` | A list of extracted content. |\\n| `failed_results` | `list[FailedResult]` | A list of URLs that could not be processed. |\\n| `response_time` | `float` | The search result response time. |\\n\\n#### [\\u200b](#successful-results) Successful Results\\n\\nEach successful result in the `results` list will be in the following `SuccessfulResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL of the webpage. |\\n| `raw_content` | `str` | The raw content extracted. |\\n| `images` (optional) | `list[str]` | This is only available if `include_images` is set to `True`. A list of extracted image URLs. |\\n\\n#### [\\u200b](#failed-results) Failed Results\\n\\nEach failed result in the `results` list will be in the following `FailedResult` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL that failed. |\\n| `error` | `str` | An error message describing why it could not be processed. |\\n\\n### [\\u200b](#example-2) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the list of URLs to extract content from\\nurls = [\\n    \\\"https://en.wikipedia.org/wiki/Artificial_intelligence\\\",\\n    \\\"https://en.wikipedia.org/wiki/Machine_learning\\\",\\n    \\\"https://en.wikipedia.org/wiki/Data_science\\\",\\n]\\n\\n# Step 3. Executing the extract request\\nresponse = tavily_client.extract(urls=urls, include_images=True)\\n\\n# Step 4. Printing the extracted raw content\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    \\\"results\\\": [\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Artificial_intelligence\\\",\\n            \\\"raw_content\\\": \\\"URL 1 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 1 URL\\\",\\n                \\\"Image 2 URL\\\"\\n            ]\\n        },\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Machine_learning\\\",\\n            \\\"raw_content\\\": \\\"URL 2 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 3 URL\\\",\\n                \\\"Image 4 URL\\\"\\n            ]\\n        },\\n        {\\n            \\\"url\\\": \\\"https://en.wikipedia.org/wiki/Data_science\\\",\\n            \\\"raw_content\\\": \\\"URL 3 raw content\\\",\\n            \\\"images\\\": [\\n                \\\"Image 5 URL\\\",\\n                \\\"Image 6 URL\\\"\\n            ]\\n        }\\n    ],\\n    \\\"failed_results\\\": [],\\n    \\\"response_time\\\": 1.23\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-crawl) Tavily Crawl\\n\\nYou can access Tavily Crawl in Python through the `crawl` function.\\n\\n### [\\u200b](#parameters-3) Parameters\\n\\n| Parameter | Type | Description | Default |\\n| --- | --- | --- | --- |\\n| `url` **(required)** | `str` | The root URL to begin the crawl. | \\u2014 |\\n| `max_depth` | `int` | Max depth of the crawl. Defines how far from the base URL the crawler can explore. | `1` |\\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\\n| `query` | `str` | Natural language instructions for the crawler. | \\u2014 |\\n| `select_paths` | `list[str]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\"/docs/.*\"`, `\"/api/v1.*\"`). | `None` |\\n| `select_domains` | `list[str]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\"^docs\\\\.example\\\\.com$\\\"`). | `None` |\\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\\n| `include_images` | `bool` | Whether to extract image URLs from the crawled pages. | `False` |\\n| `extract_depth` | `str` | Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. Options: `\\\"basic\\\"` or `\\\"advanced\\\"`. | `\\\"basic\\\"` |\\n\\n### [\\u200b](#response-format-3) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `base_url` | `str` | The URL you started the crawl from. |\\n| `results` | `list[Result]` | A list of crawled pages. |\\n| `response_time` | `float` | The crawl response time. |\\n\\n#### [\\u200b](#results-2) Results\\n\\nEach successful result in the `results` list will be in the following `Result` format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `url` | `str` | The URL of the webpage. |\\n| `raw_content` | `str` | The raw content extracted. |\\n\\n### [\\u200b](#example-3) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the starting URL of the crawl\\nurl = \\\"https://docs.tavily.com\\\"\\n\\n# Step 3. Executing the crawl with some guidance parameters\\nresponse = tavily_client.crawl(url, query=\\\"Python SDK\\\")\\n\\n# Step 4. Printing the crawled results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    'base_url': 'https://docs.tavily.com',\\n    'results': [\\n        {\\n            'url': 'https://docs.tavily.com/sdk/python/quick-start',\\n            'raw_content': 'Quickstart - Tavily Docs\\\\n\\\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\\\n\\\\nSearch or ask...\\\\n\\\\nCtrl K\\\\n\\\\n- [Support](mailto:support@tavily.com)\\\\n- [Get an API key](https://app.tavily.com)\\\\n- [Get an API key](https://app.tavily.com)\\\\n\\\\nSearch...\\\\n\\\\nNavigation\\\\n\\\\nPython\\\\n\\\\nQuickstart\\\\n\\\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\\\\n\\\\n- [API Playground](https://app.tavily.com/playground)\\\\n- [Community](https://community.tavily.com)\\\\n- [Blog](https://blog.tavily.com)\\\\n\\\\n##### Python\\\\n\\\\n- [Quickstart](/sdk/python/quick-start)\\\\n- [SDK Reference](/sdk/python/reference)\\\\n\\\\n##### JavaScript\\\\n\\\\n- [Quickstart](/sdk/javascript/quick-start)\\\\n- [SDK Reference](/sdk/javascript/reference)\\\\n\\\\nPython\\\\n\\\\n# Quickstart\\\\n\\\\nIntegrate Tavily\\\\'s powerful APIs natively in your Python apps.\\\\n\\\\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\\\\n\\\\n## [\\\\u200b](#introduction) Introduction\\\\n\\\\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily\\\\'s powerful search features.\\\\n\\\\n[## GitHub\\\\n\\\\n`/tavily-ai/tavily-python`\\\\n\\\\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\\\\n\\\\n`tavily-python`\\\\n\\\\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\\\\n\\\\n## [\\\\u200b](#quickstart) Quickstart\\\\n\\\\nGet started with our Python SDK in less than 5 minutes!\\\\n\\\\n[## Get your free API key\\\\n\\\\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\\\\n\\\\n### [\\\\u200b](#installation) Installation\\\\n\\\\nYou can install the Tavily Python SDK using the following:\\\\n\\\\nCopy\\\\n\\\\n```\\\\npip install tavily-python\\\\n\\\\n```\\\\n\\\\n### [\\\\u200b](#usage) Usage\\\\n\\\\nWith Tavily\\\\'s Python SDK, you can search the web in only 4 lines of code:\\\\n\\\\nCopy\\\\n\\\\n```\\\\nfrom tavily import TavilyClient\\\\n\\\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\\\nresponse = tavily_client.search(\\\"Who is Leo Messi?\\\")\\\\n\\\\nprint(response)\\\\n\\\\n```\\\\n\\\\nYou can also easily extract content from URLs:\\\\n\\\\nCopy\\\\n\\\\n```\\\\nfrom tavily import TavilyClient\\\\n\\\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\\\nresponse = tavily_client.extract(\\\"https://en.wikipedia.org/wiki/Lionel_Messi\\\")\\\\n\\\\nprint(response)\\\\n\\\\n```\\\\n\\\\nThese examples are very simple, and you can do so much more with Tavily!\\\\n\\\\n## [\\\\u200b](#features) Features\\\\n\\\\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\\\\n\\\\n- The `search` function lets you harness the full power of Tavily Search.\\\\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\\\\n\\\\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\\\\n\\\\n[SDK Reference](/sdk/python/reference)\\\\n\\\\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\\\\n\\\\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\\\\n\\\\nOn this page\\\\n\\\\n- [Introduction](#introduction)\\\\n- [Quickstart](#quickstart)\\\\n- [Installation](#installation)\\\\n- [Usage](#usage)\\\\n- [Features](#features)'\\n        }\\n    ],\\n    'response_time': 9.14\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-map) Tavily Map\\n\\nTavily Map allows you to obtain a sitemap starting from a base URL.\\n\\nYou can access Tavily Map in Python through the `map` function.\\n\\n### [\\u200b](#parameters-4) Parameters\\n\\n| Parameter | Type | Description | Default |\\n| --- | --- | --- | --- |\\n| `url` **(required)** | `str` | The root URL to begin the mapping. | \\u2014 |\\n| `max_depth` | `int` | Max depth of the mapping. Defines how far from the base URL the crawler can explore. | `1` |\\n| `max_breadth` | `int` | Max number of links to follow **per level** of the tree (i.e., per page). | `20` |\\n| `limit` | `int` | Total number of links the crawler will process before stopping. | `50` |\\n| `query` | `str` | Natural language instructions for the crawler | \\u2014 |\\n| `select_paths` | `str[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `\\\"/docs/.*\\\"`, `\\\"/api/v1.*\\\"`). | `None` |\\n| `select_domains` | `str[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `\\\"^docs\\\\.example\\\\.com$\\\"`). | `None` |\\n| `allow_external` | `bool` | Whether to allow following links that go to external domains. | `False` |\\n\\n### [\\u200b](#response-format-4) Response format\\n\\nThe response object you receive will be in the following format:\\n\\n| Key | Type | Description |\\n| --- | --- | --- |\\n| `base_url` | `str` | The URL you started the mapping from. |\\n| `results` | `list[str]` | A list of URLs that were discovered during the mapping. |\\n| `response_time` | `float` | The mapping response time. |\\n\\n### [\\u200b](#example-4) Example\\n\\nRequest\\n\\nCopy\\n\\n```\\nfrom tavily import TavilyClient\\n\\n# Step 1. Instantiating your TavilyClient\\ntavily_client = TavilyClient(api_key=\\\"tvly-YOUR_API_KEY\\\")\\n\\n# Step 2. Defining the starting URL of the mapping\\nurl = \\\"https://docs.tavily.com\\\"\\n\\n# Step 3. Executing the mapping with some guidance parameters\\nresponse = tavily_client.mapping(url, query=\\\"JavaScript\\\")\\n\\n# Step 4. Printing the results\\nprint(response)\\n\\n```\\n\\nResponse\\n\\nCopy\\n\\n```\\n{\\n    'base_url': 'https://docs.tavily.com',\\n    'results': [\\n      'https://docs.tavily.com/sdk/javascript/quick-start',\\n      'https://docs.tavily.com/sdk/javascript/reference',\\n    ],\\n    'response_time': 8.43\\n}\\n\\n```\\n\\n## [\\u200b](#tavily-hybrid-rag) Tavily Hybrid RAG\\n\\nTavily Hybrid RAG is an extension of the Tavily Search API built to retrieve relevant data from both the web and an existing database collection. This way, a RAG agent can combine web sources and locally available data to perform its tasks. Additionally, data queried from the web that is not yet in the database can optionally be inserted into it. This will allow similar searches in the future to be answered faster, without the need to query the web again.\\n\\n### [\\u200b](#parameters-5) Parameters\\n\\nThe TavilyHybridClient class is your gateway to Tavily Hybrid RAG. There are a few important parameters to keep in mind when you are instantiating a Tavily Hybrid Client.\\n\\n| Parameter | Type | Description | Default |\\n| --- | --- | --- | --- |\\n| `api_key` | `str` | Your Tavily API Key |  |\\n| `db_provider` | `str` | Your database provider. Currently, only `\\\"mongodb\\\"` is supported. |  |\\n| `collection` | `str` | A reference to the MongoDB collection that will be used for local search. |  |\\n| `embeddings_field` (optional) | `str` | The name of the field that stores the embeddings in the specified collection. This field MUST be the same one used in the specified index. This will also be used when inserting web search results in the database using our default function. | `\\\"embeddings\\\"` |\\n| `content_field` (optional) | `str` | The name of the field that stores the text content in the specified collection. This will also be used when inserting web search results in the database using our default function. | `\\\"content\\\"` |\\n| `embedding_function` (optional) | `function` | A custom embedding function (if you want to use one). The function must take in a `list[str]` corresponding to the list of strings to be embedded, as well as an additional string defining the type of document. It must return a `list[list[float]]`, one embedding per input string. If no function is provided, defaults to Cohere\\u2019s Embed. Keep in mind that you shouldn\\u2019t mix different embeddings in the same database collection. |  |\\n| `ranking_function` (optional) | `function` | A custom ranking function (if you want to use one). If no function is provided, defaults to Cohere\\u2019s Rerank. It should return an ordered `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. The function MUST accept the following parameters: `query`: `str` - This is the query you are executing. When your ranking function is called during Hybrid RAG, the query parameter of your search call (more details below) will be passed as query. `documents`:`List[Dict]`: - This is the list of documents that are returned by your Hybrid RAG call and that you want to sort. Each document will have two properties - `content`, which is a `str`, and `score`, which is a `float`. `top_n`: `int` - This is the number of results you want to return after ranking. When your ranking function is called during Hybrid RAG, the max\\\\_results value will be passed as `top_n`. |  |\\n\\n### [\\u200b](#methods) Methods\\n\\n`search`(query, max\\\\_results=10, max\\\\_local=None, max\\\\_foreign=None, save\\\\_foreign=False, \\\\*\\\\*kwargs)\\n\\nPerforms a Tavily Hybrid RAG query and returns the retrieved documents as a `list[dict]` where the documents are sorted by decreasing relevancy to your query. Each returned document will have three properties - `content` (str), `score` (float), and `origin`, which is either `local` or `foreign`.\\n\\n| Parameter | Type | Description | Default |  |\\n| --- | --- | --- | --- | --- |\\n| `query` | `str` | The query you want to search for. |  |  |\\n| `max_results` | `int` | The maximum number of total search results to return. | 10 |  |\\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\\n| `max_local` | `int` | The maximum number of local search results to return. | `None`, which defaults to `max_results`. |  |\\n| `max_foreign` | `int` | The maximum number of web search results to return. | `None`, which defaults to `max_results`. |  |\\n| `save_foreign` | `Union[bool, function]` | Save documents from the web search in the local database. If `True` is passed, our default saving function (which only saves the content `str` and the embedding `list[float]` will be used.) If `False` is passed, no web search result documents will be saved in the local database. If a function is passed, that function MUST take in a `dict` as a parameter, and return another `dict`. The input `dict` contains all properties of the returned Tavily result object. The output dict is the final document that will be inserted in the database. You are free to add to it any fields that are supported by the database, as well as remove any of the default ones. If this function returns `None`, the document will not be saved in the database. |  |  |\\n\\nAdditional parameters can be provided as keyword arguments (detailed below). The keyword arguments supported by this method are: `search_depth`, `topic`, `include_raw_content`, `include_domains`,`exclude_domains`.\\n\\n### [\\u200b](#setup) Setup\\n\\n#### [\\u200b](#mongodb-setup) MongoDB setup\\n\\nYou will need to have a MongoDB collection with a vector search index. You can follow the [MongoDB Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/) to learn how to set this up.\\n\\n#### [\\u200b](#cohere-api-key) Cohere API Key\\n\\nBy default, embedding and ranking use the Cohere API, our recommended option. Unless you want to provide a custom embedding and ranking function, you\\u2019ll need to get an API key from [Cohere](https://cohere.com/) and set it as an environment variable named `CO_API_KEY`\\n\\nIf you decide to stick with Cohere, please note that you\\u2019ll need to install the Cohere Python package as well:\\n\\nCopy\\n\\n```\\npip install cohere\\n\\n```\\n\\n#### [\\u200b](#tavily-hybrid-rag-client-setup) Tavily Hybrid RAG Client setup\\n\\nOnce you are done setting up your database, you\\u2019ll need to create a MongoDB Client as well as a Tavily Hybrid RAG Client.\\nA minimal setup would look like this:\\n\\nCopy\\n\\n```\\nfrom pymongo import MongoClient\\nfrom tavily import TavilyHybridClient\\n\\ndb = MongoClient(\\\"mongodb+srv://YOUR_MONGO_URI\\\")[\\\"YOUR_DB\\\"]\\n\\nhybrid_rag = TavilyHybridClient(\\n    api_key=\\\"tvly-YOUR_API_KEY\\\",\\n    db_provider=\\\"mongodb\\\",\\n    collection=db.get_collection(\\\"YOUR_COLLECTION\\\"),\\n    index=\\\"YOUR_VECTOR_SEARCH_INDEX\\\",\\n    embeddings_field=\\\"YOUR_EMBEDDINGS_FIELD\\\",\\n    content_field=\\\"YOUR_CONTENT_FIELD\\\"\\n)\\n\\n```\\n\\n### [\\u200b](#usage) Usage\\n\\nOnce you create the proper clients, you can easily start searching. A few simple examples are shown below. They assume you\\u2019ve followed earlier steps. You can use most of the Tavily Search parameters with Tavily Hybrid RAG as well.\\n\\n#### [\\u200b](#simple-tavily-hybrid-rag-example) Simple Tavily Hybrid RAG example\\n\\nThis example will look for context about Leo Messi on the web and in the local database.\\nHere, we get 5 sources, both from our database and from the web, but we want to exclude unwanted-domain.com from our web search results:\\n\\nCopy\\n\\n```\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\", max_results=5, exclude_domains=['unwanted-domain.com'])\\n\\n```\\n\\nHere, we want to prioritize the number of local sources, so we will get 2 foreign (web) sources, and 5 sources from our database:\\n\\nCopy\\n\\n```\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\",  max_local=5, max_foreign=2)\\n\\n```\\n\\nNote: The sum of `max_local` and `max_foreign` can exceed `max_results`, but only the top `max_results` results will be returned.\\n\\n#### [\\u200b](#adding-retrieved-data-to-the-database) Adding retrieved data to the database\\n\\nIf you want to add the retrieved data to the database, you can do so by setting the save\\\\_foreign parameter to True:\\n\\nCopy\\n\\n```\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\", save_foreign=True)\\n\\n```\\n\\nThis will use our default saving function, which stores the content and its embedding.\\n\\n### [\\u200b](#examples) Examples\\n\\n#### [\\u200b](#sample-1%3A-using-a-custom-saving-function) Sample 1: Using a custom saving function\\n\\nYou might want to add some extra properties to documents you\\u2019re inserting or even discard some of them based on custom criteria. This can be done by passing a function to the save\\\\_foreign parameter:\\n\\nCopy\\n\\n```\\ndef save_document(document):\\n    if document['score'] < 0.5:\\n        return None # Do not save documents with low scores\\n\\n    return {\\n        'content': document['content'],\\n\\n         # Save the title and URL in the database\\n        'site_title': document['title'],\\n        'site_url': document['url'],\\n\\n        # Add a new field\\n        'added_at': datetime.now()\\n    }\\n\\nresults = hybrid_rag.search(\\\"Who is Leo Messi?\\\", save_foreign=save_document)\\n\\n```\\n\\n#### [\\u200b](#sample-2%3A-using-a-custom-embedding-function) Sample 2: Using a custom embedding function\\n\\nBy default, we use [Cohere](https://cohere.com/) for our embeddings. If you want to use your own embeddings, can pass a custom embedding function to the TavilyHybridClient:\\n\\nCopy\\n\\n```\\ndef my_embedding_function(texts, doc_type): # doc_type will be either 'search_query' or 'search_document'\\n    return my_embedding_model.encode(texts)\\n\\nhybrid_rag = TavilyHybridClient(\\n    # ...\\n    embedding_function=my_embedding_function\\n)\\n\\n```\\n\\n#### [\\u200b](#sample-3%3A-using-a-custom-ranking-function) Sample 3: Using a custom ranking function\\n\\nCohere\\u2019s [rerank](https://cohere.com/rerank) model is used by default, but you can pass your own function to the ranking\\\\_function parameter:\\n\\nCopy\\n\\n```\\ndef my_ranking_function(query, documents, top_n):\\n    return my_ranking_model.rank(query, documents, top_n)\\n\\nhybrid_rag = TavilyHybridClient(\\n    # ...\\n    ranking_function=my_ranking_function\\n)\\n\\n```\\n\\n[Quickstart](/sdk/python/quick-start)[Quickstart](/sdk/javascript/quick-start)\\n\\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\\n\\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\\n\\nOn this page\\n\\n- [Instantiating a client](#instantiating-a-client)\\n- [Synchronous Client](#synchronous-client)\\n- [Asynchronous Client](#asynchronous-client)\\n- [Proxies](#proxies)\\n- [Tavily Search](#tavily-search)\\n- [Parameters](#parameters)\\n- [Response format](#response-format)\\n- [Results](#results)\\n- [Image Results](#image-results)\\n- [Example](#example)\\n- [Tavily Extract](#tavily-extract)\\n- [Parameters](#parameters-2)\\n- [Response format](#response-format-2)\\n- [Successful Results](#successful-results)\\n- [Failed Results](#failed-results)\\n- [Example](#example-2)\\n- [Tavily Crawl](#tavily-crawl)\\n- [Parameters](#parameters-3)\\n- [Response format](#response-format-3)\\n- [Results](#results-2)\\n- [Example](#example-3)\\n- [Tavily Map](#tavily-map)\\n- [Parameters](#parameters-4)\\n- [Response format](#response-format-4)\\n- [Example](#example-4)\\n- [Tavily Hybrid RAG](#tavily-hybrid-rag)\\n- [Parameters](#parameters-5)\\n- [Methods](#methods)\\n- [Setup](#setup)\\n- [MongoDB setup](#mongodb-setup)\\n- [Cohere API Key](#cohere-api-key)\\n- [Tavily Hybrid RAG Client setup](#tavily-hybrid-rag-client-setup)\\n- [Usage](#usage)\\n- [Simple Tavily Hybrid RAG example](#simple-tavily-hybrid-rag-example)\\n- [Adding retrieved data to the database](#adding-retrieved-data-to-the-database)\\n- [Examples](#examples)\\n- [Sample 1: Using a custom saving function](#sample-1%3A-using-a-custom-saving-function)\\n- [Sample 2: Using a custom embedding function](#sample-2%3A-using-a-custom-embedding-function)\\n- [Sample 3: Using a custom ranking function](#sample-3%3A-using-a-custom-ranking-function)\",\n            \"images\": []\n        },\n        {\n            \"url\": \"https://docs.tavily.com/sdk/python/quick-start\",\n            \"raw_content\": \"Quickstart - Tavily Docs\\n\\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\\n\\nSearch or ask...\\n\\nCtrl K\\n\\n- [Support](mailto:support@tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n- [Get an API key](https://app.tavily.com)\\n\\nSearch...\\n\\nNavigation\\n\\nPython\\n\\nQuickstart\\n\\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\n- [API Playground](https://app.tavily.com/playground)\n- [Community](https://community.tavily.com)\n- [Blog](https://blog.tavily.com)\n\n##### Python\n\n- [Quickstart](/sdk/python/quick-start)\n- [SDK Reference](/sdk/python/reference)\n\n##### JavaScript\n\n- [Quickstart](/sdk/javascript/quick-start)\n- [SDK Reference](/sdk/javascript/reference)\n\nPython\n\n# Quickstart\n\nIntegrate Tavily's powerful APIs natively in your Python apps.\n\nLooking for the Python SDK Reference? Head to our [Python SDK Reference](/sdk/python/reference) and learn how to use `tavily-python`.\n\n## [](#introduction) Introduction\n\nThe Python SDK allows for easy interaction with the Tavily API, offering the full range of our search functionality directly from your Python programs. Easily integrate smart search capabilities into your applications, harnessing Tavily's powerful search features.\n\n[## GitHub\n\n`/tavily-ai/tavily-python`\n\n![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-python?style=social)](https://github.com/tavily-ai/tavily-python)[## PyPI\n\n`tavily-python`\n\n![PyPI downloads](https://img.shields.io/pypi/dm/tavily-python)](https://pypi.org/project/tavily-python)\n\n## [](#quickstart) Quickstart\n\nGet started with our Python SDK in less than 5 minutes!\n\n[## Get your free API key\n\nYou get 1,000 free API Credits every month. **No credit card required.**](https://app.tavily.com)\n\n### [](#installation) Installation\n\nYou can install the Tavily Python SDK using the following:\n\nCopy\n\n```\npip install tavily-python\n\n```\n\n### [](#usage) Usage\n\nWith Tavily's Python SDK, you can search the web in only 4 lines of code:\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")\nresponse = tavily_client.search("Who is Leo Messi?")\n\nprint(response)\n\n```\n\nYou can also easily extract content from URLs:\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")\nresponse = tavily_client.extract("https://en.wikipedia.org/wiki/Lionel_Messi")\n\nprint(response)\n\n```\n\nTavily also allows you to perform a smart crawl starting at a given URL.\n\nCopy\n\n```\nfrom tavily import TavilyClient\n\ntavily_client = TavilyClient(api_key="tvly-YOUR_API_KEY")\nresponse = tavily_client.crawl("https://docs.tavily.com", query="Python SDK")\n\nprint(response)\n\n```\n\nThese examples are very simple, and you can do so much more with Tavily!\n\n## [](#features) Features\n\nOur Python SDK supports the full feature range of our [REST API](/api-reference), and more. We offer both a synchronous and an asynchronous client, for increased flexibility.\n\n- The `search` function lets you harness the full power of Tavily Search.\n- The `extract` function allows you to easily retrieve web content with Tavily Extract.\n\nFor more details, head to the [Python SDK Reference](/sdk/python/reference).\n\n[SDK Reference](/sdk/python/reference)\n\n[x](https://x.com/tavilyai)[github](https://github.com/tavily-ai)[linkedin](https://linkedin.com/company/tavily)[website](https://tavily.com)\n\n[Powered by Mintlify](https://mintlify.com/preview-request?utm_campaign=poweredBy&utm_medium=docs&utm_source=docs.tavily.com)\n\nOn this page\n\n- [Introduction](#introduction)\n- [Quickstart](#quickstart)\n- [Installation](#installation)\n- [Usage](#usage)\n- [Features](#features)",
          images: [],
          "favicon": "https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3"
        },
        {
          "url": "https://docs.tavily.com/docs/python-sdk/tavily-search/getting-started",
          "raw_content": "Welcome - Tavily Docs\n\n[Tavily Docs home page![light logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/light.svg)![dark logo](https://mintlify.s3.us-west-1.amazonaws.com/tavilyai/logo/dark.svg)](https://tavily.com/)\n\nSearch or ask...\n\nCtrl K\n\n- [Support](mailto:support@tavily.com)\n- [Get an API key](https://app.tavily.com)\n- [Get an API key](https://app.tavily.com)\n\nSearch...\n\nNavigation\n\n[Home](/welcome)[Documentation](/documentation/about)[SDKs](/sdk/python/quick-start)[Examples](/examples/use-cases/data-enrichment)[FAQ](/faq/faq)\n\nExplore our docs\n\nYour journey to state-of-the-art web search starts right here.\n\n[## Quickstart\n\nStart searching with Tavily in minutes](documentation/quickstart)[## API Reference\n\nStart using Tavily's powerful APIs](documentation/api-reference/endpoint/search)[## API Credits Overview\n\nLearn how to get and manage your Tavily API Credits](documentation/api-credits)[## Rate Limits\n\nLearn about Tavily's API rate limits for both development and production environments](documentation/rate-limits)[## Python\n\nGet started with our Python SDK, `tavily-python`](sdk/python/quick-start)[## Playground\n\nExplore Tavily's APIs with our interactive playground](https://app.tavily.com/playground)",
          "images": [],
          "favicon: "https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3",
      requestId: "123e4567-e89b-12d3-a456-426614174111"
          
        }
      ]
    }
    ````
  </Accordion>
</AccordionGroup>

## Tavily Map

You can access Tavily Map in JavaScript through the client's `map` function.

### Parameters

| Parameter            | Type       | Description                                                                                                                                                                                                                                                        | Default |
| :------------------- | :--------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| `url` **(required)** | `string`   | The root URL to begin the mapping.                                                                                                                                                                                                                                 | —       |
| `maxDepth`           | `number`   | Max depth of the mapping. Defines how far from the base URL the crawler can explore.                                                                                                                                                                               | `1`     |
| `maxBreadth`         | `number`   | Max number of links to follow **per level** of the tree (i.e., per page).                                                                                                                                                                                          | `20`    |
| `limit`              | `number`   | Total number of links the crawler will process before stopping.                                                                                                                                                                                                    | `50`    |
| `instructions`       | `string`   | Natural language instructions for the mapper.                                                                                                                                                                                                                      | —       |
| `selectPaths`        | `string[]` | **Regex patterns** to select only URLs with specific path patterns (e.g., `"/docs/.*"`, `"/api/v1.*"`).                                                                                                                                                            | `[]`    |
| `selectDomains`      | `string[]` | **Regex patterns** to select crawling to specific domains or subdomains (e.g., `"^docs\.example\.com$"`).                                                                                                                                                          | `[]`    |
| `excludePaths`       | `string[]` | **Regex patterns** to exclude URLs with specific path patterns (e.g., `"/admin/.*"`, `"/private/.*"`).                                                                                                                                                             | `[]`    |
| `excludeDomains`     | `string[]` | **Regex patterns** to exclude specific domains or subdomains from mapping (e.g., `"^admin\.example\.com$"`).                                                                                                                                                       | `[]`    |
| `allowExternal`      | `boolean`  | Whether to return links from external domains in crawl output.                                                                                                                                                                                                     | `true`  |
| `timeout`            | `number`   | Maximum time in seconds to wait for the map operation before timing out. Must be between 10 and 150 seconds.                                                                                                                                                       | `150`   |
| `includeUsage`       | `boolean`  | Whether to include credit usage information in the response.`NOTE:`The value may be 0 if the total successful pages mapped has not yet reached 10 calls. See our [Credits & Pricing documentation](https://docs.tavily.com/documentation/api-credits) for details. | `false` |

### Response format

The response object you receive will be in the following format:

| Key            | Type       | Description                                                                                                    |
| :------------- | :--------- | :------------------------------------------------------------------------------------------------------------- |
| `baseUrl`      | `string`   | The URL you started the crawl from.                                                                            |
| `results`      | `string[]` | A list of URLs that were discovered during the mapping.                                                        |
| `responseTime` | `number`   | The crawl response time.                                                                                       |
| `requestId`    | `string`   | A unique request identifier you can share with customer support to help resolve issues with specific requests. |

### Example

<AccordionGroup>
  <Accordion title="Request">
    ```javascript  theme={null}
    const { tavily } = require("@tavily/core");

    // Step 1. Instantiating your Tavily client
    const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

    // Step 2. Defining the starting URL of the mapping
    const url = "https://docs.tavily.com";

    // Step 3. Executing the mapping with some guidance parameters
    const response = await client.map(url, { instructions: "Find all pages on the Python SDK" });
      
    // Step 4. Printing the results
    console.log(response);
    ```
  </Accordion>

  <Accordion title="Response">
    ```javascript  theme={null}
    {
        baseUrl: 'https://docs.tavily.com',
        results:[
          'https://docs.tavily.com/sdk/python/reference',
          'https://docs.tavily.com/sdk/python/quick-start',
          'https://docs.tavily.com/docs/python-sdk/tavily-search/getting-started'
        ],
        responseTime: 8.43
        requestId: "123e4567-e89b-12d3-a456-426614174111"
    }
    ```
  </Accordion>
</AccordionGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt

# Best Practices for Extract

> Learn how to optimize content extraction, choose the right approach, and configure parameters for better performance.

## Extract Parameters

### Query

Use query to rerank extracted content chunks based on relevance:

```python  theme={null}
await tavily_client.extract(
    urls=["https://example.com/article"],
    query="machine learning applications in healthcare"
)
```

**When to use query:**

* To extract only relevant portions of long documents
* When you need focused content instead of full page extraction
* For targeted information retrieval from specific URLs

> When `query` is provided, chunks are reranked based on relevance to the query.

### Chunks Per Source

Control the amount of content returned per URL to prevent context window explosion:

```python  theme={null}
await tavily_client.extract(
    urls=["https://example.com/article"],
    query="machine learning applications in healthcare",
    chunks_per_source=3
)
```

**Key benefits:**

* Returns only relevant content snippets (max 500 characters each) instead of full page content
* Prevents context window from exploding
* Chunks appear in `raw_content` as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`
* Must be between 1 and 5 chunks per source

> `chunks_per_source` is only available when `query` is provided.

**Example with multiple URLs:**

```python  theme={null}
await tavily_client.extract(
    urls=[
        "https://example.com/ml-healthcare",
        "https://example.com/ai-diagnostics",
        "https://example.com/medical-ai"
    ],
    query="AI diagnostic tools accuracy",
    chunks_per_source=2
)
```

This returns the 2 most relevant chunks from each URL, giving you focused, relevant content without overwhelming your context window.

## Extraction Approaches

### Search with include\_raw\_content

Enable include\_raw\_content=true in Search API calls to retrieve both search results and extracted content simultaneously.

```python  theme={null}
response = await tavily_client.search(
    query="AI healthcare applications",
    include_raw_content=True,
    max_results=5
)
```

**When to use:**

* Quick prototyping
* Simple queries where search results are likely relevant
* Single API call convenience

### Direct Extract API

Use the Extract API when you want control over which specific URLs to extract from.

```python  theme={null}
await tavily_client.extract(
    urls=["https://example.com/article1", "https://example.com/article2"],
    query="machine learning applications",
    chunks_per_source=3
)
```

**When to use:**

* You already have specific URLs to extract from
* You want to filter or curate URLs before extraction
* You need targeted extraction with query and chunks\_per\_source

**Key difference:** The main distinction is control, with Extract you choose exactly which URLs to extract from, while Search with `include_raw_content` extracts from all search results.

## Extract Depth

The `extract_depth` parameter controls extraction comprehensiveness:

| Depth             | Use case                                      |
| ----------------- | --------------------------------------------- |
| `basic` (default) | Simple text extraction, faster processing     |
| `advanced`        | Complex pages, tables, structured data, media |

### Using `extract_depth=advanced`

Best for content requiring detailed extraction:

```python  theme={null}
await tavily_client.extract(
    url="https://example.com/complex-page",
    extract_depth="advanced"
)
```

**When to use advanced:**

* Dynamic content or JavaScript-rendered pages
* Tables and structured information
* Embedded media and rich content
* Higher extraction success rates needed

<Note>
  `extract_depth=advanced` provides better accuracy but increases latency and
  cost. Use `basic` for simple content.
</Note>

## Advanced Filtering Strategies

Beyond query-based filtering, consider these approaches for curating URLs before extraction:

| Strategy     | When to use                                    |
| ------------ | ---------------------------------------------- |
| Re-ranking   | Use dedicated re-ranking models for precision  |
| LLM-based    | Let an LLM assess relevance before extraction  |
| Clustering   | Group similar documents, extract from clusters |
| Domain-based | Filter by trusted domains before extracting    |
| Score-based  | Filter search results by relevance score       |

### Example: Score-based filtering

```python  theme={null}
import asyncio
from tavily import AsyncTavilyClient

tavily_client = AsyncTavilyClient(api_key="tvly-YOUR_API_KEY")

async def filtered_extraction():
    # Search first
    response = await tavily_client.search(
        query="AI healthcare applications",
        search_depth="advanced",
        max_results=20
    )

    # Filter by relevance score (>0.5)
    relevant_urls = [
        result['url'] for result in response.get('results', [])
        if result.get('score', 0) > 0.5
    ]

    # Extract from filtered URLs with targeted query
    extracted_data = await tavily_client.extract(
        urls=relevant_urls,
        query="machine learning diagnostic tools",
        chunks_per_source=3,
        extract_depth="advanced"
    )

    return extracted_data

asyncio.run(filtered_extraction())
```

## Integration with Search

### Optimal workflow

* **Search** to discover relevant URLs
* **Filter** by relevance score, domain, or content snippet
* **Re-rank** if needed using specialized models
* **Extract** from top-ranked sources with query and chunks\_per\_source
* **Validate** extracted content quality
* **Process** for your RAG or AI application

### Example end-to-end pipeline

```python  theme={null}
async def content_pipeline(topic):
    # 1. Search with sub-queries
    queries = generate_subqueries(topic)
    responses = await asyncio.gather(
        *[tavily_client.search(**q) for q in queries]
    )

    # 2. Filter and aggregate
    urls = []
    for response in responses:
        urls.extend([
            r['url'] for r in response['results']
            if r['score'] > 0.5
        ])

    # 3. Deduplicate
    urls = list(set(urls))[:20]  # Top 20 unique URLs

    # 4. Extract with error handling
    extracted = await asyncio.gather(
        *(tavily_client.extract(url, extract_depth="advanced") for url in urls),
        return_exceptions=True
    )

    # 5. Filter successful extractions
    return [e for e in extracted if not isinstance(e, Exception)]
```

## Summary

1. **Use query and chunks\_per\_source** for targeted, focused extraction
2. **Choose Extract API** when you need control over which URLs to extract from
3. **Filter URLs** before extraction using scores, re-ranking, or domain trust
4. **Choose appropriate extract\_depth** based on content complexity
5. **Process URLs concurrently** with async operations for better performance
6. **Implement error handling** to manage failed extractions gracefully
7. **Validate extracted content** before downstream processing
8. **Optimize costs** by extracting only necessary content with chunks\_per\_source

> Start with query and chunks\_per\_source for targeted extraction. Filter URLs strategically, extract with appropriate depth, and handle errors gracefully for production-ready pipelines.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt

# Best Practices for Crawl

> Learn how to optimize crawl parameters, focus your crawls, and efficiently extract content from websites.

## Crawl vs Map

Understanding when to use each API:

| Feature                | Crawl                        | Map                      |
| ---------------------- | ---------------------------- | ------------------------ |
| **Content extraction** | Full content                 | URLs only                |
| **Use case**           | Deep content analysis        | Site structure discovery |
| **Speed**              | Slower (extracts content)    | Faster (URLs only)       |
| **Best for**           | RAG, analysis, documentation | Sitemap generation       |

### Use Crawl when you need:

* Full content extraction from pages
* Deep content analysis
* Processing of paginated or nested content
* Extraction of specific content patterns
* Integration with RAG systems

### Use Map when you need:

* Quick site structure discovery
* URL collection without content extraction
* Sitemap generation
* Path pattern matching
* Domain structure analysis

## Crawl Parameters

### Instructions

Guide the crawl with natural language to focus on relevant content:

```json  theme={null}
{
  "url": "example.com",
  "max_depth": 2,
  "instructions": "Find all documentation pages about Python"
}
```

**When to use instructions:**

* To focus crawling on specific topics or content types
* When you need semantic filtering of pages
* For agentic use cases where relevance is critical

### Chunks per Source

Control the amount of content returned per page to prevent context window explosion:

```json  theme={null}
{
  "url": "example.com",
  "instructions": "Find all documentation about authentication",
  "chunks_per_source": 3
}
```

**Key benefits:**

* Returns only relevant content snippets (max 500 characters each) instead of full page content
* Prevents context window from exploding in agentic use cases
* Chunks appear in `raw_content` as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`

> `chunks_per_source` is only available when instructions are provided.

### Depth and breadth

| Parameter     | Description                                     | Impact                     |
| ------------- | ----------------------------------------------- | -------------------------- |
| `max_depth`   | How many levels deep to crawl from starting URL | Exponential latency growth |
| `max_breadth` | Maximum links to follow per page                | Horizontal spread          |
| `limit`       | Total maximum pages to crawl                    | Hard cap on pages          |

**Performance tip:** Each level of depth increases crawl time exponentially. Start with `max_depth=1` and increase as needed.

```json  theme={null}
// Conservative crawl
{
  "url": "example.com",
  "max_depth": 1,
  "max_breadth": 20,
  "limit": 20
}

// Comprehensive crawl
{
  "url": "example.com",
  "max_depth": 3,
  "max_breadth": 100,
  "limit": 500
}
```

## Filtering and Focusing

### Path patterns

Use regex patterns to include or exclude specific paths:

```json  theme={null}
// Target specific sections
{
  "url": "example.com",
  "select_paths": ["/blog/.*", "/docs/.*", "/guides/.*"],
  "exclude_paths": ["/private/.*", "/admin/.*", "/test/.*"]
}

// Paginated content
{
  "url": "example.com/blog",
  "max_depth": 2,
  "select_paths": ["/blog/.*", "/blog/page/.*"],
  "exclude_paths": ["/blog/tag/.*"]
}
```

### Domain filtering

Control which domains to crawl:

```json  theme={null}
// Stay within subdomain
{
  "url": "docs.example.com",
  "select_domains": ["^docs.example.com$"],
  "max_depth": 2
}

// Exclude specific domains
{
  "url": "example.com",
  "exclude_domains": ["^ads.example.com$", "^tracking.example.com$"],
  "max_depth": 2
}
```

### Extract depth

Controls extraction quality vs. speed.

| Depth             | When to use                            |
| ----------------- | -------------------------------------- |
| `basic` (default) | Simple content, faster processing      |
| `advanced`        | Complex pages, tables, structured data |

```json  theme={null}
{
  "url": "docs.example.com",
  "max_depth": 2,
  "extract_depth": "advanced",
  "select_paths": ["/docs/.*"]
}
```

## Use Cases

### 1. Deep or Unlinked Content

Many sites have content that's difficult to access through standard means:

* Deeply nested pages not in main navigation
* Paginated archives (old blog posts, changelogs)
* Internal search-only content

**Best Practice:**

```json  theme={null}
{
  "url": "example.com",
  "max_depth": 3,
  "max_breadth": 50,
  "limit": 200,
  "select_paths": ["/blog/.*", "/changelog/.*"],
  "exclude_paths": ["/private/.*", "/admin/.*"]
}
```

### 2. Structured but Nonstandard Layouts

For content that's structured but not marked up in schema.org:

* Documentation
* Changelogs
* FAQs

**Best Practice:**

```json  theme={null}
{
  "url": "docs.example.com",
  "max_depth": 2,
  "extract_depth": "advanced",
  "select_paths": ["/docs/.*"]
}
```

### 3. Multi-modal Information Needs

When you need to combine information from multiple sections:

* Cross-referencing content
* Finding related information
* Building comprehensive knowledge bases

**Best Practice:**

```json  theme={null}
{
  "url": "example.com",
  "max_depth": 2,
  "instructions": "Find all documentation pages that link to API reference docs",
  "extract_depth": "advanced"
}
```

### 4. Rapidly Changing Content

For content that updates frequently:

* API documentation
* Product announcements
* News sections

**Best Practice:**

```json  theme={null}
{
  "url": "api.example.com",
  "max_depth": 1,
  "max_breadth": 100
}
```

### 5. Behind Auth / Paywalls

For content requiring authentication:

* Internal knowledge bases
* Customer help centers
* Gated documentation

**Best Practice:**

```json  theme={null}
{
  "url": "help.example.com",
  "max_depth": 2,
  "select_domains": ["^help.example.com$"],
  "exclude_domains": ["^public.example.com$"]
}
```

### 6. Complete Coverage / Auditing

For comprehensive content analysis:

* Legal compliance checks
* Security audits
* Policy verification

**Best Practice:**

```json  theme={null}
{
  "url": "example.com",
  "max_depth": 3,
  "max_breadth": 100,
  "limit": 1000,
  "extract_depth": "advanced",
  "instructions": "Find all mentions of GDPR and data protection policies"
}
```

### 7. Semantic Search or RAG Integration

For feeding content into LLMs or search systems:

* RAG systems
* Enterprise search
* Knowledge bases

**Best Practice:**

```json  theme={null}
{
  "url": "docs.example.com",
  "max_depth": 2,
  "extract_depth": "advanced",
  "include_images": true
}
```

### 8. Known URL Patterns

When you have specific paths to crawl:

* Sitemap-based crawling
* Section-specific extraction
* Pattern-based content collection

**Best Practice:**

```json  theme={null}
{
  "url": "example.com",
  "max_depth": 1,
  "select_paths": ["/docs/.*", "/api/.*", "/guides/.*"],
  "exclude_paths": ["/private/.*", "/admin/.*"]
}
```

## Performance Optimization

### Depth vs. Performance

* Each level of depth increases crawl time exponentially
* Start with max\_depth: 1 and increase as needed
* Use max\_breadth to control horizontal expansion
* Set appropriate limit to prevent excessive crawling

### Rate Limiting

* Respect site's robots.txt
* Implement appropriate delays between requests
* Monitor API usage and limits
* Use appropriate error handling for rate limits

## Integration with Map

Consider using Map before Crawl to:

1. Discover site structure
2. Identify relevant paths
3. Plan crawl strategy
4. Validate URL patterns

**Example workflow:**

1. Use Map to get site structure
2. Analyze paths and patterns
3. Configure Crawl with discovered paths
4. Execute focused crawl

**Benefits:**

* Discover site structure before crawling
* Identify relevant path patterns
* Avoid unnecessary crawling
* Validate URL patterns work correctly

## Common Pitfalls

### Excessive depth

* **Problem:** Setting `max_depth=4` or higher
* **Impact:** Exponential crawl time, unnecessary pages
* **Solution:** Start with 1-2 levels, increase only if needed

### Unfocused crawling

* **Problem:** No `instructions` provided, crawling entire site
* **Impact:** Wasted resources, irrelevant content, context explosion
* **Solution:** Use instructions to focus the crawl semantically

### Missing limits

* **Problem:** No `limit` parameter set
* **Impact:** Runaway crawls, unexpected costs
* **Solution:** Always set a reasonable `limit` value

### Ignoring failed results

* **Problem:** Not checking which pages failed extraction
* **Impact:** Incomplete data, missed content
* **Solution:** Monitor failed results and adjust parameters

## Summary

* Use instructions and chunks\_per\_source for focused, relevant results in agentic use cases
* Start with conservative parameters (`max_depth=1, max_breadth=20`)
* Use path patterns to focus crawling on relevant content
* Choose appropriate extract\_depth based on content complexity
* Set reasonable limits to prevent excessive crawling
* Monitor failed results and adjust patterns accordingly
* Use Map first to understand site structure
* Implement error handling for rate limits and failures
* Respect robots.txt and site policies
* Optimize for your use case (speed vs. completeness)
* Process results incrementally rather than waiting for full crawl

> Crawling is powerful but resource-intensive. Focus your crawls, start small, monitor results, and scale gradually based on actual needs.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt

# Best Practices for Research

> Learn how to write effective prompts, choose the right model, and configure output formats for better research results.

## Prompting

Define a **clear goal** with all **details** and **direction**.

* **Be specific when you can.** If you already know important details, include them.<br />
  (E.g. Target market or industry, key competitors, customer segments, geography, or constraints)
* **Only stay open-ended if you don't know details and want discovery.** If you're exploring broadly, make that explicit (e.g., "tell me about the most impactful AI innovations in healthcare in 2025").
* **Avoid contradictions.** Don't include conflicting information, constraints, or goals in your prompt.
* **Share what's already known.** Include prior assumptions, existing decisions, or baseline knowledge—so the research doesn't repeat what you already have.
* **Keep the prompt clean and directed.** Use a clear task statement + essential context + desired output format. Avoid messy background dumps.

### Example Queries

```text  theme={null}
"Research the company ____ and it's 2026 outlook. Provide a brief 
overview of the company, its products, services, and market position."
```

```text  theme={null}
"Conduct a competitive analysis of ____ in 2026. Identify their main competitors, 
compare market positioning, and analyze key differentiators."
```

```text  theme={null}
"We're evaluating Notion as a potential partner. We already know they primarily 
serve SMB and mid-market teams, expanded their AI features significantly in 2025, 
and most often compete with Confluence and ClickUp. Research Notion's 2026 outlook, 
including market position, growth risks, and where a partnership could be most 
valuable. Include citations."
```

## Model

| Model  | Best For                                                             |
| ------ | -------------------------------------------------------------------- |
| `pro`  | Comprehensive, multi-agent research for complex, multi-domain topics |
| `mini` | Targeted, efficient research for narrow or well-scoped questions     |
| `auto` | When you're unsure how complex research will be                      |

### Pro

Provides comprehensive, multi-agent research suited for complex topics that span multiple subtopics or domains. Use when you want deeper analysis, more thorough reports, or maximum accuracy.

```json  theme={null}
{
  "input": "Analyze the competitive landscape for ____ in the SMB market, including key competitors, positioning, pricing models, customer segments, recent product moves, and where ____ has defensible advantages or risks over the next 2–3 years.",
  "model": "pro"
}
```

### Mini

Optimized for targeted, efficient research. Works best for narrow or well-scoped questions where you still benefit from agentic searching and synthesis, but don't need extensive depth.

```json  theme={null}
{
  "input": "What are the top 5 competitors to ____ in the SMB market, and how do they differentiate?",
  "model": "mini"
}
```

## Structured Output vs. Report

* **Structured Output** - Best for data enrichment, pipelines, or powering UIs with specific fields.
* **Report** — Best for reading, sharing, or displaying verbatim (e.g., chat interfaces, briefs, newsletters).

### Formatting Your Schema

* **Write clear field descriptions.** In 1–3 sentences, say exactly what the field should contain and what to look for. This makes it easier for our models to interpret what you're looking for.
* **Match the structure you actually need.** Use the right types (arrays, objects, enums) instead of packing multiple values into one string (e.g., `competitors: string[]`, not `"A, B, C"`).
* **Avoid duplicate or overlapping fields.** Keep each field unique and specific - contradictions or redundancy can confuse our models.

## Streaming vs. Polling

<CardGroup cols={2}>
  <Card title="Streaming" icon="wave-pulse" href="https://github.com/tavily-ai/tavily-cookbook/blob/main/cookbooks/research/streaming.ipynb">
    Best for user interfaces where you want real-time updates.
  </Card>

  <Card title="Polling" icon="rotate" href="https://github.com/tavily-ai/tavily-cookbook/blob/main/cookbooks/research/polling.ipynb">
    Best for background processes where you check status periodically.
  </Card>
</CardGroup>

<Tip>
  See streaming in action with the [live demo](https://chat-research.tavily.com/).
</Tip>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt

# API Key Management

> Learn how to handle API key leaks and best practices for key rotation.

## What to do if your API key leaks

If you suspect or know that your API key has been leaked (e.g., committed to a public repository, shared in a screenshot, or exposed in client-side code), **immediate action is required** to protect your account and quota.

Follow these steps immediately:

1. **Log in to your account**: Go to the [Tavily Dashboard](https://app.tavily.com).
2. **Revoke the leaked key**: Navigate to the API Keys section. Identify the compromised key and delete or revoke it immediately. This will stop any unauthorized usage.
3. **Generate a new key**: Create a new API key to replace the compromised one.
4. **Update your applications**: Replace the old key with the new one in your environment variables, secrets management systems, and application code.

If you notice any unusual activity or usage spikes associated with the leaked key before you revoked it, please contact [support@tavily.com](mailto:support@tavily.com) for assistance.

## Rotating your API keys

As a general security best practice, we recommend rotating your API keys periodically (e.g., every 90 days). This minimizes the impact if a key is ever compromised without your knowledge.

### How to rotate your keys safely

To rotate your keys without downtime:

1. **Generate a new key**: Create a new API key in the [Tavily Dashboard](https://app.tavily.com) while keeping the old one active.
2. **Update your application**: Deploy your application with the new API key.
3. **Verify functionality**: Ensure your application is working correctly with the new key.
4. **Revoke the old key**: Once you are confirmed that the new key is in use and everything is functioning as expected, delete the old API key from the dashboard.

<Note>
  Never hardcode API keys in your source code. Always use environment variables or a secure secrets manager to store your credentials.
</Note>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt