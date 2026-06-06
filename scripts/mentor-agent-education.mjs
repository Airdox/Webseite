#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const docsDir = join(root, 'docs', 'agent-system');
const generatedAt = new Date().toISOString();

const readJson = (filePath, fallback) => {
  try {
    return JSON.parse(readFileSync(join(root, filePath), 'utf8'));
  } catch {
    return fallback;
  }
};

const exists = (filePath) => existsSync(join(root, filePath));

const targetLevels = {
  Webbie: 'L3',
  Winnie: 'L3',
  Guardian: 'L4',
  Manni: 'L3',
  Designer: 'L3',
  Mentor: 'L4',
  Refactor: 'L3',
  Repository: 'L3',
};

const trainingCatalog = [
  {
    agent: 'Webbie',
    goal: 'Messbare Website-, UX-, SEO- und Performance-Aenderungen mit Proof liefern.',
    trainings: [
      {
        type: 'basis',
        title: 'Website-Aenderung mit Build- und Testnachweis',
        acceptance: 'Aenderung nennt betroffene Section, Risiko, npm-Gates und erwarteten Nutzer-/Conversion-Effekt.',
      },
      {
        type: 'fehlerfall',
        title: 'Consent- oder Tracking-Luecke erkennen',
        acceptance: 'Agent blockiert Blindoptimierung, benennt fehlendes Event und fordert consent-konforme Messung an.',
      },
      {
        type: 'cross-agent',
        title: 'Funnel-Training mit Manni und Audience Intelligence',
        acceptance: 'Manni liefert Kampagnenziel, Webbie Messpunkt, Audience Intelligence Auswertung, Guardian prueft Risiko.',
      },
    ],
  },
  {
    agent: 'Winnie',
    goal: 'Flight-Deck-Features stabil, testbar und releasefaehig vorbereiten.',
    trainings: [
      {
        type: 'basis',
        title: 'Desktop-Feature mit Logic-Test',
        acceptance: 'Feature nennt Main/Preload/Renderer-Grenze und fuehrt desktop:test:logic aus.',
      },
      {
        type: 'fehlerfall',
        title: 'Unsicheren IPC- oder Shell-Pfad erkennen',
        acceptance: 'Agent markiert Risiko, schlaegt Allowlist/strukturierte API vor und eskaliert an Guardian.',
      },
      {
        type: 'cross-agent',
        title: 'Flight-Deck-UI mit Designer-Proof',
        acceptance: 'Winnie liefert Funktion, Designer CD-Review, Guardian Release-Gate und Proof-Pfad.',
      },
    ],
  },
  {
    agent: 'Guardian',
    goal: 'Risiko-, Security-, Datenschutz- und Release-Gates fuehrend absichern.',
    trainings: [
      {
        type: 'basis',
        title: 'Quality-Gate-Bewertung',
        acceptance: 'Agent benennt Pflichtgates, Status, offene Risiken und Blocker.',
      },
      {
        type: 'fehlerfall',
        title: 'Externe Live-Aktion ohne Nutzerfreigabe blockieren',
        acceptance: 'Agent blockiert, verweist auf Freigaberegel und fordert Decision-Log-Eintrag.',
      },
      {
        type: 'cross-agent',
        title: 'Release-Ausnahme mit Master Controller pruefen',
        acceptance: 'Risiko, Ausnahmegrund, Rueckfallpfad und Recheck sind dokumentiert.',
      },
    ],
  },
  {
    agent: 'Manni',
    goal: 'Promotion- und PR-Arbeit zielgerichtet, messbar und freigabesicher vorbereiten.',
    trainings: [
      {
        type: 'basis',
        title: 'Kampagnenplan mit Ziel-Event',
        acceptance: 'Plan nennt Plattform, Asset, Ziel-KPI, Landing-URL und ersten Messzeitpunkt.',
      },
      {
        type: 'fehlerfall',
        title: 'Draft/Live-Trennung bei Social-Post',
        acceptance: 'Agent erstellt nur Drafts und blockiert Upload, Outreach oder Paid Spend ohne persoenliches OK.',
      },
      {
        type: 'cross-agent',
        title: 'Creative-Pack mit Designer und Audience Intelligence',
        acceptance: 'Designer prueft CD, Audience Intelligence definiert Messung, Manni plant Copy und Timing.',
      },
    ],
  },
  {
    agent: 'Designer',
    goal: 'AIRDOX-Designqualitaet, Vorlagen und Proof-Artefakte wiederholbar sichern.',
    trainings: [
      {
        type: 'basis',
        title: 'Asset gegen Corporate Design pruefen',
        acceptance: 'Review nennt Farbdisziplin, Typografie, Safe-Area, Hook-Frame und final nutzbaren Pfad.',
      },
      {
        type: 'fehlerfall',
        title: 'Statisches Reel als creative_static_risk markieren',
        acceptance: 'Agent fordert Motion-, Equalizer-, Waveform- oder Kinetic-Type-Ueberarbeitung.',
      },
      {
        type: 'cross-agent',
        title: 'Template-Handoff fuer andere Agenten',
        acceptance: 'Vorlage nennt editierbare Felder, Exportziel, Safe-Area-Regeln und erlaubte Nutzer.',
      },
    ],
  },
  {
    agent: 'Mentor',
    goal: 'Agentenbildung, Wissensbasis, Scorecard und Fehlerlernen fuehrend steuern.',
    trainings: [
      {
        type: 'basis',
        title: 'Kompetenzmatrix monatlich aktualisieren',
        acceptance: 'Jeder Agent hat Level, schwaechste Dimension, Belege, offene Trainings und naechste Aktion.',
      },
      {
        type: 'fehlerfall',
        title: 'Research ohne Projektwirkung abfangen',
        acceptance: 'NotebookLM- oder Research-Ergebnis wird erst akzeptiert, wenn Runbook, Gate, Aufgabe oder Scorecard folgt.',
      },
      {
        type: 'cross-agent',
        title: 'Postmortem in Gate/Test/Regel ueberfuehren',
        acceptance: 'Mentor benennt Owner, Reviewer, Folgearbeit, Recheck und Status.',
      },
    ],
  },
  {
    agent: 'Refactor',
    goal: 'Komplexitaet klein, belegbar und rueckfallfaehig reduzieren.',
    trainings: [
      {
        type: 'basis',
        title: 'Kleiner Refactor-Vorschlag',
        acceptance: 'Vorschlag nennt Scope, betroffene Dateien, Nutzen, Risiko, Gates und Rueckfallpfad.',
      },
      {
        type: 'fehlerfall',
        title: 'Zu breiten Umbau stoppen',
        acceptance: 'Agent trennt den Umbau in genehmigungsfaehige kleine Schritte oder eskaliert an Master Controller.',
      },
      {
        type: 'cross-agent',
        title: 'DesktopApp-Komplexitaet mit Winnie und Guardian reduzieren',
        acceptance: 'Winnie prueft Funktion, Guardian Gates, Refactor Scope und Repository Branch-Hygiene.',
      },
    ],
  },
  {
    agent: 'Repository',
    goal: 'Branch-, PR-, Release- und Arbeitsbaum-Hygiene stabilisieren.',
    trainings: [
      {
        type: 'basis',
        title: 'Dirty-State-Review vor Release',
        acceptance: 'Agent trennt eigene, fremde, generierte und releasekritische Aenderungen.',
      },
      {
        type: 'fehlerfall',
        title: 'Mehrdeutige Deployment- oder Branch-Strategie erkennen',
        acceptance: 'Agent fordert primaeren Pfad, Pflichtchecks und Decision-Log-Klarstellung.',
      },
      {
        type: 'cross-agent',
        title: 'PR-Handoff mit Guardian und Master Controller',
        acceptance: 'PR nennt Owner, Gates, Risiko, Master-Freigabe falls gravierend und offene Restpunkte.',
      },
    ],
  },
];

const postmortemBank = [
  {
    id: 'webbie-consent-cwv-gate',
    owner: 'Webbie',
    reviewer: 'Guardian',
    failureClass: 'Website-Aenderung ohne klare Consent-, CSP- oder Core-Web-Vitals-Pruefung.',
    followUp: 'Runbook-Regel und Gate-Hinweis fuer consent-konforme Analytics und CWV-Proof ergaenzen.',
    resolution: 'In Mentor-Gates dokumentiert: Webbie-Aenderungen mit Analytics, Tracking, Consent, CSP oder Performance-Bezug brauchen Gate-Hinweis, passenden npm-Check und Proof-Erwartung.',
    resolutionArtifact: 'docs/agent-system/MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md',
    recheck: 'npm run build plus bei Tracking-/Consent-Aenderungen Guardian-Review.',
    evidence: ['docs/agent-system/latest-audit.md'],
    status: 'closed',
  },
  {
    id: 'winnie-ipc-shell-sandbox-risk',
    owner: 'Winnie',
    reviewer: 'Guardian',
    failureClass: 'Desktop-Pfade mit IPC-, Shell- oder Sandbox-Risiko koennen Release-Risiko erzeugen.',
    followUp: 'Training zu strukturierten APIs, Allowlist und desktop:test:logic plus E2E-Release-Gate.',
    resolution: 'In Mentor-Gates dokumentiert: IPC-, Shell-, Sandbox- und Main/Preload-Aenderungen brauchen strukturierte API/Allowlist, desktop:test:logic und bei Releasewirkung desktop:test:e2e.',
    resolutionArtifact: 'docs/agent-system/MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md',
    recheck: 'npm run desktop:test:logic; bei Releasewirkung npm run desktop:test:e2e.',
    evidence: ['docs/agent-system/latest-audit.md'],
    status: 'closed',
  },
  {
    id: 'repository-dirty-state-release-risk',
    owner: 'Repository',
    reviewer: 'Master Controller',
    failureClass: 'Viele uncommitted Pfade erschweren kontrollierte Releases und Reviews.',
    followUp: 'Dirty-State-Training und Release-Checkliste in Repository-Governance aufnehmen.',
    resolution: 'In Mentor-Gates dokumentiert: vor Release/PR werden eigene, fremde, generierte und releasekritische Aenderungen getrennt; Dirty-State bleibt Blocker fuer Releasefreigabe.',
    resolutionArtifact: 'docs/agent-system/MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md',
    recheck: 'git status --short plus repository:monitor:strict vor Release.',
    evidence: ['docs/agent-system/latest-audit.md'],
    status: 'closed',
  },
  {
    id: 'refactor-source-currency-warning',
    owner: 'Refactor',
    reviewer: 'Mentor',
    failureClass: 'Eine Refactor-Quelle ist nicht erreichbar oder hat sich geaendert.',
    followUp: 'Quelle ersetzen oder fachlich begruenden und Currency-Check erneut ausfuehren.',
    resolution: 'Quelle in mentor-agent-currency auf offizielle Node.js Diagnostics User Journey aktualisiert.',
    resolutionArtifact: 'scripts/mentor-agent-currency.mjs',
    recheck: 'npm run mentor:currency:write.',
    evidence: ['docs/agent-system/latest-agent-currency.md'],
    status: 'closed',
  },
  {
    id: 'mentor-research-to-runbook',
    owner: 'Mentor',
    reviewer: 'Guardian',
    failureClass: 'Research kann als Zusammenfassung enden, ohne Projektregel zu erzeugen.',
    followUp: 'NotebookLM-Ergebnisse nur schliessen, wenn Runbook, Gate, Aufgabe, Scorecard oder Decision-Log-Regel entsteht.',
    resolution: 'Als Bildungsregel in Mentor-Gates, Agenten-Trainingskatalog, Postmortem-Bank und Decision Log umgesetzt.',
    resolutionArtifact: 'docs/agent-system/MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md',
    recheck: 'monthly_learning_review plus npm run mentor:education:write.',
    evidence: ['docs/agent-system/mentor-knowledge-improvement-tasks.json'],
    status: 'closed',
  },
];

const weakestDimensionFrom = ({ auditAgent, currencyAgent, catalogEntry, openPostmortems }) => {
  if (!catalogEntry) return 'Runbook-Qualitaet';
  if (currencyAgent?.status === 'warn') return 'Quellenfrische';
  if ((auditAgent?.checks || []).some((check) => check.status === 'warn' && /risk|freigabe|security|shell|sandbox|consent|csp/i.test(`${check.label} ${check.detail}`))) {
    if (!openPostmortems.length) return 'Ausfuehrungsqualitaet';
    return 'Risikoerkennung';
  }
  if ((auditAgent?.checks || []).some((check) => check.status === 'warn')) return 'Ausfuehrungsqualitaet';
  if (!catalogEntry.trainings?.length) return 'Fehlerlernen';
  return 'Uebergabequalitaet';
};

const levelFrom = ({ auditAgent, currencyAgent, weakestDimension }) => {
  if (!auditAgent) return 'L0';
  if (currencyAgent?.status === 'warn') return 'L2';
  if (auditAgent.score >= 98 && ['Mentor', 'Guardian'].includes(auditAgent.name)) return 'L4';
  if (auditAgent.score >= 90 && weakestDimension !== 'Risikoerkennung') return 'L3';
  if (auditAgent.score >= 80) return 'L2';
  return 'L1';
};

const main = () => {
  const audit = readJson('docs/agent-system/latest-audit.json', {});
  const currency = readJson('docs/agent-system/latest-agent-currency.json', {});
  const auditAgents = Array.isArray(audit.agents) ? audit.agents : [];
  const currencyAgents = Array.isArray(currency.agents) ? currency.agents : [];

  const scorecard = trainingCatalog.map((catalogEntry) => {
    const auditAgent = auditAgents.find((entry) => entry.name === catalogEntry.agent);
    const currencyAgent = currencyAgents.find((entry) => entry.agent === catalogEntry.agent);
    const openPostmortems = postmortemBank.filter((entry) => entry.owner === catalogEntry.agent && entry.status !== 'closed');
    const weakestDimension = weakestDimensionFrom({ auditAgent, currencyAgent, catalogEntry, openPostmortems });
    const level = levelFrom({ auditAgent, currencyAgent, weakestDimension });
    const targetLevel = targetLevels[catalogEntry.agent] || 'L3';
    const nextTraining = catalogEntry.trainings.find((item) => item.type === 'fehlerfall') || catalogEntry.trainings[0];

    return {
      agent: catalogEntry.agent,
      level,
      targetLevel,
      weakestDimension,
      auditScore: auditAgent?.score ?? null,
      sourceStatus: currencyAgent?.status || 'unknown',
      openTrainingItems: catalogEntry.trainings.length,
      openPostmortemItems: openPostmortems.length,
      nextTraining: nextTraining?.title || 'Trainingskatalog pruefen',
      evidence: [
        'docs/agent-system/latest-audit.md',
        'docs/agent-system/latest-agent-currency.md',
        'docs/agent-system/AGENT_TRAINING_CATALOG.md',
        'docs/agent-system/MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md',
        'docs/agent-system/MONTHLY_AGENT_SCHOOL_REVIEW_2026-06-06.md',
      ].filter(exists),
    };
  });

  const agentsAtOrAboveTarget = scorecard.filter((entry) => entry.level >= entry.targetLevel).length;
  const blockers = scorecard.filter((entry) => entry.sourceStatus === 'warn' || entry.weakestDimension === 'Risikoerkennung');
  const report = {
    generatedAt,
    owner: 'Mentor',
    purpose: 'Operationalisiert Agentenbildung ueber Scorecard, Trainingskatalog und Fehler-zu-Gate-Bank.',
    summary: {
      agentsChecked: scorecard.length,
      agentsAtOrAboveTarget,
      blockers: blockers.length,
      status: blockers.length ? 'warn' : 'pass',
    },
    scorecard,
    trainingCatalog,
    postmortemBank,
    nextActions: [
      'Offene Postmortems in Gates, Tests, Runbooks oder dokumentierte Ausnahmen ueberfuehren.',
      'Monatliche Agentenschule mit Basis-, Fehler- und Cross-Agent-Uebungen durchfuehren.',
      'Scorecard nach jedem monthly_learning_review neu schreiben.',
    ],
  };

  const scoreLines = [
    '# AIRDOX Mentor Agentenbildungs-Scorecard',
    '',
    `Erstellt: ${generatedAt}`,
    'Owner: Mentor',
    `Status: ${report.summary.status}`,
    '',
    '## Ueberblick',
    '',
    `- Gepruefte Agenten: ${report.summary.agentsChecked}`,
    `- Auf Zielniveau oder darueber: ${report.summary.agentsAtOrAboveTarget}`,
    `- Blocker/Warnungen: ${report.summary.blockers}`,
    '',
    '## Scorecard',
    '',
    '| Agent | Level | Ziel | Schwaechste Dimension | Audit | Quellen | Naechstes Training | Offene Postmortems |',
    '| --- | --- | --- | --- | ---: | --- | --- | ---: |',
    ...scorecard.map((entry) => `| ${entry.agent} | ${entry.level} | ${entry.targetLevel} | ${entry.weakestDimension} | ${entry.auditScore ?? '-'} | ${entry.sourceStatus} | ${entry.nextTraining} | ${entry.openPostmortemItems} |`),
    '',
    '## Naechste Aktionen',
    '',
    ...report.nextActions.map((item) => `- ${item}`),
  ];

  const trainingLines = [
    '# AIRDOX Agenten-Trainingskatalog',
    '',
    `Erstellt: ${generatedAt}`,
    'Owner: Mentor',
    '',
    ...trainingCatalog.flatMap((entry) => [
      `## ${entry.agent}`,
      '',
      `Ziel: ${entry.goal}`,
      '',
      '| Typ | Training | Akzeptanzkriterium |',
      '| --- | --- | --- |',
      ...entry.trainings.map((item) => `| ${item.type} | ${item.title} | ${item.acceptance} |`),
      '',
    ]),
  ];

  const postmortemLines = [
    '# AIRDOX Mentor Postmortem- und Fehler-zu-Gate-Bank',
    '',
    `Erstellt: ${generatedAt}`,
    'Owner: Mentor',
    '',
    '| ID | Owner | Reviewer | Status | Fehlerklasse | Folgearbeit | Umsetzung | Recheck |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...postmortemBank.map((entry) => `| ${entry.id} | ${entry.owner} | ${entry.reviewer} | ${entry.status} | ${entry.failureClass} | ${entry.followUp} | ${entry.resolutionArtifact}: ${entry.resolution} | ${entry.recheck} |`),
  ];

  if (args.has('--write')) {
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(join(docsDir, 'latest-mentor-agent-education.json'), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(join(docsDir, 'latest-mentor-agent-education.md'), `${scoreLines.join('\n')}\n`);
    writeFileSync(join(docsDir, 'AGENT_TRAINING_CATALOG.json'), `${JSON.stringify({ generatedAt, owner: 'Mentor', trainingCatalog }, null, 2)}\n`);
    writeFileSync(join(docsDir, 'AGENT_TRAINING_CATALOG.md'), `${trainingLines.join('\n')}\n`);
    writeFileSync(join(docsDir, 'MENTOR_POSTMORTEM_BANK.json'), `${JSON.stringify({ generatedAt, owner: 'Mentor', postmortemBank }, null, 2)}\n`);
    writeFileSync(join(docsDir, 'MENTOR_POSTMORTEM_BANK.md'), `${postmortemLines.join('\n')}\n`);
  }

  if (args.has('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  process.stdout.write([
    'Mentor Agent Education: DONE',
    `Status: ${report.summary.status.toUpperCase()}`,
    `Agents checked: ${report.summary.agentsChecked}`,
    `Blockers: ${report.summary.blockers}`,
    args.has('--write') ? 'Reports: docs/agent-system/latest-mentor-agent-education.{json,md}' : '',
  ].filter(Boolean).join('\n'));
  process.stdout.write('\n');

  if (args.has('--strict') && report.summary.status !== 'pass') {
    process.exitCode = 1;
  }
};

main();
