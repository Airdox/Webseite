# 🎵 AIRDOX Audio Player - Technische Dokumentation

## 📋 Übersicht
Diese Dokumentation beschreibt die Architektur und API des neuen Audio-Players sowie das Feedback-System.

---

## 🏗️ Komponenten-Struktur

```
src/
├── components/
│   ├── AudioPlayer/
│   │   ├── AudioPlayer.jsx      # Haupt-Komponente ("The Blade")
│   │   └── AudioPlayer.css      # Styling & Animationen
│   └── BackgroundEffects.jsx    # Canvas Particle System (Parallax)
├── contexts/
│   ├── AudioPlayerContext.jsx   # Global State Management
│   └── ToastContext.jsx         # Notification System
```

## 🔌 AudioPlayerContext API

Der `useAudioPlayer` Hook stellt folgende Funktionen bereit:

### State
- `currentTrack`: Objekt mit Track-Daten (url, name, cover)
- `isPlaying`: Boolean
- `volume`: Number (0-1)
- `isMuted`: Boolean
- `currentTime`: Number (Sekunden)
- `duration`: Number (Sekunden)
- `playlist`: Array von Tracks

### Actions
- `playTrack(track)`: Spielt einen spezifischen Track
- `togglePlay()`: Start/Stop
- `next()` / `previous()`: Playlist Navigation
- `seekTo(time)`: Springt zu Zeitstempel
- `changeVolume(level)`: Setzt Lautstärke
- `addToPlaylist(track)`: Fügt Track zur Queue hinzu

## 🔔 ToastContext API

Der `useToast` Hook ermöglicht User-Feedback:

```javascript
const { addToast } = useToast();
addToast('Nachricht', 'success'); // types: success, error, info
```

## 🎨 Visualisierung (WaveSurfer.js)

Wir nutzen WaveSurfer.js für die Waveform-Darstellung.

**Konfiguration:**
```javascript
WaveSurfer.create({
    container: ref,
    waveColor: 'rgba(0, 240, 255, 0.3)', // Cyan transparent
    progressColor: '#00f0ff',            // Cyan solid
    cursorColor: '#ff006e',              // Pink
    barWidth: 2,
    barGap: 2,
    height: 24,                          // Slim Profile
    responsive: true,
    backend: 'WebAudio'
})
```

## 🌌 Background Effects

Das Partikel-System nutzt ein HTML5 Canvas Overlay mit Parallax-Effekt.

**Features:**
- Scroll-basierter Parallax (Partikel bewegen sich relativ zum Scroll)
- Gradient Shift im Hintergrund
- Performance-optimiert (requestAnimationFrame)

## ⌨️ Keyboard Shortcuts

| Taste | Funktion |
|-------|----------|
| `Space` | Play / Pause |
| `N` | Next Track |
| `P` | Previous Track |
| `M` | Mute Toggle |
| `S` | Shuffle Toggle |
| `R` | Repeat Toggle |
| `↑` / `↓` | Volume +/- |
| `←` / `→` | Seek +/- 5s |

---

## 🔄 Integration Guide

Um den Player in neuen Komponenten zu nutzen:

1. Hooks importieren:
```javascript
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useToast } from '../contexts/ToastContext';
```

2. Hooks nutzen:
```javascript
const { playTrack } = useAudioPlayer();
const { addToast } = useToast();
```

3. Track abspielen mit Feedback:
```javascript
<button onClick={() => {
    playTrack(track);
    addToast(`Spiele: ${track.name}`, 'success');
}}>
    Play
</button>
```
