import React from 'react';
import { Activity, DatabaseZap, Disc3, RefreshCw, ShieldCheck, Users } from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return 'n/a';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const MetricCard = ({ icon: Icon, label, value, tone }) => (
  <section className={`fd-metric-card tone-${tone}`}>
    <div className="fd-metric-icon">
      <Icon size={18} />
    </div>
    <div>
      <div className="fd-metric-label">{label}</div>
      <div className="fd-metric-value">{value}</div>
    </div>
  </section>
);

const OverviewTab = ({ snapshot, gitStatus, onRefresh, onSyncStats, busy }) => {
  if (!snapshot) {
    return (
      <section className="fd-empty-state">
        <h2>Workspace verbinden</h2>
        <p>Das Flight Deck braucht ein gueltiges AIRDOX-Workspace-Verzeichnis mit `src/data/musicSets.js`, `wrangler.jsonc` und `.env`.</p>
      </section>
    );
  }

  const { counts, topTracks, recentAnalytics, manifestSummary } = snapshot;

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Operations Overview</h2>
          <p>Live-Zugriff auf Neon, Manifest und Git-Stand des Workspace.</p>
        </div>
        <div className="fd-toolbar-actions">
          <button type="button" className="fd-button secondary" onClick={onSyncStats} disabled={busy}>
            <DatabaseZap size={16} />
            Stats Sync
          </button>
          <button type="button" className="fd-button" onClick={onRefresh} disabled={busy}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <div className="fd-metric-grid">
        <MetricCard icon={Disc3} label="Sets im Manifest" value={manifestSummary.totalSets} tone="green" />
        <MetricCard icon={Activity} label="Analytics Events" value={counts.analytics_logs_count} tone="amber" />
        <MetricCard icon={ShieldCheck} label="VIP User" value={counts.users_count} tone="blue" />
        <MetricCard icon={Users} label="Sessions" value={counts.sessions_count} tone="slate" />
      </div>

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
              <div className="fd-table-row" key={row.id}>
                <span className="fd-code-cell">{row.id}</span>
                <span>{row.plays}</span>
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
              <strong>{gitStatus.dirty ? 'Ja' : 'Nein'}</strong>
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
          <span>{recentAnalytics.length} Events</span>
        </div>
        <div className="fd-activity-list">
          {recentAnalytics.map((item) => (
            <article className="fd-activity-row" key={item.id}>
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
