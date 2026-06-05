import React, { useState, useEffect, useRef, useCallback } from 'react';
import TurnstileCaptcha from './TurnstileCaptcha';
import AuthModalFields from './AuthModalFields';
import AuthSocialButtons from './AuthSocialButtons';
import './AuthModal.css';
import { t } from '../utils/i18n';
import {
    resolveApiBaseUrl,
    resolveApiOrigin,
} from '../utils/apiResponse';
import { apiErrorMessage, requestApiJson } from '../utils/apiClient';
import { setStorageItem, STORAGE_KEYS } from '../utils/websiteContracts';
import { buildAuthPayload, getAllowedOAuthProviders, validateRegistrationCaptcha } from './authModalUtils';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

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
    const [oauthProviders, setOauthProviders] = useState([]);
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
        if (!isOpen) return undefined;

        let disposed = false;
        const controller = new AbortController();

        const loadOAuthConfig = async () => {
            try {
                const { response, data } = await requestApiJson('/api/oauth/config', {
                    method: 'GET',
                    signal: controller.signal,
                });
                if (!disposed && response.ok && Array.isArray(data.providers)) {
                    setOauthProviders(getAllowedOAuthProviders(data.providers));
                }
            } catch {
                if (!disposed) setOauthProviders([]);
            }
        };

        setOauthProviders([]);
        loadOAuthConfig();

        return () => {
            disposed = true;
            controller.abort();
        };
    }, [isOpen]);

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
            setStorageItem(STORAGE_KEYS.authToken, data.token);
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
            validateRegistrationCaptcha({
                mode,
                siteKey: TURNSTILE_SITE_KEY,
                captchaStatus,
                captchaToken,
                messages: {
                    registrationDisabled: t('auth.registrationDisabled'),
                    captchaLoading: t('captcha.loading'),
                    captchaLoadError: t('captcha.loadError'),
                    captchaRequired: t('auth.captchaRequired'),
                },
            });

            const payload = buildAuthPayload({ mode, email, password, username, captchaToken });

            const { response, data } = await requestApiJson(mode === 'login' ? '/api/login' : '/api/register', {
                method: 'POST',
                body: payload,
            });

            if (!response.ok) {
                throw new Error(apiErrorMessage(data, t('auth.genericError')));
            }

            if (mode === 'login') {
                setStorageItem(STORAGE_KEYS.authToken, data.token);
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

                    <AuthSocialButtons
                        providers={oauthProviders}
                        socialLoadingProvider={socialLoadingProvider}
                        loading={loading}
                        onOpenSocialAuth={openSocialAuth}
                    />

                    {error && <div className="modal-error">{error}</div>}
                    {success && <div className="modal-success">{success}</div>}

                    <form id={authFormId} onSubmit={handleSubmit} className="auth-form">
                        <AuthModalFields
                            mode={mode}
                            username={username}
                            email={email}
                            password={password}
                            setUsername={setUsername}
                            setEmail={setEmail}
                            setPassword={setPassword}
                        />
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
