// Strip near-white background from PNG ornaments so they blend into the cream
// certificate. Uses sharp for pixel access. Idempotent: runs against the
// originals and writes back the cleaned PNGs in place.
//
// Pixels are made transparent based on:
//   - whiteness: max(R,G,B)-min(R,G,B) is small AND brightness > THRESHOLD
//   - or alpha already 0
// We use a soft falloff so anti-aliased edges feather out rather than fringe.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const FILES = ['goldprint.png', 'topleft.png', 'topwatermark.png', 'crown.png'];

// Tuning knobs
const FULL_TRANSPARENT_BRIGHTNESS = 248; // px above this brightness => fully transparent
const FULL_OPAQUE_BRIGHTNESS = 220;       // px below this brightness => fully opaque
const SAT_THRESHOLD = 18;                  // px with chroma above this stay opaque even if bright

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

async function clean(file) {
  const inPath = path.join(PUBLIC_DIR, file);
  const tmpPath = path.join(PUBLIC_DIR, file.replace(/\.png$/i, '.cleaned.png'));

  const img = sharp(inPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels; // 4 (RGBA)
  const len = data.length / channels;

  for (let i = 0; i < len; i++) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const a = data[o + 3];
    if (a === 0) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const brightness = (r + g + b) / 3;

    if (chroma > SAT_THRESHOLD) continue; // colored pixel, keep

    if (brightness >= FULL_TRANSPARENT_BRIGHTNESS) {
      data[o + 3] = 0;
    } else if (brightness > FULL_OPAQUE_BRIGHTNESS) {
      // Linear feather between the two thresholds for clean anti-aliased edges
      const t =
        (brightness - FULL_OPAQUE_BRIGHTNESS) /
        (FULL_TRANSPARENT_BRIGHTNESS - FULL_OPAQUE_BRIGHTNESS);
      data[o + 3] = clamp(Math.round(a * (1 - t)), 0, 255);
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(tmpPath);

  // Replace original
  const fs = await import('node:fs/promises');
  await fs.rename(tmpPath, inPath);
  const stat = await fs.stat(inPath);
  console.log(`✓ ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
}

(async () => {
  for (const f of FILES) {
    try {
      await clean(f);
    } catch (e) {
      console.error(`✗ ${f}:`, e.message);
      process.exitCode = 1;
    }
  }
})();
