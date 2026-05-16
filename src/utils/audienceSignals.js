const DEFAULT_ENDPOINT = '/api/audience-events';
const SESSION_KEY = 'airdox_audience_session';

let audienceConfig = {
  endpoint: DEFAULT_ENDPOINT,
  enabled: true,
  consentResolver: null
};

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return null;
  }
}

function defaultConsentResolver() {
  try {
    const candidates = [
      'airdox_cookie_consent',
      'cookieConsent',
      'analyticsConsent'
    ];

    for (const key of candidates) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      if (raw === 'true') return { analytics: true };
      const parsed = JSON.parse(raw);
      if (parsed?.analytics === true || parsed?.statistics === true) {
        return { analytics: true };
      }
    }
  } catch {
    return { analytics: false };
  }

  return { analytics: false };
}

function getConsent() {
  const resolver = audienceConfig.consentResolver || defaultConsentResolver;
  const consent = resolver();
  return consent === true ? { analytics: true } : { analytics: consent?.analytics === true };
}

function getDeviceClass() {
  if (typeof window === 'undefined') return 'unknown';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1100) return 'tablet';
  return 'desktop';
}

function getReferrerGroup() {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host.includes('instagram') || host.includes('facebook') || host.includes('tiktok') || host.includes('youtube')) {
      return 'social';
    }
    if (host.includes('google') || host.includes('bing') || host.includes('duckduckgo')) {
      return 'search';
    }
    return 'referral';
  } catch {
    return 'unknown';
  }
}

function dispatchLocalSignal(event) {
  window.dispatchEvent(new CustomEvent('airdox:audience-signal', { detail: event }));
}

function sendSignal(event) {
  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    return navigator.sendBeacon(audienceConfig.endpoint, blob);
  }

  fetch(audienceConfig.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {});
  return true;
}

export function configureAudienceSignals(config = {}) {
  audienceConfig = {
    ...audienceConfig,
    ...config
  };
}

export function createAudienceSignal(type, payload = {}) {
  const consent = getConsent();
  return {
    timestamp: new Date().toISOString(),
    sessionIdHash: getSessionId(),
    consent,
    type,
    route: window.location?.pathname || '/',
    referrerGroup: getReferrerGroup(),
    deviceClass: getDeviceClass(),
    locale: navigator.language || 'unknown',
    ...payload
  };
}

export function trackAudienceSignal(type, payload = {}) {
  if (!audienceConfig.enabled || typeof window === 'undefined') return false;

  const event = createAudienceSignal(type, payload);
  if (event.consent.analytics !== true) {
    dispatchLocalSignal({ ...event, skipped: true, reason: 'analytics_consent_missing' });
    return false;
  }

  dispatchLocalSignal(event);
  return sendSignal(event);
}

export const audienceEvents = {
  routeView: (payload) => trackAudienceSignal('route_view', payload),
  sectionView: (payload) => trackAudienceSignal('section_view', payload),
  ctaView: (payload) => trackAudienceSignal('cta_view', payload),
  setPlay: (payload) => trackAudienceSignal('set_play', payload),
  setComplete: (payload) => trackAudienceSignal('set_complete', payload),
  videoPlay: (payload) => trackAudienceSignal('video_play', payload),
  tracklistOpen: (payload) => trackAudienceSignal('tracklist_open', payload),
  deepScroll: (payload) => trackAudienceSignal('deep_scroll', payload),
  shareClick: (payload) => trackAudienceSignal('share_click', payload),
  copyLink: (payload) => trackAudienceSignal('copy_link', payload),
  newsletterSignup: (payload) => trackAudienceSignal('newsletter_signup', payload),
  bookingClick: (payload) => trackAudienceSignal('booking_click', payload),
  contactSubmit: (payload) => trackAudienceSignal('contact_submit', payload),
  epkDownload: (payload) => trackAudienceSignal('epk_download', payload),
  externalSocialClick: (payload) => trackAudienceSignal('external_social_click', payload)
};
