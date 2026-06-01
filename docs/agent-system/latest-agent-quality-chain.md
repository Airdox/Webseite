# AIRDOX Agent Quality Chain

Generated: 2026-06-01T01:46:57.680Z

## Summary

- Changed files: 84
- Test files changed: 0
- Obligations: 4
- Alerts: 4

## Obligations

| ID | Owner | QA | Status | Required Follow-Up | Gates |
| --- | --- | --- | --- | --- | --- |
| website-ui-quality-chain | Webbie | Guardian | tests_required | Guardian must ask Webbie for tests or add focused tests before release-ready status. | `npm run lint`<br>`npm run test -- --run`<br>`npm run build` |
| desktop-ui-quality-chain | Winnie | Guardian | tests_required | Guardian must ask Winnie for focused Desktop tests before release-ready status. | `npm run desktop:test:logic`<br>`npm run desktop:test:e2e` |
| script-api-quality-chain | Guardian | Guardian | validation_required | Guardian must run or request the narrow command that proves the changed script path. | `npm run agent:jobs:validate`<br>`npm run agent:audit -- --strict` |
| user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | `route-specific test`<br>`visual/safe-area review when visible` |

## Changed Test Files

- None

## Alerts

- action: Webbie -> Guardian: Guardian must ask Webbie for tests or add focused tests before release-ready status.
- action: Winnie -> Guardian: Guardian must ask Winnie for focused Desktop tests before release-ready status.
- info: Guardian -> Guardian: Guardian must run or request the narrow command that proves the changed script path.
- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

