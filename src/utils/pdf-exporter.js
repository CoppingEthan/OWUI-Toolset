/**
 * PDF Export Utility
 * Converts markdown content to PDF files
 */

import markdownpdf from 'markdown-pdf';
import fs from 'fs';
import path from 'path';

/**
 * Convert markdown to PDF
 * @param {string} markdown - Markdown content
 * @param {string} outputPath - Full path for PDF file
 * @param {object} options - Title, query, date for header
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function exportToPdf(markdown, outputPath, options = {}) {
  const { title, query, date } = options;

  // Add header to markdown
  const header = `# ${title || 'Deep Research Report'}\n\n**Query:** ${query}\n\n**Generated:** ${date || new Date().toISOString()}\n\n---\n\n`;
  const fullContent = header + markdown;

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    // Capture the stream from .from.string() — .to() returns undefined
    const stream = markdownpdf({
      paperFormat: 'A4',
      paperOrientation: 'portrait',
      paperBorder: '1cm'
    }).from.string(fullContent);

    // Catch stream errors before they become unhandled 'error' events
    stream.on('error', fail);

    stream.to(outputPath, (err) => {
      if (err) {
        fail(err);
      } else if (!settled) {
        settled = true;
        resolve(outputPath);
      }
    });
  });
}
