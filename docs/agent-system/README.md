# AIRDOX Agent System

This folder keeps the live agent workbench small and predictable.

## Working folders

- `reports/` contains human-readable reports, runbooks, briefs, research notes, quality proof, and campaign planning.
- `visual-templates/` contains visual templates, designer output, contact sheets, social render outputs, and visual source material.
- `latest-*.json` and `latest-*.md` are live machine snapshots written by agent scripts.
- `job-catalog.json`, `agent-routing-rules.json`, `agent-watch-zones.json`, and queue JSON files are operational inputs.
- `DECISION_LOG.md` remains at this level because multiple scripts and runbooks use it as the central decision ledger.

## Placement rule

New static reports go under `reports/`. New generated visual work goes under `visual-templates/`. Only keep files at this level when scripts read or write them directly.
