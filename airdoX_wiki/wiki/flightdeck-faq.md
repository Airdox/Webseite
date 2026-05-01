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

## Wie trainiere ich den KI-Assistenten weiter?
Neue Markdown-Dateien im Ordner `airdoX_wiki/wiki` anlegen und klare Abschnitte schreiben:
- Problem
- Ursache
- Diagnose
- Lösung
- Validierung

