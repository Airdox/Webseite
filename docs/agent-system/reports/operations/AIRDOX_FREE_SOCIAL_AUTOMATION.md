# AIRDOX Kostenfreie Social-Automation

Ziel: ein kostenarmer Workflow fuer einen kleinen Berliner Underground-Techno-DJ.

## Befehl

Ausfuehren, nachdem ein neues Set in `src/data/musicSets.js` eingetragen wurde und die Audiodatei ueber die Website-API erreichbar ist:

```powershell
npm run social:auto
```

Ein-Befehl-Ablauf fuer Social-Paket plus YouTube-Full-Set-Verarbeitung als `unlisted`:

```powershell
npm run social:run
```

Der Befehl:

- waehlt das neueste `isNew`-Set aus `src/data/musicSets.js`
- nutzt den Website-Audiostream als Quelle der Wahrheit
- findet einen brauchbaren Hook-Moment und bevorzugt vorhandene Rene-Bourgeois-Marker
- rendert vertikale Social-Assets mit 15s, 30s und 59s
- rendert das YouTube-Full-Set-Video aus einer lokalen Audioquelle, nicht aus R2
- schreibt Captions, Hashtags und ein Manifest
- prueft, ob offizielle OAuth-Zugangsdaten vorhanden sind
- liest niemals Browser-Cookies oder Session-Tokens

## Ausgabe

Dateien werden hier geschrieben:

```text
docs/agent-system/visual-templates/social/social-auto-output/<set-id>/
```

Jeder Lauf erzeugt:

- `manifest.json`
- `captions.json`
- `upload-copy-paste.md`
- eine MP4 pro Social-Dauer
- eine Vorschau-PNG pro MP4
- eine Audio-Pruef-WAV pro MP4

## Social Post Ledger

Das Ledger nach Paketerstellung, manueller Veroeffentlichung oder API-Upload-Pruefung verwenden:

```powershell
npm run social:ledger:write
```

Der Befehl scannt `docs/agent-system/visual-templates/social/social-auto-output/**/manifest.json`, fuehrt bestaetigte Live-Post-Eintraege aus `docs/agent-system/social-post-ledger.json` zusammen und schreibt:

- `docs/agent-system/latest-social-post-ledger.json`
- `docs/agent-system/latest-social-post-ledger.md`

Bestaetigte Live-Posts gehoeren in `docs/agent-system/social-post-ledger.json` mit `packageId`, `platform`, `status`, `liveUrl`, `postedAt`, `asset` und `caption`. Das ist die Quelle der Wahrheit fuer "was wurde tatsaechlich gepostet?", bis jede Plattform funktionierenden Lese-/Schreibzugriff per API hat.

## Trockenlauf

Verwenden, wenn nur Metadaten und Captions erzeugt werden sollen:

```powershell
npm run social:auto:dry
```

Verwenden, wenn die YouTube-Full-Set-Quellenzuordnung ohne Rendering oder Upload geprueft werden soll:

```powershell
npm run social:youtube:dry -- --set-id=recording_2026_05_07-2
```

## YouTube-Full-Set-Pipeline

Der YouTube-Full-Set-Upload ist bewusst von den Social-Clips getrennt:

```text
resolve-source -> render-youtube-video -> validate-video -> upload-youtube
```

Regeln:

- Die Full-Set-Quellaudio muss lokal vorliegen. `AIRDOX_LOCAL_AUDIO_DIR` setzen oder `--audio-path=<file>` uebergeben.
- `recording_2026_05_07-2` verweist auf `D:\Neuer Ordner (2)\140-Airdox\Unknown Album(3)\01 REC-2026-05-07.mp3`.
- R2 und der Website-Stream werden nicht als YouTube-Full-Set-Quelle genutzt.
- Das Rendering schreibt `*.tmp.mp4`, validiert mit `ffprobe` und benennt danach atomar in `*-full-set-youtube.mp4` um.
- Das Encoding ist YouTube-taugliches MP4: H.264, AAC, 1080p, `yuv420p`, 48-kHz-Audio und Fast-Start-Metadaten.
- Der Upload nutzt YouTubes fortsetzbares Upload-Protokoll, damit grosse Videos nicht komplett in den Speicher geladen werden.

Nuetzliche Befehle:

```powershell
npm run social:youtube:dry -- --set-id=recording_2026_05_07-2
npm run social:youtube:render:test -- --set-id=recording_2026_05_07-2
npm run social:youtube:render -- --set-id=recording_2026_05_07-2
npm run social:youtube:validate -- --set-id=recording_2026_05_07-2
npm run social:youtube:publish -- --set-id=recording_2026_05_07-2 --privacy=unlisted
```

## Optionale Argumente

```powershell
npm run social:auto -- --set-id=recording_2026_05_07-2
npm run social:auto -- --start=00:17:58
npm run social:auto -- --durations=15,30,59
```

## Publishing-Gate

Der Workflow ist standardmaessig kostenfrei. Automatisches Publishing wird erst aktiviert, wenn offizielle OAuth-/API-Tokens in der Umgebung vorhanden sind:

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN

META_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
INSTAGRAM_BUSINESS_ACCOUNT_ID

TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
TIKTOK_REFRESH_TOKEN
```

Bis dahin ist das Paket veroeffentlichungsbereit, der Plattform-Upload bleibt aber manuell.

## Meta Business Suite Kopier-/Einfuegepaket

Fuer Meta-Arbeit ohne Budget ist die Standardausgabe ein manuelles Upload-Paket, kein direktes API-Publishing. Jeder freigegebene Meta-Draft soll enthalten:

- Zielplattformen: Instagram, Facebook, Threads, wenn sinnvoll
- finaler MP4- oder PNG-Pfad
- finale Caption je Plattform
- Hashtags und optionaler Text fuer den ersten Kommentar
- Landing-URL
- vorgeschlagener Posting-Zeitpunkt in Europe/Berlin
- KPI-Ziel
- Risiko-Notiz
- Nutzerfreigabezeile
- Eintragsvorlage fuer `social-post-ledger.json` mit Live-URL nach dem Posting

Erlaubter Standardablauf:

```text
social:auto -> Designer-Pruefung -> Manni/Guardian-Risiko-Notiz -> Nutzer-OK -> manuelle Planung in Meta Business Suite -> Ledger-Aktualisierung
```

Im kostenfreien Hobby-Workflow blockiert:

- Browser-Automation gegen Meta-Websites
- gespeicherte Login-Cookies oder Session-Tokens
- Scraping hinter Login
- automatische Likes/Follows, kalte Massen-DMs
- bezahlte Boosts oder Ads ohne separate ausdrueckliche Budgetfreigabe

Offizielles Meta-Graph-API-Publishing bleibt optional und startet erst, wenn das Setup in `docs/agent-system/reports/campaigns/META_GRAPH_PUBLISHING_SETUP.md` abgeschlossen ist.

## Aktueller Praxispfad

1. `npm run social:auto` verwenden, um das Paket automatisch zu erstellen.
2. `npm run social:youtube:dry` und `npm run social:youtube:render:test` verwenden, um Quellenzuordnung und visuelles Encoding zu pruefen.
3. `npm run social:youtube:publish -- --privacy=unlisted` verwenden, wenn YouTube-OAuth-Variablen konfiguriert sind und automatischer Upload gewuenscht ist.
YouTube-Verhalten: Standard ist Full-Set-Upload mit gebrandetem AIRDOX-Visual. `npm run social:youtube:publish:short -- --privacy=unlisted` nur verwenden, wenn explizit ein Short-Form-Reel-Upload gewuenscht ist.
4. Manuell zu Instagram/Facebook/TikTok hochladen, solange Meta-/TikTok-API-Zugriff blockiert ist.
5. Meta und TikTok spaeter ueber offizielle App-/OAuth-Flows ergaenzen.
