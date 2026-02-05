/**
 * OWUI Toolset V2 - Main Entry Point
 */

import { spawn } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const API_PORT = process.env.PORT || 3000;
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 3001;
const PID_FILE = path.join(__dirname, '..', '.owui.pid');

// Write PID file for deploy script process detection
fs.writeFileSync(PID_FILE, String(process.pid));

console.log('\n🚀 OWUI Toolset V2 Starting...\n');

// Start Dashboard Server
const dashboardPath = path.join(__dirname, 'dashboard', 'server.js');
const dashboardProcess = spawn(process.execPath, [dashboardPath], { stdio: 'inherit' });

dashboardProcess.on('error', (err) => console.error('Dashboard error:', err.message));

// Start API Server
const apiPath = path.join(__dirname, 'api', 'server.js');
const apiProcess = spawn(process.execPath, [apiPath], { stdio: 'inherit' });

apiProcess.on('error', (err) => console.error('API error:', err.message));
apiProcess.on('exit', (code) => {
  dashboardProcess.kill();
  process.exit(code);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down...\n');
  try { fs.unlinkSync(PID_FILE); } catch {}
  dashboardProcess.kill();
  apiProcess.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`📊 Dashboard: http://localhost:${DASHBOARD_PORT}`);
console.log(`🔌 API: http://localhost:${API_PORT}\n`);
