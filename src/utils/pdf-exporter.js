/**
 * PDF Export Utility
 * Converts markdown content to PDF files
 *
 * Uses markdown-pdf (phantomjs-based). PhantomJS requires libfontconfig1
 * on the host system. If PhantomJS can't run, PDF generation is skipped
 * gracefully — the caller should fall back to the .md file.
 */

import markdownpdf from 'markdown-pdf';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const phantomPath = path.resolve(__dirname, '..', '..', 'node_modules', 'phantomjs-prebuilt', 'lib', 'phantom', 'bin', 'phantomjs');

// Check once at startup whether PhantomJS can execute
let phantomChecked = false;
let phantomAvailable = false;

function checkPhantomJS() {
  if (phantomChecked) return phantomAvailable;
  phantomChecked = true;
  try {
    execSync(`"${phantomPath}" --version`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000
    });
    phantomAvailable = true;
    console.log('✅ PhantomJS available — PDF export enabled');
  } catch {
    phantomAvailable = false;
    console.warn('⚠️ PhantomJS unavailable (missing libfontconfig1?) — PDF export disabled, markdown fallback will be used');
  }
  return phantomAvailable;
}

/**
 * Convert markdown to PDF
 * @param {string} markdown - Markdown content
 * @param {string} outputPath - Full path for PDF file
 * @param {object} options - Title, query, date for header
 * @returns {Promise<string>} - Path to generated PDF
 * @throws {Error} if PhantomJS is unavailable or PDF generation fails
 */
export async function exportToPdf(markdown, outputPath, options = {}) {
  // Pre-check: don't even attempt if PhantomJS can't run
  // This prevents the unhandleable stream error from markdown-pdf's internals
  if (!checkPhantomJS()) {
    throw new Error('PhantomJS unavailable — install libfontconfig1 on the host');
  }

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
    const done = (err) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(outputPath);
    };

    try {
      const stream = markdownpdf({
        paperFormat: 'A4',
        paperOrientation: 'portrait',
        paperBorder: '1cm'
      }).from.string(fullContent);

      if (stream && typeof stream.on === 'function') {
        stream.on('error', (err) => done(err));
      }

      if (stream && typeof stream.to === 'function') {
        stream.to(outputPath, (err) => done(err || null));
      } else {
        done(new Error('markdown-pdf returned invalid stream'));
      }
    } catch (err) {
      done(err);
    }
  });
}
