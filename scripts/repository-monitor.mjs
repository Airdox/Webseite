#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const isCi = process.env.CI === 'true';
const baselinePath = join(root, 'docs/agent-system/repository-dirty-baseline.txt');

const runGit = (gitArgs) => {
  try {
    return execFileSync('git', gitArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const asLines = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const exists = (filePath) => existsSync(join(root, filePath));

const branch = process.env.GITHUB_HEAD_REF
  || process.env.GITHUB_REF_NAME
  || runGit(['branch', '--show-current'])
  || 'unknown';
const dirtyLines = asLines(runGit(['status', '--short']));
const baselineDirtyLines = existsSync(baselinePath)
  ? asLines(readFileSync(baselinePath, 'utf8'))
  : [];
const baselineDirtySet = new Set(baselineDirtyLines);
const unexpectedDirtyLines = dirtyLines.filter((line) => !baselineDirtySet.has(line));
const recentCommits = asLines(runGit(['log', '--oneline', '-n', '10']));

const trackedArtifacts = asLines(runGit([
  'ls-files',
  '.wrangler',
  'dist',
  'release',
  'playwright-report',
  'test-results',
  'build',
])).filter((line) => !line.endsWith('/'));
const allowedTrackedArtifacts = new Set(['build/icon.ico', 'build/icon.png']);
const trackedArtifactsForReview = trackedArtifacts.filter((line) => !allowedTrackedArtifacts.has(line));

const rootHtmlCopies = ['custom.html', 'live_index.html', 'page.html'].filter((filePath) => exists(filePath));
const requiredFiles = [
  'docs/agent-system/reports/operations/REPOSITORY_GOVERNANCE.md',
  '.github/workflows/web-quality.yml',
  'scripts/agent-audit.mjs',
];

const checks = [
  {
    id: 'branch-naming',
    level: /^(main|develop|feature\/|fix\/|hotfix\/|release\/|experiment\/)/.test(branch) ? 'pass' : 'warn',
    detail: `Aktueller Branch: ${branch}`,
  },
  {
    id: 'required-governance-files',
    level: requiredFiles.every((filePath) => exists(filePath)) ? 'pass' : 'fail',
    detail: `Gefundene Governance-Dateien: ${requiredFiles.filter((filePath) => exists(filePath)).length}/${requiredFiles.length}`,
  },
  {
    id: 'working-tree-cleanliness-total',
    level: dirtyLines.length === 0 ? 'pass' : 'warn',
    detail: `${dirtyLines.length} uncommitted Pfade insgesamt.`,
  },
  {
    id: 'working-tree-cleanliness',
    level: unexpectedDirtyLines.length === 0 ? 'pass' : (isCi ? 'fail' : 'warn'),
    detail: `${unexpectedDirtyLines.length} unerwartete uncommitted Pfade (${dirtyLines.length} gesamt, ${baselineDirtyLines.length} baseline)`,
  },
  {
    id: 'tracked-generated-artifacts',
    level: trackedArtifactsForReview.length === 0 ? 'pass' : 'warn',
    detail: `${trackedArtifactsForReview.length} potentiell generierte Artefaktpfade sind versioniert.`,
  },
  {
    id: 'root-html-duplication',
    level: rootHtmlCopies.length === 0 ? 'pass' : 'warn',
    detail: `${rootHtmlCopies.length} zusaetzliche Root-HTML-Dateien erkannt.`,
  },
];

const failures = checks.filter((check) => check.level === 'fail');
const warnings = checks.filter((check) => check.level === 'warn');

const report = {
  generatedAt,
  agent: 'Repository',
  repository: root,
  branch,
  summary: {
    checkCount: checks.length,
    failCount: failures.length,
    warnCount: warnings.length,
    dirtyPathCount: dirtyLines.length,
    unexpectedDirtyPathCount: unexpectedDirtyLines.length,
    baselineDirtyPathCount: baselineDirtyLines.length,
    trackedArtifactCount: trackedArtifacts.length,
    trackedArtifactReviewCount: trackedArtifactsForReview.length,
  },
  checks,
  dirtyLines,
  unexpectedDirtyLines,
  baselineDirtyLines,
  trackedArtifacts,
  trackedArtifactsForReview,
  allowedTrackedArtifacts: [...allowedTrackedArtifacts],
  rootHtmlCopies,
  recentCommits,
};

const renderMarkdown = () => {
  const lines = [
    '# AIRDOX Repository Monitor',
    '',
    `Generated: ${generatedAt}`,
    'Agent: Repository',
    `Repository: ${root}`,
    `Branch: ${branch}`,
    '',
    '## Summary',
    '',
    `- Checks: ${report.summary.checkCount}`,
    `- Failures: ${report.summary.failCount}`,
    `- Warnings: ${report.summary.warnCount}`,
    `- Uncommitted paths: ${report.summary.dirtyPathCount}`,
    `- Unexpected uncommitted paths: ${report.summary.unexpectedDirtyPathCount}`,
    `- Baseline uncommitted paths: ${report.summary.baselineDirtyPathCount}`,
    `- Tracked generated artifacts (review): ${report.summary.trackedArtifactReviewCount}`,
    '',
    '## Checks',
    '',
    '| Check | Level | Detail |',
    '| --- | --- | --- |',
    ...checks.map((check) => `| ${check.id} | ${check.level.toUpperCase()} | ${check.detail} |`),
    '',
    '## Unexpected Dirty Paths',
    '',
    ...(unexpectedDirtyLines.length ? unexpectedDirtyLines.map((line) => `- ${line}`) : ['- none']),
    '',
    '## Dirty Baseline Paths',
    '',
    ...(baselineDirtyLines.length ? baselineDirtyLines.map((line) => `- ${line}`) : ['- none']),
    '',
    '## All Dirty Paths',
    '',
    ...(dirtyLines.length ? dirtyLines.map((line) => `- ${line}`) : ['- none']),
    '',
    '## Tracked Generated Artifacts',
    '',
    ...(trackedArtifacts.length ? trackedArtifacts.map((line) => `- ${line}`) : ['- none']),
    '',
    '## Recent Commits',
    '',
    ...(recentCommits.length ? recentCommits.map((line) => `- ${line}`) : ['- none']),
    '',
  ];

  return `${lines.join('\n')}\n`;
};

const renderConsole = () => {
  const lines = [
    `AIRDOX Repository Monitor (${generatedAt})`,
    `Agent: Repository`,
    `Branch: ${branch}`,
    `Checks: ${report.summary.checkCount} | Failures: ${report.summary.failCount} | Warnings: ${report.summary.warnCount}`,
    `Uncommitted paths: ${report.summary.dirtyPathCount} (unexpected: ${report.summary.unexpectedDirtyPathCount})`,
    `Tracked generated artifacts: ${report.summary.trackedArtifactCount}`,
  ];

  if (failures.length) {
    lines.push('', 'Failures:');
    lines.push(...failures.map((item) => `- ${item.id}: ${item.detail}`));
  }
  if (warnings.length) {
    lines.push('', 'Warnings:');
    lines.push(...warnings.map((item) => `- ${item.id}: ${item.detail}`));
  }

  lines.push('', 'Run with --write to persist docs/agent-system/latest-repository-monitor.*');
  return `${lines.join('\n')}\n`;
};

if (args.has('--write')) {
  const outDir = join(root, 'docs/agent-system');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'latest-repository-monitor.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, 'latest-repository-monitor.md'), renderMarkdown());
}

if (args.has('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(renderConsole());
}

if (args.has('--strict') && failures.length > 0) {
  process.exitCode = 1;
}

if (args.has('--strict-warnings') && (failures.length > 0 || warnings.length > 0)) {
  process.exitCode = 1;
}
