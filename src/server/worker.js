
import { Router } from './router.js';
import { handleStatsRequest, handleBookingRequest, handleAuthRequest } from '../lib/stats-logic.js';

// Utility to sanitize filename (prevent path traversal)
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9_\-.]/g, '');
}

const router = new Router();
    // GET /api/audio/:filename - Secure audio streaming endpoint
    router.get('/api/audio', async (request, env, ctx) => {
        const url = new URL(request.url);
        // Support both /api/audio?file=name.mp3 and /api/audio/name.mp3
        let filename = url.searchParams.get('file');
        if (!filename && url.pathname.startsWith('/api/audio/')) {
            filename = url.pathname.substring('/api/audio/'.length);
        }
    if (!filename || !/\.mp3$/i.test(filename)) {
        return new Response('Invalid audio file', { status: 400 });
    }
    // Sanitize filename to prevent path traversal
    const safeFilename = sanitizeFilename(filename);
    // Assume audio files are in R2 bucket bound as env.AUDIO or env.PUBLIC (adjust as needed)
    // Try PUBLIC first (Cloudflare R2 binding)
    let object = null;
    if (env.PUBLIC && env.PUBLIC.get) {
        object = await env.PUBLIC.get(safeFilename);
    }
    if (!object) {
        return new Response('Audio file not found', { status: 404 });
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
                return new Response('Requested range not satisfiable', { status: 416, headers: { ...headers, 'Content-Range': `bytes */${size}` } });
            }
            const sliced = object.body.slice(start, end + 1);
            return new Response(sliced, {
                status: 206,
                headers: {
                    ...headers,
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Content-Length': (end - start + 1).toString(),
                }
            });
        }
    }
    // Full file
    headers['Content-Length'] = object.size.toString();
    return new Response(object.body, { status: 200, headers });
});

// CORS Headers Utility
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://airdox.de', // Restrict to main domain
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

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
    const result = await handleStatsRequest({ method: 'POST', rawBody: body, env });
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
    } catch (error) {
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
        const result = await handleAuthRequest({ body, env });
        const headers = { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            ...(result.headers || {})
        };
        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers
        });
    } catch (error) {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid Request' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

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
                // Adjust for /api/audio/:filename which is a dynamic path
                const originalPathname = url.pathname;
                if (url.pathname.startsWith('/api/audio/')) {
                    url.pathname = '/api/audio';
                    // We modify a copy of the request or handle it specially in router
                }
                
                // The current router only does exact matches, so we need to be careful.
                // Since we can't easily modify the Request object's URL property, 
                // let's adjust the router logic or the way we call it.
                
                // Let's modify the fetch handler to pass a modified request if it's an audio path
                let modifiedRequest = request;
                if (originalPathname.startsWith('/api/audio/')) {
                    const newUrl = new URL(request.url);
                    newUrl.pathname = '/api/audio';
                    modifiedRequest = new Request(newUrl.toString(), request);
                }

                return await router.handle(modifiedRequest, env, ctx);
            } catch (error) {
                console.error('API Error:', error);
                return new Response(JSON.stringify({ 
                    ok: false, 
                    error: 'Internal Server Error'
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
