# 🚀 Deployment: Analytics V2 Update

Das Update ist fertig implementiert und gebaut! Da die automatische Deployment-Schnittstelle eine erneute Authentifizierung benötigt, führe bitte **einen** der folgenden Schritte aus, um die Änderungen live zu schalten.

## Option 1: Netlify CLI (Empfohlen)

Öffne ein Terminal in `z:\teszt` und führe aus:

```bash
npx netlify deploy --prod --dir=dist
```

Falls du nach einem Login gefragt wirst, folge den Anweisungen im Browser.

## Option 2: Drag & Drop (Einfach)

1. Öffne [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Ziehe den Ordner `z:\teszt\dist` in das Browser-Fenster.
3. Fertig!

## ✅ Was ist neu? (Analytics V2)

Nach dem Deployment ist das neue Dashboard unter **`/#admin`** (oder `Strg + Shift + A`) verfügbar.

- **Neue Charts:** Line, Bar, Pie, Heatmap
- **Erweiterte Metriken:** Session-Dauer, Bounce Rate, Audio-Events
- **Export:** JSON & CSV
- **Mobile:** Optimierte Ansicht

Viel Erfolg! 🚀
