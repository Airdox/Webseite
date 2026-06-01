# AIRDOX Agent System Health

Generated: 2026-06-01T01:47:08.553Z

## Summary

- Status: OK
- Jobs: 42 (22 script, 20 manual)
- External live jobs gated: 5
- Stale reports: 0
- Alerts: 1

## Architecture

```mermaid
flowchart TD
  User[User Auftrag / Freigabe] --> MC[Master Controller]
  MC --> Catalog[Job Catalog]
  MC --> Router[Routing Rules]
  Router --> Wakeup[Workbench Wakeup]
  Wakeup --> Webbie
  Wakeup --> Winnie
  Wakeup --> Guardian
  Wakeup --> Manni
  Wakeup --> Designer
  Wakeup --> Mentor
  Wakeup --> Research[Deep Research]
  Wakeup --> Repository
  Catalog --> Runner[Agent Job Runner]
  Runner --> Reports[latest-*.json/md]
  Reports --> Radar[Dependency Radar]
  Radar --> Queue[Task Queue]
  Queue --> MC
  Guardian --> Gates[Quality Gates]
  Manni --> Drafts[External Drafts]
  Drafts --> Approval[Personal User OK]
  Approval --> Live[External Live Action]
  Live -. blocked without OK .-> Approval
  Scheduler[GitHub Schedule / Windows Task] --> Background[Background Cycle]
  Background --> Runner
  Background --> Health[System Health]
  Health --> MC
```

## Automation

- npm background script: present
- health script: present
- Windows task installer: present
- .github/workflows/agent-background-monitor.yml: present
- .github/workflows/agent-job-dispatch.yml: present

## Reports

| Report | Status | Age h | Path |
| --- | --- | ---: | --- |
| background-cycle | fresh | 6.02 | docs/agent-system/latest-background-cycle.json |
| job-run | fresh | 0.02 | docs/agent-system/latest-job-run.json |
| audit | fresh | 0.02 | docs/agent-system/latest-audit.json |
| dependency-radar | fresh | 0 | docs/agent-system/latest-agent-dependency-radar.json |
| task-queue | aging | 188.91 | docs/agent-system/latest-agent-task-queue.json |

## Alerts

- watch: task-queue is aging (188.91h old). Next: Let the next scheduled background cycle refresh it.

