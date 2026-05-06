import React from 'react';
import { FolderOpen, LoaderCircle, PackageCheck, Upload } from 'lucide-react';

const emptyTrack = { time: '', artist: '', title: '' };

const SetImportTab = ({
  draft,
  warnings,
  busy,
  isElectron,
  onPickFiles,
  onLoadDemo,
  onPublish,
  onGoLive = () => {},
  canGoLive,
  goLiveDisabledReason = '',
  onDraftChange,
  onTrackChange,
  onTrackAdd,
  onTrackRemove,
  publishLogs,
  lastPublish,
  publishStatus = null,
}) => {
  const handleDrop = (event) => {
    event.preventDefault();
    const filePaths = Array.from(event.dataTransfer.files || []).map((file) => file.path).filter(Boolean);
    if (filePaths.length) {
      onPickFiles(filePaths);
      return;
    }
    if (!isElectron) {
      onLoadDemo();
    }
  };
  const goLiveEnabled = canGoLive ?? Boolean(draft.id && draft.file);
  const publishBusy = publishStatus?.state === 'running';
  const publishModeLabel = publishStatus?.mode === 'live' ? 'Go Live' : 'Publish';
  const publishStepLabel = publishStatus?.label || 'Bereit';
  const publishDetail = publishStatus?.detail || 'Noch kein Publish gestartet.';
  const publishProgress = Math.min(100, Math.max(0, Number(publishStatus?.progress) || 0));

  return (
    <div className="fd-panel-stack">
      <section
        className="fd-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div>
          <h2>Set Import</h2>
          <p>MP3, Cover und Tracklist direkt aus dem Dateisystem ziehen. Das Tool liest Dauer, Dateihinweise und Cover automatisch ein.</p>
        </div>
        <div className="fd-toolbar-actions">
          {!isElectron && (
            <button type="button" className="fd-button secondary" onClick={onLoadDemo}>
              <PackageCheck size={16} />
              Demo Import
            </button>
          )}
          <button type="button" className="fd-button" onClick={() => onPickFiles()}>
            <FolderOpen size={16} />
            Dateien waehlen
          </button>
        </div>
      </section>

      {warnings.length > 0 && (
        <section className="fd-inline-alert">
          {warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </section>
      )}

      <div className="fd-two-column">
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Draft</h3>
            <span>{draft.id || 'new-set'}</span>
          </div>
          <div className="fd-form-grid">
            <label>ID<input value={draft.id || ''} onChange={(event) => onDraftChange('id', event.target.value)} /></label>
            <label>Titel<input value={draft.title || ''} onChange={(event) => onDraftChange('title', event.target.value)} /></label>
            <label>Date Label<input value={draft.date || ''} onChange={(event) => onDraftChange('date', event.target.value)} /></label>
            <label>Datei<input value={draft.file || ''} onChange={(event) => onDraftChange('file', event.target.value)} /></label>
            <label>Dauer<input value={draft.duration || ''} onChange={(event) => onDraftChange('duration', event.target.value)} /></label>
            <label>Vinyl Color<input type="color" value={draft.vinylColor || '#9adf6b'} onChange={(event) => onDraftChange('vinylColor', event.target.value)} /></label>
            <label>Cover Path<input value={draft.cover || ''} onChange={(event) => onDraftChange('cover', event.target.value)} /></label>
            <label>Published At<input type="date" value={draft.publishedAt || ''} onChange={(event) => onDraftChange('publishedAt', event.target.value)} /></label>
            <label className="fd-checkbox-row">
              <input type="checkbox" checked={Boolean(draft.isNew)} onChange={(event) => onDraftChange('isNew', event.target.checked)} />
              <span>New Badge aktiv</span>
            </label>
          </div>
          <div className="fd-form-grid">
            <label>Audio Source<input value={draft.sourceAudioPath || ''} readOnly /></label>
            <label>Cover Source<input value={draft.sourceImagePath || ''} readOnly /></label>
            <label>Tracklist Source<input value={draft.sourceTracklistPath || ''} readOnly /></label>
          </div>
          <div
            className={`fd-publish-status ${publishBusy ? 'running' : publishStatus?.state || 'idle'}`}
            role="status"
            aria-live="polite"
          >
            <div>
              <strong>{publishBusy ? `${publishModeLabel} laeuft` : publishStepLabel}</strong>
              <span>{publishDetail}</span>
              <div
                className="fd-inline-progress"
                role="progressbar"
                aria-label={`${publishModeLabel} Fortschritt`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={publishProgress}
              >
                <span style={{ width: `${publishProgress}%` }} />
              </div>
            </div>
            <strong className="fd-publish-percent">{publishProgress}%</strong>
            {publishBusy && <LoaderCircle className="fd-spin" size={18} aria-hidden="true" />}
          </div>
          <div className="fd-toolbar-actions">
            <button type="button" className="fd-button primary" onClick={onPublish} disabled={busy || !draft.id || !draft.file}>
              {publishBusy && publishStatus?.mode === 'publish'
                ? <LoaderCircle className="fd-spin" size={16} />
                : <Upload size={16} />}
              {publishBusy && publishStatus?.mode === 'publish' ? 'Publish laeuft...' : 'Publish Set'}
            </button>
            <button
              type="button"
              className="fd-button"
              onClick={onGoLive}
              disabled={busy || !goLiveEnabled}
              title={goLiveEnabled ? 'Speichert Settings und startet die komplette Live-Pipeline gemaess deiner Flight-Deck-Konfiguration.' : goLiveDisabledReason}
            >
              {publishBusy && publishStatus?.mode === 'live'
                ? <LoaderCircle className="fd-spin" size={16} />
                : <Upload size={16} />}
              {publishBusy && publishStatus?.mode === 'live' ? 'Live-Pipeline laeuft...' : 'Alles ausfuehren & Live'}
            </button>
          </div>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Tracklist</h3>
            <span>{(draft.tracks || []).length} Tracks</span>
          </div>
          <div className="fd-track-editor">
            {(draft.tracks || []).map((track, index) => (
              <div className="fd-track-row" key={`${track.time}-${track.title}-${index}`}>
                <input value={track.time || ''} onChange={(event) => onTrackChange(index, 'time', event.target.value)} placeholder="00:00" />
                <input value={track.artist || ''} onChange={(event) => onTrackChange(index, 'artist', event.target.value)} placeholder="Artist" />
                <input value={track.title || ''} onChange={(event) => onTrackChange(index, 'title', event.target.value)} placeholder="Title" />
                <button type="button" className="fd-icon-button danger" onClick={() => onTrackRemove(index)} aria-label={`Remove track ${index + 1}`}>
                  x
                </button>
              </div>
            ))}
            <button type="button" className="fd-button secondary" onClick={() => onTrackAdd(emptyTrack)}>Track hinzufuegen</button>
          </div>
        </section>
      </div>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Publish Log</h3>
          <span>{publishLogs.length} Schritte</span>
        </div>
        <div className="fd-activity-list">
          {publishLogs.length === 0 && <p>Noch kein Publish ausgefuehrt.</p>}
          {publishLogs.map((entry, index) => (
            <article className="fd-activity-row" key={`${entry.step}-${index}`}>
              <div>
                <strong>{entry.step}</strong>
                <span>{entry.status}</span>
              </div>
              <div>
                <span>{entry.detail}</span>
              </div>
              <time>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('de-DE') : 'n/a'}</time>
            </article>
          ))}
        </div>
        {lastPublish?.publishedSet && (
          <div className="fd-inline-alert success">
            Letztes Publish: `{lastPublish.publishedSet.id}` auf Branch `{lastPublish.gitStatus?.branch || 'n/a'}`.
          </div>
        )}
      </section>
    </div>
  );
};

export default SetImportTab;
