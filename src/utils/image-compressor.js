/**
 * Image Compression Utility for OWUI Toolset V2
 *
 * Compresses images to:
 * - JPEG format at 85% quality
 * - Max 2048 pixels on longest edge (maintains aspect ratio)
 * - Skips SVG and animated GIFs
 */

import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

// Configuration for general compression (saving to disk)
const CONFIG = {
  MAX_DIMENSION: 2048,
  JPEG_QUALITY: 85,
  // Image types we can compress
  COMPRESSIBLE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'],
  // Types to skip (return as-is)
  SKIP_TYPES: ['image/svg+xml', 'image/gif'],
  // Max input size (50MB)
  MAX_INPUT_SIZE: 50 * 1024 * 1024,
};

// Configuration for LLM vision (optimized for API limits and token efficiency)
// Target: 2MP (2 million pixels) at 80% JPEG quality
// 1414 x 1414 = ~2MP, stays well under API size limits
const LLM_CONFIG = {
  MAX_DIMENSION: 1414,   // ~2MP (1414x1414 = 2M pixels)
  JPEG_QUALITY: 80,      // Good quality/size balance for vision
  MAX_FILE_SIZE: 4 * 1024 * 1024,  // Target 4MB to stay under 5MB limit
  MIN_QUALITY: 20,       // Don't go below 20% quality
};

/**
 * Detect if a buffer is an image and get its type
 * @param {Buffer} buffer - The file buffer
 * @returns {Promise<{ isImage: boolean, mime: string | null, ext: string | null }>}
 */
export async function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { isImage: false, mime: null, ext: null };
  }

  try {
    const type = await fileTypeFromBuffer(buffer);
    if (!type) {
      return { isImage: false, mime: null, ext: null };
    }

    const isImage = type.mime.startsWith('image/');
    return {
      isImage,
      mime: type.mime,
      ext: type.ext,
    };
  } catch (error) {
    console.error('Error detecting image type:', error.message);
    return { isImage: false, mime: null, ext: null };
  }
}

/**
 * Check if an image type should be compressed
 * @param {string} mimeType - The MIME type of the image
 * @returns {{ shouldCompress: boolean, reason: string }}
 */
export function shouldCompressType(mimeType) {
  if (!mimeType) {
    return { shouldCompress: false, reason: 'Unknown type' };
  }

  if (CONFIG.SKIP_TYPES.includes(mimeType)) {
    return { shouldCompress: false, reason: `Skipped type: ${mimeType}` };
  }

  if (CONFIG.COMPRESSIBLE_TYPES.includes(mimeType)) {
    return { shouldCompress: true, reason: 'Compressible image type' };
  }

  // Unknown image type - try to compress anyway
  if (mimeType.startsWith('image/')) {
    return { shouldCompress: true, reason: 'Unknown image type, attempting compression' };
  }

  return { shouldCompress: false, reason: 'Not an image' };
}

/**
 * Compress an image buffer
 *
 * @param {Buffer} inputBuffer - The original image buffer
 * @param {Object} options - Compression options
 * @param {number} options.maxDimension - Max pixels on longest edge (default: 2048)
 * @param {number} options.quality - JPEG quality 1-100 (default: 85)
 * @returns {Promise<{
 *   buffer: Buffer,
 *   compressed: boolean,
 *   stats: {
 *     originalSize: number,
 *     compressedSize: number,
 *     originalDimensions: string,
 *     newDimensions: string,
 *     compressionRatio: number,
 *     skipped: boolean,
 *     reason: string
 *   }
 * }>}
 */
export async function compressImage(inputBuffer, options = {}) {
  const maxDimension = options.maxDimension || CONFIG.MAX_DIMENSION;
  const quality = options.quality || CONFIG.JPEG_QUALITY;

  const originalSize = inputBuffer.length;

  // Check size limit
  if (originalSize > CONFIG.MAX_INPUT_SIZE) {
    throw new Error(`Image exceeds maximum size of ${CONFIG.MAX_INPUT_SIZE / 1024 / 1024}MB`);
  }

  // Detect image type
  const typeInfo = await detectImageType(inputBuffer);

  if (!typeInfo.isImage) {
    // Not an image - return as-is
    return {
      buffer: inputBuffer,
      compressed: false,
      stats: {
        originalSize,
        compressedSize: originalSize,
        originalDimensions: 'N/A',
        newDimensions: 'N/A',
        compressionRatio: 1,
        skipped: true,
        reason: 'Not an image file',
      },
    };
  }

  // Check if we should compress this type
  const { shouldCompress, reason } = shouldCompressType(typeInfo.mime);

  if (!shouldCompress) {
    return {
      buffer: inputBuffer,
      compressed: false,
      stats: {
        originalSize,
        compressedSize: originalSize,
        originalDimensions: 'N/A',
        newDimensions: 'N/A',
        compressionRatio: 1,
        skipped: true,
        reason,
      },
    };
  }

  try {
    // Get original metadata
    const metadata = await sharp(inputBuffer).metadata();
    const originalDimensions = `${metadata.width}x${metadata.height}`;

    // Build compression pipeline
    let pipeline = sharp(inputBuffer);

    // Resize if needed (maintain aspect ratio)
    const needsResize = metadata.width > maxDimension || metadata.height > maxDimension;
    if (needsResize) {
      pipeline = pipeline.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to JPEG at specified quality
    pipeline = pipeline.jpeg({
      quality,
      mozjpeg: true,
      chromaSubsampling: '4:2:0',
    });

    // Process
    const outputBuffer = await pipeline.toBuffer();
    const compressedSize = outputBuffer.length;

    // Get new dimensions
    const newMetadata = await sharp(outputBuffer).metadata();
    const newDimensions = `${newMetadata.width}x${newMetadata.height}`;

    const compressionRatio = compressedSize / originalSize;
    const savings = ((1 - compressionRatio) * 100).toFixed(1);

    console.log(`🖼️  Compressed: ${originalDimensions} → ${newDimensions}, ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% saved)`);

    return {
      buffer: outputBuffer,
      compressed: true,
      stats: {
        originalSize,
        compressedSize,
        originalDimensions,
        newDimensions,
        compressionRatio,
        skipped: false,
        reason: 'Compressed successfully',
      },
    };
  } catch (error) {
    console.error('Error compressing image:', error.message);
    // Return original on error
    return {
      buffer: inputBuffer,
      compressed: false,
      stats: {
        originalSize,
        compressedSize: originalSize,
        originalDimensions: 'unknown',
        newDimensions: 'unknown',
        compressionRatio: 1,
        skipped: true,
        reason: `Compression failed: ${error.message}`,
      },
    };
  }
}

/**
 * Compress a base64-encoded image
 *
 * @param {string} base64Data - Base64 string (without data: prefix)
 * @param {Object} options - Compression options
 * @returns {Promise<{ base64: string, compressed: boolean, stats: Object }>}
 */
export async function compressBase64Image(base64Data, options = {}) {
  // Decode base64 to buffer
  const inputBuffer = Buffer.from(base64Data, 'base64');

  // Compress
  const result = await compressImage(inputBuffer, options);

  // Encode back to base64
  const outputBase64 = result.buffer.toString('base64');

  return {
    base64: outputBase64,
    compressed: result.compressed,
    stats: result.stats,
  };
}

/**
 * Compress an image buffer specifically for LLM vision APIs
 * Uses more aggressive settings optimized for API limits and token efficiency
 *
 * @param {Buffer} inputBuffer - The original image buffer
 * @returns {Promise<{ buffer: Buffer, base64: string, mediaType: string, stats: Object }>}
 */
export async function compressForLLM(inputBuffer) {
  const originalSize = inputBuffer.length;

  // Detect image type
  const typeInfo = await detectImageType(inputBuffer);

  if (!typeInfo.isImage) {
    // Not an image - return as-is
    const base64 = inputBuffer.toString('base64');
    return {
      buffer: inputBuffer,
      base64,
      mediaType: 'application/octet-stream',
      stats: { skipped: true, reason: 'Not an image' }
    };
  }

  // Check if we should compress this type
  const { shouldCompress } = shouldCompressType(typeInfo.mime);

  if (!shouldCompress) {
    const base64 = inputBuffer.toString('base64');
    return {
      buffer: inputBuffer,
      base64,
      mediaType: typeInfo.mime,
      stats: { skipped: true, reason: `Skipped type: ${typeInfo.mime}` }
    };
  }

  try {
    // Get original metadata
    const metadata = await sharp(inputBuffer).metadata();

    // Build compression pipeline
    let pipeline = sharp(inputBuffer);

    // Resize if needed (use LLM config)
    const needsResize = metadata.width > LLM_CONFIG.MAX_DIMENSION || metadata.height > LLM_CONFIG.MAX_DIMENSION;
    if (needsResize) {
      pipeline = pipeline.resize(LLM_CONFIG.MAX_DIMENSION, LLM_CONFIG.MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to JPEG at LLM-optimized quality
    pipeline = pipeline.jpeg({
      quality: LLM_CONFIG.JPEG_QUALITY,
      mozjpeg: true,
      chromaSubsampling: '4:2:0',
    });

    // Process initial compression
    let finalBuffer = await pipeline.toBuffer();
    let quality = LLM_CONFIG.JPEG_QUALITY;

    // Iterative compression: keep reducing quality until size is under limit
    while (finalBuffer.length > LLM_CONFIG.MAX_FILE_SIZE && quality > LLM_CONFIG.MIN_QUALITY) {
      quality -= 10;
      finalBuffer = await sharp(inputBuffer)
        .resize(LLM_CONFIG.MAX_DIMENSION, LLM_CONFIG.MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' })
        .toBuffer();
    }

    // Warn if still over limit after all attempts
    if (finalBuffer.length > LLM_CONFIG.MAX_FILE_SIZE) {
      console.warn(`⚠️ Image still ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB after compression to ${quality}% quality`);
    }

    const finalSize = finalBuffer.length;
    const savings = ((1 - finalSize / originalSize) * 100).toFixed(1);

    console.log(`🖼️  LLM compress: ${(originalSize / 1024).toFixed(0)}KB → ${(finalSize / 1024).toFixed(0)}KB (${savings}% saved, ${quality}% quality)`);

    return {
      buffer: finalBuffer,
      base64: finalBuffer.toString('base64'),
      mediaType: 'image/jpeg',
      stats: {
        originalSize,
        compressedSize: finalSize,
        compressionRatio: finalSize / originalSize,
        skipped: false
      }
    };
  } catch (error) {
    console.error('Error compressing for LLM:', error.message);
    // Return original on error
    const base64 = inputBuffer.toString('base64');
    return {
      buffer: inputBuffer,
      base64,
      mediaType: typeInfo.mime || 'image/jpeg',
      stats: { skipped: true, reason: `Error: ${error.message}` }
    };
  }
}

export default {
  compressImage,
  compressBase64Image,
  compressForLLM,
  detectImageType,
  shouldCompressType,
  CONFIG,
  LLM_CONFIG,
};
