export const DEFAULT_AUDIO_FORMAT_ID = 'mp3';

const defineFormat = ({
  id,
  name,
  container,
  extension,
  lossless,
  codec,
  bitRate = null,
  codecArgs,
}) => Object.freeze({
  id,
  name,
  container,
  extension,
  lossless,
  codec,
  bitRate,
  codecArgs: Object.freeze([...codecArgs]),
});

export const AUDIO_OUTPUT_FORMATS = Object.freeze({
  mp3: defineFormat({
    id: 'mp3',
    name: 'MP3 – 320 kbit/s',
    container: 'mp3',
    extension: 'mp3',
    lossless: false,
    codec: 'mp3',
    bitRate: 320000,
    codecArgs: ['-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3', '-f', 'mp3'],
  }),
  wav: defineFormat({
    id: 'wav',
    name: 'WAV – 24-Bit PCM',
    container: 'wav',
    extension: 'wav',
    lossless: true,
    codec: 'pcm_s24le',
    codecArgs: ['-c:a', 'pcm_s24le', '-f', 'wav'],
  }),
  flac: defineFormat({
    id: 'flac',
    name: 'FLAC – verlustfrei',
    container: 'flac',
    extension: 'flac',
    lossless: true,
    codec: 'flac',
    codecArgs: ['-c:a', 'flac', '-compression_level', '8', '-f', 'flac'],
  }),
  ogg: defineFormat({
    id: 'ogg',
    name: 'OGG Vorbis – hohe Qualität',
    container: 'ogg',
    extension: 'ogg',
    lossless: false,
    codec: 'vorbis',
    bitRate: 256000,
    codecArgs: ['-c:a', 'libvorbis', '-q:a', '8', '-f', 'ogg'],
  }),
  opus: defineFormat({
    id: 'opus',
    name: 'Opus – 256 kbit/s VBR',
    container: 'opus',
    extension: 'opus',
    lossless: false,
    codec: 'opus',
    bitRate: 256000,
    codecArgs: [
      '-c:a', 'libopus',
      '-b:a', '256k',
      '-vbr', 'on',
      '-compression_level', '10',
      '-f', 'opus',
    ],
  }),
  aac: defineFormat({
    id: 'aac',
    name: 'AAC / M4A – 320 kbit/s',
    container: 'ipod',
    extension: 'm4a',
    lossless: false,
    codec: 'aac',
    bitRate: 320000,
    codecArgs: ['-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-f', 'ipod'],
  }),
  aiff: defineFormat({
    id: 'aiff',
    name: 'AIFF – 24-Bit PCM',
    container: 'aiff',
    extension: 'aiff',
    lossless: true,
    codec: 'pcm_s24be',
    codecArgs: ['-c:a', 'pcm_s24be', '-f', 'aiff'],
  }),
  alac: defineFormat({
    id: 'alac',
    name: 'ALAC / M4A – verlustfrei',
    container: 'ipod',
    extension: 'm4a',
    lossless: true,
    codec: 'alac',
    codecArgs: ['-c:a', 'alac', '-movflags', '+faststart', '-f', 'ipod'],
  }),
});

export const AUDIO_OUTPUT_FORMAT_LIST = Object.freeze(Object.values(AUDIO_OUTPUT_FORMATS));

const normalizeFormatId = (formatId) => (
  typeof formatId === 'string' ? formatId.trim().toLowerCase() : ''
);

export const isSupportedAudioFormat = (formatId) => (
  Object.hasOwn(AUDIO_OUTPUT_FORMATS, normalizeFormatId(formatId))
);

export const validateAudioFormatId = (formatId, fallbackId = DEFAULT_AUDIO_FORMAT_ID) => {
  const normalizedId = normalizeFormatId(formatId);
  if (Object.hasOwn(AUDIO_OUTPUT_FORMATS, normalizedId)) return normalizedId;

  const normalizedFallback = normalizeFormatId(fallbackId);
  if (Object.hasOwn(AUDIO_OUTPUT_FORMATS, normalizedFallback)) return normalizedFallback;

  return DEFAULT_AUDIO_FORMAT_ID;
};

export const getAudioFormat = (formatId, fallbackId = DEFAULT_AUDIO_FORMAT_ID) => (
  AUDIO_OUTPUT_FORMATS[validateAudioFormatId(formatId, fallbackId)]
);

export const resolveAudioExtension = (formatId, fallbackId = DEFAULT_AUDIO_FORMAT_ID) => (
  getAudioFormat(formatId, fallbackId).extension
);

export const getAudioCodecArgs = (formatId, fallbackId = DEFAULT_AUDIO_FORMAT_ID) => (
  [...getAudioFormat(formatId, fallbackId).codecArgs]
);
