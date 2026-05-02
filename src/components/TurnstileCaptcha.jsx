import React, { useEffect, useRef, useState } from 'react';
import { t } from '../utils/i18n';

const TURNSTILE_SCRIPT_ID = 'airdox-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileLoadPromise = null;

const loadTurnstileScript = () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileLoadPromise) return turnstileLoadPromise;

    turnstileLoadPromise = new Promise((resolve, reject) => {
        const attachNewScript = () => {
            const script = document.createElement('script');
            script.id = TURNSTILE_SCRIPT_ID;
            script.src = TURNSTILE_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.setAttribute('data-turnstile-status', 'loading');
            script.onload = () => {
                script.setAttribute('data-turnstile-status', 'loaded');
                resolve(window.turnstile);
            };
            script.onerror = () => {
                script.setAttribute('data-turnstile-status', 'error');
                reject(new Error('Failed to load Turnstile script'));
            };
            document.head.appendChild(script);
        };

        const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
        if (existing) {
            const existingStatus = existing.getAttribute('data-turnstile-status');
            if (existingStatus === 'error' || existingStatus === 'loaded') {
                existing.remove();
                attachNewScript();
                return;
            }
            existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
            existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')), { once: true });
            return;
        }

        attachNewScript();
    });

    return turnstileLoadPromise;
};

const TurnstileCaptcha = ({ enabled = true, siteKey = '', onTokenChange, onStatusChange, retryKey = 0 }) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [error, setError] = useState('');
    const [localRetryKey, setLocalRetryKey] = useState(0);

    useEffect(() => {
        let disposed = false;

        const initWidget = async () => {
            if (!enabled || !containerRef.current) return;
            if (!siteKey) {
                setError(t('captcha.missing'));
                onStatusChange?.('missing');
                return;
            }
            try {
                onStatusChange?.('loading');
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
                        setError('');
                        onStatusChange?.('verified');
                        onTokenChange?.(token);
                    },
                    'expired-callback': () => {
                        onStatusChange?.('expired');
                        onTokenChange?.('');
                    },
                    'error-callback': () => {
                        setError(t('captcha.loadError'));
                        onStatusChange?.('error');
                        onTokenChange?.('');
                        turnstileLoadPromise = null;
                    },
                });
                onStatusChange?.('ready');
            } catch {
                if (!disposed) {
                    turnstileLoadPromise = null;
                    setError(t('captcha.loadError'));
                    onStatusChange?.('error');
                    onTokenChange?.('');
                }
            }
        };

        onTokenChange?.('');
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
    }, [enabled, siteKey, onTokenChange, onStatusChange, retryKey, localRetryKey]);

    if (!enabled) return null;
    if (!siteKey) {
        return <div className="auth-error">{t('captcha.missing')}</div>;
    }

    const handleRetry = () => {
        setError('');
        onTokenChange?.('');
        onStatusChange?.('loading');
        turnstileLoadPromise = null;
        setLocalRetryKey((prev) => prev + 1);
    };

    return (
        <div className="turnstile-field">
            <div ref={containerRef} className="turnstile-widget" />
            {error && (
                <div className="auth-error-row">
                    <div className="auth-error">{error}</div>
                    <button type="button" className="auth-retry-btn" onClick={handleRetry}>
                        {t('captcha.retry')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TurnstileCaptcha;
