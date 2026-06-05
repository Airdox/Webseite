export const CACHE_CONTROL = 'public, s-maxage=10, stale-while-revalidate=30';

export const SEED_PLAYS = {
    secret_set_2025_12_22: 44
};

export const EMPTY_STATS_ROW = {
    plays: 0,
    likes: 0,
    dislikes: 0,
    last_played_at: null
};

export const VALID_UPDATE_TYPES = new Set([
    'play',
    'like',
    'dislike',
    'unlike',
    'undislike'
]);

export const PLAY_DEBOUNCE_SECONDS = 20;
export const REGISTER_RATE_LIMIT_WINDOW_MINUTES = 60;
export const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 8;
export const REGISTER_SUCCESS_WINDOW_HOURS = 24;
export const REGISTER_SUCCESS_MAX_PER_IP = 3;
export const REGISTER_IDENTIFIER_WINDOW_MINUTES = 60;
export const REGISTER_IDENTIFIER_MAX_ATTEMPTS = 5;
export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_VERIFY_TIMEOUT_MS = 8000;
export const TURNSTILE_MAX_TOKEN_LENGTH = 4096;
export const TURNSTILE_REGISTER_ACTION = 'register';

export const SOCIAL_PROVIDERS = new Set(['google', 'facebook']);

export const VALID_AUDIENCE_EVENTS = new Set([
    'route_view',
    'section_view',
    'cta_view',
    'set_play',
    'set_complete',
    'video_play',
    'tracklist_open',
    'deep_scroll',
    'share_click',
    'copy_link',
    'newsletter_signup',
    'booking_click',
    'contact_submit',
    'epk_download',
    'external_social_click'
]);

export const BLOCKED_AUDIENCE_FIELDS = new Set([
    'ip',
    'email',
    'name',
    'phone',
    'address',
    'exactLocation',
    'formMessage',
    'rawUserAgent',
    'fingerprint',
    'userId'
]);

export const errorBody = (message, details) => {
    const body = { ok: false, error: message };
    if (details) body.details = details;
    return body;
};
