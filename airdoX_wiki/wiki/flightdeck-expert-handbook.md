# Flight Deck Expert Handbook (Windtool)

## Zweck
Dieses Dokument ist die zentrale Wissensbasis für den KI-Assistenten im AIRDOX Flight Deck (Windtool). Es deckt Standard-Workflows, Diagnosepfade und konkrete Lösungsschritte ab.

## Kernmodule
- Overview: Dashboard-Zustand, Workspace-Status, Git-Status.
- Analytics: KPI-Karten, Zeitraum- und Dimensionsfilter (Event, Gerät, Land).
- Data Explorer: Tabellenzugriff, Read-only SQL, Datensatzpflege.
- Set Import: Audio/Cover/Tracklist erkennen, Draft prüfen, Publish starten.
- Batch Import: Mehrfachimporte mit Queue und Fortschritt.
- Design Agent: Creative Lab fuer Set-basierte Visuals, Reels, Storys, Photoshop-Handoff und Transfer Packs.
- Advanced Settings: Workspace-Pfade, Build/Deploy-Commands, Automations-Toggles.
- System Monitor: RAM/CPU/Prozesse, Cache bereinigen, Optimierung.
- AI Assistant: Expertensystem auf lokaler Wissensbasis.

## Projektstruktur und Wissensquellen
Aktuelle Projektwahrheit liegt im Code und in den maschinell gepflegten Agenten-Snapshots. Fuer [[flightdeck-faq]], [[flightdeck-troubleshooting]] und [[local-01-overview]] gilt:

- `docs/agent-system/reports/`: dauerhafte menschliche Reports, Runbooks, Briefings, Research, Kampagnen- und Mentor-Dokumente. Unterordner: `operations/`, `campaigns/`, `mentor/`, `research/`, `proof/`.
- `docs/agent-system/visual-templates/`: visuelle Vorlagen, Designer-Ausgaben, Contact-Sheets, Social-Render-Outputs und visuelles Ausgangsmaterial. Laufzeit-Assets fuer die Website bleiben unter `public/brand-assets/`.
- `docs/agent-system/latest-*.json` und `docs/agent-system/latest-*.md`: aktuelle maschinelle Agenten-Snapshots. Diese Dateien bleiben im Workbench-Root, weil Runner und Monitor-Skripte sie direkt schreiben.
- Operative Steuerdateien im Workbench-Root: `job-catalog.json`, `agent-routing-rules.json`, `agent-watch-zones.json`, Queue-JSON-Dateien und `DECISION_LOG.md`.
- Flight-Deck-Code: `desktop/main/services/*.mjs`, `src/desktop/components/*.jsx`, `src/desktop/lib/*.js` und Tests unter `src/desktop/**/__tests__/`.

Ueberholt als aktuelle Quelle: `docs/agent-system/social-auto-output/` und `docs/agent-system/research/`. Wenn solche Pfade in alten Reports auftauchen, sind sie historisch zu lesen. Aktuelle Social-Outputs liegen unter `docs/agent-system/visual-templates/social/`; aktuelle Research-Berichte unter `docs/agent-system/reports/research/`.

## Workspace-Validierung
Ein Workspace gilt als gültig, wenn diese Dateien vorhanden sind:
- `package.json`
- `src/data/musicSets.js`
- `wrangler.jsonc`

Wenn "Workspace fehlt" angezeigt wird:
1. Im Tab Flight Deck oder Advanced Settings "Workspace auswählen".
2. Korrektes Projektverzeichnis wählen.
3. Settings speichern.
4. State neu laden (Refresh).

## Set-Import Standardablauf
1. Tab `Set Import` öffnen.
2. Import-Dateien wählen (Audio, optional Bild, optional Tracklist).
3. Draft-Felder prüfen: `id`, `title`, `file`, `date`, `duration`.
4. Trackliste kontrollieren.
5. `Publizieren` oder `Alles ausführen & Live` verwenden.

## Go-Live Ablauf
`Alles ausführen & Live` macht:
1. Settings persistieren.
2. Set publizieren.
3. Build/Deploy/Git-Schritte gemäß Settings ausführen.

Wenn Go-Live fehlschlägt:
- Build-Command prüfen.
- Deploy-Command prüfen.
- Git-Zustand prüfen (`dirty`, Branch).
- Konsole/Logs auswerten.

## Design Agent / Creative Lab
Der Design Agent beantwortet einfache Rollenfragen direkt: "Was kann der Design Assistant?" darf nie in den generischen Fallback laufen. Die Antwort muss aus [[flightdeck-expert-handbook]] und [[flightdeck-faq]] ableitbar sein.

Funktion:
- Set-basierte Visuals fuer Square, Reel und Story vorbereiten.
- Presets nutzen: `signal_system`, `club_still_parallax`, `glitch_type_drop`, `neon_depth_scan`, `daumenkino_idea_lab`.
- Hintergruende waehlen: Set-Cover, Vinyl Still, Website Music, Flight Deck UI, eigenes Bild oder parametrischer Look.
- Im Studio Marken-Overlay, Motion, Beat-Energie, Glitch, Parallax, Waveform, Typografie, Scanlines, Strobe, Grain und Dichte steuern.
- Photoshop-Handoff erzeugen: JSX-Skript, Prompt-Briefing, Manifest-Specs und optional Hero Frame.
- Transfer Pack ausgeben: MP4, GIF, Manifest JSON, Handoff Markdown und optional Photoshop-Dateien im `release/`-Ordner.

Standardablauf:
1. Tab `Design Agent` oeffnen.
2. Musik-Set, Format, visuelle Richtung und Hintergrund waehlen.
3. Im `Creative Studio` Preview und Regler feinjustieren.
4. `Pipeline ausfuehren (Rendern)` starten.
5. Export im Transfer Pack pruefen und Dateien anzeigen.

Wichtige Codequellen:
- `src/desktop/components/DesignAgentTab.jsx`
- `src/desktop/components/DesignSetupPhase.jsx`
- `src/desktop/components/DesignStudioPhase.jsx`
- `src/desktop/components/DesignExportPhase.jsx`
- `src/desktop/components/designConstants.js`

## Allround Assistant und Fehlerhilfe
Der AI Assistant ist als Allround-Helfer fuer das gesamte Flight Deck zu behandeln. Er muss Fragen zu Funktion, Workflow, Begriffen, Tabs, Datenmodell, Settings, Agentenwissen und Fehlersuche direkt auf Deutsch beantworten koennen. Die lokale Erstquelle ist `src/desktop/lib/assistantKnowledge.js`; Fehleruebersetzungen liegen in `src/desktop/lib/assistantEngine.js`.

Pflichtabdeckung:
- Tab-Landkarte: Overview, Flight Deck, Set Import, Batch Import, Marketing Manager, Design Agent, Analytics, Data Explorer, Advanced Settings, System Monitor, Tutorial, Assistant.
- Workflows: Import, Publish, Go Live, Batch, Analytics-Auswertung, Data-Explorer-Pflege, Design-Transfer-Pack, Marketing-Freigabe.
- Begriffe: Workspace, Manifest, Draft, Publish, Go Live, Verify, R2, R2 Prefix, Safe Mode, track_stats, analytics_logs, Snapshot, Dirty Git, Transfer Pack.
- Projektwissen: `docs/agent-system/reports/`, `docs/agent-system/visual-templates/`, `docs/agent-system/latest-*`, `DECISION_LOG.md`.
- Fehlerhilfe: technische Meldung anzeigen, dann laienverstaendlich erklaeren, was sie bedeutet und welche Schritte zu tun sind.

Bei Import-/Publish-Fehlern gilt:
1. Die Originalmeldung bleibt sichtbar, damit sie technisch nachvollziehbar bleibt.
2. Direkt darunter steht eine deutsche Hilfe: `Was bedeutet das?` und `So behebst du es`.
3. Die Hilfe vermeidet Fachchinesisch und nennt konkrete UI-Orte wie `Set Import`, `Audio Source`, `Dateien waehlen`, `Advanced Settings` oder `Publish Log`.
4. Bekannte Muster: keine Audiodatei, Tracklist ohne Zeitmarken, fehlende Draft-Felder, generischer Titel, Safe Mode ohne Audio Source, WAV/ffmpeg, Workspace ungueltig, R2/Credentials, Build, Deploy, Live-Verify und Datenbank.

Codequellen:
- `src/desktop/lib/assistantEngine.js`: `explainFlightDeckError`, `formatFlightDeckErrorHelp`, lokale Antwortlogik.
- `src/desktop/DesktopApp.jsx`: haengt freundliche Fehlerhilfe an Publish-/Live-Fehler.
- `src/desktop/components/SetImportTab.jsx`: zeigt Hilfe im Publish-Status und Publish Log.
- `src/desktop/lib/__tests__/assistantCoverage.test.js`: prueft Allround- und Fehlerfragen.

## Analytics-Funktionen
Filterparameter:
- Zeitraum: Von/Bis (inklusive Tagesgrenzen).
- Event-Typ: `play`, `like`, `dislike`, `view`.
- Gerät: z.B. `desktop`, `mobile`, `tablet`.
- Land: ISO-Ländercode, z.B. `DE`, `AT`, `CH`, `US`.

Erwartetes Verhalten:
- KPI-Karten ändern sich sofort nach Filter.
- Top Sets und Geo-Verteilung zeigen nur gefilterte Ergebnisse.
- Event-Typ-Übersicht und Geräte-Breakdown spiegeln Filterzustand.

## Datenbank-Setup
Unterstützte ENV-Variablen:
- `DATABASE_URL`
- `NEON_DATABASE_URL`
- `POSTGRES_URL`

Wenn Datenbank nicht erreichbar ist:
- UI bleibt nutzbar.
- Snapshot kann leer sein.
- Warnung wird angezeigt.

## Data Explorer Regeln
- Nur read-only SQL erlaubt: `SELECT`, `WITH`, `EXPLAIN`.
- Verboten: `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, `TRUNCATE`, `GRANT`, `REVOKE`, `CREATE`.
- Nur Single-Statement erlaubt.

## Security- und Betriebsregeln
- Secrets nie im Klartext commiten.
- `.env` lokal halten.
- Vor Deploy immer Build + Tests.
- Bei auffälligen Produktionsproblemen: zunächst System Monitor + Analytics + Logs.

## Schnellantworten für Assistent
Frage: "Wie verbinde ich einen Workspace?"
Antwort: "Workspace auswählen, speichern, Validierung prüfen (package.json, src/data/musicSets.js, wrangler.jsonc)."

Frage: "Warum geht mein Publish nicht?"
Antwort: "Build/Deploy-Command und Git-Status prüfen; dann Logs im Ablauf vergleichen."

Frage: "Warum sind Analytics-Werte falsch?"
Antwort: "Filter (Zeitraum/Event/Gerät/Land) prüfen, dann Refresh, dann Event-Logs im Explorer kontrollieren."

Frage: "Was kann der Design Assistant?"
Antwort: "Er erstellt aus einem Musik-Set visuelle Varianten fuer Square/Reel/Story, bietet Live-Preview und Feintuning, erzeugt Photoshop-Handoff und exportiert MP4/GIF/Manifest/Handoff als Transfer Pack."

Frage: "Safe mode blocked publish: the source audio path is missing."
Antwort: "Safe Mode blockiert, weil keine lokale Audiodatei im Draft steht. Waehle im Set Import die Audiodatei neu aus und pruefe `Audio Source`. Safe Mode nur bewusst deaktivieren, wenn Audio bereits sicher in R2 liegt."
