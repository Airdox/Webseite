# Mentor Agent Level-Up Plan

Stand: 2026-05-27
Owner: Mentor
Zielgruppe: Master Controller, Mentor, Guardian, alle Fachagenten

## Zweck

Dieser Plan beschreibt, wie der Mentor-Agent das Niveau der AIRDOX-Agenten systematisch anhebt. Bildung, Weiterbildung, Fortbildung und Ausbildung werden hier als operativer Qualitaetsprozess verstanden: Agenten bekommen klarere Runbooks, bessere Quellen, messbare Uebungsaufgaben, Review-Gates und eine nachweisbare Fehlerverarbeitung.

Das Ziel ist nicht, Modellgewichte zu trainieren. Das Ziel ist, das Projektwissen, die Entscheidungsqualitaet und die Ausfuehrungsdisziplin der Agenten sichtbar zu verbessern.

## Ausgangslage

Mentor hat bereits diese Grundlagen:

- `docs/agent-system/reports/operations/AGENT_CONTINUOUS_LEARNING.md`: Definition von Lernen im System.
- `docs/agent-system/reports/mentor/MENTOR_LEARNING_LOOPS.md`: Ablauf fuer Fehler, Risiko, Quellenpruefung und Folgearbeit.
- `npm run mentor:currency:write`: Report fuer Quellen- und Runbook-Aktualitaet.
- `docs/agent-system/latest-agent-currency.*`: aktueller Mentor-Statusbericht.
- `docs/agent-system/DECISION_LOG.md`: Ort fuer Entscheidungen, Ausnahmen und Lernfolgen.

Aktueller Engpass: Mentor prueft Aktualitaet, aber noch nicht tief genug die Faehigkeitsentwicklung je Agent. Es fehlen ein Kompetenzmodell, Trainingsaufgaben, Niveau-Stufen, Nutzenbewertung und ein fester Review-Zyklus.

## Zielniveau

Jeder Agent soll von "zustaendig" zu "nachweisbar kompetent" wechseln. Dafuer braucht jeder Agent:

- ein klares Kompetenzprofil,
- eine aktuelle Quellenbasis,
- mindestens ein Runbook fuer typische Aufgaben,
- messbare Qualitaetskriterien,
- Beispielaufgaben mit Akzeptanzkriterien,
- Fehler-zu-Gate-Uebersetzung,
- regelmaessige Review-Ergebnisse,
- einen aktuellen Lernstand im Mentor-Report.

## Kompetenzstufen

| Stufe | Bezeichnung | Kriterium | Mentor-Aktion |
| --- | --- | --- | --- |
| L0 | Unklar | Zustaendigkeit oder Quellen fehlen | Rolle klaeren, Routing und Runbook anlegen |
| L1 | Betriebsfaehig | Agent kennt Pfade, Outputs und Basis-Gates | Checkliste und Minimal-Training bereitstellen |
| L2 | Stabil | Agent liefert wiederholbar korrekte Artefakte | Fehlerklassen sammeln, Review-Cases ergaenzen |
| L3 | Fortgeschritten | Agent erkennt Risiken und Abhaengigkeiten selbst | Szenario-Training, Cross-Agent-Review |
| L4 | Fuehrend | Agent verbessert seinen Bereich messbar | Best Practices extrahieren, andere Agenten trainieren lassen |

## Bewertungsmodell

Mentor bewertet jeden Agenten monatlich mit 0 bis 4 Punkten je Dimension:

| Dimension | Frage | Beleg |
| --- | --- | --- |
| Quellenfrische | Sind Primaerquellen erreichbar und aktuell? | `latest-agent-currency.*` |
| Runbook-Qualitaet | Sind Aufgaben, Grenzen und Gates klar? | Agenten-Doku, Wiki, Decision Log |
| Ausfuehrungsqualitaet | Sind Outputs reproduzierbar und pruefbar? | latest-Reports, Tests, Artefakte |
| Risikoerkennung | Erkennt der Agent Freigabe-, Datenschutz-, Release- oder Scope-Risiken? | Guardian-Reports, Decision Log |
| Uebergabequalitaet | Sind naechste Agenten, Abhaengigkeiten und Nutzer-Touchpoints konkret? | Dependency-Radar, Routing-Reports |
| Fehlerlernen | Werden Wiederholfehler in Checks, Tests oder Regeln uebersetzt? | neue Gates, Tests, Runbook-Aenderungen |

Niveauformel:

```text
AgentLevel = niedrigste stabile Dimension, nicht der Durchschnitt
```

Begruendung: Ein Agent mit starker Fachlogik, aber schwacher Risikoerkennung darf nicht als fortgeschritten gelten.

## Tiefenplan

### Phase 1: Kompetenzinventar

Zeitraum: 1 bis 2 Tage

Aufgaben:

- Fuer jeden Agenten Kompetenzprofil erfassen.
- Bestehende Runbooks, Reports, Tests und Skripte zuordnen.
- Fehlende Quellen, unklare Zustaendigkeiten und tote Dokumentationspfade markieren.
- Pro Agent die aktuelle Stufe L0 bis L4 festlegen.

Output:

- Abschnitt "Agent Skill Matrix" in einem Mentor-Report oder eigener JSON-Datei.
- Offene Luecken als konkrete Aufgaben in `latest-agent-task-queue.json` oder Decision Log.

Aufwand/Nutzen:

| Aufwand | Nutzen | Prioritaet |
| --- | --- | --- |
| Mittel | Hoch, weil unklare Agentenarbeit sichtbar wird | Sofort |

### Phase 2: Ausbildungsbasis je Agent

Zeitraum: 2 bis 4 Tage

Aufgaben:

- Pro Agent eine Minimal-Ausbildung definieren: Zweck, Nicht-Aufgaben, wichtigste Pfade, Standard-Gates.
- Pro Agent 3 Trainingsaufgaben formulieren: Basisfall, Fehlerfall, Cross-Agent-Fall.
- Akzeptanzkriterien je Aufgabe festlegen.
- Gute Beispieloutputs sammeln oder neu erzeugen.

Beispiel fuer Webbie:

- Basisfall: kleine UI-Aenderung mit Build und passendem Test.
- Fehlerfall: Tracking-Event fehlt oder ist nicht consent-konform.
- Cross-Agent-Fall: Manni liefert Kampagnenziel, Webbie setzt Funnel-Messpunkt, Audience Intelligence prueft Wirkung.

Aufwand/Nutzen:

| Aufwand | Nutzen | Prioritaet |
| --- | --- | --- |
| Hoch | Sehr hoch, weil neue und bestehende Agenten schneller korrekt arbeiten | Hoch |

### Phase 3: Fortbildungs-Gates

Zeitraum: 2 bis 3 Tage

Aufgaben:

- Wiederholfehler aus `latest-audit.*`, Guardian-Reports und Decision Log clustern.
- Fuer jede Fehlerklasse entscheiden: Test, Script-Check, Runbook-Regel oder Review-Pflicht.
- Mentor darf einen Befund erst schliessen, wenn eine maschinelle Pruefung oder eine dokumentierte Ausnahme existiert.
- Guardian bekommt eine Review-Rolle fuer alle sicherheits-, datenschutz- und releasekritischen Lernfolgen.

Typische Fehlerklassen:

- Quelle veraltet oder nicht erreichbar.
- Runbook nennt keinen konkreten Validierungsbefehl.
- Agent liefert Draft ohne naechsten Owner.
- UI-Aenderung ohne visuellen Proof.
- externe Aktion ohne Nutzerfreigabe.
- Kampagnenidee ohne Ziel-Event.

Aufwand/Nutzen:

| Aufwand | Nutzen | Prioritaet |
| --- | --- | --- |
| Mittel | Sehr hoch, weil Wiederholfehler strukturell sinken | Hoch |

### Phase 4: Szenario-Training

Zeitraum: 1 Woche Initialaufbau, danach monatlich

Aufgaben:

- Mentor erstellt realistische Szenarien aus vergangenen AIRDOX-Arbeiten.
- Jeder Fachagent bekommt Szenarien mit Rollenabgrenzung, Risiken und Akzeptanzkriterien.
- Master Controller bewertet Priorisierung und Uebergabe.
- Guardian bewertet Gate-Abdeckung.
- Mentor dokumentiert Lernpunkte und leitet neue Regeln ab.

Szenario-Katalog:

| Szenario | Beteiligte Agenten | Lernziel |
| --- | --- | --- |
| Website-Funnel ohne Messdaten | Webbie, Manni, Audience Intelligence, Guardian | Nicht nach Gefuehl optimieren, zuerst Messbarkeit herstellen |
| Social-Reel mit Live-Posting-Wunsch | Manni, Designer, Guardian, Master Controller | Draft und externe Live-Aktion trennen |
| Flight-Deck-Feature mit UI-Aenderung | Winnie, Designer, Guardian | Desktop-Tests, CD-Review und Proof koppeln |
| Riskanter Refactor | Refactor, Repository, Guardian, Master Controller | Scope klein halten, Gates vor Umbau klaeren |
| Veraltete Fachquelle | Mentor, betroffener Fachagent | Primaerquelle pruefen und Projektregel aktualisieren |

Aufwand/Nutzen:

| Aufwand | Nutzen | Prioritaet |
| --- | --- | --- |
| Hoch | Hoch, weil Agenten komplexe Uebergaben besser beherrschen | Mittel |

### Phase 5: Mentor-Dashboard und Scorecard

Zeitraum: 2 bis 5 Tage

Aufgaben:

- `mentor:currency` um Skill-Dimensionen erweitern oder separaten Report `mentor:level:write` einfuehren.
- Pro Agent anzeigen: Level, letzte Pruefung, offene Luecken, gesperrte Risiken, naechste Fortbildung.
- Warnungen priorisieren: Blocker, Hoch, Mittel, Beobachten.
- Trend speichern: Niveau steigt, bleibt gleich oder faellt.

Empfohlene Report-Felder:

```json
{
  "agent": "Webbie",
  "level": "L2",
  "weakestDimension": "Risikoerkennung",
  "openTrainingItems": 2,
  "lastEvidence": "latest-refactor-website-opportunities.md",
  "nextAction": "Consent-Tracking-Szenario absolvieren"
}
```

Aufwand/Nutzen:

| Aufwand | Nutzen | Prioritaet |
| --- | --- | --- |
| Mittel | Hoch, weil Lernen steuerbar und vergleichbar wird | Hoch |

### Phase 6: Train-the-Agent Loop

Zeitraum: fortlaufend

Aufgaben:

- Agenten mit L3 oder L4 liefern Beispielartefakte fuer andere Agenten.
- Mentor extrahiert daraus Regeln, Templates und Review-Checklisten.
- Cross-Agent-Learning wird verpflichtend, wenn eine Aufgabe mindestens zwei Agenten betrifft.
- Master Controller kann Aufgaben blockieren, wenn der benoetigte Agent unter Zielniveau liegt und das Risiko hoch ist.

Aufwand/Nutzen:

| Aufwand | Nutzen | Prioritaet |
| --- | --- | --- |
| Niedrig bis mittel | Mittel bis hoch, weil gute Arbeitsmuster wiederverwendet werden | Mittel |

## Aufwand/Nutzen-Gesamtpriorisierung

| Massnahme | Einmaliger Aufwand | Laufender Aufwand | Nutzen | Reihenfolge |
| --- | --- | --- | --- | --- |
| Kompetenzinventar | Mittel | Niedrig | Hoch | 1 |
| Ausbildungsbasis je Agent | Hoch | Mittel | Sehr hoch | 2 |
| Fortbildungs-Gates | Mittel | Mittel | Sehr hoch | 3 |
| Mentor-Scorecard | Mittel | Niedrig | Hoch | 4 |
| Szenario-Training | Hoch | Mittel | Hoch | 5 |
| Train-the-Agent Loop | Mittel | Niedrig | Mittel bis hoch | 6 |

## Konkrete Agenten-Zielbilder

| Agent | Zielniveau | Wichtigster Hebel | Nutzen |
| --- | --- | --- | --- |
| Webbie | L3 | Messbare Funnel- und UI-Aenderungen mit Proof | weniger Blindoptimierung, bessere Conversion-Arbeit |
| Winnie | L3 | Desktop-Feature-Training mit E2E-/Logic-Gates | stabileres Flight Deck |
| Guardian | L4 | Risiko-Taxonomie und Gate-Eskalation | weniger Release- und Datenschutzrisiko |
| Manni | L3 | Kampagnenziele mit Ziel-Event, Draft/Live-Trennung | bessere Promo-Arbeit ohne Freigabefehler |
| Designer | L3 | Visual-Proof, CD-Kriterien, Safe-Area-Checks | konsistentere Assets |
| Audience Intelligence | L3 | consent-basierte Auswertung und ROI-Grenzen | bessere Priorisierung |
| Refactor | L3 | kleine, belegte Verbesserungen statt breiter Umbauten | weniger technische Schulden bei geringerem Risiko |
| Repository | L3 | Branch-, PR- und Dirty-State-Training | sauberere Releases |
| Mentor | L4 | Scorecard, Trainingskatalog, Fehler-zu-Gate-Prozess | dauerhaft hoeheres Agentenniveau |

## Mentor-Entscheidungsregeln

- Ein Agent darf nicht hoeher als L1 stehen, wenn sein Runbook keinen Validierungsbefehl nennt.
- Ein Agent darf nicht hoeher als L2 stehen, wenn er wiederholt Freigabe- oder Datenschutzgrenzen verletzt.
- Ein Agent darf nicht hoeher als L2 stehen, wenn er keine konkreten Uebergaben an andere Agenten formuliert.
- Ein Agent erreicht L3 erst, wenn mindestens ein Fehlerfall korrekt verarbeitet wurde.
- L4 braucht nachweisbaren Nutzen fuer andere Agenten: Template, Gate, Checkliste oder Beispielartefakt.

## Messbare Erfolgskennzahlen

| Kennzahl | Zielwert | Warum relevant |
| --- | --- | --- |
| Anteil Agenten mit aktuellem Runbook | 100 Prozent | Basis fuer Ausbildung |
| offene Quellenwarnungen | sinkender Trend | weniger veraltete Annahmen |
| wiederholte Fehlerklassen | sinkender Trend | echte Lernwirkung |
| Reports mit konkretem naechstem Owner | 100 Prozent | bessere Orchestrierung |
| Lernbefunde mit Gate/Test/Regel | mindestens 80 Prozent | weniger reine Dokumentation |
| Agenten auf Zielniveau L3+ | mindestens 70 Prozent | messbares Niveauwachstum |

## 30-60-90-Tage-Plan

### Erste 30 Tage

- Kompetenzinventar fertigstellen.
- Pro Agent Minimal-Ausbildung und 3 Trainingsaufgaben dokumentieren.
- Mentor-Scorecard als manuelle Tabelle oder JSON-Prototyp fuehren.
- Top 5 Wiederholfehler in Gate-, Test- oder Runbook-Arbeit uebersetzen.

### Tage 31 bis 60

- Scorecard automatisieren oder in `mentor:currency` integrieren.
- Szenario-Training fuer Webbie, Manni, Guardian, Winnie und Designer durchfuehren.
- Cross-Agent-Uebergaben im Dependency-Radar schaerfen.
- Zielniveau je Agent mit Master Controller bestaetigen.

### Tage 61 bis 90

- L3-Ziel fuer die Kernagenten pruefen.
- L4-Pfad fuer Mentor und Guardian aktivieren.
- Trainingskatalog versionieren.
- Fehlende Gates priorisiert umsetzen.
- Review mit Nutzenbilanz: weniger Fehler, bessere Reports, kuerzere Durchlaufzeit.

## Risiken

| Risiko | Gegenmassnahme |
| --- | --- |
| Bildung bleibt nur Dokumentation | Jede Lernluecke braucht Aufgabe, Gate oder Ausnahme |
| Score wird subjektiv | Nur belegte Artefakte zaehlen |
| Aufwand wird zu gross | Erst Kernagenten und Top-Fehlerklassen bearbeiten |
| Quellenchecks liefern technische Warnungen | Warnungen trennen in "Quelle fachlich veraltet" und "Check technisch fehlgeschlagen" |
| Agenten optimieren isoliert | Cross-Agent-Szenarien und Dependency-Radar verpflichtend machen |

## Naechste Umsetzungsschritte

1. Mentor-Scorecard-Dateiformat festlegen.
2. Kompetenzinventar fuer alle Agenten aus `AGENT_RESPONSIBILITY_MATRIX.md`, `job-catalog.json` und latest-Reports ableiten.
3. Trainingsaufgaben fuer Webbie, Guardian, Manni, Designer und Winnie priorisiert schreiben.
4. `mentor:currency` entweder erweitern oder neuen Job `mentor-agent-level-review` im Job-Katalog anlegen.
5. Erste Monatsreview im `DECISION_LOG.md` festhalten.

## NotebookLM-Wissensaufbau

Die tiefe Recherche fuer echte Wissensverbesserung der Agenten liegt in:

- `docs/agent-system/reports/research/MENTOR_NOTEBOOKLM_DEEP_RESEARCH_AGENT_SCHOOLS_2026-05-27.md`
- `docs/agent-system/mentor-knowledge-improvement-tasks.json`

Mentor soll NotebookLM-Ergebnisse nicht als lose Zusammenfassung behandeln. Jede relevante Erkenntnis muss in mindestens eine dieser Formen ueberfuehrt werden:

- Agenten-Runbook,
- Gate oder Test,
- Trainingsszenario,
- Decision-Log-Regel,
- Wissensbasis-/Wiki-Eintrag,
- Scorecard-Kriterium.
