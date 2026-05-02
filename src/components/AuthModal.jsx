import React, { useState, useEffect } from 'react';
import TurnstileCaptcha from './TurnstileCaptcha';
import './AuthModal.css';
import { t } from '../utils/i18n';

const API_BASE = (import.meta.env.VITE_STATS_API_BASE || '').replace(/\/+$/, '');
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

    useEffect(() => {
        setMode(initialMode);
        setError('');
        setSuccess('');
        setCaptchaToken('');
        setCaptchaStatus('idle');
    }, [initialMode, isOpen]);

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
            if (event.origin !== window.location.origin) return;
            const data = event.data || {};
            if (data.source !== 'airdox-oauth') return;
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
        return () => window.removeEventListener('message', onMessage);
    }, [onClose]);

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError('');
        setSuccess('');
        setCaptchaToken('');
        setCaptchaStatus('idle');
    };

    if (!isOpen) return null;

    const modalTitleId = 'auth-modal-title';
    const modalSubtitleId = 'auth-modal-subtitle';

    const openSocialAuth = (provider) => {
        setError('');
        const oauthUrl = `${API_BASE}/api/oauth/start?provider=${encodeURIComponent(provider)}&mode=${encodeURIComponent(mode)}`;
        window.open(
            oauthUrl,
            'airdox_oauth_popup',
            'popup=yes,width=520,height=720,left=120,top=80'
        );
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

                <div className="modal-body">
                    <h2 className="modal-title" id={modalTitleId}>
                        {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
                    </h2>
                    <p className="modal-subtitle" id={modalSubtitleId}>
                        {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                    </p>

                    <div className="social-auth-row">
                        <button type="button" className="btn btn-outline btn-block" onClick={() => openSocialAuth('google')}>
                            {t('auth.google')}
                        </button>
                        <button type="button" className="btn btn-outline btn-block" onClick={() => openSocialAuth('facebook')}>
                            {t('auth.facebook')}
                        </button>
                    </div>

                    {error && <div className="modal-error">{error}</div>}
                    {success && <div className="modal-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
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
                        {mode === 'register' && (
                            <TurnstileCaptcha
                                enabled={true}
                                siteKey={TURNSTILE_SITE_KEY}
                                onTokenChange={(token) => {
                                    setCaptchaToken(token);
                                    if (token) setError('');
                                }}
                                onStatusChange={(status) => {
                                    setCaptchaStatus(status);
                                    if (status === 'verified') setError('');
                                }}
                            />
                        )}
                        
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading || (mode === 'register' && (!TURNSTILE_SITE_KEY || captchaStatus === 'loading'))}
                        >
                            {loading ? (
                                <span className="loader-mini"></span>
                            ) : (
                                mode === 'login' ? t('auth.loginSubmit') : t('auth.registerSubmit')
                            )}
                        </button>
                    </form>
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
