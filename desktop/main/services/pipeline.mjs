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

  const imagePath = filePaths.find((candidate) => matchesExtension(candidate, IMAGE_EXTENSIONS)) || '';
  const tracklistPath = filePaths.find((candidate) => matchesExtension(candidate, TRACKLIST_EXTENSIONS)) || '';
  const metadata = await parseFile(audioPath, { duration: true });
  const tracklistText = await getTracklistText(tracklistPath);
  const audioStat = await fs.stat(audioPath);

  const parsedDate =
    parseDateHint(audioPath) ||
    parseDateHint(metadata.common.date || '') ||
    parseDateHint(audioStat.mtime.toISOString());

  const embeddedPicture = metadata.common.picture?.[0];
  const embeddedCoverDataUrl = (!imagePath && embeddedPicture && mergedSettings.extractEmbeddedCover)
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
  });

  return {
    draft,
    detectedFiles: {
      audioPath,
      imagePath,
      tracklistPath,
    },
    warnings: [
      ...(!tracklistPath ? ['No tracklist file detected. You can add tracks manually before publishing.'] : []),
      ...(!imagePath && !embeddedCoverDataUrl ? ['No cover file detected. The site will use the fallback vinyl image.'] : []),
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

  if (!publishDraft.id || !publishDraft.title || !publishDraft.file) {
    throw new Error('Draft is missing required fields (id, title, file).');
  }

  if (mergedSettings.safeMode && mergedSettings.uploadAudioToR2 && !publishDraft.sourceAudioPath) {
    throw new Error('Safe mode blocked publish: the source audio path is missing.');
  }

  if (publishDraft.sourceImagePath) {
    const coverResult = await copyCoverFile(workspaceRoot, publishDraft.sourceImagePath);
    publishDraft.cover = coverResult.relativePath;
    changedPaths.push(path.relative(workspaceRoot, coverResult.targetPath));
    pushLog(logs, 'cover', 'success', `Copied cover asset to ${coverResult.relativePath}`);
  } else if (publishDraft.embeddedCoverDataUrl) {
    const coverResult = await writeEmbeddedCover(workspaceRoot, publishDraft.id, publishDraft.embeddedCoverDataUrl);
    publishDraft.cover = coverResult.relativePath;
    changedPaths.push(path.relative(workspaceRoot, coverResult.targetPath));
    pushLog(logs, 'cover', 'success', `Extracted embedded cover to ${coverResult.relativePath}`);
  } else {
    pushLog(logs, 'cover', 'info', 'No cover update performed.');
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
