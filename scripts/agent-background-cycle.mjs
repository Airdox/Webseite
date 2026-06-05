#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const runDeep = args.has('--deep');
const generatedAt = new Date().toISOString();
const npmExecPath = process.env.npm_execpath || '';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const runStep = (name, command, commandArgs) => {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  const endedAt = new Date().toISOString();
  return {
    name,
    command: [command, ...commandArgs].join(' '),
    startedAt,
    endedAt,
    exitCode: Number(result.status ?? 1),
    ok: result.status === 0,
    error: result.error ? String(result.error.message || result.error) : '',
  };
};

const runNpmStep = (name, scriptName, scriptArgs = []) => {
  if (npmExecPath) {
    return runStep(name, process.execPath, [npmExecPath, 'run', scriptName, ...scriptArgs]);
  }
  return runStep(name, npmCommand, ['run', scriptName, ...scriptArgs]);
};

const steps = [
  runNpmStep('agent-jobs-validate', 'agent:jobs:validate'),
];

const jobStatus = runDeep ? 'deep' : 'standard';
steps.push(runNpmStep('agent-routing-review', 'agent:route:write'));
steps.push(runNpmStep('agent-quality-chain', 'agent:quality-chain:write'));
steps.push(runNpmStep('agent-jobs-run', 'agent:jobs:run', ['--', '--event=scheduled_background', `--status=${jobStatus}`, '--continue-on-error']));
steps.push(runNpmStep('agent-dependency-radar', 'agent:dependencies:write'));
steps.push(runNpmStep('agent-system-health', 'agent:system:health'));
steps.push(runStep('report-localization-de', process.execPath, ['scripts/localize-agent-reports.mjs']));

const failed = steps.filter((step) => !step.ok);
const summary = {
  generatedAt,
  mode: runDeep ? 'deep' : 'standard',
  totalSteps: steps.length,
  failedSteps: failed.length,
  ok: failed.length === 0,
};

const report = { summary, steps };

const outDir = join(root, 'docs', 'agent-system');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'latest-background-cycle.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);

if (!summary.ok) {
  process.exitCode = 1;
}
