# Privates Website-Backup nach Cloudflare R2 (Windows)

Dieses Projekt enthält zwei Skripte:

- `scripts/backup-r2.ps1`: Erstellt ein `.tar.gz`-Backup und lädt es nach R2 hoch.
- `scripts/register-r2-backup-task.ps1`: Erstellt einen täglichen Task im Windows Task Scheduler.

## 1. Bucket privat halten

Prüfen (oder erzwingen), dass der `r2.dev` Public-URL deaktiviert ist:

```powershell
npx wrangler r2 bucket dev-url disable <DEIN_BUCKET> --force
```

Wichtig:
- Kein Public Custom Domain Zugriff für Backup-Bucket aktivieren.
- Zugriff nur über API-Token/CLI für dein Admin-Konto erlauben.

## 2. Authentifizierung für automatische Jobs

Für nicht-interaktive Backups setze ein API-Token als User-Umgebungsvariable:

```powershell
setx CLOUDFLARE_API_TOKEN "<DEIN_TOKEN>"
```

Danach neues Terminal öffnen.

Das Token sollte nur die nötigen Rechte haben (mindestens R2 lesen/schreiben).

## 3. Einmaliger Testlauf

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup-r2.ps1 -BucketName "<DEIN_BUCKET>" -ObjectPrefix "backups/$env:COMPUTERNAME/webseeite-main"
```

Optional:
- `-IncludeEnvFiles` falls `.env` und `.dev.vars` mitgesichert werden sollen.
- `-KeepLocalArchive` falls das lokale `.tar.gz` nach Upload nicht gelöscht werden soll.
- `-SkipUpload` für einen reinen lokalen Test (erstellt Archiv + Checksumme ohne R2-Upload).

## 4. Täglichen Task einrichten (z. B. 02:00)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-r2-backup-task.ps1 -BucketName "<DEIN_BUCKET>" -RunAt "02:00" -StartImmediately
```

Der Task heißt standardmäßig `AIRDOX-R2-DailyBackup`.

Alternativ über npm-Skripte:

```powershell
npm run backup:r2 -- -BucketName "<DEIN_BUCKET>"
npm run backup:r2:task -- -BucketName "<DEIN_BUCKET>" -RunAt "02:00"
```

## 5. Restore (Wiederherstellung)

Beispiel: Backup zurückladen und entpacken

```powershell
npx wrangler r2 object get <DEIN_BUCKET>/backups/<COMPUTERNAME>/webseeite-main/<DATEINAME>.tar.gz --file .\restore.tar.gz
tar -xzf .\restore.tar.gz -C .\restore-output
```

## 6. Was standardmäßig ausgeschlossen wird

Beim Backup werden diese Pfade/Muster ausgeschlossen:

- `.git`, `.wrangler`
- `node_modules`, `dist`, `build`, `release`
- `playwright-report`, `test-results`, `scratch`
- `*.log`
- `.env`, `.dev.vars` (nur mit `-IncludeEnvFiles` einschließen)
