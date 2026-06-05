
import { Router } from './router.js';
import { handleStatsRequest, handleBookingRequest, handleAuthRequest, handleSubscribeRequest, handleAudienceEventRequest } from '../lib/stats-logic.js';
import { sets } from '../data/musicSets.js';
import {
    buildPopupHtml,
    buildSetCookieHeader,
    isDevSocialAuthBypassEnabled,
    OAUTH_STATE_COOKIE,
    OAUTH_STATE_DELIMITER,
    parseCookies,
    randomState,
    safeDecodeURIComponent,
    sanitizeOrigin,
} from './oauthUtils.js';
import { renderPrivacyPolicy, renderTermsOfService } from './legalPages.js';
import { registerAudioRoute } from './audioRoutes.js';
import { handlerResultResponse, invalidRequestResponse, jsonResponse } from './httpResponses.js';

const router = new Router();

// CORS Headers Utility
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Airdox-Token',
    'Access-Control-Max-Age': '86400',
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

registerAudioRoute(router, { corsHeaders, sets, handleAuthRequest });

// GET /api/stats
router.get('/api/stats', async (request, env) => {
    const result = await handleStatsRequest({ method: 'GET', env });
    return handlerResultResponse(result, corsHeaders);
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
    
    return handlerResultResponse(result, corsHeaders);
});

// POST /api/booking
router.post('/api/booking', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleBookingRequest({ body, env });
        return handlerResultResponse(result, corsHeaders);
    } catch {
        return invalidRequestResponse(corsHeaders);
    }
});

// POST /api/subscribe
router.post('/api/subscribe', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleSubscribeRequest({ body, env });
        return handlerResultResponse(result, corsHeaders);
    } catch {
        return invalidRequestResponse(corsHeaders);
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
        return handlerResultResponse(result, corsHeaders);
    } catch {
        return invalidRequestResponse(corsHeaders);
    }
});

// POST /api/auth
router.post('/api/auth', async (request, env) => {
    try {
        const body = await request.json();
        const result = await handleAuthRequest({ body: buildAuthBody(request, body), env });
        return handlerResultResponse(result, corsHeaders);
    } catch {
        return invalidRequestResponse(corsHeaders);
    }
});

// Alias routes for convenience [NEW]
router.post('/api/login', async (request, env) => {
    const body = await request.json();
    const result = await handleAuthRequest({ body: buildAuthBody(request, body, 'login'), env });
    return handlerResultResponse(result, corsHeaders);
});

router.post('/api/register', async (request, env) => {
    const body = await request.json();
    const result = await handleAuthRequest({ body: buildAuthBody(request, body, 'register'), env });
    return handlerResultResponse(result, corsHeaders);
});

router.get('/api/oauth/config', async (request, env) => {
    const providers = [];
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.push('google');
    if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) providers.push('facebook');

    return jsonResponse({ ok: true, providers }, { headers: corsHeaders });
});

router.get('/api/oauth/start', async (request, env) => {
    const url = new URL(request.url);
    const provider = String(url.searchParams.get('provider') || '').toLowerCase();
    const mode = String(url.searchParams.get('mode') || 'login').toLowerCase();
    const openerOrigin = sanitizeOrigin(url.searchParams.get('origin') || '');
    if (!['google', 'facebook'].includes(provider)) {
        if (openerOrigin) return popupErrorResponse(openerOrigin, 'Unsupported provider');
        return jsonResponse({ ok: false, error: 'Unsupported provider' }, {
            status: 400,
            headers: corsHeaders,
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
        return jsonResponse(configResult.body, {
            status: configResult.status,
            headers: corsHeaders,
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
                return jsonResponse({ 
                    ok: false, 
                    error: 'Internal Server Error',
                    details: error.message
                }, {
                    status: 500,
                    headers: corsHeaders,
                });
            }
        }

        // Handle Static Assets (Frontend)
        return env.ASSETS.fetch(request);
    },
};
