/**
 * file_recall_search handler — delegates to OpenAI's native vector-store
 * search. Instance configuration (API key + vector store ID) comes from
 * the file_recall_instances table.
 */

import * as openaiSync from '../../file-recall/openai-sync.js';
import { formatToolResult, toolError, toolOk } from '../../utils/tool-result.js';

export async function executeFileRecallSearch(params, config) {
  const query = params.query;
  const maxResults = Math.min(50, Math.max(1, params.max_results || 10));

  if (!query) return toolError('file_recall_search', 'No search query provided');

  const instanceId = config.file_recall_instance_id;
  const db = config.db;
  if (!instanceId || !db) return toolError('file_recall_search', 'File recall not configured for this instance');

  const instance = db.getFileRecallInstance(instanceId);
  if (!instance) return toolError('file_recall_search', `File recall instance "${instanceId}" not found`);

  if (!instance.vector_store_id) {
    return toolOk('file_recall_search', 'No documents uploaded yet. The document library is empty.');
  }

  try {
    const client = openaiSync.getClient(instance.openai_api_key);
    const results = await openaiSync.searchVectorStore(client, instance.vector_store_id, query, maxResults);

    if (!results || results.length === 0) {
      return toolOk('file_recall_search', `No results found for "${query}".`);
    }

    const formatted = results.map((r, i) => {
      const filename = r.filename || 'unknown';
      const score = r.score ? ` (relevance: ${(r.score * 100).toFixed(1)}%)` : '';
      const snippets = (r.content || [])
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
      return `--- Result ${i + 1}: ${filename}${score} ---\n${snippets}`;
    }).join('\n\n');

    return toolOk('file_recall_search', `Found ${results.length} results for "${query}":\n\n${formatted}`);
  } catch (err) {
    console.error('File recall search error:', err.message);
    return toolError('file_recall_search', `Search failed: ${err.message}`);
  }
}
