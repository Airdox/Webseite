const MONTHS = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

export const PUBLIC_SET_COUNT = Number.POSITIVE_INFINITY;
const toTimestamp = (value) => {
  if (!value) return Number.NaN;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

const tryDateFromPattern = (value = '', pattern, mapper) => {
  const match = String(value).match(pattern);
  if (!match) return Number.NaN;
  return mapper(match);
};

export const deriveSetPublishedTimestamp = (set = {}) => {
  const byPublishedAt = toTimestamp(set.publishedAt);
  if (!Number.isNaN(byPublishedAt)) return byPublishedAt;

  const byId = tryDateFromPattern(
    `${set.id || ''} ${set.file || ''}`,
    /(20\d{2})[._-](\d{2})[._-](\d{2})/,
    (match) => Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  if (!Number.isNaN(byId)) return byId;

  const byDotDate = tryDateFromPattern(
    set.date || '',
    /(\d{2})\.(\d{2})\.(20\d{2})/,
    (match) => Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])),
  );
  if (!Number.isNaN(byDotDate)) return byDotDate;

  const byMonthLabel = tryDateFromPattern(
    set.date || '',
    /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b\s+(20\d{2})/i,
    (match) => Date.UTC(Number(match[2]), MONTHS[match[1].toUpperCase()] || 0, 1),
  );
  if (!Number.isNaN(byMonthLabel)) return byMonthLabel;

  return Number.NaN;
};

export const deriveSetTimestamp = (set = {}, index = 0) => {
  const publishedTimestamp = deriveSetPublishedTimestamp(set);
  if (!Number.isNaN(publishedTimestamp)) return publishedTimestamp;

  return Number.MAX_SAFE_INTEGER - index;
};

export const getLatestSet = (allSets = []) => allSets
  .map((set, index) => ({
    set,
    index,
    timestamp: deriveSetTimestamp(set, index),
  }))
  .sort((left, right) => {
    if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
    return left.index - right.index;
  })[0]?.set;

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatSetDate = (set = {}, locale = 'de') => {
  const timestamp = deriveSetPublishedTimestamp(set);
  if (Number.isNaN(timestamp)) return '';

  const publishedDate = new Date(timestamp);
  const day = String(publishedDate.getUTCDate()).padStart(2, '0');
  const monthIndex = publishedDate.getUTCMonth();
  const month = String(monthIndex + 1).padStart(2, '0');

  if (locale === 'de') return `${day}.${month}.`;
  return `${day} ${EN_MONTHS[monthIndex] || month}`;
};

export const partitionSetsByAccess = (allSets = [], publicCount = PUBLIC_SET_COUNT) => {
  const ranked = allSets
    .map((set, index) => ({
      set,
      index,
      timestamp: deriveSetTimestamp(set, index),
    }))
    .sort((left, right) => {
      if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
      return left.index - right.index;
    });

  const resolvedPublicCount = publicCount === Number.POSITIVE_INFINITY
    ? ranked.length
    : Math.max(0, Number(publicCount) || 0);

  const publicIdSet = new Set(
    ranked
      .slice(0, resolvedPublicCount)
      .map((entry) => entry.set?.id)
      .filter(Boolean),
  );
  const restrictedIdSet = new Set(
    ranked
      .slice(resolvedPublicCount)
      .map((entry) => entry.set?.id)
      .filter(Boolean),
  );

  const publicSets = [];
  const restrictedSets = [];

  for (const set of allSets) {
    if (publicIdSet.has(set?.id)) {
      publicSets.push(set);
    } else {
      restrictedSets.push(set);
    }
  }

  return { publicSets, restrictedSets, publicIdSet, restrictedIdSet };
};

export const isPublicSet = (set, publicIdSet) => Boolean(set?.id && publicIdSet?.has(set.id));

export const normalizeAudioFilename = (filename = '') => {
  const raw = String(filename || '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw).replace(/^.*[\\/]/, '').toLowerCase();
  } catch {
    return raw.replace(/^.*[\\/]/, '').toLowerCase();
  }
};

export const normalizeAudioBaseFilename = (filename = '') => normalizeAudioFilename(filename)
  .replace(/_part\d{3}(?=\.mp3$)/i, '')
  .replace(/_full(?=\.mp3$)/i, '');
export const buildAudioApiHref = (filename = '') => {
  const trimmed = String(filename || '').trim();
  if (!trimmed) return '/api/audio';
  const encodedFile = encodeURIComponent(trimmed);
  return `/api/audio/${encodedFile}`;
};
