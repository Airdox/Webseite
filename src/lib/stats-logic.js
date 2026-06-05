import {
    BLOCKED_AUDIENCE_FIELDS,
    CACHE_CONTROL,
    EMPTY_STATS_ROW,
    errorBody,
    PLAY_DEBOUNCE_SECONDS,
    VALID_AUDIENCE_EVENTS,
    VALID_UPDATE_TYPES,
} from './statsContracts.js';
import { ensureInitialized, getSqlClient } from './statsDatabase.js';
export { handleAuthRequest } from './authRequestHandler.js';

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

export const handleAudienceEventRequest = async ({ body, env }) => {
    const headers = { 'cache-control': 'no-store' };
    const sql = getSqlClient(env);

    if (!body || typeof body !== 'object') {
        return { status: 400, headers, body: errorBody('Invalid audience event') };
    }

    for (const field of BLOCKED_AUDIENCE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            return { status: 400, headers, body: errorBody(`Blocked audience field: ${field}`) };
        }
    }

    if (body.consent !== true && body.consent?.analytics !== true) {
        return { status: 202, headers, body: { ok: true, skipped: true, reason: 'analytics_consent_missing' } };
    }

    const eventType = String(body.type || '').trim();
    if (!VALID_AUDIENCE_EVENTS.has(eventType)) {
        return { status: 400, headers, body: errorBody('Unsupported audience event type') };
    }

    if (!sql) {
        return { status: 202, headers, body: { ok: true, _fallback: true, stored: false, reason: 'Database not configured' } };
    }

    try {
        await ensureInitialized(sql);
    } catch (error) {
        return { status: 500, headers, body: errorBody('Database initialization failed', error?.message) };
    }

    try {
        const sessionId = String(body.sessionIdHash || '').slice(0, 160) || null;
        const itemId = String(body.contentId || body.contentType || body.route || '').slice(0, 240) || null;
        const cf = body.cf || {};
        const country = String(cf.country || body.country || 'Unknown').slice(0, 80);
        const city = String(cf.city || 'Unknown').slice(0, 120);
        const region = String(cf.region || 'Unknown').slice(0, 120);
        const device = String(body.deviceClass || 'Unknown').slice(0, 80);
        const referrer = String(body.referrerGroup || body.campaign || body.route || '').slice(0, 240) || null;
        const route = String(body.route || '').slice(0, 240) || null;
        const source = String(body.source || '').slice(0, 120) || null;
        const contentType = String(body.contentType || '').slice(0, 120) || null;
        const numericValue = Number(body.value);
        const value = Number.isFinite(numericValue) ? numericValue : null;

        await sql`
            INSERT INTO analytics_logs (
                event_type, item_id, session_id,
                country, city, region,
                device_type, browser, os, referrer,
                route, source, content_type, value
            )
            VALUES (
                ${eventType}, ${itemId}, ${sessionId},
                ${country}, ${city}, ${region},
                ${device}, ${'Unknown'}, ${String(body.locale || 'Unknown').slice(0, 80)}, ${referrer},
                ${route}, ${source}, ${contentType}, ${value}
            );
        `;

        return { status: 202, headers, body: { ok: true, stored: true } };
    } catch (error) {
        console.error('Audience event storage failed:', error);
        return { status: 500, headers, body: errorBody('Audience event storage failed', error?.message) };
    }
};

export const statsCacheControl = CACHE_CONTROL;
