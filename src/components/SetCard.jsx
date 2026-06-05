import React, { useState, useRef, useEffect } from 'react';
import { CalendarCheck, Check, Share2 } from 'lucide-react';
import { getCurrentLocale, t } from '../utils/i18n';
import { buildSetAnchorId, buildSetShareUrl } from '../lib/set-links';
import { getSeekableTracks, parseTrackTimeToSeconds } from '../utils/timeUtils';
import { audienceEvents } from '../utils/audienceSignals';
import { dispatchWindowEvent, WINDOW_EVENTS } from '../utils/websiteContracts';
import { buildBookingDetail, copyToClipboard, formatSetDateLabel } from './setCardUtils';

const SetCard = ({
    set,
    index,
    isSetPlaying,
    isSetCurrent,
    currentTime,
    animationMode = 'billiard',
    stats,
    userVote,
    onPlayClick,
    onTrackClick,
    onAnimationModeChange,
    onVote
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const shareResetTimerRef = useRef(null);
    const dateLabel = formatSetDateLabel(set.date, getCurrentLocale());

    const seekableTracks = getSeekableTracks(set.tracks);

    const activeTrackIndex = isSetCurrent && seekableTracks.length
        ? seekableTracks.reduce((acc, track, i) => {
            const startTime = parseTrackTimeToSeconds(track.time);
            if (startTime !== null && currentTime >= startTime) return i;
            return acc;
        }, -1) 
        : -1;

    useEffect(() => () => {
        if (shareResetTimerRef.current) {
            window.clearTimeout(shareResetTimerRef.current);
        }
    }, []);

    const trackShare = (method) => {
        const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
        const eventData = {
            setId: set.id,
            setTitle: set.title,
            method
        };
        analytics?.trackEvent?.('set_share', eventData);
        analytics?.trackEvent?.('share', {
            ...eventData,
            source: 'set_card'
        });
        audienceEvents.shareClick({
            contentId: set.id,
            contentType: 'music_set',
            method,
            source: 'set_card',
            value: 1
        });
    };

    const handleShareSet = async (event) => {
        event.stopPropagation();
        const url = buildSetShareUrl(set.id);
        const payload = {
            title: `${set.title} | AIRDOX`,
            text: t('music.shareText'),
            url
        };

        const markShareCopied = () => {
            setIsCopied(true);
            if (shareResetTimerRef.current) window.clearTimeout(shareResetTimerRef.current);
            shareResetTimerRef.current = window.setTimeout(() => setIsCopied(false), 2200);
        };

        try {
            if (navigator.share && (!navigator.canShare || navigator.canShare(payload))) {
                await navigator.share(payload);
                trackShare('native');
                return;
            }
            await copyToClipboard(url);
            markShareCopied();
            trackShare('clipboard');
        } catch (err) {
            if (err?.name === 'AbortError') return;
            try {
                await copyToClipboard(url);
                markShareCopied();
                trackShare('clipboard_fallback');
            } catch {
                trackShare('share_failed');
            }
        }
    };

    const handleBookingIntent = (event) => {
        event.stopPropagation();
        const bookingDetail = buildBookingDetail(set, t('booking.prefillMessage'));
        const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
        analytics?.trackEvent?.('booking_intent', {
            setId: set.id,
            setTitle: set.title,
            source: 'set_card'
        });
        audienceEvents.bookingClick({
            contentId: set.id,
            contentType: 'music_set',
            source: 'set_card',
            value: 1
        });
        dispatchWindowEvent(WINDOW_EVENTS.bookingPrefill, bookingDetail);
        window.setTimeout(() => {
            document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    };

    const handleCoverKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPlayClick(set);
        }
    };
    const isTrainerMode = animationMode === 'trainer';

    const handleAnimationModeToggle = (event) => {
        event.stopPropagation();
        onAnimationModeChange?.(set.id, isTrainerMode ? 'billiard' : 'trainer');
    };

    return (
        <div
            id={buildSetAnchorId(set.id)}
            className={`set-card premium-card reveal-scale stagger-${Math.min(index + 1, 6)} ${isSetCurrent ? 'active' : ''} ${set.isChristmasGift ? 'christmas-highlight' : ''}`}
            data-set-id={set.id}
            data-animation-mode={animationMode}
        >
            <div
                className="set-cover"
                onClick={() => onPlayClick(set)}
                onKeyDown={handleCoverKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`${isSetPlaying ? t('music.pause') : t('music.play')} ${set.title}`}
            >
                <div
                    className={`cover-vinyl ${isSetPlaying && isTrainerMode ? 'trainer-vinyl' : ''}`}
                    style={{
                        '--vinyl-color': set.vinylColor || 'var(--neon-cyan)',
                        '--vinyl-index': index
                    }}
                >
                    <div className={`mini-vinyl ${isSetPlaying ? 'active-disc' : ''} ${isSetPlaying && isTrainerMode ? 'spinning-disc' : ''}`}>
                        {isSetPlaying ? (
                            <img
                                src={set.isChristmasGift ? "/assets/santa_vinyl.png" : (set.cover || "/assets/airdox-vinyl.jpg")}
                                alt={t('music.vinylAlt')}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
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
                {set.isChristmasGift && <span className="xmas-badge">🎄 {t('music.giftBadge')}</span>}
                {set.isNew && !set.isChristmasGift && <span className="new-badge">{t('music.newBadge')}</span>}

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

            </div>

            <div className="set-info">
                <h3 className="set-title">{set.title}</h3>
                <div className="set-meta">
                    <span className="set-date">{dateLabel}</span>
                    {set.duration && (
                        <>
                            <span className="set-meta-separator" aria-hidden="true">|</span>
                            <span className="set-duration">{set.duration}</span>
                        </>
                    )}
                </div>

                <div
                    className="animation-mode-control"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <span className="animation-mode-label">{t('music.animation.trainer')}</span>
                    <button
                        type="button"
                        className={`animation-mode-slider ${isTrainerMode ? 'trainer-selected' : 'billiard-selected'}`}
                        onClick={handleAnimationModeToggle}
                        role="switch"
                        aria-checked={!isTrainerMode}
                        aria-label={t('music.animation.label')}
                    >
                        <span className="sr-only">{t('music.animation.label')}</span>
                        <span className="animation-mode-track" aria-hidden="true">
                            <span className="animation-mode-thumb" />
                        </span>
                    </button>
                    <span className="animation-mode-label">{t('music.animation.billiard')}</span>
                </div>

                <div className="set-actions">
                    <button
                        type="button"
                        className={`set-share-btn ${isCopied ? 'copied' : ''}`}
                        onClick={handleShareSet}
                        aria-label={`${t('music.shareLabel')} ${set.title}`}
                    >
                        {isCopied ? (
                            <Check size={16} aria-hidden="true" />
                        ) : (
                            <Share2 size={16} aria-hidden="true" />
                        )}
                        <span>{isCopied ? t('music.shareCopied') : t('music.share')}</span>
                    </button>
                    <button
                        type="button"
                        className="set-booking-btn"
                        onClick={handleBookingIntent}
                        aria-label={`${t('music.bookingIntentLabel')} ${set.title}`}
                    >
                        <CalendarCheck size={16} aria-hidden="true" />
                        <span>{t('music.bookingIntent')}</span>
                    </button>

                </div>

                {seekableTracks.length > 0 && (
                    <div className={`vip-tracklist ${isCollapsed ? 'collapsed' : ''}`}>
                        <button
                            type="button"
                            className="tracklist-toggle"
                            onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                            aria-expanded={!isCollapsed}
                            aria-label={isCollapsed ? t('music.showTracklist') : t('music.hideTracklist')}
                        >
                            <h4 className="tracklist-title">{t('music.tracklist')}</h4>
                            <svg className={`tracklist-chevron ${isCollapsed ? 'chevron-collapsed' : ''}`} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                            </svg>
                        </button>
                        <ul className="tracklist-items">
                            {seekableTracks.map((track, idx) => (
                                <li
                                    key={idx}
                                    className={`tracklist-item ${idx === activeTrackIndex ? 'current-track' : ''}`}
                                    aria-current={idx === activeTrackIndex ? 'true' : undefined}
                                    onClick={(e) => { e.stopPropagation(); onTrackClick(set, track); }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTrackClick(set, track); } }}
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
                        onClick={(e) => { e.stopPropagation(); onVote(set.id, 'like'); }}
                        aria-label={`${t('music.likeLabel')} ${set.title}`}
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
                        onClick={(e) => { e.stopPropagation(); onVote(set.id, 'dislike'); }}
                        aria-label={`${t('music.dislikeLabel')} ${set.title}`}
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
};

export default SetCard;
