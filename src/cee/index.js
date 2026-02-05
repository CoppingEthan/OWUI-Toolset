/**
 * Content Extraction Engine (CEE)
 * Routes files to appropriate handlers based on type
 */

import { detectFileCategory } from '../utils/file-type-detector.js';
import { extractImage } from './handlers/image-handler.js';
import { extractStructured } from './handlers/structured-handler.js';
import { extractCode } from './handlers/code-handler.js';
import { extractText } from './handlers/text-handler.js';
import { extractAudio } from './handlers/audio-handler.js';
import { extractWithDocling } from './handlers/docling-handler.js';
import { extractMetadata } from './handlers/metadata-handler.js';

/**
 * Extract content from a file based on its type
 * @param {Buffer} fileBuffer - The file content as a buffer
 * @param {string} filename - Original filename with extension
 * @param {string} mimeType - MIME type of the file
 * @param {Object} metadata - Additional metadata
 * @param {string} metadata.publicUrl - Public URL to access the file
 * @param {string} metadata.savedPath - Path where file is saved
 * @param {string} metadata.userEmail - User's email
 * @param {string} metadata.fileId - Unique file ID
 * @param {string} metadata.timestamp - Upload timestamp
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractContent(fileBuffer, filename, mimeType, metadata) {
  const category = detectFileCategory(filename, mimeType);

  console.log(`📦 CEE: Processing ${filename} as "${category}" (${mimeType})`);

  try {
    switch (category) {
      case 'image':
        return await extractImage(fileBuffer, filename, metadata);

      case 'structured':
        return await extractStructured(fileBuffer, filename, metadata);

      case 'code':
        return await extractCode(fileBuffer, filename, metadata);

      case 'text':
        return await extractText(fileBuffer, filename, metadata);

      case 'audio':
        return await extractAudio(fileBuffer, filename, metadata);

      case 'docling':
        return await extractWithDocling(fileBuffer, filename, metadata);

      case 'video':
      case 'archive':
      case 'unsupported':
      default:
        return await extractMetadata(fileBuffer, filename, mimeType, metadata);
    }
  } catch (error) {
    console.error(`❌ CEE Error processing ${filename}:`, error.message);

    // Return error response
    return {
      markdown: `# ${filename}\n\n## Error\n\nFailed to extract content from this file.\n\n**Error:** ${error.message}\n\n---\n*Processed at ${metadata.timestamp}*`,
      metadata: {
        ...metadata,
        filename,
        mimeType,
        error: error.message,
        category
      }
    };
  }
}

export { detectFileCategory };
