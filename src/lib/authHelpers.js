import {
    TURNSTILE_MAX_TOKEN_LENGTH,
    TURNSTILE_VERIFY_TIMEOUT_MS,
    TURNSTILE_VERIFY_URL,
} from './statsContracts.js';

export const hashPassword = async (password, saltString) => {
    const enc = new TextEncoder();
    const data = enc.encode(password + saltString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const generateRandomHex = (bytes) => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const generateSalt = () => generateRandomHex(16);
export const generateToken = () => generateRandomHex(32);

export const resolveTurnstileSecret = (env) => (
    env.TURNSTILE_SECRET_KEY
    || env.TURNSTILE_SECRET
    || env.CAPTCHA_SECRET_KEY
    || ''
);

export const isCaptchaRequired = (env) => {
    const flag = String(env.REQUIRE_CAPTCHA || '').trim().toLowerCase();
    if (flag === 'false' || flag === '0' || flag === 'off' || flag === 'no') return false;
    return true;
};

export const isDevSocialAuthAllowed = (env) => {
    const flag = String(env.ALLOW_DEV_SOCIAL_AUTH || '').trim().toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes' || flag === 'on';
};

export const normalizeIp = (value) => String(value || '').trim().slice(0, 128);

export const normalizeUsername = (value = '') => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 32) || 'user';

export const sanitizeEmail = (value = '') => String(value || '').trim().toLowerCase();

export const buildSyntheticEmail = (provider, providerUserId) => `${provider}_${providerUserId}@social.airdox.local`;

export const getSocialConfig = (provider, env) => {
    if (provider === 'google') {
        return {
            provider,
            clientId: env.GOOGLE_CLIENT_ID || '',
            clientSecret: env.GOOGLE_CLIENT_SECRET || '',
            authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
            userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
            scope: 'openid email profile',
        };
    }
    if (provider === 'facebook') {
        return {
            provider,
            clientId: env.FACEBOOK_APP_ID || '',
            clientSecret: env.FACEBOOK_APP_SECRET || '',
            authEndpoint: 'https://www.facebook.com/v20.0/dialog/oauth',
            tokenEndpoint: 'https://graph.facebook.com/v20.0/oauth/access_token',
            userinfoEndpoint: 'https://graph.facebook.com/me?fields=id,name,email',
            scope: 'email,public_profile',
        };
    }
    return null;
};

const exchangeGoogleCode = async ({ config, code, redirectUri }) => {
    const form = new URLSearchParams();
    form.set('client_id', config.clientId);
    form.set('client_secret', config.clientSecret);
    form.set('code', code);
    form.set('grant_type', 'authorization_code');
    form.set('redirect_uri', redirectUri);

    const tokenRes = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error('Google token exchange failed');
    }

    const profileRes = await fetch(config.userinfoEndpoint, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json().catch(() => ({}));
    if (!profileRes.ok || !profile?.sub) {
        throw new Error('Google userinfo request failed');
    }

    return {
        provider: 'google',
        providerUserId: String(profile.sub),
        email: sanitizeEmail(profile.email),
        username: String(profile.name || profile.email || `google_${profile.sub}`),
    };
};

const exchangeFacebookCode = async ({ config, code, redirectUri }) => {
    const tokenUrl = new URL(config.tokenEndpoint);
    tokenUrl.searchParams.set('client_id', config.clientId);
    tokenUrl.searchParams.set('client_secret', config.clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error('Facebook token exchange failed');
    }

    const profileRes = await fetch(config.userinfoEndpoint, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json().catch(() => ({}));
    if (!profileRes.ok || !profile?.id) {
        throw new Error('Facebook userinfo request failed');
    }

    return {
        provider: 'facebook',
        providerUserId: String(profile.id),
        email: sanitizeEmail(profile.email),
        username: String(profile.name || `facebook_${profile.id}`),
    };
};

export const exchangeSocialCode = async ({ provider, code, redirectUri, env }) => {
    const config = getSocialConfig(provider, env);
    if (!config || !config.clientId || !config.clientSecret) {
        throw new Error(`${provider} OAuth is not configured`);
    }
    if (provider === 'google') return exchangeGoogleCode({ config, code, redirectUri });
    if (provider === 'facebook') return exchangeFacebookCode({ config, code, redirectUri });
    throw new Error('Unsupported social provider');
};

export const verifyTurnstileCaptcha = async ({ token, clientIp, env, expectedAction = '' }) => {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return { ok: false, error: 'CAPTCHA token missing' };
    if (normalizedToken.length > TURNSTILE_MAX_TOKEN_LENGTH) {
        return { ok: false, error: 'CAPTCHA verification failed' };
    }

    const secret = resolveTurnstileSecret(env);
    if (!secret) return { ok: false, error: 'CAPTCHA service not configured' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_VERIFY_TIMEOUT_MS);

    try {
        const formBody = new URLSearchParams();
        formBody.set('secret', secret);
        formBody.set('response', normalizedToken);
        if (clientIp) formBody.set('remoteip', clientIp);

        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
            signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
            return { ok: false, error: 'CAPTCHA verification failed' };
        }

        const normalizedExpectedAction = String(expectedAction || '').trim();
        const isTurnstileTestKeyResult = payload?.metadata?.result_with_testing_key === true;
        if (normalizedExpectedAction && !isTurnstileTestKeyResult) {
            const responseAction = String(payload?.action || '').trim();
            if (responseAction !== normalizedExpectedAction) {
                return { ok: false, error: 'CAPTCHA verification failed' };
            }
        }

        return { ok: true };
    } catch (error) {
        if (error?.name === 'AbortError') {
            return { ok: false, error: 'CAPTCHA verification failed' };
        }
        console.error('CAPTCHA verification error:', error);
        return { ok: false, error: 'CAPTCHA verification failed' };
    } finally {
        clearTimeout(timeoutId);
    }
};
