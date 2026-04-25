# AIRDOX Flight Deck

## Stand

Analyse- und Implementierungsstand: 25. April 2026  
Branch: `feature/windows-admin-flightdeck-suite`

## Praezise Ist-Analyse der bestehenden Seite

Die AIRDOX-Seite ist aktuell ein React/Vite-Frontend mit Cloudflare-Worker-API und Neon PostgreSQL.

Reale Datenpfade im Projekt:

- Sets werden statisch aus `src/data/musicSets.js` gelesen.
- Audio wird live ueber `src/server/worker.js` aus dem R2-Bucket `airdox-assets-prod` ausgeliefert.
- Betriebsdaten liegen in Neon PostgreSQL und werden in `src/lib/stats-logic.js` gepflegt.
- Das Projekt hat bereits einen Worker-Deploy-Pfad ueber `npm run deploy`.

Produktive Tabellen, am 25. April 2026 direkt gegen die konfigurierte Datenbank verifiziert:

- `track_stats`
- `analytics_logs`
- `bookings`
- `subscribers`
- `users`
- `sessions`

Daten-Snapshot vom 25. April 2026:

- `track_stats`: 12 Eintraege
- `analytics_logs`: 2 Eintraege
- `bookings`: 0 Eintraege
- `subscribers`: 0 Eintraege
- `users`: 3 Eintraege
- `sessions`: 1 Eintrag

Top-Sets in der Datenbank zum Analysezeitpunkt:

- `secret_set_2025_12_22`: 71 Plays
- `recording_2026_04_12`: 62 Plays
- `recording_2026_03_15`: 33 Plays

## Vergleichbare Tools und uebernommene Muster

Ich habe die Features bewusst nicht frei erfunden, sondern an vier etablierten Tools gespiegelt:

- DBeaver: Data Editor, SQL Editor, Schema-/DDL-Werkzeuge, Import/Export, Task- und Dashboard-Gedanke  
  Quelle: https://dbeaver.io/
- Beekeeper Studio: CSV-/JSON-/Excel-Export, Streaming-Export, intelligenter Import, Upserts  
  Quelle: https://www.beekeeperstudio.io/features/import-export
- TablePlus: Inline Edit, Advanced Filters, Safe Mode, Export/Import  
  Quelle: https://tableplus.com/
- pgAdmin: Monitoring Dashboard, Query Tool, Schema Diff, PostgreSQL-Admin-Fokus  
  Quelle: https://www.pgadmin.org/features/  
  Query Tool: https://www.pgadmin.org/docs/pgadmin4/latest/query_tool.html  
  Schema Diff: https://www.pgadmin.org/docs/pgadmin4/development/schema_diff.html

Davon in AIRDOX Flight Deck konkret uebernommen:

- Uebersichts-Dashboard fuer Live-Metriken
- Data Explorer fuer reale Tabellen
- Export nach CSV und JSON
- Read-only SQL-Konsole
- Safe-Mode-gesteuerter Publish-Workflow
- Inline-Admin fuer `track_stats`, `subscribers`, `users`, `sessions`
- Automationsschalter fuer Build, Deploy, Commit und Push

## Was implementiert wurde

### 1. Electron-Desktop-App

Neue Kernpfade:

- `desktop/main/index.cjs`
- `desktop/main/preload.cjs`
- `src/desktop/*`
- `desktop.html`

Vorhandene neue Scripts:

- `npm run desktop:dev`
- `npm run desktop:start`
- `npm run desktop:test`
- `npm run desktop:dist`

### 2. Tabs und Funktionsumfang

`Overview`

- Live-Snapshot aus Datenbank und Manifest
- Top-Sets
- letzte Analytics-Events
- Git-/Workspace-Status
- Sync von Manifest-IDs nach `track_stats`

`Data Explorer`

- Tabellen fuer alle sechs Produktivtabellen
- Suchfilter im UI
- CSV-/JSON-Export
- Bearbeitung von `track_stats`
- Bearbeitung von `subscribers`
- Anlegen und Passwort-Reset von VIP-Usern
- Session-Revoke
- Read-only SQL fuer `SELECT`, `WITH`, `EXPLAIN`

`Set Import`

- Drag-and-drop fuer Audio, Cover und Tracklist
- Audio-Metadaten-Auswertung
- automatische Erkennung von Dauer und Dateihinweisen
- Tracklist-Parser fuer Text, CSV und JSON
- Draft-Editor fuer ID, Titel, Datum, Dauer, Farbe, Cover, Tracklist
- Publish-Log nach jedem Lauf

`Flight Deck`

- Workspace-Auswahl
- Safe Mode
- R2-Upload ein/aus
- Embedded-Cover-Extraktion
- Stats-Seeding
- Auto-Build
- Auto-Deploy
- Auto-Commit
- Auto-Push
- Publish-Position
- Build-/Deploy-/Git-Templates

### 3. Publish-Pipeline

Beim Publish werden, je nach Schaltern, automatisiert ausgefuehrt:

1. Cover in `public/assets` kopieren oder aus Embedded Artwork extrahieren
2. Audio nach Cloudflare R2 hochladen
3. `src/data/musicSets.js` aktualisieren
4. `track_stats` fuer neue Set-ID vorbereiten
5. Build starten
6. Deploy starten
7. optional Git-Commit und Git-Push

### 4. Sicherheits- und Wartungsfix

`scratch/analyze_db.js` nutzt jetzt `.env` statt fest eingebauter Datenbank-URL.

## Lokale Verwendung

Entwicklung:

```powershell
npm run desktop:dev
```

Renderer lokal gegen Build testen:

```powershell
npm run build
npm run desktop:start
```

Unit-Tests:

```powershell
npm run desktop:test
```

Browser-E2E fuer die Desktop-Oberflaeche:

```powershell
npx playwright test e2e/desktop-flightdeck.spec.js
```

## Teststatus

Erfolgreich ausgefuehrt:

- `npm run desktop:test`
- `npm run build`
- `npx playwright test e2e/desktop-flightdeck.spec.js`
- gezieltes ESLint fuer `src/desktop`, `desktop/main`, `scratch/analyze_db.js`

Wichtig:

- Das globale Repo-`lint` ist weiterhin rot, aber wegen bereits bestehender Altfehler ausserhalb des neuen Flight-Deck-Scopes, unter anderem in `.wrangler`, `Navigation.jsx`, `Magnetic.jsx`, `VIPSection.jsx`, `stats-sync.js` und weiteren vorhandenen Dateien.
- Der direkte Dev-Start ueber `electron .` ist auf diesem Windows-Host nicht verlaesslich reproduzierbar. Die UI- und Renderer-Tests sind gruen, die Prozessverifikation des nativen Electron-Hosts bleibt in dieser Umgebung aber eingeschraenkt.

## Windows-Artefakte

Erzeugte Artefakte:

- Unpacked App: `release/win-unpacked/`
- Zip des unpacked Builds: `release/AIRDOX-Flight-Deck-win-unpacked.zip`

Packaging-Hinweis:

- `electron-builder` bricht in dieser Umgebung beim `winCodeSign`-Hilfspaket ab, weil 7-Zip dort symbolische Links nicht entpacken darf.
- Der eigentliche App-Ordner `release/win-unpacked/` wird trotzdem erzeugt.
- Das Problem liegt im lokalen Packaging-/Signing-Helfer, nicht im Vite-/Renderer-Build.
- Der `win-unpacked`-Build wurde erzeugt, laesst sich in dieser nicht-interaktiven Session aber nicht belastbar bis zur sichtbaren GUI verifizieren. Die abgesicherten Nachweise in dieser Session sind daher Build, Unit-Tests, Browser-E2E und die erzeugten Windows-Artefakte.

## Empfohlener naechster Schritt

Fuer eine saubere finale Windows-Auslieferung:

1. Windows-Developer-Mode oder Admin-Rechte fuer Symlink-Erstellung aktivieren.
2. Optional ein eigenes `icon.ico` im Repo hinterlegen.
3. Danach `npm run desktop:dist` erneut ausfuehren.
