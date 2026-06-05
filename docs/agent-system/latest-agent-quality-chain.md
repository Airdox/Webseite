# AIRDOX Agenten-Qualitaetskette

Erstellt: 2026-06-05T19:57:09.436Z

## Ueberblick

- Geaenderte Dateien: 79
- Geaenderte Testdateien: 11
- Pflichten: 3
- Hinweise: 1

## Pflichten

| ID | Owner | QA | Status | Erforderlicher Nachlauf | Gates |
| --- | --- | --- | --- | --- | --- |
| website-ui-quality-chain | Webbie | Guardian | test_changes_present | Guardian must verify that changed tests cover the changed UI path. | `npm run lint`<br>`npm run test -- --run`<br>`npm run build` |
| script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | `npm run agent:jobs:validate`<br>`npm run agent:audit -- --strict` |
| user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | `route-specific test`<br>`visual/safe-area review when visible` |

## Geaenderte Testdateien

- src/components/__tests__/authModalUtils.test.js
- src/components/__tests__/setCardUtils.test.js
- src/contexts/__tests__/audioSources.test.js
- src/lib/__tests__/authHelpers.test.js
- src/lib/__tests__/statsContracts.test.js
- src/server/__tests__/httpResponses.test.js
- src/server/__tests__/legalPages.test.js
- src/server/__tests__/oauthUtils.test.js
- src/utils/__tests__/apiClient.test.js
- src/utils/__tests__/websiteContracts.test.js
- src/utils/analytics/__tests__/

## Hinweise

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

