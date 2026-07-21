import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
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
    expect(validateMasteringConfig()).toMatchObject({ profileId: 'liveBalanced', targetLufs: -14 });
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

  it.each(['mp3', 'wav', 'flac'])('accepts the supported %s output format', (outputFormat) => {
    expect(validateMasteringConfig({ outputFormat }).outputFormat).toBe(outputFormat);
  });

  it.each([undefined, '', 'aac', 'MP3', null])('falls back to mp3 for unsupported format %s', (outputFormat) => {
    expect(validateMasteringConfig({ outputFormat }).outputFormat).toBe('mp3');
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

  it('builds first-pass loudnorm analysis with JSON output', () => {
    expect(buildLoudnormFilter(config)).toBe('loudnorm=I=-14:LRA=9:TP=-1.2:print_format=json');
  });

  it('builds second-pass loudnorm with all measured values', () => {
    const measured = {
      input_i: '-17.25', input_lra: '8.10', input_tp: '-0.30',
      input_thresh: '-27.00', target_offset: '0.15',
    };
    expect(buildLoudnormFilter(config, measured)).toBe(
      'loudnorm=I=-14:LRA=9:TP=-1.2:measured_I=-17.25:measured_LRA=8.10:'
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
});

describe('output safety helpers', () => {
  it.each([
    ['mp3', ['-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3']],
    ['wav', ['-c:a', 'pcm_s24le']],
    ['flac', ['-c:a', 'flac', '-compression_level', '8']],
  ])('maps %s to its production codec arguments', (format, expected) => {
    expect(_internal.outputCodecArgs(format)).toEqual(expected);
  });

  it('uses mp3 encoding as a safe codec fallback', () => {
    expect(_internal.outputCodecArgs('aac')).toEqual(['-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3']);
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
});

describe('real FFmpeg mastering pipeline', () => {
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
      const analysis = await analyzeAudio({ sourcePath, config });
      expect(analysis.probe).toMatchObject({ codec: 'pcm_s24le', sampleRate: 48000, channels: 2 });
      expect(Number(analysis.loudness.input_i)).toBeLessThan(0);

      const progress = [];
      const first = await masterAudio({ sourcePath, outputDirectory, config, onProgress: (value) => progress.push(value) });
      expect(first.outputPath).toMatch(/gig-source-mastered\.wav$/);
      await expect(access(first.outputPath)).resolves.toBeUndefined();
      const report = JSON.parse(await readFile(`${first.outputPath}.mastering.json`, 'utf8'));
      expect(report.config).toMatchObject({ profileId: 'transparent', outputFormat: 'wav' });
      expect(report.output.probe.duration).toBeCloseTo(analysis.probe.duration, 1);
      expect(progress).toContain(100);

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
});
