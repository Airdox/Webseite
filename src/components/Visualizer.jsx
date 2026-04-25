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

            // Calculate average frequency for pulsing effect
            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
            const pulse = (average / 255) * 0.15; // Max 15% pulse

            // Apply pulse to the body for an immersive feel
            document.body.style.backgroundColor = `rgba(0, ${pulse * 100}, ${pulse * 200}, 1)`;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height * 0.4;

                // Add some glow and transparency
                ctx.fillStyle = `rgba(${dataArray[i]}, 217, 255, ${dataArray[i] / 510})`;
                
                // Draw symmetrical bars from the bottom
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                // Subtile mirroring from top
                ctx.fillStyle = `rgba(255, 16, 240, ${dataArray[i] / 1020})`;
                ctx.fillRect(x, 0, barWidth, barHeight * 0.5);

                x += barWidth + 1;
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
