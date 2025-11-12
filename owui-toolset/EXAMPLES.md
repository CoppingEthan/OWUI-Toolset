# Usage Examples

## Starting the System

### Quick Start
```bash
cd /root/owui-toolset
./start.sh
```

### Manual Start
```bash
# Terminal 1: API Server
cd server
node api.js

# Terminal 2: Web Server  
cd server
node web.js

# Terminal 3: Log Viewer (optional)
node cli/log-viewer.js
```

## Accessing the Dashboard

### Open Web Interface
```
http://localhost:3000
```

### Toggle Between Views
- Click "Simplified View" for clean card layout
- Click "Raw Logs" for full JSON data

### Search Logs
- Type in search box to filter by:
  - Username
  - Model name
  - Message content

### Auto-refresh
- Click "Auto-refresh: OFF" to enable
- Logs update every 5 seconds automatically

## Using the API Directly

### Check Health
```bash
curl http://localhost:3001/health
```

### Get All Logs
```bash
curl http://localhost:3001/api/logs | jq
```

### Get Logs for Specific User
```bash
curl "http://localhost:3001/api/logs?username=john.doe" | jq
```

### Get Specific Log
```bash
curl http://localhost:3001/api/logs/john.doe/1762942389747-c277abbe | jq
```

### Get Activity Log
```bash
curl "http://localhost:3001/api/activity?lines=10" | jq
```

### Create Log Entry (for testing)
```bash
curl -X POST http://localhost:3001/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test-user",
    "request": {
      "model": "gpt-4",
      "messages": [
        {"role": "user", "content": "Hello!"}
      ]
    },
    "response": {
      "messages": [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi there!"}
      ]
    },
    "metadata": {
      "model": "gpt-4",
      "timestamp": "'$(date -Iseconds)'"
    }
  }'
```

## CLI Log Viewer

### Basic Usage
```bash
node cli/log-viewer.js
```

### Show More History
```bash
node cli/log-viewer.js --lines=50
```

### Continuous Monitoring
Leave the CLI viewer running in a terminal to see logs as they happen in real-time.

## Installing the Filter in OWUI

### Method 1: Web Interface
1. Go to OWUI Admin Panel
2. Navigate to Functions
3. Click "Add Function"
4. Copy contents of `filter/request_logger_filter.py`
5. Paste and save
6. Enable the filter

### Method 2: File System
1. Copy filter to OWUI functions directory:
   ```bash
   cp filter/request_logger_filter.py /path/to/owui/functions/
   ```
2. Restart OWUI
3. Enable filter in admin panel

### Configure Filter
In OWUI, go to filter settings and adjust:
- `api_url`: Set to your API server (default: http://localhost:3001)
- `enabled`: Enable/disable logging
- `log_request`: Log incoming requests
- `log_response`: Log outgoing responses
- `capture_files`: Capture uploaded files
- `debug`: Enable debug output

## Viewing Stored Logs

### List All User Directories
```bash
ls -la /root/owui-toolset/users/
```

### View Specific Log
```bash
# Navigate to user's log directory
cd users/john.doe/1762942389747-c277abbe

# View request
cat request.json | jq

# View response
cat response.json | jq

# View metadata
cat metadata.json | jq

# List files
ls -la files/
```

### View Activity Log
```bash
tail -f logs/activity.log
```

### Search Activity Log
```bash
# Find logs for specific user
grep "user=john.doe" logs/activity.log

# Find errors
grep "ERROR" logs/activity.log

# Find specific model usage
grep "model=gpt-4" logs/activity.log
```

## Testing

### Run All Tests
```bash
# API tests
node tests/test-api.js

# Filter tests
python3 tests/test-filter.py
```

### Test Individual Endpoints
```bash
# Health check
curl http://localhost:3001/health

# List logs
curl http://localhost:3001/api/logs

# Activity
curl http://localhost:3001/api/activity
```

## Monitoring

### Check Running Services
```bash
ps aux | grep node
```

### View API Logs
```bash
tail -f /tmp/owui-api.log
```

### View Web Server Logs
```bash
tail -f /tmp/owui-web.log
```

### Monitor Disk Usage
```bash
# Check total size
du -sh users/

# Check by user
du -sh users/*

# Count logs
find users/ -name "metadata.json" | wc -l
```

## Cleanup

### Remove Old Logs
```bash
# Delete logs older than 7 days
find users/ -type d -mtime +7 -exec rm -rf {} +

# Delete specific user's logs
rm -rf users/john.doe/*

# Delete all logs
rm -rf users/*
```

### Rotate Activity Log
```bash
# Archive current log
mv logs/activity.log logs/activity.log.$(date +%Y%m%d)

# Create new log
touch logs/activity.log
```

### Stop Services
```bash
./stop.sh
```

## Integration Examples

### Python Integration
```python
import requests

# Send custom log
response = requests.post('http://localhost:3001/api/log', json={
    'username': 'bot-user',
    'request': {'model': 'gpt-4', 'messages': [...]},
    'response': {'messages': [...]},
    'metadata': {'timestamp': '2025-11-12T10:00:00Z'}
})

print(response.json())
```

### JavaScript Integration
```javascript
// Fetch logs
fetch('http://localhost:3001/api/logs')
  .then(r => r.json())
  .then(data => console.log(data));

// Create log
fetch('http://localhost:3001/api/log', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'test',
    request: {...},
    response: {...},
    metadata: {...}
  })
});
```

### Real-time Streaming (JavaScript)
```javascript
const eventSource = new EventSource('http://localhost:3001/api/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New log event:', data);
};
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001
lsof -i :3000

# Kill process
kill $(lsof -t -i:3001)
```

### Services Not Starting
```bash
# Check logs
tail -f /tmp/owui-api.log
tail -f /tmp/owui-web.log

# Verify Node.js
node --version

# Reinstall dependencies
cd server && rm -rf node_modules && npm install
```

### Filter Not Working
```bash
# Enable debug mode in filter
# Set debug: True in OWUI filter settings

# Check API is reachable from OWUI
curl http://localhost:3001/health

# Verify filter is enabled in OWUI
```

### No Logs Appearing
```bash
# Check directory permissions
ls -la users/

# Check activity log
tail logs/activity.log

# Test API manually
curl -X POST http://localhost:3001/api/log -H "Content-Type: application/json" -d '{"username":"test","metadata":{}}'
```

## Advanced Usage

### Custom Port Configuration
```javascript
// In server/api.js
const PORT = 8001;  // Change API port

// In server/web.js
const PORT = 8000;  // Change web port
const API_URL = 'http://localhost:8001';  // Update API URL
```

### Remote API Server
```python
# In filter/request_logger_filter.py
api_url: str = "http://remote-server.com:3001"
```

### HTTPS/SSL
```javascript
// In server/api.js and web.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(PORT);
```

## Performance Tips

1. **Limit Log Retention**
   - Set up cron job to clean old logs
   - Keep only last 30 days

2. **Monitor Disk Space**
   ```bash
   df -h
   du -sh users/
   ```

3. **Disable File Capture**
   - Set `capture_files: False` if not needed
   - Reduces storage significantly

4. **Use Log Rotation**
   - Rotate activity.log daily
   - Compress old logs

5. **Database Migration**
   - For high volume, consider moving to PostgreSQL/MongoDB
   - Keep file storage for actual files only

## Support

For issues, check:
- README.md for detailed documentation
- logs/activity.log for errors
- /tmp/owui-api.log for API errors
- /tmp/owui-web.log for web server errors

Happy logging! 🚀
