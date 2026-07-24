import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  AUDIO_OUTPUT_FORMAT_LIST,
  getAudioCodecArgs,
  getAudioFormat,
  resolveAudioExtension,
  validateAudioFormatId,
} from './audioFormats.mjs';
import {
  calculateTechnicalQualityScore,
  predictTechnicalQualityScore,
} from './audioQualityScore.mjs';

export { AUDIO_OUTPUT_FORMAT_LIST };

export const AUDIO_MASTERING_PROFILES = Object.freeze({
  liveBalanced: {
    id: 'liveBalanced', name: 'Live Set – Druckvoll & Klar', description: 'Ausgewogener Standard für lange Club- und Gig-Mitschnitte.',
    targetLufs: -14, truePeak: -1.2, loudnessRange: 9, highpassHz: 28,
    bassGainDb: 1.2, mudCutDb: -1, presenceGainDb: 0.8, trebleGainDb: 1.4,
    compressorThresholdDb: -18, compressorRatio: 1.65, attackMs: 24, releaseMs: 260, makeupDb: 0.8,
    stereoWidth: 1.0, outputFormat: 'mp3', sampleRate: 48000,
  },
  spatial3d: {
    id: 'spatial3d', name: '3D Plastisch & Wide', description: 'Maximale Räumlichkeit, 3D-Präsenz und klare Mitten/Höhen-Abgrenzung.',
    targetLufs: -13, truePeak: -1.2, loudnessRange: 8, highpassHz: 30,
    bassGainDb: 1.5, mudCutDb: -1.8, presenceGainDb: 1.4, trebleGainDb: 1.8,
    compressorThresholdDb: -17, compressorRatio: 1.8, attackMs: 20, releaseMs: 240, makeupDb: 1.0,
    stereoWidth: 1.3, outputFormat: 'mp3', sampleRate: 48000,
  },
  transparent: {
    id: 'transparent', name: 'Transparent', description: 'Minimale Klangformung, Dynamik und Transienten bleiben weitgehend erhalten.',
    targetLufs: -16, truePeak: -1.2, loudnessRange: 12, highpassHz: 24,
    bassGainDb: 0.4, mudCutDb: -0.4, presenceGainDb: 0.4, trebleGainDb: 0.6,
    compressorThresholdDb: -20, compressorRatio: 1.25, attackMs: 40, releaseMs: 320, makeupDb: 0.2,
    stereoWidth: 1.0, outputFormat: 'mp3', sampleRate: 48000,
  },
  clubPressure: {
    id: 'clubPressure', name: 'Club Pressure', description: 'Mehr Dichte und Fundament, mit begrenztem True Peak für Streaming-Encoding.',
    targetLufs: -12, truePeak: -1.5, loudnessRange: 7, highpassHz: 30,
    bassGainDb: 1.8, mudCutDb: -1.4, presenceGainDb: 1, trebleGainDb: 1.2,
    compressorThresholdDb: -17, compressorRatio: 2.1, attackMs: 18, releaseMs: 220, makeupDb: 1,
    stereoWidth: 1.0, outputFormat: 'mp3', sampleRate: 48000,
  },
  streamingSafe: {
    id: 'streamingSafe', name: 'Streaming Safe', description: 'Konservatives Ziel mit zusätzlicher Headroom-Reserve.',
    targetLufs: -14, truePeak: -2, loudnessRange: 10, highpassHz: 28,
    bassGainDb: 0.8, mudCutDb: -0.8, presenceGainDb: 0.6, trebleGainDb: 1,
    compressorThresholdDb: -19, compressorRatio: 1.45, attackMs: 30, releaseMs: 280, makeupDb: 0.5,
    stereoWidth: 1.0, outputFormat: 'mp3', sampleRate: 48000,
  },
});

const LIMITS = Object.freeze({
  targetLufs: [-23, -9], truePeak: [-3, -0.5], loudnessRange: [5, 20], highpassHz: [20, 45],
  bassGainDb: [-3, 3], mudCutDb: [-4, 0], presenceGainDb: [-2, 3], trebleGainDb: [-2, 3],
  compressorThresholdDb: [-30, -8], compressorRatio: [1, 4], attackMs: [5, 100], releaseMs: [80, 600],
  makeupDb: [0, 3], stereoWidth: [1, 2], sampleRate: [44100, 48000],
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
  validated.outputFormat = validateAudioFormatId(merged.outputFormat);
  return validated;
};

const escapeFilterValue = (value) => String(value).replaceAll('\\', '/').replaceAll(':', '\\:').replaceAll("'", "\\'");

export const buildToneFilter = (config) => [
  `highpass=f=${config.highpassHz}`,
  `bass=g=${config.bassGainDb}:f=110:w=0.65`,
  `equalizer=f=300:t=q:w=1.1:g=${config.mudCutDb}`,
  `equalizer=f=3200:t=q:w=0.9:g=${config.presenceGainDb}`,
  `treble=g=${config.trebleGainDb}:f=6500:w=0.6`,
  config.stereoWidth && config.stereoWidth > 1 ? `extrastereo=m=${config.stereoWidth}` : '',
  `acompressor=threshold=${config.compressorThresholdDb}dB:ratio=${config.compressorRatio}:attack=${config.attackMs}:release=${config.releaseMs}:makeup=${config.makeupDb}dB:knee=2.5dB:link=average:detection=rms`,
].filter(Boolean).join(',');

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
  if (signal?.aborted) {
    reject(new Error('Audio-Verarbeitung abgebrochen.'));
    return;
  }
  const child = spawn(command, args, { windowsHide: true });
  let stdout = '';
  let stderr = '';
  let progressBuffer = '';
  let lastProgress = -1;
  let forceKillTimer;
  const reportOutputProgress = (text, flush = false) => {
    if (!onProgress || duration <= 0) return;
    progressBuffer += text;
    const lines = progressBuffer.split(/\r?\n/);
    progressBuffer = flush ? '' : lines.pop() || '';
    for (const line of lines) {
      const match = line.match(/^out_time_(?:us|ms)=(\d+)$/);
      if (!match) continue;
      const progress = Math.min(99, Math.round((Number(match[1]) / 1_000_000 / duration) * 100));
      if (progress <= lastProgress) continue;
      lastProgress = progress;
      onProgress(progress);
    }
  };
  const abort = () => {
    const terminationRequested = child.kill('SIGTERM');
    if (!terminationRequested || child.exitCode !== null) return;
    forceKillTimer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
    }, 1500);
    forceKillTimer.unref?.();
  };
  signal?.addEventListener('abort', abort, { once: true });
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout += text;
    reportOutputProgress(text);
  });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('error', (error) => {
    if (error?.code === 'ENOENT') {
      reject(new Error(`${command} wurde nicht gefunden. Installiere FFmpeg und stelle sicher, dass es über PATH erreichbar ist.`));
      return;
    }
    reject(error);
  });
  child.on('close', (code) => {
    clearTimeout(forceKillTimer);
    reportOutputProgress('\n', true);
    signal?.removeEventListener('abort', abort);
    if (signal?.aborted) return reject(new Error('Audio-Optimierung abgebrochen.'));
    if (code !== 0) return reject(new Error(`${command} fehlgeschlagen (${code}): ${stderr.slice(-1600)}`));
    resolve({ stdout, stderr });
  });
});

const probeAudio = async (sourcePath, { signal } = {}) => {
  const { stdout } = await runProcess('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size,format_name:stream=codec_name,sample_rate,channels,channel_layout,bit_rate', '-of', 'json', sourcePath], { signal });
  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.[0] || {};
  return {
    duration: Number(parsed.format?.duration || 0), size: Number(parsed.format?.size || 0),
    format: parsed.format?.format_name || '', codec: stream.codec_name || '', sampleRate: Number(stream.sample_rate || 0),
    channels: Number(stream.channels || 0), channelLayout: stream.channel_layout || '', bitRate: Number(stream.bit_rate || 0),
  };
};

const measureAudio = async (sourcePath, config, includeTone = false, { duration = 0, onProgress, signal } = {}) => {
  const filters = [includeTone ? buildToneFilter(config) : '', buildLoudnormFilter(config)].filter(Boolean).join(',');
  const progressArgs = onProgress ? ['-progress', 'pipe:1', '-nostats'] : [];
  const { stderr } = await runProcess(
    'ffmpeg',
    ['-hide_banner', '-nostdin', '-i', sourcePath, '-map', '0:a:0', '-af', filters, ...progressArgs, '-f', 'null', '-'],
    { duration, onProgress, signal },
  );
  return parseLoudnormJson(stderr);
};

const reportProgress = (callback, progress, phase, message, operation = 'analysis') => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));
  callback?.(safeProgress, { operation, phase, message });
};

export const analyzeAudio = async ({ sourcePath, config = {}, onProgress, signal }) => {
  if (!sourcePath) throw new Error('Keine Audioquelle ausgewählt.');
  reportProgress(onProgress, 1, 'Audioquelle prüfen', 'Datei und Leserechte werden geprüft.');
  await fs.access(sourcePath);
  if (signal?.aborted) throw new Error('Audioanalyse abgebrochen.');
  const validated = validateMasteringConfig(config);
  reportProgress(onProgress, 4, 'Metadaten lesen', 'Codec, Dauer, Samplerate und Kanäle werden ermittelt.');
  const probe = await probeAudio(sourcePath, { signal });
  if (!probe.duration || !probe.channels) throw new Error('Die ausgewählte Datei enthält keinen lesbaren Audiostream.');
  reportProgress(
    onProgress,
    8,
    'Loudness messen',
    `Der komplette ${Math.max(1, Math.round(probe.duration / 60))}-Minuten-Mitschnitt wird auf LUFS und True Peak geprüft.`,
  );
  const loudness = await measureAudio(sourcePath, validated, false, {
    duration: probe.duration,
    signal,
    onProgress: (progress) => reportProgress(
      onProgress,
      8 + (progress * 0.9),
      'Loudness messen',
      `Signal wird vollständig gelesen · FFmpeg ${progress}%`,
    ),
  });
  const qualityScore = calculateTechnicalQualityScore({
    loudness,
    probe,
    targetConfig: validated,
  });
  const expectedFormat = getAudioFormat(validated.outputFormat);
  const predictedQualityScore = predictTechnicalQualityScore({
    analysis: { loudness, probe, config: validated },
    config: validated,
    outputProbe: {
      codec: expectedFormat.codec,
      bitRate: expectedFormat.bitRate,
      sampleRate: validated.sampleRate,
      channels: probe.channels,
    },
  });
  reportProgress(onProgress, 100, 'Analyse abgeschlossen', 'Quelldaten, LUFS, True Peak und technischer Qualitätsscore sind vollständig ermittelt.');
  return {
    sourcePath,
    probe,
    loudness,
    qualityScore,
    predictedQualityScore,
    config: validated,
    analyzedAt: new Date().toISOString(),
  };
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
  const masteringProgress = (progress, phase, message) => reportProgress(onProgress, progress, phase, message, 'mastering');
  const analysis = await analyzeAudio({
    sourcePath,
    config,
    signal,
    onProgress: (progress, detail) => masteringProgress(
      progress * 0.12,
      'Quelle analysieren',
      detail?.message || 'Quelldaten werden geprüft.',
    ),
  });
  const validated = analysis.config;
  const outputDir = path.resolve(outputDirectory || path.join(path.dirname(sourcePath), 'airdox-mastered'));
  await fs.mkdir(outputDir, { recursive: true });
  const outputExtension = resolveAudioExtension(validated.outputFormat);
  const outputPath = await nextAvailablePath(outputDir, safeBaseName(sourcePath), outputExtension);
  const tempPath = path.join(outputDir, `.${safeBaseName(sourcePath)}-mastering-${Date.now()}.${outputExtension}`);
  masteringProgress(13, 'Klangformung vorbereiten', 'EQ, Kompression und Stereo-Breite werden gegen das Original vermessen.');
  const measuredAfterTone = await measureAudio(sourcePath, validated, true, {
    duration: analysis.probe.duration,
    signal,
    onProgress: (progress) => masteringProgress(
      13 + (progress * 0.17),
      'Klangformung vermessen',
      `EQ- und Dynamikprofil werden analysiert · FFmpeg ${progress}%`,
    ),
  });
  const filter = `${buildToneFilter(validated)},${buildLoudnormFilter(validated, measuredAfterTone)},aresample=${validated.sampleRate}`;
  try {
    masteringProgress(30, 'Master rendern', 'Klangformung und 2-Pass-Loudness werden in die Ausgabedatei geschrieben.');
    await runProcess('ffmpeg', ['-hide_banner', '-y', '-nostdin', '-i', sourcePath, '-map_metadata', '0', '-map', '0:a:0', '-af', filter, ...getAudioCodecArgs(validated.outputFormat), '-progress', 'pipe:1', '-nostats', tempPath], {
      duration: analysis.probe.duration,
      onProgress: (progress) => masteringProgress(
        30 + (progress * 0.52),
        'Master rendern',
        `Ausgabedatei wird erzeugt · FFmpeg ${progress}%`,
      ),
      signal,
    });
    masteringProgress(83, 'Ausgabe verifizieren', 'Dauer, Codec, Loudness und True Peak werden technisch geprüft.');
    const outputProbe = await probeAudio(tempPath, { signal });
    const outputLoudness = await measureAudio(tempPath, validated, false, {
      duration: outputProbe.duration,
      signal,
      onProgress: (progress) => masteringProgress(
        83 + (progress * 0.16),
        'Ausgabe verifizieren',
        `Master wird vollständig gegengeprüft · FFmpeg ${progress}%`,
      ),
    });
    const durationDelta = Math.abs(outputProbe.duration - analysis.probe.duration);
    const actualLufs = Number(outputLoudness.input_i);
    const actualPeak = Number(outputLoudness.input_tp);
    if (durationDelta > Math.max(0.25, analysis.probe.duration * 0.0001)) throw new Error(`Dauerprüfung fehlgeschlagen (${durationDelta.toFixed(3)} s Abweichung).`);
    if (actualPeak > validated.truePeak + 0.2) throw new Error(`True-Peak-Ziel verfehlt (${actualPeak} dBTP).`);
    if (Math.abs(actualLufs - validated.targetLufs) > 1) throw new Error(`Loudness-Ziel verfehlt (${actualLufs} LUFS).`);
    await fs.rename(tempPath, outputPath);
    const outputQualityScore = calculateTechnicalQualityScore({
      loudness: outputLoudness,
      probe: outputProbe,
      sourceProbe: analysis.probe,
      targetConfig: validated,
    });
    const report = {
      sourcePath,
      outputPath,
      input: analysis,
      output: {
        probe: outputProbe,
        loudness: outputLoudness,
        qualityScore: outputQualityScore,
      },
      config: validated,
      filter,
      completedAt: new Date().toISOString(),
    };
    await fs.writeFile(`${outputPath}.mastering.json`, JSON.stringify(report, null, 2), 'utf8');
    masteringProgress(100, 'Mastering abgeschlossen', 'Ausgabedatei und Prüfbericht wurden erfolgreich gespeichert.');
    return report;
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
};

export const _internal = {
  probeAudio,
  measureAudio,
  outputCodecArgs: getAudioCodecArgs,
  safeBaseName,
  nextAvailablePath,
  escapeFilterValue,
};
