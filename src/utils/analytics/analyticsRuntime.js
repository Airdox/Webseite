export const getDefaultAnalyticsData = () => ({
    pageViews: [],
    downloads: [],
    sessions: [],
    audioEvents: [],
    interactions: [],
    customEvents: [],
    socialClicks: [],
});

export const trimAnalyticsBucket = (data, key, limit) => {
    if (data[key]?.length > limit) {
        data[key] = data[key].slice(-limit);
    }
};

export const getAnalyticsDeviceInfo = ({
    userAgent = navigator.userAgent,
    screen = window.screen,
    language = navigator.language,
} = {}) => {
    const width = screen.width;

    let deviceType = 'desktop';
    if (width < 768) deviceType = 'mobile';
    else if (width < 1024) deviceType = 'tablet';

    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return {
        type: deviceType,
        browser,
        os,
        screenWidth: screen.width,
        screenHeight: screen.height,
        language,
    };
};
