# Reichweiten-Sprint - 2026-05-02

## Ziel

Primaeres Ziel ist mehr Reichweite mit messbarem Fan-Wachstum, ohne externe Posts, Paid-Aktivierung oder Live-Social-Aenderungen ohne persoenliches Nutzer-OK.

## Aktive Subagenten

| Agent | Auftrag | Erfolgsmass | Artefakte |
| --- | --- | --- | --- |
| Webbie | Website-Funnel schaerfen: Hero-Proof, Set-Deep-Links, Share-CTA, SEO-Snippets, Sitemap | Mehr Set-Starts, Shares, Booking-Klicks, Newsletter-Klicks | `src/components/*`, `index.html`, `en/index.html`, `public/sitemap.xml` |
| Manni | 12 Reel-Experimente pro Woche aus aktuellen Sets planen, Draft-Pack vorbereiten und Gewinner/Verlierer reporten | Completion Rate, Shares, Follows, Link-Klicks | `docs/agent-system/manni-reel-queue.json`, `docs/agent-system/manni-reel-weekly-plan.md`, `docs/agent-system/manni-reel-draft-pack.md`, `DECISION_LOG.md` |
| Designer | Pro Reel Hook-, First-Frame-, Poster- und Thumbnail-Drafts erstellen und pruefen | Hook-Klarheit, keine Safe-Area-Kollision, konsistente AIRDOX-Optik | `creativePack` in Queue, Weekly Plan, externe-ready Drafts |
| Guardian | Gates und Risiken pruefen: PR-Approval, Job-Validator, Social-Live-Blocker | Keine ungeprueften Freigaben, gruene Agenten-Gates | `.github/pull_request_template.md`, `scripts/*gate*`, Audit-Reports |
| Repository | Arbeitsbaum, Branch- und Release-Hygiene ueberwachen | Keine ungeordneten Release-/Deploy-Aenderungen | `latest-repository-monitor.*`, `REPOSITORY_GOVERNANCE.md` |
| Mentor | Learnings aus Gewinnern/Fehlern in Runbooks ueberfuehren | Wiederholbare Workflows, weniger Wissensverlust | `airdoX_wiki/wiki/log.md`, relevante Runbooks |

## Heutige Aufgaben

1. Webbie liefert teilbare Set-Deep-Links und Hero-Proof-Signale.
2. Webbie erweitert SEO/Shareability: eindeutiges OG-PNG, JSON-LD-Graph, No-JS-Fallback, aktuelle Sitemap.
3. Manni generiert die Reel-Queue mit `experiment`, `approval`, `creativePack`, `reporting` und Landing-URL.
4. Designer fuehrt `queue-readiness-review` aus und erstellt danach externe-ready Drafts ueber `social-draft-production`.
5. Manni fuehrt woechentlich `growth-report-digest` aus und dokumentiert Gewinner, Verlierer und naechste Experimente.
6. Guardian stellt sicher, dass `MC-APPROVED: YES` nie als Template-Default erscheint.

## Freigabegrenze

Erstellung ist erlaubt und erwuenscht: Poster, Reels, Captions, Thumbnails und Plattform-Copy duerfen als `external_draft` vorbereitet werden. Nur `external_live` bleibt bis zu deinem persoenlichen OK blockiert; im Decision Log muessen Datum, Job-ID, Plattformen, Asset-IDs und freigegebene Copy stehen.
