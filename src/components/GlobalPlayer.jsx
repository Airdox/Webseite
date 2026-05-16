import React, { useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import GlobalPlayerTrackInfo from './GlobalPlayerTrackInfo';
import GlobalPlayerControls from './GlobalPlayerControls';
import GlobalPlayerProgress from './GlobalPlayerProgress';
import GlobalPlayerVolume from './GlobalPlayerVolume';
import './GlobalPlayer.css';

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

    return (
        <div
            className={`global-player ${isVisible ? 'visible' : 'hidden'}`}
            ref={playerRef}
            style={{
                visibility: isVisible ? 'visible' : 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            <GlobalPlayerTrackInfo currentTrack={currentTrack} />
            <GlobalPlayerControls isPlaying={isPlaying} togglePlay={togglePlay} previous={previous} next={next} />
            <GlobalPlayerProgress currentTime={currentTime} duration={duration} seek={seek} progressRef={progressRef} />
            <GlobalPlayerVolume volume={volume} changeVolume={changeVolume} />
        </div>
    );
};

export default GlobalPlayer;
