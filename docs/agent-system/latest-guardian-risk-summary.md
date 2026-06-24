# AIRDOX Guardian-Risikobericht

Erstellt: 2026-06-24T20:54:00.317Z
Risiko: MEDIUM
Blocker: 0
Warnungen: 2

## Blocker

- Keine

## Warnungen

- 27 uncommitted paths are present; review scope before release.
- Master Controller review is recommended by routing.

## Empfohlene Gates

- `manual:refactor-website-patch-proposal before code changes`
- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run audience:intelligence`
- `npm run build`
- `npm run guardian:risk`
- `npm run refactor:website:opportunities`
- `npm run test -- --run`
- `npm run website:profitability`

