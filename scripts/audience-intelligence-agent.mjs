import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs', 'agent-system');
const taxonomyPath = path.join(docsDir, 'audience-signal-taxonomy.json');
const jsonOutPath = path.join(docsDir, 'latest-audience-intelligence.json');
const mdOutPath = path.join(docsDir, 'latest-audience-intelligence.md');

const DEFAULT_EVENT_PATHS = [
  path.join(rootDir, 'data', 'audience-events.jsonl'),
  path.join(rootDir, 'docs', 'agent-system', 'audience-events.jsonl')
];

const DATABASE_EVENT_TYPES = [
  'route_view',
  'section_view',
  'cta_view',
  'set_play',
  'set_complete',
  'video_play',
  'tracklist_open',
  'deep_scroll',
  'share_click',
  'copy_link',
  'newsletter_signup',
  'booking_click',
  'contact_submit',
  'epk_download',
  'external_social_click'
];

const blockedFields = new Set([
  'ip',
  'email',
  'name',
  'phone',
  'address',
  'exactLocation',
  'formMessage',
  'rawUserAgent',
  'fingerprint',
  'userId'
]);

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonl(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function getDatabaseUrl() {
  return process.env.AUDIENCE_DATABASE_URL
    || process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.NEON_DATABASE_URL
    || '';
}

async function ensureAnalyticsLogAudienceColumns(sql) {
  await sql`
    ALTER TABLE analytics_logs
    ADD COLUMN IF NOT EXISTS route TEXT NULL,
    ADD COLUMN IF NOT EXISTS source TEXT NULL,
    ADD COLUMN IF NOT EXISTS content_type TEXT NULL,
    ADD COLUMN IF NOT EXISTS value DOUBLE PRECISION NULL;
  `;
}

function mapAnalyticsLogRow(row) {
  const referrer = String(row.referrer || '');
  const isReferrerGroup = ['direct', 'social', 'search', 'referral', 'unknown'].includes(referrer);
  const referrerGroup = ['direct', 'social', 'search', 'referral', 'unknown'].includes(referrer) ? referrer : 'unknown';
  const storedRoute = String(row.route || '').trim();
  const isRoute = referrer.startsWith('/');
  const itemId = String(row.item_id || '').trim();
  const contentType = String(row.content_type || '').trim();
  const numericValue = Number(row.value);
  return {
    timestamp: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    sessionIdHash: row.session_id || null,
    consent: { analytics: true },
    type: row.event_type,
    route: storedRoute || (isRoute ? referrer : row.event_type === 'route_view' ? itemId || '/' : 'unknown'),
    contentId: row.event_type === 'route_view' ? undefined : itemId || undefined,
    contentType: contentType || (itemId ? 'website_signal' : undefined),
    campaign: !isReferrerGroup && !isRoute ? referrer || undefined : undefined,
    referrerGroup: isReferrerGroup ? referrer : 'unknown',
    deviceClass: row.device_type || 'unknown',
    locale: row.os || 'unknown',
    source: row.source || undefined,
    value: Number.isFinite(numericValue) ? numericValue : 1
  };
}

async function loadDatabaseEvents() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  try {
    const sql = neon(databaseUrl);
    await ensureAnalyticsLogAudienceColumns(sql);
    const rows = await sql`
      SELECT event_type, item_id, session_id, device_type, os, referrer, created_at,
             route, source, content_type, value
      FROM analytics_logs
      WHERE event_type = ANY(${DATABASE_EVENT_TYPES})
      ORDER BY created_at DESC
      LIMIT 10000
    `;
    return {
      source: 'neon:analytics_logs',
      events: rows.map(mapAnalyticsLogRow)
    };
  } catch (error) {
    return {
      source: 'neon:analytics_logs',
      events: [],
      error: String(error?.message || error)
    };
  }
}

function hasAnalyticsConsent(event) {
  return event?.consent === true || event?.consent?.analytics === true;
}

function sanitizeEvent(event) {
  const sanitized = {};
  for (const [key, value] of Object.entries(event || {})) {
    if (!blockedFields.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function increment(map, key, amount = 1) {
  const normalizedKey = key || 'unknown';
  map.set(normalizedKey, (map.get(normalizedKey) || 0) + amount);
}

function topEntries(map, limit = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

function scoreEvent(event, weights) {
  const weight = weights[event.type] || 1;
  const value = Number.isFinite(Number(event.value)) ? Number(event.value) : 1;
  return weight * Math.max(value, 1);
}

function buildSessionJourneys(events) {
  const sessions = new Map();
  for (const event of events) {
    if (!event.sessionIdHash) continue;
    if (!sessions.has(event.sessionIdHash)) sessions.set(event.sessionIdHash, []);
    sessions.get(event.sessionIdHash).push(event);
  }

  const journeys = [];
  for (const [sessionIdHash, sessionEvents] of sessions.entries()) {
    const ordered = sessionEvents
      .filter((event) => event.timestamp)
      .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    const types = ordered.map((event) => event.type).filter(Boolean);
    journeys.push({
      sessionIdHash,
      events: types,
      reachedBooking: types.includes('booking_click') || types.includes('contact_submit'),
      reachedNewsletter: types.includes('newsletter_signup'),
      reachedPlay: types.includes('set_play') || types.includes('set_complete')
    });
  }
  return journeys;
}

function createRecommendations(summary) {
  const recommendations = [];
  const topRoute = summary.topRoutes[0];
  const topContent = summary.topContent[0];
  const bookingSignals = summary.byType.find((item) => item.key === 'booking_click')?.value || 0;
  const contactSignals = summary.byType.find((item) => item.key === 'contact_submit')?.value || 0;
  const playSignals = summary.byType.find((item) => item.key === 'set_play')?.value || 0;
  const signupSignals = summary.byType.find((item) => item.key === 'newsletter_signup')?.value || 0;
  const shareSignals = summary.byType.find((item) => item.key === 'share_click')?.value || 0;

  if (topRoute) {
    recommendations.push({
      priority: 'high',
      title: `CTA-Pfad auf ${topRoute.key} staerken`,
      reason: `Diese Route hat mit ${topRoute.value} gewichteten Signalpunkten die staerkste Audience-Aktivitaet.`,
      action: 'Kontextuelle CTAs fuer Set-Play, Newsletter-Anmeldung, Booking und Sharing ergaenzen oder pruefen.'
    });
  }

  if (topContent) {
    recommendations.push({
      priority: 'high',
      title: `Top-Inhalt wiederverwenden: ${topContent.key}`,
      reason: `Dieser Inhalt fuehrt das Audience-Interesse aktuell mit ${topContent.value} gewichteten Signalpunkten an.`,
      action: 'Aus diesem Inhalt Social-Captions, Newsletter-Copy, SEO-Beschreibung und Booking-Winkel ableiten.'
    });
  }

  if (playSignals > 0 && signupSignals === 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Newsletter-Capture nach Musik-Engagement ergaenzen',
      reason: 'Nutzer spielen Sets, aber es ist kein Newsletter-Signal vorhanden.',
      action: 'Nach relevantem Play oder Tracklist-Engagement einen kontextuellen Newsletter-CTA zeigen.'
    });
  }

  if (shareSignals > 0 && bookingSignals + contactSignals === 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Social-Sharing mit Booking-Intent verbinden',
      reason: 'Sharing-Signale sind vorhanden, aber Booking-/Kontakt-Signale fehlen.',
      action: 'Auf stark geteilten Seiten einen leichten Booking- oder EPK-CTA ergaenzen.'
    });
  }

  if (summary.totalConsentedEvents === 0) {
    recommendations.push({
      priority: 'high',
      title: 'Consent-basierte Audience-Events erfassen',
      reason: 'Es wurden keine consent-basierten Analytics-Events gefunden; Empfehlungen basieren daher nur auf Readiness.',
      action: 'Route-, CTA-, Set-Play-, Newsletter-, Booking- und Share-Events in einen consent-bewussten Analytics-Export fuehren.'
    });
  }

  return recommendations;
}

function createMarkdown(report) {
  const lines = [
    '# Latest Audience Intelligence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Consent mode: ${report.privacy.mode}`,
    `Consented events analyzed: ${report.summary.totalConsentedEvents}`,
    `Rejected events without analytics consent: ${report.summary.rejectedEvents}`,
    '',
    '## Top Routes',
    ...formatList(report.summary.topRoutes),
    '',
    '## Top Content',
    ...formatList(report.summary.topContent),
    '',
    '## Top Event Types',
    ...formatList(report.summary.byType),
    '',
    '## Intent Segments',
    ...Object.entries(report.summary.intentSegments).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Recommendations',
    ...report.recommendations.map((item, index) => `${index + 1}. ${item.title} (${item.priority})\n   - Reason: ${item.reason}\n   - Action: ${item.action}`),
    '',
    '## Notes',
    '- Dieser Bericht nutzt nur consent-basierte aggregierte oder pseudonyme Signale.',
    '- Keine rohen personenbezogenen Daten, Formularnachrichten, IP-Adressen, E-Mails, Telefonnummern oder versteckte Fingerprinting-Felder zu Analytics-Events hinzufuegen.'
  ];
  return `${lines.join('\n')}\n`;
}

function formatList(items) {
  if (!items.length) return ['- Noch keine Daten'];
  return items.map((item) => `- ${item.key}: ${item.value}`);
}

async function loadEvents() {
  const eventPath = process.env.AUDIENCE_EVENTS_FILE
    ? path.resolve(rootDir, process.env.AUDIENCE_EVENTS_FILE)
    : null;
  const paths = eventPath ? [eventPath, ...DEFAULT_EVENT_PATHS] : DEFAULT_EVENT_PATHS;
  for (const candidate of paths) {
    if (await fileExists(candidate)) {
      return {
        source: path.relative(rootDir, candidate),
        events: await readJsonl(candidate)
      };
    }
  }
  const databaseEvents = await loadDatabaseEvents();
  if (databaseEvents) return databaseEvents;
  return { source: null, events: [] };
}

async function main() {
  const taxonomy = await readJson(taxonomyPath, { eventWeights: {}, segments: {} });
  const loaded = await loadEvents();
  const consentedEvents = [];
  let rejectedEvents = 0;

  for (const rawEvent of loaded.events) {
    if (!hasAnalyticsConsent(rawEvent)) {
      rejectedEvents += 1;
      continue;
    }
    consentedEvents.push(sanitizeEvent(rawEvent));
  }

  const byType = new Map();
  const byRoute = new Map();
  const byContent = new Map();
  const byCampaign = new Map();
  const byReferrer = new Map();
  const byDevice = new Map();
  const intentSegments = Object.fromEntries(Object.keys(taxonomy.segments || {}).map((key) => [key, 0]));

  for (const event of consentedEvents) {
    const score = scoreEvent(event, taxonomy.eventWeights || {});
    increment(byType, event.type, 1);
    increment(byRoute, event.route, score);
    increment(byContent, event.contentId || event.contentType, score);
    increment(byCampaign, event.campaign, score);
    increment(byReferrer, event.referrerGroup, score);
    increment(byDevice, event.deviceClass, score);

    for (const [segment, segmentEvents] of Object.entries(taxonomy.segments || {})) {
      if (segmentEvents.includes(event.type)) {
        intentSegments[segment] += score;
      }
    }
  }

  const journeys = buildSessionJourneys(consentedEvents);
  const summary = {
    eventSource: loaded.source,
    totalRawEvents: loaded.events.length,
    totalConsentedEvents: consentedEvents.length,
    rejectedEvents,
    byType: topEntries(byType, 20),
    topRoutes: topEntries(byRoute, 10),
    topContent: topEntries(byContent, 10),
    topCampaigns: topEntries(byCampaign, 10),
    topReferrers: topEntries(byReferrer, 10),
    topDevices: topEntries(byDevice, 10),
    intentSegments,
    journeyStats: {
      sessions: journeys.length,
      sessionsWithPlay: journeys.filter((journey) => journey.reachedPlay).length,
      sessionsWithNewsletter: journeys.filter((journey) => journey.reachedNewsletter).length,
      sessionsWithBooking: journeys.filter((journey) => journey.reachedBooking).length
    }
  };

  const report = {
    generatedAt: new Date().toISOString(),
    agent: 'audience-intelligence',
    privacy: {
      mode: taxonomy.privacyMode || 'consented-aggregate',
      blockedFields: [...blockedFields]
    },
    summary,
    recommendations: createRecommendations(summary)
  };

  await fs.mkdir(docsDir, { recursive: true });
  await fs.writeFile(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(mdOutPath, createMarkdown(report), 'utf8');

  console.log(`Audience intelligence report written to ${path.relative(rootDir, mdOutPath)}`);
  console.log(`Events analyzed: ${summary.totalConsentedEvents}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
