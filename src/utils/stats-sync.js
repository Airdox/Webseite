import { buildRuntimeApiUrl } from './apiResponse';
import { requestUrlJson } from './apiClient';
import {
    dispatchWindowEvent,
    getStorageItem,
    readStorageJson,
    setStorageItem,
    STORAGE_KEYS,
    WINDOW_EVENTS,
    writeStorageJson,
} from './websiteContracts';

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
    let sid = getStorageItem(STORAGE_KEYS.sessionId, '');
    if (!sid) {
        sid = 's_' + Math.random().toString(36).substring(2, 15);
        setStorageItem(STORAGE_KEYS.sessionId, sid);
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
            const { response, data } = await requestUrlJson(primaryStatsUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            if (data && typeof data === 'object') {
                writeStorageJson(STORAGE_KEYS.globalStats, data);
                dispatchWindowEvent(WINDOW_EVENTS.statsUpdated, data);
                devLog('Global stats updated successfully');
                return data;
            }
        } catch (err) {
            devWarn('Failed to fetch global stats', err);
            
            // Try fallback if primary fails
            if (fallbackStatsUrl && fallbackStatsUrl !== primaryStatsUrl) {
                try {
                    const { response: fallbackRes, data: fallbackData } = await requestUrlJson(fallbackStatsUrl);
                    if (fallbackRes.ok) {
                        writeStorageJson(STORAGE_KEYS.globalStats, fallbackData);
                        dispatchWindowEvent(WINDOW_EVENTS.statsUpdated, fallbackData);
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
        return readStorageJson(STORAGE_KEYS.offlineStatsQueue, []);
    }

    saveQueue() {
        writeStorageJson(STORAGE_KEYS.offlineStatsQueue, this.queue);
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
        const payload = { 
            id, 
            type, 
            sessionId: getSessionId(),
            ...metadata 
        };
        
        const postOnce = async (url) => {
            try {
                const { response, data } = await requestUrlJson(url, {
                    method: 'POST',
                    body: payload,
                });
                if (!response.ok) return { ok: false };
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
            const stats = readStorageJson(STORAGE_KEYS.globalStats, {});
            stats[id] = newRow;
            writeStorageJson(STORAGE_KEYS.globalStats, stats);
            
            dispatchWindowEvent(WINDOW_EVENTS.statsUpdated, stats);
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
