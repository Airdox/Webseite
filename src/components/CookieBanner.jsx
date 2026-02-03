import React, { useState, useEffect } from 'react';
import './CookieBanner.css';
import { t } from '../utils/i18n';

const CookieBanner = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Prüfe ob bereits eine Entscheidung getroffen wurde
        const consent = localStorage.getItem('airdox-analytics-enabled');
        if (consent === null) {
            // Noch keine Entscheidung - Banner zeigen nach kurzer Verzögerung
            setTimeout(() => setShowBanner(true), 1500);
        }
    }, []);



    const handleDecline = () => {
        localStorage.setItem('airdox-analytics-enabled', 'false');
        localStorage.setItem('airdox-marketing-enabled', 'false');
        setShowBanner(false);
        window.dispatchEvent(new CustomEvent('analytics-consent-changed'));
    };

    const handleAcceptAll = () => {
        localStorage.setItem('airdox-analytics-enabled', 'true');
        localStorage.setItem('airdox-marketing-enabled', 'true');
        setShowBanner(false);
        window.dispatchEvent(new CustomEvent('analytics-consent-changed'));
    };

    if (!showBanner) return null;

    return (
        <div className="cookie-banner-overlay">
            <div className="cookie-banner glass-card">
                <div className="cookie-header">
                    <h3 className="cookie-title">{t('cookie.title')}</h3>
                    <p className="cookie-text">
                        {t('cookie.text')}
                    </p>
                </div>

                {showDetails && (
                    <div className="cookie-details">
                        <div className="cookie-category">
                            <div className="category-header">
                                <span className="category-name">{t('cookie.analytics.title')}</span>
                                <span className="category-badge">{t('cookie.analytics.badge')}</span>
                            </div>
                            <p className="category-desc">
                                {t('cookie.analytics.desc')}
                            </p>
                            <ul className="category-list">
                                <li>{t('cookie.analytics.item1')}</li>
                                <li>{t('cookie.analytics.item2')}</li>
                                <li>{t('cookie.analytics.item3')}</li>
                                <li>{t('cookie.analytics.item4')}</li>
                            </ul>
                        </div>

                        <div className="cookie-category essential">
                            <div className="category-header">
                                <span className="category-name">{t('cookie.essential.title')}</span>
                                <span className="category-badge essential">{t('cookie.essential.badge')}</span>
                            </div>
                            <p className="category-desc">
                                {t('cookie.essential.desc')}
                            </p>
                        </div>
                    </div>
                )}

                <div className="cookie-actions">
                    <button
                        className="cookie-btn cookie-btn-details"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? t('cookie.less') : t('cookie.details')}
                    </button>
                    <button
                        className="cookie-btn cookie-btn-decline"
                        onClick={handleDecline}
                    >
                        {t('cookie.essentialOnly')}
                    </button>
                    <button
                        className="cookie-btn cookie-btn-accept"
                        onClick={handleAcceptAll}
                    >
                        {t('cookie.acceptAll')}
                    </button>
                </div>

                <p className="cookie-legal">
                    {t('cookie.legal')}
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowDetails(true); }}>{t('cookie.learnMore')}</a>
                </p>
            </div>
        </div>
    );
};

export default CookieBanner;
