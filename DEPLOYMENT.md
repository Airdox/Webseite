# WE CLOSE - Deployment Guide

## ✅ Build Status: SUCCESS

**Build Output:**
```
✓ 66 modules transformed
dist/index.html             1.10 kB │ gzip: 0.55 kB
dist/assets/index-D8LSdF42.css   32.95 kB │ gzip: 6.92 kB
dist/assets/index-coktgbeT.js   485.01 kB │ gzip: 134.40 kB
✓ built in 33.94s
```

---

## 🚀 Deployment zu Netlify

### Option 1: Drag & Drop (Einfachst)

1. **Öffne:** https://app.netlify.com/drop
2. **Ziehe** den `z:\teszt\we-close\dist` Ordner ins Fenster
3. **Fertig!** Site ist live

### Option 2: Netlify CLI

```bash
cd z:\teszt\we-close
netlify deploy --prod --dir=dist
```

---

## ⚙️ Wichtige Config

### PubNub Keys (für Production)

**Aktuell:** Demo-Keys (shared, öffentlich)
**Für Live:** Eigene Keys nötig!

1. Gehe zu https://dashboard.pubnub.com/signup
2. Erstelle Account (kostenlos)
3. Kopiere Keys
4. Update `src/config/pubnub.js`:
   ```javascript
   const PUBNUB_CONFIG = {
     publishKey: 'pub-c-xxxxx',
     subscribeKey: 'sub-c-xxxxx',
     userId: `user-${Math.random().toString(36).substr(2, 9)}`
   };
   ```
5. Rebuild: `npm run build`
6. Redeploy

---

## 📋 Pre-Deploy Checklist

- [x] Build erfolgreich
- [x] Alle Features implementiert
- [ ] PubNub eigene Keys (optional, Demo-Keys funktionieren)
- [ ] SoundCloud/Mixcloud URLs anpassen
- [ ] Countdown Event-Datum setzen
- [ ] Social Media URLs prüfen

---

## 🚀 Los geht's!

**Einfach `dist/` Ordner zu https://app.netlify.com/drop ziehen!**
