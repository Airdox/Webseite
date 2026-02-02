import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    // CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
        return response.status(200).json({
            status: 'fallback',
            database: 'not configured',
            message: 'DATABASE_URL environment variable is not set. Stats will be stored locally.'
        });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT NOW() as current_time`;
        return response.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: result[0].current_time
        });
    } catch (error) {
        console.error('Health Check Error:', error);
        return response.status(200).json({
            status: 'error',
            database: 'connection failed',
            error: error.message
        });
    }
}
