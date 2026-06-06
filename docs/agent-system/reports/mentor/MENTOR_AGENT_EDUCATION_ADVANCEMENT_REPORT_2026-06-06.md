# Mentor-Bericht: Agentenbildung und Fortbildungshebel

Stand: 2026-06-06
Owner: Mentor
Status: interne Planung

## Kurzfazit

Die AIRDOX-Agenten lassen sich deutlich weiter nach vorne bringen, aber nicht durch ungeprueftes Selbsttraining oder pauschales "mehr Wissen". Der beste Hebel ist ein kontrolliertes Bildungssystem aus Rollenwissen, Quellenfrische, Trainingsszenarien, Fehlerlernen, Scorecards und verbindlichen Gates.

Der aktuelle Stand ist gut: Das Agenten-Audit liegt bei 94/100, Mentor selbst bei 100/100, und der Aktualitaetsbericht zeigt nur eine Quellenwarnung bei Refactor. Die groesste offene Entwicklungsstufe ist deshalb nicht Grundlagenaufbau, sondern der Wechsel von "Agenten haben Doku" zu "Agenten koennen Kompetenz nachweisen".

## Ausgangslage

Vorhandene Grundlagen:

- Agentenrollen und Grenzen sind in `SUPERAGENT_ASSIGNMENTS.md` beschrieben.
- Mentor ist fuer Lernsystem, Wissen, Lernschleifen, Prozessverbesserung und Agenten-Weiterentwicklung zustaendig.
- `MENTOR_AGENT_LEVEL_UP_PLAN_2026-05-27.md` beschreibt bereits Kompetenzstufen L0 bis L4.
- `mentor-knowledge-improvement-tasks.json` enthaelt konkrete Aufgaben fuer Taxonomie, Quellenkarte, Curriculum, Memory-Regeln, RAG-Blueprint, Evaluationsrubrik, Postmortem-Bank und Scorecard.
- `latest-agent-currency.md` prueft Quellen- und Runbook-Aktualitaet.
- `latest-audit.md` bewertet die Agenten technisch und organisatorisch.

Engpass:

- Es gibt noch keine regelmaessige, belegbasierte Kompetenzmatrix je Agent.
- Trainingsaufgaben sind konzeptionell beschrieben, aber noch nicht als wiederholbarer Katalog mit Akzeptanzkriterien versioniert.
- Fehlerlernen ist vorhanden, aber noch nicht streng genug an neue Tests, Gates, Runbooks oder Decision-Log-Regeln gekoppelt.
- Agenten-Scores zeigen Systemreife, messen aber noch nicht tief genug die Faehigkeitsentwicklung je Arbeitsweg.

## Was "Bildung" fuer AIRDOX-Agenten praktisch bedeutet

Bildung bedeutet hier nicht, Modellgewichte zu veraendern. Bildung bedeutet:

- bessere Quellen vor der Arbeit,
- klarere Rollen- und Nicht-Aufgaben,
- konkrete Standardablaeufe,
- realistische Uebungsszenarien,
- messbare Qualitaetskriterien,
- Rueckfuehrung echter Fehler in Regeln und Gates,
- bessere Uebergaben zwischen Agenten,
- weniger riskante oder unklare Aktionen.

Damit verbessert sich die tatsaechliche Agentenleistung, weil jeder Agent mit besserem Kontext, besseren Belegen und schärferen Entscheidungsgrenzen arbeitet.

## Zielniveau je Agent

| Agent | Aktueller Eindruck | Zielniveau | Wichtigster Bildungshebel |
| --- | --- | --- | --- |
| Webbie | stark, aber mit Consent-/CSP-/CWV-Warnungen | L3 | Funnel-, Performance- und Consent-Training mit Proof |
| Winnie | solide, aber mehrere Desktop-Sicherheitswarnungen | L3 | Electron-, IPC-, Sandbox- und Release-Gate-Training |
| Guardian | stark | L4 | Risiko-Taxonomie, Security-Testkatalog, Eskalationslogik |
| Manni | sehr stark | L3 | Kampagnenziele immer an Ziel-Events und Freigabegrenzen koppeln |
| Designer | sehr stark | L3 | Visual-Proof, Safe-Area, CD-Templates und Creative-Fatigue-Auswertung |
| Mentor | sehr stark | L4 | Scorecard, Curriculum, Postmortem-Bank und Knowledge-Governance fuehren |
| Refactor | gut, mit Quellenwarnung und grosser Desktop-Komponente als Thema | L3 | kleine belegte Refactors, Komplexitaetsmetriken, Rueckfallpfade |
| Repository | gut, aber Dirty-State-/Release-Hygiene bleibt Risiko | L3 | Branch-, PR-, Release- und Arbeitsbaum-Training |

## Groesste Fortschrittshebel

### 1. Kompetenzmatrix statt nur Audit-Score

Mentor sollte jeden Agenten monatlich in sechs Dimensionen bewerten:

- Quellenfrische,
- Runbook-Qualitaet,
- Ausfuehrungsqualitaet,
- Risikoerkennung,
- Uebergabequalitaet,
- Fehlerlernen.

Wichtig: Das Agentenlevel ist die niedrigste stabile Dimension, nicht der Durchschnitt. Ein Agent mit guter Fachleistung, aber schwacher Risikoerkennung bleibt begrenzt.

Nutzen: Hoch. Aufwand: Mittel. Prioritaet: Sofort.

### 2. Trainingskatalog je Agent

Jeder Agent braucht drei Pflichtuebungen:

- Basisfall: normale Standardaufgabe korrekt ausfuehren.
- Fehlerfall: typischen Fehler erkennen und mit Gate/Test/Runbook beantworten.
- Cross-Agent-Fall: Uebergabe, Risiko und naechsten Owner sauber benennen.

Beispiele:

- Webbie: Website-Funnel ohne Messdaten zuerst messbar machen.
- Winnie: Flight-Deck-UI-Aenderung mit Logic-Test, E2E-Test und Designer-Proof.
- Manni: Social-Reel als Draft vorbereiten, aber Live-Posting korrekt blockieren.
- Guardian: Release-Ausnahme bewerten und Pflichtgates begruenden.
- Refactor: grosse Komponente in kleinen, rueckfallfaehigen Schritten schneiden.

Nutzen: Sehr hoch. Aufwand: Hoch. Prioritaet: Hoch.

### 3. Fehler-zu-Gate-Schleife

Jeder wiederholte Fehler muss in mindestens eine konkrete Folgearbeit ueberfuehrt werden:

- Test,
- Script-Check,
- Runbook-Regel,
- Decision-Log-Regel,
- Trainingsszenario,
- dokumentierte Ausnahme mit Owner.

Mentor sollte einen Lernbefund erst schliessen, wenn diese Folgearbeit existiert.

Nutzen: Sehr hoch. Aufwand: Mittel. Prioritaet: Hoch.

### 4. Quellenkarte und Ablaufdatum je Agent

Der aktuelle Currency-Check ist gut, aber noch zu technisch. Mentor sollte je Agent mindestens fuenf Quellen mit Zweck, Aktualitaetsdatum, Risiko und Nutzungsregel fuehren. Quellenwarnungen muessen getrennt werden in:

- technische Nichterreichbarkeit,
- fachlich veraltete Quelle,
- Quelle passt nicht mehr zur AIRDOX-Praxis.

Nutzen: Hoch. Aufwand: Mittel. Prioritaet: Hoch.

### 5. RAG-/Wiki-/NotebookLM-Blueprint

AIRDOX sollte Wissen zuerst pragmatisch versioniert halten: Markdown, JSON, Wiki, latest-Reports und NotebookLM-Recherche. Erst wenn die Menge zu gross wird, lohnt ein lokaler Hybrid-RAG.

Empfohlene Reihenfolge:

1. Markdown/JSON-Scorecard und Trainingskatalog stabilisieren.
2. Wiki- und Decision-Log-Regeln als Source of Truth schaerfen.
3. NotebookLM-Ergebnisse nur akzeptieren, wenn sie in Runbook, Gate, Aufgabe oder Scorecard landen.
4. Danach RAG-Blueprint fuer Retrieval, Provenienz und Update-Zyklus entscheiden.

Nutzen: Mittel bis hoch. Aufwand: Mittel bis hoch. Prioritaet: Mittel.

## Konkreter 30-60-90-Tage-Plan

### Erste 30 Tage

- Mentor-Kompetenzmatrix fuer alle Kernagenten erstellen.
- Pro Agent drei Trainingsaufgaben mit Akzeptanzkriterien dokumentieren.
- Top-5-Wiederholfehler aus Audit, Guardian-Reports und Decision Log in Folgearbeiten uebersetzen.
- Refactor-Quellenwarnung beheben oder Ersatzquelle dokumentieren.
- Dirty-State-/Release-Hygiene als Repository-Trainingsfall aufnehmen.

### Tage 31 bis 60

- Scorecard als `latest-mentor-agent-education.*` oder eigenes Script automatisieren.
- Cross-Agent-Simulationen fuer Website-Funnel, Social-Live-Freigabe, Flight-Deck-UI und riskanten Refactor durchfuehren.
- Guardian prueft alle Lernfolgen mit Datenschutz-, Release-, Security- oder External-Live-Risiko.
- Dependency-Radar so schaerfen, dass jeder Agentenoutput naechsten Owner, Risiko und Akzeptanzkriterium nennt.

### Tage 61 bis 90

- Zielniveau L3 fuer Webbie, Winnie, Manni, Designer, Refactor und Repository pruefen.
- L4-Pfad fuer Mentor und Guardian aktivieren.
- Trainingskatalog versionieren und monatlich aktualisieren.
- Nutzen messen: weniger Wiederholfehler, weniger offene Quellenwarnungen, bessere Handoffs, kuerzere Reviews.

## Messbare Erfolgskennzahlen

| Kennzahl | Zielwert |
| --- | ---: |
| Agenten mit aktuellem Runbook | 100 Prozent |
| Agenten mit drei Trainingsaufgaben | 100 Prozent |
| Reports mit konkretem naechstem Owner | 100 Prozent |
| Lernbefunde mit Test, Gate, Regel oder Ausnahme | mindestens 80 Prozent |
| offene Quellenwarnungen | sinkender Trend, kurzfristig 0 kritische |
| Kernagenten auf L3 oder hoeher | mindestens 70 Prozent nach 90 Tagen |
| Mentor und Guardian auf L4 | nach 90 Tagen belegbar |

## Risikoanalyse

| Risiko | Bewertung | Gegenmassnahme |
| --- | --- | --- |
| Bildung bleibt reine Dokumentation | hoch | Jede Luecke braucht Aufgabe, Gate, Test oder Ausnahme |
| Scorecard wird subjektiv | mittel | Nur belegte Artefakte zaehlen |
| Zu viel Infrastruktur zu frueh | mittel | Erst Markdown/JSON, dann Automatisierung, spaeter RAG |
| Agenten verbessern isoliert | mittel | Cross-Agent-Szenarien verpflichtend machen |
| Unsafe Memory oder ungepruefte Quellen | hoch | Guardian-Review fuer Privacy, External-Live und Governance |

## Mentor-Empfehlung

Mentor empfiehlt, die Agentenbildung sofort als operativen Monatsprozess zu fuehren. Die erste Ausbaustufe sollte keine neue grosse Infrastruktur bauen, sondern drei konkrete Artefakte liefern:

1. `latest-mentor-agent-education.md/json` als Scorecard.
2. Einen versionierten Trainingskatalog je Agent.
3. Eine Postmortem-Bank, die Wiederholfehler in Gates, Tests, Runbooks oder Decision-Log-Regeln uebersetzt.

Damit koennen die Agenten in 30 Tagen von "gut dokumentiert" zu "gezielt trainierbar" kommen. In 60 Tagen wird die Wirkung messbar. In 90 Tagen sollte ein grosser Teil der Kernagenten nachweisbar L3 erreichen, Mentor und Guardian koennen den L4-Pfad uebernehmen.
