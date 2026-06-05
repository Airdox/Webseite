import React from 'react';
import { t } from '../utils/i18n';
import AuthSocialProviderIcon from './AuthSocialProviderIcon';

const socialProviders = [
    {
        id: 'google',
        className: 'auth-social-btn-google',
        labelKey: 'auth.google',
    },
    {
        id: 'facebook',
        className: 'auth-social-btn-facebook',
        labelKey: 'auth.facebook',
    },
];

const AuthSocialButtons = ({
    providers,
    socialLoadingProvider,
    loading,
    onOpenSocialAuth,
}) => {
    const visibleProviders = socialProviders.filter((provider) => providers.includes(provider.id));
    if (visibleProviders.length === 0) return null;

    return (
        <div className="social-auth-row">
            {visibleProviders.map((provider) => (
                <button
                    key={provider.id}
                    type="button"
                    className={`btn btn-outline auth-social-btn ${provider.className} ${socialLoadingProvider === provider.id ? 'is-loading' : ''}`}
                    onClick={() => onOpenSocialAuth(provider.id)}
                    aria-label={t(provider.labelKey)}
                    disabled={loading || Boolean(socialLoadingProvider)}
                >
                    <span className="auth-social-icon-shell" aria-hidden="true">
                        <AuthSocialProviderIcon provider={provider.id} />
                    </span>
                </button>
            ))}
        </div>
    );
};

export default AuthSocialButtons;
