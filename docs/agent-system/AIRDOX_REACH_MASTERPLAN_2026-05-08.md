# AIRDOX Reach Masterplan - Fixed Milestones

Stand: 2026-05-08  
Owner: Manni  
Controller: Master Controller  
Status: Verbindlicher Arbeitsplan fuer alle Agenten

## 1. Hauptziel

AIRDOX steigert Reichweite messbar und reproduzierbar, ohne unkontrollierte Live-Ausspielung:

- mehr Netto-Reichweite pro Woche
- mehr qualifizierte Follower auf Kurzvideo-Kanaelen
- mehr Set-Starts, Shares, Newsletter-Opt-ins und Booking-Intent auf `airdox.info`

Nicht verhandelbar:
- Kein externer Live-Post, kein Boosting, keine Paid-Ausspielung ohne persoenliches Nutzer-OK.
- Draft-Produktion ist aktiv erlaubt und ausdruecklich gewuenscht.
- Manni darf externe PR-Kampagnen vorbereiten und als Nutzer-Preview zeigen; Online-Schaltung nur nach bestaetigtem OK.

## 2. Verbindliche Sprint-Zielwerte (28 Tage)

Zeitraum: 2026-05-08 bis 2026-06-05

| KPI | Zielwert bis 2026-06-05 | Messquelle | Owner |
| --- | --- | --- | --- |
| Reel-Draft-Output | >= 48 externe-ready Drafts (12/Woche) | `manni-reel-queue.json`, `manni-reel-draft-pack.md` | Manni + Designer |
| Hook-Testdichte | >= 24 Hook-Varianten (mind. 6/Woche) | Draft Pack + Decision Log | Manni |
| Gewinner-Assets | >= 8 Assets mit ueber Median Completion + Share-Rate | Weekly Growth Digest | Manni + Guardian |
| Website-Reach-Bridge | >= 15% mehr Set-Starts vs Baseline-Woche | Stats-Events (`audio_play`, `share`) | Webbie + Guardian |
| Conversion-Unterstuetzung | >= 10% mehr Newsletter-Opt-ins vs Baseline-Woche | `sign_up` Event-Tracking | Webbie + Manni |
| Booking-Intent | >= 10% mehr Booking-Starts vs Baseline-Woche | `generate_lead` Event-Tracking | Webbie + Manni |
| Release-Gate-Stabilitaet | 100% Pflichtgates gruen pro Milestone | Lint/Test/Build/Audit/Repo-Monitor | Guardian + Repository |

## 3. Fixe Meilensteine mit festen Vorgaben

Alle Zeitangaben Europe/Berlin.

| ID | Fixtermin | Muss-Ergebnis (abnahmepflichtig) | Messkriterium | Blocker bei Nichterfuellung |
| --- | --- | --- | --- | --- |
| M0 | 2026-05-08 20:00 | Baseline-Werte fuer Reach/Follows/Set-Starts/Newsletter/Booking dokumentiert + Zielwerte eingefroren | Eintrag in `DECISION_LOG.md` + KPI-Tabelle | Kein offizieller Sprint-Start |
| M1 | 2026-05-10 18:00 | 12er Reel-Queue (Szenario B), Weekly Plan, Draft Pack Slots 1-4 externe-ready | Aktualisierte `manni-reel-*` Artefakte mit aktuellem Zeitstempel | Keine Content-Produktion fuer Woche 1 |
| M2 | 2026-05-12 18:00 | Website-Reach-Pfade funktionssicher: Set-Start, Share, Newsletter, Booking trackbar und getestet | Tests + Route-Matrix + QA-Check | Kein vertrauenswuerdiges KPI-Feedback |
| M3 | 2026-05-15 18:00 | Woche-1-Review: Gewinner/Verlierer, 3 konkrete Optimierungen, Slots 5-8 externe-ready | Growth-Digest in `DECISION_LOG.md` + Draft-Pack-Update | Keine Skalierung erlaubt |
| M4 | 2026-05-19 18:00 | Hook-Iteration: schwache Hooks innerhalb 24h ersetzt, Slots 9-12 externe-ready | Vergleich Alt/Neu im Weekly Plan | Reichweitenziel gefaehrdet |
| M5 | 2026-05-26 18:00 | Woche-2/3 Ergebnisbericht + Winner-Shortlist fuer moegliche Freigabe | Gewinnerliste mit KPIs und Asset-IDs | Kein Nutzerfreigabe-Paket |
| M6 | 2026-06-05 18:00 | 28-Tage-Sprint-Abschluss: KPI-Delta, Lessons, naechster Sprintplan | Finalbericht + Decision-Log-Eintrag | Kein neuer Sprint-Freeze |

## 4. Agenten-Scorecard (messbar pro Rolle)

## Manni (Lead Reichweite)
- Liefert woechentlich 12 Drafts mit Hook, Caption, CTA, Landing-URL, KPI-Fokus.
- Fuehrt Gewinner/Verlierer-Liste mit Top 3 und Flop 3 je Woche.
- Muss pro Woche 3 neue Experimente mit Hypothese definieren.
- Bereitet PR-Kampagnen als externe Draft-/Preview-Pakete vor und bringt sie erst nach dokumentierter Nutzerbestaetigung online.
- Messung: Vollstaendigkeit `manni-reel-*` + Decision-Log-Report.

## Designer
- Prueft jeden Draft auf First-Frame-Klarheit, Safe-Area, Thumbnail-Richtung, Hook-Lesbarkeit.
- Liefert pro Woche mind. 12 visuell gepruefte Drafts (Status klar dokumentiert).
- Messung: `creativePack`-Felder gepflegt, visuelle QA-Notizen, Proof-Artefakte.

## Webbie
- Sichert die Reach-Bridge zur Website: klare Set-CTAs, Share-Flow, Newsletter- und Booking-Pfade.
- Liefert trackbare Events fuer Set-Play/Share/Newsletter/Booking.
- Messung: E2E/Unit-Nachweise + funktionsfaehige Pfade im Frontend.

## Guardian
- Fuehrt Gate-Disziplin: `lint`, `test -- --run`, `build`, `agent:audit -- --strict`.
- Blockt KPI-unsaubere Releases (fehlendes Tracking, kaputte API-Routen, interne Error-Leaks).
- Messung: Gate-Ergebnis + dokumentierte Blocker/Warnungen.

## Refactor
- Reduziert Reibung nur dort, wo Reach-Execution direkt schneller/stabiler wird.
- Fokus: einheitliche API-/Base-URL-Logik, robustes Error-Reading.
- Messung: konkrete Stabilitaetsgewinne + Regressionstests.

## Repository
- Haltet Arbeitsstraenge trennbar: Reach-Planung, Website-Fixes, QA, Proof, Governance.
- Erzwingt erklaerbaren Worktree und releasefaehige Branch-Disziplin.
- Messung: `repository:monitor:strict` und nachvollziehbare Change-Sets.

## Winnie
- Sichert, dass Flight Deck Reach-Produktion nicht ausbremst (Import, Draft, Publish-Workflows stabil).
- Messung: `desktop:test:logic` gruen, dokumentierte Risiken fuer Desktop-Seite.

## Mentor
- Uebersetzt Fehler und erfolgreiche Muster in wiederverwendbare Regeln.
- Muss pro Milestone mindestens 1 Learning-Eintrag oder Runbook-Update liefern.
- Messung: Wiki-/Decision-Log-Updates mit Ursache -> Schutzregel.

## Master Controller
- Priorisiert Zielkonflikte, entscheidet Blocker, friert Meilenstein-Ergebnisse ein.
- Messung: Jeder Milestone hat Ergebnisstatus `pass`, `warn` oder `fail` mit Folgeentscheidung.

## 5. Operative Wochenroutine (fix)

- Montag 09:00: KPI-Review + Experiment-Freeze (Manni, Guardian, Master Controller)
- Dienstag 14:00: Creative-Review (Manni + Designer)
- Mittwoch 18:00: Funnel-/Tracking-Recheck (Webbie + Guardian)
- Donnerstag 18:00: Hook-Iteration + Queue-Update (Manni + Designer)
- Freitag 18:00: Wochenentscheidung Gewinner/Verlierer (alle Agentenbereiche)
- Sonntag 12:00: Decision-Log-Update + Planung naechste Woche (Manni + Mentor)

## 6. Pflichtbefehle pro Milestone-Recheck

```powershell
npm run manni:reels:generate -- --scenario=B --count=12
npm run lint
npm run test -- --run
npm run build
npm run agent:audit -- --strict
npm run repository:monitor:strict
```

## 7. Freigabe- und Eskalationsregeln

- `external_draft`: erlaubt ohne Nutzer-OK.
- `external_preview`: Manni darf externe PR-/Social-Kampagnen zeigen, solange nichts live publiziert oder versendet wird.
- `external_live`: strikt blockiert ohne persoenliches Nutzer-OK im Decision Log; nach OK ist Manni fuer die exakt freigegebene Online-Schaltung verantwortlich.
- Verpasster Milestone:
  - 1x verpasst: 24h Recovery-Plan Pflicht.
  - 2x verpasst: Scope-Reduktion und harte Neupriorisierung durch Master Controller.
  - 3x verpasst: Sprint einfrieren, Ursachenanalyse vor neuen Reach-Aktionen.
