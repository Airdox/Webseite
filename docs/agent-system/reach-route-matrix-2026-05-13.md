# AIRDOX Reach Route Matrix - 2026-05-13

Owner: Manni + Webbie + Guardian  
Scope: M2 Recovery und M3 Vorbereitung, intern only  
Publish boundary: `draft_allowed_publish_pending_user_ok`

## Route Matrix

| Reach Path | User Action | Frontend Surface | Canonical Event | Local Test |
| --- | --- | --- | --- | --- |
| Set-Start | Set-Cover Play | `MusicSection` -> `AudioProvider` | `audio_play` | `src/components/__tests__/MusicSection.test.jsx` |
| Share | Set teilen | `SetCard` | `share` | `src/components/__tests__/MusicSection.test.jsx` |
| Newsletter | E-Mail abonnieren | `Newsletter` -> `/api/subscribe` | `sign_up` | `src/components/__tests__/Newsletter.test.jsx` |
| Booking | Anfrage senden | `BookingSection` -> `/api/booking` | `generate_lead` | `src/components/__tests__/BookingSection.test.jsx` |

## QA Check

- Set-Start bleibt lokal und trackt erst nach Audio-`play`; keine externe Aktion.
- Share nutzt native Share API oder Clipboard-Fallback; zusaetzlich bleibt das vorhandene `set_share` Event fuer Rueckwaertskompatibilitaet erhalten.
- Newsletter und Booking senden nur bei erfolgreicher lokaler API-Antwort die kanonischen Conversion-Events.
- Keine Live-Ausspielung, kein Posting, kein Boosting, kein Paid.

## Milestone Status

| Milestone | Status | Evidence |
| --- | --- | --- |
| M0 Baseline/Ziel-Freeze | warn | Zielwerte im Masterplan eingefroren; echte externe Baselines fehlen weiterhin und bleiben `pending_source_data`. |
| M1 Reel Queue + Draft Pack Slots 1-4 | pass | `manni-reel-queue.json`, `manni-reel-weekly-plan.md`, `manni-reel-draft-pack.md` am 2026-05-13 neu generiert. |
| M2 Website-Reach-Pfade | pass | Route Matrix + Unit-Tests fuer `audio_play`, `share`, `sign_up`, `generate_lead`. |
| M3 Woche-1-Review Vorbereitung | warn | Gewinner/Verlierer koennen ohne externe KPI-Daten nur als Hypothesen-Ranking vorbereitet werden. |

## M3 Working Notes

- Top-3 Kandidaten fuer Review: Slot 1 `raw_drop_marker`, Slot 2 `deck_split_screen`, Slot 3 `floor_energy_loop`.
- Flop-Risiko: generische Hook-Formulierung in wiederholten Drop-Slots; am 2026-05-15 gegen Completion/Share-Signale pruefen.
- Drei Optimierungen fuer M3, falls keine KPI-Daten vorliegen: Hook spezifischer auf Track-Moment zuschneiden, CTA zwischen Collab-Markierung und Set-Link teilen, First-Frame mit Set-Titel statt reinem Timestamp A/B testen.
