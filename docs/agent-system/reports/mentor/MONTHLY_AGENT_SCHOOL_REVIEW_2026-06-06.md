# AIRDOX Monatliche Agentenschule

Datum: 2026-06-06
Owner: Mentor
Status: durchgefuehrt

## Ergebnis

Mentor hat die erste operative Agentenschule nach der neuen Bildungs-Scorecard durchgefuehrt. Die offenen Postmortems wurden in Gates, Rechecks und Trainingspflichten ueberfuehrt.

## Durchgefuehrte Uebungen

| Agent | Uebung | Typ | Ergebnis | Folge |
| --- | --- | --- | --- | --- |
| Webbie | Consent- oder Tracking-Luecke erkennen | fehlerfall | bestanden als dokumentiertes Gate | Webbie-Gate in `MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md` |
| Winnie | Unsicheren IPC- oder Shell-Pfad erkennen | fehlerfall | bestanden als dokumentiertes Gate | Winnie-Gate in `MENTOR_AGENT_EDUCATION_GATES_2026-06-06.md` |
| Guardian | Externe Live-Aktion ohne Nutzerfreigabe blockieren | fehlerfall | bestanden | bleibt Reviewer fuer Live-, Security- und Datenschutzrisiken |
| Manni | Draft/Live-Trennung bei Social-Post | fehlerfall | bestanden | persoenliches Nutzer-OK bleibt Pflicht fuer externe Live-Aktionen |
| Designer | Statisches Reel als creative_static_risk markieren | fehlerfall | bestanden | Motion-/Safe-Area-Pflicht bleibt im Trainingskatalog |
| Mentor | Research ohne Projektwirkung abfangen | fehlerfall | bestanden | Research-to-Runbook-Gate aktiv |
| Refactor | Quellenfrische beheben | fehlerfall | bestanden | Node.js-Diagnostics-Quelle ersetzt |
| Repository | Dirty-State-Review vor Release | basis | bestanden als dokumentiertes Gate | Dirty-State bleibt Release-Blocker bis Einordnung |

## Cross-Agent-Simulation

Szenario: Flight-Deck-UI-Aenderung mit Releasewirkung.

Rollen:

- Winnie liefert Funktion, Main/Preload-Abgrenzung und `desktop:test:logic`.
- Designer prueft AIRDOX-CD, Safe-Area, visuelle Konsistenz und Proof.
- Guardian bewertet IPC-, Shell-, Sandbox- und Release-Risiko.
- Repository prueft Dirty-State und Branch-/PR-Hygiene.
- Master Controller entscheidet bei gravierender Releasewirkung.

Ergebnis: bestanden als Prozesssimulation. Reale Umsetzung bleibt an konkrete Aufgabe, Gates und Nutzer-/Master-Freigabe gebunden.

## Naechster Review

Trigger: `monthly_learning_review`

Pflichtbefehle:

- `npm run mentor:currency:write`
- `npm run mentor:education:write`
- `npm run agent:jobs:validate`
