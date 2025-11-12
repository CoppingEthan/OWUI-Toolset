#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const ACTIVITY_LOG = path.join(LOGS_DIR, 'activity.log');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatLogLine(line) {
  if (!line.trim()) return '';

  // Extract timestamp
  const timestampMatch = line.match(/\[(.*?)\]/);
  const timestamp = timestampMatch ? timestampMatch[1] : '';
  const message = line.substring(line.indexOf(']') + 1).trim();

  // Colorize based on content
  let formattedMessage = message;
  
  if (message.includes('ERROR')) {
    formattedMessage = colorize(message, 'red');
  } else if (message.includes('LOG_SAVED')) {
    formattedMessage = colorize(message, 'green');
  } else if (message.includes('API_SERVER_STARTED')) {
    formattedMessage = colorize(message, 'cyan');
  } else {
    formattedMessage = colorize(message, 'white');
  }

  const formattedTime = colorize(timestamp, 'gray');
  return `${formattedTime} ${formattedMessage}`;
}

function printHeader() {
  console.clear();
  console.log(colorize('═'.repeat(80), 'cyan'));
  console.log(colorize('  OWUI Request Logger - Real-time Activity Monitor', 'bright'));
  console.log(colorize('═'.repeat(80), 'cyan'));
  console.log(colorize(`  Watching: ${ACTIVITY_LOG}`, 'gray'));
  console.log(colorize(`  Press Ctrl+C to exit\n`, 'gray'));
}

function tailFile(filePath, lines = 10) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    const recentLines = allLines.slice(-lines);
    
    recentLines.forEach(line => {
      console.log(formatLogLine(line));
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(colorize('  Waiting for logs...', 'yellow'));
    } else {
      console.error(colorize(`  Error: ${err.message}`, 'red'));
    }
  }
}

function watchFile(filePath) {
  let lastSize = 0;

  // Initialize with file size
  try {
    const stats = fs.statSync(filePath);
    lastSize = stats.size;
  } catch (err) {
    // File doesn't exist yet
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    fs.writeFileSync(filePath, '');
  }

  // Watch for changes
  fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      try {
        const stats = fs.statSync(filePath);
        const currentSize = stats.size;

        if (currentSize > lastSize) {
          // Read only new content
          const stream = fs.createReadStream(filePath, {
            start: lastSize,
            encoding: 'utf-8'
          });

          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            lines.forEach(line => {
              if (line.trim()) {
                console.log(formatLogLine(line));
              }
            });
          });

          lastSize = currentSize;
        }
      } catch (err) {
        // File might be temporarily unavailable
      }
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const linesArg = args.find(arg => arg.startsWith('--lines='));
const initialLines = linesArg ? parseInt(linesArg.split('=')[1]) : 20;

// Main
printHeader();
tailFile(ACTIVITY_LOG, initialLines);
watchFile(ACTIVITY_LOG);

// Keep process alive
process.stdin.resume();
