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

## 🌐 Live Demo
👉 **[https://airdox.netlify.app](https://airdox.netlify.app)**

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Einfacher Development-Server
npm run dev

# Netlify Dev (für Datenbank & Funktionen)
npm run dev:netlify

# Produktions-Build erstellen
npm run build
```

## Umgebungsvariablen

Die Datei `.env.example` enthält alle benötigten Variablen (ohne Secrets). Für lokale Tests nutze `.env` (ist in `.gitignore`).

Client (Vite):
- `VITE_STATS_API_BASE`
- `VITE_STATS_API_FALLBACK`
- `VITE_AUDIO_FALLBACK_BASE`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_DISABLE_SW`

Serverless/DB (Netlify/Vercel):
- `DATABASE_URL`
- `POSTGRES_URL`
- `NEON_DATABASE_URL`
- `NETLIFY_DATABASE_URL`
- `NETLIFY_DATABASE_URL_UNPOOLED`

## 📊 Track Stats API

- `GET /api/stats`: Alle Track-Statistiken abrufen.
- `POST /api/stats`: Plays und Likes aktualisieren.
- `GET /api/db-health`: Datenbank-Verbindung prüfen.

## Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für detaillierte Anweisungen.

## Passwort ändern

VIP-Passwort in `src/components/Downloads.jsx` Zeile 5 ändern.

## Technologie-Stack

- React 19
- Vite 5
- CSS (Custom Properties)
- PWA (Service Worker + Manifest)

## Lizenz

Privates Projekt - Alle Rechte vorbehalten.
