export const OAUTH_STATE_COOKIE = 'airdox_oauth_state';
export const OAUTH_STATE_DELIMITER = '~';

export const parseCookies = (request) => {
    const raw = request.headers.get('cookie') || '';
    const pairs = raw.split(';').map((part) => part.trim()).filter(Boolean);
    const out = {};
    for (const pair of pairs) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        const key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        try {
            out[key] = decodeURIComponent(value);
        } catch {
            out[key] = value;
        }
    }
    return out;
};

export const randomState = () => crypto.randomUUID().replace(/-/g, '');

export const sanitizeOrigin = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = new URL(raw);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        return url.origin;
    } catch {
        return '';
    }
};

export const safeDecodeURIComponent = (value) => {
    try {
        return decodeURIComponent(String(value || ''));
    } catch {
        return String(value || '');
    }
};

export const isTruthyFlag = (value) => {
    const flag = String(value || '').trim().toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes' || flag === 'on';
};

export const isLocalhostRequest = (request) => {
    try {
        const host = new URL(request.url).hostname;
        return host === '127.0.0.1' || host === 'localhost' || host === '::1';
    } catch {
        return false;
    }
};

export const isDevSocialAuthBypassEnabled = (env, request) => (
    isTruthyFlag(env.ALLOW_DEV_SOCIAL_AUTH) && isLocalhostRequest(request)
);

export const buildCookieAttributes = (request) => {
    const protocol = new URL(request.url).protocol;
    return protocol === 'https:'
        ? 'Path=/; HttpOnly; SameSite=Lax; Secure'
        : 'Path=/; HttpOnly; SameSite=Lax';
};

export const buildSetCookieHeader = (request, { name, value, maxAge }) => (
    `${name}=${encodeURIComponent(value)}; ${buildCookieAttributes(request)}; Max-Age=${maxAge}`
);

export const buildPopupHtml = ({ ok, payload, targetOrigin = '' }) => {
    const serialized = JSON.stringify({ ok, ...payload });
    const serializedTargetOrigin = JSON.stringify(String(targetOrigin || ''));
    return `<!doctype html><html><head><meta charset="utf-8"><title>AIRDOX Auth</title></head><body><script>
        (function () {
            var data = ${serialized};
            var targetOrigin = ${serializedTargetOrigin};
            try {
                if (data.ok && data.token) {
                    localStorage.setItem('airdox_token', data.token);
                }
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(
                        { source: 'airdox-oauth', ...data },
                        targetOrigin || window.location.origin
                    );
                }
            } catch (e) {}
            setTimeout(function () { window.close(); }, 40);
        })();
    </script></body></html>`;
};
