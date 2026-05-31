import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './MusicSection.css';
import { t } from '../utils/i18n';

import { sets } from '../data/musicSets';
import { partitionSetsByAccess } from '../lib/set-access';
import { scrollToSetHash } from '../lib/set-links';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import { statsSync } from '../utils/stats-sync';
import useVinylAnimation from '../hooks/useVinylAnimation';
import SetCard from './SetCard';
import { parseTrackTimeToSeconds } from '../utils/timeUtils';

const { publicSets } = partitionSetsByAccess(sets);
const ANIMATION_MODE_STORAGE_KEY = 'airdox_set_animation_modes';

const readAnimationModes = () => {
    try {
        return JSON.parse(localStorage.getItem(ANIMATION_MODE_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const MusicSection = () => {
    const {
        analyserRef,
        currentTrack,
        isPlaying,
        currentTime,
        playTrack,
        togglePlay,
        seek,
        setPlaylist
    } = useAudio();
    const [animationModes, setAnimationModes] = useState(readAnimationModes);
    const activeAnimationMode = animationModes[currentTrack?.id] || 'billiard';

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
    useRevealOnScroll(sectionRef, '.reveal, .reveal-scale');

    useVinylAnimation(analyserRef, currentTrack, isPlaying, activeAnimationMode);

    const handleAnimationModeChange = (setId, mode) => {
        setAnimationModes((currentModes) => {
            const nextModes = { ...currentModes, [setId]: mode };
            localStorage.setItem(ANIMATION_MODE_STORAGE_KEY, JSON.stringify(nextModes));
            return nextModes;
        });
    };

    // Sync bei Änderungen der globalen Stats (durch StatsSync oder andere Komponenten)
    useEffect(() => {
        const handleStatsUpdate = (e) => setGlobalStats(e.detail);
        window.addEventListener('airdox_stats_updated', handleStatsUpdate);
        void statsSync.fetchAllStats();
        return () => window.removeEventListener('airdox_stats_updated', handleStatsUpdate);
    }, []);

    useEffect(() => {
        setPlaylist(publicSets);
    }, [setPlaylist]);

    useEffect(() => {
        const scrollToHashSet = (behavior = 'smooth') => {
            scrollToSetHash({ behavior });
        };
        const handleHashChange = () => scrollToHashSet('smooth');

        const timerIds = [
            window.setTimeout(() => scrollToHashSet('auto'), 120),
            window.setTimeout(() => scrollToHashSet('smooth'), 700)
        ];
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            timerIds.forEach((timerId) => window.clearTimeout(timerId));
            window.removeEventListener('hashchange', handleHashChange);
        };
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
            playTrack(set, true, timeInSeconds);
        } else {
            seek(timeInSeconds);
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
                    {publicSets.map((set, index) => {
                        const stats = getSetStats(set.id);
                        const userVote = getUserVote(set.id);
                        const isSetPlaying = currentTrack?.id === set.id && isPlaying;
                        const isSetCurrent = currentTrack?.id === set.id;

                        return (
                            <SetCard
                                key={set.id}
                                set={set}
                                index={index}
                                isSetPlaying={isSetPlaying}
                                isSetCurrent={isSetCurrent}
                                currentTime={currentTime}
                                animationMode={animationModes[set.id] || 'billiard'}
                                stats={stats}
                                userVote={userVote}
                                isLoggedIn={isLoggedIn}
                                onPlayClick={handlePlayClick}
                                onTrackClick={handleTrackClick}
                                onAnimationModeChange={handleAnimationModeChange}
                                onVote={handleVote}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default MusicSection;
