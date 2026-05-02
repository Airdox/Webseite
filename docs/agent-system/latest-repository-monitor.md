# AIRDOX Repository Monitor

Generated: 2026-05-02T08:52:11.405Z
Agent: Repository
Repository: D:\webseeite-main
Branch: feature/repository-cleanup

## Summary

- Checks: 6
- Failures: 0
- Warnings: 2
- Uncommitted paths: 86
- Unexpected uncommitted paths: 6
- Baseline uncommitted paths: 80
- Tracked generated artifacts (review): 0

## Checks

| Check | Level | Detail |
| --- | --- | --- |
| branch-naming | PASS | Aktueller Branch: feature/repository-cleanup |
| required-governance-files | PASS | Gefundene Governance-Dateien: 3/3 |
| working-tree-cleanliness-total | WARN | 86 uncommitted Pfade insgesamt. |
| working-tree-cleanliness | WARN | 6 unerwartete uncommitted Pfade (86 gesamt, 80 baseline) |
| tracked-generated-artifacts | PASS | 0 potentiell generierte Artefaktpfade sind versioniert. |
| root-html-duplication | PASS | 0 zusaetzliche Root-HTML-Dateien erkannt. |

## Unexpected Dirty Paths

- ?? .github/workflows/agent-background-monitor.yml
- ?? .github/workflows/agent-job-dispatch.yml
- ?? scripts/agent-background-cycle.mjs
- ?? scripts/agent-job-runner.mjs
- ?? scripts/agent-job-validator.mjs
- ?? scripts/superagent-task-gate.mjs

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
- ?? .github/workflows/agent-background-monitor.yml
- ?? .github/workflows/agent-job-dispatch.yml
- ?? .github/workflows/web-quality.yml
- ?? docs/agent-system/
- ?? docs/archive/
- ?? scripts/agent-audit.mjs
- ?? scripts/agent-background-cycle.mjs
- ?? scripts/agent-job-runner.mjs
- ?? scripts/agent-job-validator.mjs
- ?? scripts/master-controller-gate.mjs
- ?? scripts/repository-monitor.mjs
- ?? scripts/superagent-task-gate.mjs

## Tracked Generated Artifacts

- build/icon.ico
- build/icon.png

## Recent Commits

- 8e1d3b5 feat(flightdeck): publish recording_2026_05_01
- aecc904 feat(assistant): add optional Ollama answer layer with wiki-context fallback
- 1216c5b fix(build): resolve set-access conflict and add corporate Windows app icon
- 371b26a feat(assistant): add wiki-backed Flight Deck expert chat with coverage tests
- b323435 feat(analytics): add filter engine, DB-backed metrics, and quality tests
- c26bad3 fix(app): repair broken React imports in App entry
- 6287bce feat(installer): add Windows installer scripts and configuration
- 4072205 chore: mergen von website in win-tool zur Synchronisation der Frontend-Features
- ab9350b feat: automatisierte VIP-Logik und Sichtbarkeit
- 8b88ad5 feat: finale Synchronisation und Live-Deployment

