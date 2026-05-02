#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const isCi = process.env.CI === 'true';
const eventPath = process.env.GITHUB_EVENT_PATH || '';
const eventName = process.env.GITHUB_EVENT_NAME || '';

const PASS_LABEL = 'master-controller-approved';
const PASS_TOKEN = /MC-APPROVED:\s*YES/i;

const print = (lines) => {
  process.stdout.write(`${lines.join('\n')}\n`);
};

const fail = (message) => {
  print([
    'Master Controller Gate: FAIL',
    message,
    'Required:',
    `- PR label: ${PASS_LABEL}`,
    '- or PR body token: MC-APPROVED: YES',
  ]);
  process.exitCode = 1;
};

if (!isCi || !eventPath || !existsSync(eventPath)) {
  print([
    'Master Controller Gate: SKIP (local/non-CI)',
    'No GitHub PR event payload available.',
  ]);
  process.exitCode = args.has('--strict-local') ? 1 : 0;
} else {
  let payload = {};
  try {
    payload = JSON.parse(readFileSync(eventPath, 'utf8'));
  } catch {
    fail('Could not parse GITHUB_EVENT_PATH JSON.');
  }

  if (eventName !== 'pull_request' && eventName !== 'pull_request_target') {
    print([`Master Controller Gate: SKIP (${eventName})`]);
    process.exitCode = 0;
  } else {
    const pr = payload.pull_request || {};
    const body = String(pr.body || '');
    const labels = Array.isArray(pr.labels) ? pr.labels.map((entry) => String(entry.name || '').toLowerCase()) : [];
    const approvedByLabel = labels.includes(PASS_LABEL);
    const approvedByToken = PASS_TOKEN.test(body);

    if (approvedByLabel || approvedByToken) {
      print([
        'Master Controller Gate: PASS',
        `Approved via ${approvedByLabel ? `label "${PASS_LABEL}"` : 'PR body token "MC-APPROVED: YES"'}.`,
      ]);
      process.exitCode = 0;
    } else {
      fail('No Master Controller approval marker found in PR.');
    }
  }
}
