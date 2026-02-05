# Introduction

> Easily integrate our APIs with your services.

<Tip>
  Looking for the Python or JavaScript SDK Reference? Head to our [SDKs](/sdk)
  page to see how to natively integrate Tavily in your project.
</Tip>

## Base URL

The base URL for all requests to the Tavily API is:

```plaintext  theme={null}
https://api.tavily.com
```

## Authentication

All Tavily endpoints are authenticated using API keys.
[Get your free API key](https://app.tavily.com).

```bash  theme={null}
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tvly-YOUR_API_KEY" \
  -d '{"query": "Who is Leo Messi?"}'
```

## Endpoints

<CardGroup cols={2}>
  <Card icon="magnifying-glass" horizontal href="/documentation/api-reference/endpoint/search">
    **`/search`**

    Tavily's powerful web search API.
  </Card>

  <Card icon="file-lines" horizontal href="/documentation/api-reference/endpoint/extract">
    **`/extract`**

    Tavily's powerful content extraction API.
  </Card>

  <Card icon="circle-nodes" horizontal href="/documentation/api-reference/endpoint/crawl">
    `/crawl` , `/map`

    Tavily's intelligent sitegraph navigation and extraction tools.
  </Card>

  <Card icon="book" horizontal href="/documentation/api-reference/endpoint/research">
    **`/research`**

    Tavily's comprehensive research API for in-depth analysis.
  </Card>
</CardGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt