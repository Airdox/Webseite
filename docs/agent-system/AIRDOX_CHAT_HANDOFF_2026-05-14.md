# AIRDOX Chat Handoff - 2026-05-14

Diese Datei fasst den aktuellen Stand aus dem Chat zusammen, damit ein neuer Chat ohne erneute Erklaerung weiterarbeiten kann.

## Ziel des Users

AIRDOX ist ein kleiner Berliner Underground-Techno-DJ. Gewuenscht ist ein moeglichst kostenloser, einfacher und automatisierter Ablauf:

1. Neues Set lokal/auf der Website verfuegbar machen.
2. Social-Clips automatisch erzeugen.
3. YouTube automatisch bespielen.
4. Instagram/Facebook/TikTok spaeter, sobald offizielle Credentials sauber verfuegbar sind.

Wichtig: Alle Sets liegen lokal vor. Fuer YouTube soll deshalb nicht zuerst aus R2 oder vom Website-Stream heruntergeladen werden. Korrekte Zielrichtung:

```text
lokale MP3 -> lokale MP4 mit Cover bauen -> MP4 zu YouTube hochladen -> Playback beweisen
```

YouTube akzeptiert keine reine MP3 als normales Video. Es muss eine Videodatei hochgeladen werden, z. B. Coverbild + Audio als MP4.

## Manni / Social-Reach-Ops

Manni wurde als Unteragent losgeschickt, aber nur fuer freigegebene Operationen.

Freigegeben:

- `OPS-IG-01`
- `OPS-FB-01`
- `OPS-IG-02`
- `OPS-FB-02`
- `OPS-COLL-01`

Ausgeschlossen:

- `OPS-BOOST-01` bleibt `rejected`. Kein Boost, kein Budget, keine Paid-Aktivierung.

Relevante Dateien:

- `docs/agent-system/MANNI_PR_SOCIAL_REACH_OPS_2026-05-13.md`
- `docs/agent-system/MANNI_MANUAL_PLATFORM_HANDOFF_2026-05-13.md`
- `docs/agent-system/DECISION_LOG.md`
- `docs/agent-system/manni-approval-state.json`
- `docs/agent-system/latest-job-run.md`

Es gibt keine Social-Publishing-Credentials fuer Meta/TikTok im Repo. Deshalb wurden fuer diese Plattformen nur lokale Handoff-/Manual-Publish-Artefakte erstellt.

## Erzeugte Social-Automation

Neu angelegte Scripts:

- `scripts/social-auto-publisher.mjs`
- `scripts/social-youtube-oauth-init.mjs`
- `scripts/social-youtube-publish.mjs`
- `scripts/verify-youtube-playback.mjs`

Neue oder angepasste NPM Scripts in `package.json`:

```json
"social:auto": "node scripts/social-auto-publisher.mjs",
"social:auto:dry": "node scripts/social-auto-publisher.mjs --skip-render",
"social:run": "npm run social:auto && npm run social:youtube:publish -- --privacy=unlisted",
"social:youtube:oauth:init": "node scripts/social-youtube-oauth-init.mjs",
"social:youtube:publish": "node scripts/social-youtube-publish.mjs",
"social:youtube:publish:short": "node scripts/social-youtube-publish.mjs --mode=short",
"social:youtube:dry": "node scripts/social-youtube-publish.mjs --dry-run",
"social:youtube:verify": "node scripts/verify-youtube-playback.mjs"
```

Dokumentation:

- `docs/agent-system/AIRDOX_FREE_SOCIAL_AUTOMATION.md`

## Aktuelles Test-Set

Website-/Repo-Set:

- Set ID: `recording_2026_05_07-2`
- Titel: `LIVE SET MAY 2026 #2`
- Datei laut `src/data/musicSets.js`: `recording_2026_05_07-2.mp3`
- Hook: `00:17:58`
- Track am Hook: `Rene Bourgeois - Face2Face With My Demon (Original Mix)`

Social-Ausgabeordner:

```text
docs/agent-system/social-auto-output/recording-2026-05-07-2/
```

Erzeugte und valide Short-/Clip-Dateien:

- `recording-2026-05-07-2-story-hook-1078.mp4` (15s)
- `recording-2026-05-07-2-teaser-1078.mp4` (30s)
- `recording-2026-05-07-2-59s-reel-1078.mp4` (59s)
- `captions.json`
- `manifest.json`
- `upload-copy-paste.md`

Problematische Datei:

- `recording-2026-05-07-2-full-set-youtube.mp4`
- Aktueller Stand laut `ffprobe`: ungueltig / `moov atom not found`
- Dateigroesse zuletzt ca. 110 MB bzw. spaeter 0 Byte nach abgebrochenem Lauf
- Diese Datei darf nicht als Beweis fuer ein komplettes Set gelten.

R2-Cache-Datei aus spaeterem Versuch:

- `recording-2026-05-07-2-full-set-audio-cache.mp3`
- Groesse zuletzt ca. 470 MB
- User hat klargestellt: R2 ist fuer YouTube nicht noetig, weil lokale MP3s vorhanden sind.

## YouTube OAuth Status

YouTube OAuth wurde erfolgreich eingerichtet.

Gesetzte User-Umgebungsvariablen:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

Werte stehen in der Windows User-Environment. Nicht in diese Datei schreiben.

Es gab im Chat kurz eine versehentliche Offenlegung von Client Secret und Refresh Token. Danach wurde ein neuer OAuth Client bzw. neuer Token erzeugt und per `setx` gesetzt. Im neuen Chat keine Secrets erneut ausgeben.

OAuth-Init Script:

```powershell
npm run social:youtube:oauth:init
```

Upload Script:

```powershell
npm run social:youtube:publish
```

## YouTube Uploads im Chat

Erfolgreiche Short-/59s-Uploads:

- `https://www.youtube.com/watch?v=IcI5-pQt7E4`
- `https://www.youtube.com/watch?v=iKKDjcEQs_I`

Full-Set-Upload-Versuche:

- `https://www.youtube.com/watch?v=Y2t0ToiwIwI`
- `https://www.youtube.com/watch?v=a9VNsGvWtDs`

Diese Full-Set-Versuche sind nicht als Erfolg zu werten. Im Studio war das Video sichtbar, aber die Watch-Seite zeigte `Dieses Video ist nicht mehr verfuegbar` bzw. Sichtbarkeit `Unbekannt`. Copyright-Ansicht war gruener Status, also wahrscheinlich kein Content-ID-Block. Wahrscheinlich wurde eine ungueltige/halbfertige MP4 hochgeladen.

Wichtige Erkenntnis: Die Upload-API-Antwort `status: uploaded` beweist nur, dass YouTube etwas angenommen hat. Sie beweist nicht, dass ein vollstaendiges, abspielbares Set online ist.

## Aktueller Codezustand / Problem

`scripts/social-youtube-publish.mjs` wurde mehrfach erweitert:

- Standard-Mode ist inzwischen `full-set`.
- Es kann `--audio-path` nutzen.
- Es kann bei fehlender lokaler Quelle R2 als Fallback nutzen.
- Es prueft Full-Set-Dateien mit `ffprobe`.
- Es verweigert Upload bei offensichtlich unbrauchbarer Full-Set-MP4.

Aber: Der richtige finale Workflow ist noch nicht sauber fertig, weil der User klargestellt hat:

```text
Alle Sets liegen lokal vor. YouTube soll lokale MP3s verwenden.
```

Naechste technische Aufgabe:

1. Lokale Audio-Bibliothek konfigurieren, z. B. `AIRDOX_LOCAL_AUDIO_DIR`.
2. `social-youtube-publish.mjs` so umbauen, dass es das aktuelle Set aus `manifest.json` oder `src/data/musicSets.js` nimmt.
3. Die passende lokale MP3 automatisch findet.
4. R2 und Website-Stream fuer YouTube nicht mehr als Primaerquelle verwenden.
5. Full-Set-MP4 neu bauen und mit `ffprobe` validieren.
6. Erst danach Upload.
7. Danach `verify-youtube-playback.mjs` laufen lassen und Screenshot erzeugen.

## Lokaler MP3-Pfad aus Skill/Workflow-Kontext

Bekannter lokaler Pfad fuer das aktuelle Set aus dem AIRDOX-Reel-Workflow:

```text
D:\Neuer Ordner (2)\140-Airdox\Unknown Album(3)\01 REC-2026-05-07.mp3
```

Ebenfalls bekannt:

```text
D:\Neuer Ordner (2)\140-Airdox\Unknown Album(3)\01 REC-2026-05-07.wav
```

Aber `src/data/musicSets.js` nennt fuer `recording_2026_05_07-2` die Website-Datei:

```text
recording_2026_05_07-2.mp3
```

Deshalb muss der naechste Chat klaeren oder automatisch mappen:

- Website-Dateiname `recording_2026_05_07-2.mp3`
- Lokale Quelldatei `01 REC-2026-05-07.mp3`

Wenn beide inhaltlich nicht identisch sind, muss die lokale Datei genommen werden, die wirklich dem Website-Set entspricht.

## Playback-Beweis / Screenshot

Script angelegt:

```text
scripts/verify-youtube-playback.mjs
```

Ziel:

```powershell
npm run social:youtube:verify -- --video-id=<YouTubeId>
```

Es soll:

- YouTube Watch-Seite mit Playwright oeffnen
- auf Videoelement warten
- Playback starten
- `currentTime > 1.5` pruefen
- Screenshot speichern unter:

```text
docs/agent-system/proof/youtube-playback-<videoId>.png
```

Der Beweis wurde noch nicht erfolgreich erbracht, weil der lange Upload/Verify-Lauf vom User abgebrochen wurde und die Full-Set-MP4 vorher nicht valide war.

## Was im neuen Chat als erstes getan werden sollte

1. Nicht weiter mit R2/Website-Stream als primaerer YouTube-Quelle arbeiten.
2. Lokale MP3 automatisch finden oder `--audio-path` direkt nutzen.
3. Kaputte Full-Set-MP4 loeschen:

```powershell
Remove-Item -LiteralPath "docs/agent-system/social-auto-output/recording-2026-05-07-2/recording-2026-05-07-2-full-set-youtube.mp4" -Force -ErrorAction SilentlyContinue
```

4. Full-Set-MP4 aus lokaler MP3 bauen.
5. Mit ffprobe pruefen:

```powershell
ffprobe -hide_banner -loglevel error -show_entries format=duration,size -of json "docs/agent-system/social-auto-output/recording-2026-05-07-2/recording-2026-05-07-2-full-set-youtube.mp4"
```

Erwartung:

- Dauer deutlich ueber 2 Stunden
- Groesse plausibel gross
- kein `moov atom not found`

6. Upload erst danach starten.
7. Playback-Screenshot erzeugen und dem User als Beweis geben.

## Wichtige Vorsicht

Keine Browser-Cookies auslesen. Keine Session-Cookies/Tokens abgreifen. Es wurde bewusst auf offizielle OAuth-Tokens gesetzt.

Keine Secrets in Markdown, Git, Chat oder Screenshots schreiben.

## Kurzfazit

Fertig:

- Manni-Dispatch begrenzt auf freigegebene Ops
- Social-Clip-Erzeugung fuer 15s/30s/59s
- YouTube OAuth eingerichtet
- YouTube Short/59s Upload funktioniert
- Scripts fuer Publish und Playback-Verify existieren

Noch offen:

- Robuster Full-Set-Upload aus lokaler MP3
- Abspielbarer YouTube-Link fuer komplettes Set
- Screenshot-Beweis vom laufenden YouTube-Video
