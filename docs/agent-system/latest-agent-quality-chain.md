# AIRDOX Agenten-Qualitaetskette

Erstellt: 2026-10-20T01:48:18.534Z

## Ueberblick

- Geaenderte Dateien: 37
- Geaenderte Testdateien: 8
- Pflichten: 3
- Hinweise: 1

## Pflichten

| ID | Owner | QA | Status | Erforderlicher Nachlauf | Gates |
| --- | --- | --- | --- | --- | --- |
| desktop-ui-quality-chain | Winnie | Guardian | test_changes_present | Guardian must verify that Desktop tests cover the changed tab/menu/control behavior. | `npm run desktop:test:logic`<br>`npm run desktop:test:e2e` |
| script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | `npm run agent:jobs:validate`<br>`npm run agent:audit -- --strict` |
| user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | `route-specific test`<br>`visual/safe-area review when visible` |

## Geaenderte Testdateien

- e2e/flightdeck-audio-mastering.spec.js
- e2e/flightdeck-electron-system.spec.js
- src/data/__tests__/musicSets.test.js
- src/desktop/__tests__/AudioMasteringService.test.js
- src/desktop/__tests__/AudioMasteringTab.test.jsx
- src/desktop/__tests__/DesktopApp.test.jsx
- src/desktop/__tests__/MainBootstrap.test.js
- e2e/helpers/

## Hinweise

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

