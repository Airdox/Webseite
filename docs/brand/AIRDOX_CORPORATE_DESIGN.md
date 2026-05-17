# AIRDOX Corporate Design

Stand: 2026-05-02

## Ziel

AIRDOX muss in jedem Medium sofort wiedererkennbar sein.
Das gilt explizit fuer:

- Website
- Social Assets
- Manni-Reels, Stories und PR-Kampagnen-Assets
- EPK
- PDF-Dokumente

## Marken-Signale (nicht verhandelbar)

1. Name:
- AIRDOX immer in Versalien schreiben.

2. Kernfarben:
- Primary Background: `#050608`
- Surface: `#0f141a`
- Accent Cyan: `#00f0ff`
- Accent Lime: `#9adf6b`
- Text Primary: `#f5f8ff`
- Text Muted: `#9aa6b2`

3. Typografie:
- Headlines: `Inter, Arial, sans-serif` (700)
- Body: `Inter, Arial, sans-serif` (400/500)
- Tracking neutral, keine verspielten Display-Fonts.

4. Bildsprache:
- Techno/Underground, kontraststark, dunkle Basis mit klaren Neon-Akzenten.
- Keine warmen/beigen Corporate-Flaechen.

5. Tonalitaet:
- Praezise, direkt, club-/performance-orientiert.
- Keine generischen Marketing-Floskeln.

## PDF-Regeln

Jedes AIRDOX-PDF muss:

- AIRDOX-Header mit Brandline tragen.
- Brandfarben und Schriftdefinitionen aus den Tokens verwenden.
- Footer mit Website + Kontakt + Datum enthalten.
- Einen konsistenten Grid-/Spacing-Rhythmus nutzen.
- Als Quelle auf `docs/brand/airdox-brand-tokens.json` verweisen.

## Social-/Reel-Regeln

Jeder von Manni erzeugte Reel-, Story- oder PR-Social-Output muss vor externer Ausspielung durch Designer geprueft und bei Bedarf ueberarbeitet werden.

Pflichtkriterien:

- 9:16-Format mit sauberer Safe Area fuer Instagram/Facebook/TikTok-UI.
- Dunkle AIRDOX-Basis, kein warmer Corporate-Look.
- Website-nahe Signale: Schwarz/Anthrazit, Neon-Cyan, Pink-Akzent, klare Kanten, technische Labels, kontraststarke Typografie.
- AIRDOX in Versalien sichtbar.
- Hook maximal zwei Zeilen oder klar getrennte Wortbloecke.
- CTA darf nicht im unteren UI-Bereich verdeckt werden.
- Keine internen Hinweise wie `draft`, `pending`, `approval` im sichtbaren Asset.
- Export als H.264/AAC MP4 und optional Preview-PNG.

Kuenstlerische Pflichtkriterien:

- Reel-/Story-Assets duerfen nicht nur statisch sein. Mindestens eine sichtbare Motion- oder Audio-Reaktivitaetsidee ist Pflicht.
- Bevorzugte Motion-Signaturen: Equalizer, Waveform, VU-Meter, Beat-Pulse, Scanline-Sweep, Glitch-Hit, Kinetic-Type-Hit, Parallax-Still oder Light-Gate.
- Designer prueft verwendbare Stills aus Website, Cover, Preview-Frames, EPK oder Quellvideo und inszeniert sie mit Crop, Maske, Tiefenebene, Farbpass oder Beat-Reveal.
- Ein unveraenderter Screenshot oder ein reiner Text-Frame gilt als `creative_static_risk` und muss ueberarbeitet werden.
- Fuer relevante Reels muss Designer mindestens drei Richtungen denken: `signal_system`, `club_still_parallax`, `glitch_type_drop`.

Aktueller Designer-Handoff:

- Manni liefert Rohidee, Caption, Hook, CTA und Audio-/Clip-Quelle.
- Designer erstellt oder ueberarbeitet die CD-konforme Reel-Datei.
- Manni nutzt nur die Designer-gepruefte Version fuer Upload/Entwurf in Meta Business Suite.

## Vorlagenpflicht fuer Agenten

Designer soll nicht nur Einzelassets korrigieren, sondern wiederverwendbare Vorlagen erarbeiten, die spaeter anderen Agenten als verbindliche Grundlage dienen.

Pflichtvorlagen:

- Reel-Template fuer Drop-/Peak-Momente.
- Reel-Template fuer Transition-/Breakdown-Erklaerungen.
- Story-Template fuer `PRESSURE TEST`, `FULL SET ONLINE`, `BOOKING / EPK`.
- Thumbnail-/First-Frame-Template fuer Social Feeds.
- EPK-/Booking-CTA-Template fuer Manni und Webbie.
- Kurzbriefing-Template fuer Manni, damit Copy, Hook, CTA, Asset-ID und Ziel-URL immer im gleichen Format geliefert werden.

Jede Vorlage muss enthalten:

- Zweck und Einsatzfall.
- Format und Safe-Area-Regeln.
- Farben, Typo, Abstaende und Akzentregeln aus den Brand-Tokens.
- Pflichttexte oder Platzhalter.
- Exportziel, z. B. MP4, PNG, HTML oder Markdown.
- Handoff-Regel: welcher Agent darf die Vorlage nutzen und welche Felder duerfen geaendert werden.

Vorlagen sollen in `docs/brand/templates/` oder in einem passenden Unterordner abgelegt werden. Wenn eine Vorlage noch nicht technisch als Datei existiert, muss Designer mindestens eine konkrete Spezifikation mit Platzhaltern, Beispieltext und Exportanforderung liefern.

## Umsetzungspfad

- Design-Vorlage: `docs/brand/templates/airdox-epk.template.html`
- Inhalt: `docs/brand/airdox-epk-content.json`
- Build-Skript: `scripts/build-airdox-epk.mjs`
- Output:
  - `public/epk/airdox-epk.html`
  - `public/epk/airdox-epk.pdf` (wenn PDF-Render erfolgreich)

## Governance

- Designer ist fuer visuelle Konsistenz zustaendig.
- Manni nutzt nur CD-konforme Assets fuer externe Ausspielung.
- Andere Agenten nutzen Designer-Vorlagen statt eigene Social-/Brand-Layouts zu erfinden.
- Social-Live und PDF-Live bleiben freigabepflichtig durch persoenliches Nutzer-OK.
