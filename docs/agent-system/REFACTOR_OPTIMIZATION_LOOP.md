# Refactor Optimization Loop

Stand: 2026-05-16

## Zweck

Refactor reduziert Komplexität nur dort, wo ein messbarer Nutzen entsteht. Dieses Runbook verhindert breite Umbauten ohne klare Wirkung.

## Arbeitsregel

1. Routing prüfen: Welche Agenten und Module sind betroffen?
2. Risiko prüfen: Gibt es kritische Pfade, Build-/Test-Auswirkungen oder Release-Risiken?
3. Nutzen benennen: weniger Duplikation, klarere Zuständigkeit, bessere Tests, geringerer Wartungsaufwand.
4. Änderung klein schneiden: keine unverbundenen Refactors in Feature-Arbeit mischen.
5. Nachweis liefern: Test, Build, Audit oder Visual Proof.

## Refactor-Ampel

- Gruen: isolierte Vereinfachung, klare Tests, keine API-Aenderung.
- Gelb: mehrere Module, aber klare Kompatibilitaet und Rueckfallstrategie.
- Rot: Datenmodell, Deployment, Auth, Worker-API, Social-Live-Aktionen oder Desktop-Release betroffen. Master Controller einbeziehen.

## Automatisierung

- `npm run agent:route` zeigt betroffene Agenten und empfohlene Gates.
- `npm run guardian:risk` fasst Release-Risiken und Blocker zusammen.
- `npm run agent:audit -- --strict` prueft, ob das Agentensystem selbst noch konsistent ist.
