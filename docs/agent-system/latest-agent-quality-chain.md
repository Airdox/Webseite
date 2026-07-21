# AIRDOX Agenten-Qualitaetskette

Erstellt: 2026-07-21T08:49:26.299Z

## Ueberblick

- Geaenderte Dateien: 44
- Geaenderte Testdateien: 6
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

- src/data/__tests__/musicSets.test.js
- src/server/__tests__/worker.test.js
- e2e/flightdeck-audio-mastering.spec.js
- src/desktop/__tests__/AudioMasteringService.test.js
- src/desktop/__tests__/AudioMasteringTab.test.jsx
- src/server/__tests__/tiktokCreator.test.js

## Hinweise

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

