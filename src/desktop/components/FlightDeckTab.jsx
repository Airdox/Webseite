import React from 'react';
import { FolderGit2, Save, Settings2 } from 'lucide-react';

const Toggle = ({ label, checked, onChange, hint }) => (
  <label className="fd-toggle-row">
    <div>
      <strong>{label}</strong>
      <small>{hint}</small>
    </div>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
);

const FlightDeckTab = ({ settings, gitStatus, busy, onSettingChange, onSave, onSelectWorkspace }) => (
  <div className="fd-panel-stack">
    <section className="fd-toolbar-band">
      <div>
        <h2>Flight Deck</h2>
        <p>Publish-Automation, Safe Mode, Git-Strategie und Ziel-Workspace.</p>
      </div>
      <div className="fd-toolbar-actions">
        <button type="button" className="fd-button secondary" onClick={onSelectWorkspace}>
          <FolderGit2 size={16} />
          Workspace
        </button>
        <button type="button" className="fd-button" onClick={onSave} disabled={busy}>
          <Save size={16} />
          Settings speichern
        </button>
      </div>
    </section>

    <div className="fd-two-column">
      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Workspace</h3>
          <span>{gitStatus.branch || 'n/a'}</span>
        </div>
        <div className="fd-form-grid single">
          <label>Workspace Root<input value={settings.workspaceRoot || ''} readOnly /></label>
          <label>R2 Prefix<input value={settings.r2ObjectPrefix || ''} onChange={(event) => onSettingChange('r2ObjectPrefix', event.target.value)} /></label>
          <label>Cover Output Dir<input value={settings.coverOutputDir || ''} onChange={(event) => onSettingChange('coverOutputDir', event.target.value)} /></label>
          <label>Build Command<input value={settings.buildCommand || ''} onChange={(event) => onSettingChange('buildCommand', event.target.value)} /></label>
          <label>Deploy Command<input value={settings.deployCommand || ''} onChange={(event) => onSettingChange('deployCommand', event.target.value)} /></label>
          <label>Commit Template<input value={settings.gitCommitTemplate || ''} onChange={(event) => onSettingChange('gitCommitTemplate', event.target.value)} /></label>
          <label>Publish Position
            <select value={settings.publishPosition || 'top'} onChange={(event) => onSettingChange('publishPosition', event.target.value)}>
              <option value="top">top</option>
              <option value="bottom">bottom</option>
            </select>
          </label>
          <label>Default Vinyl Color<input type="color" value={settings.defaultVinylColor || '#9adf6b'} onChange={(event) => onSettingChange('defaultVinylColor', event.target.value)} /></label>
        </div>
      </section>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Automation Toggles</h3>
          <span><Settings2 size={16} /></span>
        </div>
        <div className="fd-toggle-list">
          <Toggle label="Safe Mode" checked={Boolean(settings.safeMode)} onChange={(value) => onSettingChange('safeMode', value)} hint="Blockt riskante Publishes ohne Quellpfade oder unvollstaendige Artefakte." />
          <Toggle label="Upload Audio to R2" checked={Boolean(settings.uploadAudioToR2)} onChange={(value) => onSettingChange('uploadAudioToR2', value)} hint="Laedt das Masterfile direkt in den Cloudflare-R2-Bucket." />
          <Toggle label="Extract Embedded Cover" checked={Boolean(settings.extractEmbeddedCover)} onChange={(value) => onSettingChange('extractEmbeddedCover', value)} hint="Nutzt eingebettetes Artwork aus der Audiodatei, wenn kein Cover gedroppt wurde." />
          <Toggle label="Auto Seed Stats" checked={Boolean(settings.autoSeedStats)} onChange={(value) => onSettingChange('autoSeedStats', value)} hint="Legt fehlende `track_stats`-Rows fuer neue Sets automatisch an." />
          <Toggle label="Auto Build" checked={Boolean(settings.autoBuild)} onChange={(value) => onSettingChange('autoBuild', value)} hint="Startet nach Publish direkt den Frontend-Build." />
          <Toggle label="Auto Deploy" checked={Boolean(settings.autoDeploy)} onChange={(value) => onSettingChange('autoDeploy', value)} hint="Fuehrt nach dem Build den eingestellten Deploy-Command aus." />
          <Toggle label="Auto Commit" checked={Boolean(settings.autoCommit)} onChange={(value) => onSettingChange('autoCommit', value)} hint="Commitet Manifest- und Cover-Aenderungen nach dem Publish." />
          <Toggle label="Auto Push" checked={Boolean(settings.autoPush)} onChange={(value) => onSettingChange('autoPush', value)} hint="Pusht nach erfolgreichem Commit direkt auf den aktuellen Remote-Branch." />
        </div>
      </section>
    </div>
  </div>
);

export default FlightDeckTab;
