import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Clapperboard,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Aperture,
  Zap,
  Sliders,
  Type,
  Code2,
} from 'lucide-react';
import {
  TOP_SLIDERS,
  EXTRA_SLIDERS,
  MARK_OPTIONS,
  PHOTOSHOP_SCRIPT_OPTIONS,
  GRAFFITI_STYLE_OPTIONS,
  getScore,
  makePrompt,
} from './designConstants.js';

// ── PreviewMark Sub-component ───────────────────────────────────
const PreviewMark = ({ markStyle, markText }) => {
  if (markStyle === 'none') return null;
  if (markStyle !== 'graffiti') {
    return <strong className={`fd-design-text-mark ${markStyle}`}>{markText || 'AIRDOX'}</strong>;
  }
  return (
    <svg className="fd-graffiti-preview-logo" viewBox="0 0 700 170" role="img" aria-label="AIRDOX graffiti logo preview">
      <g className="shadow" transform="translate(10 7)">
        <path d="M18 132 L64 16 L108 132 L82 126 L73 101 L49 104 L39 132 Z" />
        <path d="M126 28 L184 16 L178 44 L161 45 L151 112 L176 108 L170 134 L108 145 L115 116 L132 115 L142 49 L119 53 Z" />
        <path d="M202 133 L214 20 L268 14 Q307 18 300 54 Q296 78 266 89 L302 135 L264 130 L239 95 L234 137 Z" />
        <path d="M318 134 L326 19 L383 16 Q442 21 439 72 Q435 127 377 136 Z" />
        <path d="M461 130 Q424 112 431 67 Q438 21 486 15 Q533 9 548 48 Q562 89 531 118 Q501 145 461 130 Z" />
        <path d="M548 134 L587 72 L562 23 L598 18 L612 48 L638 13 L678 18 L628 76 L662 136 L624 132 L604 99 L580 139 Z" />
      </g>
      <g className="main">
        <path d="M18 132 L64 16 L108 132 L82 126 L73 101 L49 104 L39 132 Z" />
        <path d="M54 79 L68 78 L61 48 Z" className="cut" />
        <path d="M126 28 L184 16 L178 44 L161 45 L151 112 L176 108 L170 134 L108 145 L115 116 L132 115 L142 49 L119 53 Z" />
        <path d="M202 133 L214 20 L268 14 Q307 18 300 54 Q296 78 266 89 L302 135 L264 130 L239 95 L234 137 Z" />
        <path d="M241 42 L237 70 L260 68 Q277 65 279 53 Q281 39 262 38 Z" className="cut" />
        <path d="M318 134 L326 19 L383 16 Q442 21 439 72 Q435 127 377 136 Z" />
        <path d="M357 43 L352 108 L378 105 Q405 101 407 73 Q410 43 382 40 Z" className="cut" />
        <path d="M461 130 Q424 112 431 67 Q438 21 486 15 Q533 9 548 48 Q562 89 531 118 Q501 145 461 130 Z" />
        <path d="M471 100 Q455 90 459 68 Q462 45 487 41 Q512 38 520 57 Q529 80 511 96 Q493 112 471 100 Z" className="cut" />
        <path d="M548 134 L587 72 L562 23 L598 18 L612 48 L638 13 L678 18 L628 76 L662 136 L624 132 L604 99 L580 139 Z" />
        <path d="M24 130 L9 152 L48 137 Z" className="slash" />
        <path d="M650 127 L694 151 L636 141 Z" className="slash" />
      </g>
    </svg>
  );
};

// ── Phase ② — Studio ───────────────────────────────────────────
const DesignStudioPhase = ({ config, sets, onConfigChange, onBack, onRender, isRendering, renderProgress }) => {
  const selectedSet = sets.find((s) => s.id === config.setId) || sets[0];
  
  // Preview and IDE tab selections
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [ideTab, setIdeTab] = useState('jsx'); 

  // Pane resizing states (draggable split panel width)
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const prevWidthRef = useRef(480);

  const patch = (updates) => onConfigChange({ ...config, ...updates });

  const updateControl = (key, val) => {
    patch({
      controls: {
        ...config.controls,
        [key]: Number(val),
      },
    });
  };

  // Drag handles for the vertical splitter
  const startResize = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return undefined;
    const doResize = (e) => {
      const newWidth = window.innerWidth - e.clientX - 16;
      if (newWidth > 320 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };
    const stopResize = () => {
      setIsResizing(false);
    };
    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);

  const toggleCollapse = () => {
    if (sidebarWidth > 50) {
      prevWidthRef.current = sidebarWidth;
      setSidebarWidth(0);
    } else {
      setSidebarWidth(prevWidthRef.current);
    }
  };

  // Preview loop interval
  useEffect(() => {
    if (!isPlayingPreview || isRendering) return undefined;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % 8);
    }, 1000 / config.fps);
    return () => clearInterval(interval);
  }, [config.fps, isPlayingPreview, isRendering]);

  // Scores
  const score = useMemo(() => getScore(config.controls), [config.controls]);

  // Prompt brief compiler
  const prompt = useMemo(() => {
    return makePrompt({
      selectedSet,
      selectedPreset: { label: config.presetId },
      controls: config.controls,
      fps: config.fps,
      format: config.format,
      seed: config.seed,
      markText: config.markText,
      markStyle: config.markStyle,
      graffitiStyles: config.graffitiStyles,
      bgSource: config.bgSource,
      customBgPath: config.customBgPath,
    });
  }, [config, selectedSet]);

  // Real-time Live JSX Script Compiler (syncs with slider positions in real-time!)
  const liveJSXCode = useMemo(() => {
    return [
      `// ── AIRDOX Photoshop Script Handoff v0.1.25 ──`,
      `// Generated on ${new Date().toLocaleDateString('de-DE')} | Synced in real-time`,
      `// Target Canvas: ${config.format.toUpperCase()} (${config.format === 'square' ? '800x800px' : '1080x1920px'})`,
      ``,
      `#target photoshop`,
      `app.bringToFront();`,
      ``,
      `// 1. Initialize Document & Color profiles`,
      `var doc = app.documents.add(`,
      `  ${config.format === 'square' ? '800, 800' : '1080, 1920'},`,
      `  72, "AIRDOX_${selectedSet?.id?.toUpperCase() || 'DESIGN'}",`,
      `  NewDocumentMode.RGB, DocumentFill.BACKGROUNDCOLOR`,
      `);`,
      ``,
      `// 2. Set Pipeline Variables (Live Slider Sync)`,
      `var energyLevel = ${config.controls.energy};     // Beat-Energie`,
      `var motionStrength = ${config.controls.motion};   // Motion Strength`,
      `var parallaxDepth = ${config.controls.depth};     // Parallax-Tiefe`,
      `var glitchBurst = ${config.controls.glitch};       // Glitch-Burst`,
      `var scanlinesIntensity = ${config.controls.scanlines};`,
      `var cameraPushOffset = ${config.controls.cameraPush};`,
      ``,
      `// 3. Inject Brand Mark Overlay Layer`,
      `var markStyle = "${config.markStyle}";`,
      `var markText = "${config.markText}";`,
      `if (markStyle !== "none") {`,
      `  var markLayer = doc.artLayers.add();`,
      `  markLayer.name = "AIRDOX_" + markStyle.toUpperCase() + "_MARK";`,
      `  markLayer.kind = LayerKind.TEXT;`,
      `  var textItem = markLayer.textItem;`,
      `  textItem.contents = markText;`,
      `  textItem.size = ${config.markStyle === 'block' ? '92' : '64'};`,
      `  textItem.justification = Justification.CENTER;`,
      `}`,
      ``,
      `// 4. Register Graffiti Style Actions (Draggable Checklist)`,
      `var activeGraffitiStyles = [${(config.graffitiStyles || []).map(s => `"${s}"`).join(', ')}];`,
      `for (var i = 0; i < activeGraffitiStyles.length; i++) {`,
      `  app.doAction("Apply_" + activeGraffitiStyles[i], "AIRDOX_Graffiti_Suite");`,
      `}`,
      ``,
      `// 5. Final Handoff Log`,
      `alert("Photoshop Handoff erfolgreich initialisiert!");`
    ].join('\n');
  }, [config, selectedSet]);

  const previewStyle = {
    '--preview-energy': config.controls.energy,
    '--preview-motion': config.controls.motion,
    '--preview-glitch': config.controls.glitch,
    '--preview-type': config.controls.typography,
    '--preview-color': config.controls.colorShift,
    '--preview-grain': config.controls.grain,
    '--preview-scan': config.controls.scanlines,
    '--preview-depth': config.controls.depth,
    '--preview-camera': config.controls.cameraPush,
    '--preview-wave': config.controls.waveform,
    '--preview-strobe': config.controls.strobe,
    '--preview-density': config.controls.density,
    '--preview-frame': currentFrame,
    '--preview-beat': currentFrame % 2,
    '--preview-skew-dir': currentFrame % 2 === 0 ? 1 : -1,
    '--preview-color-main': selectedSet?.vinylColor || '#00f0ff',
  };

  const toggleGraffitiStyle = (styleId) => {
    let list = [...(config.graffitiStyles || [])];
    if (list.includes(styleId)) {
      list = list.filter((id) => id !== styleId);
      if (!list.length) list = [styleId];
    } else {
      list.push(styleId);
    }
    patch({ graffitiStyles: list, mode: '5050' });
  };

  const copyCodeToClipboard = () => {
    const activeText = ideTab === 'jsx' ? liveJSXCode : ideTab === 'prompt' ? prompt : JSON.stringify(config, null, 2);
    window.navigator?.clipboard?.writeText(activeText);
  };

  const allSliders = useMemo(() => {
    return [...TOP_SLIDERS, ...EXTRA_SLIDERS];
  }, []);

  // ── Pop-Art Cyberpunk Character Daumenkino Animator (SVG Engine) ──
  const renderDaumenkinoCharacter = () => {
    const pose = currentFrame % 4;
    return (
      <div className="fd-daumenkino-canvas">
        {/* Halftone pop-art dot screen overlay */}
        <div className="fd-daumenkino-dots" />
        
        <svg className="fd-daumenkino-character-svg" viewBox="0 0 400 400">
          {/* Cyberpunk Neon Laser Eyes (Fires on pose 1, matching the bunker reference video!) */}
          {pose === 1 && (
            <g className="fd-daumenkino-lasers">
              <line x1="160" y1="180" x2="0" y2="240" stroke="var(--airdox-cyan)" strokeWidth="8" strokeLinecap="round" />
              <line x1="240" y1="180" x2="400" y2="240" stroke="var(--airdox-cyan)" strokeWidth="8" strokeLinecap="round" />
              <line x1="160" y1="180" x2="0" y2="240" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <line x1="240" y1="180" x2="400" y2="240" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {/* Character outline and fills */}
          <g stroke="var(--airdox-text)" strokeWidth="7" fill="none" strokeLinejoin="round" strokeLinecap="round">
            {/* Common Face Shape */}
            <path d="M120 220 Q110 130 200 120 Q290 130 280 220 Q280 280 200 290 Q120 280 120 220 Z" fill="rgba(15, 20, 26, 0.95)" />
            
            {/* Pose 0: headphones and smile */}
            {pose === 0 && (
              <g>
                <circle cx="200" cy="205" r="50" strokeWidth="4" />
                <path d="M100 220 Q80 220 90 190 Q100 160 120 170" />
                <path d="M300 220 Q320 220 310 190 Q300 160 280 170" />
                <path d="M165 200 Q180 190 185 205" strokeWidth="4" />
                <path d="M235 200 Q220 190 215 205" strokeWidth="4" />
                <path d="M180 240 Q200 260 220 240" strokeWidth="5" />
              </g>
            )}

            {/* Pose 1: Neon Laser Caps character */}
            {pose === 1 && (
              <g>
                <path d="M110 125 L290 125 L270 95 L130 95 Z" fill="var(--airdox-lime)" /> 
                <circle cx="160" cy="180" r="14" fill="var(--airdox-cyan)" stroke="none" />
                <circle cx="240" cy="180" r="14" fill="var(--airdox-cyan)" stroke="none" />
                <path d="M170 230 Q200 255 230 230" strokeWidth="6" />
              </g>
            )}

            {/* Pose 2: Retro shades & V-hand sign overlay */}
            {pose === 2 && (
              <g>
                <path d="M130 180 L270 180" strokeWidth="12" stroke="var(--airdox-lime)" />
                <path d="M170 235 Q200 210 230 235" fill="var(--airdox-danger)" />
                <path d="M310 280 L290 230 L270 210 L275 190 L290 210 L310 180 L320 200 L305 230 L330 280 Z" fill="rgba(15, 20, 26, 0.95)" />
              </g>
            )}

            {/* Pose 3: Stencil hoodie and street tag look */}
            {pose === 3 && (
              <g>
                <path d="M120 130 Q200 60 280 130 L290 230 L110 230 Z" /> 
                <path d="M155 190 L175 190" strokeWidth="6" />
                <path d="M225 190 L245 190" strokeWidth="6" />
                <path d="M180 230 H220" strokeWidth="4" />
              </g>
            )}
          </g>
        </svg>
      </div>
    );
  };

  return (
    <div className="fd-panel-stack">
      {/* ── Toolbar Band (Slim Header) ──────────────────── */}
      <section className="fd-toolbar-band" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" className="fd-button secondary small" onClick={onBack} disabled={isRendering} style={{ minHeight: '30px' }}>
            <ArrowLeft size={14} />
            Zurück
          </button>
          <div>
            <span className="fd-eyebrow" style={{ fontSize: '10px' }}>Creative Studio</span>
            <h2 style={{ fontSize: '1.15rem' }}>{selectedSet?.title || 'Studio'}</h2>
          </div>
        </div>
        <div className="fd-toolbar-actions">
          <span className={`fd-status-pill ${isRendering ? 'info animate-pulse' : 'ok'}`} style={{ padding: '3px 8px', fontSize: '11px' }}>
            <Zap size={12} /> {isRendering ? 'Rendern...' : 'Studio Aktiv'}
          </span>
        </div>
      </section>

      {/* ── Drag-Resizable Dual Column Layout ────────────── */}
      <div className="fd-studio-layout">
        
        {/* Left Column: Fixed Sticky Live Preview Workspace */}
        <div className="fd-studio-left-col fd-panel-stack" style={{ gap: '12px' }}>
          <section className="fd-surface fd-design-preview-panel" style={{ padding: '12px' }}>
            <div className="fd-section-head" style={{ marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '0.94rem' }}>Live Preview</h3>
                <span style={{ fontSize: '11px' }}>Parametrische Web-Simulation</span>
              </div>
              <button
                type="button"
                className="fd-button secondary icon-only small"
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                disabled={isRendering}
                style={{ width: '28px', height: '28px', minHeight: '28px' }}
              >
                {isPlayingPreview ? <Pause size={13} /> : <Play size={13} />}
              </button>
            </div>

            {/* Live Visual Canvas Stage */}
            <div className={`fd-design-preview-stage ${config.format}`} style={previewStyle}>
              {isRendering && (
                <div className="fd-design-progress-bar" aria-label="Render-Fortschritt">
                  <span style={{ width: `${renderProgress}%` }} />
                </div>
              )}

              {isRendering ? (
                <div className="fd-design-rendering">
                  <span className="fd-spin" style={{ display: 'inline-block', marginBottom: '4px' }}>
                    <Zap size={28} />
                  </span>
                  <strong style={{ fontSize: '0.9rem' }}>Video-Synthese läuft</strong>
                  <span style={{ fontSize: '11px' }}>{renderProgress}%</span>
                </div>
              ) : config.style === 'daumenkino' ? (
                renderDaumenkinoCharacter()
              ) : (
                <div className={`fd-design-live-art ${config.style}`}>
                  <div className="fd-design-art-depth back" />
                  <div className="fd-design-art-depth mid" />
                  <div className="fd-design-waveform">
                    {Array.from({ length: 18 }).map((_, idx) => (
                      <span
                        key={idx}
                        style={{
                          height: `${18 + (((idx * 13) + (currentFrame * 17)) % 76) * (config.controls.energy / 100)}px`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="fd-design-type">
                    <PreviewMark markStyle={config.markStyle} markText={config.markText} />
                    <span>{selectedSet?.title || 'AIRDOX live set'}</span>
                  </div>
                  <div className="fd-design-data-burn">
                    <span>SEED {config.seed}</span>
                    <span>{config.presetId}</span>
                    <span>{config.fps} FPS</span>
                  </div>
                  <div className="fd-design-safe-area" />
                </div>
              )}
            </div>

            {/* Score Grid Indicators */}
            <div className="fd-score-bar" style={{ marginTop: '10px' }}>
              <div className="fd-score-item" style={{ padding: '6px 8px' }}>
                <small style={{ fontSize: '10px' }}>Gesamtwert</small>
                <strong style={{ fontSize: '1rem' }}>{score.total}</strong>
              </div>
              <div className="fd-score-item" style={{ padding: '6px 8px' }}>
                <small style={{ fontSize: '10px' }}>Motion</small>
                <strong style={{ fontSize: '1rem' }}>{score.motionEnergy}</strong>
              </div>
              <div className="fd-score-item" style={{ padding: '6px 8px' }}>
                <small style={{ fontSize: '10px' }}>Audio Link</small>
                <strong style={{ fontSize: '1rem' }}>{score.audioLink}</strong>
              </div>
              <div className="fd-score-item" style={{ padding: '6px 8px' }}>
                <small style={{ fontSize: '10px' }}>Type</small>
                <strong style={{ fontSize: '1rem' }}>{score.firstFrame}</strong>
              </div>
            </div>
          </section>

          {/* Panel 2: Live Creative AI Prompt & JSX Script Compiler Console (Hacker Vibe) */}
          <section className="fd-surface" style={{ padding: '12px' }}>
            <div className="fd-section-head" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code2 size={16} className="text-accent" />
                <div>
                  <h3 style={{ fontSize: '0.94rem' }}>Creative Script Compiler</h3>
                  <span style={{ fontSize: '11px' }}>Echtzeit-Ausgabe für Photoshop und Handoff</span>
                </div>
              </div>
              
              <div className="fd-wizard-segmented-mini" style={{ margin: 0, height: '28px' }}>
                <button
                  type="button"
                  className={ideTab === 'jsx' ? 'active' : ''}
                  onClick={() => setIdeTab('jsx')}
                  style={{ fontSize: '0.74rem' }}
                >
                  Photoshop (JSX)
                </button>
                <button
                  type="button"
                  className={ideTab === 'prompt' ? 'active' : ''}
                  onClick={() => setIdeTab('prompt')}
                  style={{ fontSize: '0.74rem' }}
                >
                  Prompt Briefing
                </button>
                <button
                  type="button"
                  className={ideTab === 'specs' ? 'active' : ''}
                  onClick={() => setIdeTab('specs')}
                  style={{ fontSize: '0.74rem' }}
                >
                  Manifest Specs
                </button>
              </div>
            </div>

            {/* IDE Hacking Console Display Area */}
            <div style={{ position: 'relative' }}>
              <pre className="fd-design-prompt" style={{ 
                height: '180px',
                overflowY: 'auto',
                fontSize: '11px',
                lineHeight: '1.45',
                padding: '10px',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                background: 'rgba(5, 6, 8, 0.86)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              }}>
                {ideTab === 'jsx' && liveJSXCode}
                {ideTab === 'prompt' && prompt}
                {ideTab === 'specs' && JSON.stringify(config, null, 2)}
              </pre>
              <button
                type="button"
                className="fd-button secondary icon-only small"
                onClick={copyCodeToClipboard}
                title="Code kopieren"
                style={{ position: 'absolute', right: '8px', top: '8px', width: '26px', height: '26px', minHeight: '26px' }}
              >
                <Copy size={12} />
              </button>
            </div>
          </section>

          {/* Render Execution Trigger Button */}
          <button
            type="button"
            className="fd-button fd-wizard-next-btn"
            onClick={onRender}
            disabled={isRendering}
            style={{ minHeight: '44px' }}
          >
            <Clapperboard size={16} />
            {isRendering ? `Render läuft (${renderProgress}%)` : 'Pipeline ausführen (Rendern)'}
          </button>
        </div>

        {/* ── Flex-Draggable Vertical Resizing Splitter Bar ── */}
        <div 
          className={`fd-studio-splitter ${isResizing ? 'resizing' : ''}`}
          onMouseDown={startResize}
          onDoubleClick={toggleCollapse}
          title="Ziehen zum Skalieren / Doppelklick zum Ein- & Ausblenden"
        />

        {/* Right Column: Scrollable Workspace Panel (Controlled Width) */}
        {sidebarWidth > 50 && (
          <div 
            className="fd-studio-right-col" 
            style={{ width: `${sidebarWidth}px`, flex: `0 0 ${sidebarWidth}px` }}
          >
            {/* Card 1: Marken-Overlay (100% visible side-by-side fields) */}
            <section className="fd-surface" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Type size={16} className="text-accent" />
                <strong style={{ fontSize: '0.9rem' }}>Marken-Overlay</strong>
              </div>
              
              <div className="fd-panel-stack" style={{ gap: '10px' }}>
                <div className="fd-studio-marke-row">
                  <label className="fd-field-group" style={{ margin: 0 }}>
                    Overlay-Text
                    <input
                      type="text"
                      value={config.markText}
                      onChange={(e) => patch({ markText: e.target.value })}
                      disabled={isRendering}
                      placeholder="AIRDOX"
                      style={{ height: '36px' }}
                    />
                  </label>

                  <div className="fd-field-group" style={{ margin: 0 }}>
                    Stil der Marke
                    <div className="fd-wizard-segmented-mini">
                      {MARK_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={config.markStyle === opt.id ? 'active' : ''}
                          onClick={() => patch({ markStyle: opt.id })}
                          disabled={isRendering}
                          title={opt.detail}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Visuelles Feintuning (ALL 12 parameters open & visible in tight 24px rows) */}
            <section className="fd-surface" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Sliders size={16} className="text-accent" />
                <strong style={{ fontSize: '0.9rem' }}>Visuelles Feintuning (Alle 12 Regler)</strong>
              </div>

              <div className="fd-compact-slider-group">
                {allSliders.map((s) => (
                  <div key={s.key} className="fd-compact-slider-item">
                    <span>{s.label}</span>
                    <input
                      aria-label={s.label}
                      type="range"
                      min={s.min}
                      max={s.max}
                      value={config.controls[s.key]}
                      onChange={(e) => updateControl(s.key, e.target.value)}
                      disabled={isRendering}
                    />
                    <strong>{config.controls[s.key]}</strong>
                  </div>
                ))}
              </div>
            </section>

            {/* Card 3: Photoshop-Script & Handoff (100% visible and ready for export) */}
            <section className="fd-surface" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Aperture size={16} className="text-accent" />
                <strong style={{ fontSize: '0.9rem' }}>Photoshop & Handoff-Pipeline</strong>
              </div>

              <div className="fd-panel-stack" style={{ gap: '10px' }}>
                <div className="fd-field-group" style={{ margin: 0 }}>
                  Pipeline-Modus
                  <div className="fd-wizard-segmented-mini" style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      className={config.mode === 'auto' ? 'active' : ''}
                      onClick={() => patch({ mode: 'auto' })}
                      disabled={isRendering}
                    >
                      Autopilot (Direkt)
                    </button>
                    <button
                      type="button"
                      className={config.mode === '5050' ? 'active' : ''}
                      onClick={() => patch({ mode: '5050' })}
                      disabled={isRendering}
                    >
                      Photoshop Script (JSX)
                    </button>
                  </div>
                </div>

                {config.mode === '5050' && (
                  <>
                    <div className="fd-field-group" style={{ margin: 0 }}>
                      Photoshop Script Aktion
                      <div className="fd-wizard-segmented-mini" style={{ marginTop: '4px' }}>
                        {PHOTOSHOP_SCRIPT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={config.photoshopAction === opt.id ? 'active' : ''}
                            onClick={() => patch({ photoshopAction: opt.id })}
                            disabled={isRendering}
                          >
                            {opt.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="fd-field-group" style={{ margin: 0 }}>
                      Graffiti-Druckaufträge (Checkliste als Tags)
                      <div className="fd-wizard-tag-row">
                        {GRAFFITI_STYLE_OPTIONS.map((opt) => {
                          const isActive = config.graffitiStyles?.includes(opt.id);
                          return (
                            <span
                              key={opt.id}
                              className={`fd-wizard-tag-pill ${isActive ? 'active' : ''}`}
                              onClick={() => toggleGraffitiStyle(opt.id)}
                              title={opt.detail}
                            >
                              {opt.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignStudioPhase;
