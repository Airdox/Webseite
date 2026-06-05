import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiErrorMessage, requestApiJson } from '../apiClient';

describe('apiClient helpers', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('posts JSON payloads with the shared API base handling', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 })));

        const result = await requestApiJson('/api/test', {
            method: 'POST',
            body: { value: 1 },
        });

        expect(fetch).toHaveBeenCalledWith('/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: 1 }),
        });
        expect(result.data).toEqual({ ok: true });
    });

    it('keeps API-provided error messages centralized', () => {
        expect(apiErrorMessage({ error: 'No database' }, 'Fallback')).toBe('No database');
        expect(apiErrorMessage({ message: 'Bad request' }, 'Fallback')).toBe('Bad request');
        expect(apiErrorMessage({}, 'Fallback')).toBe('Fallback');
    });
});
