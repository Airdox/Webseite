# AIRDOX Social Posting Pack

Stand: 2026-05-23
Set: SISSYGUT ALLES GUT
Hook-Fokus: 00:03:50-00:04:50 im Set-Einstieg; weitere Hook-Kandidaten unten
Landing URL: https://airdox.info/#set-recording_2026_05_02
Status: Kampagnenanker auf SISSYGUT ALLES GUT umgestellt, Veroeffentlichung nur nach persoenlichem OK

## Einordnung

TikTok prueft gerade nicht einzelne Posts, sondern die App-Berechtigung fuer API-Publishing. Die App `AIRDOX Social Publisher` ist im Review. Sandbox-OAuth funktioniert mit `user.info.basic`; Publishing-Scope/Direct Post ist noch nicht freigegeben.

Meta wurde bisher ueber Meta Business Suite gepostet/geplant. Diese Daten liegen nicht als lokale API-Credentials im Repo. Deshalb ist Meta kurzfristig ueber Business Suite am schnellsten produktiv.

YouTube-Credentials sind als Windows-Benutzervariablen vorhanden, aber der aktuelle Refresh Token ist abgelaufen/widerrufen. YouTube braucht einen erneuerten OAuth-Token, bevor API-Uploads wieder laufen.

## Asset-Dateien

- Audioquelle: `audio_processing/recording_2026_05_02_sissygut_alles_gut.mp3`
- Website-Datei: `recording_2026_05_02_sissygut_alles_gut.mp3`
- Existing Manni-Reel: `docs/agent-system/manni-reel-output/airdox-pressure-check-reel-cd-2026-05-13.mp4`
- Neuer Designpfad: Daumenkino/Portrait/Graffiti-Letter-Beat, Preview unter `docs/agent-system/social-auto-output/daumenkino-preview/mixed-graffiti-portrait/`

## Hook-Kandidaten fuer neue Clips

Prioritaet:

- 00:03:50-00:04:50 - primaerer 60s-Kampagnen-Hook fuer den ersten Reel/Short/Story-Teaser
- 00:28:53 - Rene Bourgeois - 4 My Recordz
- 00:36:14 - Dubfire - RibCage (Dense & Pika Remix)
- 01:02:24 - Skrillex, PEEKABOO, Fireboy DML, Flowdan - 6 Million
- 01:15:03 - DJ Hell - Suicide Commando
- 01:17:07 - Jody 6 - I Go Psycho
- 01:29:52 - Patrick Arbez - [UNRELEASED] Kickstart

Der erste neue Reel-Render soll nicht mehr das alte Webstyle-Layout nutzen, sondern das Daumenkino-Design: Gesicht bleibt unveraendert, Hintergrund wechselt beat-synchron, AIRDOX-Buchstaben werden einzeln im Takt in Neonpink, Neongruen und Cyan aktiviert.

On-Screen-Message:

```text
NEW SET ONLINE
SISSYGUT ALLES GUT
Hmm diesmal etwas schneller, aber trotzdem geil...
FULL SET ON AIRDOX.INFO
```

## Drei-Tage-Plan

### Tag 1 - Dienstag 17:00

Plattformen:

- Instagram Reel
- Facebook Reel
- TikTok Draft, falls Review noch offen
- YouTube Short, sobald YouTube OAuth erneuert ist

Asset:

`recording-2026-05-07-2-59s-reel-1078.mp4`

Caption:

```text
SISSYGUT ALLES GUT

Hmm diesmal etwas schneller, aber trotzdem geil...

Der Moment ab 03:50 zeigt genau die AIRDOX-Richtung: roh, direkt, treibend.

Full set on AIRDOX.INFO

#AIRDOX #BerlinTechno #UndergroundTechno #TechnoDJ #LiveSet #DJSet #TechnoReel
```

Ziel:

- Completion Rate
- Profilbesuche
- Klicks/Streams auf AIRDOX.INFO

### Tag 2 - Mittwoch 16:00

Plattformen:

- Instagram Story
- Facebook Story
- TikTok Draft/Story-Variante manuell

Asset:

`recording-2026-05-07-2-story-hook-1078.mp4`

Story-Text:

```text
SISSYGUT ALLES GUT
Hook at 03:50
Hmm diesmal etwas schneller, aber trotzdem geil...
AIRDOX.INFO
```

Caption/Sticker-Text:

```text
Hmm diesmal etwas schneller, aber trotzdem geil...
Set signal: early pressure from 03:50.
Full set on AIRDOX.INFO.
```

Ziel:

- Website-Reminder
- Set-Opens
- Audio-Plays

### Tag 3 - Donnerstag 18:00

Plattformen:

- Instagram Reel
- Facebook Reel
- TikTok Draft, falls Review noch offen
- YouTube Short, sobald YouTube OAuth erneuert ist

Asset:

`recording-2026-05-07-2-teaser-1078.mp4`

Caption:

```text
03:50 in SISSYGUT ALLES GUT.

Short clip here, full pressure on AIRDOX.INFO.

#AIRDOX #Techno #BerlinTechno #UndergroundTechno #DJSet #LiveSet
```

Ziel:

- Saves/Shares
- Profilbesuche
- zweite Chance fuer den gleichen Hook mit kuerzerem Clip

## Upload-Pfade je Plattform

### Meta Business Suite

Nutze die MP4-Dateien oben direkt in Meta Business Suite. Plane Dienstag 17:00, Mittwoch 16:00 und Donnerstag 18:00 Europe/Berlin. Fuer Tag 2 Story-Format waehlen.

### TikTok

Bis App-Review abgeschlossen ist: manuell oder als Draft vorbereiten. Nach Freigabe: API-Publishing anbinden, sobald `video.publish`/Direct Post verfuegbar ist.

### YouTube Shorts

Vor Upload muss YouTube OAuth erneuert werden, da der vorhandene Refresh Token `invalid_grant` liefert. Danach kann die 59s-Datei als Short verwendet werden.

## Freigabe

Keiner dieser Posts geht live ohne persoenliches OK. Bei OK bitte pro Asset bestaetigen:

- Plattform
- Asset
- Caption
- Uhrzeit
- Landing URL
