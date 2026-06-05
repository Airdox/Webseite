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
const largeFileDataModules = new Set([
  'src/utils/i18nMessages.js',
]);
const stateContractModules = new Set([
  'src/utils/websiteContracts.js',
]);

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
      eventCount: (text.match(/CustomEvent|dispatchEvent|addEventListener\(\s*['"]airdox[_:-]|removeEventListener\(\s*['"]airdox[_:-]/g) || []).length,
    };
  });

const slug = (value) => value.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '');

const apiFiles = sourceFiles
  .filter((file) => file.fetchCount > 0 || file.apiBaseCount > 0)
  .filter((file) => (
    /src\/components\/(AuthModal|Newsletter|VIPSection|BookingSection)\.jsx/.test(file.path)
    || (/src\/contexts\/AudioContext\.jsx/.test(file.path) && file.apiBaseCount > 0)
    || /src\/utils\/stats-sync\.js/.test(file.path)
  ))
  .sort((a, b) => (b.fetchCount + b.apiBaseCount) - (a.fetchCount + a.apiBaseCount));

const opportunities = [];

const withApproval = (opportunity, approval = {}) => ({
  ...opportunity,
  approval: {
    status: approval.status || 'pending_user_ok',
    requiredBeforeExecution: true,
    requiredBy: opportunity.priority === 'high'
      ? ['User', 'Master Controller if scope expands']
      : ['User'],
    proposalJob: 'refactor-website-patch-proposal',
    executionJob: opportunity.priority === 'high'
      ? 'website-stability-refactor-execution'
      : 'approved-small-refactor-patch',
  },
});

if (apiFiles.length >= 3) {
  opportunities.push(withApproval({
    id: 'website-api-client-consolidation',
    priority: 'high',
    area: 'availability-and-functionality',
    files: apiFiles.map((file) => file.path),
    evidence: `${apiFiles.length} Website-Service-Dateien enthalten Fetch- oder Base-URL-Logik.`,
    action: 'Base-URL-Aufloesung sowie sicheres JSON-/Fehlerlesen in einen kleinen Helper verschieben und danach jeweils nur einen Nutzerflow migrieren.',
    validation: 'Den betroffenen Flow-Test plus npm run build ausfuehren. Bei sichtbaren Flows vor Release Desktop-/Mobile-Proof ergaenzen.',
  }));
}

const audioStatsFiles = apiFiles.filter((file) => /AudioContext|stats-sync|MusicSection/.test(file.path));
if (audioStatsFiles.length >= 2) {
  opportunities.push(withApproval({
    id: 'audio-stats-runtime-boundary',
    priority: 'high',
    area: 'analytics-integrity',
    files: audioStatsFiles.map((file) => file.path),
    evidence: 'Audio- und Stats-Runtime-URL-Logik ist zwischen Playback- und Stats-Modulen verteilt.',
    action: 'Localhost-/Production-Routing in einer gemeinsamen Utility halten, damit lokales Hoeren keine Production-Stats verfaelscht.',
    validation: 'AudioContext- und MusicSection-Tests ausfuehren, danach npm run build.',
  }));
}

sourceFiles
  .filter((file) => file.bytes >= largeFileThreshold)
  .filter((file) => !largeFileDataModules.has(file.path))
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 8)
  .forEach((file) => {
    opportunities.push(withApproval({
      id: `large-file-${slug(file.path)}`,
      priority: file.bytes >= 30000 ? 'high' : 'medium',
      area: 'maintainability',
      files: [file.path],
      evidence: `${file.lines} Zeilen / ${file.bytes} Bytes.`,
      action: 'Nur die naechste nutzer- oder service-sichtbare Teileinheit extrahieren, die einen fokussierten Test bekommen kann.',
      validation: 'Den naechstliegenden Komponenten-/Unit-Test plus npm run build ausfuehren.',
    }));
  });

sourceFiles
  .filter((file) => !stateContractModules.has(file.path))
  .filter((file) => file.localStorageCount >= 2 || file.eventCount >= 3)
  .sort((a, b) => (b.localStorageCount + b.eventCount) - (a.localStorageCount + a.eventCount))
  .slice(0, 5)
  .forEach((file) => {
    opportunities.push(withApproval({
      id: `state-contract-${slug(file.path)}`,
      priority: 'medium',
      area: 'state-contract',
      files: [file.path],
      evidence: `${file.localStorageCount} localStorage-Referenzen, ${file.eventCount} Event-Referenzen.`,
      action: 'Vor Aenderungen an abhaengiger UI den kleinsten Event-/Storage-Contract dokumentieren oder extrahieren.',
      validation: 'Die naechstliegenden Tests fuer Event-Dispatch, Cache-Update oder UI-Refresh-Verhalten ausfuehren.',
    }));
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
    'Erreichbarkeit, Stabilitaet und Funktionalitaet haben Vorrang vor Cleanup.',
    'Refactor muss vor Code-Aenderungen einen ausfuehrbaren Patch-Vorschlag vorbereiten.',
    'Der genehmigte Scope ist bindend; Scope-Erweiterung braucht einen neuen Vorschlag.',
    'Ausfuehrung braucht explizite Nutzerfreigabe; riskante oder breite Arbeit zusaetzlich Master-Controller-Freigabe.',
    'Breite Umstrukturierung ist nur mit Master-Controller-Freigabe, Rollback-Hinweis und Quality-Gates erlaubt.',
    'Jede Refactor-Aufgabe muss Vorher-/Nachher-Nutzen und Validierung nennen.',
    'Immer nur einen Website-Flow bevorzugen: Musik, Booking, Newsletter, VIP/Auth oder Stats.',
  ],
  opportunities,
};

const markdown = [
  '# AIRDOX Refactor-Website-Chancen',
  '',
  `Erstellt: ${generatedAt}`,
  'Agent: Refactor',
  '',
  '## Ueberblick',
  '',
  `- Gepruefte Quelldateien: ${report.summary.scannedFiles}`,
  `- Chancen: ${report.summary.opportunityCount}`,
  `- Hohe Prioritaet: ${report.summary.highPriorityCount}`,
  '',
  '## Betriebsregeln',
  '',
  ...report.rules.map((rule) => `- ${rule}`),
  '',
  '## Chancen',
  '',
  '| Prioritaet | Bereich | ID | Beleg | Aktion | Validierung | Dateien |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...opportunities.map((item) => `| ${item.priority} | ${item.area} | ${item.id} | ${item.evidence} | ${item.action} Freigabe: ${item.approval.status}; Job: ${item.approval.proposalJob}. | ${item.validation} | ${item.files.join('<br>')} |`),
  '',
].join('\n');

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outMd, `${markdown}\n`);

process.stdout.write([
  'Refactor-Website-Chancen: ERLEDIGT',
  `Gepruefte Dateien: ${report.summary.scannedFiles}`,
  `Chancen: ${report.summary.opportunityCount}`,
  'Bericht: docs/agent-system/latest-refactor-website-opportunities.md',
].join('\n'));
process.stdout.write('\n');
