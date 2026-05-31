#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const catalogPath = join(root, 'docs', 'agent-system', 'job-catalog.json');
const packagePath = join(root, 'package.json');

const allowedAgents = new Set([
  'Master Controller',
  'Webbie',
  'Winnie',
  'Guardian',
  'Manni',
  'Designer',
  'Mentor',
  'Deep Research',
  'Audience Intelligence',
  'Refactor',
  'Repository',
]);

const executionModes = new Set(['script', 'manual']);
const changeClasses = new Set(['non_gravierend', 'gravierend']);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const print = (lines) => {
  process.stdout.write(`${lines.join('\n')}\n`);
};

if (!existsSync(catalogPath)) {
  print([
    'Agent Job Validator: FAIL',
    'Missing file: docs/agent-system/job-catalog.json',
  ]);
  process.exitCode = 1;
} else {
  let parsed = null;
  let packageJson = null;

  try {
    parsed = JSON.parse(readFileSync(catalogPath, 'utf8'));
  } catch {
    print([
      'Agent Job Validator: FAIL',
      'job-catalog.json is not valid JSON.',
    ]);
    process.exitCode = 1;
  }

  if (existsSync(packagePath)) {
    try {
      packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    } catch {
      print([
        'Agent Job Validator: FAIL',
        'package.json is not valid JSON.',
      ]);
      process.exitCode = 1;
    }
  } else {
    print([
      'Agent Job Validator: FAIL',
      'Missing file: package.json',
    ]);
    process.exitCode = 1;
  }

  if (parsed && packageJson) {
    const problems = [];
    const warnings = [];
    const packageScripts = packageJson?.scripts && typeof packageJson.scripts === 'object'
      ? packageJson.scripts
      : {};

    if (parsed.controller !== 'Master Controller') {
      problems.push('controller must be "Master Controller".');
    }

    if (!Array.isArray(parsed.jobs) || parsed.jobs.length === 0) {
      problems.push('jobs must be a non-empty array.');
    }

    const ids = new Set();

    for (const [index, job] of (parsed.jobs || []).entries()) {
      const prefix = `jobs[${index}]`;
      const id = String(job?.id || '');
      const owner = String(job?.owner || '');
      const execution = String(job?.execution || '');
      const changeClass = String(job?.changeClass || '');
      const requiresMasterApproval = job?.requiresMasterApproval === true;
      const requiresUserApproval = job?.requiresUserApproval === true;
      const outputVisibility = String(job?.outputVisibility || '');

      if (!idPattern.test(id)) {
        problems.push(`${prefix}.id must use kebab-case and contain only [a-z0-9-].`);
      }
      if (ids.has(id)) {
        problems.push(`${prefix}.id "${id}" is duplicated.`);
      }
      ids.add(id);

      if (!allowedAgents.has(owner)) {
        problems.push(`${prefix}.owner "${owner}" is not an allowed agent name.`);
      }
      if (!executionModes.has(execution)) {
        problems.push(`${prefix}.execution must be "script" or "manual".`);
      }
      if (!changeClasses.has(changeClass)) {
        problems.push(`${prefix}.changeClass must be "non_gravierend" or "gravierend".`);
      }
      if (changeClass === 'gravierend' && !requiresMasterApproval) {
        problems.push(`${prefix} gravierend jobs must set requiresMasterApproval=true.`);
      }
      if (outputVisibility === 'external_live' && !requiresUserApproval) {
        problems.push(`${prefix} external_live jobs must set requiresUserApproval=true.`);
      }

      if (execution === 'script') {
        const script = String(job?.script || '');
        if (!script) {
          problems.push(`${prefix}.script is required for script jobs.`);
        } else if (!Object.prototype.hasOwnProperty.call(packageScripts, script)) {
          problems.push(`${prefix}.script "${script}" must exist in package.json scripts.`);
        }
        if (Array.isArray(job?.scriptArgs) === false) {
          problems.push(`${prefix}.scriptArgs must be an array when provided.`);
        }
      }

      if (execution === 'manual') {
        const protocol = String(job?.manualProtocol || '').trim();
        if (protocol.length < 12) {
          problems.push(`${prefix}.manualProtocol is required for manual jobs.`);
        }
      }

      const events = job?.trigger?.events;
      const statuses = job?.trigger?.statuses;
      if (!Array.isArray(events) || events.length === 0) {
        problems.push(`${prefix}.trigger.events must be a non-empty array.`);
      }
      if (!Array.isArray(statuses) || statuses.length === 0) {
        problems.push(`${prefix}.trigger.statuses must be a non-empty array.`);
      }

      if (job?.enabled === false) {
        warnings.push(`${prefix} (${id}) is disabled.`);
      }
    }

    if (problems.length > 0) {
      print([
        'Agent Job Validator: FAIL',
        ...problems.map((line) => `- ${line}`),
      ]);
      process.exitCode = 1;
    } else {
      const lines = [
        'Agent Job Validator: PASS',
        `Jobs checked: ${(parsed.jobs || []).length}`,
      ];
      if (warnings.length > 0) {
        lines.push(...warnings.map((line) => `WARN: ${line}`));
      }
      print(lines);
      if (args.has('--strict-warnings') && warnings.length > 0) {
        process.exitCode = 1;
      }
    }
  }
}
