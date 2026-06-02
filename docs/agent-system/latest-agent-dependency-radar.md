# AIRDOX Agent Dependency Radar

Generated: 2026-06-01T19:48:05.751Z
Controller: Master Controller

## Summary

- Handoffs: 20
- Alerts: 15
- Last job run: 2026-06-01T19:45:46.774Z

## Handoffs

| ID | From | To | Status | Next Action | User Touchpoint |
| --- | --- | --- | --- | --- | --- |
| workbench-change-audience-intelligence-review | Workbench | Audience Intelligence | watch | Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-deep-research-primary | Workbench | Deep Research | watch | Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-designer-primary | Workbench | Designer | watch | Sondieren, ob aus scripts/render-daumenkino-airdox-letterbeat.mjs, scripts/render-daumenkino-airdox-web-preview.mjs, scripts/render-daumenkino-gif-letterbeat.mjs eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-designer-review | Workbench | Designer | watch | Sondieren, ob aus src/desktop/__tests__/DesktopControls.test.jsx, src/desktop/components/DesignExportPhase.jsx, src/desktop/components/DesignSetupPhase.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-guardian-review | Workbench | Guardian | watch | Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-manni-primary | Workbench | Manni | watch | Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-master-controller-review | Workbench | Master Controller | watch | Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-mentor-review | Workbench | Mentor | watch | Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-refactor-implementation_support | Workbench | Refactor | watch | Sondieren, ob aus src/desktop/__tests__/DesktopControls.test.jsx, src/desktop/components/DesignExportPhase.jsx, src/desktop/components/DesignSetupPhase.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-webbie-primary | Workbench | Webbie | watch | Sondieren, ob aus src/App.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-winnie-primary | Workbench | Winnie | watch | Sondieren, ob aus package.json, src/desktop/__tests__/DesktopControls.test.jsx, src/desktop/components/DesignExportPhase.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| manni-to-designer-social-hook | Manni | Designer | ready | Designer has portfolio context; build only short visual prototypes after user direction. | Ask user to choose direction only after a small portfolio is visible. |
| designer-to-manni-preview-selection | Designer | Manni | ready | Manni prepares platform copy only for directions marked ja/candidate, not for rejected visuals. | Notify user when a portfolio has 3+ viable options or when all options are weak. |
| audience-to-manni-hook-priority | Audience Intelligence | Manni | blocked_by_no_measurement_data | Webbie must verify consented event export before Manni treats hook priorities as data-backed. | Do not ask for creative approval as data-backed; ask only for tracking credentials or explicit no-data prioritization. |
| designer-to-user-content-request | Designer | User | watch | When no strong source image exists, request content before rendering polished assets. | Message user with one concrete request, not a vague creative prompt. |
| guardian-to-manni-live-gate | Guardian | Manni | blocked_until_user_ok | Keep all social outputs as external_draft until approval is logged. | Ask for OK only on a concrete preview package. |
| quality-chain-website-ui-quality-chain | Webbie | Guardian | test_changes_present | Guardian must verify that changed tests cover the changed UI path. | Only ask user if expected behavior or content is ambiguous. |
| quality-chain-desktop-ui-quality-chain | Winnie | Guardian | test_changes_present | Guardian must verify that Desktop tests cover the changed tab/menu/control behavior. | Only ask user if workflow intent or acceptance criteria are unclear. |
| quality-chain-script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | Only ask user for credentials or live-system approval if a validation needs external access. |
| quality-chain-user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | Ask user for acceptance only after a working preview or clear behavior summary exists. |

## Alerts

- info: Audience Intelligence waits for: 9 changed file(s) matched audience-intelligence. Next: Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Deep Research waits for: 2 changed file(s) matched notebooklm-deep-research. Next: Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Designer waits for: 3 changed file(s) matched daumenkino-reference-system. Next: Sondieren, ob aus scripts/render-daumenkino-airdox-letterbeat.mjs, scripts/render-daumenkino-airdox-web-preview.mjs, scripts/render-daumenkino-gif-letterbeat.mjs eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Designer waits for: 4 changed file(s) matched desktop-experience-design. Next: Sondieren, ob aus src/desktop/__tests__/DesktopControls.test.jsx, src/desktop/components/DesignExportPhase.jsx, src/desktop/components/DesignSetupPhase.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Guardian waits for: 34 changed file(s) matched quality-security. Next: Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Manni waits for: 5 changed file(s) matched growth-conversion. Next: Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Master Controller waits for: 21 changed file(s) matched default routing. Next: Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Mentor waits for: 7 changed file(s) matched learning-documentation. Next: Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Refactor waits for: 7 changed file(s) matched refactor-architecture. Next: Sondieren, ob aus src/desktop/__tests__/DesktopControls.test.jsx, src/desktop/components/DesignExportPhase.jsx, src/desktop/components/DesignSetupPhase.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Webbie waits for: 1 changed file(s) matched website-experience. Next: Sondieren, ob aus src/App.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Winnie waits for: 5 changed file(s) matched desktop-flightdeck. Next: Sondieren, ob aus package.json, src/desktop/__tests__/DesktopControls.test.jsx, src/desktop/components/DesignExportPhase.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- gate: Manni waits for: Consented website events for route_view, set_play, newsletter_signup, booking_click, contact_submit, and epk_download. Next: Webbie must verify consented event export before Manni treats hook priorities as data-backed.
- info: User waits for: Fresh photos, video snippets, Daumenkino references, rejected-style feedback, or preferred visual direction. Next: When no strong source image exists, request content before rendering polished assets.
- gate: Manni waits for: Explicit personal OK for platform, asset, caption, timing, and landing URL. Next: Keep all social outputs as external_draft until approval is logged.
- info: Guardian waits for: A menu, navigation, tab, section, button, modal, or visible feature may have changed. Next: Responsible primary agent must confirm tests exist for the new entry point and failure path.

