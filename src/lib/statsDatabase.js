import { neon } from '@neondatabase/serverless';
import { SEED_PLAYS } from './statsContracts.js';

let sqlClient = null;
let initPromise = null;
let initialized = false;

export const getSqlClient = (env) => {
    if (sqlClient) return sqlClient;
    const dbUrl = env.DATABASE_URL || env.POSTGRES_URL || env.NEON_DATABASE_URL;
    if (!dbUrl) return null;
    sqlClient = neon(dbUrl);
    return sqlClient;
};

export const ensureInitialized = async (sql) => {
    if (initialized) return;
    if (!initPromise) {
        initPromise = (async () => {
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

            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
                );
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS auth_attempts (
                    id SERIAL PRIMARY KEY,
                    action TEXT NOT NULL,
                    ip_address TEXT,
                    identifier TEXT,
                    success BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_action_created_at
                ON auth_attempts (ip_address, action, created_at DESC);
            `;

            await sql`
                CREATE TABLE IF NOT EXISTS analytics_logs (
                    id SERIAL PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    item_id TEXT,
                    session_id TEXT,
                    country TEXT,
                    city TEXT,
                    region TEXT,
                    device_type TEXT,
                    browser TEXT,
                    os TEXT,
                    referrer TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await sql`
                ALTER TABLE analytics_logs
                ADD COLUMN IF NOT EXISTS route TEXT NULL,
                ADD COLUMN IF NOT EXISTS source TEXT NULL,
                ADD COLUMN IF NOT EXISTS content_type TEXT NULL,
                ADD COLUMN IF NOT EXISTS value DOUBLE PRECISION NULL;
            `;

            for (const [id, plays] of Object.entries(SEED_PLAYS)) {
                await sql`
                    INSERT INTO track_stats (id, plays, likes, dislikes, last_played_at)
                    VALUES (${id}, ${plays}, 0, 0, NULL)
                    ON CONFLICT (id) DO UPDATE
                    SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
                `;
            }

            await sql`
                CREATE TABLE IF NOT EXISTS subscribers (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

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
        initPromise = null;
        throw e;
    }
};
