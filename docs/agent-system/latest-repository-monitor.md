# AIRDOX Repository Monitor

Generated: 2026-05-08T09:12:46.392Z
Agent: Repository
Repository: D:\webseeite-main
Branch: feature/repository-cleanup

## Summary

- Checks: 6
- Failures: 0
- Warnings: 2
- Uncommitted paths: 53
- Unexpected uncommitted paths: 49
- Baseline uncommitted paths: 80
- Tracked generated artifacts (review): 0

## Checks

| Check | Level | Detail |
| --- | --- | --- |
| branch-naming | PASS | Aktueller Branch: feature/repository-cleanup |
| required-governance-files | PASS | Gefundene Governance-Dateien: 3/3 |
| working-tree-cleanliness-total | WARN | 53 uncommitted Pfade insgesamt. |
| working-tree-cleanliness | WARN | 49 unerwartete uncommitted Pfade (53 gesamt, 80 baseline) |
| tracked-generated-artifacts | PASS | 0 potentiell generierte Artefaktpfade sind versioniert. |
| root-html-duplication | PASS | 0 zusaetzliche Root-HTML-Dateien erkannt. |

## Unexpected Dirty Paths

- M .gitignore
- M desktop/main/index.cjs
- M desktop/main/services/pipeline.mjs
- A  docs/agent-system/AIRDOX_REACH_MASTERPLAN_2026-05-08.md
- M docs/agent-system/DECISION_LOG.md
- M docs/agent-system/SUPERAGENT_ASSIGNMENTS.md
- M docs/agent-system/job-catalog.json
- M docs/agent-system/latest-audit.json
- M docs/agent-system/latest-audit.md
- M docs/agent-system/manni-reel-draft-pack.md
- M docs/agent-system/manni-reel-queue.json
- M docs/agent-system/manni-reel-weekly-plan.md
- M scripts/generate-mixcloud-tracklists.mjs
- M src/components/AuthModal.css
- M src/components/AuthModal.jsx
- M src/components/MusicSection.css
- M src/components/SetCard.jsx
- M src/data/musicSets.js
- M src/desktop/DesktopApp.jsx
- M src/desktop/__tests__/DesktopApp.test.jsx
- M src/desktop/components/AssistantTab.jsx
- M src/desktop/components/SetImportTab.jsx
- M src/desktop/lib/assistantKnowledge.js
- M src/lib/stats-logic.js
- M src/server/worker.js
- ?? .github/workflows/designer-visual-quality.yml
- ?? .tmp_liveinspect/
- ?? airdoX_wiki/webseeite-main.code-workspace
- ?? docs/R2_BACKUP_SETUP.md
- ?? docs/agent-system/AIRDOX_AGENT_EXECUTION_CALENDAR_2026-05-08.md
- ?? docs/agent-system/latest-designer-visual-quality.json
- ?? docs/agent-system/latest-designer-visual-quality.md
- ?? docs/agent-system/proof/
- ?? scratch/create-test-user.mjs
- ?? scratch/live-after-authmodal.js
- ?? scratch/live-after-deploy-en.html
- ?? scratch/live-authmodal.js
- ?? scratch/live-en.html
- ?? scratch/live-main.js
- ?? scratch/live-workersdev-en.html
- ?? scratch/proof-captcha-visible.png
- ?? scratch/proof-home.png
- ?? scratch/proof-social-login.png
- ?? scratch/verify-auth-flow.mjs
- ?? scratch/verify-credential-login.mjs
- ?? scripts/backup-r2.ps1
- ?? scripts/designer-visual-quality-check.mjs
- ?? scripts/register-r2-backup-task.ps1
- ?? src/components/__tests__/AuthModal.test.jsx

## Dirty Baseline Paths

- M .env.example
- M README.md
- M airdoX_wiki/wiki/index.md
- M airdoX_wiki/wiki/log.md
- D custom.html
- M  desktop/main/services/manifest.mjs
- M  desktop/main/services/pipeline.mjs
- A  docs/proof/analytics-filter-after-event.png
- A  docs/proof/analytics-filter-before.png
- A  docs/proof/deploy-check-after-redeploy-1-recording_2026_05_01.png
- A  docs/proof/deploy-check-after-redeploy-2-135.png
- A  docs/proof/live-latest-trackjump-135.png
- A  docs/proof/live-latest-trackjump-recording_2026_05_01.png
- A  docs/proof/playable-after-click-1-recording_2026_05_01.png
- A  docs/proof/playable-after-click-2-135.png
- A  docs/proof/playable-before-click.png
- A  docs/proof/playable-clean-after-click-1-recording_2026_05_01.png
- A  docs/proof/playable-clean-after-click-2-135.png
- A  docs/proof/playable-clean-before-click.png
- A  docs/proof/set-cards-transparent-desktop.png
- A  docs/proof/set-cards-transparent-mobile.png
- A  docs/proof/verify-about-order-tracklist-jump.png
- M en/index.html
- M eslint.config.js
- MM index.html
- D live_index.html
- M package.json
- D page.html
- M public/_headers
- M public/og-image.svg
- M public/robots.txt
- M public/sitemap.xml
- M  scripts/generate-mixcloud-tracklists.mjs
- MM src/App.jsx
- M  src/components/AnalyticsDashboard.jsx
- M  src/components/AuthModal.css
- M  src/components/AuthModal.jsx
- MM src/components/BioSection.jsx
- M  src/components/BookingSection.jsx
- M src/components/CookieBanner.css
- M src/components/CookieBanner.jsx
- M  src/components/EPKSection.jsx
- M  src/components/ErrorBoundary.jsx
- M  src/components/Footer.jsx
- MM src/components/GlobalPlayer.jsx
- M src/components/Hero.css
- M src/components/Hero.jsx
- M src/components/Magnetic.jsx
- M  src/components/MusicSection.css
- M  src/components/MusicSection.jsx
- M  src/components/Navigation.jsx
- M  src/components/Newsletter.jsx
- M  src/components/SetNotification.jsx
- M src/components/TurnstileCaptcha.jsx
- M  src/components/VIPSection.jsx
- M  src/components/__tests__/MusicSection.test.jsx
- M  src/contexts/AudioContext.jsx
- M  src/data/musicSets.js
- M  src/desktop/DesktopApp.jsx
- M src/desktop/__tests__/AdminFeatures.test.jsx
- M  src/desktop/__tests__/DesktopApp.test.jsx
- M  src/desktop/__tests__/setManifest.test.js
- M src/desktop/components/AdvancedAnalyticsTab.jsx
- M  src/desktop/components/BatchImportTab.jsx
- M  src/desktop/desktop.css
- M  src/desktop/lib/setManifest.js
- M src/desktop/mockApi.js
- MM src/lib/stats-logic.js
- M src/main.jsx
- MM src/server/worker.js
- MM src/utils/i18n.js
- M  src/utils/stats-sync.js
- M vitest.config.js
- ?? .github/pull_request_template.md
- ?? .github/workflows/web-quality.yml
- ?? docs/agent-system/
- ?? docs/archive/
- ?? scripts/agent-audit.mjs
- ?? scripts/master-controller-gate.mjs
- ?? scripts/repository-monitor.mjs

## All Dirty Paths

- M .gitignore
- M desktop/main/index.cjs
- M desktop/main/services/pipeline.mjs
- A  docs/agent-system/AIRDOX_REACH_MASTERPLAN_2026-05-08.md
- M docs/agent-system/DECISION_LOG.md
- M docs/agent-system/SUPERAGENT_ASSIGNMENTS.md
- M docs/agent-system/job-catalog.json
- M docs/agent-system/latest-audit.json
- M docs/agent-system/latest-audit.md
- M docs/agent-system/manni-reel-draft-pack.md
- M docs/agent-system/manni-reel-queue.json
- M docs/agent-system/manni-reel-weekly-plan.md
- M package.json
- M public/_headers
- M scripts/generate-mixcloud-tracklists.mjs
- M src/components/AuthModal.css
- M src/components/AuthModal.jsx
- M src/components/MusicSection.css
- M src/components/SetCard.jsx
- M src/components/TurnstileCaptcha.jsx
- M src/data/musicSets.js
- M src/desktop/DesktopApp.jsx
- M src/desktop/__tests__/DesktopApp.test.jsx
- M src/desktop/components/AssistantTab.jsx
- M src/desktop/components/SetImportTab.jsx
- M src/desktop/lib/assistantKnowledge.js
- M src/desktop/mockApi.js
- M src/lib/stats-logic.js
- M src/server/worker.js
- ?? .github/workflows/designer-visual-quality.yml
- ?? .tmp_liveinspect/
- ?? airdoX_wiki/webseeite-main.code-workspace
- ?? docs/R2_BACKUP_SETUP.md
- ?? docs/agent-system/AIRDOX_AGENT_EXECUTION_CALENDAR_2026-05-08.md
- ?? docs/agent-system/latest-designer-visual-quality.json
- ?? docs/agent-system/latest-designer-visual-quality.md
- ?? docs/agent-system/proof/
- ?? scratch/create-test-user.mjs
- ?? scratch/live-after-authmodal.js
- ?? scratch/live-after-deploy-en.html
- ?? scratch/live-authmodal.js
- ?? scratch/live-en.html
- ?? scratch/live-main.js
- ?? scratch/live-workersdev-en.html
- ?? scratch/proof-captcha-visible.png
- ?? scratch/proof-home.png
- ?? scratch/proof-social-login.png
- ?? scratch/verify-auth-flow.mjs
- ?? scratch/verify-credential-login.mjs
- ?? scripts/backup-r2.ps1
- ?? scripts/designer-visual-quality-check.mjs
- ?? scripts/register-r2-backup-task.ps1
- ?? src/components/__tests__/AuthModal.test.jsx

## Tracked Generated Artifacts

- build/icon.ico
- build/icon.png

## Recent Commits

- 7fef483 feat(flightdeck): publish recording_2026_05_07-2
- cd24d0e chore: remove project duality artifacts
- 7620d47 feat: update flight deck assistant workflow
- 78cf631 chore: tidy repository metadata
- 63b3f63 chore: clean repository artifacts
- b84c6a7 Refactor: Extract logic into custom hooks, simplify components, externalize data
- 4fbb5d4 feat: automate tracklists and publish May sets
- c77195e feat(flightdeck): publish recording_2026_05_02-1
- 05e02e9 feat(flightdeck): publish recording_2026_05_02-1
- dde543e feat(flightdeck): publish recording_2026_05_02

