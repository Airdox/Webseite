import React, { useRef } from 'react';

// Format time helpers (mm:ss)
const formatTime = (time) => {
    if (!time && time !== 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const GlobalPlayerProgress = ({ currentTime, duration, seek, progressRef }) => {
    const isDraggingRef = useRef(false);

    const seekFromClientX = (clientX) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        seek(percentage * duration);
    };

    const handlePointerDown = (event) => {
        if (!duration) return;
        event.preventDefault();
        isDraggingRef.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        seekFromClientX(event.clientX);
    };

    const handlePointerMove = (event) => {
        if (!isDraggingRef.current) return;
        event.preventDefault();
        seekFromClientX(event.clientX);
    };

    const stopDragging = (event) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
    };

    const handleKeyDown = (event) => {
        if (!duration) return;
        const step = event.shiftKey ? 30 : 10;
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault();
            seek(Math.min(duration, currentTime + step));
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault();
            seek(Math.max(0, currentTime - step));
        } else if (event.key === 'Home') {
            event.preventDefault();
            seek(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            seek(duration);
        }
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="gp-center-area">
            <div className="gp-progress-container">
                <span className="gp-time">{formatTime(currentTime)}</span>

                <div
                    className="gp-progress-bar"
                    ref={progressRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={stopDragging}
                    onPointerCancel={stopDragging}
                    onKeyDown={handleKeyDown}
                    role="slider"
                    tabIndex={0}
                    aria-label="Playback progress"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration || 0)}
                    aria-valuenow={Math.round(currentTime || 0)}
                    aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                >
                    <div className="gp-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>

                <span className="gp-time">{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default GlobalPlayerProgress;
