import { handleStatsRequest } from '../../src/lib/stats-logic.js';

export async function onRequest(context) {
    const { env } = context;

    try {
        const result = await handleStatsRequest({
            method: 'GET',
            env: env,
            allowNetlify: false
        });

        if (result.status === 200) {
            return new Response(JSON.stringify({ 
                ok: true, 
                message: 'Database connection healthy',
                timestamp: new Date().toISOString()
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        return new Response(JSON.stringify({ 
            ok: false, 
            message: 'Database check failed',
            error: result.body?.error 
        }), {
            status: result.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            ok: false, 
            message: 'Internal Server Error',
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
