🚰 Pipe Function | Open WebUI







[Skip to main content](#__docusaurus_skipToContent_fallback)

[![](/images/logo.png)![](/images/logo-dark.png)

**Open WebUI**](/)[Blog](/blog)

[GitHub](https://github.com/open-webui/open-webui)[Discord](https://discord.com/invite/5rJgQTnV4s)

[![Open WebUI](/sponsors/banners/placeholder.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [🏡 Home](/)
* [🚀 Getting Started](/getting-started/)
* [⭐ Features](/features/)

  + [🔐 Federated Authentication](/features/auth/sso/)
  + [🛠️ Tools & Functions (Plugins)](/features/plugin/)

    - [🧰 Functions](/features/plugin/functions/)

      * [🚰 Pipe Function](/features/plugin/functions/pipe)
      * [🪄 Filter Function](/features/plugin/functions/filter)
      * [🎬 Action Function](/features/plugin/functions/action)
    - [⚙️ Tools](/features/plugin/tools/)
    - [⛑️ Events](/features/plugin/events/)
    - [🔄 Valves](/features/plugin/valves/)
    - [🚚 Migrating Tools & Functions: 0.4 to 0.5](/features/plugin/migration/)
  + [🖥️ Workspace](/features/workspace/)
  + [💬 Chat Features](/features/chat-features/)
  + [🔎 Retrieval Augmented Generation (RAG)](/features/rag/)
  + [🪪 Role-Based Access Control (RBAC)](/features/rbac/)
  + [🔌 Interface](/features/interface/banners)
  + [📝 Evaluation](/features/evaluation/)
  + [📢 Channels](/features/channels/)
  + [⚡ Pipelines](/features/pipelines/)
  + [🔌 Model Context Protocol (MCP)](/features/mcp)
* [🔨 OpenAPI Tool Servers](/openapi-servers/)
* [🛠️ Troubleshooting](/troubleshooting/)
* [📝 Tutorials](/category/-tutorials)
* [📋 FAQ](/faq)
* [🛣️ Roadmap](/roadmap)
* [🔒 Security Policy](/security)
* [🤝 Contributing](/contributing)
* [🌐 Sponsorships](/sponsorships)
* [🎨 Design Guidelines](/brand)
* [⚖️ Open WebUI License](/license)
* [🏢 Open WebUI for Enterprises](/enterprise/)
* [🎯 Our Mission](/mission)
* [👥 Our Team](/team)

Sponsored by Open WebUI

[![Open WebUI](/sponsors/banners/placeholder-mobile.png)](https://forms.gle/92mvG3ESYj47zzRL9)

The top banner spot is reserved for Emerald+ Enterprise sponsors

* [⭐ Features](/features/)
* [🛠️ Tools & Functions (Plugins)](/features/plugin/)
* [🧰 Functions](/features/plugin/functions/)
* 🚰 Pipe Function

On this page

🚰 Pipe Function: Create Custom "Agents/Models"
==============================================

Welcome to this guide on creating **Pipes** in Open WebUI! Think of Pipes as a way to **adding** a new model to Open WebUI. In this document, we'll break down what a Pipe is, how it works, and how you can create your own to add custom logic and processing to your Open WebUI models. We'll use clear metaphors and go through every detail to ensure you have a comprehensive understanding.

Introduction to Pipes[​](#introduction-to-pipes "Direct link to Introduction to Pipes")
---------------------------------------------------------------------------------------

Imagine Open WebUI as a **plumbing system** where data flows through pipes and valves. In this analogy:

* **Pipes** are like **plugins** that let you introduce new pathways for data to flow, allowing you to inject custom logic and processing.
* **Valves** are the **configurable parts** of your pipe that control how data flows through it.

By creating a Pipe, you're essentially crafting a custom model with the specific behavior you want, all within the Open WebUI framework.

---

Understanding the Pipe Structure[​](#understanding-the-pipe-structure "Direct link to Understanding the Pipe Structure")
------------------------------------------------------------------------------------------------------------------------

Let's start with a basic, barebones version of a Pipe to understand its structure:

```
from pydantic import BaseModel, Field  
  
class Pipe:  
    class Valves(BaseModel):  
        MODEL_ID: str = Field(default="")  
  
    def __init__(self):  
        self.valves = self.Valves()  
  
    def pipe(self, body: dict):  
        # Logic goes here  
        print(self.valves, body)  # This will print the configuration options and the input body  
        return "Hello, World!"
```

### The Pipe Class[​](#the-pipe-class "Direct link to The Pipe Class")

* **Definition**: The `Pipe` class is where you define your custom logic.
* **Purpose**: Acts as the blueprint for your plugin, determining how it behaves within Open WebUI.

### Valves: Configuring Your Pipe[​](#valves-configuring-your-pipe "Direct link to Valves: Configuring Your Pipe")

* **Definition**: `Valves` is a nested class within `Pipe`, inheriting from `BaseModel`.
* **Purpose**: It contains the configuration options (parameters) that persist across the use of your Pipe.
* **Example**: In the above code, `MODEL_ID` is a configuration option with a default empty string.

**Metaphor**: Think of Valves as the knobs on a real-world pipe system that control the flow of water. In your Pipe, Valves allow users to adjust settings that influence how the data flows and is processed.

### The `__init__` Method[​](#the-__init__-method "Direct link to the-__init__-method")

* **Definition**: The constructor method for the `Pipe` class.
* **Purpose**: Initializes the Pipe's state and sets up any necessary components.
* **Best Practice**: Keep it simple; primarily initialize `self.valves` here.

```
def __init__(self):  
    self.valves = self.Valves()
```

### The `pipe` Function[​](#the-pipe-function "Direct link to the-pipe-function")

* **Definition**: The core function where your custom logic resides.
* **Parameters**:
  + `body`: A dictionary containing the input data.
* **Purpose**: Processes the input data using your custom logic and returns the result.

```
def pipe(self, body: dict):  
    # Logic goes here  
    print(self.valves, body)  # This will print the configuration options and the input body  
    return "Hello, World!"
```

**Note**: Always place `Valves` at the top of your `Pipe` class, followed by `__init__`, and then the `pipe` function. This structure ensures clarity and consistency.

---

Creating Multiple Models with Pipes[​](#creating-multiple-models-with-pipes "Direct link to Creating Multiple Models with Pipes")
---------------------------------------------------------------------------------------------------------------------------------

What if you want your Pipe to create **multiple models** within Open WebUI? You can achieve this by defining a `pipes` function or variable inside your `Pipe` class. This setup, informally called a **manifold**, allows your Pipe to represent multiple models.

Here's how you can do it:

```
from pydantic import BaseModel, Field  
  
class Pipe:  
    class Valves(BaseModel):  
        MODEL_ID: str = Field(default="")  
  
    def __init__(self):  
        self.valves = self.Valves()  
  
    def pipes(self):  
        return [  
            {"id": "model_id_1", "name": "model_1"},  
            {"id": "model_id_2", "name": "model_2"},  
            {"id": "model_id_3", "name": "model_3"},  
        ]  
  
    def pipe(self, body: dict):  
        # Logic goes here  
        print(self.valves, body)  # Prints the configuration options and the input body  
        model = body.get("model", "")  
        return f"{model}: Hello, World!"
```

### Explanation[​](#explanation "Direct link to Explanation")

* **`pipes` Function**:

  + Returns a list of dictionaries.
  + Each dictionary represents a model with unique `id` and `name` keys.
  + These models will show up individually in the Open WebUI model selector.
* **Updated `pipe` Function**:

  + Processes input based on the selected model.
  + In this example, it includes the model name in the returned string.

---

Example: OpenAI Proxy Pipe[​](#example-openai-proxy-pipe "Direct link to Example: OpenAI Proxy Pipe")
-----------------------------------------------------------------------------------------------------

Let's dive into a practical example where we'll create a Pipe that proxies requests to the OpenAI API. This Pipe will fetch available models from OpenAI and allow users to interact with them through Open WebUI.

```
from pydantic import BaseModel, Field  
import requests  
  
class Pipe:  
    class Valves(BaseModel):  
        NAME_PREFIX: str = Field(  
            default="OPENAI/",  
            description="Prefix to be added before model names.",  
        )  
        OPENAI_API_BASE_URL: str = Field(  
            default="https://api.openai.com/v1",  
            description="Base URL for accessing OpenAI API endpoints.",  
        )  
        OPENAI_API_KEY: str = Field(  
            default="",  
            description="API key for authenticating requests to the OpenAI API.",  
        )  
  
    def __init__(self):  
        self.valves = self.Valves()  
  
    def pipes(self):  
        if self.valves.OPENAI_API_KEY:  
            try:  
                headers = {  
                    "Authorization": f"Bearer {self.valves.OPENAI_API_KEY}",  
                    "Content-Type": "application/json",  
                }  
  
                r = requests.get(  
                    f"{self.valves.OPENAI_API_BASE_URL}/models", headers=headers  
                )  
                models = r.json()  
                return [  
                    {  
                        "id": model["id"],  
                        "name": f'{self.valves.NAME_PREFIX}{model.get("name", model["id"])}',  
                    }  
                    for model in models["data"]  
                    if "gpt" in model["id"]  
                ]  
  
            except Exception as e:  
                return [  
                    {  
                        "id": "error",  
                        "name": "Error fetching models. Please check your API Key.",  
                    },  
                ]  
        else:  
            return [  
                {  
                    "id": "error",  
                    "name": "API Key not provided.",  
                },  
            ]  
  
    def pipe(self, body: dict, __user__: dict):  
        print(f"pipe:{__name__}")  
        headers = {  
            "Authorization": f"Bearer {self.valves.OPENAI_API_KEY}",  
            "Content-Type": "application/json",  
        }  
  
        # Extract model id from the model name  
        model_id = body["model"][body["model"].find(".") + 1 :]  
  
        # Update the model id in the body  
        payload = {**body, "model": model_id}  
        try:  
            r = requests.post(  
                url=f"{self.valves.OPENAI_API_BASE_URL}/chat/completions",  
                json=payload,  
                headers=headers,  
                stream=True,  
            )  
  
            r.raise_for_status()  
  
            if body.get("stream", False):  
                return r.iter_lines()  
            else:  
                return r.json()  
        except Exception as e:  
            return f"Error: {e}"
```

### Detailed Breakdown[​](#detailed-breakdown "Direct link to Detailed Breakdown")

#### Valves Configuration[​](#valves-configuration "Direct link to Valves Configuration")

* **`NAME_PREFIX`**:
  + Adds a prefix to the model names displayed in Open WebUI.
  + Default: `"OPENAI/"`.
* **`OPENAI_API_BASE_URL`**:
  + Specifies the base URL for the OpenAI API.
  + Default: `"https://api.openai.com/v1"`.
* **`OPENAI_API_KEY`**:
  + Your OpenAI API key for authentication.
  + Default: `""` (empty string; must be provided).

#### The `pipes` Function[​](#the-pipes-function "Direct link to the-pipes-function")

* **Purpose**: Fetches available OpenAI models and makes them accessible in Open WebUI.
* **Process**:

  1. **Check for API Key**: Ensures that an API key is provided.
  2. **Fetch Models**: Makes a GET request to the OpenAI API to retrieve available models.
  3. **Filter Models**: Returns models that have `"gpt"` in their `id`.
  4. **Error Handling**: If there's an issue, returns an error message.
* **Return Format**: A list of dictionaries with `id` and `name` for each model.

#### The `pipe` Function[​](#the-pipe-function-1 "Direct link to the-pipe-function-1")

* **Purpose**: Handles the request to the selected OpenAI model and returns the response.
* **Parameters**:

  + `body`: Contains the request data.
  + `__user__`: Contains user information (not used in this example but can be useful for authentication or logging).
* **Process**:

  1. **Prepare Headers**: Sets up the headers with the API key and content type.
  2. **Extract Model ID**: Extracts the actual model ID from the selected model name.
  3. **Prepare Payload**: Updates the body with the correct model ID.
  4. **Make API Request**: Sends a POST request to the OpenAI API's chat completions endpoint.
  5. **Handle Streaming**: If `stream` is `True`, returns an iterable of lines.
  6. **Error Handling**: Catches exceptions and returns an error message.

### Extending the Proxy Pipe[​](#extending-the-proxy-pipe "Direct link to Extending the Proxy Pipe")

You can modify this proxy Pipe to support additional service providers like Anthropic, Perplexity, and more by adjusting the API endpoints, headers, and logic within the `pipes` and `pipe` functions.

---

Using Internal Open WebUI Functions[​](#using-internal-open-webui-functions "Direct link to Using Internal Open WebUI Functions")
---------------------------------------------------------------------------------------------------------------------------------

Sometimes, you may want to leverage the internal functions of Open WebUI within your Pipe. You can import these functions directly from the `open_webui` package. Keep in mind that while unlikely, internal functions may change for optimization purposes, so always refer to the latest documentation.

Here's how you can use internal Open WebUI functions:

```
from pydantic import BaseModel, Field  
from fastapi import Request  
  
from open_webui.models.users import Users  
from open_webui.utils.chat import generate_chat_completion  
  
class Pipe:  
    def __init__(self):  
        pass  
  
    async def pipe(  
        self,  
        body: dict,  
        __user__: dict,  
        __request__: Request,  
    ) -> str:  
        # Use the unified endpoint with the updated signature  
        user = Users.get_user_by_id(__user__["id"])  
        body["model"] = "llama3.2:latest"  
        return await generate_chat_completion(__request__, body, user)
```

### Explanation[​](#explanation-1 "Direct link to Explanation")

* **Imports**:

  + `Users` from `open_webui.models.users`: To fetch user information.
  + `generate_chat_completion` from `open_webui.utils.chat`: To generate chat completions using internal logic.
* **Asynchronous `pipe` Function**:

  + **Parameters**:
    - `body`: Input data for the model.
    - `__user__`: Dictionary containing user information.
    - `__request__`: The request object from FastAPI (required by `generate_chat_completion`).
  + **Process**:
    1. **Fetch User Object**: Retrieves the user object using their ID.
    2. **Set Model**: Specifies the model to be used.
    3. **Generate Completion**: Calls `generate_chat_completion` to process the input and produce an output.

### Important Notes[​](#important-notes "Direct link to Important Notes")

* **Function Signatures**: Refer to the latest Open WebUI codebase or documentation for the most accurate function signatures and parameters.
* **Best Practices**: Always handle exceptions and errors gracefully to ensure a smooth user experience.

---

Frequently Asked Questions[​](#frequently-asked-questions "Direct link to Frequently Asked Questions")
------------------------------------------------------------------------------------------------------

### Q1: Why should I use Pipes in Open WebUI?[​](#q1-why-should-i-use-pipes-in-open-webui "Direct link to Q1: Why should I use Pipes in Open WebUI?")

**A**: Pipes allow you to add new "model" with custom logic and processing to Open WebUI. It's a flexible plugin system that lets you integrate external APIs, customize model behaviors, and create innovative features without altering the core codebase.

---

### Q2: What are Valves, and why are they important?[​](#q2-what-are-valves-and-why-are-they-important "Direct link to Q2: What are Valves, and why are they important?")

**A**: Valves are the configurable parameters of your Pipe. They function like settings or controls that determine how your Pipe operates. By adjusting Valves, you can change the behavior of your Pipe without modifying the underlying code.

---

### Q3: Can I create a Pipe without Valves?[​](#q3-can-i-create-a-pipe-without-valves "Direct link to Q3: Can I create a Pipe without Valves?")

**A**: Yes, you can create a simple Pipe without defining a Valves class if your Pipe doesn't require any persistent configuration options. However, including Valves is a good practice for flexibility and future scalability.

---

### Q4: How do I ensure my Pipe is secure when using API keys?[​](#q4-how-do-i-ensure-my-pipe-is-secure-when-using-api-keys "Direct link to Q4: How do I ensure my Pipe is secure when using API keys?")

**A**: Never hard-code sensitive information like API keys into your Pipe. Instead, use Valves to input and store API keys securely. Ensure that your code handles these keys appropriately and avoids logging or exposing them.

---

### Q5: What is the difference between the `pipe` and `pipes` functions?[​](#q5-what-is-the-difference-between-the-pipe-and-pipes-functions "Direct link to q5-what-is-the-difference-between-the-pipe-and-pipes-functions")

**A**:

* **`pipe` Function**: The primary function where you process the input data and generate an output. It handles the logic for a single model.
* **`pipes` Function**: Allows your Pipe to represent multiple models by returning a list of model definitions. Each model will appear individually in Open WebUI.

---

### Q6: How can I handle errors in my Pipe?[​](#q6-how-can-i-handle-errors-in-my-pipe "Direct link to Q6: How can I handle errors in my Pipe?")

**A**: Use try-except blocks within your `pipe` and `pipes` functions to catch exceptions. Return meaningful error messages or handle the errors gracefully to ensure the user is informed about what went wrong.

---

### Q7: Can I use external libraries in my Pipe?[​](#q7-can-i-use-external-libraries-in-my-pipe "Direct link to Q7: Can I use external libraries in my Pipe?")

**A**: Yes, you can import and use external libraries as needed. Ensure that any dependencies are properly installed and managed within your environment.

---

### Q8: How do I test my Pipe?[​](#q8-how-do-i-test-my-pipe "Direct link to Q8: How do I test my Pipe?")

**A**: Test your Pipe by running Open WebUI in a development environment and selecting your custom model from the interface. Validate that your Pipe behaves as expected with various inputs and configurations.

---

### Q9: Are there any best practices for organizing my Pipe's code?[​](#q9-are-there-any-best-practices-for-organizing-my-pipes-code "Direct link to Q9: Are there any best practices for organizing my Pipe's code?")

**A**: Yes, follow these guidelines:

* Keep `Valves` at the top of your `Pipe` class.
* Initialize variables in the `__init__` method, primarily `self.valves`.
* Place the `pipe` function after the `__init__` method.
* Use clear and descriptive variable names.
* Comment your code for clarity.

---

### Q10: Where can I find the latest Open WebUI documentation?[​](#q10-where-can-i-find-the-latest-open-webui-documentation "Direct link to Q10: Where can I find the latest Open WebUI documentation?")

**A**: Visit the official Open WebUI repository or documentation site for the most up-to-date information, including function signatures, examples, and migration guides if any changes occur.

---

Conclusion[​](#conclusion "Direct link to Conclusion")
------------------------------------------------------

By now, you should have a thorough understanding of how to create and use Pipes in Open WebUI. Pipes offer a powerful way to extend and customize the capabilities of Open WebUI to suit your specific needs. Whether you're integrating external APIs, adding new models, or injecting complex logic, Pipes provide the flexibility to make it happen.

Remember to:

* **Use clear and consistent structure** in your Pipe classes.
* **Leverage Valves** for configurable options.
* **Handle errors gracefully** to improve the user experience.
* **Consult the latest documentation** for any updates or changes.

Happy coding, and enjoy extending your Open WebUI with Pipes!

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/plugin/functions/pipe.mdx)

[Previous

🧰 Functions](/features/plugin/functions/)[Next

🪄 Filter Function](/features/plugin/functions/filter)

* [Introduction to Pipes](#introduction-to-pipes)
* [Understanding the Pipe Structure](#understanding-the-pipe-structure)
  + [The Pipe Class](#the-pipe-class)
  + [Valves: Configuring Your Pipe](#valves-configuring-your-pipe)
  + [The `__init__` Method](#the-__init__-method)
  + [The `pipe` Function](#the-pipe-function)
* [Creating Multiple Models with Pipes](#creating-multiple-models-with-pipes)
  + [Explanation](#explanation)
* [Example: OpenAI Proxy Pipe](#example-openai-proxy-pipe)
  + [Detailed Breakdown](#detailed-breakdown)
  + [Extending the Proxy Pipe](#extending-the-proxy-pipe)
* [Using Internal Open WebUI Functions](#using-internal-open-webui-functions)
  + [Explanation](#explanation-1)
  + [Important Notes](#important-notes)
* [Frequently Asked Questions](#frequently-asked-questions)
  + [Q1: Why should I use Pipes in Open WebUI?](#q1-why-should-i-use-pipes-in-open-webui)
  + [Q2: What are Valves, and why are they important?](#q2-what-are-valves-and-why-are-they-important)
  + [Q3: Can I create a Pipe without Valves?](#q3-can-i-create-a-pipe-without-valves)
  + [Q4: How do I ensure my Pipe is secure when using API keys?](#q4-how-do-i-ensure-my-pipe-is-secure-when-using-api-keys)
  + [Q5: What is the difference between the `pipe` and `pipes` functions?](#q5-what-is-the-difference-between-the-pipe-and-pipes-functions)
  + [Q6: How can I handle errors in my Pipe?](#q6-how-can-i-handle-errors-in-my-pipe)
  + [Q7: Can I use external libraries in my Pipe?](#q7-can-i-use-external-libraries-in-my-pipe)
  + [Q8: How do I test my Pipe?](#q8-how-do-i-test-my-pipe)
  + [Q9: Are there any best practices for organizing my Pipe's code?](#q9-are-there-any-best-practices-for-organizing-my-pipes-code)
  + [Q10: Where can I find the latest Open WebUI documentation?](#q10-where-can-i-find-the-latest-open-webui-documentation)
* [Conclusion](#conclusion)

Docs

* [Getting Started](/getting-started)
* [FAQ](/faq)
* [Help Improve The Docs](https://github.com/open-webui/docs)

Community

* [GitHub](https://github.com/open-webui/open-webui)
* [Discord](https://discord.gg/5rJgQTnV4s)
* [Reddit](https://www.reddit.com/r/OpenWebUI/)
* [𝕏](https://x.com/OpenWebUI)

More

* [Release Notes](https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md)
* [About](https://openwebui.com)
* [Report a Vulnerability / Responsible Disclosure](https://openwebui.com)

![](/images/logo-dark.png)![](/images/logo-dark.png)

---

### Referenced Links
- #__docusaurus_skipToContent_fallback
- /
- /blog
- https://github.com/open-webui/open-webui
- https://discord.com/invite/5rJgQTnV4s
- https://forms.gle/92mvG3ESYj47zzRL9
- /
- /getting-started/
- /features/
- /features/auth/sso/
- /features/plugin/
- /features/plugin/functions/
- /features/plugin/functions/pipe
- /features/plugin/functions/filter
- /features/plugin/functions/action
- /features/plugin/tools/
- /features/plugin/events/
- /features/plugin/valves/
- /features/plugin/migration/
- /features/workspace/
- /features/chat-features/
- /features/rag/
- /features/rbac/
- /features/interface/banners
- /features/evaluation/
- /features/channels/
- /features/pipelines/
- /features/mcp
- /openapi-servers/
- /troubleshooting/
- /category/-tutorials
- /faq
- /roadmap
- /security
- /contributing
- /sponsorships
- /brand
- /license
- /enterprise/
- /mission
- /team
- https://forms.gle/92mvG3ESYj47zzRL9
- /
- /features/
- /features/plugin/
- /features/plugin/functions/
- #introduction-to-pipes
- #understanding-the-pipe-structure
- #the-pipe-class
- #valves-configuring-your-pipe
- #the-__init__-method
- #the-pipe-function
- #creating-multiple-models-with-pipes
- #explanation
- #example-openai-proxy-pipe
- #detailed-breakdown
- #valves-configuration
- #the-pipes-function
- #the-pipe-function-1
- #extending-the-proxy-pipe
- #using-internal-open-webui-functions
- #explanation-1
- #important-notes
- #frequently-asked-questions
- #q1-why-should-i-use-pipes-in-open-webui
- #q2-what-are-valves-and-why-are-they-important
- #q3-can-i-create-a-pipe-without-valves
- #q4-how-do-i-ensure-my-pipe-is-secure-when-using-api-keys
- #q5-what-is-the-difference-between-the-pipe-and-pipes-functions
- #q6-how-can-i-handle-errors-in-my-pipe
- #q7-can-i-use-external-libraries-in-my-pipe
- #q8-how-do-i-test-my-pipe
- #q9-are-there-any-best-practices-for-organizing-my-pipes-code
- #q10-where-can-i-find-the-latest-open-webui-documentation
- #conclusion
- https://github.com/open-webui/docs/blob/main/docs/features/plugin/functions/pipe.mdx
- /features/plugin/functions/
- /features/plugin/functions/filter
- #introduction-to-pipes
- #understanding-the-pipe-structure
- #the-pipe-class
- #valves-configuring-your-pipe
- #the-__init__-method
- #the-pipe-function
- #creating-multiple-models-with-pipes
- #explanation
- #example-openai-proxy-pipe
- #detailed-breakdown
- #extending-the-proxy-pipe
- #using-internal-open-webui-functions
- #explanation-1
- #important-notes
- #frequently-asked-questions
- #q1-why-should-i-use-pipes-in-open-webui
- #q2-what-are-valves-and-why-are-they-important
- #q3-can-i-create-a-pipe-without-valves
- #q4-how-do-i-ensure-my-pipe-is-secure-when-using-api-keys
- #q5-what-is-the-difference-between-the-pipe-and-pipes-functions
- #q6-how-can-i-handle-errors-in-my-pipe
- #q7-can-i-use-external-libraries-in-my-pipe
- #q8-how-do-i-test-my-pipe
- #q9-are-there-any-best-practices-for-organizing-my-pipes-code
- #q10-where-can-i-find-the-latest-open-webui-documentation
- #conclusion
- /getting-started
- /faq
- https://github.com/open-webui/docs
- https://github.com/open-webui/open-webui
- https://discord.gg/5rJgQTnV4s
- https://www.reddit.com/r/OpenWebUI/
- https://x.com/OpenWebUI
- https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md
- https://openwebui.com
- https://openwebui.com
