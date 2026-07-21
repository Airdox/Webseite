# AIRDOX Guardian-Risikobericht

Erstellt: 2026-07-21T08:42:53.078Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 3

## Blocker

- Keine

## Warnungen

- 79 uncommitted paths are present; review scope before release.
- 11 critical-path files changed: desktop/main/index.cjs, desktop/main/preload.cjs, package-lock.json, package.json, scripts/social-tiktok-oauth-init.mjs, src/server/__tests__/worker.test.js, src/server/legalPages.js, src/server/worker.js, ...
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

