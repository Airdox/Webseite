#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const generatedAt = new Date().toISOString();
const outDir = join(root, 'docs', 'agent-system');
const reportJsonPath = join(outDir, 'latest-agent-quality-chain.json');
const reportMdPath = join(outDir, 'latest-agent-quality-chain.md');

const normalize = (value) => String(value || '').replaceAll('\\', '/').replace(/^\.\//, '');

const getChangedFiles = () => {
  try {
    const output = execFileSync('git', ['status', '--short'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.split(/\r?\n/)
      .map((line) => normalize(line.slice(3).trim() || line.trim()))
      .filter(Boolean);
  } catch {
    return [];
  }
};

const readJson = (filePath, fallback = null) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const changedFiles = getChangedFiles();
const routing = readJson(join(outDir, 'latest-agent-routing.json'), {});
const testFiles = changedFiles.filter((file) => (
  /(^|\/)(__tests__|tests|e2e)\//.test(file)
  || /\.(test|spec)\.(js|jsx|mjs|ts|tsx)$/.test(file)
));

const fileExists = (file) => existsSync(join(root, file));
const diffFor = (file) => {
  try {
    return execFileSync('git', ['diff', '--', file], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024,
    });
  } catch {
    return '';
  }
};

const isWebsiteUi = (file) => (
  /^src\/components\/.*\.(jsx|js|css)$/.test(file)
  || /^src\/styles\/.*\.css$/.test(file)
  || file === 'src/App.jsx'
);

const isDesktopUi = (file) => (
  /^src\/desktop\/.*\.(jsx|js|css)$/.test(file)
  || /^desktop\/.*\.(js|cjs|mjs|html|css)$/.test(file)
  || file === 'desktop.html'
);

const isServerOrScript = (file) => (
  /^src\/server\//.test(file)
  || /^scripts\/.*\.(mjs|js|ps1)$/.test(file)
  || /^desktop\/main\//.test(file)
);

const isUserFacing = (file) => {
  const diff = diffFor(file);
  return /(menu|nav|navigation|route|tab|section|button|modal|dialog|player|booking|newsletter|vip|setcard|designagent)/i.test(`${file}\n${diff}`);
};

const expectedNearbyTests = (file) => {
  if (/^src\/desktop\//.test(file)) {
    return [
      'src/desktop/__tests__/DesktopApp.test.jsx',
      'src/desktop/__tests__/DesktopControls.test.jsx',
      'e2e/desktop-flightdeck.spec.js',
    ];
  }
  if (/^src\/components\//.test(file)) {
    return [
      'src/components/__tests__',
      'src/__tests__',
      'e2e',
    ];
  }
  if (/^scripts\//.test(file)) {
    return [
      'scripts',
      'src/desktop/__tests__',
      'docs/agent-system/latest-job-run.md',
    ];
  }
  return [];
};

const buildObligations = () => {
  const obligations = [];

  const websiteFiles = changedFiles.filter(isWebsiteUi);
  if (websiteFiles.length) {
    obligations.push({
      id: 'website-ui-quality-chain',
      owner: 'Webbie',
      qaAgent: 'Guardian',
      designAgent: 'Designer',
      status: testFiles.length ? 'test_changes_present' : 'tests_required',
      scope: websiteFiles,
      reason: 'Website/UI files changed; user-facing behavior must not rely on manual inspection only.',
      requiredGates: ['npm run lint', 'npm run test -- --run', 'npm run build'],
      requiredFollowUp: testFiles.length
        ? 'Guardian must verify that changed tests cover the changed UI path.'
        : 'Guardian must ask Webbie for tests or add focused tests before release-ready status.',
      userTouchpoint: 'Only ask user if expected behavior or content is ambiguous.',
    });
  }

  const desktopFiles = changedFiles.filter(isDesktopUi);
  if (desktopFiles.length) {
    obligations.push({
      id: 'desktop-ui-quality-chain',
      owner: 'Winnie',
      qaAgent: 'Guardian',
      designAgent: 'Designer',
      status: testFiles.length ? 'test_changes_present' : 'tests_required',
      scope: desktopFiles,
      reason: 'Desktop/Flight Deck UI changed; logic tests and, for visible changes, E2E proof must follow.',
      requiredGates: ['npm run desktop:test:logic', 'npm run desktop:test:e2e'],
      requiredFollowUp: testFiles.length
        ? 'Guardian must verify that Desktop tests cover the changed tab/menu/control behavior.'
        : 'Guardian must ask Winnie for focused Desktop tests before release-ready status.',
      userTouchpoint: 'Only ask user if workflow intent or acceptance criteria are unclear.',
    });
  }

  const scriptFiles = changedFiles.filter(isServerOrScript);
  if (scriptFiles.length) {
    obligations.push({
      id: 'script-api-quality-chain',
      owner: 'Guardian',
      qaAgent: 'Guardian',
      designAgent: '',
      status: testFiles.length ? 'test_changes_present' : 'validation_required',
      scope: scriptFiles,
      reason: 'Scripts/server/desktop main logic changed; command validation or tests must prove behavior.',
      requiredGates: ['npm run agent:jobs:validate', 'npm run agent:audit -- --strict'],
      requiredFollowUp: 'Guardian must run or request the narrow command that proves the changed script path.',
      userTouchpoint: 'Only ask user for credentials or live-system approval if a validation needs external access.',
    });
  }

  const userFacingFiles = changedFiles.filter(isUserFacing);
  if (userFacingFiles.length) {
    obligations.push({
      id: 'user-facing-change-watch',
      owner: 'Master Controller',
      qaAgent: 'Guardian',
      designAgent: 'Designer',
      status: 'watch',
      scope: userFacingFiles,
      reason: 'A menu, navigation, tab, section, button, modal, or visible feature may have changed.',
      requiredGates: ['route-specific test', 'visual/safe-area review when visible'],
      requiredFollowUp: 'Responsible primary agent must confirm tests exist for the new entry point and failure path.',
      userTouchpoint: 'Ask user for acceptance only after a working preview or clear behavior summary exists.',
    });
  }

  return obligations;
};

const obligations = buildObligations();
const alerts = obligations
  .filter((item) => ['tests_required', 'validation_required', 'watch'].includes(item.status))
  .map((item) => ({
    id: item.id,
    owner: item.owner,
    qaAgent: item.qaAgent,
    severity: item.status === 'tests_required' ? 'action' : 'info',
    message: item.requiredFollowUp,
  }));

const report = {
  generatedAt,
  controller: 'Master Controller',
  job: 'agent-quality-chain',
  purpose: 'Turn changed code into explicit test, validation, and owner follow-up obligations.',
  changedFileCount: changedFiles.length,
  changedFiles,
  routingAssignments: Array.isArray(routing?.assignments) ? routing.assignments : [],
  testFiles,
  obligations: obligations.map((item) => ({
    ...item,
    expectedNearbyTests: [...new Set(item.scope.flatMap(expectedNearbyTests))],
  })),
  alerts,
};

const renderMarkdown = () => {
  const lines = [
    '# AIRDOX Agent Quality Chain',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    `- Changed files: ${changedFiles.length}`,
    `- Test files changed: ${testFiles.length}`,
    `- Obligations: ${obligations.length}`,
    `- Alerts: ${alerts.length}`,
    '',
    '## Obligations',
    '',
    '| ID | Owner | QA | Status | Required Follow-Up | Gates |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.obligations.map((item) => `| ${item.id} | ${item.owner} | ${item.qaAgent || '-'} | ${item.status} | ${item.requiredFollowUp} | ${item.requiredGates.map((gate) => `\`${gate}\``).join('<br>')} |`),
    '',
    '## Changed Test Files',
    '',
    ...(testFiles.length ? testFiles.map((file) => `- ${file}`) : ['- None']),
    '',
    '## Alerts',
    '',
    ...(alerts.length ? alerts.map((alert) => `- ${alert.severity}: ${alert.owner} -> ${alert.qaAgent}: ${alert.message}`) : ['- None']),
    '',
  ];
  return `${lines.join('\n')}\n`;
};

mkdirSync(dirname(reportJsonPath), { recursive: true });
writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(reportMdPath, renderMarkdown());

process.stdout.write([
  'Agent Quality Chain: DONE',
  `Changed files: ${changedFiles.length}`,
  `Obligations: ${obligations.length}`,
  `Alerts: ${alerts.length}`,
  'Report: docs/agent-system/latest-agent-quality-chain.md',
].join('\n'));
process.stdout.write('\n');
