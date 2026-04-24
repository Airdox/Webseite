/* global Buffer */
import { neon } from '@neondatabase/serverless';
import argon2 from 'argon2-browser';

const CACHE_CONTROL = 'public, s-maxage=10, stale-while-revalidate=30';
const SEED_PLAYS = {
    secret_set_2025_12_22: 44
};
const EMPTY_STATS_ROW = {
    plays: 0,
    likes: 0,
    dislikes: 0,
    last_played_at: null
};

const VALID_UPDATE_TYPES = new Set([
    'play',
    'like',
    'dislike',
    'unlike',
    'undislike'
]);

let sqlClient = null;
let initPromise = null;
let initialized = false;

const getSqlClient = (env) => {
    if (sqlClient) return sqlClient;
    const dbUrl = env.DATABASE_URL || env.POSTGRES_URL || env.NEON_DATABASE_URL;
    if (!dbUrl) return null;
    sqlClient = neon(dbUrl);
    return sqlClient;
};

const ensureInitialized = async (sql) => {
    if (initialized) return;
    if (!initPromise) {
        initPromise = (async () => {
            // Track Stats Table
            await sql`
                CREATE TABLE IF NOT EXISTS track_stats (
                    id TEXT PRIMARY KEY,
                    plays INTEGER DEFAULT 0,
                    likes INTEGER DEFAULT 0,
                    dislikes INTEGER DEFAULT 0,
                    last_played_at TIMESTAMP NULL
                );
            `;

            await sql`
                ALTER TABLE track_stats
                ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP NULL;
            `;

            // Bookings Table
            await sql`
                CREATE TABLE IF NOT EXISTS bookings (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    event TEXT,
                    message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Users Table
            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Sessions Table
            await sql`
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
                );
            `;

            for (const [id, plays] of Object.entries(SEED_PLAYS)) {
                await sql`
                    INSERT INTO track_stats (id, plays, likes, dislikes, last_played_at)
                    VALUES (${id}, ${plays}, 0, 0, NULL)
                    ON CONFLICT (id) DO UPDATE
                    SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
                `;
            }

            initialized = true;
        })().catch((error) => {
            console.error('Database Initialization ERROR:', error);
            initPromise = null;
            throw error;
        });
    }

    try {
        await initPromise;
    } catch (e) {
        // Clear promise so we can retry on next request
        initPromise = null;
        throw e;
    }
};

const errorBody = (message, details) => {
    const body = { ok: false, error: message };
    if (details) body.details = details;
    return body;
};

// --- STATS HANDLER ---
export const handleStatsRequest = async ({
    method,
    rawBody,
    env
}) => {
    const headers = { 'cache-control': CACHE_CONTROL };
    const sql = getSqlClient(env);
    
    if (!sql) {
        return { status: 200, headers, body: { ok: false, _fallback: true, error: 'Database not configured' } };
    }

    try {
        await ensureInitialized(sql);
    } catch (error) {
        return { status: 500, headers, body: errorBody('Database initialization failed', error?.message) };
    }

    if (method === 'GET') {
        try {
            const rows = await sql`SELECT * FROM track_stats`;
            const stats = {};
            rows.forEach((row) => { stats[row.id] = row; });
            return { status: 200, headers, body: stats };
        } catch (error) {
            return { status: 500, headers, body: errorBody('Database query failed', error?.message) };
        }
    }

    if (method === 'POST') {
        const { id, type } = rawBody || {};
        if (!id || !type || !VALID_UPDATE_TYPES.has(type)) {
            return { status: 400, headers, body: errorBody('Invalid request parameters') };
        }

        try {
            await sql`
                INSERT INTO track_stats (id, plays, likes, dislikes, last_played_at)
                VALUES (${id}, 0, 0, 0, NULL)
                ON CONFLICT (id) DO NOTHING;
            `;

            if (type === 'play') {
                await sql`
                    UPDATE track_stats
                    SET plays = plays + 1,
                        last_played_at = CURRENT_TIMESTAMP
                    WHERE id = ${id}
                `;
            }
            else if (type === 'like') await sql`UPDATE track_stats SET likes = likes + 1 WHERE id = ${id}`;
            else if (type === 'dislike') await sql`UPDATE track_stats SET dislikes = dislikes + 1 WHERE id = ${id}`;
            else if (type === 'unlike') await sql`UPDATE track_stats SET likes = GREATEST(0, likes - 1) WHERE id = ${id}`;
            else if (type === 'undislike') await sql`UPDATE track_stats SET dislikes = GREATEST(0, dislikes - 1) WHERE id = ${id}`;

            const [updated] = await sql`SELECT * FROM track_stats WHERE id = ${id}`;
            return { status: 200, headers, body: updated || { id, ...EMPTY_STATS_ROW } };
        } catch (error) {
            return { status: 500, headers, body: errorBody('Database update failed', error?.message) };
        }
    }

    return { status: 405, headers, body: errorBody('Method Not Allowed') };
};

// --- BOOKING HANDLER ---
export const handleBookingRequest = async ({ body, env }) => {
    const sql = getSqlClient(env);
    if (!sql) return { status: 500, body: errorBody('Database not configured') };

    const { name, email, event, message } = body;
    if (!name || !email || !message) {
        return { status: 400, body: errorBody('Missing required fields') };
    }

    try {
        await ensureInitialized(sql);
        await sql`
            INSERT INTO bookings (name, email, event, message)
            VALUES (${name}, ${email}, ${event || null}, ${message});
        `;
        return { status: 200, body: { ok: true, success: true, message: 'Booking stored successfully' } };
    } catch (error) {
        console.error('Booking Error:', error);
        return { status: 500, body: errorBody('Failed to store booking', error.message) };
    }
};

// --- AUTH HANDLER ---
const hashPassword = async (password, saltString) => {
    // Check if the stored password is an Argon2 hash or an old SHA-256 hash
    // Argon2 hashes usually start with $argon2
    if (saltString === 'argon2_internal') {
        const result = await argon2.hash({
            pass: password,
            salt: 'static_salt_for_argon2', // In a real app, use a unique salt per user
            time: 2,
            mem: 20480,
            hashLen: 32,
            parallelism: 1,
            type: argon2.ArgonType.Argon2id
        });
        return result.encoded;
    }

    // Fallback for old SHA-256 hashes (legacy support)
    const enc = new TextEncoder();
    const data = enc.encode(password + saltString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password, storedHash, salt) => {
    if (storedHash.startsWith('$argon2')) {
        try {
            await argon2.verify({
                pass: password,
                encoded: storedHash
            });
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Legacy SHA-256 verification
    const hashed = await hashPassword(password, salt);
    return hashed === storedHash;
};

const generateRandomHex = (bytes) => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateSalt = () => generateRandomHex(16);
const generateToken = () => generateRandomHex(32);

export const handleAuthRequest = async ({ body, env }) => {
    const sql = getSqlClient(env);
    if (!sql) return { status: 500, body: errorBody('Database not configured') };

    const { action, username, password, token } = body;
    
    // Validate Token (Session)
    if (action === 'validate') {
        if (!token) return { status: 401, body: errorBody('No token provided') };
        try {
            const [session] = await sql`
                SELECT s.id, u.id as user_id, u.username 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = ${token} AND s.expires_at > CURRENT_TIMESTAMP
            `;
            if (!session) return { status: 401, body: errorBody('Invalid or expired session') };
            return { status: 200, body: { ok: true, user: { id: session.user_id, username: session.username } } };
        } catch (e) { return { status: 500, body: errorBody('Validation failed') }; }
    }

    if (!action || !username || !password) {
        return { status: 400, body: errorBody('Missing required fields') };
    }

    try {
        await ensureInitialized(sql);

        if (action === 'register') {
            return { status: 403, body: errorBody('Registration is currently disabled. Please contact the administrator.') };
        }

        if (action === 'login') {
            const [user] = await sql`SELECT * FROM users WHERE username = ${username}`;
            if (!user) return { status: 401, body: errorBody('Invalid username or password') };

            const isValid = await verifyPassword(password, user.password, user.salt);
            if (!isValid) {
                return { status: 401, body: errorBody('Invalid username or password') };
            }

            const token = generateToken();
            await sql`
                INSERT INTO sessions (id, user_id)
                VALUES (${token}, ${user.id});
            `;

            return { 
                status: 200, 
                headers: {
                    'Set-Cookie': `airdox_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
                },
                body: { 
                    ok: true, 
                    token, // Keep token in body for backward compatibility during transition
                    user: { id: user.id, username: user.username } 
                } 
            };
        }

        return { status: 400, body: errorBody('Invalid action') };
    } catch (error) {
        console.error('Auth Error:', error);
        return { status: 500, body: errorBody('Authentication failed', error.message) };
    }
};

export const statsCacheControl = CACHE_CONTROL;
