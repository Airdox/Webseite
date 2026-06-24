# AIRDOX Wiki Sync Audit

Erstellt: 2026-06-24T20:54:52.506Z
Status: warn

## Ueberblick

- Geaenderte Dateien: 34
- Content / project files: 34
- Wiki / Assistant knowledge files: 0
- Owner: Master Controller -> Wiki Maintainer

## Required Action

Master Controller muss den Wiki Maintainer beauftragen: neue Projekt-/Content-Aenderungen in airdoX_wiki und lokale Assistant-Antworten ueberfuehren, danach Wiki-Lint und Assistant-Coverage ausfuehren.

## Content Files

- docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md
- docs/agent-system/AGENT_TRAINING_CATALOG.json
- docs/agent-system/AGENT_TRAINING_CATALOG.md
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
- docs/agent-system/latest-guardian-risk-summary.json
- docs/agent-system/latest-guardian-risk-summary.md
- docs/agent-system/latest-mentor-agent-education.json
- docs/agent-system/latest-mentor-agent-education.md
- docs/agent-system/latest-notebooklm-brief.json
- docs/agent-system/latest-notebooklm-brief.md
- docs/agent-system/latest-repository-monitor.json
- docs/agent-system/latest-repository-monitor.md
- docs/agent-system/latest-website-profitability.json
- docs/agent-system/latest-website-profitability.md
- docs/agent-system/manni-reel-draft-pack.md
- docs/agent-system/manni-reel-queue.json
- docs/agent-system/manni-reel-weekly-plan.md
- src/data/__tests__/musicSets.test.js
- src/data/musicSets.js

## Knowledge Files

- Keine

## Gates

- local wiki lint with base path D:\webseeite-main\airdoX_wiki
- npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js
- npm run desktop:test:logic -- --run when Flight Deck behavior changed

