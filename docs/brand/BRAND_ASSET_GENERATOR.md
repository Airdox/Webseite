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

## Agent Ownership

Designer owns this generator. Manni, Webbie, Mentor, and other agents should use these assets or the generated manifest instead of inventing new layouts.

Generated assets are templates. Public use still requires the normal Manni/Designer approval flow before publishing.
