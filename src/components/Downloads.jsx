import React, { useState, useEffect, useRef } from 'react';
import './Downloads.css';
import { t } from '../utils/i18n';
import analytics from '../utils/analytics';

const VIP_PASSWORD = import.meta.env.VITE_VIP_PASSWORD || 'airdox2025';

const Downloads = () => {
    const [isVipUnlocked, setIsVipUnlocked] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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

        const elements = sectionRef.current?.querySelectorAll('.reveal, .reveal-scale');
        elements?.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === VIP_PASSWORD) {
            setIsVipUnlocked(true);
            setError('');
            analytics.trackEvent('vip_unlocked', { method: 'password' });
        } else {
            setError(t('downloads.errorWrongPassword') || 'Falsches Passwort');
            setPassword('');
        }
    };

    const handleDownload = (fileName, category) => {
        analytics.trackDownload(fileName, 0, category);
    };

    const publicFiles = [
        { name: 'AIRDOX - Pirate Studio Mix 2024.mp3', size: '128MB', url: '/sets/public/mix2024.mp3' },
        { name: 'AIRDOX - Underground Selection.mp3', size: '94MB', url: '/sets/public/underground.mp3' }
    ];

    const vipFiles = [
        { name: 'AIRDOX - EXCLUSIVE VIP UNRELEASED.mp3', size: '156MB', url: '/sets/vip/exclusive.mp3' },
        { name: 'AIRDOX - Live at Tresor (Privat).mp3', size: '210MB', url: '/sets/vip/tresor-live.mp3' }
    ];

    return (
        <section className="downloads-section section" id="downloads" ref={sectionRef}>
            <div className="container">
                <div className="section-header reveal">
                    <span className="section-label">// DOWNLOAD AREA</span>
                    <h2 className="section-title text-gradient">{t('downloads.title') || 'DOWNLOADS'}</h2>
                    <p className="section-subtitle">
                        {t('downloads.subtitle') || 'Hol dir den Sound für unterwegs. Öffentliche Sets und exklusiver VIP-Content.'}
                    </p>
                </div>

                <div className="downloads-grid">
                    {/* Public Downloads */}
                    <div className="download-category glass-card reveal">
                        <h3 className="category-title">
                            <span className="title-icon">🔓</span>
                            {t('downloads.publicTitle') || 'Public Sets'}
                        </h3>
                        <div className="file-list">
                            {publicFiles.map((file, idx) => (
                                <div key={idx} className="file-item">
                                    <div className="file-info">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{file.size}</span>
                                    </div>
                                    <a 
                                        href={file.url} 
                                        download 
                                        className="download-btn btn-outline"
                                        onClick={() => handleDownload(file.name, 'public')}
                                    >
                                        DOWNLOAD
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VIP Downloads */}
                    <div className={`download-category glass-card reveal ${isVipUnlocked ? 'unlocked' : 'locked'}`}>
                        <h3 className="category-title">
                            <span className="title-icon">{isVipUnlocked ? '✨' : '🔒'}</span>
                            {t('downloads.vipTitle') || 'VIP Area'}
                        </h3>

                        {!isVipUnlocked ? (
                            <div className="vip-login">
                                <p className="vip-text">
                                    {t('downloads.vipHint') || 'Dieser Bereich ist nur für Freunde & Familie. Gib das Passwort ein, um Zugang zu erhalten.'}
                                </p>
                                <form onSubmit={handlePasswordSubmit} className="vip-form">
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Passwort"
                                        className="vip-input"
                                    />
                                    <button type="submit" className="btn btn-primary">UNLOCK</button>
                                </form>
                                {error && <p className="vip-error">{error}</p>}
                            </div>
                        ) : (
                            <div className="file-list">
                                {vipFiles.map((file, idx) => (
                                    <div key={idx} className="file-item">
                                        <div className="file-info">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">{file.size}</span>
                                        </div>
                                        <a 
                                            href={file.url} 
                                            download 
                                            className="download-btn btn-primary"
                                            onClick={() => handleDownload(file.name, 'vip')}
                                        >
                                            GET EXCLUSIVE
                                        </a>
                                    </div>
                                ))}
                                <button 
                                    className="btn-ghost vip-lock-btn" 
                                    onClick={() => setIsVipUnlocked(false)}
                                >
                                    BACK TO PUBLIC
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Downloads;
