# SubtitlesEdit APK - Installation und Build

## 🎯 Schnellstart (Ein Befehl)

```bash
cd subtitlesedit_app_source
bash CREATE_APK.sh
```

Das Script kümmert sich um alles!

## 📋 Was das Script macht

1. ✓ Überprüft Voraussetzungen (Node.js, Java 17, pnpm)
2. ✓ Installiert Dependencies
3. ✓ Führt Prebuild durch
4. ✓ Erstellt die APK-Datei
5. ✓ Zeigt den APK-Pfad an

## 🚀 Manuelle Installation (Falls Script nicht funktioniert)

### Schritt 1: Voraussetzungen

```bash
# Java 17 installieren
sudo apt-get update
sudo apt-get install -y openjdk-17-jdk

# pnpm installieren (falls nicht vorhanden)
npm install -g pnpm
```

### Schritt 2: Dependencies installieren

```bash
cd subtitlesedit_app_source
pnpm install
```

### Schritt 3: Prebuild durchführen

```bash
npx expo prebuild --clean --platform android
```

### Schritt 4: APK erstellen

```bash
cd android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleRelease
```

### Schritt 5: APK finden

```bash
ls -lh app/build/outputs/apk/release/app-release.apk
```

## 📱 APK auf Android installieren

### Mit ADB (Android Debug Bridge)

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

### Manuell

1. Kopieren Sie die APK auf Ihr Android-Gerät
2. Öffnen Sie den Datei-Manager
3. Tippen Sie auf die APK-Datei
4. Folgen Sie den Installationsanweisungen

## ⏱️ Zeitschätzung

- **Erster Build**: 20-30 Minuten (Gradle lädt Dependencies)
- **Nächste Builds**: 10-15 Minuten (Incremental Build)
- **Mit EAS Cloud**: 5-10 Minuten

## 🆘 Troubleshooting

### Problem: "Java 17 nicht gefunden"

```bash
sudo apt-get install -y openjdk-17-jdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Problem: "Out of Memory"

```bash
export GRADLE_OPTS="-Xmx4096m"
./gradlew assembleRelease
```

### Problem: "Gradle Daemon fehlgeschlagen"

```bash
./gradlew --stop
rm -rf ~/.gradle/wrapper
./gradlew assembleRelease
```

## 📊 Dateigrößen

- **Release APK**: 50-70 MB
- **Debug APK**: 80-100 MB
- **Installiert**: 100-150 MB

## 🎯 Nächste Schritte

1. Führen Sie `CREATE_APK.sh` aus
2. Warten Sie auf den Build
3. Installieren Sie die APK auf Ihrem Android-Gerät
4. Testen Sie die App

---

**Hinweis**: Der erste Build dauert länger, da Gradle alle Dependencies herunterlädt. Nachfolgende Builds sind schneller.
