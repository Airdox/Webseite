# AIRDOX Active Superagent Work Orders

Stand: 2026-05-03
Controller: Master Controller
Trigger: Nutzerauftrag, die Superagenten mit produktiven Arbeitsauftraegen zu versorgen.

## Aktivierungslauf

Lokale Checks und Dispatches aus dieser Aktivierung:

- `npm run agent:jobs:validate`: PASS, 18 Jobs geprueft.
- `npm run agents:background`: PASS, 3/3 Script-Jobs erfolgreich angestossen: Repository, Guardian, Manni.
- `npm run agent:jobs:run -- --event=manual_background --status=planning`: 1 Script-Job ausgefuehrt, 2 Designer-Jobs als MANUAL-Auftraege protokolliert.
- `npm run lint`: PASS.
- `npm run test -- --run`: FAIL, 3 Timeouts in `src/desktop/__tests__/DesktopApp.test.jsx`.

Nicht freigegeben:

- Keine externe Social-Live-Ausspielung.
- Kein Deploy oder Release.
- Keine gravierende Architektur-, Branch- oder Security-Aenderung ohne Master-Controller-Freigabe.

## Full-Power Service-Improvement Sprint

Ziel:
- Alle Superagenten arbeiten auf ein gemeinsames Produktziel: Die Website und die AIRDOX-Dienstleistung sollen klarer, vertrauenswuerdiger, schneller, stabiler und besser konvertierend werden.

Leitmetriken:
- Mehr qualifizierte Booking-Anfragen.
- Mehr Set-Plays, Shares, Newsletter-Anmeldungen und VIP-Interesse.
- Weniger UI-/API-Fehler, weniger lokale Production-Drift, weniger Support-Fragen.
- Klare Proof-Signale statt harter unbelegter Claims.

## Website War Room - gebuendelte Teilauftraege

Arbeitsmodus:
- Webbie fuehrt die Website-Nutzerreise.
- Manni liefert Angebots- und Conversion-Perspektive.
- Designer sichert visuelle Qualitaet.
- Guardian blockt Risiken und definiert Gates.
- Refactor reduziert technische Reibung.
- Mentor dokumentiert Regeln aus Fehlern.
- Repository haelt Arbeitsstraenge und Artefakte sauber.
- Winnie unterstuetzt nur dort, wo Website-Service und Windows Flight Deck zusammenhaengen, z. B. Publish-Qualitaet, Proof-Artefakte und Release-Bedienbarkeit.

### WS-01: Startseite in klare Nutzerreise verwandeln

Owner:
- Lead: Webbie
- Support: Manni, Designer, Guardian

Ziel:
- Ein neuer Besucher versteht innerhalb weniger Sekunden Sound, Glaubwuerdigkeit und naechsten Schritt.

Teilauftraege:
- Hero pruefen: Musik-CTA, Booking-CTA und Proof-Signale muessen sofort erfassbar sein.
- Section-Reihenfolge pruefen: Bio, AgentSystem, Music, VIP, EPK, Booking, Newsletter muessen einen natuerlichen Weg bilden.
- Navigation an DOM-Reihenfolge angleichen und aktive Section stabil halten.
- Mobile Menue, Auth-Buttons und Section-Jumps gegen echte Bedienung testen.

Betroffene Dateien:
- `src/App.jsx`
- `src/components/Hero.jsx`
- `src/components/Navigation.jsx`
- `src/components/BioSection.jsx`
- `src/components/AgentSystemSection.jsx`
- `e2e/navigation.spec.js`

Definition of done:
- Playwright prueft mindestens Start -> Musik und Start -> Booking.
- Mobile Sichtpruefung fuer Menue und wichtigste CTAs.
- Keine sichtbaren toten Navigationsziele.

### WS-02: Booking als Service-Kern stabilisieren

Owner:
- Lead: Guardian
- Support: Webbie, Manni, Refactor

Ziel:
- Booking-Anfragen funktionieren verlaesslich und fuehlen sich professionell an.

Teilauftraege:
- API-Fehler robust lesen, aber keine internen Details anzeigen.
- Pflichtfelder und Fehlertexte aus Nutzerperspektive pruefen.
- Erfolgsmeldung und naechster Schritt klar machen.
- Tracking-Event fuer `booking_submit` pruefen.
- Booking-Copy auf klare Leistungssignale trimmen: Berlin, Clubs/Festivals, Soundprofil, Antwortweg.

Betroffene Dateien:
- `src/components/BookingSection.jsx`
- `src/components/BookingSection.css`
- `src/server/worker.js`
- `src/lib/stats-logic.js`
- `src/utils/apiResponse.js`
- `src/components/__tests__/BookingSection.test.jsx`

Definition of done:
- Test fuer leeren Fehlerbody, Validierungsfehler und Success-Pfad.
- Keine `Unexpected end of JSON input`-Meldung im UI.
- `npm run lint` und gezielter Booking-Test gruen.

### WS-03: Newsletter und VIP als wiederkehrenden Kontaktkanal reparieren

Owner:
- Lead: Webbie
- Support: Guardian, Manni, Refactor

Ziel:
- Newsletter/VIP sind kein dekorativer Bereich, sondern ein funktionierender Kontakt- und Community-Funnel.

Teilauftraege:
- `/api/subscribe` im Worker routen und vorhandenen Subscribe-Handler anbinden.
- Newsletter-Frontend auf Success, Duplicate, Invalid Email und DB-Fehler testen.
- Newsletter-Copy konkretisieren: Was bekommt der Nutzer, wie oft, warum lohnt es sich?
- VIP-Verweis in Musik/Booking/Newsletter konsistent fuehren.

Betroffene Dateien:
- `src/components/Newsletter.jsx`
- `src/components/Newsletter.css`
- `src/components/VIPSection.jsx`
- `src/server/worker.js`
- `src/lib/stats-logic.js`
- `src/utils/apiResponse.js`

Definition of done:
- Subscribe-Route ist erreichbar.
- Unit- oder Integrationstest fuer Error/Success.
- Keine internen DB-Details im UI.

### WS-04: Musikbereich als Hauptprodukt schaerfen

Owner:
- Lead: Webbie
- Support: Manni, Guardian, Refactor, Designer

Ziel:
- Sets sollen schnell spielbar, teilbar und glaubwuerdig bewertet sein.

Teilauftraege:
- Play/Pause, Tracklist, Share, Like/Dislike und VIP-Download als Kernfluss pruefen.
- Voting-Wechsel `like -> dislike`, `dislike -> like`, `unlike`, `undislike` stabilisieren.
- Audio-Playback und Download-URLs ueber dieselbe Base-Logik fuehren.
- Music Cards auf mobile Scanbarkeit, Fokus und Badge-Layout pruefen.

Betroffene Dateien:
- `src/components/MusicSection.jsx`
- `src/components/MusicSection.css`
- `src/components/__tests__/MusicSection.test.jsx`
- `src/contexts/AudioContext.jsx`
- `src/lib/set-access.js`
- `src/utils/stats-sync.js`

Definition of done:
- MusicSection-Tests fuer Voting und URL-Aufbau.
- Manuelle Sichtpruefung: Set Card, aktiver Player, Share, VIP-Download.
- Localhost erzeugt keine unbeabsichtigten Production-Stats.

### WS-05: AgentSystemSection als glaubwuerdigen Proof statt Behauptung fuehren

Owner:
- Lead: Designer
- Support: Manni, Webbie, Guardian, Mentor

Ziel:
- Die neue Agenten-Sektion soll Vertrauen schaffen, ohne harte oder driftende Live-Claims zu verkaufen.

Teilauftraege:
- Audit-Zahlen als Snapshot kennzeichnen oder aus aktuellen Artefakten ableiten.
- Copy auf konkrete Arbeitsweise, Rollen, Gates und Grenzen ausrichten.
- Tastaturbedienung, Tabs, Fokus, Roster und Mobile-Layout pruefen.
- Proof-Screenshots aktualisieren und nicht als Ersatz fuer Tests behandeln.

Betroffene Dateien:
- `src/components/AgentSystemSection.jsx`
- `src/components/AgentSystemSection.css`
- `src/utils/i18n.js`
- `docs/proof/agent-system-desktop.png`
- `docs/proof/agent-system-mobile.png`

Definition of done:
- Keine unbelegten Live-Claims.
- Mobile und Desktop Proof vorhanden.
- Mindestens ein Test oder klarer Fixture-Check fuer angezeigte Metriken.

### WS-06: Website-Service-API haerten

Owner:
- Lead: Guardian
- Support: Refactor, Webbie, Mentor

Ziel:
- Alle Website-Formulare und Service-Endpunkte verhalten sich konsistent, sicher und testbar.

Teilauftraege:
- Worker-Routen gegen Frontend-Calls abgleichen: Booking, Newsletter, Stats, Auth, Audio.
- Production-Fehlerantworten ohne interne `details: error.message` ausgeben.
- Gemeinsame Response-Reader fuer leere, nicht-JSON und JSON-Fehler nutzen.
- CORS/HEAD/Range-Verhalten fuer Audio mit Tests oder manueller Checkliste absichern.

Betroffene Dateien:
- `src/server/worker.js`
- `src/server/router.js`
- `src/lib/stats-logic.js`
- `src/utils/apiResponse.js`
- `src/utils/__tests__/apiResponse.test.js`

Definition of done:
- Route-Matrix Frontend -> Worker ist vollstaendig.
- Fehlertexte sind nutzerfreundlich und nicht intern.
- Guardian stuft offene API-Risiken als Blocker/Warnung/Nice-to-have ein.

### WS-07: Performance und Stabilitaet als Release-Gate sichtbar machen

Owner:
- Lead: Guardian
- Support: Webbie, Refactor, Repository

Ziel:
- Website-Qualitaet soll nicht nur subjektiv sein; Build, Tests, E2E und Audit muessen den Release absichern.

Teilauftraege:
- `quality:web` als Pflichtbatterie fuer Website-Aenderungen behandeln.
- E2E-Flows fuer Navigation, Musik, Booking und Newsletter priorisieren.
- Lazy Loading und große Sektionen auf sichtbare Ladepausen pruefen.
- Repository trennt Proof-Artefakte von Produktcode.

Definition of done:
- `npm run lint`
- `npm run test -- --run`
- `npm run build`
- `npx playwright test e2e/navigation.spec.js e2e/sanity.spec.js`
- `npm run agent:audit -- --strict`

### Handoff-Regeln fuer enge Zusammenarbeit

- Manni liefert Copy- und Angebotsentscheidungen an Webbie und Designer.
- Webbie setzt Nutzerfluss und Frontend-Verhalten um oder spezifiziert die Aenderung.
- Refactor darf erst abstrahieren, wenn Webbie/Guardian den konkreten Reibungspunkt benannt haben.
- Guardian prueft jeden Nutzerkontakt-Flow vor Abschluss.
- Designer prueft jede sichtbare neue oder geaenderte Sektion auf Desktop und Mobile.
- Mentor schreibt nur Regeln, die aus einem echten Fehler oder einer echten Entscheidung dieses Sprints stammen.
- Repository schneidet Aenderungen vor Abschluss in nachvollziehbare Arbeitsstraenge.

### Webbie: Website-Erlebnis und Conversion verbessern

Auftrag:
- Hero, Bio, AgentSystem, Music, EPK, Booking, Newsletter und VIP als Nutzerreise pruefen: Kommt ein neuer Besucher schnell zu Musik, Vertrauen und Anfrage?
- Above-the-fold und Navigation auf mobile/desktop scannen: kein Textueberlauf, keine unklare Prioritaet, keine toten Ziele.
- Booking-CTA und Musik-CTA staerken, ohne Marketing-Landingpage daraus zu machen.
- E2E-Flows definieren: Start -> Musik, Start -> Booking, Start -> Newsletter, Start -> Agent-Proof.

Definition of done:
- `e2e/navigation.spec.js` oder neue E2E-Spec deckt mindestens zwei reale Nutzerpfade ab.
- Desktop- und Mobile-Sichtpruefung dokumentiert.
- `npm run build` bleibt gruen.

### Manni: Angebot, Vertrauen und Anfragequalitaet schaerfen

Auftrag:
- Website-Copy aus Sicht von Booker, Club, Festival und Fan pruefen.
- Booking-Abschnitt auf klare Leistungssignale trimmen: Soundprofil, Standort, Einsatzarten, Kontaktweg, naechster Schritt.
- Newsletter/VIP-Angebot so formulieren, dass der Nutzen konkret ist: exklusive Sets, fruehe Downloads, Termine, Community.
- AgentSystem-Proof als Vertrauensbaustein nutzen, aber keine uebertriebenen Autonomie- oder Live-Gate-Claims.

Definition of done:
- Konkrete Copy-Aenderungsvorschlaege fuer Booking, Newsletter und AgentSystem liegen vor oder sind umgesetzt.
- Erfolgsmessung pro CTA definiert: Booking submit, Newsletter subscribe, Set play, Share, VIP click.

### Designer: Visuelle Qualitaet und Wiedererkennbarkeit erhoehen

Auftrag:
- Gesamte Website auf visuelle Hierarchie pruefen: wichtige Aktionen muessen schnell erfassbar sein.
- AgentSystemSection, Music Cards, Booking Form und Newsletter auf mobile Textlaengen, Fokuszustaende und Layoutstabilitaet testen.
- Proof-Screenshots fuer wichtige Zustande aktualisieren: Desktop, Mobile, Booking-Fehler, Newsletter-Feedback, Agent-Proof.
- Flight Deck bekommt dieselbe visuelle Disziplin: stabile Panels, klare Statusfarben, keine springenden Controls.

Definition of done:
- Mindestens zwei Proof-Bilder oder eine dokumentierte visuelle QA fuer kritische Views.
- Keine bekannten Textueberlaeufe in den geprueften Views.

### Guardian: Service-Gates und Release-Risiken blocken

Auftrag:
- Alles, was Nutzerkontakt, Daten oder Vertrauen betrifft, hart pruefen: Booking, Newsletter, Auth/VIP, Stats, Audio, Worker-Fehler.
- Production-Fehlerantworten duerfen keine internen Details leaken.
- Fehlende API-Routen und Localhost-zu-Production-Drift als Release-Blocker behandeln.
- Tests so fokussieren, dass echte Service-Risiken abgedeckt sind, nicht nur Snapshots.

Definition of done:
- `npm run lint`
- `npm run test -- --run`
- `npm run agent:audit -- --strict`
- Liste offener Release-Risiken mit Blocker/Warnung/Nice-to-have.

### Refactor: Service-Flows vereinfachen

Auftrag:
- Wiederholte API-Response- und URL-Base-Logik zentralisieren, aber nur eng geschnitten.
- Audio-, Stats-, Newsletter- und Booking-Fehlerbehandlung konsistent machen.
- Grosse Komponenten nur dort entlasten, wo dadurch Testbarkeit oder Stabilitaet real besser wird.
- Keine kosmetische Architekturarbeit ohne messbaren Service-Nutzen.

Definition of done:
- Ein gemeinsamer Helper oder klarer lokaler Pattern-Vorschlag fuer API-Fehler und Base-URLs.
- Tests fuer mindestens einen vorher fragilen Flow.

### Winnie: Windows Tool als Service-Betriebssystem stabilisieren

Auftrag:
- Flight Deck als Arbeitswerkzeug fuer schnelle, fehlerarme Releases verbessern: Import, Draft, Publish, Batch, Analytics und Tutorial.
- Fehlertexte sollen handlungsorientiert sein: was ist kaputt, was soll der Nutzer jetzt tun?
- Mock-Modus und Electron-Modus duerfen nicht auseinanderlaufen.
- Visuelle Stabilitaet und Logik-Stabilitaet aus dem Winnie-Auftrag unter P1 priorisiert umsetzen.

Definition of done:
- `npm run desktop:test:logic`
- Bei Release-Kandidat: `npm run desktop:test:e2e`
- Mindestens ein stabilisierter Nutzerpfad: Import -> Draft -> Publish oder Batch -> Live-Pruefung.

### Mentor: Lernen in Regeln umwandeln

Auftrag:
- Wiederholte Fehler in konkrete Projektregeln ueberfuehren: API-Routen muessen Worker-seitig registriert sein, Production-Fallbacks brauchen Schutz, harte UI-Claims brauchen aktuelle Quelle.
- Neue Regeln in Wiki, Decision Log oder Agentenauftrag dokumentieren.
- Fuer jeden groesseren Fix eine kurze Lernnotiz: Ursache, Schutztest, naechstes Mal frueher erkennbar durch.

Definition of done:
- Decision Log oder Wiki enthaelt mindestens eine neue verwertbare Regel aus diesem Sprint.

### Repository: Umsetzung kontrollierbar halten

Auftrag:
- Dirty Tree nach Themen schneiden: Website-Service, Desktop-Service, Agent-Proof, Governance, Proof-Artefakte.
- Untracked Artefakte pruefen: gehoeren sie zum Sprint oder sind sie nur lokale Beweise?
- Vor Merge/Release muss klar sein, welche Dateien bewusst Teil des Service-Verbesserungspakets sind.

Definition of done:
- `git status --short` ist erklaerbar nach Arbeitsstrang.
- `npm run repository:monitor:strict` oder begruendete Abweichung.

## P0 - Release-Blocker

### Winnie + Guardian: Desktop-Testblocker klaeren

Ziel:
- `npm run test -- --run` wieder gruen bekommen oder den Blocker nachvollziehbar eingrenzen.

Betroffene Dateien:
- `src/desktop/__tests__/DesktopApp.test.jsx`
- `src/desktop/DesktopApp.jsx`
- `src/desktop/mockApi.js`

Auftrag:
- Die drei Timeouts in `DesktopApp.test.jsx` bei den Tests `renders the overview in mock mode`, `loads a demo import draft in browser mode` und `opens the interactive tutorial and exposes scenario tours` analysieren.
- Pruefen, ob der Grund echte UI-Blockade, zu lange Initialisierung, Mock-Drift oder zu knappes Test-Timeout ist.
- Nur dann Timeout erhoehen, wenn die UI nachweislich korrekt rendert und der Test realistisch zu kurz ist.

Definition of done:
- Gezielter Lauf: `npx vitest run src/desktop/__tests__/DesktopApp.test.jsx`
- Gesamt-Lauf: `npm run test -- --run`
- Guardian dokumentiert Rest-Risiko, falls Desktop-E2E noch separat offen bleibt.

### Webbie + Manni + Refactor + Guardian: Newsletter-End-to-End reparieren

Ziel:
- Newsletter-Anmeldungen duerfen nicht ins Leere laufen.

Betroffene Dateien:
- `src/components/Newsletter.jsx`
- `src/server/worker.js`
- `src/lib/stats-logic.js`
- `src/utils/apiResponse.js`
- `src/utils/__tests__/apiResponse.test.js`

Auftrag:
- `/api/subscribe` im Worker routen und den vorhandenen `handleSubscribeRequest` anbinden.
- Invalid-Email-, Duplicate-, Success- und DB-Fehlerfaelle pruefen.
- Production-Fehlerantworten ohne interne `error.message`-Details ausliefern.
- Frontend-Feedback so halten, dass echte Servermeldungen nicht unnoetig verloren gehen.

Definition of done:
- Unit-Tests fuer Subscribe-Route und Fehlerkoerper.
- `npm run lint`
- `npx vitest run src/utils/__tests__/apiResponse.test.js src/components/__tests__/BookingSection.test.jsx`
- Optional nach Routing-Fix: Playwright-Check fuer Newsletter-Success/Error.

## P1 - Produktive Verbesserung

### Winnie + Guardian + Designer: Windows Flight Deck visuell und logisch stabilisieren

Ziel:
- Das Windows Tool soll robuster wirken und robuster laufen: klare visuelle Zustaende, weniger UI-Flackern, nachvollziehbare Fehler, stabile Import-/Publish-/Batch-Logik.

Betroffene Dateien:
- `src/desktop/DesktopApp.jsx`
- `src/desktop/desktop.css`
- `src/desktop/components/*`
- `src/desktop/lib/*`
- `src/desktop/mockApi.js`
- `src/desktop/__tests__/DesktopApp.test.jsx`
- `src/desktop/__tests__/AdminFeatures.test.jsx`
- `e2e/desktop-flightdeck.spec.js`
- `e2e/flightdeck-quality.spec.js`
- `e2e/flightdeck-assistant.spec.js`

Auftrag:
- Visuelle Stabilitaet: Header, Tabbar, Notices, Status-Pills, Publish-Log, Batch-Status und Tutorial-Overlay auf konsistente Abstaende, feste Hoehen, klare Loading-/Error-/Success-Zustaende und mobile/kleine Fenster pruefen.
- Logik-Stabilitaet: Initialisierung, Workspace-Wechsel, Mock/Electron-Modus, Import-Draft, Publish, Go Live, Batch-Queue, Tutorial-State und Settings-Save auf Race Conditions, doppelte Busy-Zustaende und haengende Promises pruefen.
- Fehlerfuehrung verbessern: Nutzer sieht eine klare Ursache und naechste Aktion; technische Details bleiben in Logs oder Tests, nicht als unstrukturierter UI-Text.
- `src/desktop/DesktopApp.jsx` gezielt entlasten: nur risikoarme Extraktionen in bestehende `src/desktop/components/*` oder `src/desktop/lib/*`, keine breite Architektur-Aenderung ohne Master-Controller-Freigabe.
- Tests zuerst gegen die aktuellen Timeouts stabilisieren, danach visuelle/logic-Regressionsfaelle ergaenzen.

Definition of done:
- `npx vitest run src/desktop/__tests__/DesktopApp.test.jsx`
- `npm run desktop:test:logic`
- `npm run desktop:test:e2e`
- Mindestens ein Test deckt einen visuellen/State-Stabilitaetsfall ab, z. B. Notice/Publish-Status/Batch-Progress/Tutorial-Overlay.
- Guardian dokumentiert Rest-Risiko, falls `desktop:dist` oder Installer-Pruefung noch nicht gelaufen ist.
- Designer bestaetigt, dass das Flight Deck bei Desktop- und kleiner Fensterbreite nicht ueberlappt und keine instabilen Layoutspruenge zeigt.

### Refactor + Guardian: Localhost darf Production nicht verschmutzen

Ziel:
- Lokale Dev- und Testlaeufe duerfen keine Live-Analytics verfaelschen.

Betroffene Dateien:
- `src/utils/stats-sync.js`
- `src/contexts/AudioContext.jsx`
- `src/components/MusicSection.jsx`
- `src/lib/set-access.js`

Auftrag:
- API- und Audio-Basen konsistent ueber Env/Fallbacks fuehren.
- Localhost-Stats-Posts entweder lokal routen, deaktivieren oder klar als Dev-Modus markieren.
- Playback- und Download-URLs nach derselben Base-Logik behandeln.

Definition of done:
- Tests fuer Localhost-URL-Auswahl.
- Manuelle Pruefung: Localhost erzeugt keine Production-Stats.

### Webbie: Navigation als Single Source of Truth stabilisieren

Ziel:
- Navigation, DOM-Reihenfolge und aktive Section duerfen nicht auseinanderlaufen.

Betroffene Dateien:
- `src/App.jsx`
- `src/components/Navigation.jsx`
- `src/components/EPKSection.jsx`
- `e2e/navigation.spec.js`

Auftrag:
- `sectionIds`, `navItems` und DOM-Reihenfolge angleichen.
- Newsletter/Agent-System bewusst einordnen: sichtbar verlinken oder bewusst aus Nav auslassen und dokumentieren.
- Mobile Auth-Aktionen sollen das mobile Menue schliessen.

Definition of done:
- `npx playwright test e2e/navigation.spec.js`
- Mobile Sichtpruefung fuer Menue/Login/Register.

### Webbie + Guardian: Music-Voting und Audio-Downloads konsistent machen

Ziel:
- Engagement-Zahlen und Set-Zugriff muessen glaubwuerdig bleiben.

Betroffene Dateien:
- `src/components/MusicSection.jsx`
- `src/components/__tests__/MusicSection.test.jsx`
- `src/lib/set-access.js`

Auftrag:
- Optimistic UI bei `unlike`/`undislike` korrigieren.
- Wechsel `like -> dislike` und `dislike -> like` sauber testen.
- Download-URLs an dieselbe Audio/API-Base wie Playback koppeln.

Definition of done:
- Unit-Tests fuer Like, Unlike, Dislike, Undislike und Wechsel.
- `npx vitest run src/components/__tests__/MusicSection.test.jsx`

### Designer + Manni + Webbie: AgentSystemSection als ehrlichen Proof fuehren

Ziel:
- Die neue Agenten-Sektion darf keine driftenden oder ueberharten Live-Claims zeigen.

Betroffene Dateien:
- `src/components/AgentSystemSection.jsx`
- `src/components/AgentSystemSection.css`
- `src/utils/i18n.js`
- `docs/proof/agent-system-desktop.png`
- `docs/proof/agent-system-mobile.png`

Auftrag:
- Hardcoded Audit-/Testzahlen entweder als klarer Snapshot beschriften oder aus gepflegten Artefakten ableiten.
- Copy so formulieren, dass sie konkrete Arbeitsweise und Grenzen zeigt, nicht Dauerautonomie behauptet.
- Mobile Scanbarkeit, Tastatur-Fokus und Textueberlauf pruefen.

Definition of done:
- Render-Test oder Fixture-Test fuer angezeigte Metriken.
- Desktop- und Mobile-Screenshot aktualisieren.
- `npm run lint`

### Manni + Designer: Social-Draft-Produktion aus Reel-Queue starten

Ziel:
- Aus der generierten Reel-Queue werden verwertbare Entwuerfe, ohne live zu posten.

Betroffene Dateien:
- `docs/agent-system/manni-reel-queue.json`
- `docs/agent-system/manni-reel-weekly-plan.md`
- `docs/agent-system/manni-reel-draft-pack.md`
- `docs/agent-system/DECISION_LOG.md`

Auftrag:
- Slot 1-4 aus der Queue als Draft-Paket priorisieren.
- Pro Slot: Hook, erstes Frame, Caption, CTA, Safe-Area-Notiz und benoetigte Rohasset-ID definieren.
- Nutzerfreigabe-Paket vorbereiten, aber nichts extern veroeffentlichen.

Definition of done:
- Draft-Pack enthaelt pro Slot konkrete Copy und Asset-Checkliste.
- Decision Log enthaelt nur dann Live-Freigabe, wenn persoenliches Nutzer-OK vorliegt.

## P2 - Governance und Lernsystem

### Repository + Mentor: Job-Governance schaerfen

Ziel:
- Die Orchestrierung soll weniger blinde Flecken haben.

Betroffene Dateien:
- `scripts/superagent-task-gate.mjs`
- `scripts/agent-job-validator.mjs`
- `scripts/agent-job-runner.mjs`
- `docs/agent-system/job-catalog.json`
- `docs/agent-system/ORCHESTRATION_WORKFLOW.md`

Auftrag:
- `Master Controller` als erlaubten Active Agent im Task-Gate pruefen.
- Validator soll erkennen, ob `job.script` in `package.json` existiert.
- `external_live` soll allgemein Nutzerfreigabe brauchen, nicht nur im Social-Media-Fall.
- Optional: datierte Run-Historie neben `latest-*` einfuehren.

Definition of done:
- `npm run agent:jobs:validate -- --strict-warnings`
- `npm run tasks:gate`
- Dokumentierter Migrationshinweis, falls `latest-*` weiter ueberschrieben wird.

## Reihenfolge

1. Winnie + Guardian: Desktop-Testblocker.
2. Winnie + Guardian + Designer: Windows Flight Deck visuell und logisch stabilisieren.
3. Webbie + Manni + Refactor + Guardian: Newsletter/API.
4. Refactor + Guardian: Localhost/Production-Trennung.
5. Webbie: Navigation und Music-Voting.
6. Designer + Manni: AgentSystem-Proof und Social-Drafts.
7. Repository + Mentor: Governance-Haertung.

## Recheck-Batterie

```powershell
git status --short
npm run lint
npm run test -- --run
npm run build
npm run agent:jobs:validate -- --strict-warnings
npm run agent:audit -- --strict
npm run repository:monitor:strict
```
