export const buildAnalyticsExportObject = (stats) => ({
    exportDate: new Date().toISOString(),
    timeRange: stats.timeRange,
    summary: {
        total: stats.total,
        averages: stats.averages,
        rates: stats.rates,
    },
    traffic: stats.traffic,
    topLists: {
        downloads: stats.downloads?.top,
        tracks: stats.audio?.top,
    },
    devices: stats.devices,
    timeline: stats.timeline,
    fullData: stats.rawData,
});

export const buildAnalyticsCsv = (stats) => {
    let csv = 'Timestamp,Event Type,Value,Category,Session ID,Device,Browser\n';
    const data = stats.rawData || {};

    (data.pageViews || []).forEach((pageView) => {
        csv += `${pageView.timestamp},pageview,${pageView.page},-,${pageView.sessionId},${pageView.device?.type},${pageView.device?.browser}\n`;
    });

    (data.downloads || []).forEach((download) => {
        csv += `${download.timestamp},download,${download.fileName},${download.category},${download.sessionId},${download.device?.type},${download.device?.browser}\n`;
    });

    (data.audioEvents || []).forEach((event) => {
        csv += `${event.timestamp},audio_${event.action},${event.trackName},-,${event.sessionId},-,-\n`;
    });

    return csv;
};
