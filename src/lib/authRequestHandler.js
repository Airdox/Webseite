import {
    errorBody,
    REGISTER_IDENTIFIER_MAX_ATTEMPTS,
    REGISTER_IDENTIFIER_WINDOW_MINUTES,
    REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
    REGISTER_RATE_LIMIT_WINDOW_MINUTES,
    REGISTER_SUCCESS_MAX_PER_IP,
    REGISTER_SUCCESS_WINDOW_HOURS,
    SOCIAL_PROVIDERS,
    TURNSTILE_REGISTER_ACTION,
} from './statsContracts.js';
import {
    buildSyntheticEmail,
    exchangeSocialCode,
    generateRandomHex,
    generateSalt,
    generateToken,
    getSocialConfig,
    hashPassword,
    isCaptchaRequired,
    isDevSocialAuthAllowed,
    normalizeIp,
    normalizeUsername,
    sanitizeEmail,
    verifyTurnstileCaptcha,
} from './authHelpers.js';
import { ensureInitialized, getSqlClient } from './statsDatabase.js';

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
                    user: { id: user.id, username: user.username, email: user.email },
                },
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
