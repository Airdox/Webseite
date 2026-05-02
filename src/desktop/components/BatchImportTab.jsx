import React, { useState, useCallback } from 'react';
import { Upload, Trash2, AlertTriangle, Play, Pause, Rocket } from 'lucide-react';

const BatchImportItem = ({ item, index, busy, onRemove, onStatusChange, onToggleSelected }) => {
  const statusColor = {
    pending: '#888888',
    ready: '#9adf6b',
    processing: '#60a5fa',
    success: '#9adf6b',
    error: '#f87171',
  };
  const statusLabel = {
    pending: 'wartet',
    ready: 'bereit',
    processing: 'laeuft',
    success: 'live',
    error: 'Fehler',
  };

  return (
    <div className="fd-batch-item" style={{ borderLeftColor: statusColor[item.status] }}>
      <div className="fd-batch-item-header">
        <label className="fd-batch-select" title="Fuer Live-Aktion auswaehlen">
          <input
            type="checkbox"
            checked={item.selected !== false}
            disabled={busy || item.status === 'processing' || item.status === 'success'}
            onChange={(event) => onToggleSelected(index, event.target.checked)}
          />
        </label>
        <span className="fd-batch-index">{index + 1}</span>
        <div className="fd-batch-info">
          <strong>{item.setId || item.title || item.fileName}</strong>
          <span className="fd-batch-status">
            {statusLabel[item.status] || item.status}
            {item.filePaths?.length ? ` / ${item.filePaths.length} Datei${item.filePaths.length === 1 ? '' : 'en'}` : ''}
          </span>
        </div>
        {item.progress && (
          <div className="fd-batch-progress">
            <div className="fd-progress-bar">
              <div
                className="fd-progress-fill"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span>{item.progress}%</span>
          </div>
        )}
        {item.message && (
          <span className="fd-batch-message">{item.message}</span>
        )}
      </div>
      <div className="fd-batch-actions">
        {item.status === 'pending' && (
          <button
            type="button"
            className="fd-icon-button"
            onClick={() => onRemove(index)}
            title="Entfernen"
          >
            <Trash2 size={16} />
          </button>
        )}
        {item.status === 'error' && (
          <button
            type="button"
            className="fd-icon-button"
            onClick={() => onStatusChange(index, 'pending')}
            title="Nochmal versuchen"
          >
            <Play size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const BatchImportTab = ({
  batchQueue = [],
  onAddItems = () => {},
  onRemoveItem = () => {},
  onToggleItem = () => {},
  onToggleAll = () => {},
  onStartBatch = () => {},
  onGoLiveBatch = () => {},
  onClearCompleted = () => {},
  onPauseBatch = () => {},
  isBatchRunning = false,
  batchProgress = { current: 0, total: 0 },
  busy = false,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = [];
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i += 1) {
          files.push(e.dataTransfer.files[i]);
        }
        onAddItems(files);
      }
    },
    [onAddItems],
  );

  const successCount = batchQueue.filter((item) => item.status === 'success').length;
  const errorCount = batchQueue.filter((item) => item.status === 'error').length;
  const pendingCount = batchQueue.filter((item) => ['pending', 'ready', 'processing'].includes(item.status)).length;
  const selectableCount = batchQueue.filter((item) => item.status !== 'processing' && item.status !== 'success').length;
  const selectedCount = batchQueue.filter((item) => (
    item.selected !== false
    && item.status !== 'processing'
    && item.status !== 'success'
  )).length;
  const prepareCount = batchQueue.filter((item) => (
    item.selected !== false
    && (item.status === 'pending' || item.status === 'error')
  )).length;
  const actionLocked = busy || isBatchRunning;

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Batch Import</h2>
          <p>
            Mehrere Sets gleichzeitig importieren. Drag & Drop oder Button zum Hinzufuegen.
          </p>
        </div>
        <div className="fd-toolbar-actions">
          <div className="fd-batch-stats">
            <span className="fd-stat green">✓ {successCount}</span>
            <span className="fd-stat amber">⏳ {pendingCount}</span>
            <span className="fd-stat red">✗ {errorCount}</span>
          </div>
          {isBatchRunning ? (
            <button
              type="button"
              className="fd-button secondary"
              onClick={onPauseBatch}
            >
              <Pause size={16} />
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="fd-button"
              onClick={onStartBatch}
              disabled={prepareCount === 0 || actionLocked}
            >
              <Play size={16} />
              Start
            </button>
          )}
          <button
            type="button"
            className="fd-button"
            onClick={onGoLiveBatch}
            disabled={batchQueue.length === 0 || selectedCount === 0 || actionLocked}
            title="Bereitet ausgewaehlte Batch-Sets vor, laedt Audio hoch und fuehrt Build/Deploy aus."
          >
            <Rocket size={16} />
            Auswahl live stellen
          </button>
        </div>
      </section>

      {batchProgress.total > 0 && (
        <section className="fd-surface fd-batch-progress-section">
          <div className="fd-section-head">
            <h3>Batch-Fortschritt</h3>
            <span>
              {batchProgress.current} / {batchProgress.total}
            </span>
          </div>
          <div className="fd-progress-container">
            <div className="fd-progress-bar-large">
              <div
                className="fd-progress-fill-large"
                style={{
                  width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                }}
              />
            </div>
            <span className="fd-progress-text">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
        </section>
      )}

      <section
        className={`fd-drag-drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDragIn}
        onDrop={handleDrop}
      >
        <div className="fd-drag-drop-content">
          <Upload size={32} />
          <h3>Audio-, Cover- und Tracklist-Dateien hier ablegen</h3>
          <p>Unterstutzt: MP3, WAV, FLAC, AIFF | JPG, PNG | TXT, CSV, JSON</p>
          <button
            type="button"
            className="fd-button secondary"
            onClick={() => onAddItems([])}
          >
            Oder Dateien waehlen...
          </button>
        </div>
      </section>

      {batchQueue.length > 0 && (
        <>
          <section className="fd-surface">
            <div className="fd-section-head">
              <h3>Import-Queue ({batchQueue.length})</h3>
              <div className="fd-inline-actions">
                <button
                  type="button"
                  className="fd-icon-link"
                  onClick={() => onToggleAll(selectedCount !== selectableCount)}
                  disabled={selectableCount === 0 || actionLocked}
                >
                  {selectedCount === selectableCount ? 'Auswahl aufheben' : 'Alle auswaehlen'}
                </button>
                <button
                  type="button"
                  className="fd-icon-link"
                  onClick={onClearCompleted}
                >
                  Fertige loeschen
                </button>
              </div>
            </div>
            <div className="fd-batch-queue">
              {batchQueue.map((item, idx) => (
                <BatchImportItem
                  key={`${item.id}-${idx}`}
                  item={item}
                  index={idx}
                  busy={busy}
                  onRemove={(i) => onRemoveItem(i)}
                  onToggleSelected={onToggleItem}
                  onStatusChange={() => {
                    // Optional: implement retry logic
                  }}
                />
              ))}
            </div>
          </section>

          {errorCount > 0 && (
            <section className="fd-surface fd-error-summary">
              <div className="fd-section-head fd-error-header">
                <AlertTriangle size={16} />
                <h3>{errorCount} Fehler in Batch-Verarbeitung</h3>
              </div>
              <div className="fd-error-list">
                {batchQueue
                  .filter((item) => item.status === 'error')
                  .map((item) => (
                    <div key={item.id} className="fd-error-item">
                      <strong>{item.title || item.fileName}</strong>
                      <p>{item.errorMessage}</p>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default BatchImportTab;
