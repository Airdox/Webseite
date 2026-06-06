# Meta Graph Publishing Setup

Ziel: AIRDOX Reels nach Freigabe reproduzierbar ueber die offizielle Meta Graph API veroeffentlichen, statt Meta Business Suite manuell oder per Browser-Automation zu bedienen.

## Prinzip

- Freigabe bleibt Pflicht.
- Das Reel-MP4 muss als direkte, oeffentlich abrufbare HTTPS-Datei vorliegen.
- Instagram Reels werden ueber Container-Publishing veroeffentlicht.
- Facebook Updates werden ueber den Page-Video-Endpunkt veroeffentlicht; Reels-spezifische Feineinstellungen koennen spaeter ergaenzt werden.
- Keine Login-Cookies oder Browser-Sessions als Dauerloesung speichern.

## Lokale Statuspruefung

```powershell
npm run social:meta:check
```

Erwartete Variablen:

```text
META_GRAPH_VERSION=v24.0
META_APP_ID=
META_APP_SECRET=
META_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
```

Secrets gehoeren in `.env.social.local`, `.env.local`, `.env` oder Windows-Benutzervariablen, nicht ins Repo.

## Schrittfolge: Daten holen

1. Meta Developer App erstellen oder bestehende AIRDOX-App nutzen.
2. Facebook Page `030 Airdox_bln` und Instagram Professional/Business Account in Meta Business Suite verbinden.
3. In der Meta App Publishing-Berechtigungen freischalten:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
4. Long-lived Page Access Token erzeugen.
5. `FACEBOOK_PAGE_ID` ermitteln.
6. `INSTAGRAM_BUSINESS_ACCOUNT_ID` ueber die verbundene Page ermitteln.
7. Alternativ den lokalen OAuth-Helfer verwenden:

```powershell
npm run social:meta:oauth:init -- --page-name="Airdox"
```

Der Helfer braucht vorher diese lokalen Werte:

```text
META_APP_ID=<meta-app-id>
META_APP_SECRET=<meta-app-secret>
```

Wenn die Meta App den lokalen Callback noch nicht kennt, diesen Redirect URI in der Meta App erlauben:

```text
http://127.0.0.1:53683/oauth/meta/callback
```

8. Werte lokal in `.env.social.local` eintragen:

```text
META_GRAPH_VERSION=v24.0
META_APP_ID=<meta-app-id>
META_APP_SECRET=<meta-app-secret>
META_PAGE_ACCESS_TOKEN=<long-lived-page-access-token>
FACEBOOK_PAGE_ID=<facebook-page-id>
INSTAGRAM_BUSINESS_ACCOUNT_ID=<instagram-business-account-id>
```

9. `npm run social:meta:check` ausfuehren, bis `ok: true` erscheint.

## Media-URL

Instagram akzeptiert keine lokale Datei. Das MP4 muss als direkter HTTPS-Link erreichbar sein, z. B. ueber Cloudflare R2 oder den bestehenden AIRDOX-Worker.

Aktuelles Reel:

```text
docs/agent-system/visual-templates/social/social-auto-output/recording-2026-05-24/pfingsten-full-set-now-on-youtube-instagram-facebook-reel-qr.mp4
```

Deploy-faehige Kopie:

```text
public/social/pfingsten-full-set-now-on-youtube-instagram-facebook-reel-qr.mp4
```

Nach Website-Deploy sollte die direkte URL lauten:

```text
https://airdox.info/social/pfingsten-full-set-now-on-youtube-instagram-facebook-reel-qr.mp4
```

## Instagram Publish

Dry-run:

```powershell
npm run social:meta:publish -- --platform=instagram --dry-run --video-url="<PUBLIC_MP4_URL>" --caption-file="docs/agent-system/visual-templates/social/social-auto-output/recording-2026-05-24/pfingsten-full-set-now-on-youtube-instagram-facebook-caption.md"
```

Live nach Freigabe:

```powershell
npm run social:meta:publish -- --platform=instagram --video-url="<PUBLIC_MP4_URL>" --caption-file="docs/agent-system/visual-templates/social/social-auto-output/recording-2026-05-24/pfingsten-full-set-now-on-youtube-instagram-facebook-caption.md"
```

## Facebook Publish

Dry-run:

```powershell
npm run social:meta:publish -- --platform=facebook --dry-run --video-url="<PUBLIC_MP4_URL>" --caption-file="docs/agent-system/visual-templates/social/social-auto-output/recording-2026-05-24/pfingsten-full-set-now-on-youtube-instagram-facebook-caption.md"
```

Live nach Freigabe:

```powershell
npm run social:meta:publish -- --platform=facebook --video-url="<PUBLIC_MP4_URL>" --caption-file="docs/agent-system/visual-templates/social/social-auto-output/recording-2026-05-24/pfingsten-full-set-now-on-youtube-instagram-facebook-caption.md"
```

Beide Kanaele nach Freigabe:

```powershell
npm run social:meta:publish -- --platform=both --video-url="<PUBLIC_MP4_URL>" --caption-file="docs/agent-system/visual-templates/social/social-auto-output/recording-2026-05-24/pfingsten-full-set-now-on-youtube-instagram-facebook-caption.md"
```

## Naechster Ausbau

- R2/Worker-Staging fuer `PUBLIC_MP4_URL` automatisieren, falls Website-Deploy fuer Social-MP4s zu langsam ist.
- Facebook Reels-spezifischen `video_reels` Flow ergaenzen, falls der Page-Video-Endpunkt nicht als Reel ausspielt.
- Ergebnis-URLs automatisch in `docs/agent-system/latest-social-post-ledger.json` und `DECISION_LOG.md` schreiben.
