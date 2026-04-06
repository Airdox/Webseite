import { handleStatsRequest } from '../../src/lib/stats-logic.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // Map Cloudflare request to the format expected by handleStatsRequest
    const result = await handleStatsRequest({
        method: request.method,
        rawBody: request.method === 'POST' ? await request.text() : null,
        isBase64Encoded: false,
        env: env,
        allowNetlify: false
    });

    return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...(result.headers || {}),
        },
    });
}
