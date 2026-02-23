/**
 * Docling Handler
 * Converts documents (PDF, DOCX, PPTX, HTML) to markdown using Docling API
 */

import { getFileTypeDescription, formatFileSize } from '../../utils/file-type-detector.js';

const DOCLING_URL = process.env.DOCLING_BASE_URL || 'http://10.0.0.26:5001';
const DOCLING_TIMEOUT = 600000; // 10 minutes

/**
 * Convert document using Docling API
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractWithDocling(fileBuffer, filename, metadata) {
  const fileType = getFileTypeDescription(filename);
  const fileSize = formatFileSize(fileBuffer.length);

  let documentContent = '';
  let doclingMetadata = {};

  try {
    // Create FormData for file upload
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    formData.append('files', blob, filename);

    // Request markdown output with placeholder images (not embedded base64)
    const url = new URL('/v1/convert/file', DOCLING_URL);
    url.searchParams.set('to_formats', 'md');
    url.searchParams.set('image_export_mode', 'placeholder'); // Avoid base64 bloat

    console.log(`📄 Docling: Converting ${filename} via ${url.toString()}`);

    // Make request to Docling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOCLING_TIMEOUT);

    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Docling API error (${response.status}): ${errorText}`);
    }

    // Parse response
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON response - extract markdown from result
      const result = await response.json();

      // The response structure may vary - handle common formats
      if (result.document && result.document.md_content) {
        documentContent = result.document.md_content;
      } else if (result.documents && Array.isArray(result.documents) && result.documents[0]) {
        const doc = result.documents[0];
        documentContent = doc.md_content || doc.content || '';
      } else if (result.md_content) {
        documentContent = result.md_content;
      } else if (result.content) {
        documentContent = result.content;
      } else if (typeof result === 'string') {
        documentContent = result;
      } else {
        // Try to extract any markdown-like content
        documentContent = JSON.stringify(result, null, 2);
        console.warn('Docling: Unexpected response structure, using raw JSON');
      }

      // Extract any metadata from response
      if (result.document) {
        doclingMetadata = {
          pageCount: result.document.page_count,
          title: result.document.title,
          author: result.document.author
        };
      }
    } else if (contentType.includes('application/zip')) {
      // ZIP response - would need to extract, for now throw error
      throw new Error('Docling returned ZIP archive - single file expected');
    } else {
      // Assume text/markdown response
      documentContent = await response.text();
    }

    // Clean up the content
    documentContent = documentContent.trim();

    // Strip any remaining base64 images to prevent context window bloat
    // Replace ![Image](data:image/...) with a placeholder
    documentContent = documentContent.replace(
      /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+\)/g,
      '![$1](image-removed-for-context-efficiency)'
    );

    if (!documentContent) {
      throw new Error('Docling returned empty content');
    }

  } catch (error) {
    // Re-throw with context
    if (error.name === 'AbortError') {
      throw new Error(`Docling timeout after ${DOCLING_TIMEOUT / 1000}s`);
    }
    throw new Error(`Docling conversion failed: ${error.message}`);
  }

  // Build markdown output
  let md = `# ${filename}\n\n`;

  // File Information section
  md += `## File Information\n`;
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **Filename** | ${filename} |\n`;
  md += `| **Type** | ${fileType} |\n`;
  md += `| **Size** | ${fileSize} |\n`;
  if (doclingMetadata.pageCount) {
    md += `| **Pages** | ${doclingMetadata.pageCount} |\n`;
  }
  if (doclingMetadata.title) {
    md += `| **Title** | ${doclingMetadata.title} |\n`;
  }
  if (doclingMetadata.author) {
    md += `| **Author** | ${doclingMetadata.author} |\n`;
  }
  if (metadata.publicUrl) {
    md += `| **Download** | ${metadata.publicUrl} |\n`;
  }
  md += `| **Uploaded** | ${metadata.timestamp} |\n`;
  md += `\n`;

  // Document content
  md += `## Document Content\n\n`;
  md += documentContent;
  md += `\n\n`;

  md += `---\n`;
  md += `*Converted by Docling at ${metadata.timestamp}*\n`;

  return {
    markdown: md,
    metadata: {
      ...metadata,
      filename,
      type: fileType,
      size: fileBuffer.length,
      sizeFormatted: fileSize,
      category: 'docling',
      docling: doclingMetadata,
      converter: 'docling'
    }
  };
}
