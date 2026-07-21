import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const AUDIO_MASTERING_PROFILES = Object.freeze({
  liveBalanced: {
    id: 'liveBalanced', name: 'Live Set – Druckvoll & Klar', description: 'Ausgewogener Standard für lange Club- und Gig-Mitschnitte.',
    targetLufs: -14, truePeak: -1.2, loudnessRange: 9, highpassHz: 28,
    bassGainDb: 1.2, mudCutDb: -1, presenceGainDb: 0.8, trebleGainDb: 1.4,
    compressorThresholdDb: -18, compressorRatio: 1.65, attackMs: 24, releaseMs: 260, makeupDb: 0.8,
    outputFormat: 'mp3', sampleRate: 48000,
  },
  transparent: {
    id: 'transparent', name: 'Transparent', description: 'Minimale Klangformung, Dynamik und Transienten bleiben weitgehend erhalten.',
    targetLufs: -16, truePeak: -1.2, loudnessRange: 12, highpassHz: 24,
    bassGainDb: 0.4, mudCutDb: -0.4, presenceGainDb: 0.4, trebleGainDb: 0.6,
    compressorThresholdDb: -20, compressorRatio: 1.25, attackMs: 40, releaseMs: 320, makeupDb: 0.2,
    outputFormat: 'mp3', sampleRate: 48000,
  },
  clubPressure: {
    id: 'clubPressure', name: 'Club Pressure', description: 'Mehr Dichte und Fundament, mit begrenztem True Peak für Streaming-Encoding.',
    targetLufs: -12, truePeak: -1.5, loudnessRange: 7, highpassHz: 30,
    bassGainDb: 1.8, mudCutDb: -1.4, presenceGainDb: 1, trebleGainDb: 1.2,
    compressorThresholdDb: -17, compressorRatio: 2.1, attackMs: 18, releaseMs: 220, makeupDb: 1,
    outputFormat: 'mp3', sampleRate: 48000,
  },
  streamingSafe: {
    id: 'streamingSafe', name: 'Streaming Safe', description: 'Konservatives Ziel mit zusätzlicher Headroom-Reserve.',
    targetLufs: -14, truePeak: -2, loudnessRange: 10, highpassHz: 28,
    bassGainDb: 0.8, mudCutDb: -0.8, presenceGainDb: 0.6, trebleGainDb: 1,
    compressorThresholdDb: -19, compressorRatio: 1.45, attackMs: 30, releaseMs: 280, makeupDb: 0.5,
    outputFormat: 'mp3', sampleRate: 48000,
  },
});

const LIMITS = Object.freeze({
  targetLufs: [-23, -9], truePeak: [-3, -0.5], loudnessRange: [5, 20], highpassHz: [20, 45],
  bassGainDb: [-3, 3], mudCutDb: [-4, 0], presenceGainDb: [-2, 3], trebleGainDb: [-2, 3],
  compressorThresholdDb: [-30, -8], compressorRatio: [1, 4], attackMs: [5, 100], releaseMs: [80, 600],
  makeupDb: [0, 3], sampleRate: [44100, 48000],
});

const numberInRange = (name, value) => {
  const parsed = Number(value);
  const [min, max] = LIMITS[name];
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} muss zwischen ${min} und ${max} liegen.`);
  }
  return parsed;
};

export const validateMasteringConfig = (input = {}) => {
  const profile = AUDIO_MASTERING_PROFILES[input.profileId] || AUDIO_MASTERING_PROFILES.liveBalanced;
  const merged = { ...profile, ...input };
  const validated = { profileId: input.profileId || profile.id };
  for (const name of Object.keys(LIMITS)) validated[name] = numberInRange(name, merged[name]);
  validated.outputFormat = ['mp3', 'wav', 'flac'].includes(merged.outputFormat) ? merged.outputFormat : 'mp3';
  return validated;
};

const escapeFilterValue = (value) => String(value).replaceAll('\\', '/').replaceAll(':', '\\:').replaceAll("'", "\\'");

export const buildToneFilter = (config) => [
  `highpass=f=${config.highpassHz}`,
  `bass=g=${config.bassGainDb}:f=110:w=0.65`,
  `equalizer=f=300:t=q:w=1.1:g=${config.mudCutDb}`,
  `equalizer=f=3200:t=q:w=0.9:g=${config.presenceGainDb}`,
  `treble=g=${config.trebleGainDb}:f=6500:w=0.6`,
  `acompressor=threshold=${config.compressorThresholdDb}dB:ratio=${config.compressorRatio}:attack=${config.attackMs}:release=${config.releaseMs}:makeup=${config.makeupDb}dB:knee=2.5dB:link=average:detection=rms`,
].join(',');

export const buildLoudnormFilter = (config, measured = null) => {
  const base = `loudnorm=I=${config.targetLufs}:LRA=${config.loudnessRange}:TP=${config.truePeak}`;
  if (!measured) return `${base}:print_format=json`;
  return `${base}:measured_I=${measured.input_i}:measured_LRA=${measured.input_lra}:measured_TP=${measured.input_tp}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true:print_format=json`;
};

export const parseLoudnormJson = (stderr = '') => {
  const matches = String(stderr).match(/\{[\s\S]*?"target_offset"\s*:\s*"[^"]+"[\s\S]*?\}/g);
  if (!matches?.length) throw new Error('FFmpeg hat keine verwertbare Loudness-Messung geliefert.');
  return JSON.parse(matches.at(-1));
};

const runProcess = (command, args, { onProgress, duration = 0, signal } = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { windowsHide: true });
  let stdout = '';
  let stderr = '';
  const abort = () => child.kill('SIGTERM');
  signal?.addEventListener('abort', abort, { once: true });
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout += text;
    const match = text.match(/out_time_ms=(\d+)/);
    if (match && duration > 0) onProgress?.(Math.min(99, Math.round((Number(match[1]) / 1_000_000 / duration) * 100)));
  });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('error', reject);
  child.on('close', (code) => {
    signal?.removeEventListener('abort', abort);
    if (signal?.aborted) return reject(new Error('Audio-Optimierung abgebrochen.'));
    if (code !== 0) return reject(new Error(`${command} fehlgeschlagen (${code}): ${stderr.slice(-1600)}`));
    resolve({ stdout, stderr });
  });
});

const probeAudio = async (sourcePath) => {
  const { stdout } = await runProcess('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size,format_name:stream=codec_name,sample_rate,channels,channel_layout,bit_rate', '-of', 'json', sourcePath]);
  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.[0] || {};
  return {
    duration: Number(parsed.format?.duration || 0), size: Number(parsed.format?.size || 0),
    format: parsed.format?.format_name || '', codec: stream.codec_name || '', sampleRate: Number(stream.sample_rate || 0),
    channels: Number(stream.channels || 0), channelLayout: stream.channel_layout || '', bitRate: Number(stream.bit_rate || 0),
  };
};

const measureAudio = async (sourcePath, config, includeTone = false) => {
  const filters = [includeTone ? buildToneFilter(config) : '', buildLoudnormFilter(config)].filter(Boolean).join(',');
  const { stderr } = await runProcess('ffmpeg', ['-hide_banner', '-nostdin', '-i', sourcePath, '-map', '0:a:0', '-af', filters, '-f', 'null', '-']);
  return parseLoudnormJson(stderr);
};

export const analyzeAudio = async ({ sourcePath, config = {} }) => {
  if (!sourcePath) throw new Error('Keine Audioquelle ausgewählt.');
  await fs.access(sourcePath);
  const validated = validateMasteringConfig(config);
  const [probe, loudness] = await Promise.all([probeAudio(sourcePath), measureAudio(sourcePath, validated, false)]);
  if (!probe.duration || !probe.channels) throw new Error('Die ausgewählte Datei enthält keinen lesbaren Audiostream.');
  return { sourcePath, probe, loudness, config: validated, analyzedAt: new Date().toISOString() };
};

const outputCodecArgs = (format) => {
  if (format === 'wav') return ['-c:a', 'pcm_s24le'];
  if (format === 'flac') return ['-c:a', 'flac', '-compression_level', '8'];
  return ['-c:a', 'libmp3lame', '-b:a', '320k', '-id3v2_version', '3'];
};

const safeBaseName = (sourcePath) => path.parse(sourcePath).name.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'airdox-live-set';

const nextAvailablePath = async (directory, baseName, extension) => {
  for (let version = 1; version < 1000; version += 1) {
    const suffix = version === 1 ? '' : `-v${version}`;
    const candidate = path.join(directory, `${baseName}-mastered${suffix}.${extension}`);
    const exists = await fs.access(candidate).then(() => true).catch(() => false);
    if (!exists) return candidate;
  }
  throw new Error('Es konnte kein freier Ausgabename erzeugt werden.');
};

export const masterAudio = async ({ sourcePath, outputDirectory, config = {}, onProgress, signal }) => {
  const analysis = await analyzeAudio({ sourcePath, config });
  const validated = analysis.config;
  const outputDir = path.resolve(outputDirectory || path.join(path.dirname(sourcePath), 'airdox-mastered'));
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = await nextAvailablePath(outputDir, safeBaseName(sourcePath), validated.outputFormat);
  const tempPath = path.join(outputDir, `.${safeBaseName(sourcePath)}-mastering-${Date.now()}.${validated.outputFormat}`);
  const measuredAfterTone = await measureAudio(sourcePath, validated, true);
  const filter = `${buildToneFilter(validated)},${buildLoudnormFilter(validated, measuredAfterTone)},aresample=${validated.sampleRate}`;
  try {
    await runProcess('ffmpeg', ['-hide_banner', '-y', '-nostdin', '-i', sourcePath, '-map_metadata', '0', '-map', '0:a:0', '-af', filter, ...outputCodecArgs(validated.outputFormat), '-progress', 'pipe:1', '-nostats', tempPath], {
      duration: analysis.probe.duration, onProgress, signal,
    });
    const [outputProbe, outputLoudness] = await Promise.all([probeAudio(tempPath), measureAudio(tempPath, validated, false)]);
    const durationDelta = Math.abs(outputProbe.duration - analysis.probe.duration);
    const actualLufs = Number(outputLoudness.input_i);
    const actualPeak = Number(outputLoudness.input_tp);
    if (durationDelta > Math.max(0.25, analysis.probe.duration * 0.0001)) throw new Error(`Dauerprüfung fehlgeschlagen (${durationDelta.toFixed(3)} s Abweichung).`);
    if (actualPeak > validated.truePeak + 0.2) throw new Error(`True-Peak-Ziel verfehlt (${actualPeak} dBTP).`);
    if (Math.abs(actualLufs - validated.targetLufs) > 1) throw new Error(`Loudness-Ziel verfehlt (${actualLufs} LUFS).`);
    await fs.rename(tempPath, outputPath);
    const report = { sourcePath, outputPath, input: analysis, output: { probe: outputProbe, loudness: outputLoudness }, config: validated, filter, completedAt: new Date().toISOString() };
    await fs.writeFile(`${outputPath}.mastering.json`, JSON.stringify(report, null, 2), 'utf8');
    onProgress?.(100);
    return report;
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
};

export const _internal = { probeAudio, measureAudio, outputCodecArgs, safeBaseName, nextAvailablePath, escapeFilterValue };
