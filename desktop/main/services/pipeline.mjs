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
} from '../../../src/desktop/lib/setManifest.js';
import { seedTrackStats } from './database.mjs';
import { upsertSet } from './manifest.mjs';
import { uploadAudioFile } from './r2.mjs';
import { ensureDirectory, getWorkspacePaths, getGitStatus, isWorkspaceRoot, runCommand } from './workspace.mjs';

const matchesExtension = (filePath, extensions) => extensions.includes(path.extname(filePath).toLowerCase());

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

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
      content = await fs.readFile(cuePath, 'utf8');
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
    const sidecars = [`${cueBase}.tracks.json`, `${cueBase}.mixcloud.txt`, `${cueBase}.txt`];
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
      return {
        mp3Path,
        converted: false,
      };
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
  return fs.readFile(tracklistPath, 'utf8');
};

const pushLog = (logs, step, status, detail) => {
  logs.push({
    timestamp: new Date().toISOString(),
    step,
    status,
    detail,
  });
};

const quotePath = (relativePath) => `"${relativePath.replace(/\\/g, '\\\\')}"`;

export const prepareImportBundle = async ({ filePaths = [], settings = DEFAULT_FLIGHT_DECK_SETTINGS }) => {
  const mergedSettings = { ...DEFAULT_FLIGHT_DECK_SETTINGS, ...settings };
  const audioPath = filePaths.find((candidate) => matchesExtension(candidate, AUDIO_EXTENSIONS));
  if (!audioPath) {
    throw new Error('No supported audio file found in dropped files.');
  }

  // Check if the audio file is WAV format
  const audioExt = path.extname(audioPath).toLowerCase();
  const isWavFile = audioExt === '.wav' || audioExt === '.wave';

  const imagePath = filePaths.find((candidate) => matchesExtension(candidate, IMAGE_EXTENSIONS)) || '';
  const selectedTracklistPath = filePaths.find((candidate) => matchesExtension(candidate, TRACKLIST_EXTENSIONS)) || '';
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

  const draft = buildDraftFromImportedFiles({
    audioPath,
    metadataTitle: metadata.common.title,
    durationSeconds: metadata.format.duration || 0,
    parsedDate,
    tracklistText,
    imagePath,
    embeddedCoverDataUrl,
    defaultVinylColor: mergedSettings.defaultVinylColor,
    defaultCoverPath: mergedSettings.defaultCoverPath,
  });

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

  if (!publishDraft.id || !publishDraft.title || !publishDraft.file) {
    throw new Error('Draft is missing required fields (id, title, file).');
  }

  if (mergedSettings.safeMode && mergedSettings.uploadAudioToR2 && !publishDraft.sourceAudioPath) {
    throw new Error('Safe mode blocked publish: the source audio path is missing.');
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
  }

  if (/\.(wav|wave)$/i.test(publishDraft.file)) {
    publishDraft.file = publishDraft.file.replace(/\.(wav|wave)$/i, '.mp3');
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
  pushLog(logs, 'manifest', 'success', `Updated set manifest for ${publishDraft.id}`);

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
