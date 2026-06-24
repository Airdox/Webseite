# AIRDOX Repository-Monitor

Erstellt: 2026-06-24T20:36:01.581Z
Agent: Repository
Repository: D:\webseeite-main
Branch: codex/guardian-scope-cleanup

## Ueberblick

- Checks: 6
- Fehler: 0
- Warnungen: 3
- Offene Pfade: 8
- Unerwartete offene Pfade: 8
- Baseline offene Pfade: 80
- Versionierte generierte Artefakte (Review): 0

## Checks

| Check | Stufe | Detail |
| --- | --- | --- |
| branch-naming | WARN | Aktueller Branch: codex/guardian-scope-cleanup |
| required-governance-files | PASS | Gefundene Governance-Dateien: 3/3 |
| working-tree-cleanliness-total | WARN | 8 uncommitted Pfade insgesamt. |
| working-tree-cleanliness | WARN | 8 unerwartete uncommitted Pfade (8 gesamt, 80 baseline) |
| tracked-generated-artifacts | PASS | 0 potentiell generierte Artefaktpfade sind versioniert. |
| root-html-duplication | PASS | 0 zusaetzliche Root-HTML-Dateien erkannt. |

## Unerwartete offene Pfade

- M docs/agent-system/latest-agent-quality-chain.json
- M docs/agent-system/latest-agent-quality-chain.md
- M docs/agent-system/latest-agent-routing.json
- M docs/agent-system/latest-agent-routing.md
- M docs/agent-system/latest-wiki-sync-audit.json
- M docs/agent-system/latest-wiki-sync-audit.md
- M src/data/__tests__/musicSets.test.js
- M src/data/musicSets.js

## Baseline fuer offene Pfade

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

## Alle offenen Pfade

- M docs/agent-system/latest-agent-quality-chain.json
- M docs/agent-system/latest-agent-quality-chain.md
- M docs/agent-system/latest-agent-routing.json
- M docs/agent-system/latest-agent-routing.md
- M docs/agent-system/latest-wiki-sync-audit.json
- M docs/agent-system/latest-wiki-sync-audit.md
- M src/data/__tests__/musicSets.test.js
- M src/data/musicSets.js

## Versionierte generierte Artefakte

- Keine

## Letzte Commits

- 87ab297 chore: daily autopush 2026-06-24 22:31 +02:00
- f6698db fix(manifest): keep only one 2026-06-21 set (recording_2026_06_21-5) and three prior sets; point file to existing R2 key
- 7a0a6ef feat(flightdeck): publish recording_2026_06_21-5
- 2cb003c Remove duplicate set recording_2026_06_21-2 (keep only FeTe de la Music)
- ff66782 Deduplicate musicSets: keep single FeTe de la Music entry
- 3220e1e test: clean up process imports for web quality
- 703cd0b chore(agent-system): snapshot scoped reports and flightdeck fixes
- 1d64571 chore: daily autopush 2026-06-06 01:53 +02:00
- d958d77 feat(flightdeck): publish recording_2026_06_02
- 6af7582 chore: daily autopush 2026-06-02 02:12 +02:00

