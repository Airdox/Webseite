import React, { useMemo, useState } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Zap, Users, Eye, Heart, Volume2,
  Download, Filter, RotateCcw
} from 'lucide-react';
import { buildAnalyticsStatsFromEvents, normalizeEventLog } from '../lib/analytics.js';

const chartColors = [
  'var(--airdox-lime)',
  'var(--airdox-cyan)',
  'var(--airdox-warning)',
  'var(--airdox-text)',
  'var(--airdox-muted)',
];

const ChartBar = ({ label, value, maxValue, color = 'var(--airdox-lime)' }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="fd-chart-bar">
      <span className="fd-chart-label">{label}</span>
      <div className="fd-bar-container">
        <div
          className="fd-bar-fill fd-bar-animated"
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        />
      </div>
      <span className="fd-chart-value">{value}</span>
    </div>
  );
};

const PRESETS = [
  { label: '7 Tage', days: 7 },
  { label: '30 Tage', days: 30 },
  { label: '90 Tage', days: 90 },
  { label: 'Alles', days: 365 },
];

const DateRangeSelector = ({ startDate, endDate, onStartChange, onEndChange }) => {
  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onStartChange(start.toISOString().split('T')[0]);
    onEndChange(end.toISOString().split('T')[0]);
  };

  return (
    <div className="fd-date-range">
      <div className="fd-date-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="fd-command-button"
            onClick={() => applyPreset(preset.days)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <label>
        Von:
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
        />
      </label>
      <label>
        Bis:
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
        />
      </label>
    </div>
  );
};

const AdvancedAnalyticsTab = ({
  analyticsData = {},
  onExport = () => {},
  onRefresh = () => {},
  busy = false,
}) => {
  const [startDate, setStartDate] = useState('2000-01-01');
  const [endDate, setEndDate] = useState('2100-12-31');
  const [filters, setFilters] = useState({
    eventType: 'all',
    deviceType: 'all',
    country: 'all',
  });

  const rawEvents = useMemo(
    () => (Array.isArray(analyticsData.eventLogs) ? analyticsData.eventLogs : []),
    [analyticsData.eventLogs],
  );
  const hasExplicitNonRealSource = analyticsData.realData === false
    || String(analyticsData.source || '').includes('mock')
    || String(analyticsData.source || '').includes('browser-no-real-data');
  const hasRealEvents = rawEvents.length > 0 && !hasExplicitNonRealSource;

  const filteredStats = useMemo(() => {
    if (!hasRealEvents) return buildAnalyticsStatsFromEvents([]);
    return buildAnalyticsStatsFromEvents(rawEvents.map(normalizeEventLog));
  }, [rawEvents, hasRealEvents]);

  const fallbackStats = {
    totalViews: 0,
    totalPlays: 0,
    totalLikes: 0,
    eventsByType: {},
    topSets: [],
    topCountries: [],
    deviceTypeBreakdown: {},
    hourlyDistribution: new Array(24).fill(0),
    conversionRate: 0,
  };

  const {
    totalViews,
    totalPlays,
    totalLikes,
    eventsByType,
    topSets,
    topCountries,
    deviceTypeBreakdown,
    hourlyDistribution,
    conversionRate,
  } = hasRealEvents ? filteredStats : fallbackStats;

  const maxPlays = Math.max(...topSets.map((set) => Number(set.plays) || 0), 1);
  const maxCountryCount = Math.max(...topCountries.map((country) => Number(country.count) || 0), 1);
  const safeHourlyDistribution = hourlyDistribution.length ? hourlyDistribution : new Array(24).fill(0);
  const peakCount = Math.max(...safeHourlyDistribution, 0);
  const peakHour = peakCount > 0 ? safeHourlyDistribution.indexOf(peakCount) : null;
  const availableCountries = Array.from(new Set(rawEvents.map((event) => String(event.country || '').toUpperCase()).filter(Boolean))).sort();
  const availableDevices = Array.from(new Set(rawEvents.map((event) => String(event.device_type || '').toLowerCase()).filter(Boolean))).sort();
  const applyFilters = () => onRefresh({ startDate, endDate, filters });

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Advanced Analytics</h2>
          <p>Echte Auswertung aus `analytics_logs`. Mock-, Demo- und Fallback-Daten werden hier nicht als Ergebnis angezeigt.</p>
        </div>
        <div className="fd-toolbar-actions">
          <button
            type="button"
            className="fd-button secondary"
            onClick={applyFilters}
            disabled={busy}
          >
            <RotateCcw size={16} className={busy ? 'fd-spin' : ''} />
            Filter anwenden
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={() => onExport('analytics-report')}
            disabled={busy}
          >
            <Download size={16} />
            Bericht
          </button>
        </div>
      </section>

      <section className={`fd-data-source-card ${hasRealEvents ? 'ok' : 'warn'}`}>
        <div>
          <strong>{hasRealEvents ? 'Echte Datenquelle aktiv' : 'Keine echten Analytics-Daten verbunden'}</strong>
          <p>
            {hasRealEvents
              ? `${analyticsData.sourceLabel || 'Datenbank'} / ${rawEvents.length.toLocaleString('de-DE')} Roh-Events geladen. Top Sets basieren nur auf echten Play-Events aus analytics_logs.${analyticsData.cached ? ` Cache-Grund: ${analyticsData.cacheReason || 'DB-Abfrage fehlgeschlagen.'}` : ''}`
              : 'Diese Ansicht zeigt keine Demo-Werte. Filter werden nur gegen die echte Datenbank oder gegen den letzten lokal gecachten DB-Stand angewendet.'}
          </p>
        </div>
        <span>{analyticsData.cached ? 'DB CACHE' : hasRealEvents ? 'REAL DATA' : 'NO MOCK DATA'}</span>
      </section>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Zeitraum & Filter</h3>
          <span><Calendar size={16} /></span>
        </div>
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
        <div className="fd-filter-row">
          <label>
            Event-Typ
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            >
              <option value="all">Alle</option>
              <option value="play">Play</option>
              <option value="like">Like</option>
              <option value="dislike">Dislike</option>
              <option value="view">View</option>
            </select>
          </label>
          <label>
            Gerät
            <select
              value={filters.deviceType}
              onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
            >
              <option value="all">Alle</option>
              {availableDevices.length
                ? availableDevices.map((device) => (
                  <option key={device} value={device}>{device}</option>
                ))
                : (
                  <>
                    <option value="mobile">mobile</option>
                    <option value="desktop">desktop</option>
                    <option value="tablet">tablet</option>
                  </>
                )}
            </select>
          </label>
          <label>
            Land
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="all">Alle</option>
              {availableCountries.length
                ? availableCountries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))
                : (
                  <>
                    <option value="DE">DE</option>
                    <option value="AT">AT</option>
                    <option value="CH">CH</option>
                    <option value="US">US</option>
                  </>
                )}
            </select>
          </label>
          <button
            type="button"
            className="fd-button fd-filter-apply"
            onClick={applyFilters}
            disabled={busy}
          >
            <Filter size={16} />
            Filter anwenden
          </button>
        </div>
      </section>

      <div className="fd-metric-grid-large">
        <section className="fd-metric-card tone-green">
          <div className="fd-metric-icon"><Eye size={18} /></div>
          <div>
            <div className="fd-metric-label">Gesamtaufrufe</div>
            <div className="fd-metric-value">{totalViews.toLocaleString('de-DE')}</div>
          </div>
        </section>

        <section className="fd-metric-card tone-blue">
          <div className="fd-metric-icon"><Volume2 size={18} /></div>
          <div>
            <div className="fd-metric-label">Plays</div>
            <div className="fd-metric-value">{totalPlays.toLocaleString('de-DE')}</div>
          </div>
        </section>

        <section className="fd-metric-card tone-amber">
          <div className="fd-metric-icon"><Heart size={18} /></div>
          <div>
            <div className="fd-metric-label">Likes</div>
            <div className="fd-metric-value">{totalLikes.toLocaleString('de-DE')}</div>
          </div>
        </section>

        <section className="fd-metric-card tone-slate">
          <div className="fd-metric-icon"><TrendingUp size={18} /></div>
          <div>
            <div className="fd-metric-label">Engagement Rate</div>
            <div className="fd-metric-value">{(conversionRate * 100).toFixed(1)}%</div>
          </div>
        </section>
      </div>

      <div className="fd-two-column">
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Top Sets</h3>
            <span>{topSets.length} Sets</span>
          </div>
          <div className="fd-chart-container">
            {hasRealEvents && topSets.length > 0 ? (
              topSets.slice(0, 10).map((set, idx) => (
                <ChartBar
                  key={set.id}
                  label={set.id}
                  value={set.plays}
                  maxValue={maxPlays}
                  color={chartColors[idx % chartColors.length]}
                />
              ))
            ) : (
              <div className="fd-empty-inline">
                Keine echten Play-Events geladen. Es werden keine erfundenen Topsets angezeigt.
              </div>
            )}
          </div>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Geo-Verteilung</h3>
            <span>{topCountries.length} Länder</span>
          </div>
          <div className="fd-list-items">
            {hasRealEvents && topCountries.length > 0 ? (
              topCountries.slice(0, 10).map((country) => (
                <div key={country.code} className="fd-list-item">
                  <span>{country.code}</span>
                  <div className="fd-bar-inline">
                    <div
                      className="fd-bar-fill-inline"
                      style={{
                        width: `${((Number(country.count) || 0) / maxCountryCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span>{country.count}</span>
                </div>
              ))
            ) : (
              <div className="fd-empty-inline">Keine echten Geo-Events geladen.</div>
            )}
          </div>
        </section>
      </div>

      <div className="fd-two-column">
        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Geräte-Breakdown</h3>
            <span><Zap size={16} /></span>
          </div>
          <div className="fd-list-items">
            {hasRealEvents && Object.keys(deviceTypeBreakdown).length > 0 ? (
              Object.entries(deviceTypeBreakdown).map(([device, count]) => (
                <div key={device} className="fd-list-item">
                  <span className="fd-code-cell">{device}</span>
                  <span>{(totalViews > 0 ? ((Number(count) || 0) / totalViews) * 100 : 0).toFixed(1)}%</span>
                  <span className="fd-value-faded">{count}</span>
                </div>
              ))
            ) : (
              <div className="fd-empty-inline">Keine echten Device-Events geladen.</div>
            )}
          </div>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Tageszeit-Verteilung</h3>
            <span>{safeHourlyDistribution.length} Stunden</span>
          </div>
          <div className="fd-sparkline">
            {safeHourlyDistribution.map((count, hour) => (
              <div
                key={hour}
                className="fd-sparkbar"
                style={{
                  height: `${Math.max((count / Math.max(...safeHourlyDistribution, 1)) * 100, 5)}%`,
                }}
                title={`${hour}:00 - ${count} Events`}
              />
            ))}
          </div>
          <small style={{ marginTop: '0.5rem', display: 'block' }}>
            Peak: {peakHour === null ? 'n/a' : `${peakHour}:00 Uhr`}
          </small>
        </section>
      </div>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Event-Typ-Übersicht</h3>
          <span><Filter size={16} /></span>
        </div>
        <div className="fd-grid-2">
          {Object.entries(eventsByType).map(([type, count]) => (
            <div key={type} className="fd-stat-box">
              <span className="fd-stat-label">{type}</span>
              <span className="fd-stat-number">{count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdvancedAnalyticsTab;
