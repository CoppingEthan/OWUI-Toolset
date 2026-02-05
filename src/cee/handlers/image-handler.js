/**
 * Image Handler
 * Extracts metadata and EXIF data from image files
 */

import sharp from 'sharp';
import { getFileTypeDescription, formatFileSize } from '../../utils/file-type-detector.js';

/**
 * Parse EXIF date string to readable format
 * @param {string} exifDate - EXIF date format (YYYY:MM:DD HH:MM:SS)
 * @returns {string|null}
 */
function parseExifDate(exifDate) {
  if (!exifDate) return null;

  try {
    // EXIF dates are in format "YYYY:MM:DD HH:MM:SS"
    if (typeof exifDate === 'string') {
      const cleaned = exifDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date.toISOString().replace('T', ' ').substring(0, 19);
      }
    } else if (exifDate instanceof Date) {
      return exifDate.toISOString().replace('T', ' ').substring(0, 19);
    }
  } catch {
    // Ignore parse errors
  }
  return String(exifDate);
}

/**
 * Format exposure time as fraction
 * @param {number} exposure - Exposure time in seconds
 * @returns {string}
 */
function formatExposure(exposure) {
  if (!exposure) return null;
  if (exposure >= 1) return `${exposure}s`;
  const denominator = Math.round(1 / exposure);
  return `1/${denominator}s`;
}

/**
 * Format GPS coordinates
 * @param {number} coord - Coordinate value
 * @param {string} ref - Reference (N/S or E/W)
 * @returns {string}
 */
function formatGpsCoord(coord, ref) {
  if (coord === undefined || coord === null) return null;
  const absCoord = Math.abs(coord);
  const degrees = Math.floor(absCoord);
  const minutes = Math.floor((absCoord - degrees) * 60);
  const seconds = ((absCoord - degrees - minutes / 60) * 3600).toFixed(2);
  return `${degrees}° ${minutes}' ${seconds}" ${ref}`;
}

/**
 * Calculate aspect ratio
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function calculateAspectRatio(width, height) {
  if (!width || !height) return null;

  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Simplify common ratios
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3';
  if (Math.abs(ratio - 3 / 2) < 0.01) return '3:2';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 21 / 9) < 0.01) return '21:9';

  // Return calculated ratio if small enough
  if (ratioW <= 100 && ratioH <= 100) {
    return `${ratioW}:${ratioH}`;
  }

  // Otherwise return decimal
  return ratio.toFixed(2) + ':1';
}

/**
 * Extract metadata from image file
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractImage(fileBuffer, filename, metadata) {
  const fileType = getFileTypeDescription(filename);
  const fileSize = formatFileSize(fileBuffer.length);

  let imageInfo = {};
  let exifData = {};
  let gpsData = {};

  try {
    // Get image metadata using sharp
    const sharpMeta = await sharp(fileBuffer).metadata();

    imageInfo = {
      width: sharpMeta.width,
      height: sharpMeta.height,
      format: sharpMeta.format?.toUpperCase(),
      colorSpace: sharpMeta.space,
      channels: sharpMeta.channels,
      bitDepth: sharpMeta.depth,
      hasAlpha: sharpMeta.hasAlpha,
      orientation: sharpMeta.orientation,
      density: sharpMeta.density,
      isProgressive: sharpMeta.isProgressive
    };

    // Extract EXIF data if available
    if (sharpMeta.exif) {
      try {
        // Sharp provides raw EXIF buffer, we need to parse it
        // For now, we'll use the basic metadata sharp provides
        // EXIF parsing would require exif-reader package for full details
      } catch (e) {
        console.log('EXIF parsing skipped:', e.message);
      }
    }

    // Check for ICC profile
    if (sharpMeta.icc) {
      imageInfo.hasIccProfile = true;
    }

  } catch (error) {
    console.error('Image metadata extraction error:', error.message);
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
  if (metadata.publicUrl) {
    md += `| **Download** | ${metadata.publicUrl} |\n`;
  }
  md += `| **Uploaded** | ${metadata.timestamp} |\n`;
  md += `\n`;

  // Image Properties section
  if (imageInfo.width && imageInfo.height) {
    md += `## Image Properties\n`;
    md += `| Property | Value |\n`;
    md += `|----------|-------|\n`;
    md += `| **Dimensions** | ${imageInfo.width} x ${imageInfo.height} px |\n`;

    const aspectRatio = calculateAspectRatio(imageInfo.width, imageInfo.height);
    if (aspectRatio) {
      md += `| **Aspect Ratio** | ${aspectRatio} |\n`;
    }

    if (imageInfo.format) {
      md += `| **Format** | ${imageInfo.format} |\n`;
    }
    if (imageInfo.colorSpace) {
      md += `| **Color Space** | ${imageInfo.colorSpace} |\n`;
    }
    if (imageInfo.channels) {
      md += `| **Channels** | ${imageInfo.channels} |\n`;
    }
    if (imageInfo.bitDepth) {
      md += `| **Bit Depth** | ${imageInfo.bitDepth} bits |\n`;
    }
    if (imageInfo.hasAlpha !== undefined) {
      md += `| **Has Alpha** | ${imageInfo.hasAlpha ? 'Yes' : 'No'} |\n`;
    }
    if (imageInfo.density) {
      md += `| **Resolution** | ${imageInfo.density} DPI |\n`;
    }
    if (imageInfo.orientation && imageInfo.orientation !== 1) {
      md += `| **Orientation** | ${imageInfo.orientation} |\n`;
    }
    if (imageInfo.isProgressive) {
      md += `| **Progressive** | Yes |\n`;
    }
    if (imageInfo.hasIccProfile) {
      md += `| **ICC Profile** | Embedded |\n`;
    }
    md += `\n`;
  }

  // Note about EXIF
  md += `---\n`;
  md += `*Image saved and available for LLM vision analysis*\n`;
  md += `*Processed at ${metadata.timestamp}*\n`;

  return {
    markdown: md,
    metadata: {
      ...metadata,
      filename,
      type: fileType,
      size: fileBuffer.length,
      sizeFormatted: fileSize,
      category: 'image',
      image: imageInfo,
      exif: Object.keys(exifData).length > 0 ? exifData : null,
      gps: Object.keys(gpsData).length > 0 ? gpsData : null
    }
  };
}
