import React, { useEffect, useState, useRef } from 'react';
// Cache bust: 2024-12-31 v3
import Magnetic from './Magnetic';
import SocialLinks from './SocialLinks';
import useCustomCursor from '../hooks/useCustomCursor';
import HeroBackground from './HeroBackground';
import GlitchBlocks from './GlitchBlocks';
import HeroTitle from './HeroTitle';
import './Hero.css';
import { t } from '../utils/i18n';

const Hero = () => {
    const [loaded, setLoaded] = useState(false);
    const heroRef = useRef(null);

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

        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <section className="hero" id="home" ref={heroRef} data-version="0.1.1">
            {/* Custom Cursor */}
            <div ref={cursorRef} className="cursor-dot"></div>
            <div ref={cursorOuterRef} className="cursor-ring"></div>

            {/* Cursor Glow */}
            <div ref={glowRef} className="cursor-glow"></div>

            {/* Animated Background Layers */}
            <HeroBackground />

            {/* Random 3D Glitch Blocks */}
            <GlitchBlocks />

            {/* Main Content */}
            <div className={`hero-content ${loaded ? 'loaded' : ''}`}>
                {/* Pre-title Badge */}
                <div className="hero-badge">
                    <span className="badge-dot"></span>
                    <span className="badge-text">{t('hero.badge')}</span>
                </div>

                {/* Main Title */}
                <HeroTitle title={TITLE} loaded={loaded} />

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

