
import { Router } from './router.js';
import { handleStatsRequest, handleBookingRequest, handleAuthRequest } from '../lib/stats-logic.js';
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

const parseCookies = (request) => {
    const raw = request.headers.get('cookie') || '';
    const pairs = raw.split(';').map((part) => part.trim()).filter(Boolean);
    const out = {};
    for (const pair of pairs) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        const key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        out[key] = decodeURIComponent(value);
    }
    return out;
};

const randomState = () => crypto.randomUUID().replace(/-/g, '');

const buildPopupHtml = ({ ok, payload }) => {
    const serialized = JSON.stringify({ ok, ...payload });
    return `<!doctype html><html><head><meta charset="utf-8"><title>AIRDOX Auth</title></head><body><script>
        (function () {
            var data = ${serialized};
            try {
                if (data.ok && data.token) {
                    localStorage.setItem('airdox_token', data.token);
                }
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({ source: 'airdox-oauth', ...data }, window.location.origin);
                }
            } catch (e) {}
            setTimeout(function () { window.close(); }, 40);
        })();
    </script></body></html>`;
};

const buildOAuthRedirectUri = (request, provider) => {
    const url = new URL(request.url);
    return `${url.origin}/api/oauth/callback/${provider}`;
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

const isVipOnlyAudio = (filename) => {
    const base = normalizeAudioBaseFilename(filename);
    if (!base || !KNOWN_AUDIO_BASES.has(base)) return false;
    return !PUBLIC_AUDIO_BASES.has(base);
};

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

    if (isVipOnlyAudio(safeFilename)) {
        const token = getAuthTokenFromRequest(request, url);
        if (!token) {
            return new Response(JSON.stringify({ error: 'VIP access requires login token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const sessionResult = await handleAuthRequest({
            body: { action: 'validate', token },
            env
        });
        if (sessionResult.status !== 200 || !sessionResult.body?.ok) {
            return new Response(JSON.stringify({ error: 'Invalid or expired VIP session' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
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
        return new Response(JSON.stringify({ 
            error: 'Audio file not found', 
            requested: safeFilename,
            tried: [`public/${safeFilename}`, safeFilename]
        }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // Set headers for streaming audio
    const headers = {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders
    };

    // Support range requests for seeking
    const range = request.headers.get('Range');
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

    // Full file
    headers['Content-Length'] = object.size.toString();
    return new Response(object.body, { status: 200, headers });
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

router.get('/api/oauth/start', async (request, env) => {
    const url = new URL(request.url);
    const provider = String(url.searchParams.get('provider') || '').toLowerCase();
    const mode = String(url.searchParams.get('mode') || 'login').toLowerCase();
    if (!['google', 'facebook'].includes(provider)) {
        return new Response(JSON.stringify({ ok: false, error: 'Unsupported provider' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const configResult = await handleAuthRequest({ body: { action: 'oauth_start', provider }, env });
    if (configResult.status !== 200 || !configResult.body?.ok) {
        return new Response(JSON.stringify(configResult.body), {
            status: configResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const state = `${randomState()}.${mode}.${provider}`;
    const redirectUri = buildOAuthRedirectUri(request, provider);
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
            'Set-Cookie': `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax; Secure`,
        },
    });
});

const handleOAuthCallback = async (request, env, provider) => {
    const url = new URL(request.url);
    const code = String(url.searchParams.get('code') || '');
    const state = String(url.searchParams.get('state') || '');
    const cookies = parseCookies(request);
    const expectedState = cookies[OAUTH_STATE_COOKIE] || '';

    if (!code || !state || !expectedState || state !== expectedState) {
        const html = buildPopupHtml({ ok: false, payload: { error: 'OAuth state mismatch or missing code' } });
        return new Response(html, {
            status: 400,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Set-Cookie': `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
            },
        });
    }

    const redirectUri = buildOAuthRedirectUri(request, provider);
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
    });

    return new Response(html, {
        status: oauthResult.status === 200 ? 200 : 400,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Set-Cookie': `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
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
