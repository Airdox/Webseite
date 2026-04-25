# Branch Management Cleanup

Stand: 25. April 2026

## Zweck dieses Dokuments

Dieses Dokument haelt die Aufraeumung und Neuordnung der Quellcodeverwaltung fest.
Es dient als nachvollziehbares Protokoll fuer:

- den Ausgangszustand
- die Zielstruktur
- die konkret ausgefuehrten Schritte
- die archivierten Staende
- die bewusst noch nicht geloeschten Sicherheitslinien
- die empfohlene weitere Vorgehensweise

Damit soll sichergestellt werden, dass spaeter jederzeit nachvollzogen werden kann:

- welche Branches es vorher gab
- welche entfernt wurden
- welche Branches jetzt aktiv verwendet werden sollen
- welche Staende aus Sicherheitsgruenden erhalten bleiben

## Ausgangslage vor der Bereinigung

Vor der Bereinigung war die Branch-Landschaft uneinheitlich.
Es existierten mehrere Linien fuer das Windows-Tool sowie mehrere historische oder experimentelle Website-Branches.

Vorhandene lokale bzw. Remote-Branches waren unter anderem:

- `main`
- `clean-main`
- `qa-setup`
- `feature/windows-admin-flightdeck`
- `feature/windows-admin-flightdeck-suite`
- `feature/windows-admin-flightdeck-suite-release-2026-04-25`
- `copilot-worktree-2026-02-02T14-28-42`
- `cloudflare/workers-autoconfig` auf `origin`

Zusatzproblem:

- Die eigentliche Website-Entwicklung und die Windows-Tool-Entwicklung waren nicht sauber auf zwei langlebige Hauptlinien getrennt.
- Es gab mehrere aufeinander aufbauende Windows-Branches.
- Es war nicht sofort klar, welche Branches noch aktiv relevant sind und welche nur alte Zwischenstaende darstellen.

## Zielstruktur

Als neue Zielstruktur wurden zwei aktive Produkt-Branches definiert:

- `website`
  Hauptbranch fuer die Website
- `win-tool`
  Hauptbranch fuer das Windows-Tool

Diese Trennung ist praktisch, weil sie die beiden Produktlinien direkt abbildet:

- Oeffentliche Website, Frontend, Worker, Inhalte, Deploy der Site
- Windows-Desktop-Tool, Electron, Flight Deck, Admin-Suite, Tool-Dokumentation

## Leitprinzipien der Bereinigung

Die Bereinigung sollte sinnvoll und praktikabel sein, ohne dass Daten, Commit-Staende oder fruehere Entwicklungsstaende verloren gehen.

Deshalb galten folgende Regeln:

1. Keine harte Loeschung historisch potenziell relevanter Staende ohne Sicherung.
2. Keine aggressive Remote-Bereinigung, solange unklar ist, ob ein Branch noch als Sicherheitsanker dienen soll.
3. Historisch relevante Sonderlinien zuerst als Archiv sichern.
4. Nur Branches entfernen, die bereits vollstaendig in `website` oder `win-tool` enthalten sind oder separat archiviert wurden.

## Umgesetzte Schritte

## 1. Aktuellen Windows-Tool-Stand gesichert

Vor der Branch-Bereinigung wurde der lokale, noch nicht committete Stand des Windows-Tools gesichert.

Erstellter Commit:

- `3f8d0bd`
  `docs(desktop): expand guided tutorial and scenario tours`

Dieser Commit enthaelt den erweiterten Tutorial-Tab, die gefuehrten Touren, die neue Tutorial-Dokumentation sowie Tests und Styling dazu.

## 2. Neue kanonische Produkt-Branches angelegt

Es wurden zwei saubere Ziel-Branches angelegt und auf `origin` veroeffentlicht:

- `website`
- `win-tool`

Zuordnung:

- `website` basiert auf dem damaligen lokalen Website-Stand
- `win-tool` zeigt auf den aktuellen Windows-Tool-Stand inklusive Tutorial-Ausbau

## 3. Historische Analyse der Alt-Branches

Danach wurde geprueft:

- welche Windows-Branches bereits vollstaendig in `win-tool` enthalten sind
- welche Website-Branches noch exklusive Historie enthalten

Ergebnis:

### Vollstaendig durch `win-tool` abgedeckte Branches

- `feature/windows-admin-flightdeck`
- `feature/windows-admin-flightdeck-suite`
- `feature/windows-admin-flightdeck-suite-release-2026-04-25`

Diese Branches waren reine Entwicklungslinien des Windows-Tools und konnten als veraltet gelten, sobald `win-tool` etabliert war.

### Noch historisch relevante Website-Linien

- `qa-setup`
- `clean-main`
- `cloudflare/workers-autoconfig`

Diese Branches enthielten Website-nahe oder Infrastruktur-nahe Historie, die nicht einfach blind verworfen werden sollte.

## 4. Archiv-Tags angelegt

Um diese historischen Staende verlustfrei zu sichern, wurden vor der weiteren Bereinigung folgende Archiv-Tags erzeugt und auf `origin` gepusht:

- `archive/qa-setup-2026-04-25`
- `archive/clean-main-2026-04-25`
- `archive/cloudflare-workers-autoconfig-2026-04-25`

Damit bleibt die Historie dieser Linien erhalten, auch wenn die zugehoerigen Arbeits-Branches spaeter verschwinden.

## 5. Veraltete Branches lokal entfernt

Folgende lokale Branches wurden entfernt:

- `feature/windows-admin-flightdeck`
- `feature/windows-admin-flightdeck-suite`
- `feature/windows-admin-flightdeck-suite-release-2026-04-25`
- `clean-main`
- `qa-setup`
- `main`
- `copilot-worktree-2026-02-02T14-28-42`

Wichtig:

- Die Entfernung erfolgte erst nach Analyse und Sicherung.
- `main` wurde lokal entfernt, weil es nicht mehr als aktive Arbeitslinie verwendet werden soll.
- Der Stand von `main` bleibt remote weiterhin vorhanden.

## 6. Alten Worktree bereinigt

Der separate Copilot-Worktree wurde entfernt:

- `D:/webseeite-main.worktrees/copilot-worktree-2026-02-02T14-28-42`

Damit ist die lokale Arbeitsumgebung wieder auf eine aktive Linie reduziert.

## 7. Remote-Branches entfernt

Folgende Remote-Branches wurden erfolgreich geloescht:

- `origin/clean-main`
- `origin/cloudflare/workers-autoconfig`
- `origin/copilot-worktree-2026-02-02T14-28-42`
- `origin/feature/windows-admin-flightdeck`
- `origin/feature/windows-admin-flightdeck-suite`
- `origin/feature/windows-admin-flightdeck-suite-release-2026-04-25`

## Aktueller Zielzustand

Lokal aktiv vorhanden:

- `website`
- `win-tool`

Aktueller Arbeitsbranch:

- `win-tool`

Aktueller lokaler Zustand:

- Arbeitsbaum sauber
- Tracking auf `origin/win-tool` vorhanden

Remote aktuell vorhanden:

- `origin/website`
- `origin/win-tool`
- `origin/main`
- `origin/qa-setup`

## Warum `origin/main` und `origin/qa-setup` noch nicht entfernt wurden

Diese beiden Branches wurden bewusst nicht final remote geloescht.

### `origin/main`

`origin/main` bleibt vorerst als konservative historische Sicherheitslinie bestehen.

Gruende:

- `origin/HEAD` zeigte zum Analysezeitpunkt noch auf `origin/main`
- ein Repo-Default-Branch sollte nicht aus einer lokalen Git-Operation heraus blind entfernt werden
- `main` kann als Rueckfallanker bestehen bleiben, bis die neue Struktur organisatorisch sauber etabliert ist

### `origin/qa-setup`

Der Versuch, `origin/qa-setup` zu loeschen, wurde vom Remote abgelehnt mit:

- `refusing to delete the current branch`

Das bedeutet:

- dieser Branch wird serverseitig noch als aktueller Branch behandelt
- der Branch muss zuerst in GitHub selbst als Default/Current Branch abgeloest werden

## Empfohlene sichere Endloesung

Um keine Staende zu verlieren und trotzdem eine klare Ordnung zu haben, wird folgende Loesung empfohlen:

### Aktiv benutzen

- `website`
- `win-tool`

### Vorlaeufig nur als Archiv/Sicherheitsanker behalten

- `origin/main`
- `origin/qa-setup`

### Organisatorischer Standard ab jetzt

- Website-Aenderungen nur auf `website`
- Windows-Tool-Aenderungen nur auf `win-tool`

## Empfohlene GitHub-Nacharbeit

Die restliche Aufraeumung sollte in GitHub selbst erfolgen:

1. Default-Branch auf `website` umstellen
2. optional Branch Protection fuer `website`
3. optional Branch Protection fuer `win-tool`
4. `qa-setup` nicht mehr aktiv verwenden
5. nach einer Sicherheitsfrist entscheiden:
   - `qa-setup` remote loeschen
   - optional auch `main` remote loeschen oder als reines Archiv bestehen lassen

## Warum diese Loesung sinnvoll ist

Diese Vorgehensweise ist deshalb praktikabel, weil sie beides erreicht:

- klare operative Ordnung
- kein Verlust historischer Entwicklungsstaende

Vorteile:

- nur noch zwei echte Arbeitslinien
- alte Entwicklungszweige des Windows-Tools sind entfernt
- historische Website- und Infrastrukturstaende sind ueber Tags gesichert
- die bisherige Historie bleibt rekonstruierbar
- es gibt keinen harten, riskanten Schnitt mitten in laufender Arbeit

## Empfehlte Branch-Zuordnung fuer die Zukunft

### Branch `website`

Hierhin gehoert alles, was die oeffentliche Website betrifft:

- `src/components`
- `src/server`
- `src/data`
- `public`
- Website-Dokumentation
- Cloudflare-/Site-Deploy fuer die Webanwendung

### Branch `win-tool`

Hierhin gehoert alles, was das Windows-Tool betrifft:

- `src/desktop`
- `desktop/`
- `desktop.html`
- Electron-Logik
- Flight-Deck-Dokumentation
- Windows-Tool-Tests

### Wenn ein Thema beide Produktlinien betrifft

Empfohlene Praxis:

1. entweder zwei getrennte Commits
2. oder zwei getrennte kurze Arbeitsbranches
3. danach sauber in `website` bzw. `win-tool` integrieren

## Kurzzusammenfassung

Die Branch-Verwaltung wurde auf zwei sinnvolle Hauptlinien reduziert:

- `website`
- `win-tool`

Historisch relevante Sonderlinien wurden vorher gesichert.
Veraltete Entwicklungs-Branches wurden lokal und remote entfernt.
`main` und `qa-setup` bleiben vorerst als konservative Sicherheitsanker erhalten, bis die GitHub-Default-Branch-Umstellung abgeschlossen ist.

Damit ist die Struktur bereits deutlich sauberer, ohne dass Commit-Staende oder fruehere Entwicklungsstaende verloren gehen.
