/**
 * Per-user memory tool handlers.
 *
 * Memories are persisted in user_memories keyed by email. A per-user
 * character budget (MAX_MEMORY_CHARS env var, default 2000) caps
 * storage; the LLM is expected to consolidate or delete when full.
 */

import { formatToolResult, toolError, toolOk } from '../../utils/tool-result.js';

const MAX_MEMORY_CHARS = parseInt(process.env.MAX_MEMORY_CHARS || '2000', 10);

function requireContext(toolName, config) {
  if (!config.USER_EMAIL || !config.db) {
    return toolError(toolName, 'User context not available');
  }
  return null;
}

export async function executeMemoryRetrieve(params, config) {
  const bad = requireContext('memory_retrieve', config);
  if (bad) return bad;

  const { USER_EMAIL: email, db } = config;
  const memories = db.getMemories(email);
  const totalChars = db.getMemoryCharCount(email);

  if (memories.length === 0) {
    return toolOk('memory_retrieve', `No memories stored for this user.\nCharacter usage: 0 / ${MAX_MEMORY_CHARS}`);
  }

  const formatted = memories.map(m =>
    `[ID: ${m.id}] ${m.content} (created: ${m.created_at}, updated: ${m.updated_at})`
  ).join('\n');

  return toolOk('memory_retrieve',
    `Found ${memories.length} memories (${totalChars} / ${MAX_MEMORY_CHARS} chars used):\n\n${formatted}`);
}

export async function executeMemoryCreate(params, config) {
  const bad = requireContext('memory_create', config);
  if (bad) return bad;
  const { USER_EMAIL: email, db } = config;

  const content = params.content?.trim();
  if (!content) return toolError('memory_create', 'Memory content cannot be empty');

  const current = db.getMemoryCharCount(email);
  const newTotal = current + content.length;
  if (newTotal > MAX_MEMORY_CHARS) {
    const remaining = MAX_MEMORY_CHARS - current;
    return toolError('memory_create',
      `Cannot create memory: would exceed character limit. ` +
      `Current usage: ${current} / ${MAX_MEMORY_CHARS} chars. ` +
      `New memory is ${content.length} chars, but only ${remaining} chars remaining. ` +
      `Please consolidate or delete existing memories first using memory_update or memory_delete.`
    );
  }

  const id = db.createMemory(email, content);
  return toolOk('memory_create',
    `Memory created successfully (ID: ${id}). Character usage: ${newTotal} / ${MAX_MEMORY_CHARS}`);
}

export async function executeMemoryUpdate(params, config) {
  const bad = requireContext('memory_update', config);
  if (bad) return bad;
  const { USER_EMAIL: email, db } = config;
  const memoryId = params.memory_id;
  const content = params.content?.trim();

  if (!memoryId) return toolError('memory_update', 'memory_id is required');
  if (!content)  return toolError('memory_update', 'Memory content cannot be empty');

  const existing = db.getMemoryById(memoryId, email);
  if (!existing) return toolError('memory_update', `Memory with ID ${memoryId} not found or does not belong to this user.`);

  const current = db.getMemoryCharCount(email);
  const delta = content.length - existing.content.length;
  const newTotal = current + delta;
  if (newTotal > MAX_MEMORY_CHARS) {
    const maxForUpdate = MAX_MEMORY_CHARS - current + existing.content.length;
    return toolError('memory_update',
      `Cannot update memory: would exceed character limit. ` +
      `Current usage: ${current} / ${MAX_MEMORY_CHARS} chars. ` +
      `New content is ${content.length} chars (was ${existing.content.length}). ` +
      `Maximum for this update: ${maxForUpdate} chars.`
    );
  }

  const updated = db.updateMemory(memoryId, email, content);
  if (!updated) return toolError('memory_update', `Failed to update memory ID ${memoryId}.`);

  return toolOk('memory_update',
    `Memory ID ${memoryId} updated successfully. Character usage: ${newTotal} / ${MAX_MEMORY_CHARS}`);
}

export async function executeMemoryDelete(params, config) {
  const bad = requireContext('memory_delete', config);
  if (bad) return bad;
  const { USER_EMAIL: email, db } = config;
  const memoryId = params.memory_id;

  if (!memoryId) return toolError('memory_delete', 'memory_id is required');

  const deleted = db.deleteMemory(memoryId, email);
  if (!deleted) return toolError('memory_delete', `Memory with ID ${memoryId} not found or does not belong to this user.`);

  const remaining = db.getMemoryCharCount(email);
  return toolOk('memory_delete',
    `Memory ID ${memoryId} deleted. Character usage: ${remaining} / ${MAX_MEMORY_CHARS}`);
}
