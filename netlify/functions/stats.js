import { handleStatsRequest } from '../../src/lib/stats-logic.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler = async (event) => {
    if (event?.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const result = await handleStatsRequest({
        method: event.httpMethod,
        rawBody: event.body,
        isBase64Encoded: event.isBase64Encoded,
        env: process.env,
        allowNetlify: true
    });

    return {
        statusCode: result.status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...(result.headers || {})
        },
        body: JSON.stringify(result.body)
    };
};
