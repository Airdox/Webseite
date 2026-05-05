import { useEffect, useRef } from 'react';

const useVinylAnimation = (analyserRef, currentTrack, isPlaying) => {
    const billiardStateRef = useRef({
        x: 0,
        y: 0,
        vx: 140,
        vy: 118,
        maxX: 0,
        maxY: 0,
        trackKey: '',
        lastTs: 0
    });
    const billiardRafRef = useRef(null);
    const animatedVinylRef = useRef(null);
    const frequencyBufferRef = useRef(null);

    useEffect(() => {
        const clearAnimatedVinyl = () => {
            if (!animatedVinylRef.current) return;
            animatedVinylRef.current.style.removeProperty('--vinyl-bounce-x');
            animatedVinylRef.current.style.removeProperty('--vinyl-bounce-y');
            animatedVinylRef.current = null;
        };

        if (!isPlaying || !currentTrack?.id) {
            clearAnimatedVinyl();
            return undefined;
        }

        const prefersReducedMotion = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            clearAnimatedVinyl();
            return undefined;
        }

        let disposed = false;
        const physics = billiardStateRef.current;
        const randomDirection = () => (Math.random() >= 0.5 ? 1 : -1);

        const findCurrentVinyl = () => {
            const cards = document.querySelectorAll('.set-card[data-set-id]');
            for (const card of cards) {
                if (card.dataset.setId !== String(currentTrack?.id)) continue;
                const cover = card.querySelector('.set-cover');
                const vinyl = card.querySelector('.cover-vinyl');
                if (!cover || !vinyl) return null;
                return { cover, vinyl };
            }
            return null;
        };

        const readAudioEnergy = () => {
            const analyser = analyserRef?.current;
            if (!analyser) return 0.35;
            if (!frequencyBufferRef.current || frequencyBufferRef.current.length !== analyser.frequencyBinCount) {
                frequencyBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
            }
            const frequencyBuffer = frequencyBufferRef.current;
            analyser.getByteFrequencyData(frequencyBuffer);
            const binsToRead = Math.min(frequencyBuffer.length, 48);
            if (!binsToRead) return 0.35;
            let sum = 0;
            for (let i = 0; i < binsToRead; i += 1) {
                sum += frequencyBuffer[i];
            }
            return sum / (binsToRead * 255);
        };

        const animate = (timestamp) => {
            if (disposed) return;

            const activeElements = findCurrentVinyl();
            if (!activeElements) {
                billiardRafRef.current = requestAnimationFrame(animate);
                return;
            }

            const { cover, vinyl } = activeElements;
            if (animatedVinylRef.current && animatedVinylRef.current !== vinyl) {
                animatedVinylRef.current.style.removeProperty('--vinyl-bounce-x');
                animatedVinylRef.current.style.removeProperty('--vinyl-bounce-y');
            }
            animatedVinylRef.current = vinyl;

            const coverRect = cover.getBoundingClientRect();
            const vinylRect = vinyl.getBoundingClientRect();
            const maxX = Math.max(0, coverRect.width - vinylRect.width);
            const maxY = Math.max(0, coverRect.height - vinylRect.height);
            const trackKey = String(currentTrack?.id);

            const hasViewportChange = Math.abs(physics.maxX - maxX) > 0.5 || Math.abs(physics.maxY - maxY) > 0.5;
            if (physics.trackKey !== trackKey || hasViewportChange) {
                physics.trackKey = trackKey;
                physics.maxX = maxX;
                physics.maxY = maxY;
                physics.x = maxX / 2;
                physics.y = maxY / 2;
                physics.vx = 140 * randomDirection();
                physics.vy = 118 * randomDirection();
                physics.lastTs = timestamp;
            }

            if (!physics.lastTs) {
                physics.lastTs = timestamp;
            }
            const deltaSec = Math.min(0.05, Math.max(0.008, (timestamp - physics.lastTs) / 1000));
            physics.lastTs = timestamp;

            const energy = readAudioEnergy();
            const speedFactor = 0.85 + (energy * 1.7);
            physics.x += physics.vx * speedFactor * deltaSec;
            physics.y += physics.vy * speedFactor * deltaSec;

            if (physics.x <= 0) {
                physics.x = 0;
                physics.vx = Math.abs(physics.vx);
            } else if (physics.x >= maxX) {
                physics.x = maxX;
                physics.vx = -Math.abs(physics.vx);
            }

            if (physics.y <= 0) {
                physics.y = 0;
                physics.vy = Math.abs(physics.vy);
            } else if (physics.y >= maxY) {
                physics.y = maxY;
                physics.vy = -Math.abs(physics.vy);
            }

            const offsetX = physics.x - (maxX / 2);
            const offsetY = physics.y - (maxY / 2);
            vinyl.style.setProperty('--vinyl-bounce-x', `${offsetX.toFixed(2)}px`);
            vinyl.style.setProperty('--vinyl-bounce-y', `${offsetY.toFixed(2)}px`);

            billiardRafRef.current = requestAnimationFrame(animate);
        };

        billiardRafRef.current = requestAnimationFrame(animate);

        return () => {
            disposed = true;
            if (billiardRafRef.current) {
                cancelAnimationFrame(billiardRafRef.current);
                billiardRafRef.current = null;
            }
            physics.lastTs = 0;
            clearAnimatedVinyl();
        };
    }, [analyserRef, currentTrack?.id, isPlaying]);
};

export default useVinylAnimation;
