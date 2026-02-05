# Usage

> Get API key and account usage details



## OpenAPI

````yaml GET /usage
openapi: 3.0.3
info:
  title: Tavily Search and Extract API
  description: >-
    Our REST API provides seamless access to Tavily Search, a powerful search
    engine for LLM agents, and Tavily Extract, an advanced web scraping solution
    optimized for LLMs.
  version: 1.0.0
servers:
  - url: https://api.tavily.com/
security: []
tags:
  - name: Search
  - name: Extract
  - name: Crawl
  - name: Map
  - name: Research
  - name: Usage
paths:
  /usage:
    get:
      summary: Get API key and account usage details
      description: Get API key and account usage details
      responses:
        '200':
          description: Usage details returned successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  key:
                    type: object
                    properties:
                      usage:
                        type: integer
                        description: Current usage count for the API key
                        example: 150
                      limit:
                        type: integer
                        description: >-
                          Usage limit for the API key. Returns null if unlimited
                          (2147483647)
                        example: 1000
                  account:
                    type: object
                    description: Account plan and usage information
                    properties:
                      current_plan:
                        type: string
                        description: The current subscription plan name
                        example: Bootstrap
                      plan_usage:
                        type: integer
                        description: Current usage count for the plan
                        example: 500
                      plan_limit:
                        type: integer
                        description: Usage limit for the current plan
                        example: 15000
                      paygo_usage:
                        type: integer
                        description: Current pay-as-you-go usage count
                        example: 25
                      paygo_limit:
                        type: integer
                        description: Pay-as-you-go usage limit
                        example: 100
        '401':
          description: Unauthorized - Your API key is wrong or missing.
          content:
            application/json:
              schema:
                type: object
                properties:
                  detail:
                    type: object
                    properties:
                      error:
                        type: string
              example:
                detail:
                  error: 'Unauthorized: missing or invalid API key.'
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: >-
        Bearer authentication header in the form Bearer <token>, where <token>
        is your Tavily API key (e.g., Bearer tvly-YOUR_API_KEY).

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.tavily.com/llms.txt