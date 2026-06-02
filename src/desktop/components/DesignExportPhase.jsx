import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  FileJson,
  Terminal,
  Aperture,
  FolderOpen,
  Save,
  Eye,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getStyleName } from './designConstants.js';

// ── Phase ③ — Export ────────────────────────────────────────────
const DesignExportPhase = ({ config, sets, renderResult, previewGif, logs, onBackToStudio, onNewVariant, onReveal }) => {
  const selectedSet = sets.find((s) => s.id === config.setId) || sets[0];
  const [logsExpanded, setLogsExpanded] = useState(true);
  const logEndRef = useRef(null);

  // Auto-scroll logs to bottom when they update
  useEffect(() => {
    if (logEndRef.current?.scrollIntoView) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="fd-panel-stack">
      {/* ── Toolbar Band ─────────────────────────────────── */}
      <section className="fd-toolbar-band">
        <div>
          <span className="fd-eyebrow">Creative Lab</span>
          <h2>Render Erfolgreich!</h2>
          <p>Dein Transfer Pack steht für die Veröffentlichung und Photoshop bereit.</p>
        </div>
        <div className="fd-toolbar-actions">
          <button type="button" className="fd-button secondary" onClick={onBackToStudio}>
            <Sliders size={15} />
            Nochmal anpassen
          </button>
          <button type="button" className="fd-button" onClick={onNewVariant}>
            <RefreshCw size={15} />
            Neue Variante
          </button>
        </div>
      </section>

      {/* ── Main Export Grid ────────────────────────────── */}
      <div className="fd-two-column">
        {/* Left Column: Visual Loop Preview */}
        <section className="fd-surface fd-design-preview-panel">
          <div className="fd-section-head">
            <div>
              <h3><CheckCircle2 size={18} className="text-success" /> Gerenderter Loop</h3>
              <span>{renderResult?.setTitle || selectedSet?.title} - {getStyleName(config.style)}</span>
            </div>
            <span className="fd-status-pill ok">Fertig</span>
          </div>

          {/* Finished Preview Stage */}
          <div className={`fd-design-preview-stage ${config.format}`}>
            {previewGif ? (
              <img src={previewGif} alt="AIRDOX Gerendertes Design" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div className="fd-design-rendering" style={{ background: 'var(--surface-color-light)' }}>
                <Film size={48} />
                <strong style={{ marginTop: '12px' }}>Render erfolgreich abgeschlossen</strong>
                <span style={{ fontSize: '12px', opacity: 0.7 }}>GIF & MP4 im Release-Ordner abgelegt</span>
              </div>
            )}
          </div>

          {/* Score & Specs Summary */}
          <div className="fd-score-bar" style={{ marginTop: '16px' }}>
            <div className="fd-score-item">
              <small>Wow Score</small>
              <strong>{renderResult?.score || 88}</strong>
            </div>
            <div className="fd-score-item">
              <small>Format</small>
              <strong>{config.format.toUpperCase()}</strong>
            </div>
            <div className="fd-score-item">
              <small>Framerate</small>
              <strong>{config.fps} FPS</strong>
            </div>
            <div className="fd-score-item">
              <small>Seed</small>
              <strong>{config.seed}</strong>
            </div>
          </div>
        </section>

        {/* Right Column: Transfer Pack Files & Script Handoff */}
        <div className="fd-panel-stack" style={{ gap: '16px' }}>
          {/* Transfer Pack Files */}
          <section className="fd-surface">
            <div className="fd-section-head">
              <div>
                <h3>Transfer Pack</h3>
                <span>Dateien im Release-Verzeichnis freigeben</span>
              </div>
              <button
                type="button"
                className="fd-button secondary icon-only"
                onClick={() => onReveal('folder')}
                title="Ordner öffnen"
              >
                <FolderOpen size={15} />
              </button>
            </div>

            <div className="fd-panel-stack" style={{ padding: '16px', gap: '12px' }}>
              <div className="fd-file-list">
                {/* MP4 */}
                <div className="fd-file-item">
                  <div className="fd-file-info">
                    <Film size={18} className="text-accent" />
                    <div>
                      <strong>Video-Clip (MP4)</strong>
                      <span>High-Quality Loop für Reels & Storys</span>
                    </div>
                  </div>
                  <button type="button" className="fd-button secondary small" aria-label="MP4" onClick={() => onReveal('mp4')}>
                    Anzeigen
                  </button>
                </div>

                {/* GIF */}
                <div className="fd-file-item">
                  <div className="fd-file-info">
                    <Save size={18} className="text-accent" />
                    <div>
                      <strong>Web-Animation (GIF)</strong>
                      <span>Optimierter Loop für Webseite & Banner</span>
                    </div>
                  </div>
                  <button type="button" className="fd-button secondary small" aria-label="GIF" onClick={() => onReveal('gif')}>
                    Anzeigen
                  </button>
                </div>

                {/* Manifest */}
                <div className="fd-file-item">
                  <div className="fd-file-info">
                    <FileJson size={18} />
                    <div>
                      <strong>Set-Manifest (JSON)</strong>
                      <span>Metadaten & Parameter-Registry</span>
                    </div>
                  </div>
                  <button type="button" className="fd-button secondary small" onClick={() => onReveal('manifest')}>
                    Anzeigen
                  </button>
                </div>

                {/* Handoff Markdown */}
                <div className="fd-file-item">
                  <div className="fd-file-info">
                    <Terminal size={18} />
                    <div>
                      <strong>Handoff-Bericht (MD)</strong>
                      <span>Promptvorlagen und Design-Parameter</span>
                    </div>
                  </div>
                  <button type="button" className="fd-button secondary small" onClick={() => onReveal('handoff')}>
                    Anzeigen
                  </button>
                </div>

                {/* Mode dependent files */}
                {config.mode === '5050' && (
                  <>
                    {renderResult?.photoshopAction !== 'prompt_only' && (
                      <div className="fd-file-item">
                        <div className="fd-file-info">
                          <Aperture size={18} className="text-warning" />
                          <div>
                            <strong>Photoshop JSX Script</strong>
                            <span>Automatisches Layer- & Smartobjekt-Setup</span>
                          </div>
                        </div>
                        <button type="button" className="fd-button secondary small" aria-label="JSX Script" onClick={() => onReveal('script')}>
                          Anzeigen
                        </button>
                      </div>
                    )}

                    <div className="fd-file-item">
                      <div className="fd-file-info">
                        <Eye size={18} />
                        <div>
                          <strong>Photoshop Hero Frame</strong>
                          <span>Vorschau-Frame zur Abstimmung</span>
                        </div>
                      </div>
                      <button type="button" className="fd-button secondary small" onClick={() => onReveal('photoshop')}>
                        Anzeigen
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Collapsible Console Logs */}
          <section className="fd-surface fd-design-console">
            <button
              type="button"
              className="fd-sidebar-block-head"
              style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left' }}
              onClick={() => setLogsExpanded(!logsExpanded)}
              aria-expanded={logsExpanded}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} />
                <strong>Render Logs & Pipeline-Signale</strong>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {logsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {logsExpanded && (
              <div className="fd-design-log" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {logs.length === 0 ? (
                  <span className="fd-design-log-empty">Keine Log-Einträge vorhanden.</span>
                ) : (
                  logs.map((log, index) => (
                    <p key={`${log.timestamp}-${index}`} className={log.type || 'info'}>
                      <time>[{log.timestamp}]</time>
                      {log.message}
                    </p>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DesignExportPhase;
