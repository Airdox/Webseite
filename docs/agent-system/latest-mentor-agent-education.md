# AIRDOX Mentor Agentenbildungs-Scorecard

Erstellt: 2026-06-06T09:09:13.044Z
Owner: Mentor
Status: warn

## Ueberblick

- Gepruefte Agenten: 8
- Auf Zielniveau oder darueber: 4
- Blocker/Warnungen: 3

## Scorecard

| Agent | Level | Ziel | Schwaechste Dimension | Audit | Quellen | Naechstes Training | Offene Postmortems |
| --- | --- | --- | --- | ---: | --- | --- | ---: |
| Webbie | L2 | L3 | Risikoerkennung | 92 | pass | Consent- oder Tracking-Luecke erkennen | 1 |
| Winnie | L2 | L3 | Risikoerkennung | 83 | pass | Unsicheren IPC- oder Shell-Pfad erkennen | 1 |
| Guardian | L3 | L4 | Ausfuehrungsqualitaet | 92 | pass | Externe Live-Aktion ohne Nutzerfreigabe blockieren | 0 |
| Manni | L3 | L3 | Uebergabequalitaet | 100 | pass | Draft/Live-Trennung bei Social-Post | 0 |
| Designer | L3 | L3 | Uebergabequalitaet | 100 | pass | Statisches Reel als creative_static_risk markieren | 0 |
| Mentor | L4 | L4 | Uebergabequalitaet | 100 | pass | Research ohne Projektwirkung abfangen | 1 |
| Refactor | L2 | L3 | Quellenfrische | 92 | warn | Zu breiten Umbau stoppen | 1 |
| Repository | L3 | L3 | Ausfuehrungsqualitaet | 92 | pass | Mehrdeutige Deployment- oder Branch-Strategie erkennen | 1 |

## Naechste Aktionen

- Offene Postmortems in Gates, Tests, Runbooks oder dokumentierte Ausnahmen ueberfuehren.
- Monatliche Agentenschule mit Basis-, Fehler- und Cross-Agent-Uebungen durchfuehren.
- Scorecard nach jedem monthly_learning_review neu schreiben.
