
import { Router } from './router.js';
import { handleStatsRequest, handleBookingRequest, handleSubscribeRequest, handleAudienceEventRequest } from '../lib/stats-logic.js';
import { sets } from '../data/musicSets.js';
import { renderPrivacyPolicy, renderTermsOfService } from './legalPages.js';
import { registerAudioRoute } from './audioRoutes.js';
import { handlerResultResponse, invalidRequestResponse, jsonResponse } from './httpResponses.js';
import {
    handleTikTokConfig,
    handleTikTokCreatorInfo,
    handleTikTokDisconnect,
    handleTikTokOAuthCallback,
    handleTikTokOAuthStart,
    handleTikTokSession,
    handleTikTokPublish,
    handleTikTokPublishStatus,
} from './tiktokCreator.js';

const router = new Router();

// CORS Headers Utility
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

const getClientIp = (request) => {
    const cfIp = request.headers.get('CF-Connecting-IP');
    if (cfIp) return cfIp;
    const forwarded = request.headers.get('X-Forwarded-For');
    if (!forwarded) return '';
    const [first] = forwarded.split(',');
    return String(first || '').trim();
};

registerAudioRoute(router, { corsHeaders, sets });

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

// Public creator workflow: a creator reviews the current TikTok account and
// every post setting before explicitly authorizing a Direct Post submission.
router.get('/api/tiktok/config', handleTikTokConfig);
router.get('/api/tiktok/oauth/start', handleTikTokOAuthStart);
router.get('/api/tiktok/session', handleTikTokSession);
router.get('/api/tiktok/creator-info', handleTikTokCreatorInfo);
router.post('/api/tiktok/publish', handleTikTokPublish);
router.post('/api/tiktok/publish/status', handleTikTokPublishStatus);
router.post('/api/tiktok/disconnect', handleTikTokDisconnect);

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS Preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method === 'GET' || request.method === 'HEAD') {
            if (url.pathname === '/oauth/tiktok/callback' && request.method === 'GET') {
                return handleTikTokOAuthCallback(request, env);
            }
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
