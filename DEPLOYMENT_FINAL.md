# 🚀 AIRDOX - Cloudflare Deployment Guide

## ✅ Deployment Status

**Projekt:** airdox-webseite
**Plattform:** Cloudflare Pages (Frontend) & Cloudflare Workers (API)
**Live URL:** https://airdox.de

## 📦 Was wird gebaut?

Der `dist` Ordner enthält:
- Optimierte HTML, CSS, JS
- Aggressives Caching via `_headers`
- Komprimierte Assets & PWA Manifest

## 🌐 Deployment zu Cloudflare

### Option 1: Automatisches Deployment (GitHub)

1. Push das Projekt zu GitHub: `git push`
2. Cloudflare Pages baut und deployt automatisch bei jedem Push.

### Option 2: Manuelles Deployment via CLI

```bash
# Produktions-Build erstellen:
npm run build

# Deployment zu Cloudflare Pages:
npx wrangler pages deploy dist
```

## 🔧 Backend / API Konfiguration

Die API läuft über einen Cloudflare Worker (`src/server/worker.js`).
- **Endpunkte:** `/api/stats`, `/api/booking`
- **Datenbank:** Neon PostgreSQL (Variable `DATABASE_URL` in Cloudflare hinterlegt)

## ⚡ Performance & Caching

Die Datei `public/_headers` ist für maximale Performance optimiert:
- **Fonts/JS/CSS:** 1 Jahr Cache (Immutable)
- **Bilder:** 30 Tage Cache
- **HTML:** Kein Cache (Sofortige Updates)

## 🎯 Nach dem Deployment

### Teste diese Features:
- [ ] Audio Player (Waveforms & Playlist)
- [ ] Buchungsformular (Nachricht in der Neon-DB prüfen)
- [ ] Analytics Dashboard (`Strg + Shift + A`)
- [ ] PWA Installation auf dem Handy

### Admin-Zugang:
- **Analytics Dashboard:** `Strg + Shift + A` oder URL mit `#admin`
- **VIP Password:** Siehe `src/components/Downloads.jsx`

## 🔗 Nächste Schritte

1. **Deploy it!** via GitHub oder Wrangler CLI.
2. **Teste die neue Domain** [https://airdox.de](https://airdox.de).
3. **PWA aktualisieren** (Browser-Tab neu laden).
