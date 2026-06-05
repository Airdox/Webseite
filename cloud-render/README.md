# AIRDOX Reel Cloud Render

Dieser Ordner enthaelt den lokalen beziehungsweise cloudfaehigen Renderer fuer das vertikale AIRDOX Cube-Drop-Reel.

## Einrichtung

```bash
npm --prefix cloud-render install
```

Der Renderer benoetigt `ffmpeg` und `ffprobe` auf `PATH`, ueber `AIRDOX_FFMPEG`/`AIRDOX_FFPROBE` oder als ausfuehrbare Dateien unter `cloud-render/bin/ffmpeg` und `cloud-render/bin/ffprobe`.

## Rendern

```bash
node cloud-render/render-airdox-cloud.mjs --audio "D:\beatport neu\01. Sammy Virji, Fred again.., Reggie - Talk of the Town (Original Mix).flac" --audio-start=20 --duration=30 --fps=30
```

Windows-Laufwerkspfade wie `D:\...` werden auch als WSL-Pfade nach `/mnt/d/...` aufgeloest. Wenn die angeforderte Audiodatei in der Umgebung nicht verfuegbar ist, erzeugt der Renderer trotzdem ein pruefbares MP4 mit Platzhalter-Audio und dokumentiert den Fallback in `output/ffprobe-report.json`.

## Ergebnisse

- `output/airdox-three-polished-final.mp4`
- `output/proof-final-frame.png`
- `output/ffprobe-report.json`
- temporaere PNG-Frames in `output/frames/`
