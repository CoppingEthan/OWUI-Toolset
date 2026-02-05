# OWUI Citations Guide

This document explains how to correctly emit citations/sources from the OWUI Toolset V2 so they appear as **separate, clickable entries** in OWUI's citation panel.

## Common Issue: All Citations Merged Into One

If all your sources appear concatenated into a single citation entry instead of showing as separate clickable citations, there are two things to check:

### 1. Pipeline Must Disable Automatic Citations

In `owui-pipe.py`, the `__init__` method **must** set `self.citation = False`:

```python
def __init__(self):
    self.valves = self.Valves()
    # Disable automatic citations - we emit custom citations via events
    self.citation = False
```

**Why?** OWUI's default behavior (`self.citation = True`) causes automatic citations to override any custom citations you emit via events. Setting it to `False` tells OWUI to use your custom citations instead.

### 2. Citation Metadata Must Include `source` Field

Each citation's `metadata` array must include a `source` field (as a string). This is what OWUI uses to distinguish individual citations.

**Correct format:**

```javascript
{
  source: {
    name: url,        // Used for favicon lookup
    url: url          // The clickable link
  },
  document: [`# ${title}\n\nContent here...`],
  metadata: [{
    title: title,
    source: title,    // <-- REQUIRED: This distinguishes citations
    url: url,
    date_accessed: new Date().toISOString(),
    // ... other fields
  }]
}
```

**Incorrect format (missing `source` in metadata):**

```javascript
{
  source: {
    name: url,
    url: url
  },
  document: [`# ${title}\n\nContent here...`],
  metadata: [{
    title: title,
    // source field missing!
    url: url,
    date_accessed: new Date().toISOString(),
  }]
}
```

## SSE Event Format

The server emits sources via SSE with this format:

```
event: source
data: {"data": {citation object}}
```

The pipeline receives this and emits to OWUI:

```python
await __event_emitter__({"type": "citation", "data": citation_data})
```

## Complete Working Example

### Server Side (executor.js)

```javascript
const sources = results.map((r, index) => ({
  source: {
    name: r.url,
    url: r.url
  },
  document: [`# ${r.title}\n\n${r.content}`],
  metadata: [{
    title: r.title,
    source: r.title,  // Required for separate citations
    url: r.url,
    date_accessed: new Date().toISOString()
  }]
}));
```

### Server Side (server.js)

```javascript
onSource: (source) => {
  try {
    JSON.stringify(source);  // Validate serialization
    sendSSEEvent(res, 'source', { data: source });
  } catch (e) {
    console.error('Failed to serialize source:', e.message);
  }
}
```

### Pipeline Side (owui-pipe.py)

```python
elif current_event == 'source' and __event_emitter__:
    await __event_emitter__({"type": "citation", "data": data.get('data', {})})
```

## Debugging Tips

1. **Check server logs** - Each source emission should show a log line:
   ```
   📚 Emitting source: https://example.com/...
   ```

2. **Count emissions** - If you see 30 log lines but only 1 citation in OWUI, the issue is in the citation format or pipeline.

3. **Compare with web_search** - The `web_search` tool's citations work correctly. Compare its source format in `tavily.js` with your implementation.

## Reference: OWUI Event Documentation

From OWUI docs (`docs/owui/features/plugin/tools/development.md` lines 1136-1157):

```python
await __event_emitter__({
    "type": "citation",
    "data": {
        "document": [content_string],
        "metadata": [
            {
                "date_accessed": datetime.now().isoformat(),
                "source": source_name_string,  # <-- Key field
                # ... other metadata
            }
        ],
        "source": {"name": title, "url": url}
    }
})
```
