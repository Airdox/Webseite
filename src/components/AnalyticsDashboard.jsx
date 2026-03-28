import React, { useState, useEffect, useCallback } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(null);

  // Lade Stats beim Öffnen
  const fetchStats = useCallback(() => {
    if (window.airdoxAnalytics) {
      setStats(window.airdoxAnalytics.getStats('all'));
    }
  }, []);

  // Hotkey lauschen (Strg + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Strg (ctrlKey) + Shift (shiftKey) + A (KeyA)
      // Mac Cmd wird bei ctrlKey oft nicht erfasst, ggf. metaKey hinzunehmen:
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) fetchStats();
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchStats]);

  const handleExportJson = () => {
    window.airdoxAnalytics?.exportData('json');
  };

  const handleExportCsv = () => {
    window.airdoxAnalytics?.exportData('csv');
  };

  const handleClearData = () => {
    const cleared = window.airdoxAnalytics?.clearData();
    if (cleared) {
      setIsOpen(false);
      setStats(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="analytics-overlay">
      <div className="analytics-dashboard glass-card">
        <div className="analytics-header">
          <h2>
            <span className="text-gradient">SYSTEM</span>_ANALYTICS
          </h2>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            &times;
          </button>
        </div>

        {stats ? (
          <div className="analytics-content">
            <div className="analytics-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total?.pageViews || 0}</div>
                <div className="stat-label">PAGE VIEWS</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total?.sessions || 0}</div>
                <div className="stat-label">SESSIONS</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total?.downloads || 0}</div>
                <div className="stat-label">DOWNLOADS</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total?.audioPlays || 0}</div>
                <div className="stat-label">AUDIO PLAYS</div>
              </div>
            </div>

            <div className="analytics-row">
              <div className="analytics-section half">
                <h3>TRAFFIC SOURCES</h3>
                {stats.traffic?.referrers?.length > 0 ? (
                  <ul className="analytics-list">
                    {stats.traffic.referrers.map((ref, idx) => (
                      <li key={idx}>
                        <span className="track-name">{ref.name}</span>
                        <span className="track-plays">{ref.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">Kein Direct/Referrer verzeichnet.</p>
                )}
              </div>

              <div className="analytics-section half">
                <h3>OUTBOUND CLICKS</h3>
                {stats.traffic?.socialClicks?.length > 0 ? (
                  <ul className="analytics-list">
                    {stats.traffic.socialClicks.map((click, idx) => (
                      <li key={idx}>
                        <span className="track-name">{click.name}</span>
                        <span className="track-plays">{click.count} Clicks</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">Keine Social Clicks registriert.</p>
                )}
              </div>
            </div>

            <div className="analytics-section">
              <h3>TOP TRACKS</h3>
              {stats.audio?.top?.length > 0 ? (
                <ul className="analytics-list">
                  {stats.audio.top.map(([track, plays], idx) => (
                    <li key={idx}>
                      <span className="track-name">{track}</span>
                      <span className="track-plays">{plays} Plays</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">Keine Audio-Daten vorhanden.</p>
              )}
            </div>

            <div className="analytics-section">
              <h3>SYSTEM INFO</h3>
              <p>Av. Session Duration: <strong>{stats.averages?.sessionDuration || 0}s</strong></p>
              <p>Av. Scroll Depth: <strong>{stats.averages?.scrollDepth || 0}%</strong></p>
              <p>Bounce Rate: <strong>{stats.rates?.bounce || 0}%</strong></p>
            </div>
            
            <div className="analytics-actions">
              <button className="btn btn-outline" onClick={handleExportJson}>EXPORT JSON</button>
              <button className="btn btn-outline" onClick={handleExportCsv}>EXPORT CSV</button>
              <button className="btn btn-outline clear-btn" onClick={handleClearData}>CLEAR DATA</button>
            </div>
          </div>
        ) : (
          <div className="analytics-loading">Loading Analytics Data...</div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
