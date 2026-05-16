#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const argSet = new Set(args);
const generatedAt = new Date().toISOString();

const getArgValue = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};

const normalize = (value) => String(value || '').replaceAll('\\', '/').replace(/^.\//, '');
const readJson = (filePath) => JSON.parse(readFileSync(join(root, filePath), 'utf8'));

const globToRegExp = (pattern) => {
  const normalized = normalize(pattern);
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replaceAll('**', '::GLOBSTAR::').replaceAll('*', '[^/]*').replaceAll('::GLOBSTAR::', '.*')}$`);
};

const getChangedFiles = () => {
  const explicit = getArgValue('--files', '');
  if (explicit) return explicit.split(',').map(normalize).filter(Boolean);

  const base = getArgValue('--base', '');
  const commandArgs = base
    ? ['diff', '--name-only', `${base}...HEAD`]
    : ['status', '--short'];

  try {
    const output = execFileSync('git', commandArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (base) return output.split(/\r?\n/).map(normalize).filter(Boolean);
    return output.split(/\r?\n/)
      .map((line) => normalize(line.slice(3).trim() || line.trim()))
      .filter(Boolean);
  } catch {
    return [];
  }
};

const rulesPath = 'docs/agent-system/agent-routing-rules.json';
if (!existsSync(join(root, rulesPath))) {
  process.stdout.write(`Agent Routing: FAIL\nMissing ${rulesPath}\n`);
  process.exitCode = 1;
} else {
  const config = readJson(rulesPath);
  const files = getChangedFiles();
  const assignments = new Map();
  const gates = new Set();
  const unmatchedFiles = [];

  for (const filePath of files) {
    const matchedRules = (config.rules || []).filter((rule) => (
      (rule.paths || []).some((pattern) => globToRegExp(pattern).test(filePath))
    ));

    if (matchedRules.length === 0) {
      unmatchedFiles.push(filePath);
      for (const agent of config.defaultReviewAgents || []) {
        const key = `${agent}:review`;
        if (!assignments.has(key)) assignments.set(key, { agent, role: 'review', files: [], rules: [] });
        assignments.get(key).files.push(filePath);
      }
      continue;
    }

    for (const rule of matchedRules) {
      const key = `${rule.agent}:${rule.role || 'review'}`;
      if (!assignments.has(key)) {
        assignments.set(key, {
          agent: rule.agent,
          role: rule.role || 'review',
          files: [],
          rules: [],
        });
      }
      const entry = assignments.get(key);
      entry.files.push(filePath);
      if (!entry.rules.includes(rule.id)) entry.rules.push(rule.id);
      for (const gate of rule.recommendedGates || []) gates.add(gate);
    }
  }

  const report = {
    generatedAt,
    source: getArgValue('--base', '') ? 'git-diff' : 'git-status',
    changedFileCount: files.length,
    changedFiles: files,
    assignments: [...assignments.values()].map((entry) => ({
      ...entry,
      files: [...new Set(entry.files)].sort(),
      rules: entry.rules.sort(),
    })).sort((a, b) => a.agent.localeCompare(b.agent) || a.role.localeCompare(b.role)),
    unmatchedFiles,
    recommendedGates: [...gates].sort(),
  };

  const lines = [
    '# AIRDOX Agent Routing Report',
    '',
    `Generated: ${generatedAt}`,
    `Changed files: ${report.changedFileCount}`,
    '',
    '## Assignments',
    '',
    '| Agent | Role | Rules | Files |',
    '| --- | --- | --- | --- |',
    ...report.assignments.map((entry) => `| ${entry.agent} | ${entry.role} | ${entry.rules.join(', ') || '-'} | ${entry.files.join('<br>') || '-'} |`),
    '',
    '## Recommended Gates',
    '',
    ...(report.recommendedGates.length ? report.recommendedGates.map((gate) => `- \`${gate}\``) : ['- None']),
    '',
    '## Unmatched Files',
    '',
    ...(report.unmatchedFiles.length ? report.unmatchedFiles.map((filePath) => `- ${filePath}`) : ['- None']),
    '',
  ];

  if (argSet.has('--write')) {
    const outJson = join(root, 'docs', 'agent-system', 'latest-agent-routing.json');
    const outMd = join(root, 'docs', 'agent-system', 'latest-agent-routing.md');
    mkdirSync(dirname(outJson), { recursive: true });
    writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(outMd, `${lines.join('\n')}\n`);
  }

  if (argSet.has('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write([
      'Agent Routing: DONE',
      `Changed files: ${report.changedFileCount}`,
      `Assignments: ${report.assignments.length}`,
      `Recommended gates: ${report.recommendedGates.length}`,
      argSet.has('--write') ? 'Reports: docs/agent-system/latest-agent-routing.{json,md}' : '',
    ].filter(Boolean).join('\n'));
    process.stdout.write('\n');
  }
}
