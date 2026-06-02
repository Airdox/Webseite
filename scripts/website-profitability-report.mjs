#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs', 'agent-system');
const modelPath = path.join(docsDir, 'website-profitability-model.json');
const taxonomyPath = path.join(docsDir, 'audience-signal-taxonomy.json');
const jsonOutPath = path.join(docsDir, 'latest-website-profitability.json');
const mdOutPath = path.join(docsDir, 'latest-website-profitability.md');

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

const BLOCKED_FIELDS = new Set([
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

async function loadEvents() {
  const explicitPath = process.env.AUDIENCE_EVENTS_FILE
    ? path.resolve(rootDir, process.env.AUDIENCE_EVENTS_FILE)
    : null;
  const candidates = explicitPath ? [explicitPath, ...DEFAULT_EVENT_PATHS] : DEFAULT_EVENT_PATHS;
  for (const candidate of candidates) {
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

function hasConsent(event) {
  return event?.consent === true || event?.consent?.analytics === true;
}

function hasBlockedField(event) {
  return [...BLOCKED_FIELDS].some((field) => Object.prototype.hasOwnProperty.call(event || {}, field));
}

function isWithinWindow(event, days) {
  if (!event?.timestamp) return true;
  const timestamp = new Date(event.timestamp).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const oldest = Date.now() - days * 24 * 60 * 60 * 1000;
  return timestamp >= oldest;
}

function increment(map, key, amount = 1) {
  const normalized = key || 'unknown';
  map.set(normalized, (map.get(normalized) || 0) + amount);
}

function topEntries(map, limit = 12) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value: Number(value.toFixed(2)) }));
}

function sumObjectValues(object = {}) {
  return Object.values(object).reduce((sum, value) => sum + Number(value || 0), 0);
}

function calculateRate(part, whole) {
  if (!whole) return 0;
  return Number((part / whole).toFixed(4));
}

function classifyProfitability({ estimatedGrossValue, totalCost, totalConsentedEvents }) {
  if (totalConsentedEvents === 0) return 'no_measurement_data';
  if (totalCost <= 0 && estimatedGrossValue > 0) return 'value_detected_costs_missing';
  if (totalCost <= 0) return 'costs_missing';
  const roi = (estimatedGrossValue - totalCost) / totalCost;
  if (roi >= 1) return 'profitable';
  if (roi >= 0) return 'break_even_or_learning';
  return 'unprofitable';
}

function createRecommendations({ summary, targets, totalCost }) {
  const recommendations = [];

  if (summary.totalConsentedEvents === 0) {
    recommendations.push({
      priority: 'high',
      owner: 'Webbie',
      title: 'Enable consented website event export',
      action: 'Verify route_view, set_play, newsletter_signup, booking_click, contact_submit, and epk_download reach the audience event store.'
    });
    recommendations.push({
      priority: 'high',
      owner: 'Audience Intelligence',
      title: 'Do not optimize ROI without data',
      action: 'Keep the profitability status as no_measurement_data until at least one consented event source exists.'
    });
    return recommendations;
  }

  if (totalCost === 0) {
    recommendations.push({
      priority: 'medium',
      owner: 'Master Controller',
      title: 'Enter real monthly cost assumptions',
      action: 'Set hosting, tools, paid media, and manual production costs in website-profitability-model.json before using ROI for business decisions.'
    });
  }

  if (summary.conversionRates.bookingIntentRate < targets.bookingIntentRate) {
    recommendations.push({
      priority: 'high',
      owner: 'Webbie',
      title: 'Improve booking CTA path',
      action: 'Review the strongest route and place a contextual booking or EPK CTA after meaningful music engagement.'
    });
  }

  if (summary.conversionRates.newsletterRate < targets.newsletterRate) {
    recommendations.push({
      priority: 'medium',
      owner: 'Manni',
      title: 'Strengthen fan capture',
      action: 'Pair the top content with a newsletter offer and a measurable campaign parameter.'
    });
  }

  return recommendations;
}

function createMarkdown(report) {
  const money = (value) => `${report.model.currency} ${Number(value || 0).toFixed(2)}`;
  return [
    '# Latest Website Profitability',
    '',
    `Generated: ${report.generatedAt}`,
    `Measurement window: ${report.model.measurementWindowDays} days`,
    `Event source: ${report.summary.eventSource || 'none'}`,
    `Status: ${report.summary.profitabilityStatus}`,
    '',
    '## Financial Estimate',
    `- Estimated gross value: ${money(report.summary.estimatedGrossValue)}`,
    `- Estimated monthly cost: ${money(report.summary.totalCost)}`,
    `- Estimated net value: ${money(report.summary.estimatedNetValue)}`,
    `- ROI: ${report.summary.roi === null ? 'n/a' : report.summary.roi}`,
    '',
    '## Funnel',
    `- Consented events: ${report.summary.totalConsentedEvents}`,
    `- Rejected events: ${report.summary.rejectedEvents}`,
    `- Route views: ${report.summary.funnel.routeViews}`,
    `- Set plays: ${report.summary.funnel.setPlays}`,
    `- Newsletter signups: ${report.summary.funnel.newsletterSignups}`,
    `- Booking clicks: ${report.summary.funnel.bookingClicks}`,
    `- Contact submits: ${report.summary.funnel.contactSubmits}`,
    '',
    '## Conversion Rates',
    ...Object.entries(report.summary.conversionRates).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Value By Event',
    ...(report.summary.valueByEvent.length ? report.summary.valueByEvent.map((item) => `- ${item.key}: ${money(item.value)}`) : ['- No data yet']),
    '',
    '## Value By Route',
    ...(report.summary.valueByRoute.length ? report.summary.valueByRoute.map((item) => `- ${item.key}: ${money(item.value)}`) : ['- No data yet']),
    '',
    '## Recommendations',
    ...report.recommendations.map((item, index) => `${index + 1}. ${item.title} (${item.priority}, ${item.owner})\n   - ${item.action}`),
    '',
    '## Guardrails',
    '- Aggregate and consented events only.',
    '- No raw personal data, form messages, exact locations, emails, phone numbers, or fingerprints.',
    '- Planning values must be replaced with real booking revenue and cost exports before final profitability decisions.'
  ].join('\n') + '\n';
}

async function main() {
  const model = await readJson(modelPath, {});
  const taxonomy = await readJson(taxonomyPath, { eventWeights: {} });
  const loaded = await loadEvents();
  const windowDays = Number(model.measurementWindowDays || 30);
  const eventValues = model.eventValues || {};
  const targets = model.conversionTargets || {};

  const valueByEvent = new Map();
  const valueByRoute = new Map();
  const valueByCampaign = new Map();
  const counts = new Map();
  let rejectedEvents = 0;
  let privacyRejectedEvents = 0;

  for (const event of loaded.events) {
    if (!hasConsent(event) || !isWithinWindow(event, windowDays)) {
      rejectedEvents += 1;
      continue;
    }
    if (hasBlockedField(event)) {
      privacyRejectedEvents += 1;
      continue;
    }

    const type = String(event.type || 'unknown');
    const valueMultiplier = Number.isFinite(Number(event.value)) ? Math.max(Number(event.value), 1) : 1;
    const estimatedValue = Number(eventValues[type] ?? 0) * valueMultiplier;
    increment(counts, type, 1);
    increment(valueByEvent, type, estimatedValue);
    increment(valueByRoute, event.route, estimatedValue);
    increment(valueByCampaign, event.campaign, estimatedValue);
  }

  const totalConsentedEvents = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const estimatedGrossValue = [...valueByEvent.values()].reduce((sum, value) => sum + value, 0);
  const totalCost = sumObjectValues(model.monthlyCosts) + sumObjectValues(model.agentCostRates);
  const estimatedNetValue = estimatedGrossValue - totalCost;
  const routeViews = counts.get('route_view') || 0;
  const setPlays = counts.get('set_play') || 0;
  const newsletterSignups = counts.get('newsletter_signup') || 0;
  const bookingClicks = counts.get('booking_click') || 0;
  const contactSubmits = counts.get('contact_submit') || 0;

  const summary = {
    eventSource: loaded.source,
    totalRawEvents: loaded.events.length,
    totalConsentedEvents,
    rejectedEvents,
    privacyRejectedEvents,
    estimatedGrossValue: Number(estimatedGrossValue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    estimatedNetValue: Number(estimatedNetValue.toFixed(2)),
    roi: totalCost > 0 ? Number(((estimatedGrossValue - totalCost) / totalCost).toFixed(4)) : null,
    profitabilityStatus: classifyProfitability({ estimatedGrossValue, totalCost, totalConsentedEvents }),
    funnel: {
      routeViews,
      setPlays,
      newsletterSignups,
      bookingClicks,
      contactSubmits
    },
    conversionRates: {
      engagedPlayRate: calculateRate(setPlays, routeViews),
      newsletterRate: calculateRate(newsletterSignups, routeViews),
      bookingIntentRate: calculateRate(bookingClicks + contactSubmits, routeViews),
      contactRate: calculateRate(contactSubmits, routeViews)
    },
    valueByEvent: topEntries(valueByEvent),
    valueByRoute: topEntries(valueByRoute),
    valueByCampaign: topEntries(valueByCampaign),
    supportedEvents: Object.keys(taxonomy.eventWeights || {})
  };

  const report = {
    generatedAt: new Date().toISOString(),
    agent: 'audience-intelligence',
    model: {
      currency: model.currency || 'EUR',
      measurementWindowDays: windowDays,
      privacyMode: model.privacyMode || 'consented-aggregate'
    },
    summary,
    recommendations: createRecommendations({ summary, targets, totalCost })
  };

  await fs.mkdir(docsDir, { recursive: true });
  await fs.writeFile(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(mdOutPath, createMarkdown(report), 'utf8');

  console.log(`Website profitability report written to ${path.relative(rootDir, mdOutPath)}`);
  console.log(`Status: ${summary.profitabilityStatus}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
