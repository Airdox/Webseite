# AIRDOX Corporate Design

Stand: 2026-05-02

## Ziel

AIRDOX muss in jedem Medium sofort wiedererkennbar sein.
Das gilt explizit fuer:

- Website
- Social Assets
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
- Social-Live und PDF-Live bleiben freigabepflichtig durch persoenliches Nutzer-OK.
