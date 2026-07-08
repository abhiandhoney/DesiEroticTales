#!/usr/bin/env node
/**
 * Rasterise brand SVGs into PNG assets (favicon, apple-touch, OG image).
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

async function rasterise(svgPath, outPath, width, height = width) {
  const svg = fs.readFileSync(svgPath);
  await sharp(svg, { density: 300 })
    .resize(width, height, { fit: 'contain', background: { r: 12, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(outPath);
}

const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030303"/>
      <stop offset="55%" stop-color="#0c0a0a"/>
      <stop offset="100%" stop-color="#1a1414"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8c45c"/>
      <stop offset="100%" stop-color="#c9a227"/>
    </linearGradient>
    <linearGradient id="burgundy" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#5c1528"/>
      <stop offset="100%" stop-color="#9e1a38"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#9e1a38" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#9e1a38" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="80" y="80" width="1040" height="470" rx="24" fill="none" stroke="#2a2220" stroke-width="2"/>
  <g transform="translate(120 175) scale(2.8)">
    <rect x="2" y="2" width="60" height="60" rx="14" fill="#0c0a0a" stroke="#2a2220" stroke-width="2"/>
    <path d="M32 14c-1 0-2 .4-2.6 1.1L20 26.5V46c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V26.5L34.6 15.1C34 14.4 33 14 32 14z" fill="url(#burgundy)" opacity="0.35"/>
    <path d="M22 28v16c0 1.1.9 2 2 2h4V26l-4 2z" fill="url(#burgundy)"/>
    <path d="M42 28v18h-4V26l4 2z" fill="url(#gold)"/>
    <path d="M30 24h4v20h-4z" fill="#2a2220"/>
    <path d="M32 11c2.2 0 4 1.8 4 4 0 1.4-.7 2.6-1.8 3.3L32 20l-2.2-1.7C28.7 17.6 28 16.4 28 15c0-2.2 1.8-4 4-4z" fill="url(#gold)"/>
    <circle cx="32" cy="15" r="1.2" fill="#f8f0e4"/>
  </g>
  <text x="340" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="600" fill="#f8f0e4">Desi</text>
  <text x="470" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="600" fill="#9e1a38">Erotic</text>
  <text x="680" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-weight="600" fill="#e8c45c">Tales</text>
  <text x="340" y="320" font-family="Arial, sans-serif" font-size="28" letter-spacing="0.12em" fill="#b0a498">TELUGU &amp; DESI EROTIC FICTION</text>
  <text x="340" y="390" font-family="Georgia, serif" font-size="34" fill="#f8f0e4">Kamakathalu · Boothu kathalu · 20+ categories</text>
  <text x="340" y="450" font-family="Arial, sans-serif" font-size="26" fill="#b0a498">desierotictales.online</text>
</svg>`;

async function main() {
  fs.mkdirSync(assetsDir, { recursive: true });

  const mark = path.join(brandDir, 'logo-mark.svg');
  const faviconSvg = path.join(publicDir, 'favicon.svg');
  const defaultAvatar = path.join(assetsDir, 'default-avatar.svg');

  await rasterise(mark, path.join(assetsDir, 'apple-touch-icon.png'), 180);
  await rasterise(faviconSvg, path.join(assetsDir, 'favicon-32.png'), 32);
  await rasterise(faviconSvg, path.join(assetsDir, 'favicon-16.png'), 16);
  await rasterise(defaultAvatar, path.join(assetsDir, 'default-avatar.png'), 256);
  await rasterise(mark, path.join(assetsDir, 'admin-avatar.png'), 256);
  await rasterise(mark, path.join(assetsDir, 'admin-avatar-unisex.png'), 256);

  await sharp(Buffer.from(ogSvg), { density: 150 })
    .resize(1200, 630)
    .png()
    .toFile(path.join(assetsDir, 'og-image.png'));

  console.log('Brand PNG assets generated in public/assets/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});