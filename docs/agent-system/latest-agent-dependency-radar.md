# AIRDOX Agenten-Abhaengigkeitsradar

Erstellt: 2026-06-24T20:55:01.068Z
Controller: Master Controller

## Ueberblick

- Uebergaben: 12
- Hinweise: 10
- Letzter Joblauf: 2026-06-24T20:36:00.354Z

## Uebergaben

| ID | Von | An | Status | Naechste Aktion | Nutzer-Touchpoint |
| --- | --- | --- | --- | --- | --- |
| workbench-change-audience-intelligence-review | Workbench | Audience Intelligence | watch | Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-deep-research-primary | Workbench | Deep Research | watch | Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-guardian-review | Workbench | Guardian | watch | Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-quality-chain.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-manni-primary | Workbench | Manni | watch | Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-master-controller-review | Workbench | Master Controller | watch | Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-quality-chain.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-mentor-review | Workbench | Mentor | watch | Sondieren, ob aus docs/agent-system/AGENT_TRAINING_CATALOG.json, docs/agent-system/AGENT_TRAINING_CATALOG.md, docs/agent-system/MENTOR_POSTMORTEM_BANK.json eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| workbench-change-refactor-implementation_support | Workbench | Refactor | watch | Sondieren, ob aus src/data/__tests__/musicSets.test.js, src/data/musicSets.js eine konkrete Aufgabe im eigenen Bereich entsteht. | Only interrupt user when the agent needs content, approval, or a decision. |
| manni-to-designer-social-hook | Manni | Designer | blocked | Designer has portfolio context; build only short visual prototypes after user direction. | Ask user to choose direction only after a small portfolio is visible. |
| designer-to-manni-preview-selection | Designer | Manni | ready | Manni prepares platform copy only for directions marked ja/candidate, not for rejected visuals. | Notify user when a portfolio has 3+ viable options or when all options are weak. |
| audience-to-manni-hook-priority | Audience Intelligence | Manni | ready | Use audience signal to decide whether this batch optimizes completion, shares, follows, or website clicks. | If KPI data is missing, ask user for platform screenshots or export before inventing performance claims. |
| designer-to-user-content-request | Designer | User | watch | When no strong source image exists, request content before rendering polished assets. | Message user with one concrete request, not a vague creative prompt. |
| guardian-to-manni-live-gate | Guardian | Manni | blocked_until_user_ok | Keep all social outputs as external_draft until approval is logged. | Ask for OK only on a concrete preview package. |

## Hinweise

- info: Audience Intelligence waits for: 8 changed file(s) matched audience-intelligence. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-audience-intelligence.json, docs/agent-system/latest-audience-intelligence.md, docs/agent-system/latest-website-profitability.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Deep Research waits for: 2 changed file(s) matched notebooklm-deep-research. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-notebooklm-brief.json, docs/agent-system/latest-notebooklm-brief.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Guardian waits for: 16 changed file(s) matched default routing. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-quality-chain.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Manni waits for: 3 changed file(s) matched growth-conversion. Naechster Schritt: Sondieren, ob aus docs/agent-system/manni-reel-draft-pack.md, docs/agent-system/manni-reel-queue.json, docs/agent-system/manni-reel-weekly-plan.md eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Master Controller waits for: 16 changed file(s) matched default routing. Naechster Schritt: Sondieren, ob aus docs/agent-system/latest-agent-currency.json, docs/agent-system/latest-agent-currency.md, docs/agent-system/latest-agent-quality-chain.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Mentor waits for: 7 changed file(s) matched learning-documentation. Naechster Schritt: Sondieren, ob aus docs/agent-system/AGENT_TRAINING_CATALOG.json, docs/agent-system/AGENT_TRAINING_CATALOG.md, docs/agent-system/MENTOR_POSTMORTEM_BANK.json eine konkrete Aufgabe im eigenen Bereich entsteht.
- info: Refactor waits for: 2 changed file(s) matched refactor-architecture. Naechster Schritt: Sondieren, ob aus src/data/__tests__/musicSets.test.js, src/data/musicSets.js eine konkrete Aufgabe im eigenen Bereich entsteht.
- action: Designer waits for: Current campaign hook, required on-screen message, platform intent. Naechster Schritt: Designer has portfolio context; build only short visual prototypes after user direction.
- info: User waits for: Fresh photos, video snippets, Daumenkino references, rejected-style feedback, or preferred visual direction. Naechster Schritt: When no strong source image exists, request content before rendering polished assets.
- gate: Manni waits for: Explicit personal OK for platform, asset, caption, timing, and landing URL. Naechster Schritt: Keep all social outputs as external_draft until approval is logged.

