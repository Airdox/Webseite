import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const parseFileMock = vi.hoisted(() => vi.fn());
const readSetsMock = vi.hoisted(() => vi.fn());
const upsertSetMock = vi.hoisted(() => vi.fn());
const seedTrackStatsMock = vi.hoisted(() => vi.fn());
const uploadAudioFileMock = vi.hoisted(() => vi.fn());
const isWorkspaceRootMock = vi.hoisted(() => vi.fn());
const runCommandMock = vi.hoisted(() => vi.fn());

vi.mock('music-metadata', () => ({ parseFile: parseFileMock }));

vi.mock('../../../desktop/main/services/manifest.mjs', () => ({
  readSets: readSetsMock,
  upsertSet: upsertSetMock,
}));

vi.mock('../../../desktop/main/services/database.mjs', () => ({
  seedTrackStats: seedTrackStatsMock,
}));

vi.mock('../../../desktop/main/services/r2.mjs', () => ({
  uploadAudioFile: uploadAudioFileMock,
}));

vi.mock('../../../desktop/main/services/workspace.mjs', async () => {
  const pathModule = await import('node:path');
  return {
    ensureDirectory: vi.fn(async (targetPath) => {
      await fs.mkdir(targetPath, { recursive: true });
      return targetPath;
    }),
    fileExists: vi.fn(async (targetPath) => {
      try {
        await fs.access(targetPath);
        return true;
      } catch {
        return false;
      }
    }),
    getWorkspacePaths: vi.fn((workspaceRoot) => ({
      workspaceRoot,
      manifestPath: pathModule.join(workspaceRoot, 'src', 'data', 'musicSets.js'),
      coverOutputDir: pathModule.join(workspaceRoot, 'public', 'assets'),
      envPath: pathModule.join(workspaceRoot, '.env'),
      envExamplePath: pathModule.join(workspaceRoot, '.env.example'),
      packageJsonPath: pathModule.join(workspaceRoot, 'package.json'),
      wranglerPath: pathModule.join(workspaceRoot, 'wrangler.jsonc'),
    })),
    getGitStatus: vi.fn(async () => ({ branch: 'main', dirty: false, summary: 'clean' })),
    isWorkspaceRoot: isWorkspaceRootMock,
    runCommand: runCommandMock,
  };
});

const {
  decodeTracklistBuffer,
  prepareImportBundle,
  publishSet,
  runWorkspaceCommand,
} = await import('../../../desktop/main/services/pipeline.mjs');

describe('desktop publish pipeline service', () => {
  let workspaceRoot;
  let audioPath;
  let coverPath;
  let tracklistPath;

  beforeEach(async () => {
    vi.clearAllMocks();
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'airdox-pipeline-service-'));
    audioPath = path.join(workspaceRoot, 'recording_2026_05_02_test_set.mp3');
    coverPath = path.join(workspaceRoot, 'cover.jpg');
    tracklistPath = path.join(workspaceRoot, 'recording_2026_05_02_test_set.cue');
    await fs.writeFile(audioPath, 'mp3', 'utf8');
    await fs.writeFile(coverPath, 'jpg', 'utf8');
    await fs.writeFile(tracklistPath, 'TITLE "Test Set"\n  TRACK 01 AUDIO\n    TITLE "Intro"\n    PERFORMER "AIRDOX"\n    INDEX 01 00:00:00\n', 'utf8');
    parseFileMock.mockResolvedValue({
      common: { title: 'Test Set', date: '2026-05-02' },
      format: { duration: 3720 },
    });
    readSetsMock.mockResolvedValue([]);
    upsertSetMock.mockImplementation(async (_workspaceRoot, draft) => ({ nextEntry: draft, diff: { changed: true } }));
    seedTrackStatsMock.mockResolvedValue(true);
    uploadAudioFileMock.mockResolvedValue({ bucketName: 'assets', objectKey: 'public/test.mp3' });
    isWorkspaceRootMock.mockResolvedValue(true);
    runCommandMock.mockResolvedValue({ ok: true, stdout: 'done', stderr: '', code: 0 });
    globalThis.fetch = vi.fn(async (url) => {
      const href = String(url);
      if (href.includes('flightdeck-deploy.json')) {
        return {
          ok: true,
          text: async () => JSON.stringify({ fingerprint: { hash: 'abc123', fileCount: 2 } }),
        };
      }
      if (href.endsWith('.js') || href.includes('/assets/index-')) {
        return {
          ok: true,
          text: async () => 'test-set Test Set 00:00 Intro',
        };
      }
      return {
        ok: true,
        text: async () => '<html><script type="module" src="/assets/index-test.js"></script></html>',
      };
    });
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it('decodes common tracklist encodings and rejects imports without audio', async () => {
    expect(decodeTracklistBuffer(Buffer.from([0xEF, 0xBB, 0xBF, 0x41]))).toBe('A');
    expect(decodeTracklistBuffer(Buffer.from([0xFF, 0xFE, 0x41, 0x00]))).toBe('A');
    expect(decodeTracklistBuffer(Buffer.from([0xFE, 0xFF, 0x00, 0x41]))).toBe('A');
    expect(decodeTracklistBuffer(Buffer.alloc(0))).toBe('');

    await expect(prepareImportBundle({ filePaths: [coverPath] })).rejects.toThrow(/No supported audio/);
  });

  it('prepares an import bundle from real files and validates the detected tracklist', async () => {
    const bundle = await prepareImportBundle({
      filePaths: [audioPath, coverPath, tracklistPath],
      settings: {
        workspaceRoot,
        extractEmbeddedCover: true,
        defaultVinylColor: '#99ff00',
        defaultCoverPath: '/assets/default.jpg',
      },
    });

    expect(bundle.detectedFiles).toMatchObject({ audioPath, imagePath: coverPath, tracklistPath });
    expect(bundle.draft).toMatchObject({
      title: 'TEST',
      sourceTracklistPath: tracklistPath,
      sourceAudioPath: audioPath,
      sourceImagePath: coverPath,
    });
    expect(bundle.draft.tracks.length).toBeGreaterThan(0);
    expect(bundle.warnings.join('\n')).toContain('Tracklist validated');
  });

  it('publishes through manifest, R2, stats and workspace commands when gates pass', async () => {
    const result = await publishSet({
      workspaceRoot,
      draft: {
        id: 'test-set',
        title: 'Test Set',
        file: 'test-set.mp3',
        sourceAudioPath: audioPath,
        sourceImagePath: coverPath,
        tracks: [{ time: '00:00', artist: 'AIRDOX', title: 'Intro' }],
        isNew: true,
      },
      settings: {
        workspaceRoot,
        autoBuild: true,
        autoDeploy: true,
        autoSeedStats: true,
        uploadAudioToR2: true,
        safeMode: true,
        requireTracklistForLive: true,
        verifyLiveAfterDeploy: false,
        buildCommand: 'npm run build',
        deployCommand: 'npm run deploy',
        liveSiteUrl: 'https://example.test',
        r2ObjectPrefix: 'public',
        defaultCoverPath: '/assets/default.jpg',
      },
    });

    expect(uploadAudioFileMock).toHaveBeenCalledWith(workspaceRoot, audioPath, 'public/test-set.mp3');
    expect(upsertSetMock).toHaveBeenCalled();
    expect(seedTrackStatsMock).toHaveBeenCalledWith(workspaceRoot, ['test-set']);
    expect(runCommandMock).toHaveBeenCalledWith({ command: 'npm run build', cwd: workspaceRoot });
    expect(runCommandMock).toHaveBeenCalledWith({ command: 'npm run deploy', cwd: workspaceRoot });
    expect(result.logs.map((entry) => entry.step)).toEqual(expect.arrayContaining(['tracklist', 'cover', 'audio', 'manifest', 'database', 'fingerprint', 'build', 'deploy']));
    expect(result).toMatchObject({
      ok: true,
      manifestDiff: { changed: true },
      publishedSet: { id: 'test-set', title: 'Test Set', file: 'test-set.mp3' },
    });
  });

  it('verifies the deployed bundle against real tokens and the written fingerprint marker', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      const href = String(url);
      if (href.includes('flightdeck-deploy.json')) {
        return {
          ok: true,
          text: async () => fs.readFile(path.join(workspaceRoot, 'public', 'flightdeck-deploy.json'), 'utf8'),
        };
      }
      if (href.includes('/assets/index-live.js')) {
        return {
          ok: true,
          text: async () => 'live-set Live Set 00:00 Intro 10:00 Finale',
        };
      }
      return {
        ok: true,
        text: async () => '<html><script type="module" src="/assets/index-live.js"></script></html>',
      };
    });

    const result = await publishSet({
      workspaceRoot,
      draft: {
        id: 'live-set',
        title: 'Live Set',
        file: 'live-set.mp3',
        sourceAudioPath: audioPath,
        tracks: [
          { time: '00:00', artist: 'AIRDOX', title: 'Intro' },
          { time: '10:00', artist: 'AIRDOX', title: 'Finale' },
        ],
      },
      settings: {
        workspaceRoot,
        autoBuild: true,
        autoDeploy: true,
        uploadAudioToR2: false,
        autoSeedStats: false,
        verifyLiveAfterDeploy: true,
        requireTracklistForLive: true,
        buildCommand: 'npm run build',
        deployCommand: 'npm run deploy',
        liveSiteUrl: 'https://example.test',
      },
    });

    expect(result.logs.map((entry) => entry.step)).toContain('verify');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('flightdeckVerify'), expect.any(Object));
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('flightdeck-deploy.json'), expect.any(Object));
  });

  it('reuses a fresh MP3 beside a WAV source and converts stale WAV files through ffmpeg', async () => {
    const wavPath = path.join(workspaceRoot, 'wave_source.wav');
    const mp3Path = path.join(workspaceRoot, 'wave_source.mp3');
    await fs.writeFile(wavPath, 'wav', 'utf8');
    await fs.writeFile(mp3Path, 'mp3', 'utf8');
    const now = Date.now();
    await fs.utimes(wavPath, new Date(now - 10_000), new Date(now - 10_000));
    await fs.utimes(mp3Path, new Date(now), new Date(now));
    parseFileMock.mockResolvedValue({ common: {}, format: { duration: 60 } });

    const reused = await publishSet({
      workspaceRoot,
      draft: {
        id: 'wav-set',
        title: 'WAV Set',
        file: 'wav-set.wav',
        sourceAudioPath: wavPath,
        tracks: [{ time: '00:00', title: 'Intro' }],
      },
      settings: {
        workspaceRoot,
        uploadAudioToR2: false,
        autoSeedStats: false,
        safeMode: false,
        requireTracklistForLive: false,
      },
    });

    expect(reused.logs.map((entry) => entry.detail).join('\n')).toContain('Using existing MP3 for WAV source');
    expect(reused.publishedSet.file).toBe('wav-set.mp3');

    await fs.utimes(wavPath, new Date(now + 10_000), new Date(now + 10_000));
    runCommandMock.mockResolvedValueOnce({ ok: true, stdout: 'ffmpeg version', stderr: '', code: 0 });
    runCommandMock.mockResolvedValueOnce({ ok: false, stdout: '', stderr: 'convert failed', code: 1 });

    await expect(publishSet({
      workspaceRoot,
      draft: {
        id: 'wav-set-two',
        title: 'WAV Set Two',
        file: 'wav-set-two.wav',
        sourceAudioPath: wavPath,
        tracks: [{ time: '00:00', title: 'Intro' }],
      },
      settings: {
        workspaceRoot,
        uploadAudioToR2: false,
        autoSeedStats: false,
        safeMode: false,
        requireTracklistForLive: false,
      },
    })).rejects.toThrow(/Failed to convert WAV to MP3/);
  });

  it('keeps publish guards real for invalid workspace, missing draft data and failed commands', async () => {
    isWorkspaceRootMock.mockResolvedValueOnce(false);
    await expect(publishSet({ workspaceRoot, draft: { id: 'x', title: 'X', file: 'x.mp3' } }))
      .rejects.toThrow(/Workspace/);

    await expect(publishSet({ workspaceRoot, draft: { id: 'x', title: '', file: 'x.mp3' } }))
      .rejects.toThrow(/missing required/);

    await expect(publishSet({
      workspaceRoot,
      draft: { id: 'x', title: 'X', file: 'x.mp3', tracks: [] },
      settings: { workspaceRoot, autoDeploy: true, requireTracklistForLive: true },
    })).rejects.toThrow(/no seekable tracklist/);

    await expect(publishSet({
      workspaceRoot,
      draft: { id: 'x', title: 'X', file: 'x.mp3', tracks: [{ time: '00:00', title: 'Intro' }] },
      settings: { workspaceRoot, safeMode: true, uploadAudioToR2: true },
    })).rejects.toThrow(/source audio path/);

    runCommandMock.mockResolvedValueOnce({ ok: false, stdout: '', stderr: 'boom', code: 1 });
    await expect(runWorkspaceCommand({ workspaceRoot, command: 'npm run fail' })).rejects.toThrow('boom');
  });
});
