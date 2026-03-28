const isDev = import.meta.env?.DEV;
const devError = (...args) => {
    if (isDev) console.error(...args);
};

class Analytics {
    constructor() {
        this.storageKey = 'airdox-analytics-data';
        this.consentKey = 'airdox-analytics-enabled';
        this.sessionKey = 'airdox-session-id';
        this.sessionStartKey = 'airdox-session-start';
        this.initialized = false;
        this.initialPageViewSent = false;

        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    init() {
        if (!this.isEnabled()) return;

        this.ensureListeners();
        this.startSession();
        if (!this.initialPageViewSent) {
            this.trackPageView();
            this.initialPageViewSent = true;
        }
    }

    ensureListeners() {
        if (this.initialized) return;
        this.initialized = true;

        window.addEventListener('beforeunload', this.handleBeforeUnload);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    handleBeforeUnload() {
        this.endSession();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.trackEvent('tab_hidden');
        } else {
            this.trackEvent('tab_visible');
        }
    }

    isEnabled() {
        return localStorage.getItem(this.consentKey) === 'true';
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    startSession() {
        if (!sessionStorage.getItem(this.sessionKey)) {
            const sessionId = this.generateSessionId();
            const startTime = new Date().toISOString();

            sessionStorage.setItem(this.sessionKey, sessionId);
            sessionStorage.setItem(this.sessionStartKey, startTime);

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
                referrer: document.referrer || 'Direct/Unknown',
                maxScrollDepth: 0,
                device: this.getDeviceInfo(),
                exitPage: null
            });

            this.saveData(data);
        }
    }

    endSession() {
        if (!this.isEnabled()) return;

        const sessionId = this.getSessionId();
        const data = this.getData();
        const session = data.sessions?.find((s) => s.sessionId === sessionId && !s.endTime);

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
        const session = data.sessions?.find((s) => s.sessionId === sessionId && !s.endTime);

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
            devError('Analytics: Fehler beim Laden', error);
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
            customEvents: [],
            socialClicks: []
        };
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            devError('Analytics: Fehler beim Speichern', error);
        }
    }

    sendToGA(eventName, params = {}) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
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

        if (data.pageViews.length > 2000) {
            data.pageViews = data.pageViews.slice(-2000);
        }

        this.saveData(data);

        this.sendToGA('page_view', { page_path: page });
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

        this.sendToGA('file_download', { 
            file_name: fileName, 
            file_size: fileSize,
            event_category: category 
        });
    }

    trackAudioEvent(trackName, action, playDuration = 0, trackDuration = 0) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'audio',
            trackName,
            action,
            playDuration,
            trackDuration,
            completionRate: trackDuration > 0 ? playDuration / trackDuration : 0,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        data.audioEvents.push(event);

        if (action === 'play') {
            this.updateSessionMetric('audioPlays');
        }

        if (data.audioEvents.length > 1000) {
            data.audioEvents = data.audioEvents.slice(-1000);
        }

        this.saveData(data);

        this.sendToGA(`audio_${action}`, { 
            track_name: trackName, 
            play_duration: playDuration,
            event_category: 'Audio'
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

        data.interactions.push(event);
        this.updateSessionMetric('interactions');

        if (data.interactions.length > 1000) {
            data.interactions = data.interactions.slice(-1000);
        }

        this.saveData(data);

        this.sendToGA('interaction', { 
            event_category: section, 
            event_label: element,
            event_action: action
        });
    }

    trackScrollDepth(percentage) {
        if (!this.isEnabled()) return;
        const data = this.getData();
        const sessionId = this.getSessionId();
        const session = data.sessions?.find((s) => s.sessionId === sessionId && !s.endTime);

        if (session && percentage > (session.maxScrollDepth || 0)) {
            session.maxScrollDepth = percentage;
            this.saveData(data);
            this.sendToGA('scroll', { percent_scrolled: percentage });
        }
    }

    trackOutboundLink(platform, url) {
        if (!this.isEnabled()) return;

        const data = this.getData();
        const event = {
            type: 'outbound',
            platform,
            url,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        if (!data.socialClicks) data.socialClicks = [];
        data.socialClicks.push(event);

        if (data.socialClicks.length > 500) {
            data.socialClicks = data.socialClicks.slice(-500);
        }
        this.saveData(data);

        this.sendToGA('outbound_click', {
            link_url: url,
            event_category: 'Outbound',
            event_label: platform
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

        data.customEvents.push(event);

        if (data.customEvents.length > 500) {
            data.customEvents = data.customEvents.slice(-500);
        }

        this.saveData(data);

        this.sendToGA(eventName, eventData);
    }

    getStats(timeRange = 'all') {
        if (!this.isEnabled()) {
            return { error: 'Analytics nicht aktiviert' };
        }

        const data = this.getData();
        const now = new Date();

        let startDate = new Date(0);
        if (timeRange === '7days') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '30days') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeRange === '90days') {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }

        const filterByTime = (arr) => arr.filter((item) => new Date(item.timestamp) >= startDate);

        const pageViews = filterByTime(data.pageViews || []);
        const downloads = filterByTime(data.downloads || []);
        const sessions = (data.sessions || []).filter((s) => new Date(s.startTime) >= startDate);
        const audioEvents = filterByTime(data.audioEvents || []);
        const interactions = filterByTime(data.interactions || []);
        const socialClicks = filterByTime(data.socialClicks || []);

        const total = {
            pageViews: pageViews.length,
            downloads: downloads.length,
            sessions: sessions.length,
            audioPlays: audioEvents.filter((e) => e.action === 'play').length,
            interactions: interactions.length,
            socialClicks: socialClicks.length
        };

        const completedSessions = sessions.filter((s) => s.endTime);
        const avgSessionDuration = completedSessions.length > 0
            ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length
            : 0;

        const bounceRate = sessions.length > 0
            ? (sessions.filter((s) => s.pageViews <= 1 && (s.maxScrollDepth || 0) < 25).length / sessions.length) * 100
            : 0;

        const avgScrollDepth = sessions.length > 0
            ? sessions.reduce((sum, s) => sum + (s.maxScrollDepth || 0), 0) / sessions.length
            : 0;

        const referrers = this.calculateDistribution(sessions, 'referrer');
        const topSocialClicks = this.calculateDistribution(socialClicks, 'platform');

        const downloadsByFile = {};
        downloads.forEach((d) => {
            downloadsByFile[d.fileName] = (downloadsByFile[d.fileName] || 0) + 1;
        });

        const topDownloads = Object.entries(downloadsByFile)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const downloadsByCategory = {
            public: downloads.filter((d) => d.category === 'public').length,
            vip: downloads.filter((d) => d.category === 'vip').length
        };

        const audioByTrack = {};
        audioEvents.filter((e) => e.action === 'play').forEach((e) => {
            audioByTrack[e.trackName] = (audioByTrack[e.trackName] || 0) + 1;
        });

        const topTracks = Object.entries(audioByTrack)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const avgPlayDuration = audioEvents.length > 0
            ? audioEvents.reduce((sum, e) => sum + e.playDuration, 0) / audioEvents.length
            : 0;

        const skipRate = audioEvents.length > 0
            ? (audioEvents.filter((e) => e.action === 'skip').length / audioEvents.length) * 100
            : 0;

        const deviceDistribution = this.calculateDistribution(sessions, 'device.type');
        const browserDistribution = this.calculateDistribution(sessions, 'device.browser');
        const osDistribution = this.calculateDistribution(sessions, 'device.os');

        const timeline = this.generateTimeline(pageViews, downloads, audioEvents, timeRange);
        const heatmap = this.generateHeatmap(pageViews);

        return {
            timeRange,
            total,
            averages: {
                sessionDuration: Math.round(avgSessionDuration),
                playDuration: Math.round(avgPlayDuration),
                scrollDepth: Math.round(avgScrollDepth)
            },
            rates: {
                bounce: Math.round(bounceRate * 10) / 10,
                skip: Math.round(skipRate * 10) / 10
            },
            traffic: {
                referrers,
                socialClicks: topSocialClicks
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
        items.forEach((item) => {
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

            const dayViews = pageViews.filter((pv) => {
                const pvDate = new Date(pv.timestamp);
                return pvDate >= date && pvDate < nextDate;
            }).length;

            const dayDownloads = downloads.filter((d) => {
                const dDate = new Date(d.timestamp);
                return dDate >= date && dDate < nextDate;
            }).length;

            const dayPlays = audioEvents.filter((e) => {
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
        const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

        pageViews.forEach((pv) => {
            const date = new Date(pv.timestamp);
            const day = date.getDay();
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
            traffic: stats.traffic,
            topLists: {
                downloads: stats.downloads?.top,
                tracks: stats.audio?.top
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

        const data = stats.rawData || {};

        (data.pageViews || []).forEach((pv) => {
            csv += `${pv.timestamp},pageview,${pv.page},-,${pv.sessionId},${pv.device?.type},${pv.device?.browser}\n`;
        });

        (data.downloads || []).forEach((d) => {
            csv += `${d.timestamp},download,${d.fileName},${d.category},${d.sessionId},${d.device?.type},${d.device?.browser}\n`;
        });

        (data.audioEvents || []).forEach((e) => {
            csv += `${e.timestamp},audio_${e.action},${e.trackName},-,${e.sessionId},-,-\n`;
        });

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
    }

    clearData() {
        if (confirm('Möchtest du wirklich alle Analytics-Daten löschen?')) {
            localStorage.removeItem(this.storageKey);
            sessionStorage.removeItem(this.sessionKey);
            sessionStorage.removeItem(this.sessionStartKey);
            return true;
        }
        return false;
    }
}

const analytics = new Analytics();

if (typeof window !== 'undefined') {
    window.airdoxAnalytics = analytics;
    window.airdoxAnalyticsV2 = analytics;
}

export default analytics;
