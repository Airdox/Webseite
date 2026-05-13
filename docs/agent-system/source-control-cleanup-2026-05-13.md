# Source-Control Cleanup - 2026-05-13

Branch: `feature/repository-cleanup`
Repository agent: `Repository`

## Current Gate Status

- `npm run repository:monitor:strict`: PASS with warnings only.
- `npm run repository:monitor:write`: refreshed `latest-repository-monitor.*`.
- `npm run agent:jobs:validate -- --strict-warnings`: PASS, 22 jobs checked.
- `git diff --check`: no whitespace errors; LF normalization warnings are expected from `.gitattributes`.

## Active Worktree Split

### 1. Agent Governance

Files:
- `scripts/superagent-task-gate.mjs`
- `scripts/agent-job-validator.mjs`
- `scripts/agent-job-runner.mjs`
- `docs/agent-system/ORCHESTRATION_WORKFLOW.md`
- `docs/agent-system/job-catalog.json`
- `docs/agent-system/latest-job-run.json`
- `docs/agent-system/latest-job-run.md`

Intent:
- Strengthen job validation and external-live approval handling.
- Keep latest job-run artifacts as generated run outputs, not hand-edited source logic.

Suggested commit:
- `chore(agent-system): harden job governance gates`

### 2. Growth And Social Drafts

Files:
- `docs/agent-system/manni-reel-draft-pack.md`
- `docs/agent-system/manni-reel-queue.json`
- `docs/agent-system/manni-reel-weekly-plan.md`
- `docs/agent-system/DECISION_LOG.md`
- `docs/agent-system/AIRDOX_REACH_MASTERPLAN_2026-05-08.md`
- `docs/agent-system/MANNI_GROWTH_PLAYBOOK.md`
- `docs/agent-system/OPERATING_MODEL.md`
- `scripts/manni-reel-factory.mjs`

Intent:
- Keep social output at draft/planning level only.
- No external live publishing or boosting without explicit user approval.

Suggested commit:
- `docs(growth): prepare reel draft production package`

### 3. Website Service Flow

Files:
- `src/components/BookingSection.jsx`
- `src/components/Newsletter.jsx`
- `src/components/SetCard.jsx`
- `src/components/__tests__/BookingSection.test.jsx`
- `src/components/__tests__/MusicSection.test.jsx`
- `src/components/__tests__/Newsletter.test.jsx`
- `src/contexts/AudioContext.jsx`
- `src/data/agentSystemData.js`
- `docs/agent-system/reach-route-matrix-2026-05-13.md`

Intent:
- Booking, newsletter, music-card and audio behavior changes are one service-facing strand.
- Keep tests with the corresponding UI changes.

Suggested commit:
- `fix(web): harden booking newsletter and audio flows`

### 4. Repository Monitoring Outputs

Files:
- `docs/agent-system/latest-repository-monitor.json`
- `docs/agent-system/latest-repository-monitor.md`
- `docs/agent-system/source-control-cleanup-2026-05-13.md`

Intent:
- Document current source-control state and explain the remaining dirty paths.

Suggested commit:
- `docs(repository): record cleanup split and monitor state`

## Release Rule

Do not merge or release this branch until the remaining dirty paths are either:
- committed in the workstream groups above,
- intentionally moved to a fresh branch,
- or explicitly added to `repository-dirty-baseline.txt` by Master Controller decision.

The current cleanup does not rewrite history, reset files, or discard any existing user or agent changes.
