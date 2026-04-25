import React from 'react';
import {
  Activity, Cpu, HardDrive, AlertTriangle, CheckCircle2, XCircle,
  Zap, Clock, Database, RefreshCw
} from 'lucide-react';

const SystemMonitorTab = ({
  systemStats = {},
  onRefresh = () => {},
  onClearCache = () => {},
  onOptimize = () => {},
  busy = false,
}) => {
  const {
    memory = {},
    cpu = {},
    disk = {},
    processes = [],
    lastUpdate = null,
    warnings = [],
  } = systemStats;

  const getHealthStatus = (value, warning = 70, critical = 90) => {
    if (value >= critical) return 'critical';
    if (value >= warning) return 'warning';
    return 'healthy';
  };

  const MemoryStatus = getHealthStatus(memory.percentUsed);
  const CpuStatus = getHealthStatus(cpu.percentUsed);
  const DiskStatus = getHealthStatus(disk.percentUsed);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 size={16} style={{ color: '#9adf6b' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: '#f97316' }} />;
      case 'critical':
        return <XCircle size={16} style={{ color: '#f87171' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>System Monitor</h2>
          <p>Überwachung von Systemressourcen und Prozessen.</p>
        </div>
        <div className="fd-toolbar-actions">
          <span className="fd-timestamp">
            {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('de-DE') : 'n/a'}
          </span>
          <button
            type="button"
            className="fd-button secondary"
            onClick={onClearCache}
            disabled={busy}
          >
            Cache löschen
          </button>
          <button
            type="button"
            className="fd-button secondary"
            onClick={onOptimize}
            disabled={busy}
          >
            <Zap size={16} />
            Optimieren
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={onRefresh}
            disabled={busy}
          >
            <RefreshCw size={16} />
            Aktualisieren
          </button>
        </div>
      </section>

      <div className="fd-metric-grid-large">
        <section className={`fd-metric-card tone-${MemoryStatus === 'healthy' ? 'blue' : MemoryStatus === 'warning' ? 'amber' : 'red'}`}>
          <div className="fd-metric-icon">
            <Activity size={18} />
            {getStatusIcon(MemoryStatus)}
          </div>
          <div>
            <div className="fd-metric-label">RAM</div>
            <div className="fd-metric-value">
              {memory.percentUsed?.toFixed(1)}%
            </div>
            <small>
              {memory.used ? `${(memory.used / 1024 / 1024).toFixed(0)} MB` : 'n/a'} /
              {memory.total ? ` ${(memory.total / 1024 / 1024).toFixed(0)} MB` : ' n/a'}
            </small>
          </div>
        </section>

        <section className={`fd-metric-card tone-${CpuStatus === 'healthy' ? 'green' : CpuStatus === 'warning' ? 'amber' : 'red'}`}>
          <div className="fd-metric-icon">
            <Cpu size={18} />
            {getStatusIcon(CpuStatus)}
          </div>
          <div>
            <div className="fd-metric-label">CPU</div>
            <div className="fd-metric-value">
              {cpu.percentUsed?.toFixed(1)}%
            </div>
            <small>{cpu.cores} Cores @ {cpu.clockSpeed} GHz</small>
          </div>
        </section>

        <section className={`fd-metric-card tone-${DiskStatus === 'healthy' ? 'slate' : DiskStatus === 'warning' ? 'amber' : 'red'}`}>
          <div className="fd-metric-icon">
            <HardDrive size={18} />
            {getStatusIcon(DiskStatus)}
          </div>
          <div>
            <div className="fd-metric-label">Disk</div>
            <div className="fd-metric-value">
              {disk.percentUsed?.toFixed(1)}%
            </div>
            <small>
              {disk.free ? `${(disk.free / 1024 / 1024 / 1024).toFixed(1)} GB frei` : 'n/a'}
            </small>
          </div>
        </section>

        <section className="fd-metric-card tone-purple">
          <div className="fd-metric-icon"><Database size={18} /></div>
          <div>
            <div className="fd-metric-label">DB Connection</div>
            <div className="fd-metric-value">
              {processes.filter((p) => p.type === 'db').length}
              /
              {processes.length}
            </div>
            <small>Aktive Prozesse</small>
          </div>
        </section>
      </div>

      {warnings.length > 0 && (
        <section className="fd-surface fd-warning-section">
          <div className="fd-section-head">
            <h3>Warnungen</h3>
            <span>{warnings.length}</span>
          </div>
          <div className="fd-warning-list">
            {warnings.map((warning, idx) => (
              <div key={idx} className="fd-warning-item">
                <AlertTriangle size={16} />
                <div>
                  <strong>{warning.title}</strong>
                  <p>{warning.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="fd-two-column">
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Memory-Nutzung</h3>
            <span><Activity size={16} /></span>
          </div>
          <div className="fd-memory-chart">
            <div className="fd-memory-bar">
              <div
                className="fd-memory-used"
                style={{
                  width: `${memory.percentUsed}%`,
                }}
                title={`${memory.percentUsed?.toFixed(1)}% belegt`}
              />
            </div>
          </div>
          <div className="fd-memory-details">
            <div>
              <span>Verwendet</span>
              <strong>
                {memory.used ? `${(memory.used / 1024 / 1024).toFixed(0)} MB` : 'n/a'}
              </strong>
            </div>
            <div>
              <span>Verfügbar</span>
              <strong>
                {memory.available ? `${(memory.available / 1024 / 1024).toFixed(0)} MB` : 'n/a'}
              </strong>
            </div>
          </div>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Top Prozesse</h3>
            <span><Zap size={16} /></span>
          </div>
          <div className="fd-process-list">
            {processes
              .sort((a, b) => (b.memory || 0) - (a.memory || 0))
              .slice(0, 8)
              .map((proc, idx) => (
                <div key={idx} className="fd-process-item">
                  <span className="fd-process-name">{proc.name}</span>
                  <span className="fd-process-memory">
                    {proc.memory ? `${(proc.memory / 1024 / 1024).toFixed(0)} MB` : 'n/a'}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </div>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Alle Prozesse</h3>
          <span>{processes.length}</span>
        </div>
        <div className="fd-table">
          <div className="fd-table-head">
            <span>Prozess</span>
            <span>Type</span>
            <span>Memory</span>
            <span>Status</span>
          </div>
          {processes.slice(0, 20).map((proc, idx) => (
            <div className="fd-table-row" key={idx}>
              <span className="fd-code-cell">{proc.name}</span>
              <span>{proc.type}</span>
              <span>
                {proc.memory ? `${(proc.memory / 1024 / 1024).toFixed(1)} MB` : 'n/a'}
              </span>
              <span className={`fd-status-badge ${proc.status === 'running' ? 'green' : 'yellow'}`}>
                {proc.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SystemMonitorTab;
