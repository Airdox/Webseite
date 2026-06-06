#!/usr/bin/env node
/**
 * Five draft reels (5s) using Daumenkino reference assets + audio-driven rules
 * (envelope smoothing, chaos->lock, audio-spine).
 *
 * Output:
 *   docs/agent-system/visual-templates/social/social-auto-output/daumenkino-preview/sissygut-five-drafts-2026-05-24/
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'docs', 'agent-system', 'social-auto-output', 'daumenkino-preview', 'sissygut-five-drafts-2026-05-24');
const sourceDir = join(root, 'scratch', 'daumenkino-contact');

const audioPath = join(root, 'audio_processing', 'recording_2026_05_02_sissygut_alles_gut.mp3');
const wildLogoJpg = join(sourceDir, 'tile_002.jpg');
const photoshopLogoPng = join(outDir, 'airdox-wildstyle-cutout.png'); // optional: user can PS-export here
const scratchBgPath = join(sourceDir, 'tile_000.jpg');
const portraitPath = join(sourceDir, 'tile_010.jpg');

const W = 1080;
const H = 1920;
const FPS = 30;
const DURATION = 5;
const FRAME_COUNT = FPS * DURATION;
const START_SECONDS = 230; // 03:50

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
  white: '#ffffff',
};

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const clampInt = (v, min, max) => Math.max(min, Math.min(max, v));
const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
const easeInOut = (t) => (clamp(t) < 0.5 ? 4 * clamp(t) ** 3 : 1 - ((-2 * clamp(t) + 2) ** 3) / 2);

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) throw new Error(`${cmd} failed with exit code ${result.status}`);
};

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
  if (result.status !== 0) throw new Error(`ffmpeg audio extract failed with exit code ${result.status}`);

  const bytes = result.stdout ?? Buffer.alloc(0);
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const samples = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
  const samplesPerFrame = Math.max(1, Math.floor(sampleRate / FPS));
  const env = new Float32Array(FRAME_COUNT);

  let max = 1e-9;
  for (let f = 0; f < FRAME_COUNT; f += 1) {
    const start = f * samplesPerFrame;
    const end = Math.min(sampleCount, (f + 1) * samplesPerFrame);
    if (start >= end) break;
    let sumSq = 0;
    for (let i = start; i < end; i += 1) {
      const v = samples[i] / 32768;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    env[f] = rms;
    if (rms > max) max = rms;
  }

  // Normalize + compress
  for (let i = 0; i < env.length; i += 1) env[i] = Math.pow(clamp(env[i] / max), 0.55);

  // Asymmetric smoothing (fast attack, slower decay)
  let s = 0;
  for (let i = 0; i < env.length; i += 1) {
    const target = env[i];
    const a = target > s ? 0.35 : 0.10;
    s = (1 - a) * s + a * target;
    env[i] = s;
  }

  return env;
};

const pickPeaks = (env, count = 4) => {
  // Pick top peaks with spacing, good enough for draft cuts.
  const candidates = [];
  for (let i = 2; i < env.length - 2; i += 1) {
    if (env[i] > env[i - 1] && env[i] >= env[i + 1]) {
      candidates.push({ i, v: env[i] });
    }
  }
  candidates.sort((a, b) => b.v - a.v);
  const picks = [];
  const minGap = Math.floor(FPS * 0.45);
  for (const c of candidates) {
    if (picks.length >= count) break;
    if (picks.every((p) => Math.abs(p - c.i) >= minGap)) picks.push(c.i);
  }
  picks.sort((a, b) => a - b);
  return picks;
};

const escapeXml = (v) => String(v)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const renderAudioSpine = (env, frameIndex, second, accent) => {
  const x = 300;
  const y = 1766;
  const w = 480;
  const barCount = 24;
  const gap = 6;
  const barW = Math.floor((w - gap * (barCount - 1)) / barCount);
  const maxH = 34;
  const base = 6;
  const get = (idx) => env[clampInt(idx, 0, env.length - 1)];

  const bars = Array.from({ length: barCount }, (_, i) => {
    const idx = frameIndex - (barCount - 1 - i) * 2;
    const v = get(idx);
    const h = Math.round(base + v * maxH);
    const bx = x + i * (barW + gap);
    const by = y - h;
    const alpha = 0.22 + v * 0.78;
    const fill = i >= barCount - 6 ? accent : second;
    return `<rect x="${bx}" y="${by}" width="${barW}" height="${h}" rx="2" ry="2" fill="${fill}" opacity="${alpha.toFixed(3)}"/>`;
  }).join('\n');

  return `
    <rect x="${x}" y="${y - (maxH + base)}" width="${w}" height="${maxH + base}" fill="${palette.border}" opacity="0.26"/>
    ${bars}
  `;
};

const renderCopy = (variant, frameIndex, title, env) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const pulse = 0.5 + Math.sin(t * Math.PI * 10) * 0.5;
  const accent = variant === 'moodloop' ? palette.cyan : variant === 'spray' ? palette.lime : palette.cyan;
  const second = variant === 'sticker' ? palette.pink : palette.pink;
  return `
    <rect x="72" y="88" width="298" height="50" fill="${accent}"/>
    <text x="221" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="${palette.bg}">NEW SET ONLINE</text>
    <text x="540" y="220" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="68" font-weight="900" fill="${palette.text}">SISSYGUT</text>
    <text x="540" y="286" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="49" font-weight="900" fill="${second}">ALLES GUT</text>
    <text x="540" y="1506" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="${palette.text}">Hmm diesmal etwas schneller, aber trotzdem geil...</text>
    <text x="540" y="1604" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="49" font-weight="900" fill="${palette.text}">FULL SET ON</text>
    <text x="540" y="1664" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="58" font-weight="900" fill="${accent}">AIRDOX.INFO</text>
    <text x="540" y="1730" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${palette.muted}">03:50 - 04:50 / ${escapeXml(title)}</text>
    ${renderAudioSpine(env, frameIndex, second, accent)}
    <circle cx="780" cy="1766" r="${7 + Math.round(pulse * 3)}" fill="${accent}" opacity="0.85"/>
  `;
};

const baseSvg = (body, frameIndex, title, variant, env) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const scanY = Math.round(360 + ((t * 1100) % 1100));
  const accent = variant === 'spray' ? palette.lime : palette.cyan;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg}"/>
        <stop offset="52%" stop-color="${palette.surface}"/>
        <stop offset="100%" stop-color="${palette.bg}"/>
      </linearGradient>
      <pattern id="scan" width="1" height="8" patternUnits="userSpaceOnUse">
        <rect width="1" height="1" fill="${palette.text}" opacity="0.06"/>
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
    <rect x="66" y="64" width="948" height="1768" fill="${palette.bg}" opacity="0.34"/>
    <rect x="92" y="186" width="896" height="1484" fill="${palette.bg}" opacity="0.22"/>
    <rect x="104" y="402" width="872" height="1034" fill="${palette.bg}" opacity="0.18"/>
    <rect x="0" y="${scanY}" width="${W}" height="110" fill="url(#scan)" opacity="0.34"/>
    ${body}
    ${renderCopy(variant, frameIndex, title, env)}
  </svg>`);
};

const prepareTexture = async (inputPath, width, height, opacity = 0.3) => {
  const raw = await sharp(inputPath)
    .resize({ width, height, fit: 'cover' })
    .greyscale()
    .modulate({ brightness: 0.5, contrast: 1.6 })
    .ensureAlpha(opacity)
    .png()
    .toBuffer();
  return raw;
};

const getWildLogo = async () => {
  if (existsSync(photoshopLogoPng)) return sharp(photoshopLogoPng).png().toBuffer();
  // fallback: basic keying from jpg (draft-quality)
  const buf = await sharp(wildLogoJpg).png().toBuffer();
  // cheap alpha: treat near-black as transparent
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
    const a = clamp((luma - 0.08) / 0.35);
    data[i + 3] = Math.round(a * 255);
  }
  return sharp(data, { raw: info }).png().toBuffer();
};

const makeSticker = async (logoPng, padding = 30) => {
  const meta = await sharp(logoPng).metadata();
  const w = (meta.width ?? 800) + padding * 2;
  const h = (meta.height ?? 400) + padding * 2;
  const bg = await sharp({ create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .png()
    .toBuffer();
  const sticker = await sharp(bg)
    .composite([{ input: logoPng, left: padding, top: padding, blend: 'over' }])
    .png()
    .toBuffer();
  return sticker;
};

const fitToCanvas = async (input) => {
  const meta = await sharp(input).metadata();
  const iw = meta.width ?? W;
  const ih = meta.height ?? H;
  if (iw <= W && ih <= H) return input;
  return sharp(input)
    .resize({ width: W, height: H, fit: 'inside' })
    .png()
    .toBuffer();
};

const renderVariantFrame = async ({ id, title, frameIndex, env, peaks }) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const e = env[frameIndex] ?? 0;
  const bg = await prepareTexture(scratchBgPath, W, H, 0.2);
  const portrait = await sharp(portraitPath)
    .resize({ width: 610, height: 720, fit: 'cover', position: 'north' })
    .greyscale()
    .modulate({ brightness: 0.6, contrast: 1.6 })
    .ensureAlpha(0.26)
    .png()
    .toBuffer();
  const logo = await getWildLogo();
  const logoMeta = await sharp(logo).metadata();
  const baseScale = 0.86;
  const centerLeft = Math.round((W - (logoMeta.width ?? 800) * baseScale) / 2);
  const centerTop = 680;

  if (id === 'bass-pulse') {
    const s = baseScale * (0.92 + e * 0.18);
    const w = Math.round((logoMeta.width ?? 800) * s);
    const h = Math.round((logoMeta.height ?? 400) * s);
    const x = Math.round((W - w) / 2);
    const y = Math.round(centerTop + (1 - e) * 18);
    const echo = await sharp(logo).resize(w, h).modulate({ brightness: 1.15 }).blur(9).png().toBuffer();
    const body = baseSvg(`
      <circle cx="540" cy="860" r="${270 + Math.round(e * 60)}" fill="${palette.cyan}" opacity="${(0.06 + e * 0.10).toFixed(3)}" filter="url(#softGlow)"/>
      <circle cx="540" cy="860" r="${210 + Math.round(e * 44)}" fill="${palette.pink}" opacity="${(0.04 + e * 0.08).toFixed(3)}" filter="url(#softGlow)"/>
    `, frameIndex, title, 'bass', env);
    return sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
      .composite([
        { input: bg, left: 0, top: 0, blend: 'screen' },
        { input: portrait, left: 235, top: 420, blend: 'screen' },
        { input: body, left: 0, top: 0, blend: 'over' },
        { input: echo, left: x - 10, top: y + 12, blend: 'screen' },
        { input: await sharp(logo).resize(w, h).png().toBuffer(), left: x, top: y, blend: 'over' },
      ])
      .png();
  }

  if (id === 'spray-reveal') {
    const reveal = easeOut((t - 0.10) / 0.42);
    const lock = easeOut((t - 0.56) / 0.22);
    const s = baseScale * (0.92 + lock * 0.08);
    const w = Math.round((logoMeta.width ?? 800) * s);
    const h = Math.round((logoMeta.height ?? 400) * s);
    const x = Math.round((W - w) / 2);
    const y = Math.round(centerTop - 10);

    const noisy = await sharp(logo)
      .resize(w, h)
      .linear(1.08 + e * 0.6, -12)
      .blur(2.5 - reveal * 1.8)
      .threshold(Math.round(60 + (1 - reveal) * 150))
      .png()
      .toBuffer();
    const halo = await sharp(noisy).blur(10).modulate({ brightness: 1.4 }).png().toBuffer();
    const body = baseSvg(`
      <rect x="120" y="380" width="840" height="1100" fill="${palette.lime}" opacity="${(0.02 + e * 0.05).toFixed(3)}" filter="url(#softGlow)"/>
    `, frameIndex, title, 'spray', env);
    return sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
      .composite([
        { input: bg, left: 0, top: 0, blend: 'screen' },
        { input: body, left: 0, top: 0, blend: 'over' },
        { input: halo, left: x, top: y, blend: 'screen', opacity: 0.65 },
        { input: noisy, left: x, top: y, blend: 'over', opacity: 0.92 },
      ])
      .png();
  }

  if (id === 'sticker-slap') {
    const slap = easeOut((t - 0.10) / 0.22);
    const settle = easeOut((t - 0.32) / 0.28);
    const s = baseScale * (0.75 + slap * 0.25);
    const w = Math.round((logoMeta.width ?? 800) * s);
    const h = Math.round((logoMeta.height ?? 400) * s);
    const x = Math.round((W - w) / 2);
    const y = Math.round(centerTop + (1 - slap) * -320 + (1 - settle) * 40);
    const rot = (1 - settle) * -18;

    const sticker = await makeSticker(logo, 34);
    const stickerResized = await sharp(sticker).resize(w + 80, h + 80).png().toBuffer();
    const shadow = await sharp(stickerResized).blur(14).tint(palette.black).ensureAlpha(0.55).png().toBuffer();
    const body = baseSvg(`
      <circle cx="540" cy="850" r="${250 + Math.round(e * 40)}" fill="${palette.pink}" opacity="0.08" filter="url(#softGlow)"/>
    `, frameIndex, title, 'sticker', env);
    // rotate by rendering to a temp png (sharp rotate expands bbox; use background transparent)
    const rotated = await sharp(stickerResized)
      .rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const rotatedShadow = await sharp(shadow)
      .rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const rotatedFit = await fitToCanvas(rotated);
    const rotatedShadowFit = await fitToCanvas(rotatedShadow);
    return sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
      .composite([
        { input: bg, left: 0, top: 0, blend: 'screen' },
        { input: body, left: 0, top: 0, blend: 'over' },
        { input: rotatedShadowFit, left: x + 16, top: y + 22, blend: 'over', opacity: 0.7 },
        { input: rotatedFit, left: x, top: y, blend: 'over' },
      ])
      .png();
  }

  if (id === 'mood-loop') {
    // simple loop-ish vibe: color wash + subtle jitter, then lock
    const lock = easeOut((t - 0.52) / 0.26);
    const hueShift = Math.round(18 + e * 120);
    const wash = await sharp({ create: { width: W, height: H, channels: 4, background: palette.cyan } })
      .blur(120)
      .ensureAlpha(0.05 + e * 0.08)
      .modulate({ hue: hueShift })
      .png()
      .toBuffer();
    const s = baseScale * (0.88 + lock * 0.12);
    const w = Math.round((logoMeta.width ?? 800) * s);
    const h = Math.round((logoMeta.height ?? 400) * s);
    const x = Math.round((W - w) / 2) + Math.round(Math.sin(t * Math.PI * 2) * (10 - lock * 10));
    const y = Math.round(centerTop - 6) + Math.round(Math.cos(t * Math.PI * 2) * (8 - lock * 8));
    const logoResized = await sharp(logo).resize(w, h).png().toBuffer();
    const body = baseSvg(`
      <circle cx="540" cy="860" r="${310 + Math.round(e * 44)}" fill="${palette.cyan}" opacity="0.05" filter="url(#softGlow)"/>
      <circle cx="540" cy="860" r="${230 + Math.round(e * 36)}" fill="${palette.lime}" opacity="0.04" filter="url(#softGlow)"/>
    `, frameIndex, title, 'moodloop', env);
    return sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
      .composite([
        { input: bg, left: 0, top: 0, blend: 'screen' },
        { input: wash, left: 0, top: 0, blend: 'screen' },
        { input: portrait, left: 235, top: 420, blend: 'screen' },
        { input: body, left: 0, top: 0, blend: 'over' },
        { input: logoResized, left: x, top: y, blend: 'over', opacity: 0.98 },
      ])
      .png();
  }

  // beat-cuts (3 looks switching on picked peaks; always ends locked)
  const cuts = [0, ...(peaks ?? []), FRAME_COUNT - 1].filter((v, idx, arr) => idx === 0 || v - arr[idx - 1] >= Math.floor(FPS * 0.6));
  const cutIndex = cuts.findIndex((c, idx) => frameIndex >= c && frameIndex < (cuts[idx + 1] ?? FRAME_COUNT));
  const phase = Math.max(0, cutIndex);
  const lock = easeOut((t - 0.62) / 0.22);
  const s = baseScale * (0.86 + lock * 0.14);
  const w = Math.round((logoMeta.width ?? 800) * s);
  const h = Math.round((logoMeta.height ?? 400) * s);
  const x = Math.round((W - w) / 2);
  const y = Math.round(centerTop - 8);

  const logoBase = await sharp(logo).resize(w, h).png().toBuffer();
  const glitch = await sharp(logoBase).affine([[1, 0.02], [0.01, 1]], { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const halo = await sharp(logoBase).blur(10).modulate({ brightness: 1.3 }).png().toBuffer();
  const strobe = phase % 2 === 0 ? (e > 0.6 ? 0.12 : 0.06) : (e > 0.6 ? 0.18 : 0.08);
  const flash = await sharp({ create: { width: W, height: H, channels: 4, background: palette.white } }).ensureAlpha(strobe).png().toBuffer();
  const body = baseSvg(`
    <rect x="108" y="420" width="864" height="980" fill="${phase % 2 === 0 ? palette.cyan : palette.pink}" opacity="${(0.02 + e * 0.06).toFixed(3)}" filter="url(#softGlow)"/>
  `, frameIndex, title, 'bass', env);
  return sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
    .composite([
      { input: bg, left: 0, top: 0, blend: 'screen' },
      { input: body, left: 0, top: 0, blend: 'over' },
      { input: halo, left: x - 8, top: y + 10, blend: 'screen', opacity: 0.7 },
      { input: phase === 0 ? glitch : logoBase, left: x + (phase === 0 ? 6 : 0), top: y, blend: 'over' },
      { input: flash, left: 0, top: 0, blend: 'screen', opacity: phase === 0 ? 0.45 : 0.22 },
    ])
    .png();
};

const renderVariant = async ({ id, title, env, peaks }) => {
  const framesDir = join(outDir, `${id}-frames`);
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const framePath = join(framesDir, `frame-${String(i).padStart(4, '0')}.png`);
    const png = await renderVariantFrame({ id, title, frameIndex: i, env, peaks });
    await png.toFile(framePath);
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
  const env = computeAudioEnvelope();
  const peaks = pickPeaks(env, 4);

  const variants = [
    { id: 'bass-pulse', title: 'The Bass Pulse (Logo Pulse + Lock)' },
    { id: 'spray-reveal', title: 'Spray Reveal (Chaos -> Lock)' },
    { id: 'sticker-slap', title: 'Sticker Slap (Impact + Settle)' },
    { id: 'mood-loop', title: 'Organic Mood Loop (Loop Vibe + Anchor)' },
    { id: 'beat-cuts', title: 'Beat Cuts (Peaks -> Scenes -> Lock)' },
  ];

  const results = [];
  for (const v of variants) {
    results.push(await renderVariant({ ...v, env, peaks }));
  }

  const sheetInputs = await Promise.all(results.map(async (result, index) => ({
    input: await sharp(result.contactPath).resize(1080, 384).png().toBuffer(),
    left: 0,
    top: index * 384,
  })));
  const sheetPath = join(outDir, 'contact-sheet.png');
  await sharp({ create: { width: 1080, height: 384 * results.length, channels: 4, background: palette.bg } })
    .composite(sheetInputs)
    .png()
    .toFile(sheetPath);

  const manifest = {
    generatedAt: new Date().toISOString(),
    campaign: 'SISSYGUT ALLES GUT',
    hook: '03:50-03:55 (5s draft)',
    sourceAudio: audioPath,
    startSeconds: START_SECONDS,
    duration: DURATION,
    fps: FPS,
    peaks,
    note: 'Drafts: Daumenkino assets + audio envelope (attack/decay) + audio spine; live upload remains blocked.',
    outputs: results.map((r) => ({
      id: r.id,
      title: r.title,
      mp4: r.mp4Path.replaceAll('\\', '/'),
      preview: r.previewPath.replaceAll('\\', '/'),
      contact: r.contactPath.replaceAll('\\', '/'),
    })),
    contactSheet: sheetPath.replaceAll('\\', '/'),
    photoshopLogoPreferredPath: photoshopLogoPng.replaceAll('\\', '/'),
  };
  await import('node:fs/promises').then(({ writeFile }) => writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`));
  console.log(JSON.stringify(manifest, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
