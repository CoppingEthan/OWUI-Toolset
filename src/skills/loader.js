/**
 * Skills loader.
 *
 * Implements Anthropic-style progressive disclosure for prompt skills:
 *   - Level 1 (always loaded): each skill's name + description, injected
 *     into the system prompt at every chat request.
 *   - Level 2 (on demand): the SKILL.md body, fetched only when the model
 *     calls the load_skill tool.
 *
 * Skill format on disk (Anthropic-compatible):
 *   skills/<name>/SKILL.md
 *     ---
 *     name: <slug>
 *     description: <one paragraph that tells the model when to use this>
 *     ---
 *     <markdown body>
 *
 * The list of skills is cached in-memory at boot (one fs scan + frontmatter
 * parse per skill). The body is read fresh from disk every time so edits
 * during dev are picked up without a restart. List rescans on restart only.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILLS_DIR = path.resolve(__dirname, '..', '..', 'skills');

// In-memory cache built at boot.
// Map<name, { name, description, dir, skillPath }>
let skillsCache = null;

/**
 * Parse YAML-ish frontmatter at the top of a SKILL.md file.
 * Only handles the simple `key: value` lines we use; not full YAML.
 * Returns { frontmatter, body } where body is everything after the closing ---.
 */
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return { frontmatter: {}, body: text };

  const frontmatter = {};
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') { i++; break; }
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) frontmatter[m[1]] = m[2].trim();
  }
  const body = lines.slice(i).join('\n').replace(/^\n+/, '');
  return { frontmatter, body };
}

/**
 * Scan the skills directory and build the in-memory list.
 * Skips folders without a valid SKILL.md or without name+description.
 */
function scanSkills() {
  const cache = new Map();
  if (!fs.existsSync(SKILLS_DIR)) {
    return cache;
  }
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    let text;
    try { text = fs.readFileSync(skillPath, 'utf-8'); } catch { continue; }
    const { frontmatter } = parseFrontmatter(text);
    const name = frontmatter.name?.trim();
    const description = frontmatter.description?.trim();
    if (!name || !description) {
      console.warn(`⚠️ [SKILLS] ${entry.name} skipped: missing name or description in frontmatter`);
      continue;
    }
    if (cache.has(name)) {
      console.warn(`⚠️ [SKILLS] duplicate name "${name}" — keeping first occurrence`);
      continue;
    }
    cache.set(name, {
      name,
      description,
      dir: entry.name,
      skillPath,
    });
  }
  return cache;
}

/**
 * Initialise the skills cache. Call once at boot. Idempotent.
 */
export function initSkills() {
  skillsCache = scanSkills();
  console.log(`📚 Skills loaded: ${skillsCache.size} (${[...skillsCache.keys()].join(', ') || 'none'})`);
  return skillsCache.size;
}

/**
 * Get the always-loaded list (name + description) for system-prompt injection.
 */
export function listSkills() {
  if (!skillsCache) initSkills();
  return [...skillsCache.values()].map(s => ({ name: s.name, description: s.description }));
}

/**
 * True if a skill with this name exists.
 */
export function hasSkill(name) {
  if (!skillsCache) initSkills();
  return skillsCache.has(name);
}

/**
 * Load the on-demand body of a skill. Reads fresh from disk so devs can edit
 * SKILL.md without restarting. Returns null if the skill doesn't exist.
 */
export function loadSkillBody(name) {
  if (!skillsCache) initSkills();
  const meta = skillsCache.get(name);
  if (!meta) return null;
  let text;
  try { text = fs.readFileSync(meta.skillPath, 'utf-8'); }
  catch (err) {
    console.error(`[SKILLS] failed to read ${meta.skillPath}: ${err.message}`);
    return null;
  }
  const { body } = parseFrontmatter(text);
  return body;
}

/**
 * Build the system-prompt fragment that lists every available skill so the
 * model knows what's available without paying for the bodies.
 */
export function buildSkillsPromptBlock() {
  const list = listSkills();
  if (list.length === 0) return '';
  const lines = list.map(s => `- **${s.name}** — ${s.description}`);
  return (
    '\n\n[SKILLS_AVAILABLE]\n' +
    'These skills are available on demand. Each is a focused playbook for a kind of task. ' +
    'When a user request matches one of the descriptions below, call the `load_skill` tool with the ' +
    'skill name to load its full instructions before producing your final response. ' +
    'Skill bodies do NOT load automatically — you must request them.\n\n' +
    lines.join('\n') +
    '\n[/SKILLS_AVAILABLE]'
  );
}
