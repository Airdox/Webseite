import { describe, expect, it } from 'vitest';
import { handlerResultResponse, invalidRequestResponse, jsonResponse } from '../httpResponses';

describe('httpResponses', () => {
    it('builds JSON responses with content type and status', async () => {
        const response = jsonResponse({ ok: true }, {
            status: 202,
            headers: { 'cache-control': 'no-store' },
        });

        expect(response.status).toBe(202);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.json()).toEqual({ ok: true });
    });

    it('maps handler results and invalid request responses', async () => {
        const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
        const resultResponse = handlerResultResponse({
            status: 201,
            headers: { 'cache-control': 'no-store' },
            body: { stored: true },
        }, corsHeaders);

        expect(resultResponse.status).toBe(201);
        expect(resultResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(await resultResponse.json()).toEqual({ stored: true });

        const invalid = invalidRequestResponse(corsHeaders);
        expect(invalid.status).toBe(400);
        expect(await invalid.json()).toEqual({ ok: false, error: 'Invalid Request' });
    });
});
