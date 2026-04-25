/**
 * Live Update System für AIRDOX Flight Deck
 * Verwaltet Echtzeit-Synchronisierung von Datenbank-Änderungen
 */

export class LiveUpdateManager {
  constructor(options = {}) {
    this.listeners = new Map();
    this.isEnabled = options.enabled ?? false;
    this.updateInterval = options.updateInterval ?? 1000;
    this.pollIntervals = new Map();
    this.lastUpdates = new Map();
    this.syncQueue = [];
    this.isSyncing = false;
  }

  /**
   * Registriere einen Listener für Tabellen-Updates
   * @param {string} table - Tabellenname
   * @param {Function} callback - Callback bei Update
   */
  subscribe(table, callback) {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, []);
    }
    this.listeners.get(table).push(callback);

    return () => {
      const callbacks = this.listeners.get(table);
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) {
        callbacks.splice(idx, 1);
      }
    };
  }

  /**
   * Starte Polling für eine Tabelle
   * @param {string} table - Tabellenname
   * @param {Function} fetcher - Async Funktion zum Abrufen der Daten
   */
  startPolling(table, fetcher) {
    if (this.pollIntervals.has(table)) {
      clearInterval(this.pollIntervals.get(table));
    }

    const poll = async () => {
      try {
        const data = await fetcher();
        const hash = this.hashData(data);
        const lastHash = this.lastUpdates.get(table);

        if (hash !== lastHash) {
          this.lastUpdates.set(table, hash);
          this.notifyListeners(table, {
            data,
            timestamp: Date.now(),
            type: 'update',
          });
        }
      } catch (error) {
        this.notifyListeners(table, {
          error,
          timestamp: Date.now(),
          type: 'error',
        });
      }
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, this.updateInterval);
    this.pollIntervals.set(table, interval);
  }

  /**
   * Stoppe Polling für eine Tabelle
   * @param {string} table - Tabellenname
   */
  stopPolling(table) {
    if (this.pollIntervals.has(table)) {
      clearInterval(this.pollIntervals.get(table));
      this.pollIntervals.delete(table);
    }
  }

  /**
   * Notifiziere alle Listener einer Tabelle
   * @private
   */
  notifyListeners(table, update) {
    const callbacks = this.listeners.get(table) || [];
    callbacks.forEach((cb) => {
      try {
        cb(update);
      } catch (error) {
        console.error(`Listener error for table ${table}:`, error);
      }
    });
  }

  /**
   * Queued eine Sync-Operation
   * @param {string} table - Tabellenname
   * @param {Object} operation - Sync-Operation {type, data}
   */
  queueSync(table, operation) {
    this.syncQueue.push({
      table,
      operation,
      timestamp: Date.now(),
      retries: 0,
    });

    if (this.isEnabled && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  /**
   * Verarbeite Sync-Queue
   * @private
   */
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift();
        try {
          // Dispatch to actual sync handler
          await this.executeSyncOperation(item);
        } catch {
          if (item.retries < 3) {
            item.retries += 1;
            this.syncQueue.push(item);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Führe Sync-Operation aus (wird in Hauptanwendung überschrieben)
   * @private
   */
  async executeSyncOperation(item) {
    // Override in main app
    try {
      console.log('Sync operation:', item);
    } catch (err) {
      console.error('Sync operation failed:', err);
      throw err;
    }
  }

  /**
   * Berechne Hash der Daten für Change Detection
   * @private
   */
  hashData(data) {
    return JSON.stringify(data).split('').reduce((hash, char) => {
      const charCode = char.charCodeAt(0);
       
      return ((hash << 5) - hash) + charCode | 0;
    }, 0).toString();
  }

  /**
   * Getup und Cleanup
   */
  dispose() {
    this.pollIntervals.forEach((interval) => clearInterval(interval));
    this.pollIntervals.clear();
    this.listeners.clear();
    this.syncQueue = [];
  }
}

export default LiveUpdateManager;
