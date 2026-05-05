export const TRACK_TIME_PATTERN = /^\d{1,2}:\d{2}(?::\d{2})?$/;

export const parseTrackTimeToSeconds = (value = '') => {
    const raw = String(value || '').trim();
    if (!TRACK_TIME_PATTERN.test(raw)) return null;

    const parts = raw
        .split(':')
        .map((chunk) => Number.parseInt(chunk, 10));
    if (!parts.length || parts.some((part) => Number.isNaN(part))) return null;
    const minutes = parts[parts.length - 2];
    const seconds = parts[parts.length - 1];
    if (minutes > 59 || seconds > 59) return null;
    if (parts.length === 3) {
        const [hours] = parts;
        return (hours * 3600) + (minutes * 60) + seconds;
    }
    if (parts.length === 2) {
        return (minutes * 60) + seconds;
    }
    return null;
};

export const getSeekableTracks = (tracks = []) => {
    if (!Array.isArray(tracks)) return [];
    return tracks.filter((track) => parseTrackTimeToSeconds(track.time) !== null);
};
