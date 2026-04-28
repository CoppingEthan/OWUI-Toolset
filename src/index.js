/**
 * OWUI Toolset V2 — entry point.
 *
 * Runs the API server and dashboard in ONE Node process, sharing a single
 * in-memory SQLite instance. Both listen on their own ports so existing
 * firewall/reverse-proxy topologies keep working.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env as early as possible so every subsequent import sees process.env.
dotenv.config();

// The singleton DB is created here. All other modules import it from
// src/database/instance.js and see the same object.
const { default: db } = await import('./database/instance.js');

const { createApiApp, applyServerTimeouts } = await import('./api/server.js');
const { createDashboardApp } = await import('./dashboard/server.js');
const { containerManager } = await import('./tools/sandbox/manager.js');
const { initSkills } = await import('./skills/loader.js');

const API_PORT = parseInt(process.env.PORT || '3000', 10);
const API_HOST = process.env.HOST || '0.0.0.0';
const DASH_PORT = parseInt(process.env.DASHBOARD_PORT || '3001', 10);
const DASH_HOST = process.env.HOST || '0.0.0.0';

const PID_FILE = path.join(__dirname, '..', '.owui.pid');
fs.writeFileSync(PID_FILE, String(process.pid));

console.log('\n🚀 OWUI Toolset V2 Starting...\n');

// Build the always-loaded skills index so chat requests can inject the
// list into the system prompt without rescanning the filesystem.
initSkills();

// Reclaim any sandbox containers left behind by a previous run
// (fire-and-forget — Docker is optional).
containerManager.cleanupOrphans().catch(() => {});

const apiApp = createApiApp(db);
const apiServer = apiApp.listen(API_PORT, API_HOST, () => {
  console.log(`🔌 API:       http://${API_HOST}:${API_PORT}`);
});
applyServerTimeouts(apiServer);

const dashApp = createDashboardApp(db);
const dashServer = dashApp.listen(DASH_PORT, DASH_HOST, () => {
  console.log(`📊 Dashboard: http://${DASH_HOST}:${DASH_PORT}\n`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n🛑 ${signal} received — shutting down…`);

  // Stop accepting new requests
  apiServer.close();
  dashServer.close();

  // Clean up sandbox containers (no-op if none were created)
  try { await containerManager.cleanupAll(); }
  catch (err) { console.error('Error cleaning up containers:', err.message); }

  // Flush pending DB saves, close handle
  try { db.close(); } catch (err) { console.error('Error closing DB:', err.message); }

  try { fs.unlinkSync(PID_FILE); } catch {}
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
