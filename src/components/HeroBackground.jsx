import React, { useEffect, useRef } from 'react';

const HeroBackground = () => {
    const bgRef = useRef(null);

    useEffect(() => {
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
        handleScroll(); // Initial call

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    return (
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
    );
};

export default HeroBackground;
