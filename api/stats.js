import { handleStatsRequest } from '../src/lib/stats-logic.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(request, response) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.setHeader(key, value);
    });

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    const result = await handleStatsRequest({
        method: request.method,
        rawBody: request.body,
        env: process.env,
        allowNetlify: false
    });

    if (result?.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
            response.setHeader(key, value);
        });
    }

    return response.status(result.status).json(result.body);
}
