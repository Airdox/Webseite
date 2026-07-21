import { getSqlClient } from '../lib/statsDatabase.js';
import { jsonResponse } from './httpResponses.js';

const TIKTOK_API = 'https://open.tiktokapis.com';
const SESSION_COOKIE = '__Host-airdox_tiktok_session';
const STATE_COOKIE = '__Host-airdox_tiktok_oauth_state';
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const STATE_SECONDS = 10 * 60;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const PRIVACY_LEVELS = new Set(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']);
const PUBLISH_ID_PATTERN = /^[A-Za-z0-9._~-]{1,64}$/;

let schemaPromise;

const encodeBase64 = (bytes) => {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
};

const decodeBase64 = (value) => {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const randomToken = (byteLength = 32) => {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return encodeBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const sha256 = async (value) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const getEncryptionKey = async (env) => {
    if (!env.TIKTOK_TOKEN_ENCRYPTION_KEY) {
        throw new Error('TikTok token encryption is not configured');
    }
    const rawKey = decodeBase64(env.TIKTOK_TOKEN_ENCRYPTION_KEY);
    if (rawKey.byteLength !== 32) throw new Error('TikTok token encryption key must contain 32 bytes');
    return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

const encryptToken = async (token, env) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        await getEncryptionKey(env),
        new TextEncoder().encode(token),
    );
    return { ciphertext: encodeBase64(new Uint8Array(ciphertext)), iv: encodeBase64(iv) };
};

const decryptToken = async (ciphertext, iv, env) => {
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: decodeBase64(iv) },
        await getEncryptionKey(env),
        decodeBase64(ciphertext),
    );
    return new TextDecoder().decode(plaintext);
};

const parseCookies = (request) => Object.fromEntries(
    String(request.headers.get('Cookie') || '')
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const separator = part.indexOf('=');
            return separator === -1 ? [part, ''] : [part.slice(0, separator), part.slice(separator + 1)];
        }),
);

const cookie = (name, value, maxAge) => (
    `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`
);

const appOrigin = (env) => String(env.PUBLIC_APP_ORIGIN || 'https://airdox.info').replace(/\/$/, '');
const redirectUri = (env) => `${appOrigin(env)}/oauth/tiktok/callback`;

const ensureSameOrigin = (request, env) => {
    const origin = request.headers.get('Origin');
    if (origin && origin !== appOrigin(env)) {
        return jsonResponse({ ok: false, error: 'Cross-origin request rejected' }, { status: 403 });
    }
    return null;
};

const getDatabase = async (env) => {
    const sql = getSqlClient(env);
    if (!sql) throw new Error('Database is not configured');
    if (!schemaPromise) {
        schemaPromise = (async () => {
            await sql`
                CREATE TABLE IF NOT EXISTS tiktok_creator_sessions (
                    session_hash TEXT PRIMARY KEY,
                    open_id TEXT NOT NULL UNIQUE,
                    display_name TEXT NOT NULL DEFAULT '',
                    avatar_url TEXT NOT NULL DEFAULT '',
                    refresh_token_ciphertext TEXT NOT NULL,
                    refresh_token_iv TEXT NOT NULL,
                    access_token_ciphertext TEXT NULL,
                    access_token_iv TEXT NULL,
                    access_expires_at TIMESTAMPTZ NULL,
                    granted_scope TEXT NOT NULL,
                    refresh_expires_at TIMESTAMPTZ NOT NULL,
                    session_expires_at TIMESTAMPTZ NOT NULL,
                    last_upload_at TIMESTAMPTZ NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
            `;
            await sql`ALTER TABLE tiktok_creator_sessions ADD COLUMN IF NOT EXISTS access_token_ciphertext TEXT NULL;`;
            await sql`ALTER TABLE tiktok_creator_sessions ADD COLUMN IF NOT EXISTS access_token_iv TEXT NULL;`;
            await sql`ALTER TABLE tiktok_creator_sessions ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ NULL;`;
        })().catch((error) => {
            schemaPromise = undefined;
            throw error;
        });
    }
    await schemaPromise;
    return sql;
};

const readJson = async (response) => {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return { error: { code: 'invalid_response', message: text.slice(0, 200) } };
    }
};

const decodeBase64Utf8 = (value) => {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(decodeBase64(value.replaceAll('-', '+').replaceAll('_', '/')));
    } catch {
        return null;
    }
};

const readBooleanHeader = (request, name) => {
    const value = request.headers.get(name);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
};

const readPublishSettings = (request) => {
    const title = decodeBase64Utf8(request.headers.get('X-AIRDOX-TikTok-Title') || '');
    const privacyLevel = request.headers.get('X-AIRDOX-TikTok-Privacy') || '';
    const durationSec = Number(request.headers.get('X-AIRDOX-TikTok-Duration-Sec'));
    const allowComment = readBooleanHeader(request, 'X-AIRDOX-TikTok-Allow-Comment');
    const allowDuet = readBooleanHeader(request, 'X-AIRDOX-TikTok-Allow-Duet');
    const allowStitch = readBooleanHeader(request, 'X-AIRDOX-TikTok-Allow-Stitch');
    const brandOrganic = readBooleanHeader(request, 'X-AIRDOX-TikTok-Brand-Organic');
    const brandContent = readBooleanHeader(request, 'X-AIRDOX-TikTok-Brand-Content');
    const aiGenerated = readBooleanHeader(request, 'X-AIRDOX-TikTok-AI-Generated');
    const rightsConfirmed = readBooleanHeader(request, 'X-AIRDOX-TikTok-Rights-Confirmed');
    const musicConfirmed = readBooleanHeader(request, 'X-AIRDOX-TikTok-Music-Confirmed');
    if (title === null || title.length > 2200) return { error: 'Caption must contain no more than 2,200 characters' };
    if (!PRIVACY_LEVELS.has(privacyLevel)) return { error: 'Choose a TikTok privacy setting' };
    if (!Number.isFinite(durationSec) || durationSec <= 0) return { error: 'The video duration could not be verified' };
    if ([allowComment, allowDuet, allowStitch, brandOrganic, brandContent, aiGenerated, rightsConfirmed, musicConfirmed].includes(null)) {
        return { error: 'Post settings are incomplete' };
    }
    if (!rightsConfirmed || !musicConfirmed) return { error: 'Confirm your rights and TikTok music usage before posting' };
    if (brandContent && privacyLevel === 'SELF_ONLY') return { error: 'Branded content visibility cannot be set to private' };
    return { title, privacyLevel, durationSec, allowComment, allowDuet, allowStitch, brandOrganic, brandContent, aiGenerated };
};

const callTokenEndpoint = async (env, values, fetcher = fetch) => {
    const response = await fetcher(`${TIKTOK_API}/v2/oauth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_key: env.TIKTOK_CLIENT_KEY,
            client_secret: env.TIKTOK_CLIENT_SECRET,
            ...values,
        }),
    });
    const data = await readJson(response);
    if (!response.ok || data.error || !data.access_token || !data.refresh_token) {
        throw new Error(`TikTok authorization failed (${response.status})`);
    }
    return data;
};

const getProfile = async (accessToken, fetcher = fetch) => {
    const response = await fetcher(`${TIKTOK_API}/v2/user/info/?fields=open_id,display_name,avatar_url`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await readJson(response);
    if (!response.ok || data.error?.code !== 'ok' || !data.data?.user?.open_id) {
        throw new Error(`TikTok profile request failed (${response.status})`);
    }
    return data.data.user;
};

const queryCreatorInfo = async (accessToken, fetcher = fetch) => {
    const response = await fetcher(`${TIKTOK_API}/v2/post/publish/creator_info/query/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    });
    const result = await readJson(response);
    if (!response.ok || result.error?.code !== 'ok' || !result.data) {
        const code = result.error?.code || 'unknown';
        const error = new Error(`TikTok creator information failed (${response.status}, ${code})`);
        error.tiktokCode = code;
        throw error;
    }
    const privacyLevelOptions = Array.isArray(result.data.privacy_level_options)
        ? result.data.privacy_level_options.filter((option) => PRIVACY_LEVELS.has(option))
        : [];
    if (!privacyLevelOptions.length) throw new Error('TikTok returned no available privacy settings');
    return { ...result.data, privacy_level_options: privacyLevelOptions };
};

const getSession = async (request, env) => {
    const sessionToken = parseCookies(request)[SESSION_COOKIE];
    if (!sessionToken) return null;
    const sql = await getDatabase(env);
    const sessionHash = await sha256(sessionToken);
    await sql`DELETE FROM tiktok_creator_sessions WHERE session_expires_at <= CURRENT_TIMESTAMP OR refresh_expires_at <= CURRENT_TIMESTAMP;`;
    const rows = await sql`
        SELECT session_hash, open_id, display_name, avatar_url, refresh_token_ciphertext,
               refresh_token_iv, access_token_ciphertext, access_token_iv, access_expires_at,
               granted_scope, refresh_expires_at, session_expires_at, last_upload_at
        FROM tiktok_creator_sessions
        WHERE session_hash = ${sessionHash} AND session_expires_at > CURRENT_TIMESTAMP
        LIMIT 1;
    `;
    return rows[0] || null;
};

const refreshAccessToken = async (session, env, fetcher = fetch) => {
    if (session.access_token_ciphertext && session.access_token_iv && session.access_expires_at
        && new Date(session.access_expires_at).getTime() > Date.now() + 60_000) {
        return decryptToken(session.access_token_ciphertext, session.access_token_iv, env);
    }
    const refreshToken = await decryptToken(session.refresh_token_ciphertext, session.refresh_token_iv, env);
    const tokens = await callTokenEndpoint(env, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    }, fetcher);
    const encryptedRefresh = await encryptToken(tokens.refresh_token, env);
    const encryptedAccess = await encryptToken(tokens.access_token, env);
    const sql = await getDatabase(env);
    await sql`
        UPDATE tiktok_creator_sessions
        SET refresh_token_ciphertext = ${encryptedRefresh.ciphertext},
            refresh_token_iv = ${encryptedRefresh.iv},
            access_token_ciphertext = ${encryptedAccess.ciphertext},
            access_token_iv = ${encryptedAccess.iv},
            access_expires_at = ${new Date(Date.now() + Number(tokens.expires_in || 0) * 1000).toISOString()},
            granted_scope = ${tokens.scope || session.granted_scope},
            refresh_expires_at = ${new Date(Date.now() + Number(tokens.refresh_expires_in || 0) * 1000).toISOString()},
            updated_at = CURRENT_TIMESTAMP
        WHERE session_hash = ${session.session_hash};
    `;
    return tokens.access_token;
};

const publicSession = (session) => ({
    connected: true,
    profile: {
        displayName: session.display_name,
        avatarUrl: session.avatar_url,
    },
    scopes: String(session.granted_scope || '').split(',').filter(Boolean),
});

export const handleTikTokConfig = async (_request, env) => jsonResponse({
    ok: true,
    enabled: Boolean(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET && env.TIKTOK_TOKEN_ENCRYPTION_KEY),
    mode: 'creator_direct_post',
    maxVideoBytes: MAX_VIDEO_BYTES,
    acceptedVideoTypes: [...ALLOWED_VIDEO_TYPES],
}, { headers: { 'Cache-Control': 'no-store' } });

export const handleTikTokOAuthStart = async (_request, env) => {
    if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET || !env.TIKTOK_TOKEN_ENCRYPTION_KEY) {
        return jsonResponse({ ok: false, error: 'TikTok connection is not configured' }, { status: 503 });
    }
    const state = randomToken();
    const authorizationUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authorizationUrl.searchParams.set('client_key', env.TIKTOK_CLIENT_KEY);
    authorizationUrl.searchParams.set('scope', 'user.info.basic,video.publish');
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('redirect_uri', redirectUri(env));
    authorizationUrl.searchParams.set('state', state);
    return new Response(null, {
        status: 302,
        headers: {
            Location: authorizationUrl.toString(),
            'Set-Cookie': cookie(STATE_COOKIE, state, STATE_SECONDS),
            'Cache-Control': 'no-store',
        },
    });
};

export const handleTikTokOAuthCallback = async (request, env, fetcher = fetch) => {
    const url = new URL(request.url);
    const state = url.searchParams.get('state') || '';
    const storedState = parseCookies(request)[STATE_COOKIE] || '';
    const clearState = cookie(STATE_COOKIE, '', 0);
    const failure = (reason) => new Response(null, {
        status: 302,
        headers: { Location: `${appOrigin(env)}/tiktok-creator?error=${reason}`, 'Set-Cookie': clearState },
    });
    if (!state || !storedState || state !== storedState) return failure('invalid_state');
    if (url.searchParams.get('error')) return failure('authorization_denied');
    const code = url.searchParams.get('code');
    if (!code) return failure('missing_code');

    try {
        const tokens = await callTokenEndpoint(env, {
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri(env),
        }, fetcher);
        const grantedScopes = String(tokens.scope || '').split(',');
        if (!grantedScopes.includes('user.info.basic') || !grantedScopes.includes('video.publish')) {
            return failure('missing_permission');
        }
        const profile = await getProfile(tokens.access_token, fetcher);
        const sessionToken = randomToken();
        const sessionHash = await sha256(sessionToken);
        const encryptedRefresh = await encryptToken(tokens.refresh_token, env);
        const encryptedAccess = await encryptToken(tokens.access_token, env);
        const now = Date.now();
        const sql = await getDatabase(env);
        await sql`
            INSERT INTO tiktok_creator_sessions (
                session_hash, open_id, display_name, avatar_url, refresh_token_ciphertext,
                refresh_token_iv, access_token_ciphertext, access_token_iv, access_expires_at,
                granted_scope, refresh_expires_at, session_expires_at
            ) VALUES (
                ${sessionHash}, ${profile.open_id}, ${profile.display_name || ''}, ${profile.avatar_url || ''},
                ${encryptedRefresh.ciphertext}, ${encryptedRefresh.iv}, ${encryptedAccess.ciphertext}, ${encryptedAccess.iv},
                ${new Date(now + Number(tokens.expires_in || 0) * 1000).toISOString()}, ${tokens.scope},
                ${new Date(now + Number(tokens.refresh_expires_in || 0) * 1000).toISOString()},
                ${new Date(now + SESSION_SECONDS * 1000).toISOString()}
            )
            ON CONFLICT (open_id) DO UPDATE SET
                session_hash = EXCLUDED.session_hash,
                display_name = EXCLUDED.display_name,
                avatar_url = EXCLUDED.avatar_url,
                refresh_token_ciphertext = EXCLUDED.refresh_token_ciphertext,
                refresh_token_iv = EXCLUDED.refresh_token_iv,
                access_token_ciphertext = EXCLUDED.access_token_ciphertext,
                access_token_iv = EXCLUDED.access_token_iv,
                access_expires_at = EXCLUDED.access_expires_at,
                granted_scope = EXCLUDED.granted_scope,
                refresh_expires_at = EXCLUDED.refresh_expires_at,
                session_expires_at = EXCLUDED.session_expires_at,
                updated_at = CURRENT_TIMESTAMP;
        `;
        const headers = new Headers({ Location: `${appOrigin(env)}/tiktok-creator?connected=1`, 'Cache-Control': 'no-store' });
        headers.append('Set-Cookie', clearState);
        headers.append('Set-Cookie', cookie(SESSION_COOKIE, sessionToken, SESSION_SECONDS));
        return new Response(null, { status: 302, headers });
    } catch (error) {
        console.error('TikTok OAuth callback failed:', error.message);
        return failure('connection_failed');
    }
};

export const handleTikTokSession = async (request, env) => {
    try {
        const session = await getSession(request, env);
        return jsonResponse({ ok: true, ...(session ? publicSession(session) : { connected: false }) }, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        console.error('TikTok session lookup failed:', error.message);
        return jsonResponse({ ok: false, error: 'TikTok session is unavailable' }, { status: 503 });
    }
};

export const handleTikTokCreatorInfo = async (request, env, fetcher = fetch) => {
    try {
        const session = await getSession(request, env);
        if (!session) return jsonResponse({ ok: false, error: 'Connect your TikTok account first' }, { status: 401 });
        if (!String(session.granted_scope).split(',').includes('video.publish')) {
            return jsonResponse({ ok: false, error: 'TikTok publishing permission is missing. Reconnect your account.' }, { status: 403 });
        }
        const accessToken = await refreshAccessToken(session, env, fetcher);
        const creator = await queryCreatorInfo(accessToken, fetcher);
        return jsonResponse({
            ok: true,
            creator: {
                username: creator.creator_username || '',
                nickname: creator.creator_nickname || session.display_name || 'TikTok creator',
                avatarUrl: creator.creator_avatar_url || session.avatar_url || '',
                privacyLevelOptions: creator.privacy_level_options,
                commentDisabled: Boolean(creator.comment_disabled),
                duetDisabled: Boolean(creator.duet_disabled),
                stitchDisabled: Boolean(creator.stitch_disabled),
                maxVideoPostDurationSec: Number(creator.max_video_post_duration_sec || 0),
            },
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('TikTok creator information failed:', error.message);
        const unavailable = String(error.tiktokCode || '').startsWith('spam_risk_') || error.tiktokCode === 'reached_active_user_cap';
        return jsonResponse({
            ok: false,
            error: unavailable ? 'TikTok cannot accept another post from this account right now. Please try again later.' : 'TikTok creator settings are temporarily unavailable.',
        }, { status: unavailable ? 429 : 502 });
    }
};

export const handleTikTokPublish = async (request, env, fetcher = fetch) => {
    const originError = ensureSameOrigin(request, env);
    if (originError) return originError;
    const contentType = String(request.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
    const videoSize = Number(request.headers.get('X-AIRDOX-Video-Size') || request.headers.get('Content-Length') || 0);
    if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
        return jsonResponse({ ok: false, error: 'Use an MP4, MOV, or WebM video' }, { status: 415 });
    }
    if (!Number.isInteger(videoSize) || videoSize < 1 || videoSize > MAX_VIDEO_BYTES) {
        return jsonResponse({ ok: false, error: 'Video must be between 1 byte and 50 MB' }, { status: 413 });
    }
    const settings = readPublishSettings(request);
    if (settings.error) return jsonResponse({ ok: false, error: settings.error }, { status: 400 });
    try {
        const session = await getSession(request, env);
        if (!session) return jsonResponse({ ok: false, error: 'Connect your TikTok account first' }, { status: 401 });
        if (!String(session.granted_scope).split(',').includes('video.publish')) {
            return jsonResponse({ ok: false, error: 'TikTok publishing permission is missing. Reconnect your account.' }, { status: 403 });
        }
        if (session.last_upload_at && Date.now() - new Date(session.last_upload_at).getTime() < 60_000) {
            return jsonResponse({ ok: false, error: 'Please wait one minute before another upload' }, { status: 429 });
        }
        const accessToken = await refreshAccessToken(session, env, fetcher);
        const creator = await queryCreatorInfo(accessToken, fetcher);
        if (!creator.privacy_level_options.includes(settings.privacyLevel)) {
            return jsonResponse({ ok: false, error: 'That privacy setting is no longer available. Refresh the page and choose again.' }, { status: 409 });
        }
        if (Number(creator.max_video_post_duration_sec) > 0 && settings.durationSec > Number(creator.max_video_post_duration_sec) + 0.25) {
            return jsonResponse({ ok: false, error: `This account can post videos up to ${creator.max_video_post_duration_sec} seconds.` }, { status: 400 });
        }
        if ((creator.comment_disabled && settings.allowComment) || (creator.duet_disabled && settings.allowDuet) || (creator.stitch_disabled && settings.allowStitch)) {
            return jsonResponse({ ok: false, error: 'One of the selected interaction settings is no longer available. Refresh and review the settings.' }, { status: 409 });
        }
        const initResponse = await fetcher(`${TIKTOK_API}/v2/post/publish/video/init/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({
                post_info: {
                    title: settings.title,
                    privacy_level: settings.privacyLevel,
                    disable_comment: !settings.allowComment,
                    disable_duet: !settings.allowDuet,
                    disable_stitch: !settings.allowStitch,
                    brand_organic_toggle: settings.brandOrganic,
                    brand_content_toggle: settings.brandContent,
                    is_aigc: settings.aiGenerated,
                },
                source_info: { source: 'FILE_UPLOAD', video_size: videoSize, chunk_size: videoSize, total_chunk_count: 1 },
            }),
        });
        const initData = await readJson(initResponse);
        if (!initResponse.ok || initData.error?.code !== 'ok' || !initData.data?.upload_url || !initData.data?.publish_id) {
            throw new Error(`TikTok upload initialization failed (${initResponse.status}, ${initData.error?.code || 'unknown'})`);
        }
        const uploadResponse = await fetcher(initData.data.upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(videoSize),
                'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
            },
            body: request.body,
        });
        if (!uploadResponse.ok) throw new Error(`TikTok media transfer failed (${uploadResponse.status})`);
        const sql = await getDatabase(env);
        await sql`UPDATE tiktok_creator_sessions SET last_upload_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE session_hash = ${session.session_hash};`;
        return jsonResponse({
            ok: true,
            publishId: initData.data.publish_id,
            status: 'PROCESSING_UPLOAD',
            nextAction: 'TikTok accepted the video and is processing the post.',
        });
    } catch (error) {
        console.error('TikTok direct post failed:', error.message);
        return jsonResponse({ ok: false, error: 'TikTok could not accept this post. Please review the settings and try again.' }, { status: 502 });
    }
};

export const handleTikTokPublishStatus = async (request, env, fetcher = fetch) => {
    const originError = ensureSameOrigin(request, env);
    if (originError) return originError;
    let publishId = '';
    try {
        publishId = String((await request.json()).publishId || '');
    } catch {
        return jsonResponse({ ok: false, error: 'Invalid status request' }, { status: 400 });
    }
    if (!PUBLISH_ID_PATTERN.test(publishId)) return jsonResponse({ ok: false, error: 'Invalid publish identifier' }, { status: 400 });
    try {
        const session = await getSession(request, env);
        if (!session) return jsonResponse({ ok: false, error: 'Connect your TikTok account first' }, { status: 401 });
        const accessToken = await refreshAccessToken(session, env, fetcher);
        const response = await fetcher(`${TIKTOK_API}/v2/post/publish/status/fetch/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({ publish_id: publishId }),
        });
        const result = await readJson(response);
        if (!response.ok || result.error?.code !== 'ok' || !result.data?.status) throw new Error(`TikTok status failed (${response.status})`);
        return jsonResponse({
            ok: true,
            status: result.data.status,
            failReason: result.data.fail_reason || '',
            postIds: Array.isArray(result.data.publicaly_available_post_id) ? result.data.publicaly_available_post_id : [],
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('TikTok publish status failed:', error.message);
        return jsonResponse({ ok: false, error: 'TikTok post status is temporarily unavailable' }, { status: 502 });
    }
};

export const handleTikTokDisconnect = async (request, env, fetcher = fetch) => {
    const originError = ensureSameOrigin(request, env);
    if (originError) return originError;
    try {
        const session = await getSession(request, env);
        if (session) {
            try {
                const token = await refreshAccessToken(session, env, fetcher);
                await fetcher(`${TIKTOK_API}/v2/oauth/revoke/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, token }),
                });
            } catch (error) {
                console.warn('TikTok token revocation failed; deleting local connection:', error.message);
            }
            const sql = await getDatabase(env);
            await sql`DELETE FROM tiktok_creator_sessions WHERE session_hash = ${session.session_hash};`;
        }
        return jsonResponse({ ok: true, connected: false }, {
            headers: { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0), 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        console.error('TikTok disconnect failed:', error.message);
        return jsonResponse({ ok: false, error: 'Could not disconnect TikTok' }, { status: 500 });
    }
};

export const tiktokCreatorConstants = { MAX_VIDEO_BYTES, SESSION_COOKIE, STATE_COOKIE };
