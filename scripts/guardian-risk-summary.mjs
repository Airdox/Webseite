#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const argSet = new Set(args);
const generatedAt = new Date().toISOString();

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  return {
    command: [command, ...commandArgs].join(' '),
    ok: result.status === 0,
    exitCode: Number(result.status ?? 1),
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
};

const npmRun = (scriptName, scriptArgs = []) => {
  const npmExecPath = process.env.npm_execpath || '';
  if (npmExecPath) return run(process.execPath, [npmExecPath, 'run', scriptName, '--', ...scriptArgs]);
  return run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', scriptName, '--', ...scriptArgs]);
};

const readJson = (filePath) => {
  try {
    return JSON.parse(readFileSync(join(root, filePath), 'utf8'));
  } catch {
    return null;
  }
};

const gitChangedFiles = () => {
  try {
    return execFileSync('git', ['status', '--short'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).trim() || line.trim());
  } catch {
    return [];
  }
};

const criticalPatterns = [
  /^package(-lock)?\.json$/,
  /^src\/server\//,
  /^desktop\//,
  /^scripts\//,
  /^\.github\/workflows\//,
  /^docs\/agent-system\/job-catalog\.json$/,
];

const changedFiles = gitChangedFiles().map((filePath) => filePath.replaceAll('\\', '/'));
const criticalFiles = changedFiles.filter((filePath) => criticalPatterns.some((pattern) => pattern.test(filePath)));
const blockers = [];
const warnings = [];

const jobValidation = npmRun('agent:jobs:validate', ['--strict-warnings']);
if (!jobValidation.ok) blockers.push('Agent job catalog validation failed.');

const routing = npmRun('agent:route', ['--json']);
let routingReport = null;
try {
  routingReport = JSON.parse(routing.stdout.slice(routing.stdout.indexOf('{')));
} catch {
  warnings.push('Agent routing report could not be parsed.');
}
if (!routing.ok) blockers.push('Agent routing failed.');

const auditPath = 'docs/agent-system/latest-audit.json';
const latestAudit = existsSync(join(root, auditPath)) ? readJson(auditPath) : null;
const auditScore = Number(latestAudit?.summary?.averageScore ?? latestAudit?.averageScore ?? 0);
if (latestAudit && auditScore > 0 && auditScore < 80) blockers.push(`Latest agent audit score is low (${auditScore}).`);
if (!latestAudit) warnings.push('No latest agent audit report found; run npm run agent:audit:write.');

if (changedFiles.length > 20) warnings.push(`${changedFiles.length} uncommitted paths are present; review scope before release.`);
if (criticalFiles.length > 0) warnings.push(`${criticalFiles.length} critical-path files changed: ${criticalFiles.slice(0, 8).join(', ')}${criticalFiles.length > 8 ? ', ...' : ''}`);
if ((routingReport?.assignments || []).some((entry) => entry.agent === 'Master Controller')) warnings.push('Master Controller review is recommended by routing.');

const riskLevel = blockers.length > 0
  ? 'high'
  : (criticalFiles.length > 0 || warnings.length > 0 ? 'medium' : 'low');

const report = {
  generatedAt,
  riskLevel,
  ok: blockers.length === 0,
  blockers,
  warnings,
  changedFileCount: changedFiles.length,
  criticalFiles,
  checks: {
    jobValidation: {
      ok: jobValidation.ok,
      exitCode: jobValidation.exitCode,
    },
    routing: {
      ok: routing.ok,
      assignmentCount: routingReport?.assignments?.length ?? 0,
      recommendedGates: routingReport?.recommendedGates || [],
    },
    latestAudit: latestAudit ? {
      available: true,
      score: auditScore || null,
    } : {
      available: false,
    },
  },
};

const lines = [
  '# AIRDOX Guardian Risk Summary',
  '',
  `Generated: ${generatedAt}`,
  `Risk: ${riskLevel.toUpperCase()}`,
  `Blockers: ${blockers.length}`,
  `Warnings: ${warnings.length}`,
  '',
  '## Blockers',
  '',
  ...(blockers.length ? blockers.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Warnings',
  '',
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Recommended Gates',
  '',
  ...((report.checks.routing.recommendedGates || []).length ? report.checks.routing.recommendedGates.map((gate) => `- \`${gate}\``) : ['- None']),
  '',
];

if (argSet.has('--write')) {
  const outDir = join(root, 'docs', 'agent-system');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'latest-guardian-risk-summary.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, 'latest-guardian-risk-summary.md'), `${lines.join('\n')}\n`);
}

if (argSet.has('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write([
    'Guardian Risk Summary: DONE',
    `Risk: ${riskLevel.toUpperCase()}`,
    `Blockers: ${blockers.length}`,
    `Warnings: ${warnings.length}`,
    argSet.has('--write') ? 'Reports: docs/agent-system/latest-guardian-risk-summary.{json,md}' : '',
  ].filter(Boolean).join('\n'));
  process.stdout.write('\n');
}

if (argSet.has('--strict') && blockers.length > 0) {
  process.exitCode = 1;
}
