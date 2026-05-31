# Agent Continuous Learning

Stand: 2026-05-16

## Ziel

Die AIRDOX-Agenten sollen nicht behaupten, "von selbst schlauer" zu werden. Sie sollen aber regelmaessig nachweisbar pruefen, ob ihre Runbooks, Gates und Quellen noch aktuell genug sind. Lernen bedeutet hier:

- aktuelle Primaerquellen kennen,
- veraltete Annahmen sichtbar machen,
- neue Schutzchecks aus Fehlern ableiten,
- Verbesserungen als konkrete Jobs, Tests oder Runbook-Aenderungen speichern.

## Mentor-Rolle

Mentor ist der Fortbildungs-Agent. Mentor prueft nicht nur, ob Dokumentation existiert, sondern ob jeder Fachagent einen aktuellen Lernpfad hat.

Mentor verantwortet:

- Quellenradar pro Agent,
- Aktualitaetsbericht,
- Lernluecken,
- Folgeaufgaben fuer Agenten,
- Ueberfuehrung echter Fehler in neue Gates.

Der tiefere Niveau-Anhebungsplan fuer Bildung, Weiterbildung, Fortbildung und Ausbildung der Agenten liegt in:

- `docs/agent-system/MENTOR_AGENT_LEVEL_UP_PLAN_2026-05-27.md`

## Regelmaessige Checks

| Intervall | Job | Zweck |
| --- | --- | --- |
| alle 6 Stunden | `agents:background:deep` | Audit, Repository, Routing, Risk und ausgewaehlte Jobs |
| woechentlich/manuell | `mentor:currency:write` | Fachquellen und Lernluecken je Agent pruefen |
| bei Vorfaellen | `learning-gap-update` | Fehlerursache in Runbook, Check oder Job ueberfuehren |

## Fachquellen-Prinzip

Primaerquellen haben Vorrang:

- Webbie: React, Vite, Web.dev, MDN.
- Designer: WCAG/W3C, Web.dev UX/Performance.
- Winnie: Electron, Playwright, Microsoft/Windows-Dokumentation.
- Guardian: OWASP, GitHub Actions, Cloudflare Workers, Node Security.
- Manni: Plattform-eigene Creator-/Ads-/Social-Dokumentation.
- Repository: Git, GitHub Docs.
- Refactor: Projektmetriken, Build-/Testdaten, Architektur-Runbooks.

## Definition von "aktuell"

Ein Agent gilt als aktuell genug, wenn:

- seine Quellen erreichbar sind,
- sein Runbook oder Audit innerhalb der letzten 45 Tage aktualisiert wurde,
- es einen passenden Gate/Job fuer wiederkehrende Fehler gibt,
- neue Nutzerbefunde in `DECISION_LOG.md` oder einem Runbook landen.

## Definition von "Niveau"

Ein Agent gilt nicht schon deshalb als stark, weil er fuer einen Bereich zustaendig ist. Mentor bewertet Niveau ueber Quellenfrische, Runbook-Qualitaet, Ausfuehrungsqualitaet, Risikoerkennung, Uebergabequalitaet und Fehlerlernen. Die niedrigste stabile Dimension bestimmt das Agenten-Level.

## Grenzen

Das System trainiert keine Modellgewichte. Es aktualisiert Projektwissen, Checks, Runbooks und Aufgabenverteilung. Bei externen Quellen muss Mentor immer zwischen Quelle, Interpretation und konkreter Projektregel unterscheiden.
