#!/usr/bin/env node
import fs from 'node:fs/promises';

import fss from 'node:fs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(__dirname, '..');
const spec = JSON.parse(await fs.readFile(path.join(__dirname, 'render-spec.json'), 'utf8'));

const args = parseArgs(process.argv.slice(2));
const width = Number(args.width ?? spec.width);
const height = Number(args.height ?? spec.height);
const fps = Number(args.fps ?? spec.fps);
const duration = Number(args.duration ?? spec.duration);
const audioStart = Number(args['audio-start'] ?? spec.audioStart);
const totalFrames = Math.round(duration * fps);
const outputDir = path.join(__dirname, 'output');
const framesDir = path.join(outputDir, 'frames');
const outputPath = path.resolve(repoRoot, spec.output);
const proofPath = path.resolve(repoRoot, spec.proofFrame);
const reportPath = path.resolve(repoRoot, spec.report);
const videoOnlyPath = path.join(outputDir, 'airdox-three-polished-video-only.mp4');
const ffmpegPath = findExecutable('ffmpeg');
const ffprobePath = findExecutable('ffprobe');

await fs.mkdir(framesDir, { recursive: true });
await cleanFrames(framesDir);

const audioResolution = resolveAudioPath(args.audio);
console.log(`ffmpeg: ${ffmpegPath ?? 'not found'}`);
console.log(`ffprobe: ${ffprobePath ?? 'not found'}`);
if (!ffmpegPath || !ffprobePath) {
  await writeMissingToolArtifacts({ width, height, fps, duration, totalFrames, outputPath, proofPath, reportPath, audioResolution });
  throw new Error('ffmpeg and ffprobe are required. Install system ffmpeg, set AIRDOX_FFMPEG/AIRDOX_FFPROBE, or place executable binaries at cloud-render/bin/ffmpeg and cloud-render/bin/ffprobe. Proof frame and environment report were written.');
}
console.log(`frames: ${totalFrames} @ ${width}x${height}, ${fps} fps`);
if (audioResolution.exists) {
  console.log(`audio: ${audioResolution.path} (from ${audioStart}s)`);
} else {
  console.warn(`audio missing: ${args.audio ?? '(none supplied)'}`);
  console.warn('using generated placeholder audio so visual deliverables and ffprobe report can be produced');
}

await renderFrames({ width, height, fps, duration, totalFrames, framesDir });
await fs.copyFile(path.join(framesDir, frameName(totalFrames - 1)), proofPath);
await encodeVideo({ framesDir, fps, duration, videoOnlyPath });
await muxAudio({ videoOnlyPath, outputPath, duration, audioStart, audioResolution });
const ffprobe = await probe(outputPath);
const report = buildReport({ ffprobe, audioResolution, width, height, fps, duration, totalFrames, outputPath, proofPath });
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(`output: ${outputPath}`);
console.log(`proof: ${proofPath}`);
console.log(`report: ${reportPath}`);
console.log(JSON.stringify(report.summary, null, 2));

async function writeMissingToolArtifacts({ width, height, fps, duration, totalFrames, outputPath, proofPath, reportPath, audioResolution }) {
  const svg = drawFrame(totalFrames - 1, { width, height, fps, duration, totalFrames });
  await sharp(Buffer.from(svg)).png().toFile(proofPath);
  const report = {
    generatedAt: new Date().toISOString(),
    status: 'blocked',
    reason: 'ffmpeg and/or ffprobe unavailable in this environment',
    outputPath,
    proofPath,
    ffmpegPath,
    ffprobePath,
    audio: audioResolution,
    expected: { width, height, fps, duration, frames: totalFrames, visibleText: spec.allowedVisibleText },
    summary: {
      durationSeconds: null,
      width: null,
      height: null,
      fps: null,
      videoCodec: null,
      audioCodec: null,
      audioSource: audioResolution.exists ? 'requested FLAC' : 'unavailable',
      qualityChecks: {
        size1080x1920: false,
        fps30: false,
        duration30s: false,
        hasAudio: false,
        sourceAudioAvailable: audioResolution.exists,
      },
    },
  };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.warn(`proof: ${proofPath}`);
  console.warn(`report: ${reportPath}`);
}

function findExecutable(name) {
  const envName = `AIRDOX_${name.toUpperCase()}`;
  const candidates = [process.env[envName], path.join(__dirname, 'bin', name), path.join(__dirname, 'bin', `${name}.exe`)];
  for (const candidate of candidates) {
    if (candidate && fss.existsSync(candidate)) return candidate;
  }
  const lookup = spawnSync('bash', ['-lc', `command -v ${name}`], { encoding: 'utf8' });
  const found = lookup.stdout?.trim();
  return lookup.status === 0 && found ? found : null;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq >= 0) out[raw.slice(2, eq)] = raw.slice(eq + 1);
    else out[raw.slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i];
  }
  return out;
}

function resolveAudioPath(input) {
  if (!input) return { requested: null, path: null, exists: false, fallback: true };
  const candidates = [input];
  const drive = input.match(/^([a-zA-Z]):\\(.+)$/);
  if (drive) candidates.push(`/mnt/${drive[1].toLowerCase()}/${drive[2].replaceAll('\\', '/')}`);
  for (const candidate of candidates) {
    if (candidate && fss.existsSync(candidate)) {
      return { requested: input, path: candidate, exists: true, fallback: false };
    }
  }
  return { requested: input, path: null, exists: false, fallback: true, candidates };
}

async function cleanFrames(dir) {
  const entries = await fs.readdir(dir).catch(() => []);
  await Promise.all(entries.filter((entry) => entry.endsWith('.png')).map((entry) => fs.rm(path.join(dir, entry), { force: true })));
}

function frameName(frame) {
  return `frame-${String(frame).padStart(4, '0')}.png`;
}

async function renderFrames(options) {
  const concurrency = Math.max(2, Math.min(8, Number(process.env.AIRDOX_RENDER_CONCURRENCY || 4)));
  let next = 0;
  async function worker() {
    while (next < options.totalFrames) {
      const frame = next++;
      const svg = drawFrame(frame, options);
      await sharp(Buffer.from(svg)).png().toFile(path.join(options.framesDir, frameName(frame)));
      if (frame % options.fps === 0) console.log(`rendered ${Math.round(frame / options.fps)}s/${options.duration}s`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

function drawFrame(frame, { width: w, height: h, fps: f, duration }) {
  const t = frame / f;
  const letters = spec.letters;
  const landY = 1395;
  const slotX = (i) => 186 + i * 135;
  const active = Math.min(letters.length - 1, Math.max(0, Math.floor(t / 3.15)));
  const revealCount = Math.min(letters.length, Math.max(0, Math.floor((t - 1.25) / 3.15) + 1));
  const finalMix = clamp((t - (duration - 6)) / 6, 0, 1);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  svg += defs();
  svg += `<rect width="1080" height="1920" fill="#02030a"/>`;
  svg += `<rect width="1080" height="1920" fill="url(#bg)" opacity="0.96"/>`;
  svg += glow(540, 1030, 520, '#2fffd7', 0.14);
  svg += glow(740, 520, 420, '#7a5cff', 0.16);
  svg += `<g opacity="${0.35 + finalMix * 0.25}">${Array.from({ length: 16 }, (_, i) => `<path d="M${-120 + i * 86} 1640 C 260 1500, 800 1500, 1190 1640" fill="none" stroke="#2fffd7" stroke-opacity="${0.08 + i * 0.004}" stroke-width="2"/>`).join('')}</g>`;
  svg += cup(t, finalMix);
  for (let i = 0; i < Math.min(revealCount, letters.length); i += 1) {
    svg += landedCube(slotX(i), landY, letters[i], finalMix, i);
  }
  if (t < 21.8) svg += activeThrow(t, active, letters[active], slotX(active), landY);
  svg += finalTitle(finalMix);
  svg += `</svg>`;
  return svg;
}

function defs() {
  return `<defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="74%"><stop offset="0" stop-color="#16213d"/><stop offset="0.46" stop-color="#07101f"/><stop offset="1" stop-color="#010208"/></radialGradient>
    <linearGradient id="cup" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#24293a"/><stop offset="0.42" stop-color="#05060c"/><stop offset="1" stop-color="#111827"/></linearGradient>
    <linearGradient id="cubeFront" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f8fdff"/><stop offset="1" stop-color="#bac6d5"/></linearGradient>
    <linearGradient id="cubeSide" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#9eaabd"/><stop offset="1" stop-color="#485466"/></linearGradient>
    <linearGradient id="cubeTop" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d7e2ee"/></linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#000" flood-opacity="0.65"/></filter>
  </defs>`;
}

function glow(cx, cy, r, color, opacity) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" filter="url(#soft)"/>`;
}

function cup(t, finalMix) {
  const wobble = Math.sin(t * 2.8) * 10 * (1 - finalMix);
  const rot = -10 + Math.sin(t * 1.7) * 6 * (1 - finalMix);
  const fade = 1 - finalMix * 0.65;
  return `<g transform="translate(${520 + wobble} 680) rotate(${rot})" opacity="${fade}" filter="url(#shadow)">
    <ellipse cx="0" cy="-170" rx="230" ry="76" fill="#090b12" stroke="#5d6b84" stroke-width="8"/>
    <path d="M-215 -160 C-180 175,-105 385,0 410 C105 385,180 175,215 -160 C120 -92,-120 -92,-215 -160Z" fill="url(#cup)" stroke="#364153" stroke-width="7"/>
    <ellipse cx="0" cy="-154" rx="198" ry="48" fill="#010208" opacity="0.92"/>
    <path d="M-145 -100 C-90 40,-70 225,-26 330" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="14"/>
    <path d="M110 -96 C82 95,58 246,15 365" fill="none" stroke="#2fffd7" stroke-opacity="0.13" stroke-width="8"/>
  </g>`;
}

function activeThrow(t, active, letter, targetX, landY) {
  const local = ((t - active * 3.15) + 3.15) % 3.15;
  if (local > 2.7) return '';
  const p = clamp(local / 2.7, 0, 1);
  const ease = 1 - Math.pow(1 - p, 3);
  const x = 500 + (targetX - 500) * ease + Math.sin(p * Math.PI * 5) * 30;
  const y = 600 + (landY - 600) * p - Math.sin(p * Math.PI) * 360;
  const size = 130 + p * 36;
  const spin = p * 680 + active * 19;
  return `<g transform="translate(${x} ${y}) rotate(${spin})">${cube(0, 0, size, letter, 1, true)}</g>`;
}

function landedCube(x, y, letter, finalMix, i) {
  const lift = Math.sin(finalMix * Math.PI) * (20 + i * 4);
  const scale = 1 + finalMix * 0.06;
  return `<g transform="translate(${x} ${y - lift}) scale(${scale})">${cube(0, 0, 128, letter, 1, false)}</g>`;
}

function cube(x, y, s, letter, opacity = 1, hot = false) {
  const d = s * 0.34;
  const r = s / 2;
  const shine = hot ? 0.32 : 0.18;
  return `<g opacity="${opacity}" filter="url(#shadow)">
    <ellipse cx="${x}" cy="${y + r + d + 38}" rx="${s * 0.62}" ry="${s * 0.20}" fill="#000" opacity="0.45"/>
    <polygon points="${x - r},${y - r} ${x},${y - r - d} ${x + r},${y - r} ${x},${y - r + d}" fill="url(#cubeTop)" stroke="#faffff" stroke-width="3"/>
    <polygon points="${x + r},${y - r} ${x},${y - r + d} ${x},${y + r + d} ${x + r},${y + r}" fill="url(#cubeSide)" stroke="#d8e4f1" stroke-width="3"/>
    <polygon points="${x - r},${y - r} ${x},${y - r + d} ${x},${y + r + d} ${x - r},${y + r}" fill="url(#cubeFront)" stroke="#ffffff" stroke-width="3"/>
    <path d="M${x - r + 18} ${y - r + 20} L${x - 8} ${y - r + d + 8} L${x - 8} ${y + r + d - 16} L${x - r + 18} ${y + r - 12}Z" fill="#fff" opacity="${shine}"/>
    <text x="${x - r * 0.52}" y="${y + d * 0.78}" transform="skewY(18)" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="${s * 0.78}" fill="#07101d" opacity="0.96">${letter}</text>
  </g>`;
}

function finalTitle(mix) {
  if (mix <= 0) return '';
  const y = 380 - (1 - mix) * 70;
  return `<g opacity="${mix}">
    ${glow(540, 380, 300, '#2fffd7', 0.22 * mix)}
    <text x="540" y="${y}" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="150" letter-spacing="16" fill="#f7fbff" stroke="#2fffd7" stroke-width="2">AIRDOX</text>
    <text x="540" y="${y + 105}" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="800" letter-spacing="4" fill="#dffcff">airdox.info</text>
  </g>`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

async function encodeVideo({ framesDir, fps, duration, videoOnlyPath }) {
  await run(ffmpegPath, [
    '-y', '-hide_banner', '-loglevel', 'warning',
    '-framerate', String(fps),
    '-i', path.join(framesDir, 'frame-%04d.png'),
    '-t', String(duration),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-r', String(fps), '-movflags', '+faststart', videoOnlyPath,
  ]);
}

async function muxAudio({ videoOnlyPath, outputPath, duration, audioStart, audioResolution }) {
  const args = ['-y', '-hide_banner', '-loglevel', 'warning', '-i', videoOnlyPath];
  if (audioResolution.exists) {
    args.push('-ss', String(audioStart), '-t', String(duration), '-i', audioResolution.path, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest');
  } else {
    args.push('-f', 'lavfi', '-t', String(duration), '-i', 'sine=frequency=54:sample_rate=48000', '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest');
  }
  args.push(outputPath);
  await run(ffmpegPath, args);
}

async function probe(file) {
  const { stdout } = await run(ffprobePath, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { capture: true });
  return JSON.parse(stdout);
}

function buildReport({ ffprobe, audioResolution, width, height, fps, duration, totalFrames, outputPath, proofPath }) {
  const video = ffprobe.streams.find((stream) => stream.codec_type === 'video');
  const audio = ffprobe.streams.find((stream) => stream.codec_type === 'audio');
  const measuredFps = video?.avg_frame_rate ? rational(video.avg_frame_rate) : null;
  const measuredDuration = Number(ffprobe.format?.duration ?? video?.duration ?? 0);
  return {
    generatedAt: new Date().toISOString(),
    outputPath,
    proofPath,
    ffmpegPath,
    ffprobePath,
    audio: audioResolution,
    expected: { width, height, fps, duration, frames: totalFrames, visibleText: spec.allowedVisibleText },
    summary: {
      durationSeconds: Number(measuredDuration.toFixed(3)),
      width: Number(video?.width),
      height: Number(video?.height),
      fps: measuredFps,
      videoCodec: video?.codec_name,
      audioCodec: audio?.codec_name,
      audioSource: audioResolution.exists ? 'requested FLAC' : 'generated placeholder because requested FLAC was unavailable',
      qualityChecks: {
        size1080x1920: Number(video?.width) === width && Number(video?.height) === height,
        fps30: Math.abs((measuredFps ?? 0) - fps) < 0.01,
        duration30s: Math.abs(measuredDuration - duration) < 0.25,
        hasAudio: Boolean(audio),
        sourceAudioAvailable: audioResolution.exists,
      },
    },
    raw: ffprobe,
  };
}

function rational(value) {
  const [a, b] = String(value).split('/').map(Number);
  return b ? a / b : a;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let stdout = '';
    let stderr = '';
    if (options.capture) {
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
    }
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with ${code}${stderr ? `\n${stderr}` : ''}`));
    });
  });
}

