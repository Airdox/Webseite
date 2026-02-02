/**
 * AIRDOX Analytics V2 - Advanced Analytics System
 * Erweiterte Metriken, User Behavior Tracking, Charts
 * + Google Analytics 4 Integration
 */

// ⚠️ DEINE GAM-ID HIER EINTRAGEN:
const GA_MEASUREMENT_ID = 'G-QX0D1TSKW5';

class AnalyticsV2 {
    constructor() {
        this.storageKey = 'airdox-analytics-data';
        this.consentKey = 'airdox-analytics-enabled';
        this.sessionKey = 'airdox-session-id';
        this.sessionStartKey = 'airdox-session-start';

        // Event Listener
        window.addEventListener('analytics-consent-changed', () => this.init());

        // Track session end
        window.addEventListener('beforeunload', () => this.endSession());

        // Track visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('tab_hidden');
            } else {
                this.trackEvent('tab_visible');
            }
        });

        this.init();
    }

    init() {
        if (this.isEnabled()) {
            this.startSession();
            this.initGA(); // Google Analytics laden
            this.trackPageView();
        }
    }

    isEnabled() {
        return localStorage.getItem(this.consentKey) === 'true';
    }

    // --- Google Analytics 4 Integration ---

    initGA() {
        // Verhindern, dass Skript mehrfach geladen wird
        if (window.gtag) return;

        // 1. Skript Tag erstellen
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        // 2. Initialisierung
        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());

        gtag('config', GA_MEASUREMENT_ID, {
            'anonymize_ip': true, // DSGVO-freundlich
            'send_page_view': false // Wir tracken PageViews manuell
        });

        console.log('📊 GA4 Initialisiert:', GA_MEASUREMENT_ID);
    }

    sendGAEvent(eventName, params = {}) {
        if (typeof window.gtag === 'function' && this.isEnabled()) {
            window.gtag('event', eventName, params);
        }
    }

    // --- Core Analytics ---

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    startSession() {
        if (!sessionStorage.getItem(this.sessionKey)) {
            const sessionId = this.generateSessionId();
            const startTime = new Date().toISOString();

            sessionStorage.setItem(this.sessionKey, sessionId);
            sessionStorage.setItem(this.sessionStartKey, startTime);

            // Track session start in data
            const data = this.getData();
            if (!data.sessions) data.sessions = [];

            data.sessions.push({
                sessionId,
                startTime,
                endTime: null,
                duration: null,
                pageViews: 0,
                downloads: 0,
                audioPlays: 0,
                interactions: 0,
                device: this.getDeviceInfo(),
                exitPage: null
            });

            this.saveData(data);

            // GA Session Start (wird autom. von GA erkannt, aber wir können custom trigger setzen)
            this.sendGAEvent('session_start_custom', { session_id: sessionId });
        }
    }

    endSession() {
        if (!this.isEnabled()) return;

        const sessionId = this.getSessionId();
        const data = this.getData();

        const session = data.sessions?.find(s => s.sessionId === sessionId && !s.endTime);
        if (session) {
            session.endTime = new Date().toISOString();
            session.duration = Math.floor((new Date(session.endTime) - new Date(session.startTime)) / 1000);
            session.exitPage = window.location.pathname;
            this.saveData(data);
        }
    }

    updateSessionMetric(metric, increment = 1) {
        const data = this.getData();
        const sessionId = this.getSessionId();

        const session = data.sessions?.find(s => s.sessionId === sessionId && !s.endTime);
        if (session) {
            session[metric] = (session[metric] || 0) + increment;
            this.saveData(data);
        }
    }

    getSessionId() {
        return sessionStorage.getItem(this.sessionKey) || 'no-session';
    }

    getDeviceInfo() {
        const ua = navigator.userAgent;
        const width = window.screen.width;

        let deviceType = 'desktop';
        if (width < 768) deviceType = 'mobile';
        else if (width < 1024) deviceType = 'tablet';

        let browser = 'Unknown';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';

        let os = 'Unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS')) os = 'iOS';

        return {
            type: deviceType,
            browser,
            os,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language
        };
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.getDefaultData();
        } catch (error) {
            console.error('Analytics V2: Fehler beim Laden', error);
            return this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            pageViews: [],
            downloads: [],
            sessions: [],
            audioEvents: [],
            interactions: [],
            customEvents: []
        };
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Analytics V2: Fehler beim Speichern', error);
        }
    }

    trackPageView(page = window.location.pathname) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'pageview',
            page,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            device: this.getDeviceInfo()
        };

        data.pageViews.push(event);
        this.updateSessionMetric('pageViews');

        // Retention policy
        if (data.pageViews.length > 2000) {
            data.pageViews = data.pageViews.slice(-2000);
        }

        this.saveData(data);

        // -> GA4
        this.sendGAEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: page
        });
    }

    trackDownload(fileName, fileSize, category = 'public') {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'download',
            fileName,
            fileSize,
            category,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            device: this.getDeviceInfo()
        };

        data.downloads.push(event);
        this.updateSessionMetric('downloads');

        if (data.downloads.length > 1000) {
            data.downloads = data.downloads.slice(-1000);
        }

        this.saveData(data);

        // -> GA4
        this.sendGAEvent('file_download', {
            file_name: fileName,
            file_extension: fileName.split('.').pop(),
            link_id: category
        });
    }

    trackAudioEvent(trackName, action, playDuration = 0, trackDuration = 0) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'audio',
            trackName,
            action, // 'play', 'pause', 'skip', 'complete'
            playDuration,
            trackDuration,
            completionRate: trackDuration > 0 ? playDuration / trackDuration : 0,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        if (!data.audioEvents) data.audioEvents = [];
        data.audioEvents.push(event);

        if (action === 'play') {
            this.updateSessionMetric('audioPlays');
        }

        if (data.audioEvents.length > 1000) {
            data.audioEvents = data.audioEvents.slice(-1000);
        }

        this.saveData(data);

        // -> GA4 (Custom Event)
        this.sendGAEvent('audio_' + action, {
            track_name: trackName,
            play_duration: playDuration,
            completion_rate: parseFloat(event.completionRate.toFixed(2))
        });
    }

    trackInteraction(element, section, action = 'click') {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'interaction',
            element,
            section,
            action,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        if (!data.interactions) data.interactions = [];
        data.interactions.push(event);
        this.updateSessionMetric('interactions');

        if (data.interactions.length > 1000) {
            data.interactions = data.interactions.slice(-1000);
        }

        this.saveData(data);

        // -> GA4
        this.sendGAEvent('engagement', {
            event_category: section,
            event_label: element,
            event_action: action
        });
    }

    trackEvent(eventName, eventData = {}) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'custom',
            name: eventName,
            data: eventData,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        if (!data.customEvents) data.customEvents = [];
        data.customEvents.push(event);

        if (data.customEvents.length > 500) {
            data.customEvents = data.customEvents.slice(-500);
        }

        this.saveData(data);

        // -> GA4
        this.sendGAEvent(eventName, eventData);
    }

    getStats(timeRange = 'all') {
        if (!this.isEnabled()) {
            return { error: 'Analytics nicht aktiviert' };
        }

        const data = this.getData();
        const now = new Date();

        // Time range filters
        let startDate = new Date(0);
        if (timeRange === '7days') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '30days') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '90days') {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }

        const filterByTime = (arr) => arr.filter(item => new Date(item.timestamp) >= startDate);

        const pageViews = filterByTime(data.pageViews || []);
        const downloads = filterByTime(data.downloads || []);
        const sessions = (data.sessions || []).filter(s => new Date(s.startTime) >= startDate);
        const audioEvents = filterByTime(data.audioEvents || []);
        const interactions = filterByTime(data.interactions || []);

        // Basic totals
        const total = {
            pageViews: pageViews.length,
            downloads: downloads.length,
            sessions: sessions.length,
            audioPlays: audioEvents.filter(e => e.action === 'play').length,
            interactions: interactions.length
        };

        // Session analytics
        const completedSessions = sessions.filter(s => s.endTime);
        const avgSessionDuration = completedSessions.length > 0
            ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
            : 0;

        const bounceRate = sessions.length > 0
            ? (sessions.filter(s => s.pageViews <= 1).length / sessions.length) * 100
            : 0;

        // Download analytics
        const downloadsByFile = {};
        downloads.forEach(d => {
            downloadsByFile[d.fileName] = (downloadsByFile[d.fileName] || 0) + 1;
        });

        const topDownloads = Object.entries(downloadsByFile)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const downloadsByCategory = {
            public: downloads.filter(d => d.category === 'public').length,
            vip: downloads.filter(d => d.category === 'vip').length
        };

        // Audio analytics
        const audioByTrack = {};
        audioEvents.filter(e => e.action === 'play').forEach(e => {
            audioByTrack[e.trackName] = (audioByTrack[e.trackName] || 0) + 1;
        });

        const topTracks = Object.entries(audioByTrack)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const avgPlayDuration = audioEvents.length > 0
            ? audioEvents.reduce((sum, e) => sum + e.playDuration, 0) / audioEvents.length
            : 0;

        const skipRate = audioEvents.length > 0
            ? (audioEvents.filter(e => e.action === 'skip').length / audioEvents.length) * 100
            : 0;

        // Device analytics
        const deviceDistribution = this.calculateDistribution(sessions, 'device.type');
        const browserDistribution = this.calculateDistribution(sessions, 'device.browser');
        const osDistribution = this.calculateDistribution(sessions, 'device.os');

        // Timeline data for charts (daily aggregation)
        const timeline = this.generateTimeline(pageViews, downloads, audioEvents, timeRange);

        // Peak hours heatmap
        const heatmap = this.generateHeatmap(pageViews);

        return {
            timeRange,
            total,
            averages: {
                sessionDuration: Math.round(avgSessionDuration),
                playDuration: Math.round(avgPlayDuration)
            },
            rates: {
                bounce: Math.round(bounceRate * 10) / 10,
                skip: Math.round(skipRate * 10) / 10
            },
            downloads: {
                byCategory: downloadsByCategory,
                top: topDownloads
            },
            audio: {
                top: topTracks,
                totalPlays: total.audioPlays
            },
            devices: {
                types: deviceDistribution,
                browsers: browserDistribution,
                os: osDistribution
            },
            timeline,
            heatmap,
            rawData: data
        };
    }

    calculateDistribution(items, path) {
        const distribution = {};
        items.forEach(item => {
            const value = path.split('.').reduce((obj, key) => obj?.[key], item) || 'Unknown';
            distribution[value] = (distribution[value] || 0) + 1;
        });
        return Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }

    generateTimeline(pageViews, downloads, audioEvents, timeRange) {
        const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 30;
        const now = new Date();
        const timeline = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayViews = pageViews.filter(pv => {
                const pvDate = new Date(pv.timestamp);
                return pvDate >= date && pvDate < nextDate;
            }).length;

            const dayDownloads = downloads.filter(d => {
                const dDate = new Date(d.timestamp);
                return dDate >= date && dDate < nextDate;
            }).length;

            const dayPlays = audioEvents.filter(e => {
                const eDate = new Date(e.timestamp);
                return e.action === 'play' && eDate >= date && eDate < nextDate;
            }).length;

            timeline.push({
                date: date.toISOString().split('T')[0],
                pageViews: dayViews,
                downloads: dayDownloads,
                audioPlays: dayPlays
            });
        }

        return timeline;
    }

    generateHeatmap(pageViews) {
        const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));

        pageViews.forEach(pv => {
            const date = new Date(pv.timestamp);
            const day = date.getDay(); // 0 = Sunday, 6 = Saturday
            const hour = date.getHours();
            heatmap[day][hour]++;
        });

        return heatmap;
    }

    exportData(format = 'json', timeRange = 'all') {
        const stats = this.getStats(timeRange);

        if (format === 'json') {
            this.exportJSON(stats);
        } else if (format === 'csv') {
            this.exportCSV(stats);
        }
    }

    exportJSON(stats) {
        const exportObject = {
            exportDate: new Date().toISOString(),
            timeRange: stats.timeRange,
            summary: {
                total: stats.total,
                averages: stats.averages,
                rates: stats.rates
            },
            topLists: {
                downloads: stats.downloads.top,
                tracks: stats.audio.top
            },
            devices: stats.devices,
            timeline: stats.timeline,
            fullData: stats.rawData
        };

        const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
            type: 'application/json'
        });
        this.downloadBlob(blob, `airdox-analytics-${Date.now()}.json`);
    }

    exportCSV(stats) {
        let csv = 'Timestamp,Event Type,Value,Category,Session ID,Device,Browser\n';

        const data = stats.rawData;

        // Page Views
        (data.pageViews || []).forEach(pv => {
            csv += `${pv.timestamp},pageview,${pv.page},-,${pv.sessionId},${pv.device?.type},${pv.device?.browser}\n`;
        });

        // Downloads
        (data.downloads || []).forEach(d => {
            csv += `${d.timestamp},download,${d.fileName},${d.category},${d.sessionId},${d.device?.type},${d.device?.browser}\n`;
        });

        // Audio Events
        (data.audioEvents || []).forEach(e => {
            csv += `${e.timestamp},audio_${e.action},${e.trackName},-,${e.sessionId},-,-\n`;
        });

        // UTF-8 BOM for Excel compatibility
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, `airdox-analytics-${Date.now()}.csv`);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`📊 Analytics V2: ${filename} exportiert`);
    }

    clearData() {
        if (confirm('Möchtest du wirklich alle Analytics-Daten löschen?')) {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.sessionKey);
            sessionStorage.removeItem(this.sessionStartKey);
            console.log('📊 Analytics V2: Alle Daten gelöscht');
            return true;
        }
        return false;
    }
}

// Global instance
const analyticsV2 = new AnalyticsV2();

// Developer access
if (typeof window !== 'undefined') {
    window.airdoxAnalytics = analyticsV2;
    window.airdoxAnalyticsV2 = analyticsV2;
}

export default analyticsV2;
