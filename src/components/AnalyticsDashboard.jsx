import React, { useState, useEffect, useCallback } from 'react';
import './AnalyticsDashboard.css';
import { t } from '../utils/i18n';

const AnalyticsDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState(null);

  // Lade Stats beim Öffnen
  const fetchStats = useCallback(() => {
    if (window.airdoxAnalytics) {
      setStats(window.airdoxAnalytics.getStats('all'));
    }
  }, []);

  // Hotkey lauschen (Strg + Alt + A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Strg (ctrlKey) + Alt (altKey) + A (KeyA)
      // Mac Cmd wird bei ctrlKey oft nicht erfasst, ggf. metaKey hinzunehmen:
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'KeyA') {
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
            <span className="text-gradient">{t('analytics.system')}</span>_{t('analytics.title')}
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
                <div className="stat-label">{t('analytics.pageViews')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total?.sessions || 0}</div>
                <div className="stat-label">{t('analytics.sessions')}</div>
              </div>
              <div className="stat-card">
                {/* Download stats remain for analytics, but no download links are provided to users */}
                <div className="stat-value">{stats.total?.downloads || 0}</div>
                <div className="stat-label">{t('analytics.downloads')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.total?.audioPlays || 0}</div>
                <div className="stat-label">{t('analytics.audioPlays')}</div>
              </div>
            </div>

            <div className="analytics-row">
              <div className="analytics-section half">
                <h3>{t('analytics.trafficSources')}</h3>
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
                  <p className="no-data">{t('analytics.noReferrers')}</p>
                )}
              </div>

              <div className="analytics-section half">
                <h3>{t('analytics.outboundClicks')}</h3>
                {stats.traffic?.socialClicks?.length > 0 ? (
                  <ul className="analytics-list">
                    {stats.traffic.socialClicks.map((click, idx) => (
                      <li key={idx}>
                        <span className="track-name">{click.name}</span>
                        <span className="track-plays">{click.count} {t('analytics.clicks')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">{t('analytics.noSocialClicks')}</p>
                )}
              </div>
            </div>

            <div className="analytics-section">
              <h3>{t('analytics.topTracks')}</h3>
              {stats.audio?.top?.length > 0 ? (
                <ul className="analytics-list">
                  {stats.audio.top.map(([track, plays], idx) => (
                    <li key={idx}>
                      <span className="track-name">{track}</span>
                      <span className="track-plays">{plays} {t('analytics.plays')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">{t('analytics.noAudio')}</p>
              )}
            </div>

            <div className="analytics-section">
              <h3>{t('analytics.systemInfo')}</h3>
              <p>{t('analytics.avgSessionDuration')}: <strong>{stats.averages?.sessionDuration || 0}s</strong></p>
              <p>{t('analytics.avgScrollDepth')}: <strong>{stats.averages?.scrollDepth || 0}%</strong></p>
              <p>{t('analytics.bounceRate')}: <strong>{stats.rates?.bounce || 0}%</strong></p>
            </div>
            
            <div className="analytics-actions">
              <button className="btn btn-outline" onClick={handleExportJson}>{t('analytics.exportJson')}</button>
              <button className="btn btn-outline" onClick={handleExportCsv}>{t('analytics.exportCsv')}</button>
              <button className="btn btn-outline clear-btn" onClick={handleClearData}>{t('analytics.clearData')}</button>
            </div>
          </div>
        ) : (
          <div className="analytics-loading">{t('analytics.loading')}</div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
