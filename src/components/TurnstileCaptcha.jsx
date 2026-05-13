import React, { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../utils/i18n';

const TURNSTILE_SCRIPT_ID = 'airdox-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_LOAD_TIMEOUT_MS = 12000;

let turnstileLoadPromise = null;

const loadTurnstileScript = () => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileLoadPromise) return turnstileLoadPromise;

    turnstileLoadPromise = new Promise((resolve, reject) => {
        let timeoutId = null;

        const clearLoadTimeout = () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        const rejectLoad = (message = 'Failed to load Turnstile script') => {
            clearLoadTimeout();
            reject(new Error(message));
        };

        const resolveWithApi = () => {
            clearLoadTimeout();
            if (!window.turnstile) {
                rejectLoad('Turnstile API unavailable after script load');
                return;
            }
            resolve(window.turnstile);
        };

        const armTimeout = () => {
            clearLoadTimeout();
            timeoutId = setTimeout(() => {
                rejectLoad('Turnstile script load timed out');
            }, TURNSTILE_LOAD_TIMEOUT_MS);
        };

        const attachNewScript = () => {
            const script = document.createElement('script');
            script.id = TURNSTILE_SCRIPT_ID;
            script.src = TURNSTILE_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.setAttribute('data-turnstile-status', 'loading');
            script.onload = () => {
                script.setAttribute('data-turnstile-status', 'loaded');
                resolveWithApi();
            };
            script.onerror = () => {
                script.setAttribute('data-turnstile-status', 'error');
                rejectLoad();
            };
            document.head.appendChild(script);
            armTimeout();
        };

        const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
        if (existing) {
            if (window.turnstile) {
                resolve(window.turnstile);
                return;
            }
            const existingStatus = existing.getAttribute('data-turnstile-status');
            if (existingStatus === 'error' || existingStatus === 'loaded') {
                existing.remove();
                attachNewScript();
                return;
            }
            existing.setAttribute('data-turnstile-status', 'loading');
            existing.addEventListener('load', resolveWithApi, { once: true });
            existing.addEventListener('error', () => rejectLoad(), { once: true });
            armTimeout();
            return;
        }

        attachNewScript();
    });

    turnstileLoadPromise = turnstileLoadPromise.catch((error) => {
        turnstileLoadPromise = null;
        throw error;
    });

    return turnstileLoadPromise;
};

const TurnstileCaptcha = ({ enabled = true, siteKey = '', onTokenChange, onStatusChange, retryKey = 0 }) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const onTokenChangeRef = useRef(onTokenChange);
    const onStatusChangeRef = useRef(onStatusChange);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [localRetryKey, setLocalRetryKey] = useState(0);

    useEffect(() => {
        onTokenChangeRef.current = onTokenChange;
    }, [onTokenChange]);

    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
    }, [onStatusChange]);

    const emitTokenChange = useCallback((token) => {
        onTokenChangeRef.current?.(token);
    }, []);

    const emitStatusChange = useCallback((status) => {
        onStatusChangeRef.current?.(status);
    }, []);

    useEffect(() => {
        let disposed = false;

        const initWidget = async () => {
            if (!enabled || !containerRef.current) return;
            if (!siteKey) {
                setError(t('captcha.missing'));
                setLoading(false);
                emitStatusChange('missing');
                return;
            }
            try {
                setError('');
                setLoading(true);
                emitStatusChange('loading');
                const turnstile = await loadTurnstileScript();
                if (disposed) return;
                if (!turnstile || !containerRef.current) {
                    setLoading(false);
                    setError(t('captcha.loadError'));
                    emitStatusChange('error');
                    emitTokenChange('');
                    return;
                }

                if (widgetIdRef.current !== null) {
                    turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }

                widgetIdRef.current = turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: 'dark',
                    action: 'register',
                    callback: (token) => {
                        setError('');
                        setLoading(false);
                        emitStatusChange('verified');
                        emitTokenChange(token);
                    },
                    'expired-callback': () => {
                        setLoading(false);
                        setError('');
                        emitStatusChange('expired');
                        emitTokenChange('');
                    },
                    'error-callback': () => {
                        setError(t('captcha.loadError'));
                        setLoading(false);
                        emitStatusChange('error');
                        emitTokenChange('');
                        turnstileLoadPromise = null;
                    },
                });
                setLoading(false);
                emitStatusChange('ready');
            } catch {
                if (!disposed) {
                    turnstileLoadPromise = null;
                    setLoading(false);
                    setError(t('captcha.loadError'));
                    emitStatusChange('error');
                    emitTokenChange('');
                }
            }
        };

        emitTokenChange('');
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
    }, [enabled, siteKey, retryKey, localRetryKey, emitTokenChange, emitStatusChange]);

    if (!enabled) return null;
    if (!siteKey) {
        return <div className="auth-error">{t('captcha.missing')}</div>;
    }

    const handleRetry = () => {
        setError('');
        setLoading(true);
        emitTokenChange('');
        emitStatusChange('loading');
        turnstileLoadPromise = null;
        setLocalRetryKey((prev) => prev + 1);
    };

    return (
        <div className="turnstile-field">
            <div ref={containerRef} className="turnstile-widget" />
            {loading && !error && <div className="captcha-loading-hint">{t('captcha.loading')}</div>}
            {error && (
                <div className="auth-error-row">
                    <div className="auth-error">{error}</div>
                    <button type="button" className="auth-retry-btn" onClick={handleRetry} disabled={loading}>
                        {t('captcha.retry')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TurnstileCaptcha;
