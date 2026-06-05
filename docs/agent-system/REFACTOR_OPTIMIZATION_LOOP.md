# Refactor Optimization Loop

Stand: 2026-06-05

## Zweck

Refactor reduziert Komplexität nur dort, wo ein messbarer Nutzen entsteht. Dieses Runbook verhindert breite Umbauten ohne klare Wirkung.

Refactor ist im Website-Kontext nicht nur Review-Agent. Er muss wiederkehrend konkrete Entlastung fuer Erreichbarkeit, Stabilitaet und Funktionalitaet vorbereiten und zur Freigabe vorlegen: doppelte API-/URL-/Fehlerlogik abbauen, Service-Flows robuster machen, grosse Dateien in testbare Einheiten schneiden und lokale Runtime-Grenzen gegen Production-Stats absichern.

Refactor arbeitet in zwei getrennten Phasen:

1. Vorschlag: Refactor erstellt einen kleinen, ausfuehrbaren Patch-Vorschlag mit Ziel, betroffenen Dateien, Vorher-/Nachher-Nutzen, Risiko, Rueckfallpfad und Gates.
2. Ausfuehrung: Refactor setzt den genehmigten Vorschlag erst nach expliziter Nutzerfreigabe oder Master-Controller-Freigabe um, je nach Risikoklasse.

## Arbeitsregel

1. Routing prüfen: Welche Agenten und Module sind betroffen?
2. Risiko prüfen: Gibt es kritische Pfade, Build-/Test-Auswirkungen oder Release-Risiken?
3. Nutzen benennen: weniger Duplikation, klarere Zuständigkeit, bessere Tests, geringerer Wartungsaufwand.
4. Änderung klein schneiden: keine unverbundenen Refactors in Feature-Arbeit mischen.
5. Vorschlag vorlegen: maximal einen naechsten Patch empfehlen, keine Code-Aenderung ohne Freigabe ausfuehren.
6. Nach Freigabe ausfuehren: nur den genehmigten Scope umsetzen.
7. Nachweis liefern: Test, Build, Audit oder Visual Proof.

## Refactor-Ampel

- Gruen: isolierte Vereinfachung, klare Tests, keine API-Aenderung. Refactor darf den Vorschlag vorbereiten; Ausfuehrung erst nach Nutzer-OK fuer den konkreten Patch.
- Gelb: mehrere Module, aber klare Kompatibilitaet und Rueckfallstrategie. Refactor braucht Nutzer-OK und nennt Guardian-/Build-Gates vor Ausfuehrung.
- Rot: Datenmodell, Deployment, Auth, Worker-API, Social-Live-Aktionen, Desktop-Release oder ein Umbau mit Erreichbarkeits-/Funktionsrisiko betroffen. Master Controller einbeziehen, Guardian-Risiko pruefen, Rollback-Hinweis dokumentieren und erst nach Freigabe ausfuehren.

## Automatisierung

- `npm run agent:route` zeigt betroffene Agenten und empfohlene Gates.
- `npm run refactor:website:opportunities` erzeugt konkrete Website-Verbesserungsauftraege fuer Refactor.
- `npm run guardian:risk` fasst Release-Risiken und Blocker zusammen.
- `npm run agent:audit -- --strict` prueft, ob das Agentensystem selbst noch konsistent ist.

## Vorschlags- und Freigabeformat

Jeder Refactor-Vorschlag muss so formuliert sein, dass er direkt genehmigt oder abgelehnt werden kann:

- Ziel: ein Satz, welcher Nutzer- oder Wartbarkeitsnutzen entsteht.
- Scope: maximal ein Flow oder ein Modulverbund.
- Betroffene Dateien: konkrete Pfade.
- Aenderung: was genau entfernt, extrahiert, vereinheitlicht oder getestet wird.
- Risiko: Ampel Gruen, Gelb oder Rot.
- Rueckfallpfad: wie der Patch rueckgaengig gemacht oder deaktiviert wird.
- Gates: konkrete Befehle, mindestens der naechstliegende Test und `npm run build`.
- Freigabe: Ausfuehrung nur nach persoenlichem Nutzer-OK; bei Rot zusaetzlich Master Controller.

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
- Freigabestatus: `pending_user_ok`, `approved`, `rejected` oder `executed`,
- Recheck per Test, Build, Guardian-Risiko, Endpoint-Proof oder Visual Proof.

## Gravierender Stabilitaetsauftrag

Wenn Erreichbarkeit, Stabilitaet oder Funktionalitaet gefaehrdet sind, gilt `website-stability-refactor-execution`:

- Nutzer und Master Controller muessen den Scope freigeben.
- Refactor nennt betroffene Nutzerfluesse, Rueckfallpfad und erwarteten Vorher-/Nachher-Nutzen.
- Pflichtgates: `npm run quality:web`, `npm run guardian:risk`, `npm run agent:audit -- --strict`.
- Kein Abschluss ohne Nachweis, dass Website-Build, Kernfunktionen und Risiko-Review stabil sind.
