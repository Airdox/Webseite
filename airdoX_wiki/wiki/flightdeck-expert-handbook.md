# Flight Deck Expert Handbook (Windtool)

## Zweck
Dieses Dokument ist die zentrale Wissensbasis für den KI-Assistenten im AIRDOX Flight Deck (Windtool). Es deckt Standard-Workflows, Diagnosepfade und konkrete Lösungsschritte ab.

## Kernmodule
- Overview: Dashboard-Zustand, Workspace-Status, Git-Status.
- Analytics: KPI-Karten, Zeitraum- und Dimensionsfilter (Event, Gerät, Land).
- Data Explorer: Tabellenzugriff, Read-only SQL, Datensatzpflege.
- Set Import: Audio/Cover/Tracklist erkennen, Draft prüfen, Publish starten.
- Batch Import: Mehrfachimporte mit Queue und Fortschritt.
- Advanced Settings: Workspace-Pfade, Build/Deploy-Commands, Automations-Toggles.
- System Monitor: RAM/CPU/Prozesse, Cache bereinigen, Optimierung.
- AI Assistant: Expertensystem auf lokaler Wissensbasis.

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

