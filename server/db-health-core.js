import { buildCorsHeaders, getSqlClient } from './serverless-shared.js';

export const dbHealthCorsHeaders = buildCorsHeaders('GET, OPTIONS');

export const checkDbHealth = async (fallbackStatus = 'unhealthy') => {
    const sql = getSqlClient();
    if (!sql) {
        const fallback = {
            status: fallbackStatus,
            database: 'not configured'
        };
        if (fallbackStatus === 'fallback') {
            fallback.message = 'DATABASE_URL environment variable is not set. Stats will be stored locally.';
        }
        return fallback;
    }

    try {
        const result = await sql`SELECT NOW() as current_time`;
        return {
            status: 'healthy',
            database: 'connected',
            timestamp: result[0].current_time
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            database: 'connection failed',
            error: error.message
        };
    }
};
