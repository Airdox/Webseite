import React, { useEffect, useRef } from 'react';
import './BioSection.css';
import { t } from '../utils/i18n';

const BioSection = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = sectionRef.current?.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        elements?.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const stats = [
        { number: '50+', label: 'LIVE SETS' },
        { number: '10K+', label: 'LISTENERS' },
        { number: 'BERLIN', label: 'BASED' },
    ];

    return (
        <section className="bio-section section" id="bio" ref={sectionRef}>
            {/* Background Elements */}
            <div className="bio-bg">
                <div className="bio-gradient"></div>
                <div className="bio-lines"></div>
            </div>

            <div className="container">
                <div className="bio-grid">
                    {/* Left Side - Visual */}
                    <div className="bio-visual reveal-left">
                        <div className="visual-frame">
                            <div className="frame-corner frame-tl"></div>
                            <div className="frame-corner frame-tr"></div>
                            <div className="frame-corner frame-bl"></div>
                            <div className="frame-corner frame-br"></div>

                            <div className="visual-content abstract-layout">
                                {/* Abstract Geometric Visualization - Pure CSS */}
                                <div className="geo-structure">
                                    <div className="geo-ring ring-1"></div>
                                    <div className="geo-ring ring-2"></div>
                                    <div className="geo-ring ring-3"></div>
                                    <div className="geo-core"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Text */}
                    <div className="bio-content">
                        <div className="section-header reveal">
                            <span className="section-label">{t('bio.sectionLabel')}</span>
                            <h2 className="section-title text-gradient">{t('bio.title')}</h2>
                        </div>

                        <div className="bio-text reveal stagger-1">
                            <p className="bio-intro">
                                {t('bio.intro')}
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                {t('bio.body1')}
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{t('bio.heading1')}</strong><br />
                                {t('bio.body2')}
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                {t('bio.body3')}
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{t('bio.heading2')}</strong><br />
                                {t('bio.body4')}
                            </p>
                            <p className="bio-body">
                                <strong style={{ color: 'var(--text-primary)' }}>{t('bio.heading3')}</strong><br />
                                {t('bio.body5')}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="bio-stats reveal stagger-2">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-item">
                                    <span className="stat-number">{stat.number}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Tags */}
                        <div className="bio-tags reveal stagger-3">
                            <span className="tag">TECHNO</span>
                            <span className="tag">INDUSTRIAL</span>
                            <span className="tag">DARK</span>
                            <span className="tag">HYPNOTIC</span>
                            <span className="tag">UNDERGROUND</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BioSection;
