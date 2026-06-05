# AIRDOX Agenten-Abhaengigkeitsradar

Erstellt: 2026-06-05T19:57:23.753Z
Controller: Master Controller

## Ueberblick

- Uebergaben: 19
- Hinweise: 14
- Letzter Joblauf: 2026-06-05T19:45:50.875Z

## Uebergaben

| ID | Von | An | Status | Naechste Aktion | Nutzer-Touchpoint |
| --- | --- | --- | --- | --- | --- |
| workbench-change-audience-intelligence-review | Workbench | Audience Intelligence | watch | Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-deep-research-primary | Workbench | Deep Research | watch | Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-designer-review | Workbench | Designer | watch | Sondieren, ob aus docs/agent-system/latest-designer-portfolio.md, public/brand-assets/airdox-lettering/, public/brand-assets/lettering-lab/ eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-guardian-primary | Workbench | Guardian | watch | Sondieren, ob aus docs/agent-system/latest-youtube-publish-audit.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-guardian-review | Workbench | Guardian | watch | Sondieren, ob aus airdox_three_reel.html, cloud-render/, docs/agent-system/latest-agent-currency.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-manni-primary | Workbench | Manni | watch | Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-master-controller-review | Workbench | Master Controller | watch | Sondieren, ob aus airdox_three_reel.html, cloud-render/, docs/agent-system/latest-agent-currency.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-mentor-review | Workbench | Mentor | watch | Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/DECISION_LOG.md, docs/agent-system/OPERATING_MODEL.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-refactor-implementation_support | Workbench | Refactor | watch | Sondieren, ob aus src/components/AuthModal.jsx, src/components/AuthModalFields.jsx, src/components/AuthSocialButtons.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-webbie-primary | Workbench | Webbie | watch | Sondieren, ob aus public/brand-assets/airdox-lettering/, public/brand-assets/lettering-lab/, src/components/AuthModal.jsx eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-winnie-primary | Workbench | Winnie | watch | Sondieren, ob aus package.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| manni-to-designer-social-hook | Manni | Designer | ready | Designer has portfolio context; build only short visual prototypes after user direction. | Ask user to choose direction only after a small portfolio is visible. |
| designer-to-manni-preview-selection | Designer | Manni | ready | Manni prepares platform copy only for directions marked ja/candidate, not for rejected visuals. | Notify user when a portfolio has 3+ viable options or when all options are weak. |
| audience-to-manni-hook-priority | Audience Intelligence | Manni | ready | Use audience signal to decide whether this batch optimizes completion, shares, follows, or website clicks. | If KPI data is missing, ask user for platform screenshots or export before inventing performance claims. |
| designer-to-user-content-request | Designer | User | watch | When no strong source image exists, request content before rendering polished assets. | Message user with one concrete request, not a vague creative prompt. |
| guardian-to-manni-live-gate | Guardian | Manni | blocked_until_user_ok | Keep all social outputs as external_draft until approval is logged. | Ask for OK only on a concrete preview package. |
| quality-chain-website-ui-quality-chain | Webbie | Guardian | test_changes_present | Guardian must verify that changed tests cover the changed UI path. | Only ask user if expected behavior or content is ambiguous. |
| quality-chain-script-api-quality-chain | Guardian | Guardian | test_changes_present | Guardian must run or request the narrow command that proves the changed script path. | Only ask user for credentials or live-system approval if a validation needs external access. |
| quality-chain-user-facing-change-watch | Master Controller | Guardian | watch | Responsible primary agent must confirm tests exist for the new entry point and failure path. | Ask user for acceptance only after a working preview or clear behavior summary exists. |

## Hinweise

- info: Audience Intelligence waits for: 8 changed file(s) matched audience-intelligence. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Deep Research waits for: 2 changed file(s) matched notebooklm-deep-research. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Designer waits for: 3 changed file(s) matched visual-quality. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-designer-portfolio.md, public/brand-assets/airdox-lettering/, public/brand-assets/lettering-lab/ eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Guardian waits for: 1 changed file(s) matched youtube-publish-quality. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-youtube-publish-audit.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Guardian waits for: 49 changed file(s) matched quality-security. Naechster Schritt: Sondieren, ob aus airdox_three_reel.html, cloud-render/, docs/agent-system/latest-agent-currency.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Manni waits for: 6 changed file(s) matched growth-conversion. Naechster Schritt: Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Master Controller waits for: 28 changed file(s) matched default routing. Naechster Schritt: Sondieren, ob aus airdox_three_reel.html, cloud-render/, docs/agent-system/latest-agent-currency.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Mentor waits for: 14 changed file(s) matched learning-documentation. Naechster Schritt: Sondieren, ob aus docs/agent-system/AGENT_SYSTEM_ARCHITECTURE.md, docs/agent-system/DECISION_LOG.md, docs/agent-system/OPERATING_MODEL.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Refactor waits for: 46 changed file(s) matched refactor-architecture. Naechster Schritt: Sondieren, ob aus src/components/AuthModal.jsx, src/components/AuthModalFields.jsx, src/components/AuthSocialButtons.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Webbie waits for: 18 changed file(s) matched website-experience. Naechster Schritt: Sondieren, ob aus public/brand-assets/airdox-lettering/, public/brand-assets/lettering-lab/, src/components/AuthModal.jsx eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Winnie waits for: 1 changed file(s) matched desktop-flightdeck. Naechster Schritt: Sondieren, ob aus package.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: User waits for: Fresh photos, video snippets, Daumenkino references, rejected-style feedback, or preferred visual direction. Naechster Schritt: When no strong source image exists, request content before rendering polished assets.
- gate: Manni waits for: Explicit personal OK for platform, asset, caption, timing, and landing URL. Naechster Schritt: Keep all social outputs as external_draft until approval is logged.
- info: Guardian waits for: A menu, navigation, tab, section, button, modal, or visible feature may have changed. Naechster Schritt: Responsible primary agent must confirm tests exist for the new entry point and failure path.

