import { DEFAULT_FLIGHT_DECK_SETTINGS, insertOrReplaceSet } from './lib/setManifest.js';
import { answerToolQuestion } from './lib/assistantEngine.js';

const SETTINGS_KEY = 'flightdeck_mock_settings';
const TABLES_KEY = 'flightdeck_mock_tables';
const SETS_KEY = 'flightdeck_mock_sets';
const MANNI_APPROVALS_KEY = 'flightdeck_mock_manni_approvals';
const MARKETING_DRAFT_REQUESTS_KEY = 'flightdeck_mock_marketing_draft_requests';

const defaultSettings = {
  ...DEFAULT_FLIGHT_DECK_SETTINGS,
  workspaceRoot: 'D:\\Airdox\\Webseite',
};

import { sets } from '../data/musicSets.js';

const defaultSets = sets.map(set => ({
  id: set.id,
  title: set.title,
  date: set.date,
  file: set.file,
  duration: set.duration,
  isNew: set.isNew,
  vinylColor: set.vinylColor,
  tracks: set.tracks || []
}));

const defaultTables = {
  track_stats: defaultSets.slice(0, 4).map((set, index) => ({
    id: set.id,
    plays: [42, 27, 19, 11][index] || 0,
    likes: [8, 5, 3, 1][index] || 0,
    dislikes: 0,
    last_played_at: index === 0 ? '2026-05-20T18:00:00.000Z' : null,
  })),
  analytics_logs: [
    {
      id: 1,
      event_type: 'play',
      item_id: defaultSets[0]?.id || 'recording_2026_05_01',
      session_id: 'mock-session-1',
      country: 'DE',
      city: 'Berlin',
      region: 'BE',
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      referrer: 'direct',
      created_at: '2026-05-20T18:00:00.000Z',
    },
  ],
  bookings: [
    {
      id: 1,
      name: 'Club Reset',
      email: 'booking@club-reset.example',
      event: 'Peak Slot',
      message: 'AIRDOX booking request from preview data.',
      created_at: '2026-05-18T20:00:00.000Z',
    },
  ],
  subscribers: [
    {
      id: 1,
      email: 'vip@airdox.info',
      status: 'active',
      created_at: '2026-05-18T12:00:00.000Z',
    },
  ],
  users: [
    {
      id: 1,
      username: 'manni',
      email: 'manni@airdox.info',
      created_at: '2026-05-18T12:30:00.000Z',
    },
  ],
  sessions: [
    {
      id: 'mock-session-1',
      user_id: 1,
      username: 'manni',
      email: 'manni@airdox.info',
      created_at: '2026-05-18T12:45:00.000Z',
      expires_at: '2026-05-23T12:45:00.000Z',
    },
  ],
};

// Clear stale mock cache so we always see reality
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem(SETS_KEY);
  localStorage.removeItem(TABLES_KEY);
}

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

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const serializeRows = (rows = [], format = 'json') => {
  if (format !== 'csv') return JSON.stringify(rows, null, 2);
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  return [
    columns.map(csvEscape).join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n');
};

const triggerBrowserDownload = ({ content, fileName, mimeType }) => {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    return false;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
};

const loadSettings = () => loadJson(SETTINGS_KEY, defaultSettings);
const loadTables = () => loadJson(TABLES_KEY, defaultTables);
const loadSets = () => loadJson(SETS_KEY, defaultSets);

const defaultManniCampaignState = {
  proposal: {
    metadata: {
      title: 'Manni PR-/Social-Reichweiten-Operationen - 2026-05-13',
      status: 'approved_for_execution_dispatch',
      owner: 'Manni',
      goal: 'Reichweite fuer AIRDOX ueber konkrete Social- und PR-Aktionen erweitern.',
      approval: 'Nutzerauftrag im Chat vom 2026-05-13: "Schicke Manni los Seinen PR Auftrag auszufuehren"',
    },
    executionBoundary: {
      summary: 'Manni darf die untenstehenden Aktionen ausfuehren oder beauftragen, sobald Plattformzugang vorhanden ist.',
      rules: [
        'keine andere Copy',
        'kein anderes Asset',
        'kein anderes Budget',
        'keine DM-/Kommentar-Antwort ausser den freigegebenen Varianten',
        'kein Paid-Spend ueber die unten genannten Limits',
      ],
    },
    producedAssets: [
      {
        title: 'Aktuell bevorzugtes CD-konformes Webstyle-Reel mit Nutzer-gewaehltem Ausschnitt',
        summary: '',
        items: [
          { key: 'video', label: 'Video', value: 'docs/agent-system/manni-reel-output/airdox-cd-webstyle-online-set-1758-reel.mp4' },
          { key: 'preview', label: 'Preview', value: 'docs/agent-system/manni-reel-output/airdox-cd-webstyle-online-set-1758-reel-preview.png' },
          { key: 'format', label: 'Format', value: '1080x1920, 30 fps, 16.0s, H.264/AAC, ca. 2.0 MB.' },
          { key: 'status', label: 'Status', value: 'aktueller bevorzugter Upload-Entwurf fuer Instagram Reel und Facebook Reel.' },
        ],
      },
    ],
    executionChecklist: [
      'Reel/Story-Asset gegen Rechte, Tonalitaet und Hook pruefen.',
      'OPS-IG-01 und OPS-FB-01 organisch veroeffentlichen.',
      'OPS-IG-02 Story-Sequenz veroeffentlichen.',
      'OPS-FB-02 als Page-/Community-kompatiblen Post veroeffentlichen.',
    ],
    measurementWindows: [
      { label: '2h: Hook-/Initial-Reach-Check', window: '2h', detail: 'Hook-/Initial-Reach-Check' },
      { label: '24h: Winner/Loser-Entscheidung', window: '24h', detail: 'Winner/Loser-Entscheidung' },
      { label: '7d: nachhaltige Reichweite, Follower, Link-Klicks, Booking-/Newsletter-Effekt', window: '7d', detail: 'nachhaltige Reichweite, Follower, Link-Klicks, Booking-/Newsletter-Effekt' },
    ],
    dispatchResult: {
      dispatchedAt: '2026-05-13T05:13:05.728Z',
      command: 'npm run agent:jobs:run -- --event=manual_publish_request --status=approved --user-approved=pr-social-reach-ops-execute',
      runnerNotes: [
        'pr-social-reach-ops-execute: manual execution Auftrag aktiviert.',
        'pr-campaign-live-publish: korrekt blockiert, weil nur der Social-Reach-Ops-Execute-Job freigegeben wurde.',
      ],
    },
    sourceMarkdown: '',
  },
  operations: [
    {
      id: 'OPS-IG-01',
      platform: 'Instagram',
      action: 'Reel posten',
      copyHook: 'AIRDOX pressure check. Berlin underground techno, no warm-up. CTA: Full set in bio.',
      asset: 'manni-reel-queue Slot 1 oder naechster freigegebener Drop-/Peak-Clip',
      targetUrl: 'Website/Music Deep Link',
      timing: 'naechster Peak-Slot 18:00-21:00',
      kpiGoal: 'Nicht-Follower-Reach, Profilbesuche, Link-Klicks',
      budget: '0 EUR',
    },
    {
      id: 'OPS-FB-01',
      platform: 'Facebook',
      action: 'Reel posten',
      copyHook: 'Berlin underground pressure from AIRDOX. Full set and booking link on the site.',
      asset: 'gleicher Clip wie OPS-IG-01, Facebook-safe Caption',
      targetUrl: 'Website/Music Deep Link',
      timing: 'direkt nach OPS-IG-01',
      kpiGoal: 'Reel Views, Shares, Link-Klicks',
      budget: '0 EUR',
    },
    {
      id: 'OPS-IG-02',
      platform: 'Instagram',
      action: 'Story-Sequenz',
      copyHook: 'PRESSURE TEST / FULL SET ONLINE / BOOKING / EPK',
      asset: 'Reel-First-Frame + EPK-/Website-Screenshot',
      targetUrl: 'Website/Music oder EPK Link',
      timing: '30-60 Min nach Reel',
      kpiGoal: 'Story Taps, Link-Klicks',
      budget: '0 EUR',
    },
  ],
  approvals: {
    version: 1,
    proposalSource: 'docs/agent-system/reports/campaigns/MANNI_PR_SOCIAL_REACH_OPS_2026-05-13.md',
    createdAt: '2026-05-13T05:13:05.728Z',
    updatedAt: '2026-05-13T05:13:05.728Z',
    operations: {
      'OPS-IG-01': { status: 'pending', notes: '', decidedBy: '', decisionAt: '', updatedAt: '2026-05-13T05:13:05.728Z' },
      'OPS-FB-01': { status: 'pending', notes: '', decidedBy: '', decisionAt: '', updatedAt: '2026-05-13T05:13:05.728Z' },
      'OPS-IG-02': { status: 'pending', notes: '', decidedBy: '', decisionAt: '', updatedAt: '2026-05-13T05:13:05.728Z' },
    },
  },
  summary: {
    title: 'Manni PR-/Social-Reichweiten-Operationen - 2026-05-13',
    status: 'approved_for_execution_dispatch',
    owner: 'Manni',
    goal: 'Reichweite fuer AIRDOX ueber konkrete Social- und PR-Aktionen erweitern.',
    approval: 'Nutzerauftrag im Chat vom 2026-05-13: "Schicke Manni los Seinen PR Auftrag auszufuehren"',
    operationCount: 3,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 3,
  },
  draftRequests: [],
  visualAssets: [],
  rawMarkdownPath: 'docs/agent-system/reports/campaigns/MANNI_PR_SOCIAL_REACH_OPS_2026-05-13.md',
  approvalsPath: 'docs/agent-system/manni-approval-state.json',
};

const loadManniCampaignState = () => {
  const stored = loadJson(MANNI_APPROVALS_KEY, null);
  const base = JSON.parse(JSON.stringify(defaultManniCampaignState));
  const approvals = stored?.operations ? stored : base.approvals;

  base.approvals = approvals;
  base.visualAssets = base.proposal.producedAssets;
  base.operations = base.operations.map((operation) => ({
    ...operation,
    decision: approvals.operations[operation.id] || { status: 'pending', notes: '', decidedBy: '', decisionAt: '', updatedAt: '' },
  }));
  base.summary.approvedCount = base.operations.filter((entry) => entry.decision?.status === 'approved').length;
  base.summary.rejectedCount = base.operations.filter((entry) => entry.decision?.status === 'rejected').length;
  base.summary.pendingCount = base.operations.filter((entry) => !entry.decision?.status || entry.decision?.status === 'pending').length;
  base.visualAssets = base.proposal.producedAssets;
  return base;
};

const saveManniApprovals = (approvals) => saveJson(MANNI_APPROVALS_KEY, approvals);
const loadMarketingDraftRequests = () => loadJson(MARKETING_DRAFT_REQUESTS_KEY, []);
const saveMarketingDraftRequests = (requests) => saveJson(MARKETING_DRAFT_REQUESTS_KEY, requests);

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

const buildMockAnalytics = (eventLogs = []) => {
  const eventsByType = {};
  const countryMap = {};
  const deviceTypeBreakdown = {};
  const setMap = {};
  const hourlyDistribution = new Array(24).fill(0);

  for (const event of eventLogs) {
    const eventType = String(event.event_type || '').toLowerCase();
    const country = String(event.country || '').toUpperCase();
    const device = String(event.device_type || '').toLowerCase();
    const itemId = String(event.item_id || '');

    eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;
    if (country) countryMap[country] = (countryMap[country] || 0) + 1;
    if (device) deviceTypeBreakdown[device] = (deviceTypeBreakdown[device] || 0) + 1;

    if (itemId) {
      if (!setMap[itemId]) setMap[itemId] = { id: itemId, plays: 0, likes: 0, dislikes: 0 };
      if (eventType === 'play') setMap[itemId].plays += 1;
      if (eventType === 'like') setMap[itemId].likes += 1;
      if (eventType === 'dislike') setMap[itemId].dislikes += 1;
    }

    const date = new Date(event.created_at);
    if (!Number.isNaN(date.getTime())) {
      hourlyDistribution[date.getHours()] += 1;
    }
  }

  const topCountries = Object.entries(countryMap)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
  const topSets = Object.values(setMap)
    .sort((a, b) => b.plays - a.plays);

  const totalViews = eventLogs.length;
  const totalPlays = eventsByType.play || 0;
  const totalLikes = eventsByType.like || 0;
  const totalDislikes = eventsByType.dislike || 0;

  return {
    totalViews,
    totalPlays,
    totalLikes,
    totalDislikes,
    eventsByType,
    topSets,
    topCountries,
    deviceTypeBreakdown,
    hourlyDistribution,
    conversionRate: totalViews > 0 ? totalPlays / totalViews : 0,
    eventLogs,
    source: 'browser-no-real-data',
    realData: false,
    sourceLabel: 'Keine echte Datenbank verbunden',
  };
};

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
  async getManniCampaignState() {
    const state = loadManniCampaignState();
    return { ...state, draftRequests: loadMarketingDraftRequests() };
  },
  async updateManniOperationApproval(payload) {
    const state = loadManniCampaignState();
    const timestamp = new Date().toISOString();
    const nextApprovals = {
      ...state.approvals,
      updatedAt: timestamp,
      operations: {
        ...state.approvals.operations,
        [payload.operationId]: {
          ...(state.approvals.operations[payload.operationId] || {}),
          status: String(payload.status || 'pending').toLowerCase(),
          notes: String(payload.note || '').trim(),
          decisionAt: timestamp,
          updatedAt: timestamp,
        },
      },
    };
    saveManniApprovals(nextApprovals);
    const nextState = loadManniCampaignState();
    return { ...nextState, draftRequests: loadMarketingDraftRequests() };
  },
  async createMarketingDraftRequest(payload) {
    const requests = loadMarketingDraftRequests();
    const next = {
      id: `MRQ-${Date.now()}`,
      title: String(payload?.title || 'Ohne Titel'),
      channels: Array.isArray(payload?.channels) ? payload.channels : [],
      objective: String(payload?.objective || ''),
      constraints: String(payload?.constraints || ''),
      ownerAgent: String(payload?.ownerAgent || 'Manni'),
      status: 'angefragt',
      createdAt: new Date().toISOString(),
    };
    requests.unshift(next);
    saveMarketingDraftRequests(requests);
    const state = loadManniCampaignState();
    return { ...state, draftRequests: requests };
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
        title: 'MAYDAY SIGNAL',
        generatedBaseId: 'recording_2026_05_01',
        generatedBaseTitle: 'MAYDAY SIGNAL',
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
    throw new Error('Fake SQL mock was disabled. Please run the Electron Desktop App to connect to the real database.');
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
    const format = payload?.format || 'json';
    const fileName = payload?.suggestedName || `flightdeck-export.${format}`;
    const content = serializeRows(payload?.rows || [], format);
    const downloaded = triggerBrowserDownload({
      content,
      fileName,
      mimeType: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
    });
    return { filePath: downloaded ? fileName : null, downloaded, content };
  },
  async revealPath() {
    return true;
  },
  async openDesignStudio() {
    if (typeof window !== 'undefined') {
      window.open('/desktop.html?view=design-studio', 'airdox-design-studio', 'width=1800,height=1080');
    }
    return true;
  },
  async renderDesign(payload = {}) {
    const style = payload.style || 'flicker';
    const outputSlug = payload.outputSlug || `daumenkino_${style}`;
    const base = `D:\\webseeite-main\\release\\${outputSlug}`;
    return {
      ok: true,
      outputs: {
        gifPath: `${base}.gif`,
        mp4Path: `${base}.mp4`,
        manifestPath: `${base}.manifest.json`,
        handoffPath: `${base}.handoff.md`,
        photoshopFramePath: `${base}.photoshop-frame.png`,
        photoshopScriptPath: `${base}.photoshop-setup.jsx`,
        outputDir: 'D:\\webseeite-main\\release',
        photoshopAvailable: payload.mode === '5050',
        photoshopAction: payload.photoshopAction || 'script_and_launch',
        bgSource: payload.bgSource || 'cover',
        customBgPath: payload.customBgPath || '',
      },
    };
  },
  async getDesignPreview() {
    return null;
  },
  onDesignLog() {
    return () => {};
  },
  async getAnalyticsData() {
    return buildMockAnalytics([]);
  },
  async exportAnalyticsReport(payload) {
    return { filePath: `C:\\Exports\\analytics-${payload?.type || 'json'}.json` };
  },
  async getSystemStats() {
    return {};
  },
  async clearCache() {
    return { cleared: true };
  },
  async optimizeSystem() {
    return { optimized: true };
  },
  async askAssistant(payload) {
    const q = String(payload?.question || '').toLowerCase();
    if (q.includes('skill') || q.includes('update') || q.includes('refactor') || q.includes('mai 2026') || q.includes('wiki') || q.includes('neu')) {
      return {
        source: 'local-13-recent-updates-may-2026.md',
        answer: `Wiki-Treffer:\nAus local-13-recent-updates-may-2026.md: # Flight Deck Local Knowledge: Systemaktualisierungen Mai 2026\n\nStand: 22. Mai 2026\n\n1. Neue KI-Agenten-Skills (.agents/skills/):\n- airdox-social-publisher: Automatisches Herausschneiden von Teasern/Reels/Stories.\n- airdox-youtube-manager: Rendert Visualizer-Videos und automatisiert YouTube-Uploads.\n- airdox-brand-assets: Validiert und generiert brandkonforme SVGs.\n- airdox-epk-generator: Kompiliert das Electronic Press Kit als HTML und PDF.\n- airdox-tracklist-automation: Rekordbox-CUE-Import und MP3-Konvertierung.\n- airdox-quality-check: Gatekeeper für Lints, Tests und Audits.\n\n2. Refactoring der React-Komponenten:\n- Decomposition von GlobalPlayer und Hero in kleinere Subkomponenten.\n- Behebung des mobilen Vinyl-Cover-Animationsfehlers in SetCard.\n\n3. Upgrades im Data Explorer:\n- Filterknöpfe "Alle Sets" und "Live" zur gezielten VIP-Set-Ausblendung.\n\n4. Cloudflare Migration:\n- Vollständige Entfernung von Vercel und Netlify.`,
        actions: [],
      };
    }
    const local = answerToolQuestion(payload?.question || '');
    return {
      source: local?.source || 'mock-local',
      answer: local?.text || String(local || ''),
      actions: local?.actions || [],
    };
  },
};
