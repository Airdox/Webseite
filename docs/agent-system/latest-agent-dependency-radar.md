# AIRDOX Agent Dependency Radar

Generated: 2026-06-01T01:47:07.421Z
Controller: Master Controller

## Summary

- Handoffs: 18
- Alerts: 12
- Last job run: 2026-06-01T01:45:49.093Z

## Handoffs

| ID | From | To | Status | Next Action | User Touchpoint |
| --- | --- | --- | --- | --- | --- |
| workbench-change-audience-intelligence-review | Workbench | Audience Intelligence | watch | Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-deep-research-primary | Workbench | Deep Research | watch | Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-guardian-review | Workbench | Guardian | watch | Sondieren, ob aus package-lock.json, package.json, scratch/baerdox_reel_frames/ eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-manni-primary | Workbench | Manni | watch | Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-master-controller-review | Workbench | Master Controller | watch | Sondieren, ob aus scratch/baerdox_reel_frames/, scratch/baerdox_reel_preview_frames/, scratch/chrome-focus-check.png eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-mentor-review | Workbench | Mentor | watch | Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-refactor-implementation_support | Workbench | Refactor | watch | Sondieren, ob aus src/components/Footer.jsx, src/desktop/DesktopApp.jsx, src/hooks/useVinylAnimation.js eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-webbie-primary | Workbench | Webbie | watch | Sondieren, ob aus en/index.html, index.html, public/_redirects eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-winnie-primary | Workbench | Winnie | watch | Sondieren, ob aus package.json, src/desktop/DesktopApp.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| manni-to-designer-social-hook | Manni | Designer | ready | Designer has portfolio context; build only short visual prototypes after user direction. | Ask user to choose direction only after a small portfolio is visible. |
| designer-to-manni-preview-selection | Designer | Manni | ready | Manni prepares platform copy only for directions marked ja/candidate, not for rejected visuals. | Notify user when a portfolio has 3+ viable options or when all options are weak. |
| audience-to-manni-hook-priority | Audience Intelligence | Manni | ready | Use audience signal to decide whether this batch optimizes completion, shares, follows, or website clicks. | If KPI data is missing, ask user for platform screenshots or export before inventing performance claims. |
| designer-to-user-content-request | Designer | User | watch | When no strong source image exists, request content before rendering polished assets. | Message user with one concrete request, not a vague creative prompt. |
| guardian-to-manni-live-gate | Guardian | Manni | blocked_until_user_ok | Keep all social outputs as external_draft until approval is logged. | Ask for OK only on a concrete preview package. |
| quality-chain-website-ui-quality-chain | Webbie | Guardian | tests_required | Guardian must ask Webbie for tests or add focused tests before release-ready status. | Only ask user if expected behavior or content is ambiguous. |
| quality-chain-desktop-ui-quality-chain | Winnie | Guardian | tests_required | Guardian must ask Winnie for focused Desktop tests before release-ready status. | Only ask user if workflow intent or acceptance criteria are unclear. |
| quality-chain-script-api-quality-chain | Guardian | Guardian | validation_required | Guardian must run or request the narrow command that proves the changed script path. | Only ask user for credentials or live-system approval if a validation needs external access. |
| quality-chain-user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | Ask user for acceptance only after a working preview or clear behavior summary exists. |

## Alerts

- info: Audience Intelligence waits for: 7 changed file(s) matched audience-intelligence. Next: Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Deep Research waits for: 2 changed file(s) matched notebooklm-deep-research. Next: Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Guardian waits for: 41 changed file(s) matched quality-security. Next: Sondieren, ob aus package-lock.json, package.json, scratch/baerdox_reel_frames/ eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Manni waits for: 3 changed file(s) matched growth-conversion. Next: Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Master Controller waits for: 32 changed file(s) matched default routing. Next: Sondieren, ob aus scratch/baerdox_reel_frames/, scratch/baerdox_reel_preview_frames/, scratch/chrome-focus-check.png eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Mentor waits for: 31 changed file(s) matched learning-documentation. Next: Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Refactor waits for: 4 changed file(s) matched refactor-architecture. Next: Sondieren, ob aus src/components/Footer.jsx, src/desktop/DesktopApp.jsx, src/hooks/useVinylAnimation.js eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Webbie waits for: 10 changed file(s) matched website-experience. Next: Sondieren, ob aus en/index.html, index.html, public/_redirects eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Winnie waits for: 2 changed file(s) matched desktop-flightdeck. Next: Sondieren, ob aus package.json, src/desktop/DesktopApp.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: User waits for: Fresh photos, video snippets, Daumenkino references, rejected-style feedback, or preferred visual direction. Next: When no strong source image exists, request content before rendering polished assets.
- gate: Manni waits for: Explicit personal OK for platform, asset, caption, timing, and landing URL. Next: Keep all social outputs as external_draft until approval is logged.
- info: Guardian waits for: A menu, navigation, tab, section, button, modal, or visible feature may have changed. Next: Responsible primary agent must confirm tests exist for the new entry point and failure path.

