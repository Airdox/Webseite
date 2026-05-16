import React from 'react';

// Format time helpers (mm:ss)
const formatTime = (time) => {
    if (!time && time !== 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const GlobalPlayerProgress = ({ currentTime, duration, seek, progressRef }) => {
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
        <div className="gp-center-area">
            <div className="gp-progress-container">
                <span className="gp-time">{formatTime(currentTime)}</span>

                <div className="gp-progress-bar" ref={progressRef} onClick={handleProgressClick}>
                    <div className="gp-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>

                <span className="gp-time">{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default GlobalPlayerProgress;
