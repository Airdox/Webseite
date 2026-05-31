# Meta Free Agent Skills Research

Stand: 2026-05-27

NotebookLM notebook: `de250d4d-9454-438e-ad0f-3d8b37fe6694`

## Ergebnis

Fuer AIRDOX bleibt der kostenlose und kontoschonende Weg ein Draft-first-Workflow:

1. Agenten erstellen Content-Pakete fuer Instagram, Facebook, Threads und optional TikTok/YouTube Shorts.
2. Designer prueft sichtbare Assets und Captions gegen AIRDOX Corporate Design.
3. Guardian/Manni pruefen Spam-, DM-, API- und Budget-Risiken.
4. Der Nutzer gibt einzelne Posts frei.
5. Upload erfolgt zunaechst manuell ueber Meta Business Suite oder ein platform-ready Copy/Paste-Paket.
6. Offizielle Meta Graph API wird erst genutzt, wenn OAuth, oeffentliche Medien-URL und explizite Freigabe vorhanden sind.

Kein kostenloser Hobby-Workflow darf Browserautomatisierung, Login-Cookies, Scraping, automatische Likes/Follows, kalte Massen-DMs oder Paid-Spend als Standardweg verwenden.

## Kostenlose Stack-Entscheidung

| Ebene | Kostenfrei nutzbarer Pfad | AIRDOX-Regel |
| --- | --- | --- |
| Planung | `manni-reel-weekly-plan.md`, `manni-reel-queue.json`, Google Sheets/CSV optional | Inhalte bleiben intern, bis ein Preview-Paket existiert. |
| Generierung | lokale Agenten, `npm run social:auto`, Caption-/Hashtag-Drafts | Agenten duerfen vorbereiten, nicht live posten. |
| Pruefung | Designer + Manni + Guardian | Kein sichtbares Asset ohne CD-/Risiko-Notiz. |
| Publishing | Meta Business Suite manuell, spaeter offizielle Meta Graph API | Jede Live-Aktion braucht persoenliches Nutzer-OK. |
| Tracking | `social-post-ledger.json`, Meta Business Suite Insights, manuelle KPI-Exports | Keine Optimierung ohne Plattform/URL/Zeitpunkt/KPI-Eintrag. |

## Agenten-Skills

### `campaign-context`

Haelt Zielgruppe, Tonalitaet, Angebot, Tabus, CTA, Plattformen, Landing-URL, Hashtag-Grenzen und Risiko-Regeln in einem kompakten Kampagnenkontext. Alle weiteren Skills lesen diesen Kontext zuerst.

### `content-calendar`

Erstellt aus Set-Releases, Website-Zielen und vorhandenen Assets einen Wochenplan. Standard fuer organische Meta-Posts bleibt drei Posts pro Woche; Launch-Wochen duerfen mehr Drafts vorbereiten, aber nicht ohne Freigabe live gehen.

### `caption-writer`

Erzeugt plattformspezifische Varianten:

- Instagram: Hook, Caption, 3-8 Hashtags, optional erster Kommentar.
- Facebook: etwas laenger, klarer Link-/Event-Kontext.
- Threads: kurz, diskussionsfaehig, ohne Hashtag-Overload.
- Story: knapper Text, Sticker-/Link-Hinweis.

### `creative-brief`

Formuliert konkrete Visual-/Reel-Briefings fuer Designer oder Renderer: Hook-Frame, Safe-Area, Track-Moment, Text-Overlays, CTA, Exportformat.

### `compliance-check`

Blockiert riskante Muster:

- kein Scraping und keine Login-Cookie-Nutzung,
- keine automatisierten Likes/Follows,
- keine kalten Massen-DMs,
- keine parallelen Dritttools auf demselben Konto,
- keine Werbeausgaben ohne separates Budget-OK,
- keine API-Publikation ohne offizielle OAuth-/Token-Basis.

### `approval-gate`

Erzwingt die Statuskette:

```text
idea -> draft -> designer_reviewed -> risk_reviewed -> user_approved -> scheduled_or_published -> ledger_recorded
```

`user_approved` darf nur durch persoenliches Nutzer-OK entstehen. Alle vorherigen Stufen sind externe Drafts, keine Veroeffentlichung.

### `analytics-review`

Verarbeitet manuelle Meta-Business-Suite- oder Plattform-Exporte. Mindestens erforderlich: Plattform, Post-URL, Zeit, Asset, Caption-ID, Reichweite, Aufrufe/Plays, Speicherungen/Teilungen, Follows, Link-Klicks, Kommentarqualitaet.

## Meta-spezifische Grenzen

- Meta Business Suite ist der bevorzugte kostenlose Startpunkt fuer manuelle Planung und Publishing.
- Instagram/Facebook API-Publishing ist technisch moeglich, benoetigt aber offizielle App-/Token-/Permission-Flows und eine oeffentlich erreichbare Medien-URL.
- Threads API kann als spaeterer offizieller Kanal ergaenzt werden, bleibt aber ebenfalls API-/Token-gebunden.
- Marketing API ist fuer bezahlte Kampagnen gedacht und fuer Hobby-Nullbudget nur fuer Analyse/Tests interessant, nicht als Standardkanal.

## Umsetzung in AIRDOX

Bestehende Jobs bleiben die operative Basis:

- `manni-reel-factory`: generiert Queue und Wochenplan.
- `social-auto-preview-pack`: rendert externe Draft-Pakete.
- `social-draft-production`: macht platform-ready Preview-Pakete.
- `designer-reel-cd-review`: prueft sichtbare Assets.
- `pr-social-reach-ops-plan`: plant kanalgenaue Social-Operationen.
- `social-live-publish-gate`: blockiert Live-Aktionen bis Nutzer-OK.

Naechste konkrete Erweiterung ist kein neuer Live-Publisher, sondern ein standardisiertes `Meta Business Suite Kopier-/Einfuegepaket` pro freigegebenem Draft mit:

- Zielplattformen,
- finales Asset,
- finale Caption je Plattform,
- Hashtags,
- Landing-URL,
- vorgeschlagener Termin Europe/Berlin,
- KPI-Ziel,
- Risiko-/Freigabezeile,
- Ledger-Vorlage fuer den Post nach Veroeffentlichung.

Ausfuellbare Vorlage: `docs/agent-system/META_BUSINESS_SUITE_COPY_PASTE_PACK_TEMPLATE.md`

## Quellenanker

- Meta Business Suite Scheduling: `https://www.facebook.com/help/389849807718635`
- Meta Business Suite Post/Draft Help: `https://www.facebook.com/help/642707099175171/`
- Meta Threads API Postman Workspace: `https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api`
- Meta Marketing API Postman Workspace: `https://www.postman.com/meta/facebook-marketing-api/overview`
- Bestehendes AIRDOX Meta Setup: `docs/agent-system/META_GRAPH_PUBLISHING_SETUP.md`
- Bestehender AIRDOX Free-Social-Workflow: `docs/agent-system/AIRDOX_FREE_SOCIAL_AUTOMATION.md`
