import { useEffect, useRef } from 'react';

const useVinylAnimation = (analyserRef, currentTrack, isPlaying, animationMode = 'billiard') => {
    const billiardStateRef = useRef({
        x: 0,
        y: 0,
        vx: 140,
        vy: 118,
        maxX: 0,
        maxY: 0,
        trackKey: '',
        startTs: 0,
        lastTs: 0,
        lastChaosTs: 0
    });
    const billiardRafRef = useRef(null);
    const animatedVinylRef = useRef(null);
    const animatedDiscRef = useRef(null);
    const frequencyBufferRef = useRef(null);

    useEffect(() => {
        const clearAnimatedVinyl = () => {
            if (!animatedVinylRef.current) return;
            animatedVinylRef.current.style.removeProperty('--vinyl-bounce-x');
            animatedVinylRef.current.style.removeProperty('--vinyl-bounce-y');
            animatedVinylRef.current.style.removeProperty('--vinyl-billiard-size');
            animatedVinylRef.current.style.removeProperty('filter');
            animatedVinylRef.current = null;
        };

        const clearAnimatedDisc = () => {
            if (!animatedDiscRef.current) return;
            animatedDiscRef.current.style.removeProperty('transform');
            animatedDiscRef.current = null;
        };

        const clearAnimatedElements = () => {
            clearAnimatedVinyl();
            clearAnimatedDisc();
        };

        if (!isPlaying || !currentTrack?.id) {
            clearAnimatedElements();
            return undefined;
        }

        const prefersReducedMotion = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const motionScale = prefersReducedMotion ? 0.45 : 1;

        let disposed = false;
        const physics = billiardStateRef.current;
        const randomDirection = () => (Math.random() >= 0.5 ? 1 : -1);
        const clampVelocity = (value) => {
            const sign = value >= 0 ? 1 : -1;
            const magnitude = Math.max(74, Math.min(238, Math.abs(value)));
            return sign * magnitude;
        };
        const setVelocityFromAngle = (angle, speed) => {
            physics.vx = clampVelocity(Math.cos(angle) * speed);
            physics.vy = clampVelocity(Math.sin(angle) * speed);
        };
        const chooseChaoticAngle = (edge, energy) => {
            const minExit = 0.24;
            const maxExit = 1.33;
            const exit = minExit + (Math.random() * (maxExit - minExit));
            const audioBend = (energy - 0.35) * 0.55;
            const timeBend = Math.sin(performance.now() * 0.0047) * 0.22;
            const angle = Math.max(minExit, Math.min(maxExit, exit + audioBend + timeBend));

            if (edge === 'left') return (Math.random() >= 0.5 ? angle : -angle);
            if (edge === 'right') return Math.PI + (Math.random() >= 0.5 ? angle : -angle);
            if (edge === 'top') return (Math.PI / 2) + (Math.random() >= 0.5 ? angle : -angle);
            return (-Math.PI / 2) + (Math.random() >= 0.5 ? angle : -angle);
        };
        const bounceFromEdge = (edge, energy) => {
            const speed = Math.max(130, Math.min(290, Math.hypot(physics.vx, physics.vy) * (0.9 + Math.random() * 0.34 + energy * 0.22)));
            setVelocityFromAngle(chooseChaoticAngle(edge, energy), speed);
        };

        const findCurrentVinyl = () => {
            const cards = document.querySelectorAll('.set-card[data-set-id]');
            for (const card of cards) {
                if (card.dataset.setId !== String(currentTrack?.id)) continue;
                const cover = card.querySelector('.set-cover');
                const vinyl = card.querySelector('.cover-vinyl');
                const disc = card.querySelector('.mini-vinyl');
                if (!cover || !vinyl || !disc) return null;
                return { cover, vinyl, disc };
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

        if (animationMode === 'trainer') {
            clearAnimatedVinyl();
            const animateTrainer = (timestamp) => {
                if (disposed) return;

                const activeElements = findCurrentVinyl();
                if (!activeElements) {
                    billiardRafRef.current = requestAnimationFrame(animateTrainer);
                    return;
                }

                const { disc } = activeElements;
                if (animatedDiscRef.current && animatedDiscRef.current !== disc) {
                    animatedDiscRef.current.style.removeProperty('transform');
                }
                animatedDiscRef.current = disc;

                const energy = readAudioEnergy();
                const rotation = (timestamp * (0.12 + energy * 0.18) * motionScale) % 360;
                disc.style.transform = `rotate(${rotation.toFixed(2)}deg)`;
                billiardRafRef.current = requestAnimationFrame(animateTrainer);
            };

            billiardRafRef.current = requestAnimationFrame(animateTrainer);

            return () => {
                disposed = true;
                if (billiardRafRef.current) {
                    cancelAnimationFrame(billiardRafRef.current);
                    billiardRafRef.current = null;
                }
                clearAnimatedDisc();
            };
        }

        if (animationMode !== 'billiard') {
            clearAnimatedElements();
            return undefined;
        }

        clearAnimatedDisc();

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
                animatedVinylRef.current.style.removeProperty('--vinyl-billiard-size');
                animatedVinylRef.current.style.removeProperty('filter');
            }
            animatedVinylRef.current = vinyl;

            const trackKey = String(currentTrack?.id);
            const isNewTrack = physics.trackKey !== trackKey;
            if (isNewTrack) {
                physics.trackKey = trackKey;
                physics.startTs = timestamp;
                physics.vx = 140 * randomDirection();
                physics.vy = 118 * randomDirection();
                physics.lastTs = timestamp;
            }

            const elapsedSec = Math.max(0, (timestamp - (physics.startTs || timestamp)) / 1000);
            const cycleProgress = (elapsedSec % 20) / 20;
            const triangularProgress = cycleProgress < 0.5
                ? cycleProgress * 2
                : (1 - cycleProgress) * 2;
            const easedGrowth = 0.5 - (Math.cos(triangularProgress * Math.PI) / 2);
            const pulseSize = Math.sin(elapsedSec * 1.45) * 3;
            const targetSize = Math.max(18, Math.min(82, 18 + (easedGrowth * 58) + pulseSize));
            vinyl.style.setProperty('--vinyl-billiard-size', `${targetSize.toFixed(2)}%`);

            const coverRect = cover.getBoundingClientRect();
            const vinylRect = vinyl.getBoundingClientRect();
            const maxX = Math.max(0, coverRect.width - vinylRect.width);
            const maxY = Math.max(0, coverRect.height - vinylRect.height);

            const hasInitialBounds = physics.maxX > 0 || physics.maxY > 0;
            const boundsChanged = Math.abs(physics.maxX - maxX) > 0.5 || Math.abs(physics.maxY - maxY) > 0.5;
            if (isNewTrack || !hasInitialBounds) {
                physics.x = maxX / 2;
                physics.y = maxY / 2;
            } else if (boundsChanged) {
                physics.x = Math.max(0, Math.min(maxX, physics.x));
                physics.y = Math.max(0, Math.min(maxY, physics.y));
            }
            physics.maxX = maxX;
            physics.maxY = maxY;

            if (!physics.lastTs) {
                physics.lastTs = timestamp;
            }
            const deltaSec = Math.min(0.05, Math.max(0.008, (timestamp - physics.lastTs) / 1000));
            physics.lastTs = timestamp;

            const energy = readAudioEnergy();
            const speedFactor = (0.85 + (energy * 1.7)) * motionScale;
            if (timestamp - (physics.lastChaosTs || 0) > 850) {
                const drift = (Math.random() - 0.5) * (22 + energy * 34);
                physics.vx = clampVelocity(physics.vx + drift);
                physics.vy = clampVelocity(physics.vy - (drift * (0.35 + Math.random() * 0.5)));
                physics.lastChaosTs = timestamp;
            }
            physics.x += physics.vx * speedFactor * deltaSec;
            physics.y += physics.vy * speedFactor * deltaSec;

            if (physics.x <= 0) {
                physics.x = 0;
                bounceFromEdge('left', energy);
            } else if (physics.x >= maxX) {
                physics.x = maxX;
                bounceFromEdge('right', energy);
            }

            if (physics.y <= 0) {
                physics.y = 0;
                bounceFromEdge('top', energy);
            } else if (physics.y >= maxY) {
                physics.y = maxY;
                bounceFromEdge('bottom', energy);
            }

            const offsetX = physics.x - (maxX / 2);
            const offsetY = physics.y - (maxY / 2);
            vinyl.style.setProperty('--vinyl-bounce-x', `${offsetX.toFixed(2)}px`);
            vinyl.style.setProperty('--vinyl-bounce-y', `${offsetY.toFixed(2)}px`);

            // Beat-reactive color inversion
            const hueShift = Math.round(energy * 360);
            const invertAmount = energy > 0.55 ? ((energy - 0.55) / 0.45).toFixed(2) : 0;
            vinyl.style.setProperty('filter',
                `hue-rotate(${hueShift}deg) invert(${invertAmount})`);

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
    }, [analyserRef, currentTrack?.id, isPlaying, animationMode]);
};

export default useVinylAnimation;
