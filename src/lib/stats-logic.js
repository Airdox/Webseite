/* global Buffer */
import { neon } from '@neondatabase/serverless';

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
const REGISTER_RATE_LIMIT_WINDOW_MINUTES = 60;
const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 8;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

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

            // Sessions Table
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

            // Analytics Logs Table [NEW]
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

            for (const [id, plays] of Object.entries(SEED_PLAYS)) {
                await sql`
                    INSERT INTO track_stats (id, plays, likes, dislikes, last_played_at)
                    VALUES (${id}, ${plays}, 0, 0, NULL)
                    ON CONFLICT (id) DO UPDATE
                    SET plays = GREATEST(track_stats.plays, EXCLUDED.plays);
                `;
            }

            // Subscribers Table [NEW]
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
        const { id, type, sessionId, device, browser, os, referrer } = rawBody || {};
        if (!id || !type || !VALID_UPDATE_TYPES.has(type)) {
            return { status: 400, headers, body: errorBody('Invalid request parameters') };
        }

        // Extract Cloudflare Geolocation Data
        const cf = rawBody?.cf || {};
        const country = cf.country || 'Unknown';
        const city = cf.city || 'Unknown';
        const region = cf.region || 'Unknown';

        try {
            await sql`
                INSERT INTO track_stats (id, plays, likes, dislikes, last_played_at)
                VALUES (${id}, 0, 0, 0, NULL)
                ON CONFLICT (id) DO NOTHING;
            `;

            // 1. Update Aggregate Counters
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

            // 2. Insert Detailed Log Entry [MAX DENSITY]
            await sql`
                INSERT INTO analytics_logs (
                    event_type, item_id, session_id, 
                    country, city, region, 
                    device_type, browser, os, referrer
                )
                VALUES (
                    ${type}, ${id}, ${sessionId || null}, 
                    ${country}, ${city}, ${region}, 
                    ${device || 'Unknown'}, ${browser || 'Unknown'}, ${os || 'Unknown'}, ${referrer || null}
                );
            `;

            const [updated] = await sql`SELECT * FROM track_stats WHERE id = ${id}`;
            return { status: 200, headers, body: updated || { id, ...EMPTY_STATS_ROW } };
        } catch (error) {
            console.error('Database update failed:', error);
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

// --- SUBSCRIBE HANDLER [NEW] ---
export const handleSubscribeRequest = async ({ body, env }) => {
    const sql = getSqlClient(env);
    if (!sql) return { status: 500, body: errorBody('Database not configured') };

    const { email } = body;
    if (!email || !email.includes('@')) {
        return { status: 400, body: errorBody('Invalid email address') };
    }

    try {
        await ensureInitialized(sql);
        await sql`
            INSERT INTO subscribers (email)
            VALUES (${email})
            ON CONFLICT (email) DO UPDATE SET status = 'active';
        `;
        return { status: 200, body: { ok: true, success: true, message: 'Subscribed successfully' } };
    } catch (error) {
        console.error('Subscription Error:', error);
        return { status: 500, body: errorBody('Failed to subscribe', error.message) };
    }
};

// --- AUTH HANDLER ---
const hashPassword = async (password, saltString) => {
    const enc = new TextEncoder();
    const data = enc.encode(password + saltString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateRandomHex = (bytes) => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateSalt = () => generateRandomHex(16);
const generateToken = () => generateRandomHex(32);

const resolveTurnstileSecret = (env) => (
    env.TURNSTILE_SECRET_KEY
    || env.TURNSTILE_SECRET
    || env.CAPTCHA_SECRET_KEY
    || ''
);

const isCaptchaRequired = (env) => {
    const flag = String(env.REQUIRE_CAPTCHA || '').trim().toLowerCase();
    if (flag === 'false' || flag === '0' || flag === 'off' || flag === 'no') return false;
    return true;
};

const normalizeIp = (value) => String(value || '').trim().slice(0, 128);

const recordAuthAttempt = async (sql, { action, clientIp, identifier, success }) => {
    try {
        await sql`
            INSERT INTO auth_attempts (action, ip_address, identifier, success)
            VALUES (${action}, ${clientIp || null}, ${identifier || null}, ${Boolean(success)});
        `;
    } catch (error) {
        console.error('Auth attempt log failed:', error);
    }
};

const isRegisterRateLimited = async (sql, clientIp) => {
    if (!clientIp) return false;
    const [row] = await sql`
        SELECT COUNT(*)::int AS attempts
        FROM auth_attempts
        WHERE action = 'register'
          AND ip_address = ${clientIp}
          AND created_at > CURRENT_TIMESTAMP - (${REGISTER_RATE_LIMIT_WINDOW_MINUTES} * INTERVAL '1 minute');
    `;
    return Number(row?.attempts || 0) >= REGISTER_RATE_LIMIT_MAX_ATTEMPTS;
};

const verifyTurnstileCaptcha = async ({ token, clientIp, env }) => {
    if (!token) return { ok: false, error: 'CAPTCHA token missing' };
    const secret = resolveTurnstileSecret(env);
    if (!secret) return { ok: false, error: 'CAPTCHA service not configured' };

    try {
        const formBody = new URLSearchParams();
        formBody.set('secret', secret);
        formBody.set('response', token);
        if (clientIp) formBody.set('remoteip', clientIp);

        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
            return { ok: false, error: 'CAPTCHA verification failed' };
        }

        return { ok: true };
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        return { ok: false, error: 'CAPTCHA verification failed' };
    }
};

export const handleAuthRequest = async ({ body, env }) => {
    const sql = getSqlClient(env);
    if (!sql) return { status: 500, body: errorBody('Database not configured') };

    try {
        await ensureInitialized(sql);
    } catch (error) {
        return { status: 500, body: errorBody('Database initialization failed', error?.message) };
    }

    const {
        action,
        username,
        email,
        password,
        token,
        captchaToken,
        clientIp: rawClientIp,
    } = body || {};
    const clientIp = normalizeIp(rawClientIp);
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const loginIdentifier = String(email || username || '').trim();

    // Validate Token (Session)
    if (action === 'validate') {
        if (!token) return { status: 401, body: errorBody('No token provided') };
        try {
            const [session] = await sql`
                SELECT s.id, u.id as user_id, u.username, u.email
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = ${token} AND s.expires_at > CURRENT_TIMESTAMP
            `;
            if (!session) return { status: 401, body: errorBody('Invalid or expired session') };
            return { status: 200, body: { ok: true, user: { id: session.user_id, username: session.username, email: session.email } } };
        } catch {
            return { status: 500, body: errorBody('Validation failed') };
        }
    }

    if (!action || !password || (action === 'register' && (!normalizedUsername || !normalizedEmail)) || (action === 'login' && !loginIdentifier)) {
        return { status: 400, body: errorBody('Missing required fields') };
    }

    try {
        if (action === 'register') {
            const isLimited = await isRegisterRateLimited(sql, clientIp);
            if (isLimited) {
                return { status: 429, body: errorBody('Too many registration attempts. Please try again later.') };
            }

            if (isCaptchaRequired(env)) {
                const captchaResult = await verifyTurnstileCaptcha({
                    token: captchaToken,
                    clientIp,
                    env,
                });
                if (!captchaResult.ok) {
                    await recordAuthAttempt(sql, {
                        action: 'register',
                        clientIp,
                        identifier: normalizedEmail || normalizedUsername,
                        success: false,
                    });
                    return { status: 400, body: errorBody(captchaResult.error) };
                }
            }

            const salt = generateSalt();
            const hashedPassword = await hashPassword(password, salt);
            try {
                await sql`
                    INSERT INTO users (username, email, password, salt)
                    VALUES (${normalizedUsername}, ${normalizedEmail}, ${hashedPassword}, ${salt});
                `;
                await recordAuthAttempt(sql, {
                    action: 'register',
                    clientIp,
                    identifier: normalizedEmail || normalizedUsername,
                    success: true,
                });
                return { status: 200, body: { ok: true, message: 'User registered successfully' } };
            } catch (error) {
                await recordAuthAttempt(sql, {
                    action: 'register',
                    clientIp,
                    identifier: normalizedEmail || normalizedUsername,
                    success: false,
                });
                if (error.message.includes('unique constraint') || error.message.includes('already exists')) {
                    const field = error.message.includes('email') ? 'Email' : 'Username';
                    return { status: 400, body: errorBody(`${field} already exists`) };
                }
                throw error;
            }
        }

        if (action === 'login') {
            const [user] = await sql`SELECT * FROM users WHERE email = ${loginIdentifier} OR username = ${loginIdentifier}`;
            if (!user) return { status: 401, body: errorBody('Invalid credentials') };

            const hashedPassword = await hashPassword(password, user.salt);
            if (hashedPassword !== user.password) {
                return { status: 401, body: errorBody('Invalid credentials') };
            }

            const token = generateToken();
            await sql`
                INSERT INTO sessions (id, user_id)
                VALUES (${token}, ${user.id});
            `;

            return { 
                status: 200, 
                body: { 
                    ok: true, 
                    token,
                    user: { id: user.id, username: user.username, email: user.email } 
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
