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
  extractEmbeddedCover: false,
  defaultVinylColor: '#9adf6b',
  defaultCoverPath: '/assets/airdox-vinyl.jpg',
  r2ObjectPrefix: 'public',
  coverOutputDir: 'public/assets',
  buildCommand: 'npm run build',
  deployCommand: 'npm run deploy',
  gitCommitTemplate: 'feat(flightdeck): publish {{id}}',
};

const TRACK_SPLITTERS = [' - ', ' – ', ' — ', ' | '];

export const extractFilename = (input = '') => input.split(/[\\/]/).pop() || input;

export const stripExtension = (filename = '') => filename.replace(/\.[^.]+$/, '');

const parseArtistTitleFromFilename = (filePath = '') => {
  const stem = stripExtension(extractFilename(filePath))
    .replace(/^\d+\.\s*/, '')
    .trim();
  for (const splitter of TRACK_SPLITTERS) {
    if (!stem.includes(splitter)) continue;
    const parts = stem.split(splitter);
    return {
      artist: parts.shift()?.trim() || '',
      title: parts.join(splitter).trim() || stem,
    };
  }
  return { artist: '', title: stem };
};

export const slugifyValue = (value = '') => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .replace(/_{2,}/g, '_');

export const humanizeStem = (stem = '') => stripExtension(extractFilename(stem))
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

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

export const parseDateHint = (input = '') => {
  if (!input) return null;
  const candidates = [
    /(?<year>20\d{2})[._-](?<month>\d{2})[._-](?<day>\d{2})/,
    /(?<day>\d{2})[._-](?<month>\d{2})[._-](?<year>20\d{2})/,
  ];

  for (const pattern of candidates) {
    const match = input.match(pattern);
    if (!match?.groups) continue;
    const { year, month, day } = match.groups;
    const isoDate = `${year}-${month}-${day}`;
    const parsed = new Date(`${isoDate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        isoDate,
        titleDate: `${day}.${month}.${year}`,
        label: `${MONTH_LABELS[Number(month) - 1]} ${year}`,
      };
    }
  }

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
  return normalized || `set_${Date.now()}`;
};

export const deriveSetTitle = ({ stem, metadataTitle, parsedDate }) => {
  if (metadataTitle?.trim()) return metadataTitle.trim();
  const normalized = slugifyValue(stem);
  if (parsedDate?.titleDate && /rec|recording/.test(normalized)) {
    return `REC ${parsedDate.titleDate}`;
  }
  return humanizeStem(stem).toUpperCase();
};

const normalizeTrackTime = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const match = raw.match(/^(?<a>\d{1,2}):(?<b>\d{2})(?::(?<c>\d{2}))?$/);
  if (!match?.groups) return raw;

  const partA = match.groups.a.padStart(2, '0');
  const partB = match.groups.b;
  const partC = match.groups.c;
  return partC !== undefined ? `${partA}:${partB}:${partC}` : `${partA}:${partB}`;
};

const pickTrackTime = (track = {}) => {
  const candidates = [track.time, track.timestamp];
  const value = candidates
    .map((candidate) => String(candidate ?? '').trim())
    .find(Boolean) || '';
  return normalizeTrackTime(value);
};

export const sanitizeTrack = (track = {}) => {
  const cleaned = {
    time: pickTrackTime(track),
    artist: String(track.artist || '').trim(),
    title: String(track.title || '').trim(),
  };
  if (!cleaned.artist && !cleaned.title) return null;
  return cleaned;
};

const stripCueQuotes = (value = '') => {
  const trimmed = String(value || '').trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const dedupeTracksByIdentity = (tracks = []) => {
  const seen = new Set();
  return tracks.filter((track) => {
    const key = `${track.artist}:::${track.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseCueTracklistText = (text = '') => {
  const lines = String(text || '').split(/\r?\n/);
  const tracks = [];
  let albumPerformer = '';
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    const derived = parseArtistTitleFromFilename(current.sourceFile);
    const parsed = sanitizeTrack({
      time: current.time,
      artist: current.artist || albumPerformer || derived.artist,
      title: current.title || derived.title,
    });
    if (parsed) tracks.push(parsed);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const trackStart = line.match(/^TRACK\s+\d+\s+AUDIO$/i);
    if (trackStart) {
      flushCurrent();
      current = { time: '', artist: '', title: '', sourceFile: '' };
      continue;
    }

    const performerMatch = line.match(/^PERFORMER\s+(.+)$/i);
    if (performerMatch) {
      const performer = stripCueQuotes(performerMatch[1]);
      if (current) current.artist = performer;
      else albumPerformer = performer;
      continue;
    }

    const titleMatch = line.match(/^TITLE\s+(.+)$/i);
    if (titleMatch && current) {
      current.title = stripCueQuotes(titleMatch[1]);
      continue;
    }

    const fileMatch = line.match(/^FILE\s+(.+?)\s+\w+$/i);
    if (fileMatch && current) {
      current.sourceFile = stripCueQuotes(fileMatch[1]);
      continue;
    }

    const indexMatch = line.match(/^INDEX\s+01\s+(.+)$/i);
    if (indexMatch && current) {
      current.time = normalizeTrackTime(indexMatch[1]);
    }
  }

  flushCurrent();
  return dedupeTracksByIdentity(tracks);
};

export const parseTracklistText = (text = '') => {
  const raw = String(text || '').trim();
  if (!raw) return [];

  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const tracks = Array.isArray(parsed) ? parsed : parsed.tracks;
      if (Array.isArray(tracks)) {
        return tracks.map(sanitizeTrack).filter(Boolean);
      }
    } catch {
      // fall through
    }
  }

  if (/\bTRACK\s+\d+\s+AUDIO\b/i.test(raw) && /\bINDEX\s+01\b/i.test(raw)) {
    return parseCueTracklistText(raw);
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasCsvHeader = /^time\s*,\s*artist\s*,\s*title/i.test(lines[0] || '');
  const linesToParse = hasCsvHeader ? lines.slice(1) : lines;

  const parsedLines = linesToParse.map((line) => {
    if (hasCsvHeader) {
      const columns = line.split(',');
      if (columns.length >= 3) {
        return sanitizeTrack({
          time: columns[0],
          artist: columns[1],
          title: columns.slice(2).join(','),
        });
      }
    }

    // Support watcher format: "Artist - Title - HH:MM:SS"
    const trailingTimeMatch = line.match(
      /^(?<artist>.+?)\s+(?:-|–|—|\|)\s+(?<title>.+?)\s+(?:-|–|—|\|)\s+(?<time>\d{1,2}:\d{2}(?::\d{2})?)$/i,
    );
    if (trailingTimeMatch?.groups) {
      return sanitizeTrack({
        time: trailingTimeMatch.groups.time,
        artist: trailingTimeMatch.groups.artist,
        title: trailingTimeMatch.groups.title,
      });
    }

    const timeMatch = line.match(/^(?<time>\d{1,2}:\d{2}(?::\d{2})?)\s*(?:[-|–—]\s*)?(?<rest>.+)$/);
    const rest = timeMatch?.groups?.rest || line.replace(/^\d+\.\s*/, '');
    const time = timeMatch?.groups?.time || '';

    for (const splitter of TRACK_SPLITTERS) {
      if (rest.includes(splitter)) {
        const parts = rest.split(splitter);
        const artist = parts.shift();
        const title = parts.join(splitter);
        return sanitizeTrack({ time, artist, title });
      }
    }

    return sanitizeTrack({ time, artist: '', title: rest });
  });

  return parsedLines.filter(Boolean);
};

export const toManifestSet = (draft = {}) => {
  const manifestSet = {
    id: String(draft.id || '').trim(),
    title: String(draft.title || '').trim(),
    date: String(draft.date || '').trim(),
    file: String(draft.file || '').trim(),
    cover: draft.cover ? String(draft.cover).trim() : undefined,
    duration: draft.duration ? String(draft.duration).trim() : undefined,
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
  defaultVinylColor = DEFAULT_FLIGHT_DECK_SETTINGS.defaultVinylColor,
  defaultCoverPath = DEFAULT_FLIGHT_DECK_SETTINGS.defaultCoverPath,
}) => {
  const filename = extractFilename(audioPath || '');
  const stem = stripExtension(filename);
  const tracks = parseTracklistText(tracklistText);
  const title = deriveSetTitle({ stem, metadataTitle, parsedDate });
  const cover = imagePath
    ? `/assets/${extractFilename(imagePath)}`
    : String(defaultCoverPath || DEFAULT_FLIGHT_DECK_SETTINGS.defaultCoverPath);
  return {
    id: deriveSetId(stem, parsedDate),
    title,
    date: parsedDate?.label || '',
    file: filename,
    cover,
    duration: formatDuration(durationSeconds),
    isNew: true,
    vinylColor: defaultVinylColor,
    tracks,
    sourceAudioPath: audioPath || '',
    sourceImagePath: imagePath || '',
    coverPreviewUrl: imagePath ? '' : embeddedCoverDataUrl || '',
    embeddedCoverDataUrl: embeddedCoverDataUrl || '',
    publishedAt: parsedDate?.isoDate || new Date().toISOString().slice(0, 10),
  };
};
