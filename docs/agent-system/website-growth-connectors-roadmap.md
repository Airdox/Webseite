# AIRDOX Website Growth Connectors Roadmap

Stand: 2026-06-06
Quelle: NotebookLM Deep Research `583f4150-be4b-4a8e-a005-29d147352bfc`

## Ziel

AIRDOX.INFO soll nicht nur eine Praesenzseite sein, sondern ein messbarer Growth-Funnel fuer Musik, Booking, EPK, Newsletter und Social-Signale.

## Sofort Aktiviert

- Agent-/GEO-Readiness:
  - `public/llms.txt`
  - `public/agent-profile.md`
  - aktualisierte `robots.txt`
  - aktualisierte `sitemap.xml`
- Booking-SEO:
  - `public/booking/berlin-techno-dj/index.html`
  - Structured Data fuer Booking-Angebot in `index.html`
- Konfigurationsplatzhalter:
  - `VITE_BOOKING_SCHEDULER_URL`
  - `VITE_SENTRY_DSN`
  - `SENTRY_DSN`

## Als Naechstes Einrichten

1. Cloudflare
   - Deploy weiterhin ueber Wrangler 4 ausfuehren.
   - URL Scanner / Agent Readiness fuer `https://airdox.info/` und `/booking/berlin-techno-dj/` pruefen.
   - Bei Bedarf Markdown Content Negotiation spaeter als Worker-Feature nachruesten.

2. GitHub
   - Aktuellen Stand committen und pushen.
   - Danach Issues fuer Sentry, Cal.com, Newsletter und n8n anlegen.
   - Pull Requests nur nach Tests/Build.

3. Booking / Cal.com
   - `VITE_BOOKING_SCHEDULER_URL` setzen, wenn ein finaler Cal.com-Link existiert.
   - Booking-Seite danach um zweiten CTA `Termin anfragen` erweitern.
   - Routing-Fragen definieren: Datum, Stadt, Venue, Slot, erwartete Groesse, Budgetrahmen, Technik.

4. Sentry
   - Projekt anlegen.
   - `VITE_SENTRY_DSN` setzen.
   - Frontend Error Boundary und Worker-Fehlerpfad instrumentieren.
   - Slack/GitHub-Alerting erst nach DSN-Verifikation aktivieren.

5. Canva
   - AIRDOX Brand Kit aus `docs/brand/airdox-brand-tokens.json` spiegeln.
   - Nur Vorlagen nutzen, die AIRDOX-Dunkelbasis, Cyan/Lime-Akzente und klare Safe Areas einhalten.

## Spaeter Pruefen

- n8n als Orchestrierung:
  - Booking Lead -> Slack Alert -> GitHub/CRM Task -> Follow-up Draft.
  - Neues Set -> Social Brief -> Canva/Remotion Draft -> Ledger.
- Newsletter:
  - Erst nach stabilem Content-Rhythmus aktiv skalieren.
  - Fokus: neue Sets, Tracklists, EPK/Booking-Signale.
- Custom Cloudflare Agent:
  - Website-Assistent fuer EPK/Booking-Fragen.
  - Nur mit klaren Quellen und ohne private VIP-/API-Daten.

## 30-Tage Arbeitsplan

Woche 1:
- Deploy der Agent-/Booking-SEO-Basis.
- Agent Readiness und Sitemap pruefen.
- Booking-Landingpage in Search Console/Indexing-Workflow aufnehmen.

Woche 2:
- Cal.com finalisieren oder bewusst vertagen.
- Booking-Fragen und Follow-up-Vorlage definieren.
- Social-CTA auf `/booking/berlin-techno-dj/` testen.

Woche 3:
- Sentry einrichten.
- Fehler-Alerts in Slack/GitHub vorbereiten.
- Website-Analytics auf Booking, Newsletter und Set-Play-Pfade pruefen.

Woche 4:
- Ersten n8n-Workflow als Dry Run bauen.
- Newsletter-Content-Format definieren.
- Ergebnisse aus Analytics/Booking/SEO in neue Prioritaeten ueberfuehren.
