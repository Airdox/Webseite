# TikTok Direct Post Status - 2026-06-25

## Kurzfassung

Der AIRDOX-Code ist fuer automatisches TikTok-Live-Posting vorbereitet, aber TikTok gibt der App aktuell keinen `video.publish`-Zugriff.

Was funktioniert:

- OAuth mit `video.upload`.
- API-Upload in TikTok Inbox/Draft.
- Rendering eines 9:16-Reels fuer das Set vom 21.06.2026.
- Technischer Direct-Post-Code im Skript `scripts/social-tiktok-publish.mjs`.

Was noch nicht funktioniert:

- Vollautomatisches Live-Posting ohne manuelles Oeffnen in TikTok.

## Warum nicht?

TikTok unterscheidet zwei Berechtigungen:

- `video.upload`: Die App darf ein Video an TikTok senden. Danach landet es in der TikTok-Inbox oder als Draft und muss in TikTok manuell abgeschlossen werden.
- `video.publish`: Die App darf ein Video direkt live posten.

Der aktuelle Token enthaelt nur:

```text
user.info.basic,video.upload
```

Beim Versuch, TikTok mit `video.publish` neu zu autorisieren, zeigt TikTok selbst eine Fehlermeldung zu `scope`. Das bedeutet in normaler Sprache: Die App darf diesen Haken noch nicht anfragen. Entweder ist Direct Post im TikTok Developer Portal nicht aktiviert, oder die Review-Freigabe gilt nur fuer Upload/Draft und nicht fuer Direct Post.

## Was im TikTok Developer Portal geprueft werden muss

1. App oeffnen.
2. Produkt `Content Posting API` pruefen.
3. Sicherstellen, dass `Direct Post` aktiviert ist, nicht nur `Upload`.
4. Unter Scopes/Freigaben pruefen, ob `video.publish` approved ist.
5. Falls `video.publish` nicht approved ist: Review fuer Direct Post / `video.publish` einreichen oder nachreichen.
6. Danach lokal neu autorisieren:

```powershell
npm run social:tiktok:oauth:init:direct
```

Nach erfolgreichem OAuth muss der neue Token bei `npm run social:tiktok:check` diesen Scope zeigen:

```text
video.publish
```

Erst dann kann `npm run social:tiktok:publish` echte Live-Posts automatisiert ausfuehren.

## Aktueller Test vom 21.06.-Reel

Reel:

```text
docs/agent-system/social-auto-output/recording-2026-06-21-5/recording-2026-06-21-5-teaser-3537.mp4
```

TikTok Inbox Upload:

```text
publishId: v_inbox_file~v2.7655086788247685142
status: SEND_TO_USER_INBOX
```

Das Video ist bei TikTok angekommen, aber es ist kein Live-Post.

## Automatisierter Live-Post, sobald `video.publish` da ist

Nach Freigabe und Re-OAuth:

```powershell
npm run social:tiktok:check:init
npm run social:tiktok:publish -- --video="docs/agent-system/social-auto-output/recording-2026-06-21-5/recording-2026-06-21-5-teaser-3537.mp4" --caption="FETE DE LA MUSIQUE #5 - ALFRED HEINRICHS. Full set on AIRDOX.INFO. #AIRDOX #BerlinTechno #UndergroundTechno #TechnoDJ #LiveSet" --privacy=PUBLIC_TO_EVERYONE --confirm-approved --poll
```

Die `--confirm-approved`-Sperre ist absichtlich eingebaut: Sie verhindert, dass ein Agent versehentlich ohne konkrete Freigabe live postet.
