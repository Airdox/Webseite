import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

const setup = (overrides = {}) => {
  const callbacks = {
    onSelect: vi.fn(), onAnalyze: vi.fn(), onRender: vi.fn(), onCancel: vi.fn(),
    onReveal: vi.fn(), onReset: vi.fn(), onConfigChange: vi.fn(), onProfileChange: vi.fn(),
  };
  render(<AudioMasteringTab sourcePath="D:\\Gigs\\set.wav" analysis={{ probe: { duration: 3600, codec: 'pcm_s24le', sampleRate: 48000, channels: 2, size: 1024 }, loudness: { input_i: '-16', input_tp: '-1' } }} config={config} profiles={profiles} {...callbacks} {...overrides} />);
  return callbacks;
};

describe('AudioMasteringTab interactions', () => {
  it('connects selection, analysis, render, profile, reveal and reset actions', () => {
    const callbacks = setup({ result: { outputPath: 'master.mp3', playbackUrl: 'file:///master.mp3', output: { loudness: { input_i: '-14', input_tp: '-1.2' } } } });
    fireEvent.click(screen.getByRole('button', { name: /Audio wählen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Analysieren/i }));
    fireEvent.click(screen.getByRole('button', { name: /Optimieren & prüfen/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Transparent/i }));
    fireEvent.click(screen.getByRole('button', { name: /Im Ordner zeigen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Mastering zurücksetzen/i }));
    expect(callbacks.onSelect).toHaveBeenCalledOnce();
    expect(callbacks.onAnalyze).toHaveBeenCalledOnce();
    expect(callbacks.onRender).toHaveBeenCalledOnce();
    expect(callbacks.onProfileChange).toHaveBeenCalledWith('transparent');
    expect(callbacks.onReveal).toHaveBeenCalledOnce();
    expect(callbacks.onReset).toHaveBeenCalledOnce();
  });

  it('exposes every manual parameter and output option', () => {
    const callbacks = setup();
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

  it('shows cancel while running and invokes it', () => {
    const callbacks = setup({ busy: true, progress: 42 });
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/i }));
    expect(callbacks.onCancel).toHaveBeenCalledOnce();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
  });

  it('disables work without a real source and omits preview players without URLs', () => {
    setup({ sourcePath: '', analysis: null });
    expect(screen.getByRole('button', { name: /Analysieren/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Optimieren & prüfen/i })).toBeDisabled();
    expect(document.querySelectorAll('audio')).toHaveLength(0);
  });
});
