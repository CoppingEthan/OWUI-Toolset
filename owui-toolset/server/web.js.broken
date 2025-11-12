const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OWUI Request Logger</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1a1f36 100%);
      color: #e2e8f0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    h1 { font-size: 2rem; margin-bottom: 5px; }
    .subtitle { font-size: 0.95rem; opacity: 0.9; }
    .controls {
      background: #1e293b;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-primary { background: #667eea; color: white; }
    .btn-primary:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
    .btn-secondary { background: #475569; color: white; }
    .btn-secondary:hover { background: #334155; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }
    .btn.active { background: #10b981; }
    .view-toggle { display: flex; gap: 8px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #1e293b;
      padding: 18px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .stat-value { font-size: 1.8rem; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 0.8rem; color: #94a3b8; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    #logs-container { min-height: 400px; }
    .log-card {
      background: #1e293b;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 12px;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }
    .log-card:hover { transform: translateX(4px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
    .log-header { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: start; }
    .log-user { font-size: 1.1rem; font-weight: bold; color: #667eea; }
    .log-time { font-size: 0.8rem; color: #94a3b8; }
    .log-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 10px; }
    .log-detail-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
    .log-detail-value { font-size: 0.95rem; color: #e2e8f0; margin-top: 3px; word-break: break-word; }
    .log-preview {
      background: #0f172a;
      padding: 12px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #94a3b8;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 80px;
      overflow: hidden;
      position: relative;
    }
    .log-preview::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background: linear-gradient(transparent, #0f172a);
    }
    .raw-view {
      background: #0f172a;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 12px;
      border: 1px solid #334155;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .raw-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #334155;
    }
    .raw-id { font-weight: bold; color: #667eea; font-size: 0.9rem; }
    .raw-content {
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      background: #1e293b;
      padding: 12px;
      border-radius: 6px;
      max-height: 300px;
      overflow: auto;
    }
    .loading { text-align: center; padding: 40px; font-size: 1.1rem; color: #94a3b8; }
    .error { background: #dc2626; color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
    .hidden { display: none; }
    .search-box { flex: 1; min-width: 250px; }
    .search-box input {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #334155;
      border-radius: 6px;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 0.9rem;
    }
    .search-box input:focus { outline: none; border-color: #667eea; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: #10b981; color: white; }
    .log-type-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .log-type-request {
      background: #3b82f6;
      color: white;
      border-left: 4px solid #1d4ed8;
    }
    .log-type-response {
      background: #10b981;
      color: white;
      border-left: 4px solid #059669;
    }
    .log-card.request-log {
      border-left: 4px solid #3b82f6;
    }
    .log-card.response-log {
      border-left: 4px solid #10b981;
    }
    .request-icon::before { content: '📤 '; }
    .response-icon::before { content: '📥 '; }
    .files-section {
      margin-top: 12px;
      padding: 10px;
      background: #0f172a;
      border-radius: 6px;
      border-left: 3px solid #f59e0b;
    }
    .files-header {
      font-size: 0.75rem;
      color: #f59e0b;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .file-item {
      padding: 6px 10px;
      background: #1e293b;
      border-radius: 4px;
      margin-bottom: 6px;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .file-item:last-child { margin-bottom: 0; }
    .file-name {
      color: #e2e8f0;
      font-weight: 500;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 10px;
    }
    .file-size {
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .file-icon { margin-right: 6px; }
    .token-info {
      display: flex;
      gap: 15px;
      align-items: center;
      padding: 10px;
      background: #0f172a;
      border-radius: 6px;
      margin-top: 10px;
      font-size: 0.85rem;
    }
    .token-stat {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .token-label {
      color: #94a3b8;
      font-size: 0.8rem;
    }
    .token-value {
      color: #667eea;
      font-weight: 600;
    }
    .expand-btn {
      padding: 6px 12px;
      background: #475569;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
      margin-left: auto;
    }
    .expand-btn:hover {
      background: #667eea;
      transform: translateY(-1px);
    }
    .raw-content-section {
      margin-top: 10px;
      padding: 12px;
      background: #0f172a;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      display: none;
      max-height: 400px;
      overflow-y: auto;
    }
    .raw-content-section.expanded {
      display: block;
    }
    .raw-content-text {
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #e2e8f0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
    }
    .raw-content-header {
      font-size: 0.75rem;
      color: #667eea;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🪵 OWUI Request Logger</h1>
      <p class="subtitle">Real-time monitoring of Open WebUI API requests</p>
    </header>

    <div class="stats" id="stats">
      <div class="stat-card">
        <div class="stat-value" id="total-logs">0</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="unique-users">0</div>
        <div class="stat-label">Active Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="last-model">—</div>
        <div class="stat-label">Last Model</div>
      </div>
    </div>

    <div class="controls">
      <div class="view-toggle">
        <button class="btn btn-primary active" id="btn-simplified" onclick="switchView('simplified')">📊 Simplified</button>
        <button class="btn btn-secondary" id="btn-raw" onclick="switchView('raw')">🔧 Raw JSON</button>
      </div>
      
      <div class="search-box">
        <input type="text" id="search" placeholder="Search username, model..." onkeyup="filterLogs()" />
      </div>

      <button class="btn btn-secondary" onclick="loadLogs()">🔄 Refresh</button>

      <button class="btn btn-secondary" id="auto-refresh-btn" onclick="toggleAutoRefresh()">
        ⏱ Auto-refresh: OFF
      </button>

      <button class="btn btn-danger" onclick="clearLogs()">🗑 Clear Logs</button>
    </div>

    <div id="logs-container">
      <div class="loading">Loading logs...</div>
    </div>
  </div>

  <script>
    var API_URL = window.location.protocol + '//' + window.location.hostname + ':3001';
    var currentView = 'simplified';
    var allLogs = [];
    var autoRefresh = false;
    var autoRefreshInterval = null;

    // Helper function to format bytes
    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      var k = 1024;
      var sizes = ['B', 'KB', 'MB', 'GB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Helper function to get file icon based on mime type
    function getFileIcon(mimeType) {
      if (!mimeType) return '📄';
      if (mimeType.startsWith('image/')) return '🖼️';
      if (mimeType.startsWith('video/')) return '🎥';
      if (mimeType.startsWith('audio/')) return '🎵';
      if (mimeType.includes('pdf')) return '📕';
      if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
      if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
      if (mimeType.includes('text')) return '📝';
      return '📄';
    }

    // Helper function to estimate tokens (rough approximation: ~4 chars per token)
    function estimateTokens(text) {
      if (!text) return 0;
      return Math.ceil(text.length / 4);
    }

    // Function to toggle raw content visibility
    async function toggleRawContent(logId, type) {
      var section = document.getElementById('raw-' + type + '-' + logId);
      if (!section) return;
      
      var isExpanding = !section.classList.contains('expanded');
      section.classList.toggle('expanded');
      
      var btn = document.querySelector('[data-log-id="' + logId + '"][data-type="' + type + '"]');
      if (btn) {
        if (section.classList.contains('expanded')) {
          btn.textContent = '▲ Hide ' + (type === 'request' ? 'Prompt' : 'Response');
        } else {
          btn.textContent = '▼ Show ' + (type === 'request' ? 'Prompt' : 'Response');
        }
      }
      
      // If expanding response content and it's not loaded yet, fetch it
      if (isExpanding && type === 'response') {
        var contentDiv = document.getElementById('content-' + type + '-' + logId);
        if (contentDiv && contentDiv.textContent.includes('Click expand to load')) {
          contentDiv.innerHTML = '<div style="color: #94a3b8;">Loading response content...</div>';
          
          try {
            var username = section.getAttribute('data-username');
            var originalLogId = section.getAttribute('data-logid');
            var url = API_URL + '/api/logs/' + encodeURIComponent(username) + '/' + originalLogId;
            
            var res = await fetch(url);
            var data = await res.json();
            
            if (data.success && data.response) {
              var responseText = data.response.last_assistant_message || 
                                (data.response.messages && data.response.messages.length > 0 ? 
                                  data.response.messages[data.response.messages.length - 1].content : 
                                  '[No response content]');
              contentDiv.textContent = responseText;
            } else {
              contentDiv.textContent = '[Failed to load response content]';
            }
          } catch (e) {
            contentDiv.textContent = '[Error loading content: ' + e.message + ']';
          }
        }
      }
    }

     async function loadLogs() {
       try {
         var res = await fetch(API_URL + '/api/logs?limit=500');
         var data = await res.json();
         
         if (data.success) {
           // Process logs: split combined logs into separate request/response entries
           var processedLogs = [];
           (data.logs || []).forEach(function(log) {
             // If it's a combined log with both request and response data, create two entries
             if (log.type === 'combined' || (!log.type && log.lastMessage && log.responseTime)) {
               // Add as REQUEST first (older timestamp, with -r suffix to sort after)
               var requestLog = Object.assign({}, log);
               requestLog.type = 'request';
               requestLog.displayId = log.logId + '-req';
               requestLog.originalLogId = log.logId;
               processedLogs.push(requestLog);
               
               // Add as RESPONSE (original log)
               var responseLog = Object.assign({}, log);
               responseLog.type = 'response';
               responseLog.displayId = log.logId + '-res';
               responseLog.originalLogId = log.logId;
               processedLogs.push(responseLog);
             } else {
               // Already properly typed (request or response only)
               processedLogs.push(log);
             }
           });
           
           allLogs = processedLogs;
           updateStats(data);
           renderLogs(allLogs);
         }
       } catch (e) {
         document.getElementById('logs-container').innerHTML = '<div class="error">Error loading logs: ' + e.message + '</div>';
       }
     }

    function updateStats(data) {
      document.getElementById('total-logs').textContent = data.total || 0;
      
      var uniqueUsers = {};
      (data.logs || []).forEach(function(log) {
        uniqueUsers[log.username] = true;
      });
      document.getElementById('unique-users').textContent = Object.keys(uniqueUsers).length;

      if (data.logs && data.logs.length > 0) {
        document.getElementById('last-model').textContent = data.logs[0].model || '—';
      }
    }

    function renderLogs(logs) {
      var container = document.getElementById('logs-container');
      
      if (!logs.length) {
        container.innerHTML = '<div class="loading">No logs found</div>';
        return;
      }

      if (currentView === 'simplified') {
        container.innerHTML = logs.map(function(log) { return renderSimplified(log); }).join('');
      } else {
        container.innerHTML = logs.map(function(log) { return renderRaw(log); }).join('');
      }
    }

       function renderSimplified(log) {
         var time = new Date(log.timestamp);
         var logType = log.type || 'combined';
         var isRequest = logType === 'request';
         var isResponse = logType === 'response';
         
         var badgeText = '';
         var cardClass = '';
         var content = '';
         var charCount = 0;
         var tokenEstimate = 0;
         
         if (isRequest) {
           badgeText = '📤 REQUEST';
           cardClass = 'request-log';
           content = log.lastMessage || '';
           charCount = content.length;
           tokenEstimate = estimateTokens(content);
         } else if (isResponse) {
           badgeText = '📥 RESPONSE';
           cardClass = 'response-log';
           // For response, check if we have response text or just length
           // Response text would need to be fetched from response.json
           charCount = log.responseLength || 0;
           tokenEstimate = Math.ceil(charCount / 4);
           // We'll load the content on demand when user clicks expand
           content = null;  // Will be loaded dynamically
         } else {
           badgeText = '⚙️ LOG';
           cardClass = 'response-log';
         }
         
         // Build badge
         var badge = '<div class="log-type-badge log-type-' + logType + '">' + badgeText + '</div>';
         
         // Build model detail
         var modelDetail = '<div><div class="log-detail-label">Model</div><div class="log-detail-value">' + (log.model || 'Unknown') + '</div></div>';
         
         // Build response time detail if applicable
         var timeDetail = '';
         if (isResponse && log.responseTime) {
           timeDetail = '<div><div class="log-detail-label">Response Time</div><div class="log-detail-value">' + log.responseTime.toFixed(2) + 's</div></div>';
         }
         
         // Build log id detail
         var displayId = log.displayId || log.logId;
         var idDetail = '<div><div class="log-detail-label">Log ID</div><div class="log-detail-value">' + displayId + '</div></div>';
         
         var details = '<div class="log-details">' + modelDetail + timeDetail + idDetail + '</div>';
         
         // Build files section if files are present
         var filesSection = '';
         if (log.files && log.files.count > 0) {
           filesSection = '<div class="files-section">' +
             '<div class="files-header">📎 ' + log.files.count + ' File' + (log.files.count > 1 ? 's' : '') + ' Attached</div>';
           
           for (var i = 0; i < log.files.files.length; i++) {
             var file = log.files.files[i];
             var fileSize = formatBytes(file.size);
             var fileIcon = getFileIcon(file.mime_type);
             filesSection += '<div class="file-item">' +
               '<span class="file-name"><span class="file-icon">' + fileIcon + '</span>' + file.filename + '</span>' +
               '<span class="file-size">' + fileSize + '</span>' +
             '</div>';
           }
           filesSection += '</div>';
         }
         
         // Build token info and expand section
         var tokenSection = '';
         var rawContentSection = '';
         var uniqueId = log.logId.replace(/[^a-zA-Z0-9]/g, '');
         
         if (charCount > 0) {
           tokenSection = '<div class="token-info">' +
             '<div class="token-stat">' +
               '<span class="token-label">Characters:</span>' +
               '<span class="token-value">' + charCount.toLocaleString() + '</span>' +
             '</div>' +
             '<div class="token-stat">' +
               '<span class="token-label">Est. Tokens:</span>' +
               '<span class="token-value">~' + tokenEstimate.toLocaleString() + '</span>' +
             '</div>' +
             '<button class="expand-btn" onclick="toggleRawContent(\\'' + uniqueId + '\\', \\'' + (isRequest ? 'request' : 'response') + '\\')" ' +
               'data-log-id="' + uniqueId + '" data-type="' + (isRequest ? 'request' : 'response') + '">' +
               '▼ Show ' + (isRequest ? 'Prompt' : 'Response') +
             '</button>' +
           '</div>';
           
           var contentToDisplay = content;
           if (isResponse && !content) {
             // For responses, we need to fetch on demand
             contentToDisplay = 'Click expand to load response content...';
           }
           
           // Escape HTML to prevent injection and string breaking
           var escapedContent = (contentToDisplay || '[Content not available]')
             .replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;')
             .replace(/\\n/g, '<br>');
           
           rawContentSection = '<div class="raw-content-section" id="raw-' + (isRequest ? 'request' : 'response') + '-' + uniqueId + '" ' +
             'data-username="' + log.username.replace(/"/g, '&quot;') + '" data-logid="' + log.logId + '">' +
             '<div class="raw-content-header">' + (isRequest ? '📝 USER PROMPT' : '🤖 AI RESPONSE') + '</div>' +
             '<div class="raw-content-text" id="content-' + (isRequest ? 'request' : 'response') + '-' + uniqueId + '">' + 
               escapedContent + 
             '</div>' +
           '</div>';
         }
         
         return '<div class="log-card ' + cardClass + '">' +
           badge +
           '<div class="log-header">' +
             '<div class="log-user">👤 ' + log.username + '</div>' +
             '<div class="log-time">' + time.toLocaleString() + '</div>' +
           '</div>' +
           details +
           filesSection +
           tokenSection +
           rawContentSection +
         '</div>';
       }

     function renderRaw(log) {
       var time = new Date(log.timestamp);
       var logType = log.type || 'combined';
       var typeLabel = logType === 'request' ? '📤 REQUEST' : (logType === 'response' ? '📥 RESPONSE' : 'COMBINED');
       var displayId = log.displayId || log.logId;
       
       // Build file count badge if files present
       var fileBadge = '';
       if (log.files && log.files.count > 0) {
         fileBadge = ' <span style="background: #f59e0b; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">📎 ' + log.files.count + ' file' + (log.files.count > 1 ? 's' : '') + '</span>';
       }
       
       // For display, hide internal tracking fields
       var displayLog = Object.assign({}, log);
       delete displayLog.displayId;
       delete displayLog.originalLogId;
       
       return '<div class="raw-view">' +
         '<div class="raw-header">' +
           '<span class="raw-id">[' + typeLabel + '] ' + log.username + ' / ' + displayId + fileBadge + '</span>' +
           '<span class="log-time">' + time.toLocaleString() + '</span>' +
         '</div>' +
         '<div class="raw-content"><pre>' + JSON.stringify(displayLog, null, 2) + '</pre></div>' +
       '</div>';
     }

    function switchView(view) {
      currentView = view;
      document.getElementById('btn-simplified').className = view === 'simplified' ? 'btn btn-primary active' : 'btn btn-secondary';
      document.getElementById('btn-raw').className = view === 'raw' ? 'btn btn-primary active' : 'btn btn-secondary';
      renderLogs(allLogs);
    }

    function filterLogs() {
      var term = document.getElementById('search').value.toLowerCase();
      if (!term) {
        renderLogs(allLogs);
        return;
      }
      
      var filtered = allLogs.filter(function(log) {
        return (log.username || '').toLowerCase().includes(term) ||
               (log.model || '').toLowerCase().includes(term) ||
               (log.lastMessage || '').toLowerCase().includes(term);
      });
      renderLogs(filtered);
    }

    function toggleAutoRefresh() {
      autoRefresh = !autoRefresh;
      var btn = document.getElementById('auto-refresh-btn');
      
      if (autoRefresh) {
        btn.textContent = '⏱ Auto-refresh: ON';
        btn.className = 'btn btn-primary active';
        autoRefreshInterval = setInterval(loadLogs, 3000);
      } else {
        btn.textContent = '⏱ Auto-refresh: OFF';
        btn.className = 'btn btn-secondary';
        clearInterval(autoRefreshInterval);
      }
    }

    async function clearLogs() {
      if (!confirm('Delete ALL logs? This cannot be undone.')) return;
      
      try {
        var res = await fetch(API_URL + '/api/logs/clear', { method: 'DELETE' });
        var data = await res.json();
        if (data.success) {
          allLogs = [];
          updateStats({ logs: [], total: 0 });
          renderLogs([]);
        } else {
          alert('Error clearing logs');
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    loadLogs();
  </script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`OWUI Logger Web Server running on http://0.0.0.0:${PORT}`);
});
