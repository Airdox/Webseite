import React, { useMemo, useState } from 'react';
import {
  Activity, AudioLines, CircleStop, FolderOpen, Gauge, Play, RotateCcw,
  SlidersHorizontal, Sparkles, Waves,
} from 'lucide-react';

const PARAMETER_GROUPS = [
  {
    title: 'Loudness & Schutz',
    fields: [
      ['targetLufs', 'Ziel-Loudness', 'LUFS', -23, -9, 0.5],
      ['truePeak', 'True Peak Limit', 'dBTP', -3, -0.5, 0.1],
      ['loudnessRange', 'Dynamik (LRA)', 'LU', 5, 20, 0.5],
      ['highpassHz', 'Low-Cut', 'Hz', 20, 45, 1],
    ],
  },
  {
    title: 'Klangformung',
    fields: [
      ['bassGainDb', 'Bass / Druck', 'dB', -3, 3, 0.1],
      ['mudCutDb', 'Low-Mid Cleanup', 'dB', -4, 0, 0.1],
      ['presenceGainDb', 'Präsenz', 'dB', -2, 3, 0.1],
      ['trebleGainDb', 'Höhen / Air', 'dB', -2, 3, 0.1],
    ],
  },
  {
    title: 'Dynamik',
    fields: [
      ['compressorThresholdDb', 'Threshold', 'dB', -30, -8, 0.5],
      ['compressorRatio', 'Ratio', ':1', 1, 4, 0.05],
      ['attackMs', 'Attack', 'ms', 5, 100, 1],
      ['releaseMs', 'Release', 'ms', 80, 600, 5],
      ['makeupDb', 'Make-up Gain', 'dB', 0, 3, 0.1],
    ],
  },
];

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
};
const formatBytes = (bytes) => {
  const size = number(bytes);
  if (!size) return '–';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / (1024 ** index)).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};

const Meter = ({ label, value, unit, target }) => (
  <div className="fd-audio-meter">
    <span>{label}</span>
    <strong>{value ?? '–'} <small>{unit}</small></strong>
    {target !== undefined && <em>Ziel {target}</em>}
  </div>
);

const AudioMasteringTab = ({
  sourcePath = '', analysis = null, result = null, config = {}, profiles = [], busy = false,
  progress = 0, onSelect = () => {}, onAnalyze = () => {}, onRender = () => {},
  onCancel = () => {}, onReveal = () => {}, onReset = () => {},
  onConfigChange = () => {}, onProfileChange = () => {},
}) => {
  const [expertMode, setExpertMode] = useState(false);
  const profileList = useMemo(() => Array.isArray(profiles) ? profiles : Object.values(profiles || {}), [profiles]);
  const selectedProfile = config.profileId || profileList[0]?.id || '';
  const input = analysis?.probe || result?.input?.probe;
  const inputLoudness = analysis?.loudness || result?.input?.loudness;
  const outputLoudness = result?.output?.loudness;
  const safeProgress = Math.min(100, Math.max(0, number(progress)));
  const changeNumber = (key, rawValue) => onConfigChange(key, Number(rawValue));

  return (
    <div className="fd-panel-stack fd-audio-mastering">
      <section className="fd-audio-hero">
        <div className="fd-audio-orbit" aria-hidden="true"><Waves size={38} /><i /><i /><i /></div>
        <div className="fd-audio-hero-copy">
          <span className="fd-audio-kicker"><Sparkles size={14} /> ORBITAL AUDIO LAB</span>
          <h2>Live-Set Optimierung</h2>
          <p>Druckvolles Fundament, definierte Höhen und streaming-sichere Lautheit – analysiert und gerendert mit lokalem FFmpeg.</p>
          <div className="fd-audio-source" title={sourcePath || 'Keine Audiodatei ausgewählt'}>
            <AudioLines size={17} />
            <span>{sourcePath || 'Wähle einen echten Gig-Mitschnitt aus'}</span>
          </div>
        </div>
        <div className="fd-audio-hero-actions">
          <button type="button" className="fd-button secondary" onClick={onSelect} disabled={busy}>
            <FolderOpen size={16} /> Audio wählen
          </button>
          <button type="button" className="fd-button" onClick={onAnalyze} disabled={busy || !sourcePath}>
            <Activity size={16} /> Analysieren
          </button>
        </div>
      </section>

      <div className="fd-audio-layout">
        <section className="fd-surface fd-audio-control">
          <div className="fd-section-head">
            <div><h3>Mastering-Konfiguration</h3><p>Profil wählen oder jeden Parameter präzise abstimmen.</p></div>
            <label className="fd-audio-expert-toggle">
              <SlidersHorizontal size={15} />
              <span>Expertenmodus</span>
              <input type="checkbox" checked={expertMode} onChange={(event) => setExpertMode(event.target.checked)} />
            </label>
          </div>

          <div className="fd-audio-profiles" role="radiogroup" aria-label="Mastering-Profil">
            {profileList.map((profile) => (
              <button
                type="button" role="radio" aria-checked={selectedProfile === profile.id}
                className={selectedProfile === profile.id ? 'active' : ''} key={profile.id}
                onClick={() => onProfileChange(profile.id)} disabled={busy}
              >
                <strong>{profile.name}</strong><span>{profile.description}</span>
              </button>
            ))}
          </div>

          {expertMode && (
            <div className="fd-audio-parameters">
              {PARAMETER_GROUPS.map((group) => (
                <fieldset key={group.title}>
                  <legend>{group.title}</legend>
                  {group.fields.map(([key, label, unit, min, max, step]) => (
                    <label className="fd-audio-slider" key={key}>
                      <span>{label}</span>
                      <input type="range" min={min} max={max} step={step} value={number(config[key], min)} onChange={(event) => changeNumber(key, event.target.value)} disabled={busy} />
                      <span className="fd-audio-number"><input type="number" min={min} max={max} step={step} value={number(config[key], min)} onChange={(event) => changeNumber(key, event.target.value)} disabled={busy} /><small>{unit}</small></span>
                    </label>
                  ))}
                </fieldset>
              ))}
              <fieldset>
                <legend>Ausgabe</legend>
                <div className="fd-audio-output-settings">
                  <label>Format<select value={config.outputFormat || 'mp3'} onChange={(event) => onConfigChange('outputFormat', event.target.value)} disabled={busy}><option value="mp3">MP3 · 320 kbit/s</option><option value="wav">WAV · 24 Bit</option><option value="flac">FLAC · Lossless</option></select></label>
                  <label>Samplerate<select value={number(config.sampleRate, 48000)} onChange={(event) => changeNumber('sampleRate', event.target.value)} disabled={busy}><option value={48000}>48 kHz</option><option value={44100}>44,1 kHz</option></select></label>
                </div>
              </fieldset>
            </div>
          )}
        </section>

        <aside className="fd-surface fd-audio-diagnostics">
          <div className="fd-section-head"><h3>Signal-Diagnose</h3><Gauge size={18} /></div>
          <div className="fd-audio-meter-grid">
            <Meter label="Input Loudness" value={inputLoudness?.input_i} unit="LUFS" target={config.targetLufs} />
            <Meter label="Input True Peak" value={inputLoudness?.input_tp} unit="dBTP" target={config.truePeak} />
            <Meter label="Output Loudness" value={outputLoudness?.input_i} unit="LUFS" target={config.targetLufs} />
            <Meter label="Output True Peak" value={outputLoudness?.input_tp} unit="dBTP" target={config.truePeak} />
          </div>
          {input && <dl className="fd-audio-facts"><div><dt>Dauer</dt><dd>{formatDuration(input.duration)}</dd></div><div><dt>Codec</dt><dd>{input.codec || '–'}</dd></div><div><dt>Samplerate</dt><dd>{input.sampleRate ? `${input.sampleRate / 1000} kHz` : '–'}</dd></div><div><dt>Kanäle</dt><dd>{input.channelLayout || input.channels || '–'}</dd></div><div><dt>Dateigröße</dt><dd>{formatBytes(input.size)}</dd></div></dl>}
          {analysis?.playbackUrl && <div className="fd-audio-preview"><span>Quelle vorhören</span><audio controls preload="metadata" src={analysis.playbackUrl}>Audio-Wiedergabe wird nicht unterstützt.</audio></div>}
          {result?.playbackUrl && <div className="fd-audio-preview result"><span>Master vorhören</span><audio controls preload="metadata" src={result.playbackUrl}>Audio-Wiedergabe wird nicht unterstützt.</audio></div>}
        </aside>
      </div>

      <section className={`fd-audio-flightbar ${busy ? 'running' : ''}`}>
        <div className="fd-audio-progress-copy"><strong>{busy ? 'Mastering-Pipeline aktiv' : result ? 'Master erfolgreich verifiziert' : 'Bereit für den Mastering-Lauf'}</strong><span>{result?.outputPath || 'Analyse → Klangformung → 2-Pass Loudness → technische Verifikation'}</span></div>
        <div className="fd-audio-progress" role="progressbar" aria-label="Mastering-Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeProgress}><span style={{ width: `${safeProgress}%` }} /></div>
        <strong className="fd-audio-percent">{safeProgress}%</strong>
        <div className="fd-toolbar-actions">
          {busy ? <button type="button" className="fd-button danger" onClick={onCancel}><CircleStop size={16} /> Abbrechen</button> : <button type="button" className="fd-button primary" onClick={onRender} disabled={!sourcePath || !analysis}><Play size={16} /> Optimieren & prüfen</button>}
          <button type="button" className="fd-button secondary" onClick={onReveal} disabled={busy || !result?.outputPath}><FolderOpen size={16} /> Im Ordner zeigen</button>
          <button type="button" className="fd-icon-button" aria-label="Mastering zurücksetzen" title="Mastering zurücksetzen" onClick={onReset} disabled={busy}><RotateCcw size={16} /></button>
        </div>
      </section>
    </div>
  );
};

export default AudioMasteringTab;
