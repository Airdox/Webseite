import React from 'react';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AudioMasteringTab from '../components/AudioMasteringTab.jsx';

const profiles = {
  liveBalanced: { id: 'liveBalanced', name: 'Live Set – Druckvoll & Klar', description: 'Standard', targetLufs: -14 },
  transparent: { id: 'transparent', name: 'Transparent', description: 'Sanft', targetLufs: -16 },
};
const config = {
  profileId: 'liveBalanced', targetLufs: -14, truePeak: -1.2, loudnessRange: 9, highpassHz: 28,
  bassGainDb: 1.2, mudCutDb: -1, presenceGainDb: 0.8, trebleGainDb: 1.4,
  compressorThresholdDb: -18, compressorRatio: 1.65, attackMs: 24, releaseMs: 260, makeupDb: 0.8,
  outputFormat: 'mp3', sampleRate: 48000,
};
const outputFormats = [
  ['mp3', 'MP3 – 320 kbit/s', false],
  ['wav', 'WAV – 24-Bit PCM', true],
  ['flac', 'FLAC – verlustfrei', true],
  ['ogg', 'OGG Vorbis – hohe Qualität', false],
  ['opus', 'Opus – 256 kbit/s VBR', false],
  ['aac', 'AAC / M4A – 320 kbit/s', false],
  ['aiff', 'AIFF – 24-Bit PCM', true],
  ['alac', 'ALAC / M4A – verlustfrei', true],
].map(([id, name, lossless]) => ({ id, name, extension: id, lossless }));
const measuredScore = {
  scoreAvailable: true,
  score: 78,
  grade: { code: 'C', label: 'Technisch solide' },
  confidence: { level: 'hoch', percent: 90 },
  breakdown: {
    loudness: {
      key: 'loudness',
      label: 'Ziel-Lautheit',
      available: true,
      score: 80,
      value: -16,
      unit: 'LUFS',
    },
  },
  disclaimer: 'Technischer Orientierungswert – kein standardisierter Klangtest.',
};
const predictedScore = {
  ...measuredScore,
  score: 92,
  grade: { code: 'A', label: 'Technisch sehr gut' },
  predicted: true,
  scoreRange: { min: 84, max: 100 },
};

const setup = (overrides = {}) => {
  const callbacks = {
    onSelect: vi.fn(), onAnalyze: vi.fn(), onRender: vi.fn(), onCancel: vi.fn(),
    onReveal: vi.fn(), onReset: vi.fn(), onConfigChange: vi.fn(), onProfileChange: vi.fn(),
    onSelectOutputDirectory: vi.fn(),
  };
  render(<AudioMasteringTab
    sourcePath="D:\\Gigs\\set.wav"
    analysis={{
      probe: {
        duration: 3600,
        codec: 'pcm_s24le',
        sampleRate: 48000,
        channels: 2,
        size: 1024,
      },
      loudness: { input_i: '-16', input_tp: '-1' },
      qualityScore: measuredScore,
      predictedQualityScore: predictedScore,
    }}
    config={config}
    profiles={profiles}
    outputFormats={outputFormats}
    outputDirectory="D:\Masters"
    {...callbacks}
    {...overrides}
  />);
  return callbacks;
};

describe('AudioMasteringTab interactions', () => {
  it('connects selection, analysis, render, profile, reveal and reset actions', () => {
    const callbacks = setup({ result: { outputPath: 'master.mp3', playbackUrl: 'file:///master.mp3', output: { loudness: { input_i: '-14', input_tp: '-1.2' } } } });
    fireEvent.click(screen.getByRole('button', { name: /Audio wählen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Analysieren/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Master erstellen & speichern' }));
    fireEvent.click(screen.getByRole('radio', { name: /Transparent/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Gespeicherte Datei zeigen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Speicherort wählen' }));
    fireEvent.click(screen.getByRole('button', { name: /Mastering zurücksetzen/i }));
    expect(callbacks.onSelect).toHaveBeenCalledOnce();
    expect(callbacks.onAnalyze).toHaveBeenCalledOnce();
    expect(callbacks.onRender).toHaveBeenCalledOnce();
    expect(callbacks.onProfileChange).toHaveBeenCalledWith('transparent');
    expect(callbacks.onReveal).toHaveBeenCalledOnce();
    expect(callbacks.onSelectOutputDirectory).toHaveBeenCalledOnce();
    expect(callbacks.onReset).toHaveBeenCalledOnce();
  });

  it('explains the four-step workflow and exposes the save action after analysis', () => {
    const callbacks = setup();

    expect(screen.getByRole('list', { name: 'Mastering-Ablauf' })).toHaveTextContent('Set auswählen');
    expect(screen.getByRole('list', { name: 'Mastering-Ablauf' })).toHaveTextContent('Erstellen & speichern');
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Master einstellen');
    expect(screen.getByRole('region', { name: 'Nächster Mastering-Schritt' })).toHaveTextContent(
      'Prüfe Profil, Format und Speicherort.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Jetzt Master erstellen & speichern' }));
    expect(callbacks.onRender).toHaveBeenCalledOnce();
    expect(screen.getByText('D:\\Masters')).toBeVisible();
  });

  it('exposes every manual parameter and output option', () => {
    const callbacks = setup();
    expect(screen.getByLabelText('Format')).toBeVisible();
    expect(screen.getByLabelText('Format').querySelectorAll('option')).toHaveLength(8);
    fireEvent.click(screen.getByLabelText('Expertenmodus'));
    const numberInputs = document.querySelectorAll('.fd-audio-slider input[type="number"]');
    expect(numberInputs).toHaveLength(13);
    fireEvent.change(numberInputs[0], { target: { value: '-15' } });
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'flac' } });
    fireEvent.change(screen.getByLabelText('Samplerate'), { target: { value: '44100' } });
    expect(callbacks.onConfigChange).toHaveBeenCalledWith('targetLufs', -15);
    expect(callbacks.onConfigChange).toHaveBeenCalledWith('outputFormat', 'flac');
    expect(callbacks.onConfigChange).toHaveBeenCalledWith('sampleRate', 44100);
  });

  it('shows measured original, estimated target and measured master scores separately', () => {
    setup({
      result: {
        outputPath: 'master.wav',
        output: {
          loudness: { input_i: '-14', input_tp: '-1.2' },
          qualityScore: { ...measuredScore, score: 97, grade: { code: 'A', label: 'Technisch sehr gut' } },
        },
      },
    });

    expect(screen.getByRole('article', { name: 'Originalaufnahme' })).toHaveTextContent('78');
    expect(screen.getByRole('article', { name: 'Nach Bearbeitung' })).toHaveTextContent('92');
    expect(screen.getByRole('article', { name: 'Nach Bearbeitung' })).toHaveTextContent('Erwarteter Bereich 84–100');
    expect(screen.getByRole('article', { name: 'Fertiges Master' })).toHaveTextContent('97');
    expect(screen.getByRole('article', { name: 'Originalaufnahme' })).toHaveTextContent('kein standardisierter Klangtest');
  });

  it('loads and controls source preview playback instead of only rendering an audio tag', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    setup({
      analysis: {
        probe: { duration: 60, codec: 'pcm_s24le', sampleRate: 48000, channels: 2 },
        loudness: { input_i: '-16', input_tp: '-1' },
        qualityScore: measuredScore,
        predictedQualityScore: predictedScore,
        playbackUrl: 'app://flightdeck/audio/source-token',
      },
    });

    const audio = document.querySelector('audio');
    fireEvent.loadedMetadata(audio);
    const previewButton = screen.getByRole('button', { name: 'Quelle vorhören' });
    expect(previewButton).toBeEnabled();
    fireEvent.click(previewButton);
    await waitFor(() => expect(playSpy).toHaveBeenCalledOnce());
    expect(screen.getByRole('status', { name: 'Quelle vorhören Wiedergabestatus' })).toHaveTextContent('Wiedergabe läuft');

    fireEvent.play(audio);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(pauseSpy).toHaveBeenCalledOnce();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });

  it('shows cancel while running and invokes it', () => {
    const callbacks = setup({
      busy: true,
      progress: 42,
      operation: {
        kind: 'analysis',
        state: 'running',
        phase: 'Loudness messen',
        message: 'Signal wird vollständig gelesen · FFmpeg 38%',
      },
    });
    expect(screen.getByRole('status', { name: 'Audio-Verarbeitungsstatus' })).toHaveTextContent('Loudness messen');
    expect(screen.getByRole('button', { name: 'Analysiere… 42%' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Analyse abbrechen/i }));
    expect(callbacks.onCancel).toHaveBeenCalledOnce();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
  });

  it('keeps a failed analysis visible next to the source and offers a retry', () => {
    setup({
      analysis: null,
      operation: {
        kind: 'analysis',
        state: 'error',
        phase: 'Analyse fehlgeschlagen',
        message: 'ffmpeg wurde nicht gefunden.',
      },
    });
    expect(screen.getByRole('status', { name: 'Audio-Verarbeitungsstatus' })).toHaveTextContent('Analyse fehlgeschlagen');
    expect(screen.getByRole('status', { name: 'Audio-Verarbeitungsstatus' })).toHaveTextContent('ffmpeg wurde nicht gefunden.');
    expect(screen.getByRole('button', { name: 'Analysieren' })).toBeEnabled();
  });

  it('disables work without a real source and omits preview players without URLs', () => {
    setup({ sourcePath: '', analysis: null });
    expect(screen.getByRole('button', { name: 'Analysieren' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Master erstellen & speichern' })).toBeDisabled();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Set auswählen');
    expect(document.querySelectorAll('audio')).toHaveLength(0);
  });
});
