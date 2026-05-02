import React, { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { sets } from '../data/musicSets';
import { buildAudioApiHref, partitionSetsByAccess } from '../lib/set-access';
import { t } from '../utils/i18n';
import './VIPSection.css';

const API_BASE = (import.meta.env.VITE_STATS_API_BASE || '').replace(/\/+$/, '');
const { vipSets } = partitionSetsByAccess(sets);

const parseTrackTimeToSeconds = (value = '') => {
    const parts = String(value || '')
        .trim()
        .split(':')
        .map((chunk) => Number.parseInt(chunk, 10));
    if (!parts.length || parts.some((part) => Number.isNaN(part))) return null;
    if (parts.length === 3) {
        const [hours, minutes, seconds] = parts;
        return (hours * 3600) + (minutes * 60) + seconds;
    }
    if (parts.length === 2) {
        const [minutes, seconds] = parts;
        return (minutes * 60) + seconds;
    }
    if (parts.length === 1) {
        return parts[0];
    }
    return null;
};

const getCurrentTracklistIndex = (tracks = [], currentTimeSeconds = 0) => {
    if (!Array.isArray(tracks) || !tracks.length || !Number.isFinite(currentTimeSeconds)) return -1;
    let activeIndex = -1;
    for (let index = 0; index < tracks.length; index += 1) {
        const trackAt = parseTrackTimeToSeconds(tracks[index]?.time);
        if (!Number.isFinite(trackAt)) continue;
        if (currentTimeSeconds >= trackAt) {
            activeIndex = index;
            continue;
        }
        break;
    }
    return activeIndex;
};

const VIPSection = ({ onOpenAuth = () => {} }) => {
    const { currentTrack, isPlaying, currentTime, playTrack, togglePlay } = useAudio();
    const [user, setUser] = useState(null);
    const [validatingSession, setValidatingSession] = useState(false);
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('airdox_token') || '');

    useEffect(() => {
        const savedToken = localStorage.getItem('airdox_token');
        if (savedToken) {
            validateToken(savedToken);
        }
    }, []);

    const validateToken = async (token) => {
        setValidatingSession(true);
        try {
            const response = await fetch(`${API_BASE}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate', token }),
            });
            const result = await response.json();

            if (response.ok && result.ok) {
                setUser(result.user);
                setAuthToken(token);
                window.dispatchEvent(new CustomEvent('airdox_login_success'));
            } else {
                localStorage.removeItem('airdox_token');
                setUser(null);
                setAuthToken('');
            }
        } catch {
            setUser(null);
            setAuthToken('');
        } finally {
            setValidatingSession(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('airdox_token');
        setUser(null);
        setAuthToken('');
        window.dispatchEvent(new CustomEvent('airdox_logout'));
    };

    const handlePlayClick = (set) => {
        if (currentTrack?.id === set.id) {
            togglePlay();
            return;
        }
        playTrack(set);
    };

    if (!user) {
        return (
            <section className="vip-section section" id="vip">
                <div className="container">
                    <div className="auth-container airdox-card reveal vip-gate">
                        <div className="section-header" style={{ marginBottom: 'var(--space-7)' }}>
                            <span className="section-label">{t('vip.accessLabel')}</span>
                            <h2 className="section-title text-gradient" style={{ fontSize: '2rem' }}>{t('vip.archiveTitle')}</h2>
                            <p className="section-subtitle">
                                {t('vip.gateSubtitle')}
                            </p>
                        </div>

                        <div className="vip-gate-actions">
                            <button type="button" className="btn btn-outline" onClick={() => onOpenAuth('login')}>
                                {t('nav.login')}
                            </button>
                            <button type="button" className="btn btn-primary" onClick={() => onOpenAuth('register')}>
                                {t('nav.register')}
                            </button>
                        </div>

                        <p className="vip-gate-hint">
                            {validatingSession ? t('vip.sessionChecking') : `${vipSets.length} ${t('vip.setsWaiting')}`}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="vip-section section" id="vip">
            <div className="container">
                <div className="airdox-card reveal">
                    <div className="vip-content">
                        <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
                            <span className="section-label">{t('vip.membersLabel')}</span>
                            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>{t('vip.welcome')}, {user.username}</h2>
                            <p className="section-subtitle">
                                {t('vip.memberSubtitle')}
                            </p>
                        </div>

                        {vipSets.length > 0 ? (
                            <div className="vip-sets-grid">
                                {vipSets.map((set) => {
                                    const isSetPlaying = currentTrack?.id === set.id && isPlaying;
                                    const isSetCurrent = currentTrack?.id === set.id;
                                    const activeTrackIndex = isSetCurrent
                                        ? getCurrentTracklistIndex(set.tracks, currentTime)
                                        : -1;
                                    return (
                                        <article key={set.id} className="vip-set-card">
                                            <div className="vip-set-head">
                                                <h3>{set.title}</h3>
                                                <span>{set.date}{set.duration ? ` | ${set.duration}` : ''}</span>
                                            </div>
                                            <div className="vip-set-actions">
                                                <button
                                                    type="button"
                                                    className="vip-play-btn"
                                                    onClick={() => handlePlayClick(set)}
                                                >
                                                    {isSetPlaying ? t('vip.pause') : t('vip.play')}
                                                </button>
                                                <a
                                                    href={buildAudioApiHref(set.file, authToken)}
                                                    download={set.file}
                                                    className="vip-download-link"
                                                >
                                                    {t('vip.download')}
                                                </a>
                                            </div>
                                            {Array.isArray(set.tracks) && set.tracks.length > 0 && (
                                                <ul className="vip-tracklist-items">
                                                    {set.tracks.map((track, idx) => (
                                                        <li
                                                            key={`${set.id}-${idx}`}
                                                            className={idx === activeTrackIndex ? 'current-track' : ''}
                                                            aria-current={idx === activeTrackIndex ? 'true' : undefined}
                                                        >
                                                            <span>{track.time || '--:--'}</span>
                                                            <span>{track.artist} - {track.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="section-subtitle">{t('vip.noSets')}</p>
                        )}

                        <button className="logout-btn" onClick={handleLogout}>
                            {t('vip.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VIPSection;
