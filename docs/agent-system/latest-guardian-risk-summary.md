# AIRDOX Guardian-Risikobericht

Erstellt: 2026-07-01T13:48:30.587Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 3

## Blocker

- Keine

## Warnungen

- 49 uncommitted paths are present; review scope before release.
- 5 critical-path files changed: package.json, scripts/social-post-ledger.mjs, scripts/social-tiktok-check.mjs, scripts/social-tiktok-oauth-init.mjs, scripts/social-tiktok-publish.mjs
- Master Controller review is recommended by routing.

## Empfohlene Gates

- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:notebooklm:brief`
- `npm run audience:intelligence`
- `npm run build`
- `npm run designer:visual:check -- --strict`
- `npm run desktop:test:logic`
- `npm run guardian:risk -- --strict`
- `npm run website:profitability`

