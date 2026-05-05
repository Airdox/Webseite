import { describe, expect, it } from 'vitest';
import { readApiError, readApiJson } from '../apiResponse';

describe('apiResponse helpers', () => {
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
});
