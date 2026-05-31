# AIRDOX Guardian Risk Summary

Generated: 2026-05-31T16:30:12.525Z
Risk: MEDIUM
Blockers: 0
Warnings: 3

## Blockers

- None

## Warnings

- 153 uncommitted paths are present; review scope before release.
- 34 critical-path files changed: .github/workflows/agent-background-monitor.yml, .github/workflows/agent-job-dispatch.yml, desktop/main/index.cjs, desktop/main/preload.cjs, desktop/main/services/pipeline.mjs, docs/agent-system/job-catalog.json, package-lock.json, package.json, ...
- Master Controller review is recommended by routing.

## Recommended Gates

- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:notebooklm:brief`
- `npm run agent:quality-chain:write`
- `npm run audience:intelligence`
- `npm run build`
- `npm run designer:portfolio`
- `npm run designer:visual:check -- --strict`
- `npm run desktop:test:logic`
- `npm run guardian:risk`
- `npm run guardian:risk -- --strict`
- `npm run lint`
- `npm run refactor:website:opportunities`
- `npm run repository:monitor:strict`
- `npm run social:youtube:audit -- --write`
- `npm run test -- --run`
- `npm run website:profitability`

