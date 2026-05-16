import React from 'react';
import { t } from '../utils/i18n';

const GlobalPlayerControls = ({ isPlaying, togglePlay, previous, next }) => {
    return (
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
    );
};

export default GlobalPlayerControls;
