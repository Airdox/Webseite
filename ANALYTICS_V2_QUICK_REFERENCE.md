# 📊 ANALYTICS V2 - QUICK REFERENCE

## 🚀 Zugriff auf Dashboard

| Methode | Aktion |
|---------|--------|
| **URL** | `https://airdox.netlify.app/#admin` |
| **Shortcut** | `Strg + Shift + A` |
| **Console** | `window.airdoxAnalyticsV2.getStats()` |

---

## 📈 Neue Metriken

### Übersicht-Tab
- **👁️ Seitenaufrufe** - Total Page Views
- **⬇️ Downloads** - Total Downloads (Public + VIP)
- **🎯 Sessions** - Anzahl Browsing-Sessions
- **🎵 Audio Plays** - Tracks abgespielt
- **⏱️ Ø Session-Dauer** - Durchschnittliche Verweildauer
- **📊 Bounce Rate** - % Besucher mit nur 1 Page View

### Quick Insights
- **Public vs. VIP Downloads** - Verteilung
- **Top Audio Track** - Meist gespielt
- **Skip Rate** - % übersprungene Tracks

---

## 📊 Charts (Charts-Tab)

1. **📈 Aktivität über Zeit** - Line Chart (Page Views, Downloads, Audio Plays)
2. **🔥 Top Downloads** - Bar Chart (Top 10)
3. **🎵 Meist gespielte Tracks** - Bar Chart (Top 10)
4. **💻 Geräte-Verteilung** - Pie Chart (Mobile/Tablet/Desktop)
5. **🌐 Browser-Verteilung** - Pie Chart (Chrome/Firefox/Safari/...)
6. **🔥 Aktivitäts-Heatmap** - Heatmap (Wochentag × Stunde)

---

## 📤 Export

### JSON Export
- Vollständige Daten + Summary
- Filename: `airdox-analytics-[timestamp].json`

### CSV Export
- Excel-kompatibel (UTF-8 BOM)
- Columns: Timestamp, Event Type, Value, Category, Session ID, Device, Browser
- Filename: `airdox-analytics-[timestamp].csv`

---

## 🎯 Time Range Filter

- **Letzte 7 Tage** - Wöchentliche Übersicht
- **Letzte 30 Tage** - Monatliche Übersicht
- **Letzte 90 Tage** - Quartal
- **Gesamt** - Alle Daten seit Beginn

---

## 🔧 Developer Console Commands

```javascript
// Stats abrufen (mit Time Range)
window.airdoxAnalyticsV2.getStats('30days')

// Custom Event
window.airdoxAnalyticsV2.trackEvent('custom_event', { key: 'value' })

// Download
window.airdoxAnalyticsV2.trackDownload('filename', 'size', 'public|vip')

// Audio Event
window.airdoxAnalyticsV2.trackAudioEvent('trackName', 'play|pause|skip|complete', playDuration, trackDuration)

// Interaction
window.airdoxAnalyticsV2.trackInteraction('element', 'section', 'click')

// Export
window.airdoxAnalyticsV2.exportData('json', '30days')
window.airdoxAnalyticsV2.exportData('csv', '30days')

// Clear All Data
window.airdoxAnalyticsV2.clearData()
```

---

## 🎨 Chart Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Cyan** | `#00d9ff` | Page Views, Primary |
| **Pink** | `#ff10f0` | Downloads, Secondary |
| **Purple** | `#b829ff` | Audio, Accent |
| **Green** | `#00ff88` | Success, Positive |
| **Orange** | `#ffaa00` | Warning, Attention |

---

## 🔐 Privacy

✅ **100% Lokal** - Alle Daten in LocalStorage  
✅ **Kein Server** - Keine externe Übertragung  
✅ **Consent-basiert** - Nur mit User-Zustimmung  
✅ **DSGVO-konform** - Privacy-by-Design  

---

## 📱 Mobile

- Dashboard: **Fullscreen**
- Charts: **Responsive** (Auto-Stack)
- Tabs: **Swipeable**
- Export: **Touch-optimiert**

---

## ⚡ Performance

| Metric | Value |
|--------|-------|
| **Dashboard Load** | < 100ms |
| **Chart Render** | < 200ms |
| **Export** | < 500ms |
| **Bundle (gzipped)** | 85.39 KB |

---

## 🐛 Quick Fixes

### Dashboard öffnet nicht?
1. Cookie-Consent akzeptieren
2. `Strg + Shift + A` drücken

### Keine Daten?
1. Analytics aktivieren
2. Seite neu laden
3. Aktionen durchführen (Download/Play)
4. Dashboard refreshen (🔄)

### Export funktioniert nicht?
1. Pop-up-Blocker aus
2. Download-Erlaubnis erteilen

---

## 🎉 Neue Features

✅ Session Analytics (Dauer, Bounce Rate)  
✅ Audio Tracking (Play, Pause, Skip, Complete)  
✅ Device Analytics (Mobile/Desktop, Browser)  
✅ 6 Chart Types (Line, Bar, Pie, Heatmap)  
✅ CSV Export (Excel-ready)  
✅ Time Range Filter (7/30/90 Tage)  
✅ Tabs-Navigation (Overview/Charts/Export)  
✅ Mobile-optimiert  

---

**Version:** 2.0.0  
**Build:** ✅ SUCCESS  
**Status:** 🚀 READY FOR DEPLOYMENT
