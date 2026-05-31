# NotebookLM Result: AIRDOX Agentenschule und Wissensverbesserung

Stand: 2026-05-27
Owner: Mentor
Notebook: `AIRDOX Agentenschule: Wissen, Memory, RAG und Agenten-Fortbildung`
Notebook ID: `658d9fda-63cf-4353-8d19-6ada790f8232`
Deep Research Task ID: `0ac2fb64-48cf-47c4-b6dd-dc92cabe8713`

## Ergebnisstatus

NotebookLM Deep Research wurde abgeschlossen und importiert:

- Gefundene Quellen: 49
- Notebook-Quellen nach Import und lokalen AIRDOX-Dokumenten: 50+
- Seed-Quellen: MemoryArena, Live-Evo, Hugging Face Agentic RAG, Agentic Memory Papers, MA-RAG, Knowledge-Aware Iterative Retrieval
- Lokale AIRDOX-Quellen: `OPERATING_MODEL.md`, `AGENT_RESPONSIBILITY_MATRIX.md`, `AGENT_CONTINUOUS_LEARNING.md`

Die erste NotebookLM-Auswertung enthielt einen falschen Industrie-/Mining-Kontext. Eine zweite, korrigierte Auswertung wurde mit explizitem AIRDOX-Kontext erzeugt. Diese Datei fasst nur die fuer AIRDOX brauchbaren Punkte zusammen.

## Kernaussage

Agenten koennen in AIRDOX sinnvoll "mit Wissen verbessert" werden, aber nicht durch unbeaufsichtigtes Selbsttraining. Der robuste Weg ist:

- kuratierte Quellen,
- versionierte Wissensbasis,
- NotebookLM/Deep-Research als Recherche-Ebene,
- Runbooks und prozedurale Regeln,
- episodische Fehler- und Entscheidungshistorie,
- Evaluationsrubriken,
- Governance-Gates,
- konkrete Trainingsszenarien.

Das verbessert nicht die Modellgewichte, aber die tatsaechliche Arbeitsqualitaet, weil Agenten besseren Kontext, bessere Regeln, bessere Beispiele und bessere Checks bekommen.

## Wissensarten fuer AIRDOX-Agenten

| Wissensart | Bedeutung | AIRDOX-Beispiel | Speicherort |
| --- | --- | --- | --- |
| In-Context Memory | aktueller Arbeitskontext eines Laufs | geaenderte Dateien, aktuelle Terminalausgaben, Nutzerziel | laufende Session |
| Episodic Memory | chronologische Erfahrungen und Ereignisse | vergangene Reel-Kampagnen, Build-Fehler, Release-Entscheidungen | `DECISION_LOG.md`, latest-Reports |
| Semantic Memory | fachliches Wissen | React/Vite fuer Webbie, Electron fuer Winnie, Plattformregeln fuer Manni | NotebookLM, Wiki, Agenten-Dokus |
| Procedural Memory | Arbeitsablaeufe und Runbooks | Reel-Produktion, Flight-Deck-Test, Release-Gate | `docs/agent-system/*.md`, Scripts |
| Organizational Context Memory | lokale AIRDOX-Regeln | keine Live-Posts ohne OK, Master-Approval fuer gravierende Aenderungen | Operating Model, Job-Katalog, Routing |
| Evaluative Memory | Bewertungserfahrung | welche Fehlerklassen wiederkehren, welche Gates fehlen | Guardian-/Mentor-Reports |

## Trennung der Mechanismen

| Mechanismus | Was es leistet | Was es nicht leistet | AIRDOX-Umsetzung |
| --- | --- | --- | --- |
| Modelltraining | veraendert Modellgewichte | braucht Daten, Kosten, Freigaben und Eval-Infrastruktur | derzeit nicht als Standardweg |
| RAG | holt aktuelle Fakten aus Quellen | speichert keine Erfahrung von selbst | NotebookLM, Wiki, lokale Dokus |
| Memory | speichert Entscheidungen, Muster, Fehler | darf nicht ungeprueft oder personenbezogen wachsen | Decision Log, Reports, kuratierte Memory-Regeln |
| Runbooks | machen Wissen ausfuehrbar | ersetzen keine Tests | Agenten-Dokus, Workflows, Job-Katalog |
| Evaluation | misst Qualitaet und Prozess | verbessert nichts ohne Folgearbeit | Mentor-Scorecard, Guardian-Gates |
| Governance | blockiert riskante Pfade | ersetzt keine Fachkenntnis | Approval-Gates, Routing, Policy-Regeln |

## AIRDOX Agentenschule

Mentor soll ein Curriculum fuer jeden Agenten fuehren:

1. Orientierung
   Agent kennt Rolle, Nicht-Aufgaben, wichtigste Pfade, Outputs und Freigabegrenzen.

2. Kalibrierung
   Agent fuehrt kleine Standardaufgabe mit korrektem Gate aus.

3. Simulation
   Agent bearbeitet Fehlerfall und Cross-Agent-Szenario ohne Live-Risiko.

4. Shadow Execution
   Agent bewertet reale Aenderungen zuerst beobachtend: Was waere Owner, Gate, Risiko, naechster Schritt?

5. Optimierung
   Wiederholfehler werden in neue Tests, Runbooks, Checklisten oder Decision-Log-Regeln ueberfuehrt.

## Konkrete Aufgaben fuer Mentor

| Aufgabe | Output | Akzeptanzkriterium |
| --- | --- | --- |
| Wissens-Taxonomie einbauen | Mentor-Doku und Scorecard | jede Rolle hat zugeordnete Wissensarten |
| Quellenkarte je Agent | Quellenregister | mindestens 5 hochwertige Quellen je Kernagent |
| Agentenschule-Curriculum | Trainingskatalog | Basis-, Fehler- und Cross-Agent-Uebung je Agent |
| Memory-Regeln | Governance-Regel | Aufnahme, Ausschluss, Provenienz, Loeschung und Freigabe definiert |
| RAG-/NotebookLM-Blueprint | Architekturabschnitt | Quellen, Grenzen, Update-Zyklus und Importregeln definiert |
| Evaluationsrubrik | Scorecard | Tool-Use, Quellenbezug, Handoff, Policy und Fehlerlernen messbar |
| Postmortem-Bank | Lessons-Learned-Register | Wiederholfehler haben Owner, Folgecheck und Status |
| NotebookLM-Import-Cycle | Research-to-Runbook-Regel | Research erzeugt mindestens eine Projektregel oder Aufgabe |

## Evaluationsrubrik

Mentor bewertet Agenten nicht pauschal, sondern pro Arbeitsweg:

| Dimension | Frage | Gate |
| --- | --- | --- |
| Quellenbezug | Nutzt der Agent aktuelle Primaerquellen oder lokale Source-of-Truth-Doku? | Mentor |
| Kontexttreue | Bleibt der Agent im AIRDOX-Kontext? | Mentor |
| Tool-Use | Waehlt der Agent passende lokale Tools, Scripts und Tests? | Guardian |
| Handoff | Benennt der Agent naechsten Owner, Risiko und Akzeptanzkriterium? | Master Controller |
| Policy | Werden Live-Aktion, Deploy, Paid Spend und personenbezogene Daten korrekt behandelt? | Guardian |
| Fehlerlernen | Wird aus einem Fehler ein Gate, Test, Runbook oder dokumentierte Ausnahme? | Mentor |

## Scorecard

Empfohlene Mentor-Scorecard je Agent:

```json
{
  "agent": "Webbie",
  "knowledgeLevel": "L2",
  "sourceFreshness": "warn",
  "proceduralCoverage": "pass",
  "handoffQuality": "warn",
  "policyAdherence": "pass",
  "openLearningItems": 2,
  "nextTraining": "Funnel-Tracking ohne Messdaten",
  "evidence": [
    "latest-agent-currency.md",
    "latest-agent-quality-chain.md"
  ]
}
```

## Risiken

| Risiko | Bedeutung | Gegenmassnahme |
| --- | --- | --- |
| Context Rot | Wissen altert, Agenten handeln nach ueberholten Regeln | Quellenfrische und Ablaufdatum je Quelle |
| Goal Drift | Agenten entfernen sich vom urspruenglichen Ziel | Akzeptanzkriterien und Master-Controller-Gate |
| Sycophancy Cascading | Agenten bestaetigen sich gegenseitig falsch | Guardian als Gegenpruefung, keine reine Mehrheitsentscheidung |
| Research ohne Wirkung | NotebookLM erzeugt nur Zusammenfassungen | Research-to-Runbook-Regel |
| Unsafe Memory | sensible oder ungepruefte Informationen landen im Memory | Memory-Governance und Loeschregel |
| Overengineering | zu schwere Infrastruktur fuer kleines Team | erst Markdown/JSON/Reports, spaeter RAG/Graph |

## 30-60-90-Tage-Plan

### Tage 1 bis 30

- Wissens-Taxonomie in Mentor-Doku aufnehmen.
- Quellenkarte fuer Webbie, Winnie, Guardian, Manni, Designer und Mentor erstellen.
- Agentenschule-Basisuebungen je Kernagent definieren.
- Memory-Regeln fuer Aufnahme, Ausschluss, Provenienz und Loeschung dokumentieren.
- NotebookLM-Ergebnisse in `mentor-knowledge-improvement-tasks.json` spiegeln.

### Tage 31 bis 60

- Mentor-Scorecard als JSON/Markdown-Report umsetzen.
- Erste Fehler-zu-Gate-Schleife aus `DECISION_LOG.md` und Guardian-Reports ableiten.
- Cross-Agent-Simulationen fuer Website-Funnel, Social-Live-Freigabe, Flight-Deck-UI und riskanten Refactor erstellen.
- NotebookLM-Import-Cycle in den Job-Katalog aufnehmen oder als manuelles Mentor-Protokoll fuehren.

### Tage 61 bis 90

- RAG-/Wissensbasis-Blueprint entscheiden: Markdown-only, NotebookLM-only oder lokaler Hybrid.
- Memory-Retention und Decay-Regeln einfuehren.
- Governance-Gates fuer Research-to-Live-Aktion, personenbezogene Daten und externe Plattformaktionen verschaerfen.
- Nutzen messen: weniger Wiederholfehler, bessere Handoffs, schnellere Reviews, weniger Quellenwarnungen.

## Direkte Umsetzung im Repo

Bereits angelegt:

- `docs/agent-system/research/MENTOR_NOTEBOOKLM_DEEP_RESEARCH_AGENT_SCHOOLS_2026-05-27.md`
- `docs/agent-system/mentor-knowledge-improvement-tasks.json`
- `docs/agent-system/MENTOR_AGENT_LEVEL_UP_PLAN_2026-05-27.md`

Naechste sinnvolle Repo-Aenderung:

- `mentor-knowledge-improvement-tasks.json` in den Job-Katalog als manuellen Mentor-Review aufnehmen.
- optional spaeter `scripts/mentor-knowledge-scorecard.mjs` bauen.

