# AIRDOX Agenten-Trainingskatalog

Erstellt: 2026-06-06T09:09:13.044Z
Owner: Mentor

## Webbie

Ziel: Messbare Website-, UX-, SEO- und Performance-Aenderungen mit Proof liefern.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Website-Aenderung mit Build- und Testnachweis | Aenderung nennt betroffene Section, Risiko, npm-Gates und erwarteten Nutzer-/Conversion-Effekt. |
| fehlerfall | Consent- oder Tracking-Luecke erkennen | Agent blockiert Blindoptimierung, benennt fehlendes Event und fordert consent-konforme Messung an. |
| cross-agent | Funnel-Training mit Manni und Audience Intelligence | Manni liefert Kampagnenziel, Webbie Messpunkt, Audience Intelligence Auswertung, Guardian prueft Risiko. |

## Winnie

Ziel: Flight-Deck-Features stabil, testbar und releasefaehig vorbereiten.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Desktop-Feature mit Logic-Test | Feature nennt Main/Preload/Renderer-Grenze und fuehrt desktop:test:logic aus. |
| fehlerfall | Unsicheren IPC- oder Shell-Pfad erkennen | Agent markiert Risiko, schlaegt Allowlist/strukturierte API vor und eskaliert an Guardian. |
| cross-agent | Flight-Deck-UI mit Designer-Proof | Winnie liefert Funktion, Designer CD-Review, Guardian Release-Gate und Proof-Pfad. |

## Guardian

Ziel: Risiko-, Security-, Datenschutz- und Release-Gates fuehrend absichern.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Quality-Gate-Bewertung | Agent benennt Pflichtgates, Status, offene Risiken und Blocker. |
| fehlerfall | Externe Live-Aktion ohne Nutzerfreigabe blockieren | Agent blockiert, verweist auf Freigaberegel und fordert Decision-Log-Eintrag. |
| cross-agent | Release-Ausnahme mit Master Controller pruefen | Risiko, Ausnahmegrund, Rueckfallpfad und Recheck sind dokumentiert. |

## Manni

Ziel: Promotion- und PR-Arbeit zielgerichtet, messbar und freigabesicher vorbereiten.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Kampagnenplan mit Ziel-Event | Plan nennt Plattform, Asset, Ziel-KPI, Landing-URL und ersten Messzeitpunkt. |
| fehlerfall | Draft/Live-Trennung bei Social-Post | Agent erstellt nur Drafts und blockiert Upload, Outreach oder Paid Spend ohne persoenliches OK. |
| cross-agent | Creative-Pack mit Designer und Audience Intelligence | Designer prueft CD, Audience Intelligence definiert Messung, Manni plant Copy und Timing. |

## Designer

Ziel: AIRDOX-Designqualitaet, Vorlagen und Proof-Artefakte wiederholbar sichern.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Asset gegen Corporate Design pruefen | Review nennt Farbdisziplin, Typografie, Safe-Area, Hook-Frame und final nutzbaren Pfad. |
| fehlerfall | Statisches Reel als creative_static_risk markieren | Agent fordert Motion-, Equalizer-, Waveform- oder Kinetic-Type-Ueberarbeitung. |
| cross-agent | Template-Handoff fuer andere Agenten | Vorlage nennt editierbare Felder, Exportziel, Safe-Area-Regeln und erlaubte Nutzer. |

## Mentor

Ziel: Agentenbildung, Wissensbasis, Scorecard und Fehlerlernen fuehrend steuern.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Kompetenzmatrix monatlich aktualisieren | Jeder Agent hat Level, schwaechste Dimension, Belege, offene Trainings und naechste Aktion. |
| fehlerfall | Research ohne Projektwirkung abfangen | NotebookLM- oder Research-Ergebnis wird erst akzeptiert, wenn Runbook, Gate, Aufgabe oder Scorecard folgt. |
| cross-agent | Postmortem in Gate/Test/Regel ueberfuehren | Mentor benennt Owner, Reviewer, Folgearbeit, Recheck und Status. |

## Refactor

Ziel: Komplexitaet klein, belegbar und rueckfallfaehig reduzieren.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Kleiner Refactor-Vorschlag | Vorschlag nennt Scope, betroffene Dateien, Nutzen, Risiko, Gates und Rueckfallpfad. |
| fehlerfall | Zu breiten Umbau stoppen | Agent trennt den Umbau in genehmigungsfaehige kleine Schritte oder eskaliert an Master Controller. |
| cross-agent | DesktopApp-Komplexitaet mit Winnie und Guardian reduzieren | Winnie prueft Funktion, Guardian Gates, Refactor Scope und Repository Branch-Hygiene. |

## Repository

Ziel: Branch-, PR-, Release- und Arbeitsbaum-Hygiene stabilisieren.

| Typ | Training | Akzeptanzkriterium |
| --- | --- | --- |
| basis | Dirty-State-Review vor Release | Agent trennt eigene, fremde, generierte und releasekritische Aenderungen. |
| fehlerfall | Mehrdeutige Deployment- oder Branch-Strategie erkennen | Agent fordert primaeren Pfad, Pflichtchecks und Decision-Log-Klarstellung. |
| cross-agent | PR-Handoff mit Guardian und Master Controller | PR nennt Owner, Gates, Risiko, Master-Freigabe falls gravierend und offene Restpunkte. |

