export const getAllowedOAuthProviders = (providers = []) => (
    providers.filter((provider) => provider === 'google' || provider === 'facebook')
);

export const buildAuthPayload = ({ mode, email, password, username, captchaToken }) => (
    mode === 'login'
        ? { email, password }
        : { email, password, username, captchaToken }
);

export const validateRegistrationCaptcha = ({
    mode,
    siteKey,
    captchaStatus,
    captchaToken,
    messages,
}) => {
    if (mode !== 'register') return;
    if (!siteKey) throw new Error(messages.registrationDisabled);
    if (captchaStatus === 'loading') throw new Error(messages.captchaLoading);
    if (captchaStatus === 'error') throw new Error(messages.captchaLoadError);
    if (!captchaToken) throw new Error(messages.captchaRequired);
};
