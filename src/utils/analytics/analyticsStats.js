export const calculateDistribution = (items, path) => {
    const distribution = {};
    items.forEach((item) => {
        const value = path.split('.').reduce((obj, key) => obj?.[key], item) || 'Unknown';
        distribution[value] = (distribution[value] || 0) + 1;
    });
    return Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
};

export const generateTimeline = (pageViews, downloads, audioEvents, timeRange) => {
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

        const dayDownloads = downloads.filter((download) => {
            const downloadDate = new Date(download.timestamp);
            return downloadDate >= date && downloadDate < nextDate;
        }).length;

        const dayPlays = audioEvents.filter((event) => {
            const eventDate = new Date(event.timestamp);
            return event.action === 'play' && eventDate >= date && eventDate < nextDate;
        }).length;

        timeline.push({
            date: date.toISOString().split('T')[0],
            pageViews: dayViews,
            downloads: dayDownloads,
            audioPlays: dayPlays,
        });
    }

    return timeline;
};

export const generateHeatmap = (pageViews) => {
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

    pageViews.forEach((pageView) => {
        const date = new Date(pageView.timestamp);
        const day = date.getDay();
        const hour = date.getHours();
        heatmap[day][hour]++;
    });

    return heatmap;
};
