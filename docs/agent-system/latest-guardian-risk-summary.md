# AIRDOX Guardian Risk Summary

Generated: 2026-07-10T04:03:47.931Z
Risk: MEDIUM
Blockers: 0
Warnings: 3

## Blockers

- None

## Warnings

- 132 uncommitted paths are present; review scope before release.
- 13 critical-path files changed: desktop/main/index.cjs, desktop/main/preload.cjs, desktop/main/services/database.mjs, scripts/agent-audit.mjs, scripts/capture-auth-workflow-proof.mjs, scripts/designer-visual-quality-check.mjs, scripts/r2-delete.mjs, scripts/refactor-website-opportunities.mjs, ...
- Master Controller review is recommended by routing.

## Recommended Gates

- `manual:refactor-website-patch-proposal before code changes`
- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:notebooklm:brief`
- `npm run audience:intelligence`
- `npm run build`
- `npm run designer:visual:check -- --strict`
- `npm run desktop:test:logic`
- `npm run guardian:risk`
- `npm run guardian:risk -- --strict`
- `npm run lint`
- `npm run refactor:website:opportunities`
- `npm run repository:monitor:strict`
- `npm run test -- --run`
- `npm run website:profitability`
- `npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js`

