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

---

## 6) Fehlerbild: Assistant beantwortet einfache Rollenfrage mit generischem Fallback
### Beispiel
Frage: `was kann der design assistent`

### Ursache
- Das Thema fehlt in `src/desktop/lib/assistantKnowledge.js`.
- Keywords treffen nicht auf die Frage.
- Wiki-Seiten enthalten keine kompakte Antwort, die `desktop/main/services/assistant.mjs` als Kontext finden kann.

### Diagnose
1. In `src/desktop/lib/assistantKnowledge.js` nach dem Rollenbegriff suchen.
2. In `src/desktop/lib/__tests__/assistantCoverage.test.js` eine konkrete Frage aufnehmen.
3. Wiki-Abfrage oder `rg "Design Assistant|Design Agent" airdoX_wiki/wiki` ausfuehren.

### Lösung
1. Neues Knowledge-Item mit klaren Keywords und Antwort ergaenzen.
2. Passende Action in `ASSISTANT_ACTIONS` und Navigationserkennung ergaenzen.
3. Wiki-Abschnitt in [[flightdeck-expert-handbook]] und [[flightdeck-faq]] einpflegen.
4. `npm run desktop:test:logic -- --run` oder gezielt `npx vitest run src/desktop/lib/__tests__/assistantCoverage.test.js` ausfuehren.

---

## 7) Fehlerbild: Import- oder Publish-Fehler ist fuer Laien unverstaendlich
### Beispiel
Fehler: `Safe mode blocked publish: the source audio path is missing.`

### Ursache
- Technische Rohmeldungen aus Pipeline, R2, Build, Deploy oder Verify sind fuer Betrieb noetig, aber nicht automatisch verstaendlich.
- Ohne Uebersetzung weiss der Nutzer nicht, welcher UI-Ort oder welche Datei betroffen ist.

### Diagnose
1. Publish Log im Set Import lesen.
2. Fehler-Schritt identifizieren: Import, Tracklist, Audio, Manifest, Database, Build, Deploy, Verify oder Git.
3. In `src/desktop/lib/assistantEngine.js` pruefen, ob ein Pattern in `ERROR_EXPLAINERS` passt.

### Lösung
1. Originalmeldung sichtbar lassen.
2. Mit `formatFlightDeckErrorHelp(error.message)` eine deutsche Hilfe erzeugen.
3. Hilfe im Publish-Status und im Publish Log anzeigen.
4. Assistant-Coverage um die konkrete Fehlermeldung erweitern.

### Laienverstaendliche Antwortstruktur
- `Hilfe: <kurzer Fehlername>`
- `Was bedeutet das? <ein Satz ohne Fachchinesisch>`
- `So behebst du es: <konkrete Schritte im UI>`

---

## 8) Fehlerbild: Wiki nennt alte Projektpfade als aktuelle Quelle
### Ursache
- Projektstruktur wurde verschoben, Wiki aber nicht synchronisiert.
- Historische Reports enthalten alte Referenzen.

### Aktuelle Quelle
- Reports: `docs/agent-system/reports/`
- Visuelle Vorlagen: `docs/agent-system/visual-templates/`
- Laufende Agenten-Snapshots: `docs/agent-system/latest-*.md` und `docs/agent-system/latest-*.json`

### Lösung
1. Alte Pfade wie `docs/agent-system/social-auto-output/` und `docs/agent-system/research/` nicht als aktuelle Quelle verwenden.
2. Wiki-Index, [[flightdeck-expert-handbook]] und [[flightdeck-faq]] aktualisieren.
3. `airdoX_wiki/wiki/log.md` mit Quellen und betroffenen Seiten fortschreiben.
4. Nach groesseren Updates `python airdoX_wiki/linting.py` pruefen und tote Links beheben.
