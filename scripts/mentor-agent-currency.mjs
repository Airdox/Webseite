#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const generatedAt = new Date().toISOString();
const maxRunbookAgeDays = 45;
const timeoutMs = 12000;

const sources = [
  {
    agent: 'Webbie',
    domain: 'Frontend architecture and web performance',
    runbooks: ['docs/agent-system/AGENT_AUTOMATION_ROADMAP.md', 'docs/agent-system/OPERATING_MODEL.md'],
    urls: [
      'https://react.dev/',
      'https://vite.dev/guide/',
      'https://web.dev/articles',
      'https://developer.mozilla.org/en-US/docs/Web',
    ],
  },
  {
    agent: 'Designer',
    domain: 'Visual quality, accessibility, UX evidence',
    runbooks: ['docs/agent-system/AGENT_AUTOMATION_ROADMAP.md', 'docs/brand/AIRDOX_CORPORATE_DESIGN.md'],
    urls: [
      'https://www.w3.org/WAI/standards-guidelines/wcag/',
      'https://web.dev/learn/accessibility/',
      'https://web.dev/learn/performance/',
    ],
  },
  {
    agent: 'Winnie',
    domain: 'Windows desktop, Electron and local automation',
    runbooks: ['docs/WINDOWS_FLIGHTDECK.md', 'docs/FLIGHT_DECK_TUTORIAL.md'],
    urls: [
      'https://www.electronjs.org/docs/latest/',
      'https://playwright.dev/docs/intro',
      'https://learn.microsoft.com/en-us/windows/apps/',
    ],
  },
  {
    agent: 'Guardian',
    domain: 'Security, CI, runtime quality and risk',
    runbooks: ['docs/agent-system/MENTOR_LEARNING_LOOPS.md', 'docs/agent-system/REPOSITORY_GOVERNANCE.md'],
    urls: [
      'https://owasp.org/www-project-top-ten/',
      'https://docs.github.com/en/actions',
      'https://developers.cloudflare.com/workers/',
      'https://nodejs.org/en/learn/getting-started/security-best-practices',
    ],
  },
  {
    agent: 'Manni',
    domain: 'Growth, booking conversion and social platform practice',
    runbooks: ['docs/agent-system/MANNI_GROWTH_PLAYBOOK.md', 'docs/agent-system/AGENT_CONTINUOUS_LEARNING.md'],
    urls: [
      'https://ads.tiktok.com/business/creativecenter/',
      'https://creators.instagram.com/',
      'https://support.google.com/youtube/answer/10059070',
    ],
  },
  {
    agent: 'Repository',
    domain: 'Source control, GitHub governance and release hygiene',
    runbooks: ['docs/agent-system/REPOSITORY_GOVERNANCE.md'],
    urls: [
      'https://git-scm.com/docs',
      'https://docs.github.com/en/repositories',
      'https://docs.github.com/en/pull-requests',
    ],
  },
  {
    agent: 'Refactor',
    domain: 'Architecture simplification and maintainability',
    runbooks: ['docs/agent-system/REFACTOR_OPTIMIZATION_LOOP.md'],
    urls: [
      'https://martinfowler.com/refactoring/',
      'https://web.dev/articles/fast',
      'https://nodejs.org/en/learn/diagnostics',
    ],
  },
  {
    agent: 'Mentor',
    domain: 'Learning loops and agent improvement process',
    runbooks: ['docs/agent-system/MENTOR_LEARNING_LOOPS.md', 'docs/agent-system/AGENT_CONTINUOUS_LEARNING.md'],
    urls: [
      'https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows',
      'https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows',
    ],
  },
];

const read = (filePath) => {
  try {
    return readFileSync(join(root, filePath), 'utf8');
  } catch {
    return '';
  }
};

const fileAgeDays = (filePath) => {
  try {
    const stat = statSync(join(root, filePath));
    return Math.round((Date.now() - stat.mtimeMs) / 86400000);
  } catch {
    return null;
  }
};

const lastCommitIso = (filePath) => {
  try {
    const output = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return output || null;
  } catch {
    return null;
  }
};

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'AIRDOX-Agent-Currency-Mentor/1.0',
      },
    });
    return {
      url,
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      error: String(error?.name || error?.message || error),
    };
  } finally {
    clearTimeout(timer);
  }
};

const checkRunbookFreshness = (runbooks) => runbooks.map((filePath) => {
  const exists = existsSync(join(root, filePath));
  const ageDays = fileAgeDays(filePath);
  const committedAt = lastCommitIso(filePath);
  return {
    filePath,
    exists,
    ageDays,
    committedAt,
    fresh: exists && (ageDays === null || ageDays <= maxRunbookAgeDays),
  };
});

const main = async () => {
  const agentReports = [];

  for (const item of sources) {
    const runbooks = checkRunbookFreshness(item.runbooks);
    const sourceChecks = [];
    for (const url of item.urls) {
      sourceChecks.push(await fetchWithTimeout(url));
    }

    const missingRunbooks = runbooks.filter((entry) => !entry.exists);
    const staleRunbooks = runbooks.filter((entry) => entry.exists && entry.fresh === false);
    const failedSources = sourceChecks.filter((entry) => !entry.ok);
    const warnings = [];

    if (missingRunbooks.length) warnings.push(`${missingRunbooks.length} runbook(s) missing.`);
    if (staleRunbooks.length) warnings.push(`${staleRunbooks.length} runbook(s) older than ${maxRunbookAgeDays} days.`);
    if (failedSources.length) warnings.push(`${failedSources.length} source(s) unreachable or changed.`);

    agentReports.push({
      agent: item.agent,
      domain: item.domain,
      status: warnings.length ? 'warn' : 'pass',
      warnings,
      runbooks,
      sources: sourceChecks,
      nextActions: warnings.length
        ? [
            'Mentor reviews failed or stale items.',
            'Update the affected runbook or replace the source with a stronger primary source.',
            'If the gap caused a project defect, add a test or quality gate.',
          ]
        : [
            'Keep current cadence.',
            'Recheck on next scheduled Mentor currency run.',
          ],
    });
  }

  const warnCount = agentReports.filter((entry) => entry.status === 'warn').length;
  const report = {
    generatedAt,
    owner: 'Mentor',
    purpose: 'Agent source currency and continuous learning check',
    maxRunbookAgeDays,
    summary: {
      agentsChecked: agentReports.length,
      warnCount,
      passCount: agentReports.length - warnCount,
      status: warnCount ? 'warn' : 'pass',
    },
    agents: agentReports,
  };

  const lines = [
    '# AIRDOX Agent Currency Report',
    '',
    `Generated: ${generatedAt}`,
    'Owner: Mentor',
    `Status: ${report.summary.status}`,
    '',
    '## Summary',
    '',
    `- Agents checked: ${report.summary.agentsChecked}`,
    `- Pass: ${report.summary.passCount}`,
    `- Warn: ${report.summary.warnCount}`,
    '',
    '## Agents',
    '',
    '| Agent | Status | Domain | Warnings |',
    '| --- | --- | --- | --- |',
    ...agentReports.map((entry) => `| ${entry.agent} | ${entry.status.toUpperCase()} | ${entry.domain} | ${entry.warnings.join('<br>') || '-'} |`),
    '',
    '## Source Checks',
    '',
    ...agentReports.flatMap((entry) => [
      `### ${entry.agent}`,
      '',
      ...entry.sources.map((source) => `- ${source.ok ? 'PASS' : 'WARN'} ${source.url} (${source.status ?? source.error ?? 'no status'})`),
      '',
    ]),
  ];

  if (args.has('--write')) {
    const outDir = join(root, 'docs', 'agent-system');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'latest-agent-currency.json'), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(outDir, 'latest-agent-currency.md'), `${lines.join('\n')}\n`);
  }

  if (args.has('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write([
      'Mentor Agent Currency: DONE',
      `Status: ${report.summary.status.toUpperCase()}`,
      `Agents checked: ${report.summary.agentsChecked}`,
      `Warnings: ${report.summary.warnCount}`,
      args.has('--write') ? 'Reports: docs/agent-system/latest-agent-currency.{json,md}' : '',
    ].filter(Boolean).join('\n'));
    process.stdout.write('\n');
  }

  if (args.has('--strict') && warnCount > 0) {
    process.exitCode = 1;
  }
};

await main();
