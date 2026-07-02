# AIRDOX Refactor-Website-Chancen

Erstellt: 2026-07-01T13:48:48.962Z
Agent: Refactor

## Ueberblick

- Gepruefte Quelldateien: 66
- Chancen: 2
- Hohe Prioritaet: 1

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
| high | maintainability | large-file-src-components-industrialdashboard-jsx | 888 Zeilen / 48352 Bytes. | Nur die naechste nutzer- oder service-sichtbare Teileinheit extrahieren, die einen fokussierten Test bekommen kann. Freigabe: pending_user_ok; Job: refactor-website-patch-proposal. | Den naechstliegenden Komponenten-/Unit-Test plus npm run build ausfuehren. | src/components/IndustrialDashboard.jsx |
| medium | maintainability | large-file-src-components-setcard-jsx | 387 Zeilen / 16765 Bytes. | Nur die naechste nutzer- oder service-sichtbare Teileinheit extrahieren, die einen fokussierten Test bekommen kann. Freigabe: pending_user_ok; Job: refactor-website-patch-proposal. | Den naechstliegenden Komponenten-/Unit-Test plus npm run build ausfuehren. | src/components/SetCard.jsx |

