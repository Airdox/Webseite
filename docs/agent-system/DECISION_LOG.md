# AIRDOX Agent Decision Log

Dieses Log speichert strategische Entscheidungen des Multi-Agenten-Systems. Kurze Eintraege sind beabsichtigt: Datum, Kontext, Entscheidung, Risiko, Recheck.

## 2026-05-02 - Multi-Agenten-System als ausfuehrbarer Audit-Loop

Kontext:
- Der Masterprompt fordert permanente Agenten fuer Website, Windows Tool, Qualitaet, Promotion und Lernen.
- Das Repo enthaelt bereits Website, Flight Deck, Wiki, Tests, Proof-Artefakte und Deployment-Skripte.
- Der Arbeitsbaum ist stark veraendert; Releases brauchen strengere Gates als normale Entwicklungsarbeit.

Entscheidung:
- Das System wird als versioniertes Operating Model plus maschineller Audit umgesetzt.
- `scripts/agent-audit.mjs` bewertet Webbie, Winnie, Guardian, Manni, Designer und Mentor.
- `npm run agent:audit` dient als schneller Statuslauf, `npm run agent:audit:write` speichert den letzten Audit.
- Echte Dauerautonomie wird nicht behauptet; Lernen entsteht durch Logs, Tests, Wiki-Eintraege und wiederholbare Checks.

Risiko:
- Ohne CI kann ein lokaler Audit vergessen werden.
- Bestehende uncommitted Aenderungen koennen Audit-Ergebnisse verrauschen.
- Einige Promotion-/Newsletter-/EPK-Luecken sind produktrelevant, aber noch nicht behoben.

Recheck:
- `npm run agent:audit`
- `npm run lint`
- `npm run test -- --run`
- `npm run build`
- Bei Desktop-Aenderungen: `npm run desktop:test:logic`

## 2026-05-02 - Namenszwang und Refactor-Agent

Kontext:
- Der Nutzer hat verbindliche Agentennamen und einen sechsten Superagenten `Refactor` definiert.

Entscheidung:
- Logs, Audit-Ausgaben und Aufgaben verwenden nur die Namen Master Controller, Webbie, Winnie, Guardian, Manni, Designer, Mentor, Refactor und Repository.
- `Refactor` wird in `scripts/agent-audit.mjs`, Operating Model und Wiki als eigener Audit-Agent aufgenommen.

Risiko:
- Externe Subagent-Tools koennen technische Nicknames erzeugen. Diese gelten nicht als Systemidentitaet und werden nicht fuer Architektur, Logs oder Berichte verwendet.

Recheck:
- `npm run agent:audit`

## 2026-05-02 - Repository-Superagent aufgenommen

Kontext:
- Der Nutzer hat den siebten Superagenten `Repository` fuer GitHub, Branching, Commit-Qualitaet und Versionskontrolle definiert.

Entscheidung:
- `Repository` wird als feste Agentenidentitaet im Operating Model und Audit erfasst.
- `docs/agent-system/REPOSITORY_GOVERNANCE.md` definiert Branch-, Commit-, PR- und Merge-Regeln.
- `scripts/agent-audit.mjs` bewertet `Repository` mit strukturellen Repo-Checks.

Risiko:
- Ein lokales Audit ersetzt keine echten GitHub Branch-Protection-Regeln.
- Der aktuell grosse Worktree-Zustand bleibt ein Merge- und Release-Risiko.

Recheck:
- `npm run agent:audit -- --strict`
- `npm run quality:web`

## 2026-05-02 - Repository bekommt Bereinigung und Monitoring

Kontext:
- Die Aufgabe fuer den Agenten `Repository` wurde auf aktive Bereinigung und laufende Ueberwachung der Quellcodeverwaltung ausgedehnt.

Entscheidung:
- `scripts/repository-monitor.mjs` wurde als operatives Monitoring eingefuehrt.
- Neue Kommandos: `repository:monitor`, `repository:monitor:write`, `repository:monitor:strict`.
- Die Governance fordert den Repository-Monitor jetzt explizit vor Merge/Release.
- `agent-audit` prueft, ob das Monitoring-Skript vorhanden und angebunden ist.

Risiko:
- `repository:monitor:strict` kann bei bewusst offenen Worktrees erwartungsgemaess fehlschlagen.

Recheck:
- `npm run repository:monitor`
- `npm run agent:audit -- --strict`

## 2026-05-02 - Superagenten duerfen gravierende Aenderungen nur via Master Controller

Kontext:
- Die Superagenten sollen Aufgaben nach Faehigkeit und Ereignis ausfuehren, aber ohne eigenstaendige gravierende Eingriffe.

Entscheidung:
- `docs/agent-system/SUPERAGENT_ASSIGNMENTS.md` definiert Faehigkeiten, Trigger und erlaubte Aktionen je Agent.
- PRs erhalten eine verbindliche Vorlage mit Freigabe-Block.
- CI erzwingt Master-Controller-Freigabe ueber `npm run master:gate`.

Risiko:
- Ohne Label/Token im PR blockiert CI absichtlich auch technisch korrekte Aenderungen.

Recheck:
- `npm run master:gate`
- `npm run agent:audit -- --strict`

## 2026-05-02 - Agenten laufen automatisiert im Hintergrundzyklus

Kontext:
- Die Agentenarbeit soll nicht nur manuell, sondern regelmaessig automatisiert im Hintergrund passieren.

Entscheidung:
- `scripts/agent-background-cycle.mjs` fuehrt Audit, Repository-Monitoring und optional Desktop-Logic-Tests sequenziell aus.
- `agent-background-monitor.yml` startet den tiefen Zyklus automatisch alle 6 Stunden.
- Berichte werden als Artefakte gespeichert und stehen fuer laufende Beobachtung bereit.

Risiko:
- Ein stark veraenderter lokaler Worktree bleibt sichtbar und muss weiterhin inhaltlich bereinigt werden.

Recheck:
- `npm run agents:background`
- `npm run agents:background:deep`

## 2026-05-02 - Job-Katalog, Validator und Runner als Orchestrierungskern

Kontext:
- Die Agentenarbeit sollte von der reinen Dokumentation in einen klaren Job-Workflow ueberfuehrt werden.
- Aufgaben sollten nicht nur zugewiesen, sondern maschinell validiert, getriggert und protokolliert werden.

Entscheidung:
- `docs/agent-system/job-catalog.json` fuehrt alle Agentenjobs zentral mit Owner, Trigger, Ausfuehrungsmodus und Risikoklasse.
- `scripts/agent-job-validator.mjs` erzwingt Struktur, erlaubte Agentennamen und Approval-Regeln fuer gravierende Jobs.
- `scripts/agent-job-runner.mjs` fuehrt passende Jobs je Event/Status aus und schreibt `latest-job-run.{json,md}`.
- Der Hintergrundzyklus nutzt jetzt Validator + Job-Runner statt fest verdrahteter Einzelsteps.
- `.github/workflows/agent-job-dispatch.yml` erlaubt gezielten manuellen Dispatch einzelner Job-Sets ueber `event`/`status` Inputs.

Risiko:
- Falsch konfigurierte Job-Trigger koennen Jobs ungewollt auslassen.
- Script-Jobs bleiben von der Qualitaet der darunterliegenden npm-Skripte abhaengig.

Recheck:
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:jobs:run -- --event=scheduled_background --status=standard`
- `npm run agents:background:deep`

## 2026-05-02 - Manni Reel Factory fuer aktive Social-Ausfuehrung

Kontext:
- Das Reichweitenziel verlangt nicht nur Strategie, sondern laufende Social-Ausfuehrung.
- Bisher fehlte ein operativer Generator, der aus vorhandenem Set-Material direkt Reel-Queues erzeugt.

Entscheidung:
- `scripts/manni-reel-factory.mjs` erzeugt automatisch Reel-Kandidaten aus aktuellen Sets.
- Neues Kommando: `npm run manni:reels:generate -- --scenario=<A|B|C|D> --count=<n>`.
- Outputs:
  - `docs/agent-system/manni-reel-queue.json`
  - `docs/agent-system/manni-reel-weekly-plan.md`
- `job-catalog.json` wurde um den Script-Job `manni-reel-factory` erweitert.

Risiko:
- Ohne API-Credentials bleibt Publishing halbautomatisch (Queue/Plan statt Direkt-Post).
- Creative-Qualitaet muss weiterhin ueber KPI-Feedback iteriert werden.

Recheck:
- `npm run manni:reels:generate -- --scenario=A --count=12`
- `npm run agent:jobs:validate -- --strict-warnings`

## 2026-05-02 - Persoenliches Nutzer-OK fuer Social-Live und neuer Designer-Agent

Kontext:
- Social-Ausspielungen sollen nur nach expliziter persoenlicher Freigabe live gehen.
- Manni braucht einen festen Design-Partner fuer Creative-Packs und konsistente visuelle Ausspielung.

Entscheidung:
- Neuer fester Agent: `Designer`.
- Job-System erweitert um Social-Metadaten (`domain`, `outputVisibility`, `requiresUserApproval`).
- Validator erzwingt: `social_media + external_live` muss `requiresUserApproval=true` haben.
- Runner blockiert externe Social-Live-Jobs ohne `--user-approved=<job-id>`.
- Manual Dispatch Workflow erhielt den Input `user_approved`.

Risiko:
- Ohne aktive Freigabe werden Social-Live-Jobs bewusst blockiert.
- Zusätzliche Prozessschritte erhöhen Disziplin, aber auch Koordinationsaufwand.

Recheck:
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:jobs:run -- --event=winner_detected --status=scale`
- `npm run agent:jobs:run -- --event=winner_detected --status=scale --user-approved=growth-winner-amplification,social-live-publish-gate`

## 2026-05-02 - Informationspflicht bei fehlendem Kontext

Kontext:
- Agentenarbeit soll nicht stoppen, nur weil Daten oder Kontext fehlen.

Entscheidung:
- Fehlende Informationen muessen aktiv beschafft werden (Repository, Metriken, Doku) oder gezielt beim Nutzer erfragt werden.
- Blocker ohne Beschaffungsversuch gelten als Prozessfehler.

Recheck:
- `npm run agent:jobs:validate -- --strict-warnings`
