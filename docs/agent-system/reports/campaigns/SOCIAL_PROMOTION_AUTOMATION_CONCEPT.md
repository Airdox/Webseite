# AIRDOX Social Promotion Automation Concept

Stand: 2026-05-23
Owner: Manni
Review: Designer, Audience Intelligence, Guardian, Master Controller

## Zielbild

AIRDOX soll regelmaessig fertige Social-Media-Pakete fuer Instagram, Facebook, TikTok und YouTube Shorts vorbereiten. Die Agenten duerfen neue Sets erkennen, Hook-Momente auswaehlen, vertikale Reels/Stories rendern, Captions schreiben, Hashtags setzen, Landing-URLs pruefen und dir ein fertiges Preview-Paket zeigen. Nach persoenlichem OK darf der genehmigte Inhalt automatisch auf den freigegebenen Social-Media-Kanaelen veroeffentlicht werden.

Das Ziel ist ein woechentlicher Produktionsrhythmus:

- 3 bis 5 fertige Reel-/Short-Varianten pro Woche.
- 3 bis 7 Story-Frames pro Woche, vor allem fuer neue Sets, Website-Hinweise und Reminder.
- 1 kompakter Freigabebericht pro Batch mit MP4/PNG-Preview, Caption, Plattform, geplanter Uhrzeit, Ziel-URL und Risiko-Notiz.
- Nach Veroeffentlichung: KPI-Review und naechste Hook-Entscheidung.

Beschlossene Phase-1-Kanaele:

- Instagram Reels und Stories.
- Facebook Reels und Stories.
- TikTok.
- YouTube Shorts.

Posting-Frequenz:

- Standard: 3 veroeffentlichte Social-Posts pro Woche.
- Bei neuen Sets: bis zu 1 Post pro Tag fuer die Launch-Woche, solange genuegend freigegebene Assets vorhanden sind.
- Jeder Post bleibt approval-pflichtig; die Frequenz aktiviert keine automatische Live-Ausspielung ohne Freigabe.

Posting-Zeitfenster, initiale Benchmark-Regel:

- Standard-Wochenplan: Dienstag 17:00, Mittwoch 16:00, Donnerstag 18:00, jeweils Europe/Berlin.
- Ersatzslot: Freitag 16:00 fuer YouTube Shorts oder TikTok, wenn ein Wochenpost verschoben wird.
- New-Set-Launch: taeglich 16:00-18:00, mit Instagram/Facebook eher 16:00-17:00 und TikTok/YouTube Shorts eher 17:00-18:00.
- Wochenenden nur fuer Launch-Reminder oder bereits gut laufende Assets; Sonntag ist kein Standardslot.
- Diese Zeiten sind Startwerte aus externen Benchmarks und muessen nach 4 Wochen gegen eigene AIRDOX-KPIs getestet werden.

Sprache und Ton:

- gemischt deutsch/englisch.
- Kurz, direkt, club-/setnah, ohne kuenstliche Marketingfloskeln.
- CTA je nach Asset: Website-Stream, Set anhoeren, Profil folgen, teilen/speichern, Booking/VIP/Newsletter oder Collab-Signal.

## Agentenrollen

### Master Controller

Steuert den Ablauf, achtet auf Approval-Gates und entscheidet bei Konflikten zwischen Automation, Markenqualitaet und Live-Posting. Er darf Jobs einplanen und Reports einfordern, aber keine Social-Posts live schalten.

### Manni

Ist der Campaign-Owner. Manni waehlt Sets, Hooks, Plattformen, Posting-Slots, Caption-Varianten, Hashtags, CTAs und Landing-URLs. Manni erstellt das Freigabepaket und dokumentiert, welche Assets fuer welche Plattform vorgeschlagen sind.

### Designer

Prueft und verbessert First Frame, Safe Areas, Lesbarkeit, Website-nahe AIRDOX-CD, Thumbnail, Story-Layout und visuelle Konsistenz. Designer markiert nur Assets als freigabereif, die ohne interne Labels sichtbar nach aussen gehen koennen.

Genehmigte Design-Templates duerfen wiederverwendet werden. Designer muss dann nur erneut pruefen, wenn sich Layout, sichtbarer Textumfang, Branding, Safe-Area-Zonen, Plattformformat oder Asset-Typ wesentlich aendern.

Designer muss zusaetzlich proaktiv ein kleines Varianten-Portfolio vorbereiten, sobald Set, Hook oder Kampagnenanker bekannt sind. Dieses Portfolio ist kein finaler Upload, sondern eine Entscheidungsgrundlage mit 3 bis 5 Richtungen, kurzem Motion-Ansatz, First-Frame-Idee, Risiken, Quellen und Empfehlung. Output:

- `docs/agent-system/latest-designer-portfolio.md`
- `docs/agent-system/latest-designer-portfolio.json`
- `docs/agent-system/visual-templates/designer/designer-portfolio-output/`

### Audience Intelligence

Liefert die Entscheidung, welche Hook-Typen getestet werden: Drop-Moment, Transition-Breakdown, Floor-Energy, Website-Reminder, New-Set-Announcement, Behind-the-Set oder Collab-CTA. Nach jedem Live-Post wertet der Agent Retention, Link-Klicks, Saves, Shares, Follows und Profilbesuche aus.

### Guardian

Prueft Risiken: Rechte-/Track-Metadaten, fremde UI-Elemente, erkennbare Personen, falsche Claims, kaputte Links, fehlende Freigabe oder versehentliches externes Posting.

### Webbie

Stellt sicher, dass Website-Ziele passen: neue Sets sind sichtbar, Deep Links funktionieren, Player/Set-Metadaten stimmen, und die Landing-URL aus dem Social-Post fuehrt an die richtige Stelle.

## Produktionsworkflow

### 1. Trigger

Ein Batch wird automatisch oder manuell gestartet, wenn eines dieser Ereignisse eintritt:

- neues Set ist in `src/data/musicSets.js` als `isNew: true` markiert.
- woechentlicher Growth-Review ist faellig.
- Manni erkennt eine Reach-Chance oder einen Winner aus vorherigen Posts.
- du forderst explizit ein Social-Paket an.

### 2. Queue und Wochenplan

Manni fuehrt `manni:reels:generate` aus und erzeugt eine kanalfaehige Queue fuer Instagram, Facebook, TikTok und YouTube Shorts:

- `docs/agent-system/manni-reel-queue.json`
- `docs/agent-system/reports/campaigns/manni-reel-weekly-plan.md`
- `docs/agent-system/reports/campaigns/manni-reel-draft-pack.md`

Jeder Queue-Eintrag braucht:

- Set-ID, Set-Titel, Track, Timestamp, Landing-URL.
- Hook und sichtbarer First-Frame-Text.
- Plattformen und Format: Reel, Story, Short oder Feed-Clip.
- Zielmetrik: Completion Rate, Shares, Saves, Link-Klicks, Profilbesuche oder Follows.
- Approval-Status: immer `draft_allowed_publish_pending_user_ok`, bis du explizit freigibst.

### 3. Automatisches Preview-Rendering

Manni oder Designer fuehrt fuer die besten Queue-Eintraege `social:auto` aus. Standardpaket fuer jede geeignete Plattform:

- 15 Sekunden Story-Hook.
- 30 Sekunden Teaser.
- 59 Sekunden Reel/Short.
- Preview-PNG pro Variante.
- `manifest.json` mit Asset-Pfaden, Hook, Set, Startzeit, Ziel-URL und Publish-Status.
- `captions.json` mit Copy fuer Instagram, Facebook, TikTok und YouTube Shorts.
- `upload-copy-paste.md` als menschlich lesbarer Freigabezettel.

Output:

`docs/agent-system/visual-templates/social/social-auto-output/<set-id>/`

Wenn der genaue Hook schon bekannt ist:

```powershell
npm run social:auto -- --set-id="recording_2026_05_07-2" --start="17:58" --durations="15,30,59"
```

Wenn nur Metadaten/Captions vorbereitet werden sollen:

```powershell
npm run social:auto:dry
```

### 4. Designer-Portfolio und Review

Vor groesseren finalen Renderings erzeugt Designer:

```powershell
npm run designer:portfolio
```

Ziel:

- mehrere visuelle Richtungen sichtbar machen,
- langweilige Standard-Typografie frueh aussortieren,
- AIRDOX als zentrales Videoelement planen,
- Content-Bedarf oder Nutzerentscheidungen frueh melden.

Danach prueft Designer jedes Preview:


- AIRDOX ist sofort sichtbar.
- `AIRDOX.INFO` oder die Website-Route ist lesbar.
- Text liegt nicht in Instagram-/TikTok-/Shorts-UI-Zonen.
- Cover/Set-Visual passt zur Website.
- Kein internes Label wie `draft`, `pending`, `approval` im sichtbaren Asset.
- Audio-Cut, Waveform und Startzeit passen zum Hook.

Nicht bestandene Assets gehen zurueck in die Queue mit konkreter Korrektur: Hook kuerzen, First Frame staerken, Timing verschieben, Caption anpassen, Safe Area korrigieren oder neuen Clip rendern.

### 5. Freigabevorschau fuer dich

Vor jeder Veroeffentlichung muss Manni dir ein Freigabepaket zeigen:

- Plattform: Instagram Reel, Instagram Story, Facebook Reel, TikTok, YouTube Short.
- Asset-Link: MP4 und Preview-PNG.
- Caption final.
- Hashtags final.
- Landing-URL.
- geplante Uhrzeit.
- Ziel des Posts.
- Risiko-/Rechte-Notiz.
- klare Entscheidung: `OK zum Posten`, `Aendern`, `Ablehnen`.

Ohne dein `OK zum Posten` bleibt der Status `pending_user_ok`.

Nur du darfst Posts freigeben. Andere Agenten duerfen vorbereiten, pruefen, empfehlen und blockieren, aber keinen Live-Post freigeben.

### 6. Live-Posting

Live-Posting ist ein eigener Schritt und braucht immer User-Approval. Wenn Plattform-APIs/OAuth vorhanden sind, darf ein Job den genehmigten Post exakt wie freigegeben auf Instagram, Facebook, TikTok und YouTube Shorts ausspielen. Wenn API-Zugriff fehlt, erstellt Manni ein copy-paste-faehiges Upload-Paket fuer Meta Business Suite, TikTok Studio oder YouTube Studio.

Paid Spend, Boosts und Ads brauchen eine separate Freigabe, auch wenn der organische Post bereits genehmigt ist.

Definition:

- Organischer Post: normaler Post/Reel/Short ohne Werbebudget. Das ist der Standard.
- Boost/Ad/Paid Spend: bezahlte Reichweite ueber Meta Ads, TikTok Promote/Ads oder YouTube/Google Ads. Bezahltes Marketing ist derzeit nicht vorgesehen und darf von den Agenten nicht als Standardmassnahme eingeplant werden. Falls es spaeter relevant wird, braucht es eine separate Budgetfreigabe.

Pflichtdaten pro freigegebenem Posting:

- Plattform und Kanal.
- Asset-ID und finaler MP4-/PNG-Pfad.
- finaler Caption-Text.
- Hashtags.
- Landing-URL.
- geplante oder sofortige Veroeffentlichungszeit.
- Freigabe-Status `approved`.
- nach Posting: Live-URL oder Plattform-ID.

### 7. KPI-Review

Nach 24h, 72h und 7 Tagen sammelt Audience Intelligence:

- Plays/Views.
- 3-Sekunden- und Completion-Rate.
- Likes, Kommentare, Shares, Saves.
- Profilbesuche und Follows.
- Link-Klicks auf AIRDOX.INFO.
- Website-Signale: Audio-Play, Set-Open, Sign-up, Booking-Lead.

Manni schreibt daraus:

- Gewinner.
- Verlierer.
- naechste 3 Experimente.
- Entscheidung, ob ein Hook wiederholt, verbessert oder verworfen wird.

## Woechentlicher Standardplan

| Tag | Automatisierung | Ergebnis |
| --- | --- | --- |
| Montag | Queue erzeugen, Top-Hooks waehlen | Wochenplan und Draft-Pack |
| Dienstag | Reels/Stories/Shorts rendern | 15s, 30s, 59s Preview-Paket |
| Mittwoch | Designer-Review und Korrekturen | freigabereife Assets |
| Donnerstag | Freigabevorschau an dich | Entscheidungspaket fuer 3 Wochenposts |
| Freitag | Ersatzslot oder YouTube/TikTok-Nachzug | Live-Links und Log |
| Samstag | Bei neuem Set: zusaetzlicher Launch-Post, falls freigegeben | Tagespost und Log |
| Sonntag | KPI-Review | Gewinner/Naechste Experimente |

Bei neuen Sets darf Manni fuer sieben Tage eine Launch-Taktung vorbereiten:

- Tag 1: New-Set-Announcement als Reel/Short.
- Tag 2: Story mit Website-Link/Set-Hinweis.
- Tag 3: Drop-Moment.
- Tag 4: Transition-Breakdown oder Track-Hook.
- Tag 5: Reminder auf AIRDOX.INFO.
- Tag 6: bestes bisheriges Asset erneut als Story/Short-Variante.
- Tag 7: KPI-Review und Gewinner-Asset fuer die naechste Woche.

## Benennung und Status

Jeder Asset-Batch bekommt eine eindeutige ID:

`social-<platform>-<set-id>-<timestamp>-<hook-type>`

Statuswerte:

- `planned`: Idee steht in Queue.
- `rendered_preview`: MP4/PNG/Captions wurden erzeugt.
- `designer_review_needed`: Vorschau braucht CD-/Safe-Area-Pruefung.
- `ready_for_user_preview`: kann dir gezeigt werden.
- `pending_user_ok`: wartet auf deine Entscheidung.
- `approved`: darf exakt so veroeffentlicht werden.
- `published`: ist live, URL wurde dokumentiert.
- `rejected`: nicht verwenden.
- `needs_revision`: erneut schneiden oder textlich ueberarbeiten.

## Noch zu klaerende Interviewpunkte

Damit die Automation produktionsreif wird, fehlen vor allem Betriebsdaten:

1. Gibt es No-Go-Tracks, No-Go-Artists oder rechtliche Einschraenkungen?
2. Welche konkreten Account-/API-Zugaenge stehen fuer Meta und TikTok zur Verfuegung?
3. YouTube OAuth muss erneuert werden, wenn der Refresh-Token abgelaufen oder widerrufen wurde.

## Benoetigte Zugangsdaten fuer Auto-Publishing

Instagram/Facebook:

- Meta App mit Instagram Graph API und Facebook Pages API.
- `META_PAGE_ACCESS_TOKEN`.
- `FACEBOOK_PAGE_ID`.
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`.
- Berechtigungen fuer Content Publishing.

TikTok:

- TikTok Developer App.
- `TIKTOK_CLIENT_KEY`.
- `TIKTOK_CLIENT_SECRET`.
- `TIKTOK_REFRESH_TOKEN` oder ein gleichwertiger OAuth-Flow fuer Upload/Publish.
- bestaetigter Zielaccount.

YouTube Shorts:

- Google Cloud OAuth Client.
- `YOUTUBE_CLIENT_ID`.
- `YOUTUBE_CLIENT_SECRET`.
- `YOUTUBE_REFRESH_TOKEN`.
- Zielkanal und Default-Privacy fuer genehmigte Shorts.

Allgemein:

- Zeitzone: Europe/Berlin.
- Default-Privacy pro Kanal vor finaler Freigabe.
- Freigabe-Person: nur Benutzer.
- Freigabeformat: explizites `OK zum Posten` fuer konkrete Plattform, Asset und Caption.
- optional: UTM-Parameter fuer AIRDOX.INFO-Links.

## Datenbasis fuer initiale Zeitfenster

Die initialen Zeiten basieren auf aktuellen plattformuebergreifenden Benchmarks:

- Sprout Social 2026: fast 2 Milliarden Engagements aus rund 307.000 Profilen, beste Gesamtfenster Dienstag/Mittwoch zwischen 11:00 und 18:00 lokaler Zeit; Instagram stark Dienstag 13:00-19:00 und Mittwoch 12:00-21:00; TikTok stark Dienstag-Freitag am Nachmittag.
- Buffer 2026: Millionen realer Posts; Instagram stark 15:00-18:00, TikTok 16:00-19:00, YouTube Shorts 15:00-17:00 besonders Mittwoch bis Freitag.

AIRDOX-Regel daraus: Die erste Testphase nutzt Dienstag/Mittwoch/Donnerstag zwischen 16:00 und 18:00 Europe/Berlin, weil dieses Fenster Instagram, TikTok und YouTube Shorts gleichzeitig gut abdeckt und fuer Musik-/Shortform-Video praktisch ist.

## Naechster produktiver Ausbau

Die naechste Ausbaustufe ist kein neues Konzept, sondern ein wiederholbarer Job:

1. `manni:reels:generate`
2. `social:auto` fuer Top 3 Queue-Eintraege
3. Designer-Review
4. Freigabebericht mit MP4/PNG/Captions
5. nach OK: Plattform-Upload auf Instagram/Facebook/TikTok/YouTube Shorts oder copy-paste-Paket, falls API-Zugang fehlt
6. KPI-Review und Queue-Update
