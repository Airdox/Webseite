import { execFile } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import {
  AUDIO_OUTPUT_FORMAT_LIST,
  AUDIO_OUTPUT_FORMATS,
  DEFAULT_AUDIO_FORMAT_ID,
  getAudioCodecArgs,
  getAudioFormat,
  isSupportedAudioFormat,
  resolveAudioExtension,
  validateAudioFormatId,
} from '../../../desktop/main/services/audioFormats.mjs';

const execFileAsync = promisify(execFile);

const EXPECTED_FORMATS = {
  mp3: {
    container: 'mp3',
    extension: 'mp3',
    lossless: false,
    codecArgs: ['-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3', '-f', 'mp3'],
  },
  wav: {
    container: 'wav',
    extension: 'wav',
    lossless: true,
    codecArgs: ['-c:a', 'pcm_s24le', '-f', 'wav'],
  },
  flac: {
    container: 'flac',
    extension: 'flac',
    lossless: true,
    codecArgs: ['-c:a', 'flac', '-compression_level', '8', '-f', 'flac'],
  },
  ogg: {
    container: 'ogg',
    extension: 'ogg',
    lossless: false,
    codecArgs: ['-c:a', 'libvorbis', '-q:a', '8', '-f', 'ogg'],
  },
  opus: {
    container: 'opus',
    extension: 'opus',
    lossless: false,
    codecArgs: [
      '-c:a', 'libopus',
      '-b:a', '256k',
      '-vbr', 'on',
      '-compression_level', '10',
      '-f', 'opus',
    ],
  },
  aac: {
    container: 'ipod',
    extension: 'm4a',
    lossless: false,
    codecArgs: ['-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-f', 'ipod'],
  },
  aiff: {
    container: 'aiff',
    extension: 'aiff',
    lossless: true,
    codecArgs: ['-c:a', 'pcm_s24be', '-f', 'aiff'],
  },
  alac: {
    container: 'ipod',
    extension: 'm4a',
    lossless: true,
    codecArgs: ['-c:a', 'alac', '-movflags', '+faststart', '-f', 'ipod'],
  },
};

describe('audio output format registry', () => {
  it('publishes every supported production format with complete metadata', () => {
    expect(DEFAULT_AUDIO_FORMAT_ID).toBe('mp3');
    expect(Object.keys(AUDIO_OUTPUT_FORMATS)).toEqual(Object.keys(EXPECTED_FORMATS));
    expect(AUDIO_OUTPUT_FORMAT_LIST.map(({ id }) => id)).toEqual(Object.keys(EXPECTED_FORMATS));

    for (const [id, expected] of Object.entries(EXPECTED_FORMATS)) {
      expect(AUDIO_OUTPUT_FORMATS[id]).toMatchObject({
        id,
        name: expect.any(String),
        ...expected,
      });
      expect(AUDIO_OUTPUT_FORMATS[id].name.trim().length).toBeGreaterThan(3);
    }
  });

  it('is deeply immutable and exposes a frozen list', () => {
    expect(Object.isFrozen(AUDIO_OUTPUT_FORMATS)).toBe(true);
    expect(Object.isFrozen(AUDIO_OUTPUT_FORMAT_LIST)).toBe(true);

    for (const format of AUDIO_OUTPUT_FORMAT_LIST) {
      expect(Object.isFrozen(format)).toBe(true);
      expect(Object.isFrozen(format.codecArgs)).toBe(true);
    }
  });

  it.each(Object.keys(EXPECTED_FORMATS))('validates and resolves %s', (id) => {
    const expected = EXPECTED_FORMATS[id];
    expect(isSupportedAudioFormat(id)).toBe(true);
    expect(validateAudioFormatId(id)).toBe(id);
    expect(getAudioFormat(id)).toBe(AUDIO_OUTPUT_FORMATS[id]);
    expect(resolveAudioExtension(id)).toBe(expected.extension);
    expect(getAudioCodecArgs(id)).toEqual(expected.codecArgs);
  });

  it('normalizes harmless case and whitespace differences', () => {
    expect(isSupportedAudioFormat('  FLAC ')).toBe(true);
    expect(validateAudioFormatId('  FLAC ')).toBe('flac');
    expect(getAudioFormat(' OPUS ')).toBe(AUDIO_OUTPUT_FORMATS.opus);
  });

  it.each([undefined, null, '', 'wma', 'mp4', {}, 42])(
    'falls back safely for unsupported input %s',
    (input) => {
      expect(isSupportedAudioFormat(input)).toBe(false);
      expect(validateAudioFormatId(input)).toBe('mp3');
      expect(getAudioFormat(input)).toBe(AUDIO_OUTPUT_FORMATS.mp3);
      expect(resolveAudioExtension(input)).toBe('mp3');
      expect(getAudioCodecArgs(input)).toEqual(EXPECTED_FORMATS.mp3.codecArgs);
    },
  );

  it('uses a supported caller fallback and rejects an invalid fallback safely', () => {
    expect(validateAudioFormatId('unknown', 'flac')).toBe('flac');
    expect(resolveAudioExtension('unknown', 'flac')).toBe('flac');
    expect(validateAudioFormatId('unknown', 'also-unknown')).toBe('mp3');
  });

  it('returns codec argument copies so callers cannot mutate shared configuration', () => {
    const args = getAudioCodecArgs('wav');
    args[1] = 'invalid-codec';
    args.push('-invalid');

    expect(getAudioCodecArgs('wav')).toEqual(EXPECTED_FORMATS.wav.codecArgs);
    expect(AUDIO_OUTPUT_FORMATS.wav.codecArgs).toEqual(EXPECTED_FORMATS.wav.codecArgs);
  });
});

describe('real FFmpeg output format encodes', () => {
  it.each(Object.keys(EXPECTED_FORMATS))('encodes and probes a real one-second %s file', async (id) => {
    const root = await mkdtemp(path.join(tmpdir(), `airdox-format-${id}-`));
    const outputPath = path.join(root, `encoded.${resolveAudioExtension(id)}`);

    try {
      await execFileAsync('ffmpeg', [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-f', 'lavfi',
        '-i', 'sine=frequency=997:duration=1',
        '-ar', '48000',
        '-ac', '2',
        ...getAudioCodecArgs(id),
        outputPath,
      ]);

      await expect(access(outputPath)).resolves.toBeUndefined();
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'stream=codec_name,channels,sample_rate:format=format_name,duration',
        '-of', 'json',
        outputPath,
      ]);
      const probe = JSON.parse(stdout);

      expect(Number(probe.format.duration)).toBeGreaterThan(0.9);
      expect(Number(probe.streams[0].sample_rate)).toBe(48000);
      expect(Number(probe.streams[0].channels)).toBe(2);
      expect(probe.streams[0].codec_name).toBeTruthy();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 30_000);
});
