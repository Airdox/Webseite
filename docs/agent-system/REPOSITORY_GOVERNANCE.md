# AIRDOX Repository Governance

Stand: 2026-05-02

## Rolle

Repository ist der Superagent fuer Quellcodeverwaltung, Branching, Versionskontrolle und GitHub-Disziplin.

Zugewiesene Kernaufgabe:
- Bereinigung der Quellcodeverwaltung
- Laufende Ueberwachung der Repo-Disziplin

## Verbindliche Standards

- Branches:
  - `main`: produktionsnah, nur ueber PR-Merge.
  - `develop`: Integrationszweig fuer naechsten Release-Stand.
  - `feature/<scope>-<short-topic>`: neue Features.
  - `fix/<scope>-<short-topic>`: Bugfixes.
  - `hotfix/<scope>-<short-topic>`: dringende Produktionskorrekturen.
  - `release/<yyyy-mm-dd>-<version-or-topic>`: Release-Stabilisierung.
  - `experiment/<scope>-<topic>`: isolierte Experimente ohne direkten Release-Druck.
- Commit-Nachrichten:
  - `<type>(<scope>): <summary>`
  - erlaubte `type`: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`.
- Pull Requests:
  - Risiko, Testumfang und betroffene Agentenrollen muessen angegeben sein.
  - Master-Controller-Freigabe ist fuer gravierende Aenderungen Pflicht.
  - Social-Live-Ausspielungen brauchen persoenliches Nutzer-OK, bevor sie extern sichtbar werden.
  - Quality-Gates muessen gruen sein.
- Merge-Regeln:
  - Kein direkter Push nach `main`.
  - Keine ungeprueften Merge-Commits mit roten Gates.

## Pflichtpruefung vor Merge/Release

```powershell
npm run agent:audit -- --strict
npm run agent:jobs:validate -- --strict-warnings
npm run master:gate
npm run repository:monitor
npm run quality:web
npm run desktop:test:logic
```

Bei Desktop-Release oder Pipeline-Aenderungen zusaetzlich:

```powershell
npm run desktop:test:e2e
```

## Strukturregeln

- Generierte Artefakte bleiben aus Source-Control ausgeschlossen (z. B. `.wrangler`, `dist`, `release`, `playwright-report`), sofern sie nicht absichtlich als Release-Artefakt versioniert werden.
- Doppelte Root-HTML-Dateien und parallele Deployment-Konfigs muessen aktiv begruendet oder bereinigt werden.
- Jede relevante Struktur- oder Branching-Regel landet in `docs/agent-system/DECISION_LOG.md`.

## Repository-Audit-Kommandos

```powershell
git status --short
git branch --show-current
git log --oneline -n 20
git diff --stat
npm run repository:monitor
```

Persistenter Monitoring-Report:

```powershell
npm run repository:monitor:write
```

Baseline fuer bekannte Alt-Aenderungen:

- Datei: `docs/agent-system/repository-dirty-baseline.txt`
- Zweck: bekannte, bereits akzeptierte Worktree-Aenderungen von neuen unerwarteten Aenderungen trennen.
- Aktualisierung nur mit Master-Controller-Freigabe.

Strikte Modi:

```powershell
# blockiert nur kritische Fehler
npm run repository:monitor:strict

# blockiert Fehler und Warnungen
npm run repository:monitor:strict-warnings
```

## Automatisierter Hintergrundzyklus

- Workflow: `.github/workflows/agent-background-monitor.yml`
- Trigger:
  - `schedule` (alle 6 Stunden)
  - `workflow_dispatch`
- Lauf:
  - `npm run agents:background:deep`
  - nutzt `docs/agent-system/job-catalog.json` als zentrale Job-Definition
  - erzeugt Audit-, Repository- und Zyklusberichte unter `docs/agent-system/`
  - erzeugt Job-Run-Berichte unter `docs/agent-system/latest-job-run.{json,md}`
  - veröffentlicht Berichte als Workflow-Artefakt `agent-background-reports`

Manueller Einzel-Dispatch:

- Workflow: `.github/workflows/agent-job-dispatch.yml`
- Fuehrt Jobs gezielt per `event`/`status` Inputs aus und dokumentiert den Lauf als Artefakt.

## Zielbild

Repository haelt Historie, Branches und Releases nachvollziehbar, konfliktarm und skalierbar. Jede Aenderung bleibt einem klaren Zweck, einem sauberen Branch-Kontext und messbaren Quality-Gates zugeordnet.
