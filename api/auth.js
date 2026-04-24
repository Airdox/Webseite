/* global process */
import { handleAuthRequest } from '../src/lib/stats-logic.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(request, response) {
    // Handle CORS
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.setHeader(key, value);
    });

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, username, password, token } = request.body || {};

    const result = await handleAuthRequest({
        body: { action, username, password, token },
        env: process.env
    });

    if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
            response.setHeader(key, value);
        });
    }

    return response.status(result.status).json(result.body);
}
