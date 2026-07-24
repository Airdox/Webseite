import os from 'node:os';
import { statfsSync } from 'node:fs';
import path from 'node:path';

/**
 * Analytics Service
 * Sammelt und berechnete Analytics-Metriken aus der Datenbank
 */

export async function getAnalyticsData(db, workspaceRoot) {
  try {
    const [eventLogs, stats, geoData] = await Promise.all([
      db.query(`
        SELECT event_type, COUNT(*) as count FROM analytics_logs
        GROUP BY event_type
      `),
      db.query(`
        SELECT 
          id, plays, likes, dislikes, last_played_at
        FROM track_stats
        ORDER BY plays DESC
        LIMIT 10
      `),
      db.query(`
        SELECT country, COUNT(*) as count FROM analytics_logs
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `),
    ]);

    const eventsByType = {};
    eventLogs.rows?.forEach((row) => {
      eventsByType[row.event_type] = Number(row.count) || 0;
    });

    const topSets = stats.rows?.map((row) => ({
      id: row.id,
      plays: Number(row.plays) || 0,
      likes: Number(row.likes) || 0,
      dislikes: Number(row.dislikes) || 0,
      lastPlayedAt: row.last_played_at,
    })) || [];

    const topCountries = geoData.rows?.map((row) => ({
      code: row.country,
      count: Number(row.count) || 0,
    })) || [];

    const totalViews = Object.values(eventsByType).reduce((sum, count) => sum + count, 0);
    const totalPlays = topSets.reduce((sum, set) => sum + (set.plays || 0), 0);
    const totalLikes = topSets.reduce((sum, set) => sum + (set.likes || 0), 0);
    const totalDislikes = topSets.reduce((sum, set) => sum + (set.dislikes || 0), 0);

    const conversionRate = totalViews > 0 ? totalPlays / totalViews : 0;

    // Device type breakdown
    const deviceData = await db.query(`
      SELECT device_type, COUNT(*) as count FROM analytics_logs
      WHERE device_type IS NOT NULL
      GROUP BY device_type
    `);

    const deviceTypeBreakdown = {};
    deviceData.rows?.forEach((row) => {
      deviceTypeBreakdown[row.device_type] = Number(row.count) || 0;
    });

    // Hourly distribution
    const hourlyData = await db.query(`
      SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
      FROM analytics_logs
      GROUP BY hour
      ORDER BY hour
    `);

    const hourlyDistribution = new Array(24).fill(0);
    hourlyData.rows?.forEach((row) => {
      const hour = parseInt(row.hour, 10);
      if (hour >= 0 && hour < 24) {
        hourlyDistribution[hour] = Number(row.count) || 0;
      }
    });

    return {
      totalViews,
      totalPlays,
      totalLikes,
      totalDislikes,
      eventsByType,
      topSets,
      topCountries,
      deviceTypeBreakdown,
      hourlyDistribution,
      conversionRate,
    };
  } catch (error) {
    console.error('Analytics data fetch failed:', error);
    return {
      totalViews: 0,
      totalPlays: 0,
      totalLikes: 0,
      totalDislikes: 0,
      eventsByType: {},
      topSets: [],
      topCountries: [],
      deviceTypeBreakdown: {},
      hourlyDistribution: [],
      conversionRate: 0,
    };
  }
}

/**
 * System Monitor Service
 * Überwacht Systemressourcen und Prozesse
 */

export function getSystemStats() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const cpus = os.cpus();
    const cpuUsage = calculateCpuUsage();

    const diskInfo = getDiskInfo();

    return {
      memory: {
        total: totalMemory,
        used: usedMemory,
        available: freeMemory,
        percentUsed: (usedMemory / totalMemory) * 100,
      },
      cpu: {
        percentUsed: cpuUsage,
        cores: cpus.length,
        clockSpeed: (cpus[0]?.speed / 1000).toFixed(2),
      },
      disk: {
        ...diskInfo,
      },
      processes: getProcessInfo(),
      lastUpdate: new Date().toISOString(),
      warnings: generateSystemWarnings(usedMemory, totalMemory, cpuUsage),
    };
  } catch (error) {
    console.error('System stats fetch failed:', error);
    return {
      memory: { total: 0, used: 0, available: 0, percentUsed: 0 },
      cpu: { percentUsed: 0, cores: 0, clockSpeed: '0.00' },
      disk: { total: 0, free: 0, percentUsed: 0 },
      processes: [],
      lastUpdate: new Date().toISOString(),
      warnings: [],
    };
  }
}

function calculateCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    Object.keys(cpu.times).forEach((type) => {
      totalTick += cpu.times[type];
    });
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~((idle / total) * 100);

  return Math.max(0, Math.min(100, usage));
}

function getDiskInfo() {
  try {
    const stats = statfsSync(process.cwd(), { bigint: true });
    const total = Number(stats.blocks * stats.bsize);
    const free = Number(stats.bavail * stats.bsize);
    return {
      total,
      free,
      percentUsed: total > 0 ? ((total - free) / total) * 100 : 0,
    };
  } catch {
    return { total: 0, free: 0, percentUsed: 0 };
  }
}

function getProcessInfo() {
  try {
    const memory = process.memoryUsage();
    return [{
      pid: process.pid,
      name: path.basename(process.execPath),
      type: process.versions.electron ? 'main' : 'app',
      memory: memory.rss,
      heapUsed: memory.heapUsed,
      uptimeSeconds: process.uptime(),
      status: 'running',
    }];
  } catch {
    return [];
  }
}

function generateSystemWarnings(usedMemory, totalMemory, cpuUsage) {
  const warnings = [];
  const memoryPercent = (usedMemory / totalMemory) * 100;

  if (memoryPercent > 85) {
    warnings.push({
      title: 'Hohe Speicherauslastung',
      message: `${memoryPercent.toFixed(1)}% des RAM wird verwendet. Cache-Leerung empfohlen.`,
    });
  }

  if (cpuUsage > 80) {
    warnings.push({
      title: 'Hohe CPU-Auslastung',
      message: `${cpuUsage.toFixed(1)}% CPU-Auslastung erkannt.`,
    });
  }

  return warnings;
}

/**
 * Cache Management
 */

export async function clearCache({ clearHttpCache } = {}) {
  if (typeof clearHttpCache !== 'function') {
    return {
      cleared: false,
      message: 'Kein aktiver Electron-Cache verfügbar',
      operations: [],
    };
  }

  await clearHttpCache();
  return {
    cleared: true,
    message: 'Cache geleert',
    operations: ['http-cache-cleared'],
  };
}

/**
 * System Optimization
 */

export async function optimizeSystem({ clearHttpCache, flushStorage } = {}) {
  const before = process.memoryUsage();
  const operations = [];

  if (typeof clearHttpCache === 'function') {
    await clearHttpCache();
    operations.push('http-cache-cleared');
  }
  if (typeof flushStorage === 'function') {
    await flushStorage();
    operations.push('storage-flushed');
  }
  if (typeof global.gc === 'function') {
    global.gc();
    operations.push('garbage-collection');
  }

  const after = process.memoryUsage();
  return {
    optimized: operations.length > 0,
    message: operations.length > 0
      ? 'System-Caches optimiert'
      : 'Keine sichere Optimierungsaktion verfügbar',
    operations,
    memory: {
      beforeRss: before.rss,
      afterRss: after.rss,
      beforeHeapUsed: before.heapUsed,
      afterHeapUsed: after.heapUsed,
    },
  };
}

export default {
  getAnalyticsData,
  getSystemStats,
  clearCache,
  optimizeSystem,
};
