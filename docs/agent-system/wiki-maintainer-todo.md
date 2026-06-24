# Wiki Maintainer To-Do

Owner: `airdox-wiki-maintainer`
Status: active
Priority: P1
Created: 2026-06-06

## Agent Registration

Der vorhandene Skill `airdox-wiki-maintainer` ist als eigener AIRDOX-Agent `Wiki Maintainer` registriert.

Zustaendigkeit:
- Projekt- und Flight-Deck-Aenderungen in das kompilierte `airdoX_wiki` ueberfuehren.
- Assistant-Wissensluecken schliessen, damit typische Nutzerfragen und Fehlermeldungen direkt beantwortet werden.
- Obsidian-Graph verbunden halten: keine Waisenseiten, keine toten Links, keine Demo-Knoten.
- `index.md` und `log.md` nach substantiellen Aenderungen aktualisieren.

Orchestrierung:
- Job: `wiki-maintainer-project-sync` in `docs/agent-system/job-catalog.json`
- Master-Kontrolle: `master-wiki-sync-enforcement` schreibt `docs/agent-system/latest-wiki-sync-audit.*`
- Routing: `wiki-assistant-knowledge` in `docs/agent-system/agent-routing-rules.json`
- Watch-Zone: `wiki-assistant-knowledge` in `docs/agent-system/agent-watch-zones.json`
- Skill: `.agents/skills/airdox-wiki-maintainer/SKILL.md`

Pflicht-Gates:
- Wiki-Lint mit lokalem Base Path `D:\\webseeite-main\\airdoX_wiki`
- `npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js`
- Bei sichtbaren Flight-Deck-Aenderungen: `npm run desktop:test:logic -- --run`

Master-Regel:
- Jede neue Content-, Projekt-, Flight-Deck-, Agenten- oder Dokumentationsaenderung erzeugt eine Wiki-Sync-Pflicht.
- Wenn `docs/agent-system/latest-wiki-sync-audit.md` den Status `warn` meldet, muss der Master Controller den `Wiki Maintainer` explizit beauftragen.
- Der Wiki Maintainer schliesst die Luecke erst, wenn Wiki/Assistant-Wissen aktualisiert, `index.md`/`log.md` geschrieben und die Gates ausgefuehrt wurden.

## Open Tasks

### WIKI-2026-06-06-001 - AIRDOX Wiki auf aktuellen Projektstand bringen

Der `airdox-wiki-maintainer` muss das `airdoX_wiki` regelmaessig mit dem aktuellen Projektstand synchronisieren, damit das Windows Flight Deck und der Chat-Assistent auf verlaessliches Betriebswissen zugreifen koennen.

Scope:
- `airdoX_wiki/SYSTEM.md`
- `airdoX_wiki/wiki/index.md`
- `airdoX_wiki/wiki/flightdeck-expert-handbook.md`
- `airdoX_wiki/wiki/flightdeck-troubleshooting.md`
- `airdoX_wiki/wiki/flightdeck-faq.md`
- `airdoX_wiki/wiki/log.md`
- aktuelle Quellen aus `docs/agent-system/`, `docs/agent-system/reports/`, `desktop/`, `src/desktop/`, `scripts/` und `README.md`

Required work:
- Projektstruktur nach der neuen Ordnung dokumentieren: `docs/agent-system/reports/` fuer Berichte und `docs/agent-system/visual-templates/` fuer visuelle Vorlagen.
- Relevante Flight-Deck- und Chat-Assistenten-Aenderungen aus Code, Reports und Agenten-Snapshots in kompilierte Wiki-Abschnitte ueberfuehren.
- Veraltete Pfade im Wiki ersetzen oder als ueberholt markieren.
- Neue Inhalte mit mindestens zwei passenden `[[Wikilinks]]` verbinden.
- `airdoX_wiki/wiki/index.md` und `airdoX_wiki/wiki/log.md` nach jeder substantiellen Wiki-Aenderung aktualisieren.
- Nach groesseren Updates `python airdoX_wiki/linting.py` ausfuehren und gefundene tote Links oder Widersprueche beheben.

Acceptance criteria:
- Das Wiki erklaert, wo aktuelle Reports, visuelle Vorlagen, operative Agenten-Snapshots und Flight-Deck-Wissen liegen.
- Flight Deck und Chat-Assistent koennen aus dem Wiki nachvollziehen, welche Dateien fuer Betrieb, Troubleshooting, Agentenwissen und Projektstatus relevant sind.
- `wiki/log.md` enthaelt einen Eintrag mit Datum, Quellen und betroffenen Seiten.
- Keine bekannten alten Pfade wie `docs/agent-system/social-auto-output/` oder `docs/agent-system/research/` bleiben im Wiki als aktuelle Quelle stehen.

Cadence:
- Nach jeder groesseren Projektstruktur-, Desktop-, Agenten- oder Dokumentationsaenderung pruefen.
- Mindestens einmal pro Woche gegen `docs/agent-system/latest-*.md`, `docs/agent-system/reports/` und die Flight-Deck-Dateien abgleichen.

### WIKI-2026-06-06-002 - Assistant-Antwortabdeckung dauerhaft sichern

Der `Wiki Maintainer` muss bei jeder neuen Funktion, jedem neuen Fehlerbild und jeder wiederholten Nutzerfrage pruefen, ob der Chat-Assistent lokal antworten kann.

Scope:
- `src/desktop/lib/assistantKnowledge.js`
- `src/desktop/lib/assistantEngine.js`
- `src/desktop/lib/__tests__/assistantCoverage.test.js`
- `airdoX_wiki/wiki/flightdeck-expert-handbook.md`
- `airdoX_wiki/wiki/flightdeck-faq.md`
- `airdoX_wiki/wiki/flightdeck-troubleshooting.md`

Acceptance criteria:
- Jede neue wahrscheinliche Nutzerfrage bekommt ein Knowledge-Item oder eine robuste Fehler-Erklaerung.
- Technische Fehlermeldungen werden in einfache deutsche Schritte uebersetzt.
- Assistant-Coverage enthaelt mindestens eine Regression fuer neue Workflows oder Fehlerklassen.
