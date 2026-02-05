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
    markdownpdf({
      paperFormat: 'A4',
      paperOrientation: 'portrait',
      paperBorder: '1cm'
    })
      .from.string(fullContent)
      .to(outputPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(outputPath);
        }
      });
  });
}
