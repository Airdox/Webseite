import React, { useState, useEffect } from 'react';
import './Navigation.css';

const Navigation = () => {
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSection, setActiveSection] = useState('home');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Scrolled state
            setScrolled(window.scrollY > 50);

            // Scroll progress
            const winScroll = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (winScroll / height) * 100;
            setScrollProgress(scrolled);

            // Active section detection
            const sections = ['home', 'bio', 'music', 'booking'];
            for (const section of sections.reverse()) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 200) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMenuOpen(false);
    };

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'bio', label: 'About' },
        { id: 'music', label: 'Music' },
        { id: 'booking', label: 'Booking' },
    ];

    return (
        <>
            <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
                {/* Scroll Progress Bar */}
                <div className="scroll-progress-bar">
                    <div
                        className="scroll-progress-fill"
                        style={{ width: `${scrollProgress}%` }}
                    ></div>
                </div>

                <div className="nav-container">
                    {/* Logo */}
                    <div
                        className="nav-logo interactive"
                        onClick={() => scrollToSection('home')}
                    >
                        <span className="logo-text">AIRDOX</span>
                        <span className="logo-dot"></span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="nav-links">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-link interactive ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => scrollToSection(item.id)}
                            >
                                <span className="link-text">{item.label}</span>
                                <span className="link-indicator"></span>
                            </button>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <a
                        href="mailto:airdox82@gmail.com"
                        className="nav-cta btn btn-primary interactive"
                    >
                        Contact
                    </a>

                    {/* Mobile Menu Button */}
                    <button
                        className={`menu-toggle interactive ${menuOpen ? 'open' : ''}`}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className="menu-line"></span>
                        <span className="menu-line"></span>
                        <span className="menu-line"></span>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {navItems.map((item, index) => (
                        <button
                            key={item.id}
                            className="mobile-nav-link"
                            onClick={() => scrollToSection(item.id)}
                            style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                        >
                            <span className="mobile-link-number">0{index + 1}</span>
                            <span className="mobile-link-text">{item.label}</span>
                        </button>
                    ))}

                    <div className="mobile-menu-footer">
                        <a href="mailto:airdox82@gmail.com" className="btn btn-primary">
                            Get in Touch
                        </a>
                        <div className="mobile-socials">
                            <a href="https://soundcloud.com/airdox" target="_blank" rel="noopener noreferrer">SoundCloud</a>
                            <a href="https://instagram.com/airdox_bln" target="_blank" rel="noopener noreferrer">Instagram</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navigation;
