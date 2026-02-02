# 🔑 Netlify Deployment mit Personal Access Token

Da die Browser-Autorisierung nicht funktioniert, nutzen wir einen Token:

## Schritt 1: Token erstellen

1. Gehe zu: https://app.netlify.com/user/applications#personal-access-tokens
2. Klicke auf "New access token"
3. Gib einen Namen ein (z.B. "AIRDOX Deploy")
4. Klicke "Generate token"
5. **Kopiere den Token** (wird nur einmal angezeigt!)

## Schritt 2: Token setzen

In PowerShell (im Projektordner):

```powershell
cd z:\teszt

# Token als Umgebungsvariable setzen
$env:NETLIFY_AUTH_TOKEN = "DEIN_TOKEN_HIER"

# Deployen
npx netlify deploy --prod --dir=dist
```

## Alternative: .env Datei (dauerhaft)

Erstelle Datei `z:\teszt\.env`:
```
NETLIFY_AUTH_TOKEN=dein_token_hier
```

Dann:
```powershell
npx netlify deploy --prod --dir=dist
```

---

**Oder einfach:** Drag & Drop auf https://app.netlify.com/drop
