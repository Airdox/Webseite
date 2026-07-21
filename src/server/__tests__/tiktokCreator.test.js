import { describe, expect, it } from 'vitest';
import {
    handleTikTokConfig,
    handleTikTokOAuthCallback,
    handleTikTokOAuthStart,
    handleTikTokPublish,
    tiktokCreatorConstants,
} from '../tiktokCreator.js';

const configuredEnv = {
    PUBLIC_APP_ORIGIN: 'https://airdox.info',
    TIKTOK_CLIENT_KEY: 'test-client-key',
    TIKTOK_CLIENT_SECRET: 'test-client-secret',
    TIKTOK_TOKEN_ENCRYPTION_KEY: btoa('12345678901234567890123456789012'),
};

describe('TikTok creator endpoints', () => {
    it('reports direct-post mode and its upload restrictions', async () => {
        const response = await handleTikTokConfig(new Request('https://airdox.info/api/tiktok/config'), configuredEnv);
        const body = await response.json();

        expect(body).toMatchObject({ ok: true, enabled: true, mode: 'creator_direct_post' });
        expect(body.maxVideoBytes).toBe(50 * 1024 * 1024);
        expect(body.acceptedVideoTypes).toContain('video/mp4');
    });

    it('requests only basic profile and direct publish scopes', async () => {
        const response = await handleTikTokOAuthStart(new Request('https://airdox.info/api/tiktok/oauth/start'), configuredEnv);
        const target = new URL(response.headers.get('Location'));

        expect(response.status).toBe(302);
        expect(target.origin).toBe('https://www.tiktok.com');
        expect(target.searchParams.get('scope')).toBe('user.info.basic,video.publish');
        expect(target.searchParams.get('redirect_uri')).toBe('https://airdox.info/oauth/tiktok/callback');
        expect(target.searchParams.get('scope')).not.toContain('video.upload');
        expect(response.headers.get('Set-Cookie')).toContain(`${tiktokCreatorConstants.STATE_COOKIE}=`);
        expect(response.headers.get('Set-Cookie')).toContain('HttpOnly');
    });

    it('rejects OAuth callbacks whose state does not match', async () => {
        const response = await handleTikTokOAuthCallback(
            new Request('https://airdox.info/oauth/tiktok/callback?code=demo&state=attacker', {
                headers: { Cookie: `${tiktokCreatorConstants.STATE_COOKIE}=expected` },
            }),
            configuredEnv,
        );

        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('https://airdox.info/tiktok-creator?error=invalid_state');
    });

    it('rejects cross-origin publish attempts before reading a session', async () => {
        const response = await handleTikTokPublish(new Request('https://airdox.info/api/tiktok/publish', {
            method: 'POST',
            headers: { Origin: 'https://attacker.example', 'Content-Type': 'video/mp4', 'Content-Length': '4' },
            body: 'demo',
        }), configuredEnv);

        expect(response.status).toBe(403);
    });

    it('rejects unsupported media types and oversized files', async () => {
        const unsupported = await handleTikTokPublish(new Request('https://airdox.info/api/tiktok/publish', {
            method: 'POST', headers: { 'Content-Type': 'text/plain', 'Content-Length': '4' }, body: 'demo',
        }), configuredEnv);
        const oversized = await handleTikTokPublish(new Request('https://airdox.info/api/tiktok/publish', {
            method: 'POST', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(51 * 1024 * 1024) }, body: 'demo',
        }), configuredEnv);

        expect(unsupported.status).toBe(415);
        expect(oversized.status).toBe(413);
    });

    it('requires an explicit privacy choice and publishing confirmations', async () => {
        const response = await handleTikTokPublish(new Request('https://airdox.info/api/tiktok/publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'video/mp4',
                'X-AIRDOX-Video-Size': '4',
                'X-AIRDOX-TikTok-Title': btoa('demo'),
            },
            body: 'demo',
        }), configuredEnv);

        expect(response.status).toBe(400);
        expect((await response.json()).error).toContain('privacy');
    });
});
