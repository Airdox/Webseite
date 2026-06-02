# AIRDOX Agent Quality Chain

Generated: 2026-06-01T19:47:58.072Z

## Summary

- Changed files: 28
- Test files changed: 2
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

- src/desktop/__tests__/DesktopControls.test.jsx
- src/utils/__tests__/audienceSignals.test.js

## Alerts

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

