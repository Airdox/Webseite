import { DEFAULT_FLIGHT_DECK_SETTINGS, insertOrReplaceSet } from './lib/setManifest.js';

const SETTINGS_KEY = 'flightdeck_mock_settings';
const TABLES_KEY = 'flightdeck_mock_tables';
const SETS_KEY = 'flightdeck_mock_sets';

const defaultSettings = {
  ...DEFAULT_FLIGHT_DECK_SETTINGS,
  workspaceRoot: 'D:\\Airdox\\Webseite',
};

const defaultSets = [
  {
    id: 'recording_2026_04_12',
    title: 'REC 12.04.2026',
    date: 'APR 2026',
    file: 'Airdox_REC_2026_04_12.mp3',
    cover: '/assets/je_prohibition_sign.png',
    duration: '2:30:15',
    isNew: true,
    vinylColor: '#ccff00',
    tracks: [
      { time: '00:00', artist: 'Nico Moreno', title: 'Purple Widow' },
      { time: '05:42', artist: 'Klangkuenstler', title: 'Weltschmerz' },
    ],
  },
  {
    id: 'secret_set_2025_12_22',
    title: 'SECRET SET (PIRATE STUDIO)',
    date: '22.12.2025',
    file: 'Airdox_Secret_Set_Pirate_Studio_22_12_2025_full.mp3',
    duration: '2:46:56',
    isNew: false,
    vinylColor: '#ff00ff',
  },
];

const defaultTables = {
  track_stats: [
    { id: 'secret_set_2025_12_22', plays: 71, likes: 1, dislikes: 0, last_played_at: null },
    { id: 'recording_2026_04_12', plays: 62, likes: 1, dislikes: 0, last_played_at: '2026-04-25T03:16:57.139Z' },
  ],
  analytics_logs: [
    { id: 2, event_type: 'play', item_id: 'recording_2026_04_12', session_id: 'demo_session', country: 'DE', city: 'Berlin', region: 'Berlin', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', referrer: 'direct', created_at: '2026-04-25T03:16:57.139Z' },
    { id: 1, event_type: 'play', item_id: 'secret_set_2025_12_22', session_id: 'demo_session', country: 'DE', city: 'Berlin', region: 'Berlin', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', referrer: 'direct', created_at: '2026-04-24T23:12:12.500Z' },
  ],
  bookings: [],
  subscribers: [
    { id: 1, email: 'vip@airdox.de', status: 'active', created_at: '2026-04-20T18:00:00.000Z' },
  ],
  users: [
    { id: 1, username: 'airdox-admin', email: 'admin@airdox.de', created_at: '2026-04-18T10:00:00.000Z' },
    { id: 2, username: 'vip-user', email: 'vip@airdox.de', created_at: '2026-04-19T10:00:00.000Z' },
  ],
  sessions: [
    { id: 'session_demo', user_id: 2, username: 'vip-user', email: 'vip@airdox.de', created_at: '2026-04-24T10:00:00.000Z', expires_at: '2026-05-01T10:00:00.000Z' },
  ],
};

const loadJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

const loadSettings = () => loadJson(SETTINGS_KEY, defaultSettings);
const loadTables = () => loadJson(TABLES_KEY, defaultTables);
const loadSets = () => loadJson(SETS_KEY, defaultSets);

const buildSnapshot = () => {
  const tables = loadTables();
  const sets = loadSets();
  return {
    counts: {
      track_stats_count: tables.track_stats.length,
      analytics_logs_count: tables.analytics_logs.length,
      bookings_count: tables.bookings.length,
      subscribers_count: tables.subscribers.length,
      users_count: tables.users.length,
      sessions_count: tables.sessions.length,
    },
    topTracks: [...tables.track_stats].sort((a, b) => b.plays - a.plays).slice(0, 8),
    recentAnalytics: [...tables.analytics_logs].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 12),
    recentUsers: tables.users.slice(0, 6),
    recentSubscribers: tables.subscribers.slice(0, 6),
    recentSessions: tables.sessions.slice(0, 6),
    manifestSummary: {
      totalSets: sets.length,
      missingStats: sets.map((entry) => entry.id).filter((id) => !tables.track_stats.find((row) => row.id === id)),
    },
  };
};

const nextId = (rows) => rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;

export const mockFlightDeckApi = {
  isElectron: false,
  async getState() {
    return {
      settings: loadSettings(),
      sets: loadSets(),
      snapshot: buildSnapshot(),
      gitStatus: { branch: 'mock/flightdeck', dirty: false, summary: 'Mock data active' },
      workspaceValid: true,
    };
  },
  async getSettings() {
    return loadSettings();
  },
  async saveSettings(patch) {
    return saveJson(SETTINGS_KEY, { ...loadSettings(), ...patch });
  },
  async selectWorkspace() {
    return saveJson(SETTINGS_KEY, { ...loadSettings(), workspaceRoot: 'D:\\Airdox\\Webseite' });
  },
  async pickImportFiles() {
    return [];
  },
  async prepareImport() {
    return {
      draft: {
        id: 'recording_2026_05_01',
        title: 'REC 01.05.2026',
        date: 'MAY 2026',
        file: 'Airdox_REC_2026_05_01.mp3',
        duration: '1:42:08',
        isNew: true,
        vinylColor: '#9adf6b',
        cover: '/assets/recording_2026_05_01.jpg',
        tracks: [
          { time: '00:00', artist: 'Airdox', title: 'Opening ID' },
          { time: '06:15', artist: 'Alignment', title: 'Nothingness' },
        ],
        sourceAudioPath: 'D:\\Music\\Airdox_REC_2026_05_01.mp3',
        sourceImagePath: 'D:\\Music\\recording_2026_05_01.jpg',
      },
      detectedFiles: {
        audioPath: 'D:\\Music\\Airdox_REC_2026_05_01.mp3',
        imagePath: 'D:\\Music\\recording_2026_05_01.jpg',
        tracklistPath: 'D:\\Music\\recording_2026_05_01.txt',
      },
      warnings: [],
    };
  },
  async publishSet(payload) {
    const settings = loadSettings();
    const nextSets = insertOrReplaceSet(loadSets(), payload.draft, { ...settings, ...(payload.settings || {}) });
    saveJson(SETS_KEY, nextSets);
    const tables = loadTables();
    if (!tables.track_stats.find((row) => row.id === payload.draft.id)) {
      tables.track_stats.unshift({ id: payload.draft.id, plays: 0, likes: 0, dislikes: 0, last_played_at: null });
      saveJson(TABLES_KEY, tables);
    }
    return {
      ok: true,
      manifestDiff: [{ field: 'id', before: null, after: payload.draft.id }],
      logs: [{ step: 'mock', status: 'success', detail: 'Mock publish completed.', timestamp: new Date().toISOString() }],
      gitStatus: { branch: 'mock/flightdeck', dirty: true, summary: 'Mock publish staged in memory' },
      publishedSet: payload.draft,
    };
  },
  async listTable(payload) {
    return loadTables()[payload.table] || [];
  },
  async updateTrackStats(payload) {
    const tables = loadTables();
    tables.track_stats = tables.track_stats.map((row) => row.id === payload.row.id ? payload.row : row);
    saveJson(TABLES_KEY, tables);
    return payload.row;
  },
  async updateSubscriber(payload) {
    const tables = loadTables();
    tables.subscribers = tables.subscribers.map((row) => row.id === payload.row.id ? payload.row : row);
    saveJson(TABLES_KEY, tables);
    return payload.row;
  },
  async deleteRecords(payload) {
    const tables = loadTables();
    const idSet = new Set(payload.ids);
    tables[payload.table] = (tables[payload.table] || []).filter((row) => !idSet.has(row.id));
    saveJson(TABLES_KEY, tables);
    return true;
  },
  async createVipUser(payload) {
    const tables = loadTables();
    const row = { id: nextId(tables.users), username: payload.username, email: payload.email, created_at: new Date().toISOString() };
    tables.users.unshift(row);
    saveJson(TABLES_KEY, tables);
    return row;
  },
  async resetVipPassword() {
    return true;
  },
  async revokeSession(payload) {
    const tables = loadTables();
    tables.sessions = tables.sessions.filter((row) => row.id !== payload.sessionId);
    saveJson(TABLES_KEY, tables);
    return true;
  },
  async runReadonlyQuery() {
    return {
      rowCount: 2,
      rows: loadTables().track_stats,
    };
  },
  async syncTrackStats() {
    const tables = loadTables();
    const sets = loadSets();
    for (const entry of sets) {
      if (!tables.track_stats.find((row) => row.id === entry.id)) {
        tables.track_stats.push({ id: entry.id, plays: 0, likes: 0, dislikes: 0, last_played_at: null });
      }
    }
    saveJson(TABLES_KEY, tables);
    return { ok: true, count: sets.length };
  },
  async exportRecords(payload) {
    return { filePath: `C:\\Exports\\${payload.suggestedName}` };
  },
  async revealPath() {
    return true;
  },
};
