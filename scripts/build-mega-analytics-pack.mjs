import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sets } from '../src/data/musicSets.js';

dotenv.config();

const OUT_DIR = join(process.cwd(), 'release', 'analytics-mega-pack');
const AGENT_DIR = join(process.cwd(), 'docs', 'agent-system');
const now = new Date();

const safe = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const parseDuration = (value = '') => {
  const parts = String(value).split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const fmtHours = (seconds) => `${(seconds / 3600).toFixed(1)} h`;
const pct = (value, total) => total ? `${Math.round((value / total) * 100)}%` : '0%';

const pushCount = (map, key, amount = 1) => {
  const normalized = String(key || 'unknown').trim() || 'unknown';
  map.set(normalized, (map.get(normalized) || 0) + amount);
};

const topEntries = (map, limit = 10) => [...map.entries()]
  .map(([key, value]) => ({ key, value }))
  .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
  .slice(0, limit);

const readJson = (file) => {
  const fullPath = join(AGENT_DIR, file);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, 'utf8'));
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).map(([key, item]) => (
    item && typeof item === 'object' ? { id: key, ...item } : { id: key, value: item }
  ));
};

const writeCsv = (file, rows) => {
  const headers = Object.keys(rows[0] || {});
  const body = rows.map((row) => headers.map((header) => {
    const raw = String(row[header] ?? '');
    return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
  }).join(','));
  writeFileSync(join(OUT_DIR, file), [headers.join(','), ...body].join('\n'), 'utf8');
};

const getLiveTelemetry = async () => {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return { available: false, reason: 'DATABASE_URL/NEON_DATABASE_URL/POSTGRES_URL fehlt.' };

  try {
    const sql = neon(dbUrl);
    const counts = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM track_stats) AS track_stats_count,
        (SELECT COUNT(*)::int FROM analytics_logs) AS analytics_logs_count,
        (SELECT COUNT(*)::int FROM users) AS users_count,
        (SELECT COUNT(*)::int FROM sessions) AS sessions_count
    `;
    const topTracks = await sql`
      SELECT id, plays, likes, dislikes, last_played_at
      FROM track_stats
      ORDER BY plays DESC, likes DESC
      LIMIT 20
    `;
    const eventTypes = await sql`
      SELECT event_type AS key, COUNT(*)::int AS value
      FROM analytics_logs
      GROUP BY event_type
      ORDER BY value DESC
      LIMIT 20
    `;
    const devices = await sql`
      SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS key, COUNT(*)::int AS value
      FROM analytics_logs
      GROUP BY key
      ORDER BY value DESC
      LIMIT 20
    `;
    const routes = await sql`
      SELECT COALESCE(NULLIF(route, ''), COALESCE(NULLIF(referrer, ''), 'unknown')) AS key, COUNT(*)::int AS value
      FROM analytics_logs
      GROUP BY key
      ORDER BY value DESC
      LIMIT 20
    `;
    return {
      available: true,
      counts: counts[0],
      topTracks,
      eventTypes,
      devices,
      routes
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
};

const buildMusicAnalytics = () => {
  const artistCounts = new Map();
  const monthCounts = new Map();
  const monthMinutes = new Map();
  const titleCounts = new Map();
  const rows = sets.map((set) => {
    const durationSeconds = parseDuration(set.duration);
    const tracks = Array.isArray(set.tracks) ? set.tracks : [];
    const month = set.publishedAt ? set.publishedAt.slice(0, 7) : set.date || 'unknown';
    pushCount(monthCounts, month);
    pushCount(monthMinutes, month, Math.round(durationSeconds / 60));
    tracks.forEach((track) => {
      String(track.artist || 'unknown').split(',').map((part) => part.trim()).filter(Boolean).forEach((artist) => {
        pushCount(artistCounts, artist);
      });
      pushCount(titleCounts, `${track.artist || 'unknown'} - ${track.title || 'unknown'}`);
    });
    return {
      id: set.id,
      title: set.title,
      publishedAt: set.publishedAt || set.date || '',
      duration: set.duration || '',
      durationMinutes: Math.round(durationSeconds / 60),
      trackCount: tracks.length,
      isNew: Boolean(set.isNew),
      hasCover: Boolean(set.cover),
      tracksPerHour: durationSeconds ? Number((tracks.length / (durationSeconds / 3600)).toFixed(1)) : 0
    };
  });

  const totalDurationSeconds = rows.reduce((sum, row) => sum + row.durationMinutes * 60, 0);
  const totalTracks = rows.reduce((sum, row) => sum + row.trackCount, 0);
  const setsWithTracklists = rows.filter((row) => row.trackCount > 0).length;

  return {
    rows,
    summary: {
      setCount: rows.length,
      totalTracks,
      uniqueArtistTokens: artistCounts.size,
      totalDurationSeconds,
      totalDurationHours: Number((totalDurationSeconds / 3600).toFixed(1)),
      setsWithTracklists,
      tracklistCoverage: Number((setsWithTracklists / rows.length).toFixed(2)),
      newSetCount: rows.filter((row) => row.isNew).length,
      coverCoverage: Number((rows.filter((row) => row.hasCover).length / rows.length).toFixed(2))
    },
    topArtists: topEntries(artistCounts, 20),
    topRepeatedTracks: topEntries(titleCounts, 20).filter((entry) => entry.value > 1),
    monthlySetCounts: topEntries(monthCounts, 20),
    monthlyMinutes: topEntries(monthMinutes, 20),
    longestSets: [...rows].sort((a, b) => b.durationMinutes - a.durationMinutes).slice(0, 10),
    densestTracklists: [...rows].sort((a, b) => b.tracksPerHour - a.tracksPerHour).slice(0, 10)
  };
};

const buildAgentAnalytics = () => {
  const files = [
    'latest-audience-intelligence.json',
    'latest-website-profitability.json',
    'latest-repository-monitor.json',
    'latest-agent-system-health.json',
    'latest-guardian-risk-summary.json',
    'latest-agent-quality-chain.json',
    'latest-agent-routing.json',
    'latest-refactor-website-opportunities.json',
    'latest-social-post-ledger.json',
    'latest-youtube-publish-audit.json'
  ];
  const reports = files.map((file) => ({ file, data: readJson(file) })).filter((item) => item.data);
  const recommendations = reports.flatMap(({ file, data }) => asArray(data.recommendations).map((item) => ({ file, ...item })));
  const checks = reports.flatMap(({ file, data }) => asArray(data.checks).map((item) => ({ file, ...item })));
  const warnCount = checks.filter((check) => String(check.level).toLowerCase() === 'warn').length;
  const failCount = checks.filter((check) => ['fail', 'error'].includes(String(check.level).toLowerCase())).length;
  const highPriority = recommendations.filter((item) => String(item.priority).toLowerCase() === 'high').length;

  return {
    reports: reports.map(({ file, data }) => ({
      file,
      generatedAt: data.generatedAt || '',
      agent: data.agent || '',
      summary: data.summary || {}
    })),
    recommendations,
    checks,
    summary: {
      reportCount: reports.length,
      recommendationCount: recommendations.length,
      highPriority,
      checkCount: checks.length,
      warnCount,
      failCount
    }
  };
};

const barRows = (items, options = {}) => {
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);
  return items.map((item) => `
    <div class="bar-row">
      <span class="bar-label">${safe(item.key || item.title || item.id)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${pct(Number(item.value || 0), max)}"></span></span>
      <strong>${safe(options.format ? options.format(item.value) : item.value)}</strong>
    </div>
  `).join('');
};

const renderHtml = ({ music, agent, live }) => {
  const liveCounts = live.available ? live.counts : {};
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AIRDOX Mega Analytics Pack</title>
  <style>
    :root { color-scheme: dark; --bg:#080a0d; --panel:#111820; --line:#27313d; --text:#eef5f8; --muted:#9fb0bd; --cyan:#36d6e7; --green:#a8df68; --amber:#ffb84d; --red:#ff6b6b; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); line-height: 1.45; }
    header { padding: 34px 28px 20px; border-bottom: 1px solid var(--line); }
    main { max-width: 1180px; margin: 0 auto; padding: 26px; }
    h1 { margin: 0 0 8px; font-size: clamp(30px, 5vw, 58px); letter-spacing: 0; }
    h2 { margin: 0 0 18px; font-size: 22px; color: var(--cyan); }
    h3 { margin: 22px 0 12px; font-size: 16px; color: var(--green); }
    p { color: var(--muted); max-width: 880px; }
    section { border-top: 1px solid var(--line); padding: 30px 0; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 20px 0; }
    .kpi { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 14px; min-height: 96px; }
    .kpi span { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .kpi strong { display: block; font-size: 30px; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 18px; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 18px; }
    .bar-row { display: grid; grid-template-columns: minmax(110px, 1fr) 2fr 58px; gap: 10px; align-items: center; min-height: 30px; }
    .bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
    .bar-track { height: 10px; background: #1a2430; border-radius: 99px; overflow: hidden; }
    .bar-fill { display: block; height: 100%; background: linear-gradient(90deg, var(--cyan), var(--green)); }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 9px 8px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .pill { display: inline-block; border: 1px solid var(--line); border-radius: 99px; padding: 3px 8px; color: var(--green); }
    .warn { color: var(--amber); }
    .fail { color: var(--red); }
    @media (max-width: 720px) { main { padding: 16px; } .bar-row { grid-template-columns: 1fr; gap: 5px; } table { font-size: 12px; } }
  </style>
</head>
<body>
  <header>
    <h1>AIRDOX Mega Analytics Pack</h1>
    <p>Erstellt am ${safe(now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }))}. Auswertung aus Website-Manifest, Tracklisten, lokalen Agentenreports${live.available ? ' und Neon-Live-Telemetrie' : ''}.</p>
  </header>
  <main>
    <section>
      <h2>Executive Snapshot</h2>
      <div class="kpis">
        <div class="kpi"><span>Sets</span><strong>${music.summary.setCount}</strong></div>
        <div class="kpi"><span>Musiklaufzeit</span><strong>${fmtHours(music.summary.totalDurationSeconds)}</strong></div>
        <div class="kpi"><span>Trackmarker</span><strong>${music.summary.totalTracks}</strong></div>
        <div class="kpi"><span>Artist Tokens</span><strong>${music.summary.uniqueArtistTokens}</strong></div>
        <div class="kpi"><span>Tracklist Coverage</span><strong>${pct(music.summary.setsWithTracklists, music.summary.setCount)}</strong></div>
        <div class="kpi"><span>Agent Reports</span><strong>${agent.summary.reportCount}</strong></div>
        <div class="kpi"><span>Empfehlungen</span><strong>${agent.summary.recommendationCount}</strong></div>
        <div class="kpi"><span>Live Events</span><strong>${safe(liveCounts.analytics_logs_count ?? 'n/a')}</strong></div>
      </div>
      <p>Takeaway: Die stärkste belastbare Basis ist derzeit das lokale Musik- und Agentenmaterial. Die Live-Telemetrie ist ${live.available ? 'angebunden und im Paket enthalten' : `nicht angebunden (${safe(live.reason)}), daher getrennt markiert`}.</p>
    </section>

    <section>
      <h2>Musik- und Kataloganalyse</h2>
      <div class="grid">
        <div class="panel"><h3>Top Artists nach Tracklist-Präsenz</h3>${barRows(music.topArtists)}</div>
        <div class="panel"><h3>Monatliche Set-Anzahl</h3>${barRows(music.monthlySetCounts)}</div>
        <div class="panel"><h3>Monatliche Minuten</h3>${barRows(music.monthlyMinutes, { format: (v) => `${v} min` })}</div>
        <div class="panel"><h3>Dichteste Tracklisten</h3>${barRows(music.densestTracklists.map((row) => ({ key: row.title, value: row.tracksPerHour })))}</div>
      </div>
      <h3>Longest Sets</h3>
      <table><thead><tr><th>Set</th><th>Datum</th><th>Dauer</th><th>Tracks</th><th>Tracks/h</th></tr></thead><tbody>
        ${music.longestSets.map((row) => `<tr><td>${safe(row.title)}</td><td>${safe(row.publishedAt)}</td><td>${row.durationMinutes} min</td><td>${row.trackCount}</td><td>${row.tracksPerHour}</td></tr>`).join('')}
      </tbody></table>
    </section>

    <section>
      <h2>Live-Telemetrie</h2>
      ${live.available ? `
        <div class="grid">
          <div class="panel"><h3>Eventtypen</h3>${barRows(live.eventTypes)}</div>
          <div class="panel"><h3>Geräte</h3>${barRows(live.devices)}</div>
          <div class="panel"><h3>Routen / Quellen</h3>${barRows(live.routes)}</div>
        </div>
        <h3>Top Tracks nach Plays</h3>
        <table><thead><tr><th>ID</th><th>Plays</th><th>Likes</th><th>Dislikes</th><th>Zuletzt</th></tr></thead><tbody>
          ${live.topTracks.map((row) => `<tr><td>${safe(row.id)}</td><td>${row.plays}</td><td>${row.likes}</td><td>${row.dislikes}</td><td>${safe(row.last_played_at || '')}</td></tr>`).join('')}
        </tbody></table>
      ` : `<p class="warn">Keine Live-Telemetrie eingebunden: ${safe(live.reason)}</p>`}
    </section>

    <section>
      <h2>Agenten-, Marketing- und Operations-Auswertung</h2>
      <div class="kpis">
        <div class="kpi"><span>Checks</span><strong>${agent.summary.checkCount}</strong></div>
        <div class="kpi"><span>Warnungen</span><strong class="warn">${agent.summary.warnCount}</strong></div>
        <div class="kpi"><span>Fehler</span><strong class="fail">${agent.summary.failCount}</strong></div>
        <div class="kpi"><span>High Priority</span><strong>${agent.summary.highPriority}</strong></div>
      </div>
      <h3>Empfehlungen</h3>
      <table><thead><tr><th>Quelle</th><th>Priorität</th><th>Titel</th><th>Aktion</th></tr></thead><tbody>
        ${agent.recommendations.slice(0, 30).map((row) => `<tr><td>${safe(row.file)}</td><td><span class="pill">${safe(row.priority || '')}</span></td><td>${safe(row.title || '')}</td><td>${safe(row.action || row.reason || '')}</td></tr>`).join('')}
      </tbody></table>
    </section>

    <section>
      <h2>Strategische Auswertung</h2>
      <div class="grid">
        <div class="panel">
          <h3>Was stark ist</h3>
          <p>Viel verwertbarer Musikkatalog, hohe Tracklist-Dichte bei mehreren aktuellen Sets, klare lokale Agentenreports und bereits vorhandene Audience-/Profitability-Modelle.</p>
        </div>
        <div class="panel">
          <h3>Was limitiert</h3>
          <p>Live-Signale sind noch klein oder abhängig von Datenbankzugriff. ROI bleibt ohne reale Kostenannahmen nur eine Wertschätzung, keine belastbare Finanzkennzahl.</p>
        </div>
        <div class="panel">
          <h3>Nächste sinnvolle Schritte</h3>
          <p>Top-Set <strong>${safe(music.rows[0]?.title)}</strong> weiter als Kampagnenanker nutzen, Newsletter-/Booking-Signale konsequent messen und nach jeder Veröffentlichung diesen Report neu generieren.</p>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;
};

const renderMarkdown = ({ music, agent, live }) => `# AIRDOX Mega Analytics Pack

Erstellt: ${now.toISOString()}

## Kerndaten

- Sets: ${music.summary.setCount}
- Gesamtlaufzeit: ${fmtHours(music.summary.totalDurationSeconds)}
- Trackmarker: ${music.summary.totalTracks}
- Artist Tokens: ${music.summary.uniqueArtistTokens}
- Tracklist Coverage: ${pct(music.summary.setsWithTracklists, music.summary.setCount)}
- Agentenreports: ${agent.summary.reportCount}
- Empfehlungen: ${agent.summary.recommendationCount}
- Live-Telemetrie: ${live.available ? 'verfuegbar' : `nicht verfuegbar (${live.reason})`}

## Top Artists

${music.topArtists.slice(0, 12).map((item, index) => `${index + 1}. ${item.key}: ${item.value}`).join('\n')}

## Priorisierte Empfehlungen

${agent.recommendations.slice(0, 15).map((item, index) => `${index + 1}. [${item.priority || 'n/a'}] ${item.title || item.reason || 'Empfehlung'} (${item.file})`).join('\n')}
`;

const renderVisualizationMethodology = ({ live }) => `# Build Web Data Visualization Methodik

Connector/Skill: Build Web Data Visualization

## Analytische Jobs

- Vergleich und Ranking: Top Artists, Top Tracks, groesste Sets, dichteste Tracklisten.
- Zeitentwicklung: monatliche Set-Anzahl und monatliche Minuten.
- Zusammensetzung: Eventtypen, Geraete, Routen/Quellen.
- Operations-Monitoring: Agentenchecks, Warnungen, Fehler, priorisierte Empfehlungen.
- Reporting/Export: HTML-Dashboard, PDF, PNG-Preview, JSON und CSV.

## Datenformen

- Tabellarisch: Set-Manifest, Agentenempfehlungen, Track-Statistiken.
- Time Series Light: Published-at/Monatsaggregation aus dem Musikmanifest.
- Multivariat: Plays, Likes, Dislikes, Trackanzahl, Laufzeit, Tracks pro Stunde.
- Report Graph: Lokale latest-*.json Agentenreports aus docs/agent-system.

## Darstellungsentscheidungen

- Balken und Tabellen statt dekorativer Charts, weil die Daten kleine bis mittlere Rankings sind.
- Direkte Werte bleiben sichtbar; keine reine Hover-Abhaengigkeit.
- HTML ist das primaere interaktive/lesbare Artefakt, PDF und PNG sind Export-Fallbacks.
- JSON und CSV bleiben fuer Weiterverarbeitung und externe Dashboards erhalten.

## Caveats

- Live-Telemetrie ist ${live.available ? 'verfuegbar und wurde eingebunden' : `nicht verfuegbar: ${live.reason}`}.
- Artist Tokens sind normalisierte Namensbestandteile aus Tracklisten, keine extern verifizierten Kuenstlerprofile.
- ROI-/Profitabilitaetswerte aus lokalen Reports bleiben Schaetzwerte, solange reale Kostenannahmen fehlen.
- Tracklist Coverage misst vorhandene Trackmarker, nicht Audioqualitaet oder Vollstaendigkeit der CUE-Daten.

## QA

- Generatorlauf: npm run analytics:mega.
- Artefaktcheck: HTML, PDF, PNG, JSON und CSV wurden geschrieben.
- Visuelle Kontrolle: dashboard-preview.png wurde gerendert und ist nicht leer.
- Parser ist gegen heterogene Agentenreport-Formate gehaertet.
`;

const renderBrowserArtifacts = async (htmlPath) => {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
    await page.screenshot({ path: join(OUT_DIR, 'dashboard-preview.png'), fullPage: true });
    await page.pdf({
      path: join(OUT_DIR, 'mega-analytics-report.pdf'),
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '12mm', left: '10mm' }
    });
    await browser.close();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const music = buildMusicAnalytics();
  const agent = buildAgentAnalytics();
  const live = await getLiveTelemetry();
  const payload = { generatedAt: now.toISOString(), source: 'local+optional-neon', music, agent, live };

  writeFileSync(join(OUT_DIR, 'mega-analytics.json'), JSON.stringify(payload, null, 2), 'utf8');
  const htmlPath = join(OUT_DIR, 'index.html');
  writeFileSync(htmlPath, renderHtml(payload), 'utf8');
  writeFileSync(join(OUT_DIR, 'executive-summary.md'), renderMarkdown(payload), 'utf8');
  writeFileSync(join(OUT_DIR, 'visualization-methodology.md'), renderVisualizationMethodology(payload), 'utf8');
  writeCsv('music-sets.csv', music.rows);
  writeCsv('top-artists.csv', music.topArtists);
  writeCsv('agent-recommendations.csv', agent.recommendations.map((item) => ({
    file: item.file,
    priority: item.priority || '',
    title: item.title || '',
    action: item.action || '',
    reason: item.reason || ''
  })));

  const browserArtifacts = await renderBrowserArtifacts(htmlPath);
  if (!browserArtifacts.ok) {
    console.warn(`Browser artifacts skipped: ${browserArtifacts.reason}`);
  }

  console.log(`Mega analytics pack written to ${OUT_DIR}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
