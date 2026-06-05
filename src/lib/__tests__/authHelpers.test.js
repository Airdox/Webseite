import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getSocialConfig,
    isCaptchaRequired,
    isDevSocialAuthAllowed,
    normalizeIp,
    normalizeUsername,
    sanitizeEmail,
    verifyTurnstileCaptcha,
} from '../authHelpers';

describe('authHelpers', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('normalizes public auth inputs', () => {
        expect(normalizeIp(` ${'1'.repeat(140)} `)).toHaveLength(128);
        expect(normalizeUsername(' DJ Name!* ')).toBe('dj_name_');
        expect(normalizeUsername('')).toBe('user');
        expect(sanitizeEmail(' Test@Example.COM ')).toBe('test@example.com');
    });

    it('resolves flags and social provider config', () => {
        expect(isCaptchaRequired({ REQUIRE_CAPTCHA: 'off' })).toBe(false);
        expect(isCaptchaRequired({})).toBe(true);
        expect(isDevSocialAuthAllowed({ ALLOW_DEV_SOCIAL_AUTH: 'yes' })).toBe(true);
        expect(getSocialConfig('google', {
            GOOGLE_CLIENT_ID: 'gid',
            GOOGLE_CLIENT_SECRET: 'gsecret',
        })).toMatchObject({
            provider: 'google',
            clientId: 'gid',
            clientSecret: 'gsecret',
            scope: 'openid email profile',
        });
        expect(getSocialConfig('github', {})).toBeNull();
    });

    it('verifies turnstile success and rejects action mismatches', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({
            success: true,
            action: 'register',
        }), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        await expect(verifyTurnstileCaptcha({
            token: 'captcha',
            clientIp: '127.0.0.1',
            env: { TURNSTILE_SECRET_KEY: 'secret' },
            expectedAction: 'register',
        })).resolves.toEqual({ ok: true });

        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
            success: true,
            action: 'login',
        }), { status: 200 }));

        await expect(verifyTurnstileCaptcha({
            token: 'captcha',
            env: { TURNSTILE_SECRET_KEY: 'secret' },
            expectedAction: 'register',
        })).resolves.toEqual({ ok: false, error: 'CAPTCHA verification failed' });
    });
});
