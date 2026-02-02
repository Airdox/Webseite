import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    // CORS headers for all responses
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Check for DATABASE_URL or aliases (Vercel, Neon)
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

    if (!dbUrl) {
        console.warn('DATABASE_URL (or alias) not configured - returning empty stats (fallback mode)');
        // Return empty stats to allow frontend to use localStorage fallback
        if (request.method === 'GET') {
            return response.status(200).json({ _fallback: true });
        }
        if (request.method === 'POST') {
            return response.status(200).json({ _fallback: true, success: true });
        }
        return response.status(503).json({ error: 'Database not configured', _fallback: true });
    }

    let sql;
    try {
        sql = neon(dbUrl);
    } catch (initError) {
        console.error('Failed to initialize Neon client:', initError);
        return response.status(200).json({ _fallback: true, error: 'DB init failed' });
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
        if (request.method === 'GET') {
            const rows = await sql`SELECT * FROM track_stats`;
            const stats = {};
            rows.forEach(row => {
                stats[row.id] = row;
            });
            return response.status(200).json(stats);
        }

        // POST
        if (request.method === 'POST') {
            const { id, type } = request.body;
            if (!id || !type) return response.status(400).send('Missing id or type');

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
            return response.status(200).json(updated);
        }

        return response.status(405).send('Method Not Allowed');
    } catch (error) {
        console.error('API Error:', error);
        return response.status(500).json({ error: error.message || 'Unknown database error' });
    }
}
