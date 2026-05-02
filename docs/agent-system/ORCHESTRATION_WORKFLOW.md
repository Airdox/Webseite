# AIRDOX Orchestration Workflow

Stand: 2026-05-02

## Ziel

Durchgaengiger Ablauf von Orchestrierung bis Job-Ausfuehrung mit klarer Gate-Logik und Run-Logs.

## Ablauf

1. Master Controller priorisiert Aufgaben und Trigger.
2. Job-Definition liegt zentral in `docs/agent-system/job-catalog.json`.
3. Vor Ausfuehrung validiert `npm run agent:jobs:validate`:
   - erlaubte Agentennamen
   - Trigger-Struktur
   - Execution-Mode
   - Approval-Pflicht fuer gravierende Jobs
4. Ausfuehrung mit `npm run agent:jobs:run -- --event=<event> --status=<status>`.
   Fuer Social-Live-Jobs zusaetzlich: `--user-approved=<job-id[,job-id...]>`.
5. Runner schreibt Ergebnisberichte:
   - `docs/agent-system/latest-job-run.json`
   - `docs/agent-system/latest-job-run.md`
6. Hintergrundautomation ruft den Ablauf periodisch auf:
   - `npm run agents:background:deep`
   - Workflow: `.github/workflows/agent-background-monitor.yml`

Manni Social Execution:

- Reel-Queue-Generator: `npm run manni:reels:generate`
- schreibt:
  - `docs/agent-system/manni-reel-queue.json`
  - `docs/agent-system/manni-reel-weekly-plan.md`

## Manueller Job-Dispatch (GitHub)

Workflow:

- `.github/workflows/agent-job-dispatch.yml`

Inputs:

- `event`
- `status`
- `approved` (kommagetrennte Freigaben fuer gravierende Job-IDs)
- `user_approved` (kommagetrennte persoenliche Nutzer-Freigaben fuer Social-Live-Job-IDs)

Der Workflow validiert zuerst den Job-Katalog und fuehrt danach genau die Jobs fuer Event/Status aus.

## Approval-Regel

- Jobs mit `changeClass: gravierend` werden nur mit Master-Freigabe ausgefuehrt.
- Ohne Freigabe bleiben sie im Run-Log als `skipped`.
- Jobs mit `outputVisibility: external_live` werden ohne persoenliches Nutzer-OK ebenfalls als `skipped` protokolliert.

## CI-Regel

Pflichtchecks in `.github/workflows/web-quality.yml`:

- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run tasks:gate`
- `npm run master:gate`
- `npm run repository:monitor:strict`

Damit werden unvollstaendige Aufgaben, fehlende Freigaben und fehlerhafte Job-Spezifikationen vor Merge blockiert.
