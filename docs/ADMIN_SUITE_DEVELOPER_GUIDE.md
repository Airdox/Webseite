# Admin Suite - Developer Guide

## Für Entwickler: Integration neuer Features

Diese Dokumentation zeigt, wie neue Admin-Features in das Flight Deck integriert werden.

---

## 1. Neue Component hinzufügen

### Schritt 1: Component-Datei erstellen

```jsx
// src/desktop/components/MyNewTab.jsx

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';

const MyNewTab = ({
  data = {},
  onRefresh = () => {},
  onExport = () => {},
  busy = false,
}) => {
  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>My New Tab</h2>
          <p>Beschreibung der Funktionalität.</p>
        </div>
        <div className="fd-toolbar-actions">
          <button
            type="button"
            className="fd-button secondary"
            onClick={onRefresh}
            disabled={busy}
          >
            <RefreshCw size={16} />
            Aktualisieren
          </button>
          <button
            type="button"
            className="fd-button"
            onClick={onExport}
            disabled={busy}
          >
            <Download size={16} />
            Exportieren
          </button>
        </div>
      </section>

      {/* Your content here */}
    </div>
  );
};

export default MyNewTab;
```

### Schritt 2: CSS-Klassen definieren

```css
/* Add to src/desktop/desktop.css */

.fd-my-new-component {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.fd-my-new-component-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Schritt 3: In DesktopApp registrieren

```jsx
// src/desktop/DesktopApp.jsx

import MyNewTab from './components/MyNewTab.jsx';

const TABS = [
  // ... existing tabs
  { id: 'mynew', label: 'My New Tab', icon: MyIcon },
];

// In useState:
const [myNewData, setMyNewData] = useState({});

// In renderTab():
if (activeTab === 'mynew') {
  return (
    <MyNewTab
      data={myNewData}
      onRefresh={async () => {
        const data = await runAsyncAction(
          () => flightDeckApi.getMyNewData({ workspaceRoot: settingsDraft?.workspaceRoot }),
          'Data aktualisiert.',
        );
        if (data) setMyNewData(data);
      }}
      onExport={() => {
        // Implementation
      }}
      busy={busy}
    />
  );
}
```

---

## 2. IPC-Handler hinzufügen

### Im Main-Prozess (desktop/main/index.cjs)

```javascript
ipcMain.handle('flightdeck:get-my-new-data', async (_event, payload) => {
  try {
    const workspaceRoot = await resolveWorkspaceRoot(payload?.workspaceRoot);
    
    // Deine Logik hier
    const data = await fetchMyData(workspaceRoot);
    
    return data;
  } catch (error) {
    await writeStartupLog(`My new data error: ${error.message}`);
    return null;
  }
});
```

### In der Preload-Datei (desktop/main/preload.cjs)

```javascript
contextBridge.exposeInMainWorld('flightDeckApi', {
  // ... existing methods
  getMyNewData: (payload) => ipcRenderer.invoke('flightdeck:get-my-new-data', payload),
});
```

---

## 3. Service-Methode hinzufügen

### In desktop/main/services/myservice.mjs

```javascript
export async function getMyData(db, workspaceRoot) {
  try {
    // Datenbankabfrage
    const result = await db.query(`
      SELECT * FROM my_table
      WHERE workspace = $1
      LIMIT 100
    `, [workspaceRoot]);

    return result.rows || [];
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

export async function updateMyData(db, workspaceRoot, payload) {
  try {
    const result = await db.query(`
      UPDATE my_table
      SET data = $1
      WHERE id = $2 AND workspace = $3
    `, [payload.data, payload.id, workspaceRoot]);

    return result.rowCount > 0;
  } catch (error) {
    console.error('Error updating data:', error);
    return false;
  }
}
```

---

## 4. Tests schreiben

```javascript
// src/desktop/__tests__/MyNewTab.test.jsx

import { describe, it, expect, vi } from 'vitest';
import MyNewTab from '../components/MyNewTab';

describe('MyNewTab', () => {
  const defaultProps = {
    data: { /* test data */ },
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    busy: false,
  };

  it('renders without crashing', () => {
    const { container } = render(<MyNewTab {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('calls onRefresh when button is clicked', async () => {
    const onRefresh = vi.fn();
    const { getByRole } = render(
      <MyNewTab {...defaultProps} onRefresh={onRefresh} />,
    );
    const btn = getByRole('button', { name: /Aktualisieren/ });
    await user.click(btn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('disables buttons when busy', () => {
    const { getByRole } = render(
      <MyNewTab {...defaultProps} busy={true} />,
    );
    const btn = getByRole('button');
    expect(btn.disabled).toBe(true);
  });
});
```

### Test ausführen

```bash
npm run desktop:test -- MyNewTab.test.jsx
```

---

## 5. Live Update Integration

### LiveUpdateManager verwenden

```javascript
// In DesktopApp oder Component

import LiveUpdateManager from './lib/LiveUpdateManager';

const manager = new LiveUpdateManager({
  enabled: settingsDraft.liveUpdatesEnabled,
  updateInterval: settingsDraft.liveUpdateInterval,
});

// Subscribe zu Datenänderungen
useEffect(() => {
  const unsubscribe = manager.subscribe('my_table', (update) => {
    if (update.type === 'update') {
      setMyData(update.data);
    }
  });

  return unsubscribe;
}, []);

// Starte Polling
useEffect(() => {
  if (settingsDraft.liveUpdatesEnabled) {
    manager.startPolling('my_table', async () => {
      return await flightDeckApi.getMyNewData({
        workspaceRoot: settingsDraft.workspaceRoot,
      });
    });
  }

  return () => manager.stopPolling('my_table');
}, [settingsDraft.liveUpdatesEnabled]);

// Cleanup
useEffect(() => {
  return () => manager.dispose();
}, []);
```

---

## 6. Datenfluss-Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ React Component (MyNewTab.jsx)                              │
│ - Rendert UI                                                │
│ - State Management                                          │
│ - Event Handling                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ onRefresh/onExport props
                         │
┌────────────────────────▼────────────────────────────────────┐
│ DesktopApp.jsx                                              │
│ - runAsyncAction()                                          │
│ - State Updates                                             │
│ - IPC Invocation                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ flightDeckApi.getMyNewData()
                         │
┌────────────────────────▼────────────────────────────────────┐
│ desktop/main/preload.cjs                                    │
│ - IPC Bridge                                                │
└────────────────────────┬────────────────────────────────────┘
                         │ ipcRenderer.invoke()
                         │
┌────────────────────────▼────────────────────────────────────┐
│ desktop/main/index.cjs                                      │
│ - IPC Handler Registration                                  │
└────────────────────────┬────────────────────────────────────┘
                         │ ipcMain.handle()
                         │
┌────────────────────────▼────────────────────────────────────┐
│ desktop/main/services/myservice.mjs                         │
│ - Business Logic                                            │
│ - Database Queries                                          │
│ - Data Processing                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ Database (Neon PostgreSQL)                                  │
│ - Persistence                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Error Handling Best Practices

```javascript
// ✓ GUT: Umfassendes Error Handling
async function getMyData(workspaceRoot) {
  try {
    const result = await fetchFromDb(workspaceRoot);
    if (!result) {
      throw new Error('No data found');
    }
    return result;
  } catch (error) {
    console.error('Error in getMyData:', error);
    await writeStartupLog(`getMyData failed: ${error.message}`);
    return null; // oder Default-Wert
  }
}

// ✓ GUT: User-freundliche Fehlerbehandlung im UI
const result = await runAsyncAction(
  () => flightDeckApi.getMyData({ workspaceRoot }),
  'Data successfully loaded.',
);

if (!result) {
  // Fehler wurde bereits dem Nutzer angezeigt
  return;
}

// ✗ SCHLECHT: Keine Error-Behandlung
const data = await flightDeckApi.getMyData(); // Kann abstürzen
```

---

## 8. Performance-Optimierung

### Component Memoization

```javascript
import React, { memo } from 'react';

const MyNewTabMemo = memo(MyNewTab, (prevProps, nextProps) => {
  // Return true wenn Props gleich sind (keine Re-render)
  return (
    prevProps.busy === nextProps.busy &&
    prevProps.data === nextProps.data
  );
});

export default MyNewTabMemo;
```

### Debounced Input

```javascript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDeferredValue(searchTerm);

// debouncedSearch wird mit Verzögerung aktualisiert
const results = useMemo(
  () => filterData(debouncedSearch),
  [debouncedSearch],
);
```

### Virtualisierte Listen (zukünftig)

```javascript
// Für große Listen verwende React-Window statt render aller Items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={35}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  )}
</FixedSizeList>
```

---

## 9. Linting & Code Quality

```bash
# ESLint für neue Components
npm run lint -- src/desktop/components/MyNewTab.jsx

# Fix automatisch
npm run lint -- src/desktop/components/MyNewTab.jsx --fix

# Alle Tests
npm run desktop:test

# Code Coverage
npm run desktop:test -- --coverage
```

---

## 10. Deployment Checklist

- [ ] Alle Tests bestanden
- [ ] Keine ESLint-Fehler
- [ ] Component-Props dokumentiert
- [ ] Error Handling implementiert
- [ ] Performance-Tests durchgeführt
- [ ] Browser-Kompatibilität getestet
- [ ] Build erfolgreich: `npm run build`
- [ ] Desktop-Build erfolgreich: `npm run desktop:dist`
- [ ] Dokumentation aktualisiert
- [ ] Git-Commit mit aussagekräftiger Nachricht

---

## Beispiel: Vollständige Integration (Schritt-für-Schritt)

### Ziel: Neuer "Database Maintenance" Tab

**Schritt 1-5 Zusammengefasst:**

```bash
# 1. Component erstellen
cat > src/desktop/components/DatabaseMaintenanceTab.jsx << 'EOF'
import React from 'react';

const DatabaseMaintenanceTab = ({ data = {}, onRefresh = () => {}, busy = false }) => (
  <div className="fd-panel-stack">
    <section className="fd-toolbar-band">
      <h2>Database Maintenance</h2>
    </section>
  </div>
);

export default DatabaseMaintenanceTab;
EOF

# 2. In DesktopApp registrieren
# - Import hinzufügen
# - TABS Array aktualisieren
# - State hinzufügen
# - renderTab Case hinzufügen

# 3. IPC Handler in preload.cjs
# contextBridge.exposeInMainWorld('flightDeckApi', {
#   getDatabaseStats: (payload) => ipcRenderer.invoke(...),
# });

# 4. IPC Handler in index.cjs
# ipcMain.handle('flightdeck:get-database-stats', async (...) => {
#   // Implementation
# });

# 5. Tests schreiben
npm run desktop:test

# 6. Build & Test
npm run build
npm run desktop:dist
```

---

## Häufige Fehler & Lösungen

### Fehler: "flightDeckApi is not defined"

**Ursache**: preload.cjs nicht aktualisiert

**Lösung**: Stelle sicher dass die neue API-Methode in `contextBridge.exposeInMainWorld` definiert ist

### Fehler: "Cannot read property of undefined"

**Ursache**: Props nicht mit Default-Werten initialisiert

**Lösung**:

```javascript
const MyComponent = ({ data = {}, onAction = () => {} }) => {
  //          ^default values
  return null;
};
```

### Fehler: "Cannot read properties of undefined (reading 'handle')"

**Ursache**: Electron wurde im `run-as-node` Modus gestartet (`ELECTRON_RUN_AS_NODE` gesetzt), dadurch fehlen Main-APIs wie `ipcMain`.

**Lösung**:

1. Start immer über `npm run desktop:dev` oder `npm run desktop:start`
2. Bei manuellem Start vorher `ELECTRON_RUN_AS_NODE` entfernen
3. Startup-Log prüfen (`desktop/main/index.cjs` schreibt bei dem Fall einen klaren Hinweis)

### Fehler: Component rendert nicht

**Ursache**: Tab nicht in TABS Array oder renderTab() nicht implementiert

**Lösung**: Überprüfe beide Stellen

---

## Ressourcen

- **React Docs**: <https://react.dev/>
- **Electron IPC**: <https://www.electronjs.org/docs/latest/api/ipc-main>
- **Vitest**: <https://vitest.dev/>
- **Lucide Icons**: <https://lucide.dev/icons/>

---

**Version**: 0.2.0  
**Letztes Update**: 25. April 2026
