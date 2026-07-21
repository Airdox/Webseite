# AIRDOX Wiki Sync Audit

Erstellt: 2026-07-21T08:52:48.601Z
Status: warn

## Ueberblick

- Geaenderte Dateien: 77
- Content / project files: 64
- Wiki / Assistant knowledge files: 0
- Owner: Master Controller -> Wiki Maintainer

## Required Action

Master Controller muss den Wiki Maintainer beauftragen: neue Projekt-/Content-Aenderungen in airdoX_wiki und lokale Assistant-Antworten ueberfuehren, danach Wiki-Lint und Assistant-Coverage ausfuehren.

## Content Files

- desktop/main/index.cjs
- desktop/main/preload.cjs
- docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md
- docs/agent-system/AGENT_TRAINING_CATALOG.json
- docs/agent-system/AGENT_TRAINING_CATALOG.md
- docs/agent-system/DECISION_LOG.md
- docs/agent-system/MENTOR_POSTMORTEM_BANK.json
- docs/agent-system/MENTOR_POSTMORTEM_BANK.md
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
- docs/agent-system/latest-audience-intelligence.json
- docs/agent-system/latest-audience-intelligence.md
- docs/agent-system/latest-audit.json
- docs/agent-system/latest-audit.md
- docs/agent-system/latest-background-cycle.json
- docs/agent-system/latest-designer-portfolio.json
- docs/agent-system/latest-designer-portfolio.md
- docs/agent-system/latest-designer-visual-quality.json
- docs/agent-system/latest-designer-visual-quality.md
- docs/agent-system/latest-guardian-risk-summary.json
- docs/agent-system/latest-guardian-risk-summary.md
- docs/agent-system/latest-job-run.json
- docs/agent-system/latest-job-run.md
- docs/agent-system/latest-mentor-agent-education.json
- docs/agent-system/latest-mentor-agent-education.md
- docs/agent-system/latest-notebooklm-brief.json
- docs/agent-system/latest-notebooklm-brief.md
- docs/agent-system/latest-refactor-website-opportunities.json
- docs/agent-system/latest-refactor-website-opportunities.md
- docs/agent-system/latest-repository-monitor.json
- docs/agent-system/latest-repository-monitor.md
- docs/agent-system/latest-website-profitability.json
- docs/agent-system/latest-website-profitability.md
- docs/agent-system/manni-reel-draft-pack.md
- docs/agent-system/manni-reel-queue.json
- docs/agent-system/manni-reel-weekly-plan.md
- package.json
- scripts/social-tiktok-oauth-init.mjs
- src/components/Footer.jsx
- src/data/__tests__/musicSets.test.js
- src/data/musicSets.js
- src/desktop/DesktopApp.jsx
- src/desktop/desktop.css
- src/desktop/mockApi.js
- src/server/__tests__/worker.test.js
- src/server/legalPages.js
- src/server/worker.js
- desktop/main/services/audioMastering.mjs
- docs/agent-system/REPORTING_EVIDENCE_POLICY.md
- src/components/TikTokCreatorPage.css
- src/components/TikTokCreatorPage.jsx
- src/desktop/__tests__/AudioMasteringService.test.js
- src/desktop/__tests__/AudioMasteringTab.test.jsx
- src/desktop/components/AudioMasteringTab.jsx
- src/server/__tests__/tiktokCreator.test.js
- src/server/tiktokCreator.js

## Knowledge Files

- Keine

## Gates

- local wiki lint with base path D:\webseeite-main\airdoX_wiki
- npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js
- npm run desktop:test:logic -- --run when Flight Deck behavior changed

