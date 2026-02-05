/**
 * File Type Detector
 * Categorizes files by extension and MIME type for CEE routing
 */

import path from 'path';

// File category definitions
export const FILE_CATEGORIES = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.ico', '.heic', '.heif', '.avif'],
  structured: ['.xlsx', '.xls', '.csv', '.json', '.xml', '.db', '.sqlite', '.sqlite3'],
  code: [
    '.py', '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
    '.java', '.go', '.rb', '.php', '.c', '.cpp', '.cc', '.h', '.hpp',
    '.cs', '.swift', '.kt', '.kts', '.rs', '.scala', '.clj',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
    '.sql', '.r', '.lua', '.perl', '.pl', '.ex', '.exs',
    '.hs', '.elm', '.vue', '.svelte', '.astro'
  ],
  text: [
    '.txt', '.log', '.md', '.rst', '.rtf',
    '.ini', '.cfg', '.conf', '.config',
    '.yml', '.yaml', '.toml',
    '.env', '.env.local', '.env.example',
    '.gitignore', '.gitattributes', '.editorconfig',
    '.htaccess', '.dockerfile', '.dockerignore',
    '.eslintrc', '.prettierrc', '.babelrc'
  ],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma', '.aiff', '.ape', '.opus'],
  docling: ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.html', '.htm', '.epub'],
  archive: ['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz', '.tgz', '.tar.gz', '.tar.bz2', '.tar.xz'],
  video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp']
};

// MIME type to category mapping (fallback when extension is ambiguous)
const MIME_CATEGORIES = {
  'image/': 'image',
  'audio/': 'audio',
  'video/': 'video',
  'text/': 'text',
  'application/json': 'structured',
  'application/xml': 'structured',
  'text/xml': 'structured',
  'text/csv': 'structured',
  'application/vnd.ms-excel': 'structured',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'structured',
  'application/pdf': 'docling',
  'application/msword': 'docling',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docling',
  'application/vnd.ms-powerpoint': 'docling',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'docling',
  'text/html': 'docling',
  'application/zip': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/gzip': 'archive',
  'application/x-tar': 'archive',
  'application/x-sqlite3': 'structured',
  'application/octet-stream': null // Needs extension-based detection
};

// Language detection for code files
export const CODE_LANGUAGES = {
  '.py': 'python',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.jsx': 'jsx',
  '.tsx': 'tsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.java': 'java',
  '.go': 'go',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.rs': 'rust',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'zsh',
  '.fish': 'fish',
  '.ps1': 'powershell',
  '.bat': 'batch',
  '.cmd': 'batch',
  '.sql': 'sql',
  '.r': 'r',
  '.lua': 'lua',
  '.perl': 'perl',
  '.pl': 'perl',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.hs': 'haskell',
  '.elm': 'elm',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.astro': 'astro'
};

/**
 * Detect file category based on filename and optional MIME type
 * @param {string} filename - The filename with extension
 * @param {string} [mimeType] - Optional MIME type
 * @returns {'image'|'structured'|'code'|'text'|'audio'|'docling'|'archive'|'video'|'unsupported'}
 */
export function detectFileCategory(filename, mimeType = null) {
  const ext = path.extname(filename).toLowerCase();

  // First try extension-based detection (most reliable)
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  // Handle compound extensions like .tar.gz
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith('.tar.gz') || lowerFilename.endsWith('.tar.bz2') || lowerFilename.endsWith('.tar.xz')) {
    return 'archive';
  }

  // Fall back to MIME type detection
  if (mimeType) {
    // Check exact matches first
    if (MIME_CATEGORIES[mimeType] !== undefined) {
      return MIME_CATEGORIES[mimeType] || 'unsupported';
    }

    // Check prefix matches (e.g., 'image/', 'audio/')
    for (const [prefix, category] of Object.entries(MIME_CATEGORIES)) {
      if (prefix.endsWith('/') && mimeType.startsWith(prefix)) {
        return category;
      }
    }
  }

  return 'unsupported';
}

/**
 * Get programming language for a code file
 * @param {string} filename - The filename with extension
 * @returns {string|null} The language identifier or null
 */
export function getCodeLanguage(filename) {
  const ext = path.extname(filename).toLowerCase();
  return CODE_LANGUAGES[ext] || null;
}

/**
 * Get human-readable file type description
 * @param {string} filename - The filename with extension
 * @param {string} [mimeType] - Optional MIME type
 * @returns {string} Human-readable type description
 */
export function getFileTypeDescription(filename, mimeType = null) {
  const category = detectFileCategory(filename, mimeType);
  const ext = path.extname(filename).toLowerCase();

  const descriptions = {
    image: {
      '.jpg': 'JPEG Image',
      '.jpeg': 'JPEG Image',
      '.png': 'PNG Image',
      '.gif': 'GIF Image',
      '.webp': 'WebP Image',
      '.bmp': 'Bitmap Image',
      '.tiff': 'TIFF Image',
      '.tif': 'TIFF Image',
      '.svg': 'SVG Vector Image',
      '.ico': 'Icon File',
      '.heic': 'HEIC Image',
      '.heif': 'HEIF Image',
      '.avif': 'AVIF Image',
      default: 'Image File'
    },
    structured: {
      '.xlsx': 'Excel Spreadsheet',
      '.xls': 'Excel Spreadsheet (Legacy)',
      '.csv': 'CSV File',
      '.json': 'JSON File',
      '.xml': 'XML File',
      '.db': 'SQLite Database',
      '.sqlite': 'SQLite Database',
      '.sqlite3': 'SQLite Database',
      default: 'Structured Data File'
    },
    code: {
      '.py': 'Python Script',
      '.js': 'JavaScript File',
      '.ts': 'TypeScript File',
      '.jsx': 'React JSX File',
      '.tsx': 'React TSX File',
      '.java': 'Java Source File',
      '.go': 'Go Source File',
      '.rb': 'Ruby Script',
      '.php': 'PHP Script',
      '.c': 'C Source File',
      '.cpp': 'C++ Source File',
      '.h': 'C Header File',
      '.cs': 'C# Source File',
      '.swift': 'Swift Source File',
      '.kt': 'Kotlin Source File',
      '.rs': 'Rust Source File',
      '.sh': 'Shell Script',
      '.sql': 'SQL Script',
      '.vue': 'Vue Component',
      '.svelte': 'Svelte Component',
      default: 'Source Code File'
    },
    text: {
      '.txt': 'Plain Text File',
      '.log': 'Log File',
      '.md': 'Markdown Document',
      '.rst': 'reStructuredText Document',
      '.yml': 'YAML File',
      '.yaml': 'YAML File',
      '.toml': 'TOML File',
      '.ini': 'INI Configuration File',
      '.cfg': 'Configuration File',
      '.conf': 'Configuration File',
      '.env': 'Environment File',
      default: 'Text File'
    },
    audio: {
      '.mp3': 'MP3 Audio',
      '.wav': 'WAV Audio',
      '.m4a': 'M4A Audio',
      '.ogg': 'OGG Audio',
      '.flac': 'FLAC Audio',
      '.aac': 'AAC Audio',
      '.wma': 'WMA Audio',
      '.aiff': 'AIFF Audio',
      '.opus': 'Opus Audio',
      default: 'Audio File'
    },
    docling: {
      '.pdf': 'PDF Document',
      '.docx': 'Word Document',
      '.doc': 'Word Document (Legacy)',
      '.pptx': 'PowerPoint Presentation',
      '.ppt': 'PowerPoint Presentation (Legacy)',
      '.html': 'HTML Document',
      '.htm': 'HTML Document',
      '.epub': 'EPUB E-book',
      default: 'Document'
    },
    archive: {
      '.zip': 'ZIP Archive',
      '.tar': 'TAR Archive',
      '.gz': 'GZIP Archive',
      '.rar': 'RAR Archive',
      '.7z': '7-Zip Archive',
      '.bz2': 'BZIP2 Archive',
      '.xz': 'XZ Archive',
      default: 'Archive File'
    },
    video: {
      '.mp4': 'MP4 Video',
      '.mkv': 'MKV Video',
      '.avi': 'AVI Video',
      '.mov': 'QuickTime Video',
      '.wmv': 'WMV Video',
      '.webm': 'WebM Video',
      default: 'Video File'
    },
    unsupported: {
      default: 'Binary File'
    }
  };

  const categoryDescs = descriptions[category] || descriptions.unsupported;
  return categoryDescs[ext] || categoryDescs.default;
}

/**
 * Format file size to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
