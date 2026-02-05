# Quickstart

> Integrate Tavily's powerful APIs natively in your JavaScript/TypeScript projects.

<Tip>
  Looking for the JavaScript SDK Reference? Head to our [JavaScript SDK
  Reference](/sdk/javascript/reference) and learn how to use `tavily-js`.
</Tip>

{" "}

## Introduction

Tavily's JavaScript SDK allows for easy interaction with the Tavily API, offering the full range of our search and extract functionalities directly from your JavaScript and TypeScript programs. Easily integrate smart search and content extraction capabilities into your applications, harnessing Tavily's powerful search and extract features.

<CardGroup cols="2">
  <Card title="GitHub" icon="github" horizontal href="https://github.com/tavily-ai/tavily-js">
    `/tavily-ai/tavily-js`

    <img noZoom={true} src="https://img.shields.io/github/stars/tavily-ai/tavily-js?style=social" alt="GitHub Repo stars" />
  </Card>

  <Card title="NPM" icon="npm" horizontal href="https://www.npmjs.com/package/@tavily/core">
    `@tavily/core`

    <img noZoom={true} src="https://img.shields.io/npm/dt/@tavily/core" alt="GitHub Repo stars" />
  </Card>
</CardGroup>

## Quickstart

Get started with our JavaScript SDK in less than 5 minutes!

<Card title="Get your free API key" icon="key" horizontal href="https://app.tavily.com">
  You get 1,000 free API Credits every month. **No credit card required.**
</Card>

### Installation

You can install the Tavily JavaScript SDK using the following:

```bash  theme={null}
npm i @tavily/core
```

### Usage

With Tavily's Python SDK, you can search the web in only 4 lines of code:

```javascript  theme={null}
const { tavily } = require("@tavily/core");

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const response = await tvly.search("Who is Leo Messi?");

console.log(response);
```

You can also easily extract content from URLs:

```javascript  theme={null}
const { tavily } = require("@tavily/core");

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const response = await tvly.extract(
  "https://en.wikipedia.org/wiki/Lionel_Messi"
);

console.log(response);
```

Tavily also allows you to perform a smart crawl starting at a given URL.

<Tip>
  Our agent-first crawl endpoint is currently in. Please repost any issues you encounter on our [community page](https://community.tavily.com).
</Tip>

```javascript  theme={null}
const { tavily } = require("@tavily/core")

const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });
const response = await client.crawl("https://docs.tavily.com", { instructions: "Find all pages on the Python SDK" });

console.log(response);
```

## Features

Our JavaScript SDK supports the full feature range of our [REST API](/documentation/api-reference/introduction). Our JavaScript client is asynchronous by default.

* The `search` function lets you harness the full power of Tavily Search.
* The `extract` function allows you to easily retrieve web content with Tavily Extract.
* The `crawl` and `map`functions allow you to intelligently traverse websites and extract content.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt