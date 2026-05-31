import React from 'react';
import {
  Disc3,
  Image as ImageIcon,
  Layers3,
  Maximize2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  CREATIVE_PRESETS,
  FORMAT_OPTIONS,
  BACKGROUND_STILL_OPTIONS,
} from './designConstants.js';

// ── Phase ① — Setup ────────────────────────────────────────────
// Quick decisions: Set, Preset, Format, Background. Then → Studio.

const DesignSetupPhase = ({ config, sets, onConfigChange, onNext, onOpenStudio, flightDeckApi }) => {
  const selectedSet = sets.find((s) => s.id === config.setId) || sets[0];
  const selectedPreset = CREATIVE_PRESETS.find((p) => p.id === config.presetId) || CREATIVE_PRESETS[0];

  const patch = (updates) => onConfigChange({ ...config, ...updates });

  const applyPreset = (preset) => {
    patch({
      presetId: preset.id,
      style: preset.style,
      controls: { ...preset.controls },
    });
  };

  const randomize = () => {
    const drift = (value) => Math.max(0, Math.min(100, value + Math.round((Math.random() * 34) - 17)));
    patch({
      seed: config.seed + 137,
      controls: Object.fromEntries(
        Object.entries(config.controls).map(([k, v]) => [k, drift(v)]),
      ),
    });
  };

  const pickCustomBg = async () => {
    const api = window.flightDeckApi || flightDeckApi;
    if (api?.pickImportFiles) {
      const paths = await api.pickImportFiles();
      if (paths?.[0]) {
        patch({ bgSource: 'custom', customBgPath: paths[0] });
      }
    } else {
      const p = window.prompt('Absoluten Bildpfad eingeben:', 'D:\\assets\\back.jpg');
      if (p) patch({ bgSource: 'custom', customBgPath: p });
    }
  };

  return (
    <div className="fd-panel-stack">
      {/* ── Toolbar ─────────────────────────────────────── */}
      <section className="fd-toolbar-band">
        <div>
          <span className="fd-eyebrow">Creative Lab</span>
          <h2>Design Agent</h2>
          <p>
            Wähle Set, Look und Format — dann ab ins Studio für Feinschliff und Render.
          </p>
        </div>
        <div className="fd-toolbar-actions">
          <button type="button" className="fd-button secondary" onClick={randomize}>
            <RefreshCw size={15} />
            Remix
          </button>
          {onOpenStudio && (
            <button type="button" className="fd-button secondary" onClick={onOpenStudio}>
              <Maximize2 size={15} />
              Studio öffnen
            </button>
          )}
        </div>
      </section>

      {/* ── Set + Format ────────────────────────────────── */}
      <div className="fd-two-column">
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3><Disc3 size={18} /> Musik-Set</h3>
            <span>{selectedSet?.title || config.setId}</span>
          </div>
          <label className="fd-field-group">
            <select
              value={config.setId}
              onChange={(e) => patch({ setId: e.target.value })}
            >
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || s.id}{s.bpm ? ` (${s.bpm} BPM)` : ''}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3><Layers3 size={18} /> Format</h3>
            <span>{FORMAT_OPTIONS.find((o) => o.id === config.format)?.label}</span>
          </div>
          <div className="fd-wizard-choice-row">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`fd-wizard-choice ${config.format === opt.id ? 'active' : ''}`}
                onClick={() => patch({ format: opt.id })}
              >
                <strong>{opt.label}</strong>
                <span>{opt.detail}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── Preset Grid ─────────────────────────────────── */}
      <section className="fd-surface">
        <div className="fd-section-head">
          <h3><Zap size={18} /> Visuelle Richtung</h3>
          <span>{selectedPreset.label}</span>
        </div>
        <div className="fd-wizard-preset-grid">
          {CREATIVE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`fd-wizard-preset ${config.presetId === preset.id ? 'active' : ''}`}
              onClick={() => applyPreset(preset)}
            >
              <strong>{preset.label}</strong>
              <span>{preset.intent}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Background ──────────────────────────────────── */}
      <section className="fd-surface">
        <div className="fd-section-head">
          <h3><ImageIcon size={18} /> Hintergrund</h3>
          <span>
            {config.bgSource === 'custom'
              ? config.customBgPath.split('\\').pop() || 'Custom'
              : BACKGROUND_STILL_OPTIONS.find((o) => o.id === config.bgSource)?.label || config.bgSource}
          </span>
        </div>
        <div className="fd-wizard-choice-row fd-wizard-choice-row--wrap">
          {BACKGROUND_STILL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`fd-wizard-choice ${config.bgSource === opt.id ? 'active' : ''}`}
              onClick={() => {
                if (opt.id === 'custom') {
                  pickCustomBg();
                } else {
                  patch({ bgSource: opt.id });
                }
              }}
            >
              <strong>{opt.label}</strong>
              <span>
                {opt.id === 'custom' && config.customBgPath
                  ? config.customBgPath.split('\\').pop()
                  : opt.detail}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Next Step ───────────────────────────────────── */}
      <button
        type="button"
        className="fd-button fd-wizard-next-btn"
        onClick={onNext}
        disabled={!config.setId}
      >
        <Zap size={18} />
        Zum Studio
      </button>
    </div>
  );
};

export default DesignSetupPhase;
