import React, { useRef, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import './Visualizer.css';

const Visualizer = () => {
    const canvasRef = useRef(null);
    const { analyserRef, isPlaying } = useAudio();
    const animationRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            animationRef.current = requestAnimationFrame(render);

            if (!isPlaying || !analyserRef.current) {
                // Fading effect when paused
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                return;
            }

            const analyser = analyserRef.current;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 3;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height * 0.3;
                
                // Unified Cyan Glow for the bottom bars
                const opacity = (dataArray[i] / 255) * 0.3;
                ctx.fillStyle = `rgba(0, 245, 255, ${opacity})`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                // Subtile Pink Mirror
                ctx.fillStyle = `rgba(255, 0, 170, ${opacity * 0.5})`;
                ctx.fillRect(x, 0, barWidth, barHeight * 0.3);

                x += barWidth + 2;
            }
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [analyserRef, isPlaying]);

    return (
        <canvas 
            ref={canvasRef} 
            className={`global-visualizer ${isPlaying ? 'active' : ''}`}
        />
    );
};

export default Visualizer;
