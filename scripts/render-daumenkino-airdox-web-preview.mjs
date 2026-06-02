#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(root, 'daumenkino_idee');
const outDir = join(root, 'docs', 'agent-system', 'social-auto-output', 'daumenkino-airdox-web-preview');
const framesDir = join(outDir, 'frames');

const W = 1080;
const H = 1920;
const FPS = 24;
const DURATION = 5;
const FRAME_COUNT = FPS * DURATION;

const sources = [
  '1765910983684.jpg',
  '1765911412553.jpg',
  '1765931533777.jpg',
].map((name) => join(sourceDir, name));

const fail = (message) => {
  throw new Error(message);
};

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.status !== 0) fail(`${cmd} failed with exit code ${result.status}`);
};

const fitSource = async (sourcePath, frameIndex) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const phase = Math.sin(t * Math.PI * 2);
  const zoom = 1.15 + Math.sin(t * Math.PI * 2.5) * 0.04;
  const targetW = Math.round(W * zoom);
  const targetH = Math.round(W * zoom);
  const left = Math.round((W - targetW) / 2 + phase * 16);
  const top = Math.round(430 + Math.cos(t * Math.PI * 2) * 20);

  return sharp(sourcePath)
    .resize(targetW, targetH, { fit: 'cover' })
    .modulate({ brightness: 1.02, saturation: 0 })
    .linear(1.22, -12)
    .png()
    .toBuffer()
    .then((input) => ({ input, left, top }));
};

const overlaySvg = (frameIndex) => {
  const t = frameIndex / Math.max(1, FRAME_COUNT - 1);
  const pageY = 132;
  const urlPulse = 0.72 + Math.sin(t * Math.PI * 6) * 0.12;
  const scanY = Math.round(420 + (t * 920) % 920);
  const sourceLabel = frameIndex < FRAME_COUNT * 0.33
    ? 'DAUMENKINO SOURCE 01'
    : frameIndex < FRAME_COUNT * 0.66
      ? 'DAUMENKINO SOURCE 02'
      : 'DAUMENKINO SOURCE 03';

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#030303"/>
  <rect x="54" y="${pageY}" width="972" height="1584" rx="0" fill="none" stroke="#f2f2f2" stroke-width="3" opacity="0.92"/>
  <rect x="54" y="${pageY}" width="972" height="92" fill="#f2f2f2"/>
  <circle cx="96" cy="${pageY + 46}" r="10" fill="#050505"/>
  <circle cx="128" cy="${pageY + 46}" r="10" fill="#050505"/>
  <circle cx="160" cy="${pageY + 46}" r="10" fill="#050505"/>
  <rect x="210" y="${pageY + 22}" width="746" height="48" rx="24" fill="#050505"/>
  <text x="236" y="${pageY + 55}" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#ffffff" opacity="${urlPulse.toFixed(2)}">https://www.airdox.info</text>

  <rect x="84" y="260" width="912" height="104" fill="#030303" opacity="0.86"/>
  <text x="102" y="318" font-family="Arial Black, Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff">AIRDOX.INFO</text>
  <text x="102" y="352" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" opacity="0.76">${escapeXml(sourceLabel)} / WEBSITE PREVIEW</text>

  <rect x="72" y="${scanY}" width="936" height="5" fill="#ffffff" opacity="0.38"/>
  <rect x="72" y="${scanY + 16}" width="936" height="2" fill="#ffffff" opacity="0.22"/>
  <rect x="92" y="1394" width="896" height="118" fill="#f2f2f2"/>
  <text x="124" y="1444" font-family="Arial Black, Arial, sans-serif" font-size="38" font-weight="900" fill="#030303">FULL SETS UND BOOKING</text>
  <text x="124" y="1484" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#030303">www.airdox.info</text>

  <rect x="112" y="1572" width="856" height="58" fill="#030303" stroke="#f2f2f2" stroke-width="2"/>
  <text x="540" y="1611" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#ffffff">DAUMENKINO BASIS ONLY</text>
</svg>`);
};

const renderFrame = async (frameIndex) => {
  const sourcePath = sources[Math.floor((frameIndex / FRAME_COUNT) * sources.length)] || sources.at(-1);
  const baseLayer = await fitSource(sourcePath, frameIndex);
  const ghostLayer = await fitSource(sourcePath, frameIndex + 9);
  const framePath = join(framesDir, `frame_${String(frameIndex).padStart(4, '0')}.png`);

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: '#030303',
    },
  })
    .composite([
      { input: overlaySvg(frameIndex), left: 0, top: 0 },
      { ...ghostLayer, left: ghostLayer.left - 22, top: ghostLayer.top + 16, blend: 'screen' },
      baseLayer,
      { input: overlaySvg(frameIndex), left: 0, top: 0, blend: 'over' },
    ])
    .png()
    .toFile(framePath);

  return framePath;
};

const main = async () => {
  for (const source of sources) {
    if (!existsSync(source)) fail(`Missing Daumenkino source: ${source}`);
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });

  for (let i = 0; i < FRAME_COUNT; i += 1) {
    await renderFrame(i);
  }

  const previewPng = join(outDir, 'airdox-daumenkino-web-preview.png');
  await sharp(join(framesDir, 'frame_0060.png')).png().toFile(previewPng);

  const videoPath = join(outDir, 'airdox-daumenkino-web-preview-5s.mp4');
  run('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', join(framesDir, 'frame_%04d.png'),
    '-vf', 'format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-movflags', '+faststart',
    videoPath,
  ]);

  const manifest = {
    schema: 'airdox.daumenkino.web.preview.v1',
    note: 'Custom renderer. Visual source images are exclusively taken from daumenkino_idee/. Website reference is rendered as text/UI overlay for www.airdox.info.',
    sources: sources.map((source) => source.replace(`${root}\\`, '').replaceAll('\\', '/')),
    outputs: {
      previewPng: previewPng.replace(`${root}\\`, '').replaceAll('\\', '/'),
      video: videoPath.replace(`${root}\\`, '').replaceAll('\\', '/'),
      frames: framesDir.replace(`${root}\\`, '').replaceAll('\\', '/'),
    },
    format: { width: W, height: H, fps: FPS, duration: DURATION },
  };

  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(manifest.outputs, null, 2)}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
