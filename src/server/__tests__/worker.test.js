import { beforeEach, describe, expect, it, vi } from 'vitest';

const handleSubscribeRequest = vi.fn();
const handleAuthRequest = vi.fn();

vi.mock('../../lib/stats-logic.js', () => ({
    handleStatsRequest: vi.fn(),
    handleBookingRequest: vi.fn(),
    handleAuthRequest,
    handleSubscribeRequest,
}));

describe('worker API routing', () => {
    beforeEach(() => {
        handleSubscribeRequest.mockReset();
        handleAuthRequest.mockReset();
    });

    it('routes POST /api/subscribe to the subscribe handler', async () => {
        handleSubscribeRequest.mockResolvedValue({
            status: 200,
            body: { ok: true, success: true },
        });
        const { default: worker } = await import('../worker.js');
        const request = new Request('https://airdox.test/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'reach-test@example.com' }),
        });

        const response = await worker.fetch(request, {}, {});
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ ok: true, success: true });
        expect(handleSubscribeRequest).toHaveBeenCalledWith({
            body: { email: 'reach-test@example.com' },
            env: {},
        });
    });

    it('blocks direct full-file audio downloads without a Range header', async () => {
        const { default: worker } = await import('../worker.js');
        const response = await worker.fetch(
            new Request('https://airdox.test/api/audio/recording_2026_05_07-2.mp3'),
            {},
            {},
        );
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toMatch(/Full audio downloads are disabled/i);
    });

    it('streams known public audio only through byte ranges', async () => {
        const get = vi.fn(async (key, options) => {
            if (options?.range) {
                return { key, size: 10, body: 'abcde' };
            }
            return { key, size: 10, body: '0123456789' };
        });
        const { default: worker } = await import('../worker.js');
        const headers = {
            get: (name) => (String(name).toLowerCase() === 'range' ? 'bytes=0-4' : null),
            entries: () => [['range', 'bytes=0-4']][Symbol.iterator](),
        };

        const response = await worker.fetch(
            {
                url: 'https://airdox.test/api/audio?file=recording_2026_05_07-2.mp3',
                method: 'GET',
                headers,
            },
            { PUBLIC: { get } },
            {},
        );

        expect(response.status).toBe(206);
        expect(response.headers.get('Content-Range')).toBe('bytes 0-4/10');
        expect(response.headers.get('Content-Disposition')).toBe('inline');
        expect(await response.text()).toBe('abcde');
        expect(get).toHaveBeenCalledWith('public/recording_2026_05_07-2.mp3');
        expect(get).toHaveBeenCalledWith('public/recording_2026_05_07-2.mp3', {
            range: { offset: 0, length: 5 },
        });
    });

    it('does not expose arbitrary mp3 files from the bucket', async () => {
        const get = vi.fn();
        const { default: worker } = await import('../worker.js');

        const response = await worker.fetch(
            new Request('https://airdox.test/api/audio/private-master.mp3', {
                headers: { range: 'bytes=0-4' },
            }),
            { PUBLIC: { get } },
            {},
        );

        expect(response.status).toBe(404);
        expect(get).not.toHaveBeenCalled();
    });

    it('requires a valid VIP token before streaming archive audio', async () => {
        const get = vi.fn();
        const { default: worker } = await import('../worker.js');

        const response = await worker.fetch(
            new Request('https://airdox.test/api/audio/Airdox_REC_2026_03_15.mp3', {
                headers: { range: 'bytes=0-4' },
            }),
            { PUBLIC: { get } },
            {},
        );

        expect(response.status).toBe(401);
        expect(get).not.toHaveBeenCalled();
        expect(handleAuthRequest).not.toHaveBeenCalled();
    });
});
