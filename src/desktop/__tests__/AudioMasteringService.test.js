import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import {
  access, mkdir, mkdtemp, readFile, readdir, rm, utimes, writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import {
  AUDIO_MASTERING_PROFILES,
  _internal,
  analyzeAudio,
  buildLoudnormFilter,
  buildToneFilter,
  parseLoudnormJson,
  masterAudio,
  validateMasteringConfig,
} from '../../../desktop/main/services/audioMastering.mjs';

const execFileAsync = promisify(execFile);

describe('audio mastering profiles', () => {
  it('offers complete, immutable profiles that all pass validation', () => {
    expect(Object.keys(AUDIO_MASTERING_PROFILES)).toEqual([
      'liveBalanced',
      'spatial3d',
      'transparent',
      'clubPressure',
      'streamingSafe',
    ]);
    expect(Object.isFrozen(AUDIO_MASTERING_PROFILES)).toBe(true);

    for (const [profileId, profile] of Object.entries(AUDIO_MASTERING_PROFILES)) {
      expect(validateMasteringConfig({ profileId })).toMatchObject({
        profileId,
        targetLufs: profile.targetLufs,
        truePeak: profile.truePeak,
        outputFormat: profile.outputFormat,
        sampleRate: profile.sampleRate,
      });
    }
  });

  it('uses the balanced profile for empty and unknown profile selections', () => {
    expect(validateMasteringConfig()).toMatchObject({
      profileId: 'liveBalanced', targetLufs: -14, truePeak: -1.5, outputFormat: 'wav', sampleRate: 48000,
    });
    expect(validateMasteringConfig({ profileId: 'does-not-exist' })).toMatchObject({
      profileId: 'does-not-exist',
      targetLufs: -14,
    });
  });

  it('allows manual overrides and converts numeric form values', () => {
    expect(validateMasteringConfig({
      profileId: 'transparent',
      targetLufs: '-15.5',
      truePeak: '-1',
      compressorRatio: '2.25',
      sampleRate: '44100',
      outputFormat: 'flac',
    })).toMatchObject({
      profileId: 'transparent',
      targetLufs: -15.5,
      truePeak: -1,
      compressorRatio: 2.25,
      sampleRate: 44100,
      outputFormat: 'flac',
    });
  });

  it.each(['mp3', 'wav', 'flac', 'ogg', 'opus', 'aac', 'aiff', 'alac'])(
    'accepts the supported %s output format',
    (outputFormat) => {
    expect(validateMasteringConfig({ outputFormat }).outputFormat).toBe(outputFormat);
    },
  );

  it.each(['', 'wma', 'mp4', null])('falls back to mp3 for unsupported format %s', (outputFormat) => {
    expect(validateMasteringConfig({ outputFormat }).outputFormat).toBe('mp3');
  });

  it('normalizes supported format case and whitespace', () => {
    expect(validateMasteringConfig({ outputFormat: '  AAC ' }).outputFormat).toBe('aac');
  });
});

describe('audio mastering parameter validation', () => {
  const ranges = {
    targetLufs: [-23, -9],
    truePeak: [-3, -0.5],
    loudnessRange: [5, 20],
    highpassHz: [20, 45],
    bassGainDb: [-3, 3],
    mudCutDb: [-4, 0],
    presenceGainDb: [-2, 3],
    trebleGainDb: [-2, 3],
    compressorThresholdDb: [-30, -8],
    compressorRatio: [1, 4],
    attackMs: [5, 100],
    releaseMs: [80, 600],
    makeupDb: [0, 3],
    stereoWidth: [1, 2],
    sampleRate: [44100, 48000],
  };

  it.each(Object.entries(ranges))('accepts both inclusive boundaries for %s', (name, [min, max]) => {
    expect(validateMasteringConfig({ [name]: min })[name]).toBe(min);
    expect(validateMasteringConfig({ [name]: max })[name]).toBe(max);
  });

  it.each(Object.entries(ranges))('rejects out-of-range and non-finite values for %s', (name, [min, max]) => {
    for (const invalid of [min - 0.01, max + 0.01, 'not-a-number', Infinity, NaN]) {
      expect(() => validateMasteringConfig({ [name]: invalid })).toThrow(
        `${name} muss zwischen ${min} und ${max} liegen.`,
      );
    }
  });
});

describe('FFmpeg audio filter construction', () => {
  const config = validateMasteringConfig({
    profileId: 'liveBalanced',
    highpassHz: 32,
    bassGainDb: 1.5,
    mudCutDb: -1.2,
    presenceGainDb: 0.7,
    trebleGainDb: 1.1,
    compressorThresholdDb: -17,
    compressorRatio: 1.8,
    attackMs: 20,
    releaseMs: 240,
    makeupDb: 0.9,
  });

  it('builds the complete tone and dynamics chain from manual parameters', () => {
    expect(buildToneFilter(config)).toBe([
      'highpass=f=32',
      'bass=g=1.5:f=110:w=0.65',
      'equalizer=f=300:t=q:w=1.1:g=-1.2',
      'equalizer=f=3200:t=q:w=0.9:g=0.7',
      'treble=g=1.1:f=6500:w=0.6',
      'acompressor=threshold=-17dB:ratio=1.8:attack=20:release=240:makeup=0.9dB:knee=2.5dB:link=average:detection=rms',
    ].join(','));
  });

  it('adds stereo widening only when the current job explicitly requests it', () => {
    const widened = validateMasteringConfig({ profileId: 'liveBalanced', stereoWidth: 1.25 });
    expect(buildToneFilter(widened)).toContain('extrastereo=m=1.25');
    expect(buildToneFilter(config)).not.toContain('extrastereo=');
    expect(buildToneFilter({ ...config, stereoWidth: 0 })).not.toContain('extrastereo=');
  });

  it('builds first-pass loudnorm analysis with JSON output', () => {
    expect(buildLoudnormFilter(config)).toBe('loudnorm=I=-14:LRA=9:TP=-1.5:print_format=json');
  });

  it('builds second-pass loudnorm with all measured values', () => {
    const measured = {
      input_i: '-17.25', input_lra: '8.10', input_tp: '-0.30',
      input_thresh: '-27.00', target_offset: '0.15',
    };
    expect(buildLoudnormFilter(config, measured)).toBe(
      'loudnorm=I=-14:LRA=9:TP=-1.5:measured_I=-17.25:measured_LRA=8.10:'
      + 'measured_TP=-0.30:measured_thresh=-27.00:offset=0.15:linear=true:print_format=json',
    );
  });
});

describe('loudnorm measurement parsing', () => {
  it('extracts FFmpeg JSON from surrounding diagnostics', () => {
    expect(parseLoudnormJson('noise before\n{\n "input_i": "-15.2",\n "target_offset": "0.1"\n}\nnoise after')).toEqual({
      input_i: '-15.2',
      target_offset: '0.1',
    });
  });

  it('uses the final measurement when FFmpeg prints multiple passes', () => {
    const stderr = [
      '{"input_i":"-20","target_offset":"1"}',
      'diagnostic separator',
      '{"input_i":"-14.1","target_offset":"0.05"}',
    ].join('\n');
    expect(parseLoudnormJson(stderr).input_i).toBe('-14.1');
  });

  it.each(['', null, undefined, '{"input_i":"-14"}', 'ordinary ffmpeg error'])('rejects missing measurement in %s', (stderr) => {
    expect(() => parseLoudnormJson(stderr)).toThrow('FFmpeg hat keine verwertbare Loudness-Messung geliefert.');
  });

  it('surfaces malformed JSON instead of silently accepting it', () => {
    expect(() => parseLoudnormJson('{"input_i":oops,"target_offset":"0"}')).toThrow();
  });

  it('parses the quiet ebur128 render summary', () => {
    const stderr = `Summary:\n\n  Integrated loudness:\n    I:         -14.1 LUFS\n    Threshold: -24.1 LUFS\n\n  Loudness range:\n    LRA:         5.2 LU\n\n  Sample peak:\n    Peak:       -1.6 dBFS`;
    expect(_internal.parseEbur128Summary(stderr)).toMatchObject({
      input_i: '-14.1', input_tp: '-1.6', input_lra: '5.2', peakKind: 'sample', normalization_type: 'linear-fast',
    });
  });

  it('rejects missing render summaries and defaults an omitted threshold safely', () => {
    expect(() => _internal.parseEbur128Summary('ordinary ffmpeg output')).toThrow('keine verwertbare Render-Messung');
    expect(() => _internal.parseEbur128Summary('Summary:\nIntegrated loudness:\n I: -14 LUFS\nLoudness range:\n LRA: 5 LU')).toThrow('unvollständig');
    expect(_internal.parseEbur128Summary('Summary:\nIntegrated loudness:\n I: -14 LUFS\nLoudness range:\n LRA: 5 LU\nSample peak:\n Peak: -2 dBFS').input_thresh).toBe('0');
  });
});

describe('output safety helpers', () => {
  it.each([
    ['mp3', ['-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3', '-f', 'mp3']],
    ['wav', ['-c:a', 'pcm_s24le', '-f', 'wav']],
    ['flac', ['-c:a', 'flac', '-compression_level', '8', '-f', 'flac']],
    ['ogg', ['-c:a', 'libvorbis', '-q:a', '8', '-f', 'ogg']],
    ['opus', ['-c:a', 'libopus', '-b:a', '256k', '-vbr', 'on', '-compression_level', '10', '-f', 'opus']],
    ['aac', ['-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-f', 'ipod']],
    ['aiff', ['-c:a', 'pcm_s24be', '-f', 'aiff']],
    ['alac', ['-c:a', 'alac', '-movflags', '+faststart', '-f', 'ipod']],
  ])('maps %s to its production codec arguments', (format, expected) => {
    expect(_internal.outputCodecArgs(format)).toEqual(expected);
  });

  it('uses mp3 encoding as a safe codec fallback', () => {
    expect(_internal.outputCodecArgs('wma')).toEqual([
      '-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3', '-f', 'mp3',
    ]);
  });

  it.each([
    ['C:/sets/AIRDOX Live @ Berlin (2026).wav', 'AIRDOX-Live-Berlin-2026'],
    ['/music/---My_Set---.flac', 'My_Set'],
    ['/music/ä ö ü.wav', 'airdox-live-set'],
    ['/music/valid_name-01.mp3', 'valid_name-01'],
  ])('creates a filesystem-safe base name for %s', (sourcePath, expected) => {
    expect(_internal.safeBaseName(sourcePath)).toBe(expected);
  });

  it('escapes FFmpeg filter path delimiters and quotes', () => {
    expect(_internal.escapeFilterValue("C:\\Audio:Sets\\DJ's.wav")).toBe(String.raw`C\:/Audio\:Sets/DJ\'s.wav`);
  });

  it('uses fixed representative windows for long sets only', () => {
    expect(_internal.representativeSegmentsFor()).toEqual([]);
    expect(_internal.representativeSegmentsFor(600)).toEqual([]);
    const segments = _internal.representativeSegmentsFor(10_800);
    expect(segments).toHaveLength(3);
    expect(segments.map(({ duration }) => duration)).toEqual([45, 45, 45]);
    expect(segments.map(({ start }) => Math.round(start))).toEqual([1058, 5378, 9158]);
    expect(_internal.calibrationSegmentsFor(135)).toEqual([]);
    expect(_internal.calibrationSegmentsFor(Number.NaN)).toEqual([]);
    expect(_internal.calibrationSegmentsFor(180)).toHaveLength(3);
  });

  it('enforces explicit stereo layouts and exact source signatures', () => {
    expect(() => _internal.assertStereoPolicy()).toThrow('genau 2 Kanälen');
    expect(() => _internal.assertStereoPolicy({ channels: 2, channelLayout: '5.1' })).toThrow('nicht unterstützte Kanallayout');
    expect(() => _internal.assertStereoPolicy({ channels: 2, channelLayout: ' Stereo ' })).not.toThrow();
    expect(_internal.sourceSignaturesMatch(null, null)).toBe(false);
    const signature = { path: 'C:/sets/live.wav', size: 100, mtimeMs: 200 };
    expect(_internal.sourceSignaturesMatch(signature, null)).toBe(false);
    expect(_internal.sourceSignaturesMatch(signature, { ...signature })).toBe(true);
    expect(_internal.sourceSignaturesMatch(signature, { ...signature, size: 101 })).toBe(false);
    expect(_internal.sourceSignaturesMatch(signature, { ...signature, mtimeMs: 201 })).toBe(false);
    expect(_internal.sourceSignaturesMatch(signature, { ...signature, path: 'C:/sets/other.wav' })).toBe(false);
  });

  it('rejects a mastering job without a source before starting external work', async () => {
    await expect(masterAudio({ sourcePath: '', outputDirectory: 'C:/unused' })).rejects.toThrow('Keine Audioquelle ausgewählt');
  });

  it('selects the fast path only inside the bounded gain, peak and dynamics corridor', () => {
    const config = validateMasteringConfig({ profileId: 'liveBalanced' });
    expect(_internal.chooseNormalizationStrategy(config, {
      input_i: '-22', input_lra: '14', input_tp: '-0.1',
    })).toMatchObject({ mode: 'dynamic', reason: 'Dynamische Korrektur erforderlich' });
    expect(_internal.chooseNormalizationStrategy(config, {
      input_i: '0', input_lra: '6', input_tp: '-20',
    })).toMatchObject({ mode: 'dynamic', gainDb: -14 });
    expect(_internal.chooseNormalizationStrategy(config, {
      input_i: '-16', input_lra: '6', input_tp: '2',
    })).toMatchObject({ mode: 'dynamic', reason: 'Dynamische Korrektur erforderlich' });
    expect(_internal.chooseNormalizationStrategy(config, {
      input_i: '-14', input_lra: '15', input_tp: '-2',
    })).toMatchObject({ mode: 'dynamic', loudnessRangeExcess: 6 });
    expect(_internal.chooseNormalizationStrategy(config, {
      input_i: '-12', input_lra: '6', input_tp: '-1',
    })).toMatchObject({ mode: 'linear-fast', gainDb: -2 });
    expect(_internal.chooseNormalizationStrategy(config, {
      input_i: '-12', input_lra: '6', input_tp: '-1',
    })).toMatchObject({ mode: 'linear-fast', gainDb: -2 });
    expect(_internal.chooseNormalizationStrategy(config, {})).toMatchObject({ mode: 'dynamic', reason: 'Messwerte unvollständig' });
  });
});

describe('real FFmpeg mastering pipeline', () => {
  it('analyzes a long set from bounded representative sections', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-representative-'));
    const sourcePath = path.join(root, 'long-set.wav');
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=605:sample_rate=8000', '-ar', '8000', '-ac', '2',
        '-c:a', 'pcm_s16le', sourcePath,
      ]);
      const analysis = await analyzeAudio({ sourcePath, config: { outputFormat: 'wav' } });
      expect(analysis.scope).toMatchObject({ mode: 'representative', measuredDuration: 135 });
      expect(analysis.scope.segments).toHaveLength(3);
      expect(analysis.qualityScore.confidence).toMatchObject({ level: 'mittel', percent: 60 });
      expect(analysis.qualityScore.issues[0]).toMatch(/repräsentativen Abschnitten/i);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 90_000);

  it('analyzes, masters, verifies and versions a real short WAV', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-unit-'));
    const sourcePath = path.join(root, 'gig-source.wav');
    const outputDirectory = path.join(root, 'output');
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=2', '-ar', '48000', '-ac', '2',
        '-c:a', 'pcm_s24le', sourcePath,
      ]);
      const config = { profileId: 'transparent', outputFormat: 'wav' };
      const analysisProgress = [];
      const analysis = await analyzeAudio({
        sourcePath,
        config,
        onProgress: (progress, detail) => analysisProgress.push({ progress, ...detail }),
      });
      expect(analysis.probe).toMatchObject({ codec: 'pcm_s24le', sampleRate: 48000, channels: 2 });
      expect(Number(analysis.loudness.input_i)).toBeLessThan(0);
      expect(analysis.qualityScore).toMatchObject({
        scoreAvailable: true,
        confidence: { level: 'hoch' },
      });
      expect(analysis.qualityScore).not.toHaveProperty('predicted');
      expect(analysis.predictedQualityScore).toMatchObject({
        scoreAvailable: true,
        predicted: true,
        scoreRange: { min: expect.any(Number), max: expect.any(Number) },
      });
      expect(analysisProgress[0]).toMatchObject({ progress: 1, operation: 'analysis', phase: 'Audioquelle prüfen' });
      expect(analysisProgress.some((entry) => entry.phase === 'Loudness messen')).toBe(true);
      expect(analysisProgress.at(-1)).toMatchObject({ progress: 100, phase: 'Analyse abgeschlossen' });
      const reportedValues = analysisProgress.map((entry) => entry.progress);
      expect(reportedValues).toEqual([...reportedValues].sort((a, b) => a - b));

      const abortedController = new AbortController();
      abortedController.abort();
      const abortStartedAt = Date.now();
      await expect(_internal.measureAudio(sourcePath, analysis.config, false, {
        duration: analysis.probe.duration,
        signal: abortedController.signal,
        onProgress: () => {},
      })).rejects.toThrow(/abgebrochen/i);
      expect(Date.now() - abortStartedAt).toBeLessThan(1000);

      const progress = [];
      const first = await masterAudio({
        sourcePath,
        outputDirectory,
        config,
        sourceAnalysis: analysis,
        onProgress: (value, detail) => progress.push({ value, ...detail }),
      });
      expect(first.outputPath).toMatch(/gig-source-mastered\.wav$/);
      await expect(access(first.outputPath)).resolves.toBeUndefined();
      const report = JSON.parse(await readFile(`${first.outputPath}.mastering.json`, 'utf8'));
      expect(report.config).toMatchObject({ profileId: 'transparent', outputFormat: 'wav' });
      expect(report.analysisReused).toBe(true);
      expect(report.input.analyzedAt).toBe(analysis.analyzedAt);
      expect(report.output.probe.duration).toBeCloseTo(analysis.probe.duration, 1);
      expect(report.output.qualityScore).toMatchObject({
        scoreAvailable: true,
        confidence: { level: 'hoch' },
      });
      expect(progress.some((entry) => /Master .*rendern/.test(entry.phase))).toBe(true);
      expect(first.normalization).toMatchObject({
        initialStrategy: { mode: expect.stringMatching(/^(linear-fast|dynamic)$/) },
        appliedStrategy: { mode: expect.stringMatching(/^(linear-fast|dynamic)$/) },
        verificationMode: expect.stringMatching(/^(render-metrics|deep-fallback)$/),
      });
      expect(progress.some((entry) => entry.phase === 'Quellanalyse wiederverwenden')).toBe(true);
      expect(progress.some((entry) => entry.phase === 'Quelle analysieren')).toBe(false);
      expect(progress.at(-1)).toMatchObject({ value: 100, phase: 'Mastering abgeschlossen' });

      const second = await masterAudio({ sourcePath, outputDirectory, config });
      expect(second.outputPath).toMatch(/gig-source-mastered-v2\.wav$/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 90_000);

  it('rejects a missing source before spawning FFmpeg', async () => {
    await expect(analyzeAudio({ sourcePath: '' })).rejects.toThrow('Keine Audioquelle ausgewählt.');
    await expect(analyzeAudio({ sourcePath: path.join(tmpdir(), 'airdox-does-not-exist.wav') })).rejects.toThrow();
  });

  it('selects the first audio stream explicitly and rejects implicit surround downmixing', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-channel-policy-'));
    const mixedStreamPath = path.join(root, 'video-first.mkv');
    const surroundPath = path.join(root, 'surround.wav');
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', 'color=c=black:s=16x16:d=0.25',
        '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.25',
        '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'ffv1', '-c:a', 'pcm_s24le', '-ac', '2', mixedStreamPath,
      ]);
      expect(await _internal.probeAudio(mixedStreamPath)).toMatchObject({ codec: 'pcm_s24le', channels: 2 });

      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', 'anullsrc=channel_layout=5.1:sample_rate=48000:d=0.25',
        '-c:a', 'pcm_s24le', surroundPath,
      ]);
      await expect(analyzeAudio({ sourcePath: surroundPath })).rejects.toThrow(/genau 2 Kanälen|Surround/i);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);

  it('invalidates a stale source analysis before rendering', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-stale-analysis-'));
    const sourcePath = path.join(root, 'stale-source.wav');
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=330:duration=0.5', '-ar', '48000', '-ac', '2',
        '-c:a', 'pcm_s24le', sourcePath,
      ]);
      const staleAnalysis = await analyzeAudio({ sourcePath, config: { outputFormat: 'wav' } });
      const changedTime = new Date(Date.now() + 5_000);
      await utimes(sourcePath, changedTime, changedTime);

      const report = await masterAudio({
        sourcePath,
        outputDirectory: path.join(root, 'output'),
        config: { profileId: 'transparent', outputFormat: 'wav' },
        sourceAnalysis: staleAnalysis,
      });
      expect(report.analysisReused).toBe(false);
      expect(report.input.sourceSignature.mtimeMs).not.toBe(staleAnalysis.sourceSignature.mtimeMs);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 60_000);

  it('versions against sidecars and rolls back the audio/report pair on report conflict or late abort', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-atomic-pair-'));
    const sourcePath = path.join(root, 'atomic-source.wav');
    const outputDirectory = path.join(root, 'output');
    const firstOutputPath = path.join(outputDirectory, 'atomic-source-mastered.wav');
    const secondOutputPath = path.join(outputDirectory, 'atomic-source-mastered-v2.wav');
    const thirdOutputPath = path.join(outputDirectory, 'atomic-source-mastered-v3.wav');
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=550:duration=0.5', '-ar', '48000', '-ac', '2',
        '-c:a', 'pcm_s24le', sourcePath,
      ]);
      const config = { profileId: 'transparent', outputFormat: 'wav' };
      const analysis = await analyzeAudio({ sourcePath, config });
      await mkdir(outputDirectory);
      await writeFile(`${firstOutputPath}.mastering.json`, '{"reserved":true}', 'utf8');

      const versioned = await masterAudio({ sourcePath, outputDirectory, config, sourceAnalysis: analysis });
      expect(versioned.outputPath).toBe(secondOutputPath);

      let conflictCreated = false;
      await expect(masterAudio({
        sourcePath,
        outputDirectory,
        config,
        sourceAnalysis: analysis,
        onProgress: (_progress, detail) => {
          if (!conflictCreated && /Master .*rendern/.test(detail.phase)) {
            mkdirSync(`${thirdOutputPath}.mastering.json`);
            conflictCreated = true;
          }
        },
      })).rejects.toThrow();
      await expect(access(thirdOutputPath)).rejects.toThrow();
      await rm(`${thirdOutputPath}.mastering.json`, { recursive: true, force: true });

      const controller = new AbortController();
      await expect(masterAudio({
        sourcePath,
        outputDirectory,
        config,
        sourceAnalysis: analysis,
        signal: controller.signal,
        onProgress: (_progress, detail) => {
          if (detail.phase === 'Ausgabe finalisieren') controller.abort();
        },
      })).rejects.toThrow(/abgebrochen/i);
      await expect(access(thirdOutputPath)).rejects.toThrow();
      await expect(access(`${thirdOutputPath}.mastering.json`)).rejects.toThrow();
      expect((await readdir(outputDirectory)).some((name) => name.startsWith('.atomic-source-mastering-'))).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 90_000);

  it('does not award fake source resolution when a low-bitrate MP3 is upsampled to WAV', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-provenance-'));
    const sourcePath = path.join(root, 'low-resolution-source.mp3');
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=997:duration=1',
        '-ar', '22050', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '64k',
        sourcePath,
      ]);
      const report = await masterAudio({
        sourcePath,
        outputDirectory: path.join(root, 'output'),
        config: { profileId: 'transparent', outputFormat: 'wav', sampleRate: 48000 },
      });

      expect(report.input.probe).toMatchObject({ codec: 'mp3', sampleRate: 22050 });
      expect(report.output.probe).toMatchObject({ codec: 'pcm_s24le', sampleRate: 48000 });
      expect(report.output.qualityScore.breakdown.sourceResolution).toMatchObject({
        score: report.input.qualityScore.breakdown.sourceResolution.score,
        value: {
          codec: 'mp3',
          source: { codec: 'mp3' },
          output: { codec: 'pcm_s24le' },
        },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 60_000);

  it('runs the complete measured mastering and verification pipeline for every output format', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'airdox-mastering-formats-'));
    const sourcePath = path.join(root, 'all-formats-source.wav');
    const formats = [
      ['mp3', 'mp3', 'mp3'],
      ['wav', 'wav', 'pcm_s24le'],
      ['flac', 'flac', 'flac'],
      ['ogg', 'ogg', 'vorbis'],
      ['opus', 'opus', 'opus'],
      ['aac', 'm4a', 'aac'],
      ['aiff', 'aiff', 'pcm_s24be'],
      ['alac', 'm4a', 'alac'],
    ];
    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=1', '-ar', '48000', '-ac', '2',
        '-c:a', 'pcm_s24le', sourcePath,
      ]);

      for (const [outputFormat, extension, codec] of formats) {
        const report = await masterAudio({
          sourcePath,
          outputDirectory: path.join(root, outputFormat),
          config: { profileId: 'transparent', outputFormat },
        });
        expect(report.outputPath).toMatch(new RegExp(`\\.${extension}$`));
        expect(report.output.probe.codec).toBe(codec);
        expect(report.output.qualityScore.scoreAvailable).toBe(true);
        await expect(access(report.outputPath)).resolves.toBeUndefined();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 180_000);
});
