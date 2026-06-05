# AIRDOX Remotion Reel Template

## Purpose

Reusable Remotion video template for AIRDOX reels, stories, and first-frame thumbnails.

## Location

- Source: `remotion/airdox-reels/src/AirdoxReel.jsx`
- Root: `remotion/airdox-reels/src/Root.jsx`
- Preview command: `npm run remotion:airdox:studio`
- Still check: `npm run remotion:airdox:still`
- MP4 render: `npm run remotion:airdox:render`

## Format

- 1080 x 1920
- 30 fps
- Safe visual area: main content stays inside roughly 78 px side padding, 88 px top padding, 118 px bottom padding.
- Export target: H.264/AAC MP4 through Remotion render, PNG through Remotion still.

## Variants

- `AIRDOX-Reel-Peak`: drop and peak moments.
- `AIRDOX-Reel-Breakdown`: transition and rebuild moments.
- `AIRDOX-Letterhack`: experimental kinetic-letter direction for rougher, less website-card-like reel drafts.
- `AIRDOX-Story-Full-Set`: short full-set story CTA.
- `AIRDOX-Reel-First-Frame`: feed thumbnail or cover still.

## Brand Rules

- Background: `#050608`
- Surface: `#0f141a`
- Border: `#263241`
- Accent cyan: `#00f0ff`
- Accent pink: `#ff00aa`
- Accent lime: `#9adf6b` only as small metadata/accent color.
- Text: `#f5f8ff`, muted `#9aa6b2`
- Typography: `Inter, Arial, sans-serif`
- AIRDOX must be uppercase and visible.
- `AIRDOX.INFO` must be readable and outside the lower platform UI danger zone.

## Editable Fields

- `hook`
- `subline`
- `badge`
- `cta`
- `setTitle`
- `trackArtist`
- `trackTitle`
- `timecode`
- `coverSrc`
- `audioUrl`

Manni may change copy, track metadata, cover source, and audio source. Designer owns layout, colors, animation behavior, and brand fit.
