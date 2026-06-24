import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getSocialConfig,
    hashPassword,
    hashPasswordLegacy,
    isCaptchaRequired,
    isLegacyPasswordHash,
    isDevSocialAuthAllowed,
    normalizeIp,
    normalizeUsername,
    sanitizeEmail,
    validatePasswordPolicy,
    verifyPasswordHash,
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

    it('uses versioned PBKDF2 hashes while still verifying legacy hashes', async () => {
        const password = 'LongEnoughPassword123!';
        const salt = '0123456789abcdef0123456789abcdef';
        const hash = await hashPassword(password, salt);

        expect(hash).toMatch(/^pbkdf2_sha256\$\d+\$/);
        expect(isLegacyPasswordHash(hash)).toBe(false);
        await expect(verifyPasswordHash({ password, salt, storedHash: hash })).resolves.toBe(true);
        await expect(verifyPasswordHash({ password: 'wrong-password', salt, storedHash: hash })).resolves.toBe(false);

        const legacyHash = await hashPasswordLegacy(password, salt);
        expect(isLegacyPasswordHash(legacyHash)).toBe(true);
        await expect(verifyPasswordHash({ password, salt, storedHash: legacyHash })).resolves.toBe(true);
    });

    it('enforces the registration password policy', () => {
        expect(validatePasswordPolicy('short')).toEqual({
            ok: false,
            error: 'Password must be at least 12 characters long',
        });
        expect(validatePasswordPolicy('LongEnough12')).toEqual({ ok: true });
        expect(validatePasswordPolicy('x'.repeat(129))).toEqual({
            ok: false,
            error: 'Password must be at most 128 characters long',
        });
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
