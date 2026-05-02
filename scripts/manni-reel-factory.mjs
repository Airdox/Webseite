#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sets } from '../src/data/musicSets.js';

const root = process.cwd();
const args = process.argv.slice(2);
const argSet = new Set(args);
const generatedAt = new Date().toISOString();
const reportDue = new Date(Date.parse(generatedAt) + (7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);

const getArgValue = (name, fallback = '') => {
  const key = `${name}=`;
  const raw = args.find((item) => item.startsWith(key));
  if (!raw) return fallback;
  return raw.slice(key.length).trim();
};

const scenario = (getArgValue('--scenario', 'A') || 'A').toUpperCase();
const maxItems = Number.parseInt(getArgValue('--count', '12'), 10);
const itemLimit = Number.isFinite(maxItems) && maxItems > 0 ? maxItems : 12;

const queuePath = join(root, 'docs', 'agent-system', 'manni-reel-queue.json');
const planPath = join(root, 'docs', 'agent-system', 'manni-reel-weekly-plan.md');
const draftPackPath = join(root, 'docs', 'agent-system', 'manni-reel-draft-pack.md');
const outDir = join(root, 'docs', 'agent-system');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48);

const toSetAnchorId = (value) => `set-${String(value || '').replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const toSeconds = (timeRaw) => {
  const value = String(timeRaw || '').trim();
  if (!/^\d{1,2}(:\d{2}){1,2}$/.test(value)) return null;
  const parts = value.split(':').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  return null;
};

const formatClock = (secondsRaw) => {
  const seconds = Math.max(0, Number(secondsRaw) || 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const toTableCell = (value) => String(value || '').replace(/\|/g, '/');

const scenarioProfiles = {
  A: {
    label: 'Organischer Engine-Aufbau',
    cta: 'Follow fuer den naechsten Part.',
    hashtags: ['#techno', '#berlintechno', '#undergroundtechno', '#reelsmusic', '#djset'],
    kpiFocus: 'watch_time_and_shares',
  },
  B: {
    label: 'Collab- und Creator-Leverage',
    cta: 'Markiere jemanden fuer ein Collab-Set.',
    hashtags: ['#techno', '#collab', '#creator', '#berlinnightlife', '#djreel'],
    kpiFocus: 'profile_visits_and_follows',
  },
  C: {
    label: 'Release-Burst',
    cta: 'Jetzt folgen und neuen Release sichern.',
    hashtags: ['#newmusic', '#release', '#technorelease', '#berlintechno', '#airdox'],
    kpiFocus: 'saves_and_stream_clicks',
  },
  D: {
    label: 'Paid-Amplification auf Gewinnern',
    cta: 'Mehr davon? Follow und Set-Link checken.',
    hashtags: ['#techno', '#viralreels', '#performancemarketing', '#djlife', '#musicdiscovery'],
    kpiFocus: 'cpa_and_retention',
  },
};

const profile = scenarioProfiles[scenario] || scenarioProfiles.A;

const readJsonSafe = (filePath, fallback) => {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const previous = readJsonSafe(queuePath, { queue: [] });
const previousMap = new Map(
  (Array.isArray(previous.queue) ? previous.queue : []).map((item) => [String(item.id), item]),
);

const sourceSets = [...sets]
  .filter((set) => Array.isArray(set.tracks) && set.tracks.length > 0)
  .sort((a, b) => {
    const aTs = Date.parse(a.publishedAt || '') || 0;
    const bTs = Date.parse(b.publishedAt || '') || 0;
    return bTs - aTs;
  })
  .slice(0, 5);

const candidates = [];
for (const set of sourceSets) {
  const tracks = [...set.tracks]
    .map((track) => ({
      ...track,
      _seconds: toSeconds(track.time),
    }))
    .filter((track) => track._seconds !== null)
    .sort((a, b) => a._seconds - b._seconds)
    .slice(0, 4);

  for (const [index, track] of tracks.entries()) {
    const angle = index % 3 === 0
      ? 'drop-moment'
      : index % 3 === 1
        ? 'transition-breakdown'
        : 'crowd-energy';
    const id = `reel-${slugify(set.id)}-${slugify(track.time)}-${angle}`;
    const hook = angle === 'drop-moment'
      ? `Warte auf den Drop bei ${formatClock(track._seconds)}`
      : angle === 'transition-breakdown'
        ? `So baue ich den Uebergang bei ${formatClock(track._seconds)}`
        : `Dieser Moment killt den Floor bei ${formatClock(track._seconds)}`;
    const concept = angle === 'drop-moment'
      ? 'Zoom-In auf Build-Up und harter Cut auf den Drop.'
      : angle === 'transition-breakdown'
        ? 'Split-Screen: Deck A / Deck B plus kurze On-Screen-Erklaerung.'
        : 'POV-Cut mit Crowd-Reaction und schneller Wiederholung.';
    const creativeVariant = angle === 'drop-moment'
      ? 'raw_drop_marker'
      : angle === 'transition-breakdown'
        ? 'deck_split_screen'
        : 'floor_energy_loop';

    const existing = previousMap.get(id);
    candidates.push({
      id,
      owner: 'Manni',
      status: existing?.status || 'planned',
      createdAt: existing?.createdAt || generatedAt,
      updatedAt: generatedAt,
      scenario,
      scenarioLabel: profile.label,
      priority: existing?.priority || (index + 1),
      platforms: ['instagram_reels', 'tiktok', 'youtube_shorts'],
      sourceSetId: set.id,
      sourceSetTitle: set.title,
      sourceTrack: `${track.artist} - ${track.title}`,
      sourceTimestamp: track.time,
      landingUrl: `https://airdox.info/#${toSetAnchorId(set.id)}`,
      hook,
      concept,
      cta: profile.cta,
      hashtags: profile.hashtags,
      kpiFocus: profile.kpiFocus,
      captionTemplate: `${hook}. ${track.artist} - ${track.title}. ${profile.cta}`,
      experiment: existing?.experiment || {
        hypothesis: `${angle} Hook aus ${set.title} steigert Completion Rate und Shares.`,
        primaryMetric: 'completion_rate',
        secondaryMetric: 'shares',
        reportDue,
      },
      approval: existing?.approval || {
        visibility: 'external_draft',
        creationAllowed: true,
        requiresUserApprovalForPublish: true,
        status: 'draft_allowed_publish_pending_user_ok',
      },
      actionPlan: existing?.actionPlan || {
        owner: 'Manni',
        nextAction: 'Create external-ready reel/poster draft, caption variant, and platform copy. Keep unpublished until user OK.',
        handoffTo: 'Designer',
        handoffReason: 'First-frame, thumbnail, and safe-area readiness review.',
        gate: 'Creation is allowed; external publishing requires personal user OK in DECISION_LOG.',
      },
      creativePack: existing?.creativePack || {
        firstFrameText: hook,
        styleVariant: creativeVariant,
        thumbnailDirection: 'Deck-/Waveform-Nahaufnahme mit sichtbarem Timestamp-Marker.',
        safeAreaNotes: 'Text oben zentriert, keine Plattform-UI verdecken.',
      },
      reporting: existing?.reporting || {
        postingStatus: 'planned',
        resultStatus: 'pending',
        winnerSignal: '',
        learning: '',
      },
    });
  }
}

const nextQueue = candidates.slice(0, itemLimit);

const queueDoc = {
  generatedAt,
  agent: 'Manni',
  scenario,
  scenarioLabel: profile.label,
  sourceSetCount: sourceSets.length,
  itemCount: nextQueue.length,
  queue: nextQueue,
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const planLines = [
  '# Manni Reel Weekly Plan',
  '',
  `Generated: ${generatedAt}`,
  `Scenario: ${scenario} - ${profile.label}`,
  `Items: ${nextQueue.length}`,
  '',
  '## Schedule',
  '',
  '| Slot | Day | Reel ID | Variant | Hook | Approval | Report Due | Posting Status | KPI Focus |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
];

for (const [index, item] of nextQueue.entries()) {
  const day = weekdays[index % weekdays.length];
  planLines.push(`| ${index + 1} | ${day} | ${item.id} | ${item.creativePack.styleVariant} | ${toTableCell(item.hook)} | ${item.approval.status} | ${item.experiment.reportDue} | ${item.reporting.postingStatus} | ${item.kpiFocus} |`);
}

planLines.push(
  '',
  '## Manni Action Plan',
  '',
  '| Day | Action | Output | Gate |',
  '| --- | --- | --- | --- |',
  '| Mon | KPI baseline, top 3 hooks priorisieren, erste 2 interne Reel-Drafts schneiden | Baseline + Draft IDs im Decision Log | internal_planning |',
  '| Tue | 2 Hook-Varianten fuer Slot 1-2 erstellen, Caption und Landing-URL finalisieren | Externe Drafts, noch unveroeffentlicht | draft_allowed_publish_pending_user_ok |',
  '| Wed | Designer-Review fuer First Frame, Thumbnail und Safe Area einholen | `creativePack` bestaetigt oder ueberarbeitet | internal_planning |',
  '| Thu | Slot 3-4 als externe-ready Drafts fertigstellen, CTA gegen Website-Deep-Link pruefen | Drafts + Linkcheck | draft_allowed_publish_pending_user_ok |',
  '| Fri | Gewinnerkandidaten fuer Nutzerfreigabe vorbereiten | Freigabe-Paket mit Plattformen, Asset-IDs, Copy | pending_user_ok |',
  '| Sat | Keine externe Ausspielung ohne OK; bei OK: Posting-Checkliste anwenden | Decision-Log-Freigabe oder Blocker | external_live_requires_user_ok |',
  '| Sun | Wochenreport: Gewinner, Verlierer, Learnings, naechste 3 Experimente | `growth-report-digest` in DECISION_LOG | internal_planning |',
  '',
  '## Approval Boundary',
  '',
  '- Manni darf Reichweitenaktionen planen, Poster/Reels/Captions als externe-ready Drafts erstellen und KPI-Reports schreiben.',
  '- Manni darf nichts live posten, boosten oder paid ausspielen, bis persoenliches Nutzer-OK im Decision Log steht.',
);

planLines.push('', '## Queue Notes', '');
for (const item of nextQueue) {
  planLines.push(`- ${item.id}: ${item.sourceSetTitle} @ ${item.sourceTimestamp} -> ${item.sourceTrack}`);
}
planLines.push('');

const draftPackLines = [
  '# Manni Reel Draft Pack',
  '',
  `Generated: ${generatedAt}`,
  `Scenario: ${scenario} - ${profile.label}`,
  '',
  'Status: Draft creation is active. Nothing is published, boosted, or sent live without personal user OK.',
  '',
  '## Drafts',
  '',
];

for (const [index, item] of nextQueue.entries()) {
  draftPackLines.push(
    `### ${index + 1}. ${item.id}`,
    '',
    `- Source: ${item.sourceSetTitle} @ ${item.sourceTimestamp} -> ${item.sourceTrack}`,
    `- Landing URL: ${item.landingUrl}`,
    `- Hook: ${item.hook}`,
    `- First frame: ${item.creativePack.firstFrameText}`,
    `- Visual variant: ${item.creativePack.styleVariant}`,
    `- Thumbnail: ${item.creativePack.thumbnailDirection}`,
    `- Caption draft: ${item.captionTemplate}`,
    `- CTA: ${item.cta}`,
    `- Hashtags: ${item.hashtags.join(' ')}`,
    `- Next action: ${item.actionPlan.nextAction}`,
    `- Handoff: ${item.actionPlan.handoffTo} - ${item.actionPlan.handoffReason}`,
    `- Gate: ${item.actionPlan.gate}`,
    '',
  );
}

mkdirSync(outDir, { recursive: true });
writeFileSync(queuePath, `${JSON.stringify(queueDoc, null, 2)}\n`);
writeFileSync(planPath, `${planLines.join('\n')}\n`);
writeFileSync(draftPackPath, `${draftPackLines.join('\n')}\n`);

process.stdout.write([
  'Manni Reel Factory: DONE',
  `Scenario: ${scenario} (${profile.label})`,
  `Queue items: ${nextQueue.length}`,
  `Queue file: ${queuePath}`,
  `Plan file: ${planPath}`,
  `Draft pack file: ${draftPackPath}`,
].join('\n'));
process.stdout.write('\n');

if (argSet.has('--strict') && nextQueue.length === 0) {
  process.exitCode = 1;
}
