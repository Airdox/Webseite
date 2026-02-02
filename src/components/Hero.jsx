import React, { useEffect, useState, useRef } from 'react';
// Cache bust: 2024-12-31 v3
import './Hero.css';

const Hero = () => {
    const [loaded, setLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [cursorScale, setCursorScale] = useState(1);
    const heroRef = useRef(null);
    const bgRef = useRef(null); // Ref for background parallax
    const cursorRef = useRef(null);
    const cursorOuterRef = useRef(null);

    // Cursor animation loop
    useEffect(() => {
        let animationId;
        const animate = () => {
            if (cursorRef.current && cursorOuterRef.current) {
                cursorRef.current.style.transform = `translate(${mousePos.x}px, ${mousePos.y}px) scale(${cursorScale})`;
                cursorOuterRef.current.style.transform = `translate(${mousePos.x}px, ${mousePos.y}px) scale(${cursorScale * 0.8})`;
            }
            animationId = requestAnimationFrame(animate);
        };
        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [mousePos, cursorScale]);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 100);

        // Optimized Scroll Handler (No State Update)
        const handleScroll = () => {
            if (bgRef.current) {
                const scrolled = window.scrollY;
                bgRef.current.style.transform = `translateY(${scrolled * 0.4}px)`;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        const handleMouseMove = (e) => {
            // Mouse pos state is needed for cursor which is fine, 
            // but we could optimize this too if needed. 
            // For now, removing scroll re-renders is the big win.
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseEnterInteractive = () => setCursorScale(1.5);
        const handleMouseLeaveInteractive = () => setCursorScale(1);

        window.addEventListener('mousemove', handleMouseMove);

        // Add hover effects to interactive elements
        const interactiveElements = document.querySelectorAll('button, a, .interactive');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnterInteractive);
            el.addEventListener('mouseleave', handleMouseLeaveInteractive);
        });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
            interactiveElements.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnterInteractive);
                el.removeEventListener('mouseleave', handleMouseLeaveInteractive);
            });
        };
    }, []);

    return (
        <section className="hero" id="home" ref={heroRef} data-version="0.1.1">
            {/* Custom Cursor */}
            <div ref={cursorRef} className="cursor-dot"></div>
            <div ref={cursorOuterRef} className="cursor-ring"></div>

            {/* Cursor Glow */}
            <div
                className="cursor-glow"
                style={{ left: mousePos.x, top: mousePos.y }}
            ></div>

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

            {/* Floating Particles */}
            <div className="particles-container">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className={`particle ${i % 3 === 0 ? 'particle-glow' : ''}`}
                        style={{
                            '--x': `${(i * 137.5) % 100}%`,
                            '--delay': `${(i * 0.2) % 8}s`,
                            '--duration': `${15 + ((i * 7.5) % 20)}s`,
                            '--size': `${2 + ((i * 1.5) % 4)}px`
                        }}
                    ></div>
                ))}
            </div>

            {/* Main Content */}
            <div className={`hero-content ${loaded ? 'loaded' : ''}`}>
                {/* Pre-title Badge */}
                <div className="hero-badge">
                    <span className="badge-dot"></span>
                    <span className="badge-text">BERLIN UNDERGROUND TECHNO</span>
                </div>

                {/* Main Title */}
                <h1 className="hero-title">
                    <span className="title-shadow" aria-hidden="true">AIRDOX</span>

                    <div className="title-snake-container">
                        {'AIRDOX'.split('').map((letter, i) => (
                            <div key={i} className="snake-letter-wrapper">
                                <svg className="letter-svg" viewBox="0 0 160 220">
                                    <defs>
                                        <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#ffffff" />
                                            <stop offset="50%" stopColor="var(--neon-cyan)" />
                                            <stop offset="100%" stopColor="var(--neon-pink)" />
                                        </linearGradient>
                                    </defs>
                                    <text
                                        x="50%"
                                        y="80%"
                                        textAnchor="middle"
                                        className={`letter-stroke letter-stroke-${i}`}
                                    >
                                        {letter}
                                    </text>
                                    <text
                                        x="50%"
                                        y="80%"
                                        textAnchor="middle"
                                        fill={`url(#grad-${i})`}
                                        className={`letter-fill letter-fill-${i}`}
                                    >
                                        {letter}
                                    </text>
                                </svg>
                            </div>
                        ))}
                    </div>

                    <span className="title-glow" aria-hidden="true">AIRDOX</span>
                    <span className="glitch glitch-1" aria-hidden="true">AIRDOX</span>
                    <span className="glitch glitch-2" aria-hidden="true">AIRDOX</span>
                </h1>

                {/* Tagline */}
                <div className="hero-tagline">
                    <div className="tagline-line"></div>
                    <p className="tagline-text">
                        <span>UNDERGROUND</span>
                        <span className="separator">◆</span>
                        <span>SOUND</span>
                        <span className="separator">◆</span>
                        <span>EXPERIENCE</span>
                    </p>
                    <div className="tagline-line"></div>
                </div>

                {/* CTA Buttons */}
                <div className="hero-cta">
                    <button
                        className="btn btn-primary hero-btn interactive"
                        onClick={() => document.getElementById('music')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <span>GET THE SOUND</span>
                        <div className="btn-shine"></div>
                    </button>
                    <button
                        className="btn btn-outline hero-btn interactive"
                        onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        <span>BOOK NOW</span>
                    </button>
                </div>

                {/* Social Links */}
                <div className="hero-socials">
                    <a href="https://soundcloud.com/airdox" target="_blank" rel="noopener noreferrer" className="social-link interactive">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.198-1.308-.198-1.332c-.01-.057-.044-.094-.09-.094m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.045-.104-.12-.104m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.016-.075-.075-.135-.15-.135m.93-.132c-.09 0-.165.075-.165.166l-.192 2.772.192 2.593c0 .09.075.165.165.165s.165-.075.165-.165l.21-2.593-.21-2.772c0-.09-.075-.166-.165-.166m1.065-.232c-.105 0-.195.09-.195.195l-.165 3.004.165 2.593c0 .105.09.195.195.195s.195-.09.195-.195l.18-2.593-.18-3.004c0-.105-.09-.195-.195-.195m.93-.164c-.12 0-.21.091-.225.211l-.15 3.168.15 2.623c.015.12.105.21.225.21s.21-.09.225-.21l.165-2.623-.165-3.168c-.015-.12-.105-.21-.225-.21m1.035-.242c-.135 0-.24.105-.255.24l-.135 3.41.15 2.608c.015.135.12.24.255.24.12 0 .24-.105.24-.24l.165-2.608-.165-3.41c0-.135-.105-.24-.24-.24m.96-.239c-.15 0-.27.12-.285.27l-.12 3.649.12 2.623c.015.15.135.27.285.27.135 0 .27-.12.27-.27l.135-2.623-.135-3.649c-.015-.15-.135-.27-.27-.27m1.065-.225c-.165 0-.3.135-.3.3l-.12 3.874.12 2.608c0 .165.135.3.3.3.15 0 .3-.135.3-.3l.12-2.608-.12-3.874c0-.165-.15-.3-.3-.3m.93-.18c-.18 0-.315.15-.33.33l-.104 4.054.104 2.623c.015.18.15.33.33.33.165 0 .315-.15.315-.33l.12-2.623-.12-4.054c-.015-.18-.15-.33-.315-.33m1.049-.166c-.195 0-.345.15-.36.346l-.09 4.22.09 2.608c.015.195.165.345.36.345.18 0 .345-.15.345-.345l.105-2.608-.105-4.22c-.015-.195-.165-.345-.345-.345m.99-.12c-.21 0-.375.165-.39.375l-.075 4.34.075 2.594c.015.21.18.375.39.375.195 0 .375-.165.375-.375l.09-2.594-.09-4.34c-.015-.21-.18-.375-.375-.375m1.05-.105c-.225 0-.39.18-.405.405l-.06 4.445.06 2.579c.015.225.18.405.405.405.21 0 .405-.18.405-.405l.075-2.579-.075-4.445c-.015-.225-.195-.405-.405-.405m1.77 1.875c-.18-.795-.735-1.395-1.455-1.635-.285-.105-.585-.165-.9-.165-.255 0-4.05 0-4.05 0-.225.015-.405.18-.405.405v10.32c0 .225.18.42.42.42h4.94c1.725 0 3.12-1.395 3.12-3.12 0-1.44-.99-2.67-2.34-3.03" />
                        </svg>
                    </a>
                    <a href="https://www.mixcloud.com/Airdox/" target="_blank" rel="noopener noreferrer" className="social-link interactive">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.749 0c-3.791 0-6.902 2.768-7.589 6.551.493 2.152 2.057 3.916 4.102 4.606.326.111.664.168.997.168 1.109 0 2.148-.375 2.992-1.015-1.045-.394-1.928-1.121-2.536-2.062-.607-.942-.888-2.073-.787-3.178C5.232 2.766 7.155.992 9.531 1.096c2.375.104 4.305 2.029 4.409 4.404.032.729-.115 1.446-.425 2.094-.311.649-.785 1.205-1.373 1.611 1.604-.047 3.036-.593 4.195-1.503-.923.473-1.93.754-3.002.793 1.341 1.396 3.235 2.27 5.318 2.27 1.777 0 3.428-.636 4.735-1.696C23.012 5.567 19.897 2.768 16.101 2.768c-.628 0-1.242.079-1.831.229C13.238 1.155 10.61 0 7.749 0zm.019 1.956c2.093 0 3.992.839 5.394 2.193.303-.075.617-.113.939-.113 2.776 0 5.055 2.046 5.467 4.729-.691.564-1.564.912-2.518.912-1.745 0-3.328-1.004-4.103-2.541-.854 1.766-2.615 2.924-4.57 2.715-1.956-.209-3.528-1.748-3.666-3.707-.138-1.959 1.159-3.714 3.056-4.186zM4.685 12.235c-2.31 0-4.17 1.841-4.17 4.129 0 2.29 1.86 4.128 4.17 4.128 2.311 0 4.167-1.838 4.167-4.128 0-2.288-1.856-4.129-4.167-4.129zm14.628 0c-2.311 0-4.168 1.841-4.168 4.129 0 2.29 1.857 4.128 4.168 4.128 2.31 0 4.167-1.838 4.167-4.128 0-2.288-1.857-4.129-4.167-4.129zM2.876 13.988h3.621v.961H2.876v-.961zm14.63 0h3.619v.961h-3.619v-.961zM4.321 16.09h.729v1.282h-.729V16.09zm14.63 0h.729v1.282h-.729V16.09z" />
                        </svg>
                    </a>
                    <a href="https://instagram.com/airdox_bln" target="_blank" rel="noopener noreferrer" className="social-link interactive">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                    </a>
                    <a href="mailto:airdox82@gmail.com" className="social-link interactive">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div
                className="scroll-indicator interactive"
                onClick={() => document.getElementById('bio')?.scrollIntoView({ behavior: 'smooth' })}
            >
                <div className="scroll-mouse">
                    <div className="scroll-wheel"></div>
                </div>
                <span className="scroll-text">SCROLL</span>
                <div className="scroll-arrows">
                    <span className="scroll-arrow"></span>
                    <span className="scroll-arrow"></span>
                </div>
            </div>

            {/* Corner Decorations */}
            <div className="corner-decoration corner-tl"></div>
            <div className="corner-decoration corner-tr"></div>
            <div className="corner-decoration corner-bl"></div>
            <div className="corner-decoration corner-br"></div>
        </section>
    );
};

export default Hero;
