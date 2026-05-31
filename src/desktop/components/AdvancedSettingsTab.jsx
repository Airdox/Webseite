import React, { useState } from 'react';
import { Save, Settings2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const SettingGroup = ({ title, description, children }) => (
  <section className="fd-setting-group">
    <div className="fd-setting-header">
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
    <div className="fd-setting-content">{children}</div>
  </section>
);

const ToggleSetting = ({ label, value, onChange, description, disabled = false }) => (
  <label className="fd-setting-toggle">
    <div>
      <strong>{label}</strong>
      {description && <small>{description}</small>}
    </div>
    <input
      type="checkbox"
      checked={Boolean(value)}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
  </label>
);

const TextSetting = ({ label, value, onChange, placeholder = '', type = 'text', disabled = false }) => (
  <label className="fd-setting-field">
    {label}
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  </label>
);

const SelectSetting = ({ label, value, onChange, options = [], disabled = false }) => (
  <label className="fd-setting-field">
    {label}
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

const AdvancedSettingsTab = ({
  settings = {},
  onSave = () => {},
  onReset = () => {},
  busy = false,
  saveStatus = null,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(localSettings);
    setHasChanges(false);
  };

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Advanced Settings</h2>
          <p>Erweiterte Konfiguration für Workspace, Automatisierung und Live-Updates.</p>
        </div>
        <div className="fd-toolbar-actions">
          {saveStatus && (
            <div className={`fd-status ${saveStatus.type}`}>
              {saveStatus.type === 'success' && <CheckCircle2 size={16} />}
              {saveStatus.type === 'error' && <AlertCircle size={16} />}
              {saveStatus.type === 'pending' && <Clock size={16} />}
              <span>{saveStatus.message}</span>
            </div>
          )}
          <button
            type="button"
            className="fd-button secondary"
            onClick={() => {
              setLocalSettings(settings);
              setHasChanges(false);
              onReset();
            }}
            disabled={busy}
          >
            Zurücksetzen
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={handleSave}
            disabled={busy || !hasChanges}
          >
            <Save size={16} />
            Speichern
          </button>
        </div>
      </section>

      <div className="fd-settings-grid">
        <section className="fd-surface">
          <SettingGroup
            title="Workspace-Grundlagen"
            description="Basis-Konfiguration für Workspace und Datenquellen"
          >
            <TextSetting
              label="Workspace Root"
              value={localSettings.workspaceRoot}
              onChange={(v) => handleChange('workspaceRoot', v)}
              disabled
            />
            <TextSetting
              label="R2 Object Prefix"
              value={localSettings.r2ObjectPrefix}
              onChange={(v) => handleChange('r2ObjectPrefix', v)}
              placeholder="airdox-assets-prod/"
            />
            <TextSetting
              label="Cover Output Directory"
              value={localSettings.coverOutputDir}
              onChange={(v) => handleChange('coverOutputDir', v)}
              placeholder="public/assets/covers/"
            />
            <TextSetting
              label="Default Cover Path"
              value={localSettings.defaultCoverPath}
              onChange={(v) => handleChange('defaultCoverPath', v)}
              placeholder="/assets/airdox-vinyl.jpg"
            />
          </SettingGroup>

          <SettingGroup
            title="Build & Deploy"
            description="Befehle für Build-Pipeline und Deployment"
          >
            <TextSetting
              label="Build Command"
              value={localSettings.buildCommand}
              onChange={(v) => handleChange('buildCommand', v)}
              placeholder="npm run build"
            />
            <TextSetting
              label="Deploy Command"
              value={localSettings.deployCommand}
              onChange={(v) => handleChange('deployCommand', v)}
              placeholder="npm run deploy"
            />
            <SelectSetting
              label="Deploy Strategy"
              value={localSettings.deployStrategy}
              onChange={(v) => handleChange('deployStrategy', v)}
              options={[
                { value: 'automatic', label: 'Automatisch nach Build' },
                { value: 'manual', label: 'Manuell auslösen' },
                { value: 'staged', label: 'Staging-Umgebung zuerst' },
              ]}
            />
          </SettingGroup>

          <SettingGroup
            title="Git-Workflow"
            description="Git-Integration und Auto-Commit-Strategie"
          >
            <TextSetting
              label="Commit Template"
              value={localSettings.gitCommitTemplate}
              onChange={(v) => handleChange('gitCommitTemplate', v)}
              placeholder="[FLIGHT-DECK] Publish: {setId} - {date}"
            />
            <SelectSetting
              label="Branch-Strategie"
              value={localSettings.gitBranchStrategy}
              onChange={(v) => handleChange('gitBranchStrategy', v)}
              options={[
                { value: 'current', label: 'Aktueller Branch' },
                { value: 'dev', label: 'Immer zu dev' },
                { value: 'feature', label: 'Feature-Branch pro Set' },
              ]}
            />
            <ToggleSetting
              label="Automatischer Merge nach Deploy"
              value={localSettings.autoMergeAfterDeploy}
              onChange={(v) => handleChange('autoMergeAfterDeploy', v)}
              description="PR automatisch mergen nach erfolgreichem Deploy"
            />
          </SettingGroup>
        </section>

        <section className="fd-surface">
          <SettingGroup
            title="Core Automation"
            description="Wichtige Automatisierungsoptionen"
          >
            <ToggleSetting
              label="Safe Mode"
              value={localSettings.safeMode}
              onChange={(v) => handleChange('safeMode', v)}
              description="Blockt riskante Publishes ohne Quellpfade"
            />
            <ToggleSetting
              label="Upload Audio zu R2"
              value={localSettings.uploadAudioToR2}
              onChange={(v) => handleChange('uploadAudioToR2', v)}
              description="Laedt Masterfile direkt zu Cloudflare"
            />
            <ToggleSetting
              label="Cover aus Metadaten"
              value={localSettings.extractEmbeddedCover}
              onChange={(v) => handleChange('extractEmbeddedCover', v)}
              description="Nutzt eingebettetes Artwork aus Audio"
            />
            <ToggleSetting
              label="Auto Seed Stats"
              value={localSettings.autoSeedStats}
              onChange={(v) => handleChange('autoSeedStats', v)}
              description="track_stats automatisch fuer neue Sets"
            />
            <ToggleSetting
              label="Auto Build"
              value={localSettings.autoBuild}
              onChange={(v) => handleChange('autoBuild', v)}
              description="Build nach Publish starten"
            />
            <ToggleSetting
              label="Auto Deploy"
              value={localSettings.autoDeploy}
              onChange={(v) => handleChange('autoDeploy', v)}
              description="Deploy nach Build ausfuehren"
            />
            <ToggleSetting
              label="Auto Commit"
              value={localSettings.autoCommit}
              onChange={(v) => handleChange('autoCommit', v)}
              description="Aenderungen automatisch committen"
            />
            <ToggleSetting
              label="Auto Push"
              value={localSettings.autoPush}
              onChange={(v) => handleChange('autoPush', v)}
              description="Nach Commit zum Remote pushen"
            />
          </SettingGroup>

          <SettingGroup
            title="Live-Update-System"
            description="Konfiguration fuer Echtzeit-Synchronisierung"
          >
            <ToggleSetting
              label="Live-Updates aktivieren"
              value={localSettings.liveUpdatesEnabled}
              onChange={(v) => handleChange('liveUpdatesEnabled', v)}
              description="Echtzeit-Aktualisierung von Datenbank-Aenderungen"
            />
            <SelectSetting
              label="Update-Intervall (ms)"
              value={String(localSettings.liveUpdateInterval || 1000)}
              onChange={(v) => handleChange('liveUpdateInterval', parseInt(v, 10))}
              options={[
                { value: '500', label: '500ms (sehr schnell)' },
                { value: '1000', label: '1s (schnell)' },
                { value: '5000', label: '5s (moderat)' },
                { value: '10000', label: '10s (langsam)' },
              ]}
            />
            <ToggleSetting
              label="Statistik-Polling"
              value={localSettings.enableStatsPolling}
              onChange={(v) => handleChange('enableStatsPolling', v)}
              description="track_stats in Echtzeit abfragen"
            />
            <ToggleSetting
              label="DB-Sync-Warnungen"
              value={localSettings.enableDbSyncAlerts}
              onChange={(v) => handleChange('enableDbSyncAlerts', v)}
              description="Benachrichtigungen bei Sync-Problemen"
            />
          </SettingGroup>

          <SettingGroup
            title="Design- & Kreativ-Agent"
            description="Photoshop-Pfad und Standard-Einstellungen für Renderscripts"
          >
            <TextSetting
              label="Photoshop Pfad (Exe)"
              value={localSettings.photoshopPath}
              onChange={(v) => handleChange('photoshopPath', v)}
              placeholder="C:\Users\p_kro\OneDrive\Desktop\ps"
            />
            <SelectSetting
              label="Standard Render-Stil"
              value={localSettings.defaultDesignStyle || 'flicker'}
              onChange={(v) => handleChange('defaultDesignStyle', v)}
              options={[
                { value: 'flicker', label: 'Beat-Flicker Strobo' },
                { value: 'glitch', label: 'RGB Glitch Loop' },
                { value: 'liquid', label: 'Liquid Typography' },
                { value: 'neon', label: 'Neon Cyberpunk' },
              ]}
            />
          </SettingGroup>

          <SettingGroup
            title="Anzeigeoptionen"
            description="UI- und Theme-Einstellungen"
          >
            <TextSetting
              label="Standard Vinyl-Farbe"
              value={localSettings.defaultVinylColor}
              onChange={(v) => handleChange('defaultVinylColor', v)}
              type="color"
            />
            <SelectSetting
              label="Publish Position"
              value={localSettings.publishPosition}
              onChange={(v) => handleChange('publishPosition', v)}
              options={[
                { value: 'top', label: 'Oben (Standard)' },
                { value: 'bottom', label: 'Unten' },
              ]}
            />
            <SelectSetting
              label="Theme"
              value={localSettings.theme}
              onChange={(v) => handleChange('theme', v)}
              options={[
                { value: 'dark', label: 'Dunkel (Standard)' },
                { value: 'light', label: 'Hell' },
                { value: 'auto', label: 'System' },
              ]}
            />
          </SettingGroup>
        </section>
      </div>

      <section className="fd-surface fd-info-banner">
        <AlertCircle size={16} />
        <div>
          <strong>Speicherungsbasis</strong>
          <p>
            Settings werden lokal in {localSettings.workspaceRoot ? `${localSettings.workspaceRoot}/.airdox/settings.json` : 'App Data'} gespeichert.
            Anderungen am `workspaceRoot` werden automatisch ubernommen.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AdvancedSettingsTab;
