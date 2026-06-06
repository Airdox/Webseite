# Photoshop Automation Agent Research fuer AIRDOX

Stand: 2026-06-06
Status: NotebookLM Deep Research erfolgreich nach Re-Login. Ergaenzt mit lokalen AIRDOX-Brand-Regeln.

NotebookLM:
- Notebook: `Deep Research: Photoshop Automatisierung Agenten Keywords`
- Notebook ID: `ad27667f-ecee-4f8c-aa4d-0ab660fc0197`
- URL: https://notebooklm.google.com/notebook/ad27667f-ecee-4f8c-aa4d-0ab660fc0197
- Research Task: `a27c20c0-d8a3-484d-a58d-598b34617cab`
- Ergebnis: 60 Quellen gefunden, 73 Quellen-Eintraege im Notebook, davon viele `ready`; einige duplizierte/fehlgeschlagene URL-Imports blieben als `error` stehen.

## Executive Summary

Photoshop-Automatisierung ist fuer AIRDOX am sinnvollsten als hybrides System aus lokalen JSX/ExtendScript-Skripten, UXP/BatchPlay fuer moderne Photoshop-Aktionen, optionaler Creative-Cloud-/Photoshop-API fuer Cloud-Batch-Jobs und einem Agenten-Handoff, das Prompts, PSD-Struktur, Safe Areas, Exportziele und Brand-Regeln kontrolliert.

Der beste kurzfristige Pfad ist nicht ein komplett autonomer Photoshop-Agent, sondern ein kontrollierter `Designer Agent`:

- generiert oder findet Ausgangsframes,
- schreibt ein Handoff-Manifest,
- erzeugt JSX/PSD-Layer-Struktur,
- oeffnet Photoshop lokal per COM oder `-r`,
- markiert manuelle Finishing-Aufgaben,
- validiert Export, Lesbarkeit, Safe Area und AIRDOX-CD-Konformitaet.

Das passt bereits zum Bestand: `scripts/render-daumenkino.mjs` erzeugt Handoff, Photoshop-Frame und JSX; `desktop/main/index.cjs` kann Photoshop-Pfade pruefen und Skripte starten.

## NotebookLM Synthese

NotebookLM bewertet fuer AIRDOX drei Hauptpfade:

1. Photoshop API v2 fuer cloudbasierte High-Volume-Produktion mit Smart-Object- und Text-Layer-Austausch.
2. UXP plus BatchPlay fuer lokale Photoshop-Plugins, interaktive Designer-Tools und moderne JavaScript-Automatisierung.
3. Hybride Pipeline: lokale JSX/UXP-Automation fuer Feinarbeit, Cloud-API fuer wiederholbare Rendervarianten, Agenten-Gate fuer Brand- und Exportkontrolle.

Die empfohlene Agentenarchitektur ist ereignisgetrieben:

- Orchestrator erzeugt Job-Manifest.
- Photoshop Runner fuehrt JSX, UXP oder API-Job aus.
- Brand Gate prueft AIRDOX-CD, Safe Area, sichtbare Texte und Farbwelt.
- Export Validator prueft Formate, Dimensionen, Zielkanal und Proof-Assets.

NotebookLM warnt vor diesen Grenzen:

- Generative KI bleibt bei Text, Gesichtern, Haenden und markengenauer Typografie unsicher.
- Technische Begriffe wie `BatchPlay`, `ActionJSON`, `ExtendScript`, `UXP Scripting` gehoeren nicht auf die Hauptseite.
- Verwechslungen mit anderen `Airdox`-Suchtreffern muessen aktiv vermieden werden.
- Photoshop API v1 ist fuer neue Planung ungeeignet; neue Architektur sollte auf v2 und UXP ausgerichtet werden.

## Quellenlage

- Adobe Photoshop UXP erlaubt moderne Plugin-Entwicklung und Zugriff auf Photoshop-DOM sowie BatchPlay fuer niedrigere Photoshop-Aktionen: https://developer.adobe.com/photoshop/uxp/
- Adobe beschreibt BatchPlay als Weg, Photoshop-Aktionen auf Action-Manager-Ebene auszufuehren: https://developer.adobe.com/photoshop/uxp/2022/ps_reference/media/batchplay/
- Adobe Photoshop Scripting/JavaScript bleibt fuer Automatisierung, Actions, Batch und lokale Skript-Workflows relevant: https://www.adobe.com/devnet/photoshop/scripting.html
- Adobe Firefly Services enthalten APIs fuer Photoshop-nahe Creative-Automatisierung, u.a. Image-, Firefly- und Creative-Production-Workflows: https://developer.adobe.com/firefly-services/
- Photoshop APIs im Adobe Developer-Kontext decken cloudbasierte Bild-/PSD-Verarbeitung ab, wenn lokale UI-Steuerung nicht noetig ist: https://developer.adobe.com/firefly-services/docs/photoshop/
- OpenAI Agents SDK/Tools sind relevant fuer Orchestrierung, Tool-Auswahl, Validierung und human-in-the-loop Workflows, nicht als Ersatz fuer Photoshop-eigene APIs: https://platform.openai.com/docs/guides/agents

## Automatisierungsoptionen

1. Lokales JSX/ExtendScript

Einsatz: schnelle lokale Automatisierung, bestehende Photoshop-Versionen, PSD-Layer, Exporte, Masken, Textlayer, Guides.

Vorteile:
- passt zum bestehenden AIRDOX-Setup,
- robust fuer lokale Windows-Workflows,
- kann Photoshop direkt mit Skript starten,
- gut fuer wiederholbare Reel-/Thumbnail-/EPK-Assets.

Grenzen:
- alte API-Oberflaeche,
- nicht ideal fuer moderne Plugin-UIs,
- Generative-Fill-Interaktion bleibt oft UI- oder versionsabhaengig.

2. UXP Plugin plus BatchPlay

Einsatz: internes AIRDOX Photoshop Panel fuer Brand-konforme Asset-Produktion.

Vorteile:
- moderner Photoshop-Plugin-Weg,
- UI fuer Presets, Safe-Area, Exportziele, Brand Tokens,
- BatchPlay kann Funktionen erreichen, die DOM nicht sauber abbildet.

Grenzen:
- Entwicklungsaufwand hoeher als JSX,
- Packaging/Signierung/Versionierung beachten,
- fuer einfache Batch-Jobs eventuell zu schwer.

3. Photoshop Actions und Droplets

Einsatz: stabile Makros fuer Export, Look, Farbpass, Sharpening, Resize, Watermark.

Vorteile:
- sehr schnell fuer Designer,
- leicht trainierbar,
- Agent kann Actions anstossen oder vorbereiten.

Grenzen:
- schwerer zu versionieren,
- weniger transparent als Code,
- Fehlerbehandlung schwach.

4. Photoshop/Creative Cloud APIs

Einsatz: serverseitige Batch-Verarbeitung, Smart-Object-Replacement, Rendervarianten, automatisierte Exportpipelines.

Vorteile:
- skalierbar,
- kein lokaler Photoshop-Desktop noetig,
- gut fuer Template-zu-Output Workflows.

Grenzen:
- API-Abdeckung ist nicht identisch mit Desktop Photoshop,
- Auth, Kosten, Limits und Asset-Speicher muessen eingeplant werden,
- fuer feinste manuelle Bildbearbeitung ungeeignet.

5. UI-Agent / Computer-Use

Einsatz: nur als Fallback fuer Bedienpfade, die weder API noch Skript sauber abdecken.

Vorteile:
- kann bestehende UI bedienen,
- nuetzlich fuer Generative-Fill-Dialoge oder Plugin-Flaechen ohne API.

Grenzen:
- fragiler als APIs,
- braucht Screenshots, Zustandserkennung und harte Abbruchregeln,
- immer mit Human-Review bei externen Assets.

## Empfohlene AIRDOX Agenten-Architektur

### Designer Agent

Aufgabe:
- erstellt Handoff-Manifest aus Brief, Set-ID, Hook, CTA, Format, Safe Area,
- generiert JSX oder UXP-Job,
- erzeugt PSD-Gruppen: `Brand`, `Safe Area`, `Motion Notes`, `Export`,
- markiert manuelle Aufgaben fuer Photoshop-Finish.

### Photoshop Runner

Aufgabe:
- prueft `AIRDOX_PHOTOSHOP_EXE`,
- startet Photoshop mit JSX,
- schreibt Done/Error Marker,
- sammelt Exportpfade.

### Brand Gate

Aufgabe:
- prueft AIRDOX in Versalien,
- prueft Palette: `#050608`, `#0f141a`, `#00f0ff`, `#9adf6b`,
- prueft keine warmen/beigen Corporate-Flaechen,
- prueft Safe Area fuer 9:16 Social UI,
- blockiert sichtbare interne Labels wie `draft`, `pending`, `approval`.

### Export Validator

Aufgabe:
- prueft PNG/MP4/PSD vorhanden,
- prueft Dimensionen,
- prueft Dateigroesse und Codec,
- erstellt Preview-Proof fuer Nutzerfreigabe.

## Sinnvolle AIRDOX Keyword-Erweiterung

### Kernmarke

AIRDOX, AIRDOX.INFO, AIRDOX Berlin, AIRDOX BLN, Berlin Underground Techno, Berlin Techno DJ, Underground Techno DJ, Industrial Techno DJ, Dark Techno DJ, Raw Techno Sets, Driving Techno, Peak Time Techno, Hypnotic Techno, Club Techno, Techno Live Set, DJ Set Berlin, Techno Booking Berlin

### Sound und Szene

Berlin club sound, underground club culture, industrial club energy, dark warehouse techno, raw basement techno, driving rhythms, hypnotic groove, no compromise techno, purist techno, warehouse set, late night techno, hardgroove influence, dark neon techno, pressure techno, peak moment techno

### Content und Social

AIRDOX live set, full techno set, techno mix download, techno tracklist, DJ set stream, underground techno reel, techno short, club reel, waveform reel, beat reactive visual, kinetic type reel, glitch type drop, techno thumbnail, first frame design, social loop, vertical club video

### Design-Signatur

dark neon design, cyan accent, lime accent, black anthracite layout, club poster system, industrial typography, stencil type, graffiti lettering, broken neon sign, waveform typography, scanline sweep, light gate, equalizer motion, VU meter, parallax still, glitch hit, kinetic type

### Photoshop-/Agenten-Themen fuer interne Auffindbarkeit

Photoshop automation, Photoshop JSX, Photoshop scripting, ExtendScript, Photoshop UXP, BatchPlay, Photoshop Actions, Photoshop COM automation, PSD template automation, smart object replacement, layer mask automation, batch export, generative fill handoff, safe area guides, design agent, creative automation, asset pipeline, brand asset generator

### Long-Tail SEO nur fuer Tech-/Behind-the-Scenes-Seiten

AIRDOX Photoshop automation workflow, Berlin techno visual automation, automated club visuals, AI assisted Photoshop workflow, Photoshop agent for social assets, techno reel design automation, underground techno visual identity, DJ brand asset automation, automated PSD social template, generative fill club poster workflow

## Keyword-Nutzung nach Kanal

Website-Startseite:
- Fokus auf Musik/Booking, nicht auf Photoshop.
- Geeignet: `AIRDOX`, `Berlin Underground Techno`, `Techno DJ`, `Industrial Techno`, `Dark Techno`, `DJ Sets`, `Techno Booking Berlin`.

EPK/Booking:
- Fokus auf Vertrauen und Einsatz.
- Geeignet: `Berlin Techno DJ`, `Underground Techno Booking`, `Club DJ Berlin`, `Peak Time Techno`, `Techno Event Booking`.

Social/Reels:
- Fokus auf Hook und Plattformsuche.
- Geeignet: `#AIRDOX`, `#BerlinTechno`, `#UndergroundTechno`, `#IndustrialTechno`, `#DarkTechno`, `#TechnoDJ`, `#DJSet`, `#LiveSet`, `#ClubTechno`, `#TechnoReels`.

Interne Agenten-/Design-Dokumentation:
- Fokus auf Wiederauffindbarkeit.
- Geeignet: `Photoshop JSX`, `UXP`, `BatchPlay`, `Design Agent`, `Brand Gate`, `PSD Template`, `Safe Area`, `Kinetic Type`, `Glitch Type Drop`.

Behind-the-scenes Blog/Case Study:
- Hier duerfen Photoshop- und Agenten-Keywords sichtbar werden.
- Arbeitstitel: `How AIRDOX builds automated dark neon techno visuals with Photoshop agents`.

## Konkrete naechste Umsetzung

1. Kein direktes Ausrollen der Photoshop-Automation-Keywords in die Hauptseite, weil sie die Musik-/Booking-Positionierung verwässern.
2. Neue interne Keyword-Liste in `docs/brand/` oder `docs/agent-system/` als Quelle fuer Agenten nutzen.
3. Optional eine `Behind the visuals`-Sektion oder versteckte Case-Study-Seite bauen, in der Photoshop-Automation und Agenten-Keywords organisch passen.
4. Bestehenden Photoshop-Runner erweitern:
   - `AIRDOX_PHOTOSHOP_EXE` klar dokumentieren,
   - Done/Error Marker standardisieren,
   - Export Validator an Brand Gate koppeln.
5. Mittelfristig UXP-Panel pruefen:
   - Preset-Auswahl,
   - Brand Token Import,
   - Safe-Area Overlay,
   - Export Buttons fuer Reel, Thumbnail, Story.

## NotebookLM Status

NotebookLM wurde gemaess Skill verwendet:

- `notebooklm status` erfolgreich,
- `notebooklm auth check --json` formal ok,
- `notebooklm create ...` schlug wegen abgelaufener Google-Session fehl,
- `notebooklm login` konnte in dieser nicht-interaktiven Shell nicht abgeschlossen werden.

Nach interaktivem Login kann dieselbe Recherche in NotebookLM nachgezogen werden:

```powershell
notebooklm login
notebooklm create "Deep Research: Photoshop Automatisierung Agenten Keywords"
notebooklm source add-research "Photoshop automation agents UXP BatchPlay ExtendScript Creative Cloud API generative fill workflow brand asset automation" --mode deep --import-all
```
