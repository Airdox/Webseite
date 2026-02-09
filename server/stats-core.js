import { buildCorsHeaders } from './serverless-shared.js';

export const statsCorsHeaders = buildCorsHeaders('GET, POST, OPTIONS');
export const statsCacheHeaders = {
    'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=30'
};

const seedPlays = {
    secret_set_2025_12_22: 44
};

let initPromise = null;

const ensureInit = async (sql) => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        await sql`
            CREATE TABLE IF NOT EXISTS track_stats (
                id TEXT PRIMARY KEY,
                plays INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                dislikes INTEGER DEFAULT 0
            );
        `;

        for (const [id, plays] of Object.entries(seedPlays)) {
            await sql`
                INSERT INTO track_stats (id, plays, likes, dislikes)
                VALUES (${id}, ${plays}, 0, 0)
                ON CONFLICT (id) DO UPDATE
                SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
            `;
        }
    })();

    try {
        await initPromise;
    } catch (error) {
        initPromise = null;
        throw error;
    }

    return initPromise;
};

export const fetchStats = async (sql) => {
    await ensureInit(sql);
    const rows = await sql`SELECT * FROM track_stats`;
    const stats = {};
    rows.forEach(row => {
        stats[row.id] = row;
    });
    return stats;
};

export const updateStats = async (sql, id, type) => {
    await ensureInit(sql);

    await sql`
        INSERT INTO track_stats (id, plays, likes, dislikes)
        VALUES (${id}, 0, 0, 0)
        ON CONFLICT (id) DO NOTHING;
    `;

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
    return updated;
};
