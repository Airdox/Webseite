import {
    Bot,
    BrainCircuit,
    CheckCircle2,
    GitBranch,
    Gauge,
    LockKeyhole,
    Network,
    PlayCircle,
    ShieldCheck,
    Sparkles,
    TerminalSquare,
} from 'lucide-react';

export const copy = {
    de: {
        sectionLabel: '// AGENTEN-SYSTEM',
        title: 'BEWEIS STATT BEHAUPTUNG',
        subtitle: 'So wuerde ich dich ueberzeugen: nicht mit KI-Magie, sondern mit Rollen, Gates, Logs und wiederholbaren Jobs.',
        lastRun: 'Aktueller Audit-Lauf',
        gate: 'Gate',
        gateStatus: 'pass',
        averageScore: 'Audit-Score',
        agentCount: 'aktive Agenten',
        testFiles: 'Test-/Spec-Dateien',
        gateFailures: 'Gate-Fehler',
        proofTab: 'Proof',
        rolesTab: 'Rollen',
        gatesTab: 'Gates',
        liveEvidence: 'Live-Belege aus dem Repo',
        liveEvidenceText: 'Der Audit bewertet Website, Windows Flight Deck, Qualitaet, Promotion, Design, Wissen, Refactoring und Repository-Disziplin. Ein Release darf erst weiter, wenn die Gates passen.',
        commandLabel: 'ausgefuehrt',
        command: 'npm run agent:audit',
        commandResult: 'Average score: 92/100 | Gate: pass',
        decisionTitle: 'Warum das ueberzeugt',
        decisionText: 'Jeder Agent hat einen klaren Verantwortungsbereich, schreibt Artefakte ins Repo und wird ueber Skripte kontrolliert. Das System kann also zeigen, was es getan hat, warum es das getan hat und wo noch Risiko liegt.',
        pipelineTitle: 'Ablauf bei Arbeit',
        approvalTitle: 'Freigabe-Regeln',
        selectedAgent: 'Ausgewaehlter Agent',
        nextAction: 'naechster sinnvoller Hebel',
        scoreLabel: 'Score',
        statusPass: 'bereit',
    },
    en: {
        sectionLabel: '// AGENT SYSTEM',
        title: 'PROOF OVER PROMISE',
        subtitle: 'This is how I would convince you: not with AI mystique, but with roles, gates, logs, and repeatable jobs.',
        lastRun: 'Current audit run',
        gate: 'Gate',
        gateStatus: 'pass',
        averageScore: 'Audit score',
        agentCount: 'active agents',
        testFiles: 'test/spec files',
        gateFailures: 'gate failures',
        proofTab: 'Proof',
        rolesTab: 'Roles',
        gatesTab: 'Gates',
        liveEvidence: 'Repo evidence',
        liveEvidenceText: 'The audit scores website, Windows Flight Deck, quality, promotion, design, knowledge, refactoring, and repository discipline. A release only moves when the gates hold.',
        commandLabel: 'executed',
        command: 'npm run agent:audit',
        commandResult: 'Average score: 92/100 | Gate: pass',
        decisionTitle: 'Why it convinces',
        decisionText: 'Every agent owns a clear responsibility, writes artifacts into the repo, and is controlled through scripts. The system can show what it did, why it did it, and where risk remains.',
        pipelineTitle: 'Work loop',
        approvalTitle: 'Approval rules',
        selectedAgent: 'Selected agent',
        nextAction: 'next useful lever',
        scoreLabel: 'Score',
        statusPass: 'ready',
    },
};

export const agents = [
    {
        name: 'Webbie',
        score: 92,
        icon: Network,
        mission: {
            de: 'Website, UX, SEO, Responsiveness, Performance und Conversion.',
            en: 'Website, UX, SEO, responsiveness, performance, and conversion.',
        },
        proof: {
            de: 'React/Vite-Einstieg, Lazy Loading, SEO-Meta, PWA-Assets und E2E-Abdeckung sind erkannt.',
            en: 'React/Vite entry, lazy loading, SEO meta, PWA assets, and E2E coverage are detected.',
        },
        next: {
            de: 'Core-Web-Vitals als messbares Gate ergaenzen.',
            en: 'Add Core Web Vitals as a measurable gate.',
        },
    },
    {
        name: 'Winnie',
        score: 83,
        icon: TerminalSquare,
        mission: {
            de: 'Windows Flight Deck, lokale Automatisierung, Datenbankkommunikation und Release-Stabilitaet.',
            en: 'Windows Flight Deck, local automation, database flow, and release stability.',
        },
        proof: {
            de: 'Electron-Main, Preload, Renderer, Services, Installer-Helfer und Desktop-Tests sind vorhanden.',
            en: 'Electron main, preload, renderer, services, installer helpers, and desktop tests exist.',
        },
        next: {
            de: 'Desktop-Release-Gate aus Logic-, E2E- und Dist-Build festziehen.',
            en: 'Tighten the desktop release gate with logic, E2E, and distribution builds.',
        },
    },
    {
        name: 'Guardian',
        score: 87,
        icon: ShieldCheck,
        mission: {
            de: 'Qualitaet, Sicherheit, Stabilitaet, Regressionen und technische Schulden.',
            en: 'Quality, safety, stability, regressions, and technical debt.',
        },
        proof: {
            de: 'Build, Lint, Vitest, Playwright, CI-Gate und sauberer Arbeitsbaum werden geprueft.',
            en: 'Build, lint, Vitest, Playwright, CI gate, and clean tree status are checked.',
        },
        next: {
            de: 'Booking, Auth und Analytics gezielt mit Security-Tests absichern.',
            en: 'Add targeted security tests for booking, auth, and analytics.',
        },
    },
    {
        name: 'Manni',
        score: 95,
        icon: Sparkles,
        mission: {
            de: 'Promotion, Branding, EPK, Community, Conversion und Wiedererkennbarkeit.',
            en: 'Promotion, branding, EPK, community, conversion, and memorability.',
        },
        proof: {
            de: 'EPK, Booking, Newsletter, VIP, Social-Meta und Mehrsprachigkeit werden als Reichweitenhebel bewertet.',
            en: 'EPK, booking, newsletter, VIP, social meta, and multilingual reach are scored.',
        },
        next: {
            de: 'Conversion-Events fuer Booking, Newsletter, VIP und Set-Play sichtbar auswerten.',
            en: 'Make conversion events for booking, newsletter, VIP, and set plays visible.',
        },
    },
    {
        name: 'Designer',
        score: 100,
        icon: Bot,
        mission: {
            de: 'Visual Design, Creative Direction und Social-Asset-Qualitaet.',
            en: 'Visual design, creative direction, and social asset quality.',
        },
        proof: {
            de: 'Growth-Playbook, Reel-Factory, Queue, Wochenplan und Proof-Assets sind verbunden.',
            en: 'Growth playbook, reel factory, queue, weekly plan, and proof assets are connected.',
        },
        next: {
            de: 'Hook-Varianten und First-Frame-Bibliothek fuer wiederholbare Tests ausbauen.',
            en: 'Expand hook variants and a first-frame library for repeatable tests.',
        },
    },
    {
        name: 'Mentor',
        score: 100,
        icon: BrainCircuit,
        mission: {
            de: 'Wissensspeicherung, Lernschleifen, Prozessverbesserung und Agenten-Weiterentwicklung.',
            en: 'Knowledge storage, learning loops, process improvement, and agent evolution.',
        },
        proof: {
            de: 'Wiki, Decision Log, Operating Model, Entwicklerhandbuch und Assistant-Testsignale werden gefunden.',
            en: 'Wiki, decision log, operating model, developer guide, and assistant test signals are found.',
        },
        next: {
            de: 'Wiederholfehler konsequent in Tests oder Wiki-Regeln ueberfuehren.',
            en: 'Turn repeated failures into tests or wiki rules.',
        },
    },
    {
        name: 'Refactor',
        score: 86,
        icon: GitBranch,
        mission: {
            de: 'Systemoptimierung, Verschlankung, Architekturqualitaet und technische Effizienz.',
            en: 'System optimization, simplification, architecture quality, and technical efficiency.',
        },
        proof: {
            de: 'Modulgrenzen, grosse JSX-Dateien, Deployment-Drift und Dependency-Footprint werden gemessen.',
            en: 'Module boundaries, large JSX files, deployment drift, and dependency footprint are measured.',
        },
        next: {
            de: 'Grosse Desktop-Komponenten schrittweise in getestete Subkomponenten schneiden.',
            en: 'Split large desktop components into tested subcomponents step by step.',
        },
    },
    {
        name: 'Repository',
        score: 95,
        icon: CheckCircle2,
        mission: {
            de: 'Quellcodeverwaltung, GitHub-Disziplin, Branching, Versionierung und Merge-Stabilitaet.',
            en: 'Source control, GitHub discipline, branching, versioning, and merge stability.',
        },
        proof: {
            de: 'Governance, Workflows, Monitoring, Branch-Hinweise und Change-Tracking sind verankert.',
            en: 'Governance, workflows, monitoring, branch guidance, and change tracking are anchored.',
        },
        next: {
            de: 'Branch-Schutzregeln mit Pflicht-Checks verknuepfen.',
            en: 'Connect branch protection rules to required checks.',
        },
    },
];

export const pipeline = [
    {
        icon: PlayCircle,
        title: { de: 'Intake', en: 'Intake' },
        text: {
            de: 'Ziel, Produktbereich, Risiko und Trigger werden zuerst festgelegt.',
            en: 'Goal, product area, risk, and trigger are defined first.',
        },
    },
    {
        icon: Gauge,
        title: { de: 'Audit', en: 'Audit' },
        text: {
            de: 'Agenten bewerten reale Dateien, Skripte, Tests, Doku und Arbeitsbaumzustand.',
            en: 'Agents score real files, scripts, tests, docs, and working tree state.',
        },
    },
    {
        icon: ShieldCheck,
        title: { de: 'Gate', en: 'Gate' },
        text: {
            de: 'Fehler blockieren, Warnungen werden sichtbar, Releases bekommen klare Pflichtchecks.',
            en: 'Failures block, warnings stay visible, releases get explicit required checks.',
        },
    },
    {
        icon: BrainCircuit,
        title: { de: 'Lernen', en: 'Learning' },
        text: {
            de: 'Entscheidungen, Fehlerursachen und neue Regeln landen im Decision Log oder Wiki.',
            en: 'Decisions, causes, and new rules are written to the decision log or wiki.',
        },
    },
];

export const approvalRules = [
    {
        icon: LockKeyhole,
        title: { de: 'Gravierende Aenderung', en: 'Major change' },
        text: {
            de: 'Nur mit Master-Controller-Freigabe, sonst wird der Job protokolliert und uebersprungen.',
            en: 'Requires Master Controller approval or the job is logged and skipped.',
        },
    },
    {
        icon: ShieldCheck,
        title: { de: 'Social live', en: 'Social live' },
        text: {
            de: 'Externe Live-Ausspielung braucht persoenliches Nutzer-OK; Drafts bleiben intern.',
            en: 'External live publishing needs personal user approval; drafts stay internal.',
        },
    },
    {
        icon: CheckCircle2,
        title: { de: 'Release-Kandidat', en: 'Release candidate' },
        text: {
            de: 'Strict Audit, Job-Validierung, Task-Gate, Master-Gate und Repository-Monitor laufen vor Merge.',
            en: 'Strict audit, job validation, task gate, master gate, and repository monitor run before merge.',
        },
    },
];

export const metrics = [
    { value: '92/100', key: 'averageScore' },
    { value: '8', key: 'agentCount' },
    { value: '18', key: 'testFiles' },
    { value: '0', key: 'gateFailures' },
];

export const tabs = [
    { id: 'proof', icon: Gauge, labelKey: 'proofTab' },
    { id: 'roles', icon: Network, labelKey: 'rolesTab' },
    { id: 'gates', icon: ShieldCheck, labelKey: 'gatesTab' },
];
