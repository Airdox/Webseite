# AIRDOX Guardian Risk Summary

Generated: 2026-06-01T19:47:49.421Z
Risk: MEDIUM
Blockers: 0
Warnings: 3

## Blockers

- None

## Warnings

- 55 uncommitted paths are present; review scope before release.
- 13 critical-path files changed: package.json, scripts/agent-dependency-radar.mjs, scripts/agent-quality-chain.mjs, scripts/agent-routing-report.mjs, scripts/audience-intelligence-agent.mjs, scripts/social-tiktok-oauth-init.mjs, scripts/website-profitability-report.mjs, scripts/photoshop-daumenkino-clean-letter-masks.jsx, ...
- Master Controller review is recommended by routing.

## Recommended Gates

- `npm run agent:audit -- --strict`
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run agent:notebooklm:brief`
- `npm run agent:quality-chain:write`
- `npm run audience:intelligence`
- `npm run build`
- `npm run designer:portfolio`
- `npm run desktop:test:logic`
- `npm run guardian:risk`
- `npm run guardian:risk -- --strict`
- `npm run lint`
- `npm run refactor:website:opportunities`
- `npm run test -- --run`
- `npm run website:profitability`

