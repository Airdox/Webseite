# AIRDOX Guardian Risk Summary

Generated: 2026-06-01T01:46:53.528Z
Risk: MEDIUM
Blockers: 0
Warnings: 3

## Blockers

- None

## Warnings

- 84 uncommitted paths are present; review scope before release.
- 9 critical-path files changed: package-lock.json, package.json, src/server/worker.js, scripts/create-airdox-photoshop-overlay-source.mjs, scripts/create_baerdox_reel.py, scripts/make-airdox-reference-video.ps1, scripts/photoshop/, scripts/render-airdox-photoshop-video.ps1, ...
- Master Controller review is recommended by routing.

## Recommended Gates

- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:notebooklm:brief`
- `npm run audience:intelligence`
- `npm run build`
- `npm run desktop:test:logic`
- `npm run guardian:risk`
- `npm run guardian:risk -- --strict`
- `npm run lint`
- `npm run refactor:website:opportunities`
- `npm run test -- --run`
- `npm run website:profitability`

