import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './MusicSection.css';
import { t } from '../utils/i18n';

import { sets } from '../data/musicSets';
import { partitionSetsByAccess } from '../lib/set-access';
import { scrollToSetHash } from '../lib/set-links';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import { statsSync } from '../utils/stats-sync';
import { audienceEvents } from '../utils/audienceSignals';
import { requireApiJson } from '../utils/apiClient';
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
const FEATURED_SET_ID = 'recording_2026_05_24';

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
    const [playedSetIds, setPlayedSetIds] = useState(() => new Set());
    const [engagementEmail, setEngagementEmail] = useState('');
    const [engagementStatus, setEngagementStatus] = useState('idle');
    const [engagementMessage, setEngagementMessage] = useState('');
    const activeAnimationMode = animationModes[currentTrack?.id] || 'billiard';
    const featuredSet = publicSets.find((set) => set.id === FEATURED_SET_ID) || publicSets[0];
    const shouldShowEngagementCapture = playedSetIds.size > 0 && engagementStatus !== 'success';

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
            setPlayedSetIds((current) => {
                const next = new Set(current);
                next.add(set.id);
                return next;
            });
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

    const handleFeaturedPlay = () => {
        if (!featuredSet) return;
        audienceEvents.ctaView({
            contentId: featuredSet.id,
            contentType: 'music_set',
            source: 'music_featured_cta',
            value: 1
        });
        handlePlayClick(featuredSet);
    };

    const handleFeaturedBooking = () => {
        if (!featuredSet) return;
        const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
        analytics?.trackEvent?.('booking_intent', {
            setId: featuredSet.id,
            setTitle: featuredSet.title,
            source: 'music_featured_cta'
        });
        audienceEvents.bookingClick({
            contentId: featuredSet.id,
            contentType: 'music_set',
            source: 'music_featured_cta',
            value: 1
        });
        window.dispatchEvent(new CustomEvent(WINDOW_EVENTS.bookingPrefill, {
            detail: {
                setId: featuredSet.id,
                setTitle: featuredSet.title,
                source: 'music_featured_cta',
                event: `AIRDOX Booking - ${featuredSet.title}`,
                message: t('booking.prefillMessage').replace('{setTitle}', featuredSet.title)
            }
        }));
        window.setTimeout(() => {
            document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const handleEngagementSubscribe = async (event) => {
        event.preventDefault();
        if (!engagementEmail) return;

        setEngagementStatus('loading');
        setEngagementMessage('');
        const sourceSetId = currentTrack?.id || [...playedSetIds][0] || featuredSet?.id;

        try {
            await requireApiJson('/api/subscribe', {
                method: 'POST',
                body: { email: engagementEmail }
            }, t('newsletter.subscriptionFailed'));

            setEngagementStatus('success');
            setEngagementMessage(t('music.engagementNewsletter.success'));
            setEngagementEmail('');
            window.airdoxAnalyticsV2?.trackEvent('newsletter_subscribe', {
                status: 'success',
                source: 'music_engagement_capture',
                setId: sourceSetId
            });
            audienceEvents.newsletterSignup({
                contentId: sourceSetId,
                contentType: 'music_set',
                source: 'music_engagement_capture',
                value: 1
            });
        } catch (error) {
            setEngagementStatus('error');
            setEngagementMessage(error.message || t('newsletter.error'));
            window.airdoxAnalyticsV2?.trackEvent('newsletter_subscribe', {
                status: 'error',
                source: 'music_engagement_capture',
                error: error.message
            });
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

                {featuredSet && (
                    <div className="music-featured-cta reveal">
                        <div>
                            <span className="music-featured-label">{t('music.featured.label')}</span>
                            <h3>{t('music.featured.title')}</h3>
                            <p>{t('music.featured.body').replace('{setTitle}', featuredSet.title)}</p>
                        </div>
                        <div className="music-featured-actions">
                            <button type="button" className="btn btn-primary interactive" onClick={handleFeaturedPlay}>
                                {t('music.featured.play')}
                            </button>
                            <button type="button" className="btn btn-secondary interactive" onClick={handleFeaturedBooking}>
                                {t('music.featured.booking')}
                            </button>
                        </div>
                    </div>
                )}

                {shouldShowEngagementCapture && (
                    <form className="music-engagement-capture reveal" onSubmit={handleEngagementSubscribe}>
                        <div>
                            <span className="music-featured-label">{t('music.engagementNewsletter.label')}</span>
                            <strong>{t('music.engagementNewsletter.title')}</strong>
                            <p>{t('music.engagementNewsletter.body')}</p>
                        </div>
                        <div className="music-engagement-form">
                            <input
                                type="email"
                                value={engagementEmail}
                                onChange={(event) => setEngagementEmail(event.target.value)}
                                placeholder={t('newsletter.emailPlaceholder')}
                                disabled={engagementStatus === 'loading'}
                                required
                            />
                            <button type="submit" className="btn btn-primary" disabled={engagementStatus === 'loading'}>
                                {engagementStatus === 'loading' ? t('newsletter.submitting') : t('newsletter.subscribe')}
                            </button>
                        </div>
                        {engagementStatus !== 'idle' && (
                            <p className={`music-engagement-status ${engagementStatus}`}>{engagementMessage}</p>
                        )}
                    </form>
                )}

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
