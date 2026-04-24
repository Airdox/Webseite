import { handleAuthRequest } from '../../src/lib/stats-logic.js';

export async function onRequest(context) {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    try {
        let body = null;
        
        if (request.method === 'POST') {
            body = await request.json();
        } else {
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
        }

        const result = await handleAuthRequest({
            body: body,
            env: env, // Cloudflare env variables
        });

        return new Response(JSON.stringify(result.body), {
            status: result.status,
            headers: {
                ...result.headers,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            ok: false, 
            error: 'Internal Server Error',
            details: error.message 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
