#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const generatedAt = new Date().toISOString();

const normalize = (value = '') => String(value || '').replaceAll('\\', '/').replace(/^.\//, '');

const globToRegExp = (pattern) => {
  const normalized = normalize(pattern);
  const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replaceAll('**', '::GLOBSTAR::').replaceAll('*', '[^/]*').replaceAll('::GLOBSTAR::', '.*')}$`);
};

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

const matchesAny = (filePath, patterns) => patterns.some((pattern) => globToRegExp(pattern).test(filePath));

const knowledgePatterns = [
  'airdoX_wiki/SYSTEM.md',
  'airdoX_wiki/llm_interface.py',
  'airdoX_wiki/wiki/**',
  'src/desktop/lib/assistantKnowledge.js',
  'src/desktop/lib/assistantEngine.js',
  'src/desktop/lib/__tests__/assistantCoverage.test.js',
  'docs/agent-system/wiki-maintainer-todo.md',
];

const contentPatterns = [
  'README.md',
  'USER_GUIDE.md',
  'AUDIO_PLAYER_DOCS.md',
  'docs/**/*.md',
  'docs/**/*.json',
  'desktop/**',
  'src/desktop/**',
  'src/components/**',
  'src/contexts/**',
  'src/data/**',
  'src/server/**',
  'src/lib/**',
  'src/utils/**',
  'scripts/**',
  'public/brand-assets/**',
  'public/epk/**',
  'docs/agent-system/reports/**',
  'docs/agent-system/visual-templates/**',
  'docs/agent-system/latest-*.md',
  'docs/agent-system/latest-*.json',
  'docs/brand/**',
  'package.json',
];

const ignoredPatterns = [
  'airdoX_wiki/.obsidian/**',
  'airdoX_wiki/__pycache__/**',
  'node_modules/**',
  'dist/**',
  'release/**',
  'docs/agent-system/latest-wiki-sync-audit.*',
];

const changedFiles = getChangedFiles().filter((filePath) => !matchesAny(filePath, ignoredPatterns));
const contentFiles = changedFiles.filter((filePath) => matchesAny(filePath, contentPatterns));
const knowledgeFiles = changedFiles.filter((filePath) => matchesAny(filePath, knowledgePatterns));
const contentWithoutKnowledge = contentFiles.length > 0 && knowledgeFiles.length === 0;

const requiredAction = contentWithoutKnowledge
  ? 'Master Controller muss den Wiki Maintainer beauftragen: neue Projekt-/Content-Aenderungen in airdoX_wiki und lokale Assistant-Antworten ueberfuehren, danach Wiki-Lint und Assistant-Coverage ausfuehren.'
  : 'Keine Eskalation: Zu den aktuellen Content-/Projekt-Aenderungen existiert bereits eine Wiki- oder Assistant-Wissensaenderung, oder es gibt keine relevanten Content-Aenderungen.';

const report = {
  generatedAt,
  status: contentWithoutKnowledge ? 'warn' : 'ok',
  changedFileCount: changedFiles.length,
  contentFileCount: contentFiles.length,
  knowledgeFileCount: knowledgeFiles.length,
  contentFiles,
  knowledgeFiles,
  requiredAction,
  owner: contentWithoutKnowledge ? 'Master Controller -> Wiki Maintainer' : 'Wiki Maintainer',
  gates: [
    'local wiki lint with base path D:\\webseeite-main\\airdoX_wiki',
    'npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js',
    'npm run desktop:test:logic -- --run when Flight Deck behavior changed',
  ],
};

const lines = [
  '# AIRDOX Wiki Sync Audit',
  '',
  `Generated: ${generatedAt}`,
  `Status: ${report.status}`,
  '',
  '## Summary',
  '',
  `- Changed files: ${report.changedFileCount}`,
  `- Content / project files: ${report.contentFileCount}`,
  `- Wiki / Assistant knowledge files: ${report.knowledgeFileCount}`,
  `- Owner: ${report.owner}`,
  '',
  '## Required Action',
  '',
  report.requiredAction,
  '',
  '## Content Files',
  '',
  ...(contentFiles.length ? contentFiles.map((filePath) => `- ${filePath}`) : ['- None']),
  '',
  '## Knowledge Files',
  '',
  ...(knowledgeFiles.length ? knowledgeFiles.map((filePath) => `- ${filePath}`) : ['- None']),
  '',
  '## Gates',
  '',
  ...report.gates.map((gate) => `- ${gate}`),
  '',
];

const outJson = join(root, 'docs', 'agent-system', 'latest-wiki-sync-audit.json');
const outMd = join(root, 'docs', 'agent-system', 'latest-wiki-sync-audit.md');
mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outMd, `${lines.join('\n')}\n`);

process.stdout.write([
  'Wiki Sync Audit:',
  `Status: ${report.status}`,
  `Content files: ${report.contentFileCount}`,
  `Knowledge files: ${report.knowledgeFileCount}`,
  `Action: ${report.requiredAction}`,
].join('\n'));
process.stdout.write('\n');

if (args.has('--strict') && contentWithoutKnowledge) {
  process.exitCode = 1;
}
