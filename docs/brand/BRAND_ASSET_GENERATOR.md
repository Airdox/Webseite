# AIRDOX Brand Asset Generator

The Brand Asset Generator is the next Designer automation layer. It creates reusable AIRDOX social asset templates from the central brand tokens, validates them, and writes a versioned manifest.

## Command

```bash
npm run brand:assets
```

Strict validation:

```bash
npm run brand:assets:strict
```

Custom version:

```bash
node scripts/brand-asset-generator.mjs --version=v2026-05-campaign
```

## Outputs

- `public/brand-assets/<version>/reel-drop-peak.svg`
- `public/brand-assets/<version>/reel-signal-system.svg`
- `public/brand-assets/<version>/reel-club-still-parallax.svg`
- `public/brand-assets/<version>/reel-glitch-type-drop.svg`
- `public/brand-assets/<version>/story-pressure-test.svg`
- `public/brand-assets/<version>/thumbnail-full-set.svg`
- `public/brand-assets/<version>/square-release-card.svg`
- `public/brand-assets/<version>/manifest.json`
- `docs/agent-system/latest-brand-asset-generator.json`
- `docs/agent-system/latest-brand-asset-generator.md`

## What It Validates

- AIRDOX is visible in uppercase.
- Required palette tokens are used.
- Internal workflow words such as `draft`, `pending`, `approval`, `internal`, and `todo` are not visible.
- Text and accent contrast pass minimum thresholds.
- Platform safe areas are defined.
- Reel/story assets define a motion signature and a visual effect direction.
- Static-only reel concepts are flagged before handoff.

## Creative Direction

The templates keep AIRDOX dark and minimal, but they should not collapse into a flat black corporate look. The generator adds secondary creative accents on top of the core tokens:

- signal pink `#ff2bd6`
- electric blue `#4d7cff`
- deep violet `#21133f`
- signal amber `#ffc857`

These accents are used as supporting stage-light and signal-system colors. The required AIRDOX tokens still remain present in every generated asset.

## Motion Direction

Generated templates now include explicit creative metadata:

- `motionSignature`: Equalizer, Waveform, VU-Meter, Beat-Pulse, Parallax, Kinetic Type or Glitch.
- `stillSource`: Website, cover art, preview frame, EPK/brand asset or source-video frame.
- `visualEffect`: Scanline, Light-Gate, Posterize/Thermal, Slit/Time-Slice, Mask Reveal or Data Burn-In.

Designer must treat these as production requirements, not decorative notes. A reel without motion/audio relationship is marked as a static creative risk.

## Agent Ownership

Designer owns this generator. Manni, Webbie, Mentor, and other agents should use these assets or the generated manifest instead of inventing new layouts.

Generated assets are templates. Public use still requires the normal Manni/Designer approval flow before publishing.
