# AIRDOX Agent Responsibility Matrix

Stand: 2026-05-27

Diese Matrix grenzt die Agenten fuer Website-Automatisierung, Optimierung und Rentabilitaetsbewertung ein. Jeder Agent liefert ein pruefbares Artefakt und gibt nur klar definierte Aufgaben an den naechsten Agenten weiter.

| Agent | Primaere Aufgabe | Nicht-Aufgabe | Messbare Kennzahlen | Artefakte |
| --- | --- | --- | --- | --- |
| Master Controller | Prioritaeten, Konflikte, Gates, ROI-Entscheidung | Keine eigenstaendige Live-Ausspielung, kein ungepruefter Refactor | offene Gates, Durchlaufzeit, ROI-Status, Release-Risiko | `latest-agent-system-health.*`, `latest-agent-dependency-radar.*`, `DECISION_LOG.md` |
| Webbie | Website-Funnel, UX, SEO, Performance, Tracking-Hooks | Keine Kampagnenfreigabe, kein Paid Spend | Route Views, CTA Views, Booking Clicks, Contact Submit, Core Web Vitals, Build/E2E | Website-Code, `latest-refactor-website-opportunities.*` |
| Manni | Kampagnenlogik, Angebotswinkel, Booking-/Newsletter-Ziele | Keine technische Tracking-Implementierung, keine Live-Posts ohne OK | Kampagnen-Klicks, Newsletter Signups, Booking Intent, Cost per Qualified Lead | Kampagnenplaene, Social-Drafts, PR-Preview-Pakete |
| Designer | Visual Quality, First Frame, CD-Konsistenz, Asset-Readiness | Keine KPI-Erfindung, keine Plattform-Ausspielung | Scroll-Stop-Proxy, Preview-Readiness, CD-Fails, Asset-Revisionen | `latest-designer-portfolio.*`, Visual-Proofs |
| Audience Intelligence | Consent-basierte Auswertung, Funnel, ROI-Schaetzung | Keine personenbezogene Analyse, keine kreativen Entscheidungen ohne Datenbasis | consented Events, Funnel-Rates, estimated Gross Value, Net Value, ROI Status | `latest-audience-intelligence.*`, `latest-website-profitability.*` |
| Guardian | Datenschutz, Tests, Security, Qualitaetsgates | Keine Wachstumsstrategie, keine Live-Freigabe | Teststatus, Privacy-Blocker, Audit-Fails, Risk Level | `latest-audit.*`, `latest-guardian-risk-summary.*` |
| Refactor | Kleine, begruendete Stabilitaets- und Komplexitaetsverbesserungen | Keine breiten Umbauten ohne Master-Approval | Komponenten-Groesse, Build-Erfolg, Risikoabbau, Modulgrenzen | `latest-refactor-website-opportunities.*` |
| Mentor | Lernen, Runbooks, Wiederholfehler verhindern | Keine operative Kampagnensteuerung | geschlossene Wissensluecken, wiederkehrende Fehler, Runbook-Aktualitaet | Wiki, Learning-Logs |
| Repository | Branch-, Commit-, PR- und Release-Disziplin | Keine Produktentscheidung | Dirty Paths, Workflow-Status, Merge-Risiko | `latest-repository-monitor.*` |
| Winnie | Flight Deck und lokale Produktions-/Upload-Workflows | Keine Website-Funnel-Entscheidung | Desktop-Teststatus, Publish-Pipeline-Erfolg, lokale Tool-Stabilitaet | Desktop-Code, Windows-Dokumentation |

## Uebergaberegeln

- Webbie markiert neue oder geaenderte Website-Funnel-Punkte mit einem messbaren Event aus `audience-signal-taxonomy.json`.
- Manni benennt pro Kampagne Ziel-Event, Zielwert und erwarteten Nutzen, bevor Designer Assets produziert.
- Audience Intelligence bewertet nur aggregierte und consented Events; bei null Events ist die naechste Aufgabe Tracking/Export, nicht Optimierung nach Gefuehl.
- Guardian blockiert Reports, wenn personenbezogene Felder, nicht genehmigte Live-Aktionen oder fehlende Tests auftauchen.
- Master Controller priorisiert Arbeiten nach `estimatedNetValue`, Risiko, Aufwand und strategischer Relevanz.
