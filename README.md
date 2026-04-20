# AIRDOX - Berlin Techno DJ Website

Eine moderne, Progressive Web App für den Berlin Techno DJ AIRDOX.

## Features

- 🎵 **Zwei-Stufen-Download-System**
  - Öffentliche Sets für maximale Reichweite
  - VIP-Bereich mit Passwort-Schutz für exklusive Inhalte
  
- 📱 **Progressive Web App (PWA)**
  - Installierbar auf Handy & Desktop
  - Funktioniert offline
  - App-ähnliches Erlebnis
  
- 🎨 **Modernes Design**
  - Neon-Gradienten (Cyan/Pink/Purple)
  - Glassmorphism-Effekte
  - Animierte Hintergründe
  - Responsive für alle Geräte

- 🎧 **High-End Audio Player**
  - "The Blade" Design (Glassmorphism)
  - Waveform Visualisierung
  - Playlist Management
  - Keyboard Shortcuts

- 📊 **Analytics Dashboard**
  - Stealth Mode (Admin Access)
  - Download Tracking
  - DSGVO-konform

- 📩 **Buchungsformular**
  - Integrierte Cloudflare Worker API
  - Sicherung in Neon PostgreSQL

## 🌐 Live Demo
👉 **[https://airdox.de](https://airdox.de)**

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Cloudflare Wrangler (für lokale API & Worker)
npx wrangler dev

# Frontend Development-Server
npm run dev

# Produktions-Build erstellen
npm run build
```

## Umgebungsvariablen

Die Datei `.env.example` enthält alle benötigten Variablen (ohne Secrets). Für lokale Tests nutze `.env` (ist in `.gitignore`).

Client (Vite):
- `VITE_STATS_API_BASE`
- `VITE_AUDIO_BASE` (Basis-URL für Audio-Dateien)

Cloudflare/Database:
- `DATABASE_URL` / `NEON_DATABASE_URL`

## 📊 API Endpunkte

- `GET /api/stats`: Alle Track-Statistiken abrufen.
- `POST /api/stats`: Plays und Likes aktualisieren.
- `POST /api/booking`: Buchungsanfragen senden.

## Deployment

Das Deployment erfolgt vollautomatisch über **Cloudflare Pages**.
Zusätzlich kann manuell über Wrangler deployt werden:
```bash
npx wrangler pages deploy dist
```

## Passwort ändern

VIP-Passwort in `src/components/Downloads.jsx` Zeile 5 ändern.

## Technologie-Stack

- React 19
- Vite 5
- Cloudflare Workers / Pages
- Neon (Serverless PostgreSQL)
- Drizzle ORM

## Lizenz

Privates Projekt - Alle Rechte vorbehalten.
