# Flight Deck Workflow Diagramme

Diese Seite beschreibt die wichtigsten AIRDOX Flight-Deck-Abläufe als Mermaid-Diagramme und als sprachliche Interpretation. Sie ergänzt [[flightdeck-expert-handbook]], [[flightdeck-troubleshooting]] und [[local-02-online-publish-runbook]].

Ziel: Der Assistant soll Diagramme nicht nur wiedergeben, sondern in konkrete Schritte übersetzen. Jede Antwort zu einem Workflow braucht mindestens:

1. einen Schnellweg,
2. einen detaillierten Weg mit Feineinstellungen,
3. eine Aussage, woran der Nutzer den Erfolg erkennt,
4. einen Diagnosepfad, falls der Ablauf stoppt.

## Go-Live Pipeline

```mermaid
flowchart TD
  A[Overview Status prüfen] --> B[Workspace und Settings prüfen]
  B --> C[Set Import oder Batch Import vorbereiten]
  C --> D[Draft prüfen: ID, Titel, Datei, Audio Source, Tracks]
  D --> E{Live-Modus wählen}
  E -->|Publish nach Settings| F[Gespeicherte Automation nutzen]
  E -->|Alles ausführen & Live| G[Build und Deploy erzwingen]
  F --> H[Preflight]
  G --> H
  H --> I[R2 Upload]
  I --> J[Manifest schreiben]
  J --> K[Build]
  K --> L[Deploy]
  L --> M[Verify]
  M --> N[Website, Overview und Data Explorer prüfen]
```

Interpretation in Worten:

1. Der Nutzer startet nicht im Publish-Button, sondern in der Zustandsprüfung.
2. Workspace, Settings und Draft sind Eingangsvoraussetzungen.
3. `Publish nach Settings` respektiert gespeicherte Automationen; `Alles ausführen & Live` erzwingt die vollständige Live-Kette.
4. Der Erfolg ist erst nach `Verify` erreicht, nicht nach dem ersten erfolgreichen Log-Eintrag.
5. Nachkontrolle heißt: Website öffnen, Overview refreshen, `track_stats` im Data Explorer prüfen.

Wenn dieser Ablauf stoppt, ist der fehlerhafte Knoten entscheidend:

- `Preflight`: Workspace, Settings oder Draft korrigieren.
- `R2 Upload`: `.env`, R2 Credentials, Bucket, Prefix und Audio Source prüfen.
- `Manifest`: Set-ID, Datei, Schreibrechte und Manifest-Konflikte prüfen.
- `Build`: `npm run build` manuell ausführen und die erste konkrete Fehlermeldung beheben.
- `Deploy`: Wrangler/Cloudflare/Auth prüfen.
- `Verify`: Live-Bundle, Cache, Set-ID und Track-Tokens prüfen.

## Design Agent / Design Studio

```mermaid
flowchart TD
  A[Design Agent öffnen] --> B{Ziel wählen}
  B -->|Schneller Output| C[Set wählen]
  C --> D[Format wählen: Square/Reel/Story]
  D --> E[Preset wählen: Signal System oder Club Still Parallax]
  E --> F[Minimal-Feintuning: Motion, Glitch, Waveform]
  F --> G[Render starten]
  G --> H[Export öffnen: MP4/GIF/Handoff]
  B -->|Volle Feineinstellung| I[Set und Zielplattform festlegen]
  I --> J[Format, Preset, Hintergrund und Marke setzen]
  J --> K[Studio öffnen]
  K --> L[Motion, Beat-Energie, Glitch, Parallax, Waveform, Typografie feinsteuern]
  L --> M[Preview und Markentext prüfen]
  M --> G
  H --> N[Hauptansicht über Header-Aktion öffnen]
```

Interpretation in Worten:

1. Der schnelle Weg ist für ein brauchbares Visual mit wenigen Entscheidungen.
2. Der detaillierte Weg ist für bewusste Creative Direction und Feineinstellungen.
3. Der Nutzer soll nicht alle Presets und Regler wahllos ausprobieren. Erst Ziel, Set und Format klären, dann Regler anfassen.
4. Die wichtigsten Schnell-Regler sind Motion, Glitch und Waveform.
5. Die vollständige Feineinstellung umfasst zusätzlich Beat-Energie, Parallax, Typografie, Marke und Hintergrund.
6. Das separate Design Studio muss immer einen Rückweg zur Hauptansicht anbieten.

## Assistant Antwortlogik

```mermaid
flowchart TD
  A[Nutzerfrage] --> B{Statusfrage?}
  B -->|Ja| C[Workspace/DB/Git/Queue zusammenfassen]
  B -->|Nein| D{Bekanntes Fehlerbild?}
  D -->|Ja| E[Ursache + konkrete Schritte + betroffener Tab]
  D -->|Nein| F{Wissenseintrag gefunden?}
  F -->|Ja| G[Grundantwort + Schnellweg + detaillierter Weg]
  F -->|Nein| H[Strukturierter Fallback: Ziel, Fehlertext, letzter Schritt abfragen]
  G --> I[Optionale Tab-Aktion anbieten]
  E --> I
```

Interpretation in Worten:

1. Der Assistant darf keine reine Feature-Liste als Hilfe ausgeben.
2. Jede bekannte Frage braucht eine direkt ausführbare Reihenfolge.
3. Jede Workflow-Antwort braucht Schnellweg und detaillierten Weg.
4. Fehlerantworten müssen den technischen Fehler in Alltagssprache übersetzen.
5. Wenn die Frage nicht erkannt wird, muss der Assistant gezielt nach Ziel, Fehlertext und letztem Schritt fragen.

## Fehlerdiagnose

```mermaid
flowchart TD
  A[Fehler oder Verwirrung] --> B[Betroffenen Bereich bestimmen]
  B --> C{UI / Import / Publish / Build / Deploy / DB / Analytics?}
  C -->|UI| D[Sichtbaren Tab, Button und erwarteten Rückweg prüfen]
  C -->|Import| E[Audio Source, Cover, Tracklist und Draft prüfen]
  C -->|Publish| F[Publish Log Schrittname lesen]
  C -->|Build| G[Build Command manuell ausführen]
  C -->|Deploy| H[Wrangler und Cloudflare prüfen]
  C -->|DB| I[DATABASE_URL, Neon und Netzwerk prüfen]
  C -->|Analytics| J[Zeitraum, Filter und Datenquelle prüfen]
  D --> K[Korrektur + Regressionstest]
  E --> K
  F --> K
  G --> K
  H --> K
  I --> K
  J --> K
```

Interpretation in Worten:

1. Erst den Bereich bestimmen, dann handeln.
2. Nicht mehrere Dinge gleichzeitig ändern, sonst ist die Ursache nicht mehr nachvollziehbar.
3. UI-Probleme brauchen einen sichtbaren Rückweg und einen Test für genau diese Route.
4. Publish-Probleme werden über den Log-Schritt diagnostiziert.
5. Jede Korrektur braucht mindestens einen passenden Test oder eine nachvollziehbare manuelle Prüfung.

## Assistant-Pflicht für Diagramme

Wenn der Assistant auf einen Diagramm-Workflow verweist, muss er ihn so erklären:

1. "Du bist gerade an diesem Punkt im Ablauf ..."
2. "Der nächste sinnvolle Schritt ist ..."
3. "Wenn du schnell fertig werden willst ..."
4. "Wenn du alle Feineinstellungen selbst machen willst ..."
5. "Erfolgreich ist es erst, wenn ..."
6. "Wenn es stoppt, prüfe genau diesen Knoten ..."

Diese Regeln sind Teil der Wissensabdeckung für [[flightdeck-expert-handbook]], [[flightdeck-faq]] und [[flightdeck-troubleshooting]].
