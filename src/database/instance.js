/**
 * Shared DatabaseManager singleton.
 *
 * Every module in the same Node process that needs DB access imports
 * this file. Within a single process, all imports share the same instance.
 *
 * Across multiple processes, sql.js copies diverge — do not spawn
 * separate API and dashboard processes; mount both apps in one process
 * (see src/index.js).
 */

import path from 'path';
import { fileURLToPath } from 'url';
import DatabaseManager from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(projectRoot, process.env.DATABASE_PATH)
  : path.join(projectRoot, 'data', 'metrics.db');

console.log(`📁 DB path: ${dbPath}`);

const db = new DatabaseManager(dbPath);
await db.initialize();

export default db;
