#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.flac', '.aiff', '.aif', '.m4a', '.aac']);
const DEFAULT_OUTPUT_SUBDIR = '_mixcloud_tracklists';
const DEFAULT_WATCH_INTERVAL_MS = 5000;
const DEFAULT_CUE_STABLE_MS = 8000;
const DEFAULT_MIN_CONVERT_MINUTES = 60;

const usage = `
Usage:
  node scripts/generate-mixcloud-tracklists.mjs --input "<folder-or-cue-file>" [options]

Options:
  --output "<folder>"        Output folder (default: <input>/${DEFAULT_OUTPUT_SUBDIR})
  --mode cue|audd            cue = parse Rekordbox .cue files (default), audd = audio recognition fallback
  --watch                    Keep running and auto-process new/changed files
  --poll-interval <ms>       Watch poll interval in ms (default: ${DEFAULT_WATCH_INTERVAL_MS})
  --stable-ms <ms>           Wait this long before processing changed .cue in watch mode (default: ${DEFAULT_CUE_STABLE_MS})
  --skip-write-next-to-cue   Do not write .mixcloud.txt/.tracks.json next to the .cue file
  --skip-convert-wav-mp3     Do not convert recording .wav to .mp3
  --mp3-bitrate <k>          MP3 bitrate in kbit/s (default: 320)
  --target-lufs <value>      Loudness target for mp3 conversion (default: -14)
  --min-convert-minutes <n>  Convert only WAV files longer than this duration (default: ${DEFAULT_MIN_CONVERT_MINUTES})
  --audd-token "<token>"     AudD API token (required when --mode audd)
  --audd-every <n>           AudD enterprise "every" chunks (default: 1)
  --audd-skip <n>            AudD enterprise "skip" chunks (default: 4)
  --audd-limit <n>           AudD enterprise "limit" chunks (optional)
  --dedupe-window <sec>      Dedupe same track within seconds (default: 45)
  --help                     Show this help
`;

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isCueFile = (filePath) => path.extname(filePath).toLowerCase() === '.cue';
const isAudioFile = (filePath) => AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const pad2 = (value) => String(value).padStart(2, '0');

const formatHhMmSs = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const timestampToSeconds = (value = '', isCue = false) => {
  const parts = String(value)
    .trim()
    .split(':')
    .map((chunk) => Number.parseInt(chunk, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;

  if (parts.length === 3) {
    if (isCue) {
      // CUE format is MM:SS:FF (Minutes:Seconds:Frames)
      // Frames (FF) are 1/75th of a second, we usually ignore them for tracklists
      const [minutes, seconds, frames] = parts;
      return minutes * 60 + seconds;
    }
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return null;
};

const normalizeTimestamp = (value = '', isCue = false) => {
  const seconds = timestampToSeconds(value, isCue);
  if (seconds === null) return '';
  return formatHhMmSs(seconds);
};

const getTrackTimestamp = (track = {}, isCue = false) => {
  const candidate = [track.time, track.timestamp]
    .map((value) => String(value ?? '').trim())
    .find(Boolean) || '';
  return normalizeTimestamp(candidate, isCue) || '00:00:00';
};

const normalizeTrackExport = (track = {}) => {
  const timestamp = getTrackTimestamp(track);
  return {
    ...track,
    artist: String(track.artist || '').trim(),
    title: String(track.title || '').trim(),
    time: timestamp,
    timestamp,
  };
};

const stripQuotes = (value = '') => {
  const trimmed = String(value).trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseArtistTitleFromFilename = (filePath = '') => {
  const stem = path.basename(filePath, path.extname(filePath)).replace(/^\d+\.\s*/, '').trim();
  const splitters = [' - ', ' – ', ' — ', ' | ', '_'];
  for (const splitter of splitters) {
    if (!stem.includes(splitter)) continue;
    const parts = stem.split(splitter);
    if (parts.length >= 2) {
      return {
        artist: parts[0]?.trim() || '',
        title: parts.slice(1).join(splitter).trim() || '',
      };
    }
  }
  return { artist: '', title: stem };
};

const parseCueContent = (content) => {
  const lines = String(content).split(/\r?\n/);
  const tracks = [];
  let albumPerformer = '';
  let recordingFile = '';
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    tracks.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const trackStart = line.match(/^TRACK\s+(\d+)\s+AUDIO$/i);
    if (trackStart) {
      flushCurrent();
      current = {
        index: Number.parseInt(trackStart[1], 10),
        artist: '',
        title: '',
        timestamp: '',
        sourceFile: '',
      };
      continue;
    }

    const performerMatch = line.match(/^PERFORMER\s+(.+)$/i);
    if (performerMatch) {
      const performer = stripQuotes(performerMatch[1]);
      if (current) current.artist = performer;
      else albumPerformer = performer;
      continue;
    }

    const titleMatch = line.match(/^TITLE\s+(.+)$/i);
    if (titleMatch && current) {
      current.title = stripQuotes(titleMatch[1]);
      continue;
    }

    const fileMatch = line.match(/^FILE\s+(.+?)\s+\w+$/i);
    if (fileMatch) {
      const parsedFile = stripQuotes(fileMatch[1]);
      if (current) {
        current.sourceFile = parsedFile;
      } else if (!recordingFile) {
        recordingFile = parsedFile;
      }
      continue;
    }

    const indexMatch = line.match(/^INDEX\s+01\s+(.+)$/i);
    if (indexMatch && current) {
      current.timestamp = normalizeTimestamp(indexMatch[1], true);
      continue;
    }
  }

  flushCurrent();

  const parsedTracks = tracks
    .map((track) => {
      const derived = parseArtistTitleFromFilename(track.sourceFile);
      const artist = track.artist || albumPerformer || derived.artist || 'Unknown Artist';
      const title = track.title || derived.title || `Track ${track.index || '?'}`;
      return {
        ...track,
        artist: artist.trim(),
        title: title.trim(),
        timestamp: track.timestamp || '00:00:00',
      };
    })
    .filter((track) => track.title);

  return {
    tracks: parsedTracks,
    recordingFile,
  };
};

const toMixcloudLines = (tracks = []) => tracks.map((track) => `${track.artist} - ${track.title} - ${getTrackTimestamp(track)}`);

const walkFiles = async (rootPath) => {
  const result = [];
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const resolved = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(resolved);
      } else if (entry.isFile()) {
        result.push(resolved);
      }
    }
  }
  return result;
};

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const fileExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const runBinary = async (command, args = []) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.on('error', reject);
  child.on('close', (code) => {
    resolve({
      ok: code === 0,
      code,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  });
});

let ffmpegAvailablePromise = null;
const hasFfmpeg = async () => {
  if (!ffmpegAvailablePromise) {
    ffmpegAvailablePromise = runBinary('ffmpeg', ['-version'])
      .then((result) => result.ok)
      .catch(() => false);
  }
  return ffmpegAvailablePromise;
};

let ffprobeAvailablePromise = null;
const hasFfprobe = async () => {
  if (!ffprobeAvailablePromise) {
    ffprobeAvailablePromise = runBinary('ffprobe', ['-version'])
      .then((result) => result.ok)
      .catch(() => false);
  }
  return ffprobeAvailablePromise;
};

const getAudioDurationSeconds = async (audioPath) => {
  const ffprobeReady = await hasFfprobe();
  if (!ffprobeReady) return null;
  const result = await runBinary('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    audioPath,
  ]);
  if (!result.ok) return null;
  const parsed = Number.parseFloat(String(result.stdout || '').trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const resolveCueRecordingWavPath = async (cuePath, recordingFileFromCue) => {
  const cueDir = path.dirname(cuePath);
  if (recordingFileFromCue) {
    const normalizedHint = recordingFileFromCue.replace(/[/\\]+/g, path.sep);
    const resolved = path.isAbsolute(normalizedHint)
      ? normalizedHint
      : path.resolve(cueDir, normalizedHint);
    if (await fileExists(resolved)) {
      return resolved;
    }
  }

  const cueBase = path.basename(cuePath, path.extname(cuePath)).toLowerCase();
  const siblingFiles = await fs.readdir(cueDir, { withFileTypes: true });
  const wavCandidates = siblingFiles
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.wav')
    .map((entry) => path.join(cueDir, entry.name));

  if (!wavCandidates.length) return '';
  const bestCandidate = wavCandidates.find((candidate) =>
    path.basename(candidate, path.extname(candidate)).toLowerCase() === cueBase) || wavCandidates[0];
  return bestCandidate;
};

const convertWavToMp3 = async ({
  cuePath,
  recordingFileFromCue,
  mp3BitrateKbps = 320,
  targetLufs = -14,
  minConvertMinutes = DEFAULT_MIN_CONVERT_MINUTES,
}) => {
  const wavPath = await resolveCueRecordingWavPath(cuePath, recordingFileFromCue);
  if (!wavPath) {
    return { status: 'skipped-no-wav' };
  }

  const durationSeconds = await getAudioDurationSeconds(wavPath);
  if (!Number.isFinite(durationSeconds)) {
    return { status: 'skipped-no-duration', wavPath };
  }

  const minSeconds = Math.max(0, Number.parseFloat(String(minConvertMinutes)) || DEFAULT_MIN_CONVERT_MINUTES) * 60;
  if (durationSeconds < minSeconds) {
    return {
      status: 'skipped-short',
      wavPath,
      durationSeconds,
      minSeconds,
    };
  }

  const ffmpegReady = await hasFfmpeg();
  if (!ffmpegReady) {
    return { status: 'skipped-no-ffmpeg', wavPath };
  }

  const mp3Path = wavPath.replace(/\.wav$/i, '.mp3');
  const wavStat = await fs.stat(wavPath);
  if (await fileExists(mp3Path)) {
    const mp3Stat = await fs.stat(mp3Path);
    if (mp3Stat.mtimeMs >= wavStat.mtimeMs) {
      return { status: 'up-to-date', wavPath, mp3Path, durationSeconds };
    }
  }

  const bitrate = `${Math.max(64, Number.parseInt(String(mp3BitrateKbps), 10) || 320)}k`;
  const lufsValue = Number.parseFloat(String(targetLufs));
  const normalizedLufs = Number.isFinite(lufsValue) ? lufsValue : -14;

  const result = await runBinary('ffmpeg', [
    '-y',
    '-i',
    wavPath,
    '-vn',
    '-af',
    `loudnorm=I=${normalizedLufs}:LRA=11:TP=-1.5`,
    '-codec:a',
    'libmp3lame',
    '-b:a',
    bitrate,
    mp3Path,
  ]);

  if (!result.ok) {
    throw new Error(`ffmpeg convert failed for ${path.basename(wavPath)}: ${result.stderr || result.stdout || 'unknown error'}`);
  }

  return { status: 'converted', wavPath, mp3Path, durationSeconds };
};

const getSourceDescriptor = async (inputRoot, mode) => {
  const stat = await fs.stat(inputRoot);
  const isDirectory = stat.isDirectory();
  if (isDirectory) {
    return {
      isDirectory: true,
      scanRoot: inputRoot,
    };
  }

  if (mode === 'cue' && !isCueFile(inputRoot)) {
    throw new Error(`Input is a file but not .cue: ${inputRoot}`);
  }
  if (mode === 'audd' && !isAudioFile(inputRoot)) {
    throw new Error(`Input is a file but not supported audio: ${inputRoot}`);
  }

  return {
    isDirectory: false,
    scanRoot: path.dirname(inputRoot),
  };
};

const listSourceFiles = async ({ inputRoot, mode, isDirectory }) => {
  if (!isDirectory) return [inputRoot];
  const allFiles = await walkFiles(inputRoot);
  if (mode === 'cue') {
    return allFiles.filter(isCueFile);
  }
  return allFiles.filter(isAudioFile);
};

const makeOutputBase = (inputRoot, outputRoot, sourceFile) => {
  const rel = path.relative(inputRoot, sourceFile);
  const relNoExt = rel.replace(/\.[^.]+$/, '');
  return path.join(outputRoot, relNoExt);
};

const dedupeTracks = (tracks = [], dedupeWindowSeconds = 45) => {
  const deduped = [];
  const lastSeen = new Map();

  for (const track of tracks) {
    const key = `${track.artist}:::${track.title}`.toLowerCase();
    const atSeconds = timestampToSeconds(getTrackTimestamp(track)) ?? 0;
    const previous = lastSeen.get(key);

    if (typeof previous === 'number' && atSeconds - previous <= dedupeWindowSeconds) {
      continue;
    }

    lastSeen.set(key, atSeconds);
    deduped.push(track);
  }
  return deduped;
};

const writeTracklistFiles = async ({ tracks, inputRoot, outputRoot, sourceFile, suffix = '' }) => {
  const outputBase = makeOutputBase(inputRoot, outputRoot, sourceFile);
  await ensureDir(path.dirname(outputBase));

  const jsonPath = `${outputBase}${suffix}.tracks.json`;
  const textPath = `${outputBase}${suffix}.mixcloud.txt`;
  const normalizedTracks = tracks.map(normalizeTrackExport);
  const lines = toMixcloudLines(normalizedTracks);

  await fs.writeFile(jsonPath, JSON.stringify({ sourceFile, tracks: normalizedTracks }, null, 2), 'utf8');
  await fs.writeFile(textPath, `${lines.join('\n')}\n`, 'utf8');

  return { jsonPath, textPath, trackCount: normalizedTracks.length };
};

const writeTracklistNextToCue = async ({ tracks, cuePath }) => {
  const base = cuePath.replace(/\.[^.]+$/, '');
  const jsonPath = `${base}.tracks.json`;
  const textPath = `${base}.mixcloud.txt`;
  const normalizedTracks = tracks.map(normalizeTrackExport);
  const lines = toMixcloudLines(normalizedTracks);
  await fs.writeFile(jsonPath, JSON.stringify({ sourceFile: cuePath, tracks: normalizedTracks }, null, 2), 'utf8');
  await fs.writeFile(textPath, `${lines.join('\n')}\n`, 'utf8');
  return {
    localJsonPath: jsonPath,
    localTextPath: textPath,
  };
};

const parseAuddResult = (payload = {}, dedupeWindowSeconds = 45) => {
  const chunks = Array.isArray(payload.result) ? payload.result : [];
  const rawTracks = [];
  for (const chunk of chunks) {
    const firstSong = Array.isArray(chunk?.songs) ? chunk.songs[0] : null;
    if (!firstSong) continue;
    const artist = String(firstSong.artist || '').trim();
    const title = String(firstSong.title || '').trim();
    const timestamp = normalizeTimestamp(firstSong.timecode || '');
    if (!artist && !title) continue;
    rawTracks.push({
      artist: artist || 'Unknown Artist',
      title: title || 'Unknown Title',
      timestamp: timestamp || '00:00:00',
      score: firstSong.score ?? null,
    });
  }

  return dedupeTracks(rawTracks, dedupeWindowSeconds);
};

const recognizeWithAudd = async ({
  filePath,
  token,
  every = 1,
  skip = 4,
  limit = undefined,
}) => {
  const fileBuffer = await fs.readFile(filePath);
  const formData = new FormData();
  formData.append('api_token', token);
  formData.append('file', new Blob([fileBuffer]), path.basename(filePath));
  formData.append('accurate_offsets', 'true');
  formData.append('every', String(every));
  formData.append('skip', String(skip));
  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    formData.append('limit', String(limit));
  }

  const response = await fetch('https://enterprise.audd.io/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AudD request failed (${response.status}): ${body.slice(0, 250)}`);
  }

  const json = await response.json();
  if (json?.status !== 'success') {
    throw new Error(`AudD returned non-success status: ${JSON.stringify(json).slice(0, 250)}`);
  }
  return json;
};

const writeSummary = async ({ outputRoot, mode, items, summaryName = '_summary.json' }) => {
  const summaryPath = path.join(outputRoot, summaryName);
  await fs.writeFile(summaryPath, JSON.stringify({
    createdAt: new Date().toISOString(),
    mode,
    items,
  }, null, 2), 'utf8');
  return summaryPath;
};

const processCueFile = async ({
  scanRoot,
  outputRoot,
  sourceFile,
  dedupeWindowSeconds,
  writeNextToCue,
  convertRecordingToMp3,
  mp3BitrateKbps,
  targetLufs,
  minConvertMinutes,
}) => {
  const content = await fs.readFile(sourceFile, 'utf8');
  const parsedCue = parseCueContent(content);
  const deduped = dedupeTracks(parsedCue.tracks, dedupeWindowSeconds);
  const outputs = await writeTracklistFiles({
    tracks: deduped,
    inputRoot: scanRoot,
    outputRoot,
    sourceFile,
  });

  const localOutputs = writeNextToCue
    ? await writeTracklistNextToCue({ tracks: deduped, cuePath: sourceFile })
    : { localJsonPath: '', localTextPath: '' };

  const mp3Info = convertRecordingToMp3
    ? await convertWavToMp3({
      cuePath: sourceFile,
      recordingFileFromCue: parsedCue.recordingFile,
      mp3BitrateKbps,
      targetLufs,
      minConvertMinutes,
    })
    : { status: 'skipped-disabled' };

  return {
    mode: 'cue',
    source: sourceFile,
    ...outputs,
    ...localOutputs,
    recordingFile: parsedCue.recordingFile || '',
    mp3Status: mp3Info.status,
    durationSeconds: mp3Info.durationSeconds || null,
    wavPath: mp3Info.wavPath || '',
    mp3Path: mp3Info.mp3Path || '',
  };
};

const processAuddFile = async ({
  scanRoot,
  outputRoot,
  sourceFile,
  token,
  every,
  skip,
  limit,
  dedupeWindowSeconds,
}) => {
  const payload = await recognizeWithAudd({
    filePath: sourceFile,
    token,
    every,
    skip,
    limit,
  });
  const tracks = parseAuddResult(payload, dedupeWindowSeconds);
  const outputs = await writeTracklistFiles({
    tracks,
    inputRoot: scanRoot,
    outputRoot,
    sourceFile,
    suffix: '.audd',
  });
  return {
    mode: 'audd',
    source: sourceFile,
    ...outputs,
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage);
    process.exit(0);
  }

  const inputRoot = args.input ? path.resolve(String(args.input)) : '';
  if (!inputRoot) {
    throw new Error(`Missing --input argument.\n${usage}`);
  }

  const mode = String(args.mode || 'cue').toLowerCase();
  const isWatchMode = Boolean(args.watch);
  const pollIntervalMs = Math.max(1000, toInt(args['poll-interval'], DEFAULT_WATCH_INTERVAL_MS));
  const stableMs = Math.max(1000, toInt(args['stable-ms'], DEFAULT_CUE_STABLE_MS));
  const dedupeWindowSeconds = toInt(args['dedupe-window'], 45);
  const writeNextToCue = mode === 'cue' && !Boolean(args['skip-write-next-to-cue']);
  const convertRecordingToMp3 = mode === 'cue' && !Boolean(args['skip-convert-wav-mp3']);
  const mp3BitrateKbps = Math.max(64, toInt(args['mp3-bitrate'], 320));
  const targetLufs = Number.parseFloat(String(args['target-lufs'] ?? '-14'));
  const minConvertMinutes = Math.max(0, Number.parseFloat(String(args['min-convert-minutes'] ?? DEFAULT_MIN_CONVERT_MINUTES)));
  if (mode !== 'cue' && mode !== 'audd') {
    throw new Error(`Unsupported mode "${mode}". Use "cue" or "audd".`);
  }

  const sourceDescriptor = await getSourceDescriptor(inputRoot, mode);
  const outputRoot = path.resolve(
    String(args.output || path.join(sourceDescriptor.isDirectory ? inputRoot : path.dirname(inputRoot), DEFAULT_OUTPUT_SUBDIR)),
  );
  await ensureDir(outputRoot);

  const auddConfig = mode === 'audd'
    ? {
      token: String(args['audd-token'] || '').trim(),
      every: toInt(args['audd-every'], 1),
      skip: toInt(args['audd-skip'], 4),
      limit: args['audd-limit'] ? toInt(args['audd-limit'], undefined) : undefined,
    }
    : null;

  if (mode === 'audd' && !auddConfig?.token) {
    throw new Error('Missing --audd-token for --mode audd.');
  }

  const processByMode = async (sourceFile) => {
    if (mode === 'cue') {
      return processCueFile({
        scanRoot: sourceDescriptor.scanRoot,
        outputRoot,
        sourceFile,
        dedupeWindowSeconds,
        writeNextToCue,
        convertRecordingToMp3,
        mp3BitrateKbps,
        targetLufs: Number.isFinite(targetLufs) ? targetLufs : -14,
        minConvertMinutes,
      });
    }

    return processAuddFile({
      scanRoot: sourceDescriptor.scanRoot,
      outputRoot,
      sourceFile,
      token: auddConfig.token,
      every: auddConfig.every,
      skip: auddConfig.skip,
      limit: auddConfig.limit,
      dedupeWindowSeconds,
    });
  };

  const runOnce = async () => {
    const sourceFiles = await listSourceFiles({
      inputRoot,
      mode,
      isDirectory: sourceDescriptor.isDirectory,
    });

    if (!sourceFiles.length) {
      throw new Error(`No ${mode === 'cue' ? '.cue' : 'audio'} files found under: ${inputRoot}`);
    }

    const summary = [];
    for (const sourceFile of sourceFiles) {
      const item = await processByMode(sourceFile);
      summary.push(item);
    }

    const summaryPath = await writeSummary({ outputRoot, mode, items: summary });
    console.log(`Done. Generated ${summary.length} tracklist file set(s).`);
    console.log(`Output directory: ${outputRoot}`);
    console.log(`Summary: ${summaryPath}`);
    for (const item of summary) {
      console.log(`- ${item.source}`);
      console.log(`  -> ${item.textPath}`);
      console.log(`  tracks: ${item.trackCount}`);
      if (item.localTextPath) {
        console.log(`  local: ${item.localTextPath}`);
      }
      if (item.mp3Status) {
        const durationLabel = Number.isFinite(item.durationSeconds) ? `, ${Math.round(item.durationSeconds / 60)}min` : '';
        console.log(`  mp3: ${item.mp3Status}${durationLabel}${item.mp3Path ? ` (${item.mp3Path})` : ''}`);
      }
    }
  };

  if (!isWatchMode) {
    await runOnce();
    return;
  }

  console.log(`Watch mode active (${mode}). Poll interval: ${pollIntervalMs}ms`);
  console.log(`Input: ${inputRoot}`);
  console.log(`Output: ${outputRoot}`);
  if (mode === 'cue') {
    console.log(`Cue stability wait: ${stableMs}ms`);
    console.log(`Write next to cue: ${writeNextToCue ? 'yes' : 'no'}`);
    console.log(`WAV->MP3 convert: ${convertRecordingToMp3 ? `yes (${mp3BitrateKbps}k, I=${Number.isFinite(targetLufs) ? targetLufs : -14} LUFS, min ${minConvertMinutes}min)` : 'no'}`);
  }

  const fileSignatures = new Map();
  const pendingStability = new Map();
  const processedItems = new Map();
  let running = false;

  const runCycle = async () => {
    if (running) return;
    running = true;
    try {
      const sourceFiles = await listSourceFiles({
        inputRoot,
        mode,
        isDirectory: sourceDescriptor.isDirectory,
      });

      for (const sourceFile of sourceFiles) {
        const stat = await fs.stat(sourceFile);
        const signature = `${stat.size}:${Math.floor(stat.mtimeMs)}`;
        const previous = fileSignatures.get(sourceFile);

        if (mode === 'cue') {
          if (signature === previous) {
            pendingStability.delete(sourceFile);
            continue;
          }

          const now = Date.now();
          const pending = pendingStability.get(sourceFile);
          if (!pending || pending.signature !== signature) {
            pendingStability.set(sourceFile, { signature, firstSeenAt: now });
            continue;
          }

          if (now - pending.firstSeenAt < stableMs) {
            continue;
          }
        } else if (signature === previous) {
          continue;
        }

        pendingStability.delete(sourceFile);
        fileSignatures.set(sourceFile, signature);
        const item = await processByMode(sourceFile);
        processedItems.set(sourceFile, item);
        await writeSummary({
          outputRoot,
          mode,
          items: [...processedItems.values()],
          summaryName: '_summary.watch.json',
        });
        console.log(`[watch] updated: ${sourceFile}`);
        console.log(`        -> ${item.textPath} (${item.trackCount} tracks)`);
        if (item.localTextPath) {
          console.log(`        -> local ${item.localTextPath}`);
        }
        if (item.mp3Status) {
          const durationLabel = Number.isFinite(item.durationSeconds) ? `, ${Math.round(item.durationSeconds / 60)}min` : '';
          console.log(`        -> mp3 ${item.mp3Status}${durationLabel}${item.mp3Path ? ` (${item.mp3Path})` : ''}`);
        }
      }
    } catch (error) {
      console.error(`[watch] cycle error: ${error.message}`);
    } finally {
      running = false;
    }
  };

  await runCycle();

  const timer = setInterval(() => {
    runCycle().catch((error) => {
      console.error(`[watch] ${error.message}`);
    });
  }, pollIntervalMs);

  const shutdown = () => {
    clearInterval(timer);
    console.log('Watch mode stopped.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await new Promise(() => {
    // keep alive in watch mode
  });
};

main().catch((error) => {
  console.error(`[tracklist-automation] ${error.message}`);
  process.exit(1);
});
