#!/usr/bin/env node
/**
 * Rasterise DET monogram (logo-mark-source.jpg) into PNG/SVG brand assets.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const assetsDir = path.join(publicDir, 'assets');
const brandDir = path.join(publicDir, 'brand');

const BG = { r: 12, g: 10, b: 10, alpha: 1 };
const SOURCE = path.join(brandDir, 'logo-mark-source.jpg');
const PROCESSED = path.join(brandDir, 'logo-mark-processed.png');

/** Remove near-white JPEG corners and flatten onto brand background. */
async function preprocessLogoSource() {
  const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 232 && g > 232 && b > 232) {
      data[i + 3] = 0;
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .flatten({ background: '#0c0a0a' })
    .png()
    .toFile(PROCESSED);
  return PROCESSED;
}

let LOGO_INPUT = SOURCE;

function svgWithEmbeddedPng(pngBuffer, size, label = 'DesiEroticTales DET') {
  const b64 = pngBuffer.toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}">
  <rect width="${size}" height="${size}" fill="#0c0a0a"/>
  <image width="${size}" height="${size}" href="data:image/png;base64,${b64}"/>
</svg>`;
}

async function markPng(size) {
  return sharp(LOGO_INPUT)
    .resize(size, size, { fit: 'contain', background: BG })
    .png()
    .toFile(path.join(brandDir, `_tmp-mark-${size}.png`))
    .then(() => fs.readFileSync(path.join(brandDir, `_tmp-mark-${size}.png`)));
}

async function rasteriseMark(outPath, size) {
  const buf = await markPng(size);
  await sharp(buf).png().toFile(outPath);
  return buf;
}

async function circularAvatar(outPath, size) {
  const inset = Math.round(size * 0.08);
  const inner = size - inset * 2;
  const mark = await sharp(LOGO_INPUT)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
  );

  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 26, g: 20, b: 20, alpha: 255 } },
  })
    .png()
    .toBuffer();

  const flat = await sharp(bg)
    .composite([{ input: mark, left: inset, top: inset }])
    .png()
    .toBuffer();

  await sharp(flat)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(outPath);
}

async function buildOgImage(markBuf) {
  const width = 1200;
  const height = 630;
  const markSize = 300;

  const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030303"/>
      <stop offset="55%" stop-color="#0c0a0a"/>
      <stop offset="100%" stop-color="#1a1414"/>
    </linearGradient>
    <radialGradient id="glow" cx="22%" cy="42%" r="50%">
      <stop offset="0%" stop-color="#9e1a38" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#9e1a38" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect x="80" y="80" width="1040" height="470" rx="24" fill="none" stroke="#2a2220" stroke-width="2"/>
  <text x="460" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="600" fill="#f8f0e4">Desi</text>
  <text x="590" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="600" fill="#9e1a38">Erotic</text>
  <text x="800" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="600" fill="#e8c45c">Tales</text>
  <text x="460" y="340" font-family="Arial, sans-serif" font-size="28" letter-spacing="0.12em" fill="#b0a498">TELUGU &amp; DESI EROTIC FICTION</text>
  <text x="460" y="400" font-family="Georgia, serif" font-size="34" fill="#f8f0e4">Kamakathalu · Boothu kathalu · 20+ categories</text>
  <text x="460" y="460" font-family="Arial, sans-serif" font-size="26" fill="#b0a498">desierotictales.online</text>
</svg>`;

  const mark = await sharp(markBuf)
    .resize(markSize, markSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg = await sharp(Buffer.from(bgSvg)).resize(width, height).png().toBuffer();

  await sharp(bg)
    .composite([{ input: mark, left: 110, top: 165 }])
    .png()
    .toFile(path.join(assetsDir, 'og-image.png'));
}

async function buildFullLogoSvg(mark512) {
  const mark64 = await sharp(mark512).resize(64, 64, { fit: 'contain', background: BG }).png().toBuffer();
  const b64 = mark64.toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 300 48" role="img" aria-label="DesiEroticTales">
  <image x="0" y="0" width="44" height="44" href="data:image/png;base64,${b64}"/>
  <text x="54" y="22" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="600" fill="#f8f0e4">Desi</text>
  <text x="98" y="22" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="600" fill="#9e1a38">Erotic</text>
  <text x="168" y="22" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="600" fill="#e8c45c">Tales</text>
  <text x="54" y="40" font-family="Arial, sans-serif" font-size="9" letter-spacing="0.14em" fill="#b0a498">TELUGU &amp; DESI FICTION</text>
</svg>`;
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Missing logo source:', SOURCE);
    process.exit(1);
  }

  LOGO_INPUT = await preprocessLogoSource();

  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(brandDir, { recursive: true });

  const mark512 = await rasteriseMark(path.join(brandDir, 'logo-mark.png'), 512);
  await rasteriseMark(path.join(brandDir, 'logo-mark-64.png'), 64);
  const mark32 = await rasteriseMark(path.join(assetsDir, 'favicon-32.png'), 32);
  const mark16 = await rasteriseMark(path.join(assetsDir, 'favicon-16.png'), 16);
  const mark180 = await rasteriseMark(path.join(assetsDir, 'apple-touch-icon.png'), 180);

  fs.writeFileSync(path.join(brandDir, 'logo-mark.svg'), svgWithEmbeddedPng(mark512, 512));
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgWithEmbeddedPng(mark32, 32));
  fs.writeFileSync(path.join(brandDir, 'logo.svg'), await buildFullLogoSvg(mark512));

  await buildOgImage(mark512);
  await circularAvatar(path.join(assetsDir, 'admin-avatar.png'), 256);
  await circularAvatar(path.join(assetsDir, 'admin-avatar-unisex.png'), 256);
  await circularAvatar(path.join(assetsDir, 'default-avatar.png'), 256);

  for (const f of fs.readdirSync(brandDir).filter((n) => n.startsWith('_tmp-mark-'))) {
    fs.unlinkSync(path.join(brandDir, f));
  }

  console.log('Brand assets generated from DET monogram (v2).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});