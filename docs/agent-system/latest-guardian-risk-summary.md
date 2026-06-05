# AIRDOX Guardian-Risikobericht

Erstellt: 2026-06-05T19:57:04.561Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 3

## Blocker

- Keine

## Warnungen

- 111 uncommitted paths are present; review scope before release.
- 22 critical-path files changed: docs/agent-system/job-catalog.json, package-lock.json, package.json, scripts/agent-background-cycle.mjs, scripts/agent-job-runner.mjs, scripts/audience-intelligence-agent.mjs, scripts/refactor-website-opportunities.mjs, src/server/worker.js, ...
- Master Controller review is recommended by routing.

## Empfohlene Gates

- `manual:refactor-website-patch-proposal before code changes`
- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate`
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
- `npm run social:youtube:audit -- --write`
- `npm run test -- --run`
- `npm run website:profitability`

