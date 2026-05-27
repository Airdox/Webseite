# ☯️ AIRDOX - Berlin Underground Techno

[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_%7C_Vite_%7C_Neon_%7C_Cloudflare-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)]()

**Airdox** ist eine hochmoderne, leistungsstarke Webanwendung und Plattform für den Berliner Techno-DJ **AIRDOX**. Die Plattform bietet ein immersives Audioerlebnis und präsentiert den Sound von Berlin Underground Techno.

---

## 🏛️ Vision & Philosophie
Die Plattform dient als zentrale Anlaufstelle für den Sound von AIRDOX, einem Berliner Underground Techno DJ. Sie bietet eine digitale Präsenz, die das musikalische Schaffen und die Live-Auftritte des Künstlers widerspiegelt. Der Fokus liegt auf einem puristischen, kompromisslosen Techno-Sound, der die Tanzfläche in den Mittelpunkt stellt.

---

## 🚀 Key Features

*   🎧 **High-End Audio Experience:** "The Blade" Glassmorphism-Player mit Echtzeit-Wellenformvisualisierung und globaler Steuerung für ein immersives Musikerlebnis.
*   🔐 **Sicherer VIP-Bereich:** Benutzerauthentifizierungssystem mit Login und Session-Validierung für exklusive Inhalte. Die Registrierung ist derzeit deaktiviert, der Zugang erfolgt über bestehende Accounts. [1]
*   📱 **Multi-Plattform-Support:** Vollständig responsive Web-App, installierbare Progressive Web App (PWA) und native mobile Builds via Capacitor für Android und iOS.
*   📊 **Stealth Analytics:** Privates Admin-Dashboard zur Verfolgung von Downloads und Engagement (GDPR-konform), basierend auf detaillierten Track-Statistiken (Plays, Likes, Dislikes). [1]
*   📩 **Integrierte Buchung:** Direkter Kommunikationskanal für Buchungsanfragen, unterstützt durch Cloudflare Workers und Neon PostgreSQL. [1]
*   🍪 **Cookie-Banner:** Implementierung eines Cookie-Banners zur Sicherstellung der Datenschutzkonformität und transparenten Verwaltung von Nutzereinwilligungen.

---

## 🛠️ Tech Stack

### Frontend
- **React 19:** Nutzung der neuesten Concurrent Features und Hooks für eine reaktionsschnelle Benutzeroberfläche.
- **Vite 5:** Blitzschnelle Entwicklung und optimierte Produktions-Builds für maximale Performance.
- **Lenis:** Sanftes Scrolling für ein Premium-Gefühl und verbesserte Benutzererfahrung.
- **Vanilla CSS / Modules:** Maßgeschneidertes Styling für maximale Performance und präzise Designkontrolle.

### Backend & Infrastruktur
- **Cloudflare Workers / Pages:** Edge-Computing für APIs und globales statisches Hosting, um niedrige Latenzzeiten und hohe Verfügbarkeit zu gewährleisten.
- **Neon PostgreSQL:** Serverless-Datenbank für Buchungen, Track-Statistiken und Benutzerverwaltung, optimiert für skalierbare und performante Datenhaltung. [1]
- **Drizzle ORM:** Type-sichere Datenbankinteraktionen, die die Entwicklung robuster und fehlerfreier Anwendungen unterstützen.
- **Wrangler:** CLI für lokale API-Simulation und Deployments, zur effizienten Entwicklung und Bereitstellung von Cloudflare Workers.

### Mobile & Tools
- **Capacitor:** Brücke zwischen der Web-App und nativen Android/iOS-Ökosystemen, ermöglicht die Bereitstellung als native mobile Anwendung.
- **Playwright / Vitest:** Umfassende E2E- und Unit-Test-Suite zur Sicherstellung der Codequalität und Funktionalität.
- **ESLint:** Erzwingung strenger Coding-Standards zur Aufrechterhaltung einer hohen Codequalität und Konsistenz.

---

## ⚙️ Technical Standards

### Coding Philosophy
- **Clean Code:** Verwendung beschreibender Namen, modularer Komponenten und Vermeidung von Side Effects in Hooks für wartbaren und lesbaren Code.
- **Performance First:** Lazy Loading für große Assets, optimierte Bildformate und effizientes State Management zur Gewährleistung einer schnellen und flüssigen Benutzererfahrung.
- **Full-Stack Safety:** Type-sichere Datenbankabfragen mit Drizzle ORM und validierte API-Eingaben zur Erhöhung der Sicherheit und Datenintegrität.

### Project Structure
```text
├── api/                # Cloudflare Worker API-Logik
├── android/            # Capacitor Android-Projektdateien
├── android-app/        # Native Android App (React Native/Expo)
├── functions/          # Serverless-Funktionen (Cloudflare)
├── public/             # Statische Assets (Logos, Icons)
├── src/
│   ├── components/     # Wiederverwendbare UI-Elemente (z.B. Hero, Bio, Music, VIP, Booking, GlobalPlayer, Navigation, AnalyticsDashboard, CookieBanner)
│   ├── contexts/       # Globaler Zustand (Audio, Toast)
│   ├── hooks/          # Benutzerdefinierte React-Logik
│   ├── styles/         # Globales CSS und Themes
│   └── lib/            # Externe Bibliothekskonfigurationen & Backend-Logik (z.B. stats-logic.js)
├── scripts/            # Build- und Utility-Skripte
├── data/               # Daten (z.B. Tracklisten)
├── db/                 # Datenbank-Schema (Drizzle ORM)
├── e2e/                # End-to-End-Tests (Playwright)
└── ...
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18+)
- **NPM** (v9+)
- **Cloudflare Account** (für Workers/Pages)

### Installation
```bash
git clone https://github.com/airdox/webseite-main.git
cd webseite-main
npm install
```

### Configuration
1. Kopieren Sie `.env.example` nach `.env`.
2. Füllen Sie die erforderlichen Umgebungsvariablen aus. Mindestens `DATABASE_URL` (oder `NEON_DATABASE_URL`) ist für die Datenbankverbindung erforderlich. Optionale Variablen für Cloudflare R2 (`R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) können für die Audio-Speicherung konfiguriert werden. [2]

---

## 🏃 Development & Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Startet den Vite-Entwicklungsserver |
| `npx wrangler dev` | Simuliert die lokale Cloudflare-Umgebung |
| `npm run build` | Generiert produktionsreife statische Dateien |
| `npm run build:site` | Generiert produktionsreife statische Dateien und führt Post-Build-Audio-Trim-Skripte aus |
| `npm run lint` | Überprüft die Codequalität via ESLint |
| `npm run test` | Führt Unit- und Integrationstests aus (Vitest) |
| `npm run test:e2e` | Führt Playwright E2E-Tests aus |
| `npm run db:generate` | Generiert Drizzle-Migrationen basierend auf dem Schema |

---

## 📖 Internal Documentation
Für tiefere technische Einblicke konsultieren Sie unsere spezialisierten Leitfäden:
- [Masterplan (Vision)](PROJECT_MASTERPLAN.md)
- [Analytics Documentation](ANALYTICS_V2_DOKUMENTATION.md)

---

## ⚖️ License
Private Project - © 2026 AIRDOX. All rights reserved.

---

## References
[1] `/home/ubuntu/Airdox_Webseite/src/lib/stats-logic.js`
[2] `/home/ubuntu/Airdox_Webseite/.env.example`
