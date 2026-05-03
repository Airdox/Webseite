# AIRDOX Flight Deck Tutorial

## Ziel

Dieses Dokument ist das lesbare Begleithandbuch zum In-App-Tutorial im Flight Deck.

Im Tool selbst gibt es jetzt drei Ebenen der Hilfe:

1. `Interaktive Tour` in der Kopfzeile fuer den direkten Einstieg.
2. `Tutorial`-Tab mit Checkliste, Szenarien und tabweiser Referenz.
3. Dieses Markdown-Handbuch als dauerhafte Dokumentation ausserhalb der UI.

## Wie du das Tutorial benutzt

Die Hilfe ist absichtlich nicht nur als Feature-Liste aufgebaut.
Die Logik ist:

1. Erst den Systemzustand pruefen.
2. Dann Daten lesen und einordnen.
3. Dann erst eingreifen, korrigieren oder publizieren.

Empfohlene gefuehrte Touren im Tool:

- `Volltour: Alle Betriebsbereiche verstehen`
- `Erste produktive Session`
- `Szenario 2: Auswertung der Datenbank nach verschiedenen Kriterien`
- `Szenario: Ein neues Set sauber veroeffentlichen`
- `Szenario: VIP-User und Sessions verwalten`
- `Szenario: Performance- oder Laufzeitproblem eingrenzen`

## Empfohlene Reihenfolge fuer den Alltag

### Bei Session-Start

1. `Overview`
2. `Flight Deck`
3. `Advanced Settings`
4. je nach Aufgabe `Analytics`, `Data Explorer`, `Set Import` oder `Batch Import`
5. `System Monitor` nur bei technischen Fragen

### Bei Datenanalyse

1. `Overview`
2. `Analytics`
3. `Data Explorer`
4. optional `System Monitor`
5. optional Export

### Bei Publish eines einzelnen Sets

1. `Overview`
2. `Flight Deck`
3. `Set Import`
4. `Overview`
5. `Data Explorer`

## Tab fuer Tab

## Overview

### Zweck

Overview ist die Leitwarte fuer Workspace, Manifest, Datenbank und Git.
Hier klaerst du vor jeder weiteren Aktion, ob du auf einem belastbaren Ausgangszustand arbeitest.

### Wichtige Bereiche

- `Refresh`: Laedt Snapshot, Git-Status und juengste Daten neu.
- `Stats Sync`: Zieht fehlende `track_stats` fuer Manifest-IDs nach.
- Metrik-Karten: `Sets im Manifest`, `Analytics Events`, `VIP User`, `Sessions`.
- `Top Sets`: Ranking mit `plays`, `likes`, `last_played_at`.
- `Git / Runtime`: Branch, Dirty-Status, Status, Bookings, Subscribers.
- `Recent Analytics`: juengste Events mit Land, Geraet und Browser.

### Schritt fuer Schritt

1. Pruefe oben rechts `Workspace verbunden` und den Branch.
2. Lies die vier Metrik-Karten gemeinsam.
3. Pruefe `Top Sets` auf Plausibilitaet.
4. Wenn fehlende `track_stats`-IDs angezeigt werden, nutze `Stats Sync`.
5. Fuehre danach `Refresh` aus.
6. Lies `Recent Analytics` als Live-Signal fuer aktuelle Nutzung.
7. Pruefe `Git / Runtime`, bevor du publishst oder Daten manuell aenderst.

### Erfolgskriterien

- Workspace ist verbunden.
- Branch ist korrekt.
- Fehlende Stats sind abgeglichen.
- Aktuelle Analytics sind sichtbar oder nachvollziehbar leer.

### Typische Fehler

- Overview zu ueberspringen.
- Dirty-Status zu ignorieren.
- Leere Analytics sofort als Bug zu interpretieren.

## Analytics

### Zweck

Analytics verdichtet Nutzungsdaten zu fachlichen Aussagen ueber Reichweite, Nutzung, Resonanz und Muster.

### Wichtige Bereiche

- `Aktualisieren`
- `Bericht`
- Zeitraum mit `Von` / `Bis`
- Filter fuer `Event-Typ`, `Geraet`, `Land`
- Metrik-Karten fuer `Gesamtaufrufe`, `Plays`, `Likes`, `Engagement Rate`
- `Top Sets`
- `Geo-Verteilung`
- `Geraete-Breakdown`
- `Tageszeit-Verteilung`
- `Event-Typ-Uebersicht`

### Schritt fuer Schritt

1. Setze zuerst den Zeitraum.
2. Definiere danach optional `Event-Typ`, `Geraet` und `Land`.
3. Lies erst dann die vier Kennzahlen.
4. Vergleiche `Top Sets` im aktuellen Filterzustand.
5. Pruefe Geo- und Device-Bild gemeinsam.
6. Lies die Tageszeit-Verteilung fuer Timing-Fragen.
7. Exportiere den Bericht erst am Ende.

### So deutest du die Zahlen

- Viele `Views`, aber wenige `Plays`: Interesse vorhanden, Aktivierung schwach.
- Viele `Plays`, aber wenige `Likes`: Nutzung vorhanden, Resonanz schwach.
- Hohe `Engagement Rate`: Inhalt wirkt relevant.
- Deutliche Unterschiede zwischen Laendern oder Geraeten: Kontextfrage, kein Zufall.

### Typische Fehler

- Vor dem Filtern exportieren.
- Engagement Rate ohne Volumen lesen.
- Mobile- oder Land-Filter setzen und spaeter vergessen, dass sie aktiv sind.

## Data Explorer

### Zweck

Der Data Explorer ist die Arbeitsflaeche fuer Rohdaten, Tabellenpflege, Exporte und kontrollierte SQL-Abfragen.

### Wichtige Bereiche

- Tabellen-Dropdown
- Suchfeld `Filtern...`
- `CSV`
- `JSON`
- `Refresh`
- Tabellenspezifische Editoren
- `Read-only SQL`
- `Run Query`

### Tabellen und ihre Rolle

- `track_stats`: Aggregierte Set-Leistung.
- `analytics_logs`: Rohereignisse.
- `bookings`: Buchungsanfragen.
- `subscribers`: Newsletter-/Interessentenstatus.
- `users`: VIP- oder Admin-User.
- `sessions`: Aktive oder gespeicherte Sessions.

### Schritt fuer Schritt

1. Waehle zuerst die richtige Tabelle.
2. Begrenze die Datenmenge ueber das Suchfeld.
3. Arbeite nur mit kleinen Zielmengen.
4. Speichere einzelne Zeilen bewusst.
5. Fuehre danach `Refresh` aus.
6. Nutze SQL nur lesend.
7. Exportiere erst nach finalem Filter.

### Was in den editierbaren Tabellen moeglich ist

#### `track_stats`

- `plays`
- `likes`
- `dislikes`
- `last_played_at`
- `Save Row`

#### `subscribers`

- `email`
- `status`
- `Save Subscriber`

#### `users`

- VIP-User anlegen
- Passwort zuruecksetzen
- User loeschen

#### `sessions`

- Session widerrufen

### Read-only SQL

Nur lesende Queries sind hier vorgesehen.
Typische Muster:

```sql
select id, plays, likes, dislikes
from track_stats
order by plays desc
limit 20;
```

```sql
select id, event_type, item_id, country, device_type, created_at
from analytics_logs
order by created_at desc
limit 50;
```

Nach jeder Query:

1. `Run Query`
2. `rowCount` lesen
3. JSON-Ergebnis pruefen

## Set Import

### Zweck

Set Import ist der produktive Einzelpfad fuer neue oder aktualisierte Releases.

### Wichtige Bereiche

- Dropzone fuer Audio, Cover, Tracklist
- Tracklist-Standard: `.tracks.json`; CUE und `.mixcloud.txt` werden vor dem Publish normalisiert und validiert
- `Dateien waehlen`
- optional `Demo Import`
- Warnungsblock
- Draft-Felder
- `Audio Source`
- `Cover Source`
- Tracklist-Editor
- `Publish Set`
- `Publish Log`

### Schritt fuer Schritt

1. Lade Audio, Cover und optional Tracklist.
2. Lies die Warnungen zuerst.
3. Pruefe `ID`, `Titel`, `Datei`, `Dauer`, `Cover Path`, `Published At`.
4. Pruefe `New Badge aktiv` bewusst.
5. Bereinige die Tracklist zeilenweise und pruefe Warnungen zu Zeitstempeln oder Reihenfolge.
6. Kontrolliere `Audio Source` und `Cover Source`.
7. Starte `Publish Set`.
8. Lies das `Publish Log` bis zum Ende.
9. Kontrolliere das Ergebnis in `Overview` und bei Bedarf in `Data Explorer`.

### Typische Fehler

- Automatisch ermittelte ID ungeprueft uebernehmen.
- Warnungen ignorieren.
- Nach dem Publish nicht nachkontrollieren.

## Batch Import

### Zweck

Batch Import ist fuer groessere Eingangsmengen gedacht, nicht fuer die feine redaktionelle Endkontrolle.

### Wichtige Bereiche

- Status-Chips fuer Erfolg, Pending, Fehler
- `Start` / `Pause`
- Gesamtfortschritt
- Drag-and-Drop-Zone
- `Import-Queue`
- `Fertige loeschen`
- Fehlerzusammenfassung

### Schritt fuer Schritt

1. Ziehe mehrere Dateien in die Dropzone.
2. Pruefe Queue und Dateinamen.
3. Starte den Batch.
4. Beobachte Statuswechsel und Gesamtfortschritt.
5. Behandle Fehler als eigene Nacharbeitsliste.
6. Nutze `Fertige loeschen`, um die Queue sauber zu halten.

### Merksatz

Batch fuer Volumen.
Set Import fuer schwierige Einzelfaelle.

## Flight Deck

### Zweck

Flight Deck steuert die kompakte Betriebslogik des Tools: Workspace, Commands und Automation.

### Wichtige Bereiche

- `Workspace`
- `Settings speichern`
- `Workspace Root`
- `R2 Prefix`
- `Cover Output Dir`
- `Build Command`
- `Deploy Command`
- `Commit Template`
- `Publish Position`
- `Default Vinyl Color`
- Automation Toggles

### Schritt fuer Schritt

1. Verbinde oder pruefe den Workspace.
2. Kontrolliere R2 Prefix und Cover Output Dir.
3. Kontrolliere Build- und Deploy-Command.
4. Pruefe Commit Template und Publish Position.
5. Lies jeden Toggle einzeln:
   `Safe Mode`, `Upload Audio to R2`, `Extract Embedded Cover`, `Auto Seed Stats`, `Auto Build`, `Auto Deploy`, `Auto Commit`, `Auto Push`.
6. Speichere erst nach bewusstem Review.

### Typische Fehler

- Falscher Workspace Root.
- Auto Push aktivieren, obwohl Branch/Remote nicht geklaert sind.
- Safe Mode ohne guten Grund deaktivieren.

## Advanced Settings

### Zweck

Advanced Settings ist die feinere Konfiguration fuer Betrieb, Git, Deploy, Live Updates und Darstellung.

### Einstellungsgruppen

- `Workspace-Grundlagen`
- `Build & Deploy`
- `Git-Workflow`
- `Core Automation`
- `Live-Update-System`
- `Anzeigeoptionen`

### Schritt fuer Schritt

1. Arbeite immer gruppenweise.
2. Pruefe zunaechst Basiswerte und Deploy-Strategie.
3. Danach Git-Workflow.
4. Danach Core Automation.
5. Danach Live-Update-System.
6. Danach Anzeigeoptionen.
7. Speichere.
8. Lies den Save-Status bewusst.

### Typische Fehler

- Mehrere Strategien gleichzeitig umstellen.
- `Zuruecksetzen` mit Werksreset verwechseln.
- Den Save-Status nicht abwarten.

## System Monitor

### Zweck

System Monitor ist fuer technische Ursachenanalyse da, nicht fuer inhaltliche Datenfragen.

### Wichtige Bereiche

- `Aktualisieren`
- `Cache loeschen`
- `Optimieren`
- `RAM`
- `CPU`
- `Disk`
- `DB Connection`
- `Warnungen`
- `Memory-Nutzung`
- `Top Prozesse`
- `Alle Prozesse`

### Schritt fuer Schritt

1. Lies die vier Metriken oben gemeinsam.
2. Bearbeite Warnungen priorisiert.
3. Pruefe Speicherbelegung im Detail.
4. Vergleiche `Top Prozesse`.
5. Nutze Admin-Aktionen nur gezielt.
6. Fuehre danach erneut `Aktualisieren` aus.

### Typische Fehler

- Den Monitor fuer fachliche Reports zu missbrauchen.
- Nach `Cache loeschen` oder `Optimieren` nicht erneut zu messen.
- Nur Prozentwerte statt Warnungen und Prozesse zu betrachten.

## Tutorial

### Zweck

Der `Tutorial`-Tab ist jetzt das dauerhafte Handbuch im Tool.
Er ist nicht nur Hilfe fuer Einsteiger, sondern ein laufendes Betriebsinstrument.

### Was du dort findest

- Schnellstart-Checkliste
- Gefuehrte Touren
- Detaillierte Referenz pro Tab
- Praxisaufgaben
- Typische Fehlerbilder
- Ergebnischecks

## Szenario 2 im Detail

## Auswertung der Datenbank nach verschiedenen Kriterien

Dieses Szenario ist fuer den Fall gedacht, dass du wissen willst:

- welche Sets am besten performen
- welche Nutzeraktivitaet zuletzt stattgefunden hat
- welche Laender, Geraete oder Event-Typen relevant sind
- ob bestimmte Tabellen auffaellige oder fehlerhafte Daten enthalten
- welche Daten du fuer Reporting oder Kontrolle exportieren willst

### Saubere Arbeitsreihenfolge

1. `Overview`
2. `Analytics`
3. `Data Explorer`
4. optional `System Monitor`
5. optional Export

### 1. Ausgangslage pruefen

Oeffne `Overview`.
Pruefe:

- Workspace verbunden
- richtiger Branch
- ob der Workspace wirklich geladen ist
- `Sets im Manifest`
- `Analytics Events`
- `VIP User`
- `Sessions`
- `Top Sets`
- `Recent Analytics`

Warum das wichtig ist:
Wenn die Grunddaten hier nicht plausibel sind, ist die gesamte Auswertung unsicher.

### 2. Analytics fachlich auswerten

Oeffne `Analytics`.

#### Zeitraum

Setze `Von` und `Bis`.
Typische Zeitraeume:

- letzte 7 Tage
- letzter Monat
- seit Release eines Sets
- definierter Kampagnenzeitraum

#### Event-Typ

Filtere bei Bedarf auf:

- `Alle`
- `Play`
- `Like`
- `Dislike`
- `View`

Interpretation:

- `View`: Reichweite
- `Play`: echte Nutzung
- `Like`: positive Resonanz
- `Dislike`: negatives Signal

#### Geraet

Filter:

- `Alle`
- `Mobile`
- `Desktop`
- `Tablet`

#### Land

Setze `Land`, wenn die Frage geographisch ist.

Danach lies:

- Geo-Verteilung
- Gesamtaufrufe
- Plays
- Engagement Rate

#### Kennzahlen

Pruefe:

- `Gesamtaufrufe`
- `Plays`
- `Likes`
- `Engagement Rate`

Suche nach:

- viele Views, aber wenige Plays
- viele Plays, aber wenig Likes
- hohe Engagement Rate
- starke Unterschiede zwischen Laendern oder Geraeten

#### Top Sets

Lies die IDs im gesetzten Filterzustand.
Fragen:

- Welche Sets laufen stark?
- Welche schwach?
- Welche neuen Sets bekommen schon Traction?

#### Geraete und Tageszeit

Pruefe:

- `Geraete-Breakdown`
- `Tageszeit-Verteilung`

Fragen:

- eher mobil oder Desktop?
- Peaks zu bestimmten Uhrzeiten?
- sinnvoller Release-Zeitpunkt?

#### Report

Erst filtern, dann `Bericht`.

### 3. Data Explorer fuer Rohdaten

Wenn Analytics auffaellig ist, wechsel in `Data Explorer`.

### 4. `track_stats`

Waehle `track_stats`.
Filtere nach relevanter Set-ID oder Vergleichsgruppe.
Pruefe:

- `plays`
- `likes`
- `dislikes`
- `last_played_at`

Fragen:

- Welche Set-ID hat die meisten Plays?
- Welche Sets haben viele Plays, aber kaum Likes?
- Welche Sets wurden lange nicht mehr gespielt?
- Fehlen Manifest-Sets in `track_stats`?

### 5. `analytics_logs`

Waehle `analytics_logs`.
Filtere nach:

- `event_type`
- `item_id`
- `country`
- `device_type`
- `browser`

Fragen:

- Gibt es fuer Set X ueberhaupt aktuelle Events?
- Kommen Events nur aus einem Land?
- Ist ein Geraetetyp ueberrepraesentiert?
- Gibt es ungewoehnliche Muster?

### 6. `subscribers`

Nutze diese Tabelle, wenn dein Audit auch Interessenten- oder Newsletter-Daten umfasst.

Pruefe:

- E-Mail
- Status
- Pflegebedarf

### 7. `users`

Nutze `users`, wenn VIP- oder Admin-Zugaenge Teil der Systemkontrolle sind.

Moegliche Aktionen:

- User anlegen
- Passwort zuruecksetzen
- User loeschen

### 8. `sessions`

Nutze `sessions`, wenn du aktive oder auffaellige Sitzungen bewerten willst.

Pruefe:

- `created_at`
- `expires_at`
- Benutzerbezug

Fragen:

- Gibt es alte oder verdaechtige Sessions?
- Laufen zu viele gleichzeitig?
- Muss eine Session widerrufen werden?

### 9. Read-only SQL

Wenn Filter nicht reichen:

```sql
select id, plays, likes, dislikes
from track_stats
order by plays desc
limit 20;
```

```sql
select id, event_type, item_id, country, device_type, created_at
from analytics_logs
order by created_at desc
limit 50;
```

### 10. Export

Erst Tabelle und Filter final setzen.
Dann:

- `CSV` fuer Tabellen-/Excel-Arbeit
- `JSON` fuer technische Weiterverarbeitung

### 11. System Monitor nur bei Technikfragen

Nutze `System Monitor` nur dann, wenn Analyse oder Queries spuerbar langsam oder auffaellig sind.

### 12. Wann das Szenario sauber abgeschlossen ist

Die Auswertung ist erst dann wirklich abgeschlossen, wenn du diese Fragen beantworten kannst:

- Welcher Zeitraum wurde ausgewertet?
- Nach welchen Kriterien wurde gefiltert?
- Welche Sets fuehren?
- Welche Laender, Geraete und Event-Typen sind relevant?
- Stimmen Explorer-Rohdaten und Analytics-Bild ueberein?
- Wurde das Ergebnis exportiert oder dokumentiert?

## Design- und Onboarding-Idee hinter der Umsetzung

Die neue Hilfe im Tool orientiert sich an Mustern, die sich in aehnlichen Produkten bewaehrt haben:

- Pendo beschreibt In-App-Guidance als Kombination aus Resource Center, Checklisten und gefuehrten Walkthroughs im Produkt.
- Pendo empfiehlt ausserdem, Onboarding nicht als reine Feature-Tour, sondern entlang echter Nutzerziele und Workflows aufzubauen.
- Metabase strukturiert den Einstieg nicht als eine einzige lange Seite, sondern als aufeinander aufbauende Lerneinheiten wie `Find data`, `Ask a question`, `Explore dashboards` und `Use dashboard filters`.
- Supabase trennt bewusst zwischen tabellarischem Arbeiten im Table View und gezielten SQL-Abfragen im SQL Editor.

Quellen:

- https://support.pendo.io/hc/en-us/articles/20826000368411-Take-a-tour-of-Pendo
- https://www.pendo.io/pendo-blog/6-principles-for-effective-user-onboarding/
- https://www.metabase.com/learn/metabase-basics/getting-started/
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/database/tables
