# 🎵 AIRDOX Audio Player - Benutzerhandbuch

Willkommen beim neuen AIRDOX Audio Player! Dieses Handbuch erklärt alle Funktionen des neuen "Blade" Players und der versteckten Admin-Tools.

## 🎧 Player Steuerung

Der Player befindet sich am unteren Bildschirmrand und ist auf allen Seiten verfügbar.

### Basis-Funktionen
- **Play/Pause:** Klicke auf den großen Play-Button in der Mitte oder drücke die `Leertaste`.
- **Nächster/Vorheriger Track:** Nutze die Pfeiltasten im Player oder `N` / `P` auf der Tastatur.
- **Lautstärke:** Fahre mit der Maus über das Lautsprecher-Icon, um den Regler zu sehen, oder nutze `Pfeil Hoch` / `Pfeil Runter`.
- **Seek:** Klicke direkt in die Waveform, um zu einer Stelle zu springen.

### Playlist & Modi
- **Shuffle (Zufall):** Klicke auf das 🔀 Icon, um die Playlist zu mischen.
- **Repeat (Wiederholen):** Klicke auf das 🔁 Icon, um zwischen "Aus", "Alle wiederholen" und "Einen wiederholen" zu wechseln.

---

## ⌨️ Tastatur-Kürzel (Shortcuts)

Steuere den Player blitzschnell mit der Tastatur:

| Taste | Funktion |
|-------|----------|
| `Leertaste` | Play / Pause |
| `N` | Nächster Track |
| `P` | Vorheriger Track |
| `M` | Mute (Stumm) |
| `Pfeil Hoch` | Lauter (+10%) |
| `Pfeil Runter` | Leiser (-10%) |
| `Pfeil Rechts` | +5 Sekunden vor |
| `Pfeil Links` | -5 Sekunden zurück |
| `S` | Shuffle an/aus |
| `R` | Repeat Modus wechseln |

---

## 🕵️‍♂️ Admin & Analytics (Geheim!)

Das Statistik-Dashboard ist für normale Besucher unsichtbar. So greifst du darauf zu:

### Methode 1: Tastenkombination
Drücke auf der Website: **`Strg` + `Shift` + `A`**

### Methode 2: URL-Link
Füge `#admin` an die Adresse an: `https://deine-seite.com/#admin`

### Funktionen im Dashboard
- **Besucherzahlen:** Tägliche und gesamte Views.
- **Downloads:** Welche Sets wurden wie oft geladen?
- **VIP vs. Public:** Vergleich der Download-Kategorien.
- **Daten Export:** Lade alle Daten als JSON herunter.
- **Daten Löschen:** Setzt alle Zähler zurück (nur lokal im Browser).

---

## 📱 Mobile Nutzung
Der Player ist voll responsiv. Auf dem Handy:
- Wische nicht möglich (nutze Buttons).
- Der Player bleibt auch beim Scrollen immer sichtbar.
- Audio spielt weiter, auch wenn das Display ausgeht (dank Media Session API).
