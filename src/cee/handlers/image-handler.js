/**
 * Image Handler
 * Extracts metadata and EXIF data from image files
 */

import sharp from 'sharp';
import { getFileTypeDescription, formatFileSize } from '../../utils/file-type-detector.js';

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

    // Check for ICC profile (Sharp exposes full EXIF as a raw buffer;
    // parsing it properly requires the exif-reader package, which we
    // don't currently depend on).
    if (sharpMeta.icc) imageInfo.hasIccProfile = true;

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
    },
  };
}
