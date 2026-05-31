import React, { useState, useEffect } from 'react';
import {
  getDefaultConfig,
  getOutputSlug,
  getFallbackOutputs,
  getScore,
  getPipelineProgress,
  getStyleName,
  makePrompt,
} from './designConstants.js';
import DesignSetupPhase from './DesignSetupPhase.jsx';
import DesignStudioPhase from './DesignStudioPhase.jsx';
import DesignExportPhase from './DesignExportPhase.jsx';

export default function DesignAgentTab({ sets = [], flightDeckApi, studioMode = false, onOpenStudio }) {
  // Determine starting step based on studioMode prop
  const [step, setStep] = useState(studioMode ? 'studio' : 'setup');
  
  // Design Configuration State
  const [config, setConfig] = useState(() => getDefaultConfig(sets));
  
  // Render Pipeline States
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [renderResult, setRenderResult] = useState(null);
  const [previewGif, setPreviewGif] = useState(null);

  // Sync set selection when sets list loads or changes
  useEffect(() => {
    if (!config.setId && sets?.[0]?.id) {
      setConfig((current) => ({ ...current, setId: sets[0].id }));
    }
  }, [sets, config.setId]);

  // IPC Event subscription for real-time pipeline log signals
  useEffect(() => {
    const api = window.flightDeckApi || flightDeckApi;
    if (!api?.onDesignLog) return undefined;
    
    const unsubscribe = api.onDesignLog((log) => {
      setLogs((prev) => [...prev, log]);
      const nextProgress = getPipelineProgress(log?.message || '');
      if (nextProgress !== null) {
        setRenderProgress((current) => Math.max(current, nextProgress));
      }
    });
    
    return unsubscribe;
  }, [flightDeckApi]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  // Triggers the backend Electron/Headless Playwright/FFmpeg render pipeline
  const handleStartRender = async () => {
    if (!config.setId) return;
    
    setIsRendering(true);
    setRenderProgress(0);
    setLogs([]);
    setPreviewGif(null);
    setRenderResult(null);

    const selectedSet = sets.find((s) => s.id === config.setId) || sets[0];
    const score = getScore(config.controls);
    const outputSlug = getOutputSlug({
      presetId: config.presetId,
      style: config.style,
      markText: config.markText,
    });

    const prompt = makePrompt({
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

    const renderPayload = {
      style: config.style,
      mode: config.mode,
      presetId: config.presetId,
      outputSlug,
      markText: config.markText,
      markStyle: config.markStyle,
      photoshopAction: config.photoshopAction,
      graffitiStyles: config.graffitiStyles,
      format: config.format,
      fps: config.fps,
      seed: config.seed,
      setId: config.setId,
      controls: config.controls,
      prompt,
      bgSource: config.bgSource,
      customBgPath: config.customBgPath,
    };

    try {
      const api = window.flightDeckApi || flightDeckApi;
      addLog(`Creative Lab startet: ${config.presetId}`, 'info');
      addLog(`Parameter: Motion ${config.controls.motion}, Glitch ${config.controls.glitch}, Waveform ${config.controls.waveform}`, 'help');
      addLog(`Marke: ${config.markStyle === 'none' ? 'aus' : `${config.markText} / ${config.markStyle}`}`, 'help');
      addLog(`Hintergrund: ${config.bgSource === 'custom' ? `Custom (${config.customBgPath.split('\\').pop() || 'custom'})` : config.bgSource}`, 'help');
      if (config.mode === '5050') {
        addLog(`Photoshop-Aktion: ${config.photoshopAction}`, 'help');
        addLog(`Graffiti-Auftraege: ${config.graffitiStyles.join(', ')}`, 'help');
      }

      if (api?.renderDesign) {
        setRenderProgress(8);
        const res = await api.renderDesign(renderPayload);
        
        if (res?.ok) {
          setRenderProgress(85);
          const outputs = res.outputs || getFallbackOutputs(outputSlug);
          
          if (api.getDesignPreview) {
            const dataUrl = await api.getDesignPreview({ style: config.style, gifPath: outputs.gifPath });
            setPreviewGif(dataUrl);
          }
          
          setRenderResult({
            ...outputs,
            preset: config.presetId,
            styleLabel: getStyleName(config.style),
            setTitle: selectedSet?.title || config.setId,
            score: score.total,
            format: config.format,
            fps: config.fps,
            mode: config.mode,
            photoshopAction: config.photoshopAction,
            photoshopAvailable: Boolean(res.outputs?.photoshopAvailable),
          });
          
          addLog(`Transfer Pack bereit: ${outputs.outputDir}`, 'success');
          setRenderProgress(100);
          setStep('export');
        } else {
          addLog(`Pipeline-Fehler: ${res?.error || 'Unbekannter Fehler beim Rendern.'}`, 'warning');
        }
      } else {
        // Browser fallback / demo mode
        addLog('[Browser Fallback] Preview-Parameter übernommen, Render wird simuliert.', 'info');
        setRenderProgress(15);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setRenderProgress(65);
        await new Promise((resolve) => setTimeout(resolve, 700));
        
        setRenderResult({
          ...getFallbackOutputs(outputSlug),
          preset: config.presetId,
          styleLabel: getStyleName(config.style),
          setTitle: selectedSet?.title || config.setId,
          score: score.total,
          format: config.format,
          fps: config.fps,
          mode: config.mode,
          photoshopAction: config.photoshopAction,
          photoshopAvailable: false,
        });
        
        setRenderProgress(100);
        setStep('export');
      }
    } catch (err) {
      addLog(`Fehler bei der Render-Initiierung: ${err.message}`, 'warning');
    } finally {
      setIsRendering(false);
    }
  };

  // Resolves the file system reveal triggers for export actions
  const handleReveal = (extension) => {
    const api = window.flightDeckApi || flightDeckApi;
    const fallback = getFallbackOutputs(
      getOutputSlug({ presetId: config.presetId, style: config.style, markText: config.markText })
    );
    
    const filePath = {
      mp4: renderResult?.mp4Path || fallback.mp4Path,
      gif: renderResult?.gifPath || fallback.gifPath,
      manifest: renderResult?.manifestPath || fallback.manifestPath,
      handoff: renderResult?.handoffPath || fallback.handoffPath,
      photoshop: renderResult?.photoshopFramePath || fallback.photoshopFramePath,
      script: renderResult?.photoshopScriptPath || fallback.photoshopScriptPath,
      folder: renderResult?.outputDir || fallback.outputDir,
    }[extension];
    
    api?.revealPath?.({ filePath });
  };

  const stepsList = [
    { id: 'setup', num: '①', name: 'Richtung & Format', desc: 'Setup' },
    { id: 'studio', num: '②', name: 'Feintuning & Marke', desc: 'Studio' },
    { id: 'export', num: '③', name: 'Release & Handoff', desc: 'Export' }
  ];

  const renderPipelineBand = () => {
    return (
      <div className="fd-wizard-pipeline-band">
        <div className="fd-wizard-pipeline-track">
          <div 
            className="fd-wizard-pipeline-progress" 
            style={{ 
              width: step === 'setup' ? '16.6%' : step === 'studio' ? '50%' : '100%',
              background: 'linear-gradient(90deg, var(--airdox-cyan), var(--airdox-lime))'
            }} 
          />
        </div>
        <div className="fd-wizard-pipeline-steps">
          {stepsList.map((s, idx) => {
            const isActive = step === s.id;
            const isCompleted = 
              (step === 'studio' && idx === 0) || 
              (step === 'export' && (idx === 0 || idx === 1));
            return (
              <div 
                key={s.id} 
                className={`fd-wizard-pipeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (!isRendering) {
                    if (s.id === 'setup') setStep('setup');
                    if (s.id === 'studio' && renderResult) setStep('studio');
                  }
                }}
                style={{ cursor: (!isRendering && (s.id === 'setup' || (s.id === 'studio' && renderResult))) ? 'pointer' : 'default' }}
              >
                <span className="fd-wizard-pipeline-num">{s.num}</span>
                <div className="fd-wizard-pipeline-meta">
                  <strong>{s.name}</strong>
                  <small>{s.desc}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`fd-design-lab ${studioMode || step === 'studio' ? 'studio' : ''}`}>
      {renderPipelineBand()}
      {step === 'setup' && (
        <DesignSetupPhase
          config={config}
          sets={sets}
          onConfigChange={setConfig}
          onNext={() => setStep('studio')}
          onOpenStudio={onOpenStudio}
          flightDeckApi={flightDeckApi}
        />
      )}

      {step === 'studio' && (
        <DesignStudioPhase
          config={config}
          sets={sets}
          onConfigChange={setConfig}
          onBack={() => setStep('setup')}
          onRender={handleStartRender}
          isRendering={isRendering}
          renderProgress={renderProgress}
        />
      )}

      {step === 'export' && (
        <DesignExportPhase
          config={config}
          sets={sets}
          renderResult={renderResult}
          previewGif={previewGif}
          logs={logs}
          onBackToStudio={() => setStep('studio')}
          onNewVariant={() => {
            setConfig(getDefaultConfig(sets));
            setStep('setup');
          }}
          onReveal={handleReveal}
        />
      )}
    </div>
  );
}
