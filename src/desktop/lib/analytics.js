export const normalizeEventLog = (event = {}) => ({
  eventType: String(event.event_type || '').toLowerCase(),
  deviceType: String(event.device_type || '').toLowerCase(),
  country: String(event.country || '').toUpperCase(),
  itemId: String(event.item_id || ''),
  createdAt: event.created_at ? new Date(event.created_at) : null,
});

export const isEventInDateRange = (date, startDate, endDate) => {
  if (!date || Number.isNaN(date.getTime())) return false;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
  return date >= start && date <= end;
};

export const filterEventLogs = (events = [], { startDate, endDate, filters } = {}) => events
  .map(normalizeEventLog)
  .filter((event) => {
    if (!isEventInDateRange(event.createdAt, startDate, endDate)) return false;
    if (filters?.eventType && filters.eventType !== 'all' && event.eventType !== filters.eventType) return false;
    if (filters?.deviceType && filters.deviceType !== 'all' && event.deviceType !== filters.deviceType) return false;
    if (filters?.country && filters.country !== 'all' && event.country !== filters.country) return false;
    return true;
  });

export const buildAnalyticsStatsFromEvents = (events = []) => {
  if (!events.length) {
    return {
      totalViews: 0,
      totalPlays: 0,
      totalLikes: 0,
      totalDislikes: 0,
      eventsByType: {},
      topSets: [],
      topCountries: [],
      deviceTypeBreakdown: {},
      hourlyDistribution: new Array(24).fill(0),
      conversionRate: 0,
    };
  }

  const eventsByType = {};
  const topSetMap = {};
  const countryMap = {};
  const deviceTypeBreakdown = {};
  const hourlyDistribution = new Array(24).fill(0);

  for (const event of events) {
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

    if (event.itemId) {
      if (!topSetMap[event.itemId]) {
        topSetMap[event.itemId] = { id: event.itemId, plays: 0, likes: 0, dislikes: 0 };
      }
      if (event.eventType === 'play') topSetMap[event.itemId].plays += 1;
      if (event.eventType === 'like') topSetMap[event.itemId].likes += 1;
      if (event.eventType === 'dislike') topSetMap[event.itemId].dislikes += 1;
    }

    if (event.country) countryMap[event.country] = (countryMap[event.country] || 0) + 1;
    if (event.deviceType) deviceTypeBreakdown[event.deviceType] = (deviceTypeBreakdown[event.deviceType] || 0) + 1;

    if (event.createdAt && !Number.isNaN(event.createdAt.getTime())) {
      hourlyDistribution[event.createdAt.getHours()] += 1;
    }
  }

  const totalViews = events.length;
  const totalPlays = eventsByType.play || 0;
  const totalLikes = eventsByType.like || 0;
  const totalDislikes = eventsByType.dislike || 0;

  return {
    totalViews,
    totalPlays,
    totalLikes,
    totalDislikes,
    eventsByType,
    topSets: Object.values(topSetMap).sort((a, b) => b.plays - a.plays).slice(0, 10),
    topCountries: Object.entries(countryMap).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    deviceTypeBreakdown,
    hourlyDistribution,
    conversionRate: totalViews > 0 ? totalPlays / totalViews : 0,
  };
};

