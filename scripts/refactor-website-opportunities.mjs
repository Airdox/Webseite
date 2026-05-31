#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = process.cwd();
const generatedAt = new Date().toISOString();
const outJson = join(root, 'docs', 'agent-system', 'latest-refactor-website-opportunities.json');
const outMd = join(root, 'docs', 'agent-system', 'latest-refactor-website-opportunities.md');

const sourceRoots = ['src/components', 'src/contexts', 'src/utils', 'src/lib', 'src/server'];
const sourceExtensions = new Set(['.js', '.jsx']);
const largeFileThreshold = 16000;

const toPosix = (filePath) => filePath.replaceAll('\\', '/');
const getExtension = (filePath) => filePath.slice(filePath.lastIndexOf('.'));

const walk = (dirPath, files = []) => {
  if (!existsSync(dirPath)) return files;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') walk(fullPath, files);
      continue;
    }
    if (sourceExtensions.has(getExtension(entry.name))) files.push(fullPath);
  }
  return files;
};

const sourceFiles = sourceRoots
  .flatMap((sourceRoot) => walk(join(root, sourceRoot)))
  .map((filePath) => {
    const text = readFileSync(filePath, 'utf8');
    return {
      path: toPosix(relative(root, filePath)),
      bytes: statSync(filePath).size,
      lines: text.split(/\r?\n/).length,
      fetchCount: (text.match(/\bfetch\s*\(/g) || []).length,
      apiBaseCount: (text.match(/API_BASE|STATS_API_BASE|AUDIO_API_BASE|PRODUCTION_URL|PRODUCTION_API_BASE/g) || []).length,
      localStorageCount: (text.match(/\blocalStorage\b/g) || []).length,
      eventCount: (text.match(/CustomEvent|addEventListener|dispatchEvent/g) || []).length,
    };
  });

const slug = (value) => value.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '');

const apiFiles = sourceFiles
  .filter((file) => file.fetchCount > 0 || file.apiBaseCount > 0)
  .filter((file) => (
    /src\/components\/(AuthModal|Newsletter|VIPSection|BookingSection)\.jsx/.test(file.path)
    || /src\/contexts\/AudioContext\.jsx/.test(file.path)
    || /src\/utils\/stats-sync\.js/.test(file.path)
  ))
  .sort((a, b) => (b.fetchCount + b.apiBaseCount) - (a.fetchCount + a.apiBaseCount));

const opportunities = [];

if (apiFiles.length >= 3) {
  opportunities.push({
    id: 'website-api-client-consolidation',
    priority: 'high',
    area: 'availability-and-functionality',
    files: apiFiles.map((file) => file.path),
    evidence: `${apiFiles.length} website service files contain fetch/base-url handling.`,
    action: 'Move base URL resolution and safe JSON/error reading into one small helper, then migrate one user flow at a time.',
    validation: 'Run the touched flow test plus npm run build. For visible flows, add desktop/mobile proof before release.',
  });
}

const audioStatsFiles = apiFiles.filter((file) => /AudioContext|stats-sync|MusicSection/.test(file.path));
if (audioStatsFiles.length >= 2) {
  opportunities.push({
    id: 'audio-stats-runtime-boundary',
    priority: 'high',
    area: 'analytics-integrity',
    files: audioStatsFiles.map((file) => file.path),
    evidence: 'Audio and stats runtime URL logic are split across playback and stats modules.',
    action: 'Keep localhost/production routing in a shared utility so local listening does not pollute production stats.',
    validation: 'Run AudioContext and MusicSection tests, then npm run build.',
  });
}

sourceFiles
  .filter((file) => file.bytes >= largeFileThreshold)
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 8)
  .forEach((file) => {
    opportunities.push({
      id: `large-file-${slug(file.path)}`,
      priority: file.bytes >= 30000 ? 'high' : 'medium',
      area: 'maintainability',
      files: [file.path],
      evidence: `${file.lines} lines / ${file.bytes} bytes.`,
      action: 'Extract only the next user-visible or service-flow subunit that can receive a focused test.',
      validation: 'Run the nearest component/unit test plus npm run build.',
    });
  });

sourceFiles
  .filter((file) => file.localStorageCount >= 2 || file.eventCount >= 3)
  .sort((a, b) => (b.localStorageCount + b.eventCount) - (a.localStorageCount + a.eventCount))
  .slice(0, 5)
  .forEach((file) => {
    opportunities.push({
      id: `state-contract-${slug(file.path)}`,
      priority: 'medium',
      area: 'state-contract',
      files: [file.path],
      evidence: `${file.localStorageCount} localStorage references, ${file.eventCount} event references.`,
      action: 'Document or extract the smallest event/storage contract before changing dependent UI.',
      validation: 'Run the nearest tests that assert event dispatch, cache update, or UI refresh behavior.',
    });
  });

const report = {
  generatedAt,
  controller: 'Master Controller',
  agent: 'Refactor',
  job: 'refactor-website-opportunities',
  purpose: 'Turn Refactor from passive review into small, measurable website improvements.',
  summary: {
    scannedFiles: sourceFiles.length,
    opportunityCount: opportunities.length,
    highPriorityCount: opportunities.filter((item) => item.priority === 'high').length,
  },
  rules: [
    'Availability, stability and functionality come before cleanup.',
    'Broad restructuring is allowed only with Master Controller approval, rollback note and quality gates.',
    'Each Refactor task must name before/after benefit and validation.',
    'Prefer one website flow at a time: music, booking, newsletter, VIP/auth, stats.',
  ],
  opportunities,
};

const markdown = [
  '# AIRDOX Refactor Website Opportunities',
  '',
  `Generated: ${generatedAt}`,
  'Agent: Refactor',
  '',
  '## Summary',
  '',
  `- Scanned source files: ${report.summary.scannedFiles}`,
  `- Opportunities: ${report.summary.opportunityCount}`,
  `- High priority: ${report.summary.highPriorityCount}`,
  '',
  '## Operating Rules',
  '',
  ...report.rules.map((rule) => `- ${rule}`),
  '',
  '## Opportunities',
  '',
  '| Priority | Area | ID | Evidence | Action | Validation | Files |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...opportunities.map((item) => `| ${item.priority} | ${item.area} | ${item.id} | ${item.evidence} | ${item.action} | ${item.validation} | ${item.files.join('<br>')} |`),
  '',
].join('\n');

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outMd, `${markdown}\n`);

process.stdout.write([
  'Refactor Website Opportunities: DONE',
  `Scanned files: ${report.summary.scannedFiles}`,
  `Opportunities: ${report.summary.opportunityCount}`,
  'Report: docs/agent-system/latest-refactor-website-opportunities.md',
].join('\n'));
process.stdout.write('\n');
