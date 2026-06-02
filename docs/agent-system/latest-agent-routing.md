# AIRDOX Agent Routing Report

Generated: 2026-06-01T19:47:57.143Z
Changed files: 55

## Assignments

| Agent | Role | Rules | Files |
| --- | --- | --- | --- |
| Audience Intelligence | review | audience-intelligence | docs/agent-system/latest-audience-intelligence.json<br>docs/agent-system/latest-audience-intelligence.md<br>docs/agent-system/latest-website-profitability.json<br>docs/agent-system/latest-website-profitability.md<br>docs/agent-system/manni-reel-draft-pack.md<br>docs/agent-system/manni-reel-queue.json<br>docs/agent-system/manni-reel-weekly-plan.md<br>scripts/audience-intelligence-agent.mjs<br>scripts/website-profitability-report.mjs |
| Deep Research | primary | notebooklm-deep-research | docs/agent-system/latest-notebooklm-brief.json<br>docs/agent-system/latest-notebooklm-brief.md |
| Designer | primary | daumenkino-reference-system | scripts/render-daumenkino-airdox-letterbeat.mjs<br>scripts/render-daumenkino-airdox-web-preview.mjs<br>scripts/render-daumenkino-gif-letterbeat.mjs |
| Designer | review | desktop-experience-design | src/desktop/__tests__/DesktopControls.test.jsx<br>src/desktop/components/DesignExportPhase.jsx<br>src/desktop/components/DesignSetupPhase.jsx<br>src/desktop/components/DesignStudioPhase.jsx |
| Guardian | review | quality-security | docs/agent-system/latest-agent-currency.json<br>docs/agent-system/latest-agent-currency.md<br>docs/agent-system/latest-agent-dependency-radar.json<br>docs/agent-system/latest-agent-dependency-radar.md<br>docs/agent-system/latest-agent-quality-chain.json<br>docs/agent-system/latest-agent-quality-chain.md<br>docs/agent-system/latest-agent-routing.json<br>docs/agent-system/latest-agent-routing.md<br>docs/agent-system/latest-agent-system-health.json<br>docs/agent-system/latest-agent-system-health.md<br>docs/agent-system/latest-audit.json<br>docs/agent-system/latest-audit.md<br>docs/agent-system/latest-background-cycle.json<br>docs/agent-system/latest-guardian-risk-summary.json<br>docs/agent-system/latest-guardian-risk-summary.md<br>docs/agent-system/latest-job-run.json<br>docs/agent-system/latest-job-run.md<br>docs/agent-system/latest-refactor-website-opportunities.json<br>docs/agent-system/latest-refactor-website-opportunities.md<br>docs/agent-system/latest-repository-monitor.json<br>docs/agent-system/latest-repository-monitor.md<br>package.json<br>scripts/agent-dependency-radar.mjs<br>scripts/agent-quality-chain.mjs<br>scripts/agent-routing-report.mjs<br>scripts/audience-intelligence-agent.mjs<br>scripts/photoshop-daumenkino-clean-letter-masks.jsx<br>scripts/photoshop-daumenkino-letter-layers.jsx<br>scripts/render-daumenkino-airdox-letterbeat.mjs<br>scripts/render-daumenkino-airdox-web-preview.mjs<br>scripts/render-daumenkino-gif-letterbeat.mjs<br>scripts/social-tiktok-oauth-init.mjs<br>scripts/social-tiktok-upload-inbox.mjs<br>scripts/website-profitability-report.mjs |
| Manni | primary | growth-conversion | docs/agent-system/manni-reel-draft-pack.md<br>docs/agent-system/manni-reel-queue.json<br>docs/agent-system/manni-reel-weekly-plan.md<br>scripts/social-tiktok-oauth-init.mjs<br>scripts/social-tiktok-upload-inbox.mjs |
| Master Controller | review | - | docs/agent-system/latest-agent-currency.json<br>docs/agent-system/latest-agent-currency.md<br>docs/agent-system/latest-agent-dependency-radar.json<br>docs/agent-system/latest-agent-dependency-radar.md<br>docs/agent-system/latest-agent-quality-chain.json<br>docs/agent-system/latest-agent-quality-chain.md<br>docs/agent-system/latest-agent-routing.json<br>docs/agent-system/latest-agent-routing.md<br>docs/agent-system/latest-agent-system-health.json<br>docs/agent-system/latest-agent-system-health.md<br>docs/agent-system/latest-audit.json<br>docs/agent-system/latest-audit.md<br>docs/agent-system/latest-background-cycle.json<br>docs/agent-system/latest-guardian-risk-summary.json<br>docs/agent-system/latest-guardian-risk-summary.md<br>docs/agent-system/latest-job-run.json<br>docs/agent-system/latest-job-run.md<br>docs/agent-system/latest-refactor-website-opportunities.json<br>docs/agent-system/latest-refactor-website-opportunities.md<br>docs/agent-system/latest-repository-monitor.json<br>docs/agent-system/latest-repository-monitor.md |
| Mentor | review | learning-documentation | docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md<br>docs/agent-system/manni-reel-draft-pack.md<br>docs/agent-system/manni-reel-queue.json<br>docs/agent-system/manni-reel-weekly-plan.md<br>docs/brand/templates/airdox-daumenkino-reel-war-preview.png<br>docs/brand/templates/airdox-daumenkino-reel-war-preview.svg<br>docs/brand/templates/airdox-daumenkino-reel-war-template.md |
| Refactor | implementation_support | refactor-architecture | src/desktop/__tests__/DesktopControls.test.jsx<br>src/desktop/components/DesignExportPhase.jsx<br>src/desktop/components/DesignSetupPhase.jsx<br>src/desktop/components/DesignStudioPhase.jsx<br>src/lib/stats-logic.js<br>src/utils/__tests__/audienceSignals.test.js<br>src/utils/audienceSignals.js |
| Webbie | primary | website-experience | src/App.jsx |
| Winnie | primary | desktop-flightdeck | package.json<br>src/desktop/__tests__/DesktopControls.test.jsx<br>src/desktop/components/DesignExportPhase.jsx<br>src/desktop/components/DesignSetupPhase.jsx<br>src/desktop/components/DesignStudioPhase.jsx |

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

## Unmatched Files

- docs/agent-system/latest-agent-currency.json
- docs/agent-system/latest-agent-currency.md
- docs/agent-system/latest-agent-dependency-radar.json
- docs/agent-system/latest-agent-dependency-radar.md
- docs/agent-system/latest-agent-quality-chain.json
- docs/agent-system/latest-agent-quality-chain.md
- docs/agent-system/latest-agent-routing.json
- docs/agent-system/latest-agent-routing.md
- docs/agent-system/latest-agent-system-health.json
- docs/agent-system/latest-agent-system-health.md
- docs/agent-system/latest-audit.json
- docs/agent-system/latest-audit.md
- docs/agent-system/latest-background-cycle.json
- docs/agent-system/latest-guardian-risk-summary.json
- docs/agent-system/latest-guardian-risk-summary.md
- docs/agent-system/latest-job-run.json
- docs/agent-system/latest-job-run.md
- docs/agent-system/latest-refactor-website-opportunities.json
- docs/agent-system/latest-refactor-website-opportunities.md
- docs/agent-system/latest-repository-monitor.json
- docs/agent-system/latest-repository-monitor.md

