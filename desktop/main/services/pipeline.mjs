import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFile } from 'music-metadata';
import {
  AUDIO_EXTENSIONS,
  DEFAULT_FLIGHT_DECK_SETTINGS,
  IMAGE_EXTENSIONS,
  TRACKLIST_EXTENSIONS,
  buildDraftFromImportedFiles,
  extractFilename,
  parseDateHint,
  resolveUniqueSetDraftIdentity,
} from '../../../src/desktop/lib/setManifest.js';
import { seedTrackStats } from './database.mjs';
import { readSets, upsertSet } from './manifest.mjs';
import { uploadAudioFile } from './r2.mjs';
import { ensureDirectory, getWorkspacePaths, getGitStatus, isWorkspaceRoot, runCommand } from './workspace.mjs';

const matchesExtension = (filePath, extensions) => extensions.includes(path.extname(filePath).toLowerCase());

const getTracklistPriority = (filePath = '') => {
  const filename = path.basename(filePath).toLowerCase();
  const ext = path.extname(filename);
  if (filename.endsWith('.tracks.json')) return 0;
  if (filename.endsWith('.mixcloud.txt')) return 1;
  if (ext === '.cue') return 2;
  if (ext === '.txt' || ext === '.md') return 3;
  if (ext === '.json') return 4;
  if (ext === '.csv') return 5;
  return 99;
};

const findPreferredTracklistPath = (filePaths = []) => {
  const tracklistPaths = filePaths.filter((candidate) => matchesExtension(candidate, TRACKLIST_EXTENSIONS));
  return tracklistPaths
    .sort((left, right) => getTracklistPriority(left) - getTracklistPriority(right))[0] || '';
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const stripTextBom = (value = '') => String(value || '').replace(/^\uFEFF/, '');

const swapUtf16Bytes = (buffer) => {
  const swapped = Buffer.alloc(buffer.length);
  for (let index = 0; index < buffer.length - 1; index += 2) {
    swapped[index] = buffer[index + 1];
    swapped[index + 1] = buffer[index];
  }
  if (buffer.length % 2 === 1) {
    swapped[buffer.length - 1] = buffer[buffer.length - 1];
  }
  return swapped;
};

export const decodeTracklistBuffer = (buffer = Buffer.alloc(0)) => {
  if (!buffer?.length) return '';

  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return stripTextBom(buffer.toString('utf8', 3));
  }

  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return stripTextBom(buffer.toString('utf16le', 2));
  }

  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return stripTextBom(swapUtf16Bytes(buffer.subarray(2)).toString('utf16le'));
  }

  const sampleLength = Math.min(buffer.length, 2048);
  let oddNulls = 0;
  let evenNulls = 0;
  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index % 2 === 0) evenNulls += 1;
    else oddNulls += 1;
  }

  if (oddNulls > sampleLength * 0.2) {
    return stripTextBom(buffer.toString('utf16le'));
  }

  if (evenNulls > sampleLength * 0.2) {
    return stripTextBom(swapUtf16Bytes(buffer).toString('utf16le'));
  }

  return stripTextBom(buffer.toString('utf8'));
};

const readTextFile = async (filePath) => decodeTracklistBuffer(await fs.readFile(filePath));

const getAncestorDirs = (startDir, maxDepth = 8) => {
  const result = [];
  let current = path.resolve(startDir);
  for (let i = 0; i < maxDepth; i += 1) {
    result.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return result;
};

const buildTracklistCandidates = (audioPath) => {
  const dir = path.dirname(audioPath);
  const parsed = path.parse(audioPath);
  const baseNoExt = path.join(dir, parsed.name);
  const candidates = [
    `${baseNoExt}.tracks.json`,
    `${baseNoExt}.mixcloud.txt`,
    `${baseNoExt}.cue`,
    `${baseNoExt}.txt`,
    path.join(dir, '_mixcloud_tracklists', `${parsed.name}.tracks.json`),
    path.join(dir, '_mixcloud_tracklists', `${parsed.name}.mixcloud.txt`),
  ];

  const ancestors = getAncestorDirs(dir, 8);
  for (const ancestor of ancestors) {
    const rel = path.relative(ancestor, audioPath);
    if (!rel || rel.startsWith('..')) continue;
    const ext = path.extname(rel);
    const relNoExt = ext ? rel.slice(0, -ext.length) : rel;
    candidates.push(path.join(ancestor, '_mixcloud_tracklists', `${relNoExt}.tracks.json`));
    candidates.push(path.join(ancestor, '_mixcloud_tracklists', `${relNoExt}.mixcloud.txt`));
  }

  return [...new Set(candidates)];
};

const findCueSidecarTracklist = async (audioPath) => {
  const audioDir = path.dirname(audioPath);
  const audioFileName = path.basename(audioPath).toLowerCase();

  const entries = await fs.readdir(audioDir, { withFileTypes: true });
  const cuePaths = entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.cue')
    .map((entry) => path.join(audioDir, entry.name));

  if (!cuePaths.length) return '';

  const matchingCuePaths = [];
  for (const cuePath of cuePaths) {
    let content = '';
    try {
      content = await readTextFile(cuePath);
    } catch {
      content = '';
    }
    if (content.toLowerCase().includes(audioFileName)) {
      matchingCuePaths.push(cuePath);
    }
  }

  const targets = matchingCuePaths.length
    ? matchingCuePaths
    : (cuePaths.length === 1 ? cuePaths : []);

  for (const cuePath of targets) {
    const cueBase = path.join(audioDir, path.parse(cuePath).name);
    const sidecars = [`${cueBase}.tracks.json`, `${cueBase}.mixcloud.txt`, cuePath, `${cueBase}.txt`];
    for (const candidate of sidecars) {
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
  }

  return '';
};

const resolveTracklistPath = async ({ audioPath, explicitTracklistPath = '' }) => {
  if (explicitTracklistPath && await fileExists(explicitTracklistPath)) {
    return {
      tracklistPath: explicitTracklistPath,
      source: 'explicit',
    };
  }

  const cueSidecar = await findCueSidecarTracklist(audioPath);
  if (cueSidecar) {
    return {
      tracklistPath: cueSidecar,
      source: 'cue-sidecar',
    };
  }

  const autoCandidates = buildTracklistCandidates(audioPath);
  for (const candidate of autoCandidates) {
    if (await fileExists(candidate)) {
      return {
        tracklistPath: candidate,
        source: 'auto',
      };
    }
  }

  return {
    tracklistPath: '',
    source: 'none',
  };
};

const getAudioDurationSeconds = async (audioPath) => {
  try {
    const metadata = await parseFile(audioPath, { duration: true });
    const durationSeconds = metadata.format.duration;
    return Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null;
  } catch {
    return null;
  }
};

const audioDurationsAreCompatible = (sourceDurationSeconds, targetDurationSeconds) => {
  if (!Number.isFinite(sourceDurationSeconds) || sourceDurationSeconds <= 0) return true;
  if (!Number.isFinite(targetDurationSeconds) || targetDurationSeconds <= 0) return false;
  const toleranceSeconds = Math.max(3, sourceDurationSeconds * 0.01);
  return Math.abs(sourceDurationSeconds - targetDurationSeconds) <= toleranceSeconds;
};

const convertWavToMp3 = async (wavPath, workspaceRoot) => {
  const dir = path.dirname(wavPath);
  const basename = path.parse(wavPath).name;
  const mp3Path = path.join(dir, `${basename}.mp3`);

  const ffmpegCheck = await runCommand({ command: 'ffmpeg -version', cwd: workspaceRoot });
  if (!ffmpegCheck.ok) {
    throw new Error('ffmpeg is not installed. Please install ffmpeg to convert WAV files to MP3.');
  }

  const wavStat = await fs.stat(wavPath);
  try {
    const mp3Stat = await fs.stat(mp3Path);
    if (mp3Stat.mtimeMs >= wavStat.mtimeMs) {
      const [wavDurationSeconds, mp3DurationSeconds] = await Promise.all([
        getAudioDurationSeconds(wavPath),
        getAudioDurationSeconds(mp3Path),
      ]);
      if (audioDurationsAreCompatible(wavDurationSeconds, mp3DurationSeconds)) {
        return {
          mp3Path,
          converted: false,
        };
      }
    }
  } catch {
    // MP3 does not exist yet, continue with conversion.
  }

  const convertResult = await runCommand({
    command: `ffmpeg -hide_banner -loglevel error -y -i "${wavPath}" -vn -af "loudnorm=I=-14:LRA=11:TP=-1.5" -codec:a libmp3lame -b:a 320k "${mp3Path}"`,
    cwd: workspaceRoot,
  });

  if (!convertResult.ok) {
    throw new Error(`Failed to convert WAV to MP3: ${convertResult.stderr || convertResult.stdout}`);
  }

  return {
    mp3Path,
    converted: true,
  };
};

const ensureMp3Format = async (audioPath, workspaceRoot) => {
  const ext = path.extname(audioPath).toLowerCase();

  if (ext === '.wav' || ext === '.wave') {
    const conversion = await convertWavToMp3(audioPath, workspaceRoot);
    return {
      converted: conversion.converted,
      filePath: conversion.mp3Path,
      originalPath: audioPath,
    };
  }

  return {
    converted: false,
    filePath: audioPath,
    originalPath: audioPath,
  };
};

const dataUrlToBuffer = (dataUrl) => {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error('Invalid embedded cover data.');
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const getCoverExtension = (contentType = 'image/jpeg') => {
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  return '.jpg';
};

const writeEmbeddedCover = async (workspaceRoot, setId, dataUrl) => {
  const { coverOutputDir } = getWorkspacePaths(workspaceRoot);
  await ensureDirectory(coverOutputDir);
  const { contentType, buffer } = dataUrlToBuffer(dataUrl);
  const ext = getCoverExtension(contentType);
  const filename = `${setId}${ext}`;
  const targetPath = path.join(coverOutputDir, filename);
  await fs.writeFile(targetPath, buffer);
  return {
    targetPath,
    relativePath: `/assets/${filename}`,
  };
};

const copyCoverFile = async (workspaceRoot, sourcePath) => {
  const { coverOutputDir } = getWorkspacePaths(workspaceRoot);
  await ensureDirectory(coverOutputDir);
  const filename = extractFilename(sourcePath);
  const targetPath = path.join(coverOutputDir, filename);
  if (path.resolve(sourcePath) !== path.resolve(targetPath)) {
    await fs.copyFile(sourcePath, targetPath);
  }
  return {
    targetPath,
    relativePath: `/assets/${filename}`,
  };
};

const getTracklistText = async (tracklistPath) => {
  if (!tracklistPath) return '';
  return readTextFile(tracklistPath);
};

const pushLog = (logs, step, status, detail) => {
  logs.push({
    timestamp: new Date().toISOString(),
    step,
    status,
    detail,
  });
};

const TRACK_TIME_PATTERN = /^\d{1,2}:\d{2}(?::\d{2})?$/;

const hasSeekableTrackTime = (value = '') => {
  const raw = String(value || '').trim();
  if (!TRACK_TIME_PATTERN.test(raw)) return false;
  const parts = raw.split(':').map((part) => Number.parseInt(part, 10));
  const minutes = parts[parts.length - 2];
  const seconds = parts[parts.length - 1];
  return Number.isFinite(minutes)
    && Number.isFinite(seconds)
    && minutes <= 59
    && seconds <= 59;
};

const getSeekableTrackCount = (tracks = []) => {
  if (!Array.isArray(tracks)) return 0;
  return tracks.filter((track) => (
    hasSeekableTrackTime(track?.time || track?.timestamp)
    && (String(track?.artist || '').trim() || String(track?.title || '').trim())
  )).length;
};

const getSeekableTracks = (tracks = []) => {
  if (!Array.isArray(tracks)) return [];
  return tracks.filter((track) => (
    hasSeekableTrackTime(track?.time || track?.timestamp)
    && (String(track?.artist || '').trim() || String(track?.title || '').trim())
  ));
};

const fetchTextOrThrow = async (url) => {
  const response = await fetch(url, {
    headers: { 'cache-control': 'no-cache' },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }
  return response.text();
};

const getScriptAssetUrls = (html = '', siteUrl = '') => {
  const matches = [...String(html).matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js[^"']*)["'][^>]*>/gi)];
  return matches.map((match) => new URL(match[1], siteUrl).href);
};

const verifyLiveBundle = async ({ siteUrl, publishDraft }) => {
  const baseUrl = String(siteUrl || DEFAULT_FLIGHT_DECK_SETTINGS.liveSiteUrl).trim();
  const verifyUrl = new URL(baseUrl);
  verifyUrl.searchParams.set('flightdeckVerify', String(Date.now()));

  const html = await fetchTextOrThrow(verifyUrl.href);
  const scriptUrls = getScriptAssetUrls(html, verifyUrl.href);
  if (!scriptUrls.length) {
    throw new Error(`Live verify failed: no JavaScript bundle found at ${baseUrl}`);
  }

  const bundleText = (await Promise.all(scriptUrls.map(fetchTextOrThrow))).join('\n');
  const seekableTracks = getSeekableTracks(publishDraft.tracks);
  const firstTrack = seekableTracks[0];
  const lastTrack = seekableTracks[seekableTracks.length - 1];
  const requiredTokens = [
    publishDraft.id,
    publishDraft.title,
    firstTrack?.time,
    firstTrack?.title,
    lastTrack?.time,
    lastTrack?.title,
  ].map((token) => String(token || '').trim()).filter(Boolean);

  const missingTokens = requiredTokens.filter((token) => !bundleText.includes(token));
  if (missingTokens.length > 0) {
    throw new Error(`Live verify failed: deployed bundle is missing ${missingTokens.join(', ')}`);
  }

  return {
    siteUrl: baseUrl,
    scriptCount: scriptUrls.length,
    checkedTokens: requiredTokens.length,
  };
};

const quotePath = (relativePath) => `"${relativePath.replace(/\\/g, '\\\\')}"`;

const readExistingSetsForSettings = async (settings = {}) => {
  const workspaceRoot = String(settings.workspaceRoot || '').trim();
  if (!workspaceRoot || !(await isWorkspaceRoot(workspaceRoot))) return [];
  return readSets(workspaceRoot);
};

export const prepareImportBundle = async ({
  filePaths = [],
  settings = DEFAULT_FLIGHT_DECK_SETTINGS,
  reservedSetIds = [],
  reservedSetTitles = [],
  reservedSetFiles = [],
}) => {
  const mergedSettings = { ...DEFAULT_FLIGHT_DECK_SETTINGS, ...settings };
  const audioPath = filePaths.find((candidate) => matchesExtension(candidate, AUDIO_EXTENSIONS));
  if (!audioPath) {
    throw new Error('No supported audio file found in dropped files.');
  }

  // Check if the audio file is WAV format
  const audioExt = path.extname(audioPath).toLowerCase();
  const isWavFile = audioExt === '.wav' || audioExt === '.wave';

  const imagePath = filePaths.find((candidate) => matchesExtension(candidate, IMAGE_EXTENSIONS)) || '';
  const selectedTracklistPath = findPreferredTracklistPath(filePaths);
  const resolvedTracklist = await resolveTracklistPath({
    audioPath,
    explicitTracklistPath: selectedTracklistPath,
  });
  const tracklistPath = resolvedTracklist.tracklistPath;
  const metadata = await parseFile(audioPath, { duration: true });
  const tracklistText = await getTracklistText(tracklistPath);
  const audioStat = await fs.stat(audioPath);

  const parsedDate =
    parseDateHint(audioPath) ||
    parseDateHint(metadata.common.date || '') ||
    parseDateHint(audioStat.mtime.toISOString());

  const embeddedPicture = metadata.common.picture?.[0];
  const embeddedPictureDetected = Boolean(!imagePath && embeddedPicture);
  const embeddedCoverDataUrl = (embeddedPictureDetected && mergedSettings.extractEmbeddedCover)
    ? `data:${embeddedPicture.format};base64,${embeddedPicture.data.toString('base64')}`
    : '';
  const existingSets = await readExistingSetsForSettings(mergedSettings);

  const draft = buildDraftFromImportedFiles({
    audioPath,
    metadataTitle: metadata.common.title,
    durationSeconds: metadata.format.duration || 0,
    parsedDate,
    tracklistText,
    imagePath,
    embeddedCoverDataUrl,
    existingSets,
    reservedSetIds,
    reservedSetTitles,
    reservedSetFiles,
    defaultVinylColor: mergedSettings.defaultVinylColor,
    defaultCoverPath: mergedSettings.defaultCoverPath,
  });

  if (tracklistPath && tracklistText.trim() && getSeekableTrackCount(draft.tracks) === 0) {
    throw new Error(`Tracklist detected but no seekable timestamps were parsed: ${tracklistPath}. Use .tracks.json, Rekordbox .cue, pipe format "time | artist | title", or "Artist - Title - HH:MM:SS" before publishing.`);
  }
  if (tracklistPath && draft.tracklistValidation?.errors?.length) {
    throw new Error(`Tracklist validation failed: ${draft.tracklistValidation.errors.join(' ')}`);
  }

  if (isWavFile) {
    draft.file = draft.file.replace(/\.(wav|wave)$/i, '.mp3');
  }
  draft.sourceTracklistPath = tracklistPath;

  return {
    draft,
    detectedFiles: {
      audioPath,
      imagePath,
      tracklistPath,
    },
    warnings: [
      ...(isWavFile ? ['WAV file detected. It will be converted to MP3 before publish/deploy.'] : []),
      ...(resolvedTracklist.source === 'cue-sidecar'
        ? [`Tracklist auto-detected from cue sidecar: ${tracklistPath}`]
        : []),
      ...(resolvedTracklist.source === 'auto'
        ? [`Tracklist auto-detected: ${tracklistPath}`]
        : []),
      ...(tracklistPath && draft.tracks?.length
        ? [`Tracklist validated: ${draft.tracks.length} seekable tracks.`]
        : []),
      ...(tracklistPath && draft.tracklistValidation?.status
        ? [`Tracklist quality: ${draft.tracklistValidation.status}${draft.tracklistValidation.warnings?.length ? ` (${draft.tracklistValidation.warnings.length} warning${draft.tracklistValidation.warnings.length === 1 ? '' : 's'})` : ''}.`]
        : []),
      ...(tracklistPath && draft.tracklistValidation?.warnings?.length
        ? draft.tracklistValidation.warnings.map((warning) => `Tracklist warning: ${warning}`)
        : []),
      ...(draft.titleNeedsReview
        ? ['Set title needs review: only a generic recorder name/date was detected. Please enter a real set name before publishing.']
        : []),
      ...(!tracklistPath ? ['No tracklist file detected. You can add tracks manually before publishing.'] : []),
      ...(embeddedPictureDetected && !mergedSettings.extractEmbeddedCover
        ? [`Embedded cover detected but disabled. Default cover will be used: ${mergedSettings.defaultCoverPath}`]
        : []),
      ...(!imagePath && !embeddedPictureDetected
        ? [`No custom cover detected. Default cover will be used: ${mergedSettings.defaultCoverPath}`]
        : []),
    ],
  };
};

export const runWorkspaceCommand = async ({ workspaceRoot, command }) => {
  const result = await runCommand({ command, cwd: workspaceRoot });
  if (!result.ok) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${command}`);
  }
  return result;
};

export const publishSet = async ({ workspaceRoot, draft, settings = DEFAULT_FLIGHT_DECK_SETTINGS }) => {
  if (!(await isWorkspaceRoot(workspaceRoot))) {
    throw new Error('Workspace is not configured or invalid.');
  }

  const mergedSettings = { ...DEFAULT_FLIGHT_DECK_SETTINGS, ...settings };
  const logs = [];
  const changedPaths = [];
  const publishDraft = { ...draft };
  const defaultCoverPath = String(mergedSettings.defaultCoverPath || '/assets/airdox-vinyl.jpg').trim();
  const configuredCoverPolicy = Boolean(mergedSettings.extractEmbeddedCover);
  publishDraft.file = String(publishDraft.file || '').trim();

  if (!publishDraft.id || !publishDraft.title || !publishDraft.file) {
    throw new Error('Draft is missing required fields (id, title, file).');
  }

  if (publishDraft.sourceAudioPath || publishDraft.generatedBaseId || publishDraft.isNew) {
    const currentSets = await readSets(workspaceRoot);
    const resolvedIdentity = resolveUniqueSetDraftIdentity(publishDraft, {
      existingSets: currentSets,
    });
    if (
      resolvedIdentity.id !== publishDraft.id
      || resolvedIdentity.title !== publishDraft.title
      || resolvedIdentity.file !== publishDraft.file
    ) {
      pushLog(
        logs,
        'identity',
        'info',
        `Resolved publish identity: ${publishDraft.id} -> ${resolvedIdentity.id}, file ${publishDraft.file} -> ${resolvedIdentity.file}`,
      );
    }
    Object.assign(publishDraft, resolvedIdentity);
  }

  if (/^airdox set(?: #\d+)?$/i.test(String(publishDraft.title || '').trim())) {
    throw new Error('Bitte vergib einen echten Set-Namen. Das erkannte Datum bleibt intern erhalten, wird aber nicht mehr als Set-Titel verwendet.');
  }

  const seekableTrackCount = getSeekableTrackCount(publishDraft.tracks);
  if (mergedSettings.autoDeploy && mergedSettings.requireTracklistForLive !== false && seekableTrackCount === 0) {
    throw new Error('Live publish blocked: the set has no seekable tracklist. Import the matching .tracks.json, .mixcloud.txt or .cue file before going live.');
  }
  if (seekableTrackCount > 0) {
    pushLog(logs, 'tracklist', 'success', `Validated ${seekableTrackCount} seekable track rows before publish.`);
  }

  if (mergedSettings.safeMode && mergedSettings.uploadAudioToR2 && !publishDraft.sourceAudioPath) {
    throw new Error('Safe mode blocked publish: the source audio path is missing.');
  }

  const draftFileWasWav = /\.(wav|wave)$/i.test(publishDraft.file);
  if (draftFileWasWav && !publishDraft.sourceAudioPath) {
    throw new Error('WAV files need a source audio path so Flight Deck can convert them to MP3 before publish.');
  }

  if (publishDraft.sourceAudioPath) {
    const audioConversion = await ensureMp3Format(publishDraft.sourceAudioPath, workspaceRoot);
    if (audioConversion.originalPath !== audioConversion.filePath) {
      pushLog(
        logs,
        'audio',
        audioConversion.converted ? 'success' : 'info',
        audioConversion.converted
          ? `Converted WAV to MP3: ${path.basename(audioConversion.originalPath)} -> ${path.basename(audioConversion.filePath)}`
          : `Using existing MP3 for WAV source: ${path.basename(audioConversion.filePath)}`,
      );
    }
    publishDraft.sourceAudioPath = audioConversion.filePath;
    if (draftFileWasWav) {
      publishDraft.file = publishDraft.file.replace(/\.(wav|wave)$/i, '.mp3');
    }
  }

  if (/\.(wav|wave)$/i.test(publishDraft.file)) {
    throw new Error('WAV files are not allowed for publish. Provide an MP3 or a WAV with source path for conversion.');
  }

  if (!publishDraft.cover) {
    publishDraft.cover = defaultCoverPath;
  }

  const currentCoverPath = String(publishDraft.cover || '').trim();
  const hasManualCustomCover = Boolean(currentCoverPath && currentCoverPath !== defaultCoverPath);

  if (publishDraft.sourceImagePath) {
    const coverResult = await copyCoverFile(workspaceRoot, publishDraft.sourceImagePath);
    publishDraft.cover = coverResult.relativePath;
    changedPaths.push(path.relative(workspaceRoot, coverResult.targetPath));
    pushLog(logs, 'cover', 'success', `Copied cover asset to ${coverResult.relativePath}`);
  } else if (configuredCoverPolicy && publishDraft.embeddedCoverDataUrl) {
    const coverResult = await writeEmbeddedCover(workspaceRoot, publishDraft.id, publishDraft.embeddedCoverDataUrl);
    publishDraft.cover = coverResult.relativePath;
    changedPaths.push(path.relative(workspaceRoot, coverResult.targetPath));
    pushLog(logs, 'cover', 'success', `Extracted embedded cover to ${coverResult.relativePath}`);
  } else if (hasManualCustomCover) {
    publishDraft.cover = currentCoverPath;
    pushLog(logs, 'cover', 'info', `Using explicit cover path ${currentCoverPath}`);
  } else {
    publishDraft.cover = defaultCoverPath;
    pushLog(logs, 'cover', 'info', `Using default cover ${defaultCoverPath}`);
  }

  if (mergedSettings.uploadAudioToR2 && publishDraft.sourceAudioPath) {
    const keyPrefix = String(mergedSettings.r2ObjectPrefix || 'public').replace(/\/+$/, '');
    const uploadResult = await uploadAudioFile(workspaceRoot, publishDraft.sourceAudioPath, `${keyPrefix}/${publishDraft.file}`);
    pushLog(logs, 'audio', 'success', `Uploaded audio to R2: ${uploadResult.bucketName}/${uploadResult.objectKey}`);
  }

  const manifestResult = await upsertSet(workspaceRoot, publishDraft, mergedSettings);
  changedPaths.push(path.join('src', 'data', 'musicSets.js'));
  pushLog(logs, 'manifest', 'success', `Refreshed current website manifest from disk and updated set ${publishDraft.id}`);

  if (mergedSettings.autoSeedStats) {
    await seedTrackStats(workspaceRoot, [publishDraft.id]);
    pushLog(logs, 'database', 'success', `Ensured track_stats row for ${publishDraft.id}`);
  }

  if (mergedSettings.autoBuild) {
    const buildResult = await runWorkspaceCommand({ workspaceRoot, command: mergedSettings.buildCommand });
    pushLog(logs, 'build', 'success', buildResult.stdout || 'Build completed.');
  }

  if (mergedSettings.autoDeploy) {
    const deployResult = await runWorkspaceCommand({ workspaceRoot, command: mergedSettings.deployCommand });
    pushLog(logs, 'deploy', 'success', deployResult.stdout || 'Deploy completed.');
    if (mergedSettings.verifyLiveAfterDeploy !== false) {
      const verifyResult = await verifyLiveBundle({
        siteUrl: mergedSettings.liveSiteUrl,
        publishDraft,
      });
      pushLog(
        logs,
        'verify',
        'success',
        `Verified live bundle on ${verifyResult.siteUrl}: ${verifyResult.checkedTokens} set/track tokens across ${verifyResult.scriptCount} script asset(s).`,
      );
    }
  }

  if (mergedSettings.autoCommit) {
    const uniquePaths = [...new Set(changedPaths)];
    if (uniquePaths.length > 0) {
      await runWorkspaceCommand({
        workspaceRoot,
        command: `git add -- ${uniquePaths.map(quotePath).join(' ')}`,
      });
      const commitMessage = String(mergedSettings.gitCommitTemplate || 'feat(flightdeck): publish {{id}}')
        .replaceAll('{{id}}', publishDraft.id);
      await runWorkspaceCommand({
        workspaceRoot,
        command: `git commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
      });
      pushLog(logs, 'git', 'success', `Committed changes with message "${commitMessage}"`);
      if (mergedSettings.autoPush) {
        await runWorkspaceCommand({
          workspaceRoot,
          command: 'git push origin HEAD',
        });
        pushLog(logs, 'git', 'success', 'Pushed current branch to origin.');
      }
    }
  }

  const gitStatus = await getGitStatus(workspaceRoot);

  return {
    ok: true,
    manifestDiff: manifestResult.diff,
    logs,
    gitStatus,
    publishedSet: manifestResult.nextEntry,
  };
};
