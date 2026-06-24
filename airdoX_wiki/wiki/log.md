# AIRDOX Wiki Logbuch

Dieses Journal protokolliert alle Änderungen und Ingest-Vorgänge im AIRDOX Wiki.

---

## 19. April 2026

*   Initialisierung des AIRDOX Wiki Systems.
*   Erstellung von `SYSTEM.md`, `index.md` und `log.md`.

* [2026-04-19 10:59:36] Core-System initialisiert.
* [2026-04-19 10:59:36] 

### Knowledge Linting Report
* Keine strukturellen Probleme gefunden.

## 1. Mai 2026

* Erweiterung der Wissensbasis für den KI-Assistenten:
  * `flightdeck-expert-handbook.md`
  * `flightdeck-troubleshooting.md`
  * `flightdeck-faq.md`
* Aktualisierung von `index.md` mit Inhaltsübersicht.
* Ziel: Höhere Antwortabdeckung für Bedienung, Fehlerdiagnose und Lösungsanleitungen im Windtool.

## 2. Mai 2026

* Aufbau des Multi-Agenten-Operating-Models fuer AIRDOX:
  * `docs/agent-system/reports/operations/OPERATING_MODEL.md`
  * `docs/agent-system/DECISION_LOG.md`
  * `scripts/agent-audit.mjs`
* Erweiterung des lokalen Wiki-Lernsystems:
  * `local-09-mentor-audit.md`
  * `local-10-agent-decisions.md`
  * `local-11-feedback-loops.md`
  * `local-12-refactor-optimization.md`
* Ziel: Agentenrollen, Audit-Gates, Entscheidungen und Feedbackschleifen dauerhaft nachvollziehbar machen.
* Nachtrag: Refactor als sechsten Superagenten fuer Systemoptimierung und Verschlankung aufgenommen.

## 22. Mai 2026

* Dokumentation der Mai-Updates:
  * Erstellung von `local-13-recent-updates-may-2026.md` zur Dokumentation der neuen Code-Refactorings und Skills.
  * Aktualisierung von `local-07-current-program-state.md` mit den aktuellen `package.json`-Skripten, neu hinzugefügten Tabs und den 6 Agenten-Skills.
  * Aktualisierung des Wiki-Index `index.md`.
* Inhalt der Updates:
  * Zerlegung der monolithischen `GlobalPlayer`- und `Hero`-Komponenten.
  * Integration von 6 deutschen Agenten-Skills unter `.agents/skills/` zur strukturierten Automatisierung (Social Publisher, YouTube, Brand Assets, EPK, Tracklists, Quality Check).
  * Behebung des mobilen Vinyl-Cover-Animationsfehlers in der `SetCard`.
  * Integration der Filterknöpfe ("Alle Sets" / "Live") im Data Explorer.
  * Bereinigung alter Vercel/Netlify-Dateien, vollständiger Fokus auf Cloudflare.
* Ziel: Bereitstellung vollständiger Wissensabdeckung für den Chatassistenten im Windows Flight Deck Tool.

## 6. Juni 2026

* Erweiterung der Assistant- und Workflow-Wissensbasis:
  * Neue Seite `flightdeck-workflow-diagrams.md` mit Mermaid-Diagrammen und sprachlicher Interpretation fuer Go Live, Design Agent, Assistant-Antwortlogik und Fehlerdiagnose.
  * Ziel: Der Assistant soll Diagramme in konkrete Schnellwege, detaillierte Feineinstellungswege, Erfolgskriterien und Diagnoseknoten uebersetzen koennen.
  * Verknuepfte Seiten: `flightdeck-expert-handbook.md`, `flightdeck-troubleshooting.md`, `flightdeck-faq.md`, `local-02-online-publish-runbook.md`.

* P1-Sync `WIKI-2026-06-06-001` ausgefuehrt.
* Quellen:
  * `docs/agent-system/README.md`
  * `docs/agent-system/reports/README.md`
  * `docs/agent-system/visual-templates/README.md`
  * `docs/agent-system/latest-agent-system-health.md`
  * `docs/agent-system/latest-agent-routing.md`
  * `docs/agent-system/latest-audit.md`
  * `src/desktop/components/DesignAgentTab.jsx`
  * `src/desktop/components/DesignSetupPhase.jsx`
  * `src/desktop/components/DesignStudioPhase.jsx`
  * `src/desktop/components/DesignExportPhase.jsx`
  * `src/desktop/components/designConstants.js`
  * `src/desktop/lib/assistantKnowledge.js`
  * `desktop/main/services/assistant.mjs`
* Betroffene Wiki-Seiten:
  * `flightdeck-expert-handbook.md`
  * `flightdeck-troubleshooting.md`
  * `flightdeck-faq.md`
  * `index.md`
  * `log.md`
* Inhalt:
  * Neue Projektordnung dokumentiert: `docs/agent-system/reports/` fuer dauerhafte Reports und `docs/agent-system/visual-templates/` fuer visuelle Vorlagen.
  * `docs/agent-system/latest-*` als operative Agenten-Snapshots im Workbench-Root eingeordnet.
  * Alte Pfade `docs/agent-system/social-auto-output/` und `docs/agent-system/research/` als nicht aktuelle Quellen markiert.
  * Design Agent / Design Assistant als Flight-Deck-Wissen ergaenzt, damit einfache Fragen wie "Was kann der Design Assistant?" direkt beantwortbar sind.

## 6. Juni 2026 - Allround Assistant und Fehlerhilfe

* Erweiterung der Assistant-Wissensbasis fuer Allround-Betrieb:
  * Tab-Landkarte, Glossar, Go-Live-Preflight, Datenmodell, Analytics-Begriffe, Publish Pipeline, Settings Toggles, Agentensystem, Marketing Manager und Tutorial-Workflows.
  * Fehleruebersetzung fuer Import-/Publish-/Live-Probleme in `src/desktop/lib/assistantEngine.js`.
  * UI-Anbindung in `src/desktop/DesktopApp.jsx` und `src/desktop/components/SetImportTab.jsx`, damit Fehler mit deutscher Hilfe angezeigt werden.
  * Regressionen in `src/desktop/lib/__tests__/assistantCoverage.test.js` ergaenzt.
* Betroffene Wiki-Seiten:
  * `flightdeck-expert-handbook.md`
  * `flightdeck-troubleshooting.md`
  * `flightdeck-faq.md`
  * `log.md`

## 6. Juni 2026 - Wiki-Graph vernetzt

* Obsidian-Graph bereinigt:
  * `index.md` nutzt jetzt echte `[[...]]`-Links zu allen Wiki-Seiten.
  * Alle `local-*`-Seiten besitzen einen Abschnitt `Verknüpfungen` mit mindestens zwei fachlichen Wiki-Links.
  * Demo-Links im Wiki-Kernel wurden auf AIRDOX-Seiten umgestellt, damit keine fremden Knoten wie Physik/Quantenmechanik entstehen.
* Ziel: Das Wiki ist ein navigierbares Wissensnetz statt einer Sammlung isolierter Dateien.

## 6. Juni 2026 - Wiki Maintainer als Agent registriert

* Der vorhandene Skill `airdox-wiki-maintainer` wurde als eigener Agent `Wiki Maintainer` in der AIRDOX-Orchestrierung verankert.
* Geaenderte Steuerdateien:
  * `docs/agent-system/job-catalog.json`
  * `docs/agent-system/agent-routing-rules.json`
  * `docs/agent-system/agent-watch-zones.json`
  * `scripts/agent-job-validator.mjs`
  * `.agents/skills/airdox-wiki-maintainer/SKILL.md`
  * `.agents/skills/airdox-wiki-maintainer/agents/openai.yaml`
  * `docs/agent-system/wiki-maintainer-todo.md`
* Auftrag: Projekt- und Flight-Deck-Aenderungen kuenftig in Wiki und lokale Assistant-Antworten ueberfuehren, damit Nutzerfragen und Fehlerbilder direkt beantwortet werden koennen.

## 7. Juni 2026 - Website Auth live und Wiki-Ingest

* Quelle/Auftrag: Auth-Workflow-Ueberarbeitung, Security-Haertung und Benutzerentscheidung, Social Login als Sekundaerziel vorzubereiten, aber produktiv zunaechst nur Standard-Login zu betreiben.
* Live-Deploy:
  * `npm run build`
  * `npx wrangler@4.95.0 whoami`
  * `npx wrangler@4.95.0 deploy`
  * Worker-Version: `5cbdcb92-f776-42ff-95be-bc0685fde5fe`
  * Live-Verifikation: `https://airdox-webseite.beuth62.workers.dev` liefert `200`; `https://airdox.info/api/oauth/config` liefert `{"ok":true,"providers":[]}`.
* Betroffene Wiki-Seiten:
  * `local-14-website-auth-security.md`
  * `index.md`
  * `log.md`
* Inhalt:
  * Standard-Login ist produktiver Hauptpfad.
  * Registrierung bleibt durch Turnstile-CAPTCHA und Rate-Limits geschuetzt.
  * Neue Passwoerter nutzen versioniertes `PBKDF2-SHA-256`; alte Salted-SHA-256-Hashes werden nach erfolgreichem Login migriert.
  * Google/Facebook Login ist technisch vorbereitet, aber live nicht aktiv, solange echte Provider-Credentials und Freigaben fehlen.
