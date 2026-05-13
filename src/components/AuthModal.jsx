import React, { useState, useEffect, useRef, useCallback } from 'react';
import TurnstileCaptcha from './TurnstileCaptcha';
import './AuthModal.css';
import { t } from '../utils/i18n';

const API_BASE = (import.meta.env.VITE_STATS_API_BASE || '').replace(/\/+$/, '');
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

const resolveApiOrigin = () => {
    if (typeof window === 'undefined') return '';
    if (!API_BASE) return window.location.origin;
    try {
        return new URL(API_BASE, window.location.origin).origin;
    } catch {
        return window.location.origin;
    }
};

const resolveApiBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    if (!API_BASE) return window.location.origin;
    try {
        return new URL(API_BASE, window.location.origin).toString();
    } catch {
        return window.location.origin;
    }
};

const SocialProviderIcon = ({ provider }) => {
    if (provider === 'google') {
        return (
            <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.3 0-.6-.1-1.1-.2-1.6H12z" />
                <path fill="#34A853" d="M12 21.6c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.5-1.9.9-3.2.9-2.5 0-4.7-1.7-5.4-4l-3.1 2.4C4.9 19.4 8.2 21.6 12 21.6z" />
                <path fill="#4A90E2" d="M6.6 13.8c-.2-.6-.4-1.2-.4-1.8s.1-1.3.4-1.8L3.5 7.8C2.8 9.1 2.4 10.5 2.4 12s.4 2.9 1.1 4.2l3.1-2.4z" />
                <path fill="#FBBC05" d="M12 6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 3 14.6 2.4 12 2.4 8.2 2.4 4.9 4.6 3.5 7.8l3.1 2.4c.7-2.3 2.9-4.2 5.4-4.2z" />
            </svg>
        );
    }

    return (
        <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="#1877F2" />
            <path
                fill="#FFFFFF"
                d="M13.7 20v-7.2h2.4l.4-2.8h-2.8V8.2c0-.8.2-1.4 1.4-1.4h1.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v2.8h2.4V20h3.3z"
            />
        </svg>
    );
};

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [captchaStatus, setCaptchaStatus] = useState('idle');
    const [socialLoadingProvider, setSocialLoadingProvider] = useState('');
    const oauthPopupRef = useRef(null);
    const popupCheckIntervalRef = useRef(null);
    const oauthMessageReceivedRef = useRef(false);
    const modalBodyRef = useRef(null);
    const [showRegisterScrollHint, setShowRegisterScrollHint] = useState(false);

    const clearPopupCheckInterval = useCallback(() => {
        if (popupCheckIntervalRef.current !== null) {
            window.clearInterval(popupCheckIntervalRef.current);
            popupCheckIntervalRef.current = null;
        }
    }, []);

    const resetSocialAuthState = useCallback(() => {
        if (oauthPopupRef.current && !oauthPopupRef.current.closed) {
            oauthPopupRef.current.close();
        }
        clearPopupCheckInterval();
        oauthPopupRef.current = null;
        oauthMessageReceivedRef.current = false;
        setSocialLoadingProvider('');
    }, [clearPopupCheckInterval]);

    const handleCaptchaTokenChange = useCallback((nextToken) => {
        setCaptchaToken(nextToken);
        if (nextToken) setError('');
    }, []);

    const handleCaptchaStatusChange = useCallback((status) => {
        setCaptchaStatus(status);
        if (status === 'verified') setError('');
    }, []);

    useEffect(() => {
        setMode(initialMode);
        setError('');
        setSuccess('');
        setCaptchaToken('');
        setCaptchaStatus('idle');
        resetSocialAuthState();
    }, [initialMode, isOpen, resetSocialAuthState]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const onMessage = (event) => {
            const apiOrigin = resolveApiOrigin();
            if (event.origin !== window.location.origin && event.origin !== apiOrigin) return;
            if (oauthPopupRef.current && event.source !== oauthPopupRef.current) return;
            const data = event.data || {};
            if (data.source !== 'airdox-oauth') return;
            oauthMessageReceivedRef.current = true;
            clearPopupCheckInterval();
            oauthPopupRef.current = null;
            setSocialLoadingProvider('');
            if (!data.ok || !data.token) {
                setError(data.error || t('auth.oauthFailed'));
                return;
            }
            localStorage.setItem('airdox_token', data.token);
            setSuccess(t('auth.loginSuccess'));
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 700);
        };

        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
            resetSocialAuthState();
        };
    }, [onClose, clearPopupCheckInterval, resetSocialAuthState]);

    useEffect(() => {
        if (!isOpen || mode !== 'register') {
            setShowRegisterScrollHint(false);
            return undefined;
        }

        const modalBodyElement = modalBodyRef.current;
        if (!modalBodyElement) return undefined;

        const updateScrollHint = () => {
            const hasOverflow = modalBodyElement.scrollHeight > modalBodyElement.clientHeight + 2;
            const isNearBottom = modalBodyElement.scrollTop + modalBodyElement.clientHeight >= modalBodyElement.scrollHeight - 8;
            setShowRegisterScrollHint(hasOverflow && !isNearBottom);
        };

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateScrollHint)
            : null;

        resizeObserver?.observe(modalBodyElement);
        const rafId = window.requestAnimationFrame(updateScrollHint);
        modalBodyElement.addEventListener('scroll', updateScrollHint, { passive: true });
        window.addEventListener('resize', updateScrollHint);

        return () => {
            window.cancelAnimationFrame(rafId);
            resizeObserver?.disconnect();
            modalBodyElement.removeEventListener('scroll', updateScrollHint);
            window.removeEventListener('resize', updateScrollHint);
        };
    }, [isOpen, mode]);

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError('');
        setSuccess('');
        setCaptchaToken('');
        setCaptchaStatus('idle');
        resetSocialAuthState();
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTop = 0;
        }
    };

    if (!isOpen) return null;

    const modalTitleId = 'auth-modal-title';
    const modalSubtitleId = 'auth-modal-subtitle';
    const authFormId = 'auth-modal-form';

    const openSocialAuth = (provider) => {
        if (socialLoadingProvider) return;
        setError('');
        clearPopupCheckInterval();
        if (oauthPopupRef.current && !oauthPopupRef.current.closed) {
            oauthPopupRef.current.close();
        }
        oauthMessageReceivedRef.current = false;
        setSocialLoadingProvider(provider);

        const authUrl = new URL('/api/oauth/start', resolveApiBaseUrl());
        authUrl.searchParams.set('provider', provider);
        authUrl.searchParams.set('mode', mode);
        authUrl.searchParams.set('origin', window.location.origin);

        const popup = window.open(
            authUrl.toString(),
            'airdox_oauth_popup',
            'popup=yes,width=520,height=720,left=120,top=80'
        );
        if (!popup) {
            setSocialLoadingProvider('');
            setError(t('auth.oauthFailed'));
            return;
        }

        oauthPopupRef.current = popup;
        popup.focus?.();
        popupCheckIntervalRef.current = window.setInterval(() => {
            if (oauthPopupRef.current?.closed) {
                const messageWasReceived = oauthMessageReceivedRef.current;
                clearPopupCheckInterval();
                oauthPopupRef.current = null;
                setSocialLoadingProvider('');
                if (!messageWasReceived) {
                    setError(t('auth.oauthFailed'));
                }
            }
        }, 400);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (mode === 'register') {
                if (!TURNSTILE_SITE_KEY) {
                    throw new Error(t('auth.registrationDisabled'));
                }
                if (captchaStatus === 'loading') {
                    throw new Error(t('captcha.loading'));
                }
                if (captchaStatus === 'error') {
                    throw new Error(t('captcha.loadError'));
                }
                if (!captchaToken) {
                    throw new Error(t('auth.captchaRequired'));
                }
            }

            const endpoint = mode === 'login' ? `${API_BASE}/api/login` : `${API_BASE}/api/register`;
            const payload = mode === 'login' 
                ? { email, password } 
                : { email, password, username, captchaToken };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('auth.genericError'));
            }

            if (mode === 'login') {
                localStorage.setItem('airdox_token', data.token);
                setSuccess(t('auth.loginSuccess'));
                setTimeout(() => {
                    onClose();
                    window.location.reload(); // Simple way to refresh UI state
                }, 1500);
            } else {
                setSuccess(t('auth.registrationSuccess'));
                switchMode('login');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby={modalTitleId}
                aria-describedby={modalSubtitleId}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-tabs">
                        <button 
                            type="button"
                            className={`modal-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => switchMode('login')}
                        >
                            {t('auth.loginTab')}
                        </button>
                        <button 
                            type="button"
                            className={`modal-tab ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => switchMode('register')}
                        >
                            {t('auth.registerTab')}
                        </button>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose} aria-label={t('auth.close')}>&times;</button>
                </div>

                <div
                    className={`modal-body ${showRegisterScrollHint ? 'modal-body-scroll-hint' : ''}`}
                    ref={modalBodyRef}
                >
                    <h2 className="modal-title" id={modalTitleId}>
                        {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
                    </h2>
                    <p className="modal-subtitle" id={modalSubtitleId}>
                        {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                    </p>

                    <div className="social-auth-row">
                        <button
                            type="button"
                            className={`btn btn-outline auth-social-btn auth-social-btn-google ${socialLoadingProvider === 'google' ? 'is-loading' : ''}`}
                            onClick={() => openSocialAuth('google')}
                            aria-label={t('auth.google')}
                            disabled={loading || Boolean(socialLoadingProvider)}
                        >
                            <span className="auth-social-icon-shell" aria-hidden="true">
                                <SocialProviderIcon provider="google" />
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`btn btn-outline auth-social-btn auth-social-btn-facebook ${socialLoadingProvider === 'facebook' ? 'is-loading' : ''}`}
                            onClick={() => openSocialAuth('facebook')}
                            aria-label={t('auth.facebook')}
                            disabled={loading || Boolean(socialLoadingProvider)}
                        >
                            <span className="auth-social-icon-shell" aria-hidden="true">
                                <SocialProviderIcon provider="facebook" />
                            </span>
                        </button>
                    </div>

                    {error && <div className="modal-error">{error}</div>}
                    {success && <div className="modal-success">{success}</div>}

                    <form id={authFormId} onSubmit={handleSubmit} className="auth-form">
                        {mode === 'register' && (
                            <div className="form-group">
                                <label htmlFor="auth-username">{t('auth.username')}</label>
                                <input 
                                    id="auth-username"
                                    name="username"
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your_dj_name"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="auth-email">{t('auth.email')}</label>
                            <input 
                                id="auth-email"
                                name="email"
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="auth-password">{t('auth.password')}</label>
                            <input 
                                id="auth-password"
                                name="password"
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                required
                            />
                        </div>
                    </form>
                </div>

                <div className="modal-actions">
                    {mode === 'register' && (
                        <TurnstileCaptcha
                            enabled={true}
                            siteKey={TURNSTILE_SITE_KEY}
                            onTokenChange={handleCaptchaTokenChange}
                            onStatusChange={handleCaptchaStatusChange}
                        />
                    )}
                    <button
                        type="submit"
                        form={authFormId}
                        className="btn btn-primary btn-block"
                        disabled={
                            loading
                            || (mode === 'register' && (!TURNSTILE_SITE_KEY || captchaStatus === 'loading' || !captchaToken))
                        }
                    >
                        {loading ? (
                            <span className="loader-mini"></span>
                        ) : (
                            mode === 'login' ? t('auth.loginSubmit') : t('auth.registerSubmit')
                        )}
                    </button>
                </div>

                <div className="modal-footer">
                    <p>
                        {mode === 'login' 
                            ? t('auth.noAccount')
                            : t('auth.hasAccount')}
                        <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                            {mode === 'login' ? t('auth.registerHere') : t('auth.loginHere')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
