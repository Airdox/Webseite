# Mentor Learning Loops

Stand: 2026-05-16

## Zweck

Mentor sorgt dafür, dass wiederkehrende Fehler nicht nur repariert, sondern in Arbeitsregeln übersetzt werden. Dieses Dokument ist versioniert, damit spätere Fehleranalysen nicht von lokalen Wiki-Dateien abhängen.

## Lernschleife

1. Fehler oder Qualitätsbefund erfassen.
2. Zuständigen Agenten und betroffene Dateien über `npm run agent:route -- --json` bestimmen.
3. Risiko mit `npm run guardian:risk -- --json` bewerten.
4. Quellen- und Runbook-Aktualitaet mit `npm run mentor:currency -- --json` pruefen.
5. Entscheidung, Ausnahme oder Folgearbeit in `docs/agent-system/DECISION_LOG.md` dokumentieren.
6. Falls der Befund wiederholbar ist, einen Job, Test oder Gate ergänzen.

## Mentor-Kriterien

- Ein Fehler gilt erst als verarbeitet, wenn es einen reproduzierbaren Check oder eine dokumentierte Ausnahme gibt.
- Manuelle Entscheidungen müssen Datum, Auslöser, Agent, Risiko und erwartete Folgeprüfung nennen.
- Lokale Wiki-Einträge sind hilfreich, aber versionierte Runbooks haben Vorrang für CI und Review.
- Agenten-Niveau wird nach dem tiefen Level-Up-Plan bewertet: `docs/agent-system/reports/mentor/MENTOR_AGENT_LEVEL_UP_PLAN_2026-05-27.md`.

## Typische Auslöser

- Wiederholter Test-Timeout.
- Unklare Zuständigkeit zwischen Agenten.
- Visuelle Regression ohne Screenshot-Beleg.
- Social-/PR-Aktion ohne explizite Freigabe.
- Änderung an kritischen Pfaden ohne Guardian-Zusammenfassung.
- Fachagent ohne aktuelle Quellen- oder Runbook-Pruefung.

## Automatisierter Fortbildungscheck

`npm run mentor:currency:write` erzeugt:

- `docs/agent-system/latest-agent-currency.json`
- `docs/agent-system/latest-agent-currency.md`

Der Check prueft pro Agent primaere Quellen und Runbook-Frische. Er trainiert keine Modelle, sorgt aber dafuer, dass die Arbeitsregeln, Checks und Quellenbasis regelmaessig sichtbar altern oder bestaetigt werden.
