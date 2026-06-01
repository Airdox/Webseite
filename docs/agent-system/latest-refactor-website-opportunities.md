# AIRDOX Refactor Website Opportunities

Generated: 2026-06-01T01:47:06.862Z
Agent: Refactor

## Summary

- Scanned source files: 44
- Opportunities: 15
- High priority: 3

## Operating Rules

- Availability, stability and functionality come before cleanup.
- Broad restructuring is allowed only with Master Controller approval, rollback note and quality gates.
- Each Refactor task must name before/after benefit and validation.
- Prefer one website flow at a time: music, booking, newsletter, VIP/auth, stats.

## Opportunities

| Priority | Area | ID | Evidence | Action | Validation | Files |
| --- | --- | --- | --- | --- | --- | --- |
| high | availability-and-functionality | website-api-client-consolidation | 6 website service files contain fetch/base-url handling. | Move base URL resolution and safe JSON/error reading into one small helper, then migrate one user flow at a time. | Run the touched flow test plus npm run build. For visible flows, add desktop/mobile proof before release. | src/utils/stats-sync.js<br>src/contexts/AudioContext.jsx<br>src/components/AuthModal.jsx<br>src/components/BookingSection.jsx<br>src/components/Newsletter.jsx<br>src/components/VIPSection.jsx |
| high | analytics-integrity | audio-stats-runtime-boundary | Audio and stats runtime URL logic are split across playback and stats modules. | Keep localhost/production routing in a shared utility so local listening does not pollute production stats. | Run AudioContext and MusicSection tests, then npm run build. | src/utils/stats-sync.js<br>src/contexts/AudioContext.jsx |
| high | maintainability | large-file-src-lib-stats-logic-js | 980 lines / 36702 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/lib/stats-logic.js |
| medium | maintainability | large-file-src-server-worker-js | 762 lines / 29302 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/server/worker.js |
| medium | maintainability | large-file-src-utils-i18n-js | 468 lines / 25968 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/utils/i18n.js |
| medium | maintainability | large-file-src-utils-analytics-index-js | 639 lines / 20804 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/utils/analytics/index.js |
| medium | maintainability | large-file-src-components-authmodal-jsx | 475 lines / 19715 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/components/AuthModal.jsx |
| medium | maintainability | large-file-src-contexts-audiocontext-jsx | 461 lines / 17094 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/contexts/AudioContext.jsx |
| medium | maintainability | large-file-src-components-bookingsection-jsx | 282 lines / 16558 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/components/BookingSection.jsx |
| medium | maintainability | large-file-src-components-setcard-jsx | 380 lines / 16436 bytes. | Extract only the next user-visible or service-flow subunit that can receive a focused test. | Run the nearest component/unit test plus npm run build. | src/components/SetCard.jsx |
| medium | state-contract | state-contract-src-utils-stats-sync-js | 9 localStorage references, 7 event references. | Document or extract the smallest event/storage contract before changing dependent UI. | Run the nearest tests that assert event dispatch, cache update, or UI refresh behavior. | src/utils/stats-sync.js |
| medium | state-contract | state-contract-src-components-musicsection-jsx | 9 localStorage references, 4 event references. | Document or extract the smallest event/storage contract before changing dependent UI. | Run the nearest tests that assert event dispatch, cache update, or UI refresh behavior. | src/components/MusicSection.jsx |
| medium | state-contract | state-contract-src-components-cookiebanner-jsx | 5 localStorage references, 5 event references. | Document or extract the smallest event/storage contract before changing dependent UI. | Run the nearest tests that assert event dispatch, cache update, or UI refresh behavior. | src/components/CookieBanner.jsx |
| medium | state-contract | state-contract-src-contexts-audiocontext-jsx | 1 localStorage references, 7 event references. | Document or extract the smallest event/storage contract before changing dependent UI. | Run the nearest tests that assert event dispatch, cache update, or UI refresh behavior. | src/contexts/AudioContext.jsx |
| medium | state-contract | state-contract-src-components-vipsection-jsx | 3 localStorage references, 4 event references. | Document or extract the smallest event/storage contract before changing dependent UI. | Run the nearest tests that assert event dispatch, cache update, or UI refresh behavior. | src/components/VIPSection.jsx |

