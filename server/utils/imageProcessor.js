const sharp = require('sharp');
const path = require('path');

// Limit input image dimensions to 100 megapixels to prevent decompression bomb / OOM attacks
const SHARP_OPTIONS = { limitInputPixels: 100_000_000 };
const ALLOWED_SHARP_FORMATS = new Set(['png', 'jpeg', 'webp', 'tiff']);
const FORMAT_TO_MIME = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  tiff: 'image/tiff',
};

/**
 * Escapes special XML characters to safely embed text inside an SVG template.
 * @param {string} unsafe
 * @returns {string}
 */
function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Takes a high-resolution master design Buffer, verifies its actual magic-byte format and pixel
 * dimensions, trims any outer white print margin so the web preview is edge-to-edge artwork,
 * downscales it to fit within 800x1130, bakes a diagonal semi-transparent SVG watermark directly
 * into the pixels, and encodes it as a .webp file.
 *
 * @param {Buffer} masterBuffer
 * @param {string} originalFilename
 * @param {string} [storeName]
 * @returns {Promise<{ previewBuffer: Buffer, previewFilename: string, verifiedMimeType: string }>}
 */
async function generateWatermarkedPreview(
  masterBuffer,
  originalFilename,
  storeName = process.env.STORE_NAME || 'PROVI-PRINTS'
) {
  // 0. Inspect magic bytes & pixel dimensions before full decompression
  let metadata;
  try {
    metadata = await sharp(masterBuffer, SHARP_OPTIONS).metadata();
  } catch {
    const err = new Error('Invalid or corrupted image file, or image dimensions exceed 100 MP limit.');
    err.isClientSafe = true;
    err.statusCode = 400;
    throw err;
  }

  if (!metadata || !metadata.format || !ALLOWED_SHARP_FORMATS.has(metadata.format)) {
    const err = new Error('Invalid file type. Only valid PNG, JPEG, WebP, and TIFF images are allowed.');
    err.isClientSafe = true;
    err.statusCode = 400;
    throw err;
  }

  const verifiedMimeType = FORMAT_TO_MIME[metadata.format] || 'application/octet-stream';

  // 1. Auto-orient and trim outer white print borders (e.g. 107px margin on A3 masters)
  // so web previews are edge-to-edge while the private master keeps its print border.
  let sourceBuffer = masterBuffer;
  try {
    sourceBuffer = await sharp(masterBuffer, SHARP_OPTIONS)
      .rotate()
      .trim({ background: '#ffffff', threshold: 15 })
      .toBuffer();
  } catch {
    sourceBuffer = await sharp(masterBuffer, SHARP_OPTIONS).rotate().toBuffer();
  }

  // 2. Resize the trimmed artwork to fit inside 800x1130 without enlarging smaller images
  const { data: resizedBuffer, info } = await sharp(sourceBuffer, SHARP_OPTIONS)
    .resize({
      width: 800,
      height: 1130,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer({ resolveWithObject: true });

  const width = info.width || 800;
  const height = info.height || 1130;
  const safeStoreName = escapeXml(storeName.toUpperCase());
  const watermarkText = `© ${safeStoreName} PREVIEW`;

  // Dynamically scale font size to fit across the resized dimensions
  const mainFontSize = Math.max(20, Math.round(Math.min(width, height) * 0.065));
  const patternFontSize = Math.max(13, Math.round(Math.min(width, height) * 0.032));
  const patternTileWidth = Math.max(220, Math.round(width * 0.55));
  const patternTileHeight = Math.max(140, Math.round(height * 0.22));

  // 3. Build a full-coverage SVG overlay with a repeating diagonal grid + prominent central watermark
  const watermarkSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="diagonalWatermarkGrid"
          width="${patternTileWidth}"
          height="${patternTileHeight}"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-32)"
        >
          <text
            x="50%"
            y="50%"
            dominant-baseline="middle"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="${patternFontSize}"
            font-weight="bold"
            letter-spacing="2"
            fill="rgba(255, 255, 255, 0.22)"
            stroke="rgba(0, 0, 0, 0.18)"
            stroke-width="0.75"
          >${watermarkText}</text>
        </pattern>
      </defs>

      <!-- Tiled diagonal watermark across the entire design -->
      <rect width="100%" height="100%" fill="url(#diagonalWatermarkGrid)" />

      <!-- Prominent center diagonal watermark -->
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${mainFontSize}"
        font-weight="bold"
        letter-spacing="3"
        fill="rgba(255, 255, 255, 0.34)"
        stroke="rgba(0, 0, 0, 0.28)"
        stroke-width="1.2"
        transform="rotate(-35, ${Math.round(width / 2)}, ${Math.round(height / 2)})"
      >${watermarkText}</text>
    </svg>
  `;

  // 4. Composite the SVG onto the resized image and compress as WebP (quality: 75)
  const previewBuffer = await sharp(resizedBuffer, SHARP_OPTIONS)
    .composite([
      {
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0,
      },
    ])
    .webp({ quality: 75 })
    .toBuffer();

  // 5. Generate a clean, URL-safe .webp preview filename
  const parsedName = path.parse(originalFilename).name;
  const cleanSlug =
    parsedName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'design';

  const previewFilename = `${cleanSlug}-preview-${Date.now()}.webp`;

  return {
    previewBuffer,
    previewFilename,
    verifiedMimeType,
  };
}

module.exports = {
  generateWatermarkedPreview,
};
