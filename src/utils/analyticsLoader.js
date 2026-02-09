let analyticsPromise = null;

export const ensureAnalyticsLoaded = () => {
    if (analyticsPromise) return analyticsPromise;

    analyticsPromise = import('./analyticsV2.js');
    analyticsPromise.catch(() => {
        analyticsPromise = null;
    });

    return analyticsPromise;
};

export const maybeLoadAnalytics = () => {
    try {
        if (typeof window === 'undefined') return null;
        const consent = window.localStorage?.getItem('airdox-analytics-enabled');
        if (consent === 'true') {
            return ensureAnalyticsLoaded();
        }
    } catch {
        return null;
    }

    return null;
};
