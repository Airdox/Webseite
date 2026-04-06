# SubtitlesEdit Mobile App - APK Builds & Dokumentation

## 📂 Verzeichnisstruktur

```
apk-builds/
├── README.md                          # Hauptübersicht der App
├── BUILD_INSTRUCTIONS.md              # Detaillierte Build-Anweisungen
├── APP_FEATURES.md                    # Feature-Dokumentation
├── QUICK_BUILD_GUIDE.md              # Schnellstart-Anleitung
├── INDEX.md                           # Diese Datei
└── subtitlesedit_app_source/          # Vollständiger App-Quellcode
    ├── app/                           # React Native Screens
    ├── components/                    # Wiederverwendbare Komponenten
    ├── lib/                           # Utility-Funktionen
    ├── assets/                        # Icons, Logos, Bilder
    ├── package.json                   # Dependencies
    ├── app.config.ts                  # Expo-Konfiguration
    ├── tailwind.config.js             # Tailwind CSS Config
    └── android/                       # Android Native Code (nach Prebuild)
```

## 🚀 Schnellstart

### 1. APK erstellen (3 Optionen)

**Option A: Lokal mit Gradle (15-30 Min)**
```bash
cd subtitlesedit_app_source
pnpm install
npx expo prebuild --clean --platform android
cd android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleRelease
```

**Option B: EAS Cloud (5-10 Min, empfohlen)**
```bash
cd subtitlesedit_app_source
eas login
eas build --platform android --type apk
```

**Option C: GitHub Actions (Automatisiert)**
Siehe QUICK_BUILD_GUIDE.md für GitHub Actions Setup

### 2. APK finden

Nach erfolgreichem Build:
```
subtitlesedit_app_source/android/app/build/outputs/apk/release/app-release.apk
```

### 3. Auf Android installieren

```bash
adb install app-release.apk
```

## 📖 Dokumentation

| Datei | Inhalt |
|-------|--------|
| README.md | App-Übersicht, Features, Technologie |
| BUILD_INSTRUCTIONS.md | Ausführliche Build-Anweisungen mit Troubleshooting |
| APP_FEATURES.md | Detaillierte Feature-Beschreibung |
| QUICK_BUILD_GUIDE.md | Schnellstart mit mehreren Build-Optionen |

## 🛠️ Technische Details

### App-Spezifikationen
- Framework: React Native + Expo SDK 54
- Sprache: TypeScript
- Styling: NativeWind (Tailwind CSS)
- Größe: ~50-70 MB (Release APK)
- Min Android: API 24 (Android 7.0)
- Target Android: API 34 (Android 14)

### Hauptfeatures
1. SRT ↔ VTT Converter
2. Subtitle Time Shifter
3. Subtitle Merger
4. Subtitle Splitter
5. Overlap Fixer
6. FAQ Screen
7. Offline-Funktionalität
8. Dark Mode Support

## 📋 Voraussetzungen

### Für lokalen Build
- Node.js 18+
- pnpm 9+
- Java 17 JDK
- 8GB RAM minimum
- ~10GB Festplatte

### Für EAS Cloud Build
- Expo Account
- Internet-Verbindung
- Keine lokalen Tools nötig

## 🔍 Dateigrößen

| Komponente | Größe |
|-----------|-------|
| Quellcode | ~5 MB |
| node_modules | ~500 MB |
| Android SDK | ~5 GB (einmalig) |
| APK Release | 50-70 MB |
| APK Debug | 80-100 MB |

## 🎯 Nächste Schritte

1. Build erstellen: Folgen Sie den Anweisungen in QUICK_BUILD_GUIDE.md
2. Testen: Installieren Sie die APK auf einem Android-Gerät
3. Veröffentlichen: Laden Sie die APK in den Google Play Store
4. Erweitern: Fügen Sie neue Features hinzu

## 📚 Zusätzliche Ressourcen

- Expo Dokumentation: https://docs.expo.dev/
- React Native Guide: https://reactnative.dev/
- Android Developer: https://developer.android.com/
- Tailwind CSS: https://tailwindcss.com/

## 💡 Tipps

1. Erster Build dauert länger - Gradle lädt Dependencies herunter
2. Gradle Daemon - Bleibt aktiv für schnellere nächste Builds
3. Speicher - Erhöhen Sie mit export GRADLE_OPTS="-Xmx4096m"
4. Cache löschen - Mit ./gradlew clean bei Problemen

## 🆘 Support

Bei Fragen oder Problemen:

1. Lesen Sie die BUILD_INSTRUCTIONS.md
2. Überprüfen Sie die QUICK_BUILD_GUIDE.md Troubleshooting-Sektion
3. Konsultieren Sie die offizielle Dokumentation
4. Öffnen Sie ein Issue im GitHub-Repository

## 📝 Version-Info

- App Version: 1.0.0
- Expo SDK: 54
- React Native: 0.81
- Gradle: 8.14.3
- Erstellt: April 2026

---

Hinweis: Diese App ist eine Nachbildung von https://subtitlesedit.com und wird zu Demonstrationszwecken bereitgestellt.
