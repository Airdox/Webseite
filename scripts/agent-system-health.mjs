#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldWrite = args.has('--write');
const now = new Date();
const generatedAt = now.toISOString();
const docsDir = join(root, 'docs', 'agent-system');

const readJson = (relativePath) => {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    return { ok: false, missing: true, data: null, path: relativePath };
  }
  try {
    return {
      ok: true,
      missing: false,
      data: JSON.parse(readFileSync(absolutePath, 'utf8')),
      path: relativePath,
    };
  } catch (error) {
    return {
      ok: false,
      missing: false,
      data: null,
      path: relativePath,
      error: String(error?.message || error),
    };
  }
};

const ageHours = (iso) => {
  const time = Date.parse(iso || '');
  if (!Number.isFinite(time)) return null;
  return Math.round(((now.getTime() - time) / 36_000) ) / 100;
};

const statusFromAge = (hours, warnAfter, failAfter) => {
  if (hours === null) return 'missing';
  if (hours > failAfter) return 'stale';
  if (hours > warnAfter) return 'aging';
  return 'fresh';
};

const catalog = readJson('docs/agent-system/job-catalog.json');
const routing = readJson('docs/agent-system/agent-routing-rules.json');
const jobRun = readJson('docs/agent-system/latest-job-run.json');
const background = readJson('docs/agent-system/latest-background-cycle.json');
const audit = readJson('docs/agent-system/latest-audit.json');
const dependency = readJson('docs/agent-system/latest-agent-dependency-radar.json');
const queue = readJson('docs/agent-system/latest-agent-task-queue.json');
const packageJson = readJson('package.json');

const packageScripts = packageJson.ok && packageJson.data?.scripts
  ? packageJson.data.scripts
  : {};

const jobs = catalog.ok && Array.isArray(catalog.data.jobs) ? catalog.data.jobs : [];
const scriptJobs = jobs.filter((job) => job.execution === 'script');
const manualJobs = jobs.filter((job) => job.execution === 'manual');
const liveJobs = jobs.filter((job) => job.outputVisibility === 'external_live');
const missingScripts = scriptJobs
  .filter((job) => !Object.prototype.hasOwnProperty.call(packageScripts, job.script))
  .map((job) => ({ id: job.id, script: job.script }));

const reports = [
  {
    id: 'background-cycle',
    path: 'docs/agent-system/latest-background-cycle.json',
    generatedAt: background.data?.summary?.generatedAt || background.data?.generatedAt,
    warnAfterHours: 12,
    failAfterHours: 30,
  },
  {
    id: 'job-run',
    path: 'docs/agent-system/latest-job-run.json',
    generatedAt: jobRun.data?.generatedAt,
    warnAfterHours: 12,
    failAfterHours: 30,
  },
  {
    id: 'audit',
    path: 'docs/agent-system/latest-audit.json',
    generatedAt: audit.data?.generatedAt,
    warnAfterHours: 24,
    failAfterHours: 72,
  },
  {
    id: 'dependency-radar',
    path: 'docs/agent-system/latest-agent-dependency-radar.json',
    generatedAt: dependency.data?.generatedAt,
    warnAfterHours: 12,
    failAfterHours: 30,
  },
  {
    id: 'task-queue',
    path: 'docs/agent-system/latest-agent-task-queue.json',
    generatedAt: queue.data?.generatedAt,
    warnAfterHours: 168,
    failAfterHours: 336,
  },
].map((report) => {
  const hours = ageHours(report.generatedAt);
  return {
    ...report,
    ageHours: hours,
    status: statusFromAge(hours, report.warnAfterHours, report.failAfterHours),
  };
});

const workflowFiles = [
  '.github/workflows/agent-background-monitor.yml',
  '.github/workflows/agent-job-dispatch.yml',
];
const automation = {
  npmBackgroundScript: Boolean(packageScripts['agents:background:deep']),
  healthScript: Boolean(packageScripts['agent:system:health']),
  workflowFiles: workflowFiles.map((path) => ({ path, exists: existsSync(join(root, path)) })),
  windowsTaskInstaller: existsSync(join(root, 'scripts', 'register-agent-background-task.ps1')),
};

const alerts = [];
for (const report of reports) {
  if (report.status === 'missing') {
    alerts.push({
      severity: 'action',
      id: `${report.id}-missing`,
      message: `${report.id} has no readable timestamp.`,
      nextAction: `Run the producer for ${report.path}.`,
    });
  } else if (report.status === 'stale') {
    alerts.push({
      severity: 'action',
      id: `${report.id}-stale`,
      message: `${report.id} is stale (${report.ageHours}h old).`,
      nextAction: 'Run npm run agents:background:deep and inspect failed steps.',
    });
  } else if (report.status === 'aging') {
    alerts.push({
      severity: 'watch',
      id: `${report.id}-aging`,
      message: `${report.id} is aging (${report.ageHours}h old).`,
      nextAction: 'Let the next scheduled background cycle refresh it.',
    });
  }
}

for (const file of automation.workflowFiles) {
  if (!file.exists) {
    alerts.push({
      severity: 'action',
      id: `workflow-missing-${file.path.split('/').pop()}`,
      message: `${file.path} is missing.`,
      nextAction: 'Create the workflow or install a local scheduled task.',
    });
  }
}

if (missingScripts.length > 0) {
  alerts.push({
    severity: 'action',
    id: 'catalog-script-mismatch',
    message: `${missingScripts.length} script job(s) reference missing package scripts.`,
    nextAction: 'Fix package.json scripts or job-catalog.json.',
  });
}

const diagram = `flowchart TD
  User[User Auftrag / Freigabe] --> MC[Master Controller]
  MC --> Catalog[Job Catalog]
  MC --> Router[Routing Rules]
  Router --> Wakeup[Workbench Wakeup]
  Wakeup --> Webbie
  Wakeup --> Winnie
  Wakeup --> Guardian
  Wakeup --> Manni
  Wakeup --> Designer
  Wakeup --> Mentor
  Wakeup --> Research[Deep Research]
  Wakeup --> Repository
  Catalog --> Runner[Agent Job Runner]
  Runner --> Reports[latest-*.json/md]
  Reports --> Radar[Dependency Radar]
  Radar --> Queue[Task Queue]
  Queue --> MC
  Guardian --> Gates[Quality Gates]
  Manni --> Drafts[External Drafts]
  Drafts --> Approval[Personal User OK]
  Approval --> Live[External Live Action]
  Live -. blocked without OK .-> Approval
  Scheduler[GitHub Schedule / Windows Task] --> Background[Background Cycle]
  Background --> Runner
  Background --> Health[System Health]
  Health --> MC`;

const report = {
  generatedAt,
  controller: 'Master Controller',
  job: 'agent-system-health',
  summary: {
    ok: alerts.filter((alert) => alert.severity === 'action').length === 0,
    jobCount: jobs.length,
    scriptJobCount: scriptJobs.length,
    manualJobCount: manualJobs.length,
    externalLiveJobCount: liveJobs.length,
    reportCount: reports.length,
    staleReportCount: reports.filter((reportItem) => reportItem.status === 'stale').length,
    alertCount: alerts.length,
  },
  automation,
  reports,
  catalog: {
    readable: catalog.ok,
    missingScripts,
  },
  routing: {
    readable: routing.ok,
    ruleCount: Array.isArray(routing.data?.rules) ? routing.data.rules.length : 0,
  },
  diagram,
  alerts,
};

const renderMarkdown = () => [
  '# AIRDOX Agent System Health',
  '',
  `Generated: ${generatedAt}`,
  '',
  '## Summary',
  '',
  `- Status: ${report.summary.ok ? 'OK' : 'ACTION_REQUIRED'}`,
  `- Jobs: ${report.summary.jobCount} (${report.summary.scriptJobCount} script, ${report.summary.manualJobCount} manual)`,
  `- External live jobs gated: ${report.summary.externalLiveJobCount}`,
  `- Stale reports: ${report.summary.staleReportCount}`,
  `- Alerts: ${report.summary.alertCount}`,
  '',
  '## Architecture',
  '',
  '```mermaid',
  diagram,
  '```',
  '',
  '## Automation',
  '',
  `- npm background script: ${automation.npmBackgroundScript ? 'present' : 'missing'}`,
  `- health script: ${automation.healthScript ? 'present' : 'missing'}`,
  `- Windows task installer: ${automation.windowsTaskInstaller ? 'present' : 'missing'}`,
  ...automation.workflowFiles.map((file) => `- ${file.path}: ${file.exists ? 'present' : 'missing'}`),
  '',
  '## Reports',
  '',
  '| Report | Status | Age h | Path |',
  '| --- | --- | ---: | --- |',
  ...reports.map((item) => `| ${item.id} | ${item.status} | ${item.ageHours ?? 'n/a'} | ${item.path} |`),
  '',
  '## Alerts',
  '',
  ...(alerts.length
    ? alerts.map((alert) => `- ${alert.severity}: ${alert.message} Next: ${alert.nextAction}`)
    : ['- None']),
  '',
].join('\n');

const markdown = `${renderMarkdown()}\n`;

if (shouldWrite) {
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(join(docsDir, 'latest-agent-system-health.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(docsDir, 'latest-agent-system-health.md'), markdown);
  writeFileSync(join(docsDir, 'AGENT_SYSTEM_ARCHITECTURE.md'), markdown);
}

process.stdout.write([
  'Agent System Health: DONE',
  `Status: ${report.summary.ok ? 'OK' : 'ACTION_REQUIRED'}`,
  `Jobs: ${report.summary.jobCount}`,
  `Alerts: ${report.summary.alertCount}`,
  shouldWrite ? 'Report: docs/agent-system/latest-agent-system-health.md' : 'Run with --write to persist reports.',
].join('\n'));
process.stdout.write('\n');

if (args.has('--strict') && !report.summary.ok) {
  process.exitCode = 1;
}
