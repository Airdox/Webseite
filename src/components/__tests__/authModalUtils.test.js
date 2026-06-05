import { describe, expect, it } from 'vitest';
import {
    buildAuthPayload,
    getAllowedOAuthProviders,
    validateRegistrationCaptcha,
} from '../authModalUtils';

describe('authModalUtils', () => {
    it('filters OAuth providers to supported social logins', () => {
        expect(getAllowedOAuthProviders(['google', 'github', 'facebook'])).toEqual(['google', 'facebook']);
    });

    it('builds login and register payloads without changing field names', () => {
        expect(buildAuthPayload({
            mode: 'login',
            email: 'dj@example.com',
            password: 'secret',
            username: 'ignored',
            captchaToken: 'ignored',
        })).toEqual({
            email: 'dj@example.com',
            password: 'secret',
        });

        expect(buildAuthPayload({
            mode: 'register',
            email: 'dj@example.com',
            password: 'secret',
            username: 'airdox',
            captchaToken: 'captcha',
        })).toEqual({
            email: 'dj@example.com',
            password: 'secret',
            username: 'airdox',
            captchaToken: 'captcha',
        });
    });

    it('enforces registration captcha requirements only in register mode', () => {
        const messages = {
            registrationDisabled: 'disabled',
            captchaLoading: 'loading',
            captchaLoadError: 'load error',
            captchaRequired: 'required',
        };

        expect(() => validateRegistrationCaptcha({
            mode: 'login',
            siteKey: '',
            captchaStatus: 'idle',
            captchaToken: '',
            messages,
        })).not.toThrow();

        expect(() => validateRegistrationCaptcha({
            mode: 'register',
            siteKey: 'site',
            captchaStatus: 'idle',
            captchaToken: '',
            messages,
        })).toThrow('required');
    });
});
