#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const isCi = process.env.CI === 'true';
const eventPath = process.env.GITHUB_EVENT_PATH || '';
const eventName = process.env.GITHUB_EVENT_NAME || '';

const allowedAgents = new Set([
  'Master Controller',
  'Webbie',
  'Winnie',
  'Guardian',
  'Manni',
  'Designer',
  'Mentor',
  'Audience Intelligence',
  'Refactor',
  'Repository',
]);

const print = (lines) => {
  process.stdout.write(`${lines.join('\n')}\n`);
};

const cleanSection = (text = '') => text
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\r/g, '')
  .trim();

const getSection = (body, heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`, 'm');
  const match = body.match(rx);
  return cleanSection(match?.[1] || '');
};

const fail = (reasons) => {
  print([
    'Superagent Task Gate: FAIL',
    'Task definition is incomplete or inconsistent.',
    '',
    'Problems:',
    ...reasons.map((line) => `- ${line}`),
    '',
    'Required sections:',
    '- Summary',
    '- Active Agents',
    '- Event / Status Trigger',
    '- Risk Level (exactly one checked)',
    '- Validation (at least one checked)',
  ]);
  process.exitCode = 1;
};

if (!isCi || !eventPath || !existsSync(eventPath)) {
  print([
    'Superagent Task Gate: SKIP (local/non-CI)',
    'No GitHub PR event payload available.',
  ]);
  process.exitCode = args.has('--strict-local') ? 1 : 0;
} else {
  let payload = {};
  try {
    payload = JSON.parse(readFileSync(eventPath, 'utf8'));
  } catch {
    fail(['Could not parse GITHUB_EVENT_PATH JSON.']);
  }

  if (eventName !== 'pull_request' && eventName !== 'pull_request_target') {
    print([`Superagent Task Gate: SKIP (${eventName})`]);
    process.exitCode = 0;
  } else {
    const pr = payload.pull_request || {};
    const bodyRaw = String(pr.body || '');
    const body = bodyRaw.replace(/\r/g, '');

    const summary = getSection(body, 'Summary');
    const activeAgents = getSection(body, 'Active Agents');
    const trigger = getSection(body, 'Event / Status Trigger');
    const risk = getSection(body, 'Risk Level');
    const validation = getSection(body, 'Validation');

    const problems = [];

    if (!summary || summary.length < 15) {
      problems.push('Summary is missing or too short.');
    }

    const mentionedAgents = [...allowedAgents].filter((agent) => new RegExp(`\\b${agent}\\b`, 'i').test(activeAgents));
    if (!activeAgents || mentionedAgents.length === 0) {
      problems.push('Active Agents section must mention at least one allowed superagent.');
    }

    if (!trigger || trigger.length < 12) {
      problems.push('Event / Status Trigger is missing or too short.');
    }

    const riskChecked = [
      /-\s+\[[xX]\]\s+low\b/.test(risk),
      /-\s+\[[xX]\]\s+medium\b/.test(risk),
      /-\s+\[[xX]\]\s+high\b/.test(risk),
    ].filter(Boolean).length;
    if (riskChecked !== 1) {
      problems.push('Risk Level must have exactly one checked option (low/medium/high).');
    }

    const validationChecked = (validation.match(/-\s+\[[xX]\]\s+/g) || []).length;
    if (validationChecked < 1) {
      problems.push('Validation must have at least one checked item.');
    }

    if (problems.length) {
      fail(problems);
    } else {
      print([
        'Superagent Task Gate: PASS',
        `Active agents: ${mentionedAgents.join(', ')}`,
        `Risk checks: ${riskChecked}`,
        `Validation checks: ${validationChecked}`,
      ]);
      process.exitCode = 0;
    }
  }
}
