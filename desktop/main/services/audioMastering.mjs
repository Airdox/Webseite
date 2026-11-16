import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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
    targetLufs: -14, truePeak: -1.5, loudnessRange: 9, highpassHz: 28,
    bassGainDb: 1.2, mudCutDb: -1, presenceGainDb: 0.8, trebleGainDb: 1.4,
    compressorThresholdDb: -18, compressorRatio: 1.65, attackMs: 24, releaseMs: 260, makeupDb: 0.8,
    stereoWidth: 1.0, outputFormat: 'wav', sampleRate: 48000,
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

const outputLoudnessFromRender = (measurement) => ({
  input_i: measurement.output_i,
  input_tp: measurement.output_tp,
  input_lra: measurement.output_lra,
  input_thresh: measurement.output_thresh,
  target_offset: measurement.target_offset,
  normalization_type: measurement.normalization_type,
  measurementSource: 'render',
  renderMeasurement: measurement,
});

const parseEbur128Summary = (stderr = '') => {
  const summaryIndex = String(stderr).lastIndexOf('Summary:');
  if (summaryIndex < 0) throw new Error('FFmpeg hat keine verwertbare Render-Messung geliefert.');
  const summary = String(stderr).slice(summaryIndex);
  const integrated = summary.match(/Integrated loudness:\s*[\s\S]*?I:\s*(-?[\d.]+)\s+LUFS/i);
  const threshold = summary.match(/Integrated loudness:\s*[\s\S]*?Threshold:\s*(-?[\d.]+)\s+LUFS/i);
  const loudnessRange = summary.match(/Loudness range:\s*[\s\S]*?LRA:\s*(-?[\d.]+)\s+LU/i);
  const samplePeak = summary.match(/Sample peak:\s*[\s\S]*?Peak:\s*(-?[\d.]+)\s+dBFS/i);
  if (!integrated || !loudnessRange || !samplePeak) throw new Error('FFmpeg-Render-Messung ist unvollständig.');
  return {
    input_i: integrated[1],
    input_tp: samplePeak[1],
    input_lra: loudnessRange[1],
    input_thresh: threshold?.[1] || '0',
    measurementSource: 'render',
    peakKind: 'sample',
    normalization_type: 'linear-fast',
  };
};

const chooseNormalizationStrategy = (config, measurement) => {
  const integrated = Number(measurement?.input_i);
  const loudnessRange = Number(measurement?.input_lra);
  const truePeak = Number(measurement?.input_tp);
  if (![integrated, loudnessRange, truePeak].every(Number.isFinite)) {
    return { mode: 'dynamic', reason: 'Messwerte unvollständig' };
  }
  const gainDb = config.targetLufs - integrated;
  const limiterReductionDb = Math.max(0, (truePeak + gainDb) - config.truePeak);
  const loudnessRangeExcess = Math.max(0, loudnessRange - config.loudnessRange);
  const safeForFastPath = gainDb >= -12
    && gainDb <= 6
    && limiterReductionDb <= 3
    && loudnessRangeExcess <= 2;
  return safeForFastPath
    ? { mode: 'linear-fast', gainDb, limiterReductionDb, loudnessRangeExcess }
    : { mode: 'dynamic', gainDb, limiterReductionDb, loudnessRangeExcess, reason: 'Dynamische Korrektur erforderlich' };
};

const buildFastLevelFilter = (config, strategy) => {
  const limiter = 10 ** (config.truePeak / 20);
  return `volume=${strategy.gainDb.toFixed(3)}dB,alimiter=limit=${limiter.toFixed(6)}:attack=5:release=50:level=false,ebur128=peak=sample:framelog=quiet`;
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

const abortError = (message = 'Audio-Optimierung abgebrochen.') => new Error(message);

const throwIfAborted = (signal, message) => {
  if (signal?.aborted) throw abortError(message);
};

const readSourceSignature = async (sourcePath) => {
  const resolvedPath = path.resolve(String(sourcePath));
  const sourceStat = await fs.stat(resolvedPath);
  return {
    path: resolvedPath,
    size: sourceStat.size,
    mtimeMs: sourceStat.mtimeMs,
  };
};

const sourceSignaturesMatch = (left, right) => Boolean(
  left
  && right
  && path.resolve(String(left.path)) === path.resolve(String(right.path))
  && Number(left.size) === Number(right.size)
  && Number(left.mtimeMs) === Number(right.mtimeMs)
);

const assertStereoPolicy = (probe, label = 'Audioquelle') => {
  if (Number(probe?.channels) !== 2) {
    throw new Error(`${label} muss Stereo mit genau 2 Kanälen sein. Mono- und Surround-Dateien werden nicht automatisch umgemischt.`);
  }
  const channelLayout = String(probe?.channelLayout || '').trim().toLowerCase();
  if (channelLayout && channelLayout !== 'stereo') {
    throw new Error(`${label} hat das nicht unterstützte Kanallayout "${channelLayout}". Erforderlich ist explizites Stereo.`);
  }
};

const probeAudio = async (sourcePath, { signal } = {}) => {
  const { stdout } = await runProcess('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'format=duration,size,format_name:stream=codec_name,sample_rate,channels,channel_layout,bit_rate', '-of', 'json', sourcePath], { signal });
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

const REPRESENTATIVE_ANALYSIS_THRESHOLD_SECONDS = 10 * 60;
const REPRESENTATIVE_SEGMENT_SECONDS = 45;

const representativeSegmentsFor = (duration) => {
  const safeDuration = Math.max(0, Number(duration) || 0);
  if (safeDuration <= REPRESENTATIVE_ANALYSIS_THRESHOLD_SECONDS) return [];
  const segmentDuration = Math.min(REPRESENTATIVE_SEGMENT_SECONDS, safeDuration / 3);
  return [0.1, 0.5, 0.85].map((position) => ({
    start: Math.max(0, Math.min(safeDuration - segmentDuration, (safeDuration * position) - (segmentDuration / 2))),
    duration: segmentDuration,
  }));
};

const calibrationSegmentsFor = (duration) => {
  const safeDuration = Math.max(0, Number(duration) || 0);
  if (safeDuration <= REPRESENTATIVE_SEGMENT_SECONDS * 3) return [];
  const segmentDuration = REPRESENTATIVE_SEGMENT_SECONDS;
  return [0.1, 0.5, 0.85].map((position) => ({
    start: Math.max(0, Math.min(safeDuration - segmentDuration, (safeDuration * position) - (segmentDuration / 2))),
    duration: segmentDuration,
  }));
};

const measureRepresentativeAudio = async (sourcePath, config, duration, {
  calibration = false, includeTone = false, onProgress, signal,
} = {}) => {
  const segments = calibration ? calibrationSegmentsFor(duration) : representativeSegmentsFor(duration);
  if (!segments.length) {
    return {
      loudness: await measureAudio(sourcePath, config, includeTone, { duration, onProgress, signal }),
      scope: { mode: 'full', measuredDuration: duration, segments: [{ start: 0, duration }] },
    };
  }

  const inputArgs = segments.flatMap((segment) => [
    '-ss', segment.start.toFixed(3),
    '-t', segment.duration.toFixed(3),
    '-i', sourcePath,
  ]);
  const inputLabels = segments.map((_segment, index) => `[${index}:a:0]`).join('');
  const filters = [
    `${inputLabels}concat=n=${segments.length}:v=0:a=1`,
    includeTone ? buildToneFilter(config) : '',
    buildLoudnormFilter(config),
  ].filter(Boolean).join(',');
  const filter = `${filters}[measured]`;
  const measuredDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
  const progressArgs = onProgress ? ['-progress', 'pipe:1', '-nostats'] : [];
  const { stderr } = await runProcess('ffmpeg', [
    '-hide_banner', '-nostdin',
    ...inputArgs,
    '-filter_complex', filter,
    '-map', '[measured]',
    ...progressArgs,
    '-f', 'null', '-',
  ], { duration: measuredDuration, onProgress, signal });
  return {
    loudness: parseLoudnormJson(stderr),
    scope: { mode: 'representative', measuredDuration, segments },
  };
};

const reportProgress = (callback, progress, phase, message, operation = 'analysis') => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));
  callback?.(safeProgress, { operation, phase, message });
};

export const analyzeAudio = async ({ sourcePath, config = {}, onProgress, signal }) => {
  if (!sourcePath) throw new Error('Keine Audioquelle ausgewählt.');
  const resolvedSourcePath = path.resolve(String(sourcePath));
  reportProgress(onProgress, 1, 'Audioquelle prüfen', 'Datei und Leserechte werden geprüft.');
  await fs.access(resolvedSourcePath);
  const sourceSignature = await readSourceSignature(resolvedSourcePath);
  throwIfAborted(signal, 'Audioanalyse abgebrochen.');
  const validated = validateMasteringConfig(config);
  reportProgress(onProgress, 4, 'Metadaten lesen', 'Codec, Dauer, Samplerate und Kanäle werden ermittelt.');
  const probe = await probeAudio(resolvedSourcePath, { signal });
  if (!probe.duration || !probe.channels) throw new Error('Die ausgewählte Datei enthält keinen lesbaren Audiostream.');
  assertStereoPolicy(probe);
  const representative = probe.duration > REPRESENTATIVE_ANALYSIS_THRESHOLD_SECONDS;
  reportProgress(onProgress, 8, 'Loudness messen', representative
    ? 'Repräsentative Abschnitte aus Anfang, Mitte und Ende werden gemessen.'
    : 'Der kurze Mitschnitt wird vollständig auf LUFS und True Peak gemessen.');
  const measurement = await measureRepresentativeAudio(resolvedSourcePath, validated, probe.duration, {
    signal,
    onProgress: (progress) => reportProgress(
      onProgress,
      8 + (progress * 0.9),
      'Loudness messen',
      `${representative ? 'Repräsentative Abschnitte' : 'Signal'} werden gelesen · FFmpeg ${progress}%`,
    ),
  });
  const { loudness, scope } = measurement;
  const qualityScore = calculateTechnicalQualityScore({
    loudness,
    probe,
    targetConfig: validated,
  });
  if (scope.mode === 'representative') {
    qualityScore.confidence = {
      percent: Math.min(60, qualityScore.confidence?.percent || 0),
      level: 'mittel',
      explanation: 'Loudness und True Peak stammen aus repräsentativen Abschnitten; der finale Render verarbeitet das vollständige Set.',
    };
    qualityScore.issues = [
      'Quellmessung basiert für einen schnellen Start auf repräsentativen Abschnitten.',
      ...(qualityScore.issues || []),
    ];
  }
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
  const verifiedSourceSignature = await readSourceSignature(resolvedSourcePath);
  if (!sourceSignaturesMatch(sourceSignature, verifiedSourceSignature)) {
    throw new Error('Die Audioquelle wurde während der Analyse geändert. Starte die Analyse mit der stabilen Quelldatei erneut.');
  }
  throwIfAborted(signal, 'Audioanalyse abgebrochen.');
  reportProgress(onProgress, 100, 'Analyse abgeschlossen', scope.mode === 'representative'
    ? 'Repräsentative Pegelwerte und technische Quelldaten sind ermittelt.'
    : 'Quelldaten, LUFS, True Peak und technischer Qualitätsscore sind ermittelt.');
  return {
    sourcePath: resolvedSourcePath,
    sourceSignature: verifiedSourceSignature,
    probe,
    loudness,
    scope,
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
    const [audioExists, reportExists] = await Promise.all([
      fs.access(candidate).then(() => true).catch(() => false),
      fs.access(`${candidate}.mastering.json`).then(() => true).catch(() => false),
    ]);
    if (!audioExists && !reportExists) return candidate;
  }
  throw new Error('Es konnte kein freier Ausgabename erzeugt werden.');
};

const analysisForConfig = (analysis, validated) => {
  const expectedFormat = getAudioFormat(validated.outputFormat);
  const qualityScore = calculateTechnicalQualityScore({
    loudness: analysis.loudness,
    probe: analysis.probe,
    targetConfig: validated,
  });
  const predictedQualityScore = predictTechnicalQualityScore({
    analysis: { loudness: analysis.loudness, probe: analysis.probe, config: validated },
    config: validated,
    outputProbe: {
      codec: expectedFormat.codec,
      bitRate: expectedFormat.bitRate,
      sampleRate: validated.sampleRate,
      channels: analysis.probe.channels,
    },
  });
  return {
    ...analysis,
    config: validated,
    qualityScore,
    predictedQualityScore,
  };
};

const reusableSourceAnalysis = async ({ sourcePath, sourceAnalysis, validated }) => {
  if (!sourceAnalysis?.probe || !sourceAnalysis?.loudness || !sourceAnalysis?.sourceSignature) return null;
  const currentSignature = await readSourceSignature(sourcePath);
  if (!sourceSignaturesMatch(sourceAnalysis.sourceSignature, currentSignature)) return null;
  assertStereoPolicy(sourceAnalysis.probe);
  return analysisForConfig(sourceAnalysis, validated);
};

export const masterAudio = async ({ sourcePath, outputDirectory, config = {}, sourceAnalysis = null, onProgress, signal }) => {
  if (!sourcePath) throw new Error('Keine Audioquelle ausgewählt.');
  const resolvedSourcePath = path.resolve(String(sourcePath));
  const masteringProgress = (progress, phase, message) => reportProgress(onProgress, progress, phase, message, 'mastering');
  const validated = validateMasteringConfig(config);
  throwIfAborted(signal);
  const reusedAnalysis = await reusableSourceAnalysis({
    sourcePath: resolvedSourcePath,
    sourceAnalysis,
    validated,
  });
  const analysis = reusedAnalysis || await analyzeAudio({
    sourcePath: resolvedSourcePath,
    config: validated,
    signal,
    onProgress: (progress, detail) => masteringProgress(
      progress * 0.12,
      'Quelle analysieren',
      detail?.message || 'Quelldaten werden geprüft.',
    ),
  });
  if (reusedAnalysis) {
    masteringProgress(12, 'Quellanalyse wiederverwenden', 'Die unveränderte Quelldatei wurde per Pfad, Größe und Änderungszeit bestätigt.');
  }
  const outputDir = path.resolve(outputDirectory || path.join(path.dirname(resolvedSourcePath), 'airdox-mastered'));
  await fs.mkdir(outputDir, { recursive: true });
  const outputExtension = resolveAudioExtension(validated.outputFormat);
  const outputPath = await nextAvailablePath(outputDir, safeBaseName(resolvedSourcePath), outputExtension);
  const reportPath = `${outputPath}.mastering.json`;
  const tempToken = randomUUID();
  const tempPath = path.join(outputDir, `.${safeBaseName(resolvedSourcePath)}-mastering-${tempToken}.${outputExtension}`);
  const tempReportPath = path.join(outputDir, `.${safeBaseName(resolvedSourcePath)}-mastering-${tempToken}.json`);
  let finalAudioWritten = false;
  let finalReportWritten = false;
  masteringProgress(13, 'Pegelstrategie bestimmen', 'Kurze repräsentative Abschnitte bestimmen den schnellsten sicheren Renderpfad.');
  try {
    const calibration = await measureRepresentativeAudio(resolvedSourcePath, validated, analysis.probe.duration, {
      calibration: true,
      includeTone: true,
      signal,
      onProgress: (progress) => masteringProgress(
        13 + (progress * 0.1),
        'Pegelstrategie bestimmen',
        `Repräsentative Klangformung wird gemessen · FFmpeg ${progress}%`,
      ),
    });
    const initialStrategy = chooseNormalizationStrategy(validated, calibration.loudness);
    let appliedStrategy = initialStrategy;
    let filter = '';
    let outputLoudness;
    const render = async (strategy, progressStart, progressSpan) => {
      filter = strategy.mode === 'linear-fast'
        ? `${buildToneFilter(validated)},${buildFastLevelFilter(validated, strategy)},aresample=${validated.sampleRate}`
        : `${buildToneFilter(validated)},${buildLoudnormFilter(validated)},aresample=${validated.sampleRate}`;
      const result = await runProcess('ffmpeg', ['-hide_banner', '-y', '-nostdin', '-i', resolvedSourcePath, '-map_metadata', '0', '-map', '0:a:0', '-af', filter, ...getAudioCodecArgs(validated.outputFormat), '-progress', 'pipe:1', '-nostats', tempPath], {
        duration: analysis.probe.duration,
        onProgress: (progress) => masteringProgress(
          progressStart + (progress * progressSpan),
          strategy.mode === 'linear-fast' ? 'Master schnell rendern' : 'Master dynamisch rendern',
          `Ausgabedatei wird erzeugt · FFmpeg ${progress}%`,
        ),
        signal,
      });
      return strategy.mode === 'linear-fast'
        ? parseEbur128Summary(result.stderr)
        : outputLoudnessFromRender(parseLoudnormJson(result.stderr));
    };

    try {
      outputLoudness = await render(initialStrategy, 24, initialStrategy.mode === 'linear-fast' ? 0.52 : 0.72);
    } catch (error) {
      if (initialStrategy.mode !== 'linear-fast') throw error;
      appliedStrategy = { mode: 'dynamic', reason: `Schnellpfad nicht auswertbar: ${error.message}` };
      masteringProgress(77, 'Dynamische Korrektur', 'Der Schnellpfad war nicht sicher auswertbar und wird gezielt ersetzt.');
      outputLoudness = await render(appliedStrategy, 77, 0.19);
    }

    const fastMetricsOutsideTarget = appliedStrategy.mode === 'linear-fast' && (
      !Number.isFinite(Number(outputLoudness.input_i))
      || !Number.isFinite(Number(outputLoudness.input_tp))
      || Number(outputLoudness.input_tp) > validated.truePeak + 0.2
      || Math.abs(Number(outputLoudness.input_i) - validated.targetLufs) > 1
    );
    if (fastMetricsOutsideTarget) {
      appliedStrategy = { mode: 'dynamic', reason: 'Schnellpfad lag außerhalb des Zielkorridors' };
      masteringProgress(77, 'Dynamische Korrektur', 'Nur dieser auffällige Render benötigt die aufwendigere Loudness-Korrektur.');
      outputLoudness = await render(appliedStrategy, 77, 0.19);
    }

    masteringProgress(97, 'Ausgabe prüfen', 'Datei, Dauer, Codec, Samplerate und Stereo-Layout werden geprüft.');
    const outputProbe = await probeAudio(tempPath, { signal });
    const durationDelta = Math.abs(outputProbe.duration - analysis.probe.duration);
    let actualLufs = Number(outputLoudness.input_i);
    let actualPeak = Number(outputLoudness.input_tp);
    if (durationDelta > Math.max(0.25, analysis.probe.duration * 0.0001)) throw new Error(`Dauerprüfung fehlgeschlagen (${durationDelta.toFixed(3)} s Abweichung).`);
    assertStereoPolicy(outputProbe, 'Gerenderte Ausgabe');
    if (outputProbe.channels !== analysis.probe.channels) throw new Error('Kanalprüfung fehlgeschlagen: Die Ausgabe entspricht nicht der Stereo-Quelle.');
    if (outputProbe.sampleRate !== validated.sampleRate) throw new Error(`Samplerate-Prüfung fehlgeschlagen (${outputProbe.sampleRate} Hz statt ${validated.sampleRate} Hz).`);
    if (outputProbe.codec !== getAudioFormat(validated.outputFormat).codec) throw new Error(`Codec-Prüfung fehlgeschlagen (${outputProbe.codec}).`);
    let verificationMode = 'render-metrics';
    if (!Number.isFinite(actualLufs) || !Number.isFinite(actualPeak)
      || actualPeak > validated.truePeak + 0.2
      || Math.abs(actualLufs - validated.targetLufs) > 1) {
      masteringProgress(98, 'Gezielte Tiefenprüfung', 'Die Render-Messwerte sind auffällig; nur deshalb wird die Ausgabe vollständig gegengeprüft.');
      outputLoudness = await measureAudio(tempPath, validated, false, { duration: outputProbe.duration, signal });
      actualLufs = Number(outputLoudness.input_i);
      actualPeak = Number(outputLoudness.input_tp);
      verificationMode = 'deep-fallback';
    }
    if (actualPeak > validated.truePeak + 0.2) throw new Error(`True-Peak-Ziel verfehlt (${actualPeak} dBTP).`);
    if (Math.abs(actualLufs - validated.targetLufs) > 1) throw new Error(`Loudness-Ziel verfehlt (${actualLufs} LUFS).`);
    const sourceSignatureBeforeCommit = await readSourceSignature(resolvedSourcePath);
    if (!sourceSignaturesMatch(analysis.sourceSignature, sourceSignatureBeforeCommit)) {
      throw new Error('Die Audioquelle wurde nach der Analyse geändert. Es wurde kein Master gespeichert.');
    }
    const outputQualityScore = calculateTechnicalQualityScore({
      loudness: outputLoudness,
      probe: outputProbe,
      sourceProbe: analysis.probe,
      targetConfig: validated,
    });
    const report = {
      sourcePath: resolvedSourcePath,
      outputPath,
      reportPath,
      analysisReused: Boolean(reusedAnalysis),
      normalization: {
        initialStrategy,
        appliedStrategy,
        calibrationScope: calibration.scope,
        verificationMode,
      },
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
    await fs.writeFile(tempReportPath, JSON.stringify(report, null, 2), { encoding: 'utf8', flag: 'wx' });
    masteringProgress(99, 'Ausgabe finalisieren', 'Verifiziertes Audio und Prüfbericht werden gemeinsam übernommen.');
    throwIfAborted(signal);
    await fs.rename(tempPath, outputPath);
    finalAudioWritten = true;
    throwIfAborted(signal);
    await fs.rename(tempReportPath, reportPath);
    finalReportWritten = true;
    throwIfAborted(signal);
    masteringProgress(100, 'Mastering abgeschlossen', 'Ausgabedatei und Prüfbericht wurden erfolgreich gespeichert.');
    throwIfAborted(signal);
    return report;
  } catch (error) {
    await Promise.all([
      fs.rm(tempPath, { force: true }).catch(() => {}),
      fs.rm(tempReportPath, { force: true }).catch(() => {}),
      finalAudioWritten ? fs.rm(outputPath, { force: true }).catch(() => {}) : Promise.resolve(),
      finalReportWritten ? fs.rm(reportPath, { force: true }).catch(() => {}) : Promise.resolve(),
    ]);
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
  assertStereoPolicy,
  readSourceSignature,
  representativeSegmentsFor,
  calibrationSegmentsFor,
  chooseNormalizationStrategy,
  parseEbur128Summary,
  sourceSignaturesMatch,
  reusableSourceAnalysis,
};
