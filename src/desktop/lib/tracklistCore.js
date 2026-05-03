export const TRACKLIST_SCHEMA = 'airdox.tracklist.v1';

const TRACK_SPLITTERS = [' - ', ' – ', ' — ', ' | '];

export const extractFilename = (input = '') => String(input || '').split(/[\\/]/).pop() || '';

export const stripExtension = (filename = '') => String(filename || '').replace(/\.[^.]+$/, '');

export const parseArtistTitleFromFilename = (filePath = '') => {
  const stem = stripExtension(extractFilename(filePath))
    .replace(/^\d+\.\s*/, '')
    .trim();
  const doubleSpaceMatch = stem.match(/^(?<artist>[^\s]+)\s{2,}(?<title>.+)$/);
  if (doubleSpaceMatch?.groups?.artist && doubleSpaceMatch?.groups?.title) {
    return {
      artist: doubleSpaceMatch.groups.artist.trim(),
      title: doubleSpaceMatch.groups.title.trim(),
    };
  }

  const normalizedStem = stem
    .replace(/_[-–—|]_/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  const looseSplitterMatch = normalizedStem.match(/^(?<artist>.+?)\s*(?:-|–|—|\|)\s*(?<title>.+)$/);
  if (looseSplitterMatch?.groups?.artist && looseSplitterMatch?.groups?.title) {
    return {
      artist: looseSplitterMatch.groups.artist.trim(),
      title: looseSplitterMatch.groups.title.trim(),
    };
  }

  for (const splitter of TRACK_SPLITTERS) {
    if (!normalizedStem.includes(splitter)) continue;
    const parts = normalizedStem.split(splitter);
    return {
      artist: parts.shift()?.trim() || '',
      title: parts.join(splitter).trim() || normalizedStem,
    };
  }

  return { artist: '', title: normalizedStem };
};

const pad2 = (value) => String(value).padStart(2, '0');

export const formatHhMmSs = (seconds = 0) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
};

export const parseTrackTimeToSeconds = (value = '') => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(?<a>\d{1,2}):(?<b>\d{2})(?::(?<c>\d{2}))?$/);
  if (!match?.groups) return null;

  const first = Number.parseInt(match.groups.a, 10);
  const second = Number.parseInt(match.groups.b, 10);
  const third = match.groups.c === undefined ? null : Number.parseInt(match.groups.c, 10);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (second > 59 || (third !== null && third > 59)) return null;

  if (third !== null) return (first * 3600) + (second * 60) + third;
  return (first * 60) + second;
};

export const timestampToSeconds = (value = '') => {
  const parts = String(value)
    .trim()
    .split(':')
    .map((chunk) => Number.parseInt(chunk, 10));
  if (!parts.length || parts.some((part) => Number.isNaN(part))) return null;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (minutes > 59 || seconds > 59) return null;
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds > 59) return null;
    return (minutes * 60) + seconds;
  }
  if (parts.length === 1) return parts[0];
  return null;
};

export const cueIndexToSeconds = (value = '', { rekordbox = false } = {}) => {
  const parts = String(value)
    .trim()
    .split(':')
    .map((chunk) => Number.parseInt(chunk, 10));
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length !== 2 && parts.length !== 3) return null;

  const [first, second, third = 0] = parts;
  if (rekordbox) {
    if (second > 59 || third > 59) return null;
    return (first * 3600) + (second * 60) + third;
  }

  if (second > 59 || third > 74) return null;
  return (first * 60) + second + (third / 75);
};

export const normalizeTrackTime = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const match = raw.match(/^(?<a>\d{1,2}):(?<b>\d{2})(?::(?<c>\d{2}))?$/);
  if (!match?.groups) return '';

  const seconds = parseTrackTimeToSeconds(raw);
  if (seconds === null) return '';

  const partA = match.groups.a.padStart(2, '0');
  const partB = match.groups.b;
  const partC = match.groups.c;
  return partC !== undefined ? `${partA}:${partB}:${partC}` : `${partA}:${partB}`;
};

export const normalizeTimestamp = (value = '', { cue = false, rekordbox = false } = {}) => {
  const seconds = cue ? cueIndexToSeconds(value, { rekordbox }) : timestampToSeconds(value);
  if (seconds === null) return '';
  return formatHhMmSs(seconds);
};

export const normalizeCueIndexTime = (value = '', { rekordbox = false } = {}) =>
  normalizeTimestamp(value, { cue: true, rekordbox });

const pickTrackTime = (track = {}) => {
  const candidate = [track.time, track.timestamp]
    .map((value) => String(value ?? '').trim())
    .find(Boolean) || '';
  return normalizeTrackTime(candidate);
};

const isLikelySetPerformer = (value = '') => {
  const normalized = String(value || '').toLowerCase();
  if (!normalized.includes('airdox')) return false;
  return normalized.includes('unknown album')
    || normalized.startsWith('rec-')
    || /^\d{2,3}\s*-?\s*airdox\b/.test(normalized)
    || /^airdox(?:\b|\s|-|_)/.test(normalized);
};

export const sanitizeTrack = (track = {}) => {
  const artist = String(track.artist || '').trim();
  const title = String(track.title || '').trim();
  const derivedFromSource = parseArtistTitleFromFilename(track.sourceFile || '');
  const derivedFromTitle = parseArtistTitleFromFilename(title);
  const shouldRepairSetPerformer = artist && isLikelySetPerformer(artist);
  const shouldFillMissingArtist = !artist && Boolean(derivedFromTitle.artist || derivedFromSource.artist);

  const cleaned = {
    time: pickTrackTime(track),
    artist: shouldRepairSetPerformer
      ? (derivedFromSource.artist || derivedFromTitle.artist || artist)
      : shouldFillMissingArtist
        ? (derivedFromTitle.artist || derivedFromSource.artist)
        : artist,
    title: shouldRepairSetPerformer
      ? (derivedFromSource.title || derivedFromTitle.title || title)
      : shouldFillMissingArtist
        ? (derivedFromTitle.title || title || derivedFromSource.title)
        : title,
  };

  if (!cleaned.artist && !cleaned.title) return null;
  if (!cleaned.time) return null;
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
    const key = `${track.time}:::${track.artist}:::${track.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toManifestTrack = (track = {}) => ({
  time: String(track.time || '').trim(),
  artist: String(track.artist || '').trim(),
  title: String(track.title || '').trim(),
});

export const toManifestTracks = (tracks = []) => tracks
  .map(sanitizeTrack)
  .filter(Boolean)
  .map(toManifestTrack);

const toCanonicalTrack = (track = {}, fallbackIndex = 0) => {
  const exported = normalizeTrackExport(track);
  const startSeconds = timestampToSeconds(exported.time);
  return {
    index: Number.isFinite(track.index) ? track.index : fallbackIndex + 1,
    startSeconds: startSeconds ?? 0,
    time: exported.time,
    timestamp: exported.time,
    artist: exported.artist,
    title: exported.title,
    sourceFile: String(track.sourceFile || '').trim(),
    confidence: Number.isFinite(track.confidence) ? track.confidence : 1,
    flags: Array.isArray(track.flags) ? track.flags : [],
  };
};

export const normalizeTrackExport = (track = {}) => {
  const cleaned = sanitizeTrack(track);
  if (!cleaned) {
    return {
      ...track,
      artist: String(track.artist || '').trim(),
      title: String(track.title || '').trim(),
      time: '',
      timestamp: '',
    };
  }
  const timestamp = normalizeTimestamp(cleaned.time) || formatHhMmSs(parseTrackTimeToSeconds(cleaned.time) ?? 0);
  return {
    ...track,
    artist: cleaned.artist,
    title: cleaned.title,
    time: timestamp,
    timestamp,
  };
};

export const parseCueDocument = (text = '', { sourceFile = '' } = {}) => {
  const lines = String(text || '').split(/\r?\n/);
  const rawTracks = [];
  const usesRekordboxTime = /\bREM\s+RECORDED_BY\s+"?rekordbox/i.test(String(text || ''));
  let albumPerformer = '';
  let recordingFile = '';
  let current = null;

  const flushCurrent = () => {
    if (!current) return;
    const derived = parseArtistTitleFromFilename(current.sourceFile);
    const titleDerived = parseArtistTitleFromFilename(current.title);
    const hasTrackPerformer = Boolean(current.artist);
    const hasTitleArtist = Boolean(titleDerived.artist);
    const parsed = sanitizeTrack({
      time: current.time,
      artist: current.artist || derived.artist || titleDerived.artist || albumPerformer,
      title: hasTrackPerformer || !hasTitleArtist
        ? (current.title || derived.title || titleDerived.title)
        : (titleDerived.title || derived.title || current.title),
      sourceFile: current.sourceFile,
    });
    if (parsed) {
      rawTracks.push({
        ...current,
        ...parsed,
        timestamp: parsed.time,
      });
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const trackStart = line.match(/^TRACK\s+(\d+)\s+AUDIO$/i);
    if (trackStart) {
      flushCurrent();
      current = {
        index: Number.parseInt(trackStart[1], 10),
        artist: '',
        title: '',
        time: '',
        timestamp: '',
        sourceFile: '',
      };
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
    if (fileMatch) {
      const parsedFile = stripCueQuotes(fileMatch[1]);
      if (current) current.sourceFile = parsedFile;
      else if (!recordingFile) recordingFile = parsedFile;
      continue;
    }

    const indexMatch = line.match(/^INDEX\s+01\s+(.+)$/i);
    if (indexMatch && current) {
      current.time = normalizeCueIndexTime(indexMatch[1], { rekordbox: usesRekordboxTime });
      current.timestamp = current.time;
    }
  }

  flushCurrent();
  const tracks = dedupeTracksByIdentity(rawTracks).map(toCanonicalTrack);

  return buildCanonicalTracklist({
    sourceFile,
    audioFile: recordingFile,
    tracks,
  });
};

const parseDelimitedRow = (line = '', delimiter = ',') => {
  const cells = [];
  let current = '';
  let inQuotes = false;
  const raw = String(line || '');

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const next = raw[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const normalizeHeaderName = (value = '') => String(value || '')
  .replace(/^#\s*/, '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

const detectDelimitedHeader = (lines = []) => {
  const headerLine = lines[0] || '';
  const delimiters = ['\t', '|', ';', ','];
  for (const delimiter of delimiters) {
    if (!headerLine.includes(delimiter)) continue;
    const headers = parseDelimitedRow(headerLine, delimiter).map(normalizeHeaderName);
    const timeIndex = headers.findIndex((header) => ['time', 'starttime', 'timestamp', 'start'].includes(header));
    const artistIndex = headers.findIndex((header) => ['artist', 'artists', 'performer', 'trackartist'].includes(header));
    const titleIndex = headers.findIndex((header) => ['title', 'tracktitle', 'track', 'name'].includes(header));
    if (timeIndex >= 0 && titleIndex >= 0) {
      return {
        delimiter,
        indexes: { timeIndex, artistIndex, titleIndex },
        columnCount: headers.length,
      };
    }
  }
  return null;
};

const parseDelimitedTracklist = (lines = []) => {
  const header = detectDelimitedHeader(lines);
  if (!header) return null;
  const { delimiter, indexes, columnCount } = header;
  const { timeIndex, artistIndex, titleIndex } = indexes;
  return lines.slice(1).map((line) => {
    const cells = parseDelimitedRow(line, delimiter);
    if (cells.length !== columnCount) return null;
    return sanitizeTrack({
      time: cells[timeIndex],
      artist: artistIndex >= 0 ? cells[artistIndex] : '',
      title: cells[titleIndex],
    });
  }).filter(Boolean);
};

export const parseTracklistEntries = (text = '') => {
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
    return parseCueDocument(raw).tracks.map(toManifestTrack);
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const delimitedTracks = parseDelimitedTracklist(lines);
  if (delimitedTracks) return delimitedTracks;

  const hasCsvHeader = /^time\s*,\s*artist\s*,\s*title/i.test(lines[0] || '');
  const hasPipeHeader = /^time\s*\|\s*artist\s*\|\s*title/i.test(lines[0] || '');
  const linesToParse = hasCsvHeader || hasPipeHeader ? lines.slice(1) : lines;

  return linesToParse.map((line) => {
    const pipeMatch = line.match(/^(?<time>\d{1,2}:\d{2}(?::\d{2})?)\s*\|\s*(?<artist>.*?)\s*\|\s*(?<title>.+)$/);
    if (pipeMatch?.groups) {
      return sanitizeTrack(pipeMatch.groups);
    }

    if (hasCsvHeader) {
      const columns = line.split(',');
      if (columns.length >= 3) {
        if (columns.length > 3) return null;
        return sanitizeTrack({
          time: columns[0],
          artist: columns[1],
          title: columns.slice(2).join(','),
        });
      }
    }

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
  }).filter(Boolean);
};

export const parseTracklistText = (text = '') => toManifestTracks(parseTracklistEntries(text));

const isPlaceholderValue = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  return normalized === 'unknown artist'
    || normalized === 'unknown title'
    || normalized === 'track ?'
    || normalized === 'untitled';
};

export const validateTracks = (tracks = [], { audioDurationSeconds = null } = {}) => {
  const errors = [];
  const warnings = [];
  let previousSeconds = -1;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    errors.push('Tracklist has no valid seekable tracks.');
  }

  tracks.forEach((track, index) => {
    const label = `Track ${index + 1}`;
    const seconds = timestampToSeconds(track?.time || track?.timestamp);
    const artist = String(track?.artist || '').trim();
    const title = String(track?.title || '').trim();

    if (seconds === null) {
      errors.push(`${label} has no valid timestamp.`);
    } else {
      if (seconds < previousSeconds) {
        warnings.push(`${label} starts before the previous track.`);
      }
      if (Number.isFinite(audioDurationSeconds) && seconds > audioDurationSeconds) {
        errors.push(`${label} starts after the audio duration.`);
      }
      previousSeconds = Math.max(previousSeconds, seconds);
    }

    if (!artist && !title) {
      errors.push(`${label} has no artist or title.`);
    } else if (isPlaceholderValue(artist) || isPlaceholderValue(title)) {
      warnings.push(`${label} contains placeholder metadata.`);
    }

    if (artist.length > 180 || title.length > 220) {
      warnings.push(`${label} contains unusually long metadata.`);
    }
  });

  return {
    status: errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warning' : 'pass',
    errors,
    warnings,
  };
};

export const buildCanonicalTracklist = ({
  sourceFile = '',
  audioFile = '',
  tracks = [],
  createdAt = new Date().toISOString(),
  audioDurationSeconds = null,
} = {}) => {
  const canonicalTracks = tracks
    .map(toCanonicalTrack)
    .filter((track) => track.time && (track.artist || track.title));
  const validation = validateTracks(canonicalTracks, { audioDurationSeconds });

  return {
    schema: TRACKLIST_SCHEMA,
    sourceFile: String(sourceFile || '').trim(),
    audioFile: String(audioFile || '').trim(),
    createdAt,
    tracks: canonicalTracks,
    validation,
  };
};

export const parseTracklistToCanonical = (text = '', options = {}) => buildCanonicalTracklist({
  ...options,
  tracks: parseTracklistEntries(text),
});

export const dedupeTracks = (tracks = [], dedupeWindowSeconds = 45) => {
  const deduped = [];
  const lastSeen = new Map();

  for (const track of tracks) {
    const normalized = normalizeTrackExport(track);
    if (!normalized.time) continue;
    const key = `${normalized.artist}:::${normalized.title}`.toLowerCase();
    const atSeconds = timestampToSeconds(normalized.time) ?? 0;
    const previous = lastSeen.get(key);
    const sourceFile = String(track.sourceFile || '').toLowerCase();

    if (
      previous
      && (
        atSeconds - previous.atSeconds <= dedupeWindowSeconds
        || (sourceFile && sourceFile === previous.sourceFile)
      )
    ) {
      continue;
    }

    lastSeen.set(key, { atSeconds, sourceFile });
    deduped.push({
      ...track,
      ...normalized,
      timestamp: normalized.time,
    });
  }

  return deduped;
};

export const toMixcloudLines = (tracks = []) => tracks
  .map(normalizeTrackExport)
  .filter((track) => track.time && (track.artist || track.title))
  .map((track) => `${track.artist} - ${track.title} - ${track.time}`);

const cleanPipeField = (value = '') => String(value || '')
  .replace(/\r?\n/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\|/g, '/')
  .trim();

export const toPipeTracklistText = (tracks = []) => {
  const rows = [
    'time | artist | title',
    ...tracks.map(normalizeTrackExport)
      .filter((track) => track.time && (track.artist || track.title))
      .map((track) => [
        cleanPipeField(track.time),
        cleanPipeField(track.artist),
        cleanPipeField(track.title),
      ].join(' | ')),
  ];
  return `${rows.join('\n')}\n`;
};
