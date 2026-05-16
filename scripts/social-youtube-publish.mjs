#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/, '$1'));
dotenv.config({ path: join(root, '.env'), quiet: true });

const args = process.argv.slice(2);
const outputRoot = join(root, 'docs', 'agent-system', 'social-auto-output');
const audioExtensions = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac']);
const knownAudioSources = new Map([
  ['recording_2026_05_07-2', 'D:\\Neuer Ordner (2)\\140-Airdox\\Unknown Album(3)\\01 REC-2026-05-07.mp3'],
]);

const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};

const hasFlag = (name) => args.includes(name);

const explicitSetId = getArg('--set-id');
const explicitVideo = getArg('--video');
const explicitAudioPath = getArg('--audio-path');
const uploadMode = getArg('--mode', 'full-set').toLowerCase();
const privacyStatus = getArg('--privacy', 'unlisted');
const categoryId = getArg('--category', '10');
const durationTest = Number(getArg('--duration-test', '0'));
const chunkMb = Math.max(1, Number(getArg('--chunk-mb', '32')) || 32);
const dryRun = hasFlag('--dry-run');
const forceRender = hasFlag('--force-render');
const renderOnly = hasFlag('--render-only');
const validateOnly = hasFlag('--validate-only');
const skipRender = hasFlag('--skip-render');
const publicOnlyVideoId = getArg('--set-public-video-id');
const noRender = dryRun || validateOnly || skipRender;
const shouldUpload = !dryRun && !renderOnly && !validateOnly;

const slugify = (value) => String(value || 'airdox-set')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'airdox-set';

const parseDuration = (value = '') => {
  const parts = String(value).split(':').map((entry) => Number(entry));
  if (parts.some((entry) => !Number.isFinite(entry))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

const toRepoPath = (filePath) => relative(root, filePath).replaceAll('\\', '/');

const fail = (message) => {
  throw new Error(message);
};

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: options.stdio || 'inherit',
    encoding: options.encoding,
    shell: false,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
  return result;
};

const readWindowsUserEnv = (key) => {
  if (process.platform !== 'win32') return '';
  const result = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    `[Environment]::GetEnvironmentVariable('${key.replaceAll("'", "''")}','User')`,
  ], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  return result.status === 0 ? String(result.stdout || '').trim() : '';
};

const getEnv = (key) => process.env[key] || readWindowsUserEnv(key);

const runFfmpegProgress = (commandArgs, expectedDuration, label) => new Promise((resolvePromise, rejectPromise) => {
  const child = spawn('ffmpeg', ['-progress', 'pipe:1', ...commandArgs], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  let stderr = '';
  let lastPercent = -1;
  const report = (percent, suffix = '') => {
    const rounded = Math.max(0, Math.min(100, Math.floor(percent)));
    if (rounded >= lastPercent + 5 || rounded === 100) {
      lastPercent = rounded;
      process.stderr.write(`[${label}] ${rounded}%${suffix}\n`);
    }
  };
  child.stdout.on('data', (chunk) => {
    for (const line of String(chunk).split(/\r?\n/)) {
      const [key, value] = line.split('=');
      if (key === 'out_time_ms' && expectedDuration > 0) {
        const seconds = Number(value) / 1_000_000;
        report((seconds / expectedDuration) * 100, ` (${Math.floor(seconds)}s/${Math.floor(expectedDuration)}s)`);
      }
      if (key === 'progress' && value === 'end') report(100);
    }
  });
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });
  child.on('error', rejectPromise);
  child.on('close', (code) => {
    if (code === 0) {
      resolvePromise();
      return;
    }
    rejectPromise(new Error(`ffmpeg failed with exit code ${code}: ${stderr.slice(-2000)}`));
  });
});

const probeMedia = (filePath) => {
  if (!existsSync(filePath)) return null;
  const result = spawnSync('ffprobe', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-show_entries',
    'format=duration,size:stream=index,codec_type,codec_name,width,height,pix_fmt,sample_rate,channels',
    '-of',
    'json',
    filePath,
  ], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) return null;
  try {
    const parsed = JSON.parse(result.stdout || '{}');
    return {
      duration: Number(parsed?.format?.duration || 0),
      size: Number(parsed?.format?.size || 0),
      streams: Array.isArray(parsed?.streams) ? parsed.streams : [],
    };
  } catch {
    return null;
  }
};

const getAccessToken = async () => {
  const missingEnv = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN']
    .filter((key) => !getEnv(key));
  if (missingEnv.length > 0) {
    fail(`Missing environment variables: ${missingEnv.join(', ')}`);
  }

  const body = new URLSearchParams({
    client_id: getEnv('YOUTUBE_CLIENT_ID'),
    client_secret: getEnv('YOUTUBE_CLIENT_SECRET'),
    refresh_token: getEnv('YOUTUBE_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    fail(`OAuth token request failed (${response.status}): ${text}`);
  }
  const data = await response.json();
  if (!data.access_token) fail('OAuth token response did not include access_token');
  return data.access_token;
};

const listOutputDirs = () => {
  if (!existsSync(outputRoot)) return [];
  return readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(outputRoot, entry.name));
};

const pickLatestPackageDir = () => listOutputDirs()
  .map((dir) => ({ dir, mtime: statSync(dir).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)[0]?.dir || '';

const loadManifest = () => {
  const explicitDir = explicitSetId ? join(outputRoot, slugify(explicitSetId)) : '';
  const packageDir = explicitDir && existsSync(join(explicitDir, 'manifest.json'))
    ? explicitDir
    : pickLatestPackageDir();
  const manifestPath = packageDir ? join(packageDir, 'manifest.json') : '';
  if (!manifestPath || !existsSync(manifestPath)) return { manifest: null, packageDir: explicitDir || packageDir };
  return {
    manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
    packageDir,
  };
};

const loadSet = async (manifest) => {
  const setsModulePath = pathToFileURL(join(root, 'src', 'data', 'musicSets.js')).href;
  const { sets } = await import(setsModulePath);
  const availableSets = Array.isArray(sets) ? sets : [];
  const wantedId = explicitSetId || manifest?.set?.id || '';
  const selected = wantedId
    ? availableSets.find((entry) => entry.id === wantedId)
    : availableSets.find((entry) => entry.isNew === true) || availableSets[0];
  if (!selected && manifest?.set) return manifest.set;
  if (!selected) fail('No music set found in src/data/musicSets.js');
  return selected;
};

const listAudioCandidates = (dirPath, depth = 0) => {
  if (!dirPath || !existsSync(dirPath) || depth > 6) return [];
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listAudioCandidates(fullPath, depth + 1));
    } else if (audioExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
};

const dateNeedlesForSet = (set) => {
  const values = [set.id, set.file, set.title, set.publishedAt].filter(Boolean).join(' ');
  const match = values.match(/20\d{2}[_-]\d{2}[_-]\d{2}/);
  if (!match) return [];
  const normalized = match[0].replaceAll('_', '-');
  return [normalized, normalized.replaceAll('-', '_')];
};

const resolveAudioSource = (set) => {
  const expectedDuration = parseDuration(set.duration);
  const candidates = [];
  if (explicitAudioPath) candidates.push(resolve(root, explicitAudioPath));
  if (knownAudioSources.has(set.id)) candidates.push(knownAudioSources.get(set.id));

  const localDir = process.env.AIRDOX_LOCAL_AUDIO_DIR || '';
  const localFiles = listAudioCandidates(localDir);
  const setFileBase = basename(set.file || '').toLowerCase();
  const exact = localFiles.filter((filePath) => basename(filePath).toLowerCase() === setFileBase);
  const dateNeedles = dateNeedlesForSet(set);
  const byDate = localFiles.filter((filePath) => dateNeedles.some((needle) => basename(filePath).includes(needle)));
  candidates.push(...exact, ...byDate, ...localFiles);

  const uniqueCandidates = [...new Set(candidates)].filter((filePath) => filePath && existsSync(filePath));
  if (uniqueCandidates.length === 0) {
    fail('No local audio source found. Set AIRDOX_LOCAL_AUDIO_DIR or pass --audio-path=<file>.');
  }

  const probed = uniqueCandidates
    .map((filePath) => ({ filePath, probe: probeMedia(filePath) }))
    .filter((entry) => entry.probe?.duration > 0)
    .map((entry) => ({
      ...entry,
      durationDelta: expectedDuration ? Math.abs(entry.probe.duration - expectedDuration) : 0,
      score: (knownAudioSources.get(set.id) === entry.filePath ? -100 : 0)
        + (basename(entry.filePath).toLowerCase() === setFileBase ? -50 : 0)
        + (dateNeedles.some((needle) => basename(entry.filePath).includes(needle)) ? -25 : 0)
        + (expectedDuration ? Math.abs(entry.probe.duration - expectedDuration) : 0),
    }))
    .sort((a, b) => a.score - b.score);

  if (probed.length === 0) fail('Local audio candidates exist, but ffprobe could not read any of them.');
  const selected = probed[0];
  if (expectedDuration && selected.durationDelta > 5) {
    fail(`Best local audio duration does not match ${set.title}: delta=${selected.durationDelta.toFixed(2)}s source=${selected.filePath}`);
  }
  return selected;
};

const resolveCoverPath = (set, manifest) => {
  const coverRaw = manifest?.set?.cover || set.cover || '/assets/airdox-vinyl.jpg';
  const coverPath = resolve(root, String(coverRaw).replace(/^\//, 'public/'));
  if (!existsSync(coverPath)) fail(`Cover image not found: ${coverPath}`);
  return coverPath;
};

const packageDirForSet = (set, packageDir) => {
  const dir = packageDir || join(outputRoot, slugify(set.id || set.title));
  mkdirSync(dir, { recursive: true });
  return dir;
};

const getFullSetVideoPath = (set, packageDir) => {
  const setSlug = slugify(set.id || set.title);
  return join(packageDirForSet(set, packageDir), `${setSlug}-full-set-youtube.mp4`);
};

const getShortVideoPath = (manifest) => {
  if (explicitVideo) return resolve(root, explicitVideo);
  const variants = Array.isArray(manifest?.variants) ? manifest.variants : [];
  const reel59 = variants.find((entry) => entry.label === '59s-reel');
  const longest = variants
    .filter((entry) => entry?.video && Number.isFinite(entry?.duration))
    .sort((a, b) => b.duration - a.duration)[0];
  const selected = reel59 || longest;
  if (!selected?.video) fail('No short video variant found in manifest');
  return resolve(root, selected.video);
};

const ffText = (value) => String(value || '')
  .replaceAll('\\', '\\\\')
  .replaceAll(':', '\\:')
  .replaceAll("'", "\\'")
  .replaceAll('%', '\\%');

const fontArg = () => {
  const fontPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
  return existsSync(fontPath) ? `fontfile='${fontPath.replaceAll('\\', '/').replace(':', '\\:')}'` : 'font=Arial';
};

const buildPosterFilter = (set) => {
  const title = ffText(String(set.title || 'AIRDOX LIVE SET').toUpperCase());
  const date = ffText(String(set.date || set.publishedAt || '').toUpperCase());
  const font = fontArg();
  return [
    '[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=32:2,eq=brightness=-0.46:saturation=0.82[bg]',
    '[0:v]scale=620:620:force_original_aspect_ratio=decrease,pad=620:620:(ow-iw)/2:(oh-ih)/2:color=#050608[cover]',
    '[bg]drawbox=x=0:y=0:w=iw:h=ih:color=0x050608@0.62:t=fill[base]',
    '[base][cover]overlay=x=128+10*sin(t*0.16):y=230+8*cos(t*0.14)[v0]',
    `[v0]drawbox=x=104:y=206:w=668:h=668:color=0x00f0ff@0.26:t=3,drawbox=x=822:y=218:w=900:h=520:color=0x0f141a@0.72:t=fill,drawbox=x=822:y=218:w=900:h=520:color=0x263241@0.75:t=2,drawbox=x=118:y=978:w=1684:h=10:color=0x263241@0.85:t=fill,drawbox=x=120:y=980:w=1680:h=6:color=0x00f0ff@0.95:t=fill,drawtext=${font}:text='AIRDOX':x=872:y=286:fontsize=92:fontcolor=0xf5f8ff,drawtext=${font}:text='${title}':x=872:y=410:fontsize=54:fontcolor=0x00f0ff,drawtext=${font}:text='FULL SET':x=872:y=492:fontsize=42:fontcolor=0xff00aa,drawtext=${font}:text='${date}':x=872:y=556:fontsize=34:fontcolor=0x9aa6b2,drawtext=${font}:text='AIRDOX.INFO':x=872:y=640:fontsize=48:fontcolor=0xf5f8ff,scale=1920:1080:out_range=tv,format=yuv420p[vout]`,
  ].join(';');
};

const validateFullSetVideo = (videoPath, audioProbe, renderDuration = 0) => {
  if (!existsSync(videoPath)) return { ok: false, reason: 'file-missing', probe: null };
  const probe = probeMedia(videoPath);
  if (!probe) return { ok: false, reason: 'ffprobe-failed', probe: null };
  const expectedDuration = renderDuration || audioProbe.duration;
  const videoStream = probe.streams.find((stream) => stream.codec_type === 'video');
  const audioStream = probe.streams.find((stream) => stream.codec_type === 'audio');
  const durationDelta = Math.abs(probe.duration - expectedDuration);
  const ok = probe.duration > 0
    && durationDelta < Math.max(3, expectedDuration * 0.01)
    && probe.size > 1024 * 1024
    && videoStream?.codec_name === 'h264'
    && audioStream?.codec_name === 'aac'
    && videoStream?.pix_fmt === 'yuv420p';
  return {
    ok,
    reason: ok ? 'ok' : `invalid durationDelta=${durationDelta.toFixed(2)} video=${videoStream?.codec_name || 'none'} audio=${audioStream?.codec_name || 'none'} pix_fmt=${videoStream?.pix_fmt || 'none'}`,
    probe,
  };
};

const renderFullSetVideo = async ({ set, manifest, packageDir, audio, coverPath }) => {
  const outputPath = getFullSetVideoPath(set, packageDir);
  const finalPath = durationTest > 0
    ? outputPath.replace(/\.mp4$/i, `-test-${durationTest}s.mp4`)
    : outputPath;
  const tempPath = finalPath.replace(/\.mp4$/i, `.${process.pid}.${Date.now()}.tmp.mp4`);
  const posterPath = finalPath.replace(/\.mp4$/i, '-poster.png');
  const tempPosterPath = posterPath.replace(/\.png$/i, `.${process.pid}.${Date.now()}.tmp.png`);
  const renderDuration = durationTest > 0 ? durationTest : 0;
  const validExisting = !forceRender && validateFullSetVideo(finalPath, audio.probe, renderDuration);
  if (!noRender && validExisting?.ok) return { videoPath: finalPath, validation: validExisting, rendered: false };
  if (noRender) return { videoPath: finalPath, validation: validExisting, rendered: false };

  const oldFinalValidation = validateFullSetVideo(finalPath, audio.probe, renderDuration);
  if (!oldFinalValidation.ok) rmSync(finalPath, { force: true });

  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    coverPath,
    '-filter_complex',
    buildPosterFilter(set),
    '-map',
    '[vout]',
    '-frames:v',
    '1',
    tempPosterPath,
  ]);
  renameSync(tempPosterPath, posterPath);

  const ffmpegArgs = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-loop',
    '1',
    '-framerate',
    '1',
    '-i',
    posterPath,
    '-i',
    audio.filePath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-tune',
    'stillimage',
    '-profile:v',
    'high',
    '-level',
    '4.1',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-color_range',
    'tv',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-r',
    '1',
    '-c:a',
    'aac',
    '-b:a',
    '384k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-shortest',
    '-movflags',
    '+faststart',
  ];
  if (renderDuration > 0) ffmpegArgs.push('-t', String(renderDuration));
  ffmpegArgs.push(tempPath);

  await runFfmpegProgress(ffmpegArgs, renderDuration || audio.probe.duration, 'render');
  const validation = validateFullSetVideo(tempPath, audio.probe, renderDuration);
  if (!validation.ok) {
    rmSync(tempPath, { force: true });
    fail(`Rendered video failed validation: ${validation.reason}`);
  }
  renameSync(tempPath, finalPath);
  return { videoPath: finalPath, validation, rendered: true };
};

const validateShortVideo = (videoPath) => {
  const probe = probeMedia(videoPath);
  const videoStream = probe?.streams.find((stream) => stream.codec_type === 'video');
  const audioStream = probe?.streams.find((stream) => stream.codec_type === 'audio');
  const ok = Boolean(probe?.duration > 1 && videoStream && audioStream);
  return { ok, reason: ok ? 'ok' : 'short-video-invalid', probe };
};

const buildMetadata = (set, manifest) => {
  const title = uploadMode === 'short'
    ? (manifest?.captions?.youtubeShorts || `${set.title || 'AIRDOX'} | AIRDOX.INFO`)
    : `${set.title || 'AIRDOX LIVE SET'} | FULL SET | AIRDOX.INFO`;
  const landingUrl = manifest?.set?.landingUrl || `https://airdox.info/#set-${set.id}`;
  const description = [
    uploadMode === 'short'
      ? (manifest?.captions?.youtubeShorts || '')
      : `${set.title || 'AIRDOX LIVE SET'} - Full set upload`,
    '',
    `Full set: ${landingUrl}`,
    uploadMode === 'short' ? '#shorts #techno #berlintechno #airdox' : '#techno #berlintechno #djset #live #airdox',
  ].join('\n').trim();

  return {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      categoryId,
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  };
};

const setVideoPrivacy = async ({ accessToken, videoId, privacy }) => {
  const getRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(videoId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!getRes.ok) {
    const text = await getRes.text();
    fail(`YouTube status lookup failed (${getRes.status}): ${text}`);
  }
  const item = (await getRes.json()).items?.[0];
  if (!item) fail(`Video not found or not owned by this OAuth account: ${videoId}`);
  const body = {
    id: videoId,
    snippet: {
      categoryId: item.snippet.categoryId || categoryId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      tags: item.snippet.tags || undefined,
    },
    status: {
      ...item.status,
      privacyStatus: privacy,
      selfDeclaredMadeForKids: item.status?.selfDeclaredMadeForKids ?? false,
    },
  };
  const updateRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet,status', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  });
  if (!updateRes.ok) {
    const text = await updateRes.text();
    fail(`YouTube privacy update failed (${updateRes.status}): ${text}`);
  }
  return updateRes.json();
};

const startResumableSession = async ({ accessToken, metadata, videoPath }) => {
  const size = statSync(videoPath).size;
  const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'Content-Length': String(Buffer.byteLength(JSON.stringify(metadata))),
      'X-Upload-Content-Length': String(size),
      'X-Upload-Content-Type': 'video/mp4',
    },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) {
    const text = await response.text();
    fail(`YouTube resumable session failed (${response.status}): ${text}`);
  }
  const location = response.headers.get('location');
  if (!location) fail('YouTube resumable session did not return a Location header');
  return location;
};

const uploadResumable = async ({ accessToken, uploadUrl, videoPath }) => {
  const size = statSync(videoPath).size;
  const chunkSize = chunkMb * 1024 * 1024;
  const fd = openSync(videoPath, 'r');
  let offset = 0;
  try {
    while (offset < size) {
      const length = Math.min(chunkSize, size - offset);
      const buffer = Buffer.allocUnsafe(length);
      const bytesRead = readSync(fd, buffer, 0, length, offset);
      const start = offset;
      const end = offset + bytesRead - 1;
      const body = bytesRead === length ? buffer : buffer.subarray(0, bytesRead);
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Length': String(bytesRead),
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes ${start}-${end}/${size}`,
        },
        body,
      });
      if (response.status === 308) {
        const range = response.headers.get('range');
        offset = range ? Number(range.split('-').pop()) + 1 : end + 1;
        process.stderr.write(`[upload] ${Math.floor((offset / size) * 100)}% (${offset}/${size} bytes)\n`);
        continue;
      }
      if (!response.ok) {
        const text = await response.text();
        fail(`YouTube upload failed (${response.status}): ${text}`);
      }
      process.stderr.write('[upload] 100%\n');
      return response.json();
    }
  } finally {
    closeSync(fd);
  }
  fail('YouTube upload ended without a final response');
};

const runPipeline = async () => {
  if (publicOnlyVideoId) {
    const accessToken = await getAccessToken();
    const data = await setVideoPrivacy({ accessToken, videoId: publicOnlyVideoId, privacy: privacyStatus });
    process.stdout.write(`${JSON.stringify({
      status: 'privacy_updated',
      videoId: publicOnlyVideoId,
      privacyStatus: data.status?.privacyStatus || privacyStatus,
      youtubeUrl: `https://www.youtube.com/watch?v=${publicOnlyVideoId}`,
    }, null, 2)}\n`);
    return;
  }

  const { manifest, packageDir } = loadManifest();
  const set = await loadSet(manifest);
  const selectedPackageDir = packageDirForSet(set, packageDir);
  const metadata = buildMetadata(set, manifest);

  let audio = null;
  let coverPath = null;
  let videoPath = null;
  let validation = null;
  let rendered = false;

  if (uploadMode === 'short') {
    if (!manifest) fail('Short uploads require an existing social manifest.');
    videoPath = getShortVideoPath(manifest);
    validation = validateShortVideo(videoPath);
    if (!validation.ok) fail(`Short video failed validation: ${validation.reason}`);
  } else {
    audio = resolveAudioSource(set);
    coverPath = resolveCoverPath(set, manifest);
    ({ videoPath, validation, rendered } = await renderFullSetVideo({
      set,
      manifest,
      packageDir: selectedPackageDir,
      audio,
      coverPath,
    }));
    if (!dryRun && !validation.ok) fail(`Full-set video failed validation: ${validation.reason}`);
  }

  const summary = {
    pipeline: uploadMode === 'short'
      ? ['resolve-short-video', 'validate-video', 'upload-youtube']
      : ['resolve-source', 'render-youtube-video', 'validate-video', 'upload-youtube'],
    mode: dryRun ? 'dry-run' : renderOnly ? 'render-only' : validateOnly ? 'validate-only' : 'upload',
    uploadMode,
    set: {
      id: set.id,
      title: set.title,
      duration: set.duration,
    },
    packageDir: toRepoPath(selectedPackageDir),
    audio: audio ? {
      path: audio.filePath,
      duration: audio.probe.duration,
      durationDelta: audio.durationDelta,
      size: audio.probe.size,
    } : null,
    coverPath: coverPath ? toRepoPath(coverPath) : null,
    videoPath: toRepoPath(videoPath),
    rendered,
    validation: {
      ok: validation.ok,
      reason: validation.reason,
      duration: validation.probe?.duration || 0,
      size: validation.probe?.size || 0,
      streams: validation.probe?.streams || [],
    },
    snippet: metadata.snippet,
    status: metadata.status,
  };

  if (!shouldUpload) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  const accessToken = await getAccessToken();
  const uploadUrl = await startResumableSession({ accessToken, metadata, videoPath });
  const uploadData = await uploadResumable({ accessToken, uploadUrl, videoPath });
  process.stdout.write(`${JSON.stringify({
    ...summary,
    status: 'uploaded',
    videoId: uploadData.id || null,
    youtubeUrl: uploadData.id ? `https://www.youtube.com/watch?v=${uploadData.id}` : null,
    privacyStatus,
  }, null, 2)}\n`);
};

await runPipeline();
