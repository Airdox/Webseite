# Flight Deck Troubleshooting Matrix

## 1) Fehlerbild: "Error invoking remote method 'flightdeck:get-state'"
### Ursache
- Workspace ungültig.
- Datenbank nicht erreichbar.
- Defekte ENV-Konfiguration.

### Diagnose
1. Workspace-Pfad prüfen.
2. Prüfen, ob Pflichtdateien existieren.
3. Datenbank-URL in `.env` prüfen.

### Lösung
1. Workspace neu auswählen.
2. `DATABASE_URL` oder `NEON_DATABASE_URL` korrekt setzen.
3. Netzwerk/Firewall prüfen.
4. App neu starten.

---

## 2) Fehlerbild: Analytics zeigt nur 0-Werte
### Ursache
- Keine Events im gewählten Zeitraum.
- Filter zu eng.
- Refresh nicht ausgeführt.

### Diagnose
1. Zeitraum auf größere Spanne setzen.
2. Event/Gerät/Land auf `Alle`.
3. Refresh klicken.

### Lösung
1. Filter resetten.
2. Event-Logs über Data Explorer prüfen (`analytics_logs`).
3. Wenn leer: Tracking-Events erzeugen und erneut prüfen.

---

## 3) Fehlerbild: Set Import unvollständig
### Ursache
- Dateinamensmuster nicht erkannt.
- Tracklist fehlt oder unlesbar.

### Diagnose
1. Audio-Datei prüfen.
2. Bildpfad prüfen.
3. Tracklist-Format prüfen.

### Lösung
1. Draft-Felder manuell korrigieren.
2. Tracks manuell ergänzen.
3. Publish erneut starten.

---

## 4) Fehlerbild: Build/Deploy schlägt fehl
### Ursache
- Falscher Command in Settings.
- Toolchain fehlt lokal.
- Auth/Token fehlen.

### Diagnose
1. Command lokal im Terminal ausführen.
2. Ausgabe/Fehler protokollieren.
3. Secrets und Tokens prüfen.

### Lösung
1. Korrekte Commands in Advanced Settings speichern.
2. Fehlende Abhängigkeiten installieren.
3. Auth-Setup erneuern.

---

## 5) Fehlerbild: UI wirkt kaputt oder Buttons reagieren nicht
### Ursache
- Frontend-Syntaxfehler.
- Regression im Rendering.
- Alte Assets im Cache.

### Diagnose
1. Lint/Test laufen lassen.
2. Browser/Renderer-Konsole prüfen.
3. Cache leeren.

### Lösung
1. Syntax-/Importfehler korrigieren.
2. Regressionstest und Screenshot-Vergleich ausführen.
3. Build neu erzeugen.

