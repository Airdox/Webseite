# AIRDOX Free Social Automation

Goal: one low-cost workflow for a small Berlin underground techno DJ.

## Command

Run this after a new set is added to `src/data/musicSets.js` and the audio is available through the website API:

```powershell
npm run social:auto
```

One-command social package plus YouTube full-set publish (unlisted):

```powershell
npm run social:run
```

The command:

- selects the newest `isNew` set from `src/data/musicSets.js`
- uses the website audio stream as source of truth
- finds a usable hook moment, preferring a Rene Bourgeois marker when present
- renders 15s, 30s, and 59s vertical social assets
- renders the YouTube full-set video from a local audio source, not R2
- writes captions, hashtags, and a manifest
- checks whether official OAuth credentials are present
- never reads browser cookies or session tokens

## Output

Files are written to:

```text
docs/agent-system/social-auto-output/<set-id>/
```

Each run creates:

- `manifest.json`
- `captions.json`
- `upload-copy-paste.md`
- one MP4 per social duration
- one preview PNG per MP4
- one audio-check WAV per MP4

## Dry Run

Use this when you only want metadata and captions:

```powershell
npm run social:auto:dry
```

Use this when you want to prove the YouTube full-set source mapping without rendering or uploading:

```powershell
npm run social:youtube:dry -- --set-id=recording_2026_05_07-2
```

## YouTube Full-Set Pipeline

YouTube full-set upload is intentionally separate from the social clips:

```text
resolve-source -> render-youtube-video -> validate-video -> upload-youtube
```

Rules:

- Full-set source audio must be local. Set `AIRDOX_LOCAL_AUDIO_DIR` or pass `--audio-path=<file>`.
- `recording_2026_05_07-2` maps to `D:\Neuer Ordner (2)\140-Airdox\Unknown Album(3)\01 REC-2026-05-07.mp3`.
- R2 and the website stream are not used as the YouTube full-set source.
- Rendering writes `*.tmp.mp4`, validates with `ffprobe`, then atomically renames to `*-full-set-youtube.mp4`.
- Encoding is YouTube-ready MP4: H.264, AAC, 1080p, `yuv420p`, 48 kHz audio, and fast-start metadata.
- Upload uses YouTube's resumable upload protocol, so large videos are not loaded into memory in one piece.

Useful commands:

```powershell
npm run social:youtube:dry -- --set-id=recording_2026_05_07-2
npm run social:youtube:render:test -- --set-id=recording_2026_05_07-2
npm run social:youtube:render -- --set-id=recording_2026_05_07-2
npm run social:youtube:validate -- --set-id=recording_2026_05_07-2
npm run social:youtube:publish -- --set-id=recording_2026_05_07-2 --privacy=unlisted
```

## Optional Arguments

```powershell
npm run social:auto -- --set-id=recording_2026_05_07-2
npm run social:auto -- --start=00:17:58
npm run social:auto -- --durations=15,30,59
```

## Publishing Gate

The workflow is free by default. Automatic publishing only turns on after official OAuth/API tokens are available in the environment:

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN

META_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
INSTAGRAM_BUSINESS_ACCOUNT_ID

TIKTOK_CLIENT_KEY
TIKTOK_CLIENT_SECRET
TIKTOK_REFRESH_TOKEN
```

Until then, the package is publish-ready but platform upload remains manual.

## Current Practical Path

1. Use `npm run social:auto` to create the package automatically.
2. Use `npm run social:youtube:dry` and `npm run social:youtube:render:test` to verify source mapping and visual encoding.
3. Use `npm run social:youtube:publish -- --privacy=unlisted` when YouTube OAuth variables are configured and you want automatic upload.
YouTube behavior: default is full-set upload with branded AIRDOX visual. Use `npm run social:youtube:publish:short -- --privacy=unlisted` only when you explicitly want the short-form reel upload.
4. Upload manually to Instagram/Facebook/TikTok while Meta/TikTok API access is blocked.
5. Add Meta and TikTok later through official app/OAuth flows.
