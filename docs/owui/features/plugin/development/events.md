# https://docs.openwebui.com/features/plugin/development/events

  * [](/)
  * [⭐ Features](/features/)
  * [Tools & Functions (Plugins)](/features/plugin/)
  * [Development](/category/development)
  * Events



On this page

# 🔔 Events: Using `__event_emitter__` and `__event_call__` in Open WebUI

Open WebUI's plugin architecture is not just about processing input and producing output—**it's about real-time, interactive communication with the UI and users**. To make your Tools, Functions, and Pipes more dynamic, Open WebUI provides a built-in event system via the `__event_emitter__` and `__event_call__` helpers.

This guide explains **what events are** , **how you can trigger them** from your code, and **the full catalog of event types** you can use (including much more than just `"input"`).

* * *

## 🌊 What Are Events?​

**Events** are real-time notifications or interactive requests sent from your backend code (Tool, or Function) to the web UI. They allow you to update the chat, display notifications, request confirmation, run UI flows, and more.

  * Events are sent using the `__event_emitter__` helper for one-way updates, or `__event_call__` when you need user input or a response (e.g., confirmation, input, etc.).



**Metaphor:** Think of Events like push notifications and modal dialogs that your plugin can trigger, making the chat experience richer and more interactive.

* * *

## 🧰 Basic Usage​

### Sending an Event​

You can trigger an event anywhere inside your Tool, or Function by calling:
    
    
    await __event_emitter__(  
        {  
            "type": "status",  # See the event types list below  
            "data": {  
                "description": "Processing started!",  
                "done": False,  
                "hidden": False,  
            },  
        }  
    )  
    

You **do not** need to manually add fields like `chat_id` or `message_id`—these are handled automatically by Open WebUI.

### Interactive Events​

When you need to pause execution until the user responds (e.g., confirm/cancel dialogs, code execution, or input), use `__event_call__`:
    
    
    result = await __event_call__(  
        {  
            "type": "input",  # Or "confirmation", "execute"  
            "data": {  
                "title": "Please enter your password",  
                "message": "Password is required for this action",  
                "placeholder": "Your password here",  
            },  
        }  
    )  
      
    # result will contain the user's input value  
    

* * *

## 📜 Event Payload Structure​

When you emit or call an event, the basic structure is:
    
    
    {  
      "type": "event_type",   // See full list below  
      "data": { ... }         // Event-specific payload  
    }  
    

Most of the time, you only set `"type"` and `"data"`. Open WebUI fills in the routing automatically.

* * *

## 🗂 Full List of Event Types​

Below is a comprehensive table of **all supported`type` values** for events, along with their intended effect and data structure. (This is based on up-to-date analysis of Open WebUI event handling logic.)

type| When to use| Data payload structure (examples)  
---|---|---  
`status`| Show a status update/history for a message| `{description: ..., done: bool, hidden: bool}`  
`chat:completion`| Provide a chat completion result| (Custom, see Open WebUI internals)  
`chat:message:delta`,  
`message`| Append content to the current message| `{content: "text to append"}`  
`chat:message`,  
`replace`| Replace current message content completely| `{content: "replacement text"}`  
`chat:message:files`,  
`files`| Set or overwrite message files (for uploads, output)| `{files: [...]}`  
`chat:title`| Set (or update) the chat conversation title| Topic string OR `{title: ...}`  
`chat:tags`| Update the set of tags for a chat| Tag array or object  
`source`,  
`citation`| Add a source/citation, or code execution result| For code: See [below.](/features/plugin/development/events#source-or-citation-and-code-execution)  
`notification`| Show a notification ("toast") in the UI| `{type: "info" or "success" or "error" or "warning", content: "..."}`  
`confirmation`   
(needs `__event_call__`)| Ask for confirmation (OK/Cancel dialog)| `{title: "...", message: "..."}`  
`input`   
(needs `__event_call__`)| Request simple user input ("input box" dialog)| `{title: "...", message: "...", placeholder: "...", value: ...}`  
`execute`   
(needs `__event_call__`)| Request user-side code execution and return result| `{code: "...javascript code..."}`  
`chat:message:favorite`| Update the favorite/pin status of a message| `{"favorite": bool}`  
  
**Other/Advanced types:**

  * You can define your own types and handle them at the UI layer (or use upcoming event-extension mechanisms).



### ❗ Details on Specific Event Types​

### `status`​

Show a status/progress update in the UI:
    
    
    await __event_emitter__(  
        {  
            "type": "status",  
            "data": {  
                "description": "Step 1/3: Fetching data...",  
                "done": False,  
                "hidden": False,  
            },  
        }  
    )  
    

* * *

### `chat:message:delta` or `message`​

**Streaming output** (append text):
    
    
    await __event_emitter__(  
        {  
            "type": "chat:message:delta",  # or simply "message"  
            "data": {  
                "content": "Partial text, "  
            },  
        }  
    )  
      
    # Later, as you generate more:  
    await __event_emitter__(  
        {  
            "type": "chat:message:delta",  
            "data": {  
                "content": "next chunk of response."  
            },  
        }  
    )  
    

* * *

### `chat:message` or `replace`​

**Set (or replace) the entire message content:**
    
    
    await __event_emitter__(  
        {  
            "type": "chat:message",  # or "replace"  
            "data": {  
                "content": "Final, complete response."  
            },  
        }  
    )  
    

* * *

### `files` or `chat:message:files`​

**Attach or update files:**
    
    
    await __event_emitter__(  
        {  
            "type": "files",  # or "chat:message:files"  
            "data": {  
                "files": [  
                   # Open WebUI File Objects  
                ]  
            },  
        }  
    )  
    

* * *

### `chat:title`​

**Update the chat's title:**
    
    
    await __event_emitter__(  
        {  
            "type": "chat:title",  
            "data": {  
                "title": "Market Analysis Bot Session"  
            },  
        }  
    )  
    

* * *

### `chat:tags`​

**Update the chat's tags:**
    
    
    await __event_emitter__(  
        {  
            "type": "chat:tags",  
            "data": {  
                "tags": ["finance", "AI", "daily-report"]  
            },  
        }  
    )  
    

* * *

### `source` or `citation` (and code execution)​

**Add a reference/citation:**
    
    
    await __event_emitter__(  
        {  
            "type": "source",  # or "citation"  
            "data": {  
                # Open WebUI Source (Citation) Object  
            }  
        }  
    )  
    

**For code execution (track execution state):**
    
    
    await __event_emitter__(  
        {  
            "type": "source",  
            "data": {  
                # Open WebUI Code Source (Citation) Object  
            }  
        }  
    )  
    

* * *

### `notification`​

**Show a toast notification:**
    
    
    await __event_emitter__(  
        {  
            "type": "notification",  
            "data": {  
                "type": "info",  # "success", "warning", "error"  
                "content": "The operation completed successfully!"  
            }  
        }  
    )  
    

* * *

### `chat:message:favorite`​

**Update the favorite/pin status of a message:**
    
    
    await __event_emitter__(  
        {  
            "type": "chat:message:favorite",  
            "data": {  
                "favorite": True  # or False to unpin  
            }  
        }  
    )  
    

**What this does exactly:** This event forces the Open WebUI frontend to update the "favorite" state of a message in its local cache. Without this emitter, if an **Action Function** modifies the `message.favorite` field in the database directly, the frontend (which maintains its own state) might overwrite your change during its next auto-save cycle. This emitter ensures the UI and database stay perfectly in sync.

**Where it appears:**

  * **Message Toolbar** : When set to `True`, the "Heart" icon beneath the message will fill in, indicating it is favorited.
  * **Chat Overview** : Favorited messages (pins) are highlighted in the conversation overview, making it easier for users to locate key information later.



#### Example: "Pin Message" Action​

For a practical implementation of this event in a real-world plugin, see the **[Pin Message Action on Open WebUI Community](https://openwebui.com/posts/pin_message_action_143594d1)**. This action demonstrates how to toggle the favorite status in the database and immediately sync the UI using the `chat:message:favorite` event.

* * *

### `confirmation` (**requires** `__event_call__`)​

**Show a confirm dialog and get user response:**
    
    
    result = await __event_call__(  
        {  
            "type": "confirmation",  
            "data": {  
                "title": "Are you sure?",  
                "message": "Do you really want to proceed?"  
            }  
        }  
    )  
      
    if result:  # or check result contents  
        await __event_emitter__({  
            "type": "notification",  
            "data": {"type": "success", "content": "User confirmed operation."}  
        })  
    else:  
        await __event_emitter__({  
            "type": "notification",  
            "data": {"type": "warning", "content": "User cancelled."}  
        })  
    

* * *

### `input` (**requires** `__event_call__`)​

**Prompt user for text input:**
    
    
    result = await __event_call__(  
        {  
            "type": "input",  
            "data": {  
                "title": "Enter your name",  
                "message": "We need your name to proceed.",  
                "placeholder": "Your full name"  
            }  
        }  
    )  
      
    user_input = result  
    await __event_emitter__(  
        {  
            "type": "notification",  
            "data": {"type": "info", "content": f"You entered: {user_input}"}  
        }  
    )  
    

* * *

### `execute` (**requires** `__event_call__`)​

**Run code dynamically on the user's side:**
    
    
    result = await __event_call__(  
        {  
            "type": "execute",  
            "data": {  
                "code": "print(40 + 2);",  
            }  
        }  
    )  
      
    await __event_emitter__(  
        {  
            "type": "notification",  
            "data": {  
                "type": "info",  
                "content": f"Code executed, result: {result}"  
            }  
        }  
    )  
    

* * *

## 🏗️ When & Where to Use Events​

  * **From any Tool, or Function** in Open WebUI.
  * To **stream responses** , show progress, request user data, update the UI, or display supplementary info/files.
  * `await __event_emitter__` is for one-way messages (fire and forget).
  * `await __event_call__` is for when you need a response from the user (input, execute, confirmation).



* * *

## 💡 Tips & Advanced Notes​

  * **Multiple types per message:** You can emit several events of different types for one message—for example, show `status` updates, then stream with `chat:message:delta`, then complete with a `chat:message`.
  * **Custom event types:** While the above list is the standard, you may use your own types and detect/handle them in custom UI code.
  * **Extensibility:** The event system is designed to evolve—always check the [Open WebUI documentation](https://github.com/open-webui/open-webui) for the most current list and advanced usage.



* * *

## 🧐 FAQ​

### Q: How do I trigger a notification for the user?​

Use `notification` type:
    
    
    await __event_emitter__({  
        "type": "notification",  
        "data": {"type": "success", "content": "Task complete"}  
    })  
    

### Q: How do I prompt the user for input and get their answer?​

Use:
    
    
    response = await __event_call__({  
        "type": "input",  
        "data": {  
            "title": "What's your name?",  
            "message": "Please enter your preferred name:",  
            "placeholder": "Name"  
        }  
    })  
      
    # response will be: {"value": "user's answer"}  
    

### Q: What event types are available for `__event_call__`?​

  * `"input"`: Input box dialog
  * `"confirmation"`: Yes/No, OK/Cancel dialog
  * `"execute"`: Run provided code on client and return result



### Q: Can I update files attached to a message?​

Yes—use the `"files"` or `"chat:message:files"` event type with a `{files: [...]}` payload.

### Q: Can I update the conversation title or tags?​

Absolutely: use `"chat:title"` or `"chat:tags"` accordingly.

### Q: Can I stream responses (partial tokens) to the user?​

Yes—emit `"chat:message:delta"` events in a loop, then finish with `"chat:message"`.

* * *

## 📝 Conclusion​

**Events** give you real-time, interactive superpowers inside Open WebUI. They let your code update content, trigger notifications, request user input, stream results, handle code, and much more—seamlessly plugging your backend intelligence into the chat UI.

  * Use `__event_emitter__` for one-way status/content updates.
  * Use `__event_call__` for interactions that require user follow-up (input, confirmation, execution).



Refer to this document for common event types and structures, and explore Open WebUI source code or docs for breaking updates or custom events!

* * *

**Happy event-driven coding in Open WebUI! 🚀**

[ Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/plugin/development/events.mdx)

[PreviousDevelopment](/category/development)[NextValves](/features/plugin/development/valves)

  * 🌊 What Are Events?
  * 🧰 Basic Usage
    * Sending an Event
    * Interactive Events
  * 📜 Event Payload Structure
  * 🗂 Full List of Event Types
    * ❗ Details on Specific Event Types
    * `status`
    * `chat:message:delta` or `message`
    * `chat:message` or `replace`
    * `files` or `chat:message:files`
    * `chat:title`
    * `chat:tags`
    * `source` or `citation` (and code execution)
    * `notification`
    * `chat:message:favorite`
    * `confirmation` (**requires** `__event_call__`)
    * `input` (**requires** `__event_call__`)
    * `execute` (**requires** `__event_call__`)
  * 🏗️ When & Where to Use Events
  * 💡 Tips & Advanced Notes
  * 🧐 FAQ
    * Q: How do I trigger a notification for the user?
    * Q: How do I prompt the user for input and get their answer?
    * Q: What event types are available for `__event_call__`?
    * Q: Can I update files attached to a message?
    * Q: Can I update the conversation title or tags?
    * Q: Can I stream responses (partial tokens) to the user?
  * 📝 Conclusion


