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
                const value = dataArray[i];
                const intensity = value / 255;
                const barHeight = intensity * canvas.height * 0.3;
                const bottomY = canvas.height;
                const topY = bottomY - barHeight;

                const barGradient = ctx.createLinearGradient(0, topY, 0, bottomY);
                barGradient.addColorStop(0, `rgba(255, 104, 208, ${0.22 + intensity * 0.45})`);
                barGradient.addColorStop(0.5, `rgba(0, 245, 255, ${0.2 + intensity * 0.55})`);
                barGradient.addColorStop(1, `rgba(144, 255, 203, ${0.16 + intensity * 0.5})`);

                ctx.fillStyle = barGradient;
                ctx.fillRect(x, topY, barWidth, barHeight);

                const mirrorHeight = barHeight * 0.35;
                const mirrorGradient = ctx.createLinearGradient(0, 0, 0, mirrorHeight);
                mirrorGradient.addColorStop(0, `rgba(186, 127, 255, ${0.05 + intensity * 0.2})`);
                mirrorGradient.addColorStop(1, `rgba(0, 245, 255, ${0.03 + intensity * 0.15})`);
                ctx.fillStyle = mirrorGradient;
                ctx.fillRect(x, 0, barWidth, mirrorHeight);

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
