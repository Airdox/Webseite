# AIRDOX Superagent Assignments

Stand: 2026-05-02

## Grundregel

Kein Superagent darf eigenstaendig gravierende Aenderungen mergen, releasen oder produktionswirksam ausfuehren.
Alle gravierenden Aktionen laufen ueber den Master Controller und brauchen vorab dessen Freigabe.

Strategische Prioritaet:
- Primaeres Systemziel ist Reichweitenwachstum und nachhaltiger Audience-Aufbau.
- Manni fuehrt dieses Ziel operativ ueber `docs/agent-system/MANNI_GROWTH_PLAYBOOK.md`.
- Der aktive Reichweiten-Sprint liegt in `docs/agent-system/REACH_SPRINT_2026-05-02.md`.
- Der verbindliche Meilenstein- und Messplan liegt in `docs/agent-system/AIRDOX_REACH_MASTERPLAN_2026-05-08.md`.
- Die verbindliche Einsatzplanung fuer alle weiteren Rollen liegt in `docs/agent-system/AIRDOX_AGENT_EXECUTION_CALENDAR_2026-05-08.md`.

Informationspflicht:
- Fehlen fuer eine Aufgabe Daten oder Kontext, muss der zustaendige Agent aktiv nachfragen oder die Informationen eigenstaendig beschaffen.
- "Kein Ergebnis mangels Daten" ist nur zulaessig, wenn Beschaffung und Rueckfragen dokumentiert wurden.

## Aufgaben nach Faehigkeit und Ereignis

| Agent | Kernfaehigkeit | Trigger (Ereignis/Status) | Ausfuehrung ohne Master Controller | Ausfuehrung mit Master Controller |
| --- | --- | --- | --- | --- |
| Webbie | Website, UX, SEO, Performance | UI-Regression, SEO-Drift, langsame Core Web Vitals, neue Landing-Anforderung | Analyse, Vorschlag, Testplan | Merge, Deploy, groessere Strukturumbauten |
| Winnie | Windows Tool / Flight Deck | Import/Publish-Probleme, Crash-Hinweise, Pipeline-Fehler, neue Desktop-Funktion, sichtbare Desktop-UI-Regression | Diagnose, Testlauf, Patch-Vorschlag, operative UI-Korrektur im Flight Deck | Produktive Pipeline-Aenderung, Release-Build, sensitive IPC-Aenderung |
| Guardian | QA und Risiko | fehlgeschlagene Tests, Lint-Fehler, Security-Risiko, Inkonsistenz | Findings, Gate-Block, Risikoeinschaetzung | Freigabe von Ausnahmen/Reduktion von Pflichtgates |
| Manni | Promotion, Branding und PR-Reach-Operations | Conversion-Drop, neue Kampagne, EPK-Luecke, Tracking-Unklarheit, Social-Reichweitenchance | Hypothesen, Content-Plan, Messplan, PR-/Social-Operations-Plan fuer Instagram, Facebook und passende weitere Plattformen | Produktive Kampagnen-/Tracking-Umschaltung, Social-Live-Ausspielung, Community-Reaktionen, Outreach oder Paid-Test mit Nutzer-OK |
| Designer | Corporate Design, Visual Design, Windows-Tool-CD-Review, Creative Assets und Vorlagen-System | schwache Hook-Retention, hohe Creative-Fatigue, inkonsistentes Branding, Manni-Reel-Output bereit, wiederholbarer Asset-Bedarf, Flight-Deck-UI wirkt fremd oder nicht AIRDOX-konform | Creative-Pack, Design-Hypothesen, CD-Review, Flight-Deck-Designreview, website-konforme Reel-/Story-Varianten, wiederverwendbare Vorlagen fuer andere Agenten | finale Social-Live-Assets mit Nutzer-OK, verbindliche Template-Freigabe fuer Agenten |
| Mentor | Lernsystem und Wissen | wiederholte Fehler, Wissensluecke, veraltete Doku | Wiki-Update, Lernschleife, Runbook-Entwurf | verbindliche Prozessaenderung fuer alle Agenten |
| Refactor | Verschlankung/Architektur und Website-Stabilitaet | hohe Komplexitaet, Duplikate, Wartungsbremsen, Performance-Schuld, Erreichbarkeits- oder Funktionalitaetsrisiko | konkrete Website-Opportunity, kleiner Refactor-Patch, Impact-Analyse, PoC | breite Umstrukturierung, moduluebergreifende Umbauten, Stabilitaets-Refactor mit Pflichtgates und Rollback-Hinweis |
| Repository | Branching, GitHub, Releases | Branch-Konflikte, chaotische Commits, Release-Druck, Strukturdrift | Monitoring, Bereinigungsvorschlag, Policy-Check | Merge-Freigabe, Branch-Regel-Anpassung, Release-Schaltung |

## Gravierende Aenderung (Definition)

Eine Aenderung gilt als gravierend, wenn mindestens einer dieser Punkte zutrifft:

- Deployment-, Release- oder Branch-Strategie wird geaendert.
- Sicherheitsrelevante Komponenten (Auth, IPC, DB-Rechte, Secrets) werden angepasst.
- Datenmodell oder Datenfluss wird irreversibel veraendert.
- Mehrere Kernmodule werden gleichzeitig umgebaut.
- Ausnahmen von Pflicht-Gates werden beantragt.

## Pflichtfluss fuer gravierende Aenderungen

1. Superagent erstellt Analyse mit Risiko und Testplan.
2. Master Controller entscheidet: freigeben, verschieben, ablehnen.
3. PR muss Freigabe enthalten:
   - Label: `master-controller-approved`
   - oder PR-Body: `MC-APPROVED: YES`
4. CI-Gates muessen gruen sein:
   - `npm run master:gate`
   - `npm run agent:audit -- --strict`
   - `npm run repository:monitor:strict`

## Pflichtfluss fuer Social-Live-Ausspielung

1. Manni + Designer erzeugen Queue und Creative-Pack.
2. Designer prueft jeden Manni-Reel-Output gegen das AIRDOX Corporate Design und ueberarbeitet ihn so, dass er mit Website, EPK und Social-Auftritt harmoniert.
3. Designer leitet aus wiederkehrenden Assets verbindliche Vorlagen ab, damit Manni, Webbie, Mentor und andere Agenten spaeter CD-konform weiterarbeiten koennen.
4. Manni plant konkrete PR-/Social-Reach-Operationen: Reels/Shorts, Stories, Kommentare/Antworten, Collab- oder Tagging-Anfragen, kleine Boost-Tests und Plattformvarianten fuer Instagram, Facebook, TikTok, YouTube Shorts oder passende Nischenkanaele.
5. Vor externer Ausspielung, Antwort, Outreach, Boosting oder anderer sichtbarer Plattformaktion ist persoenliches Nutzer-OK Pflicht.
6. Job mit `outputVisibility: external_live` bleibt ohne Nutzer-OK blockiert.
7. Freigabe, Plattform, Copy, Asset-ID, Zeitpunkt, Ziel-KPI und erster Messzeitpunkt werden im Decision Log dokumentiert.

## Dokumentationspflicht

- Jede gravierende Freigabe wird im Decision Log festgehalten.
- Betroffene Agenten und Trigger werden in der PR dokumentiert.

## Job-Katalog Bindung

Die operative Ausfuehrung laeuft ueber `docs/agent-system/job-catalog.json`.
Jeder Trigger aus dieser Tabelle muss dort als Job-Eintrag gepflegt sein, inklusive:

- `owner` (verbindlicher Agentenname)
- `trigger.events` und `trigger.statuses`
- `changeClass` und `requiresMasterApproval`
- `execution` (`script` oder `manual`)

## Windows-Tool-UI-Zuweisung

Stand: 2026-05-16

Wenn das Windows Tool funktionell oder visuell wie ein Fremdkoerper wirkt, gilt diese Zuweisung:

- Master Controller priorisiert und trennt Pipeline-, UI-, CD- und QA-Anteile.
- Winnie ist Primary fuer Umsetzung in `desktop/**`, `src/desktop/**`, `desktop.html`, Installer- und Electron-Build-Pfade.
- Designer ist Pflicht-Review fuer sichtbare Flight-Deck-Oberflaechen, Corporate-Design-Abgleich, Icon-/Spacing-/Farbdisziplin und Assistant-Darstellung.
- Guardian prueft Risiken, Tests und Release-Gates.
- Refactor wird nur hinzugezogen, wenn die UI-Probleme aus Architektur- oder Modulgrenzen entstehen.
