# AIRDOX Refactor-Website-Chancen

Erstellt: 2026-07-24T01:50:24.083Z
Agent: Refactor

## Ueberblick

- Gepruefte Quelldateien: 57
- Chancen: 3
- Hohe Prioritaet: 0

## Betriebsregeln

- Erreichbarkeit, Stabilitaet und Funktionalitaet haben Vorrang vor Cleanup.
- Refactor muss vor Code-Aenderungen einen ausfuehrbaren Patch-Vorschlag vorbereiten.
- Der genehmigte Scope ist bindend; Scope-Erweiterung braucht einen neuen Vorschlag.
- Ausfuehrung braucht explizite Nutzerfreigabe; riskante oder breite Arbeit zusaetzlich Master-Controller-Freigabe.
- Breite Umstrukturierung ist nur mit Master-Controller-Freigabe, Rollback-Hinweis und Quality-Gates erlaubt.
- Jede Refactor-Aufgabe muss Vorher-/Nachher-Nutzen und Validierung nennen.
- Immer nur einen Website-Flow bevorzugen: Musik, Booking, Newsletter, VIP/Auth oder Stats.

## Chancen

| Prioritaet | Bereich | ID | Beleg | Aktion | Validierung | Dateien |
| --- | --- | --- | --- | --- | --- | --- |
| medium | maintainability | large-file-src-server-tiktokcreator-js | 556 Zeilen / 28301 Bytes. | Nur die naechste nutzer- oder service-sichtbare Teileinheit extrahieren, die einen fokussierten Test bekommen kann. Freigabe: pending_user_ok; Job: refactor-website-patch-proposal. | Den naechstliegenden Komponenten-/Unit-Test plus npm run build ausfuehren. | src/server/tiktokCreator.js |
| medium | maintainability | large-file-src-components-tiktokcreatorpage-jsx | 286 Zeilen / 18541 Bytes. | Nur die naechste nutzer- oder service-sichtbare Teileinheit extrahieren, die einen fokussierten Test bekommen kann. Freigabe: pending_user_ok; Job: refactor-website-patch-proposal. | Den naechstliegenden Komponenten-/Unit-Test plus npm run build ausfuehren. | src/components/TikTokCreatorPage.jsx |
| medium | maintainability | large-file-src-components-setcard-jsx | 387 Zeilen / 16765 Bytes. | Nur die naechste nutzer- oder service-sichtbare Teileinheit extrahieren, die einen fokussierten Test bekommen kann. Freigabe: pending_user_ok; Job: refactor-website-patch-proposal. | Den naechstliegenden Komponenten-/Unit-Test plus npm run build ausfuehren. | src/components/SetCard.jsx |

