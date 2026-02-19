/**
 * File Recall - OpenAI Vector Store Sync
 * Handles all OpenAI vector store operations: create, upload, delete, search
 */

import OpenAI from 'openai';

/**
 * Create an OpenAI SDK client for a given API key
 */
function getClient(apiKey) {
  return new OpenAI({ apiKey });
}

/**
 * Ensure a vector store exists for the instance, creating one if needed
 * @param {OpenAI} client - OpenAI SDK client
 * @param {object} instance - DB instance record
 * @param {object} db - DatabaseManager instance
 * @returns {string} Vector store ID
 */
async function ensureVectorStore(client, instance, db) {
  if (instance.vector_store_id) {
    return instance.vector_store_id;
  }

  const vectorStore = await client.vectorStores.create({
    name: `file-recall-${instance.id}`
  });

  db.updateVectorStoreId(instance.id, vectorStore.id);
  console.log(`📦 Created vector store for ${instance.id}: ${vectorStore.id}`);
  return vectorStore.id;
}

/**
 * Upload a file to OpenAI and add it to the vector store
 * @param {OpenAI} client - OpenAI SDK client
 * @param {string} vectorStoreId - Vector store ID
 * @param {string} filePath - Local file path
 * @param {string} filename - Original filename
 * @returns {{ fileId: string, vsFileId: string }}
 */
async function uploadFile(client, vectorStoreId, filePath, filename) {
  const fs = await import('fs');

  // Upload file to OpenAI
  const file = await client.files.create({
    file: fs.default.createReadStream(filePath),
    purpose: 'assistants'
  });

  // Add to vector store
  const vsFile = await client.vectorStores.files.create(vectorStoreId, {
    file_id: file.id
  });

  console.log(`📤 Uploaded to OpenAI: ${filename} → file=${file.id}, vs_file=${vsFile.id}`);
  return { fileId: file.id, vsFileId: vsFile.id };
}

/**
 * Delete a file from the vector store and OpenAI
 * @param {OpenAI} client - OpenAI SDK client
 * @param {string} vectorStoreId - Vector store ID
 * @param {string} openaiFileId - OpenAI file ID
 */
async function deleteFile(client, vectorStoreId, openaiFileId) {
  try {
    if (vectorStoreId) {
      await client.vectorStores.files.del(vectorStoreId, openaiFileId);
    }
  } catch (e) {
    console.warn(`⚠️ Failed to remove from vector store: ${e.message}`);
  }

  try {
    await client.files.del(openaiFileId);
  } catch (e) {
    console.warn(`⚠️ Failed to delete OpenAI file: ${e.message}`);
  }
}

/**
 * Delete an entire vector store
 * @param {OpenAI} client - OpenAI SDK client
 * @param {string} vectorStoreId - Vector store ID
 */
async function deleteVectorStore(client, vectorStoreId) {
  try {
    await client.vectorStores.del(vectorStoreId);
    console.log(`🗑️ Deleted vector store: ${vectorStoreId}`);
  } catch (e) {
    console.warn(`⚠️ Failed to delete vector store: ${e.message}`);
  }
}

/**
 * Search the vector store directly
 * @param {OpenAI} client - OpenAI SDK client
 * @param {string} vectorStoreId - Vector store ID
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return
 * @returns {Array} Search results with file_id, filename, score, content
 */
async function searchVectorStore(client, vectorStoreId, query, maxResults = 10) {
  const results = await client.vectorStores.search(vectorStoreId, {
    query,
    max_num_results: maxResults
  });
  return results.data;
}

export {
  getClient,
  ensureVectorStore,
  uploadFile,
  deleteFile,
  deleteVectorStore,
  searchVectorStore
};
