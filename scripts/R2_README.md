R2 helper scripts

This folder contains helper scripts to list and delete objects in the configured Cloudflare R2 bucket (reads credentials from `.env` / `.env.example`).

List objects (default prefix `public/`):

```bash
node scripts/r2-list.mjs --prefix=public/
```

Delete objects (example):

```bash
# dry-run (shows usage)
node scripts/r2-delete.mjs recording_2026_06_21-2.mp3

# actual delete (be careful!)
node scripts/r2-delete.mjs --prefix=public/ recording_2026_06_21-2.mp3 --yes
```

Notes:
- Scripts use the same `.env` keys as the app: `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- Test with `r2-list.mjs` first to confirm which keys to delete.
