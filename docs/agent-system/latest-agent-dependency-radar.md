# AIRDOX Agenten-Abhaengigkeitsradar

Erstellt: 2026-10-20T01:48:27.691Z
Controller: Master Controller

## Ueberblick

- Uebergaben: 18
- Hinweise: 15
- Letzter Joblauf: 2026-10-20T01:45:51.422Z

## Uebergaben

| ID | Von | An | Status | Naechste Aktion | Nutzer-Touchpoint |
| --- | --- | --- | --- | --- | --- |
| workbench-change-audience-intelligence-review | Workbench | Audience Intelligence | watch | Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-deep-research-primary | Workbench | Deep Research | watch | Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-designer-review | Workbench | Designer | watch | Sondieren, ob aus docs/agent-system/latest-designer-portfolio.md, public/assets/strohpuppe-cover.jpg, public/assets/strohpuppe-daumenkino.gif eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-guardian-review | Workbench | Guardian | watch | Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-manni-primary | Workbench | Manni | watch | Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-master-controller-review | Workbench | Master Controller | watch | Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-mentor-review | Workbench | Mentor | watch | Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/AGENT_TRAINING_CATALOG.json, docs/agent-system/AGENT_TRAINING_CATALOG.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-refactor-implementation_support | Workbench | Refactor | watch | Sondieren, ob aus desktop/main/services/audioMastering.mjs, src/data/__tests__/musicSets.test.js, src/data/musicSets.js eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-webbie-primary | Workbench | Webbie | watch | Sondieren, ob aus public/assets/strohpuppe-cover.jpg, public/assets/strohpuppe-daumenkino.gif eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-winnie-primary | Workbench | Winnie | watch | Sondieren, ob aus desktop/main/index.cjs, desktop/main/services/audioMastering.mjs, package.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| manni-to-designer-social-hook | Manni | Designer | blocked | Designer has portfolio context; build only short visual prototypes after user direction. | Ask user to choose direction only after a small portfolio is visible. |
| designer-to-manni-preview-selection | Designer | Manni | ready | Manni prepares platform copy only for directions marked ja/candidate, not for rejected visuals. | Notify user when a portfolio has 3+ viable options or when all options are weak. |
| audience-to-manni-hook-priority | Audience Intelligence | Manni | blocked_by_no_measurement_data | Webbie must verify consented event export before Manni treats hook priorities as data-backed. | Do not ask for creative approval as data-backed; ask only for tracking credentials or explicit no-data prioritization. |
| designer-to-user-content-request | Designer | User | watch | When no strong source image exists, request content before rendering polished assets. | Message user with one concrete request, not a vague creative prompt. |
| guardian-to-manni-live-gate | Guardian | Manni | blocked_until_user_ok | Keep all social outputs as external_draft until approval is logged. | Ask for OK only on a concrete preview package. |
| quality-chain-desktop-ui-quality-chain | Winnie | Guardian | test_changes_present | Guardian must verify that Desktop tests cover the changed tab/menu/control behavior. | Only ask user if workflow intent or acceptance criteria are unclear. |
| quality-chain-script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | Only ask user for credentials or live-system approval if a validation needs external access. |
| quality-chain-user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | Ask user for acceptance only after a working preview or clear behavior summary exists. |

## Hinweise

- info: Audience Intelligence waits for: 8 changed file(s) matched audience-intelligence. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Deep Research waits for: 2 changed file(s) matched notebooklm-deep-research. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Designer waits for: 8 changed file(s) matched desktop-experience-design, visual-quality. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-designer-portfolio.md, public/assets/strohpuppe-cover.jpg, public/assets/strohpuppe-daumenkino.gif eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Guardian waits for: 36 changed file(s) matched quality-security. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Manni waits for: 4 changed file(s) matched growth-conversion. Naechster Schritt: Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Master Controller waits for: 31 changed file(s) matched default routing. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-dependency-radar.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Mentor waits for: 14 changed file(s) matched learning-documentation. Naechster Schritt: Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/AGENT_TRAINING_CATALOG.json, docs/agent-system/AGENT_TRAINING_CATALOG.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Refactor waits for: 10 changed file(s) matched refactor-architecture. Naechster Schritt: Sondieren, ob aus desktop/main/services/audioMastering.mjs, src/data/__tests__/musicSets.test.js, src/data/musicSets.js eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Webbie waits for: 2 changed file(s) matched website-experience. Naechster Schritt: Sondieren, ob aus public/assets/strohpuppe-cover.jpg, public/assets/strohpuppe-daumenkino.gif eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Winnie waits for: 11 changed file(s) matched desktop-flightdeck. Naechster Schritt: Sondieren, ob aus desktop/main/index.cjs, desktop/main/services/audioMastering.mjs, package.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- action: Designer waits for: Current campaign hook, required on-screen message, platform intent. Naechster Schritt: Designer has portfolio context; build only short visual prototypes after user direction.
- gate: Manni waits for: Consented website events for route_view, set_play, newsletter_signup, booking_click, contact_submit, and epk_download. Naechster Schritt: Webbie must verify consented event export before Manni treats hook priorities as data-backed.
- info: User waits for: Fresh photos, video snippets, Daumenkino references, rejected-style feedback, or preferred visual direction. Naechster Schritt: When no strong source image exists, request content before rendering polished assets.
- gate: Manni waits for: Explicit personal OK for platform, asset, caption, timing, and landing URL. Naechster Schritt: Keep all social outputs as external_draft until approval is logged.
- info: Guardian waits for: A menu, navigation, tab, section, button, modal, or visible feature may have changed. Naechster Schritt: Responsible primary agent must confirm tests exist for the new entry point and failure path.

