import React, {
  useMemo, useRef, useState,
} from 'react';
import {
  Activity, AlertTriangle, AudioLines, CheckCircle2, CircleStop, FolderOpen, Gauge,
  LoaderCircle, Pause, Play, RotateCcw, Save, SlidersHorizontal, UploadCloud,
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
      ['stereoWidth', 'Stereo-Breite', '×', 1, 2, 0.05],
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

const formatScoreMetricValue = (metric) => {
  if (metric?.value === null || metric?.value === undefined) return '–';
  if (typeof metric.value === 'object') {
    const { codec, sampleRate, clippingRatio, dcOffset } = metric.value;
    if (codec || sampleRate) {
      return [codec, sampleRate ? `${sampleRate / 1000} kHz` : ''].filter(Boolean).join(' · ');
    }
    if (clippingRatio !== null && clippingRatio !== undefined) {
      return `Clipping ${(clippingRatio * 100).toFixed(4)}%`;
    }
    if (dcOffset !== null && dcOffset !== undefined) return `DC ${dcOffset}`;
    return '–';
  }
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`;
};

const QualityScoreCard = ({ title, report, predicted = false }) => {
  const availableMetrics = Object.values(report?.breakdown || {}).filter((metric) => metric.available);
  const available = Boolean(report?.scoreAvailable);
  return (
    <article
      className={`fd-audio-score-card ${predicted ? 'predicted' : 'measured'} ${available ? '' : 'unavailable'}`}
      aria-label={title}
    >
      <div className="fd-audio-score-head">
        <div>
          <span>{predicted ? 'Zielprognose' : 'Messwert'}</span>
          <h4>{title}</h4>
        </div>
        <div className="fd-audio-score-value">
          <strong>{available ? report.score : '–'}</strong>
          <small>/ 100</small>
        </div>
      </div>
      {available ? (
        <>
          <div className="fd-audio-score-summary">
            <strong>{report.grade?.label}</strong>
            <span>
              {predicted && report.scoreRange
                ? `Erwarteter Bereich ${Math.round(report.scoreRange.min)}–${Math.round(report.scoreRange.max)} · Konfidenz ${report.confidence?.level || '–'} (${report.confidence?.percent ?? 0}%)`
                : `Konfidenz ${report.confidence?.level || '–'} · ${report.confidence?.percent ?? 0}%`}
            </span>
          </div>
          <div className="fd-audio-score-breakdown" aria-label={`${title} Messwertbeiträge`}>
            {availableMetrics.map((metric) => (
              <div key={metric.key}>
                <span>{metric.label}</span>
                <strong>{metric.score}/100</strong>
                <small>
                  {formatScoreMetricValue(metric)}
                  {Number.isFinite(Number(metric.target)) && ` · Ziel ${metric.target}${metric.unit ? ` ${metric.unit}` : ''}`}
                  {Number.isFinite(Number(metric.weight)) && ` · Gewicht ${metric.weight}%`}
                </small>
              </div>
            ))}
          </div>
          <p>{report.disclaimer}</p>
        </>
      ) : (
        <p>Wird nach der vollständigen Dateianalyse aus LUFS, True Peak, LRA und Quelldaten berechnet.</p>
      )}
    </article>
  );
};

const PLAYBACK_LABELS = {
  loading: 'Audio wird geladen…',
  ready: 'Bereit zum Vorhören',
  playing: 'Wiedergabe läuft',
  paused: 'Pausiert',
  error: 'Audio konnte nicht geladen werden',
};

const AudioPreview = ({ label, src, result = false }) => {
  const audioRef = useRef(null);
  const [playbackState, setPlaybackState] = useState('loading');

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playbackState === 'playing') {
      audio.pause();
      setPlaybackState('paused');
      return;
    }
    try {
      await audio.play();
      setPlaybackState('playing');
    } catch {
      setPlaybackState('error');
    }
  };

  return (
    <div className={`fd-audio-preview ${result ? 'result' : ''}`}>
      <div className="fd-audio-preview-head">
        <span>{label}</span>
        <small role="status" aria-live="polite" aria-label={`${label} Wiedergabestatus`}>
          {PLAYBACK_LABELS[playbackState]}
        </small>
      </div>
      <button
        type="button"
        className="fd-button secondary"
        onClick={togglePlayback}
        disabled={playbackState === 'loading' || playbackState === 'error'}
      >
        {playbackState === 'playing' ? <Pause size={15} /> : <Play size={15} />}
        {playbackState === 'playing' ? 'Pause' : label}
      </button>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={src}
        onLoadedMetadata={() => setPlaybackState('ready')}
        onCanPlay={() => setPlaybackState((current) => (current === 'playing' ? current : 'ready'))}
        onPlay={() => setPlaybackState('playing')}
        onPause={() => setPlaybackState((current) => (current === 'error' ? current : 'paused'))}
        onEnded={() => setPlaybackState('ready')}
        onError={() => setPlaybackState('error')}
      >
        Audio-Wiedergabe wird nicht unterstützt.
      </audio>
    </div>
  );
};

const AudioMasteringTab = ({
  sourcePath = '', analysis = null, result = null, config = {}, profiles = [], busy = false,
  outputFormats = [], outputDirectory = '',
  progress = 0, operation = {}, onSelect = () => {}, onAnalyze = () => {}, onRender = () => {},
  onCancel = () => {}, onReveal = () => {}, onReset = () => {}, onSelectOutputDirectory = () => {},
  onConfigChange = () => {}, onProfileChange = () => {}, onPreparePublish = () => {},
}) => {
  const [expertMode, setExpertMode] = useState(false);
  const profileList = useMemo(() => Array.isArray(profiles) ? profiles : Object.values(profiles || {}), [profiles]);
  const formatList = useMemo(() => {
    if (Array.isArray(outputFormats) && outputFormats.length) return outputFormats;
    const selected = config.outputFormat || 'mp3';
    return [{ id: selected, name: selected.toUpperCase(), extension: selected, lossless: false }];
  }, [config.outputFormat, outputFormats]);
  const selectedProfile = config.profileId || profileList[0]?.id || '';
  const input = analysis?.probe || result?.input?.probe;
  const inputLoudness = analysis?.loudness || result?.input?.loudness;
  const outputLoudness = result?.output?.loudness;
  const safeProgress = Math.min(100, Math.max(0, number(progress)));
  const changeNumber = (key, rawValue) => onConfigChange(key, Number(rawValue));
  const operationKind = operation.kind || 'idle';
  const operationState = operation.state || 'idle';
  const operationPhase = operation.phase || 'Bereit';
  const operationMessage = operation.message || 'Audio wählen und anschließend die vollständige Signalanalyse starten.';
  const analyzing = busy && operationKind === 'analysis';
  const mastering = busy && operationKind === 'mastering';
  const activeWorkflowStep = result ? 3 : analysis || mastering ? 2 : 1;
  const workflowSteps = [
    ['Quelle', sourcePath ? 'Datei gewählt' : 'Audiodatei wählen'],
    ['Master', analysis ? 'Einstellungen bereit' : 'Signal analysieren'],
    ['Ergebnis', result ? 'Gespeichert & geprüft' : 'Rendern & speichern'],
  ];
  const primaryAction = !sourcePath
    ? { label: 'Audiodatei auswählen', icon: FolderOpen, onClick: onSelect }
    : !analysis
      ? { label: 'Set jetzt analysieren', icon: Activity, onClick: onAnalyze }
      : { label: 'Master erstellen und speichern', icon: Save, onClick: onRender };
  const PrimaryIcon = primaryAction.icon;

  return (
    <div className="fd-panel-stack fd-audio-mastering">
      <header className="fd-audio-header">
        <div>
          <span className="fd-audio-kicker">AUDIO MASTERING</span>
          <h2>Ein Set. Ein sauberer Master.</h2>
          <p>Datei prüfen, Klangprofil wählen und das verifizierte Ergebnis speichern.</p>
        </div>
        <span className={`fd-audio-state-pill state-${operationState}`}>
          {operationState === 'running' && <LoaderCircle className="fd-audio-spinner" size={15} />}
          {operationState === 'success' && <CheckCircle2 size={15} />}
          {operationState === 'error' && <AlertTriangle size={15} />}
          {operationState === 'idle' && <Activity size={15} />}
          {operationPhase}
        </span>
      </header>

      <ol className="fd-audio-workflow" aria-label="Mastering-Ablauf">
        {workflowSteps.map(([title, detail], index) => {
          const step = index + 1;
          const completed = step < activeWorkflowStep || Boolean(result);
          const active = step === activeWorkflowStep;
          return (
            <li
              key={title}
              className={`${completed ? 'completed' : ''} ${active ? 'active' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <span>{completed ? <CheckCircle2 size={15} /> : step}</span>
              <div><strong>{title}</strong><small>{detail}</small></div>
            </li>
          );
        })}
      </ol>

      <section className="fd-surface fd-audio-source-card" aria-label="Quelldatei">
        <div className="fd-audio-section-title">
          <span>1</span>
          <div><h3>Quelldatei</h3><p>WAV, FLAC, AIFF, MP3, M4A, AAC, OGG oder Opus · Stereo</p></div>
        </div>
        <div className="fd-audio-file-row">
          <AudioLines size={20} />
          <div title={sourcePath || 'Keine Audiodatei ausgewählt'}>
            <strong>{sourcePath ? sourcePath.split(/[\\/]/).pop() : 'Noch keine Audiodatei gewählt'}</strong>
            <span>{sourcePath || 'Die Originaldatei bleibt unverändert.'}</span>
          </div>
          <button type="button" className="fd-button secondary" onClick={onSelect} disabled={busy}>
            <FolderOpen size={16} /> {sourcePath ? 'Datei wechseln' : 'Datei auswählen'}
          </button>
          {analysis && (
            <button
              type="button"
              className="fd-button secondary"
              onClick={onAnalyze}
              disabled={busy}
              title="Nur nötig, wenn die Quelldatei außerhalb von Flight Deck verändert wurde. Profil- und Regleränderungen verwenden die vorhandene Messung."
            >
              {analyzing ? <LoaderCircle className="fd-audio-spinner" size={16} /> : <Activity size={16} />}
              Quellmessung wiederholen (optional)
            </button>
          )}
        </div>
        {(operationState !== 'idle' || sourcePath) && (
          <div
            className={`fd-audio-operation state-${operationState}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Audio-Verarbeitungsstatus"
          >
            <div>
              <strong>{operationPhase}</strong>
              <span>{operationMessage}</span>
            </div>
            {(busy || operationState === 'success') && <em>{safeProgress}%</em>}
            <div
              className="fd-audio-progress"
              role="progressbar"
              aria-label="Audio-Verarbeitungsfortschritt"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={safeProgress}
              aria-valuetext={`${operationPhase} – ${safeProgress}%`}
            ><span style={{ width: `${safeProgress}%` }} /></div>
          </div>
        )}
      </section>

      <div className="fd-audio-layout">
        <section className="fd-surface fd-audio-control">
          <div className="fd-section-head fd-audio-config-head">
            <div className="fd-audio-section-title">
              <span>2</span>
              <div><h3>Klang & Ausgabe</h3><p>Ein Profil reicht. Details sind optional.</p></div>
            </div>
            <label className="fd-audio-expert-toggle">
              <SlidersHorizontal size={15} />
              <span>Details</span>
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

          <fieldset className="fd-audio-output-panel">
            <legend>Speichern als</legend>
            <div className="fd-audio-output-settings">
              <label>
                Format
                <select
                  aria-label="Format"
                  value={config.outputFormat || 'mp3'}
                  onChange={(event) => onConfigChange('outputFormat', event.target.value)}
                  disabled={busy}
                >
                  {formatList.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Samplerate
                <select
                  value={number(config.sampleRate, 48000)}
                  onChange={(event) => changeNumber('sampleRate', event.target.value)}
                  disabled={busy}
                >
                  <option value={48000}>48 kHz</option>
                  <option value={44100}>44,1 kHz</option>
                </select>
              </label>
            </div>
            <div className="fd-audio-save-target">
              <FolderOpen size={17} />
              <span>
                <small>Speicherort für das fertige Master</small>
                <strong title={outputDirectory}>{outputDirectory || 'FlightDeck-Standardordner'}</strong>
              </span>
              <button type="button" className="fd-button secondary" onClick={onSelectOutputDirectory} disabled={busy}>
                Speicherort wählen
              </button>
            </div>
          </fieldset>

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
            </div>
          )}
          <div className="fd-audio-target-summary" aria-label="Gewählte Mastering-Ziele">
            <span><small>Lautheit</small><strong>{config.targetLufs ?? '–'} LUFS</strong></span>
            <span><small>True Peak</small><strong>{config.truePeak ?? '–'} dBTP</strong></span>
            <span><small>Format</small><strong>{String(config.outputFormat || 'mp3').toUpperCase()}</strong></span>
          </div>
        </section>

        <aside className="fd-surface fd-audio-diagnostics">
          <div className="fd-section-head"><div><h3>Messung</h3><p>{analysis
            ? analysis.scope?.mode === 'representative'
              ? 'Schnellanalyse · Anfang, Mitte und Ende'
              : 'Messung des kurzen Sets'
            : 'Nach der Analyse sichtbar'}</p></div><Gauge size={18} /></div>
          <div className="fd-audio-meter-grid">
            <Meter label="Input Loudness" value={inputLoudness?.input_i} unit="LUFS" target={config.targetLufs} />
            <Meter label="Input True Peak" value={inputLoudness?.input_tp} unit="dBTP" target={config.truePeak} />
            <Meter label="Output Loudness" value={outputLoudness?.input_i} unit="LUFS" target={config.targetLufs} />
            <Meter label="Output True Peak" value={outputLoudness?.input_tp} unit="dBTP" target={config.truePeak} />
          </div>
          <div className="fd-audio-score-grid" aria-label="Technische Qualitätsscores">
            <QualityScoreCard title="Originalaufnahme" report={analysis?.qualityScore || result?.input?.qualityScore} />
            {result?.output?.qualityScore && (
              <QualityScoreCard title="Fertiges Master" report={result.output.qualityScore} />
            )}
          </div>
          {input && <dl className="fd-audio-facts"><div><dt>Dauer</dt><dd>{formatDuration(input.duration)}</dd></div><div><dt>Codec</dt><dd>{input.codec || '–'}</dd></div><div><dt>Samplerate</dt><dd>{input.sampleRate ? `${input.sampleRate / 1000} kHz` : '–'}</dd></div><div><dt>Kanäle</dt><dd>{input.channelLayout || input.channels || '–'}</dd></div><div><dt>Dateigröße</dt><dd>{formatBytes(input.size)}</dd></div></dl>}
          {analysis?.playbackUrl && <AudioPreview key={analysis.playbackUrl} label="Quelle vorhören" src={analysis.playbackUrl} />}
          {result?.playbackUrl && <AudioPreview key={result.playbackUrl} label="Master vorhören" src={result.playbackUrl} result />}
        </aside>
      </div>

      {sourcePath && <section className={`fd-surface fd-audio-action-card ${result ? 'complete' : ''}`} aria-label="Mastering-Aktion">
        <div>
          <span>{result ? 'Fertig' : `Schritt ${activeWorkflowStep} von 3`}</span>
          <strong>{result ? 'Master gespeichert und technisch verifiziert' : primaryAction.label}</strong>
          <p title={result?.outputPath || ''}>{result?.outputPath || (analysis ? 'Das Original bleibt erhalten. Die Ausgabe erhält einen neuen, versionierten Dateinamen.' : 'Die vollständige Analyse verhindert Blindflug bei Lautheit und Peaks.')}</p>
        </div>
        <div className="fd-toolbar-actions">
          {busy ? (
            <button type="button" className="fd-button danger" onClick={onCancel}>
              <CircleStop size={16} /> {analyzing ? 'Analyse abbrechen' : 'Mastering abbrechen'}
            </button>
          ) : result ? (
            <>
              <button type="button" className="fd-button primary" onClick={onPreparePublish}><UploadCloud size={16} /> Set-Publish vorbereiten</button>
              <button type="button" className="fd-button secondary" onClick={onReveal}><FolderOpen size={16} /> Datei im Ordner zeigen</button>
            </>
          ) : (
            <button type="button" className="fd-button primary" onClick={primaryAction.onClick}>
              <PrimaryIcon size={16} /> {primaryAction.label}
            </button>
          )}
          <button type="button" className="fd-icon-button" aria-label="Mastering zurücksetzen" title="Mastering zurücksetzen" onClick={onReset} disabled={busy}><RotateCcw size={16} /></button>
        </div>
      </section>}
    </div>
  );
};

export default AudioMasteringTab;
