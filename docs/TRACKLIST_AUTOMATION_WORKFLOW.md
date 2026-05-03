# Automatisierter Tracklist-Workflow

Stand: 2026-05-03

## Ziel

Der Workflow beginnt mit der Uebergabe der Original-CUE-Dateien aus Rekordbox oder einem vergleichbaren Export. Ziel ist eine verlaessliche, auswertbare und konvertierbare Tracklist, die am Ende ohne manuelle Nacharbeit in das AIRDOX-Ausgabeformat passt:

- Website-Manifest: `src/data/musicSets.js`
- Flight-Deck-Draft: `tracks: [{ time, artist, title }]`
- Mixcloud-Text: `Artist - Title - HH:MM:SS`
- kanonische Kontrollfassung: `time | artist | title`

Die wichtigste Regel: Live darf nur eine seekbare Tracklist erreichen. Jede Track-Zeile braucht einen gueltigen Zeitstempel und mindestens Artist oder Title.

## Aktuelle Logik

### 1. Erzeugung aus Original-CUE

Das Skript `scripts/generate-mixcloud-tracklists.mjs` ist der technische Eingang fuer CUE-basierte Automatisierung.

Es kann:

- einzelne `.cue`-Dateien oder ganze Ordner verarbeiten
- im Watch-Modus neue/geaenderte `.cue`-Dateien erkennen
- CUE-Tracks aus `TRACK`, `TITLE`, `PERFORMER`, `FILE`, `INDEX 01` parsen
- doppelte Tracks innerhalb eines Zeitfensters entfernen
- Sidecars schreiben:
  - `<name>.tracks.json`
  - `<name>.mixcloud.txt`
  - optional zusaetzlich in `_mixcloud_tracklists`
- optional die zum CUE gehoerende WAV-Datei per ffmpeg nach MP3 konvertieren
- als Fallback AudD verwenden, wenn keine brauchbare CUE-Tracklist vorliegt

Die vorhandenen npm-Einstiege sind:

```powershell
npm run tracklist:auto -- --input "D:\Pfad\zum\CueOderOrdner"
npm run tracklist:watch -- --input "D:\Pfad\zum\CueOrdner"
npm run tracklist:normalize -- --input "D:\Pfad\tracklist.cue"
```

### 2. Import ins Flight Deck

Die Desktop-Pipeline in `desktop/main/services/pipeline.mjs` erkennt Tracklisten beim Set-Import. Die Prioritaet ist:

1. `.tracks.json`
2. `.mixcloud.txt`
3. `.cue`
4. `.txt` oder `.md`
5. `.json`
6. `.csv`

Wenn keine explizite Tracklist mitgegeben wird, sucht die Pipeline automatisch neben der Audio-Datei und in `_mixcloud_tracklists`. CUE-Sidecars werden bevorzugt, wenn eine CUE-Datei auf den Audio-Dateinamen verweist.

Die Datei wird robust dekodiert, inklusive UTF-8, UTF-16 LE/BE und BOM-Erkennung.

### 3. Parsing und Normalisierung

Die zentrale Website-/Desktop-Normalisierung liegt in `src/desktop/lib/setManifest.js`.

`parseTracklistText()` verarbeitet:

- JSON mit `tracks`
- CUE-Dateien
- Pipe/Tab/Semikolon/CSV-Tabellen mit Header
- Textzeilen mit fuehrender Zeit, z. B. `00:00 Artist - Title`
- Mixcloud-nahe Zeilen mit trailing time, z. B. `Artist - Title - 00:10:42`

`sanitizeTrack()` repariert typische Rekordbox-/Set-Performer-Probleme, z. B. wenn der Set-Name statt des Track-Artists als Performer auftaucht. Ungueltige oder nicht seekbare Zeilen werden verworfen.

### 4. Publish und Ausgabe

Beim Publish wird der Draft in `musicSets.js` serialisiert. Die Website rendert nur Tracklisten mit gueltigen Zeitstempeln. Dadurch werden alte oder schlecht importierte Tracklisten mit leerem `time` nicht als klickbare Tracklist angezeigt.

Bei `Alles ausfuehren & Live` blockiert die Pipeline den Live-Publish, wenn `requireTracklistForLive` aktiv ist und keine seekbare Tracklist vorhanden ist.

## Beobachtete Probleme

1. Parser-Logik ist doppelt vorhanden: Das CUE-Skript und `setManifest.js` parsen und normalisieren Tracks jeweils eigenstaendig.
2. Das Ausgabeformat ist nicht als eigene kanonische Datenstruktur definiert. Es gibt JSON-Sidecars, Mixcloud-Text, Pipe-Text und Manifest-Objekte, aber keinen klaren gemeinsamen Vertrag.
3. Alte Manifest-Eintraege enthalten Track-Zeilen ohne Zeitstempel. Die aktuelle Website blendet sie aus, aber die Datenqualitaet im Manifest bleibt uneinheitlich.
4. Die Dokumentation nennt teilweise nur TXT/CSV/JSON, obwohl die produktive Logik auch `.cue`, `.md`, `.mixcloud.txt` und `.tracks.json` unterstuetzt.
5. Batch-Import und Watcher sind technisch getrennt. Fuer einzelne Releases funktioniert das, fuer groessere CUE-Uebergaben fehlt ein sichtbarer Qualitaetsstatus pro Datei.

## Besserer Zielansatz

Der bessere Ansatz ist eine Pipeline mit einem einzigen kanonischen Tracklist-Modell. CUE bleibt unveraendertes Rohmaterial. Alle weiteren Ausgaben werden aus einer geprueften JSON-Zwischenform erzeugt.

### Kanonisches Modell

```json
{
  "schema": "airdox.tracklist.v1",
  "sourceFile": "D:\\Recordings\\REC-2026-05-02.cue",
  "audioFile": "D:\\Recordings\\REC-2026-05-02.wav",
  "createdAt": "2026-05-03T00:00:00.000Z",
  "tracks": [
    {
      "index": 1,
      "startSeconds": 0,
      "time": "00:00:00",
      "artist": "Martin Books",
      "title": "Turn (Original Mix)",
      "sourceFile": "G:\\Tracks\\Martin Books - Turn.mp3",
      "confidence": 1,
      "flags": []
    }
  ],
  "validation": {
    "status": "pass",
    "errors": [],
    "warnings": []
  }
}
```

Aus diesem Modell entstehen alle Zielformate:

- Manifest: nur `{ time, artist, title }`
- Mixcloud: `Artist - Title - HH:MM:SS`
- Review-Datei: `time | artist | title`
- Audit: Validierungsbericht mit Fehlern/Warnungen

### Ziel-Workflow

1. Uebergabe
   - Original-CUE, Original-Audio, optional Cover in einem Release-Ordner sammeln.
   - Rohdateien nicht veraendern.

2. Ingest
   - Dateien erkennen: Audio, CUE, Cover, vorhandene Sidecars.
   - Checksums, Groesse, Dauer und Dateipfade erfassen.
   - Encoding der CUE-Datei dekodieren.

3. Parse
   - CUE in das kanonische Modell parsen.
   - Artist/Title bevorzugt aus `PERFORMER`/`TITLE` lesen.
   - Falls `PERFORMER` nur den Set-Namen enthaelt, Artist/Title aus `FILE` oder `TITLE` ableiten.
   - Wenn keine CUE vorhanden ist: `.tracks.json`, `.mixcloud.txt`, Pipe-Text oder AudD-Fallback verwenden.

4. Validate
   - Zeitstempel muessen parsebar, seekbar und aufsteigend sein.
   - Trackzeiten duerfen nicht ausserhalb der Audiodauer liegen.
   - Artist/Title duerfen nicht leer sein.
   - Platzhalter wie Set-Name, `Unknown Artist`, zu lange Wiederholungen oder kaputte Felder werden geflaggt.
   - Doppelte Tracks innerhalb eines konfigurierten Zeitfensters werden erkannt.

5. Normalize
   - Zeit immer als `HH:MM:SS`.
   - Whitespace bereinigen.
   - Pipe-Zeichen in Textfeldern ersetzen.
   - Set-Performer reparieren.
   - Dedupe-Regeln anwenden.

6. Review
   - Flight Deck zeigt Validierungsstatus, Trackanzahl, Fehler und Warnungen.
   - Bei `pass` darf der Import direkt weiter.
   - Bei `warning` ist manuelle Freigabe moeglich.
   - Bei `fail` wird Live-Publish blockiert.

7. Export
   - `.tracks.json` als kanonische Quelle schreiben.
   - `.mixcloud.txt` fuer Mixcloud schreiben.
   - `.clean.tracklist.txt` fuer schnelle menschliche Kontrolle schreiben.
   - Optional MP3 aus WAV erzeugen.

8. Publish
   - Flight Deck importiert bevorzugt die kanonische `.tracks.json`.
   - Manifest wird nur aus validierten Tracks geschrieben.
   - Audio wird hochgeladen, Build/Deploy laufen, Live-Bundle wird auf Set- und Track-Tokens geprueft.

9. Archiv
   - Roh-CUE, Audio-Hinweis, kanonisches JSON, Mixcloud-Text, Review-Text und Validierungsreport bleiben im Release-Ordner.

## Empfohlene Umsetzung im Code

Umgesetzter Stand:

- Gemeinsames Core-Modul: `src/desktop/lib/tracklistCore.js`
- Flight-Deck-Draft/Manifest nutzt das Core-Modul ueber `src/desktop/lib/setManifest.js`
- Tracklist-CLI nutzt dasselbe Core-Modul in `scripts/generate-mixcloud-tracklists.mjs`
- Normalize-CLI schreibt Review-Dateien ueber denselben Exporter in `scripts/normalize-tracklist.mjs`
- Validierung wird als `tracklistValidation` am Draft gefuehrt und als Import-Warnung ausgegeben

1. Gemeinsames Modul einziehen
   - Neue Datei z. B. `src/desktop/lib/tracklistCore.js`.
   - Enthalten: CUE-Parser, Timestamp-Normalisierung, Sanitizer, Validator, Exporter.
   - `scripts/generate-mixcloud-tracklists.mjs` und `setManifest.js` verwenden dieses Modul statt eigener Parallel-Logik.

2. `.tracks.json` zum einzigen produktiven Zwischenformat machen
   - CUE und Mixcloud-Text bleiben Import-/Exportformate.
   - Flight Deck nimmt fuer Live bevorzugt validierte `.tracks.json`.

3. Validierungsreport sichtbar machen
   - Set Import: Status `pass`, `warning`, `fail`.
   - Batch Import: Status pro Release-Ordner.
   - Fehlertexte konkret: fehlende Zeit, nicht monotone Zeiten, leere Felder, Audio-Dauer-Konflikt.

4. Altbestand bereinigen
   - Bestehende `musicSets.js`-Eintraege mit `time: ''` nicht weiter mitschleppen.
   - Wenn keine Zeit rekonstruierbar ist, Tracklist aus dem Manifest entfernen und als Review-Aufgabe markieren.

5. Dokumentation aktualisieren
   - Unterstuetzte Formate in `docs/WINDOWS_FLIGHTDECK.md`, `docs/FLIGHT_DECK_TUTORIAL.md` und `docs/ADMIN_SUITE_GUIDE.md` angleichen.
   - Produktiver Standard: `.tracks.json`.

## Operativer Standardablauf ab sofort

Fuer einzelne Sets:

```powershell
npm run tracklist:auto -- --input "D:\Incoming\REC-2026-05-02\REC-2026-05-02.cue"
```

Danach im Flight Deck Audio, Cover und die erzeugte `.tracks.json` oder `.mixcloud.txt` gemeinsam importieren. Der Draft muss eine Trackanzahl groesser 0 und seekbare Zeiten anzeigen.

Fuer laufende Rekordbox-Uebergaben:

```powershell
npm run tracklist:watch -- --input "D:\Incoming\RekordboxExports"
```

Der Watcher schreibt Sidecars neben die CUE-Datei. Beim spaeteren Audio-Import findet das Flight Deck diese Dateien automatisch.

Fuer manuelle Kontrolle:

```powershell
npm run tracklist:normalize -- --input "D:\Incoming\REC-2026-05-02\REC-2026-05-02.tracks.json"
```

Die erzeugte `.clean.tracklist.txt` ist die einfache Review-Fassung.

## Definition of Done

Ein automatisierter Tracklist-Lauf ist fertig, wenn:

- Original-CUE unveraendert archiviert ist
- kanonische `.tracks.json` erzeugt wurde
- Validierung `pass` oder bewusst freigegebenes `warning` meldet
- Trackzeiten seekbar und aufsteigend sind
- Mixcloud-Text erzeugt wurde
- Flight-Deck-Draft die erwartete Trackanzahl zeigt
- Live-Publish nicht wegen Tracklist-Qualitaet blockiert
- Website nach Deploy klickbare Tracklistenpunkte zeigt
