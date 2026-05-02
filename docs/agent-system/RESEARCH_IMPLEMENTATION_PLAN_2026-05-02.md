# Research Implementation Plan (GitHub) - 2026-05-02

## Ziel

Das Vorhaben wird sinnvoll umgesetzt, wenn Aufgabenqualitaet, Freigaben, CI-Checks und Merge-Regeln technisch erzwungen werden, nicht nur dokumentiert.

## Bereits umgesetzt im Repo

- PR-Template fuer strukturierte Aufgabenbeschreibung:
  - `.github/pull_request_template.md`
- Pflichtchecks im Workflow:
  - `npm run tasks:gate`
  - `npm run master:gate`
  - `npm run agent:audit -- --strict`
  - `npm run repository:monitor:strict`
- Merge-Queue-Kompatibilitaet:
  - `merge_group` Trigger in `.github/workflows/web-quality.yml`
- Hintergrundautomation:
  - `.github/workflows/agent-background-monitor.yml`

## Noch in GitHub UI zu setzen (admin)

1. Branch protection oder Ruleset fuer `main`:
   - Require pull request before merging
   - Require status checks to pass before merging
   - Required checks:
     - `quality` (aus `web-quality.yml`)
   - Require approvals (mindestens 1)
   - Optional: Require merge queue

2. CODEOWNERS aktivieren:
   - Datei `.github/CODEOWNERS` erstellen
   - Bei Branch protection: Require review from Code Owners aktivieren

3. Rulesets (optional, falls Team/Enterprise):
   - Branch ruleset fuer `main`/`develop`
   - Require linear history
   - Restrict force pushes/deletions
   - Optional: commit metadata Regeln

## Operative Regel

Wenn `tasks:gate` oder `master:gate` fehlschlaegt, gilt die Aufgabe als unvollstaendig und darf nicht gemerged werden.

## Quellen (offizielle Docs)

- Workflow syntax (`on.schedule`, `workflow_dispatch`, `merge_group`):
  - https://docs.github.com/actions/learn-github-actions/workflow-syntax-for-github-actions
- Merge queue und `merge_group` Trigger:
  - https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- Required status checks:
  - https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks
- Troubleshooting required status checks:
  - https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks
- Pull request templates:
  - https://docs.github.com/articles/creating-a-pull-request-template-for-your-repository
- Managing/standardizing pull requests:
  - https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/managing-and-standardizing-pull-requests
- CODEOWNERS:
  - https://docs.github.com/articles/about-code-owners
- Rulesets overview:
  - https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
