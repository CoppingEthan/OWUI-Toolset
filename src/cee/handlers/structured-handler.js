/**
 * Structured Data Handler
 * Extracts schema and structure from XLSX, CSV, JSON, XML, and SQLite files
 */

import path from 'path';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { XMLParser } from 'fast-xml-parser';
import initSqlJs from 'sql.js';
import { getFileTypeDescription, formatFileSize } from '../../utils/file-type-detector.js';

const MAX_COLUMN_NAMES = 50;
const MAX_ROW_IDENTIFIERS = 50;
const MAX_SAMPLE_ROWS = 5;

/**
 * Extract structure from Excel file
 */
async function extractExcel(fileBuffer, filename, metadata) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  let md = '';
  const sheetsInfo = [];

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;

    // Get column headers (first row)
    const headers = [];
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + MAX_COLUMN_NAMES - 1); c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c });
      const cell = sheet[cellAddress];
      headers.push(cell ? String(cell.v) : `Column ${c + 1}`);
    }

    // Get first column values as row identifiers (if they look like IDs)
    const rowIdentifiers = [];
    for (let r = range.s.r + 1; r <= Math.min(range.e.r, range.s.r + MAX_ROW_IDENTIFIERS); r++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c: range.s.c });
      const cell = sheet[cellAddress];
      if (cell) {
        rowIdentifiers.push(String(cell.v));
      }
    }

    sheetsInfo.push({
      name: sheetName,
      rows: rowCount,
      columns: colCount,
      headers: headers,
      rowIdentifiers: rowIdentifiers
    });

    md += `### Sheet: ${sheetName}\n`;
    md += `- **Rows:** ${rowCount.toLocaleString()}\n`;
    md += `- **Columns:** ${colCount}\n\n`;

    if (headers.length > 0) {
      md += `**Column Headers${headers.length < colCount ? ` (first ${headers.length} of ${colCount})` : ''}:**\n`;
      md += headers.map((h, i) => `${i + 1}. ${h}`).join('\n');
      md += '\n\n';
    }

    if (rowIdentifiers.length > 0) {
      md += `**First Column Values (sample):**\n`;
      md += rowIdentifiers.slice(0, 10).map(v => `- ${v}`).join('\n');
      if (rowIdentifiers.length > 10) {
        md += `\n- *(${rowIdentifiers.length - 10} more...)*`;
      }
      md += '\n\n';
    }
  }

  return { markdown: md, sheetsInfo };
}

/**
 * Extract structure from CSV file
 */
async function extractCsv(fileBuffer, filename, metadata) {
  const content = fileBuffer.toString('utf-8');

  // Parse CSV
  const records = csvParse(content, {
    skip_empty_lines: true,
    relax_column_count: true
  });

  if (records.length === 0) {
    return { markdown: '*Empty CSV file*\n', csvInfo: { rows: 0, columns: 0 } };
  }

  const headers = records[0] || [];
  const dataRows = records.slice(1);
  const rowCount = records.length;
  const colCount = headers.length;

  // Get first column values
  const rowIdentifiers = dataRows.slice(0, MAX_ROW_IDENTIFIERS).map(row => row[0]).filter(Boolean);

  let md = `### CSV Structure\n`;
  md += `- **Rows:** ${rowCount.toLocaleString()} (including header)\n`;
  md += `- **Columns:** ${colCount}\n\n`;

  if (headers.length > 0) {
    const displayHeaders = headers.slice(0, MAX_COLUMN_NAMES);
    md += `**Column Headers${displayHeaders.length < colCount ? ` (first ${displayHeaders.length} of ${colCount})` : ''}:**\n`;
    md += displayHeaders.map((h, i) => `${i + 1}. ${h || '(empty)'}`).join('\n');
    md += '\n\n';
  }

  if (rowIdentifiers.length > 0) {
    md += `**First Column Values (sample):**\n`;
    md += rowIdentifiers.slice(0, 10).map(v => `- ${v}`).join('\n');
    if (rowIdentifiers.length > 10) {
      md += `\n- *(${rowIdentifiers.length - 10} more...)*`;
    }
    md += '\n\n';
  }

  return {
    markdown: md,
    csvInfo: { rows: rowCount, columns: colCount, headers, rowIdentifiers }
  };
}

/**
 * Extract structure from JSON file
 */
async function extractJson(fileBuffer, filename, metadata) {
  const content = fileBuffer.toString('utf-8');
  const data = JSON.parse(content);

  function describeStructure(obj, depth = 0, maxDepth = 3) {
    if (depth >= maxDepth) return '...';

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[] (empty array)';
      const sample = describeStructure(obj[0], depth + 1, maxDepth);
      return `Array[${obj.length}] of ${sample}`;
    }

    if (obj === null) return 'null';
    if (typeof obj !== 'object') return typeof obj;

    const keys = Object.keys(obj);
    if (keys.length === 0) return '{} (empty object)';

    if (depth === maxDepth - 1) {
      return `{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? ', ...' : ''}}`;
    }

    return keys.slice(0, 20).map(key => {
      const value = describeStructure(obj[key], depth + 1, maxDepth);
      return `  ${'  '.repeat(depth)}- **${key}**: ${value}`;
    }).join('\n');
  }

  let md = `### JSON Structure\n\n`;

  if (Array.isArray(data)) {
    md += `**Type:** Array with ${data.length.toLocaleString()} items\n\n`;
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      const sampleKeys = Object.keys(data[0]).slice(0, MAX_COLUMN_NAMES);
      md += `**Item Properties${sampleKeys.length < Object.keys(data[0]).length ? ` (first ${sampleKeys.length})` : ''}:**\n`;
      sampleKeys.forEach(key => {
        const sampleValue = data[0][key];
        const valueType = Array.isArray(sampleValue) ? `Array[${sampleValue.length}]` : typeof sampleValue;
        md += `- **${key}**: ${valueType}\n`;
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    md += `**Type:** Object with ${keys.length} properties\n\n`;
    md += `**Properties:**\n`;
    md += describeStructure(data, 0, 3);
  } else {
    md += `**Type:** ${typeof data}\n`;
    md += `**Value:** ${String(data).substring(0, 100)}\n`;
  }

  md += '\n';

  return {
    markdown: md,
    jsonInfo: {
      type: Array.isArray(data) ? 'array' : typeof data,
      length: Array.isArray(data) ? data.length : undefined,
      keys: typeof data === 'object' && data !== null ? Object.keys(data) : undefined
    }
  };
}

/**
 * Extract structure from XML file
 */
async function extractXml(fileBuffer, filename, metadata) {
  const content = fileBuffer.toString('utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });

  const data = parser.parse(content);

  function countElements(obj, counts = {}, depth = 0, maxDepth = 5) {
    if (depth >= maxDepth || typeof obj !== 'object' || obj === null) return counts;

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('@_') || key.startsWith('#')) continue;

      counts[key] = (counts[key] || 0) + 1;

      if (Array.isArray(value)) {
        counts[key] = value.length;
        value.slice(0, 3).forEach(item => countElements(item, counts, depth + 1, maxDepth));
      } else if (typeof value === 'object') {
        countElements(value, counts, depth + 1, maxDepth);
      }
    }

    return counts;
  }

  const rootKeys = Object.keys(data).filter(k => !k.startsWith('?'));
  const rootElement = rootKeys[0] || 'root';
  const elementCounts = countElements(data);

  let md = `### XML Structure\n\n`;
  md += `**Root Element:** \`<${rootElement}>\`\n\n`;

  const elements = Object.entries(elementCounts)
    .filter(([key]) => key !== rootElement)
    .slice(0, 30);

  if (elements.length > 0) {
    md += `**Elements Found:**\n`;
    elements.forEach(([name, count]) => {
      md += `- \`<${name}>\`: ${count} occurrence${count !== 1 ? 's' : ''}\n`;
    });
  }

  md += '\n';

  return {
    markdown: md,
    xmlInfo: { rootElement, elementCounts }
  };
}

/**
 * Extract structure from SQLite database
 */
async function extractSqlite(fileBuffer, filename, metadata) {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fileBuffer);

  // Get all tables
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const tables = tablesResult[0]?.values.map(row => row[0]) || [];

  let md = `### Database Structure\n\n`;
  md += `**Tables:** ${tables.length}\n\n`;

  const tablesInfo = [];

  for (const tableName of tables) {
    // Get table info (columns)
    const columnsResult = db.exec(`PRAGMA table_info("${tableName}")`);
    const columns = columnsResult[0]?.values.map(row => ({
      name: row[1],
      type: row[2],
      notNull: row[3] === 1,
      primaryKey: row[5] === 1
    })) || [];

    // Get row count
    const countResult = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount = countResult[0]?.values[0][0] || 0;

    // Get sample data
    const sampleResult = db.exec(`SELECT * FROM "${tableName}" LIMIT ${MAX_SAMPLE_ROWS}`);
    const sampleRows = sampleResult[0]?.values || [];

    tablesInfo.push({
      name: tableName,
      columns,
      rowCount,
      sampleRows
    });

    md += `#### Table: \`${tableName}\`\n`;
    md += `- **Rows:** ${rowCount.toLocaleString()}\n`;
    md += `- **Columns:** ${columns.length}\n\n`;

    if (columns.length > 0) {
      md += `| Column | Type | Constraints |\n`;
      md += `|--------|------|-------------|\n`;
      columns.slice(0, MAX_COLUMN_NAMES).forEach(col => {
        const constraints = [];
        if (col.primaryKey) constraints.push('PRIMARY KEY');
        if (col.notNull) constraints.push('NOT NULL');
        md += `| ${col.name} | ${col.type || 'TEXT'} | ${constraints.join(', ') || '-'} |\n`;
      });
      md += '\n';
    }

    if (sampleRows.length > 0) {
      md += `**Sample Data (${Math.min(sampleRows.length, MAX_SAMPLE_ROWS)} rows):**\n\n`;
      const columnNames = columns.map(c => c.name);
      md += `| ${columnNames.join(' | ')} |\n`;
      md += `| ${columnNames.map(() => '---').join(' | ')} |\n`;
      sampleRows.forEach(row => {
        const values = row.map(v => v === null ? '*null*' : String(v).substring(0, 50));
        md += `| ${values.join(' | ')} |\n`;
      });
      md += '\n';
    }
  }

  db.close();

  return { markdown: md, tablesInfo };
}

/**
 * Main extraction function for structured data
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractStructured(fileBuffer, filename, metadata) {
  const ext = path.extname(filename).toLowerCase();
  const fileType = getFileTypeDescription(filename);
  const fileSize = formatFileSize(fileBuffer.length);

  let contentMd = '';
  let structureInfo = {};

  try {
    switch (ext) {
      case '.xlsx':
      case '.xls': {
        const result = await extractExcel(fileBuffer, filename, metadata);
        contentMd = result.markdown;
        structureInfo = { sheets: result.sheetsInfo };
        break;
      }

      case '.csv': {
        const result = await extractCsv(fileBuffer, filename, metadata);
        contentMd = result.markdown;
        structureInfo = result.csvInfo;
        break;
      }

      case '.json': {
        const result = await extractJson(fileBuffer, filename, metadata);
        contentMd = result.markdown;
        structureInfo = result.jsonInfo;
        break;
      }

      case '.xml': {
        const result = await extractXml(fileBuffer, filename, metadata);
        contentMd = result.markdown;
        structureInfo = result.xmlInfo;
        break;
      }

      case '.db':
      case '.sqlite':
      case '.sqlite3': {
        const result = await extractSqlite(fileBuffer, filename, metadata);
        contentMd = result.markdown;
        structureInfo = { tables: result.tablesInfo };
        break;
      }

      default:
        contentMd = '*Unsupported structured data format*\n';
    }
  } catch (error) {
    contentMd = `### Error\n\nFailed to parse structured data: ${error.message}\n`;
    structureInfo = { error: error.message };
  }

  // Build full markdown
  let md = `# ${filename}\n\n`;

  md += `## File Information\n`;
  md += `| Property | Value |\n`;
  md += `|----------|-------|\n`;
  md += `| **Filename** | ${filename} |\n`;
  md += `| **Type** | ${fileType} |\n`;
  md += `| **Size** | ${fileSize} |\n`;
  if (metadata.publicUrl) {
    md += `| **Download** | ${metadata.publicUrl} |\n`;
  }
  md += `| **Uploaded** | ${metadata.timestamp} |\n`;
  md += `\n`;

  md += `## Data Structure\n\n`;
  md += contentMd;

  md += `---\n`;
  md += `*Processed at ${metadata.timestamp}*\n`;

  return {
    markdown: md,
    metadata: {
      ...metadata,
      filename,
      type: fileType,
      size: fileBuffer.length,
      sizeFormatted: fileSize,
      category: 'structured',
      structure: structureInfo
    }
  };
}
