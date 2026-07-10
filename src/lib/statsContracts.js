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

export const VALID_AUDIENCE_EVENTS = new Set([
    'route_view',
    'section_view',
    'cta_view',
    'set_play',
    'set_complete',
    'video_play',
    'tracklist_open',
    'tracklist_click',
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
