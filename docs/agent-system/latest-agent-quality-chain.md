# AIRDOX Agent Quality Chain

Generated: 2026-07-24T09:45:56.870Z

## Summary

- Changed files: 45
- Test files changed: 21
- Obligations: 3
- Alerts: 1

## Obligations

| ID | Owner | QA | Status | Required Follow-Up | Gates |
| --- | --- | --- | --- | --- | --- |
| desktop-ui-quality-chain | Winnie | Guardian | test_changes_present | Guardian must verify that Desktop tests cover the changed tab/menu/control behavior. | `npm run desktop:test:logic`<br>`npm run desktop:test:e2e` |
| script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | `npm run agent:jobs:validate`<br>`npm run agent:audit -- --strict` |
| user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | `route-specific test`<br>`visual/safe-area review when visible` |

## Changed Test Files

- e2e/desktop-flightdeck.spec.js
- e2e/flightdeck-audio-mastering.spec.js
- e2e/flightdeck-quality.spec.js
- src/desktop/__tests__/AudioMasteringService.test.js
- src/desktop/__tests__/AudioMasteringTab.test.jsx
- src/desktop/__tests__/DesktopApp.test.jsx
- e2e/flightdeck-electron-system.spec.js
- e2e/flightdeck-orbital-command.spec.js
- src/desktop/__tests__/AdminService.test.js
- src/desktop/__tests__/AssistantService.test.js
- src/desktop/__tests__/AudioFormats.test.js
- src/desktop/__tests__/AudioQualityScore.test.js
- src/desktop/__tests__/ExtendedComponentCoverage.test.jsx
- src/desktop/__tests__/GuidedDesignPhases.test.jsx
- src/desktop/__tests__/MainBootstrap.test.js
- src/desktop/__tests__/ManniApprovalService.test.js
- src/desktop/__tests__/OrbitalCommand.test.jsx
- src/desktop/__tests__/OrbitalOverview.test.jsx
- src/desktop/__tests__/PipelineService.test.js
- src/desktop/__tests__/R2Service.test.js
- src/desktop/__tests__/StateService.test.js

## Alerts

- info: Master Controller -> Guardian: Responsible primary agent must confirm tests exist for the new entry point and failure path.

