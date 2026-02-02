import React, { useState, useEffect } from 'react';
import './CookieBanner.css';

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
        setShowBanner(false);
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
                    <h3 className="cookie-title">🍪 Cookie-Einstellungen</h3>
                    <p className="cookie-text">
                        Wir verwenden Cookies und ähnliche Technologien, um dein Erlebnis zu verbessern und anonyme Nutzungsstatistiken zu erfassen.
                    </p>
                </div>

                {showDetails && (
                    <div className="cookie-details">
                        <div className="cookie-category">
                            <div className="category-header">
                                <span className="category-name">📊 Analyse-Cookies</span>
                                <span className="category-badge">Optional</span>
                            </div>
                            <p className="category-desc">
                                Helfen uns zu verstehen, wie Besucher die Website nutzen. So können wir das Nutzererlebnis verbessern.
                            </p>
                            <ul className="category-list">
                                <li>Seitenaufrufe & Navigation</li>
                                <li>Downloads & Audio-Plays</li>
                                <li>Geräte- & Browser-Informationen</li>
                                <li>Session-Dauer</li>
                            </ul>
                        </div>

                        <div className="cookie-category essential">
                            <div className="category-header">
                                <span className="category-name">🔒 Essentielle Cookies</span>
                                <span className="category-badge essential">Erforderlich</span>
                            </div>
                            <p className="category-desc">
                                Notwendig für die Grundfunktionen der Website. Diese können nicht deaktiviert werden.
                            </p>
                        </div>
                    </div>
                )}

                <div className="cookie-actions">
                    <button
                        className="cookie-btn cookie-btn-details"
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? 'Weniger' : 'Details'}
                    </button>
                    <button
                        className="cookie-btn cookie-btn-decline"
                        onClick={handleDecline}
                    >
                        Nur Essentielle
                    </button>
                    <button
                        className="cookie-btn cookie-btn-accept"
                        onClick={handleAcceptAll}
                    >
                        Alle Akzeptieren
                    </button>
                </div>

                <p className="cookie-legal">
                    Mit "Alle Akzeptieren" stimmst du der Verwendung aller Cookies zu.
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowDetails(true); }}>Mehr erfahren</a>
                </p>
            </div>
        </div>
    );
};

export default CookieBanner;
