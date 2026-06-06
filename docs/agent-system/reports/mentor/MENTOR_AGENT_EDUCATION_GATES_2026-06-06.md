# AIRDOX Mentor Agentenbildungs-Gates

Stand: 2026-06-06
Owner: Mentor
Reviewer: Guardian, Master Controller
Status: aktiv

## Zweck

Dieses Runbook schliesst die offenen Mentor-Postmortems aus der Agentenbildungs-Scorecard. Jede Lernluecke wird in ein Gate, einen Recheck, eine dokumentierte Ausnahme oder eine Trainingspflicht ueberfuehrt.

## Verbindliche Gates

| Postmortem | Agent | Gate | Recheck |
| --- | --- | --- | --- |
| `webbie-consent-cwv-gate` | Webbie | Website-Aenderungen mit Analytics, Tracking, Consent, CSP oder Performance-Bezug muessen Risiko, Messpunkt, Proof-Erwartung und passenden npm-Check nennen. | `npm run build`; bei Tracking-/Consent-Aenderungen Guardian-Review |
| `winnie-ipc-shell-sandbox-risk` | Winnie | IPC-, Shell-, Sandbox- und Main/Preload-Aenderungen brauchen strukturierte API oder Allowlist, klares Risiko und Desktop-Gate. | `npm run desktop:test:logic`; bei Releasewirkung `npm run desktop:test:e2e` |
| `repository-dirty-state-release-risk` | Repository | Vor PR, Release oder Master-Freigabe werden eigene, fremde, generierte und releasekritische Aenderungen getrennt. Dirty-State bleibt Release-Blocker, bis er eingeordnet ist. | `git status --short`; vor Release `npm run repository:monitor:strict` |
| `refactor-source-currency-warning` | Refactor | Fachquellen mit 404, Redirect-Bruch oder unklarem Inhalt werden ersetzt oder als dokumentierte Ausnahme markiert. | `npm run mentor:currency:write` |
| `mentor-research-to-runbook` | Mentor | Research, NotebookLM-Auswertung oder Deep-Research-Brief darf nicht als reine Zusammenfassung geschlossen werden. Mindestens ein Runbook, Gate, Trainingsfall, Scorecard-Kriterium oder Decision-Log-Eintrag muss entstehen. | `npm run mentor:education:write` beim `monthly_learning_review` |

## Trainingspflicht

Beim monatlichen `monthly_learning_review` fuehrt Mentor je Kernagent mindestens eine Uebung aus dem `AGENT_TRAINING_CATALOG.md` durch:

- ein Basisfall fuer neue oder unklare Arbeitswege,
- ein Fehlerfall fuer offene Warnungen oder wiederholte Risiken,
- ein Cross-Agent-Fall, sobald mindestens zwei Agenten beteiligt sind.

Ein Training gilt nur als bestanden, wenn der Agent Owner, Risiko, Gate, Recheck und naechsten Handoff benennt.

## Dokumentierte Ausnahmen

Eine Ausnahme ist nur zulaessig, wenn alle Punkte dokumentiert sind:

- betroffener Agent,
- betroffener Arbeitsweg,
- warum das Gate nicht anwendbar ist,
- Ersatzpruefung,
- Reviewer,
- Recheck-Datum.

Ohne diese Angaben bleibt die Lernfolge offen.
