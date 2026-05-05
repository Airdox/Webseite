import React, { useEffect, useState, useRef } from 'react';
// Cache bust: 2024-12-31 v3
import Magnetic from './Magnetic';
import SocialLinks from './SocialLinks';
import useCustomCursor from '../hooks/useCustomCursor';
import './Hero.css';
import { t } from '../utils/i18n';

const GLITCH_BLOCKS = Array.from({ length: 15 }).map((_, i) => {
    const isVertical = Math.random() > 0.7;
    return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * -500, // Depth into the screen
        w: isVertical ? (Math.random() * 3 + 2) : (Math.random() * 160 + 40),
        h: isVertical ? (Math.random() * 160 + 40) : (Math.random() * 3 + 2),
        delay: Math.random() * 15,
        duration: Math.random() * 8 + 8,
        isGlow: i % 4 === 0,
    };
});

const Hero = () => {
    const [loaded, setLoaded] = useState(false);
    const [snakeIndex, setSnakeIndex] = useState(-1);
    const heroRef = useRef(null);
    const bgRef = useRef(null); // Ref for background parallax

    const { cursorRef, cursorOuterRef, glowRef } = useCustomCursor();

    const TITLE = 'AIRDOX';
    const reachSignals = [
        { label: t('hero.proof.latest.label'), value: t('hero.proof.latest.value') },
        { label: t('hero.proof.tracklists.label'), value: t('hero.proof.tracklists.value') },
        { label: t('hero.proof.booking.label'), value: t('hero.proof.booking.value') }
    ];

    const getScrollBehavior = () => (
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth'
    );

    const trackHero = (label) => {
        const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
        if (analytics?.trackInteraction) {
            analytics.trackInteraction(label, 'hero', 'click');
        }
    };

    const scrollToSection = (id, label) => {
        if (label) trackHero(label);
        document.getElementById(id)?.scrollIntoView({ behavior: getScrollBehavior() });
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 100);

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            return () => clearTimeout(timer);
        }

        let rafId = null;
        const handleScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (bgRef.current) {
                    const scrolled = window.scrollY;
                    bgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    // Sequential snake: run the outline animation per letter, one after another (not all at once).
    useEffect(() => {
        if (!loaded) return;

        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const titleEl = heroRef.current?.querySelector('.hero-title');
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

        const startAfterAllReveal = revealDelay + revealDuration + ((TITLE.length - 1) * stagger) + 0.15;
        const startMs = Math.max(0, Math.round(startAfterAllReveal * 1000));
        
        // Exakte Synchronisation: stepMs entspricht auf die Millisekunde genau snakeCycle
        const stepMs = Math.round(snakeCycle * 1000);

        let intervalId = null;
        const startId = window.setTimeout(() => {
            setSnakeIndex(0);
            intervalId = window.setInterval(() => {
                setSnakeIndex(prev => (prev + 1) % TITLE.length);
            }, stepMs);
        }, startMs);

        return () => {
            window.clearTimeout(startId);
            if (intervalId) window.clearInterval(intervalId);
        };
    }, [TITLE, loaded]);

    return (
        <section className="hero" id="home" ref={heroRef} data-version="0.1.1">
            {/* Custom Cursor */}
            <div ref={cursorRef} className="cursor-dot"></div>
            <div ref={cursorOuterRef} className="cursor-ring"></div>

            {/* Cursor Glow */}
            <div ref={glowRef} className="cursor-glow"></div>

            {/* Animated Background Layers */}
            <div className="hero-bg" ref={bgRef}>
                {/* Gradient Orbs */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>

                {/* Grid */}
                <div className="cyber-grid"></div>

                {/* Scan Lines */}
                <div className="scan-lines"></div>

                {/* Noise Texture */}
                <div className="noise"></div>
            </div>

            {/* Random 3D Glitch Blocks */}
            <div className="particles-container">
                {GLITCH_BLOCKS.map((block) => (
                    <div
                        key={block.id}
                        className={`glitch-block ${block.isGlow ? 'glitch-glow' : ''}`}
                        style={{
                            left: `${block.x}%`,
                            top: `${block.y}%`,
                            width: `${block.w}px`,
                            height: `${block.h}px`,
                            '--z': `${block.z}px`,
                            '--delay': `${block.delay}s`,
                            '--duration': `${block.duration}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Main Content */}
            <div className={`hero-content ${loaded ? 'loaded' : ''}`}>
                {/* Pre-title Badge */}
                <div className="hero-badge">
                    <span className="badge-dot"></span>
                    <span className="badge-text">{t('hero.badge')}</span>
                </div>

                {/* Main Title */}
                <h1 className="hero-title" style={{ '--title-letter-count': TITLE.length }}>
                    <span className="title-shadow" aria-hidden="true">{TITLE}</span>

                    <div className="title-snake-container">
                        {TITLE.split('').map((letter, i) => (
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
                                        {/* Show the snake only OUTSIDE the letter shape */}
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

                    <span className="title-glow" aria-hidden="true">{TITLE}</span>
                    <span className="glitch glitch-1" aria-hidden="true">{TITLE}</span>
                    <span className="glitch glitch-2" aria-hidden="true">{TITLE}</span>
                </h1>

                {/* Tagline */}
                <div className="hero-tagline">
                    <div className="tagline-line"></div>
                    <p className="tagline-text">
                        <span>{t('hero.tagline.1')}</span>
                        <span className="separator">◆</span>
                        <span>{t('hero.tagline.2')}</span>
                        <span className="separator">◆</span>
                        <span>{t('hero.tagline.3')}</span>
                    </p>
                    <div className="tagline-line"></div>
                </div>

                <div className="hero-proof-strip" aria-label={t('hero.proofLabel')}>
                    {reachSignals.map((signal) => (
                        <div className="hero-proof-item" key={signal.label}>
                            <span className="hero-proof-label">{signal.label}</span>
                            <span className="hero-proof-value">{signal.value}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="hero-cta">
                    <Magnetic>
                        <button
                            className="btn btn-primary hero-btn interactive"
                            onClick={() => scrollToSection('music', 'cta_music')}
                        >
                            <span>{t('hero.cta.music')}</span>
                            <div className="btn-shine"></div>
                        </button>
                    </Magnetic>
                    <Magnetic>
                        <button
                            className="btn btn-outline hero-btn interactive"
                            onClick={() => scrollToSection('booking', 'cta_booking')}
                        >
                            <span>{t('hero.cta.booking')}</span>
                        </button>
                    </Magnetic>
                </div>

            </div>

            {/* Social Links */}
            <SocialLinks />

            {/* Scroll Indicator */}
            <button
                type="button"
                className="scroll-indicator interactive"
                onClick={() => scrollToSection('bio', 'scroll_indicator')}
                aria-label={t('hero.scrollAboutLabel')}
            >
                <div className="scroll-mouse">
                    <div className="scroll-wheel"></div>
                </div>
                <span className="scroll-text">{t('hero.scroll')}</span>
                <div className="scroll-arrows">
                    <span className="scroll-arrow"></span>
                    <span className="scroll-arrow"></span>
                </div>
            </button>

            {/* Corner Decorations */}
            <div className="corner-decoration corner-tl"></div>
            <div className="corner-decoration corner-tr"></div>
            <div className="corner-decoration corner-bl"></div>
            <div className="corner-decoration corner-br"></div>
        </section>
    );
};

export default Hero;
