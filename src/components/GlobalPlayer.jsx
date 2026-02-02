import React, { useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './GlobalPlayer.css';

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
        isPlayerVisible,
        analyserRef,

    } = useAudio();

    const [showTracklist, setShowTracklist] = React.useState(false);

    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const progressRef = useRef(null);

    // Format time helpers (mm:ss)
    const formatTime = (time) => {
        if (!time && time !== 0) return "0:00";
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

    // Visualizer Loop
    useEffect(() => {
        if (!analyserRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Generate a pseudo-persistent waveform for the current track
        const waveformPoints = [];
        const generateWaveform = () => {
            waveformPoints.length = 0;
            const segments = 100;
            for (let i = 0; i < segments; i++) {
                // Persistent but "random" industrial look
                const val = 0.2 + Math.random() * 0.5;
                waveformPoints.push(val);
            }
        };
        generateWaveform();

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const width = canvas.width;
            const height = canvas.height;

            // 1. Draw Static Waveform Background
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
            ctx.lineWidth = 2;
            const step = width / (waveformPoints.length - 1);
            for (let i = 0; i < waveformPoints.length; i++) {
                const x = i * step;
                const y = height - (waveformPoints[i] * height * 0.6);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // 2. Draw Reactive Peaks (Foreground) if playing
            if (isPlaying) {
                analyser.getByteFrequencyData(dataArray);
                const barWidth = (width / bufferLength) * 2;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const value = dataArray[i];
                    const barHeight = (value / 255) * height * 0.8;

                    // Neon Cyan with glow
                    ctx.fillStyle = `rgba(0, 243, 255, ${0.3 + (value / 255) * 0.7})`;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(0, 243, 255, 0.5)';

                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    ctx.shadowBlur = 0; // Reset for next
                    x += barWidth + 2;
                }
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, analyserRef, currentTrack]);

    if (!currentTrack) return null;

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`global-player ${isPlayerVisible ? 'visible' : ''}`}>

            {/* Visualizer Background */}
            <canvas ref={canvasRef} className="gp-visualizer" width="900" height="100" />

            {/* Track Info */}
            <div className="gp-track-info">
                <div className="gp-track-title" title={currentTrack.title}>
                    {currentTrack.title}
                </div>
                <div className="gp-track-artist">
                    AIRDOX // RESIDENT DJ
                </div>
            </div>

            {/* Controls */}
            <div className="gp-controls">
                <button className="gp-btn" onClick={previous} title="Previous">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                </button>

                <button className="gp-btn play-pause" onClick={togglePlay}>
                    {isPlaying ? (
                        <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>

                <button className="gp-btn" onClick={next} title="Next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
            </div>

            {/* Center Area: Time & Progress */}
            <div className="gp-center-area">
                <div className="gp-progress-container">
                    <span className="gp-time">{formatTime(currentTime)}</span>

                    <div className="gp-progress-bar" ref={progressRef} onClick={handleProgressClick}>
                        <div className="gp-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>

                    <span className="gp-time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume */}
            <div className="gp-volume">
                <button className="gp-btn" onClick={() => changeVolume(volume === 0 ? 0.8 : 0)} style={{ padding: '4px', margin: 0 }}>
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
                />
            </div>

        </div>
    );
};

export default GlobalPlayer;
