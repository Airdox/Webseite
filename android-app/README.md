# AIRDOX Android App

Native Android App für AIRDOX – Berlin Underground Techno DJ.

Built with **React Native + Expo** – identisch in Funktionsumfang und Optik mit der [AIRDOX Website](https://airdox.netlify.app).

## Features

- 🎵 **Audio Streaming** – Alle Sets direkt streamen (play/pause/next/prev/seek)
- 🎨 **Dark Theme** – Neon Cyan/Pink Premium Design
- 📱 **Native UI** – Keine WebView, echte native Komponenten
- 🌐 **i18n** – Deutsch / Englisch
- 👍 **Voting** – Like/Dislike pro Set
- 📊 **Live Stats** – Play-Counts von der API
- 📧 **Booking** – Kontaktformular via Email
- 🔗 **Social Links** – SoundCloud, Mixcloud, Instagram

## Tech Stack

- React Native 0.81
- Expo SDK 54
- expo-av (Audio)
- expo-linear-gradient
- react-native-svg
- react-native-reanimated
- AsyncStorage

## Quick Start

```bash
cd android-app
npm install
npx expo start
```

Dann Expo Go App auf Android öffnen und QR-Code scannen.

## Build APK

```bash
npx eas build --platform android --profile preview
```

## Projektstruktur

```
src/
├── components/      # UI Komponenten
│   ├── HeroSection.js
│   ├── BioSection.js
│   ├── MusicSection.js
│   ├── SetCard.js
│   ├── GlobalPlayer.js
│   ├── BookingSection.js
│   ├── FooterSection.js
│   ├── Navigation.js
│   └── LoadingScreen.js
├── contexts/        # State Management
│   └── AudioContext.js
├── data/            # Music Sets Daten
│   └── musicSets.js
├── screens/         # Screen-Layouts
│   └── HomeScreen.js
├── theme/           # Design System
│   └── colors.js
└── utils/           # Hilfsfunktionen
    └── i18n.js
```
