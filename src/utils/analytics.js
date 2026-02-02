/**
 * AIRDOX Analytics - Privacy-First Analytics System
 * 100% lokal, keine externen Services, DSGVO-konform
 */

class Analytics {
    constructor() {
        this.storageKey = 'airdox-analytics-data';
        this.consentKey = 'airdox-analytics-enabled';
        this.sessionKey = 'airdox-session-id';

        // Event Listener für Consent-Änderungen
        window.addEventListener('analytics-consent-changed', () => {
            this.init();
        });

        this.init();
    }

    init() {
        if (this.isEnabled()) {
            this.startSession();
            this.trackPageView();
        }
    }

    isEnabled() {
        return localStorage.getItem(this.consentKey) === 'true';
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    startSession() {
        if (!sessionStorage.getItem(this.sessionKey)) {
            sessionStorage.setItem(this.sessionKey, this.generateSessionId());
        }
    }

    getSessionId() {
        return sessionStorage.getItem(this.sessionKey) || 'no-session';
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (error) {
            console.error('Analytics: Fehler beim Laden der Daten', error);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            pageViews: [],
            downloads: [],
            sessions: [],
            stats: {
                totalPageViews: 0,
                totalDownloads: 0,
                totalSessions: 0,
                uniqueVisitors: new Set()
            }
        };
    }

    saveData(data) {
        try {
            // Stats-Objekt für Speicherung vorbereiten (Set zu Array)
            const dataToSave = {
                ...data,
                stats: {
                    ...data.stats,
                    uniqueVisitors: Array.from(data.stats.uniqueVisitors)
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Analytics: Fehler beim Speichern der Daten', error);
        }
    }

    trackPageView(page = window.location.pathname) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const sessionId = this.getSessionId();

        const event = {
            type: 'pageview',
            page,
            timestamp: new Date().toISOString(),
            sessionId,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        };

        data.pageViews.push(event);
        data.stats.totalPageViews++;

        // Session tracking
        if (!data.sessions.includes(sessionId)) {
            data.sessions.push(sessionId);
            data.stats.totalSessions++;
        }

        // Alte Einträge löschen (nur letzte 1000 behalten)
        if (data.pageViews.length > 1000) {
            data.pageViews = data.pageViews.slice(-1000);
        }

        this.saveData(data);
    }

    trackDownload(fileName, fileSize, category = 'public') {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const sessionId = this.getSessionId();

        const event = {
            type: 'download',
            fileName,
            fileSize,
            category,
            timestamp: new Date().toISOString(),
            sessionId,
            userAgent: navigator.userAgent
        };

        data.downloads.push(event);
        data.stats.totalDownloads++;

        // Alte Einträge löschen (nur letzte 500 behalten)
        if (data.downloads.length > 500) {
            data.downloads = data.downloads.slice(-500);
        }

        this.saveData(data);
    }

    trackEvent(eventName, eventData = {}) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const sessionId = this.getSessionId();

        const event = {
            type: 'custom',
            name: eventName,
            data: eventData,
            timestamp: new Date().toISOString(),
            sessionId
        };

        if (!data.customEvents) {
            data.customEvents = [];
        }

        data.customEvents.push(event);

        // Alte Einträge löschen
        if (data.customEvents.length > 500) {
            data.customEvents = data.customEvents.slice(-500);
        }

        this.saveData(data);
    }

    getStats() {
        if (!this.isEnabled()) {
            return { error: 'Analytics nicht aktiviert' };
        }

        const data = this.getData();

        // Download-Statistiken
        const downloadsByFile = {};
        data.downloads.forEach(d => {
            downloadsByFile[d.fileName] = (downloadsByFile[d.fileName] || 0) + 1;
        });

        // Most popular downloads
        const popularDownloads = Object.entries(downloadsByFile)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Downloads nach Kategorie
        const downloadsByCategory = {
            public: data.downloads.filter(d => d.category === 'public').length,
            vip: data.downloads.filter(d => d.category === 'vip').length
        };

        // Letzte 7 Tage
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentPageViews = data.pageViews.filter(
            pv => new Date(pv.timestamp) > sevenDaysAgo
        ).length;

        const recentDownloads = data.downloads.filter(
            d => new Date(d.timestamp) > sevenDaysAgo
        ).length;

        return {
            total: {
                pageViews: data.stats.totalPageViews,
                downloads: data.stats.totalDownloads,
                sessions: data.stats.totalSessions
            },
            last7Days: {
                pageViews: recentPageViews,
                downloads: recentDownloads
            },
            downloads: {
                byCategory: downloadsByCategory,
                popular: popularDownloads
            },
            rawData: data
        };
    }

    exportData() {
        const data = this.getData();
        const stats = this.getStats();

        const exportObject = {
            exportDate: new Date().toISOString(),
            summary: stats,
            fullData: data
        };

        // Als JSON-Datei downloaden
        const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `airdox-analytics-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('📊 Analytics: Daten exportiert');
    }

    clearData() {
        if (confirm('Möchtest du wirklich alle Analytics-Daten löschen?')) {
            localStorage.removeItem(this.storageKey);
            console.log('📊 Analytics: Alle Daten gelöscht');
            return true;
        }
        return false;
    }
}

// Globale Instanz erstellen
const analytics = new Analytics();

// Für Entwickler-Zugriff
if (typeof window !== 'undefined') {
    window.airdoxAnalytics = analytics;
}

export default analytics;
