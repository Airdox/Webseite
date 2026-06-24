# AIRDOX Guardian-Risikobericht

Erstellt: 2026-06-24T16:41:05.614Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 3

## Blocker

- Keine

## Warnungen

- 132 uncommitted paths are present; review scope before release.
- 21 critical-path files changed: desktop/main/index.cjs, desktop/main/services/pipeline.mjs, desktop/main/services/workspace.mjs, docs/agent-system/job-catalog.json, package-lock.json, package.json, scripts/agent-background-cycle.mjs, scripts/agent-job-validator.mjs, ...
- Master Controller review is recommended by routing.

## Empfohlene Gates

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
- `npm run test -- --run`
- `npm run website:profitability`
- `npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js`

