# SubtitlesEdit Mobile App - APK Builds

Dies ist der Ordner für die APK-Builds der SubtitlesEdit Mobile App - eine 1:1 Kopie der Website https://subtitlesedit.com als native Android-Anwendung.

## Über die App

**SubtitlesEdit** ist eine mobile Anwendung für die Konvertierung und Bearbeitung von Untertiteln. Die App bietet folgende Funktionen:

### Hauptfunktionen

1. **SRT ↔ VTT Converter** - Konvertierung zwischen SRT (SubRip) und VTT (WebVTT) Formaten
2. **Subtitle Time Shifter** - Anpassung von Untertitel-Zeitstempeln
3. **Subtitle Merger** - Kombinieren mehrerer Untertiteldateien
4. **Subtitle Splitter** - Aufteilen großer Untertiteldateien
5. **Overlap Fixer** - Automatische Behebung überlappender Untertitel
6. **FAQ** - Häufig gestellte Fragen

### Besonderheiten

- ✅ **100% Offline** - Alle Tools funktionieren ohne Internetverbindung
- ✅ **Vollständige Privatsphäre** - Keine Datei-Uploads, alle Daten bleiben auf dem Gerät
- ✅ **Kostenlos** - Keine Gebühren, keine Anmeldung erforderlich
- ✅ **Schnell** - Optimierte JavaScript-Engine für schnelle Verarbeitung
- ✅ **Benutzerfreundlich** - Intuitive Bedienung für Ein-Hand-Nutzung

## Technische Details

- **Framework**: React Native mit Expo SDK 54
- **Sprache**: TypeScript
- **Styling**: NativeWind (Tailwind CSS für React Native)
- **Architektur**: Tab-basierte Navigation mit 6 Hauptscreens
- **Kompatibilität**: iOS und Android

## App-Struktur

```
app/(tabs)/
├── index.tsx              # Home Screen mit Tool-Übersicht
├── srt-to-vtt.tsx        # SRT zu VTT Converter
├── vtt-to-srt.tsx        # VTT zu SRT Converter
├── time-shifter.tsx      # Zeitstempel-Anpassung
├── merger.tsx            # Datei-Zusammenführung
├── overlap-fixer.tsx     # Überlappungs-Behebung
└── faq.tsx               # FAQ-Seite

components/
├── file-input.tsx        # Datei-Upload/Paste-Komponente
├── file-export.tsx       # Datei-Download-Komponente
└── screen-container.tsx  # SafeArea-Wrapper

lib/
└── subtitle-utils.ts     # Konvertierungs-Logik
```

## Design & Branding

- **Primärfarbe**: Grün (#22C55E)
- **Design-Sprache**: iOS Human Interface Guidelines
- **Responsive**: Optimiert für Portrait-Orientierung (9:16)
- **Dark Mode**: Vollständige Unterstützung für Light/Dark Mode

## Build-Informationen

- **App Name**: SubtitlesEdit
- **Bundle ID**: space.manus.subtitlesedit_app.t20260405203606
- **Version**: 1.0.0
- **Min SDK**: Android 24 (API Level 24)

## Installation

Die APK-Datei kann auf einem Android-Gerät installiert werden:

1. Laden Sie die APK-Datei herunter
2. Aktivieren Sie "Installation aus unbekannten Quellen" in den Einstellungen
3. Öffnen Sie die APK-Datei und folgen Sie den Installationsanweisungen

## Entwicklung

Das Projekt wurde mit Expo und React Native entwickelt. Für lokale Entwicklung:

```bash
# Installation von Abhängigkeiten
pnpm install

# Starten des Dev-Servers
pnpm dev

# Build für Android
eas build --platform android

# Build für iOS
eas build --platform ios
```

## Lizenz

Diese App ist eine Nachbildung der Website subtitlesedit.com und wird zu Demonstrationszwecken bereitgestellt.

## Support

Für Fragen oder Probleme besuchen Sie bitte die FAQ-Sektion in der App oder kontaktieren Sie den Entwickler.

---

**Erstellt**: April 2026  
**Entwickler**: Manus AI  
**Quelle**: https://subtitlesedit.com
