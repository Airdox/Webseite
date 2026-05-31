import { buildRuntimeApiUrl } from './apiResponse';

const STORAGE_KEY = 'airdox_offline_queue';
const GLOBAL_STATS_KEY = 'airdox_global_stats';

const isDev = import.meta.env?.DEV;
const devLog = (...args) => isDev && console.log('[StatsSync]', ...args);
const devWarn = (...args) => isDev && console.warn('[StatsSync]', ...args);

const STATS_API_BASE = (import.meta.env?.VITE_STATS_API_BASE || '').replace(/\/+$/, '');
const STATS_API_FALLBACK = (import.meta.env?.VITE_STATS_API_FALLBACK || '').replace(/\/+$/, '');

const getPrimaryStatsUrl = () => buildRuntimeApiUrl('/api/stats', STATS_API_BASE);
const getFallbackStatsUrl = () => (STATS_API_FALLBACK ? buildRuntimeApiUrl('/api/stats', STATS_API_FALLBACK) : null);

// Helper to get device/browser/os info
const getMetadata = () => {
    if (typeof navigator === 'undefined') return {};
    const ua = navigator.userAgent;
    let browser = "Other";
    let os = "Other";
    let device = "Desktop";

    if (/Mobi|Android|iPhone/i.test(ua)) device = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    if (ua.includes("Windows NT")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return { device, browser, os };
};

// Generate or get persistent session ID
const getSessionId = () => {
    if (typeof localStorage === 'undefined') return null;
    let sid = localStorage.getItem('airdox_sid');
    if (!sid) {
        sid = 's_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('airdox_sid', sid);
    }
    return sid;
};

class StatsSync {
    constructor() {
        this.queue = this.loadQueue();
        this.isSyncing = false;
        
        // Listen for online event
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.sync());
            // Initial sync and fetch attempt
            setTimeout(() => {
                this.sync();
                this.fetchAllStats();
            }, 1500);
        }
    }

    async fetchAllStats() {
        devLog('Fetching latest global stats...');
        const primaryStatsUrl = getPrimaryStatsUrl();
        const fallbackStatsUrl = getFallbackStatsUrl();
        try {
            const res = await fetch(primaryStatsUrl);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            
            if (data && typeof data === 'object') {
                localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(data));
                window.dispatchEvent(new CustomEvent('airdox_stats_updated', { detail: data }));
                devLog('Global stats updated successfully');
                return data;
            }
        } catch (err) {
            devWarn('Failed to fetch global stats', err);
            
            // Try fallback if primary fails
            if (fallbackStatsUrl && fallbackStatsUrl !== primaryStatsUrl) {
                try {
                    const fallbackRes = await fetch(fallbackStatsUrl);
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json();
                        localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(fallbackData));
                        window.dispatchEvent(new CustomEvent('airdox_stats_updated', { detail: fallbackData }));
                        return fallbackData;
                    }
                } catch (fallbackErr) {
                    devWarn('Fallback stats fetch also failed', fallbackErr);
                }
            }
        }
        return null;
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
        const metadata = getMetadata();
        const primaryStatsUrl = getPrimaryStatsUrl();
        const fallbackStatsUrl = getFallbackStatsUrl();
        const payload = JSON.stringify({ 
            id, 
            type, 
            sessionId: getSessionId(),
            ...metadata 
        });
        
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

        let result = await postOnce(primaryStatsUrl);
        if (!result.ok && fallbackStatsUrl && fallbackStatsUrl !== primaryStatsUrl) {
            result = await postOnce(fallbackStatsUrl);
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
        this.queue = this.loadQueue();
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
