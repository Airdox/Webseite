# AIRDOX Agenten-Joblauf

Erstellt: 2026-06-24T20:36:00.354Z
Ereignis: scheduled_background
Status: deep

## Ueberblick

- Ausgewaehlte Jobs: 18
- Ausgefuehrte Jobs: 16
- Manuelle Jobs: 1
- Uebersprungene Jobs: 0
- Fehlgeschlagene Jobs: 1

## Jobs

| Job | Agent | Ergebnis | Detail |
| --- | --- | --- | --- |
| repository-hygiene-monitor | Repository | EXECUTED | ok (repository:monitor:write) |
| agent-audit-cycle | Guardian | EXECUTED | ok (agent:audit:write) |
| mentor-agent-currency | Mentor | EXECUTED | ok (mentor:currency:write) |
| mentor-agent-education | Mentor | EXECUTED | ok (mentor:education:write) |
| audience-intelligence-cycle | Audience Intelligence | EXECUTED | ok (audience:intelligence:write) |
| website-profitability-review | Audience Intelligence | EXECUTED | ok (website:profitability:write) |
| windows-tool-healthcheck | Winnie | FAILED | exit 1 (desktop:test:logic) |
| designer-pdf-draft-build | Designer | EXECUTED | ok (brand:epk) |
| manni-reel-factory | Manni | EXECUTED | ok (manni:reels:generate) |
| guardian-risk-summary | Guardian | EXECUTED | ok (guardian:risk:write) |
| notebooklm-deep-research-brief | Deep Research | EXECUTED | ok (agent:notebooklm:brief) |
| agent-routing-review | Master Controller | EXECUTED | ok (agent:route:write) |
| agent-quality-chain | Guardian | EXECUTED | ok (agent:quality-chain:write) |
| agent-dependency-radar | Master Controller | EXECUTED | ok (agent:dependencies:write) |
| agent-system-health | Master Controller | EXECUTED | ok (agent:system:health) |
| master-wiki-sync-enforcement | Master Controller | EXECUTED | ok (wiki:sync:audit) |
| wiki-maintainer-project-sync | Wiki Maintainer | MANUAL | Review changed project files in desktop/, src/desktop/, scripts/, docs/agent-system/latest-*.{md,json}, docs/agent-system/reports/, docs/agent-system/visual-templates/, README.md and airdoX_wiki/. Compile relevant functional, workflow, glossary, troubleshooting and agent-system changes into airdoX_wiki/wiki/flightdeck-expert-handbook.md, flightdeck-faq.md, flightdeck-troubleshooting.md or the matching local-* page. Update src/desktop/lib/assistantKnowledge.js and src/desktop/lib/assistantEngine.js when a likely user question, error message or workflow term needs a direct local Assistant answer. Keep Obsidian links connected: every new or substantially changed wiki section needs at least two valid [[...]] links, then update airdoX_wiki/wiki/index.md and airdoX_wiki/wiki/log.md. Run the local wiki lint with base path D:\webseeite-main\airdoX_wiki and run the nearest Assistant coverage test. If a user-facing Flight Deck behavior changed, run npm run desktop:test:logic -- --run. |
| refactor-website-opportunities | Refactor | EXECUTED | ok (refactor:website:opportunities) |

