#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const generatedAt = new Date().toISOString();

const pathOf = (filePath) => join(root, filePath);
const exists = (filePath) => existsSync(pathOf(filePath));
const read = (filePath) => {
  try {
    return readFileSync(pathOf(filePath), 'utf8');
  } catch {
    return '';
  }
};

const packageJson = JSON.parse(read('package.json') || '{}');
const hasScript = (name) => Boolean(packageJson.scripts?.[name]);

const walk = (dirPath) => {
  const absolute = pathOf(dirPath);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${dirPath}/${entry.name}`.replaceAll('\\', '/');
    if (entry.isDirectory()) return walk(relativePath);
    return relativePath;
  });
};

const files = new Set([
  ...walk('src'),
  ...walk('desktop'),
  ...walk('docs'),
  ...walk('e2e'),
  ...walk('scripts'),
  ...walk('public'),
  ...walk('airdoX_wiki'),
  ...walk('.github'),
]);

const fileCount = (predicate) => [...files].filter(predicate).length;
const anyFile = (predicate) => [...files].some(predicate);
const hasInFile = (filePath, pattern) => pattern.test(read(filePath));
const lineCount = (filePath) => {
  const content = read(filePath);
  if (!content) return 0;
  return content.split(/\r?\n/).length;
};

const gitStatus = () => {
  try {
    return execFileSync('git', ['status', '--short'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim().split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
};

const check = (label, passed, detail, options = {}) => ({
  label,
  status: passed ? 'pass' : (options.warn ? 'warn' : 'fail'),
  weight: options.weight ?? 1,
  detail,
});

const optional = (label, passed, detail, options = {}) => (
  check(label, passed, detail, { ...options, warn: !passed })
);

const scoreAgent = (checks) => {
  const total = checks.reduce((sum, item) => sum + item.weight, 0);
  if (!total) return 0;
  const earned = checks.reduce((sum, item) => {
    if (item.status === 'pass') return sum + item.weight;
    if (item.status === 'warn') return sum + (item.weight * 0.5);
    return sum;
  }, 0);
  return Math.round((earned / total) * 100);
};

const agent = (id, name, mission, checks, nextActions) => ({
  id,
  name,
  mission,
  score: scoreAgent(checks),
  checks,
  nextActions,
});

const dirtyFiles = gitStatus();
const cssFiles = [...files].filter((filePath) => filePath.endsWith('.css'));
const testFiles = [...files].filter((filePath) => (
  filePath.includes('__tests__/') || filePath.endsWith('.spec.js') || filePath.endsWith('.test.js')
));
const jsxFiles = [...files].filter((filePath) => filePath.endsWith('.jsx'));
const largestJsx = jsxFiles
  .map((filePath) => ({ filePath, lines: lineCount(filePath) }))
  .sort((a, b) => b.lines - a.lines)[0] || { filePath: '', lines: 0 };
const rootHtmlCopies = ['custom.html', 'live_index.html', 'page.html'].filter(exists);

const agents = [
  agent(
    'webbie',
    'Webbie',
    'Website, UX, SEO, Responsiveness, Performance und Conversion.',
    [
      check('React/Vite Einstieg vorhanden', exists('src/App.jsx') && exists('src/main.jsx'), 'src/App.jsx und src/main.jsx bilden den Website-Einstieg.'),
      optional('Below-the-fold Lazy Loading', hasInFile('src/App.jsx', /\blazy\s*\(/), 'App.jsx nutzt React.lazy fuer mehrere Sektionen.', { weight: 1.5 }),
      check('Kernsektionen vorhanden', [
        'src/components/Hero.jsx',
        'src/components/Navigation.jsx',
        'src/components/MusicSection.jsx',
        'src/components/BookingSection.jsx',
        'src/components/Footer.jsx',
      ].every(exists), 'Hero, Navigation, Music, Booking und Footer sind vorhanden.', { weight: 1.5 }),
      check('SEO-Meta im deutschen Entry', [
        /<title>/.test(read('index.html')),
        /rel="canonical"/.test(read('index.html')),
        /property="og:image"/.test(read('index.html')),
        /application\/ld\+json/.test(read('index.html')),
        /hreflang="en"/.test(read('index.html')),
      ].every(Boolean), 'index.html enthaelt Title, Canonical, Open Graph, JSON-LD und hreflang.', { weight: 1.5 }),
      optional('Responsive CSS-Signale', cssFiles.some((filePath) => /@media|clamp\(|minmax\(|aspect-ratio/.test(read(filePath))), 'CSS enthaelt responsive Regeln oder stabile Layout-Sizing-Signale.'),
      check('Public SEO/PWA Assets', [
        'public/robots.txt',
        'public/sitemap.xml',
        'public/manifest.json',
        'public/og-image.png',
      ].every(exists), 'robots, sitemap, manifest und OG-Bild sind vorhanden.'),
      check('Cloudflare-Deployment konfiguriert', exists('wrangler.jsonc'), 'wrangler.jsonc ist als einziges Deployment-Target vorhanden.'),
      optional('Analytics Consent ohne Direktlade-Risiko', !/googletagmanager\.com\/gtag\/js/.test(read('index.html')), 'Warnung, wenn Google Tag direkt im HTML geladen wird statt nur ueber Consent-Loader.'),
      optional('CSP ohne unsafe-inline', !/unsafe-inline/.test(read('public/_headers')), 'Warnung, wenn CSP unsafe-inline benoetigt.'),
      optional('HTML-Entry-Drift begrenzt', rootHtmlCopies.length === 0, 'Warnung, wenn mehrere root HTML-Kopien SEO/Head-Drift erzeugen koennen.'),
      check('Website E2E-Abdeckung', exists('e2e/sanity.spec.js') && exists('e2e/navigation.spec.js'), 'Sanity- und Navigation-Playwright-Specs sind vorhanden.'),
    ],
    [
      'Sitemap-lastmod bei Content-Releases automatisiert aktualisieren.',
      'Core-Web-Vitals-Messung als Playwright/Lighthouse-Gate ergaenzen.',
      'Visuelle Regression fuer Hero, Music und Booking etablieren.',
    ],
  ),
  agent(
    'winnie',
    'Winnie',
    'Windows Flight Deck, lokale Automatisierung, Datenbankkommunikation und Release-Stabilitaet.',
    [
      check('Electron Main/Preload vorhanden', exists('desktop/main/index.cjs') && exists('desktop/main/preload.cjs'), 'Main-Prozess und sichere Preload-Bridge sind vorhanden.', { weight: 1.5 }),
      check('Desktop Renderer vorhanden', exists('src/desktop/DesktopApp.jsx') && exists('desktop.html'), 'DesktopApp und desktop.html existieren.'),
      check('Desktop Services vorhanden', [
        'desktop/main/services/pipeline.mjs',
        'desktop/main/services/manifest.mjs',
        'desktop/main/services/database.mjs',
        'desktop/main/services/r2.mjs',
      ].every(exists), 'Pipeline, Manifest, Datenbank und R2 sind als Services getrennt.'),
      check('Desktop NPM-Skripte', ['desktop:dev', 'desktop:start', 'desktop:dist', 'desktop:test'].every(hasScript), 'Desktop-Entwicklung, Start, Build und Tests sind skriptbar.'),
      check('Desktop Tests vorhanden', fileCount((filePath) => filePath.startsWith('src/desktop/') && filePath.includes('__tests__')) >= 3, 'Mehrere Desktop-/Flightdeck-Tests existieren.'),
      optional('Installer-/Release-Helfer vorhanden', exists('scripts/build-win-installer.ps1') && exists('scripts/install-win-tool.ps1'), 'Windows Installer-Helfer liegen unter scripts/.'),
      optional('Manifest wird nicht im Main-Prozess ausgefuehrt', !/import\s*\(\s*moduleUrl\s*\)/.test(read('desktop/main/services/manifest.mjs')), 'Warnung, wenn Workspace-Dateien per dynamic import im Main-Prozess ausgefuehrt werden.', { weight: 1.5 }),
      optional('Shell-Kommandos eingegrenzt', !/shell:\s*true/.test(read('desktop/main/services/workspace.mjs') + read('desktop/main/services/pipeline.mjs')), 'Warnung, wenn Pipeline-Kommandos ueber shell:true laufen.', { weight: 1.5 }),
      optional('Electron Sandbox aktiv oder begruendet', !/sandbox:\s*false/.test(read('desktop/main/index.cjs')), 'Warnung, wenn BrowserWindow mit sandbox:false laeuft.'),
      check('Windows-Dokumentation vorhanden', exists('docs/WINDOWS_FLIGHTDECK.md'), 'docs/WINDOWS_FLIGHTDECK.md beschreibt Stand, Nutzung und Teststatus.'),
    ],
    [
      'Release-Gate aus desktop:test:logic, desktop:test:e2e und desktop:dist definieren.',
      'Code-Signing- und Icon-Status als eigener Release-Check aufnehmen.',
      'Publish-Pipeline-Fehler mit reproduzierbaren Test-Fixtures abdecken.',
    ],
  ),
  agent(
    'guardian',
    'Guardian',
    'Qualitaet, Sicherheit, Stabilitaet, Regressionen und technische Schulden.',
    [
      check('Standard Quality Scripts', ['build', 'lint', 'test', 'test:e2e'].every(hasScript), 'Build, Lint, Unit- und E2E-Tests sind in package.json verankert.', { weight: 1.5 }),
      check('Test Runner konfiguriert', exists('vitest.config.js') && exists('playwright.config.js'), 'Vitest und Playwright sind konfiguriert.'),
      check('ESLint konfiguriert', exists('eslint.config.js'), 'ESLint Flat Config ist vorhanden.'),
      check('Ausreichende Testdateien', testFiles.length >= 8, `${testFiles.length} Test-/Spec-Dateien gefunden.`, { weight: 1.5 }),
      optional('Worker/API-Testsignale', exists('src/server/worker.js') && anyFile((filePath) => /stats|worker|booking/i.test(filePath) && /test|spec/.test(filePath)), 'Server-/API-Code ist vorhanden; dedizierte Testsignale werden geprueft.'),
      optional('Web-CI-Gate vorhanden', anyFile((filePath) => filePath.startsWith('.github/workflows/') && /npm run (lint|test|build)/.test(read(filePath))), 'Warnung, wenn GitHub Actions kein Web-Lint/Test/Build-Gate enthaelt.'),
      optional('Arbeitsbaum sauber', dirtyFiles.length === 0, dirtyFiles.length ? `${dirtyFiles.length} uncommitted Pfade gefunden; vor Releases klaeren.` : 'Keine uncommitted Pfade gefunden.', { weight: 1.5 }),
      check('Env-Beispiel vorhanden', exists('.env.example'), '.env.example ist fuer sichere Konfiguration vorhanden.'),
    ],
    [
      'Guardian-Strict-Gate fuer Releases verwenden: npm run agent:audit -- --strict plus build/test/lint.',
      'Bekannte Alt-Lintfehler als debt register dokumentieren und schrittweise abbauen.',
      'Security-Checks fuer Booking, Auth und Analytics als gezielte Tests ergaenzen.',
    ],
  ),
  agent(
    'manni',
    'Manni',
    'Promotion, Branding, EPK, Community, Conversion und Wiedererkennbarkeit.',
    [
      check('Brand Story dokumentiert', /AIRDOX|Techno|Flight Deck/i.test(read('README.md')), 'README dokumentiert AIRDOX, Website und Flight-Deck-Rahmen.'),
      check('Conversion-Sektionen vorhanden', [
        'src/components/EPKSection.jsx',
        'src/components/BookingSection.jsx',
        'src/components/Newsletter.jsx',
        'src/components/VIPSection.jsx',
      ].every(exists), 'EPK, Booking, Newsletter und VIP sind als Website-Sektionen vorhanden.', { weight: 1.5 }),
      check('Social Sharing Assets', exists('public/og-image.png') && /twitter:card/.test(read('index.html')), 'OG/Twitter-Basis ist vorhanden.'),
      optional('Social Profile Signale', /sameAs/.test(read('index.html')) && /instagram|soundcloud/i.test(read('index.html')), 'JSON-LD verweist auf Social-/Music-Profile.'),
      optional('EPK ohne Platzhalter-Aktionen', !/alert\s*\(/.test(read('src/components/EPKSection.jsx')), 'Warnung, wenn EPK-Downloads nur per alert/Placeholder reagieren.'),
      optional('Newsletter API geroutet', /api\/subscribe|subscribe/i.test(read('src/server/worker.js')), 'Warnung, wenn Newsletter-Frontend keinen Worker-Route-Anker hat.'),
      check('Sitemap fuer Suchmaschinen', exists('public/sitemap.xml') && /https:\/\/airdox\.info/.test(read('public/sitemap.xml')), 'Sitemap ist vorhanden und auf airdox.info ausgerichtet.'),
      optional('Mehrsprachigkeit als Reichweitenhebel', exists('en/index.html') && /hreflang="en"/.test(read('index.html')), 'Englische Variante und hreflang sind vorhanden.'),
      optional('Merch-/Community-Flache', /merch|community|newsletter|vip/i.test(read('src/components/Newsletter.jsx') + read('src/components/VIPSection.jsx')), 'Newsletter/VIP bieten Ansatzpunkte fuer Community oder Merch.'),
    ],
    [
      'EPK als klare Download-/Presseseite mit aktuellen Assets und Tech-Rider erweitern.',
      'Kampagnenkalender fuer Releases, Sets, Newsletter und Social Clips im Wiki fuehren.',
      'Conversion Events fuer Booking, Newsletter, VIP und Set-Play sichtbar auswerten.',
    ],
  ),
  agent(
    'designer',
    'Designer',
    'Visual Design, Creative Direction und Social-Asset-Qualitaet.',
    [
      check('Manni Growth Playbook vorhanden', exists('docs/agent-system/MANNI_GROWTH_PLAYBOOK.md'), 'Das Growth-Playbook ist als Creative-Rahmen verfuegbar.'),
      check('Designer Creative Direction vorhanden', exists('docs/agent-system/DESIGNER_CREATIVE_DIRECTION.md') && /audio-reactive|Equalizer|creative_static_risk/i.test(read('docs/agent-system/DESIGNER_CREATIVE_DIRECTION.md')), 'Designer besitzt verbindliche Motion-, Audio-Reaktivitaets- und Static-Risk-Regeln.', { weight: 1.5 }),
      check('Reel Factory skriptbar', hasScript('manni:reels:generate') && exists('scripts/manni-reel-factory.mjs'), 'Reel-Factory ist als wiederholbarer Creative-Generator vorhanden.', { weight: 1.5 }),
      optional('Reel Queue und Plan vorhanden', exists('docs/agent-system/manni-reel-queue.json') && exists('docs/agent-system/manni-reel-weekly-plan.md'), 'Warnung, wenn kreative Wochenplanung noch nicht erzeugt wurde.', { weight: 1.5 }),
      optional('Social-Reel-Template fordert Motion', exists('docs/brand/templates/airdox-social-reel-template.md') && /MOTION_SIGNATURE|Equalizer|Parallax-Still|Glitch/i.test(read('docs/brand/templates/airdox-social-reel-template.md')), 'Warnung, wenn Reel-Templates keine Audio-/Motion-Signaturen erzwingen.', { weight: 1.5 }),
      optional('Visual Proof-Assets vorhanden', fileCount((filePath) => filePath.startsWith('docs/proof/') && /\.(png|jpg|jpeg|webp)$/i.test(filePath)) >= 6, 'Warnung, wenn kaum visuelle Proof-Assets fuer Creative-Qualitaet vorhanden sind.'),
      optional('UI-Brandflaechen gepflegt', exists('src/components/Hero.css') && exists('src/components/Footer.css'), 'Warnung, wenn zentrale Brandflaechen fuer visuelle Konsistenz fehlen.'),
      optional('Social-Link-Signale gepflegt', /instagram\.com\/airdox_bln/i.test(read('src/components/Hero.jsx') + read('src/components/Footer.jsx')), 'Warnung, wenn Kern-Social-Links nicht konsistent verankert sind.'),
    ],
    [
      'Hook-Varianten je Reel in 3 visuellen Stilen planen und A/B-testen.',
      'Statische Reel-Entwuerfe als creative_static_risk markieren und mit Equalizer, Waveform, Parallax-Still oder Kinetic Type ueberarbeiten.',
      'Thumbnail- und First-Frame-Bibliothek fuer wiedererkennbare Social-Branding-Signale aufbauen.',
      'Creative-Fatigue woechentlich messen und Gewinner-Styles priorisieren.',
    ],
  ),
  agent(
    'mentor',
    'Mentor',
    'Wissensspeicherung, Lernschleifen, Prozessverbesserung und Agenten-Weiterentwicklung.',
    [
      check('Wiki-Kernel vorhanden', exists('airdoX_wiki/SYSTEM.md') && exists('airdoX_wiki/wiki/index.md'), 'AIRDOX Wiki besitzt Systemdatei und Index.', { weight: 1.5 }),
      check('Wissenslog vorhanden', exists('airdoX_wiki/wiki/log.md'), 'Wiki-Log ist fuer Erfahrungslernen vorhanden.'),
      check('Agenten-Operating-Model vorhanden', exists('docs/agent-system/OPERATING_MODEL.md'), 'Das Multi-Agenten-System ist als Operating Model dokumentiert.', { weight: 1.5 }),
      check('Agenten-Decision-Log vorhanden', exists('docs/agent-system/DECISION_LOG.md'), 'Strategische Agentenentscheidungen werden im Decision Log gespeichert.'),
      check('Mentor-Lernschleifen vorhanden', exists('docs/agent-system/MENTOR_LEARNING_LOOPS.md') || [
        'airdoX_wiki/wiki/local-09-mentor-audit.md',
        'airdoX_wiki/wiki/local-10-agent-decisions.md',
        'airdoX_wiki/wiki/local-11-feedback-loops.md',
      ].every(exists), 'Mentor-Audit, Agentenentscheidungen und Feedbackschleifen sind versioniert oder im Wiki verankert.', { weight: 1.5 }),
      check('Mentor-Currency-Check skriptbar', hasScript('mentor:currency') && exists('scripts/mentor-agent-currency.mjs'), 'Mentor kann Quellen- und Runbook-Aktualitaet fuer Fachagenten pruefen.', { weight: 1.5 }),
      check('Agenten-Audit skriptbar', hasScript('agent:audit') && exists('scripts/agent-audit.mjs'), 'Agenten-Audit ist per npm ausfuehrbar.', { weight: 1.5 }),
      optional('Entwicklerhandbuch vorhanden', exists('docs/ADMIN_SUITE_DEVELOPER_GUIDE.md'), 'Admin Suite Developer Guide beschreibt Erweiterungsmuster.'),
      optional('Assistant-Testsignale', anyFile((filePath) => filePath.includes('assistant') && /test|spec/.test(filePath)), 'Assistant-Logik hat Testsignale.'),
    ],
    [
      'Entscheidungen und Audit-Ergebnisse nach groesseren Aenderungen in docs/agent-system protokollieren.',
      'Lernluecken aus fehlgeschlagenen Checks direkt in Backlog-Eintraege uebersetzen.',
      'Agenten-Briefings quartalsweise anhand echter Projekterfahrung schaerfen.',
    ],
  ),
  agent(
    'refactor',
    'Refactor',
    'Systemoptimierung, Verschlankung, Architekturqualitaet und technische Effizienz.',
    [
      check('Refactor-Wissensseite vorhanden', exists('docs/agent-system/REFACTOR_OPTIMIZATION_LOOP.md') || exists('airdoX_wiki/wiki/local-12-refactor-optimization.md'), 'Refactor besitzt eine eigene Optimierungs- und Verschlankungsseite als versioniertes Runbook oder im Wiki.'),
      check('Quality-Skripte vorhanden', hasScript('quality:web') && hasScript('quality:desktop'), 'Web- und Desktop-Quality-Gates sind in package.json abrufbar.'),
      optional('Generierte Ordner aus Lint ausgeschlossen', /\.wrangler/.test(read('eslint.config.js')) && /dist/.test(read('eslint.config.js')), 'Warnung, wenn generierte Build-/Wrangler-Artefakte vom Lint erfasst werden.'),
      optional('Root-HTML-Duplikate reduziert', rootHtmlCopies.length === 0, rootHtmlCopies.length ? `${rootHtmlCopies.length} Root-HTML-Kopien koennen Head-/SEO-Drift erzeugen.` : 'Keine Root-HTML-Kopien neben den Vite-Einstiegen gefunden.', { weight: 1.5 }),
      optional('Grosse JSX-Dateien begrenzt', largestJsx.lines <= 500, largestJsx.filePath ? `${largestJsx.filePath} hat ${largestJsx.lines} Zeilen.` : 'Keine JSX-Dateien gefunden.', { weight: 1.5 }),
      check('Desktop Services modularisiert', fileCount((filePath) => filePath.startsWith('desktop/main/services/') && filePath.endsWith('.mjs')) >= 6, 'Desktop-Main-Logik ist in mehrere Services geschnitten.'),
      check('Deployment-Ziel konsolidiert', exists('wrangler.jsonc') && !exists('netlify.toml') && !exists('vercel.json'), 'Nur wrangler.jsonc als einziges Deployment-Target vorhanden.'),
      optional('Dependency-Footprint kontrolliert', Object.keys(packageJson.dependencies || {}).length <= 15, `${Object.keys(packageJson.dependencies || {}).length} Runtime-Abhaengigkeiten gefunden.`),
    ],
    [
      'Grosse Komponenten schrittweise in getestete Subkomponenten schneiden.',
      'Deployment-Targets eindeutig priorisieren und historische Konfigs entfernen oder dokumentieren.',
      'Freie Shell-/Import-Pfade im Desktop-Tool durch strukturierte APIs und Allowlists ersetzen.',
    ],
  ),
  agent(
    'repository',
    'Repository',
    'Quellcodeverwaltung, GitHub-Disziplin, Branching, Versionierung und Merge-Stabilitaet.',
    [
      check('Repository-Governance dokumentiert', exists('docs/agent-system/REPOSITORY_GOVERNANCE.md'), 'Branch-, Commit-, PR- und Merge-Regeln sind dokumentiert.'),
      check('Web-Quality-Workflow vorhanden', exists('.github/workflows/web-quality.yml'), 'GitHub Workflow fuer Lint, Tests, Build und Audit existiert.'),
      check('Repository-Monitoring skriptbar', hasScript('repository:monitor') && exists('scripts/repository-monitor.mjs'), 'Repository hat ein eigenes Monitoring-Skript fuer Bereinigung und Ueberwachung.'),
      optional('Branching-Hinweise vorhanden', /feature\/|hotfix\/|release\//.test(read('docs/agent-system/REPOSITORY_GOVERNANCE.md')), 'Warnung, wenn Branch-Namensschema nicht klar dokumentiert ist.'),
      optional('Commit-Konvention dokumentiert', /feat|fix|refactor|docs|chore|ci/.test(read('docs/agent-system/REPOSITORY_GOVERNANCE.md')), 'Warnung, wenn Commit-Typen nicht klar festgelegt sind.'),
      optional('Change-Tracking vorhanden', exists('docs/agent-system/DECISION_LOG.md') && exists('docs/agent-system/latest-audit.md'), 'Warnung, wenn Entscheidungen oder Audit-Historie fehlen.'),
      optional('Arbeitsbaum releasebereit', dirtyFiles.length <= 20, `${dirtyFiles.length} uncommitted Pfade erschweren kontrollierte Merge-/Release-Aktionen.`, { weight: 1.5 }),
      check('Einziges Deployment-Target', exists('wrangler.jsonc') && !exists('netlify.toml') && !exists('vercel.json'), 'Nur Cloudflare (wrangler.jsonc) als Deployment-Target vorhanden.'),
      optional('Gefaehrdete Artefaktordner ignoriert', [/\.wrangler/.test(read('.gitignore')), /dist/.test(read('.gitignore')), /release/.test(read('.gitignore'))].every(Boolean), 'Warnung, wenn Build-/Wrangler-/Release-Artefakte nicht sauber ignoriert werden.'),
    ],
    [
      'Branch-Schutzregeln in GitHub mit Pflicht-Checks aus web-quality und agent:audit verknuepfen.',
      'Release-Branches zeitlich begrenzen und nach Abschluss mergen oder schliessen.',
      'Mehrdeutige Deployment-Strategien reduzieren und einen primaeren Pfad festlegen.',
    ],
  ),
];

const summary = {
  averageScore: Math.round(agents.reduce((sum, item) => sum + item.score, 0) / agents.length),
  dirtyPathCount: dirtyFiles.length,
  testFileCount: testFiles.length,
  cssFileCount: cssFiles.length,
};

const gateFailures = agents.flatMap((item) => (
  item.checks
    .filter((checkResult) => checkResult.status === 'fail')
    .map((checkResult) => `${item.name}: ${checkResult.label}`)
));

const report = {
  generatedAt,
  repository: root,
  controller: {
    name: 'Master Controller',
    mission: 'Priorisierung, Koordination, Release-Entscheidungen und Audit-Auswertung.',
  },
  summary,
  gate: {
    status: gateFailures.length ? 'needs-attention' : 'pass',
    failures: gateFailures,
  },
  agents,
};

const renderMarkdown = () => {
  const lines = [
    '# AIRDOX Agent Audit',
    '',
    `Generated: ${generatedAt}`,
    `Repository: ${root}`,
    'Controller: Master Controller',
    '',
    '## Summary',
    '',
    `- Average score: ${summary.averageScore}/100`,
    `- Gate status: ${report.gate.status}`,
    `- Test files: ${summary.testFileCount}`,
    `- CSS files: ${summary.cssFileCount}`,
    `- Uncommitted paths: ${summary.dirtyPathCount}`,
    '',
    '## Agent Scores',
    '',
    '| Agent | Score | Mission |',
    '| --- | ---: | --- |',
    ...agents.map((item) => `| ${item.name} | ${item.score}/100 | ${item.mission} |`),
    '',
  ];

  for (const item of agents) {
    lines.push(`## ${item.name}`);
    lines.push('');
    for (const checkResult of item.checks) {
      lines.push(`- ${checkResult.status.toUpperCase()}: ${checkResult.label} - ${checkResult.detail}`);
    }
    lines.push('');
    lines.push('Next actions:');
    for (const action of item.nextActions) {
      lines.push(`- ${action}`);
    }
    lines.push('');
  }

  if (gateFailures.length) {
    lines.push('## Gate Failures');
    lines.push('');
    for (const failure of gateFailures) {
      lines.push(`- ${failure}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
};

const renderConsole = () => {
  const lines = [
    `AIRDOX Agent Audit (${generatedAt})`,
    'Controller: Master Controller',
    `Average score: ${summary.averageScore}/100`,
    `Gate: ${report.gate.status}`,
    '',
    ...agents.map((item) => `${item.name.padEnd(9)} ${String(item.score).padStart(3)}/100  ${item.mission}`),
  ];

  if (gateFailures.length) {
    lines.push('', 'Gate failures:');
    lines.push(...gateFailures.map((failure) => `- ${failure}`));
  }

  lines.push('', 'Run with --write to persist docs/agent-system/latest-audit.*');
  return `${lines.join('\n')}\n`;
};

if (args.has('--write')) {
  const outDir = pathOf('docs/agent-system');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'latest-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, 'latest-audit.md'), renderMarkdown());
}

if (args.has('--json')) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(renderConsole());
}

if (args.has('--strict') && gateFailures.length) {
  process.exitCode = 1;
}
