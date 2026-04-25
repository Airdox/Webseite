
import { Router } from './router.js';
import { handleStatsRequest, handleBookingRequest, handleAuthRequest } from '../lib/stats-logic.js';

// Utility to sanitize filename (prevent path traversal but allow spaces)
function sanitizeFilename(filename) {
    // Decode URI component first, then only remove dangerous characters
    const decoded = decodeURIComponent(filename);
    // Allow: letters, numbers, underscores, hyphens, dots, spaces, umlauts
    return decoded.replace(/[\/\\:*?"<>|]/g, '');
}

const router = new Router();

// CORS Headers Utility
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// GET /api/audio/:filename - Secure audio streaming endpoint
router.get('/api/audio', async (request, env, ctx) => {
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
                const originalPathname = url.pathname;
                
                let modifiedRequest = request;
                if (originalPathname.startsWith('/api/audio/')) {
                    const newUrl = new URL(request.url);
                    newUrl.pathname = '/api/audio';
                    const newHeaders = new Headers(request.headers);
                    newHeaders.set('x-original-pathname', originalPathname);
                    modifiedRequest = new Request(newUrl.toString(), {
                        method: request.method,
                        headers: newHeaders,
                        body: request.body,
                        redirect: request.redirect
                    });
                }

                return await router.handle(modifiedRequest, env, ctx);
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
