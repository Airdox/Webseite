# SubtitlesEdit App - Build-Anweisungen

Dieses Dokument enthält detaillierte Anweisungen zum Erstellen der APK-Datei für die SubtitlesEdit Mobile App.

## Voraussetzungen

Bevor Sie mit dem Build beginnen, stellen Sie sicher, dass Sie folgende Tools installiert haben:

- **Node.js** (v18 oder höher)
- **pnpm** (v9 oder höher) - Paketmanager
- **Expo CLI** - `npm install -g expo-cli`
- **EAS CLI** (für Cloud Builds) - `npm install -g eas-cli`
- **Android Studio** (für lokale Builds) - Optional
- **Java Development Kit (JDK)** - v17 oder höher

## Installation von Abhängigkeiten

```bash
cd subtitlesedit_app_source
pnpm install
```

## Build-Optionen

### Option 1: Cloud Build mit EAS (Empfohlen)

Dies ist die einfachste Methode, da Sie keine lokalen Build-Tools konfigurieren müssen.

```bash
# Anmelden bei EAS
eas login

# Android APK erstellen
eas build --platform android --type apk

# Die APK wird in der EAS-Konsole verfügbar sein
```

### Option 2: Lokaler Build mit Expo

```bash
# Expo-Projekt initialisieren
expo prebuild --clean

# Android APK erstellen
eas build --platform android --type apk --local
```

### Option 3: Direkter Build mit Android Studio

```bash
# Prebuild durchführen
expo prebuild --clean

# Zum Android-Verzeichnis navigieren
cd android

# Build mit Gradle
./gradlew assembleRelease

# APK befindet sich in: app/build/outputs/apk/release/app-release.apk
```

## Konfiguration vor dem Build

### 1. App-Informationen aktualisieren (app.config.ts)

```typescript
const env = {
  appName: "SubtitlesEdit",
  appSlug: "subtitlesedit_app",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/...", // Ihr Logo-URL
  // ... weitere Konfiguration
};
```

### 2. Versionsnummer aktualisieren

Bearbeiten Sie `app.config.ts` und erhöhen Sie die Versionsnummer:

```typescript
const config: ExpoConfig = {
  version: "1.0.1", // Erhöhen Sie dies
  // ...
};
```

### 3. Berechtigungen überprüfen

Die erforderlichen Berechtigungen sind bereits in `app.config.ts` konfiguriert:

```typescript
android: {
  permissions: ["POST_NOTIFICATIONS"],
  // ...
}
```

## Build-Prozess

### Schritt 1: Abhängigkeiten installieren

```bash
pnpm install
```

### Schritt 2: TypeScript überprüfen

```bash
pnpm check
```

### Schritt 3: Linting durchführen

```bash
pnpm lint
```

### Schritt 4: Tests ausführen

```bash
pnpm test
```

### Schritt 5: Build erstellen

```bash
# Für APK
eas build --platform android --type apk

# Oder für AAB (Google Play Store)
eas build --platform android --type app-bundle
```

## Ausgabedateien

Nach erfolgreichem Build finden Sie:

- **APK**: `app-release.apk` - Direkt auf Android-Geräten installierbar
- **AAB**: `app-release.aab` - Für Google Play Store-Verteilung

## Installation auf Android-Gerät

### Methode 1: Über ADB (Android Debug Bridge)

```bash
adb install app-release.apk
```

### Methode 2: Manuelle Installation

1. Laden Sie die APK-Datei auf Ihr Android-Gerät herunter
2. Öffnen Sie die Datei-Manager-App
3. Navigieren Sie zur APK-Datei
4. Tippen Sie darauf und folgen Sie den Installationsanweisungen
5. Akzeptieren Sie die erforderlichen Berechtigungen

### Methode 3: Google Play Store

1. Erstellen Sie ein Google Play Developer-Konto
2. Laden Sie die AAB-Datei in die Google Play Console hoch
3. Folgen Sie den Veröffentlichungsanweisungen

## Troubleshooting

### Problem: "Build fehlgeschlagen - Abhängigkeiten nicht gefunden"

**Lösung:**
```bash
pnpm install
pnpm install --force
```

### Problem: "Java-Version nicht kompatibel"

**Lösung:**
```bash
# Java-Version überprüfen
java -version

# JDK 17 installieren (falls nicht vorhanden)
# Unter Ubuntu:
sudo apt-get install openjdk-17-jdk
```

### Problem: "Android SDK nicht gefunden"

**Lösung:**
1. Installieren Sie Android Studio
2. Setzen Sie die ANDROID_HOME-Umgebungsvariable:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

### Problem: "Gradle Build fehlgeschlagen"

**Lösung:**
```bash
# Gradle-Cache löschen
./gradlew clean

# Erneut versuchen
./gradlew assembleRelease
```

## Optimierungen

### App-Größe reduzieren

```bash
# Unnötige Abhängigkeiten entfernen
pnpm prune

# Produktions-Build erstellen
eas build --platform android --type apk --release
```

### Performance optimieren

1. **Lazy Loading aktivieren** - Screens werden bei Bedarf geladen
2. **Bilder optimieren** - Verwenden Sie WebP-Format
3. **Unnötige Abhängigkeiten entfernen** - Überprüfen Sie package.json

## Verteilung

### Google Play Store

1. Erstellen Sie einen Developer-Account
2. Laden Sie die AAB-Datei hoch
3. Füllen Sie die App-Informationen aus
4. Veröffentlichen Sie die App

### Alternative App Stores

- **F-Droid** - Open-Source App Store
- **Amazon Appstore** - Amazon App Store
- **Samsung Galaxy Store** - Samsung-Geräte

## Sicherheit

### Signierung

Die App wird automatisch signiert mit:
- **Keystore**: Wird von EAS verwaltet
- **Alias**: Eindeutige App-Identität
- **Gültigkeitsdauer**: 30 Jahre

### Berechtigungen

Überprüfen Sie, dass nur notwendige Berechtigungen angefordert werden:

```bash
# Berechtigungen überprüfen
eas build --platform android --type apk --list-permissions
```

## Weitere Ressourcen

- [Expo Dokumentation](https://docs.expo.dev/)
- [React Native Dokumentation](https://reactnative.dev/)
- [Android Developer Guide](https://developer.android.com/)
- [EAS Build Dokumentation](https://docs.expo.dev/build/introduction/)

## Support

Für Fragen oder Probleme:

1. Überprüfen Sie die Logs: `eas build --platform android --type apk --logs`
2. Konsultieren Sie die Expo-Dokumentation
3. Öffnen Sie ein Issue im GitHub-Repository

---

**Letzte Aktualisierung**: April 2026  
**Expo SDK Version**: 54  
**React Native Version**: 0.81
