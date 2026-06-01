
import { Router } from './router.js';
import { handleStatsRequest, handleBookingRequest, handleAuthRequest, handleSubscribeRequest, handleAudienceEventRequest } from '../lib/stats-logic.js';
import { sets } from '../data/musicSets.js';
import { normalizeAudioBaseFilename, partitionSetsByAccess } from '../lib/set-access.js';

// Utility to sanitize filename (prevent path traversal but allow spaces)
function sanitizeFilename(filename) {
    // Decode URI component first, then only remove dangerous characters
    const decoded = decodeURIComponent(filename);
    // Allow: letters, numbers, underscores, hyphens, dots, spaces, umlauts
    return decoded.replace(/[/\\:*?"<>|]/g, '');
}

const router = new Router();
const { publicSets } = partitionSetsByAccess(sets);
const KNOWN_AUDIO_BASES = new Set(sets.map((set) => normalizeAudioBaseFilename(set.file)).filter(Boolean));
const PUBLIC_AUDIO_BASES = new Set(publicSets.map((set) => normalizeAudioBaseFilename(set.file)).filter(Boolean));

// CORS Headers Utility
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Airdox-Token',
    'Access-Control-Max-Age': '86400',
};

const OAUTH_STATE_COOKIE = 'airdox_oauth_state';
const OAUTH_STATE_DELIMITER = '~';

const parseCookies = (request) => {
    const raw = request.headers.get('cookie') || '';
    const pairs = raw.split(';').map((part) => part.trim()).filter(Boolean);
    const out = {};
    for (const pair of pairs) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        const key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        try {
            out[key] = decodeURIComponent(value);
        } catch {
            out[key] = value;
        }
    }
    return out;
};

const randomState = () => crypto.randomUUID().replace(/-/g, '');

const sanitizeOrigin = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = new URL(raw);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        return url.origin;
    } catch {
        return '';
    }
};

const safeDecodeURIComponent = (value) => {
    try {
        return decodeURIComponent(String(value || ''));
    } catch {
        return String(value || '');
    }
};

const isTruthyFlag = (value) => {
    const flag = String(value || '').trim().toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes' || flag === 'on';
};

const isLocalhostRequest = (request) => {
    try {
        const host = new URL(request.url).hostname;
        return host === '127.0.0.1' || host === 'localhost' || host === '::1';
    } catch {
        return false;
    }
};

const isDevSocialAuthBypassEnabled = (env, request) => (
    isTruthyFlag(env.ALLOW_DEV_SOCIAL_AUTH) && isLocalhostRequest(request)
);

const buildCookieAttributes = (request) => {
    const protocol = new URL(request.url).protocol;
    return protocol === 'https:'
        ? 'Path=/; HttpOnly; SameSite=Lax; Secure'
        : 'Path=/; HttpOnly; SameSite=Lax';
};

const buildSetCookieHeader = (request, { name, value, maxAge }) => (
    `${name}=${encodeURIComponent(value)}; ${buildCookieAttributes(request)}; Max-Age=${maxAge}`
);

const buildPopupHtml = ({ ok, payload, targetOrigin = '' }) => {
    const serialized = JSON.stringify({ ok, ...payload });
    const serializedTargetOrigin = JSON.stringify(String(targetOrigin || ''));
    return `<!doctype html><html><head><meta charset="utf-8"><title>AIRDOX Auth</title></head><body><script>
        (function () {
            var data = ${serialized};
            var targetOrigin = ${serializedTargetOrigin};
            try {
                if (data.ok && data.token) {
                    localStorage.setItem('airdox_token', data.token);
                }
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(
                        { source: 'airdox-oauth', ...data },
                        targetOrigin || window.location.origin
                    );
                }
            } catch (e) {}
            setTimeout(function () { window.close(); }, 40);
        })();
    </script></body></html>`;
};

const popupErrorResponse = (targetOrigin, message, status = 400) => {
    const html = buildPopupHtml({
        ok: false,
        payload: { error: message || 'OAuth login failed' },
        targetOrigin,
    });
    return new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
};

const legalPageStyles = `
    body { margin: 0; background: #050608; color: #f5f8ff; font-family: Arial, sans-serif; line-height: 1.6; }
    main { max-width: 860px; margin: 0 auto; padding: 64px 24px; }
    h1, h2 { color: #00f0ff; letter-spacing: 0; }
    a { color: #00f0ff; }
    .brand { font-size: 18px; font-weight: 700; color: #f5f8ff; }
`;

const renderLegalPage = ({ canonicalPath, heading, body }) => new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AIRDOX</title>
  <link rel="icon" type="image/png" href="/icon-192.png">
  <link rel="canonical" href="https://airdox.info${canonicalPath}">
  <style>${legalPageStyles}</style>
</head>
<body>
  <main>
    <p class="brand">AIRDOX</p>
    <h1>${heading}</h1>
    ${body}
  </main>
</body>
</html>`, {
    headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
    },
});

const renderPrivacyPolicy = () => renderLegalPage({
    canonicalPath: '/privacy-policy',
    heading: 'Privacy Policy',
    body: `
    <p>Last updated: June 1, 2026</p>
    <p>AIRDOX operates the website https://airdox.info. This policy explains what information may be processed when you use the website or connect approved social publishing tools.</p>
    <h2>Information We Process</h2>
    <p>We may process technical website data such as page views, browser information, consented analytics events, audio playback events, newsletter or booking form submissions, and social publishing authorization data when you explicitly connect a platform account.</p>
    <h2>TikTok Integration</h2>
    <p>If TikTok access is enabled, AIRDOX uses TikTok authorization only to identify the connected account and publish videos that have been explicitly approved by the AIRDOX owner. No TikTok video is posted automatically without approval.</p>
    <h2>Use of Information</h2>
    <p>Information is used to operate the website, stream music sets, answer booking requests, prepare approved social posts, measure performance, and keep the platform secure.</p>
    <h2>Sharing</h2>
    <p>We do not sell personal information. Data is shared only with service providers required for hosting, analytics, email, audio delivery, or the social platform you explicitly authorize.</p>
    <h2>Contact</h2>
    <p>For privacy questions, contact: <a href="mailto:airdox82@gmail.com">airdox82@gmail.com</a>.</p>
    <p><a href="/">Back to AIRDOX</a> &middot; <a href="/terms-of-service">Terms of Service</a></p>`,
});

const renderTermsOfService = () => renderLegalPage({
    canonicalPath: '/terms-of-service',
    heading: 'Terms of Service',
    body: `
    <p>Last updated: June 1, 2026</p>
    <p>These terms govern use of the AIRDOX website at https://airdox.info and related AIRDOX publishing workflows.</p>
    <h2>Use of the Website</h2>
    <p>You may use AIRDOX to listen to published music sets, read artist information, submit booking requests, and access official AIRDOX materials. You must not misuse the website, attempt unauthorized access, or interfere with its operation.</p>
    <h2>Social Publishing</h2>
    <p>AIRDOX social publishing tools are used only for AIRDOX-owned or AIRDOX-approved clips. A post may be uploaded to TikTok or another platform only after explicit approval of the video, caption, target platform, timing, and landing URL.</p>
    <h2>Content Rights</h2>
    <p>AIRDOX retains rights to AIRDOX branding, website content, music-set presentation, and related creative materials unless otherwise stated. Third-party platform terms may also apply.</p>
    <h2>Contact</h2>
    <p>For questions about these terms, contact: <a href="mailto:airdox82@gmail.com">airdox82@gmail.com</a>.</p>
    <p><a href="/">Back to AIRDOX</a> &middot; <a href="/privacy-policy">Privacy Policy</a></p>`,
});

const resolveOAuthRedirectBase = (request, env) => {
    const configured = sanitizeOrigin(env.OAUTH_REDIRECT_BASE_URL || env.PUBLIC_APP_ORIGIN || '');
    if (configured) return configured;
    return new URL(request.url).origin;
};

const buildOAuthRedirectUri = (request, provider, env) => {
    return `${resolveOAuthRedirectBase(request, env)}/api/oauth/callback/${provider}`;
};

const buildOAuthStartUrl = ({ provider, authEndpoint, clientId, redirectUri, state, scope }) => {
    const url = new URL(authEndpoint);
    if (provider === 'google') {
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scope);
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('prompt', 'consent');
        url.searchParams.set('state', state);
    } else if (provider === 'facebook') {
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scope);
        url.searchParams.set('state', state);
    }
    return url.toString();
};

const getClientIp = (request) => {
    const cfIp = request.headers.get('CF-Connecting-IP');
    if (cfIp) return cfIp;
    const forwarded = request.headers.get('X-Forwarded-For');
    if (!forwarded) return '';
    const [first] = forwarded.split(',');
    return String(first || '').trim();
};

const buildAuthBody = (request, body, forcedAction) => ({
    ...(body || {}),
    ...(forcedAction ? { action: forcedAction } : {}),
    clientIp: getClientIp(request),
    userAgent: request.headers.get('User-Agent') || '',
    referrer: request.headers.get('Referer') || '',
});

const getAuthTokenFromRequest = (request, url) => {
    const queryToken = url.searchParams.get('token');
    if (queryToken) return queryToken;

    const headerToken = request.headers.get('x-airdox-token');
    if (headerToken) return headerToken;

    const authorization = request.headers.get('Authorization') || '';
    const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) return bearerMatch[1].trim();
    return '';
};

const getRequestHeader = (request, name) => {
    const headers = request.headers;
    if (!headers) return '';
    const direct = headers.get?.(name) || headers.get?.(name.toLowerCase());
    if (direct) return direct;
    const target = name.toLowerCase();
    for (const [key, value] of headers.entries?.() || []) {
        if (String(key).toLowerCase() === target) return value;
    }
    return '';
};

const isVipOnlyAudio = (filename) => {
    const base = normalizeAudioBaseFilename(filename);
    if (!base || !KNOWN_AUDIO_BASES.has(base)) return false;
    return !PUBLIC_AUDIO_BASES.has(base);
};

const isKnownSetAudio = (filename) => {
    const base = normalizeAudioBaseFilename(filename);
    return Boolean(base && KNOWN_AUDIO_BASES.has(base));
};

const audioError = (status, message, extra = {}) => new Response(JSON.stringify({
    error: message,
    ...extra,
}), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

// GET /api/audio/:filename - Secure audio streaming endpoint
router.get('/api/audio', async (request, env) => {
    const url = new URL(request.url);
    let filename = url.searchParams.get('file');
    
    if (!filename) {
        // Get from original pathname header passed by fetch handler
        const originalPathname = request.headers.get('x-original-pathname');
        if (originalPathname) {
            filename = decodeURIComponent(originalPathname.substring('/api/audio/'.length));
        }
    }

    if (!filename || !/\.mp3$/i.test(filename)) {
        return new Response(JSON.stringify({ error: 'Invalid audio file', filename }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
    
    const safeFilename = sanitizeFilename(filename);
    console.log(`[Audio] Requesting: "${safeFilename}" (original: "${filename}")`);

    if (!isKnownSetAudio(safeFilename)) {
        return audioError(404, 'Audio file not found', { requested: safeFilename });
    }

    if (isVipOnlyAudio(safeFilename)) {
        const token = getAuthTokenFromRequest(request, url);
        if (!token) {
            return audioError(401, 'VIP access requires login token');
        }

        const sessionResult = await handleAuthRequest({
            body: { action: 'validate', token },
            env
        });
        if (sessionResult.status !== 200 || !sessionResult.body?.ok) {
            return audioError(401, 'Invalid or expired VIP session');
        }
    }

    const range = getRequestHeader(request, 'Range');
    if (!range) {
        return audioError(403, 'Full audio downloads are disabled. Use the site player for streaming.');
    }
    
    let object = null;
    if (env.PUBLIC && env.PUBLIC.get) {
        // Try with 'public/' prefix first (R2 bucket structure)
        object = await env.PUBLIC.get(`public/${safeFilename}`);
        if (!object) {
            // Try without prefix
            object = await env.PUBLIC.get(safeFilename);
        }
    }
    
    if (!object) {
        // Try listing available keys for debugging
        console.log(`[Audio] File not found in R2: "${safeFilename}"`);
        return audioError(404, 'Audio file not found', {
            requested: safeFilename,
            tried: [`public/${safeFilename}`, safeFilename]
        });
    }

    // Set headers for streaming audio
    const headers = {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        ...corsHeaders
    };

    // Support range requests for seeking
    if (range) {
        const size = object.size;
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : size - 1;
            if (start >= size || end >= size) {
                return new Response('Requested range not satisfiable', { 
                    status: 416, 
                    headers: { ...headers, 'Content-Range': `bytes */${size}` } 
                });
            }
            const rangeLength = end - start + 1;
            const rangeObject = await env.PUBLIC.get(object.key, {
                range: { offset: start, length: rangeLength }
            });
            return new Response(rangeObject ? rangeObject.body : object.body, {
                status: 206,
                headers: {
                    ...headers,
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Content-Length': rangeLength.toString(),
                }
            });
        }
    }

    return audioError(416, 'Requested range not satisfiable', {
        expected: 'bytes=start-end'
    });
});

// GET /api/stats
router.get('/api/stats', async (request, env) => {
    const result = await handleStatsRequest({ method: 'GET', env });
    return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...result.headers, ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

// POST /api/stats
router.post('/api/stats', async (request, env) => {
    const body = await request.json();
    
    // Add Cloudflare metadata and User-Agent info to the body
    const enrichedBody = {
        ...body,
        cf: request.cf, // Geolocation (Country, City, etc.)
        clientIp: getClientIp(request),
        referrer: request.headers.get('Referer'),
    };

    const result = await handleStatsRequest({ 
        method: 'POST', 
        rawBody: enrichedBody, 
        env 
    });
    
    return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...result.headers, ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

// POST /api/booking
router.post('/api/booking', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleBookingRequest({ body, env });
        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid Request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// POST /api/subscribe
router.post('/api/subscribe', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleSubscribeRequest({ body, env });
        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid Request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// POST /api/audience-events
router.post('/api/audience-events', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleAudienceEventRequest({
            body: {
                ...body,
                cf: request.cf,
            },
            env
        });
        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers: { ...(result.headers || {}), ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid Request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// POST /api/auth
router.post('/api/auth', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleAuthRequest({ body: buildAuthBody(request, body), env });
        const headers = { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            ...(result.headers || {})
        };
        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers
        });
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid Request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Alias routes for convenience [NEW]
router.post('/api/login', async (request, env) => {
    const body = await request.json();
    const result = await handleAuthRequest({ body: buildAuthBody(request, body, 'login'), env });
    return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

router.post('/api/register', async (request, env) => {
    const body = await request.json();
    const result = await handleAuthRequest({ body: buildAuthBody(request, body, 'register'), env });
    return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

router.get('/api/oauth/config', async (request, env) => {
    const providers = [];
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.push('google');
    if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) providers.push('facebook');

    return new Response(JSON.stringify({ ok: true, providers }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

router.get('/api/oauth/start', async (request, env) => {
    const url = new URL(request.url);
    const provider = String(url.searchParams.get('provider') || '').toLowerCase();
    const mode = String(url.searchParams.get('mode') || 'login').toLowerCase();
    const openerOrigin = sanitizeOrigin(url.searchParams.get('origin') || '');
    if (!['google', 'facebook'].includes(provider)) {
        if (openerOrigin) return popupErrorResponse(openerOrigin, 'Unsupported provider');
        return new Response(JSON.stringify({ ok: false, error: 'Unsupported provider' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    if (isDevSocialAuthBypassEnabled(env, request)) {
        const mockResult = await handleAuthRequest({
            body: {
                action: 'oauth_dev_mock',
                provider,
                ...buildAuthBody(request, {}),
            },
            env,
        });

        const html = buildPopupHtml({
            ok: mockResult.status === 200 && mockResult.body?.ok,
            payload: mockResult.status === 200
                ? { token: mockResult.body?.token || '', provider, mock: true }
                : { error: mockResult.body?.error || 'OAuth login failed', provider },
            targetOrigin: openerOrigin,
        });

        return new Response(html, {
            status: mockResult.status === 200 ? 200 : 400,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
        });
    }

    const configResult = await handleAuthRequest({ body: { action: 'oauth_start', provider }, env });
    if (configResult.status !== 200 || !configResult.body?.ok) {
        if (openerOrigin) {
            return popupErrorResponse(openerOrigin, configResult.body?.error || 'OAuth login failed', configResult.status || 400);
        }
        return new Response(JSON.stringify(configResult.body), {
            status: configResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const state = [
        randomState(),
        mode,
        provider,
        encodeURIComponent(openerOrigin),
    ].join(OAUTH_STATE_DELIMITER);
    const redirectUri = buildOAuthRedirectUri(request, provider, env);
    const clientId = provider === 'google' ? env.GOOGLE_CLIENT_ID : env.FACEBOOK_APP_ID;
    const startUrl = buildOAuthStartUrl({
        provider,
        authEndpoint: configResult.body.authEndpoint,
        clientId,
        redirectUri,
        state,
        scope: configResult.body.scope,
    });

    return new Response(null, {
        status: 302,
        headers: {
            Location: startUrl,
            'Set-Cookie': buildSetCookieHeader(request, { name: OAUTH_STATE_COOKIE, value: state, maxAge: 600 }),
        },
    });
});

const handleOAuthCallback = async (request, env, provider) => {
    const url = new URL(request.url);
    const code = String(url.searchParams.get('code') || '');
    const state = String(url.searchParams.get('state') || '');
    const cookies = parseCookies(request);
    const expectedState = cookies[OAUTH_STATE_COOKIE] || '';
    const fallbackPopupTargetOrigin = sanitizeOrigin(safeDecodeURIComponent(state.split(OAUTH_STATE_DELIMITER)[3] || ''));

    if (!code || !state || !expectedState || state !== expectedState) {
        const html = buildPopupHtml({
            ok: false,
            payload: { error: 'OAuth state mismatch or missing code' },
            targetOrigin: fallbackPopupTargetOrigin,
        });
        return new Response(html, {
            status: 400,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Set-Cookie': buildSetCookieHeader(request, { name: OAUTH_STATE_COOKIE, value: '', maxAge: 0 }),
            },
        });
    }

    const [, , stateProvider, rawOpenerOrigin = ''] = state.split(OAUTH_STATE_DELIMITER);
    if (stateProvider !== provider) {
        const html = buildPopupHtml({
            ok: false,
            payload: { error: 'OAuth provider mismatch' },
            targetOrigin: fallbackPopupTargetOrigin,
        });
        return new Response(html, {
            status: 400,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Set-Cookie': buildSetCookieHeader(request, { name: OAUTH_STATE_COOKIE, value: '', maxAge: 0 }),
            },
        });
    }

    const decodedStateOrigin = sanitizeOrigin(safeDecodeURIComponent(rawOpenerOrigin || ''));
    const targetOrigin = decodedStateOrigin || sanitizeOrigin(request.headers.get('Origin') || request.headers.get('Referer') || '');

    const redirectUri = buildOAuthRedirectUri(request, provider, env);
    const oauthResult = await handleAuthRequest({
        body: {
            action: 'oauth_exchange',
            provider,
            code,
            redirectUri,
            clientIp: getClientIp(request),
            userAgent: request.headers.get('User-Agent') || '',
            referrer: request.headers.get('Referer') || '',
        },
        env,
    });

    const html = buildPopupHtml({
        ok: oauthResult.status === 200 && oauthResult.body?.ok,
        payload: oauthResult.status === 200
            ? { token: oauthResult.body?.token || '', provider }
            : { error: oauthResult.body?.error || 'OAuth login failed', provider },
        targetOrigin,
    });

    return new Response(html, {
        status: oauthResult.status === 200 ? 200 : 400,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Set-Cookie': buildSetCookieHeader(request, { name: OAUTH_STATE_COOKIE, value: '', maxAge: 0 }),
        },
    });
};

router.get('/api/oauth/callback/google', async (request, env) => handleOAuthCallback(request, env, 'google'));
router.get('/api/oauth/callback/facebook', async (request, env) => handleOAuthCallback(request, env, 'facebook'));

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS Preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method === 'GET' || request.method === 'HEAD') {
            if (url.pathname === '/privacy-policy' || url.pathname === '/privacy-policy.html' || url.pathname === '/privacy') {
                return renderPrivacyPolicy();
            }
            if (url.pathname === '/terms-of-service' || url.pathname === '/terms-of-service.html' || url.pathname === '/terms') {
                return renderTermsOfService();
            }
        }

        // Try API routes
        if (url.pathname.startsWith('/api/')) {
            try {
                const originalPathname = url.pathname;
                
                let modifiedRequest = request;
                if (originalPathname.startsWith('/api/audio/')) {
                    const newUrl = new URL(request.url);
                    newUrl.pathname = '/api/audio';
                    const newHeaders = new Headers(request.headers);
                    newHeaders.set('x-original-pathname', originalPathname);
                    const requestInit = {
                        method: request.method === 'HEAD' ? 'GET' : request.method,
                        headers: newHeaders,
                        redirect: request.redirect
                    };
                    if (!['GET', 'HEAD'].includes(request.method)) {
                        requestInit.body = request.body;
                    }
                    modifiedRequest = new Request(newUrl.toString(), requestInit);
                }

                const response = await router.handle(modifiedRequest, env, ctx);
                if (request.method === 'HEAD') {
                    return new Response(null, {
                        status: response.status,
                        headers: response.headers,
                    });
                }
                return response;
            } catch (error) {
                console.error('API Error:', error);
                return new Response(JSON.stringify({ 
                    ok: false, 
                    error: 'Internal Server Error',
                    details: error.message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders },
                });
            }
        }

        // Handle Static Assets (Frontend)
        return env.ASSETS.fetch(request);
    },
};
