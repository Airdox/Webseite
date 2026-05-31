# AIRDOX Release Preparation Report

Stand: 2026-05-23 03:09 Europe/Berlin
Branch: `main`
Version laut `package.json`: `0.1.16`

## Ergebnis

Der Stand ist technisch als Release-Kandidat vorbereitet, aber noch nicht freigabefertig.

Alle ausgeführten Tests und Gates sind bestanden. Die Freigabe bleibt blockiert durch den Umfang des offenen Worktrees: 35 uncommitted Pfade, davon 31 außerhalb der Dirty-Baseline. Vor einem echten Release müssen diese Änderungen fachlich geprüft, bewusst ausgewählt und committed oder verworfen werden.

## Geschriebene Agentenberichte

- `docs/agent-system/latest-agent-routing.md`
- `docs/agent-system/latest-agent-routing.json`
- `docs/agent-system/latest-repository-monitor.md`
- `docs/agent-system/latest-repository-monitor.json`
- `docs/agent-system/latest-audit.md`
- `docs/agent-system/latest-audit.json`
- `docs/agent-system/latest-guardian-risk-summary.md`
- `docs/agent-system/latest-guardian-risk-summary.json`
- `docs/agent-system/latest-agent-currency.md`
- `docs/agent-system/latest-agent-currency.json`
- `docs/agent-system/latest-audience-intelligence.md`
- `docs/agent-system/latest-audience-intelligence.json`
- `docs/agent-system/latest-designer-visual-quality.md`
- `docs/agent-system/latest-designer-visual-quality.json`

## Agentenlage

- Agent Routing: 35 geänderte Pfade, 8 Zuweisungen.
- Agent Audit: PASS, Durchschnitt 94/100.
- Guardian Risk: MEDIUM, 0 Blocker, 3 Warnungen.
- Repository Monitor: PASS mit 2 Warnungen wegen offenem Worktree.
- Mentor Currency: WARN, Refactor-Quelle `https://nodejs.org/en/learn/diagnostics` liefert 404.
- Audience Intelligence: 0 consented Events analysiert; keine Nutzungsdatenbasis vorhanden.
- Designer Visual Quality: PASS, 16/16 Checks bestanden.

## Release-Gates

| Gate | Ergebnis |
| --- | --- |
| `npm run agent:jobs:validate -- --strict-warnings` | PASS, 31 Jobs geprüft |
| `npm run guardian:risk -- --strict` | PASS, MEDIUM, 0 Blocker |
| `npm run agent:audit -- --strict` | PASS, 94/100 |
| `npm run lint` | PASS |
| `npm run desktop:test:logic` | PASS, 10 Testdateien, 88 Tests |
| `npm run test -- --run` | PASS, 21 Testdateien, 128 Tests |
| `npm run build` | PASS |
| `npm run designer:visual:check -- --strict` | PASS, 16/16 Checks; lokaler Preview-Prozess wurde nach Bericht manuell beendet |
| `npm run desktop:test:e2e` | PASS, 6 Playwright-Tests |

Hinweis: Der Vitest-Lauf zeigt React-`act(...)`-Warnungen im `AuthModal`-Test und eine JSDOM-Navigationswarnung. Das ist kein Testfehler, sollte aber bei Gelegenheit bereinigt werden.

## Offene Release-Entscheidungen

1. Master-Controller-Review durchführen, weil mehrere Dateien nicht eindeutig geroutet wurden.
2. Prüfen, ob Scratch-Artefakte in den Release-Commit gehören:
   - `scratch/daumenkino-contact-sheet.jpg`
   - `scratch/daumenkino-contact/`
   - `scratch/design-agent-screen.png`
3. Kritische Pfade bewusst reviewen:
   - `docs/agent-system/job-catalog.json`
   - `package.json`
   - `package-lock.json`
   - `scripts/render-daumenkino.mjs`
   - `scripts/fix-missing-play-dates.mjs`
4. Entscheiden, ob der Social-Automation-Job `social-auto-preview-pack` jetzt Teil des Releases sein soll.
5. Nach Review gezielt stagen und committen.
6. Erst danach optional Artefakte bauen oder deployen:
   - Desktop: `npm run desktop:dist`
   - Website/Worker: `npm run deploy`

## Freigabestatus

Keine technischen Testblocker.

Nicht live freigeben, solange der offene Worktree nicht fachlich bereinigt ist.
