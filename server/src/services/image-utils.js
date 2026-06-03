const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Kling API base64 limit is ~61440 chars
const MAX_BASE64_LENGTH = 60000;
const MAX_DIMENSION = 1280;

/**
 * Convert a local file URL to a base64 data URI.
 * Automatically resizes and compresses images to stay within Kling API limits.
 */
async function toBase64DataUri(imageUrl) {
  if (!imageUrl) return imageUrl;

  // Already a base64 data URI
  if (imageUrl.startsWith('data:')) return imageUrl;

  // Extract the path part (remove origin if present)
  let filePath = imageUrl;
  if (filePath.startsWith('http://localhost') || filePath.startsWith('http://127.0.0.1')) {
    const url = new URL(filePath);
    filePath = url.pathname;
  }

  // If it's a remote URL (not local), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    if (!imageUrl.includes('localhost') && !imageUrl.includes('127.0.0.1')) {
      return imageUrl;
    }
  }

  // Local file: resize, compress, and convert to base64
  const fullPath = filePath.startsWith('/uploads/')
    ? path.join(UPLOADS_DIR, path.basename(filePath))
    : filePath;

  try {
    let pipeline = sharp(fullPath)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 });

    let buffer = await pipeline.toBuffer();
    let mimeType = 'image/jpeg';

    // If still too large, reduce quality further
    if (buffer.toString('base64').length > MAX_BASE64_LENGTH) {
      buffer = await sharp(fullPath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      mimeType = 'image/jpeg';
    }

    const base64 = buffer.toString('base64');
    console.log(`[image-utils] Converted ${path.basename(fullPath)} -> base64 (${base64.length} chars)`);

    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error('[image-utils] Failed to process file:', fullPath, err.message);
    return imageUrl;
  }
}

module.exports = { toBase64DataUri };