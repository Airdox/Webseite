/**
 * Transparent technical audio-quality/readiness score.
 *
 * Measurement basis:
 * - ITU-R BS.1770-5 defines programme loudness and true-peak measurement:
 *   https://www.itu.int/rec/R-REC-BS.1770-5-202311-I
 * - EBU Tech 3342 defines LRA as a supplementary descriptor and explicitly
 *   warns against treating one LRA value as a universal delivery limit:
 *   https://tech.ebu.ch/publications/tech3342
 * - Spotify's current delivery guidance uses -14 LUFS and recommends true
 *   peak below -1 dBTP (or below -2 dBTP for louder masters):
 *   https://support.spotify.com/artists/article/loudness-normalization/
 * - FFmpeg loudnorm exposes measured_I, measured_LRA and measured_TP:
 *   https://ffmpeg.org/ffmpeg-filters.html#loudnorm
 *
 * This is an AIRDOX interpretation of those measurements, not a standardised
 * score and not a claim about artistic or perceived sound quality.
 */

export const AUDIO_QUALITY_SCORE_MODEL = Object.freeze({
  id: 'airdox-technical-audio-score',
  version: 1,
  weights: Object.freeze({
    loudness: 30,
    truePeak: 30,
    loudnessRange: 15,
    sourceResolution: 15,
    signalIntegrity: 10,
  }),
  sources: Object.freeze([
    Object.freeze({
      id: 'itu-bs-1770-5',
      title: 'ITU-R BS.1770-5: Algorithms to measure audio programme loudness and true-peak audio level',
      url: 'https://www.itu.int/rec/R-REC-BS.1770-5-202311-I',
    }),
    Object.freeze({
      id: 'ebu-tech-3342',
      title: 'EBU Tech 3342: Loudness Range',
      url: 'https://tech.ebu.ch/publications/tech3342',
    }),
    Object.freeze({
      id: 'spotify-loudness',
      title: 'Spotify: Loudness normalization and mastering tips',
      url: 'https://support.spotify.com/artists/article/loudness-normalization/',
    }),
    Object.freeze({
      id: 'ffmpeg-loudnorm',
      title: 'FFmpeg loudnorm filter documentation',
      url: 'https://ffmpeg.org/ffmpeg-filters.html#loudnorm',
    }),
  ]),
});

const DISCLAIMER = 'Technischer Orientierungswert aus vorhandenen Messdaten – kein standardisierter Klangtest. Raumakustik, Störgeräusche, Verzerrungen, Frequenzbalance und musikalische Wirkung werden nur berücksichtigt, wenn dafür eigene Messwerte vorliegen.';
const PREDICTION_DISCLAIMER = 'Prognose aus den gewählten Mastering-Zielen, keine Messung einer gerenderten Datei. Erst die Analyse der fertigen Ausgabe kann den tatsächlichen Wert bestätigen.';

const LOSSLESS_CODECS = new Set([
  'alac',
  'ape',
  'flac',
  'mlp',
  'shorten',
  'tak',
  'tta',
  'wavpack',
]);

const LOSSY_CODECS = new Set([
  'aac',
  'ac3',
  'eac3',
  'mp2',
  'mp3',
  'opus',
  'vorbis',
  'wma',
  'wmav1',
  'wmav2',
]);

const finiteNumber = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const roundScore = (value) => Math.round(clamp(value));

const interpolateDescending = (value, points) => {
  const distance = Math.max(0, Number(value));
  if (distance <= points[0][0]) return points[0][1];
  for (let index = 1; index < points.length; index += 1) {
    const [upperX, upperScore] = points[index];
    const [lowerX, lowerScore] = points[index - 1];
    if (distance <= upperX) {
      const ratio = (distance - lowerX) / (upperX - lowerX);
      return lowerScore + ((upperScore - lowerScore) * ratio);
    }
  }
  return points.at(-1)[1];
};

const buildMetric = ({
  key,
  label,
  weight,
  score = null,
  value = null,
  target = null,
  unit = '',
  explanation,
  measured = true,
}) => ({
  key,
  label,
  weight,
  available: Number.isFinite(score),
  score: Number.isFinite(score) ? roundScore(score) : null,
  value,
  target,
  unit,
  measured,
  explanation,
});

const gradeFor = (score, available) => {
  if (!available) return Object.freeze({ code: 'N/A', label: 'Nicht bewertbar' });
  if (score >= 90) return Object.freeze({ code: 'A', label: 'Technisch sehr gut' });
  if (score >= 80) return Object.freeze({ code: 'B', label: 'Technisch gut' });
  if (score >= 70) return Object.freeze({ code: 'C', label: 'Technisch solide' });
  if (score >= 55) return Object.freeze({ code: 'D', label: 'Technisch auffällig' });
  return Object.freeze({ code: 'E', label: 'Technisch kritisch' });
};

const scoreLoudness = (actual, target) => {
  if (actual === null || target === null) return null;
  return interpolateDescending(Math.abs(actual - target), [
    [0.5, 100],
    [1, 95],
    [2, 80],
    [3, 60],
    [5, 30],
    [10, 0],
  ]);
};

const scoreTruePeak = (actual, ceiling) => {
  if (actual === null || ceiling === null) return null;
  const exceedance = actual - ceiling;
  if (exceedance <= 0) return 100;
  return interpolateDescending(exceedance, [
    [0, 100],
    [0.1, 85],
    [0.3, 55],
    [0.5, 25],
    [1, 0],
  ]);
};

const scoreLoudnessRange = (actual, target) => {
  if (actual === null || target === null) return null;
  return interpolateDescending(Math.abs(actual - target), [
    [2, 100],
    [4, 85],
    [7, 65],
    [12, 40],
    [20, 15],
  ]);
};

const codecKind = (codec = '') => {
  const normalized = String(codec).trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (normalized.startsWith('pcm_') || LOSSLESS_CODECS.has(normalized)) return 'lossless';
  if (LOSSY_CODECS.has(normalized)) return 'lossy';
  return 'unknown';
};

const sampleRateScore = (sampleRate) => {
  if (sampleRate === null || sampleRate <= 0) return null;
  if (sampleRate >= 44100) return 100;
  if (sampleRate >= 32000) return 70;
  if (sampleRate >= 22050) return 45;
  return 20;
};

const codecScore = (codec, bitRate) => {
  const kind = codecKind(codec);
  if (kind === 'lossless') return 100;
  if (kind === 'unknown') return codec ? 60 : null;
  if (bitRate === null || bitRate <= 0) return 60;
  if (bitRate >= 256000) return 90;
  if (bitRate >= 192000) return 82;
  if (bitRate >= 128000) return 65;
  if (bitRate >= 96000) return 45;
  return 25;
};

const scoreSingleResolution = (probe) => {
  const sampleRate = finiteNumber(probe?.sampleRate, probe?.sample_rate);
  const bitRate = finiteNumber(probe?.bitRate, probe?.bit_rate);
  const codec = probe?.codec ?? probe?.codec_name ?? '';
  const parts = [sampleRateScore(sampleRate), codecScore(codec, bitRate)].filter(Number.isFinite);
  if (!parts.length) return { score: null, sampleRate, bitRate, codec, codecKind: codecKind(codec) };
  return {
    score: parts.reduce((sum, part) => sum + part, 0) / parts.length,
    sampleRate,
    bitRate,
    codec,
    codecKind: codecKind(codec),
  };
};

const scoreSourceResolution = (probe, sourceProbe = null) => {
  const output = scoreSingleResolution(probe);
  if (!sourceProbe) return output;
  const source = scoreSingleResolution(sourceProbe);
  const candidates = [source, output].filter(({ score }) => Number.isFinite(score));
  const limiting = candidates.sort((left, right) => left.score - right.score)[0] || output;
  return {
    ...limiting,
    source,
    output,
  };
};

const clippingRatioFrom = (signalMetrics) => {
  const direct = finiteNumber(signalMetrics?.clippingRatio, signalMetrics?.clippedSampleRatio);
  if (direct !== null) return clamp(direct, 0, 1);
  const clippedSamples = finiteNumber(signalMetrics?.clippedSamples);
  const totalSamples = finiteNumber(signalMetrics?.totalSamples, signalMetrics?.sampleCount);
  if (clippedSamples !== null && totalSamples !== null && totalSamples > 0) {
    return clamp(clippedSamples / totalSamples, 0, 1);
  }
  if (typeof signalMetrics?.detectedClipping === 'boolean') return signalMetrics.detectedClipping ? 0.001 : 0;
  return null;
};

const clippingScore = (ratio) => {
  if (ratio === null) return null;
  return interpolateDescending(ratio, [
    [0, 100],
    [0.0000001, 95],
    [0.00001, 80],
    [0.0001, 55],
    [0.001, 25],
    [0.01, 0],
  ]);
};

const dcOffsetScore = (offset) => {
  if (offset === null) return null;
  return interpolateDescending(Math.abs(offset), [
    [0.001, 100],
    [0.003, 90],
    [0.01, 60],
    [0.03, 30],
    [0.1, 0],
  ]);
};

const scoreSignalIntegrity = (signalMetrics) => {
  const clippingRatio = clippingRatioFrom(signalMetrics);
  const dcOffset = finiteNumber(signalMetrics?.dcOffset, signalMetrics?.dcOffsetAbsolute);
  const parts = [clippingScore(clippingRatio), dcOffsetScore(dcOffset)].filter(Number.isFinite);
  return {
    score: parts.length ? parts.reduce((sum, part) => sum + part, 0) / parts.length : null,
    clippingRatio,
    dcOffset,
  };
};

const addFindings = ({ metrics, issues, strengths }) => {
  const { loudness, truePeak, loudnessRange, sourceResolution, signalIntegrity } = metrics;

  if (loudness.available) {
    const distance = Math.abs(loudness.value - loudness.target);
    if (distance > 2) issues.push(`Lautheit liegt ${distance.toFixed(1)} LU vom gewählten Ziel.`);
    else if (distance <= 1) strengths.push('Integrierte Lautheit liegt nahe am gewählten Ziel.');
  }

  if (truePeak.available) {
    const exceedance = truePeak.value - truePeak.target;
    if (exceedance > 0) issues.push(`True Peak überschreitet die gewählte Obergrenze um ${exceedance.toFixed(1)} dB.`);
    else strengths.push('True Peak hält die gewählte Obergrenze ein.');
  }

  if (loudnessRange.available) {
    const distance = Math.abs(loudnessRange.value - loudnessRange.target);
    if (distance > 4) issues.push(`LRA weicht ${distance.toFixed(1)} LU vom Arbeitsziel ab; LRA ist laut EBU keine universelle Qualitätsgrenze.`);
    else if (distance <= 2) strengths.push('LRA liegt im breiten Korridor des gewählten Arbeitsziels.');
  }

  if (sourceResolution.available) {
    if (sourceResolution.score < 60) issues.push('Samplerate oder verlustbehaftete Quellbitrate begrenzen die technische Reserve.');
    else if (sourceResolution.score >= 90) strengths.push('Quellformat und Samplerate bieten eine hohe technische Reserve.');
  }

  if (signalIntegrity.available) {
    if (signalIntegrity.score < 70) issues.push('Gemessene Clipping- oder DC-Offset-Werte sind technisch auffällig.');
    else if (signalIntegrity.score >= 90) strengths.push('Die gelieferten Signalfehler-Messwerte sind unauffällig.');
  }
};

const confidenceFor = (availableWeight, prediction = false) => {
  const percent = prediction ? Math.min(40, Math.round(availableWeight * 0.4)) : Math.round(availableWeight);
  const level = percent >= 80 ? 'hoch' : percent >= 50 ? 'mittel' : 'niedrig';
  return {
    percent,
    level,
    explanation: prediction
      ? 'Zielwerte sind geschätzt; eine Messung der gerenderten Datei fehlt.'
      : `${availableWeight}% der Modellgewichtung beruhen auf vorhandenen Messwerten.`,
  };
};

/**
 * Calculate a technical score from actual file measurements.
 * Missing dimensions are omitted from the weighted mean and reduce confidence.
 */
export const calculateTechnicalQualityScore = ({
  loudness = {},
  probe = {},
  sourceProbe = null,
  targetConfig = {},
  signalMetrics = {},
} = {}) => {
  const integratedLufs = finiteNumber(loudness?.input_i, loudness?.integratedLufs, loudness?.integrated);
  const truePeakDbtp = finiteNumber(loudness?.input_tp, loudness?.truePeakDbtp, loudness?.truePeak);
  const lra = finiteNumber(loudness?.input_lra, loudness?.loudnessRange, loudness?.lra);
  const targetLufs = finiteNumber(targetConfig?.targetLufs, targetConfig?.integratedLufs);
  const truePeakCeiling = finiteNumber(targetConfig?.truePeak, targetConfig?.truePeakDbtp);
  const targetLra = finiteNumber(targetConfig?.loudnessRange, targetConfig?.lra);
  const resolution = scoreSourceResolution(probe, sourceProbe);
  const integrity = scoreSignalIntegrity(signalMetrics);

  const metrics = {
    loudness: buildMetric({
      key: 'loudness',
      label: 'Ziel-Lautheit',
      weight: AUDIO_QUALITY_SCORE_MODEL.weights.loudness,
      score: scoreLoudness(integratedLufs, targetLufs),
      value: integratedLufs,
      target: targetLufs,
      unit: 'LUFS',
      explanation: 'Abstand der nach ITU-R BS.1770 gemessenen integrierten Lautheit zum gewählten Arbeitsziel.',
    }),
    truePeak: buildMetric({
      key: 'truePeak',
      label: 'True-Peak-Reserve',
      weight: AUDIO_QUALITY_SCORE_MODEL.weights.truePeak,
      score: scoreTruePeak(truePeakDbtp, truePeakCeiling),
      value: truePeakDbtp,
      target: truePeakCeiling,
      unit: 'dBTP',
      explanation: 'Einhaltung der gewählten maximalen True-Peak-Obergrenze; Werte darunter werden nicht zusätzlich belohnt.',
    }),
    loudnessRange: buildMetric({
      key: 'loudnessRange',
      label: 'Loudness Range',
      weight: AUDIO_QUALITY_SCORE_MODEL.weights.loudnessRange,
      score: scoreLoudnessRange(lra, targetLra),
      value: lra,
      target: targetLra,
      unit: 'LU',
      explanation: 'Breit tolerierter Abstand zum Arbeitsziel. EBU LRA beschreibt Makrodynamik und ist keine universelle Qualitätsgrenze.',
    }),
    sourceResolution: buildMetric({
      key: 'sourceResolution',
      label: 'Technische Quellenreserve',
      weight: AUDIO_QUALITY_SCORE_MODEL.weights.sourceResolution,
      score: resolution.score,
      value: {
        codec: resolution.codec || null,
        codecKind: resolution.codecKind,
        sampleRate: resolution.sampleRate,
        bitRate: resolution.bitRate,
        source: resolution.source || null,
        output: resolution.output || null,
      },
      target: null,
      explanation: 'Schwächste technische Reserve aus Originalquelle und Ausgabe. Konvertierung oder Upsampling können verlorene Information nicht wiederherstellen.',
    }),
    signalIntegrity: buildMetric({
      key: 'signalIntegrity',
      label: 'Signalintegrität',
      weight: AUDIO_QUALITY_SCORE_MODEL.weights.signalIntegrity,
      score: integrity.score,
      value: {
        clippingRatio: integrity.clippingRatio,
        dcOffset: integrity.dcOffset,
      },
      target: { clippingRatio: 0, dcOffset: 0 },
      explanation: 'Nur explizit gelieferte Clipping- und DC-Offset-Messwerte; ohne diese Daten wird die Dimension ausgelassen.',
    }),
  };

  const availableMetrics = Object.values(metrics).filter((metric) => metric.available);
  const availableWeight = availableMetrics.reduce((sum, metric) => sum + metric.weight, 0);
  const weightedScore = availableWeight
    ? availableMetrics.reduce((sum, metric) => sum + (metric.score * metric.weight), 0) / availableWeight
    : 0;
  const score = roundScore(weightedScore);
  const issues = [];
  const strengths = [];
  addFindings({ metrics, issues, strengths });
  if (!availableWeight) issues.push('Keine verwertbaren technischen Messwerte vorhanden.');
  else if (availableWeight < 80) issues.push('Der Wert ist wegen fehlender Messdimensionen nur eingeschränkt belastbar.');

  return {
    model: { id: AUDIO_QUALITY_SCORE_MODEL.id, version: AUDIO_QUALITY_SCORE_MODEL.version },
    score,
    scoreAvailable: availableWeight > 0,
    grade: gradeFor(score, availableWeight > 0),
    breakdown: metrics,
    issues,
    strengths,
    confidence: confidenceFor(availableWeight),
    disclaimer: DISCLAIMER,
  };
};

const analysisParts = (analysis = {}) => ({
  loudness: analysis?.loudness ?? analysis?.input?.loudness ?? {},
  probe: analysis?.probe ?? analysis?.input?.probe ?? {},
  signalMetrics: analysis?.signalMetrics ?? analysis?.input?.signalMetrics ?? {},
  config: analysis?.config ?? analysis?.input?.config ?? {},
});

/**
 * Estimate the technical score if configured mastering targets are reached.
 * Source-resolution and signal-error dimensions remain tied to the input:
 * transcoding or normalisation cannot recover information already lost.
 */
export const predictTechnicalQualityScore = ({ analysis = {}, config = {}, outputProbe = null } = {}) => {
  const parts = analysisParts(analysis);
  const targetConfig = { ...parts.config, ...config };
  const targetLufs = finiteNumber(targetConfig?.targetLufs, targetConfig?.integratedLufs);
  const truePeak = finiteNumber(targetConfig?.truePeak, targetConfig?.truePeakDbtp);
  const loudnessRange = finiteNumber(targetConfig?.loudnessRange, targetConfig?.lra);
  const predictedLoudness = {
    input_i: targetLufs,
    input_tp: truePeak,
    input_lra: loudnessRange,
  };
  const result = calculateTechnicalQualityScore({
    loudness: predictedLoudness,
    probe: outputProbe || parts.probe,
    sourceProbe: outputProbe ? parts.probe : null,
    targetConfig,
    signalMetrics: parts.signalMetrics,
  });
  const estimatedKeys = new Set(['loudness', 'truePeak', 'loudnessRange']);
  const breakdown = Object.fromEntries(Object.entries(result.breakdown).map(([key, metric]) => [
    key,
    { ...metric, measured: !estimatedKeys.has(key) },
  ]));
  const hasTargets = [targetLufs, truePeak, loudnessRange].some((value) => value !== null);
  const uncertainty = hasTargets ? 8 : 15;

  return {
    ...result,
    predicted: true,
    scoreRange: {
      min: clamp(result.score - uncertainty),
      max: clamp(result.score + uncertainty),
    },
    breakdown,
    issues: [
      'Prognose noch nicht durch eine Messung der gerenderten Datei bestätigt.',
      ...result.issues,
    ],
    confidence: confidenceFor(
      Object.values(result.breakdown)
        .filter((metric) => metric.available)
        .reduce((sum, metric) => sum + metric.weight, 0),
      true,
    ),
    disclaimer: `${PREDICTION_DISCLAIMER} ${DISCLAIMER}`,
  };
};

export const _internal = Object.freeze({
  clippingRatioFrom,
  codecKind,
  finiteNumber,
  interpolateDescending,
  scoreLoudness,
  scoreLoudnessRange,
  scoreSignalIntegrity,
  scoreSingleResolution,
  scoreSourceResolution,
  scoreTruePeak,
});
