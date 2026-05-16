# Agent Automation Roadmap

Stand: 2026-05-16

## Ziel

Das Agentensystem soll Änderungen nicht nur dokumentieren, sondern automatisch routen, prüfen und nachvollziehbar machen. Jede Änderung soll erkennen lassen:

- welcher Agent fachlich zuständig ist,
- welche Gates laufen müssen,
- welche Risiken vor Release offen sind,
- welche Entscheidung später zur Fehleranalyse herangezogen werden kann.

## Umgesetzte Stufe

1. Path-basiertes Routing über `docs/agent-system/agent-routing-rules.json`.
2. Routing-Report über `npm run agent:route` und `npm run agent:route:write`.
3. Guardian-Risikozusammenfassung über `npm run guardian:risk` und `npm run guardian:risk:write`.
4. Job-Catalog-Erweiterung für Routing- und Risk-Jobs.
5. CI-Anbindung in `web-quality.yml` und Hintergrund-Artefakte in `agent-background-monitor.yml`.
6. Versionierte Lern- und Refactor-Runbooks für nachvollziehbare Folgeanalysen.
7. Mentor-Currency-Check fuer regelmaessige Quellen- und Runbook-Aktualitaet.

## Zielbild

- Webbie verantwortet Website-Funktion, UX, SEO und Conversion.
- Winnie verantwortet Desktop/Windows/Flightdeck.
- Guardian verantwortet Qualität, Sicherheit, Regressionen und Release-Risiko.
- Manni verantwortet Promotion, Booking-Funnel, Social und Reichweite.
- Designer verantwortet visuelle Qualität, Lesbarkeit und Proof-Screenshots.
- Mentor verantwortet Lernschleifen, Runbooks und Decision-Log-Qualität.
- Refactor verantwortet Architektur, Entkopplung und Komplexitätsabbau.
- Repository verantwortet Branches, Worktree-Hygiene und Merge-Fähigkeit.
- Master Controller entscheidet bei gravierenden oder riskanten Änderungen.

## Fehleranalyse-Regel

Wenn später ein Fehler auftritt, werden in dieser Reihenfolge geprüft:

1. `docs/agent-system/latest-agent-routing.md`: War der richtige Agent beteiligt?
2. `docs/agent-system/latest-guardian-risk-summary.md`: Wurde ein Risiko erkannt oder übergangen?
3. `docs/agent-system/latest-audit.md`: War ein Agent bereits auffällig?
4. `docs/agent-system/latest-job-run.md`: Welche automatischen Jobs liefen wirklich?
5. `docs/agent-system/DECISION_LOG.md`: Welche Entscheidung oder Ausnahme wurde bewusst getroffen?

## Nächste Ausbaustufen

- Routing als PR-Kommentar veröffentlichen.
- Guardian-Risk-Summary mit konkreten Testempfehlungen pro Agent anreichern.
- Designer-Visual-Check um Booking- und Mobile-Konversionspfade erweitern.
- Master-Controller-Gate stärker an `changeClass` und `requiresMasterApproval` koppeln.
- Wiederkehrende Hintergrundläufe als Trendkurve speichern, nicht nur als Latest-Report.
- Agent-Currency-Warnungen automatisch in konkrete Verbesserungs-Issues oder Work Orders ueberfuehren.
