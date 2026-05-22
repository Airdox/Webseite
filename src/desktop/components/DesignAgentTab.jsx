import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Palette, Film, Play, Pause, Save, Cpu, Eye, 
  HelpCircle, Settings, FileText, CheckCircle2, AlertTriangle, Terminal 
} from 'lucide-react';

export default function DesignAgentTab({ sets, flightDeckApi }) {
  const [selectedSetId, setSelectedSetId] = useState(sets?.[0]?.id || '');
  const [mode, setMode] = useState('5050'); // '5050' or 'auto'
  const [style, setStyle] = useState('flicker'); // 'flicker', 'liquid', 'glitch', 'neon'
  const [fps, setFps] = useState(12);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [logs, setLogs] = useState([]);
  const [renderFinished, setRenderFinished] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewGif, setPreviewGif] = useState(null);
  
  const logContainerRef = useRef(null);
  
  const selectedSet = sets?.find(s => s.id === selectedSetId);
  
  // Simulated frames for the flipbook preview (using placeholders that look awesome)
  const totalPreviewFrames = 7;

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Stream live logs directly from main Electron process!
  useEffect(() => {
    const api = window.flightDeckApi || flightDeckApi;
    if (api?.onDesignLog) {
      const unsubscribe = api.onDesignLog((log) => {
        setLogs(prev => [...prev, log]);
      });
      return unsubscribe;
    }
  }, [flightDeckApi]);

  // Flipbook animation loop
  useEffect(() => {
    let interval;
    if (isPlayingPreview && !previewGif) {
      interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % totalPreviewFrames);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlayingPreview, fps, previewGif]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const handleStartRender = async () => {
    if (!selectedSetId) return;
    setIsRendering(true);
    setRenderFinished(false);
    setRenderProgress(0);
    setLogs([]);
    setPreviewGif(null);
    setIsPlayingPreview(false);

    try {
      const api = window.flightDeckApi || flightDeckApi;
      if (api?.renderDesign) {
        setRenderProgress(25);
        const res = await api.renderDesign({ style, mode });
        if (res?.ok) {
          setRenderProgress(85);
          if (api.getDesignPreview) {
            const dataUrl = await api.getDesignPreview({ style });
            setPreviewGif(dataUrl);
          }
          setRenderProgress(100);
          setRenderFinished(true);
          setIsPlayingPreview(true);
        } else {
          addLog(`❌ Pipeline-Fehler: ${res?.error || 'Unbekannter Fehler beim Rendern.'}`, 'warning');
        }
      } else {
        // Fallback for browser testing
        addLog(`[BROWSER FALLBACK] Simuliere Render-Pipeline...`, 'info');
        setRenderProgress(50);
        await new Promise(r => setTimeout(r, 1000));
        setRenderProgress(100);
        setRenderFinished(true);
        setIsPlayingPreview(true);
      }
    } catch (err) {
      addLog(`❌ Fehler bei der Render-Initiierung: ${err.message}`, 'warning');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fd-tab-layout">
      <div className="fd-tab-header">
        <div>
          <h2>Design Agent <span>Autonomous Visuals & Reels</span></h2>
          <p className="fd-subtitle">Erzeuge spektakuläre, beat-synchrone Cover-Artworks und Daumenkino-Reels über die Photoshop- und FFmpeg-Symbiose.</p>
        </div>
        <div className="fd-header-badges">
          <span className="fd-badge fd-badge-blue">
            <Cpu size={14} style={{ marginRight: '6px' }} />
            ExtendScript active
          </span>
          <span className="fd-badge fd-badge-green">
            <Film size={14} style={{ marginRight: '6px' }} />
            FFmpeg active
          </span>
        </div>
      </div>

      <div className="fd-dashboard-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Left Side: Controls & Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Configuration Card */}
          <div className="fd-card">
            <div className="fd-card-header">
              <h3><Settings size={18} style={{ color: '#00f0ff', marginRight: '8px' }} /> Engine-Konfiguration</h3>
            </div>
            
            <div className="fd-settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              <div>
                <label className="fd-input-label">Wähle Musik-Set</label>
                <select 
                  className="fd-input-select" 
                  value={selectedSetId} 
                  onChange={e => setSelectedSetId(e.target.value)}
                  disabled={isRendering}
                >
                  {sets?.map(s => (
                    <option key={s.id} value={s.id}>{s.id}{s.bpm ? ` (${s.bpm} BPM)` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="fd-input-label">Stil-Vibe</label>
                <select 
                  className="fd-input-select" 
                  value={style} 
                  onChange={e => setStyle(e.target.value)}
                  disabled={isRendering}
                >
                  <option value="flicker">Beat-Flicker Strobo (knallt rein!)</option>
                  <option value="glitch">RGB Glitch Loop (beatgesteuert Hammer!)</option>
                  <option value="liquid">Liquid Typography (wellenartig)</option>
                  <option value="neon">Neon Cyberpunk Space</option>
                </select>
              </div>

              <div>
                <label className="fd-input-label">Arbeitsmodus</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    className={`fd-button ${mode === '5050' ? 'fd-button-active' : 'fd-button-secondary'}`}
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => setMode('5050')}
                    disabled={isRendering}
                  >
                    🤝 50/50 Symbiose
                  </button>
                  <button 
                    type="button" 
                    className={`fd-button ${mode === 'auto' ? 'fd-button-active' : 'fd-button-secondary'}`}
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => setMode('auto')}
                    disabled={isRendering}
                  >
                    🤖 100% Autopilot
                  </button>
                </div>
              </div>

              <div>
                <label className="fd-input-label">Daumenkino Framerate ({fps} FPS)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <input 
                    type="range" 
                    min="8" 
                    max="18" 
                    value={fps} 
                    onChange={e => setFps(parseInt(e.target.value))}
                    disabled={isRendering}
                    style={{ flex: 1, accentColor: '#00f0ff' }}
                  />
                  <span className="fd-badge fd-badge-blue">{fps} FPS</span>
                </div>
              </div>
            </div>

            {/* Mode Explanation Guide Box */}
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid #00f0ff', borderRadius: '6px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', border: '1px solid #1f2a38', borderLeftWidth: '4px' }}>
              {mode === '5050' ? (
                <div>
                  <strong style={{ color: '#00f0ff', display: 'block', marginBottom: '6px', fontSize: '14px' }}>🤝 50/50 Symbiose aktiv:</strong>
                  <span>Kombiniert das Beste aus zwei Welten! Öffnet Photoshop im Hintergrund und übergibt die KI-Entwürfe. Du malst, veränderst Ebenen und speicherst (STRG+S) – Flight Deck erkennt das und kompiliert dein fertiges Meisterwerk.</span>
                </div>
              ) : (
                <div>
                  <strong style={{ color: '#9adf6b', display: 'block', marginBottom: '6px', fontSize: '14px' }}>🤖 100% Autopilot aktiv:</strong>
                  <span>Vollständig autonomer Ablauf! Der Agent berechnet die Schriftplatzierung, die Verzerrungen (Skew) und Farbstile vollautomatisch über Playwright & FFmpeg. Keine manuelle Photoshop-Interaktion notwendig.</span>
                </div>
              )}
            </div>

            {selectedSet && (
              <div className="fd-set-preview-mini" style={{ marginTop: '20px', padding: '15px', background: '#0a0d12', borderRadius: '8px', border: '1px solid #1f2a38' }}>
                <h4 style={{ color: '#9adf6b', fontSize: '14px', marginBottom: '8px', fontFamily: 'monospace' }}>Selected Set Details:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>ID: <strong className="fd-badge-dark">{selectedSet.id}</strong></div>
                  <div>BPM: <strong className="fd-badge-dark">{selectedSet.bpm ? `${selectedSet.bpm} BPM` : 'nicht definiert'}</strong></div>
                  <div>Tracks: <strong className="fd-badge-dark">{selectedSet.tracks?.length || 0} Tracks</strong></div>
                  <div>Farbe: <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: selectedSet.vinylColor || '#9adf6b', marginLeft: '6px', verticalAlign: 'middle' }}></span></div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <button 
                type="button" 
                className="fd-button" 
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #00f0ff, #9adf6b)', color: '#050608', fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.5px' }}
                onClick={handleStartRender}
                disabled={isRendering}
              >
                {isRendering ? `Rendere Masterpiece (${renderProgress}%)` : `🚀 Kreativ-Prozess starten`}
              </button>
            </div>
          </div>

          {/* Console Card */}
          <div className="fd-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="fd-card-header" style={{ borderBottom: '1px solid #1f2a38', paddingBottom: '12px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                <Terminal size={18} style={{ color: '#9adf6b', marginRight: '8px' }} /> 
                Kreativ-Protokoll (Agenten-Konsole)
              </h3>
            </div>
            <div 
              ref={logContainerRef}
              style={{ 
                background: '#050608', 
                borderRadius: '8px', 
                padding: '15px', 
                fontFamily: 'monospace', 
                fontSize: '12px', 
                color: '#f5f8ff', 
                height: '220px', 
                overflowY: 'auto',
                border: '1px solid #1f2a38',
                marginTop: '15px',
                lineHeight: '1.6'
              }}
            >
              {logs.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', paddingTop: '80px' }}>
                  Warte auf Start... Konsole bereit.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '8px', color: log.type === 'success' ? '#9adf6b' : log.type === 'warning' ? '#f59e0b' : log.type === 'help' ? '#00f0ff' : '#f5f8ff' }}>
                    <span style={{ color: '#64748b', marginRight: '8px' }}>[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: High-Fidelity Preview Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="fd-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="fd-card-header" style={{ marginBottom: '16px' }}>
              <h3><Eye size={18} style={{ color: '#9adf6b', marginRight: '8px' }} /> Live-Vorschau (Flipbook)</h3>
            </div>

            <div 
              style={{ 
                flexGrow: 1, 
                background: '#050608', 
                border: '1px solid #1f2a38', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '400px'
              }}
            >
              {isRendering ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="fd-spinner" style={{ width: '48px', height: '48px', margin: '0 auto 20px auto', border: '4px solid #1f2a38', borderTop: '4px solid #00f0ff', borderRadius: '50%' }}></div>
                  <h4 style={{ color: '#00f0ff', fontFamily: 'monospace' }}>Rendering...</h4>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Photoshop & FFmpeg am Werk</p>
                </div>
              ) : renderFinished ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  
                  {/* Hypnotic Beat Visualizer simulation using stylized CSS */}
                  <div 
                    style={{ 
                      width: '280px', 
                      height: '280px', 
                      borderRadius: '16px', 
                      background: '#0f141a', 
                      border: '2px solid #1f2a38', 
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isPlayingPreview ? '0 0 30px rgba(0, 240, 255, 0.25)' : 'none',
                      transition: 'all 0.2s',
                      transform: isPlayingPreview ? `scale(${1 + (currentFrame % 2 === 0 ? 0.03 : -0.01)})` : 'scale(1)',
                      overflow: 'hidden'
                    }}
                  >
                    {previewGif ? (
                      <img 
                        src={previewGif} 
                        alt="AIRDOX Beat Reel Preview Loop" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} 
                      />
                    ) : (
                      <>
                        {/* Simulated beat-shaking light flashes & typography warp */}
                        <div style={{ 
                          position: 'absolute', 
                          inset: 0, 
                          background: currentFrame === 3 ? 'rgba(0, 240, 255, 0.15)' : currentFrame === 5 ? 'rgba(154, 223, 107, 0.12)' : 'transparent',
                          transition: 'background 0.05s'
                        }}></div>
                        
                        <div style={{
                          transform: `rotate(${currentFrame * 15}deg)`,
                          width: '180px',
                          height: '180px',
                          borderRadius: '50%',
                          border: '4px dashed #00f0ff',
                          opacity: 0.6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.1s'
                        }}>
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: selectedSet?.vinylColor || '#9adf6b',
                            opacity: 0.8
                          }}></div>
                        </div>

                        <div 
                          style={{ 
                            position: 'absolute',
                            bottom: '24px',
                            left: '0',
                            width: '100%',
                            textAlign: 'center',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            color: currentFrame % 2 === 0 ? '#00f0ff' : '#9adf6b',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            transform: `skewX(${currentFrame % 3 === 0 ? '12deg' : '-8deg'})`
                          }}
                        >
                          {selectedSetId.substring(0, 16)}
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
                    {!previewGif && (
                      <button 
                        type="button" 
                        className="fd-button fd-button-secondary"
                        style={{ padding: '8px 16px' }}
                        onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                      >
                        {isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                    )}
                    <span className="fd-badge fd-badge-green">
                      {previewGif ? 'Live Rendered GIF Loop' : `Frame ${currentFrame + 1} / ${totalPreviewFrames}`}
                    </span>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <Palette size={48} style={{ color: '#1f2a38', marginBottom: '15px', margin: '0 auto' }} />
                  <p style={{ fontSize: '14px', marginTop: '12px' }}>Kein fertiges Design geladen.</p>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Wähle ein Set und klicke auf "Kreativ-Prozess starten".</p>
                </div>
              )}
            </div>

            {renderFinished && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button"
                  className="fd-button fd-button-secondary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}
                  onClick={() => {
                    const api = window.flightDeckApi || flightDeckApi;
                    if (api?.revealPath) {
                      api.revealPath({ filePath: `D:\\webseeite-main\\release\\daumenkino_${style}.mp4` });
                    }
                  }}
                >
                  <Film size={16} style={{ marginRight: '8px', color: '#9adf6b' }} />
                  Öffne MP4 Reel (release/daumenkino_{style}.mp4)
                </button>
                <button 
                  type="button"
                  className="fd-button fd-button-secondary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}
                  onClick={() => {
                    const api = window.flightDeckApi || flightDeckApi;
                    if (api?.revealPath) {
                      api.revealPath({ filePath: `D:\\webseeite-main\\release\\daumenkino_${style}.gif` });
                    }
                  }}
                >
                  <FileText size={16} style={{ marginRight: '8px', color: '#00f0ff' }} />
                  Öffne GIF Loop (release/daumenkino_{style}.gif)
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
