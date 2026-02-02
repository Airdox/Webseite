import ReactGA from 'react-ga4';

// Initialize GA4
// REPLACE 'G-XXXXXXXXXX' WITH YOUR ACTUAL MEASUREMENT ID FROM GOOGLE ANALYTICS
const MEASUREMENT_ID = 'G-QX0D1TSKW5';

export const initGA = () => {
    const analyticsEnabled = localStorage.getItem('airdox-analytics-enabled') === 'true';

    if (analyticsEnabled) {
        ReactGA.initialize(MEASUREMENT_ID);
        console.log('📊 GA4 Initialized');
    }
};

export const logPageView = () => {
    const analyticsEnabled = localStorage.getItem('airdox-analytics-enabled') === 'true';
    if (analyticsEnabled) {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
};

export const logEvent = (category, action, label) => {
    const analyticsEnabled = localStorage.getItem('airdox-analytics-enabled') === 'true';
    if (analyticsEnabled) {
        ReactGA.event({
            category: category,
            action: action,
            label: label,
        });
        // Also log to console in dev mode
        if (import.meta.env.DEV) {
            console.log(`📡 GA Event: ${category} - ${action} - ${label}`);
        }
    }
};

export const logVinylSpin = (action) => {
    logEvent('VinylHero', action, 'User Interaction');
};

export const logDownload = (fileName, type) => {
    logEvent('Download', 'click', `${type}: ${fileName}`);
};

export const logBookingInterest = (type) => {
    logEvent('Booking', 'interest', type);
};

export const logGigHover = (city) => {
    logEvent('Globe', 'hover', city);
};
