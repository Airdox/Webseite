import { neon as netlifyNeon } from '@netlify/neon';
import { neon as neonClient } from '@neondatabase/serverless';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const getSqlClient = () => {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
    if (dbUrl) return neonClient(dbUrl);

    try {
        return netlifyNeon();
    } catch {
        return null;
    }
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const sql = getSqlClient();
    if (!sql) {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ _fallback: true, error: 'Database not configured' })
        };
    }

    try {
        // Auto-Migration
        await sql`
            CREATE TABLE IF NOT EXISTS track_stats (
                id TEXT PRIMARY KEY,
                plays INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                dislikes INTEGER DEFAULT 0
            );
        `;

        // GET
        if (event.httpMethod === 'GET') {
            const rows = await sql`SELECT * FROM track_stats`;
            const stats = {};
            rows.forEach(row => {
                stats[row.id] = row;
            });
            return {
                statusCode: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            };
        }

        // POST
        if (event.httpMethod === 'POST') {
            if (!event.body) return { statusCode: 400, body: 'Missing body' };
            const { id, type } = JSON.parse(event.body);
            if (!id || !type) return { statusCode: 400, body: 'Missing id or type' };

            // Initialize row
            await sql`
                INSERT INTO track_stats (id, plays, likes, dislikes)
                VALUES (${id}, 0, 0, 0)
                ON CONFLICT (id) DO NOTHING;
            `;

            // Updates
            if (type === 'play') {
                await sql`UPDATE track_stats SET plays = plays + 1 WHERE id = ${id}`;
            } else if (type === 'like') {
                await sql`UPDATE track_stats SET likes = likes + 1 WHERE id = ${id}`;
            } else if (type === 'dislike') {
                await sql`UPDATE track_stats SET dislikes = dislikes + 1 WHERE id = ${id}`;
            } else if (type === 'unlike') {
                await sql`UPDATE track_stats SET likes = GREATEST(0, likes - 1) WHERE id = ${id}`;
            } else if (type === 'undislike') {
                await sql`UPDATE track_stats SET dislikes = GREATEST(0, dislikes - 1) WHERE id = ${id}`;
            }

            const [updated] = await sql`SELECT * FROM track_stats WHERE id = ${id}`;
            return {
                statusCode: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ _fallback: true, error: error.message || 'Unknown database error' })
        };
    }
};
