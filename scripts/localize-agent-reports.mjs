#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const docsDir = join(root, 'docs', 'agent-system');

const targets = [
  /^latest-[^/\\]+\.md$/,
  /^manni-reel-(weekly-plan|draft-pack)\.md$/,
  /^AGENT_SYSTEM_ARCHITECTURE\.md$/,
];

const replacements = [
  [/^Generated:/gm, 'Erstellt:'],
  [/^Controller:/gm, 'Controller:'],
  [/^Owner:/gm, 'Owner:'],
  [/^Agent:/gm, 'Agent:'],
  [/^Repository:/gm, 'Repository:'],
  [/^Branch:/gm, 'Branch:'],
  [/^Risk:/gm, 'Risiko:'],
  [/^Blockers:/gm, 'Blocker:'],
  [/^Warnings:/gm, 'Warnungen:'],
  [/^Status:/gm, 'Status:'],
  [/^Event:/gm, 'Ereignis:'],
  [/^Changed files:/gm, 'Geaenderte Dateien:'],
  [/^Consent mode:/gm, 'Consent-Modus:'],
  [/^Consented events analyzed:/gm, 'Analysierte Consent-Events:'],
  [/^Rejected events without analytics consent:/gm, 'Abgelehnte Events ohne Analytics-Consent:'],
  [/^# AIRDOX Agent Job Run/gm, '# AIRDOX Agenten-Joblauf'],
  [/^# AIRDOX Agent Routing Report/gm, '# AIRDOX Agenten-Routing-Bericht'],
  [/^# AIRDOX Agent Quality Chain/gm, '# AIRDOX Agenten-Qualitaetskette'],
  [/^# AIRDOX Agent Dependency Radar/gm, '# AIRDOX Agenten-Abhaengigkeitsradar'],
  [/^# AIRDOX Agent System Health/gm, '# AIRDOX Agenten-Systemstatus'],
  [/^# AIRDOX Agent Audit/gm, '# AIRDOX Agenten-Audit'],
  [/^# AIRDOX Agent Currency Report/gm, '# AIRDOX Agenten-Aktualitaetsbericht'],
  [/^# AIRDOX Repository Monitor/gm, '# AIRDOX Repository-Monitor'],
  [/^# AIRDOX Guardian Risk Summary/gm, '# AIRDOX Guardian-Risikobericht'],
  [/^# AIRDOX Refactor Website Opportunities/gm, '# AIRDOX Refactor-Website-Chancen'],
  [/^# Latest Audience Intelligence/gm, '# AIRDOX Audience-Intelligence-Bericht'],
  [/^## Summary$/gm, '## Ueberblick'],
  [/^## Assignments$/gm, '## Zuweisungen'],
  [/^## Recommended Gates$/gm, '## Empfohlene Gates'],
  [/^## Unmatched Files$/gm, '## Nicht zugeordnete Dateien'],
  [/^## Jobs$/gm, '## Jobs'],
  [/^## Obligations$/gm, '## Pflichten'],
  [/^## Changed Test Files$/gm, '## Geaenderte Testdateien'],
  [/^## Alerts$/gm, '## Hinweise'],
  [/^## Handoffs$/gm, '## Uebergaben'],
  [/^## Architecture$/gm, '## Architektur'],
  [/^## Automation$/gm, '## Automatisierung'],
  [/^## Reports$/gm, '## Berichte'],
  [/^## Checks$/gm, '## Checks'],
  [/^## Unexpected Dirty Paths$/gm, '## Unerwartete offene Pfade'],
  [/^## Dirty Baseline Paths$/gm, '## Baseline fuer offene Pfade'],
  [/^## All Dirty Paths$/gm, '## Alle offenen Pfade'],
  [/^## Tracked Generated Artifacts$/gm, '## Versionierte generierte Artefakte'],
  [/^## Recent Commits$/gm, '## Letzte Commits'],
  [/^## Blockers$/gm, '## Blocker'],
  [/^## Warnings$/gm, '## Warnungen'],
  [/^## Agent Scores$/gm, '## Agenten-Scores'],
  [/^## Gate Failures$/gm, '## Gate-Fehler'],
  [/^## Operating Rules$/gm, '## Betriebsregeln'],
  [/^## Opportunities$/gm, '## Chancen'],
  [/^## Top Routes$/gm, '## Staerkste Routen'],
  [/^## Top Content$/gm, '## Staerkste Inhalte'],
  [/^## Top Event Types$/gm, '## Staerkste Event-Typen'],
  [/^## Intent Segments$/gm, '## Intent-Segmente'],
  [/^## Recommendations$/gm, '## Empfehlungen'],
  [/^## Notes$/gm, '## Hinweise'],
  [/^## Agents$/gm, '## Agenten'],
  [/^## Source Checks$/gm, '## Quellenchecks'],
  [/\| Agent \| Role \| Rules \| Files \|/g, '| Agent | Rolle | Regeln | Dateien |'],
  [/\| Job \| Agent \| Result \| Detail \|/g, '| Job | Agent | Ergebnis | Detail |'],
  [/\| ID \| Owner \| QA \| Status \| Required Follow-Up \| Gates \|/g, '| ID | Owner | QA | Status | Erforderlicher Nachlauf | Gates |'],
  [/\| ID \| From \| To \| Status \| Next Action \| User Touchpoint \|/g, '| ID | Von | An | Status | Naechste Aktion | Nutzer-Touchpoint |'],
  [/\| Report \| Status \| Age h \| Path \|/g, '| Bericht | Status | Alter h | Pfad |'],
  [/\| Check \| Level \| Detail \|/g, '| Check | Stufe | Detail |'],
  [/\| Agent \| Score \| Mission \|/g, '| Agent | Score | Mission |'],
  [/\| Priority \| Area \| ID \| Evidence \| Action \| Validation \| Files \|/g, '| Prioritaet | Bereich | ID | Beleg | Aktion | Validierung | Dateien |'],
  [/\| Agent \| Status \| Domain \| Warnings \|/g, '| Agent | Status | Domaene | Warnungen |'],
  [/- Selected jobs:/g, '- Ausgewaehlte Jobs:'],
  [/- Executed jobs:/g, '- Ausgefuehrte Jobs:'],
  [/- Manual jobs:/g, '- Manuelle Jobs:'],
  [/- Skipped jobs:/g, '- Uebersprungene Jobs:'],
  [/- Failed jobs:/g, '- Fehlgeschlagene Jobs:'],
  [/- Changed files:/g, '- Geaenderte Dateien:'],
  [/- Test files changed:/g, '- Geaenderte Testdateien:'],
  [/- Obligations:/g, '- Pflichten:'],
  [/- Alerts:/g, '- Hinweise:'],
  [/- Handoffs:/g, '- Uebergaben:'],
  [/- Last job run:/g, '- Letzter Joblauf:'],
  [/- Average score:/g, '- Durchschnittsscore:'],
  [/- Gate status:/g, '- Gate-Status:'],
  [/- Test files:/g, '- Testdateien:'],
  [/- CSS files:/g, '- CSS-Dateien:'],
  [/- Uncommitted paths:/g, '- Offene Pfade:'],
  [/- Checks:/g, '- Checks:'],
  [/- Failures:/g, '- Fehler:'],
  [/- Warnings:/g, '- Warnungen:'],
  [/- Unexpected uncommitted paths:/g, '- Unerwartete offene Pfade:'],
  [/- Baseline uncommitted paths:/g, '- Baseline offene Pfade:'],
  [/- Tracked generated artifacts \(review\):/g, '- Versionierte generierte Artefakte (Review):'],
  [/- Stale reports:/g, '- Veraltete Berichte:'],
  [/- External live jobs gated:/g, '- Externe Live-Jobs mit Gate:'],
  [/- Agents checked:/g, '- Gepruefte Agenten:'],
  [/- Warn:/g, '- Warnungen:'],
  [/- Scanned source files:/g, '- Gepruefte Quelldateien:'],
  [/- Opportunities:/g, '- Chancen:'],
  [/- High priority:/g, '- Hohe Prioritaet:'],
  [/- None\b/g, '- Keine'],
  [/- none\b/g, '- Keine'],
  [/\bunknown\b/g, 'unbekannt'],
  [/\bNext actions:/g, 'Naechste Aktionen:'],
  [/\bNext:/g, 'Naechster Schritt:'],
  [/\bReason:/g, 'Grund:'],
  [/\bAction:/g, 'Aktion:'],
  [/\bApproval:/g, 'Freigabe:'],
  [/Master Controller approval required\./g, 'Master-Controller-Freigabe erforderlich.'],
  [/Personal user approval required before execution\./g, 'Persoenliche Nutzerfreigabe vor Ausfuehrung erforderlich.'],
  [/Personal user approval required before live\/external output\./g, 'Persoenliche Nutzerfreigabe vor Live-/externem Output erforderlich.'],
  [/Manual protocol required\./g, 'Manuelles Protokoll erforderlich.'],
  [/Unsupported execution mode:/g, 'Nicht unterstuetzter Ausfuehrungsmodus:'],
  [/Missing script name for script execution\./g, 'Script-Name fuer Script-Ausfuehrung fehlt.'],
  [/Strengthen the CTA path on ([^\n(]+)/g, 'CTA-Pfad auf $1 staerken'],
  [/This route has the strongest audience activity with ([0-9]+) weighted signal points\./g, 'Diese Route hat mit $1 gewichteten Signalpunkten die staerkste Audience-Aktivitaet.'],
  [/Add or review contextual CTAs for set play, newsletter signup, booking, and sharing\./g, 'Kontextuelle CTAs fuer Set-Play, Newsletter-Anmeldung, Booking und Sharing ergaenzen oder pruefen.'],
  [/Repurpose top content: ([^\n(]+)/g, 'Top-Inhalt wiederverwenden: $1'],
  [/This content currently leads audience interest with ([0-9]+) weighted signal points\./g, 'Dieser Inhalt fuehrt das Audience-Interesse aktuell mit $1 gewichteten Signalpunkten an.'],
  [/Generate social captions, newsletter copy, SEO description, and booking angle from this content\./g, 'Aus diesem Inhalt Social-Captions, Newsletter-Copy, SEO-Beschreibung und Booking-Winkel ableiten.'],
  [/Add newsletter capture after music engagement/g, 'Newsletter-Capture nach Musik-Engagement ergaenzen'],
  [/Users are playing sets, but no newsletter signal is present\./g, 'Nutzer spielen Sets, aber es ist kein Newsletter-Signal vorhanden.'],
  [/Show a contextual newsletter CTA after meaningful play or tracklist interaction\./g, 'Nach relevantem Play oder Tracklist-Engagement einen kontextuellen Newsletter-CTA zeigen.'],
  [/Connect social sharing with booking intent/g, 'Social-Sharing mit Booking-Intent verbinden'],
  [/Sharing signals exist, but booking\/contact signals are missing\./g, 'Sharing-Signale sind vorhanden, aber Booking-/Kontakt-Signale fehlen.'],
  [/Add a lightweight booking or EPK CTA on highly shared pages\./g, 'Auf stark geteilten Seiten einen leichten Booking- oder EPK-CTA ergaenzen.'],
  [/Start collecting consented audience events/g, 'Consent-basierte Audience-Events erfassen'],
  [/No consented analytics events were found, so recommendations are based on readiness only\./g, 'Es wurden keine consent-basierten Analytics-Events gefunden; Empfehlungen basieren daher nur auf Readiness.'],
  [/Wire route, CTA, set-play, newsletter, booking, and share events into a consent-aware analytics export\./g, 'Route-, CTA-, Set-Play-, Newsletter-, Booking- und Share-Events in einen consent-bewussten Analytics-Export fuehren.'],
  [/This report uses only consented aggregate or pseudonymous signals\./g, 'Dieser Bericht nutzt nur consent-basierte aggregierte oder pseudonyme Signale.'],
  [/Do not add raw personal data, form messages, IP addresses, emails, phone numbers, or hidden fingerprinting fields to analytics events\./g, 'Keine rohen personenbezogenen Daten, Formularnachrichten, IP-Adressen, E-Mails, Telefonnummern oder versteckte Fingerprinting-Felder zu Analytics-Events hinzufuegen.'],
  [/No data yet/g, 'Noch keine Daten'],
  [/\s+staerken\((high|medium|low)\)/g, ' staerken ($1)'],
  [/\s+wiederverwenden:\s+([^\n]+?)\((high|medium|low)\)/g, ' wiederverwenden: $1 ($2)'],
  [/ {2,}\((high|medium|low)\)/g, ' ($1)'],
];

const localize = (input) => {
  let output = input;
  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }
  return output;
};

if (!existsSync(docsDir)) {
  process.stdout.write('Report-Lokalisierung: keine docs/agent-system gefunden.\n');
  process.exit(0);
}

let changed = 0;
for (const entry of readdirSync(docsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !targets.some((pattern) => pattern.test(entry.name))) continue;
  const filePath = join(docsDir, entry.name);
  const original = readFileSync(filePath, 'utf8');
  const localized = localize(original);
  if (localized !== original) {
    writeFileSync(filePath, localized);
    changed += 1;
  }
}

process.stdout.write([
  'Report-Lokalisierung: ERLEDIGT',
  `Geaenderte Markdown-Berichte: ${changed}`,
].join('\n'));
process.stdout.write('\n');
