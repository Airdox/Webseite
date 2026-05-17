import React, { useEffect, useState } from 'react';
import {
  Activity, BarChart3, Bot, DatabaseZap, Disc3, RefreshCw, ShieldCheck,
  UploadCloud, Users, Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
  Minus, Zap,
} from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return 'n/a';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

// Animated counter component
const AnimatedValue = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const numValue = Number(value) || 0;

  useEffect(() => {
    if (numValue === 0) {
      return;
    }
    let start = 0;
    const step = numValue / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= numValue) {
        setDisplay(numValue);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [numValue, duration]);

  return <>{numValue === 0 ? 0 : display}</>;
};

// Live clock
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="fd-live-clock">
      <Clock size={14} />
      {time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

const TrendIndicator = ({ value, label }) => {
  if (!value && value !== 0) return null;
  const isPositive = value > 0;
  const isNeutral = value === 0;
  return (
    <span className={`fd-trend ${isPositive ? 'up' : isNeutral ? 'neutral' : 'down'}`}>
      {isPositive ? <ArrowUpRight size={12} /> : isNeutral ? <Minus size={12} /> : <ArrowDownRight size={12} />}
      {label || `${Math.abs(value)}`}
    </span>
  );
};

const MetricCard = ({ icon, label, value, tone, subtitle }) => {
  const IconComponent = icon;
  return (
    <section className={`fd-metric-card tone-${tone} fd-metric-card-animated`}>
      <div className="fd-metric-icon">
        <IconComponent size={18} />
      </div>
      <div>
        <div className="fd-metric-label">{label}</div>
        <div className="fd-metric-value">
          <AnimatedValue value={value} />
        </div>
        {subtitle && <small className="fd-metric-subtitle">{subtitle}</small>}
      </div>
    </section>
  );
};

const QuickActionCard = ({ icon, title, description, tone, onClick, disabled }) => {
  const IconComponent = icon;
  return (
    <button
      type="button"
      className={`fd-command-card fd-quick-action ${tone || ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="fd-quick-action-header">
        <div className="fd-quick-action-icon">
          <IconComponent size={18} />
        </div>
        <strong>{title}</strong>
      </div>
      <small>{description}</small>
      <span className="fd-quick-action-arrow">
        <ArrowUpRight size={14} />
      </span>
    </button>
  );
};

const OverviewTab = ({
  snapshot,
  gitStatus,
  onRefresh,
  onSyncStats,
  onJumpToTab,
  onLoadImport,
  busy,
}) => {
  if (!snapshot) {
    return (
      <section className="fd-empty-state fd-empty-animated">
        <div className="fd-empty-icon">
          <Zap size={48} />
        </div>
        <h2>Workspace verbinden</h2>
        <p>Das Flight Deck braucht ein gueltiges AIRDOX-Workspace-Verzeichnis mit `src/data/musicSets.js`, `wrangler.jsonc` und `.env`.</p>
        <button type="button" className="fd-button" onClick={() => onJumpToTab?.('flightdeck')}>
          Workspace konfigurieren
        </button>
      </section>
    );
  }

  const { counts, topTracks, recentAnalytics, manifestSummary } = snapshot;
  const missingStatsCount = manifestSummary.missingStats.length;
  const runQuickImport = () => {
    if (typeof onLoadImport === 'function') {
      void onLoadImport();
      return;
    }
    onJumpToTab?.('import');
  };

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Operations Overview</h2>
          <p>Live-Zugriff auf Neon, Manifest und Git-Stand des Workspace.</p>
        </div>
        <div className="fd-toolbar-actions">
          <LiveClock />
          <button type="button" className="fd-button secondary" onClick={runQuickImport} disabled={busy}>
            <UploadCloud size={16} />
            Quick Import
          </button>
          <button type="button" className="fd-button secondary" onClick={() => onJumpToTab?.('analytics')}>
            <BarChart3 size={16} />
            Auswertung
          </button>
          <button type="button" className="fd-button secondary" onClick={() => onJumpToTab?.('assistant')}>
            <Bot size={16} />
            Assistant
          </button>
          <button type="button" className="fd-button secondary" onClick={onSyncStats} disabled={busy}>
            <DatabaseZap size={16} />
            Stats Sync
          </button>
          <button type="button" className="fd-button" onClick={onRefresh} disabled={busy}>
            <RefreshCw size={16} className={busy ? 'fd-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      <div className="fd-metric-grid">
        <MetricCard
          icon={Disc3}
          label="Sets im Manifest"
          value={manifestSummary.totalSets}
          tone="green"
          subtitle="Veröffentlicht"
        />
        <MetricCard
          icon={Activity}
          label="Analytics Events"
          value={counts.analytics_logs_count}
          tone="amber"
          subtitle="Tracking aktiv"
        />
        <MetricCard
          icon={ShieldCheck}
          label="VIP User"
          value={counts.users_count}
          tone="blue"
          subtitle="Registriert"
        />
        <MetricCard
          icon={Users}
          label="Sessions"
          value={counts.sessions_count}
          tone="slate"
          subtitle="Aktive Logins"
        />
      </div>

      <section className="fd-command-center">
        <QuickActionCard
          icon={gitStatus.dirty ? Activity : ShieldCheck}
          title="Repository"
          description={gitStatus.summary || gitStatus.branch || 'Kein Status'}
          tone={gitStatus.dirty ? 'warn' : 'ok'}
          onClick={() => onJumpToTab?.('flightdeck')}
        />
        <QuickActionCard
          icon={missingStatsCount > 0 ? Activity : ShieldCheck}
          title="Manifest Health"
          description={missingStatsCount > 0 ? `${missingStatsCount} Stats fehlen` : `${manifestSummary.totalSets} Sets beobachtet`}
          tone={missingStatsCount > 0 ? 'warn' : 'ok'}
          onClick={onSyncStats}
          disabled={busy}
        />
        <QuickActionCard
          icon={TrendingUp}
          title="Letztes Signal"
          description={recentAnalytics[0]?.item_id || 'Analytics aktualisieren'}
          tone="info"
          onClick={() => onJumpToTab?.('analytics')}
        />
      </section>

      <div className="fd-two-column">
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Top Sets</h3>
            <span>{topTracks.length} Eintraege</span>
          </div>
          <div className="fd-table">
            <div className="fd-table-head">
              <span>Set</span>
              <span>Plays</span>
              <span>Likes</span>
              <span>Last Played</span>
            </div>
            {topTracks.map((row) => (
              <div className="fd-table-row fd-table-row-hover" key={row.id}>
                <span className="fd-code-cell">{row.id}</span>
                <span>
                  <strong>{row.plays}</strong>
                </span>
                <span>{row.likes}</span>
                <span>{formatDateTime(row.last_played_at)}</span>
              </div>
            ))}
          </div>
          {manifestSummary.missingStats.length > 0 && (
            <div className="fd-inline-alert">
              Fehlende `track_stats` IDs: {manifestSummary.missingStats.join(', ')}
            </div>
          )}
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Git / Runtime</h3>
            <span>{gitStatus.branch || 'no-branch'}</span>
          </div>
          <div className="fd-detail-list">
            <div>
              <span>Branch</span>
              <strong>{gitStatus.branch || 'n/a'}</strong>
            </div>
            <div>
              <span>Dirty</span>
              <strong className={gitStatus.dirty ? 'fd-text-warning' : 'fd-text-ok'}>
                {gitStatus.dirty ? 'Ja' : 'Nein'}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{gitStatus.summary}</strong>
            </div>
            <div>
              <span>Bookings</span>
              <strong>{counts.bookings_count}</strong>
            </div>
            <div>
              <span>Subscribers</span>
              <strong>{counts.subscribers_count}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Recent Analytics</h3>
          <span className="fd-live-dot-wrap">
            <span className="fd-live-dot" />
            {recentAnalytics.length} Events
          </span>
        </div>
        <div className="fd-activity-list">
          {recentAnalytics.map((item, index) => (
            <article className={`fd-activity-row ${index === 0 ? 'fd-activity-latest' : ''}`} key={item.id}>
              <div>
                <strong>{item.event_type}</strong>
                <span>{item.item_id}</span>
              </div>
              <div>
                <span>{item.country || 'n/a'} / {item.city || 'n/a'}</span>
                <span>{item.device_type} / {item.browser}</span>
              </div>
              <time>{formatDateTime(item.created_at)}</time>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
