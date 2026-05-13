# AIRDOX Designer Visual Quality Report

Generated: 2026-05-08T09:01:26.095Z
Agent: Designer
Base URL: http://127.0.0.1:4173
Status: fail

## Summary

- Total checks: 14
- Failures: 4
- Warnings: 0
- Passes: 10
- Needs attention: yes

## Checks

| Check | Level | Detail |
| --- | --- | --- |
| desktop-set-cards-visible | PASS | desktop: 4 Set-Cards sichtbar. |
| desktop-horizontal-overflow | PASS | desktop: Kein horizontaler Overflow. |
| desktop-meta-readability | FAIL | desktop: Datum/Dauer wirken zusammengezogen oder zusammengeklebt. |
| desktop-readability-user-eye | FAIL | desktop: Lesbarkeit ist fuer User teilweise zu schlecht (Kontrast/Schriftgroesse). |
| desktop-de-language-months | PASS | desktop: Monatslabels sind mit deutscher Seite konsistent. |
| desktop-de-language-ui | PASS | desktop: Keine auffaelligen englischen UI-Texte gefunden. |
| desktop-layout-overlaps | PASS | desktop: Keine Ueberlappungen in geprueften Set-Cards. |
| mobile-set-cards-visible | PASS | mobile: 4 Set-Cards sichtbar. |
| mobile-horizontal-overflow | PASS | mobile: Kein horizontaler Overflow. |
| mobile-meta-readability | FAIL | mobile: Datum/Dauer wirken zusammengezogen oder zusammengeklebt. |
| mobile-readability-user-eye | FAIL | mobile: Lesbarkeit ist fuer User teilweise zu schlecht (Kontrast/Schriftgroesse). |
| mobile-de-language-months | PASS | mobile: Monatslabels sind mit deutscher Seite konsistent. |
| mobile-de-language-ui | PASS | mobile: Keine auffaelligen englischen UI-Texte gefunden. |
| mobile-layout-overlaps | PASS | mobile: Keine Ueberlappungen in geprueften Set-Cards. |

## Screenshots

- D:\webseeite-main\docs\agent-system\proof\designer-visual-quality\desktop-viewport.png
- D:\webseeite-main\docs\agent-system\proof\designer-visual-quality\desktop-music.png
- D:\webseeite-main\docs\agent-system\proof\designer-visual-quality\mobile-viewport.png
- D:\webseeite-main\docs\agent-system\proof\designer-visual-quality\mobile-music.png

## Findings Detail

### desktop-meta-readability (FAIL)

desktop: Datum/Dauer wirken zusammengezogen oder zusammengeklebt.

```json
{
  "lowMetaSpacing": [
    {
      "title": "LIVE SET MAY 2026 #2",
      "dateText": "MAI 2026",
      "durationText": "| 2:58:03",
      "metaText": "MAI 2026 | 2:58:03",
      "gapPx": 0,
      "suspiciousMerge": false
    },
    {
      "title": "VHG",
      "dateText": "MAI 2026",
      "durationText": "| 3:16:06",
      "metaText": "MAI 2026 | 3:16:06",
      "gapPx": 0,
      "suspiciousMerge": false
    },
    {
      "title": "SISSYGUT ALLES GUT",
      "dateText": "MAI 2026",
      "durationText": "| 1:51:45",
      "metaText": "MAI 2026 | 1:51:45",
      "gapPx": 0,
      "suspiciousMerge": false
    },
    {
      "title": "RAUCHST DU RAUS",
      "dateText": "MAI 2026",
      "durationText": "| 1:22:21",
      "metaText": "MAI 2026 | 1:22:21",
      "gapPx": 0,
      "suspiciousMerge": false
    }
  ],
  "mergedMeta": []
}
```

### desktop-readability-user-eye (FAIL)

desktop: Lesbarkeit ist fuer User teilweise zu schlecht (Kontrast/Schriftgroesse).

```json
{
  "readabilityFails": [
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    },
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    },
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    },
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    }
  ],
  "readabilityWarns": [
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 67",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 26",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 13",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 1",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    }
  ]
}
```

### mobile-meta-readability (FAIL)

mobile: Datum/Dauer wirken zusammengezogen oder zusammengeklebt.

```json
{
  "lowMetaSpacing": [
    {
      "title": "LIVE SET MAY 2026 #2",
      "dateText": "MAI 2026",
      "durationText": "| 2:58:03",
      "metaText": "MAI 2026 | 2:58:03",
      "gapPx": 0,
      "suspiciousMerge": false
    },
    {
      "title": "VHG",
      "dateText": "MAI 2026",
      "durationText": "| 3:16:06",
      "metaText": "MAI 2026 | 3:16:06",
      "gapPx": 0,
      "suspiciousMerge": false
    },
    {
      "title": "SISSYGUT ALLES GUT",
      "dateText": "MAI 2026",
      "durationText": "| 1:51:45",
      "metaText": "MAI 2026 | 1:51:45",
      "gapPx": 0,
      "suspiciousMerge": false
    },
    {
      "title": "RAUCHST DU RAUS",
      "dateText": "MAI 2026",
      "durationText": "| 1:22:21",
      "metaText": "MAI 2026 | 1:22:21",
      "gapPx": 0,
      "suspiciousMerge": false
    }
  ],
  "mergedMeta": []
}
```

### mobile-readability-user-eye (FAIL)

mobile: Lesbarkeit ist fuer User teilweise zu schlecht (Kontrast/Schriftgroesse).

```json
{
  "readabilityFails": [
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    },
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    },
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    },
    {
      "severity": "fail",
      "type": "tiny-font",
      "selector": "tracklist-title",
      "text": "Trackliste",
      "fontSizePx": 9.6,
      "contrast": 5.53
    }
  ],
  "readabilityWarns": [
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Teilen",
      "fontSizePx": 11.2,
      "contrast": 18.47
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 67",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 26",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Wiedergaben: 13",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 1",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    },
    {
      "severity": "warn",
      "type": "small-font",
      "selector": "SPAN",
      "text": "Gefällt nicht: 0",
      "fontSizePx": 11.2,
      "contrast": 19.95
    }
  ]
}
```

