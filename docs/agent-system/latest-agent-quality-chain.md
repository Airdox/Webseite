# AIRDOX Agent Quality Chain

Generated: 2026-05-31T16:30:16.306Z

## Summary

- Changed files: 153
- Test files changed: 5
- Obligations: 4
- Alerts: 1

## Obligations

| ID | Owner | QA | Status | Required Follow-Up | Gates |
| --- | --- | --- | --- | --- | --- |
| website-ui-quality-chain | Webbie | Guardian | test_changes_present | Guardian must verify that changed tests cover the changed UI path. | `npm run lint`<br>`npm run test -- --run`<br>`npm run build` |
| desktop-ui-quality-chain | Winnie | Guardian | test_changes_present | Guardian must verify that Desktop tests cover the changed tab/menu/control behavior. | `npm run desktop:test:logic`<br>`npm run desktop:test:e2e` |
| script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | `npm run agent:jobs:validate`<br>`npm run agent:audit -- --strict` |
| user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | `route-specific test`<br>`visual/safe-area review when visible` |

## Changed Test Files

- e2e/desktop-flightdeck.spec.js
- src/desktop/__tests__/AdminFeatures.test.jsx
- src/desktop/__tests__/setManifest.test.js
- src/utils/__tests__/apiResponse.test.js
- src/desktop/__tests__/DesktopControls.test.jsx

## Alerts

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

