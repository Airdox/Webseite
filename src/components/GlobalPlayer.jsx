import React, { useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './GlobalPlayer.css';
import { t } from '../utils/i18n';

const devLog = (...args) => {
    if (import.meta.env?.DEV) console.log(...args);
};

const GlobalPlayer = () => {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        next,
        previous,
        currentTime,
        duration,
        seek,
        volume,
        changeVolume,
    } = useAudio();

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input, textarea or select
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seek(Math.min(duration, currentTime + 10));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seek(Math.max(0, currentTime - 10));
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seek, currentTime, duration]);

    const progressRef = useRef(null);
    const playerRef = useRef(null);
    const isVisible = !!currentTrack;

    // Force re-paint on track change using advanced hardware acceleration triggers
    useEffect(() => {
        if (isVisible && playerRef.current) {
            const el = playerRef.current;

            // Phase 1: Minimal shift to trigger compositor update
            el.setAttribute('data-rendering', 'true');

            // Phase 2: Force reflow & second frame update
            requestAnimationFrame(() => {
                // Changing a property that forces a composite layer rebuild
                el.style.opacity = '0.999';

                requestAnimationFrame(() => {
                    el.style.opacity = '1';
                    el.removeAttribute('data-rendering');
                    devLog('Hard-Repaint triggered for track:', currentTrack?.id);
                });
            });
        }
    }, [currentTrack?.id, isVisible]);

    // Format time helpers (mm:ss)
    const formatTime = (time) => {
        if (!time && time !== 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Seek handler
    const handleProgressClick = (e) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        seek(percentage * duration);
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={`global-player ${isVisible ? 'visible' : 'hidden'}`}
            ref={playerRef}
            style={{
                visibility: isVisible ? 'visible' : 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            {/* Track Info */}
            <div className="gp-track-info">
                <div className="gp-track-title" title={currentTrack?.title || ''}>
                    {currentTrack?.title || t('player.noTrack')}
                </div>
                <div className="gp-track-artist">
                    {t('player.artistLabel')}
                </div>
            </div>

            {/* Controls */}
            <div className="gp-controls">
                <button className="gp-btn" onClick={previous} title={t('player.previous')} aria-label={t('player.previous')}>
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                </button>

                <button className="gp-btn play-pause" onClick={togglePlay} aria-label={isPlaying ? t('player.pause') : t('player.play')}>
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>

                <button className="gp-btn" onClick={next} title={t('player.next')} aria-label={t('player.next')}>
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
            </div>

            {/* Center Area: Time & Progress */}
            <div className="gp-center-area">
                <div className="gp-progress-container">
                    <span className="gp-time">{formatTime(currentTime)}</span>

                    <div className="gp-progress-bar" ref={progressRef} onClick={handleProgressClick}>
                        <div className="gp-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <span className="gp-time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume */}
            <div className="gp-volume">
                <button className="gp-btn" onClick={() => changeVolume(volume === 0 ? 0.8 : 0)} style={{ padding: '4px', margin: 0 }} aria-label={volume === 0 ? t('player.unmute') : t('player.mute')}>
                    {volume === 0 ? (
                        <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                    )}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    aria-label={t('player.volume')}
                />
            </div>
        </div>
    );
};

export default GlobalPlayer;
