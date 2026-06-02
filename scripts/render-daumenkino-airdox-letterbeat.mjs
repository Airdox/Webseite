#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'daumenkino_idee', '1765931533777.jpg');
const audioPath = join(root, 'audio_processing', 'recording_2026_05_02_sissygut_alles_gut.mp3');
const outDir = join(root, 'docs', 'agent-system', 'social-auto-output', 'daumenkino-airdox-letterbeat');
const framesDir = join(outDir, 'frames');
const psDir = join(outDir, 'photoshop');

const W = 1080;
const H = 1920;
const FPS = 24;
const DURATION = 8;
const FRAME_COUNT = FPS * DURATION;
const START_SECONDS = 230;

const letters = [
  { name: 'A', color: '#ff174d', box: [64, 318, 272, 688], beat: 0 },
  { name: 'I', color: '#ffea00', box: [214, 326, 398, 686], beat: 1 },
  { name: 'R', color: '#00e5ff', box: [342, 318, 536, 704], beat: 2 },
  { name: 'D', color: '#7cff00', box: [478, 308, 670, 712], beat: 3 },
  { name: 'O', color: '#ff3df2', box: [612, 316, 812, 688], beat: 4 },
  { name: 'X', color: '#ff8a00', box: [754, 304, 960, 690], beat: 5 },
];

const fit = {
  scale: 1.02,
  left: 18,
  top: 390,
};

const fail = (message) => {
  throw new Error(message);
};

const run = (cmd, args, options = {}) => {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: options.stdio || 'inherit',
    shell: false,
    encoding: options.encoding,
    maxBuffer: options.maxBuffer,
  });
  if (result.status !== 0) fail(`${cmd} failed with exit code ${result.status}`);
  return result;
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const computeEnvelope = () => {
  if (!existsSync(audioPath)) {
    return Float32Array.from({ length: FRAME_COUNT }, (_, i) => 0.45 + Math.sin(i * 0.42) * 0.25);
  }

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
    maxBuffer: 1024 * 1024 * 24,
  });
  if (result.status !== 0 || !result.stdout?.length) {
    return Float32Array.from({ length: FRAME_COUNT }, (_, i) => 0.45 + Math.sin(i * 0.42) * 0.25);
  }

  const bytes = result.stdout;
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const samples = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
  const samplesPerFrame = Math.max(1, Math.floor(sampleRate / FPS));
  const env = new Float32Array(FRAME_COUNT);
  let max = 1e-9;

  for (let f = 0; f < FRAME_COUNT; f += 1) {
    const start = f * samplesPerFrame;
    const end = Math.min(sampleCount, (f + 1) * samplesPerFrame);
    let sumSq = 0;
    for (let i = start; i < end; i += 1) {
      const v = samples[i] / 32768;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / Math.max(1, end - start));
    env[f] = rms;
    max = Math.max(max, rms);
  }

  let smooth = 0;
  for (let i = 0; i < env.length; i += 1) {
    const target = Math.pow(clamp(env[i] / max), 0.5);
    const attack = target > smooth ? 0.42 : 0.13;
    smooth = smooth * (1 - attack) + target * attack;
    env[i] = smooth;
  }

  return env;
};

const makeBase = async (frameIndex, env) => {
  const pulse = env[frameIndex] || 0;
  const zoom = 1 + pulse * 0.012;
  const size = Math.min(W, Math.round(1024 * zoom));
  const left = Math.round((W - size) / 2);
  const top = Math.round(fit.top - pulse * 8);

  return sharp(sourcePath)
    .resize(size, size, { fit: 'cover' })
    .modulate({ saturation: 0, brightness: 0.86 + pulse * 0.05 })
    .linear(1.08, -8)
    .png()
    .toBuffer()
    .then((input) => ({ input, left, top }));
};

const letterSourceBuffer = async (letter) => {
  const psPath = join(psDir, `letter-${letter.name}.png`);
  if (existsSync(psPath)) return sharp(psPath).png().toBuffer();
  const [left, top, right, bottom] = letter.box;
  return sharp(sourcePath)
    .extract({ left, top, width: right - left, height: bottom - top })
    .png()
    .toBuffer();
};

const makeColoredLetter = async (letter, frameIndex, env) => {
  const [left, top, right, bottom] = letter.box;
  const w = right - left;
  const h = bottom - top;
  const rgb = hexToRgb(letter.color);
  const raw = await letterSourceBuffer(letter);

  const alpha = await sharp(raw)
    .resize(Math.round(w * fit.scale), Math.round(h * fit.scale), { fit: 'fill' })
    .greyscale()
    .linear(2.4, -90)
    .blur(0.35)
    .png()
    .toBuffer();

  const beatFrame = (letter.beat * 6 + Math.floor(frameIndex / 24) * 36) % FRAME_COUNT;
  const beatDistance = Math.abs(frameIndex - beatFrame);
  const localHit = Math.max(0, 1 - beatDistance / 8);
  const pulse = env[frameIndex] || 0;
  const opacity = clamp(0.04 + pulse * 0.36 + localHit * 0.72, 0, 0.86);
  const scaleKick = 1 + localHit * 0.025 + pulse * 0.008;
  const outW = Math.round(w * fit.scale * scaleKick);
  const outH = Math.round(h * fit.scale * scaleKick);

  const solid = await sharp({
    create: {
      width: Math.round(w * fit.scale),
      height: Math.round(h * fit.scale),
      channels: 3,
      background: rgb,
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  const input = await sharp(solid)
    .resize(outW, outH, { fit: 'fill' })
    .modulate({ brightness: 1 + localHit * 0.35 })
    .png()
    .toBuffer();

  return {
    input,
    left: Math.round(fit.left + left * fit.scale - (outW - w * fit.scale) / 2),
    top: Math.round(fit.top + top * fit.scale - (outH - h * fit.scale) / 2),
    blend: 'screen',
    opacity,
  };
};

const overlaySvg = (frameIndex, env) => {
  const pulse = env[frameIndex] || 0;
  const bars = Array.from({ length: 30 }, (_, i) => {
    const idx = Math.max(0, frameIndex - (29 - i) * 2);
    const v = env[idx] || 0.2;
    const h = Math.round(8 + v * 52);
    const x = 180 + i * 24;
    const y = 1660 - h;
    return `<rect x="${x}" y="${y}" width="14" height="${h}" fill="#ffffff" opacity="${(0.18 + v * 0.36).toFixed(3)}"/>`;
  }).join('');

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="540" y="1488" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#ffffff" opacity="${(0.58 + pulse * 0.22).toFixed(3)}">FULL SETS / BOOKING / MUSIC</text>
  <text x="540" y="1558" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="64" fill="#ffffff" opacity="${(0.9 + pulse * 0.1).toFixed(3)}">www.airdox.info</text>
  <rect x="242" y="1584" width="596" height="3" fill="#ffffff" opacity="${(0.28 + pulse * 0.36).toFixed(3)}"/>
  ${bars}
</svg>`);
};

const renderFrame = async (frameIndex, env) => {
  const framePath = join(framesDir, `frame_${String(frameIndex).padStart(4, '0')}.png`);
  const base = await makeBase(frameIndex, env);
  const coloredLetters = await Promise.all(letters.map((letter) => makeColoredLetter(letter, frameIndex, env)));

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: '#030303',
    },
  })
    .composite([
      base,
      ...coloredLetters,
      { input: overlaySvg(frameIndex, env), left: 0, top: 0, blend: 'over' },
    ])
    .png()
    .toFile(framePath);

  return framePath;
};

const main = async () => {
  if (!existsSync(sourcePath)) fail(`Missing source: ${sourcePath}`);

  await mkdir(outDir, { recursive: true });
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  const env = computeEnvelope();
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    await renderFrame(i, env);
  }

  const previewPng = join(outDir, 'airdox-daumenkino-letterbeat-preview.png');
  await sharp(join(framesDir, 'frame_0084.png')).png().toFile(previewPng);

  const videoPath = join(outDir, 'airdox-daumenkino-letterbeat-8s.mp4');
  run('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', join(framesDir, 'frame_%04d.png'),
    '-ss', String(START_SECONDS),
    '-t', String(DURATION),
    '-i', audioPath,
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    '-vf', 'format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-movflags', '+faststart',
    videoPath,
  ]);

  const manifest = {
    schema: 'airdox.daumenkino.letterbeat.v1',
    note: 'Custom renderer. Visual foundation is daumenkino_idee/1765931533777.jpg. Photoshop letter crops are used when available; otherwise the same zones are cropped directly.',
    source: 'daumenkino_idee/1765931533777.jpg',
    photoshopExports: existsSync(join(psDir, 'manifest.json')),
    website: 'www.airdox.info',
    outputs: {
      previewPng: previewPng.replace(`${root}\\`, '').replaceAll('\\', '/'),
      video: videoPath.replace(`${root}\\`, '').replaceAll('\\', '/'),
      frames: framesDir.replace(`${root}\\`, '').replaceAll('\\', '/'),
    },
    format: { width: W, height: H, fps: FPS, duration: DURATION },
    letters: letters.map(({ name, color, box }) => ({ name, color, box })),
  };

  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(manifest.outputs, null, 2)}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
