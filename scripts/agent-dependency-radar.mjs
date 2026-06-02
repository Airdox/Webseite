#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const generatedAt = new Date().toISOString();
const outDir = join(root, 'docs', 'agent-system');
const reportJsonPath = join(outDir, 'latest-agent-dependency-radar.json');
const reportMdPath = join(outDir, 'latest-agent-dependency-radar.md');

const readJson = (filePath, fallback = null) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const exists = (relativePath) => existsSync(join(root, relativePath));

const portfolio = readJson(join(outDir, 'latest-designer-portfolio.json'), {});
const audience = readJson(join(outDir, 'latest-audience-intelligence.json'), {});
const profitability = readJson(join(outDir, 'latest-website-profitability.json'), {});
const jobRun = readJson(join(outDir, 'latest-job-run.json'), {});
const routing = readJson(join(outDir, 'latest-agent-routing.json'), {});
const qualityChain = readJson(join(outDir, 'latest-agent-quality-chain.json'), {});

const audienceEventCount = Number(audience?.summary?.totalConsentedEvents || 0);
const profitabilityStatus = String(profitability?.summary?.profitabilityStatus || '');
const hasMeasurementData = audienceEventCount > 0 && profitabilityStatus !== 'no_measurement_data';

const handoffs = [
  ...((Array.isArray(routing?.assignments) ? routing.assignments : []).map((assignment) => ({
    id: `workbench-change-${String(assignment.agent || 'agent').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(assignment.role || 'review')}`,
    from: 'Workbench',
    to: assignment.agent,
    status: assignment.files?.length ? 'watch' : 'sleep',
    waitsFor: `${assignment.files?.length || 0} changed file(s) matched ${assignment.rules?.join(', ') || 'default routing'}.`,
    nextAction: assignment.files?.length
      ? `Sondieren, ob aus ${assignment.files.slice(0, 3).join(', ')} eine konkrete Aufgabe im eigenen Bereich entsteht.`
      : 'No action.',
    userTouchpoint: assignment.files?.length
      ? 'Only interrupt user when the agent needs content, approval, or a decision.'
      : 'None.',
  }))),
  {
    id: 'manni-to-designer-social-hook',
    from: 'Manni',
    to: 'Designer',
    status: exists('docs/agent-system/SOCIAL_POSTING_PACK_2026-05-23.md') ? 'ready' : 'blocked',
    waitsFor: 'Current campaign hook, required on-screen message, platform intent.',
    nextAction: exists('docs/agent-system/latest-designer-portfolio.json')
      ? 'Designer has portfolio context; build only short visual prototypes after user direction.'
      : 'Run designer:portfolio to create selectable visual directions before any full render.',
    userTouchpoint: 'Ask user to choose direction only after a small portfolio is visible.',
  },
  {
    id: 'designer-to-manni-preview-selection',
    from: 'Designer',
    to: 'Manni',
    status: Array.isArray(portfolio?.directions) && portfolio.directions.length >= 3 ? 'ready' : 'needs_input',
    waitsFor: 'Selected creative direction and rejected-direction notes.',
    nextAction: 'Manni prepares platform copy only for directions marked ja/candidate, not for rejected visuals.',
    userTouchpoint: 'Notify user when a portfolio has 3+ viable options or when all options are weak.',
  },
  {
    id: 'audience-to-manni-hook-priority',
    from: 'Audience Intelligence',
    to: 'Manni',
    status: hasMeasurementData ? 'ready' : audience?.summary ? 'blocked_by_no_measurement_data' : 'needs_refresh',
    waitsFor: hasMeasurementData
      ? 'Latest audience signal, hook type priority, channel hypothesis.'
      : 'Consented website events for route_view, set_play, newsletter_signup, booking_click, contact_submit, and epk_download.',
    nextAction: hasMeasurementData
      ? 'Use audience signal to decide whether this batch optimizes completion, shares, follows, or website clicks.'
      : 'Webbie must verify consented event export before Manni treats hook priorities as data-backed.',
    userTouchpoint: hasMeasurementData
      ? 'If KPI data is missing, ask user for platform screenshots or export before inventing performance claims.'
      : 'Do not ask for creative approval as data-backed; ask only for tracking credentials or explicit no-data prioritization.',
  },
  {
    id: 'designer-to-user-content-request',
    from: 'Designer',
    to: 'User',
    status: 'watch',
    waitsFor: 'Fresh photos, video snippets, Daumenkino references, rejected-style feedback, or preferred visual direction.',
    nextAction: 'When no strong source image exists, request content before rendering polished assets.',
    userTouchpoint: 'Message user with one concrete request, not a vague creative prompt.',
  },
  {
    id: 'guardian-to-manni-live-gate',
    from: 'Guardian',
    to: 'Manni',
    status: 'blocked_until_user_ok',
    waitsFor: 'Explicit personal OK for platform, asset, caption, timing, and landing URL.',
    nextAction: 'Keep all social outputs as external_draft until approval is logged.',
    userTouchpoint: 'Ask for OK only on a concrete preview package.',
  },
  ...((Array.isArray(qualityChain?.obligations) ? qualityChain.obligations : []).map((obligation) => ({
    id: `quality-chain-${obligation.id}`,
    from: obligation.owner || 'Primary Agent',
    to: obligation.qaAgent || 'Guardian',
    status: obligation.status || 'watch',
    waitsFor: obligation.reason || 'Quality obligation from changed code.',
    nextAction: obligation.requiredFollowUp || 'Confirm test and validation coverage.',
    userTouchpoint: obligation.userTouchpoint || 'Only interrupt user for acceptance criteria, content, credentials, or approval.',
  }))),
];

const alerts = handoffs
  .filter((handoff) => ['blocked', 'blocked_by_no_measurement_data', 'needs_input', 'needs_refresh', 'watch', 'blocked_until_user_ok'].includes(handoff.status))
  .map((handoff) => ({
    id: handoff.id,
    severity: ['blocked_until_user_ok', 'blocked_by_no_measurement_data'].includes(handoff.status) ? 'gate' : handoff.status === 'watch' ? 'info' : 'action',
    message: `${handoff.to} waits for: ${handoff.waitsFor}`,
    nextAction: handoff.nextAction,
    userTouchpoint: handoff.userTouchpoint,
  }));

const report = {
  generatedAt,
  controller: 'Master Controller',
  job: 'agent-dependency-radar',
  purpose: 'Keep AIRDOX agents interlocked: every output should name the next waiting agent, dependency, and user touchpoint.',
  summary: {
    handoffCount: handoffs.length,
    alertCount: alerts.length,
    lastJobRun: jobRun?.generatedAt || null,
    changedFileCount: routing?.changedFileCount || 0,
    qualityObligationCount: Array.isArray(qualityChain?.obligations) ? qualityChain.obligations.length : 0,
  },
  handoffs,
  alerts,
};

const renderMarkdown = () => {
  const lines = [
    '# AIRDOX Agent Dependency Radar',
    '',
    `Generated: ${generatedAt}`,
    'Controller: Master Controller',
    '',
    '## Summary',
    '',
    `- Handoffs: ${handoffs.length}`,
    `- Alerts: ${alerts.length}`,
    `- Last job run: ${report.summary.lastJobRun || 'unknown'}`,
    '',
    '## Handoffs',
    '',
    '| ID | From | To | Status | Next Action | User Touchpoint |',
    '| --- | --- | --- | --- | --- | --- |',
    ...handoffs.map((handoff) => `| ${handoff.id} | ${handoff.from} | ${handoff.to} | ${handoff.status} | ${handoff.nextAction} | ${handoff.userTouchpoint} |`),
    '',
    '## Alerts',
    '',
    ...alerts.map((alert) => `- ${alert.severity}: ${alert.message} Next: ${alert.nextAction}`),
    '',
  ];
  return `${lines.join('\n')}\n`;
};

mkdirSync(outDir, { recursive: true });
writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(reportMdPath, renderMarkdown());

process.stdout.write([
  'Agent Dependency Radar: DONE',
  `Handoffs: ${handoffs.length}`,
  `Alerts: ${alerts.length}`,
  'Report: docs/agent-system/latest-agent-dependency-radar.md',
].join('\n'));
process.stdout.write('\n');
