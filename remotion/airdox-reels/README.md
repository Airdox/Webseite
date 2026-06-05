# AIRDOX Remotion Reels

Reusable Remotion template for AIRDOX 9:16 reels, stories, and first-frame thumbnails.

## Commands

```powershell
npm run remotion:airdox:studio
npm run remotion:airdox:still
npm run remotion:airdox:render
```

## Compositions

- `AIRDOX-Reel-Peak`: drop or peak moment, 30 seconds.
- `AIRDOX-Reel-Breakdown`: transition or rebuild moment, 30 seconds.
- `AIRDOX-Letterhack`: rough kinetic-type direction with fragment letters, slap strips, and graffiti-logo flashes.
- `AIRDOX-Story-Full-Set`: story CTA for full-set promotion, 15 seconds.
- `AIRDOX-Reel-First-Frame`: still export for thumbnails or cover frames.

## Editable Props

- `hook`: main two-line maximum message.
- `subline`: secondary context.
- `badge`: top-right label.
- `cta`: visible destination, default `AIRDOX.INFO`.
- `setTitle`, `trackArtist`, `trackTitle`, `timecode`: music metadata.
- `coverSrc`: local public asset path or remote image URL.
- `audioUrl`: local public asset path or remote audio URL.

The default visual identity follows `docs/brand/airdox-brand-tokens.json`.
