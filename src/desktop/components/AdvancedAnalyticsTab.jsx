import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Calendar, Zap, Users, Eye, Heart, Volume2,
  Download, Filter, RotateCcw
} from 'lucide-react';

const chartColors = ['#9adf6b', '#60a5fa', '#f97316', '#ec4899', '#8b5cf6', '#14b8a6'];

const ChartBar = ({ label, value, maxValue, color = '#9adf6b' }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="fd-chart-bar">
      <span className="fd-chart-label">{label}</span>
      <div className="fd-bar-container">
        <div
          className="fd-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="fd-chart-value">{value}</span>
    </div>
  );
};

const DateRangeSelector = ({ startDate, endDate, onStartChange, onEndChange }) => (
  <div className="fd-date-range">
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

const AdvancedAnalyticsTab = ({
  analyticsData = {},
  onExport = () => {},
  onRefresh = () => {},
  busy = false,
}) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    eventType: 'all',
    deviceType: 'all',
    country: 'all',
  });

  const {
    totalViews = 0,
    totalPlays = 0,
    totalLikes = 0,
    eventsByType = {},
    topSets = [],
    topCountries = [],
    deviceTypeBreakdown = {},
    hourlyDistribution = [],
    conversionRate = 0,
  } = analyticsData;

  const maxPlays = Math.max(...(topSets.map(s => s.plays) || [1]));

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Advanced Analytics</h2>
          <p>Detaillierte Auswertung von Plays, Engagement und Nutzerverhalten.</p>
        </div>
        <div className="fd-toolbar-actions">
          <button
            type="button"
            className="fd-button secondary"
            onClick={onRefresh}
            disabled={busy}
          >
            <RotateCcw size={16} />
            Aktualisieren
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
              <option value="mobile">Mobile</option>
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
            </select>
          </label>
          <label>
            Land
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="all">Alle</option>
              <option value="DE">Deutschland</option>
              <option value="AT">Österreich</option>
              <option value="CH">Schweiz</option>
              <option value="US">USA</option>
            </select>
          </label>
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
            {topSets.slice(0, 10).map((set, idx) => (
              <ChartBar
                key={set.id}
                label={set.id}
                value={set.plays}
                maxValue={maxPlays}
                color={chartColors[idx % chartColors.length]}
              />
            ))}
          </div>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Geo-Verteilung</h3>
            <span>{topCountries.length} Länder</span>
          </div>
          <div className="fd-list-items">
            {topCountries.slice(0, 10).map((country) => (
              <div key={country.code} className="fd-list-item">
                <span>{country.code}</span>
                <div className="fd-bar-inline">
                  <div
                    className="fd-bar-fill-inline"
                    style={{
                      width: `${(country.count / Math.max(...topCountries.map(c => c.count), 1)) * 100}%`,
                    }}
                  />
                </div>
                <span>{country.count}</span>
              </div>
            ))}
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
            {Object.entries(deviceTypeBreakdown).map(([device, count]) => (
              <div key={device} className="fd-list-item">
                <span className="fd-code-cell">{device}</span>
                <span>{((count / totalViews) * 100).toFixed(1)}%</span>
                <span className="fd-value-faded">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="fd-surface">
          <div className="fd-section-head">
            <h3>Tageszeit-Verteilung</h3>
            <span>{hourlyDistribution.length} Stunden</span>
          </div>
          <div className="fd-sparkline">
            {hourlyDistribution.map((count, hour) => (
              <div
                key={hour}
                className="fd-sparkbar"
                style={{
                  height: `${Math.max((count / Math.max(...hourlyDistribution, 1)) * 100, 5)}%`,
                }}
                title={`${hour}:00 - ${count} Events`}
              />
            ))}
          </div>
          <small style={{ marginTop: '0.5rem', display: 'block' }}>
            Peak: {hourlyDistribution.indexOf(Math.max(...hourlyDistribution))}:00 Uhr
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
