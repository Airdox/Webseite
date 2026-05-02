#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const argSet = new Set(args);
const generatedAt = new Date().toISOString();
const catalogPath = join(root, 'docs', 'agent-system', 'job-catalog.json');

const getArgValue = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  if (!raw) return fallback;
  return raw.slice(prefix.length).trim();
};

const eventName = getArgValue('--event', 'manual_background');
const statusName = getArgValue('--status', 'standard');
const approvedList = getArgValue('--approved', '');
const approvedJobs = new Set(approvedList.split(',').map((item) => item.trim()).filter(Boolean));

const runNpm = (scriptName, scriptArgs = []) => {
  const npmExecPath = process.env.npm_execpath || '';
  const command = npmExecPath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
  const cmdArgs = npmExecPath
    ? [npmExecPath, 'run', scriptName, '--', ...scriptArgs]
    : ['run', scriptName, '--', ...scriptArgs];

  const startedAt = new Date().toISOString();
  const result = spawnSync(command, cmdArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  const endedAt = new Date().toISOString();

  return {
    startedAt,
    endedAt,
    command: [command, ...cmdArgs].join(' '),
    ok: result.status === 0,
    exitCode: Number(result.status ?? 1),
    error: result.error ? String(result.error.message || result.error) : '',
  };
};

const renderMarkdown = (report) => {
  const lines = [
    '# AIRDOX Agent Job Run',
    '',
    `Generated: ${generatedAt}`,
    `Event: ${eventName}`,
    `Status: ${statusName}`,
    '',
    '## Summary',
    '',
    `- Selected jobs: ${report.summary.selectedJobCount}`,
    `- Executed jobs: ${report.summary.executedJobCount}`,
    `- Manual jobs: ${report.summary.manualJobCount}`,
    `- Skipped jobs: ${report.summary.skippedJobCount}`,
    `- Failed jobs: ${report.summary.failedJobCount}`,
    '',
    '## Jobs',
    '',
    '| Job | Agent | Result | Detail |',
    '| --- | --- | --- | --- |',
    ...report.jobs.map((entry) => `| ${entry.id} | ${entry.owner} | ${entry.result.toUpperCase()} | ${entry.detail} |`),
    '',
  ];
  return `${lines.join('\n')}\n`;
};

if (!existsSync(catalogPath)) {
  process.stdout.write('Agent Job Runner: FAIL\nMissing docs/agent-system/job-catalog.json\n');
  process.exitCode = 1;
} else {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const jobs = Array.isArray(catalog.jobs) ? catalog.jobs : [];

  const selectedJobs = jobs.filter((job) => (
    job?.enabled === true
    && Array.isArray(job?.trigger?.events)
    && job.trigger.events.includes(eventName)
    && Array.isArray(job?.trigger?.statuses)
    && job.trigger.statuses.includes(statusName)
  ));

  const results = [];

  for (const job of selectedJobs) {
    const base = {
      id: String(job.id || ''),
      owner: String(job.owner || ''),
    };

    if (job.changeClass === 'gravierend' && job.requiresMasterApproval === true && !approvedJobs.has(job.id)) {
      results.push({
        ...base,
        result: 'skipped',
        detail: 'Master Controller approval required.',
      });
      continue;
    }

    if (job.execution === 'manual') {
      results.push({
        ...base,
        result: 'manual',
        detail: String(job.manualProtocol || 'Manual protocol required.'),
      });
      continue;
    }

    if (job.execution !== 'script') {
      results.push({
        ...base,
        result: 'failed',
        detail: `Unsupported execution mode: ${String(job.execution || 'undefined')}`,
      });
      continue;
    }

    const scriptName = String(job.script || '').trim();
    if (!scriptName) {
      results.push({
        ...base,
        result: 'failed',
        detail: 'Missing script name for script execution.',
      });
      continue;
    }

    const scriptArgs = Array.isArray(job.scriptArgs)
      ? job.scriptArgs.map((item) => String(item))
      : [];

    const run = runNpm(scriptName, scriptArgs);
    results.push({
      ...base,
      result: run.ok ? 'executed' : 'failed',
      detail: run.ok ? `ok (${scriptName})` : `exit ${run.exitCode} (${scriptName})`,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      command: run.command,
      exitCode: run.exitCode,
      error: run.error,
    });

    if (!run.ok && !argSet.has('--continue-on-error')) {
      break;
    }
  }

  const summary = {
    selectedJobCount: selectedJobs.length,
    executedJobCount: results.filter((entry) => entry.result === 'executed').length,
    manualJobCount: results.filter((entry) => entry.result === 'manual').length,
    skippedJobCount: results.filter((entry) => entry.result === 'skipped').length,
    failedJobCount: results.filter((entry) => entry.result === 'failed').length,
  };

  const report = {
    generatedAt,
    controller: 'Master Controller',
    event: eventName,
    status: statusName,
    summary,
    jobs: results,
  };

  const outDir = join(root, 'docs', 'agent-system');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'latest-job-run.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, 'latest-job-run.md'), renderMarkdown(report));

  process.stdout.write([
    'Agent Job Runner: DONE',
    `Event: ${eventName}`,
    `Status: ${statusName}`,
    `Selected jobs: ${summary.selectedJobCount}`,
    `Executed: ${summary.executedJobCount}, Manual: ${summary.manualJobCount}, Skipped: ${summary.skippedJobCount}, Failed: ${summary.failedJobCount}`,
    'Run log: docs/agent-system/latest-job-run.json',
  ].join('\n'));
  process.stdout.write('\n');

  if (summary.failedJobCount > 0) {
    process.exitCode = 1;
  }
}
