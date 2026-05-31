# Windows Flight Deck Test Matrix

Stand: 2026-05-22

## Ziel

Die Desktop-App wird auf drei Ebenen abgesichert:

- **Komponenten-Tests** prüfen einzelne Tabs mit echten Nutzerinteraktionen: Dropdowns, Checkboxen, Slider, Formularfelder und Buttons.
- **DesktopApp-Integrationstests** prüfen, ob Tabs die richtige Flight-Deck-API mit dem richtigen Payload aufrufen und ob danach der sichtbare Zustand stimmt.
- **Playwright-E2E-Tests** prüfen die lauffähige Desktop-Oberfläche im Browser-Mock-Modus über `desktop.html`.

## Abdeckung

| Bereich | Tests | Gesicherte Funktion |
| --- | --- | --- |
| Overview | `DesktopApp.test.jsx`, `desktop-flightdeck.spec.js` | Laden der App, Mock-Modus, Quick-Import, Statusanzeigen |
| Flight Deck Settings | `DesktopControls.test.jsx` | Workspace-Button, Textfelder, Publish-Position-Dropdown, Toggles, Save-Action |
| Set Import | `DesktopApp.test.jsx`, `DesktopControls.test.jsx`, `desktop-flightdeck.spec.js` | Demo-Import, Windows-Dateipfade per Drop, Draft-Felder, Tracklist, Publish, Go Live, Logs |
| Batch Import | `DesktopControls.test.jsx`, `desktop-flightdeck.spec.js` | Datei-Auswahl, Queue-Auswahl, Start, Pause, Retry, Entfernen, Clear Completed, Live-Aktion |
| Data Explorer | `DesktopControls.test.jsx`, `DesktopApp.test.jsx`, `flightdeck-quality.spec.js` | Tabellen-Dropdown, Suche, Live-ohne-VIP-Filter, CSV/JSON Export, Row-Save/Delete, VIP-User, Sessions, Read-only-SQL-Blockierung im Browser |
| Analytics | `AdminFeatures.test.jsx`, `flightdeck-quality.spec.js` | Keine Mock-Analytics als echte Werte, Filterpayload, Datumspresets, Report-Export |
| Advanced Settings | `AdminFeatures.test.jsx`, `desktop-flightdeck.spec.js` | Dirty-State, Save-Payload, Reset, Deploy Strategy, Theme |
| System Monitor | `AdminFeatures.test.jsx`, `desktop-flightdeck.spec.js` | Refresh, Cache löschen, Optimieren, Warnungen, Ressourcenanzeige |
| Marketing Manager | `ManniApprovalTab.test.jsx`, `DesktopApp.test.jsx` | View-Wechsel, Operations-Auswahl, Freigeben/Ablehnen, Entwurfsauftrag |
| Design Agent | `DesktopControls.test.jsx` | Presets, Set-/Style-Dropdowns, Modus-Segmente, Format-Auswahl, Slider, Render-Payload, MP4/GIF-Ausgabe |
| AI Assistant | `DesktopApp.test.jsx`, `flightdeck-assistant.spec.js` | Frage stellen, Backend-Fallback als Objekt, Tool-spezifische Antwort, Navigation/Actions |
| Desktop Services | `DatabaseService.test.js`, `ProtocolPath.test.js`, `setManifest.test.js`, `src/desktop/lib/__tests__/*` | Datenbank-Read-only-Schutz, Protocol-Pfade, Manifest-Logik, Assistant-Engine, Tracklist-Core |

## Ausführen

Gezielter Desktop-Logiklauf:

```powershell
npm run desktop:test:logic
```

Desktop-E2E-Lauf:

```powershell
npm run desktop:test:e2e
```

Komplettes Desktop-Gate:

```powershell
npm run quality:desktop
```

## Erwartete Sicherheitsregeln

- Browser-Vorschau darf keine Read-only-SQL-Ergebnisse fälschen. Der Run-Query-Button zeigt dort eine klare Blockierung und ruft keine SQL-Aktion auf.
- Live-Aktionen müssen vorher den aktuellen Workspace-State laden und mit den zuletzt gespeicherten Settings publizieren.
- Safe Mode blockiert Go Live ohne Windows-Audio-Quellpfad.
- Analytics zeigt ohne echte Datenbank keine erfundenen Kennzahlen.
- Admin-Aktionen werden nur über die expliziten Buttons ausgelöst und mit den erwarteten IDs/Payloads geprüft.
