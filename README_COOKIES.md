# 🍪 Cookie & Storage Guide für AIRDOX

Dieses Dokument erklärt die aktuelle Implementierung der Datenspeicherung (Cookies vs. LocalStorage) und zeigt, wie man diese Daten ausliest und verwendet.

## ⚠️ Wichtige Erkenntnis: Aktueller Status

Nach Analyse des Codes (`CookieBanner.jsx` und `analyticsV2.js`) wurde festgestellt:
**Aktuell werden KEINE echten Cookies (`document.cookie`) verwendet.**

Stattdessen nutzt die Anwendung **LocalStorage** und **SessionStorage**.

Das ist der Grund, warum du beim Versuch, "Cookies" auszulesen (z.B. über `document.cookie`), wahrscheinlich nichts findest oder Probleme hast.

---

## 📂 1. Daten Auslesen (Schritt-für-Schritt)

Da die Daten im `LocalStorage` liegen, musst du sie anders abrufen als klassische Cookies.

### 🔍 Methode A: Über die Entwickler-Konsole (Browser)
Um schnell zu prüfen, was gespeichert ist:

1. Öffne deine Website.
2. Rechtsklick irgendwo auf die Seite -> **Untersuchen** (Inspect).
3. Gehe zum Reiter **Anwendung** (Application).
   - *Falls nicht sichtbar: Klicke auf die zwei Pfeile `>>` oben in der Leiste.*
4. Links im Menü unter **Speicher** (Storage) -> **Lokaler Speicher** (Local Storage) -> Klicke auf deine URL.
5. Hier siehst du alle gespeicherten Werte (Key-Value Paare).

**Wichtige Keys in deinem Projekt:**
- `airdox-analytics-enabled`: (String) `'true'` oder `'false'` (Zustimmung erteilt?)
- `airdox-analytics-data`: (String/JSON) Enthält die kompletten Analytics-Daten als JSON.

### 💻 Methode B: Per Code (JavaScript)

Das ist der **richtige Weg**, um die Daten in deinem Code zu benutzen.

**Falsch (für deine aktuelle Implementierung):**
```javascript
// Das funktioniert NICHT, da keine Cookies gesetzt sind:
const allCookies = document.cookie; 
```

**Richtig (LocalStorage):**
```javascript
// 1. Zustimmung prüfen
const consent = localStorage.getItem('airdox-analytics-enabled');
if (consent === 'true') {
    console.log("User hat zugestimmt!");
}

// 2. Analytics Daten lesen
const rawData = localStorage.getItem('airdox-analytics-data');
if (rawData) {
    const data = JSON.parse(rawData); // WICHTIG: JSON parsen!
    console.log("Anzahl PageViews:", data.pageViews.length);
}
```

---

## 🛠️ 2. "Echte" Cookies Implementieren (Falls gewünscht)

Falls du **zwingend** echte Cookies benötigst (z.B. damit der Server die Daten bei jedem Request lesen kann), musst du die Implementierung ändern.

Dafür empfehle ich die Bibliothek `js-cookie`, da der native Umgang mit `document.cookie` fehleranfällig und umständlich ist.

### Schritt 1: Bibliothek installieren
```bash
npm install js-cookie
```

### Schritt 2: Nutzung im Code
Du müsstest `localStorage.setItem` durch `Cookies.set` ersetzen.

**Beispiel für `CookieBanner.jsx` Umbau:**

```javascript
import Cookies from 'js-cookie'; // Importieren

// ...

const handleAccept = () => {
    // Statt localStorage.setItem(...)
    Cookies.set('airdox-analytics-enabled', 'true', { expires: 365, secure: true }); 
    
    setShowBanner(false);
    window.dispatchEvent(new CustomEvent('analytics-consent-changed'));
};

const handleDecline = () => {
    Cookies.set('airdox-analytics-enabled', 'false', { expires: 365, secure: true });
    setShowBanner(false);
};
```

**Auslesen ("Echte" Cookies):**
```javascript
import Cookies from 'js-cookie';

const consent = Cookies.get('airdox-analytics-enabled');
```

---

## ⚖️ Vergleich: LocalStorage vs. Cookies

| Feature | LocalStorage (Aktuell) | Cookies (Alternative) |
| :--- | :--- | :--- |
| **Speicherplatz** | Groß (~5-10 MB) | Klein (4 KB) |
| **Server-Zugriff** | Nein (Daten bleiben im Browser) | Ja (werden bei jedem Request an den Server gesendet) |
| **Performance** | Besser (kein unnötiger Traffic) | Schlechter (bläht Requests auf) |
| **Ablaufdatum** | Bleibt bis zur Löschung | Kann Ablaufdatum haben (z.B. 1 Jahr) |
| **Geeignet für** | Einstellungen, Warenkörbe, Große Daten | Auth-Token, Session-IDs für Server |

### ✅ Empfehlung für AIRDOX
Bleib bei **LocalStorage** für deine Analytics-Daten und Einstellungen.
1. Es ist schneller.
2. Du speicherst dort komplexe JSON-Objekte (`airdox-analytics-data`), die viel zu groß für Cookies wären (Cookies haben ein 4KB Limit!).

**Fazit:** Deine Implementierung ist **korrekt** für eine moderne Single-Page-Application (React), nutzt aber eben technisch keine Cookies. Du musst nur deine Auslese-Logik anpassen (`localStorage.getItem` statt Cookies).
