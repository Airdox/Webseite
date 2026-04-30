const MONTHS = {
<<<<<<< HEAD
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

export const PUBLIC_SET_COUNT = 2;

=======
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

>>>>>>> website
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

<<<<<<< HEAD
  // Fallback: preserve source order (top entries are considered newer)
  return Number.MAX_SAFE_INTEGER - index;
};

export const partitionSetsByAccess = (allSets = [], publicCount = PUBLIC_SET_COUNT) => {
=======
  return Number.MAX_SAFE_INTEGER - index;
};

/**
 * Logik-Automatisierung für Set-Zugriff:
 * - Top 2 (neueste): Public
 * - Plätze 3 und 4: VIP
 * - Alles ab Platz 5: Public
 */
export const partitionSetsByAccess = (allSets = []) => {
>>>>>>> website
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

<<<<<<< HEAD
  const publicIdSet = new Set(
    ranked
      .slice(0, Math.max(0, Number(publicCount) || 0))
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

  return { publicSets, vipSets, publicIdSet };
=======
  const publicIdSet = new Set();
  const vipIdSet = new Set();

  ranked.forEach((entry, i) => {
    if (!entry.set?.id) return;
    // Index 0 & 1 -> Public (Plätze 1 & 2)
    // Index 2 & 3 -> VIP (Plätze 3 & 4)
    // Index 4+ -> Public (Plätze 5+)
    if (i === 2 || i === 3) {
      vipIdSet.add(entry.set.id);
    } else {
      publicIdSet.add(entry.set.id);
    }
  });

  const publicSets = allSets.filter(s => publicIdSet.has(s.id));
  const vipSets = allSets.filter(s => vipIdSet.has(s.id));

  return { publicSets, vipSets, publicIdSet, vipIdSet };
>>>>>>> website
};

export const isPublicSet = (set, publicIdSet) => Boolean(set?.id && publicIdSet?.has(set.id));

<<<<<<< HEAD
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

=======
>>>>>>> website
export const buildAudioApiHref = (filename = '', token = '') => {
  const trimmed = String(filename || '').trim();
  if (!trimmed) return '/api/audio';
  const encodedFile = encodeURIComponent(trimmed);
  if (!token) return `/api/audio/${encodedFile}`;
  const params = new URLSearchParams({ token });
  return `/api/audio/${encodedFile}?${params.toString()}`;
};
