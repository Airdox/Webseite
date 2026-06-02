#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceGif = join(root, 'daumenkino_idee', 'GIF_20251217_015755_774.gif');
const outDir = join(root, 'docs', 'agent-system', 'social-auto-output', 'daumenkino-gif-letterbeat');
const sourceFramesDir = join(outDir, 'source-gif-frames');
const framesDir = join(outDir, 'frames');

const W = 1080;
const H = 1920;
const FPS = 24;
const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};
const DURATION = Math.max(5, Math.min(60, Number(getArg('--duration', '30')) || 30));
const FRAME_COUNT = FPS * DURATION;
const audioPath = getArg('--audio', join(root, 'audio_processing', 'recording_2026_05_02_sissygut_alles_gut.mp3'));
const START_SECONDS = Math.max(0, Number(getArg('--audio-start', '230')) || 0);

const logo = {
  width: 920,
  height: 492,
  left: 80,
  top: 540,
};

// Coordinates are in the original 560x560 GIF space.
const sourceCrop = { left: 0, top: 100, width: 560, height: 300 };
const letters = [
  { name: 'A', color: '#ff174d', box: [18, 128, 148, 352], hit: 0 },
  { name: 'I', color: '#ffea00', box: [120, 132, 232, 352], hit: 1 },
  { name: 'R', color: '#00e5ff', box: [204, 122, 318, 358], hit: 2 },
  { name: 'D', color: '#7cff00', box: [286, 120, 398, 360], hit: 3 },
  { name: 'O', color: '#ff3df2', box: [364, 124, 462, 352], hit: 4 },
  { name: 'X', color: '#ff8a00', box: [432, 116, 552, 352], hit: 5 },
];

const iDot = {
  color: '#ffea00',
  sourceX: 184,
  sourceY: 208,
  hit: 1,
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

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const isWhiteStrobeFrame = (frameIndex, env) => {
  const pulse = env[frameIndex] || 0;
  const doubleBeatFlash = frameIndex % Math.max(1, Math.round(FPS / 2)) < 2;
  const audioPeakFlash = pulse > 0.72 && frameIndex % 4 < 2;
  return doubleBeatFlash || audioPeakFlash;
};

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const transparentLogoBuffer = async (source, width, height) => {
  const { data, info } = await sharp(source)
    .extract(sourceCrop)
    .resize(width, height, { fit: 'contain', background: '#000000' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sample = (x, y) => {
    const idx = (y * info.width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };
  const cornerLum = (
    sample(0, 0)
    + sample(info.width - 1, 0)
    + sample(0, info.height - 1)
    + sample(info.width - 1, info.height - 1)
  ) / 4;
  const lightBackground = cornerLum > 120;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    const saturation = max - min;
    let alpha;

    if (lightBackground) {
      alpha = clamp((238 - lum) / 118, 0, 1);
      data[i] = Math.round(r * 0.78);
      data[i + 1] = Math.round(g * 0.78);
      data[i + 2] = Math.round(b * 0.78);
    } else {
      alpha = Math.max(
        clamp((lum - 20) / 112, 0, 1),
        clamp((saturation - 22) / 110, 0, 1),
      );
    }

    // Drop tiny specks and matte residue from the original GIF edges.
    if (alpha < 0.16) alpha = 0;
    data[i + 3] = Math.round(alpha * 255);
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  }).png().toBuffer();
};

const alphaMaskBuffer = async (source, crop, width, height) => {
  const { data, info } = await sharp(source)
    .extract(crop)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sample = (x, y) => {
    const idx = (y * info.width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  };
  const cornerLum = (
    sample(0, 0)
    + sample(info.width - 1, 0)
    + sample(0, info.height - 1)
    + sample(info.width - 1, info.height - 1)
  ) / 4;
  const lightBackground = cornerLum > 120;
  const mask = Buffer.alloc(info.width * info.height);

  for (let src = 0, dst = 0; src < data.length; src += 4, dst += 1) {
    const r = data[src];
    const g = data[src + 1];
    const b = data[src + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    const saturation = max - min;
    let alpha = lightBackground
      ? clamp((238 - lum) / 112, 0, 1)
      : Math.max(clamp((lum - 18) / 106, 0, 1), clamp((saturation - 18) / 104, 0, 1));
    if (alpha < 0.18) alpha = 0;
    mask[dst] = Math.round(alpha * 255);
  }

  return sharp(mask, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 1,
    },
  })
    // Close sketch scratches and black/white pinholes before the color fill is applied.
    .blur(5.2)
    .threshold(18)
    .blur(0.55)
    .png()
    .toBuffer();
};

const listExtractedFrames = async () => {
  const { readdir } = await import('node:fs/promises');
  return (await readdir(sourceFramesDir))
    .filter((name) => /^gif_\d+\.png$/i.test(name))
    .sort()
    .map((name) => join(sourceFramesDir, name));
};

const extractGifFrames = async () => {
  await rm(sourceFramesDir, { recursive: true, force: true });
  await mkdir(sourceFramesDir, { recursive: true });
  run('ffmpeg', [
    '-y',
    '-i', sourceGif,
    '-vsync', '0',
    join(sourceFramesDir, 'gif_%03d.png'),
  ]);
  const frames = await listExtractedFrames();
  if (!frames.length) fail(`No frames extracted from ${sourceGif}`);
  return frames;
};

const computeEnvelope = () => {
  if (!existsSync(audioPath)) {
    return Float32Array.from({ length: FRAME_COUNT }, (_, i) => 0.45 + Math.sin(i * 0.39) * 0.25);
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
    return Float32Array.from({ length: FRAME_COUNT }, (_, i) => 0.45 + Math.sin(i * 0.39) * 0.25);
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
    const a = target > smooth ? 0.44 : 0.14;
    smooth = smooth * (1 - a) + target * a;
    env[i] = smooth;
  }
  return env;
};

const resizeLogoFrame = async (framePath, frameIndex, env) => {
  const pulse = env[frameIndex] || 0;
  const scale = 1 + pulse * 0.018;
  const width = Math.round(logo.width * scale);
  const height = Math.round(logo.height * scale);
  const input = await transparentLogoBuffer(framePath, width, height);
  return {
    input,
    left: Math.round(logo.left - (width - logo.width) / 2),
    top: Math.round(logo.top - (height - logo.height) / 2),
  };
};

const makeLetterOverlay = async (maskFramePath, letter, frameIndex, env) => {
  const [left, top, right, bottom] = letter.box;
  const sourceW = right - left;
  const sourceH = bottom - top;
  const rgb = hexToRgb(letter.color);
  const baseScale = logo.width / sourceCrop.width;
  const beatDistance = Math.abs((frameIndex % 36) - letter.hit * 6);
  const hit = Math.max(0, 1 - beatDistance / 7);
  const pulse = env[frameIndex] || 0;
  const opacity = clamp(0.68 + pulse * 0.12 + hit * 0.2, 0, 1);
  const kick = 1 + hit * 0.028 + pulse * 0.006;
  const outW = Math.round(sourceW * baseScale * kick);
  const outH = Math.round(sourceH * baseScale * kick);

  const alpha = await alphaMaskBuffer(maskFramePath, { left, top, width: sourceW, height: sourceH }, outW, outH);

  const color = await sharp({
    create: {
      width: outW,
      height: outH,
      channels: 3,
      background: rgb,
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  return {
    input: color,
    left: Math.round(logo.left + left * baseScale - (outW - sourceW * baseScale) / 2),
    top: Math.round(logo.top + (top - sourceCrop.top) * baseScale - (outH - sourceH * baseScale) / 2),
    blend: 'over',
    opacity,
  };
};

const makeIDotOverlay = async (frameIndex, env) => {
  const baseScale = logo.width / sourceCrop.width;
  const beatDistance = Math.abs((frameIndex % 36) - iDot.hit * 6);
  const hit = Math.max(0, 1 - beatDistance / 7);
  const pulse = env[frameIndex] || 0;
  const scale = baseScale * (1 + hit * 0.12 + pulse * 0.02);
  const cx = logo.left + iDot.sourceX * baseScale;
  const cy = logo.top + (iDot.sourceY - sourceCrop.top) * baseScale;
  const w = Math.round(34 * scale);
  const h = Math.round(42 * scale);
  const opacity = clamp(0.82 + hit * 0.18, 0, 1);

  const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 34 42">
  <path d="M7 7 L24 1 L31 17 L20 39 L3 32 Z" fill="${iDot.color}" opacity="${opacity.toFixed(3)}"/>
  <path d="M9 10 L24 4 L29 15" fill="none" stroke="#ffffff" stroke-width="2.4" opacity="0.58"/>
  <path d="M6 30 L18 37 L4 35" fill="#050505" opacity="0.38"/>
</svg>`);

  return {
    input: svg,
    left: Math.round(cx - w / 2),
    top: Math.round(cy - h / 2),
    opacity,
  };
};

const overlaySvg = (frameIndex, env, whiteStrobe) => {
  const pulse = env[frameIndex] || 0;
  const ink = whiteStrobe ? '#050505' : '#ffffff';
  const barCount = 28;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const v = env[Math.max(0, frameIndex - (barCount - i) * 2)] || 0.2;
    const h = Math.round(7 + v * 34);
    const x = 274 + i * 19;
    const y = 1664 - h;
    return `<rect x="${x}" y="${y}" width="9" height="${h}" fill="${ink}" opacity="${(0.16 + v * 0.34).toFixed(3)}"/>`;
  }).join('');

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="540" y="1490" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="${ink}" opacity="${(0.58 + pulse * 0.2).toFixed(3)}">FULL SETS / BOOKING / MUSIC</text>
  <text x="540" y="1564" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="66" fill="${ink}" opacity="${(0.9 + pulse * 0.1).toFixed(3)}">www.airdox.info</text>
  <rect x="252" y="1592" width="576" height="3" fill="${ink}" opacity="${(0.24 + pulse * 0.3).toFixed(3)}"/>
  ${bars}
</svg>`);
};

const renderFrame = async (frameIndex, gifFrames, env) => {
  const sourceFrame = gifFrames[frameIndex % gifFrames.length];
  const maskFrame = gifFrames[0];
  const whiteStrobe = isWhiteStrobeFrame(frameIndex, env);
  const letterLayers = await Promise.all(letters.map((letter) => makeLetterOverlay(maskFrame, letter, frameIndex, env)));
  const dotLayer = await makeIDotOverlay(frameIndex, env);
  const framePath = join(framesDir, `frame_${String(frameIndex).padStart(4, '0')}.png`);

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: whiteStrobe ? '#ffffff' : '#000000',
    },
  })
    .composite([
      ...letterLayers,
      dotLayer,
      { input: overlaySvg(frameIndex, env, whiteStrobe), left: 0, top: 0 },
    ])
    .png()
    .toFile(framePath);
};

const main = async () => {
  if (!existsSync(sourceGif)) fail(`Missing GIF source: ${sourceGif}`);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  const gifFrames = await extractGifFrames();
  const env = computeEnvelope();

  for (let i = 0; i < FRAME_COUNT; i += 1) {
    await renderFrame(i, gifFrames, env);
  }

  const previewPng = join(outDir, 'airdox-gif-letterbeat-preview.png');
  await sharp(join(framesDir, 'frame_0072.png')).png().toFile(previewPng);

  const videoPath = join(outDir, `airdox-gif-letterbeat-${DURATION}s.mp4`);
  const ffmpegArgs = [
    '-y',
    '-framerate', String(FPS),
    '-i', join(framesDir, 'frame_%04d.png'),
  ];
  const hasAudio = existsSync(audioPath);
  if (hasAudio) {
    ffmpegArgs.push(
      '-ss', String(START_SECONDS),
      '-i', audioPath,
      '-map', '0:v:0',
      '-map', '1:a:0',
    );
  }
  ffmpegArgs.push(
    '-vf', 'format=yuv420p',
    '-t', String(DURATION),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
  );
  if (hasAudio) {
    ffmpegArgs.push(
      '-af', `atrim=start=0:duration=${DURATION},asetpts=PTS-STARTPTS`,
      '-c:a', 'aac',
      '-b:a', '160k',
    );
  }
  ffmpegArgs.push(
    '-movflags', '+faststart',
    videoPath,
  );
  run('ffmpeg', ffmpegArgs);

  const manifest = {
    schema: 'airdox.daumenkino.gif-letterbeat.v1',
    source: 'daumenkino_idee/GIF_20251217_015755_774.gif',
    note: 'Custom renderer using only the selected GIF frame sequence as the visual foundation. The lower-right GIF artifact is removed by cropping to the logo area before rendering. Color letter pulses are added on top in sync with the local music envelope.',
    website: 'www.airdox.info',
    audio: hasAudio ? {
      path: audioPath,
      startSeconds: START_SECONDS,
      duration: DURATION,
    } : null,
    outputs: {
      previewPng: previewPng.replace(`${root}\\`, '').replaceAll('\\', '/'),
      video: videoPath.replace(`${root}\\`, '').replaceAll('\\', '/'),
      frames: framesDir.replace(`${root}\\`, '').replaceAll('\\', '/'),
      sourceFrames: sourceFramesDir.replace(`${root}\\`, '').replaceAll('\\', '/'),
    },
    format: { width: W, height: H, fps: FPS, duration: DURATION },
    gifFrameCount: gifFrames.length,
  };

  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(manifest.outputs, null, 2)}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
