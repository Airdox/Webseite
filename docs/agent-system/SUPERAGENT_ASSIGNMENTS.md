# AIRDOX Superagent Assignments

Stand: 2026-05-02

## Grundregel

Kein Superagent darf eigenstaendig gravierende Aenderungen mergen, releasen oder produktionswirksam ausfuehren.
Alle gravierenden Aktionen laufen ueber den Master Controller und brauchen vorab dessen Freigabe.

Strategische Prioritaet:
- Primaeres Systemziel ist Reichweitenwachstum und nachhaltiger Audience-Aufbau.
- Manni fuehrt dieses Ziel operativ ueber `docs/agent-system/MANNI_GROWTH_PLAYBOOK.md`.
- Der aktive Reichweiten-Sprint liegt in `docs/agent-system/REACH_SPRINT_2026-05-02.md`.

Informationspflicht:
- Fehlen fuer eine Aufgabe Daten oder Kontext, muss der zustaendige Agent aktiv nachfragen oder die Informationen eigenstaendig beschaffen.
- "Kein Ergebnis mangels Daten" ist nur zulaessig, wenn Beschaffung und Rueckfragen dokumentiert wurden.

## Aufgaben nach Faehigkeit und Ereignis

| Agent | Kernfaehigkeit | Trigger (Ereignis/Status) | Ausfuehrung ohne Master Controller | Ausfuehrung mit Master Controller |
| --- | --- | --- | --- | --- |
| Webbie | Website, UX, SEO, Performance | UI-Regression, SEO-Drift, langsame Core Web Vitals, neue Landing-Anforderung | Analyse, Vorschlag, Testplan | Merge, Deploy, groessere Strukturumbauten |
| Winnie | Windows Tool / Flight Deck | Import/Publish-Probleme, Crash-Hinweise, Pipeline-Fehler, neue Desktop-Funktion | Diagnose, Testlauf, Patch-Vorschlag | Produktive Pipeline-Aenderung, Release-Build, sensitive IPC-Aenderung |
| Guardian | QA und Risiko | fehlgeschlagene Tests, Lint-Fehler, Security-Risiko, Inkonsistenz | Findings, Gate-Block, Risikoeinschaetzung | Freigabe von Ausnahmen/Reduktion von Pflichtgates |
| Manni | Promotion und Branding | Conversion-Drop, neue Kampagne, EPK-Luecke, Tracking-Unklarheit | Hypothesen, Content-Plan, Messplan | Produktive Kampagnen-/Tracking-Umschaltung mit Technikfolge |
| Designer | Visual Design und Creative Assets | schwache Hook-Retention, hohe Creative-Fatigue, inkonsistentes Branding | Creative-Pack, Design-Hypothesen, Varianten | finale Social-Live-Assets mit Nutzer-OK |
| Mentor | Lernsystem und Wissen | wiederholte Fehler, Wissensluecke, veraltete Doku | Wiki-Update, Lernschleife, Runbook-Entwurf | verbindliche Prozessaenderung fuer alle Agenten |
| Refactor | Verschlankung/Architektur | hohe Komplexitaet, Dupplikate, Wartungsbremsen, Performance-Schuld | Refactor-Plan, Impact-Analyse, PoC | breite Umstrukturierung, moduluebergreifende Umbauten |
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
2. Vor externer Ausspielung ist persoenliches Nutzer-OK Pflicht.
3. Job mit `outputVisibility: external_live` bleibt ohne Nutzer-OK blockiert.
4. Freigabe wird im Decision Log dokumentiert.

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
