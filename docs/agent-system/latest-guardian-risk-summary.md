# AIRDOX Guardian-Risikobericht

Erstellt: 2026-10-20T01:48:14.476Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 3

## Blocker

- Keine

## Warnungen

- 71 uncommitted paths are present; review scope before release.
- 6 critical-path files changed: desktop/main/services/audioMastering.mjs, package-lock.json, package.json, scripts/social-post-ledger.mjs, scripts/render-strohpuppe-reel.ps1, scripts/render-tiktok-audit-sample.ps1
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

