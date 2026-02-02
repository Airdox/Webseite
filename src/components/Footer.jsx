import React, { useEffect, useRef } from 'react';
import './Footer.css';

const Footer = () => {
    const footerRef = useRef(null);

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

        const elements = footerRef.current?.querySelectorAll('.reveal');
        elements?.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { name: 'SoundCloud', url: 'https://soundcloud.com/airdox' },
        { name: 'Mixcloud', url: 'https://www.mixcloud.com/Airdox/' },
        { name: 'Instagram', url: 'https://instagram.com/airdox_bln' },
        { name: 'Email', url: 'mailto:airdox82@gmail.com' },
    ];

    return (
        <footer className="footer" ref={footerRef}>
            <div className="footer-glow"></div>

            <div className="container">
                <div className="footer-content">
                    {/* Logo Section */}
                    <div className="footer-brand reveal">
                        <h2 className="footer-logo text-gradient">AIRDOX</h2>
                        <p className="footer-tagline">BERLIN UNDERGROUND TECHNO</p>
                    </div>

                    {/* Social Links */}
                    <div className="footer-socials reveal stagger-1">
                        {socialLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.url}
                                target={link.url.startsWith('mailto') ? undefined : '_blank'}
                                rel={link.url.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                                className="footer-social-link interactive"
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Back to Top */}
                    <button
                        className="back-to-top interactive reveal stagger-2"
                        onClick={scrollToTop}
                        aria-label="Back to top"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        <span>Back to Top</span>
                    </button>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom reveal stagger-3">
                    <div className="footer-line"></div>
                    <div className="footer-bottom-content">
                        <p className="footer-copyright">
                            © {currentYear} AIRDOX. All rights reserved.
                        </p>
                        <p className="footer-credit">
                            Made with <span className="heart">♥</span> in Berlin <span className="version-tag">v0.1.2</span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
