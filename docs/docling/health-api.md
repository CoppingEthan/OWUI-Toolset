# Health API

The Health API provides endpoints for monitoring the service status and retrieving version information.

## Endpoints

### GET /health

**Health Check**

Check if the Docling Serve service is running and healthy.

**Responses:**

- **200**: Successful Response
  - Schema: `HealthCheckResponse`

**Example:**

```bash
curl "http://10.0.0.26:5001/health"
```

**Response Example:**

```json
{
  "status": "ok"
}
```

---

### GET /version

**Version Info**

Get version information about the Docling Serve instance.

**Responses:**

- **200**: Successful Response
  - Returns version information object

**Example:**

```bash
curl "http://10.0.0.26:5001/version"
```

**Response Example:**

```json
{
  "version": "1.9.0",
  "docling_version": "2.x.x",
  "python_version": "3.11.x"
}
```

---

### GET /openapi-3.0.json

**OpenAPI 3.0 Specification**

Returns the OpenAPI 3.0 compatible specification (useful for tools that don't support OpenAPI 3.1).

**Responses:**

- **200**: Successful Response

**Example:**

```bash
curl "http://10.0.0.26:5001/openapi-3.0.json"
```

---

## Monitoring Best Practices

1. **Regular Health Checks**: Poll `/health` endpoint at regular intervals
2. **Version Tracking**: Log version info for debugging
3. **Readiness Probes**: Use `/health` for Kubernetes readiness probes
4. **Liveness Probes**: Use `/health` for Kubernetes liveness probes

### Kubernetes Probe Example

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 5001
  initialDelaySeconds: 5
  periodSeconds: 5
```
