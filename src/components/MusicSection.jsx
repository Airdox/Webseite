import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './MusicSection.css';

import { sets } from '../data/musicSets';

const MusicSection = () => {
    const {
        currentTrack,
        isPlaying,
        playTrack,
        togglePlay
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

    const sectionRef = useRef(null);

    const STATS_API_BASE = (import.meta.env.VITE_STATS_API_BASE || '').replace(/\/+$/, '');
    const STATS_API_FALLBACK = (import.meta.env.VITE_STATS_API_FALLBACK || 'https://airdox.vercel.app').replace(/\/+$/, '');

    const buildStatsUrl = (base) => (base ? `${base}/api/stats` : '/api/stats');
    const PRIMARY_STATS_URL = buildStatsUrl(STATS_API_BASE);
    const FALLBACK_STATS_URL = STATS_API_FALLBACK ? buildStatsUrl(STATS_API_FALLBACK) : null;

    const fetchJson = async (url, options) => {
        const res = await fetch(url, options);
        if (!res.ok) return { ok: false, status: res.status };
        const data = await res.json();
        if (data && data._fallback) return { ok: false, fallback: true, data };
        return { ok: true, data };
    };

    // Stats beim Laden holen (mit Cache & Retry)
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;

        const fetchStats = async () => {
            try {
                let result = await fetchJson(PRIMARY_STATS_URL);
                if (!result.ok && FALLBACK_STATS_URL && FALLBACK_STATS_URL !== PRIMARY_STATS_URL) {
                    result = await fetchJson(FALLBACK_STATS_URL);
                }

                if (result.ok) {
                    setGlobalStats(result.data);
                    // Cache f??r den n??chsten Refresh sichern
                    localStorage.setItem('airdox_global_stats', JSON.stringify(result.data));
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(fetchStats, 2000 * retryCount);
                }
            } catch (err) {
                console.warn('Failed to fetch stats, using cache:', err);
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(fetchStats, 3000);
                }
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = sectionRef.current?.querySelectorAll('.reveal, .reveal-scale');
        elements?.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // API Call Helfer
    const updateApi = async (id, type) => {
        try {
            const payload = JSON.stringify({ id, type });
            const postOnce = (url) => fetchJson(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });

            let result = await postOnce(PRIMARY_STATS_URL);
            if (!result.ok && FALLBACK_STATS_URL && FALLBACK_STATS_URL !== PRIMARY_STATS_URL) {
                result = await postOnce(FALLBACK_STATS_URL);
            }

            if (result.ok) {
                const newRow = result.data;
                setGlobalStats(prev => {
                    const updated = { ...prev, [id]: newRow };
                    localStorage.setItem('airdox_global_stats', JSON.stringify(updated));
                    return updated;
                });
            } else {
                // Persist optimistic update to localStorage as fallback
                localStorage.setItem('airdox_global_stats', JSON.stringify(globalStats));
            }
        } catch (err) {
            console.error('Failed to update stats:', err);
            // Persist optimistic update to localStorage as fallback
            localStorage.setItem('airdox_global_stats', JSON.stringify(globalStats));
        }
    };

    const handlePlayClick = (set) => {
        if (currentTrack?.id === set.id) {
            togglePlay();
        } else {
            playTrack(set);

            // Optimistic Update: Sofort im UI hochzählen
            setGlobalStats(prev => ({
                ...prev,
                [set.id]: {
                    ...prev[set.id],
                    plays: (prev[set.id]?.plays || 0) + 1
                }
            }));

            updateApi(set.id, 'play');
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
                updateApi(setId, `un${currentVote}`);
            }

            const newVotes = { ...userVotes, [setId]: voteType };
            setUserVotes(newVotes);
            localStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
        }

        // Optimistic Update für sofortiges Feedback (optional API update)
        updateApi(setId, typeToSend);
    };



    const getSetStats = (setId) => globalStats[setId] || { plays: 0, likes: 0, dislikes: 0 };
    const getUserVote = (setId) => userVotes[setId];

    return (
        <section className="music-section section" id="music" ref={sectionRef}>
            {/* Background */}
            <div className="music-bg">
                <div className="music-gradient"></div>
            </div>

            <div className="container">
                {/* Header */}
                <div className="section-header reveal">
                    <span className="section-label">// LATEST RELEASES</span>
                    <h2 className="section-title text-gradient">MUSIC</h2>
                    <p className="section-subtitle">Stream exclusive techno sets</p>
                </div>

                {/* Sets Grid */}
                <div className="sets-grid">
                    {sets.map((set, index) => {
                        const stats = getSetStats(set.id);
                        const userVote = getUserVote(set.id);
                        const isSetPlaying = currentTrack?.id === set.id && isPlaying;
                        const isSetCurrent = currentTrack?.id === set.id;



                        return (
                            <div
                                key={set.id}
                                className={`set-card premium-card reveal-scale stagger-${Math.min(index + 1, 6)} ${isSetCurrent ? 'active' : ''} ${set.isChristmasGift ? 'christmas-highlight' : ''}`}
                            >
                                {/* Cover Art */}
                                <div className="set-cover" onClick={() => handlePlayClick(set)}>
                                    <div
                                        className={`cover-vinyl ${isSetPlaying ? 'spinning' : ''}`}
                                        style={{
                                            '--vinyl-color': set.vinylColor || 'var(--neon-cyan)',
                                            '--vinyl-index': index
                                        }}
                                    >
                                        <div className={`mini-vinyl ${isSetPlaying ? 'active-disc' : ''}`}>
                                            {isSetPlaying ? (
                                                <img 
                                                    src={set.isChristmasGift ? "/assets/santa_vinyl.png" : "/assets/airdox-vinyl.jpg"} 
                                                    alt="Vinyl Label" 
                                                    className={`vinyl-image ${set.isChristmasGift ? 'santa-style' : ''}`} 
                                                />
                                            ) : (
                                                <div className="mini-vinyl-label"></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="cover-overlay">
                                        <button className="play-btn interactive">
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
                                        </button>
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
                                    </div>


                                </div>

                                {/* Stats & Like Buttons */}
                                <div className="set-stats">
                                    <div className="play-count">
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        <span>{stats.plays || 0}</span>
                                    </div>
                                    <div className="like-buttons">
                                        <button
                                            className={`like-btn ${userVote === 'like' ? 'liked' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleVote(set.id, 'like'); }}
                                            aria-label="Like"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
                                            </svg>
                                            <span>{stats.likes || 0}</span>
                                        </button>
                                        <button
                                            className={`like-btn ${userVote === 'dislike' ? 'disliked' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleVote(set.id, 'dislike'); }}
                                            aria-label="Dislike"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.34C17 5.05 15.95 4 14.66 4H6.55c-.7 0-1.36.37-1.72.97l-2.66 6.15z" />
                                            </svg>
                                            <span>{stats.dislikes || 0}</span>
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
