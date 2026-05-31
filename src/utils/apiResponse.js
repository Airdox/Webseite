const getConfiguredApiBase = () => (import.meta.env?.VITE_STATS_API_BASE || '').replace(/\/+$/, '');
const getProductionSiteBase = () => (
    import.meta.env?.VITE_PUBLIC_SITE_URL || 'https://airdox-webseite.beuth62.workers.dev'
).replace(/\/+$/, '');

const getWindowOrigin = () => {
    if (typeof window === 'undefined') return '';
    return window.location?.origin || '';
};

export const isMobileRuntime = () => {
    if (typeof window === 'undefined') return false;
    return window.location.protocol === 'file:' || (window.location.hostname === 'localhost' && !!window.Capacitor);
};

export const isLocalHttpRuntime = () => {
    if (typeof window === 'undefined') return false;
    if (import.meta.env?.MODE === 'test') return false;
    return window.location.protocol.startsWith('http')
        && ['localhost', '127.0.0.1'].includes(window.location.hostname);
};

export const resolveApiBaseUrl = (base = getConfiguredApiBase()) => {
    const trimmedBase = String(base || '').replace(/\/+$/, '');
    const origin = getWindowOrigin();
    if (!origin) return trimmedBase;
    if (!trimmedBase) return origin;
    try {
        return new URL(trimmedBase, origin).toString().replace(/\/+$/, '');
    } catch {
        return origin;
    }
};

export const resolveApiOrigin = (base = getConfiguredApiBase()) => {
    const resolved = resolveApiBaseUrl(base);
    if (!resolved) return '';
    try {
        return new URL(resolved, getWindowOrigin() || undefined).origin;
    } catch {
        return getWindowOrigin();
    }
};

export const buildApiUrl = (path, base = getConfiguredApiBase()) => {
    const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${path || ''}`;
    const trimmedBase = String(base || '').replace(/\/+$/, '');
    if (!trimmedBase) return normalizedPath;
    return `${resolveApiBaseUrl(trimmedBase)}${normalizedPath}`;
};

export const getRuntimeApiBase = (configuredBase = '', { useProductionForMobile = true } = {}) => {
    const trimmedBase = String(configuredBase || '').replace(/\/+$/, '');
    if (trimmedBase) return resolveApiBaseUrl(trimmedBase);
    if (isLocalHttpRuntime() || (useProductionForMobile && isMobileRuntime())) {
        return getProductionSiteBase();
    }
    return '';
};

export const buildRuntimeApiUrl = (path, configuredBase = '', options) => (
    buildApiUrl(path, getRuntimeApiBase(configuredBase, options))
);

export const readApiJson = async (response) => {
    const text = typeof response?.text === 'function'
        ? await response.text().catch(() => '')
        : '';
    if (!text) {
        if (typeof response?.json === 'function') {
            return response.json().catch(() => ({}));
        }
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
};

export const readApiError = async (response, fallbackMessage) => {
    const data = await readApiJson(response);
    return data.error || data.message || fallbackMessage;
};
