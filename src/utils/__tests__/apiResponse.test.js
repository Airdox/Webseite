import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildApiUrl,
    buildRuntimeApiUrl,
    getRuntimeApiBase,
    readApiError,
    readApiJson,
    resolveApiOrigin,
} from '../apiResponse';

describe('apiResponse helpers', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns an empty object for empty JSON responses', async () => {
        const response = new Response('', { status: 502 });

        await expect(readApiJson(response)).resolves.toEqual({});
    });

    it('falls back when an error response is not valid JSON', async () => {
        const response = new Response('', { status: 502 });

        await expect(readApiError(response, 'Request failed')).resolves.toBe('Request failed');
    });

    it('reads API-provided error messages when available', async () => {
        const response = new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });

        await expect(readApiError(response, 'Request failed')).resolves.toBe('Database not configured');
    });

    it('reads mock responses that expose json without text', async () => {
        const response = {
            json: async () => ({ ok: true }),
        };

        await expect(readApiJson(response)).resolves.toEqual({ ok: true });
    });

    it('keeps API paths relative when no public API base is configured', () => {
        vi.stubEnv('VITE_STATS_API_BASE', '');

        expect(buildApiUrl('/api/subscribe')).toBe('/api/subscribe');
    });

    it('resolves API paths and origins from the configured public API base', () => {
        vi.stubEnv('VITE_STATS_API_BASE', 'https://airdox.example.test/');

        expect(buildApiUrl('/api/subscribe')).toBe('https://airdox.example.test/api/subscribe');
        expect(resolveApiOrigin()).toBe('https://airdox.example.test');
    });

    it('uses explicit runtime API bases before production fallbacks', () => {
        expect(getRuntimeApiBase('https://api.airdox.test/')).toBe('https://api.airdox.test');
        expect(buildRuntimeApiUrl('/api/stats', 'https://api.airdox.test/')).toBe('https://api.airdox.test/api/stats');
    });

    it('keeps runtime API paths relative in test mode without configured bases', () => {
        expect(getRuntimeApiBase('')).toBe('');
        expect(buildRuntimeApiUrl('/api/stats')).toBe('/api/stats');
    });
});
