import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './MusicSection.css';
import { t } from '../utils/i18n';

import { sets } from '../data/musicSets';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import { statsSync } from '../utils/stats-sync';

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

const MusicSection = () => {
    const {
        analyserRef,
        currentTrack,
        isPlaying,
        currentTime,
        playTrack,
        togglePlay,
        seek
    } = useAudio();

    // Globale Stats (von Datenbank) mit LocalStorage Fallback
    const [globalStats, setGlobalStats] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('airdox_global_stats') || '{}');
        } catch { return {}; }
    });

    // Lokaler User Vote (localStorage)
    const [userVotes, setUserVotes] = useState(() => {
        try { return JSON.parse(localStorage.getItem('airdox_user_votes') || '{}'); }
        catch { return {}; }
    });

    const [collapsedTracklists, setCollapsedTracklists] = useState({});

    const sectionRef = useRef(null);
    useRevealOnScroll(sectionRef, '.reveal, .reveal-scale');

    // Sync bei Änderungen der globalen Stats (durch StatsSync oder andere Komponenten)
    useEffect(() => {
        const handleStatsUpdate = (e) => setGlobalStats(e.detail);
        window.addEventListener('airdox_stats_updated', handleStatsUpdate);
        return () => window.removeEventListener('airdox_stats_updated', handleStatsUpdate);
    }, []);



    const handlePlayClick = (set) => {
        if (currentTrack?.id === set.id) {
            togglePlay();
        } else {
            playTrack(set);
        }
    };

    const handleTrackClick = (set, track) => {
        const timeInSeconds = parseTrackTimeToSeconds(track.time);
        if (timeInSeconds === null) return;

        if (currentTrack?.id !== set.id) {
            playTrack(set);
            // Wait for track to start loading before seeking
            // Audio element usually needs a moment to update duration/currentTime
            setTimeout(() => {
                seek(timeInSeconds);
            }, 500);
        } else {
            seek(timeInSeconds);
        }
    };

    const toggleTracklist = (setId) => {
        setCollapsedTracklists(prev => ({ ...prev, [setId]: !prev[setId] }));
    };

    const handleCoverKeyDown = (event, set) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePlayClick(set);
        }
    };

    const handleVote = (setId, voteType) => {
        const currentVote = userVotes[setId];

        let typeToSend = voteType;

        if (currentVote === voteType) {
            typeToSend = `un${voteType}`;
            const newVotes = { ...userVotes };
            delete newVotes[setId];
            setUserVotes(newVotes);
            localStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
        } else {
            if (currentVote) {
                statsSync.trackVote(setId, `un${currentVote}`);
            }

            const newVotes = { ...userVotes, [setId]: voteType };
            setUserVotes(newVotes);
            localStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
        }

        setGlobalStats(prev => ({
            ...prev,
            [setId]: {
                ...prev[setId],
                [voteType === 'like' ? 'likes' : 'dislikes']: (prev[setId]?.[voteType === 'like' ? 'likes' : 'dislikes'] || 0) + 1
            }
        }));

        statsSync.trackVote(setId, typeToSend);

        const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
        if (analytics?.trackEvent) {
            analytics.trackEvent('vote', { setId, vote: typeToSend });
        }
    };

    const getSetStats = (setId) => globalStats[setId] || { plays: 0, likes: 0, dislikes: 0 };
    const getUserVote = (setId) => userVotes[setId];

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('airdox_token'));

    useEffect(() => {
        const checkLogin = () => setIsLoggedIn(!!localStorage.getItem('airdox_token'));
        window.addEventListener('airdox_login_success', checkLogin);
        window.addEventListener('airdox_logout', checkLogin);
        return () => {
            window.removeEventListener('airdox_login_success', checkLogin);
            window.removeEventListener('airdox_logout', checkLogin);
        };
    }, []);

    return (
        <section className="music-section section" id="music" ref={sectionRef}>
            <div className="container">
                <div className="section-header reveal">
                    <span className="section-label">{t('music.sectionLabel')}</span>
                    <h2 className="section-title text-gradient">{t('music.title')}</h2>
                    <p className="section-subtitle">{t('music.subtitle')}</p>
                </div>

                <div className="sets-grid">
                    {sets.map((set, index) => {
                        const stats = getSetStats(set.id);
                        const userVote = getUserVote(set.id);
                        const isSetPlaying = currentTrack?.id === set.id && isPlaying;
                        const isSetCurrent = currentTrack?.id === set.id;

                        const activeTrackIndex = isSetCurrent && set.tracks 
                            ? set.tracks.reduce((acc, t, i) => {
                                const startTime = parseTrackTimeToSeconds(t.time);
                                if (startTime !== null && currentTime >= startTime) return i;
                                return acc;
                            }, -1) 
                            : -1;

                        return (
                            <div
                                key={set.id}
                                className={`set-card premium-card reveal-scale stagger-${Math.min(index + 1, 6)} ${isSetCurrent ? 'active' : ''} ${set.isChristmasGift ? 'christmas-highlight' : ''}`}
                            >
                                <div
                                    className="set-cover"
                                    onClick={() => handlePlayClick(set)}
                                    onKeyDown={(event) => handleCoverKeyDown(event, set)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${isSetPlaying ? 'Pause' : 'Play'} ${set.title}`}
                                >
                                    <div
                                        className={`cover-vinyl ${isSetPlaying ? 'spinning' : ''}`}
                                        style={{
                                            '--vinyl-color': set.vinylColor || 'var(--neon-cyan)',
                                            '--vinyl-index': index
                                        }}
                                    >
                                        <div
                                            className={`mini-vinyl ${isSetPlaying ? 'active-disc' : ''}`}
                                        >
                                            {isSetPlaying ? (
                                                <img
                                                    src={set.isChristmasGift ? "/assets/santa_vinyl.png" : (set.cover || "/assets/airdox-vinyl.jpg")}
                                                    alt="Vinyl Label"
                                                    loading="lazy"
                                                    decoding="async"
                                                    fetchpriority="low"
                                                    className={`vinyl-image ${set.isChristmasGift ? 'santa-style' : ''}`}
                                                />
                                            ) : (
                                                <div className="mini-vinyl-label"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="cover-overlay">
                                        <span className="play-btn interactive" aria-hidden="true">
                                            {isSetPlaying ? (
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <rect x="6" y="5" width="4" height="14" />
                                                    <rect x="14" y="5" width="4" height="14" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            )}
                                        </span>
                                    </div>
                                    {set.isChristmasGift && <span className="xmas-badge">🎄 GIFT</span>}
                                    {set.isNew && !set.isChristmasGift && <span className="new-badge">NEW</span>}

                                    {set.isChristmasGift && (
                                        <div className="gift-ribbon">
                                            <div className="ribbon-vertical"></div>
                                            <div className="ribbon-horizontal"></div>
                                            <div className="ribbon-bow">
                                                <div className="bow-left"></div>
                                                <div className="bow-center"></div>
                                                <div className="bow-right"></div>
                                            </div>
                                        </div>
                                    )}

                                    {isSetPlaying && (
                                        <div className="visualizer-container active">
                                            {[...Array(12)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="visualizer-bar-animated"
                                                    style={{
                                                        '--delay': `${i * 0.15}s`,
                                                        '--height': `${20 + (i * 7) % 30}px`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="set-info">
                                    <h3 className="set-title">{set.title}</h3>
                                    <div className="set-meta">
                                        <span className="set-date">{set.date}</span>
                                        {set.duration && <span className="set-duration">{set.duration}</span>}
                                    </div>
                                    {isLoggedIn && (
                                        <a 
                                            href={`/audio/${set.file}`} 
                                            download={set.file}
                                            className="vip-download-link"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Download VIP Access"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                            </svg>
                                            VIP DOWNLOAD
                                        </a>
                                    )}

                                    {set.tracks && set.tracks.length > 0 && (
                                        <div className={`vip-tracklist ${collapsedTracklists[set.id] ? 'collapsed' : ''}`}>
                                            <button
                                                type="button"
                                                className="tracklist-toggle"
                                                onClick={(e) => { e.stopPropagation(); toggleTracklist(set.id); }}
                                                aria-expanded={!collapsedTracklists[set.id]}
                                                aria-label={collapsedTracklists[set.id] ? 'Show tracklist' : 'Hide tracklist'}
                                            >
                                                <h4 className="tracklist-title">Tracklist</h4>
                                                <svg className={`tracklist-chevron ${collapsedTracklists[set.id] ? 'chevron-collapsed' : ''}`} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                                                </svg>
                                            </button>
                                            <ul className="tracklist-items">
                                                {set.tracks.map((track, idx) => (
                                                    <li
                                                        key={idx}
                                                        className={`tracklist-item ${idx === activeTrackIndex ? 'current-track' : ''}`}
                                                        aria-current={idx === activeTrackIndex ? 'true' : undefined}
                                                        onClick={(e) => { e.stopPropagation(); handleTrackClick(set, track); }}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTrackClick(set, track); } }}
                                                    >
                                                        <span className="track-time">{track.time}</span>
                                                        <span className="track-details">
                                                            <span className="track-artist">{track.artist}</span> - <span className="track-title">{track.title}</span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="set-stats">
                                    <div className="play-count">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <span>{t('music.plays')}: {stats.plays || 0}</span>
                                    </div>
                                    <div className="like-buttons">
                                        <button
                                            type="button"
                                            className={`like-btn ${userVote === 'like' ? 'liked' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleVote(set.id, 'like'); }}
                                            aria-label={`Like ${set.title}`}
                                            aria-pressed={userVote === 'like'}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
                                            </svg>
                                            <span>{t('music.likes')}: {stats.likes || 0}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`like-btn ${userVote === 'dislike' ? 'disliked' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleVote(set.id, 'dislike'); }}
                                            aria-label={`Dislike ${set.title}`}
                                            aria-pressed={userVote === 'dislike'}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.34C17 5.05 15.95 4 14.66 4H6.55c-.7 0-1.36.37-1.72.97l-2.66 6.15z" />
                                            </svg>
                                            <span>{t('music.dislikes')}: {stats.dislikes || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default MusicSection;
