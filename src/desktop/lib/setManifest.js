import {
  parseTracklistToCanonical,
  sanitizeTrack,
  toManifestTracks,
} from './tracklistCore.js';

export {
  parseTracklistText,
  parseTracklistToCanonical,
  sanitizeTrack,
  validateTracks,
} from './tracklistCore.js';

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.wave', '.m4a', '.aac', '.flac'];
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
export const TRACKLIST_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.cue'];

export const DEFAULT_FLIGHT_DECK_SETTINGS = {
  workspaceRoot: '',
  safeMode: true,
  publishPosition: 'top',
  uploadAudioToR2: true,
  autoSeedStats: true,
  autoBuild: true,
  autoDeploy: false,
  autoCommit: false,
  autoPush: false,
  requireTracklistForLive: true,
  verifyLiveAfterDeploy: true,
  liveSiteUrl: 'https://airdox.info',
  extractEmbeddedCover: false,
  defaultVinylColor: '#9adf6b',
  defaultCoverPath: '/assets/airdox-vinyl.jpg',
  r2ObjectPrefix: 'public',
  coverOutputDir: 'public/assets',
  buildCommand: 'npm run build',
  deployCommand: 'npm run deploy',
  gitCommitTemplate: 'feat(flightdeck): publish {{id}}',
  photoshopPath: 'C:\\Users\\p_kro\\OneDrive\\Desktop\\ps',
  defaultDesignStyle: 'flicker',
};

export const extractFilename = (input = '') => input.split(/[\\/]/).pop() || input;

export const stripExtension = (filename = '') => filename.replace(/\.[^.]+$/, '');

export const slugifyValue = (value = '') => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .replace(/_{2,}/g, '_');

export const normalizeSetId = (value = '') => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, '_')
  .replace(/_{2,}/g, '_')
  .replace(/-{2,}/g, '-')
  .replace(/^[-_]+|[-_]+$/g, '');

const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSetIdValue = (entry) => {
  if (typeof entry === 'string') return normalizeSetId(entry);
  return normalizeSetId(entry?.id || '');
};

const getSetTitleValue = (entry) => {
  if (typeof entry === 'string') return String(entry || '').trim();
  return String(entry?.title || '').trim();
};

const getSetFileValue = (entry) => {
  if (typeof entry === 'string') return '';
  return extractFilename(entry?.file || '').trim();
};

const getReservedValues = (existingSets = [], extraValues = [], picker = (entry) => String(entry || '')) => new Set([
  ...existingSets.map(picker),
  ...extraValues.map((entry) => (typeof entry === 'string' ? entry : picker(entry))),
].map((value) => String(value || '').trim()).filter(Boolean));

const isIdInFamily = (setId = '', baseId = '') => {
  if (!setId || !baseId) return false;
  return new RegExp(`^${escapeRegExp(baseId)}(?:-\\d+)?$`).test(setId);
};

const getUniqueIdFromFamily = (baseId = '', reservedIds = new Set()) => {
  const normalizedBaseId = normalizeSetId(baseId) || `set_${Date.now()}`;
  const familyPattern = new RegExp(`^${escapeRegExp(normalizedBaseId)}(?:-(\\d+))?$`);
  let highestFamilyNumber = 0;

  for (const reservedId of reservedIds) {
    const match = String(reservedId || '').match(familyPattern);
    if (!match) continue;
    const number = match[1] ? Number.parseInt(match[1], 10) : 1;
    if (Number.isFinite(number)) {
      highestFamilyNumber = Math.max(highestFamilyNumber, number);
    }
  }

  if (highestFamilyNumber === 0 && !reservedIds.has(normalizedBaseId)) {
    return normalizedBaseId;
  }

  let nextNumber = Math.max(highestFamilyNumber + 1, 2);
  let candidate = `${normalizedBaseId}-${nextNumber}`;
  while (reservedIds.has(candidate)) {
    nextNumber += 1;
    candidate = `${normalizedBaseId}-${nextNumber}`;
  }
  return candidate;
};

export const buildUniqueSetId = (baseId = '', {
  existingSets = [],
  reservedSetIds = [],
} = {}) => {
  const reservedIds = getReservedValues(existingSets, reservedSetIds, getSetIdValue);
  return getUniqueIdFromFamily(baseId, reservedIds);
};

const getIdFamilySuffixNumber = (setId = '', baseId = '') => {
  const match = String(setId || '').match(new RegExp(`^${escapeRegExp(baseId)}-(\\d+)$`));
  if (!match?.[1]) return null;
  const number = Number.parseInt(match[1], 10);
  return Number.isFinite(number) ? number : null;
};

const buildNumberedTitle = (title = '', number = null) => {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle || !number) return cleanTitle;
  return `${cleanTitle} #${number}`;
};

export const buildUniqueSetTitle = (baseTitle = '', {
  setId = '',
  baseId = '',
  existingSets = [],
  reservedSetTitles = [],
} = {}) => {
  const cleanTitle = String(baseTitle || '').trim();
  if (!cleanTitle) return cleanTitle;

  const reservedTitles = getReservedValues(existingSets, reservedSetTitles, getSetTitleValue);
  const suffixNumber = getIdFamilySuffixNumber(setId, baseId);
  let candidate = buildNumberedTitle(cleanTitle, suffixNumber);
  if (!reservedTitles.has(candidate)) return candidate;

  let nextNumber = suffixNumber || 2;
  do {
    candidate = buildNumberedTitle(cleanTitle, nextNumber);
    nextNumber += 1;
  } while (reservedTitles.has(candidate));

  return candidate;
};

export const buildUniqueSetFile = (filename = '', {
  setId = '',
  existingSets = [],
  reservedSetFiles = [],
} = {}) => {
  const cleanFilename = extractFilename(filename || '').trim();
  if (!cleanFilename) return cleanFilename;

  const reservedFiles = getReservedValues(existingSets, reservedSetFiles, getSetFileValue);
  const lowerReservedFiles = new Set([...reservedFiles].map((value) => value.toLowerCase()));
  if (!lowerReservedFiles.has(cleanFilename.toLowerCase())) return cleanFilename;

  const ext = cleanFilename.match(/\.[^.]+$/)?.[0] || '.mp3';
  const safeBase = normalizeSetId(setId) || slugifyValue(stripExtension(cleanFilename)) || `set_${Date.now()}`;
  let candidate = `${safeBase}${ext}`;
  let index = 2;
  while (lowerReservedFiles.has(candidate.toLowerCase())) {
    candidate = `${safeBase}-${index}${ext}`;
    index += 1;
  }
  return candidate;
};

const stripNumberedTitleSuffix = (value = '') => String(value || '').trim().replace(/\s+#\d+$/, '');

export const resolveUniqueSetDraftIdentity = (draft = {}, {
  existingSets = [],
  reservedSetIds = [],
  reservedSetTitles = [],
  reservedSetFiles = [],
} = {}) => {
  const normalizedDraftId = normalizeSetId(draft.id || '');
  const generatedBaseId = normalizeSetId(draft.generatedBaseId || '');
  const baseId = generatedBaseId && isIdInFamily(normalizedDraftId, generatedBaseId)
    ? generatedBaseId
    : normalizedDraftId;
  const id = buildUniqueSetId(baseId, { existingSets, reservedSetIds });
  const draftTitle = String(draft.title || '').trim();
  const generatedBaseTitle = String(draft.generatedBaseTitle || '').trim();
  const titleWasEdited = generatedBaseTitle
    && stripNumberedTitleSuffix(draftTitle) !== stripNumberedTitleSuffix(generatedBaseTitle);
  const baseTitle = String(
    (titleWasEdited ? draftTitle : generatedBaseTitle)
      || (generatedBaseId && isIdInFamily(id, generatedBaseId)
        ? stripNumberedTitleSuffix(draftTitle)
        : draftTitle)
      || '',
  ).trim();
  const title = buildUniqueSetTitle(baseTitle, {
    setId: id,
    baseId,
    existingSets,
    reservedSetTitles,
  });
  const file = buildUniqueSetFile(draft.file || '', {
    setId: id,
    existingSets,
    reservedSetFiles,
  });

  return {
    ...draft,
    id,
    generatedBaseId: generatedBaseId || baseId,
    generatedBaseTitle: baseTitle,
    title,
    file,
  };
};

export const humanizeStem = (stem = '') => stripExtension(extractFilename(stem))
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const GENERIC_SET_TITLE = 'AIRDOX SET';

const splitPathSegments = (filePath = '') => String(filePath || '')
  .split(/[\\/]+/)
  .map((segment) => segment.trim())
  .filter(Boolean);

const stripDateFragments = (value = '') => String(value || '')
  .replace(/\b20\d{2}[._\-\s]?\d{2}[._\-\s]?\d{2}\b/g, ' ')
  .replace(/\b\d{2}[._\-\s]?\d{2}[._\-\s]?20\d{2}\b/g, ' ');

const cleanSetTitleCandidate = (value = '') => stripDateFragments(humanizeStem(value))
  .replace(/^\d+\.\s*/, ' ')
  .replace(/\b\d{2,3}\b/g, ' ')
  .replace(/\bairdox\b/gi, ' ')
  .replace(/\b(rec|recording|recordings|aufnahme|aufnahmen|set|sets|mix|full|master|export|exports|wav|mp3|ost|unknown|album|untitled|liveset|livesets|live)\b/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const isUsefulTitleCandidate = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.length < 3) return false;
  if (/^(music|musik|downloads?|desktop|neuer ordner|new folder|tracklists?)\b/.test(normalized)) return false;
  if (/^(rec|recording|set|mix|ost|export|full|unknown|album|untitled|livesets?)$/i.test(normalized)) return false;
  return /[a-zA-Z]/.test(normalized);
};

const formatSetTitle = (value = '') => String(value || '').trim().toUpperCase();

const deriveTitleFromPath = (sourcePath = '') => {
  const segments = splitPathSegments(sourcePath);
  const folderSegments = segments.slice(0, -1).reverse();
  for (const segment of folderSegments) {
    const candidate = cleanSetTitleCandidate(segment);
    if (isUsefulTitleCandidate(candidate)) return formatSetTitle(candidate);
  }
  return '';
};

export const formatDuration = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const parseStrictDateParts = (year, month, day) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const parsed = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));

  if (
    parsed.getUTCFullYear() !== numericYear
    || parsed.getUTCMonth() !== numericMonth - 1
    || parsed.getUTCDate() !== numericDay
  ) {
    return null;
  }

  return parsed;
};

export const parseDateHint = (input = '') => {
  if (!input) return null;
  const candidates = [
    /(?<year>20\d{2})[._-](?<month>\d{2})[._-](?<day>\d{2})/,
    /(?<day>\d{2})[._-](?<month>\d{2})[._-](?<year>20\d{2})/,
  ];
  let matchedStructuredDate = false;

  for (const pattern of candidates) {
    const match = input.match(pattern);
    if (!match?.groups) continue;
    matchedStructuredDate = true;
    const { year, month, day } = match.groups;
    const isoDate = `${year}-${month}-${day}`;
    const parsed = parseStrictDateParts(year, month, day);
    if (parsed) {
      return {
        isoDate,
        titleDate: `${day}.${month}.${year}`,
        label: `${MONTH_LABELS[parsed.getUTCMonth()]} ${year}`,
      };
    }
  }

  if (matchedStructuredDate) return null;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return {
    isoDate: `${year}-${month}-${day}`,
    titleDate: `${day}.${month}.${year}`,
    label: `${MONTH_LABELS[parsed.getUTCMonth()]} ${year}`,
  };
};

export const deriveSetId = (stem, parsedDate) => {
  const normalized = slugifyValue(stem);
  if (parsedDate?.isoDate && /rec|recording|set|mix/.test(normalized)) {
    return `recording_${parsedDate.isoDate.replace(/-/g, '_')}`;
  }
  return normalizeSetId(normalized) || `set_${Date.now()}`;
};

export const deriveSetTitle = ({ stem, metadataTitle, sourcePath }) => {
  const metadataCandidate = cleanSetTitleCandidate(metadataTitle || '');
  if (isUsefulTitleCandidate(metadataCandidate)) return formatSetTitle(metadataCandidate);

  const stemCandidate = cleanSetTitleCandidate(stem || '');
  if (isUsefulTitleCandidate(stemCandidate)) return formatSetTitle(stemCandidate);

  const pathCandidate = deriveTitleFromPath(sourcePath || '');
  if (pathCandidate) return pathCandidate;

  return GENERIC_SET_TITLE;
};

export const toManifestSet = (draft = {}) => {
  const manifestSet = {
    id: normalizeSetId(draft.id || ''),
    title: String(draft.title || '').trim(),
    date: String(draft.date || '').trim(),
    file: String(draft.file || '').trim(),
    cover: draft.cover ? String(draft.cover).trim() : undefined,
    duration: draft.duration ? String(draft.duration).trim() : undefined,
    bpm: draft.bpm ? Number(draft.bpm) : undefined,
    isNew: Boolean(draft.isNew),
    vinylColor: draft.vinylColor ? String(draft.vinylColor).trim() : undefined,
    tracks: Array.isArray(draft.tracks) ? draft.tracks.map(sanitizeTrack).filter(Boolean) : undefined,
    publishedAt: draft.publishedAt ? String(draft.publishedAt).trim() : undefined,
    notes: draft.notes ? String(draft.notes).trim() : undefined,
  };

  return Object.fromEntries(
    Object.entries(manifestSet).filter(([, value]) => {
      if (value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );
};

export const insertOrReplaceSet = (sets = [], nextDraft, settings = DEFAULT_FLIGHT_DECK_SETTINGS) => {
  const nextEntry = toManifestSet(nextDraft);
  const filtered = sets.filter((entry) => entry.id !== nextEntry.id);
  if (settings.publishPosition === 'bottom') {
    return [...filtered, nextEntry];
  }
  return [nextEntry, ...filtered];
};

const escapeString = (value) => value
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/\r/g, '\\r')
  .replace(/\n/g, '\\n');

const isIdentifier = (value) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);

const serializeValue = (value, depth = 0) => {
  const indent = '  '.repeat(depth);
  const nextIndent = '  '.repeat(depth + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const rows = value.map((entry) => `${nextIndent}${serializeValue(entry, depth + 1)}`);
    return `[\n${rows.join(',\n')}\n${indent}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const rows = entries.map(([key, entryValue]) => {
      const property = isIdentifier(key) ? key : `'${escapeString(key)}'`;
      return `${nextIndent}${property}: ${serializeValue(entryValue, depth + 1)}`;
    });
    return `{\n${rows.join(',\n')}\n${indent}}`;
  }

  if (typeof value === 'string') {
    return `'${escapeString(value)}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return 'null';
};

export const serializeSetsModule = (sets = []) => `export const sets = ${serializeValue(sets, 0)};\n`;

export const diffSetEntries = (previousEntry = {}, nextEntry = {}) => {
  const keys = new Set([...Object.keys(previousEntry || {}), ...Object.keys(nextEntry || {})]);
  return [...keys]
    .filter((key) => JSON.stringify(previousEntry?.[key]) !== JSON.stringify(nextEntry?.[key]))
    .map((key) => ({
      field: key,
      before: previousEntry?.[key] ?? null,
      after: nextEntry?.[key] ?? null,
    }));
};

export const buildDraftFromImportedFiles = ({
  audioPath,
  metadataTitle,
  durationSeconds,
  parsedDate,
  tracklistText,
  imagePath,
  embeddedCoverDataUrl,
  existingSets = [],
  reservedSetIds = [],
  reservedSetTitles = [],
  reservedSetFiles = [],
  defaultVinylColor = DEFAULT_FLIGHT_DECK_SETTINGS.defaultVinylColor,
  defaultCoverPath = DEFAULT_FLIGHT_DECK_SETTINGS.defaultCoverPath,
}) => {
  const filename = extractFilename(audioPath || '');
  const stem = stripExtension(filename);
  const parsedTracklist = parseTracklistToCanonical(tracklistText, {
    sourceFile: audioPath || '',
    audioFile: audioPath || '',
    audioDurationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
  });
  const tracks = toManifestTracks(parsedTracklist.tracks);
  const generatedBaseId = deriveSetId(stem, parsedDate);
  const id = buildUniqueSetId(generatedBaseId, { existingSets, reservedSetIds });
  const baseTitle = deriveSetTitle({ stem, metadataTitle, sourcePath: audioPath });
  const title = buildUniqueSetTitle(baseTitle, {
    setId: id,
    baseId: generatedBaseId,
    existingSets,
    reservedSetTitles,
  });
  const file = buildUniqueSetFile(filename, {
    setId: id,
    existingSets,
    reservedSetFiles,
  });
  const cover = imagePath
    ? `/assets/${extractFilename(imagePath)}`
    : String(defaultCoverPath || DEFAULT_FLIGHT_DECK_SETTINGS.defaultCoverPath);
  return {
    id,
    generatedBaseId,
    generatedBaseTitle: baseTitle,
    titleNeedsReview: baseTitle === GENERIC_SET_TITLE,
    title,
    date: parsedDate?.label || '',
    file,
    cover,
    duration: formatDuration(durationSeconds),
    isNew: true,
    vinylColor: defaultVinylColor,
    tracks,
    tracklistSchema: parsedTracklist.schema,
    tracklistValidation: parsedTracklist.validation,
    sourceAudioPath: audioPath || '',
    sourceImagePath: imagePath || '',
    coverPreviewUrl: imagePath ? '' : embeddedCoverDataUrl || '',
    embeddedCoverDataUrl: embeddedCoverDataUrl || '',
    publishedAt: parsedDate?.isoDate || new Date().toISOString().slice(0, 10),
  };
};
