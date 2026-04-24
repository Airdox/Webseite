# ☯️ AIRDOX - Project Duality

[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Tech Stack](https://img.shields.io/badge/Stack-React_19_%7C_Vite_%7C_Neon_%7C_Cloudflare-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)]()

**Airdox** is a cutting-edge, high-performance web application and platform for the Berlin-based Techno DJ **AIRDOX**. Built with a focus on "Project Duality," the platform explores the tension between Light (Angel) and Shadow (Devil) through an immersive interface and professional audio experience.

---

## 🏛️ Vision & Philosophy: Project Duality
The platform is not just a DJ portfolio; it is an interactive exploration of dualism.
- **The Angel Modus:** Melodic Techno, Trance vibes, Gold/Cyan aesthetics.
- **The Devil Modus:** Hard Techno, Industrial Acid, Black/Red aesthetics.
- **The Red Thread:** A philosophical journey asking the user: *"Who wins in the end?"*

---

## 🚀 Key Features

*   🎧 **High-End Audio Experience:** "The Blade" glassmorphism player with real-time waveform visualization.
*   🔐 **Secure VIP Area:** Custom authentication system (SHA-256) with registration, login, and exclusive high-quality MP3 downloads.
*   📱 **Multi-Platform Support:** Fully responsive web app, installable PWA, and native mobile builds via Capacitor.
*   📊 **Stealth Analytics:** Private admin dashboard for tracking downloads and engagement (GDPR compliant).
*   📩 **Integrated Booking:** Direct communication channel backed by Cloudflare Workers and Neon PostgreSQL.

---

## 🛠️ Tech Stack

### Frontend
- **React 19:** Utilizing the latest concurrent features and hooks.
- **Vite 5:** Lightning-fast development and optimized production builds.
- **Lenis:** Smooth scrolling for a premium, non-native feel.
- **Vanilla CSS / Modules:** Custom styled for maximum performance and design control.

### Backend & Infrastructure
- **Cloudflare Workers / Pages:** Edge-computing for APIs and global static hosting.
- **Neon PostgreSQL:** Serverless database for booking and analytics.
- **Drizzle ORM:** Type-safe database interactions.
- **Wrangler:** CLI for local API simulation and deployments.

### Mobile & Tools
- **Capacitor:** Bridging the web app to Android/iOS ecosystems.
- **Playwright / Vitest:** Comprehensive E2E and unit testing suite.
- **ESLint:** Strict coding standards enforcement.

---

## ⚙️ Technical Standards

### Coding Philosophy
- **Clean Code:** Use descriptive naming, modular components, and avoid side effects in hooks.
- **Performance First:** Lazy loading for heavy assets, optimized image formats, and efficient state management.
- **Full-Stack Safety:** Type-safe database queries and validated API inputs.

### Project Structure
```text
├── api/                # Cloudflare Worker API logic
├── android/            # Capacitor Android project files
├── functions/          # Serverless functions (Cloudflare)
├── public/             # Static assets (logos, icons)
├── src/
│   ├── components/     # Reusable UI elements
│   ├── contexts/       # Global state (Theme, Audio)
│   ├── hooks/          # Custom React logic
│   ├── styles/         # Global CSS and themes
│   └── lib/            # External library configurations
├── scripts/            # Build and utility scripts
└── ...
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18+)
- **NPM** (v9+)
- **Cloudflare Account** (for Workers/Pages)

### Installation
```bash
git clone https://github.com/airdox/webseeite-main.git
cd webseeite-main
npm install
```

### Configuration
1. Copy `.env.example` to `.env`.
2. Fill in your `DATABASE_URL` and API keys.

---

## 🏃 Development & Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start Vite development server |
| `npx wrangler dev` | Simulate local Cloudflare environment |
| `npm run build` | Generate production-ready static files |
| `npm run lint` | Check code quality via ESLint |
| `npm run test` | Run unit and integration tests |
| `npm run test:e2e` | Run Playwright E2E tests |

---

## 📖 Internal Documentation
For deeper technical dives, refer to our specialized guides:
- [Masterplan (Vision)](PROJECT_MASTERPLAN.md)
- [Analytics Documentation](ANALYTICS_V2_DOKUMENTATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Audio Player Logic](AUDIO_PLAYER_DOCS.md)

---

## ⚖️ License
Private Project - © 2026 AIRDOX. All rights reserved.
