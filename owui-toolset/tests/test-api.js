const http = require('http');

const API_URL = 'http://127.0.0.1:3001';

// Color output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (err) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'Health Check',
    run: async () => {
      const result = await makeRequest('/health');
      if (result.status === 200 && result.data.status === 'ok') {
        return { success: true, message: 'API is healthy' };
      }
      throw new Error('Health check failed');
    }
  },
  {
    name: 'Create Log Entry',
    run: async () => {
      const testLog = {
        username: 'test-user',
        request: {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello, this is a test message!' }
          ],
          chat_id: 'test-chat-123',
          stream: false
        },
        response: {
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello, this is a test message!' },
            { role: 'assistant', content: 'Hello! How can I help you today?' }
          ],
          response_time_seconds: 1.23
        },
        metadata: {
          model: 'gpt-4',
          lastMessage: 'Hello, this is a test message!',
          user: {
            id: 'user-123',
            name: 'test-user',
            email: 'test@example.com',
            role: 'user'
          },
          timestamp: new Date().toISOString()
        }
      };

      const result = await makeRequest('/api/log', 'POST', testLog);
      if (result.status === 200 && result.data.success) {
        return {
          success: true,
          message: `Log created with ID: ${result.data.logId}`,
          data: result.data
        };
      }
      throw new Error('Failed to create log');
    }
  },
  {
    name: 'Create Log with Files',
    run: async () => {
      const testLog = {
        username: 'test-user',
        request: {
          model: 'gpt-4-vision',
          messages: [
            { role: 'user', content: 'What is in this image?' }
          ]
        },
        response: {
          messages: [
            { role: 'user', content: 'What is in this image?' },
            { role: 'assistant', content: 'I can see a test image.' }
          ]
        },
        metadata: {
          model: 'gpt-4-vision',
          timestamp: new Date().toISOString()
        },
        files: [
          {
            filename: 'test-image.png',
            content: Buffer.from('fake-image-data').toString('base64')
          }
        ]
      };

      const result = await makeRequest('/api/log', 'POST', testLog);
      if (result.status === 200 && result.data.success) {
        return {
          success: true,
          message: `Log with files created: ${result.data.logId}`,
          data: result.data
        };
      }
      throw new Error('Failed to create log with files');
    }
  },
  {
    name: 'List All Logs',
    run: async () => {
      const result = await makeRequest('/api/logs');
      if (result.status === 200 && result.data.success) {
        return {
          success: true,
          message: `Found ${result.data.count} logs (total: ${result.data.total})`,
          data: { count: result.data.count, total: result.data.total }
        };
      }
      throw new Error('Failed to list logs');
    }
  },
  {
    name: 'List Logs for Specific User',
    run: async () => {
      const result = await makeRequest('/api/logs?username=test-user&limit=10');
      if (result.status === 200 && result.data.success) {
        return {
          success: true,
          message: `Found ${result.data.count} logs for test-user`,
          data: { count: result.data.count }
        };
      }
      throw new Error('Failed to list user logs');
    }
  },
  {
    name: 'Get Activity Log',
    run: async () => {
      const result = await makeRequest('/api/activity?lines=5');
      if (result.status === 200 && result.data.success) {
        return {
          success: true,
          message: `Retrieved ${result.data.lines.length} activity lines`,
          data: { lineCount: result.data.lines.length }
        };
      }
      throw new Error('Failed to get activity log');
    }
  },
  {
    name: 'Error Handling - Missing Username',
    run: async () => {
      const testLog = {
        request: { model: 'gpt-4' },
        metadata: {}
      };

      const result = await makeRequest('/api/log', 'POST', testLog);
      if (result.status === 400) {
        return {
          success: true,
          message: 'Correctly rejected request without username'
        };
      }
      throw new Error('Should have rejected request without username');
    }
  }
];

// Run tests
async function runTests() {
  log('\n╔══════════════════════════════════════════════════════╗', 'blue');
  log('║        OWUI Request Logger API Test Suite          ║', 'blue');
  log('╚══════════════════════════════════════════════════════╝\n', 'blue');
  log(`Testing API at: ${API_URL}\n`, 'yellow');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`Running: ${test.name}... `);
    
    try {
      const result = await test.run();
      log(`✓ PASSED`, 'green');
      if (result.message) {
        log(`  → ${result.message}`, 'green');
      }
      passed++;
    } catch (error) {
      log(`✗ FAILED`, 'red');
      log(`  → ${error.message}`, 'red');
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log('\n' + '═'.repeat(50), 'blue');
  log(`Results: ${passed} passed, ${failed} failed`, 
      failed === 0 ? 'green' : 'yellow');
  log('═'.repeat(50) + '\n', 'blue');

  process.exit(failed > 0 ? 1 : 0);
}

// Check if API is running
makeRequest('/health')
  .then(() => {
    log('API is reachable, starting tests...\n', 'green');
    runTests();
  })
  .catch(() => {
    log('ERROR: Cannot connect to API server', 'red');
    log(`Make sure the API is running on ${API_URL}`, 'yellow');
    log('Run: cd server && npm run api\n', 'yellow');
    process.exit(1);
  });
