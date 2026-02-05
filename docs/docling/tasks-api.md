# Tasks API

The Tasks API provides endpoints for managing asynchronous document processing tasks. Use these endpoints to check task status and retrieve results.

## Endpoints

### GET /v1/status/poll/{task_id}

**Task Status Poll**

Check the current status of an async processing task.

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| task_id | path | string | Yes | The unique task identifier |

**Responses:**

- **200**: Successful Response
  - Schema: `TaskStatusResponse`
- **422**: Validation Error

**Example:**

```bash
curl "http://10.0.0.26:5001/v1/status/poll/abc123-task-id"
```

**Response Example:**

```json
{
  "task_id": "abc123-task-id",
  "status": "completed",
  "progress": 100,
  "task_type": "convert"
}
```

---

### GET /v1/result/{task_id}

**Task Result**

Retrieve the result of a completed async task.

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| task_id | path | string | Yes | The unique task identifier |

**Responses:**

- **200**: Successful Response
  - Returns the converted/chunked document result
- **422**: Validation Error

**Example:**

```bash
curl "http://10.0.0.26:5001/v1/result/abc123-task-id"
```

---

## Task Lifecycle

1. **Submit Task**: POST to an async endpoint (e.g., `/v1/convert/source/async`)
2. **Receive Task ID**: Response includes `task_id`
3. **Poll Status**: GET `/v1/status/poll/{task_id}` until status is `completed`
4. **Retrieve Result**: GET `/v1/result/{task_id}` to get the processed document

## Task Statuses

| Status | Description |
|--------|-------------|
| pending | Task is queued, not yet started |
| processing | Task is currently being processed |
| completed | Task completed successfully |
| failed | Task failed with an error |

## Clear Endpoints

### GET /v1/clear/converters

Clear all converter instances from memory.

**Responses:**
- **200**: Successful Response

```bash
curl "http://10.0.0.26:5001/v1/clear/converters"
```

---

### GET /v1/clear/results

Clear stored results from memory.

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| task_id | query | string | No | Specific task ID to clear (clears all if not specified) |

**Responses:**
- **200**: Successful Response
- **422**: Validation Error

```bash
# Clear all results
curl "http://10.0.0.26:5001/v1/clear/results"

# Clear specific task result
curl "http://10.0.0.26:5001/v1/clear/results?task_id=abc123"
```
