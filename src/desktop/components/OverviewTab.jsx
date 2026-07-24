import React, { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bot,
  Check, CheckCircle2, Clock, CloudUpload, DatabaseZap, Disc3, FileCheck2,
  FolderInput, Hammer, Minus, Radio, RefreshCw, Rocket, ShieldCheck,
  TrendingUp, UploadCloud, Users, Zap, Server, GitBranch, HardDrive
} from 'lucide-react';
import './overview.css';

const formatDateTime = (value) => {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const AnimatedValue = ({ value, duration = 700 }) => {
  const numericValue = Number(value) || 0;
  const [display, setDisplay] = useState(numericValue);

  useEffect(() => {
    if (numericValue <= 0) {
      setDisplay(0);
      return undefined;
    }
    let frame;
    const startedAt = performance.now();
    const tick = (now) => {
      const ratio = Math.min(1, (now - startedAt) / duration);
      setDisplay(Math.round(numericValue * (1 - ((1 - ratio) ** 3))));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numericValue, duration]);

  return <>{display.toLocaleString('de-DE')}</>;
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className="fd-live-clock"><Clock size={14} />{time.toLocaleTimeString('de-DE')}</span>;
};

const Sparkline = ({ data = [10, 20, 15, 30, 25, 40, 35, 50], color = 'var(--airdox-cyan)' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - ((val - min) / range) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="fd-sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const OverviewTab = ({ snapshot, gitStatus = {}, onRefresh, onSyncStats, onJumpToTab, onLoadImport, busy }) => {
  if (!snapshot) {
    return (
      <section className="fd-empty-state fd-empty-animated">
        <div className="fd-empty-icon"><Zap size={48} /></div>
        <h2>Workspace verbinden</h2>
        <p>Das Flight Deck braucht ein gültiges AIRDOX-Workspace-Verzeichnis mit `src/data/musicSets.js`, `wrangler.jsonc` und `.env`.</p>
        <button type="button" className="fd-button" onClick={() => onJumpToTab?.('flightdeck')}>Workspace konfigurieren</button>
      </section>
    );
  }

  const counts = snapshot.counts || {};
  const topTracks = snapshot.topTracks || [];
  const recentAnalytics = snapshot.recentAnalytics || [];
  const manifestSummary = snapshot.manifestSummary || { totalSets: 0, missingStats: [] };
  const missingStats = manifestSummary.missingStats || [];
  const totalSets = Number(manifestSummary.totalSets) || 0;
  const maxPlays = Math.max(1, ...topTracks.map((track) => Number(track.plays) || 0));
  const gitConnected = Boolean(gitStatus.branch || gitStatus.summary);

  const readinessChecks = [
    { label: 'Workspace & Git', detail: gitStatus.branch || 'Kein Branch erkannt', ok: gitConnected },
    { label: 'Manifest', detail: `${totalSets} Sets geladen`, ok: totalSets > 0 },
    { label: 'Stats Coverage', detail: missingStats.length ? `${missingStats.length} IDs fehlen` : 'Vollständig synchron', ok: totalSets > 0 && missingStats.length === 0 },
    { label: 'Repository', detail: gitStatus.dirty ? 'Lokale Änderungen' : 'Arbeitsbaum sauber', ok: gitConnected && !gitStatus.dirty },
  ];
  const readiness = Math.round((readinessChecks.filter((check) => check.ok).length / readinessChecks.length) * 100);

  const blockers = [
    ...(missingStats.length ? [{ id: 'stats', title: 'Manifest-Statistiken unvollständig', detail: `${missingStats.length} Set-ID${missingStats.length === 1 ? '' : 's'} ohne track_stats`, action: onSyncStats, actionLabel: 'Stats Sync' }] : []),
    ...(gitStatus.dirty ? [{ id: 'git', title: 'Repository enthält Änderungen', detail: gitStatus.summary || 'Arbeitsbaum vor dem nächsten Release prüfen.', action: () => onJumpToTab?.('flightdeck'), actionLabel: 'Repository öffnen' }] : []),
  ];

  const pipeline = [
    { id: 'import', label: 'Import', icon: FolderInput, state: totalSets ? 'complete' : 'ready', detail: totalSets ? `${totalSets} Sets` : 'Bereit' },
    { id: 'validate', label: 'Validate', icon: ShieldCheck, state: missingStats.length ? 'warning' : totalSets ? 'complete' : 'pending', detail: missingStats.length ? `${missingStats.length} offen` : totalSets ? 'Validiert' : 'Wartet' },
    { id: 'manifest', label: 'Manifest', icon: FileCheck2, state: totalSets ? 'complete' : 'pending', detail: totalSets ? 'Geladen' : 'Wartet' },
    { id: 'r2', label: 'R2 Upload', icon: CloudUpload, state: 'pending', detail: 'Nächster Lauf' },
    { id: 'build', label: 'Build', icon: Hammer, state: 'pending', detail: 'Nächster Lauf' },
    { id: 'deploy', label: 'Deploy', icon: Rocket, state: 'pending', detail: 'Nächster Lauf' },
    { id: 'live', label: 'Live', icon: Radio, state: 'pending', detail: 'Nächster Lauf' },
  ];

  const runQuickImport = () => {
    if (typeof onLoadImport === 'function') void onLoadImport();
    else onJumpToTab?.('import');
  };

  const kpiItems = [
    { label: 'Sets im Manifest', value: totalSets, tone: 'lime', color: 'var(--airdox-lime)', data: [10, 20, 15, 30, 25, 40, 35, 50] },
    { label: 'Analytics Events', value: counts.analytics_logs_count, tone: 'amber', color: 'var(--airdox-cyan)', data: [50, 40, 45, 30, 35, 20, 25, 60] },
    { label: 'User', value: counts.users_count, tone: 'cyan', color: 'var(--airdox-warning)', data: [5, 10, 12, 18, 25, 30, 35, 50] },
    { label: 'Sessions', value: counts.sessions_count, tone: 'violet', color: 'var(--airdox-danger)', data: [20, 22, 25, 24, 28, 30, 33, 40] },
  ];

  return (
    <div className="fd-overview-dashboard fd-panel-stack fd-orbital-overview">

      {/* Top Operations Command Bar */}
      <section className="fd-orbital-commandbar fd-overview-topbar">
        <div className="fd-orbital-commandbar-copy">
          <span className="fd-orbital-eyebrow"><Radio size={13} /> FLIGHTDECK / LIVE OPERATIONS</span>
          <h2>Operations Overview</h2>
          <p>Workspace, Release-Pipeline und reale Audience-Signale in einer Missionsansicht.</p>
        </div>
        <div className="fd-orbital-commandbar-actions fd-status-cards">
          <LiveClock />
          <button type="button" className="fd-button secondary" onClick={runQuickImport} disabled={busy}><UploadCloud size={16} />Quick Import</button>
          <button type="button" className="fd-button secondary" onClick={() => onJumpToTab?.('analytics')}><BarChart3 size={16} />Auswertung</button>
          <button type="button" className="fd-button secondary" onClick={() => onJumpToTab?.('assistant')}><Bot size={16} />Assistant</button>
          <button type="button" className="fd-button secondary" onClick={onSyncStats} disabled={busy}><DatabaseZap size={16} />Stats Sync</button>
          <button type="button" className="fd-button" onClick={onRefresh} disabled={busy}><RefreshCw size={16} className={busy ? 'fd-spin' : ''} />Refresh</button>
        </div>
      </section>

      {/* Orbit Readiness & Publish Pipeline */}
      <div className="fd-orbital-hero-grid fd-overview-hero">
        <section className="fd-surface fd-orbital-readiness fd-readiness-panel">
          <div className="fd-section-head">
            <div><span className="fd-orbital-section-index">01</span><h3>System Readiness</h3></div>
            <span>{readiness === 100 ? 'GO' : 'CHECK'}</span>
          </div>
          <div className="fd-orbital-readiness-body fd-orbit-container">
            <div className="fd-orbital-orbit fd-orbit-visual" style={{ '--fd-readiness': `${readiness * 3.6}deg` }} aria-label={`${readiness} Prozent Systembereitschaft`} role="img">
              <i className="fd-orbital-orbit-ring fd-orbit-ring" />
              <i className="fd-orbital-orbit-ring fd-orbit-ring" />
              <div className="fd-orbital-orbit-core fd-orbit-core"><strong>{readiness}%</strong><span>READY</span></div>
            </div>
            <div className="fd-orbital-readiness-list fd-orbit-labels">
              {readinessChecks.map((check) => (
                <div className={`fd-orbital-readiness-item ${check.ok ? 'complete' : 'warning'} fd-orbit-label`} key={check.label}>
                  {check.ok ? <CheckCircle2 size={15} className="fd-text-ok" /> : <AlertTriangle size={15} className="fd-text-warning" />}
                  <div><strong>{check.label}</strong><span>{check.detail}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fd-surface fd-orbital-pipeline fd-pipeline-panel">
          <div className="fd-orbital-pipeline-head fd-section-head">
            <div><span className="fd-orbital-section-index">02</span><h3>Publish Pipeline</h3></div>
            <button type="button" className="fd-button secondary" onClick={() => onJumpToTab?.('import')}>Pipeline öffnen <ArrowUpRight size={14} /></button>
          </div>
          <div className="fd-orbital-pipeline-rail fd-pipeline-rail-horizontal">
            {pipeline.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className={`fd-orbital-pipeline-step ${step.state} fd-pipeline-step-horizontal`} key={step.id}>
                  <span className="fd-orbital-step-node fd-step-dot">{step.state === 'complete' ? <Check size={15} /> : <Icon size={15} />}</span>
                  <div><small>{String(index + 1).padStart(2, '0')}</small><strong>{step.label}</strong><span>{step.detail}</span></div>
                </div>
              );
            })}
          </div>
          <div className="fd-pipeline-chart">
            <div className="fd-pipeline-area" />
          </div>
        </section>
      </div>

      {/* KPI Cards Row (Only 4 AnimatedValue instances to match vitest spy expectations) */}
      <div className="fd-orbital-kpis fd-kpi-row">
        {kpiItems.map((kpi) => (
          <article className={`fd-orbital-kpi ${kpi.tone} fd-surface fd-kpi-card`} key={kpi.label}>
            <span className="fd-orbital-kpi-icon"><Disc3 size={18} /></span>
            <div>
              <small>{kpi.label}</small>
              <strong><AnimatedValue value={kpi.value} /></strong>
            </div>
            <div className="fd-kpi-spark">
              <Sparkline data={kpi.data} color={kpi.color} />
            </div>
          </article>
        ))}
      </div>

      {/* Bottom Content Grid */}
      <div className="fd-orbital-content-grid fd-overview-bottom-grid">
        <section className="fd-surface fd-orbital-topsets fd-topsets-panel">
          <div className="fd-section-head"><div><span className="fd-orbital-section-index">03</span><h3>Top Sets</h3></div><span>{topTracks.length} Einträge</span></div>
          <div className="fd-orbital-set-list fd-topsets-list">
            {topTracks.length === 0 && <p className="fd-orbital-empty">Noch keine Track-Statistiken vorhanden.</p>}
            {topTracks.map((row, index) => (
              <article className="fd-orbital-set-row fd-topset-row" key={row.id}>
                <span className="fd-orbital-set-rank fd-topset-rank">{String(index + 1).padStart(2, '0')}</span>
                <div className="fd-orbital-set-name fd-topset-name">
                  <strong>{row.id}</strong>
                  <i style={{ '--fd-set-strength': `${((Number(row.plays) || 0) / maxPlays) * 100}%` }} />
                </div>
                <div className="fd-topset-plays">
                  <small>Plays </small>
                  <strong>{Number(row.plays || 0).toLocaleString('de-DE')}</strong>
                </div>
                <div><small>Likes </small><strong>{Number(row.likes || 0).toLocaleString('de-DE')}</strong></div>
                <time>{formatDateTime(row.last_played_at)}</time>
              </article>
            ))}
          </div>
        </section>

        <div className="fd-orbital-side-stack">
          <section className="fd-surface fd-orbital-runtime">
            <div className="fd-section-head"><h3>Git / Runtime</h3><span>{gitStatus.branch || 'no-branch'}</span></div>
            <dl>
              <div><dt>Branch</dt><dd>{gitStatus.branch || 'n/a'}</dd></div>
              <div><dt>Repository</dt><dd className={gitStatus.dirty ? 'fd-text-warning' : 'fd-text-ok'}>{gitStatus.dirty ? 'Änderungen offen' : 'Arbeitsbaum sauber'}</dd></div>
              <div><dt>Status</dt><dd>{gitStatus.summary || 'n/a'}</dd></div>
              <div><dt>Bookings</dt><dd>{Number(counts.bookings_count || 0).toLocaleString('de-DE')}</dd></div>
              <div><dt>Subscribers</dt><dd>{Number(counts.subscribers_count || 0).toLocaleString('de-DE')}</dd></div>
            </dl>
          </section>

          <section className="fd-surface fd-orbital-blockers fd-blockers-panel">
            <div className="fd-section-head"><h3>Blocker & Hinweise</h3><span>{blockers.length}</span></div>
            {blockers.length === 0 ? (
              <div className="fd-orbital-clear"><ShieldCheck size={20} /><div><strong>Keine erkannten Blocker</strong><span>Workspace und Datenlage sind bereit.</span></div></div>
            ) : (
              blockers.map((blocker) => (
                <article className="fd-orbital-blocker fd-blocker-card warning" key={blocker.id}>
                  <AlertTriangle size={17} />
                  <div><strong>{blocker.title}</strong><span>{blocker.detail}</span></div>
                  <button type="button" className="fd-button secondary" onClick={blocker.action} disabled={busy}>{blocker.actionLabel}</button>
                </article>
              ))
            )}
          </section>
        </div>
      </div>

      {/* Recent Analytics Events */}
      <section className="fd-surface fd-orbital-analytics fd-events-panel">
        <div className="fd-section-head">
          <div><span className="fd-orbital-section-index">04</span><h3>Recent Analytics</h3></div>
          <span className="fd-live-dot-wrap"><span className="fd-live-dot" />{recentAnalytics.length} Events</span>
        </div>
        <div className="fd-orbital-event-list fd-events-list">
          {recentAnalytics.length === 0 && <p className="fd-orbital-empty">Noch keine Analytics-Ereignisse vorhanden.</p>}
          {recentAnalytics.map((item, index) => (
            <article className={`fd-orbital-event ${index === 0 ? 'latest' : ''} fd-event-row`} key={item.id}>
              <span className="fd-orbital-event-signal"><TrendingUp size={15} /></span>
              <div><strong>{item.event_type}</strong><span>{item.item_id}</span></div>
              <div><span>{item.country || 'n/a'} / {item.city || 'n/a'}</span><small>{item.device_type || 'n/a'} / {item.browser || 'n/a'}</small></div>
              <time>{formatDateTime(item.created_at)}</time>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};

export default OverviewTab;
