import { neon as netlifyNeon } from '@netlify/neon';
import { neon as neonClient } from '@neondatabase/serverless';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const getSqlClient = () => {
    const dbUrl = process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.NEON_DATABASE_URL ||
        process.env.NETLIFY_DATABASE_URL ||
        process.env.NETLIFY_DATABASE_URL_UNPOOLED;
    if (dbUrl) return neonClient(dbUrl);

    try {
        return netlifyNeon();
    } catch {
        return null;
    }
};

export const handler = async (event) => {
    if (event?.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const sql = getSqlClient();
    if (!sql) {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                status: 'unhealthy',
                database: 'not configured'
            })
        };
    }

    try {
        const result = await sql`SELECT NOW() as current_time`;
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'healthy',
                database: 'connected',
                timestamp: result[0].current_time
            })
        };
    } catch (error) {
        console.error('Health Check Error:', error);
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'unhealthy',
                database: 'connection failed',
                error: error.message
            })
        };
    }
};
