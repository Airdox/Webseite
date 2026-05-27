# ☯️ AIRDOX - Project Duality

[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_%7C_Vite_%7C_Neon_%7C_Cloudflare-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)]()

**Airdox** ist eine hochmoderne, leistungsstarke Webanwendung und Plattform für den Berliner Techno-DJ **AIRDOX**. Die Plattform wurde mit dem Fokus auf "Project Duality" entwickelt und erforscht die Spannung zwischen Licht (Engel) und Schatten (Teufel) durch eine immersive Benutzeroberfläche und ein professionelles Audioerlebnis.

---

## 🏛️ Vision & Philosophie: Project Duality
Die Plattform ist nicht nur ein DJ-Portfolio; sie ist eine interaktive Erkundung des Dualismus.
- **The Angel Modus:** Melodic Techno, Trance-Vibes, Gold/Cyan-Ästhetik.
- **The Devil Modus:** Hard Techno, Industrial Acid, Schwarz/Rot-Ästhetik.
- **The Red Thread:** Eine philosophische Reise, die den Benutzer fragt: *"Wer gewinnt am Ende?"*

---

## 🚀 Key Features

*   🎧 **High-End Audio Experience:** "The Blade" Glassmorphism-Player mit Echtzeit-Wellenformvisualisierung und globaler Steuerung.
*   🔐 **Sicherer VIP-Bereich:** Benutzerauthentifizierungssystem mit Login und Session-Validierung für exklusive Inhalte. Die Registrierung ist derzeit deaktiviert. [1]
*   📱 **Multi-Plattform-Support:** Vollständig responsive Web-App, installierbare PWA und native mobile Builds via Capacitor.
*   📊 **Stealth Analytics:** Privates Admin-Dashboard zur Verfolgung von Downloads und Engagement (GDPR-konform), basierend auf Track-Statistiken (Plays, Likes, Dislikes). [1]
*   📩 **Integrierte Buchung:** Direkter Kommunikationskanal für Buchungsanfragen, unterstützt durch Cloudflare Workers und Neon PostgreSQL. [1]
*   🍪 **Cookie-Banner:** Implementierung eines Cookie-Banners für Datenschutzkonformität.

---

## 🛠️ Tech Stack

### Frontend
- **React 19:** Nutzung der neuesten Concurrent Features und Hooks.
- **Vite 5:** Blitzschnelle Entwicklung und optimierte Produktions-Builds.
- **Lenis:** Sanftes Scrolling für ein Premium-Gefühl.
- **Vanilla CSS / Modules:** Maßgeschneidertes Styling für maximale Performance und Designkontrolle.

### Backend & Infrastruktur
- **Cloudflare Workers / Pages:** Edge-Computing für APIs und globales statisches Hosting.
- **Neon PostgreSQL:** Serverless-Datenbank für Buchungen, Track-Statistiken und Benutzerverwaltung. [1]
- **Drizzle ORM:** Type-sichere Datenbankinteraktionen.
- **Wrangler:** CLI für lokale API-Simulation und Deployments.

### Mobile & Tools
- **Capacitor:** Brücke zwischen Web-App und Android/iOS-Ökosystemen.
- **Playwright / Vitest:** Umfassende E2E- und Unit-Test-Suite.
- **ESLint:** Erzwingung strenger Coding-Standards.

---

## ⚙️ Technical Standards

### Coding Philosophy
- **Clean Code:** Verwendung beschreibender Namen, modularer Komponenten und Vermeidung von Side Effects in Hooks.
- **Performance First:** Lazy Loading für große Assets, optimierte Bildformate und effizientes State Management.
- **Full-Stack Safety:** Type-sichere Datenbankabfragen mit Drizzle ORM und validierte API-Eingaben.

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
