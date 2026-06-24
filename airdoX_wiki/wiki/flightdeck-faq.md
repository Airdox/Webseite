# Flight Deck FAQ

## Wie starte ich schnell produktiv?
1. Workspace verbinden.
2. Settings speichern.
3. Set importieren.
4. Publish/Go-Live ausführen.

## Welche Datenbankvariablen werden unterstützt?
- `DATABASE_URL`
- `NEON_DATABASE_URL`
- `POSTGRES_URL`

## Wie prüfe ich, ob Filter korrekt arbeiten?
1. Analytics öffnen.
2. Refresh ausführen.
3. KPI-Ausgangswert merken.
4. Event/Gerät/Land ändern.
5. KPI muss sich ändern.

## Was bedeutet "read-only query" im Data Explorer?
Nur lesende SQL-Abfragen sind erlaubt (`SELECT`, `WITH`, `EXPLAIN`). Schreibende oder strukturelle Statements sind gesperrt.

## Wie behebe ich langsames Verhalten?
1. System Monitor prüfen.
2. Cache leeren.
3. Nicht benötigte Prozesse schließen.
4. Danach erneut testen.

## Wie exportiere ich Daten?
Im Data Explorer Tabellen filtern und `Export` (JSON/CSV) verwenden.

## Was kann der Design Assistant?
Der Design Assistant ist der Design Agent im Flight Deck. Er erstellt aus einem Musik-Set visuelle Varianten fuer Square, Reel und Story, zeigt eine Live-Preview, steuert Motion/Beat/Glitch/Parallax/Waveform/Typografie und erzeugt am Ende ein Transfer Pack mit MP4, GIF, Manifest, Handoff-Markdown und optional Photoshop-JSX.

Arbeitsablauf:
1. `Design Agent` oeffnen.
2. Set, Format, Preset und Hintergrund auswaehlen.
3. Im Studio Regler und Marken-Overlay einstellen.
4. Render-Pipeline starten.
5. Export-Dateien pruefen.

Siehe auch [[flightdeck-expert-handbook]] und [[flightdeck-troubleshooting]].

## Wo liegen aktuelle Reports und visuelle Vorlagen?
- Aktuelle dauerhafte Reports: `docs/agent-system/reports/`.
- Visuelle Vorlagen und Designer-Ausgaben: `docs/agent-system/visual-templates/`.
- Aktuelle maschinelle Agenten-Snapshots: `docs/agent-system/latest-*.md` und `docs/agent-system/latest-*.json`.

Alte Pfade wie `docs/agent-system/social-auto-output/` oder `docs/agent-system/research/` sind nicht mehr als aktuelle Quelle zu verwenden. Siehe [[flightdeck-expert-handbook]] und [[flightdeck-troubleshooting]].

## Was soll der Assistant bei Import-Fehlern tun?
Er soll nicht nur die technische Fehlermeldung zeigen, sondern direkt eine einfache deutsche Hilfe anbieten.

Beispiel:
- Fehler: `Safe mode blocked publish: the source audio path is missing.`
- Bedeutung: Flight Deck findet keine lokale Audiodatei fuer den Publish.
- Loesung: Im Set Import erneut `Dateien waehlen`, Audiodatei auswaehlen, Feld `Audio Source` pruefen, dann Publish erneut starten.

Bekannte Fehlergruppen:
- keine Audiodatei ausgewaehlt
- Tracklist ohne nutzbare Zeitmarken
- Draft-Felder fehlen
- Set-Titel ist zu allgemein
- Safe Mode blockiert
- WAV/ffmpeg-Konvertierung
- Workspace ungueltig
- R2/Cloudflare Upload
- Build, Deploy oder Live-Verify
- Datenbank/Neon nicht erreichbar

Siehe [[flightdeck-troubleshooting]] und [[flightdeck-expert-handbook]].

## Wie trainiere ich den KI-Assistenten weiter?
Neue Markdown-Dateien im Ordner `airdoX_wiki/wiki` anlegen und klare Abschnitte schreiben:
- Problem
- Ursache
- Diagnose
- Lösung
- Validierung
