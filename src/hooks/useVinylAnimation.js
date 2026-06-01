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
        lastTs: 0
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
        const wallRestitution = 1;
        const randomDirection = () => (Math.random() >= 0.5 ? 1 : -1);
        const reflectWithinBounds = (position, velocity, max) => {
            if (max <= 0) return { position: 0, velocity };

            let reflectedPosition = position;
            let reflectedVelocity = velocity;

            for (let i = 0; i < 4 && (reflectedPosition < 0 || reflectedPosition > max); i += 1) {
                if (reflectedPosition < 0) {
                    reflectedPosition = -reflectedPosition;
                    reflectedVelocity = Math.abs(reflectedVelocity) * wallRestitution;
                } else if (reflectedPosition > max) {
                    reflectedPosition = max - (reflectedPosition - max);
                    reflectedVelocity = -Math.abs(reflectedVelocity) * wallRestitution;
                }
            }

            return {
                position: Math.max(0, Math.min(max, reflectedPosition)),
                velocity: reflectedVelocity
            };
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
                const launchAngle = 0.62;
                const launchSpeed = 190;
                physics.vx = Math.cos(launchAngle) * launchSpeed * randomDirection();
                physics.vy = Math.sin(launchAngle) * launchSpeed * randomDirection();
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
            physics.x += physics.vx * speedFactor * deltaSec;
            physics.y += physics.vy * speedFactor * deltaSec;

            const reflectedX = reflectWithinBounds(physics.x, physics.vx, maxX);
            const reflectedY = reflectWithinBounds(physics.y, physics.vy, maxY);
            physics.x = reflectedX.position;
            physics.y = reflectedY.position;
            physics.vx = reflectedX.velocity;
            physics.vy = reflectedY.velocity;

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
