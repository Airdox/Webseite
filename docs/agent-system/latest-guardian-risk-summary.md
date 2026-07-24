# AIRDOX Guardian-Risikobericht

Erstellt: 2026-07-24T01:50:13.988Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 3

## Blocker

- Keine

## Warnungen

- 78 uncommitted paths are present; review scope before release.
- 7 critical-path files changed: desktop/main/preload.cjs, desktop/main/services/admin.mjs, desktop/main/services/audioMastering.mjs, package-lock.json, package.json, desktop/main/services/audioFormats.mjs, desktop/main/services/audioQualityScore.mjs
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
- `npm run refactor:website:opportunities`
- `npm run test -- --run`
- `npm run website:profitability`

