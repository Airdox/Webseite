# AIRDOX Agenten-Qualitaetskette

Erstellt: 2026-06-24T16:41:10.352Z

## Ueberblick

- Geaenderte Dateien: 101
- Geaenderte Testdateien: 9
- Pflichten: 4
- Hinweise: 1

## Pflichten

| ID | Owner | QA | Status | Erforderlicher Nachlauf | Gates |
| --- | --- | --- | --- | --- | --- |
| website-ui-quality-chain | Webbie | Guardian | test_changes_present | Guardian must verify that changed tests cover the changed UI path. | `npm run lint`<br>`npm run test -- --run`<br>`npm run build` |
| desktop-ui-quality-chain | Winnie | Guardian | test_changes_present | Guardian must verify that Desktop tests cover the changed tab/menu/control behavior. | `npm run desktop:test:logic`<br>`npm run desktop:test:e2e` |
| script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | `npm run agent:jobs:validate`<br>`npm run agent:audit -- --strict` |
| user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | `route-specific test`<br>`visual/safe-area review when visible` |

## Geaenderte Testdateien

- e2e/desktop-flightdeck.spec.js
- src/components/__tests__/AuthModal.test.jsx
- src/contexts/__tests__/audioSources.test.js
- src/desktop/__tests__/DesktopApp.test.jsx
- src/desktop/lib/__tests__/assistantCoverage.test.js
- src/desktop/lib/__tests__/assistantEngine.test.js
- src/lib/__tests__/authHelpers.test.js
- src/server/__tests__/worker.test.js
- src/desktop/lib/__tests__/publish.integration.test.mjs

## Hinweise

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

