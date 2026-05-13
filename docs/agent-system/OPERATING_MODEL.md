# AIRDOX Multi-Agent Operating Model

Stand: 2026-05-02

Dieses Modell uebersetzt den Masterprompt in eine konkret ausfuehrbare Projektstruktur. Es ersetzt keine dauerhaft laufende KI, sondern definiert Rollen, Pruefpunkte, Speicherorte und wiederholbare Audit-Zyklen, die im Repo versioniert und getestet werden koennen.

## Ziel

Das System fuehrt Website, Windows Flight Deck, Qualitaet, Promotion und Wissen in einem gemeinsamen Verbesserungsprozess zusammen.

Kernprinzipien:

- Jede Entscheidung bekommt einen nachpruefbaren Ort im Repo.
- Jeder Agent liefert konkrete Artefakte, keine losen Ideen.
- Qualitaet wird vor Releases durch automatisierte Checks erzwungen.
- Lernen entsteht aus Audit-Ergebnissen, Fehlern, Nutzerfeedback und dokumentierten Entscheidungen.
- Gravierende Aenderungen sind nur mit ausdruecklicher Master-Controller-Freigabe erlaubt.
- Wenn Informationen fehlen, beschafft der Agent sie aktiv (Messdaten, Repo-Kontext, Dokumentation) oder fordert sie gezielt beim Nutzer an.

## Rollen

| Rolle | Verantwortlich fuer | Primaere Artefakte | Messpunkte |
| --- | --- | --- | --- |
| Master Controller | Priorisierung, Konflikte, Release-Entscheidungen | `docs/agent-system/DECISION_LOG.md`, Audit-Berichte | Durchlaufzeit, Risikoabbau, Release-Bereitschaft |
| Webbie | Webseite, UI/UX, SEO, Accessibility, Performance | `src/components/*`, `src/styles/*`, `public/*`, `e2e/*` | Core Web Vitals, Conversion, E2E-Stabilitaet |
| Winnie | Windows Flight Deck, lokale Workflows, Daten/Upload/Pipeline | `desktop/*`, `src/desktop/*`, `scripts/*`, `docs/WINDOWS_FLIGHTDECK.md` | Publish-Erfolg, Absturzrate, Build-Erfolg |
| Guardian | QA, Sicherheit, Konsistenz, technische Schulden | Test-Suites, Lint-Regeln, Release-Gates | Failures, Coverage-Signale, offene Risiken |
| Manni | Promotion, Branding, EPK, Community, Wachstum, PR-Kampagnen | SEO-Meta, EPK, Booking, Newsletter, VIP, Kampagnenplan, PR-Preview-Pakete | Booking-, Newsletter-, VIP-, Play- und Kampagnen-Events |
| Designer | Visual Systems, Creative Direction, Social Asset Design | Reel-Konzepte, Hook-Frames, Thumbnail-Richtungen, Visual-Checks | Hook-Retention, Scroll-Stop-Rate, Creative-Fatigue |
| Mentor | Lernsystem, Wissensspeicher, Skill-Updates | `airdoX_wiki/*`, Agenten-Dokumente, Audit-Historie | geschlossene Wissensluecken, Wiederholfehler |
| Refactor | Systemoptimierung, Verschlankung, Architekturqualitaet | `scripts/agent-audit.mjs`, Refactor-Wiki, Quality-Skripte | Komplexitaet, Modulgrenzen, Build-/Lint-Sauberkeit |
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
```

Regel:

- `changeClass: gravierend` darf nur laufen, wenn `requiresMasterApproval: true` gesetzt ist und eine explizite Freigabe vorliegt.
- Jobs mit `outputVisibility: external_live` duerfen nur mit `requiresUserApproval: true` und explizitem persoenlichem Nutzer-OK ausgefuehrt werden.
- Manni darf PR-Kampagnen nach aussen vorbereiten und dem Nutzer zeigen; die Online-Schaltung laeuft ueber `pr-campaign-live-publish` und bleibt bis zur Bestaetigung blockiert.
- Ohne Freigabe werden gravierende Jobs automatisch als `skipped` protokolliert.
- Jeder Lauf schreibt Reports nach `docs/agent-system/latest-job-run.{json,md}`.

## Persistente Erinnerung

Das System speichert Wissen in vier Ebenen:

| Ebene | Zweck |
| --- | --- |
| `docs/agent-system/DECISION_LOG.md` | Strategische Entscheidungen und Architekturregeln |
| `docs/agent-system/latest-audit.md` | Letzter maschineller Agenten-Audit |
| `airdoX_wiki/wiki/*` | Verdichtetes Fachwissen, Fehlerloesungen und Workflows |
| Tests | Aus Fehlern abgeleitete, maschinell pruefbare Erfahrung |

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
- Refactor: grosse Dateien, Deployment-Drift, generierte Artefakte, Abhaengigkeiten, Modulgrenzen.
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
- Keine Website-Layout-Aenderung ohne mobile und desktoprelevante Sichtpruefung oder E2E-Abdeckung.
- Kein Refactoring ohne klare Vorher-/Nachher-Begruendung und passende Rechecks.
- Keine Merge-/Release-Aktion ohne dokumentierte Branch-Regel und qualifizierende Quality-Gates.
- Kein Superagent darf ohne Master-Controller-Freigabe gravierende Aenderungen ausfuehren.
- Wiederholte Fehler werden in Tests oder Wiki-Regeln ueberfuehrt.
