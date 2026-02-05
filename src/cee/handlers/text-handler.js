/**
 * Text File Handler
 * Reads plain text files and returns content
 */

import { getFileTypeDescription, formatFileSize } from '../../utils/file-type-detector.js';

const MAX_LINES = 2000;

/**
 * Extract content from text file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractText(fileBuffer, filename, metadata) {
  const fileType = getFileTypeDescription(filename);
  const fileSize = formatFileSize(fileBuffer.length);

  // Decode file content
  const content = fileBuffer.toString('utf-8');
  const lines = content.split('\n');
  const totalLines = lines.length;

  // Check if truncation is needed
  const isTruncated = totalLines > MAX_LINES;
  const displayLines = isTruncated ? lines.slice(0, MAX_LINES) : lines;
  const displayContent = displayLines.join('\n');

  // Build markdown output
  let md = `# ${filename}\n\n`;

  // File Information section
  md += `## File Information\n`;
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **Filename** | ${filename} |\n`;
  md += `| **Type** | ${fileType} |\n`;
  md += `| **Size** | ${fileSize} |\n`;
  md += `| **Lines** | ${totalLines.toLocaleString()} |\n`;
  if (metadata.publicUrl) {
    md += `| **Download** | ${metadata.publicUrl} |\n`;
  }
  md += `| **Uploaded** | ${metadata.timestamp} |\n`;
  md += `\n`;

  // Truncation notice
  if (isTruncated) {
    md += `> **Note:** This file has ${totalLines.toLocaleString()} lines. Showing first ${MAX_LINES.toLocaleString()} lines only.\n\n`;
  }

  // Text content - use code block for better formatting
  md += `## Content\n\n`;
  md += `\`\`\`\n`;
  md += displayContent;
  if (!displayContent.endsWith('\n')) {
    md += '\n';
  }
  md += `\`\`\`\n`;

  if (isTruncated) {
    md += `\n*... ${(totalLines - MAX_LINES).toLocaleString()} more lines truncated*\n`;
  }

  md += `\n---\n`;
  md += `*Processed at ${metadata.timestamp}*\n`;

  return {
    markdown: md,
    metadata: {
      ...metadata,
      filename,
      type: fileType,
      size: fileBuffer.length,
      sizeFormatted: fileSize,
      category: 'text',
      lines: totalLines,
      truncated: isTruncated,
      linesShown: isTruncated ? MAX_LINES : totalLines
    }
  };
}
