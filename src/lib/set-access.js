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

export const PUBLIC_SET_COUNT = 4;
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

const deriveSetTimestamp = (set = {}, index = 0) => {
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

  return Number.MAX_SAFE_INTEGER - index;
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

  const publicIdSet = new Set(
    ranked
      .slice(0, Math.max(0, Number(publicCount) || 0))
      .map((entry) => entry.set?.id)
      .filter(Boolean),
  );
  const vipIdSet = new Set(
    ranked
      .slice(Math.max(0, Number(publicCount) || 0))
      .map((entry) => entry.set?.id)
      .filter(Boolean),
  );

  const publicSets = [];
  const vipSets = [];

  for (const set of allSets) {
    if (publicIdSet.has(set?.id)) {
      publicSets.push(set);
    } else {
      vipSets.push(set);
    }
  }

  return { publicSets, vipSets, publicIdSet, vipIdSet };
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
export const buildAudioApiHref = (filename = '', token = '') => {
  const trimmed = String(filename || '').trim();
  if (!trimmed) return '/api/audio';
  const encodedFile = encodeURIComponent(trimmed);
  if (!token) return `/api/audio/${encodedFile}`;
  const params = new URLSearchParams({ token });
  return `/api/audio/${encodedFile}?${params.toString()}`;
};
