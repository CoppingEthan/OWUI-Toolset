# https://docs.openwebui.com/tutorials/integrations/continue-dev

  * [](/)
  * [🎓 Tutorials](/category/-tutorials)
  * [Integrations](/category/integrations)
  * Continue.dev VS Code Extension with Open WebUI



On this page

warning

This tutorial is a community contribution and is not supported by the Open WebUI team. It serves only as a demonstration on how to customize Open WebUI for your specific use case. Want to contribute? Check out the [contributing tutorial](/contributing).

# Integrating Continue.dev VS Code Extension with Open WebUI

## Download Extension​

You can download the VS Code extension on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Continue.continue) or directly via the `EXTENSION:MARKETPLACE` within VS Code by searching for `continue`. Once installed, you can access the application via the `continue` tab in the side bar of VS Code.

**VS Code side bar icon:**

![continue.dev vscode icon](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAAAsCAYAAAD1s+ECAAAABHNCSVQICAgIfAhkiAAABLFJREFUaIHtmE9PE1sYh5/505bOFK2U0ozJLEyniVCigsYEo4LERBM3Lv0Gfo37NVy59ROYyMbYhaQbUohFDHTQ0qGmOrGI0xHbztzFvfRqBClTrw1Jf8nZnfc9T855z5vfOUIikfBDoRAnUWK/AXrRAL5fGsD3SwP4fmkA3y+daHi51wShUIi5uTnGx8cPneP7PhsbG2xtbVEsFvF9v9dlgd8Ar2ka6XQagFardeAc13XZ3d3l6tWrOI7D5uZmr8sCPcJLksT8/DzhcJhKpcLCwgKnT58+cO7ExASqqjI1NYVt20QiEdrtNp8+fQp8EoHhRVFkenqaU6dO4TgOKysrGIZBNpslkUj8MNd1XdbW1nAch2q1yoMHDxgaGqJYLGJZFqVSiWaz+efgR0dHuXDhAp7nUSqVuHz5MtFoFNM0icViSJL03yKyjKIovHz5kkwmgyRJfPjwgXq9zuzsLLu7u1iW9WfgZVlmcnISVVXZ2dnB8zySySSe52HbNo8ePTowThRFwuEw5XIZ27a5desWkUiEO3fu8Pjx42OXT6BWmUqlMAwD3/cxTZOxsTFEUWRra4vXr18fGud5HgA3b97k/v375PN5Go0GsViMqakpRPF4OIHgZ2ZmCIfDWJbFt2/f0DQNz/PI5XIdwMO03zJFUeTSpUtsbGzg+z4XL1786a4cJUlRlL++r89uJIoilUoF0zQ75fPixQvK5fKRsa1WC1mW0XUdVVWp1WooisLw8DAAlUrlyA3ocByL+l8NDQ1x/fp17t69y+rqKpubm5im2VWs7/usra1hWRaSJJFMJimVSgCk02lSqVTXHIF2vl6vEwqFaDabfP36lXw+j+u6Xcd7nsf29jaqqrK3t8ebN29IJBKcOXOGeDzO6upqV3kCdRtBEBAEAVEUEQQhSAoEQUCSpE6H2c/TbclAwLKZmJggm82SSqVwXZfbt2+jKErX8bIsMz8/TzqdJhqNkk6nSSaTOI7D4uJi93mCwDuOQy6Xo16vMzMzw9jYGIZhsLy8fGSsIAicP3+es2fP0mq1sG27441KpRK1Wu3/hR8fH0fTNN6/f9/p8zdu3ODdu3fU6/VfxkajUQzDQJZlqtUqgiAQi8X48uULxWKRdrvdNUegsllcXGRvbw9N04hGo2xvbyOKIrOzsxx1+TOZDLqu43key8vLGIaBIAgUCgVs2z4WR6Bu02g0GB4eJpVKoaoqlmWRTCY7Ju2wo5ckiXg8jmmaLC0tMTc3RywW4/Pnzzx79uzY9iBQ2bTbbV69esW5c+dQVbVjtBRFYWRkhIcPH/5wAvs2olwuYxgGuq5Tr9dZWVnhypUrLCwsBLLFgZ+Btm1TKBQQRZF0Os3S0hKFQgFd14lEIsiy3BmtVotGo8G1a9f4+PEjzWaT0dFRRkZGyOVyx7qk3yuwJd6v2cnJSeLxONPT0zx9+pRarfZT7/d9n2w2i6IoaJrGkydPiEQitFotdnZ2Aj9GhF6/uHVd5969e4TD4UM7heu6rK+vk8lkeP78+W97Bvb8e1CtVllfX8f3fURRPHDsG698Ps/bt29/A/Y/6nnn+6kT/W8zgO+XBvD90gC+XxrA90snGv5vSoLmXQcSShMAAAAASUVORK5CYII=)

* * *

## Setup​

Click on the assistant selector to the right of the main chat input. Then hover over `Local Assistant` and click on the settings icon (⚙️). This will open the `config.yaml` file in your editor. Here you can change the settings of your `Local Assistant`.

![continue.dev chat input](/assets/images/continue_dev_extension_input_field-9697362dca8bf6a1fb58edb54d5b6760.png)

info

Currently the `ollama` provider does not support authentication so we cannot use this provider with Open WebUI. However Ollama and Open WebUI both have compatibility with OpenAI API spec. Read more about the specification in the [Ollama blog post on OpenAI compatibility](https://ollama.com/blog/openai-compatibility). We can still setup continue.dev to use the openai provider which will allow us to use Open WebUI's authentication token.

### Example config​

Below you find an example config for Llama3 as the model with a local Open WebUI setup.
    
    
    name: Local Assistant  
    version: 1.0.0  
    schema: v1  
    models:  
      - name: LLama3  
        provider: openai  
        model: Meta-Llama-3-8B-Instruct-Q4_K_M.gguf  
        env:  
          useLegacyCompletionsEndpoint: false  
        apiBase: http://localhost:3000/api  
        apiKey: YOUR_OPEN_WEBUI_API_KEY  
        roles:  
          - chat  
          - edit  
    context:  
      - provider: code  
      - provider: docs  
      - provider: diff  
      - provider: terminal  
      - provider: problems  
      - provider: folder  
      - provider: codebase  
      
    

* * *

### Miscellaneous Configuration Settings​

These values are needed by the extension to work properly. Find more information in the [official config guide](https://docs.continue.dev/reference).
    
    
    name: Local Assistant  
    version: 1.0.0  
    schema: v1  
    

The context section provides additional information to the models. Find more information in the [official config guide](https://docs.continue.dev/reference#context) and in the [context provider guide](https://docs.continue.dev/customize/custom-providers).
    
    
    context:  
      - provider: code  
      - provider: docs  
      - provider: diff  
      - provider: terminal  
      - provider: problems  
      - provider: folder  
      - provider: codebase  
    

* * *

### Models​

The models section is where you specify all models you want to add. Find more information in the [official models guide](https://docs.continue.dev/reference#models).
    
    
    models:  
      - ...  
    

* * *

### Name​

Sets the name for the model you want to use. This will be displayed within the chat input of the extension.
    
    
    name: LLama3  
    

![continue.dev chat input](/assets/images/continue_dev_extension_input_field-9697362dca8bf6a1fb58edb54d5b6760.png)

* * *

### Provider​

Specifies the method used to communicate with the API, which in our case is the OpenAI API endpoint provided by Open WebUI.
    
    
    provider: openai  
    

* * *

### Model​

This is the actual name of your model in Open WebUI. Navigate to `Admin Panel` > `Settings` > `Models`, and then click on your preferred LLM. Below the user-given name, you'll find the actual model name.
    
    
    model: Meta-Llama-3-8B-Instruct-Q4_K_M.gguf  
    

* * *

### Legacy completions endpoint​

This setting is not needed for Open WebUI, though more information is available in the [original guide](https://platform.openai.com/docs/guides/completions/completions-api-legacy).
    
    
    env:  
      useLegacyCompletionsEndpoint: false  
    

* * *

### APIBase​

This is a crucial step: you need to direct the continue.dev extension requests to your Open WebUI instance. Either use an actual domain name if the instance is hosted somewhere (e.g., `https://example.com/api`) or your localhost setup (e.g., `http://localhost:3000/api`). You can find more information about the URLs in the [API Endpoints guide](/getting-started/api-endpoints).
    
    
    apiBase: http://localhost:3000/api  
    

* * *

### API Key​

To authenticate with your Open WebUI instance, you'll need to generate an API key. Follow the instructions in [this guide](https://docs.openwebui.com/getting-started/advanced-topics/monitoring#authentication-setup-for-api-key-) to create it.
    
    
    apiKey: YOUR_OPEN_WEBUI_API_KEY  
    

* * *

### Roles​

The roles will allow your model to be used by the extension for certain tasks. For the beginning you can choose `chat` and `edit`. You can find more information about roles in the [official roles guide](https://docs.continue.dev/customize/model-roles/intro).
    
    
    roles:  
      - chat  
      - edit  
    

The setup is now completed and you can interact with your model(s) via the chat input. Find more information about the features and usage of the continue.dev plugin in the [official documentation](https://docs.continue.dev/getting-started/overview).

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/tutorials/integrations/continue-dev.md)

[PreviousLocal LLM Setup with IPEX-LLM on Intel GPU](/tutorials/integrations/ipex_llm)[NextSetting up with Custom CA Store](/tutorials/integrations/custom-ca)

  * Download Extension
  * Setup
    * Example config
    * Miscellaneous Configuration Settings
    * Models
    * Name
    * Provider
    * Model
    * Legacy completions endpoint
    * APIBase
    * API Key
    * Roles


