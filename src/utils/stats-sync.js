const STORAGE_KEY = 'airdox_offline_queue';
const GLOBAL_STATS_KEY = 'airdox_global_stats';

const isDev = import.meta.env?.DEV;
const devLog = (...args) => isDev && console.log('[StatsSync]', ...args);
const devWarn = (...args) => isDev && console.warn('[StatsSync]', ...args);

// Configuration from environment or defaults
const PRODUCTION_URL = 'https://airdox.pages.dev';
const isMobileApp = window.location.protocol === 'file:' || (window.location.hostname === 'localhost' && !!window.Capacitor);
const STATS_API_BASE = (import.meta.env?.VITE_STATS_API_BASE || (isMobileApp ? PRODUCTION_URL : '')).replace(/\/+$/, '');
const STATS_API_FALLBACK = (import.meta.env?.VITE_STATS_API_FALLBACK || '').replace(/\/+$/, '');

const buildStatsUrl = (base) => (base ? `${base}/api/stats` : '/api/stats');
const PRIMARY_STATS_URL = buildStatsUrl(STATS_API_BASE);
const FALLBACK_STATS_URL = STATS_API_FALLBACK ? buildStatsUrl(STATS_API_FALLBACK) : null;

class StatsSync {
    constructor() {
        this.queue = this.loadQueue();
        this.isSyncing = false;
        
        // Listen for online event
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.sync());
            // Initial sync attempt
            setTimeout(() => this.sync(), 2000);
        }
    }

    loadQueue() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    saveQueue() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    }

    addToQueue(id, type) {
        devLog(`Adding to offline queue: ${type} for ${id}`);
        this.queue.push({
            id,
            type,
            timestamp: Date.now()
        });
        this.saveQueue();
    }

    async updateStats(id, type, isQueueRetry = false) {
        const payload = JSON.stringify({ id, type });
        
        const postOnce = async (url) => {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                });
                if (!res.ok) return { ok: false };
                const data = await res.json();
                return { ok: true, data };
            } catch (err) {
                return { ok: false, error: err };
            }
        };

        let result = await postOnce(PRIMARY_STATS_URL);
        if (!result.ok && FALLBACK_STATS_URL && FALLBACK_STATS_URL !== PRIMARY_STATS_URL) {
            result = await postOnce(FALLBACK_STATS_URL);
        }

        if (result.ok) {
            devLog(`Successfully updated ${type} for ${id}`);
            this.updateLocalStatsCache(id, result.data);
            return true;
        } else {
            if (!isQueueRetry) {
                this.addToQueue(id, type);
            }
            return false;
        }
    }

    updateLocalStatsCache(id, newRow) {
        try {
            const stats = JSON.parse(localStorage.getItem(GLOBAL_STATS_KEY) || '{}');
            stats[id] = newRow;
            localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(stats));
            
            // Dispatch event for components to listen to
            window.dispatchEvent(new CustomEvent('airdox_stats_updated', { detail: stats }));
        } catch (err) {
            devWarn('Failed to update local stats cache', err);
        }
    }

    async sync() {
        if (this.isSyncing || this.queue.length === 0) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        this.isSyncing = true;
        devLog(`Starting sync of ${this.queue.length} items...`);

        const remaining = [];
        for (const action of this.queue) {
            const success = await this.updateStats(action.id, action.type, true);
            if (!success) {
                remaining.push(action);
            }
        }

        this.queue = remaining;
        this.saveQueue();
        this.isSyncing = false;
        devLog(`Sync finished. ${remaining.length} items remaining.`);
    }

    trackPlay(id) {
        return this.updateStats(id, 'play');
    }

    trackVote(id, voteType) {
        return this.updateStats(id, voteType);
    }
}

export const statsSync = new StatsSync();
export default statsSync;
