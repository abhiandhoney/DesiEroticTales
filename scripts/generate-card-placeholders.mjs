#!/usr/bin/env node
/** Generate dark premium story-card placeholder images. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets', 'card-placeholders');

const VARIANTS = [
  {
    name: 'placeholder-1',
    bg: ['#12080c', '#2a1018', '#080606'],
    accent: '#9e1a38',
    gold: '#c9a227',
    motif: 'curves',
  },
  {
    name: 'placeholder-2',
    bg: ['#080606', '#1a1414', '#3d1520'],
    accent: '#5c1528',
    gold: '#e8c45c',
    motif: 'silhouette',
  },
  {
    name: 'placeholder-3',
    bg: ['#0c0a0a', '#1f1218', '#12080c'],
    accent: '#9e1a38',
    gold: '#d4a574',
    motif: 'lines',
  },
  {
    name: 'placeholder-4',
    bg: ['#030303', '#1a1414', '#2a1018'],
    accent: '#c41e42',
    gold: '#c9a227',
    motif: 'glow',
  },
];

function placeholderSvg({ bg, accent, gold, motif }, i) {
  const gradId = `bg${i}`;
  const glowId = `glow${i}`;
  let decor = '';
  if (motif === 'curves') {
    decor = `
      <path d="M-40 220 C120 80, 280 360, 520 180" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>
      <path d="M80 320 C220 120, 420 300, 640 140" fill="none" stroke="${gold}" stroke-opacity="0.28" stroke-width="2"/>
      <ellipse cx="520" cy="120" rx="180" ry="100" fill="url(#${glowId})"/>
    `;
  } else if (motif === 'silhouette') {
    decor = `
      <path d="M0 360 Q200 220 400 300 T800 240 L800 450 L0 450 Z" fill="${accent}" fill-opacity="0.18"/>
      <circle cx="620" cy="110" r="90" fill="url(#${glowId})"/>
    `;
  } else if (motif === 'lines') {
    decor = `
      <line x1="40" y1="380" x2="760" y2="80" stroke="${gold}" stroke-opacity="0.15" stroke-width="2"/>
      <line x1="0" y1="300" x2="800" y2="300" stroke="${accent}" stroke-opacity="0.12" stroke-width="1"/>
      <rect x="520" y="40" width="220" height="220" rx="110" fill="url(#${glowId})"/>
    `;
  } else {
    decor = `
      <circle cx="400" cy="225" r="160" fill="url(#${glowId})"/>
      <path d="M120 400 C240 260, 360 360, 520 280 S760 180, 700 80" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="2.5"/>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg[0]}"/>
      <stop offset="55%" stop-color="${bg[1]}"/>
      <stop offset="100%" stop-color="${bg[2]}"/>
    </linearGradient>
    <radialGradient id="${glowId}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#${gradId})"/>
  ${decor}
  <text x="400" y="228" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="600" fill="${gold}" fill-opacity="0.58" letter-spacing="0.06em">Desi Erotic</text>
  <text x="400" y="268" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="600" fill="${gold}" fill-opacity="0.58" letter-spacing="0.06em">Tales</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < VARIANTS.length; i++) {
    const v = VARIANTS[i];
    const svg = placeholderSvg(v, i);
    await sharp(Buffer.from(svg))
      .webp({ quality: 88 })
      .toFile(path.join(outDir, `${v.name}.webp`));
  }
  console.log(`Card placeholders: ${VARIANTS.length} images in public/assets/card-placeholders/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});