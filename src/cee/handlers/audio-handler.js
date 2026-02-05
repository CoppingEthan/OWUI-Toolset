/**
 * Audio Handler
 * Extracts metadata from audio files (no transcription)
 */

import { parseBuffer } from 'music-metadata';
import { getFileTypeDescription, formatFileSize } from '../../utils/file-type-detector.js';

/**
 * Format duration to mm:ss or hh:mm:ss
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bitrate to human readable
 * @param {number} bitrate - Bitrate in bits per second
 * @returns {string}
 */
function formatBitrate(bitrate) {
  if (!bitrate) return null;
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  }
  return `${Math.round(bitrate / 1000)} kbps`;
}

/**
 * Extract metadata from audio file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{markdown: string, metadata: Object}>}
 */
export async function extractAudio(fileBuffer, filename, metadata) {
  const fileType = getFileTypeDescription(filename);
  const fileSize = formatFileSize(fileBuffer.length);

  let audioInfo = {};
  let tags = {};

  try {
    // Parse audio metadata
    const parsed = await parseBuffer(fileBuffer, { mimeType: 'audio/mpeg' });

    // Format info
    if (parsed.format) {
      audioInfo = {
        container: parsed.format.container,
        codec: parsed.format.codec,
        duration: parsed.format.duration,
        durationFormatted: formatDuration(parsed.format.duration),
        bitrate: parsed.format.bitrate,
        bitrateFormatted: formatBitrate(parsed.format.bitrate),
        sampleRate: parsed.format.sampleRate,
        channels: parsed.format.numberOfChannels,
        bitsPerSample: parsed.format.bitsPerSample,
        lossless: parsed.format.lossless
      };
    }

    // Common tags (ID3, Vorbis, etc.)
    if (parsed.common) {
      tags = {
        title: parsed.common.title,
        artist: parsed.common.artist,
        albumArtist: parsed.common.albumartist,
        album: parsed.common.album,
        year: parsed.common.year,
        track: parsed.common.track?.no,
        trackTotal: parsed.common.track?.of,
        disc: parsed.common.disk?.no,
        discTotal: parsed.common.disk?.of,
        genre: parsed.common.genre?.join(', '),
        composer: parsed.common.composer?.join(', '),
        comment: parsed.common.comment?.join(', '),
        bpm: parsed.common.bpm,
        encodedBy: parsed.common.encodedby,
        copyright: parsed.common.copyright
      };

      // Remove undefined/null values
      Object.keys(tags).forEach(key => {
        if (tags[key] === undefined || tags[key] === null) {
          delete tags[key];
        }
      });
    }

  } catch (error) {
    console.error('Audio metadata extraction error:', error.message);
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

  // Audio Properties section
  if (audioInfo.duration || audioInfo.codec) {
    md += `## Audio Properties\n`;
    md += `| Property | Value |\n`;
    md += `|----------|-------|\n`;

    if (audioInfo.durationFormatted) {
      md += `| **Duration** | ${audioInfo.durationFormatted} |\n`;
    }
    if (audioInfo.container) {
      md += `| **Container** | ${audioInfo.container} |\n`;
    }
    if (audioInfo.codec) {
      md += `| **Codec** | ${audioInfo.codec} |\n`;
    }
    if (audioInfo.bitrateFormatted) {
      md += `| **Bitrate** | ${audioInfo.bitrateFormatted} |\n`;
    }
    if (audioInfo.sampleRate) {
      md += `| **Sample Rate** | ${audioInfo.sampleRate.toLocaleString()} Hz |\n`;
    }
    if (audioInfo.channels) {
      const channelDesc = audioInfo.channels === 1 ? 'Mono' : audioInfo.channels === 2 ? 'Stereo' : `${audioInfo.channels} channels`;
      md += `| **Channels** | ${channelDesc} |\n`;
    }
    if (audioInfo.bitsPerSample) {
      md += `| **Bit Depth** | ${audioInfo.bitsPerSample} bits |\n`;
    }
    if (audioInfo.lossless !== undefined) {
      md += `| **Quality** | ${audioInfo.lossless ? 'Lossless' : 'Lossy'} |\n`;
    }
    md += `\n`;
  }

  // Tags/Metadata section
  if (Object.keys(tags).length > 0) {
    md += `## Media Tags\n`;
    md += `| Property | Value |\n`;
    md += `|----------|-------|\n`;

    if (tags.title) md += `| **Title** | ${tags.title} |\n`;
    if (tags.artist) md += `| **Artist** | ${tags.artist} |\n`;
    if (tags.albumArtist && tags.albumArtist !== tags.artist) {
      md += `| **Album Artist** | ${tags.albumArtist} |\n`;
    }
    if (tags.album) md += `| **Album** | ${tags.album} |\n`;
    if (tags.year) md += `| **Year** | ${tags.year} |\n`;
    if (tags.track) {
      const trackStr = tags.trackTotal ? `${tags.track} of ${tags.trackTotal}` : String(tags.track);
      md += `| **Track** | ${trackStr} |\n`;
    }
    if (tags.disc) {
      const discStr = tags.discTotal ? `${tags.disc} of ${tags.discTotal}` : String(tags.disc);
      md += `| **Disc** | ${discStr} |\n`;
    }
    if (tags.genre) md += `| **Genre** | ${tags.genre} |\n`;
    if (tags.composer) md += `| **Composer** | ${tags.composer} |\n`;
    if (tags.bpm) md += `| **BPM** | ${tags.bpm} |\n`;
    if (tags.copyright) md += `| **Copyright** | ${tags.copyright} |\n`;

    md += `\n`;
  }

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
      category: 'audio',
      audio: audioInfo,
      tags: Object.keys(tags).length > 0 ? tags : null
    }
  };
}
