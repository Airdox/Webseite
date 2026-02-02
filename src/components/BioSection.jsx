import React, { useEffect, useRef } from 'react';
import './BioSection.css';

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
                            <span className="section-label">// ABOUT</span>
                            <h2 className="section-title text-gradient">AIRDOX</h2>
                        </div>

                        <div className="bio-text reveal stagger-1">
                            <p className="bio-intro">
                                Der Sound AIRDOX steht für puristischen Berliner Underground Techno – einen Sound, der keine Kompromisse kennt. Treibende Rhythmen, die die Tanzfläche zum Kochen bringen.
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                Deine Füße werden nicht stillstehen. Beats, die greifen und nicht mehr loslassen. Keine endlosen Flächen, kein Energieverlust – nur pure, unerbittliche Tanzenergie, die stundenlang trägt.
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Die Prägung</strong><br />
                                Seine musikalische DNA wurde in den legendären Nächten des alten Tresor geschrieben – genauer gesagt in der oberen Etage, im Alten Globus. Nicht der raue Keller-Sound, sondern der cleane, energetische Techno der Leipziger Straße 126A formte seine Ästhetik. Jahre intensiven Erlebens haben seinen Ansatz geschärft: Die Crowd in einen unausweichlichen Beat-Sog ziehen, aus dem es kein Entrinnen gibt.
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                Seine Helden dieser Ära: Djoker Daan, Duffy, Wimpy, Housemeister und Kristin – DJs, die genau jene Vision von Tanzflächen-Techno verkörperten, die bis heute sein Schaffen bestimmt.
                            </p>
                            <p className="bio-body" style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Der Weg</strong><br />
                                Seit über zwei Jahrzehnten ist AIRDOX Teil der Szene, doch lange teilte sich seine Energie zwischen Studium, Beruf und Musik. Der volle Fokus musste warten. Heute gilt seine gesamte Kraft der Musik – eine neue, entschlossene Phase seiner Karriere hat begonnen.
                            </p>
                            <p className="bio-body">
                                <strong style={{ color: 'var(--text-primary)' }}>Die Vision</strong><br />
                                AIRDOX ist offen für Kollaborationen und den kreativen Austausch mit Gleichgesinnten. Dieser Dialog bereichert und schärft seinen fest definierten Stil – immer mit dem Ziel, den perfekten Moment auf der Tanzfläche zu erschaffen.
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
