# Manni Growth Playbook

Stand: 2026-05-02

## Nordstern

Hauptziel ist maximale Reichweite mit messbarem Fan-Wachstum.

Primäre KPI:

- Netto-Neue-Reichweite pro Woche
- Neue Follower pro Kanal pro Woche
- Listener-Wachstum (Spotify monatliche Hoerer, Saves, Adds)

Sekundäre KPI:

- Watch Time / Completion Rate
- Shares, Sends, Saves
- Klickrate auf Linkhub / Booking / Newsletter

Verbindliche Gate-Regel:
- Poster, Reels, Captions, Thumbnails und Plattform-Copy sollen aktiv als externe-ready Drafts erstellt werden.
- Manni darf nach aussen gerichtete PR-Kampagnen vorbereiten, als Preview zeigen und zur Freigabe vorlegen.
- Manni darf konkrete PR-/Social-Reach-Operationen planen und nach Freigabe ausfuehren: Reels/Shorts posten, Stories vorbereiten, sichtbare Kommentare/Antworten formulieren, Collab-/Tagging-Anfragen erstellen, kleine Boost-Tests beauftragen und Kanalvarianten fuer Instagram, Facebook, TikTok, YouTube Shorts oder passende Nischenplattformen fahren.
- Kein Social-Post, keine PR-Kampagne mit externer Live-Sichtbarkeit, keine sichtbare Community-Reaktion, kein Outreach und keine Paid-Ausspielung ohne persoenliches Nutzer-OK.

## Kanäle mit Priorität

1. Kurzvideo: Instagram Reels, Facebook Reels, TikTok, YouTube Shorts
2. Community und Social Proof: Stories, Kommentare/Antworten, Collab-Posts, Tags, Reposts, Szene-Gruppen und Event-Kontexte
3. Musikplattform: Spotify
4. Owned Channel: Newsletter + Website

Zusammenarbeit:
- Manni (Strategie, Distribution) arbeitet eng mit Designer (Creative-Pack, Hook- und Visual-Konsistenz).

## Externe PR-Kampagnen

Manni ist Owner fuer PR-Kampagnen im Job-Katalog:

- `pr-campaign-draft-pack`: Kampagnenziel, Zielgruppe, Kanalplan, Press-/Social-Copy, Asset-IDs, Landing-URL, KPI-Ziel, Risiken und Freigabe-Checkliste vorbereiten.
- `pr-campaign-user-preview`: finale Copy, Assets, Timing und Ziel-URLs dem Nutzer zeigen; keine Veroeffentlichung aus diesem Schritt.
- `pr-campaign-live-publish`: erst nach dokumentierter Nutzerbestaetigung online bringen und Plattform, Timestamp, URL/Kampagnen-ID sowie ersten KPI-Checkpoint im Decision Log festhalten.
- `pr-social-reach-ops-plan`: echte Reichweitenoperationen als ausfuehrbare Plattformauftraege planen, inklusive Instagram/Facebook-Reels, Stories, Kommentaren/Antworten, Collab-/Tagging-Anfragen, Gruppen-/Community-Postings, kleinen Boost-Tests und Messfenster.
- `pr-social-reach-ops-execute`: nur nach persoenlichem Nutzer-OK exakt freigegebene Operationen ausfuehren oder beauftragen und mit Link, Screenshot-/Asset-Referenz, Budget falls vorhanden, Ziel-KPI und Recheck-Zeitpunkt protokollieren.

Mindestinhalt fuer jede PR-/Social-Reach-Operation:

- Plattform und Zielgruppe
- Aktionstyp: Reel/Short, Story, Kommentar/Antwort, Collab-Anfrage, Tagging, Repost, Gruppenpost, Boost-Test oder Newsletter-/Website-Bridge
- Copy, Hook, CTA, Asset-ID und Ziel-URL
- erwarteter Reichweitenhebel
- Risiko: Spam-Wirkung, Rechte, Tonalitaet, Plattformregel, Budget
- Freigabezeile: `USER-APPROVED: <job-id> <platform> <asset/copy>`
- KPI-Check nach 2h, 24h und 7 Tagen

## Szenario-Modelle

### Szenario A - Organischer Engine-Aufbau (0-8 Wochen)

Ziel:
- Stabile Content-Maschine mit testbaren Formaten.

Taktung:
- 5-7 Kurzvideos pro Woche
- 1 Longform/Performance-Video pro Woche
- 1 Community-Post/Story-Block pro Tag

Format-Buckets:
- Performance/Set-Momente
- Track-Breakdowns
- Before/After-Sounddesign
- Crowd/Reaction-Snippets
- Narrative Clips (Story + Hook)

Entscheidungsregel:
- Nach 2 Wochen nur Formate weiterfahren, die ueber Median bei Watch Time und Shares liegen.

### Szenario B - Collab- und Creator-Leverage (ab Woche 3)

Ziel:
- Reichweite durch Partner-Audiences hebeln.

Taktik:
- 2-3 Creator-Collabs pro Monat
- 1 Gast-Performance/Back2Back-Clip pro Monat
- Remix/Duet-Stitch-Formate mit klarer Hook

Entscheidungsregel:
- Collabs mit hoher Follower-Conversion und hoher Watch Time priorisieren.

### Szenario C - Release-Burst (14 Tage um Release)

Ziel:
- Neue Tracks in maximale Discovery schieben.

Taktik:
- Pre-Release Teaser-Sequenz (D-10 bis D-1)
- Release-Day Hero-Assets auf allen Kanaelen
- Post-Release Proof (Reactions, User Clips, DJ Support)
- Spotify Follow/Pre-Save Push

Entscheidungsregel:
- Täglich auf Saves/Adds/Streams optimieren; schwache Hooks innerhalb 24h ersetzen.

### Szenario D - Paid Amplification auf Gewinner-Assets

Ziel:
- Nur bereits performante Creatives skalieren.

Taktik:
- Kleine Testbudgets auf Top 10-20% organische Assets
- Creative-Varianten: Hook, Caption, CTA
- Retargeting auf Viewer/Engager mit Follow- oder Stream-CTA

Entscheidungsregel:
- Budget nur auf Ads mit stabilem CPA/CPE und hoher Retention ausweiten.

## Wochenrhythmus (Manni)

Montag:
- KPI-Review letzte Woche
- Hypothesen + Testplan

Dienstag bis Donnerstag:
- Produktion + Posting + schnelle Variationen

Freitag:
- Gewinner identifizieren
- Paid-Test auf Gewinner ansetzen

Sonntag:
- Wochenreport ins Decision Log
- naechste Woche planen

Automationsschritt:

```powershell
npm run manni:reels:generate -- --scenario=A --count=12
```

Outputs:
- `docs/agent-system/manni-reel-queue.json`
- `docs/agent-system/reports/campaigns/manni-reel-weekly-plan.md`

## Mindest-Reporting pro Woche

- Top 3 Gewinnerformate
- Top 3 Verliererformate + Grund
- Reichweitenverlauf
- Follower-Zuwachs je Kanal
- naechste 3 Experimente

## Externe Leitplanken (offizielle Quellen)

- YouTube Recommendation System (Homepage + Up Next, Value fuer Nutzer): https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/
- TikTok For You Ranking-Signale (Interaktionen, Video-Infos, Watch Completion): https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you
- TikTok Ad Creative Best Practices (TikTok-first, testen/iterieren): https://ads.tiktok.com/help/article/creative-best-practices?lang=en&trk=article-ssr-frontend-pulse_little-text-block
- Spotify Release Radar / Follow-Effekt fuer neue Releases: https://artists.spotify.com/en/blog/promoting-new-releases-to-your-followers
- Meta: Original Content wird in Empfehlungen priorisiert, Reposts werden reduziert: https://about.fb.com/ltam/news/2024/05/ayudando-a-los-creadores-a-encontrar-nuevas-audiencias/
