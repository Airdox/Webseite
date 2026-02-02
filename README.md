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
