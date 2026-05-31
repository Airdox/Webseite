# Meta Business Suite Copy/Paste-Pack-Vorlage

Status: `external_draft`
Nutzerfreigabe vor Planung oder Veroeffentlichung erforderlich: ja

## Paket

- Paket-ID:
- Quell-Set:
- Asset-Pfad:
- Vorschaubild:
- Landing-URL:
- KPI-Ziel:
- Vorgeschlagener Posting-Zeitpunkt Europe/Berlin:
- Freigabe-Owner: nur Nutzer

## Instagram

Beschreibung/Caption:

```text

```

Hashtags:

```text

```

Optionaler erster Kommentar:

```text

```

## Facebook

Beschreibung/Caption:

```text

```

## Threads

Beitrag:

```text

```

## Story

Text-Overlay:

```text

```

Sticker-/Link-Notiz:

```text

```

## Pruefung

- Designer-CD-Pruefung:
- Safe-Area-Pruefung:
- Manni-Wachstumsnotiz:
- Guardian-Risikonotiz:
- Blockierte-Automation-Pruefung:
  - Browser-Automation: blockiert
  - Login-Cookies/Session-Tokens: blockiert
  - Scraping: blockiert
  - Automatische Likes/Follows: blockiert
  - Kalte Massen-DMs: blockiert
  - Paid-Spend/Boosts: blockiert, ausser separat freigegeben
- Nutzerfreigabe:

## Meta-Business-Suite-Schritte

1. Meta Business Suite oeffnen.
2. Post oder Reel fuer die freigegebene Plattform erstellen.
3. Nur das freigegebene Asset hochladen.
4. Nur die freigegebene Plattform-Caption einfuegen.
5. Fuer den freigegebenen Zeitpunkt planen oder erst nach ausdruecklichem Nutzer-OK veroeffentlichen.
6. Live-URL nach der Veroeffentlichung kopieren.
7. `docs/agent-system/social-post-ledger.json` aktualisieren.
8. `npm run social:ledger:write` ausfuehren.

## Ledger-Eintragsvorlage

```json
{
  "packageId": "",
  "platform": "instagram",
  "status": "published",
  "liveUrl": "",
  "postedAt": "",
  "asset": "",
  "caption": "",
  "kpi": {
    "goal": "",
    "reach": null,
    "viewsOrPlays": null,
    "saves": null,
    "shares": null,
    "follows": null,
    "linkClicks": null,
    "commentQualityNote": ""
  }
}
```
