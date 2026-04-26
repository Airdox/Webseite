import React, { useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_ID = 'airdox-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileLoadPromise = null;

const loadTurnstileScript = () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileLoadPromise) return turnstileLoadPromise;

    turnstileLoadPromise = new Promise((resolve, reject) => {
        const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
        if (existing) {
            existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
            existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = TURNSTILE_SCRIPT_ID;
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.turnstile);
        script.onerror = () => reject(new Error('Failed to load Turnstile script'));
        document.head.appendChild(script);
    });

    return turnstileLoadPromise;
};

const TurnstileCaptcha = ({ enabled = true, siteKey = '', onTokenChange }) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!enabled) return undefined;
        onTokenChange?.('');
        setError('');
        return undefined;
    }, [enabled, siteKey, onTokenChange]);

    useEffect(() => {
        let disposed = false;

        const initWidget = async () => {
            if (!enabled || !siteKey || !containerRef.current) return;
            try {
                const turnstile = await loadTurnstileScript();
                if (disposed || !turnstile || !containerRef.current) return;

                if (widgetIdRef.current !== null) {
                    turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }

                widgetIdRef.current = turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: 'dark',
                    callback: (token) => {
                        onTokenChange?.(token);
                    },
                    'expired-callback': () => {
                        onTokenChange?.('');
                    },
                    'error-callback': () => {
                        setError('Captcha konnte nicht geladen werden.');
                        onTokenChange?.('');
                    },
                });
            } catch {
                if (!disposed) {
                    setError('Captcha konnte nicht geladen werden.');
                    onTokenChange?.('');
                }
            }
        };

        initWidget();

        return () => {
            disposed = true;
            if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current !== null) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // noop
                }
                widgetIdRef.current = null;
            }
        };
    }, [enabled, siteKey, onTokenChange]);

    if (!enabled) return null;
    if (!siteKey) {
        return <div className="auth-error">Captcha ist nicht konfiguriert.</div>;
    }

    return (
        <div className="turnstile-field">
            <div ref={containerRef} className="turnstile-widget" />
            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export default TurnstileCaptcha;
