# AIRDOX Reel Playbook: Graffiti + Kinetic Type

Stand: 2026-05-24
Quelle: NotebookLM Research Notebook `AIRDOX Graffiti/Kinetic-Type Reels Research`

Ziel: Wiederholbare Production-Chain fuer Reels/Shorts, die nicht nach Standard-Font aussieht, aber in 9:16 sofort lesbar bleibt.

## Ergebnis zum Anschauen (heute)

Daumenkino-Schriftzug Idea Pack (statisch, 6 Varianten):

- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/contact-sheet.png`
- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/01-clean-white.png`
- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/02-neon-outline.png`
- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/03-sticker-slap.png`
- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/04-chalk-scratch.png`
- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/05-glitch-rgb.png`
- `docs/agent-system/social-auto-output/daumenkino-preview/daumenkino-logo-idea-pack/06-spray-mist.png`

Daumenkino-Prototypen (Motion, 5s, mit SISSYGUT-Audio ab 03:50):

- `docs/agent-system/social-auto-output/daumenkino-preview/sissygut-design-prototypes/airdox-block-assembly-5s.mp4`
- `docs/agent-system/social-auto-output/daumenkino-preview/sissygut-design-prototypes/airdox-daumenkino-wildstyle-5s.mp4`
- Preview/Contact: `docs/agent-system/social-auto-output/daumenkino-preview/sissygut-design-prototypes/sissygut-design-prototypes-contact.png`

## NotebookLM-Output (bearbeitet): Toolchains (praktisch)

Das Muster, das in der Praxis gewinnt: mehrere Tools, sauber getrennte Aufgaben:

1. Photoshop (Pflicht fuer AIRDOX-Qualitaet):
   - Masken, Freisteller, saubere Alpha-Exports (Logo + Portrait).
   - Textur/Noise/Brush-Look als Layer-Set.

2. Illustrator:
   - Wenn du Trim-Paths/Outline-Animationen willst: Vektorformen strukturieren, layern, sauber benennen.

3. After Effects (oder Cavalry als Alternative):
   - Komposition, Motion, Timing, Glows, Mask-Reveals, Write-on, Spray-Splatter, Glitch.
   - Audio-Sync (Waveform/Marker/Expressions).

4. Resolve/Fusion oder AE/Media Encoder:
   - Finishing, Exportvarianten, Upload-konforme Encodes.

5. TouchDesigner / Resolume:
   - Wenn Audio-reaktiv “echt” wirken soll (Live-Feeling, Strobe, Meter, schnelle Iteration).

6. Repo-Automation (fast, iterativ):
   - Node + ffmpeg fuer schnelle Drafts/Previews (5s/15s/30s/59s) ohne AE.
   - Ziel: sehr viele Varianten generieren, dann 1–2 in AE/PS “veredeln”.

Kurzregel:
- Fast-Iteration: Node/ffmpeg (Draft, viele Varianten).
- High-Fidelity: PS/AI/AE (wenige, richtig gute Varianten).
- Live/Reactive: TouchDesigner/Resolume (wenn “Club-Feeling” gewollt ist).

Toolchain-Matrix (praktische Auswahl):

| Ziel | Stack | Wann sinnvoll |
| --- | --- | --- |
| Fast (Draft) | PS (Alpha) -> Node/ffmpeg | Viele Varianten schnell vergleichen, “ja/nein” Entscheidungen treffen. |
| High-Fidelity | PS/AI -> AE -> Encoder | Wenn eine Richtung sitzt und “wow” wirklich sauber wirken muss. |
| Procedural | AI -> Cavalry (oder AE) | Pattern, Duplicators, geometrische Builds (Block-Assembly, Grid-Systeme). |
| Live/Reactive | TouchDesigner/Resolume | Wenn Audio-Reaktivitaet sichtbar “echt” sein soll, nicht keyframed. |

## AIRDOX: 12 Effekt-Rezepte (auf Daumenkino-Schriftzug)

Diese Rezepte sollen nicht “schön”, sondern “merkbar” sein. Alle basieren auf dem echten AIRDOX-Schriftzug aus `scratch/daumenkino-contact/`.

1. Write-on:
   - Strokes als Layer in AE oder als Procreate-Frame-Export.
   - Reveal pro Stroke, dann kurzer Glow-Hit.

2. Spray-Reveal:
   - Alpha vom Logo + Splatter/Threshold/Noise-Stack (AE) oder Textur-Masken (PS).

3. Sticker-Slap:
   - Logo als Stickerfläche, Page-Turn/Fold, Offset-Shadow, Paper-Lift.

4. Block-Assembly (nicht Standard-Font):
   - Logo als Segmente/Teile, Build-in auf Beat, danach “Lock”.

5. Kinetic-Type Hits:
   - Hook-Worte in 2–3 Hits (nicht gleichzeitig), AIRDOX als Hauptsignal.

6. Outline-Boil:
   - Jitter auf Outline (Posterize-Time / Turbulent Displace), wirkt “handgemacht”.

7. RGB-Glitch:
   - Micro-Channel-Split + kurze Scanline-Hits, sparsam nutzen.

8. Halftone/Posterize:
   - Choppy, stop-motion Feeling (6–12 fps Layer) nur auf Logo/Texture, nicht auf Copy.

9. Light-Gate:
   - Harte vertikale Lichtklappen + kurzer Strobe, der AIRDOX “einschaltet”.

10. Time-Slice:
   - Horizontale/vertikale Slices, kurz vor dem Drop, dann clean locken.

11. Parallax-Still:
   - Tiefenebenen (Background/Portrait/Logo), langsam pushen, dann Logo-Hit.

12. Audio-Reactive Spine:
   - Waveform-Spine oder 12–24 Bar Meter: nicht Dekoration, sondern Timing-Hilfe fuer Hits.

## Safe-Area / Lesbarkeit (AIRDOX-Regel, 9:16)

- AIRDOX muss in 9:16 auf dem ersten Blick erkennbar sein: gross, zentral, klarer Kontrast.
- Hook-Text max. 2 Zeilen; CTA darf nicht in UI-Zonen fallen.
- Nicht alles gleichzeitig animieren: erst Chaos, dann Lock, dann Pulse.

Praktische Layout-Regel (empfohlen, damit UI-Overlays nicht killen):
- Zentrale Safe-Zone: nur hier Text/Logo platzieren (keine Elemente “am Rand kleben”).
- Wenn wir uns unsicher sind: lieber weiter nach innen ziehen, statt “bis zum Rand”.

## Export (Shorts/Reels/TikTok)

- Container: MP4 (H.264)
- 1080 x 1920, 30fps (oder 60fps, wenn der Look davon lebt)
- Bitrate: 10–16 Mbps Ziel, VBR wenn verfuegbar
- Audio: AAC, 48 kHz
- Scharfe Kanten: nach Moeglichkeit “Maximum Render Quality” (bei AE/Encoder)

## Audio-driven Regeln (aus NotebookLM Artifact)

- Envelope: Attack schnell, Decay langsamer (wirkt nicht "zappelig", bleibt lesbar).
- Cuts/Hits: wenn moeglich Onset/Peak-basierte Marker statt "nach Gefuehl".
- Band-Splitting: Bass vs High getrennt mappen (Scale vs Glow/Grain).

## Photoshop als Pflichtschritt (dein Wunsch)

Alles, was “saubere Freistellung / Alpha / Masken” betrifft, laeuft ueber Photoshop-JSX:

- `scripts/photoshop-export-daumenkino-logo-cutout.jsx` exportiert einen sauberen Logo-Cutout nach:
  `docs/agent-system/social-auto-output/daumenkino-preview/sissygut-design-prototypes/airdox-wildstyle-cutout.png`

Wenn diese Datei existiert, nutzen die Renderer sie automatisch als Alpha-Quelle.

## Naechster produktiver Schritt

1. Du pickst 1–2 Varianten aus dem Idea Pack als “Basis-Look”.
2. Wir machen daraus je einen 5s Motion-Test (mit klarem AIRDOX-Entstehungsmoment).
3. Dann: 15s/30s/59s Draft (immer noch ohne Upload).
4. Erst danach kommt Caption/Plattformpaket und dein OK-Gate.

Konkrete Fixes aus deinem Feedback:
- Block-Assembly: X muss eindeutig lesbar werden (separater Hit / spaeterer Reveal, nicht “hinter dem O verschwinden”).
- “Bar-Wechsel” ersetzen durch echte Audio-Spine (Waveform oder 12/24-Bar Meter, aus Peaks abgeleitet, nicht Deko).
