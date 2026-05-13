import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/i18n', () => ({
    t: (key) => ({
        'auth.loginTab': 'ANMELDEN',
        'auth.registerTab': 'REGISTRIEREN',
        'auth.loginTitle': 'Login',
        'auth.registerTitle': 'Register',
        'auth.loginSubtitle': 'Login subtitle',
        'auth.registerSubtitle': 'Register subtitle',
        'auth.google': 'Weiter mit Google',
        'auth.facebook': 'Weiter mit Facebook',
        'auth.close': 'Schliessen',
        'auth.oauthFailed': 'OAuth fehlgeschlagen',
        'auth.loginSuccess': 'Login erfolgreich',
        'auth.username': 'Benutzername',
        'auth.email': 'E-Mail',
        'auth.password': 'Passwort',
        'auth.captchaRequired': 'Bitte CAPTCHA bestaetigen.',
        'auth.loginSubmit': 'Anmelden',
        'auth.registerSubmit': 'Konto erstellen',
        'auth.noAccount': 'Kein Konto?',
        'auth.hasAccount': 'Schon Konto?',
        'auth.registerHere': 'Hier registrieren',
        'auth.loginHere': 'Hier anmelden',
    }[key] || key),
}));

vi.mock('../TurnstileCaptcha', () => ({
    default: ({ onTokenChange, onStatusChange }) => {
        return (
            <button
                type="button"
                data-testid="mock-turnstile"
                onClick={() => {
                    onStatusChange?.('verified');
                    onTokenChange?.('captcha-token');
                }}
            >
                captcha
            </button>
        );
    },
}));

let AuthModal;

beforeAll(async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-site-key');
    AuthModal = (await import('../AuthModal')).default;
});

describe('AuthModal', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        vi.stubGlobal('fetch', vi.fn(async (url) => {
            if (String(url).includes('/api/oauth/config')) {
                return {
                    ok: true,
                    json: async () => ({ ok: true, providers: ['google', 'facebook'] }),
                };
            }
            return {
                ok: true,
                json: async () => ({ ok: true, message: 'ok' }),
            };
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('opens Google OAuth popup with provider, mode and origin', async () => {
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

        render(<AuthModal isOpen onClose={vi.fn()} initialMode="register" />);

        fireEvent.click(await screen.findByRole('button', { name: /Weiter mit Google/i }));

        expect(openSpy).toHaveBeenCalledTimes(1);
        const [url] = openSpy.mock.calls[0];
        expect(url).toContain('/api/oauth/start');
        expect(url).toContain('provider=google');
        expect(url).toContain('mode=register');
        expect(url).toContain(`origin=${encodeURIComponent(window.location.origin)}`);
    });

    it('stores token and closes on oauth success message', async () => {
        const onClose = vi.fn();
        vi.spyOn(window, 'open').mockReturnValue({ closed: false, close: vi.fn(), focus: vi.fn() });

        render(<AuthModal isOpen onClose={onClose} initialMode="login" />);

        window.dispatchEvent(new MessageEvent('message', {
            origin: window.location.origin,
            data: { source: 'airdox-oauth', ok: true, token: 'tok_123' },
        }));

        await waitFor(() => {
            expect(localStorage.getItem('airdox_token')).toBe('tok_123');
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('submits register form with captcha token', async () => {
        const fetchSpy = vi.fn(async (url) => {
            if (String(url).includes('/api/oauth/config')) {
                return {
                    ok: true,
                    json: async () => ({ ok: true, providers: ['google', 'facebook'] }),
                };
            }
            return {
                ok: true,
                json: async () => ({ ok: true, message: 'ok' }),
            };
        });
        vi.stubGlobal('fetch', fetchSpy);

        render(<AuthModal isOpen onClose={vi.fn()} initialMode="register" />);
        await waitFor(() => {
            expect(screen.getByTestId('mock-turnstile')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId('mock-turnstile'));

        fireEvent.change(screen.getByLabelText('Benutzername'), { target: { value: 'tester' } });
        fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'tester@example.com' } });
        fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'Secret123!' } });

        const submitButton = screen.getByRole('button', { name: /Konto erstellen/i });
        await waitFor(() => {
            expect(submitButton).toBeEnabled();
        });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalled();
        });

        const registerCall = fetchSpy.mock.calls.find(([endpoint]) => String(endpoint).includes('/api/register'));
        const [endpoint, requestInit] = registerCall;
        expect(endpoint).toContain('/api/register');
        expect(JSON.parse(requestInit.body)).toMatchObject({
            username: 'tester',
            email: 'tester@example.com',
            captchaToken: 'captcha-token',
        });
    });
});
