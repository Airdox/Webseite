import { neon } from '@neondatabase/serverless';

const CACHE_CONTROL = 'public, s-maxage=10, stale-while-revalidate=30';
const SEED_PLAYS = {
    secret_set_2025_12_22: 44
};

const VALID_UPDATE_TYPES = new Set([
    'play',
    'like',
    'dislike',
    'unlike',
    'undislike'
]);

const DB_URL_KEYS = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'NEON_DATABASE_URL',
    'NETLIFY_DATABASE_URL',
    'NETLIFY_DATABASE_URL_UNPOOLED'
];

let sqlClient = null;
let initPromise = null;
let initialized = false;

const getDbUrl = (env) => {
    if (!env) return null;
    for (const key of DB_URL_KEYS) {
        if (env[key]) return env[key];
    }
    return null;
};

const createSqlClient = async ({ env, allowNetlify }) => {
    const dbUrl = getDbUrl(env);
    if (dbUrl) return neon(dbUrl);

    if (!allowNetlify) return null;

    try {
        const mod = await import('@netlify/neon');
        if (typeof mod.neon === 'function') {
            return mod.neon();
        }
    } catch (error) {
        console.warn('Netlify Neon init failed:', error);
    }

    return null;
};

const getSqlClient = async (options) => {
    if (sqlClient) return sqlClient;
    sqlClient = await createSqlClient(options);
    return sqlClient;
};

const ensureInitialized = async (sql) => {
    if (initialized) return;
    if (!initPromise) {
        initPromise = (async () => {
            await sql`
                CREATE TABLE IF NOT EXISTS track_stats (
                    id TEXT PRIMARY KEY,
                    plays INTEGER DEFAULT 0,
                    likes INTEGER DEFAULT 0,
                    dislikes INTEGER DEFAULT 0
                );
            `;

            for (const [id, plays] of Object.entries(SEED_PLAYS)) {
                await sql`
                    INSERT INTO track_stats (id, plays, likes, dislikes)
                    VALUES (${id}, ${plays}, 0, 0)
                    ON CONFLICT (id) DO UPDATE
                    SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
                `;
            }

            initialized = true;
        })().catch((error) => {
            initPromise = null;
            throw error;
        });
    }

    await initPromise;
};

const parseBody = (rawBody, isBase64Encoded) => {
    if (rawBody == null) return null;

    if (typeof rawBody === 'string') {
        const text = isBase64Encoded
            ? Buffer.from(rawBody, 'base64').toString('utf8')
            : rawBody;
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (error) {
            return { __parseError: error };
        }
    }

    if (typeof rawBody === 'object') {
        return rawBody;
    }

    return null;
};

const errorBody = (message, details) => {
    const body = { ok: false, error: message };
    if (details) body.details = details;
    return body;
};

export const handleStatsRequest = async ({
    method,
    rawBody,
    isBase64Encoded = false,
    env = process.env,
    allowNetlify = false
}) => {
    const headers = {};
    if (method === 'GET') {
        headers['cache-control'] = CACHE_CONTROL;
    }

    if (method !== 'GET' && method !== 'POST') {
        return { status: 405, headers, body: errorBody('Method Not Allowed') };
    }

    const sql = await getSqlClient({ env, allowNetlify });
    if (!sql) {
        const fallbackBody = {
            ok: false,
            _fallback: true,
            error: 'Database not configured'
        };
        if (method === 'POST') fallbackBody.success = true;
        return { status: 200, headers, body: fallbackBody };
    }

    try {
        await ensureInitialized(sql);
    } catch (error) {
        return {
            status: 500,
            headers,
            body: errorBody('Database initialization failed', error?.message)
        };
    }

    if (method === 'GET') {
        try {
            const rows = await sql`SELECT * FROM track_stats`;
            const stats = {};
            rows.forEach((row) => {
                stats[row.id] = row;
            });
            return { status: 200, headers, body: stats };
        } catch (error) {
            return {
                status: 500,
                headers,
                body: errorBody('Database query failed', error?.message)
            };
        }
    }

    const parsed = parseBody(rawBody, isBase64Encoded);
    if (!parsed) {
        return { status: 400, headers, body: errorBody('Missing request body') };
    }
    if (parsed.__parseError) {
        return { status: 400, headers, body: errorBody('Invalid JSON body') };
    }

    const { id, type } = parsed;
    if (!id || !type) {
        return { status: 400, headers, body: errorBody('Missing id or type') };
    }
    if (!VALID_UPDATE_TYPES.has(type)) {
        return { status: 400, headers, body: errorBody('Invalid update type') };
    }

    try {
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
        return { status: 200, headers, body: updated || { id, plays: 0, likes: 0, dislikes: 0 } };
    } catch (error) {
        return {
            status: 500,
            headers,
            body: errorBody('Database update failed', error?.message)
        };
    }
};

export const statsCacheControl = CACHE_CONTROL;
