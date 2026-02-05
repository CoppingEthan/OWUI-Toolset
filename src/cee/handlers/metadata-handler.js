/**
 * Metadata Handler
 * Generic handler for files that only need basic metadata (archives, videos, unsupported)
 */

import { getFileTypeDescription, formatFileSize, detectFileCategory } from '../../utils/file-type-detector.js';

/**
 * Extract basic metadata from file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimeType - MIME type
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractMetadata(fileBuffer, filename, mimeType, metadata) {
  const fileType = getFileTypeDescription(filename, mimeType);
  const fileSize = formatFileSize(fileBuffer.length);
  const category = detectFileCategory(filename, mimeType);

  // Build markdown output
  let md = `# ${filename}\n\n`;

  // File Information section
  md += `## File Information\n`;
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **Filename** | ${filename} |\n`;
  md += `| **Type** | ${fileType} |\n`;
  md += `| **MIME Type** | ${mimeType || 'Unknown'} |\n`;
  md += `| **Size** | ${fileSize} |\n`;
  md += `| **Category** | ${category} |\n`;
  if (metadata.publicUrl) {
    md += `| **Download** | ${metadata.publicUrl} |\n`;
  }
  md += `| **Uploaded** | ${metadata.timestamp} |\n`;
  md += `\n`;

  // Category-specific notes
  switch (category) {
    case 'archive':
      md += `## Archive\n\n`;
      md += `This is an archive file. Contents are not extracted for preview.\n`;
      md += `Use the download link to access the archive.\n\n`;
      break;

    case 'video':
      md += `## Video\n\n`;
      md += `This is a video file. Video content cannot be previewed.\n`;
      md += `Use the download link to access the video.\n\n`;
      break;

    default:
      md += `## Note\n\n`;
      md += `This file type is not supported for content extraction.\n`;
      md += `The file has been saved and is available via the download link.\n\n`;
      break;
  }

  md += `---\n`;
  md += `*Processed at ${metadata.timestamp}*\n`;

  return {
    markdown: md,
    metadata: {
      ...metadata,
      filename,
      type: fileType,
      mimeType,
      size: fileBuffer.length,
      sizeFormatted: fileSize,
      category
    }
  };
}
