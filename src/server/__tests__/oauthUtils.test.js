import { describe, expect, it } from 'vitest';
import {
    buildSetCookieHeader,
    isDevSocialAuthBypassEnabled,
    parseCookies,
    sanitizeOrigin,
} from '../oauthUtils';

describe('oauth worker utilities', () => {
    it('parses encoded cookies without throwing on malformed values', () => {
        const request = new Request('https://airdox.test', {
            headers: { cookie: 'a=one; b=two%20words; bad=%E0%A4%A' },
        });

        expect(parseCookies(request)).toEqual({
            a: 'one',
            b: 'two words',
            bad: '%E0%A4%A',
        });
    });

    it('sanitizes allowed OAuth origins', () => {
        expect(sanitizeOrigin('https://airdox.test/path')).toBe('https://airdox.test');
        expect(sanitizeOrigin('javascript:alert(1)')).toBe('');
    });

    it('gates dev social auth bypass to localhost', () => {
        expect(isDevSocialAuthBypassEnabled(
            { ALLOW_DEV_SOCIAL_AUTH: 'true' },
            new Request('http://localhost:5173/api/oauth/dev')
        )).toBe(true);
        expect(isDevSocialAuthBypassEnabled(
            { ALLOW_DEV_SOCIAL_AUTH: 'true' },
            new Request('https://airdox.test/api/oauth/dev')
        )).toBe(false);
    });

    it('adds secure cookie attributes for HTTPS requests', () => {
        expect(buildSetCookieHeader(new Request('https://airdox.test'), {
            name: 'state',
            value: 'abc',
            maxAge: 60,
        })).toContain('Secure');
    });
});
