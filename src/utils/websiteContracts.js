export const STORAGE_KEYS = {
    analyticsData: 'airdox-analytics-data',
    analyticsConsent: 'airdox-analytics-enabled',
    marketingConsent: 'airdox-marketing-enabled',
    authToken: 'airdox_token',
    globalStats: 'airdox_global_stats',
    offlineStatsQueue: 'airdox_offline_queue',
    sessionId: 'airdox_sid',
    setAnimationModes: 'airdox_set_animation_modes',
    userVotes: 'airdox_user_votes',
};

export const WINDOW_EVENTS = {
    analyticsConsentChanged: 'analytics-consent-changed',
    audienceSignal: 'airdox:audience-signal',
    bookingPrefill: 'airdox_booking_prefill',
    loginSuccess: 'airdox_login_success',
    logout: 'airdox_logout',
    statsUpdated: 'airdox_stats_updated',
};

export const readStorageJson = (key, fallback = {}) => {
    if (typeof localStorage === 'undefined') return fallback;
    try {
        return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
        return fallback;
    }
};

export const getStorageItem = (key, fallback = '') => {
    if (typeof localStorage === 'undefined') return fallback;
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
};

export const setStorageItem = (key, value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
};

export const removeStorageItem = (key) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
};

export const writeStorageJson = (key, value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
};

export const dispatchWindowEvent = (eventName, detail) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(eventName, detail === undefined ? undefined : { detail }));
};
