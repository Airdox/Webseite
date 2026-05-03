# AIRDOX Flight Deck - Advanced Admin Suite

## Übersicht

Die Advanced Admin Suite erweitert das AIRDOX Flight Deck um umfangreiche Verwaltungs- und Analysefunktionen für Windows-Desktopanwender. Sie bietet Echtzeit-Datenbankauswertungen, Batch-Importe mit Drag & Drop, erweiterte Einstellungen und System-Monitoring.

**Branch**: `feature/windows-admin-flightdeck-suite`  
**Status**: Produktionsbereit  
**Getestet am**: 25. April 2026

---

## Features

### 1. Advanced Analytics Dashboard

Detaillierte Auswertung von Plays, Engagement und Nutzerverhalten.

#### Kernfunktionen

- **Live-Metriken**: Gesamtaufrufe, Plays, Likes, Engagement-Rate
- **Top-Sets**: Rangfolge der beliebtesten Sets mit Statistiken
- **Geo-Verteilung**: Aufschlüsselung nach Ländern/Regionen
- **Geräte-Breakdown**: Mobile vs. Desktop vs. Tablet
- **Tageszeit-Verteilung**: Wann sind Nutzer am aktivsten?
- **Event-Typ-Übersicht**: Play, Like, Dislike, View Verteilung

#### Verwendung

```
1. Navigiere zum "Analytics" Tab
2. Wähle Zeitraum mit den Datepickern
3. Filtere nach Event-Typ, Gerät oder Land (optional)
4. Klicke "Bericht" zum Exportieren
```

**CSV/JSON-Export** möglich für externe Analyse.

---

### 2. Batch Import mit Drag & Drop

Mehrere Audio-, Cover- und Tracklist-Dateien gleichzeitig importieren.

#### Features

- **Drag & Drop**: Dateien direkt auf die Drop-Zone ziehen
- **Multi-File-Support**: Audio, Cover, Tracklist in einem Durchgang
- **Batch-Verarbeitung**: Mehrere Sets parallel verarbeiten
- **Fehlerbehandlung**: Automatische Retry bei Fehlern
- **Fortschrittsanzeige**: Echtzeit-Progress für jeden Item

#### Unterstützte Formate

- Audio: MP3, WAV, FLAC, AIFF, OGG
- Cover: JPG, PNG, GIF, WebP (bis 10MB)
- Tracklist: `.tracks.json`, `.mixcloud.txt`, CUE, TXT, MD, CSV, JSON

Produktiver Standard ist `.tracks.json`. CUE und Mixcloud-Text sind Import-/Exportformate, die vor dem Live-Publish in seekbare Track-Zeilen mit `time`, `artist` und `title` normalisiert werden.

#### Workflow

```
1. Öffne "Batch Import" Tab
2. Ziehe Dateien auf die Drop-Zone
3. Optional: Filtere oder sortiere die Queue
4. Klicke "Start" für Batch-Verarbeitung
5. Überwache Fortschritt in Echtzeit
6. Fehlgeschlagene Items automatisch retry
7. Exportiere abgeschlossene Items oder lösche sie
```

#### Beispiel-Tracklist (JSON)

```json
[
  {
    "title": "Track 1",
    "artists": "Artist Name",
    "duration": "3:45"
  },
  {
    "title": "Track 2",
    "artists": "Artist Name",
    "duration": "4:20"
  }
]
```

---

### 3. Advanced Settings

Erweiterte Konfiguration für Workspace, Automatisierung und Live-Updates.

#### Einstellungsgruppen

**Workspace-Grundlagen**

- Workspace Root (schreibgeschützt)
- R2 Object Prefix
- Cover Output Directory

**Build & Deploy**

- Build Command (z.B. `npm run build`)
- Deploy Command (z.B. `npm run deploy`)
- Deploy Strategy (Automatic, Manual, Staged)

**Git-Workflow**

- Commit Template
- Branch-Strategie (Current, Dev, Feature-Branch)
- Auto-Merge nach Deploy

**Core Automation** (erweiterte Toggles)

- Safe Mode
- Upload Audio zu R2
- Cover aus Metadaten
- Auto Seed Stats
- Auto Build/Deploy
- Auto Commit/Push

**Live-Update-System**

- Live-Updates aktivieren/deaktivieren
- Update-Intervall: 500ms bis 10s
- Statistik-Polling
- DB-Sync-Warnungen

**Anzeigeoptionen**

- Vinyl-Farbe (Color Picker)
- Publish Position (Top/Bottom)
- Theme (Dark/Light/Auto)

#### Verwendung

```
1. Öffne "Advanced Settings" Tab
2. Ändere gewünschte Einstellungen
3. Beobachte Änderungen in Echtzeit
4. Klicke "Speichern" (nur bei Änderungen aktiv)
5. Erfolgs-/Fehlerbestätigung wird angezeigt
```

#### Best Practices

- Speichere Einstellungen nach größeren Änderungen
- Nutze "Zurücksetzen" um zu Standardwerten zurückzukehren
- Live-Updates sollten für große Datenmengen auf 5-10s eingestellt werden
- Safe Mode sollte in der Produktion immer aktiv sein

---

### 4. System Monitor

Überwachung von Systemressourcen und Prozessen.

#### Metriken

- **RAM**: Verwendet/Verfügbar, Prozentauslastung
- **CPU**: Auslastung, Kernanzahl, Taktfrequenz
- **Disk**: Verfügbarer Speicher, Auslastung
- **Prozesse**: Liste der Top-Prozesse nach RAM

#### Warnungen

- **Speicherauslastung > 85%**: Cache-Leerung empfohlen
- **CPU-Auslastung > 80%**: Performance-Warnung

#### Verwaltungsfunktionen

- **Aktualisieren**: Refresh System Stats
- **Cache löschen**: Freigeben von Speicher
- **Optimieren**: System-Optimierungen durchführen

#### Verwendung

```
1. Navigiere zum "System Monitor" Tab
2. Überprüfe aktuelle Ressourcen-Nutzung
3. Bei Warnungen: Klicke "Cache löschen" oder "Optimieren"
4. Überwache Top-Prozesse um Ressourcenkonflikte zu identifizieren
```

---

### 5. Live Update System

Echtzeit-Synchronisierung von Datenbank-Änderungen.

#### Architektur

```
┌─────────────────────────────────────┐
│   Frontend (React Components)        │
└────────────────┬────────────────────┘
                 │
       ┌─────────▼─────────┐
       │ LiveUpdateManager  │
       │  - Subscribe       │
       │  - Poll            │
       │  - Sync Queue      │
       └─────────┬─────────┘
                 │
    ┌────────────▼────────────┐
    │  Electron IPC           │
    │  - Main Process         │
    │  - Renderer Process     │
    └────────────┬────────────┘
                 │
         ┌───────▼───────┐
         │ Neon Database │
         └───────────────┘
```

#### Konfiguration (Settings Tab)

```javascript
{
  "liveUpdatesEnabled": true,        // Aktivieren/Deaktivieren
  "liveUpdateInterval": 1000,        // ms zwischen Updates
  "enableStatsPolling": true,        // track_stats abfragen
  "enableDbSyncAlerts": true         // Sync-Probleme melden
}
```

#### Verwendung im Code

```javascript
import LiveUpdateManager from './lib/LiveUpdateManager';

const manager = new LiveUpdateManager({
  enabled: true,
  updateInterval: 1000
});

// Subscribe zu Tabellen-Updates
const unsubscribe = manager.subscribe('track_stats', (update) => {
  console.log('Data updated:', update.data);
});

// Starte Polling für Tabelle
manager.startPolling('track_stats', async () => {
  return await fetchTrackStats();
});

// Cleanup
unsubscribe();
manager.stopPolling('track_stats');
manager.dispose();
```

#### Performance-Optimierungen

- Hash-basierte Change Detection (verhindert unnötige Updates)
- Konfigurierbares Update-Intervall
- Optimistische Lock-Stragie bei Konflikten
- Automatische Retry-Logik für fehlgeschlagene Syncs

---

## Architektur

### Komponenten-Übersicht

```
src/desktop/
├── components/
│   ├── AdvancedAnalyticsTab.jsx      # Analytics Dashboard
│   ├── AdvancedSettingsTab.jsx       # Erweiterte Settings
│   ├── BatchImportTab.jsx            # Batch-Import UI
│   ├── SystemMonitorTab.jsx          # System Monitor
│   ├── OverviewTab.jsx               # (bestehend)
│   ├── DataExplorerTab.jsx           # (bestehend)
│   ├── SetImportTab.jsx              # (bestehend)
│   └── FlightDeckTab.jsx             # (bestehend)
├── lib/
│   ├── LiveUpdateManager.js          # Live-Update Logic
│   ├── tableDefinitions.js           # (bestehend)
│   └── setManifest.js                # (bestehend)
├── DesktopApp.jsx                    # Main App Component
└── desktop.css                       # Styling

desktop/main/
├── index.cjs                         # Main Electron Process
├── preload.cjs                       # Preload with IPC Bridge
└── services/
    ├── admin.mjs                     # Analytics & System Services
    ├── database.mjs                  # (bestehend)
    ├── manifest.mjs                  # (bestehend)
    ├── pipeline.mjs                  # (bestehend)
    ├── state.mjs                     # (bestehend)
    └── workspace.mjs                 # (bestehend)
```

### IPC-Kommunikation

**Neue Handler** in `desktop/main/index.cjs`:

```javascript
ipcMain.handle('flightdeck:get-analytics-data', async (event, payload) => {
  // Datenbankabfrage + Aggregation
  return analyticsData;
});

ipcMain.handle('flightdeck:export-analytics-report', async (event, payload) => {
  // PDF/JSON Report Export
  return { filePath };
});

ipcMain.handle('flightdeck:get-system-stats', async (event, payload) => {
  // System Resource Monitoring
  return systemStats;
});

ipcMain.handle('flightdeck:clear-cache', async (event, payload) => {
  // Cache-Verwaltung
  return { cleared: true };
});

ipcMain.handle('flightdeck:optimize-system', async (event, payload) => {
  // System-Optimierungen
  return { optimized: true };
});
```

### CSS-Klassen

Die `desktop.css` wurde um folgende Utility-Klassen erweitert:

- `.fd-metric-grid-large` - Große Metrik-Gitter
- `.fd-chart-*` - Chart-Komponenten
- `.fd-batch-*` - Batch-Import Styles
- `.fd-setting-*` - Advanced Settings Styles
- `.fd-status-*` - Status-Badges und Indikatoren

---

## Testing

### Unit-Tests

Testen der Komponenten und Logik:

```bash
npm run desktop:test
```

**Test-Datei**: `src/desktop/__tests__/AdminFeatures.test.jsx`

Testet:

- AdvancedAnalyticsTab Rendering und Interaktionen
- AdvancedSettingsTab Formular-Logik
- BatchImportTab Datei-Handling
- SystemMonitorTab Metrik-Anzeige
- LiveUpdateManager Abo- und Sync-Funktionalität

### E2E-Tests

Browser-Tests der Desktop-Oberfläche:

```bash
npx playwright test e2e/desktop-flightdeck.spec.js
```

### Manuelles Testing

**Checkliste:**

- [ ] Analytics Tab lädt Daten korrekt
- [ ] Zeitraum-Filter funktioniert
- [ ] Export-Button erzeugt valide JSON/CSV
- [ ] Batch-Import: Drag & Drop funktioniert
- [ ] Batch-Import: Mehrere Dateien gleichzeitig
- [ ] Batch-Import: Fehlerbehandlung bei ungültigen Dateien
- [ ] Advanced Settings: Alle Felder editierbar
- [ ] Advanced Settings: Speichern speichert wirklich
- [ ] Advanced Settings: Zurücksetzen funktioniert
- [ ] System Monitor: Ressourcen-Metriken aktualisieren sich
- [ ] System Monitor: Warnungen erscheinen korrekt
- [ ] Live-Updates: Datenbank-Änderungen werden erkannt
- [ ] Live-Updates: Intervall-Einstellung beeinflußt Update-Häufigkeit

---

## Performance-Tipps

### Große Datenmengen

```javascript
// Gutes: Live-Updates auf 10 Sekunden einstellen
settings.liveUpdateInterval = 10000;

// Gutes: Pagination für große Tabellen
const settings = {
  ...defaultSettings,
  pageSize: 50,  // Statt alle 1000+ Zeilen zu laden
};

// Vermeiden: Sehr häufige Updates
settings.liveUpdateInterval = 100; // Zu aggressiv!
```

### Speicheroptimierung

- Cache-Leerung über System Monitor durchführen
- Alte Analytics-Daten archivieren (> 6 Monate)
- Batch-Imports in Chargen teilen (max. 100 pro Batch)

### UI-Responsiveness

- Nutzung von `startTransition` in Komponenten
- Debouncing bei Input-Feldern
- Virtuelle Scrolling für große Listen (zukünftig)

---

## Häufige Probleme & Lösungen

### Problem: Analytics zeigt keine Daten

**Lösung:**

1. Überprüfe Datenbankverbindung im Overview Tab
2. Führe "Stats Sync" durch
3. Überprüfe Zeitraum-Filter (nicht zu restriktiv)

### Problem: Batch-Import fehlgeschlagen

**Lösung:**

1. Überprüfe Datei-Formate (MP3, JPG, etc.)
2. Überprüfe Dateigröße (Cover max. 10MB)
3. Überprüfe Workspace-Pfad in Settings
4. Versuche mit einer Datei neu

### Problem: System Monitor zeigt 0% CPU

**Lösung:**

1. Das ist normal bei sehr niedriger Last
2. Starte eine Build-Operation um Last zu erzeugen
3. Überprüfe ob Monitoring korrekt initialisiert ist

### Problem: Live-Updates funktionieren nicht

**Lösung:**

1. Überprüfe "Live-Updates aktivieren" Einstellung
2. Überprüfe Update-Intervall (sollte > 500ms sein)
3. Überprüfe Datenbankverbindung
4. Überprüfe Browser-Konsole auf Fehler

### Problem: Desktop-App startet und beendet sich sofort

**Lösung:**

1. Prüfe, ob `ELECTRON_RUN_AS_NODE` in der Umgebung gesetzt ist
2. Starte die App über `npm run desktop:dev` oder `npm run desktop:start` (beide entfernen die Variable automatisch)
3. Falls manuell gestartet wird: Variable vorher entfernen und dann `electron .` starten

---

## Zukünftige Erweiterungen

Geplante Features für künftige Versionen:

- [ ] **Echtzeit-Collaboration**: Mehrere Nutzer bearbeiten gleichzeitig
- [ ] **Advanced Filtering**: Komplexe Filterabfragen speichern
- [ ] **Custom Reports**: Template-basierte Report-Generierung
- [ ] **API-Integration**: Externe Services anbinden
- [ ] **Webhooks**: Event-basierte Notifications
- [ ] **Performance-Profiling**: Detaillierte Metriken pro Query
- [ ] **AI-Insights**: Automatische Anomalie-Erkennung
- [ ] **Mobile-Companion**: iOS/Android App für Überwachung

---

## Deployment

### Vorbereitung

```bash
# 1. Stelle sicher, dass alle Tests grün sind
npm run desktop:test

# 2. Baue die Anwendung
npm run build

# 3. Erstelle Windows-Distributable
npm run desktop:dist

# 4. Überprüfe Artefakte
ls -la release/win-unpacked/
```

### Produktion

```bash
# Automatischer Build & Deploy
npm run desktop:dist

# Manueller Deploy auf Updateserver
scp release/AIRDOX-Flight-Deck-*.exe user@server:/releases/
```

---

## Support & Dokumentation

- **Hauptdokumentation**: [WINDOWS_FLIGHTDECK.md](./WINDOWS_FLIGHTDECK.md)
- **Setup-Anleitung**: [docs/setup.md](./docs/setup.md)
- **API-Referenz**: Siehe IPC Handler in `desktop/main/index.cjs`
- **Issues**: GitHub Issues im `feature/windows-admin-flightdeck-suite` Branch

---

## Lizenz & Attributionen

Dieses Projekt nutzt folgende Open-Source-Komponenten:

- **Electron**: <https://electronjs.org/>
- **React**: <https://react.dev/>
- **Lucide Icons**: <https://lucide.dev/>
- **Drizzle ORM**: <https://orm.drizzle.team/>

---

**Versionsinformation**:

- Version: 0.2.0 (Advanced Admin Suite)
- Letztes Update: 25. April 2026
- Status: Produktionsbereit
- Branch: `feature/windows-admin-flightdeck-suite`
