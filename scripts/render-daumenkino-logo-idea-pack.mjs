#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'docs', 'agent-system', 'social-auto-output', 'daumenkino-preview', 'daumenkino-logo-idea-pack');
const sourceDir = join(root, 'scratch', 'daumenkino-contact');

const logoTileOnChecker = join(sourceDir, 'tile_001.jpg');
const logoTileOnBlack = join(sourceDir, 'tile_002.jpg');
const photoshopCutout = join(
  root,
  'docs',
  'agent-system',
  'social-auto-output',
  'daumenkino-preview',
  'sissygut-design-prototypes',
  'airdox-wildstyle-cutout.png',
);

const W = 1080;
const H = 1920;

const palette = {
  bg: '#050608',
  surface: '#0f141a',
  border: '#263241',
  cyan: '#00f0ff',
  pink: '#ff00aa',
  lime: '#9adf6b',
  text: '#f5f8ff',
  muted: '#9aa6b2',
  black: '#000000',
};

const hexToRgb = (hex) => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16),
});

const makeTitleBarSvg = (title, subtitle) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg}"/>
        <stop offset="55%" stop-color="${palette.surface}"/>
        <stop offset="100%" stop-color="${palette.bg}"/>
      </linearGradient>
      <pattern id="scan" width="1" height="8" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="${palette.text}" opacity="0.07"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#scan)"/>
    <path d="M70 74 H1010 M70 1848 H1010 M70 74 V262 M1010 74 V262 M70 1640 V1848 M1010 1640 V1848"
      fill="none" stroke="${palette.border}" stroke-width="2"/>
    <rect x="70" y="88" width="560" height="58" fill="${palette.cyan}"/>
    <text x="92" y="129" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="${palette.bg}">${title}</text>
    <text x="72" y="222" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${palette.text}">${subtitle}</text>
    <text x="72" y="1760" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${palette.muted}">Source: Daumenkino Ideas (tile_001 / tile_002). Best cutout via Photoshop JSX.</text>
  </svg>`,
);

const extractAlphaFromTile = async () => {
  // Prefer Photoshop cutout if present; it’s the intended high-quality path.
  if (existsSync(photoshopCutout)) {
    const { data, info } = await sharp(photoshopCutout)
      .ensureAlpha()
      .resize({ width: 920, fit: 'inside' })
      .extractChannel('alpha')
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { alpha: data, width: info.width, height: info.height };
  }

  // Fallback: derive alpha from luminance of a black-background tile.
  const { data, info } = await sharp(logoTileOnBlack)
    .resize({ width: 920, fit: 'inside' })
    .removeAlpha()
    .greyscale()
    .threshold(150)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < info.width * info.height; i += 1) {
    alpha[i] = data[i * info.channels];
  }
  return { alpha, width: info.width, height: info.height };
};

const colorizeFromAlpha = async ({ alpha, width, height }, hex, opacity = 1) => {
  const { r, g, b } = hexToRgb(hex);
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const a = Math.round(alpha[i] * opacity);
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = a;
  }
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
};

const makeVariant = async (variantId, title, subtitle, renderFn) => {
  const alpha = await extractAlphaFromTile();
  const base = await renderFn(alpha);
  const frame = await sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
    .composite([
      { input: makeTitleBarSvg(title, subtitle), left: 0, top: 0, blend: 'over' },
      ...base,
    ])
    .png()
    .toBuffer();
  const path = join(outDir, `${variantId}.png`);
  await sharp(frame).png().toFile(path);
  return path;
};

const logoPlacement = (width, height) => ({
  left: Math.round((W - width) / 2),
  top: 690,
});

const main = async () => {
  if (!existsSync(logoTileOnChecker) || !existsSync(logoTileOnBlack)) {
    throw new Error('Missing Daumenkino tiles. Expected scratch/daumenkino-contact/tile_001.jpg and tile_002.jpg');
  }
  await mkdir(outDir, { recursive: true });

  const variants = [];

  variants.push(await makeVariant(
    '01-clean-white',
    'IDEA PACK',
    'Clean white fill + subtle cyan rim',
    async (alpha) => {
      const fill = await colorizeFromAlpha(alpha, palette.text, 1);
      const rim = await colorizeFromAlpha(alpha, palette.cyan, 0.65);
      const rimBlur = await sharp(rim).blur(7).png().toBuffer();
      const meta = await sharp(fill).metadata();
      const pos = logoPlacement(meta.width, meta.height);
      return [
        { input: rimBlur, left: pos.left - 8, top: pos.top + 10, blend: 'screen' },
        { input: fill, left: pos.left, top: pos.top, blend: 'over' },
      ];
    },
  ));

  variants.push(await makeVariant(
    '02-neon-outline',
    'IDEA PACK',
    'Neon outline only (cyan/pink) + hollow center',
    async (alpha) => {
      const fill = await colorizeFromAlpha(alpha, palette.text, 0.0);
      const stroke = await colorizeFromAlpha(alpha, palette.cyan, 1);
      const stroke2 = await colorizeFromAlpha(alpha, palette.pink, 1);
      const outline = await sharp(stroke).convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] }).png().toBuffer();
      const outlinePink = await sharp(stroke2).convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] }).png().toBuffer();
      const meta = await sharp(outline).metadata();
      const pos = logoPlacement(meta.width, meta.height);
      const glowC = await sharp(outline).blur(10).png().toBuffer();
      const glowP = await sharp(outlinePink).blur(10).png().toBuffer();
      return [
        { input: glowC, left: pos.left - 10, top: pos.top + 10, blend: 'screen' },
        { input: glowP, left: pos.left + 8, top: pos.top - 6, blend: 'screen' },
        { input: outline, left: pos.left, top: pos.top, blend: 'screen' },
        { input: outlinePink, left: pos.left, top: pos.top, blend: 'screen' },
        { input: fill, left: pos.left, top: pos.top, blend: 'over' },
      ];
    },
  ));

  variants.push(await makeVariant(
    '03-sticker-slap',
    'IDEA PACK',
    'Sticker slap (offset shadow + paper lift)',
    async (alpha) => {
      const fill = await colorizeFromAlpha(alpha, palette.text, 1);
      const meta = await sharp(fill).metadata();
      const pos = logoPlacement(meta.width, meta.height);
      const shadow = await sharp(fill).modulate({ brightness: 0 }).blur(12).png().toBuffer();
      const paper = await sharp({
        create: { width: meta.width + 50, height: meta.height + 46, channels: 4, background: '#e9eef5' },
      })
        .composite([{ input: shadow, left: 26, top: 30, blend: 'multiply' }])
        .png()
        .toBuffer();
      return [
        { input: paper, left: pos.left - 25, top: pos.top - 23, blend: 'over' },
        { input: fill, left: pos.left, top: pos.top, blend: 'over' },
      ];
    },
  ));

  variants.push(await makeVariant(
    '04-chalk-scratch',
    'IDEA PACK',
    'Chalk scratch (rough edges + sketch noise)',
    async (alpha) => {
      const fill = await colorizeFromAlpha(alpha, palette.text, 1);
      const meta = await sharp(fill).metadata();
      const pos = logoPlacement(meta.width, meta.height);
      const grit = await sharp(logoTileOnChecker)
        .resize(meta.width, meta.height, { fit: 'cover' })
        .greyscale()
        .modulate({ brightness: 0.7, contrast: 1.9 })
        .ensureAlpha(0.55)
        .png()
        .toBuffer();
      const rough = await sharp(fill)
        .modulate({ brightness: 1.05 })
        .blur(0.3)
        .sharpen()
        .png()
        .toBuffer();
      return [
        { input: rough, left: pos.left, top: pos.top, blend: 'over' },
        { input: grit, left: pos.left, top: pos.top, blend: 'multiply' },
      ];
    },
  ));

  variants.push(await makeVariant(
    '05-glitch-rgb',
    'IDEA PACK',
    'RGB glitch split (micro offsets + scan hit)',
    async (alpha) => {
      const r = await colorizeFromAlpha(alpha, '#ff2bd6', 1);
      const g = await colorizeFromAlpha(alpha, '#6bff6b', 1);
      const b = await colorizeFromAlpha(alpha, '#37f5ff', 1);
      const w = await colorizeFromAlpha(alpha, palette.text, 1);
      const meta = await sharp(w).metadata();
      const pos = logoPlacement(meta.width, meta.height);
      const scan = await sharp({ create: { width: W, height: 12, channels: 4, background: palette.cyan } })
        .ensureAlpha(0.42)
        .png()
        .toBuffer();
      return [
        { input: scan, left: 0, top: 980, blend: 'screen' },
        { input: r, left: pos.left - 8, top: pos.top + 3, blend: 'screen' },
        { input: g, left: pos.left + 10, top: pos.top - 2, blend: 'screen' },
        { input: b, left: pos.left + 2, top: pos.top + 8, blend: 'screen' },
        { input: w, left: pos.left, top: pos.top, blend: 'over' },
      ];
    },
  ));

  variants.push(await makeVariant(
    '06-spray-mist',
    'IDEA PACK',
    'Spray mist edge (blur+threshold splatter)',
    async (alpha) => {
      const fill = await colorizeFromAlpha(alpha, palette.text, 1);
      const mist = await sharp(fill)
        .blur(2.6)
        .threshold(120)
        .ensureAlpha(0.68)
        .png()
        .toBuffer();
      const mistGlow = await sharp(mist).blur(9).png().toBuffer();
      const meta = await sharp(fill).metadata();
      const pos = logoPlacement(meta.width, meta.height);
      return [
        { input: mistGlow, left: pos.left - 10, top: pos.top + 12, blend: 'screen' },
        { input: mist, left: pos.left, top: pos.top, blend: 'screen' },
        { input: fill, left: pos.left, top: pos.top, blend: 'over' },
      ];
    },
  ));

  // Contact sheet (2 columns x 3 rows)
  const thumbs = await Promise.all(variants.map(async (filePath) => (
    sharp(filePath).resize(540, 960, { fit: 'cover' }).png().toBuffer()
  )));
  const sheet = sharp({ create: { width: 1080, height: 1920, channels: 4, background: palette.bg } });
  const composite = thumbs.map((buf, index) => ({
    input: buf,
    left: (index % 2) * 540,
    top: Math.floor(index / 2) * 640,
  }));
  const sheetPath = join(outDir, 'contact-sheet.png');
  await sheet.composite(composite).png().toFile(sheetPath);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sources: {
      tile_001: logoTileOnChecker,
      tile_002: logoTileOnBlack,
      photoshopCutoutPreferred: photoshopCutout,
      photoshopJsx: join(root, 'scripts', 'photoshop-export-daumenkino-logo-cutout.jsx'),
    },
    outputs: {
      directory: outDir,
      contactSheet: sheetPath,
      variants,
    },
    note: existsSync(photoshopCutout)
      ? 'Using Photoshop cutout PNG as alpha source.'
      : 'Fallback alpha derived from tile_002 threshold. For best results run scripts/photoshop-export-daumenkino-logo-cutout.jsx in Photoshop to create a clean cutout.',
  };
  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${sheetPath}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

