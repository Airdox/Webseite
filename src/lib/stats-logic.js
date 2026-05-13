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
const PLAY_DEBOUNCE_SECONDS = 20;
const REGISTER_RATE_LIMIT_WINDOW_MINUTES = 60;
const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 8;
const REGISTER_SUCCESS_WINDOW_HOURS = 24;
const REGISTER_SUCCESS_MAX_PER_IP = 3;
const REGISTER_IDENTIFIER_WINDOW_MINUTES = 60;
const REGISTER_IDENTIFIER_MAX_ATTEMPTS = 5;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_VERIFY_TIMEOUT_MS = 8000;
const TURNSTILE_MAX_TOKEN_LENGTH = 4096;
const TURNSTILE_REGISTER_ACTION = 'register';
const SOCIAL_PROVIDERS = new Set(['google', 'facebook']);

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
            // Guard against play bursts from the same browser session.
            if (type === 'play' && sessionId) {
                const recentPlay = await sql`
                    SELECT created_at
                    FROM analytics_logs
                    WHERE event_type = 'play'
                      AND item_id = ${id}
                      AND session_id = ${sessionId}
                    ORDER BY created_at DESC
                    LIMIT 1
                `;
                const lastPlay = recentPlay?.[0]?.created_at ? new Date(recentPlay[0].created_at) : null;
                if (lastPlay && Number.isFinite(lastPlay.getTime())) {
                    const secondsSinceLast = (Date.now() - lastPlay.getTime()) / 1000;
                    if (secondsSinceLast < PLAY_DEBOUNCE_SECONDS) {
                        const [current] = await sql`SELECT * FROM track_stats WHERE id = ${id}`;
                        return { status: 200, headers, body: current || { id, ...EMPTY_STATS_ROW } };
                    }
                }
            }

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

const isDevSocialAuthAllowed = (env) => {
    const flag = String(env.ALLOW_DEV_SOCIAL_AUTH || '').trim().toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes' || flag === 'on';
};

const normalizeIp = (value) => String(value || '').trim().slice(0, 128);
const normalizeUsername = (value = '') => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 32) || 'user';

const sanitizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const ensureSocialColumns = async (sql) => {
    await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS provider TEXT NULL;
    `;
    await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS provider_user_id TEXT NULL;
    `;
    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_provider_user_id
        ON users (provider, provider_user_id)
        WHERE provider IS NOT NULL AND provider_user_id IS NOT NULL;
    `;
};

const buildSyntheticEmail = (provider, providerUserId) => `${provider}_${providerUserId}@social.airdox.local`;

const getSocialConfig = (provider, env) => {
    if (provider === 'google') {
        return {
            provider,
            clientId: env.GOOGLE_CLIENT_ID || '',
            clientSecret: env.GOOGLE_CLIENT_SECRET || '',
            authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
            userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
            scope: 'openid email profile',
        };
    }
    if (provider === 'facebook') {
        return {
            provider,
            clientId: env.FACEBOOK_APP_ID || '',
            clientSecret: env.FACEBOOK_APP_SECRET || '',
            authEndpoint: 'https://www.facebook.com/v20.0/dialog/oauth',
            tokenEndpoint: 'https://graph.facebook.com/v20.0/oauth/access_token',
            userinfoEndpoint: 'https://graph.facebook.com/me?fields=id,name,email',
            scope: 'email,public_profile',
        };
    }
    return null;
};

const exchangeGoogleCode = async ({ config, code, redirectUri }) => {
    const form = new URLSearchParams();
    form.set('client_id', config.clientId);
    form.set('client_secret', config.clientSecret);
    form.set('code', code);
    form.set('grant_type', 'authorization_code');
    form.set('redirect_uri', redirectUri);

    const tokenRes = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error('Google token exchange failed');
    }

    const profileRes = await fetch(config.userinfoEndpoint, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json().catch(() => ({}));
    if (!profileRes.ok || !profile?.sub) {
        throw new Error('Google userinfo request failed');
    }

    return {
        provider: 'google',
        providerUserId: String(profile.sub),
        email: sanitizeEmail(profile.email),
        username: String(profile.name || profile.email || `google_${profile.sub}`),
    };
};

const exchangeFacebookCode = async ({ config, code, redirectUri }) => {
    const tokenUrl = new URL(config.tokenEndpoint);
    tokenUrl.searchParams.set('client_id', config.clientId);
    tokenUrl.searchParams.set('client_secret', config.clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error('Facebook token exchange failed');
    }

    const profileRes = await fetch(config.userinfoEndpoint, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json().catch(() => ({}));
    if (!profileRes.ok || !profile?.id) {
        throw new Error('Facebook userinfo request failed');
    }

    return {
        provider: 'facebook',
        providerUserId: String(profile.id),
        email: sanitizeEmail(profile.email),
        username: String(profile.name || `facebook_${profile.id}`),
    };
};

const exchangeSocialCode = async ({ provider, code, redirectUri, env }) => {
    const config = getSocialConfig(provider, env);
    if (!config || !config.clientId || !config.clientSecret) {
        throw new Error(`${provider} OAuth is not configured`);
    }
    if (provider === 'google') return exchangeGoogleCode({ config, code, redirectUri });
    if (provider === 'facebook') return exchangeFacebookCode({ config, code, redirectUri });
    throw new Error('Unsupported social provider');
};

const resolveOrCreateSocialUser = async (sql, { provider, providerUserId, email, username }) => {
    await ensureSocialColumns(sql);

    const normalizedProvider = String(provider);
    const normalizedProviderUserId = String(providerUserId);
    const normalizedEmail = sanitizeEmail(email) || buildSyntheticEmail(normalizedProvider, normalizedProviderUserId);
    const normalizedUsername = normalizeUsername(username || normalizedEmail.split('@')[0]);

    const byProvider = await sql`
        SELECT id, username, email
        FROM users
        WHERE provider = ${normalizedProvider} AND provider_user_id = ${normalizedProviderUserId}
        LIMIT 1
    `;
    if (byProvider?.[0]) return byProvider[0];

    const byEmail = await sql`
        SELECT id, username, email, provider, provider_user_id
        FROM users
        WHERE email = ${normalizedEmail}
        LIMIT 1
    `;

    if (byEmail?.[0]) {
        const existing = byEmail[0];
        if (!existing.provider || !existing.provider_user_id) {
            const [linked] = await sql`
                UPDATE users
                SET provider = ${normalizedProvider}, provider_user_id = ${normalizedProviderUserId}
                WHERE id = ${existing.id}
                RETURNING id, username, email
            `;
            return linked || existing;
        }
        return existing;
    }

    const [created] = await sql`
        INSERT INTO users (username, email, password, salt, provider, provider_user_id)
        VALUES (${normalizedUsername}, ${normalizedEmail}, ${generateRandomHex(16)}, ${generateSalt()}, ${normalizedProvider}, ${normalizedProviderUserId})
        RETURNING id, username, email
    `;
    return created;
};

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

const isRegisterSuccessRateLimited = async (sql, clientIp) => {
    if (!clientIp) return false;
    const [row] = await sql`
        SELECT COUNT(*)::int AS successful_registrations
        FROM auth_attempts
        WHERE action = 'register'
          AND ip_address = ${clientIp}
          AND success = true
          AND created_at > CURRENT_TIMESTAMP - (${REGISTER_SUCCESS_WINDOW_HOURS} * INTERVAL '1 hour');
    `;
    return Number(row?.successful_registrations || 0) >= REGISTER_SUCCESS_MAX_PER_IP;
};

const isRegisterIdentifierRateLimited = async (sql, identifier) => {
    if (!identifier) return false;
    const [row] = await sql`
        SELECT COUNT(*)::int AS attempts
        FROM auth_attempts
        WHERE action = 'register'
          AND identifier = ${identifier}
          AND created_at > CURRENT_TIMESTAMP - (${REGISTER_IDENTIFIER_WINDOW_MINUTES} * INTERVAL '1 minute');
    `;
    return Number(row?.attempts || 0) >= REGISTER_IDENTIFIER_MAX_ATTEMPTS;
};

const verifyTurnstileCaptcha = async ({ token, clientIp, env, expectedAction = '' }) => {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return { ok: false, error: 'CAPTCHA token missing' };
    if (normalizedToken.length > TURNSTILE_MAX_TOKEN_LENGTH) {
        return { ok: false, error: 'CAPTCHA verification failed' };
    }

    const secret = resolveTurnstileSecret(env);
    if (!secret) return { ok: false, error: 'CAPTCHA service not configured' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_VERIFY_TIMEOUT_MS);

    try {
        const formBody = new URLSearchParams();
        formBody.set('secret', secret);
        formBody.set('response', normalizedToken);
        if (clientIp) formBody.set('remoteip', clientIp);

        const response = await fetch(TURNSTILE_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
            signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
            return { ok: false, error: 'CAPTCHA verification failed' };
        }

        const normalizedExpectedAction = String(expectedAction || '').trim();
        const isTurnstileTestKeyResult = payload?.metadata?.result_with_testing_key === true;
        if (normalizedExpectedAction && !isTurnstileTestKeyResult) {
            const responseAction = String(payload?.action || '').trim();
            if (responseAction !== normalizedExpectedAction) {
                return { ok: false, error: 'CAPTCHA verification failed' };
            }
        }

        return { ok: true };
    } catch (error) {
        if (error?.name === 'AbortError') {
            return { ok: false, error: 'CAPTCHA verification failed' };
        }
        console.error('CAPTCHA verification error:', error);
        return { ok: false, error: 'CAPTCHA verification failed' };
    } finally {
        clearTimeout(timeoutId);
    }
};

export const handleAuthRequest = async ({ body, env }) => {
    const {
        action,
        username,
        email,
        password,
        token,
        captchaToken,
        clientIp: rawClientIp,
        provider,
        code,
        redirectUri,
    } = body || {};

    if (action === 'oauth_start') {
        const providerName = String(provider || '').toLowerCase();
        if (!SOCIAL_PROVIDERS.has(providerName)) {
            return { status: 400, body: errorBody('Unsupported social provider') };
        }
        const config = getSocialConfig(providerName, env);
        if (!config || !config.clientId || !config.clientSecret) {
            return { status: 503, body: errorBody(`${providerName} OAuth is not configured`) };
        }
        return { status: 200, body: { ok: true, provider: providerName, authEndpoint: config.authEndpoint, scope: config.scope } };
    }

    const sql = getSqlClient(env);
    if (!sql) return { status: 500, body: errorBody('Database not configured') };

    try {
        await ensureInitialized(sql);
    } catch (error) {
        return { status: 500, body: errorBody('Database initialization failed', error?.message) };
    }

    const clientIp = normalizeIp(rawClientIp);
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const loginIdentifier = String(email || username || '').trim();
    const normalizedLoginIdentifier = loginIdentifier.includes('@')
        ? loginIdentifier.toLowerCase()
        : loginIdentifier;

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
        const socialAction = action === 'oauth_exchange' || action === 'oauth_dev_mock';
        if (!socialAction) {
            return { status: 400, body: errorBody('Missing required fields') };
        }
    }

    try {
        if (action === 'register') {
            const isLimited = await isRegisterRateLimited(sql, clientIp);
            if (isLimited) {
                return { status: 429, body: errorBody('Too many registration attempts. Please try again later.') };
            }
            const successLimited = await isRegisterSuccessRateLimited(sql, clientIp);
            if (successLimited) {
                return { status: 429, body: errorBody('Registration temporarily limited for this network. Please try again later.') };
            }
            const identifierLimited = await isRegisterIdentifierRateLimited(sql, normalizedEmail || normalizedUsername);
            if (identifierLimited) {
                return { status: 429, body: errorBody('Too many attempts for this account identifier. Please try again later.') };
            }

            if (isCaptchaRequired(env)) {
                const captchaResult = await verifyTurnstileCaptcha({
                    token: captchaToken,
                    clientIp,
                    env,
                    expectedAction: TURNSTILE_REGISTER_ACTION,
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
            const [user] = await sql`
                SELECT *
                FROM users
                WHERE email = ${normalizedLoginIdentifier}
                   OR username = ${loginIdentifier}
            `;
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

        if (action === 'oauth_exchange') {
            const providerName = String(provider || '').toLowerCase();
            if (!SOCIAL_PROVIDERS.has(providerName)) {
                return { status: 400, body: errorBody('Unsupported social provider') };
            }
            if (!code || !redirectUri) {
                return { status: 400, body: errorBody('Missing OAuth code or redirectUri') };
            }

            let identity = null;
            try {
                identity = await exchangeSocialCode({
                    provider: providerName,
                    code: String(code),
                    redirectUri: String(redirectUri),
                    env,
                });
            } catch (exchangeError) {
                console.error('OAuth exchange failed:', exchangeError);
                return { status: 401, body: errorBody('OAuth login failed') };
            }

            const user = await resolveOrCreateSocialUser(sql, identity);
            const oauthToken = generateToken();
            await sql`
                INSERT INTO sessions (id, user_id)
                VALUES (${oauthToken}, ${user.id});
            `;

            return {
                status: 200,
                body: {
                    ok: true,
                    token: oauthToken,
                    user: { id: user.id, username: user.username, email: user.email },
                    provider: providerName,
                },
            };
        }

        if (action === 'oauth_dev_mock') {
            if (!isDevSocialAuthAllowed(env)) {
                return { status: 403, body: errorBody('Dev social auth bypass is disabled') };
            }

            const providerName = String(provider || '').toLowerCase();
            if (!SOCIAL_PROVIDERS.has(providerName)) {
                return { status: 400, body: errorBody('Unsupported social provider') };
            }

            const identity = {
                provider: providerName,
                providerUserId: `dev_${providerName}_local`,
                email: `dev_${providerName}@social.airdox.local`,
                username: `${providerName}_local_dev`,
            };

            const user = await resolveOrCreateSocialUser(sql, identity);
            const oauthToken = generateToken();
            await sql`
                INSERT INTO sessions (id, user_id)
                VALUES (${oauthToken}, ${user.id});
            `;

            return {
                status: 200,
                body: {
                    ok: true,
                    token: oauthToken,
                    user: { id: user.id, username: user.username, email: user.email },
                    provider: providerName,
                    mock: true,
                },
            };
        }

        return { status: 400, body: errorBody('Invalid action') };
    } catch (error) {
        console.error('Auth Error:', error);
        return { status: 500, body: errorBody('Authentication failed', error.message) };
    }
};

export const statsCacheControl = CACHE_CONTROL;
