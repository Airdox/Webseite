# AIRDOX Agent Execution Calendar - Fixed Duties

Stand: 2026-05-08  
Controller: Master Controller  
Bezug: `docs/agent-system/AIRDOX_REACH_MASTERPLAN_2026-05-08.md`

## 1. Zweck

Dieses Dokument versorgt alle Agenten ausser Manni mit verbindlicher Arbeit und klaren Terminen.
Jede Rolle weiss:

- was bis wann geliefert werden muss
- wo das Ergebnis abgelegt wird
- wie der Erfolg gemessen wird

## 2. Geltungszeitraum

Sprint: 2026-05-08 bis 2026-06-05 (Europe/Berlin)

Fixe Meilensteine:

- M0: 2026-05-08 20:00
- M1: 2026-05-10 18:00
- M2: 2026-05-12 18:00
- M3: 2026-05-15 18:00
- M4: 2026-05-19 18:00
- M5: 2026-05-26 18:00
- M6: 2026-06-05 18:00

## 3. Agentenpflichten mit festen Outputs

## Master Controller
- Pflicht:
  - priorisiert Milestone-Backlog, setzt `pass/warn/fail`, entscheidet Eskalation.
- Output:
  - Entscheidungsstatus in `docs/agent-system/DECISION_LOG.md`.
- Gate:
  - Kein Milestone ohne dokumentierten Status.

## Webbie
- Pflicht:
  - Nutzerreise, Navigation, Music/Booking/Newsletter/VIP-Pfade stabilisieren.
- Output:
  - Code + Tests in `src/components/*`, `src/App.jsx`, `e2e/navigation.spec.js`.
- Gate:
  - `npm run build` gruen.
  - relevante Vitest-/Playwright-Pfade gruen.

## Winnie
- Pflicht:
  - Desktop-Flow stabil halten (Import -> Draft -> Publish) und Testblocker abbauen.
- Output:
  - `src/desktop/*`, `src/desktop/__tests__/*`, `e2e/desktop-flightdeck.spec.js`.
- Gate:
  - `npm run desktop:test:logic` gruen.
  - bei M3/M6 zusaetzlich `npm run desktop:test:e2e`.

## Guardian
- Pflicht:
  - Release-Risiken blocken, API- und Tracking-Sauberkeit absichern.
- Output:
  - Audit- und Testsignale in `docs/agent-system/latest-audit.*` plus Bug-/Risk-Fixes.
- Gate:
  - `npm run lint`
  - `npm run test -- --run`
  - `npm run agent:audit -- --strict`

## Designer
- Pflicht:
  - visuelle Qualitaet der kritischen Sektionen und Manni-Drafts absichern.
- Output:
  - `docs/agent-system/latest-designer-visual-quality.*`
  - Proof-Artefakte in `docs/agent-system/proof/*`
  - ggf. UI-Anpassungen in `src/components/*`.
- Gate:
  - `npm run designer:visual:check -- --strict`

## Mentor
- Pflicht:
  - aus Fehlern/Erfolgen verbindliche Lernregeln machen.
- Output:
  - `airdoX_wiki/wiki/log.md`
  - `airdoX_wiki/wiki/local-11-feedback-loops.md`
  - ggf. Decision-Log-Lernnotizen.
- Gate:
  - Pro Milestone mindestens ein verwertbarer Lernpunkt bei Abweichungen.

## Refactor
- Pflicht:
  - Service-Reibung reduzieren, ohne breitflachiges Umbauen.
- Output:
  - gezielte Stabilitaets-/Vereinfachungs-Fixes in `src/utils/*`, `src/lib/*`, `src/server/*`.
- Gate:
  - Jeder Refactor-Schritt braucht konkreten Vorher/Nachher-Nutzen und Recheck.

## Repository
- Pflicht:
  - Worktree und Arbeitsstraenge releasefaehig halten.
- Output:
  - Monitoring-Reports in `docs/agent-system/latest-repository-monitor.*`
  - Governance-Updates in `docs/agent-system/REPOSITORY_GOVERNANCE.md` falls noetig.
- Gate:
  - `npm run repository:monitor:strict`

## 4. Milestone-Aufgaben je Agent

## M0 - 2026-05-08 20:00 (Baseline Freeze)

- Master Controller:
  - Sprint-Basisstatus und Prioritaet fuer WS-01 bis WS-07 festschreiben.
- Webbie:
  - Baseline der Website-Pfade dokumentieren: Start -> Musik, Booking, Newsletter.
- Winnie:
  - Offene Desktop-Blockerliste mit Teststatus dokumentieren.
- Guardian:
  - Blocker/Warnung/Nice-to-have Liste fuer Release-Risiken erstellen.
- Designer:
  - visuellen Baseline-Report (kritische Views) als Referenz sichern.
- Mentor:
  - Start-Lernnotiz: aktuelle Hauptursachen fuer Reibung.
- Refactor:
  - 3 engste Reibungspunkte fuer API/URL/Error-Logik benennen.
- Repository:
  - aktuellen Worktree nach Arbeitsstraengen kategorisieren.

## M1 - 2026-05-10 18:00 (Execution Start)

- Webbie:
  - Navigation/Section-Reihenfolge und CTA-Flows technisch stabil.
- Winnie:
  - erster Desktop-Blocker reduziert oder isoliert mit Repro.
- Guardian:
  - Booking-/Newsletter-Fehlerbehandlung ohne interne Leak-Messages pruefen.
- Designer:
  - Review fuer Manni Slots 1-4 (Hook-Lesbarkeit, Safe Area, First Frame).
- Mentor:
  - Regel fuer "harter Claim nur mit Quelle" dokumentieren.
- Refactor:
  - gemeinsames Response-Handling an einer fragilen Stelle vereinheitlichen.
- Repository:
  - Monitoring-Lauf und Abweichungen protokollieren.

## M2 - 2026-05-12 18:00 (Reach-Bridge Gate)

- Webbie:
  - Set-Start, Share, Newsletter, Booking im Frontend funktionssicher.
- Winnie:
  - Desktop-Tests gegen aktuelle UI-State-Drift rechecken.
- Guardian:
  - Route-Matrix Frontend -> Worker validieren und dokumentieren.
- Designer:
  - Mobile/Desktop QA fuer AgentSystem, Music Cards, Booking, Newsletter.
- Mentor:
  - Lernregel aus M1-M2 Abweichungen in Wiki fixieren.
- Refactor:
  - URL-Base-Logik fuer Audio/Download/Stats konsistent halten.
- Repository:
  - Worktree-Erklaerbarkeit vor M2-Abnahme sichern.

## M3 - 2026-05-15 18:00 (Week-1 Review Gate)

- Master Controller:
  - Milestone-Review `pass/warn/fail` fuer alle Rollen.
- Webbie:
  - mindestens 2 reale Nutzerpfade per Test oder Checkliste abgesichert.
- Winnie:
  - `desktop:test:logic` gruen; E2E-Risiko explizit dokumentiert.
- Guardian:
  - Strict-Gate-Status und offene Release-Risiken aktualisieren.
- Designer:
  - visuelle Recheck-Runde abgeschlossen, bekannte Overflow-Probleme adressiert.
- Mentor:
  - Week-1-Learnings inklusive Frueherkennungssignal dokumentiert.
- Refactor:
  - Stabilitaetsgewinn aus mindestens einem Fix messbar gemacht.
- Repository:
  - Monitor-Resultat mit klarer Handlungsempfehlung.

## M4 - 2026-05-19 18:00 (Stability Iteration)

- Webbie:
  - Restpunkte in Newsletter-/Booking-/Music-Flows geschlossen.
- Winnie:
  - zweiter Desktop-Stabilitaetszyklus (Race Conditions, Busy-States).
- Guardian:
  - Regression-Check fuer API/Tracking/UI-Fehlertexte.
- Designer:
  - Proof-Update fuer kritische Zustaende (Desktop + Mobile).
- Mentor:
  - wiederholte Fehler in bindende Teamregel ueberfuehren.
- Refactor:
  - nur noch offene Hochrisiko-Reibungspunkte bearbeiten.
- Repository:
  - vor M5 saubere Paketierung der Aenderungen vorbereiten.

## M5 - 2026-05-26 18:00 (Scale Readiness)

- Master Controller:
  - Entscheidungsrahmen fuer moegliche externe Freigaben vorbereiten.
- Webbie:
  - Reach-relevante UX-Verbesserungen finalisieren.
- Winnie:
  - Desktop-Release-Risiken fuer Reach-Produktion klar einstufen.
- Guardian:
  - finale Warn-/Blocker-Liste fuer Sprintabschluss.
- Designer:
  - visuelle Konsistenzreport fuer Woche 2/3 liefern.
- Mentor:
  - Muster "was hat konstant funktioniert" dokumentieren.
- Refactor:
  - technische Restschuld fuer naechsten Sprint markieren.
- Repository:
  - Branch-/Merge-Disziplin vor M6 absichern.

## M6 - 2026-06-05 18:00 (Sprint Close)

- Alle Agenten:
  - Abschlussstatus `pass/warn/fail` mit 1 naechster Empfehlung pro Rolle.
- Pflicht-Outputs:
  - Decision-Log-Sprintabschluss
  - aktueller Audit-Report
  - aktueller Repository-Monitor
  - aktueller Designer-Visual-Report
  - dokumentierte Lernschleife (Mentor)

## 5. Woechentlicher Takt (fix)

- Montag 10:00: Master Controller + Guardian + Webbie Prioritaetscheck.
- Dienstag 14:00: Manni + Designer Creative/Hook Review.
- Mittwoch 17:00: Webbie + Guardian API/Funnel Recheck.
- Donnerstag 16:00: Winnie + Refactor Stabilitaetsfenster.
- Freitag 18:00: Agenten-Wochenreview mit `pass/warn/fail`.
- Sonntag 12:00: Mentor dokumentiert Lernpunkte und naechste Schutzregel.

## 6. Pflichtbefehle zur Abnahme je Meilenstein

```powershell
npm run agent:jobs:validate -- --strict-warnings
npm run lint
npm run test -- --run
npm run build
npm run agent:audit -- --strict
npm run repository:monitor:strict
```

Optional bei Desktop-Fokus:

```powershell
npm run desktop:test:logic
npm run desktop:test:e2e
```
