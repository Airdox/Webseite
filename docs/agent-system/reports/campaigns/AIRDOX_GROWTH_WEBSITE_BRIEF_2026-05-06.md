# AIRDOX Growth Website Brief

Stand: 2026-05-06  
Kampagnen: C04 Berlin Pressure Archive, C05 AIRDOX for Dark Rooms  
Status: Umsetzungsbrief. Keine Live-Veröffentlichung ohne separaten Deploy-Auftrag.

## Kurzbefund

Die AIRDOX-Site ist aktuell eine React/Vite Single-Page-App mit Hero, Bio, Musik, VIP, EPK, Booking und Newsletter. Sets kommen aus `src/data/musicSets.js`. Set-Deep-Links existieren als Hash-Links (`#set-*`), aber noch nicht als indexierbare Einzelseiten. Booking läuft über `/api/booking`. EPK liegt als Section sowie unter `/epk/airdox-epk.html` und PDF vor.

## Informationsarchitektur

Neue URLs:

- `/sets/` als Hub `Berlin Pressure Archive`
- `/sets/sissygut-alles-gut/`
- `/sets/rauchst-du-raus/`
- `/sets/rec-2026-05-01/`
- `/sets/set-135/`
- `/booking/dark-rooms/` als Kampagnen-Landingpage `AIRDOX for Dark Rooms`
- später optional `/epk/` als sauberer HTML-Hub

## C04: Berlin Pressure Archive

Ziel: indexierbare Set-Starts, Tracklist-Klicks, Shares.

Seitenstruktur `/sets/`:

1. Hero  
   H1: `Berlin Pressure Archive`  
   Subline: `AIRDOX Sets aus Berlin: druckvoller Underground Techno, Tracklists und direkte Timestamp-Jumps.`  
   CTA: `Aktuelles Set starten`, `Tracklists durchsuchen`

2. Featured Set  
   Priorität: `SISSYGUT ALLES GUT`, weil neu, lang und tracklist-stark.

3. Archive Grid  
   Karten für öffentliche Sets, später VIP-Teaser für ältere Sets ohne Audio-Freigabe.

4. Track-ID Section  
   `Direkt zu Drops, Breaks und Pressure-Momenten springen.`

5. Newsletter/VIP Soft CTA  
   `Neue Sets und Track-IDs direkt bekommen.`

Einzel-Set-Seite:

1. Hero mit Set-Titel, Datum, Dauer, CTA `Set starten`
2. Audio-Player mit direktem Start
3. Tracklist mit klickbaren Timestamps
4. Share-Block mit Copy-Link
5. Booker-Mini-Proof: Setlänge, Soundprofil, EPK/Booking CTA
6. ähnliche Sets

SEO:

| URL | Title | Description |
| --- | --- | --- |
| `/sets/` | `Berlin Pressure Archive | AIRDOX Techno Sets & Tracklists` | `Streame aktuelle AIRDOX-Sets aus Berlin: dunkler Underground Techno, druckvolle Drops, Tracklists und direkte Timestamp-Jumps.` |
| `/sets/sissygut-alles-gut/` | `SISSYGUT ALLES GUT | AIRDOX Berlin Techno Set` | `AIRDOX Set vom Mai 2026: 1:51:45 Berlin Underground Techno mit vollständiger Tracklist und direkten Timestamp-Jumps.` |
| `/sets/rauchst-du-raus/` | `RAUCHST DU RAUS | AIRDOX Dark Techno Set` | `Druckvolles AIRDOX Recording vom Mai 2026: 1:22:21 Dark Techno, Peak-Time-Energie und klickbare Tracklist.` |
| `/sets/set-135/` | `SET 135 | AIRDOX Peak-Time Techno Recording` | `AIRDOX SET 135 aus April 2026: treibender Berlin Techno mit Tracklist, Timestamp-Jumps und direktem Streaming.` |

Copy:

```text
Berlin Pressure Archive

AIRDOX sammelt hier aktuelle Recordings aus Berlin: dunkler, direkter Techno mit klarer Dramaturgie, harten Pressure-Momenten und Tracklists, die nicht nur Deko sind. Spring direkt in den Drop, pruefe die IDs oder starte das komplette Set.

Kein Warm-up-Archiv. Keine glatte Playlist. Nur Sets, die fuer dunkle Raeume, spaete Slots und lange Dancefloors gebaut sind.
```

## C05: AIRDOX for Dark Rooms

Ziel: qualifizierte Booking-Anfragen von Clubs, Kollektiven und Veranstaltern.

Seitenstruktur `/booking/dark-rooms/`:

1. Hero  
   H1: `AIRDOX for Dark Rooms`  
   Subline: `Berlin Underground Techno fuer Clubs, Kollektive und Events, die Druck statt Dekoration brauchen.`  
   CTA: `Booking anfragen`, `EPK oeffnen`, `Set anhoeren`

2. Sound-Proof  
   Karten: `Dark / Industrial / Peak-Time`, `60 / 90 / 120 Minuten`, `USB/CDJ Standard`

3. Booker-Player  
   empfohlene Sets: `SISSYGUT ALLES GUT`, `RAUCHST DU RAUS`, `SET 135`

4. EPK-Block  
   PDF, Press Assets, SoundCloud/Mixcloud/Instagram/RA Links

5. Fit / Nicht-Fit  
   Fit: dunkle Rooms, Late Slots, Kollektive, Techno-Floors, Festival-Naechte.  
   Nicht-Fit: generische Lounge-/Warm-up-Formate, Hintergrundmusik.

6. Booking-Formular  
   optional erweitern: Eventdatum, Venue/City, Slot-Length, erwartete Crowd, Links.

SEO:

- Title: `AIRDOX for Dark Rooms | Berlin Techno DJ Booking`
- Description: `Buche AIRDOX für Clubs, Kollektive und Events: Berlin Underground Techno, Dark/Industrial/Peak-Time Sound, EPK, Set-Proof und direkter Kontakt.`

Copy:

```text
AIRDOX for Dark Rooms

AIRDOX spielt Berlin Underground Techno fuer Raeume, die Energie halten koennen: dunkel, direkt, koerperlich. Der Sound sitzt zwischen Industrial, Dark und Peak-Time Techno, mit Fokus auf Drive, Spannung und kontrollierte Releases.

Fuer Booker zaehlt nicht die Behauptung, sondern der Beweis: aktuelle Sets, vollstaendige Tracklists, EPK, klare Formate und ein direkter Kontaktweg.
```

CTA-Varianten:

- `Booking anfragen`
- `EPK herunterladen`
- `Booker-Set starten`
- `Sound pruefen`
- `Kontakt aufnehmen`

## Schema.org

Für Set-Seiten:

- `AudioObject` oder `MusicRecording`
- `MusicPlaylist` für `/sets/`
- `Person` oder `MusicGroup` für AIRDOX
- `BreadcrumbList`
- `WebPage`

Beispiel:

```json
{
  "@type": "AudioObject",
  "name": "SISSYGUT ALLES GUT",
  "creator": {
    "@type": "Person",
    "name": "AIRDOX"
  },
  "duration": "PT1H51M45S",
  "datePublished": "2026-05-02",
  "encodingFormat": "audio/mpeg",
  "genre": ["Berlin Underground Techno", "Dark Techno", "Peak-Time Techno"]
}
```

Für Booking-Seite:

- `Person`
- `Service`
- `ContactPoint`
- optional `Offer`
- optional `FAQPage`

## Tracking

Standardisierte Events:

- `page_view` mit `page_type: set_archive|set_detail|booking_landing`
- `set_play` mit `set_id`, `set_title`, `source_page`
- `tracklist_open`
- `tracklist_timestamp_click`
- `set_share`
- `booking_cta_click`
- `booking_form_start`
- `booking_submit`
- `epk_download`
- `press_asset_click`
- `outbound_click` für SoundCloud, Mixcloud, Instagram, RA
- `newsletter_signup_start`
- `newsletter_signup_submit`

## Implementierungsrisiken

- reine React-Client-Routen liefern schwächere indexierbare Seiten als statische/prerendered HTML-Seiten
- neue URLs brauchen Routing plus Hosting-Fallback oder echte HTML-Dateien
- Audio-Rechte für Set-Seiten, Downloads, Paid und Social getrennt prüfen
- VIP-Audio darf nicht versehentlich öffentlich werden
- Set-Hub, Einzelset und Homepage-Musiksection brauchen unterschiedliche Suchintentionen
- Analytics nur mit Consent
- große Tracklists müssen mobil performant bleiben

## Priorisierte technische To-dos

1. Routing-Entscheidung treffen: React Router plus Hosting-Fallback oder statisch generierte HTML-Landingpages.
2. Slug-Helper für Sets einführen: `sissygut-alles-gut`, `rauchst-du-raus`, `set-135`.
3. Datenmodell ergänzen: `seoTitle`, `seoDescription`, `summary`, `soundTags`, `featuredMoments`.
4. `/sets/` Hub bauen.
5. `/sets/:slug/` Detailseite mit Player, Tracklist, JSON-LD und canonical URL bauen.
6. `/booking/dark-rooms/` bauen und Booking-Form wiederverwenden.
7. Metadata-Handling pro Route ergänzen.
8. `sitemap.xml` um neue URLs erweitern.
9. Schema.org JSON-LD einbauen.
10. Tracking-Konvention implementieren.
11. Tests ergänzen: Routing, SEO-Meta, Set-Slug, Booking-Submit, Tracklist-Timestamp-Klick.
12. Vor Livegang: Web-Qualität, mobile/desktop Screenshots, Audio-Start, Form Submit, Sitemap/robots prüfen.

