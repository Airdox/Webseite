const CONSENT_KEY = 'airdox-analytics-enabled';
const isDev = import.meta.env?.DEV;
let analyticsPromise = null;

export const ensureAnalyticsLoaded = () => {
    if (analyticsPromise) return analyticsPromise;

    analyticsPromise = import('./analytics/index.js')
        .then((mod) => {
            const analytics = mod?.default;
            if (analytics?.init) analytics.init();
            return analytics;
        })
        .catch((error) => {
            if (isDev) console.error('Analytics load failed:', error);
            analyticsPromise = null;
            return null;
        });

    return analyticsPromise;
};

const handleConsentChange = () => {
    if (typeof window === 'undefined') return null;

    const consent = window.localStorage?.getItem(CONSENT_KEY);
    if (consent === 'true') {
        if (analyticsPromise) {
            void analyticsPromise.then((analytics) => analytics?.init?.());
            return analyticsPromise;
        }
        return ensureAnalyticsLoaded();
    }

    return null;
};

export const maybeLoadAnalytics = () => {
    if (typeof window === 'undefined') return null;

    handleConsentChange();
    window.addEventListener('analytics-consent-changed', handleConsentChange);
    return null;
};
