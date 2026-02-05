# https://docs.openwebui.com/features/pipelines/pipes

  * [](/)
  * [⭐ Features](/features/)
  * [Pipelines](/features/pipelines/)
  * Pipes



On this page

# Pipes

## Pipes​

Pipes are standalone functions that process inputs and generate responses, possibly by invoking one or more LLMs or external services before returning results to the user. Examples of potential actions you can take with Pipes are Retrieval Augmented Generation (RAG), sending requests to non-OpenAI LLM providers (such as Anthropic, Azure OpenAI, or Google), or executing functions right in your web UI. Pipes can be hosted as a Function or on a Pipelines server. A list of examples is maintained in the [Pipelines repo](https://github.com/open-webui/pipelines/tree/main/examples/pipelines). The general workflow can be seen in the image below.

![Pipe Workflow](/assets/images/pipes-60a392df5fff4845e467d93b4d8b6f7e.png)

Pipes that are defined in your WebUI show up as a new model with an "External" designation attached to them. An example of two Pipe models, `Database RAG Pipeline` and `DOOM`, can be seen below next to two self-hosted models:

![Pipe Models in WebUI](/assets/images/pipe-model-example-f593d91233142ad2923bc9cb999fccf5.png)

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/pipelines/pipes.md)

[PreviousFilters](/features/pipelines/filters)[NextValves](/features/pipelines/valves)

  * Pipes


