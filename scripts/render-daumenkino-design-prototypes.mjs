#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'docs', 'agent-system', 'social-auto-output', 'daumenkino-preview', 'sissygut-design-prototypes');
const sourceDir = join(root, 'scratch', 'daumenkino-contact');
const audioPath = join(root, 'audio_processing', 'recording_2026_05_02_sissygut_alles_gut.mp3');
const wildLogoPath = join(sourceDir, 'tile_002.jpg');
const photoshopWildLogoPath = join(outDir, 'airdox-wildstyle-cutout.png');
const scratchBgPath = join(sourceDir, 'tile_000.jpg');
const portraitPath = join(sourceDir, 'tile_010.jpg');

const W = 1080;
const H = 1920;
const FPS = 30;
const DURATION = 5;
const FRAME_COUNT = FPS * DURATION;
const START_SECONDS = 230;

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

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
const easeInOut = (t) => (clamp(t) < 0.5 ? 4 * clamp(t) ** 3 : 1 - ((-2 * clamp(t) + 2) ** 3) / 2);
let wildLogoAlphaCache = null;
let audioEnvelope = null;

const clampInt = (value, min, max) => Math.max(min, Math.min(max, value));

const computeAudioEnvelope = () => {
  const sampleRate = 48000;
  const result = spawnSync('ffmpeg', [
    '-v', 'error',
    '-ss', String(START_SECONDS),
    '-t', String(DURATION),
    '-i', audioPath,
    '-ac', '1',
    '-ar', String(sampleRate),
    '-f', 's16le',
    'pipe:1',
  ], {
    cwd: root,
    shell: false,
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 1024 * 1024 * 16,
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg audio extract failed with exit code ${result.status}`);
  }
  const bytes = result.stdout ?? Buffer.alloc(0);
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const samples = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
  const samplesPerFrame = Math.max(1, Math.floor(sampleRate / FPS));
  const envelope = new Float32Array(FRAME_COUNT);

  let max = 1e-9;
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const start = frame * samplesPerFrame;
    const end = Math.min(sampleCount, (frame + 1) * samplesPerFrame);
    if (start >= end) break;
    let sumSq = 0;
    for (let i = start; i < end; i += 1) {
      const v = samples[i] / 32768;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    envelope[frame] = rms;
    if (rms > max) max = rms;
  }

  // Normalize + compress dynamics a bit so it reads well as UI.
  for (let i = 0; i < envelope.length; i += 1) {
    envelope[i] = Math.pow(clamp(envelope[i] / max), 0.55);
  }

  // Smooth (simple one-pole low-pass).
  let s = 0;
  for (let i = 0; i < envelope.length; i += 1) {
    s = 0.82 * s + 0.18 * envelope[i];
    envelope[i] = s;
  }

  return envelope;
};

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} failed with exit code ${result.status}`);
  }
};

const renderAudioSpine = (frameIndex, second, accent) => {
  // 24-bar meter with short history trail (left = older, right = current).
  const x = 300;
  const y = 1766;
  const w = 480;
  const barCount = 24;
  const gap = 6;
  const barW = Math.floor((w - gap * (barCount - 1)) / barCount);
  const maxH = 34;
  const base = 6;

  const get = (idx) => {
    if (!audioEnvelope) return 0.18;
    return audioEnvelope[clampInt(idx, 0, audioEnvelope.length - 1)];
  };

  const bars = Array.from({ length: barCount }, (_, i) => {
    const idx = frameIndex - (barCount - 1 - i) * 2;
    const v = get(idx);
    const h = Math.round(base + v * maxH);
    const bx = x + i * (barW + gap);
    const by = y - h;
    const alpha = 0.24 + v * 0.76;
    const fill = i >= barCount - 6 ? accent : second;
    return `<rect x="${bx}" y="${by}" width="${barW}" height="${h}" rx="2" ry="2" fill="${fill}" opacity="${alpha.toFixed(3)}"/>`;
  }).join('\n');

  return `
    <rect x="${x}" y="${y - (maxH + base)}" width="${w}" height="${maxH + base}" fill="${palette.border}" opacity="0.28"/>
    ${bars}
  `;
};

const renderFrameText = (variant, frameIndex, title) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const pulse = 0.5 + Math.sin(t * Math.PI * 10) * 0.5;
  const accent = variant === 'wildstyle' ? palette.lime : palette.cyan;
  const second = variant === 'wildstyle' ? palette.cyan : palette.pink;
  return `
    <rect x="72" y="88" width="298" height="50" fill="${accent}"/>
    <text x="221" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${palette.bg}">NEW SET ONLINE</text>
    <text x="540" y="220" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="68" font-weight="900" fill="${palette.text}">SISSYGUT</text>
    <text x="540" y="286" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="49" font-weight="900" fill="${second}">ALLES GUT</text>
    <text x="540" y="1506" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="${palette.text}">Hmm diesmal etwas schneller, aber trotzdem geil...</text>
    <text x="540" y="1604" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="49" font-weight="900" fill="${palette.text}">FULL SET ON</text>
    <text x="540" y="1664" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="58" font-weight="900" fill="${accent}">AIRDOX.INFO</text>
    <text x="540" y="1730" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${palette.muted}">03:50 - 04:50 / ${escapeXml(title)}</text>
    ${renderAudioSpine(frameIndex, second, accent)}
    <circle cx="780" cy="1766" r="${7 + Math.round(pulse * 3)}" fill="${accent}" opacity="0.85"/>
  `;
};

const letterBlocks = [
  // A
  { x: 86, y: 0, w: 36, h: 252, r: -16 },
  { x: 198, y: 0, w: 36, h: 252, r: 15 },
  { x: 120, y: 126, w: 96, h: 34, r: -3 },
  { x: 116, y: 16, w: 90, h: 36, r: 4 },
  // I
  { x: 276, y: 0, w: 44, h: 252, r: 3 },
  { x: 244, y: 0, w: 106, h: 34, r: -4 },
  { x: 244, y: 218, w: 106, h: 34, r: 4 },
  // R
  { x: 390, y: 0, w: 42, h: 252, r: 0 },
  { x: 420, y: 0, w: 126, h: 38, r: 3 },
  { x: 520, y: 24, w: 38, h: 96, r: -5 },
  { x: 420, y: 108, w: 132, h: 36, r: 0 },
  { x: 492, y: 136, w: 44, h: 126, r: -24 },
  // D
  { x: 612, y: 0, w: 42, h: 252, r: 0 },
  { x: 640, y: 0, w: 118, h: 38, r: 4 },
  { x: 738, y: 30, w: 42, h: 190, r: -5 },
  { x: 640, y: 216, w: 118, h: 36, r: -4 },
  // O
  { x: 835, y: 14, w: 148, h: 224, r: 0, ring: true },
  // X
  { x: 1026, y: -6, w: 52, h: 278, r: -31, isX: true },
  { x: 1026, y: -6, w: 52, h: 278, r: 31, isX: true },
  // extra center hit so the X reads as X even in motion blur
  { x: 1012, y: 122, w: 92, h: 40, r: 0, isX: true },
];

const renderBlockLetters = (frameIndex) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const build = easeOut((t - 0.04) / 0.48);
  const jitter = Math.sin(t * Math.PI * 16) * 3;
  const active = Math.floor(t * 18) % letterBlocks.length;
  const scale = 0.82;
  const left = 61;
  const top = 695;

  const shapes = letterBlocks.map((block, index) => {
    const localBase = easeOut((build * letterBlocks.length - index) / 3);
    const xReveal = block.isX ? easeOut((t - 0.46) / 0.22) : 1;
    const local = clamp(localBase * xReveal);
    const side = index % 2 === 0 ? -1 : 1;
    const flyX = side * (1 - local) * (260 + (index % 5) * 35);
    const flyY = (1 - local) * (-180 + (index % 7) * 62);
    const opacity = clamp(local * 1.25);
    const fill = block.isX ? palette.lime : index === active ? palette.cyan : index % 5 === 0 ? palette.pink : palette.text;
    const stroke = block.isX ? palette.black : index % 4 === 0 ? palette.lime : palette.black;
    const x = left + (block.x * scale) + flyX;
    const y = top + (block.y * scale) + flyY + jitter;
    const w = block.w * scale;
    const h = block.h * scale;
    const rotation = block.r + (1 - local) * side * 38;

    if (block.ring) {
      return `
        <ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="none" stroke="${fill}" stroke-width="34" opacity="${opacity}" transform="rotate(${rotation} ${x + w / 2} ${y + h / 2})"/>
        <ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 3.8}" ry="${h / 3.4}" fill="${palette.bg}" stroke="${stroke}" stroke-width="8" opacity="${opacity}" transform="rotate(${rotation} ${x + w / 2} ${y + h / 2})"/>
      `;
    }

    return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="7" opacity="${opacity}" transform="rotate(${rotation} ${x + w / 2} ${y + h / 2})"/>
      <line x1="${x + 7}" y1="${y + h * 0.24}" x2="${x + w - 5}" y2="${y + h * 0.1}" stroke="${palette.black}" stroke-width="4" opacity="${opacity * 0.7}" transform="rotate(${rotation} ${x + w / 2} ${y + h / 2})"/>
    `;
  }).join('\n');

  const shards = Array.from({ length: 26 }, (_, index) => {
    const local = easeInOut((t - 0.08 - index * 0.004) / 0.5);
    const x = 90 + ((index * 83) % 900);
    const y = 505 + ((index * 59) % 680);
    const dx = Math.sin(index * 1.7) * (1 - local) * 380;
    const dy = Math.cos(index * 1.2) * (1 - local) * 300;
    const color = index % 3 === 0 ? palette.cyan : index % 3 === 1 ? palette.pink : palette.lime;
    return `<rect x="${x + dx}" y="${y + dy}" width="${54 + (index % 4) * 22}" height="16" fill="${color}" opacity="${0.18 + local * 0.55}" transform="rotate(${-24 + ((index * 11 + frameIndex) % 48)} ${x + dx} ${y + dy})"/>`;
  }).join('\n');

  return `${shards}<g filter="url(#roughShadow)">${shapes}</g>`;
};

const baseSvg = (body, frameIndex, variant, title) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const scanY = Math.round(360 + ((t * 1100) % 1100));
  const accent = variant === 'wildstyle' ? palette.lime : palette.cyan;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg}"/>
        <stop offset="52%" stop-color="${palette.surface}"/>
        <stop offset="100%" stop-color="${palette.bg}"/>
      </linearGradient>
      <pattern id="scan" width="1" height="8" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="${palette.text}" opacity="0.07"/>
      </pattern>
      <filter id="roughShadow">
        <feDropShadow dx="9" dy="14" stdDeviation="0" flood-color="${palette.black}" flood-opacity="0.88"/>
        <feDropShadow dx="-5" dy="-3" stdDeviation="0" flood-color="${accent}" flood-opacity="0.42"/>
      </filter>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="10" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect width="100%" height="100%" fill="url(#scan)"/>
    <path d="M70 74 H1010 M70 1848 H1010 M70 74 V262 M1010 74 V262 M70 1640 V1848 M1010 1640 V1848" fill="none" stroke="${palette.border}" stroke-width="2"/>
    <rect x="0" y="${scanY}" width="1080" height="7" fill="${accent}" opacity="0.38"/>
    <rect x="0" y="${scanY + 16}" width="1080" height="2" fill="${palette.pink}" opacity="0.35"/>
    ${body}
    ${renderFrameText(variant, frameIndex, title)}
  </svg>`);
};

const makeWildLogo = async (frameIndex) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const reveal = easeOut((t - 0.08) / 0.36);
  if (!wildLogoAlphaCache) {
    const logoSource = existsSync(photoshopWildLogoPath) ? photoshopWildLogoPath : wildLogoPath;
    const sourcePipeline = sharp(logoSource).resize({ width: 950, fit: 'inside' });
    const { data, info } = existsSync(photoshopWildLogoPath)
      ? await sourcePipeline.clone().ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true })
      : await sourcePipeline.clone().removeAlpha().greyscale().threshold(150).raw().toBuffer({ resolveWithObject: true });
    const alpha = Buffer.alloc(info.width * info.height);
    for (let i = 0; i < info.width * info.height; i += 1) {
      alpha[i] = data[i * info.channels];
    }
    wildLogoAlphaCache = { alpha, width: info.width, height: info.height };
  }
  const color = frameIndex % 12 < 4 ? palette.text : frameIndex % 12 < 8 ? palette.cyan : palette.lime;
  const rgb = {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
  const rgba = Buffer.alloc(wildLogoAlphaCache.width * wildLogoAlphaCache.height * 4);
  for (let i = 0; i < wildLogoAlphaCache.width * wildLogoAlphaCache.height; i += 1) {
    const a = wildLogoAlphaCache.alpha[i] > 20 ? Math.round(wildLogoAlphaCache.alpha[i] * reveal) : 0;
    rgba[i * 4] = rgb.r;
    rgba[i * 4 + 1] = rgb.g;
    rgba[i * 4 + 2] = rgb.b;
    rgba[i * 4 + 3] = a;
  }
  return sharp(rgba, { raw: { width: wildLogoAlphaCache.width, height: wildLogoAlphaCache.height, channels: 4 } }).png().toBuffer();
};

const prepareTexture = async (input, width, height, opacity = 0.22) => {
  const layer = await sharp(input)
    .resize(width, height, { fit: 'cover' })
    .greyscale()
    .modulate({ brightness: 0.86, contrast: 1.35 })
    .ensureAlpha(opacity)
    .png()
    .toBuffer();
  return layer;
};

const renderBlockFrame = async (frameIndex, framePath) => {
  const texture = await prepareTexture(scratchBgPath, W, H, 0.12);
  const body = baseSvg(renderBlockLetters(frameIndex), frameIndex, 'block', 'BLOCK ASSEMBLY TEST');
  await sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
    .composite([
      { input: texture, left: 0, top: 0, blend: 'screen' },
      { input: body, left: 0, top: 0, blend: 'over' },
    ])
    .png()
    .toFile(framePath);
};

const renderWildFrame = async (frameIndex, framePath) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const logo = await makeWildLogo(frameIndex);
  const logoMeta = await sharp(logo).metadata();
  const bg = await prepareTexture(scratchBgPath, W, H, 0.2);
  const portrait = await sharp(portraitPath)
    .resize({ width: 610, height: 720, fit: 'cover', position: 'north' })
    .greyscale()
    .modulate({ brightness: 0.6, contrast: 1.6 })
    .ensureAlpha(0.34)
    .png()
    .toBuffer();
  const jitterX = Math.round(Math.sin(t * Math.PI * 14) * 9);
  const jitterY = Math.round(Math.cos(t * Math.PI * 12) * 5);
  const logoLeft = Math.round((W - logoMeta.width) / 2) + jitterX;
  const logoTop = 670 + jitterY;
  const echo = await sharp(logo)
    .modulate({ brightness: 1.3 })
    .blur(8)
    .png()
    .toBuffer();
  const body = baseSvg(`
    <circle cx="540" cy="865" r="${310 + Math.round(Math.sin(t * Math.PI * 8) * 24)}" fill="${palette.cyan}" opacity="0.08" filter="url(#softGlow)"/>
    <circle cx="540" cy="865" r="${240 + Math.round(Math.cos(t * Math.PI * 6) * 18)}" fill="${palette.pink}" opacity="0.08" filter="url(#softGlow)"/>
  `, frameIndex, 'wildstyle', 'DAUMENKINO WILDSTYLE TEST');

  await sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
    .composite([
      { input: bg, left: 0, top: 0, blend: 'screen' },
      { input: portrait, left: 235, top: 430, blend: 'screen' },
      { input: body, left: 0, top: 0, blend: 'over' },
      { input: echo, left: logoLeft - 8, top: logoTop + 10, blend: 'screen' },
      { input: logo, left: logoLeft, top: logoTop, blend: 'over' },
    ])
    .png()
    .toFile(framePath);
};

const renderVariant = async ({ id, title, renderFrame }) => {
  const framesDir = join(outDir, `${id}-frames`);
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const framePath = join(framesDir, `frame-${String(i).padStart(4, '0')}.png`);
    await renderFrame(i, framePath);
  }

  const mp4Path = join(outDir, `${id}-5s.mp4`);
  const previewPath = join(outDir, `${id}-preview.png`);
  const contactPath = join(outDir, `${id}-contact.png`);
  await sharp(join(framesDir, `frame-${String(Math.floor(FRAME_COUNT * 0.62)).padStart(4, '0')}.png`)).toFile(previewPath);

  const contactFrames = [0, 30, 60, 90, 120].map((index) => join(framesDir, `frame-${String(index).padStart(4, '0')}.png`));
  const thumbs = await Promise.all(contactFrames.map(async (input, index) => ({
    input: await sharp(input).resize(216, 384, { fit: 'cover' }).png().toBuffer(),
    left: index * 216,
    top: 0,
  })));
  await sharp({ create: { width: 1080, height: 384, channels: 4, background: palette.bg } })
    .composite(thumbs)
    .png()
    .toFile(contactPath);

  run('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', join(framesDir, 'frame-%04d.png'),
    '-ss', String(START_SECONDS),
    '-i', audioPath,
    '-filter_complex', `[1:a]atrim=start=0:duration=${DURATION},asetpts=PTS-STARTPTS,afade=t=out:st=${DURATION - 0.35}:d=0.35[a]`,
    '-map', '0:v:0',
    '-map', '[a]',
    '-t', String(DURATION),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-crf', '18',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    mp4Path,
  ]);

  return { id, title, framesDir, mp4Path, previewPath, contactPath };
};

const main = async () => {
  await mkdir(outDir, { recursive: true });
  audioEnvelope = computeAudioEnvelope();
  const results = [];
  results.push(await renderVariant({
    id: 'airdox-block-assembly',
    title: 'AIRDOX Block Assembly',
    renderFrame: renderBlockFrame,
  }));
  results.push(await renderVariant({
    id: 'airdox-daumenkino-wildstyle',
    title: 'AIRDOX Daumenkino Wildstyle',
    renderFrame: renderWildFrame,
  }));

  const sheetInputs = await Promise.all(results.map(async (result, index) => ({
    input: await sharp(result.contactPath).resize(1080, 384).png().toBuffer(),
    left: 0,
    top: index * 384,
  })));
  const sheetPath = join(outDir, 'sissygut-design-prototypes-contact.png');
  await sharp({ create: { width: 1080, height: 768, channels: 4, background: palette.bg } })
    .composite(sheetInputs)
    .png()
    .toFile(sheetPath);

  const manifest = {
    generatedAt: new Date().toISOString(),
    campaign: 'SISSYGUT ALLES GUT',
    sourceAudio: audioPath,
    startSeconds: START_SECONDS,
    duration: DURATION,
    outputs: results.map((result) => ({
      id: result.id,
      title: result.title,
      mp4: result.mp4Path.replaceAll('\\', '/'),
      preview: result.previewPath.replaceAll('\\', '/'),
      contact: result.contactPath.replaceAll('\\', '/'),
    })),
    contactSheet: sheetPath.replaceAll('\\', '/'),
  };
  await sharp(sheetPath).metadata();
  await import('node:fs/promises').then(({ writeFile }) => writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`));
  console.log(JSON.stringify(manifest, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
