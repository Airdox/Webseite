import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './MusicSection.css';
import { t } from '../utils/i18n';

import { sets } from '../data/musicSets';
import { buildAudioApiHref, partitionSetsByAccess } from '../lib/set-access';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import { statsSync } from '../utils/stats-sync';

const { publicSets } = partitionSetsByAccess(sets);

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

const MusicSection = () => {
    const {
        analyserRef,
        currentTrack,
        isPlaying,
        currentTime,
        playTrack,
        togglePlay
    } = useAudio();
    const currentTrackId = currentTrack?.id ?? null;

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

    const sectionRef = useRef(null);
    const billiardStateRef = useRef({
        x: 0,
        y: 0,
        vx: 140,
        vy: 118,
        maxX: 0,
        maxY: 0,
        trackKey: '',
        lastTs: 0
    });
    const billiardRafRef = useRef(null);
    const animatedVinylRef = useRef(null);
    const frequencyBufferRef = useRef(null);
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
            // Das tatsächliche Play-Tracking passiert jetzt im AudioContext via statsSync
        }
    };

    const handleCoverKeyDown = (event, set) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePlayClick(set);
        }
    };

    const handleVote = (setId, voteType) => {
        const currentVote = userVotes[setId]; // 'like' | 'dislike' | undefined

        let typeToSend = voteType; // 'like' or 'dislike'

        if (currentVote === voteType) {
            // Toggle off (rückgängig machen)
            typeToSend = `un${voteType}`; // 'unlike' or 'undislike'
            const newVotes = { ...userVotes };
            delete newVotes[setId];
            setUserVotes(newVotes);
            localStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
        } else {
            // New vote or switch
            if (currentVote) {
                statsSync.trackVote(setId, `un${currentVote}`);
            }

            const newVotes = { ...userVotes, [setId]: voteType };
            setUserVotes(newVotes);
            localStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
        }

        // Optimistic Update für sofortiges Feedback
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

    const [authToken, setAuthToken] = useState(() => localStorage.getItem('airdox_token') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(Boolean(authToken));

    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem('airdox_token') || '';
            setAuthToken(token);
            setIsLoggedIn(Boolean(token));
        };
        window.addEventListener('airdox_login_success', checkLogin);
        window.addEventListener('airdox_logout', checkLogin);
        return () => {
            window.removeEventListener('airdox_login_success', checkLogin);
            window.removeEventListener('airdox_logout', checkLogin);
        };
    }, []);

    useEffect(() => {
        const clearAnimatedVinyl = () => {
            if (!animatedVinylRef.current) return;
            animatedVinylRef.current.style.removeProperty('--vinyl-bounce-x');
            animatedVinylRef.current.style.removeProperty('--vinyl-bounce-y');
            animatedVinylRef.current = null;
        };

        if (!isPlaying || !currentTrackId) {
            clearAnimatedVinyl();
            return undefined;
        }

        const prefersReducedMotion = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            clearAnimatedVinyl();
            return undefined;
        }

        let disposed = false;
        const physics = billiardStateRef.current;
        const randomDirection = () => (Math.random() >= 0.5 ? 1 : -1);

        const findCurrentVinyl = () => {
            const cards = document.querySelectorAll('.set-card[data-set-id]');
            for (const card of cards) {
                if (card.dataset.setId !== String(currentTrackId)) continue;
                const cover = card.querySelector('.set-cover');
                const vinyl = card.querySelector('.cover-vinyl');
                if (!cover || !vinyl) return null;
                return { cover, vinyl };
            }
            return null;
        };

        const readAudioEnergy = () => {
            const analyser = analyserRef?.current;
            if (!analyser) return 0.35;
            if (!frequencyBufferRef.current || frequencyBufferRef.current.length !== analyser.frequencyBinCount) {
                frequencyBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
            }
            const frequencyBuffer = frequencyBufferRef.current;
            analyser.getByteFrequencyData(frequencyBuffer);
            const binsToRead = Math.min(frequencyBuffer.length, 48);
            if (!binsToRead) return 0.35;
            let sum = 0;
            for (let i = 0; i < binsToRead; i += 1) {
                sum += frequencyBuffer[i];
            }
            return sum / (binsToRead * 255);
        };

        const animate = (timestamp) => {
            if (disposed) return;

            const activeElements = findCurrentVinyl();
            if (!activeElements) {
                billiardRafRef.current = requestAnimationFrame(animate);
                return;
            }

            const { cover, vinyl } = activeElements;
            if (animatedVinylRef.current && animatedVinylRef.current !== vinyl) {
                animatedVinylRef.current.style.removeProperty('--vinyl-bounce-x');
                animatedVinylRef.current.style.removeProperty('--vinyl-bounce-y');
            }
            animatedVinylRef.current = vinyl;

            const coverRect = cover.getBoundingClientRect();
            const vinylRect = vinyl.getBoundingClientRect();
            const maxX = Math.max(0, coverRect.width - vinylRect.width);
            const maxY = Math.max(0, coverRect.height - vinylRect.height);
            const trackKey = String(currentTrackId);

            const hasViewportChange = Math.abs(physics.maxX - maxX) > 0.5 || Math.abs(physics.maxY - maxY) > 0.5;
            if (physics.trackKey !== trackKey || hasViewportChange) {
                physics.trackKey = trackKey;
                physics.maxX = maxX;
                physics.maxY = maxY;
                physics.x = maxX / 2;
                physics.y = maxY / 2;
                physics.vx = 140 * randomDirection();
                physics.vy = 118 * randomDirection();
                physics.lastTs = timestamp;
            }

            if (!physics.lastTs) {
                physics.lastTs = timestamp;
            }
            const deltaSec = Math.min(0.05, Math.max(0.008, (timestamp - physics.lastTs) / 1000));
            physics.lastTs = timestamp;

            const energy = readAudioEnergy();
            const speedFactor = 0.85 + (energy * 1.7);
            physics.x += physics.vx * speedFactor * deltaSec;
            physics.y += physics.vy * speedFactor * deltaSec;

            if (physics.x <= 0) {
                physics.x = 0;
                physics.vx = Math.abs(physics.vx);
            } else if (physics.x >= maxX) {
                physics.x = maxX;
                physics.vx = -Math.abs(physics.vx);
            }

            if (physics.y <= 0) {
                physics.y = 0;
                physics.vy = Math.abs(physics.vy);
            } else if (physics.y >= maxY) {
                physics.y = maxY;
                physics.vy = -Math.abs(physics.vy);
            }

            const offsetX = physics.x - (maxX / 2);
            const offsetY = physics.y - (maxY / 2);
            vinyl.style.setProperty('--vinyl-bounce-x', `${offsetX.toFixed(2)}px`);
            vinyl.style.setProperty('--vinyl-bounce-y', `${offsetY.toFixed(2)}px`);

            billiardRafRef.current = requestAnimationFrame(animate);
        };

        billiardRafRef.current = requestAnimationFrame(animate);

        return () => {
            disposed = true;
            if (billiardRafRef.current) {
                cancelAnimationFrame(billiardRafRef.current);
                billiardRafRef.current = null;
            }
            physics.lastTs = 0;
            clearAnimatedVinyl();
        };
    }, [analyserRef, currentTrackId, isPlaying]);

    return (
        <section className="music-section section" id="music" ref={sectionRef}>
            <div className="container">
                {/* Header */}
                <div className="section-header reveal">
                    <span className="section-label">{t('music.sectionLabel')}</span>
                    <h2 className="section-title text-gradient">{t('music.title')}</h2>
                    <p className="section-subtitle">{t('music.subtitle')}</p>
                </div>

                {/* Sets Grid */}
                <div className="sets-grid">
                    {publicSets.map((set, index) => {
                        const stats = getSetStats(set.id);
                        const userVote = getUserVote(set.id);
                        const isSetPlaying = currentTrack?.id === set.id && isPlaying;
                        const isSetCurrent = currentTrack?.id === set.id;
                        const activeTrackIndex = isSetCurrent
                            ? getCurrentTracklistIndex(set.tracks, currentTime)
                            : -1;



                        return (
                            <div
                                key={set.id}
                                className={`set-card premium-card reveal-scale stagger-${Math.min(index + 1, 6)} ${isSetCurrent ? 'active' : ''} ${set.isChristmasGift ? 'christmas-highlight' : ''}`}
                                data-set-id={set.id}
                            >
                                {/* Cover Art */}
                                <div
                                    className="set-cover"
                                    onClick={() => handlePlayClick(set)}
                                    onKeyDown={(event) => handleCoverKeyDown(event, set)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${isSetPlaying ? 'Pause' : 'Play'} ${set.title}`}
                                >
                                    <div
                                        className="cover-vinyl"
                                        style={{
                                            '--vinyl-color': set.vinylColor || 'var(--neon-cyan)',
                                            '--vinyl-index': index
                                        }}
                                    >
                                        <div
                                            className={`mini-vinyl ${isSetPlaying ? 'active-disc spinning-disc' : ''}`}
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

                                    {/* Christmas Ribbon Overlay */}
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

                                    {/* Visualizer (Local on Card) */}
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

                                {/* Set Info */}
                                <div className="set-info">
                                    <h3 className="set-title">{set.title}</h3>
                                    <div className="set-meta">
                                        <span className="set-date">{set.date}</span>
                                        {set.duration && <span className="set-duration">{set.duration}</span>}
                                    </div>
                                    {isLoggedIn && (
                                        <a 
                                            href={buildAudioApiHref(set.file, authToken)} 
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
                                        <div className="vip-tracklist">
                                            <h4 className="tracklist-title">Tracklist</h4>
                                            <ul className="tracklist-items">
                                                {set.tracks.map((track, idx) => (
                                                    <li
                                                        key={idx}
                                                        className={`tracklist-item ${idx === activeTrackIndex ? 'current-track' : ''}`}
                                                        aria-current={idx === activeTrackIndex ? 'true' : undefined}
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

                                {/* Stats & Like Buttons */}
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
