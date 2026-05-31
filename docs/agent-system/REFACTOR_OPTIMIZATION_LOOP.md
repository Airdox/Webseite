# Refactor Optimization Loop

Stand: 2026-05-16

## Zweck

Refactor reduziert Komplexität nur dort, wo ein messbarer Nutzen entsteht. Dieses Runbook verhindert breite Umbauten ohne klare Wirkung.

Refactor ist im Website-Kontext nicht nur Review-Agent. Er muss wiederkehrend konkrete Entlastung fuer Erreichbarkeit, Stabilitaet und Funktionalitaet vorbereiten: doppelte API-/URL-/Fehlerlogik abbauen, Service-Flows robuster machen, grosse Dateien in testbare Einheiten schneiden und lokale Runtime-Grenzen gegen Production-Stats absichern.

## Arbeitsregel

1. Routing prüfen: Welche Agenten und Module sind betroffen?
2. Risiko prüfen: Gibt es kritische Pfade, Build-/Test-Auswirkungen oder Release-Risiken?
3. Nutzen benennen: weniger Duplikation, klarere Zuständigkeit, bessere Tests, geringerer Wartungsaufwand.
4. Änderung klein schneiden: keine unverbundenen Refactors in Feature-Arbeit mischen.
5. Nachweis liefern: Test, Build, Audit oder Visual Proof.

## Refactor-Ampel

- Gruen: isolierte Vereinfachung, klare Tests, keine API-Aenderung.
- Gelb: mehrere Module, aber klare Kompatibilitaet und Rueckfallstrategie.
- Rot: Datenmodell, Deployment, Auth, Worker-API, Social-Live-Aktionen, Desktop-Release oder ein Umbau mit Erreichbarkeits-/Funktionsrisiko betroffen. Master Controller einbeziehen, Guardian-Risiko pruefen und Rollback-Hinweis dokumentieren.

## Automatisierung

- `npm run agent:route` zeigt betroffene Agenten und empfohlene Gates.
- `npm run refactor:website:opportunities` erzeugt konkrete Website-Verbesserungsauftraege fuer Refactor.
- `npm run guardian:risk` fasst Release-Risiken und Blocker zusammen.
- `npm run agent:audit -- --strict` prueft, ob das Agentensystem selbst noch konsistent ist.

## Website-Pflichtauftrag

Refactor muss bei Website-Aenderungen mindestens eine dieser Fragen beantworten:

1. Welche wiederholte Service-Logik macht Booking, Newsletter, VIP/Auth, Musik oder Stats fragiler?
2. Welche grosse Datei blockiert Testbarkeit oder verlangsamt sichere Aenderungen?
3. Welche lokale Runtime- oder Analytics-Grenze kann Production-Daten verfaelschen?
4. Welcher kleinste Patch verbessert die Seite sichtbar oder macht den naechsten sichtbaren Patch sicherer?

Jede Antwort braucht:

- betroffene Dateien,
- Vorher-/Nachher-Nutzen,
- maximal einen eng geschnittenen naechsten Patch,
- Recheck per Test, Build, Guardian-Risiko, Endpoint-Proof oder Visual Proof.

## Gravierender Stabilitaetsauftrag

Wenn Erreichbarkeit, Stabilitaet oder Funktionalitaet gefaehrdet sind, gilt `website-stability-refactor-execution`:

- Master Controller muss den Scope freigeben.
- Refactor nennt betroffene Nutzerfluesse, Rueckfallpfad und erwarteten Vorher-/Nachher-Nutzen.
- Pflichtgates: `npm run quality:web`, `npm run guardian:risk`, `npm run agent:audit -- --strict`.
- Kein Abschluss ohne Nachweis, dass Website-Build, Kernfunktionen und Risiko-Review stabil sind.
