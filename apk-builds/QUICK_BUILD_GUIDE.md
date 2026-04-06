# SubtitlesEdit App - Schnelle APK-Build Anleitung

## 🚀 Schnellstart (5 Minuten)

Folgen Sie diesen Schritten, um die APK-Datei schnell zu erstellen:

### Schritt 1: Voraussetzungen installieren

```bash
# Node.js und pnpm (falls nicht installiert)
curl -fsSL https://get.pnpm.io/install.sh | sh -
npm install -g pnpm

# Java 17 installieren
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# JAVA_HOME setzen
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Schritt 2: Projekt vorbereiten

```bash
cd subtitlesedit_app_source

# Abhängigkeiten installieren
pnpm install

# Prebuild durchführen
npx expo prebuild --clean --platform android
```

### Schritt 3: APK erstellen

```bash
cd android

# Build starten
./gradlew assembleRelease

# Oder für schnelleren Debug-Build:
./gradlew assembleDebug
```

### Schritt 4: APK finden

Die fertige APK befindet sich unter:

**Release APK:**
```
app/build/outputs/apk/release/app-release.apk
```

**Debug APK (schneller):**
```
app/build/outputs/apk/debug/app-debug.apk
```

## ⚡ Schnelle Alternativen

### Option A: EAS Cloud Build (Empfohlen - Keine lokalen Tools nötig)

```bash
# Anmelden
eas login

# APK erstellen (Cloud)
eas build --platform android --type apk

# APK wird in der EAS-Konsole verfügbar
```

### Option B: Docker Build (Isolierte Umgebung)

```bash
# Docker-Image mit Android SDK
docker run --rm -v $(pwd):/workspace \
  -w /workspace/subtitlesedit_app_source \
  reactnativecommunity/react-native-android \
  ./gradlew assembleRelease
```

### Option C: GitHub Actions (Automatisiert)

Erstellen Sie `.github/workflows/build-apk.yml`:

```yaml
name: Build APK

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: cd subtitlesedit_app_source && pnpm install
      - run: cd subtitlesedit_app_source && npx expo prebuild --clean --platform android
      - run: cd subtitlesedit_app_source/android && ./gradlew assembleRelease
      - uses: actions/upload-artifact@v3
        with:
          name: apk
          path: subtitlesedit_app_source/android/app/build/outputs/apk/release/
```

## 📊 Build-Zeit Übersicht

| Methode | Zeit | Anforderungen |
|---------|------|---------------|
| Lokaler Build | 15-30 Min | Java 17, 8GB RAM |
| EAS Cloud | 5-10 Min | Expo Account |
| Docker | 20-40 Min | Docker installiert |
| GitHub Actions | 20-30 Min | GitHub Repo |

## 🔧 Troubleshooting

### Problem: "Java 17 nicht gefunden"

```bash
# Java-Version überprüfen
java -version

# Java 17 installieren
sudo apt-get install -y openjdk-17-jdk

# JAVA_HOME setzen
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Problem: "Gradle Daemon fehlgeschlagen"

```bash
# Gradle-Cache löschen
./gradlew --stop
rm -rf ~/.gradle/wrapper

# Erneut versuchen
./gradlew assembleRelease
```

### Problem: "Out of Memory"

```bash
# Gradle-Speicher erhöhen
export GRADLE_OPTS="-Xmx4096m"
./gradlew assembleRelease
```

### Problem: "NDK nicht gefunden"

```bash
# NDK automatisch installieren
./gradlew build --info
```

## 📦 APK-Größe optimieren

### Debug APK (schneller, größer)
```bash
./gradlew assembleDebug
# Größe: ~80-100 MB
```

### Release APK (langsamer, kleiner)
```bash
./gradlew assembleRelease
# Größe: ~50-70 MB
```

### Optimierter Release Build
```bash
# build.gradle anpassen
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

./gradlew assembleRelease
# Größe: ~30-40 MB
```

## 🎯 APK testen

### Auf Gerät installieren

```bash
# Mit ADB
adb install app-release.apk

# Oder direkt auf Gerät kopieren und öffnen
```

### Im Emulator testen

```bash
# Emulator starten
emulator -avd Pixel_4_API_30 &

# APK installieren
adb install app-release.apk

# App starten
adb shell am start -n space.manus.subtitlesedit_app/space.manus.subtitlesedit_app.MainActivity
```

## 📤 Veröffentlichung

### Google Play Store

1. Erstellen Sie einen Developer-Account
2. Erstellen Sie eine neue App
3. Laden Sie die APK hoch
4. Füllen Sie die App-Informationen aus
5. Veröffentlichen Sie die App

### Alternative App Stores

- **F-Droid** - Open-Source App Store
- **Amazon Appstore** - Amazon App Store
- **Samsung Galaxy Store** - Samsung-Geräte

## 📝 Weitere Ressourcen

- [Expo Build Dokumentation](https://docs.expo.dev/build/introduction/)
- [React Native Android Guide](https://reactnative.dev/docs/android-setup)
- [Gradle Documentation](https://docs.gradle.org/)
- [Android Developer Guide](https://developer.android.com/)

## 💡 Tipps & Tricks

1. **Erste Build dauert länger** - Gradle lädt alle Dependencies herunter
2. **Gradle Daemon** - Bleibt nach dem Build aktiv für schnellere nächste Builds
3. **Incremental Build** - Nur geänderte Dateien werden neu kompiliert
4. **Build Cache** - Kann mit `./gradlew clean` geleert werden

## 🆘 Support

Bei Problemen:

1. Überprüfen Sie die Logs: `./gradlew assembleRelease --info`
2. Konsultieren Sie die Expo-Dokumentation
3. Öffnen Sie ein Issue im GitHub-Repository

---

**Letzte Aktualisierung**: April 2026  
**Expo SDK**: 54  
**React Native**: 0.81  
**Gradle**: 8.14.3
