import { describe, expect, it } from 'vitest';

import {
  AUDIO_QUALITY_SCORE_MODEL,
  _internal,
  calculateTechnicalQualityScore,
  predictTechnicalQualityScore,
} from '../../../desktop/main/services/audioQualityScore.mjs';

const targetConfig = {
  targetLufs: -14,
  truePeak: -1.2,
  loudnessRange: 9,
};

const measuredFile = {
  loudness: {
    input_i: '-14.2',
    input_tp: '-1.4',
    input_lra: '9.7',
  },
  probe: {
    codec: 'pcm_s24le',
    sampleRate: 48000,
    bitRate: 2304000,
    channels: 2,
  },
  targetConfig,
  signalMetrics: {
    clippedSamples: 0,
    totalSamples: 1_000_000,
    dcOffset: 0.0002,
  },
};

describe('technical audio quality score model', () => {
  it('publishes a versioned, immutable and primary-source-backed model', () => {
    expect(AUDIO_QUALITY_SCORE_MODEL).toMatchObject({
      id: 'airdox-technical-audio-score',
      version: 1,
      weights: {
        loudness: 30,
        truePeak: 30,
        loudnessRange: 15,
        sourceResolution: 15,
        signalIntegrity: 10,
      },
    });
    expect(Object.isFrozen(AUDIO_QUALITY_SCORE_MODEL)).toBe(true);
    expect(Object.isFrozen(AUDIO_QUALITY_SCORE_MODEL.sources)).toBe(true);
    expect(AUDIO_QUALITY_SCORE_MODEL.sources.map(({ id }) => id)).toEqual([
      'itu-bs-1770-5',
      'ebu-tech-3342',
      'spotify-loudness',
      'ffmpeg-loudnorm',
    ]);
    expect(AUDIO_QUALITY_SCORE_MODEL.sources.every(({ url }) => url.startsWith('https://'))).toBe(true);
  });

  it('scores a technically clean, target-aligned measured file highly', () => {
    const result = calculateTechnicalQualityScore(measuredFile);

    expect(result.scoreAvailable).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toEqual({ code: 'A', label: 'Technisch sehr gut' });
    expect(result.confidence).toMatchObject({ percent: 100, level: 'hoch' });
    expect(result.breakdown.loudness).toMatchObject({
      available: true,
      value: -14.2,
      target: -14,
      unit: 'LUFS',
      measured: true,
    });
    expect(result.breakdown.truePeak.score).toBe(100);
    expect(result.breakdown.sourceResolution.value).toMatchObject({
      codec: 'pcm_s24le',
      codecKind: 'lossless',
      sampleRate: 48000,
    });
    expect(result.strengths).toContain('True Peak hält die gewählte Obergrenze ein.');
    expect(result.disclaimer).toContain('kein standardisierter Klangtest');
  });

  it('reports concrete issues for target distance, peak excess and low source reserve', () => {
    const result = calculateTechnicalQualityScore({
      loudness: { input_i: -20, input_tp: -0.1, input_lra: 18 },
      probe: { codec: 'mp3', sampleRate: 22050, bitRate: 64000 },
      targetConfig,
      signalMetrics: { clippingRatio: 0.002, dcOffset: 0.05 },
    });

    expect(result.score).toBeLessThan(40);
    expect(result.grade.code).toBe('E');
    expect(result.issues).toEqual(expect.arrayContaining([
      'Lautheit liegt 6.0 LU vom gewählten Ziel.',
      'True Peak überschreitet die gewählte Obergrenze um 1.1 dB.',
      'LRA weicht 9.0 LU vom Arbeitsziel ab; LRA ist laut EBU keine universelle Qualitätsgrenze.',
      'Samplerate oder verlustbehaftete Quellbitrate begrenzen die technische Reserve.',
      'Gemessene Clipping- oder DC-Offset-Werte sind technisch auffällig.',
    ]));
  });

  it('does not punish absent dimensions but lowers measurement confidence', () => {
    const result = calculateTechnicalQualityScore({
      loudness: { input_i: -14 },
      targetConfig,
    });

    expect(result.score).toBe(100);
    expect(result.scoreAvailable).toBe(true);
    expect(result.confidence).toEqual({
      percent: 30,
      level: 'niedrig',
      explanation: '30% der Modellgewichtung beruhen auf vorhandenen Messwerten.',
    });
    expect(result.breakdown.truePeak.available).toBe(false);
    expect(result.breakdown.truePeak.score).toBeNull();
    expect(result.issues).toContain('Der Wert ist wegen fehlender Messdimensionen nur eingeschränkt belastbar.');
  });

  it('returns an explicit non-assessment instead of inventing a score from no data', () => {
    const result = calculateTechnicalQualityScore();

    expect(result).toMatchObject({
      score: 0,
      scoreAvailable: false,
      grade: { code: 'N/A', label: 'Nicht bewertbar' },
      confidence: { percent: 0, level: 'niedrig' },
    });
    expect(result.issues).toContain('Keine verwertbaren technischen Messwerte vorhanden.');
    expect(Object.values(result.breakdown).every(({ available }) => available === false)).toBe(true);
  });

  it.each([
    [{ input_i: -14.5 }, 100],
    [{ input_i: -15 }, 95],
    [{ input_i: -16 }, 80],
    [{ input_i: -17 }, 60],
    [{ input_i: -19 }, 30],
    [{ input_i: -24 }, 0],
  ])('uses transparent loudness-distance anchors for %o', (loudness, expected) => {
    const result = calculateTechnicalQualityScore({ loudness, targetConfig });
    expect(result.breakdown.loudness.score).toBe(expected);
  });

  it.each([
    [-1.2, 100],
    [-2, 100],
    [-1.1, 85],
    [-0.9, 55],
    [-0.7, 25],
    [-0.2, 0],
  ])('treats true peak %s dBTP as a ceiling, not a closeness target', (inputTp, expected) => {
    const result = calculateTechnicalQualityScore({
      loudness: { input_tp: inputTp },
      targetConfig,
    });
    expect(result.breakdown.truePeak.score).toBe(expected);
  });

  it.each([
    [7, 100],
    [5, 85],
    [2, 65],
    [21, 40],
    [29, 15],
  ])('applies broad, non-brickwall LRA anchors for %s LU', (inputLra, expected) => {
    const result = calculateTechnicalQualityScore({
      loudness: { input_lra: inputLra },
      targetConfig,
    });
    expect(result.breakdown.loudnessRange.score).toBe(expected);
  });

  it.each([
    [{ codec: 'flac', sampleRate: 48000 }, 100, 'lossless'],
    [{ codec_name: 'pcm_s16le', sample_rate: '44100' }, 100, 'lossless'],
    [{ codec: 'mp3', sampleRate: 48000, bitRate: 320000 }, 95, 'lossy'],
    [{ codec: 'aac', sampleRate: 32000, bitRate: 128000 }, 68, 'lossy'],
    [{ codec: 'mp3', sampleRate: 22050, bitRate: 64000 }, 35, 'lossy'],
    [{ codec: 'unknown_codec', sampleRate: 48000 }, 80, 'unknown'],
  ])('scores real source metadata %o without claiming restored resolution', (probe, expected, kind) => {
    const result = calculateTechnicalQualityScore({ probe });
    expect(result.breakdown.sourceResolution.score).toBe(expected);
    expect(result.breakdown.sourceResolution.value.codecKind).toBe(kind);
  });

  it('keeps the weakest source/output reserve across transcoding and upsampling', () => {
    const lowResolutionSource = { codec: 'mp3', sampleRate: 22050, bitRate: 64000 };
    const upsampledWav = { codec: 'pcm_s24le', sampleRate: 48000 };
    const upsampled = calculateTechnicalQualityScore({
      probe: upsampledWav,
      sourceProbe: lowResolutionSource,
    });

    expect(upsampled.breakdown.sourceResolution).toMatchObject({
      score: 35,
      value: {
        codec: 'mp3',
        sampleRate: 22050,
        source: { score: 35, codec: 'mp3' },
        output: { score: 100, codec: 'pcm_s24le' },
      },
    });

    const lossyOutput = calculateTechnicalQualityScore({
      probe: { codec: 'aac', sampleRate: 48000, bitRate: 128000 },
      sourceProbe: { codec: 'flac', sampleRate: 48000 },
    });
    expect(lossyOutput.breakdown.sourceResolution.score).toBeLessThan(100);
    expect(lossyOutput.breakdown.sourceResolution.value.codec).toBe('aac');
  });

  it('derives clipping ratio from sample counts and handles measured booleans', () => {
    expect(_internal.clippingRatioFrom({ clippedSamples: 5, totalSamples: 1000 })).toBe(0.005);
    expect(_internal.clippingRatioFrom({ detectedClipping: true })).toBe(0.001);
    expect(_internal.clippingRatioFrom({ detectedClipping: false })).toBe(0);
    expect(_internal.clippingRatioFrom({ clippedSamples: 5, totalSamples: 0 })).toBeNull();
  });

  it('accepts metric aliases and ignores malformed or non-finite values', () => {
    const result = calculateTechnicalQualityScore({
      loudness: {
        integratedLufs: '-14',
        truePeakDbtp: Number.POSITIVE_INFINITY,
        loudnessRange: 'not-a-number',
      },
      probe: {
        codec_name: 'flac',
        sample_rate: '48000',
        bit_rate: '',
      },
      targetConfig: {
        integratedLufs: '-14',
        truePeakDbtp: '-1',
        lra: '9',
      },
      signalMetrics: {
        clippingRatio: -10,
        dcOffsetAbsolute: '0.001',
      },
    });

    expect(result.breakdown.loudness.score).toBe(100);
    expect(result.breakdown.truePeak.available).toBe(false);
    expect(result.breakdown.loudnessRange.available).toBe(false);
    expect(result.breakdown.sourceResolution.score).toBe(100);
    expect(result.breakdown.signalIntegrity.score).toBe(100);
  });
});

describe('predicted technical audio quality score', () => {
  it('uses configured targets while preserving measured source limitations', () => {
    const analysis = {
      loudness: { input_i: -21, input_tp: -0.2, input_lra: 18 },
      probe: { codec: 'mp3', sampleRate: 22050, bitRate: 64000 },
      signalMetrics: { clippingRatio: 0.002 },
      config: targetConfig,
    };
    const original = calculateTechnicalQualityScore({
      ...analysis,
      targetConfig,
    });
    const predicted = predictTechnicalQualityScore({ analysis, config: targetConfig });

    expect(predicted.predicted).toBe(true);
    expect(predicted.score).toBeGreaterThan(original.score);
    expect(predicted.breakdown.loudness).toMatchObject({
      score: 100,
      value: -14,
      measured: false,
    });
    expect(predicted.breakdown.truePeak).toMatchObject({
      score: 100,
      value: -1.2,
      measured: false,
    });
    expect(predicted.breakdown.sourceResolution).toEqual({
      ...original.breakdown.sourceResolution,
      measured: true,
    });
    expect(predicted.breakdown.signalIntegrity.score).toBe(original.breakdown.signalIntegrity.score);
    expect(predicted.scoreRange.min).toBe(predicted.score - 8);
    expect(predicted.scoreRange.max).toBe(predicted.score + 8);
    expect(predicted.confidence).toMatchObject({ level: 'niedrig', percent: 40 });
    expect(predicted.issues[0]).toContain('nicht durch eine Messung');
    expect(predicted.disclaimer).toContain('keine Messung einer gerenderten Datei');
  });

  it('includes the expected output codec in the prediction without inventing restored detail', () => {
    const lowResolutionSource = { codec: 'mp3', sampleRate: 22050, bitRate: 64000 };
    const predictedWav = predictTechnicalQualityScore({
      analysis: {
        loudness: { input_i: -20, input_tp: -0.2, input_lra: 18 },
        probe: lowResolutionSource,
        config: targetConfig,
      },
      config: targetConfig,
      outputProbe: { codec: 'pcm_s24le', sampleRate: 48000 },
    });
    expect(predictedWav.breakdown.sourceResolution).toMatchObject({
      score: 35,
      value: { codec: 'mp3', output: { codec: 'pcm_s24le' } },
    });

    const predictedLossy = predictTechnicalQualityScore({
      analysis: {
        probe: { codec: 'flac', sampleRate: 48000 },
        config: targetConfig,
      },
      config: targetConfig,
      outputProbe: { codec: 'mp3', sampleRate: 48000, bitRate: 128000 },
    });
    expect(predictedLossy.breakdown.sourceResolution.value.codec).toBe('mp3');
    expect(predictedLossy.breakdown.sourceResolution.score).toBeLessThan(100);
  });

  it('reads a nested mastering report shape and lets explicit config win', () => {
    const predicted = predictTechnicalQualityScore({
      analysis: {
        input: {
          loudness: { input_i: -18, input_tp: -0.5, input_lra: 15 },
          probe: { codec: 'flac', sampleRate: 48000 },
          config: { targetLufs: -16, truePeak: -2, loudnessRange: 12 },
        },
      },
      config: { targetLufs: -14 },
    });

    expect(predicted.breakdown.loudness.value).toBe(-14);
    expect(predicted.breakdown.truePeak.value).toBe(-2);
    expect(predicted.breakdown.loudnessRange.value).toBe(12);
    expect(predicted.breakdown.sourceResolution.score).toBe(100);
  });

  it('does not invent target metrics when no mastering config exists', () => {
    const predicted = predictTechnicalQualityScore({
      analysis: {
        loudness: { input_i: -18, input_tp: -0.5 },
        probe: { codec: 'flac', sampleRate: 48000 },
      },
    });

    expect(predicted.scoreAvailable).toBe(true);
    expect(predicted.breakdown.loudness.available).toBe(false);
    expect(predicted.breakdown.truePeak.available).toBe(false);
    expect(predicted.breakdown.sourceResolution.score).toBe(100);
    expect(predicted.scoreRange).toEqual({ min: 85, max: 100 });
    expect(predicted.confidence.percent).toBe(6);
  });

  it('clamps prediction ranges at the score boundaries', () => {
    const high = predictTechnicalQualityScore({
      analysis: measuredFile,
      config: targetConfig,
    });
    const low = predictTechnicalQualityScore();

    expect(high.scoreRange.max).toBe(100);
    expect(low.scoreRange.min).toBe(0);
    expect(low.scoreRange.max).toBe(15);
  });
});
