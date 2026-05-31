# AIRDOX Multi-Agent Operating Model

Stand: 2026-05-02

Dieses Modell uebersetzt den Masterprompt in eine konkret ausfuehrbare Projektstruktur. Es ersetzt keine dauerhaft laufende KI, sondern definiert Rollen, Pruefpunkte, Speicherorte und wiederholbare Audit-Zyklen, die im Repo versioniert und getestet werden koennen.

## Ziel

Das System fuehrt Website, Windows Flight Deck, Qualitaet, Promotion und Wissen in einem gemeinsamen Verbesserungsprozess zusammen.

Kernprinzipien:

- Jede Entscheidung bekommt einen nachpruefbaren Ort im Repo.
- Jeder Agent liefert konkrete Artefakte, keine losen Ideen.
- Jede Workbench-Aenderung wird von der Routing-Schicht gesichtet. Betroffene Agenten wachen auf, unbetroffene Agenten schlafen weiter.
- Agenten warten aktiv aufeinander: Jeder relevante Output benennt den naechsten Agenten, die offene Abhaengigkeit und den Nutzer-Touchpoint.
- Qualitaet wird vor Releases durch automatisierte Checks erzwungen.
- Lernen entsteht aus Audit-Ergebnissen, Fehlern, Nutzerfeedback und dokumentierten Entscheidungen.
- Gravierende Aenderungen sind nur mit ausdruecklicher Master-Controller-Freigabe erlaubt.
- Wenn Informationen fehlen, beschafft der Agent sie aktiv (Messdaten, Repo-Kontext, Dokumentation) oder fordert sie gezielt beim Nutzer an.

## Rollen

| Rolle | Verantwortlich fuer | Primaere Artefakte | Messpunkte |
| --- | --- | --- | --- |
| Master Controller | Priorisierung, Konflikte, Release-Entscheidungen | `docs/agent-system/DECISION_LOG.md`, Audit-Berichte | Durchlaufzeit, Risikoabbau, Release-Bereitschaft |
| Webbie | Webseite, UI/UX, SEO, Accessibility, Performance | `src/components/*`, `src/styles/*`, `public/*`, `e2e/*` | Core Web Vitals, Conversion, E2E-Stabilitaet |
| Winnie | Windows Flight Deck, lokale Workflows, Daten/Upload/Pipeline, operative Desktop-UI | `desktop/*`, `src/desktop/*`, `scripts/*`, `docs/WINDOWS_FLIGHTDECK.md` | Publish-Erfolg, Absturzrate, Build-Erfolg, Bedienbarkeit im Windows Tool |
| Guardian | QA, Sicherheit, Konsistenz, technische Schulden | Test-Suites, Lint-Regeln, Release-Gates | Failures, Coverage-Signale, offene Risiken |
| Manni | Promotion, Branding, EPK, Community, Wachstum, PR-Kampagnen | SEO-Meta, EPK, Booking, Newsletter, VIP, Kampagnenplan, PR-Preview-Pakete | Booking-, Newsletter-, VIP-, Play- und Kampagnen-Events |
| Designer | Visual Systems, Creative Direction, Flight-Deck-CD-Review, Motion/Audio-reactive Social Asset Design | Reel-Konzepte, Hook-Frames, Thumbnail-Richtungen, Motion-Briefings, Visual-Checks, Desktop-UI-CD-Review | Hook-Retention, Scroll-Stop-Rate, Creative-Fatigue, Surprise-Factor, CD-Konsistenz im Windows Tool |
| Mentor | Lernsystem, Wissensspeicher, Skill-Updates | `airdoX_wiki/*`, Agenten-Dokumente, Audit-Historie | geschlossene Wissensluecken, Wiederholfehler |
| Audience Intelligence | Consent-basierte Zielgruppen-, Funnel- und Rentabilitaetsauswertung | `latest-audience-intelligence.*`, `latest-website-profitability.*`, `website-profitability-model.json` | consented Events, Funnel-Rates, estimated Gross Value, estimated Net Value, ROI-Status |
| Deep Research | NotebookLM-/Research-Ingest, Wissens-Sondierung, Uebersetzung in Agenten-Aufgaben | `latest-notebooklm-brief.*`, `latest-agent-task-queue.json`, Research-Playbooks | nutzbare Folgeaufgaben, verwertete Quellen, weniger Research-Leerlauf |
| Refactor | Systemoptimierung, Verschlankung, Architekturqualitaet, Website-Stabilitaet | `scripts/agent-audit.mjs`, `scripts/refactor-website-opportunities.mjs`, Refactor-Wiki, Quality-Skripte | Erreichbarkeit, Funktionalitaet, Komplexitaet, Modulgrenzen, Build-/Lint-Sauberkeit |
| Repository | GitHub- und Branch-Organisation, Versionskontrolle, Release-Flow | `docs/agent-system/REPOSITORY_GOVERNANCE.md`, Workflows, Branch-Regeln | Branch-Disziplin, Commit-Qualitaet, Merge-Stabilitaet |

Aufgaben- und Trigger-Zuweisungen liegen in:
- `docs/agent-system/SUPERAGENT_ASSIGNMENTS.md`

## Master Controller Loop

1. Intake
   Erfasse Ziel, betroffene Produktbereiche und Risiken.

2. Agenten-Audit
   Fuehre `npm run agent:audit` aus und pruefe Scores, Warnungen und Gate-Fehler.

3. Priorisierung
   Ordne Aufgaben nach Nutzerwirkung, Risiko, Aufwand und strategischer Bedeutung.

4. Umsetzung
   Aendere nur die betroffenen Module. Website-, Desktop-, QA-, Promotion- und Wissensartefakte bleiben klar getrennt.

5. Verifikation
   Waehle Gates passend zum Risiko:
   - Website: `npm run build`, relevante Vitest-Tests, relevante Playwright-Specs.
   - Windows Tool: `npm run desktop:test:logic`, bei Release `npm run desktop:test:e2e`, optional `npm run desktop:dist`.
   - Windows-Tool-UI: Winnie setzt um, Designer prueft Corporate Design und Bedienbild, Guardian prueft Gate-Risiko.
   - Allgemein: `npm run lint`, `npm run test`, `npm run agent:audit`.

6. Lernen
   Halte wichtige Entscheidungen, Fehlerursachen und neue Regeln im Decision Log oder Wiki fest.

## Kommunikationsformat

Agentennamen sind verbindlich. In Logs, Aufgaben und Berichten duerfen nur diese Systemnamen verwendet werden:

- Master Controller
- Webbie
- Winnie
- Guardian
- Manni
- Designer
- Mentor
- Audience Intelligence
- Deep Research
- Refactor
- Repository

Jeder Agentenbericht folgt diesem Schema:

```text
Agent:
Zustand:
Risiken:
Empfehlung:
Betroffene Dateien:
Pruefung:
Naechster Lernpunkt:
```

Der Master Controller entscheidet danach:

- umsetzen
- zurueckstellen
- weiter untersuchen
- als Risiko fuer Release markieren

## Job-Orchestrierung

Der operative Ablauf fuer Agentenjobs liegt zentral in:

- `docs/agent-system/job-catalog.json`
- `docs/agent-system/ORCHESTRATION_WORKFLOW.md`

Job-Ausfuehrung und Validierung:

```powershell
npm run agent:jobs:validate
npm run agent:jobs:run -- --event=manual_background --status=standard
npm run agent:system:health
```

Regel:

- `changeClass: gravierend` darf nur laufen, wenn `requiresMasterApproval: true` gesetzt ist und eine explizite Freigabe vorliegt.
- Jobs mit `outputVisibility: external_live` duerfen nur mit `requiresUserApproval: true` und explizitem persoenlichem Nutzer-OK ausgefuehrt werden.
- Manni darf PR-Kampagnen nach aussen vorbereiten und dem Nutzer zeigen; die Online-Schaltung laeuft ueber `pr-campaign-live-publish` und bleibt bis zur Bestaetigung blockiert.
- Ohne Freigabe werden gravierende Jobs automatisch als `skipped` protokolliert.
- Jeder Lauf schreibt Reports nach `docs/agent-system/latest-job-run.{json,md}`.
- `agent:system:health` erzeugt das aktuelle Architekturdiagramm und meldet veraltete Reports, fehlende Workflows, fehlende Scheduler-Pfade und Katalog-/Package-Abweichungen.

## Permanente Ausfuehrung

Es gibt zwei gleichwertige Taktgeber:

- GitHub: `.github/workflows/agent-background-monitor.yml` laeuft alle sechs Stunden und kann manuell gestartet werden.
- Lokal/Windows: `npm run agents:background:task` registriert eine Windows Scheduled Task, die `agents:background:deep` alle sechs Stunden startet.

Der Background-Cycle ist die verbindliche Reihenfolge:

1. Job-Katalog validieren.
2. Workbench-Aenderungen routen.
3. Quality-Chain erzeugen.
4. Passende Jobs ausfuehren.
5. Dependency-Radar aktualisieren.
6. System-Health und Diagramm schreiben.

Damit ist "selbststaendig" im Projektkontext definiert: Wiederholbare, protokollierte, freigabegeschuetzte Automatisierung. Dauerhaft laufende KI-Prozesse werden nicht behauptet; stattdessen werden konkrete Skripte, Reports, Scheduler und Gates versioniert.

## Workbench-Wakeup-Modell

Alle Agenten beobachten Aenderungen ueber den Master-Controller-Router:

```powershell
npm run agent:route:write
npm run agent:dependencies:write
```

Der Routing-Report ordnet geaenderte Dateien Agenten zu. Der Dependency-Radar verdichtet daraus:

- welcher Agent durch welche Workbench-Aenderung wach werden muss,
- ob daraus Arbeit, Review, Content-Bedarf oder nur Beobachtung entsteht,
- welcher Agent auf wen wartet,
- wann der Nutzer gezielt angesprochen werden muss.

Regel:

- Jeder Agent sondiert nur Aenderungen, die in seinen Bereich fallen koennen.
- Kein Agent blockiert still. Wenn ein Agent Content, Freigabe, Messdaten oder eine Richtungsentscheidung braucht, schreibt er das als konkrete Abhaengigkeit in den Radar.
- Nutzer-Touchpoints muessen konkret sein: eine Frage, ein benoetigtes Asset, eine Freigabe oder eine Entscheidung. Keine vagen Erinnerungen.
- Live-Posting, Paid Spend, Deploys und gravierende Aenderungen bleiben trotz Wakeup-Modell freigabepflichtig.

Reports:

- `docs/agent-system/latest-agent-routing.md`
- `docs/agent-system/latest-agent-quality-chain.md`
- `docs/agent-system/latest-agent-dependency-radar.md`
- `docs/agent-system/latest-website-profitability.md`

Die stabilen Watch-Zonen liegen in:

- `docs/agent-system/agent-watch-zones.json`

Jede Watch-Zone hat einen Primary-Agent und optionale Review-Agenten. Mehrfachzustaendigkeit ist erlaubt; die Entscheidung, wer wann arbeitet, liegt beim Master Controller.

## Orchestrator Request Gate

Agenten duerfen nicht wild parallel in ihrem Bereich arbeiten. Der Ablauf ist:

1. Agent erkennt ueber Watch-Zone oder Routing eine relevante Aenderung.
2. Agent formuliert beim Master Controller einen Arbeitsantrag: Ziel, betroffene Dateien, erwarteter Output, Risiko, benoetigte Gates.
3. Master Controller ordnet die Arbeit an, reiht sie ein oder verweigert sie.
4. Interne Drafts, Tests, Prototypen und Reports duerfen nach Orchestrator-Anordnung automatisiert laufen.
5. Alles, was live geht, extern postet, deployt, Budget ausgibt oder produktive Daten veraendert, bleibt bis zum persoenlichen Nutzer-OK blockiert.

## Quality-Chain-Pflicht

Wenn neuer Code sichtbare Funktionen, Menueeintraege, Tabs, Bereiche, Buttons, Modale, Player-Verhalten, Desktop-Workflows oder Server-/Script-Logik aendert, entsteht automatisch eine Testpflicht:

```powershell
npm run agent:quality-chain:write
```

Guardian ist dann nicht nur Review-Agent, sondern Nachlauf-Agent:

- erkennt betroffene UI-/Codebereiche aus der Workbench,
- benennt den Primaer-Owner, z. B. Webbie oder Winnie,
- meldet fehlende oder unklare Tests als Verpflichtung,
- fordert gezielt Tests, E2E-Proof oder Validierung ein,
- schreibt Report und laesst den Owner nicht still weiterlaufen.

Regel:

- Neue sichtbare UI ohne passenden Test-/Proof-Pfad bleibt `tests_required`.
- Neue Desktop-/Flight-Deck-Funktion braucht mindestens `desktop:test:logic`, bei sichtbarem Verhalten E2E/Proof.
- Neue Website-Funktion braucht mindestens Lint, relevante Tests und Build.
- Neue Scripts/API-/Worker-Logik braucht einen schmalen Validierungsbefehl oder Test.
- Wenn Verhalten unklar ist, fragt der verantwortliche Agent den Nutzer nach Akzeptanzkriterien. Wenn Verhalten klar ist, schreibt oder fordert er die Tests selbst.

## Persistente Erinnerung

Das System speichert Wissen in vier Ebenen:

| Ebene | Zweck |
| --- | --- |
| `docs/agent-system/DECISION_LOG.md` | Strategische Entscheidungen und Architekturregeln |
| `docs/agent-system/latest-audit.md` | Letzter maschineller Agenten-Audit |
| `docs/agent-system/latest-agent-task-queue.json` | Pflichtaufgaben aus Research, Routing und Orchestrierung |
| `airdoX_wiki/wiki/*` | Verdichtetes Fachwissen, Fehlerloesungen und Workflows |
| Tests | Aus Fehlern abgeleitete, maschinell pruefbare Erfahrung |

## Research-to-Production Loop

NotebookLM- oder Deep-Research-Outputs gelten nicht als erledigt, wenn sie nur als Datei abgelegt wurden. Der Deep-Research-Agent muss daraus eine operative Uebersetzung erzeugen:

- `latest-notebooklm-brief.md/json`: Was ist neu, was ist verwertbar, welche Risiken gibt es.
- `latest-agent-task-queue.json`: konkrete Aufgaben fuer Orchestrator, Designer, Renderer, Publisher, Quality oder Research, jeweils mit Acceptance-Kriterium.
- Der Master Controller behandelt Queue-Eintraege als Pflichtinput fuer die naechste Planung. Wenn ein Unteragent den Input nicht selbst abholt, wird die Aufgabe explizit zugewiesen.

Fuer lange YouTube-Sets gilt: kein manuell durchanimiertes Mehrstunden-Video. Die Produktionslogik ist eine Loop-Bibliothek aus 10- bis 60-Sekunden-Szenen plus audio-reaktiver Modulation, Kapitelvariation, Safe-Area-Pruefung und automatischem ffmpeg-Assembly.

## Website-Rentabilitaetsloop

Website-Optimierung gilt erst als steuerbar, wenn sie an messbare, consent-basierte Ereignisse gekoppelt ist. Die verbindliche Kette ist:

1. Webbie stellt sicher, dass zentrale Website-Aktionen als Events aus `audience-signal-taxonomy.json` messbar sind.
2. Manni versieht Kampagnen, Social-Drafts und Landing-URLs mit Ziel-Event, Zielwert und erwarteter Wirkung.
3. Audience Intelligence erzeugt `latest-audience-intelligence.*` und `latest-website-profitability.*`.
4. Guardian prueft Datenschutz, Tests und ob keine personenbezogenen Felder in Analysepfade gelangen.
5. Master Controller priorisiert Website-Arbeit nach erwarteter Wirkung, Risiko, Aufwand und `estimatedNetValue`.

Der Rentabilitaetsreport wird mit folgendem Befehl erzeugt:

```powershell
npm run website:profitability
```

Regeln:

- Bei `no_measurement_data` wird nicht nach Bauchgefuehl optimiert; zuerst muss ein consented Event-Export entstehen.
- Bei `value_detected_costs_missing` muessen echte Kosten in `website-profitability-model.json` gepflegt werden, bevor ROI als Business-Kennzahl gilt.
- Planungswerte duerfen Kampagnen priorisieren, ersetzen aber keine echten Booking-Umsaetze, Kosten oder Plattform-Exports.

## Automatisierter Audit

Der schnelle Statuslauf:

```powershell
npm run agent:audit
```

Audit mit gespeicherten Artefakten:

```powershell
npm run agent:audit:write
```

Strikter Lauf fuer Release-Gates:

```powershell
npm run agent:audit -- --strict
```

Der Audit bewertet:

- Webbie: Website-Struktur, SEO/PWA, E2E-Signale, responsive CSS-Signale.
- Winnie: Electron/Flightdeck-Struktur, Services, Tests, Installer- und Dokumentationssignale.
- Guardian: Build/Lint/Test-Skripte, Testdateien, Arbeitsbaumzustand und Konfigurationsgrundlagen.
- Manni: Marke, EPK, Booking, Newsletter, VIP, Social- und Suchmaschinen-Signale.
- Designer: visuelle Konsistenz, Creative-Richtung und Design-Readiness fuer Social-Ausspielungen.
- Mentor: Wiki, Masterplan, Agentendokumentation, Audit-Skript und Assistant-Testsignale.
- Refactor: grosse Dateien, Deployment-Drift, generierte Artefakte, Abhaengigkeiten, Modulgrenzen, Website-Service-Flows, Erreichbarkeits- und Funktionalitaetsrisiken.
- Repository: Branching, Workflows, Commit-/PR-Standards, Change-Tracking und Release-Disziplin.

Ergaenzender Workflow-Check:

- `npm run agent:jobs:validate -- --strict-warnings`

## Cadence

| Zeitpunkt | Aktion |
| --- | --- |
| Bei jeder groesseren Aenderung | `npm run agent:audit`, relevante Tests |
| Vor Website-Deploy | Webbie + Guardian Gates, Build, E2E-Sanity |
| Vor Windows-Release | Winnie + Guardian Gates, Desktop-Tests, Installer-Check |
| Woechentlich | Decision Log und Wiki aktualisieren |
| Monatlich | Promotion-/SEO-/UX-Roadmap gegen echte Kennzahlen pruefen |
| Alle 6 Stunden (automatisiert) | Hintergrundzyklus: `agents:background:deep` (Audit, Repository-Monitor, Desktop-Logic-Tests) |

## Nicht verhandelbare Regeln

- Keine dauerhafte "Selbstoptimierung" ohne nachvollziehbare Logs, Tests oder Pull-Request-aehnliche Artefakte.
- Keine Promotion-Aenderung ohne Tracking- oder Zielmetriken.
- Keine Windows-Pipeline-Aenderung ohne mindestens einen Logic-Test.
- Keine sichtbare Windows-Tool-UI-Aenderung ohne Winnie als Primary und Designer als CD-Review; Guardian bleibt Gate-Review bei Release- oder Risikoauswirkung.
- Keine Website-Layout-Aenderung ohne mobile und desktoprelevante Sichtpruefung oder E2E-Abdeckung.
- Kein Refactoring ohne klare Vorher-/Nachher-Begruendung und passende Rechecks.
- Keine Merge-/Release-Aktion ohne dokumentierte Branch-Regel und qualifizierende Quality-Gates.
- Kein Superagent darf ohne Master-Controller-Freigabe gravierende Aenderungen ausfuehren.
- Wiederholte Fehler werden in Tests oder Wiki-Regeln ueberfuehrt.
