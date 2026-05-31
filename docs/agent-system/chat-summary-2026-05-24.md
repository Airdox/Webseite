# Chat Summary - 2026-05-24

## Ziel

Aufbau eines moeglichst automatisierten Social-Promotion-Workflows fuer AIRDOX, der Reels, Stories, TikTok-Clips und YouTube Shorts vorbereitet, dir als fertige Vorschau zeigt und erst nach deinem persoenlichen OK veroeffentlicht.

## Plattform- und Systemstatus

- Instagram/Facebook:
  Bisher praktisch ueber Meta Business Suite, keine sauberen lokalen API-Credentials im Projekt gefunden.
- TikTok:
  Developer App `AIRDOX Social Publisher` eingerichtet, Domain `airdox.info` verifiziert, Sandbox erstellt, OAuth vorbereitet, App im Review. Publishing ist noch durch TikTok-Freigabe blockiert.
- YouTube:
  OAuth erneuert, Upload-Skript korrigiert, damit `.env` Vorrang vor alten Windows-Umgebungsvariablen hat. Privater Testupload wurde erfolgreich ausgefuehrt.

## Agenten und Doku

- Social-Automation-Konzept und Agenten-/Job-Beschreibungen erweitert.
- Routing- und Job-Katalog angepasst, damit Social-Drafts, Freigaben und Plattform-Handoffs besser abgebildet werden.
- Posting-Pack fuer konkrete Ausspielung gepflegt.

## Kampagnenfokus

- Hauptset fuer die Promotion:
  `SISSYGUT ALLES GUT`
- Grund:
  Laut deiner Vorgabe repraesentiert dieses Set deinen Stil am besten.
- Set-Datei:
  `audio_processing/recording_2026_05_02_sissygut_alles_gut.mp3`
- Primaerer Promo-Ausschnitt:
  `03:50` bis `04:50`
- Subtitle:
  `Hmm diesmal etwas schneller, aber trotzdem geil...`

## Kernbotschaft fuer den Clip

Die bisherigen Visuals waren formal interessant, aber die Message war noch nicht klar genug. Deshalb wurde als Pflichtinhalt festgelegt:

- `NEW SET ONLINE`
- `SISSYGUT ALLES GUT`
- `FULL SET ON AIRDOX.INFO`

Ziel ist, dass sofort klar wird:

- dieses Set ist jetzt online
- es liegt auf deiner Website

## Visual-Entwicklung

### Fruhere Richtung

- Daumenkino-/Graffiti-/Portrait-Look aus dem Projektordner als Stilreferenz genommen.
- Erste GIF-/Preview-Varianten gebaut.
- Beat-synchrone Farbwechsel ausprobiert:
  invertierender Hintergrund, Schwarz/Weiss-Wechsel, Neonpink/Neongruen/Cyan.
- Danach Letter-Beat-Idee umgesetzt:
  einzelne Buchstaben von `AIRDOX` wechseln pro Takt farbig.

### Probleme

- Ausgangsmaterial aus GIF/JPG hatte zu viele weisse Artefakte.
- Freistellung von Gesicht, Augen und Haaransatz war unsauber.
- Hochgeladener Test-Short zeigte, dass die quadratische Komposition in 9:16 schlecht wirkt:
  zu viel Leerraum, unklare Lesbarkeit, visuell wie schlecht freigestellt.

### Umstellung auf saubere Quellen

- Portrait per Photoshop-Skript freigestellt:
  `portrait-cutout.png`
- Sauberen AIRDOX-Schriftzug aus dem Projekt verwendet:
  `public/brand-assets/daumenkino/airdox-graffiti-logo-clean.svg`
  plus PNG-Ableitung
- Danach Start einer neuen echten 9:16-Pipeline statt GIF brutal in Hochformat zu ziehen.

## Photoshop-Automation

- JSX-Skript erstellt, das das Portrait in Photoshop oeffnet, Motiv auswaehlt, Maske bildet und als transparentes PNG exportiert:
  `scripts/photoshop-export-portrait-cutout.jsx`
- Dieses PNG wurde erfolgreich erzeugt und spaeter in den Render-Pfad integriert.

## YouTube-Test

- 60s-Testvideo fuer den Clip `03:50-04:50` gerendert:
  `docs/agent-system/social-auto-output/daumenkino-preview/mixed-graffiti-portrait/sissygut-0350-letter-beat-youtube-test.mp4`
- YouTube-Refresh-Token war zuerst widerrufen.
- OAuth erneut durchgefuehrt.
- Upload-Skript gefixt.
- Privater Testupload erfolgreich:
  `https://www.youtube.com/watch?v=kpZvJcuIzZ0`
- Status:
  `private`

## Letzter Stand

- Die alte private YouTube-Testversion ist gestalterisch nicht gut genug und soll nicht die finale Richtung sein.
- Du hast zurecht kritisiert:
  weisse Artefakte stoeren massiv, Lesbarkeit ist zu schlecht, der Look wirkt sonst gewollt und schlecht umgesetzt.
- Deshalb ist der aktuelle Arbeitsstand:
  neue saubere vertikale 9:16-Version auf Basis von Photoshop-Cutout plus sauberem AIRDOX-Logo, ohne alte GIF-Artefakte.

## Wichtige Dateien

- Zusammenfassung:
  `docs/agent-system/chat-summary-2026-05-24.md`
- Posting-Pack:
  `docs/agent-system/SOCIAL_POSTING_PACK_2026-05-23.md`
- TikTok OAuth:
  `scripts/social-tiktok-oauth-init.mjs`
- YouTube OAuth:
  `scripts/social-youtube-oauth-init.mjs`
- YouTube Upload:
  `scripts/social-youtube-publish.mjs`
- Photoshop Portrait Export:
  `scripts/photoshop-export-portrait-cutout.jsx`
- Daumenkino Preview Workdir:
  `docs/agent-system/social-auto-output/daumenkino-preview/mixed-graffiti-portrait/`
