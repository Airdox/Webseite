# NotebookLM Artifact (bearbeitet): Wie Schallwellen zu viralen Reels werden

Stand: 2026-05-24

Quelle:
- Notebook: `81268d43-e9b3-4554-859d-ff4f05ab9719`
- Artifact (Audio): `c3daee2d-05ad-4948-a85a-dd51ac07c630`
- Titel: `Wie Schallwellen zu viralen Reels werden`

Lokaler Download:
- `docs/agent-system/research/notebooklm-artifacts/2026-05-24_Wie-Schallwellen-zu-viralen-Reels-werden.mp3`

Ziel dieser Notiz:
- Den NotebookLM-Output in umsetzbare Tasks fuer AIRDOX uebersetzen (Daumenkino-Lettering + 9:16 Shorts/Reels).

## 10 Kernaussagen (umsetzbar)

1. Audio muss als Steuer-Signal gedacht werden: Envelope/Peaks treiben Timing und Intensitaet, nicht reine "Deko".
2. Band-Splitting lohnt sich: Bass, Mitten, Hoehen getrennt mappen (z. B. Scale/Shake/Glow/Grain).
3. Beat/Onset Detection ist die robusteste Basis fuer harte Hits (Cut, Strobe, Letter-Lock).
4. Glattung ist Pflicht: schneller Attack, langsamer Decay verhindert "Zappeln" und wirkt physikalisch.
5. Definiere First/Last Frame: Chaos -> Lock -> Pulse (Logo lesbar "locked" am Ende jeder Micro-Sequenz).
6. Loops braucht man: organische Hintergrund-Loops ohne sichtbaren Sprung (fuer Stories/Reels-Backgrounds).
7. Style- und Motion-Entscheidungen trennen: erst Look fixieren, dann Bewegung; sonst driftet es.
8. Reproduzierbarkeit braucht Seed/Lock (fuer KI-Iterationen) und deterministische Parameter (fuer Node/ffmpeg).
9. Rendering darf die UI nicht blockieren: Offscreen/Worker (relevant fuer Flight Deck / Designer-Tab).
10. Post-Production automatisieren: Audio-Fade + kurzer Video-Fade-out fuer saubere Feed-Uebergaenge.

## 5 Prototypen (AIRDOX-Adaption)

1. The Bass Pulse (Draft, schnell entscheidbar)
- Ziel: AIRDOX als zentraler Hit; Kick treibt Scale/Pulse.
- Look: Daumenkino-Logo, sauberer Alpha-Cutout; minimaler Glow.
- Toolchain: Photoshop (Alpha) -> Node/ffmpeg (Render).
- Steps:
  1. Bass-Envelope approximieren (oder erstmal Vollband-RMS wie jetzt), glatten (Attack/Decay).
  2. Scale/Glow auf Envelope mappen, danach "Lock" fuer Lesbarkeit.
  3. 5s/15s Drafts exportieren, Contact-Sheet generieren.

2. Organic Mood Loop (Background-Loop)
- Ziel: wiederverwendbarer Loop-Background, der nicht billig wirkt.
- Look: organischer Noise/Ink, leichte Paper-Textur, Daumenkino-Logo als Overlay.
- Toolchain: Node (Noise/Shader oder CPU-Noise) -> ffmpeg.
- Steps:
  1. Loop-faehige Noise-Trajektorie (kreisfoermige Zeitprojektion) erzeugen.
  2. Mitten/Hoehen modulieren Hue/Grain.
  3. 2-3 Loop-Laengen (2s/3s/5s) exportieren.

3. The Logo Reveal (High-fidelity, wenn Richtung sitzt)
- Ziel: "Chaos wird Logo" Reveal als brand intro.
- Look: Partikel/Spray -> scharfes Daumenkino-Logo.
- Toolchain: Photoshop/AE (oder KI-Video Tool) -> Encoder.
- Steps:
  1. Startbild (abstrakt) + Endbild (Logo) festlegen.
  2. Motion so timen, dass der Lock exakt auf dem Peak sitzt.
  3. Export als 5-10s Segment, dann an AIRDOX Copy/CTA haengen.

4. Beat-Synced Cuts (Segment-Chain)
- Ziel: Hook in 1-2 Sekunden, dann mehrere Micro-Szenen auf Snares/Kicks.
- Look: wechselnde Texturen/Hintergruende, AIRDOX bleibt konstant als Anchor.
- Toolchain: Node/ffmpeg Segment-Renderer + Beat/Onset Markers.
- Steps:
  1. Onsets detektieren (oder manuell 3-6 Marker fuer Draft).
  2. Pro Segment nur 1 visuelle Idee; am Ende immer Logo-Lock.
  3. Segmente append/concat, 15s/30s Draft.

5. Synesthetic Glow (Audio-Driven "Air" und "Grit")
- Ziel: Hoehen/Transienten steuern Glow/Chromatic/Noise ohne Lesbarkeit zu killen.
- Look: sparsame RGB-Offsets + kurze Strobes, nur auf Hits.
- Toolchain: Node (Shader/Composite) oder AE (wenn fein).
- Steps:
  1. Hoehen-Indikator (z. B. Spektral-Centroid/Highband Energy) approximieren.
  2. Glow/Glitch nur bei Schwellenwerten triggern, mit Cooldown.
  3. Export mit konservativer Bitrate (keine matschigen Kanten).

## 9:16 Export/Timing (praxis)

- 1080x1920, 30fps (oder 60fps falls der Look davon lebt).
- Segment-Laengen:
  - 2-3s: Hook/Loop
  - 4-5s: Standard-Intro/Reveal
  - 10s: komplexere Morphs (besser in Segmente teilen)
  - 60s: Segment-Kette (concat)
- Safe-Area: Logo/Text zentriert halten; keine kritischen Infos in UI-Zonen.
- MP4/H.264 als Standard; WebM/VP9 nur wenn Alpha gebraucht wird (Overlays).

## Direkte Ableitung fuer unsere aktuelle Pipeline

Schon umgesetzt:
- Audio-Spine (Meter) aus echter Audio-Envelope im Draft-Renderer.

Als naechste sinnvolle, kleine Upgrades (ohne AE):
- Attack/Decay Envelope (asymmetrisch) statt simplem RMS-Lowpass.
- Onset/Peak Marker (3-6 hits) fuer Cuts/Letter-Locks.
- Optional: Band-Splitting (Bass vs High) via ffmpeg + zwei Envelopes (macht Mapping deutlich besser).

