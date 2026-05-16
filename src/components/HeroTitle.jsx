import React, { useState, useEffect, useRef } from 'react';

const HeroTitle = ({ title, loaded }) => {
    const [snakeIndex, setSnakeIndex] = useState(-1);
    const titleRef = useRef(null);

    useEffect(() => {
        if (!loaded) return;

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const titleEl = titleRef.current;
        const cs = titleEl ? window.getComputedStyle(titleEl) : null;
        const readSeconds = (name, fallback) => {
            if (!cs) return fallback;
            const raw = cs.getPropertyValue(name);
            const n = parseFloat(raw);
            return Number.isFinite(n) ? n : fallback;
        };

        const revealDelay = readSeconds('--title-reveal-delay', 0.15);
        const stagger = readSeconds('--title-stagger', 0.12);
        const revealDuration = readSeconds('--title-reveal-duration', 0.9);
        const snakeCycle = readSeconds('--snake-cycle', 2.8);

        const startAfterAllReveal = revealDelay + revealDuration + ((title.length - 1) * stagger) + 0.15;
        const startMs = Math.max(0, Math.round(startAfterAllReveal * 1000));
        
        const stepMs = Math.round(snakeCycle * 1000);

        let intervalId = null;
        const startId = window.setTimeout(() => {
            setSnakeIndex(0);
            intervalId = window.setInterval(() => {
                setSnakeIndex(prev => (prev + 1) % title.length);
            }, stepMs);
        }, startMs);

        return () => {
            window.clearTimeout(startId);
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [title, loaded]);

    return (
        <h1 className="hero-title" ref={titleRef} style={{ '--title-letter-count': title.length }}>
            <span className="title-shadow" aria-hidden="true">{title}</span>

            <div className="title-snake-container">
                {title.split('').map((letter, i) => (
                    <div key={i} className="snake-letter-wrapper" style={{ '--i': i }}>
                        <svg className="letter-svg" viewBox="0 0 160 220">
                            <defs>
                                <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="50%" stopColor="var(--neon-cyan)" />
                                    <stop offset="100%" stopColor="var(--neon-pink)" />
                                </linearGradient>
                                <linearGradient id={`grad-snake-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="50%" stopColor="var(--neon-pink)" />
                                    <stop offset="100%" stopColor="var(--neon-cyan)" />
                                </linearGradient>
                                <mask
                                    id={`mask-snake-out-${i}`}
                                    maskUnits="userSpaceOnUse"
                                    maskContentUnits="userSpaceOnUse"
                                    x="-40"
                                    y="-40"
                                    width="240"
                                    height="320"
                                >
                                    <rect x="-40" y="-40" width="240" height="320" fill="#ffffff" />
                                    <text x="80" y="176" textAnchor="middle" className="letter-fill" fill="#000000">
                                        {letter}
                                    </text>
                                </mask>
                            </defs>
                            <text
                                x="80"
                                y="176"
                                textAnchor="middle"
                                className="letter-stroke"
                            >
                                {letter}
                            </text>
                            <text
                                x="80"
                                y="176"
                                textAnchor="middle"
                                fill={`url(#grad-${i})`}
                                className="letter-fill"
                            >
                                {letter}
                            </text>
                            <text
                                x="80"
                                y="176"
                                textAnchor="middle"
                                className={`letter-snake${snakeIndex === i ? ' is-active' : ''}`}
                                mask={`url(#mask-snake-out-${i})`}
                                stroke={`url(#grad-snake-${i})`}
                                pathLength="1000"
                            >
                                {letter}
                            </text>
                        </svg>
                    </div>
                ))}
            </div>

            <span className="title-glow" aria-hidden="true">{title}</span>
            <span className="glitch glitch-1" aria-hidden="true">{title}</span>
            <span className="glitch glitch-2" aria-hidden="true">{title}</span>
        </h1>
    );
};

export default HeroTitle;
