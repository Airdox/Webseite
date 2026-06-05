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
import {
    getStorageItem,
    readStorageJson,
    STORAGE_KEYS,
    WINDOW_EVENTS,
    writeStorageJson,
} from '../utils/websiteContracts';

const { publicSets } = partitionSetsByAccess(sets);

const readAnimationModes = () => readStorageJson(STORAGE_KEYS.setAnimationModes, {});

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
        return readStorageJson(STORAGE_KEYS.globalStats, {});
    });

    // Lokaler User Vote
    const [userVotes, setUserVotes] = useState(() => {
        return readStorageJson(STORAGE_KEYS.userVotes, {});
    });

    const sectionRef = useRef(null);
    useRevealOnScroll(sectionRef, '.reveal, .reveal-scale');

    useVinylAnimation(analyserRef, currentTrack, isPlaying, activeAnimationMode);

    const handleAnimationModeChange = (setId, mode) => {
        setAnimationModes((currentModes) => {
            const nextModes = { ...currentModes, [setId]: mode };
            writeStorageJson(STORAGE_KEYS.setAnimationModes, nextModes);
            return nextModes;
        });
    };

    // Sync bei Änderungen der globalen Stats (durch StatsSync oder andere Komponenten)
    useEffect(() => {
        const handleStatsUpdate = (e) => setGlobalStats(e.detail);
        window.addEventListener(WINDOW_EVENTS.statsUpdated, handleStatsUpdate);
        void statsSync.fetchAllStats();
        return () => window.removeEventListener(WINDOW_EVENTS.statsUpdated, handleStatsUpdate);
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
            writeStorageJson(STORAGE_KEYS.userVotes, newVotes);
        } else {
            if (currentVote) {
                statsSync.trackVote(setId, `un${currentVote}`);
            }

            const newVotes = { ...userVotes, [setId]: voteType };
            setUserVotes(newVotes);
            writeStorageJson(STORAGE_KEYS.userVotes, newVotes);
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

    const [isLoggedIn, setIsLoggedIn] = useState(!!getStorageItem(STORAGE_KEYS.authToken, ''));

    useEffect(() => {
        const checkLogin = () => setIsLoggedIn(!!getStorageItem(STORAGE_KEYS.authToken, ''));
        window.addEventListener(WINDOW_EVENTS.loginSuccess, checkLogin);
        window.addEventListener(WINDOW_EVENTS.logout, checkLogin);
        return () => {
            window.removeEventListener(WINDOW_EVENTS.loginSuccess, checkLogin);
            window.removeEventListener(WINDOW_EVENTS.logout, checkLogin);
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
