# AIRDOX Cloud-Render-Aufgabe

Rendere ein vertikales AIRDOX Reel/Short aus der eingecheckten visuellen Szene und muxe Musik aus der angegebenen FLAC-Quelle.

## Pflichtbefehl

```bash
npm --prefix cloud-render install
node cloud-render/render-airdox-cloud.mjs --audio "D:\beatport neu\01. Sammy Virji, Fred again.., Reggie - Talk of the Town (Original Mix).flac" --audio-start=20 --duration=30 --fps=30
```

## Ergebnisse

- `cloud-render/output/airdox-three-polished-final.mp4`
- `cloud-render/output/proof-final-frame.png`
- `cloud-render/output/ffprobe-report.json`

## Qualitaetsanforderungen

- 30 Sekunden, 1080x1920, 30 fps.
- Audio wird ab Sekunde 20 aus der angegebenen FLAC-Datei gemuxt, sofern die Quelle verfuegbar ist.
- Sichtbarer Text ist auf `AIRDOX`, `airdox.info` und die Wuerfelbuchstaben `A I R D O X` begrenzt.
- Das Reel zeigt einen dunklen Wuerfelbecher, einen dimensionalen Wuerfelwurf/-roll fuer jeden Buchstaben, die links-nach-rechts landenden Buchstaben und eine finale AIRDOX/airdox.info-Aufloesung.
- Keine automatische Veroeffentlichung auf TikTok oder anderen Plattformen.
