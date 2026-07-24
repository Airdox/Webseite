import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearCache,
  getAnalyticsData,
  getSystemStats,
  optimizeSystem,
} from '../../../desktop/main/services/admin.mjs';

describe('desktop admin service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds numeric analytics from the five real database result sets', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [
        { event_type: 'play', count: '12' },
        { event_type: 'like', count: '3' },
      ] })
      .mockResolvedValueOnce({ rows: [
        { id: 'live-set', plays: '9', likes: '2', dislikes: '1', last_played_at: '2026-07-20T21:00:00Z' },
        { id: 'afterhour-set', plays: null, likes: null, dislikes: null, last_played_at: null },
      ] })
      .mockResolvedValueOnce({ rows: [
        { country: 'DE', count: '10' },
        { country: 'NL', count: '5' },
      ] })
      .mockResolvedValueOnce({ rows: [
        { device_type: 'desktop', count: '8' },
        { device_type: 'mobile', count: '7' },
      ] })
      .mockResolvedValueOnce({ rows: [
        { hour: '22', count: '6' },
        { hour: '99', count: '100' },
      ] });

    const result = await getAnalyticsData({ query }, 'D:\\workspace');

    expect(query).toHaveBeenCalledTimes(5);
    expect(result).toMatchObject({
      totalViews: 15,
      totalPlays: 9,
      totalLikes: 2,
      totalDislikes: 1,
      eventsByType: { play: 12, like: 3 },
      deviceTypeBreakdown: { desktop: 8, mobile: 7 },
      conversionRate: 0.6,
    });
    expect(result.topCountries).toEqual([
      { code: 'DE', count: 10 },
      { code: 'NL', count: 5 },
    ]);
    expect(result.hourlyDistribution).toHaveLength(24);
    expect(result.hourlyDistribution[22]).toBe(6);
    expect(result.hourlyDistribution).not.toContain(100);
  });

  it('returns a truthful empty analytics result when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await getAnalyticsData({ query: vi.fn().mockRejectedValue(new Error('offline')) });

    expect(result).toEqual({
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
    });
  });

  it('reports real host, disk and current-process measurements', () => {
    const stats = getSystemStats();

    expect(stats.memory.total).toBeGreaterThan(0);
    expect(stats.memory.used).toBeGreaterThanOrEqual(0);
    expect(stats.cpu.cores).toBeGreaterThan(0);
    expect(stats.cpu.percentUsed).toBeGreaterThanOrEqual(0);
    expect(stats.cpu.percentUsed).toBeLessThanOrEqual(100);
    expect(stats.disk.total).toBeGreaterThanOrEqual(0);
    expect(stats.processes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        pid: process.pid,
        status: 'running',
        memory: expect.any(Number),
      }),
    ]));
    expect(Number.isNaN(Date.parse(stats.lastUpdate))).toBe(false);
  });

  it('clears the supplied Electron HTTP cache and refuses to claim success without one', async () => {
    const clearHttpCache = vi.fn().mockResolvedValue(undefined);

    await expect(clearCache({ clearHttpCache })).resolves.toEqual({
      cleared: true,
      message: 'Cache geleert',
      operations: ['http-cache-cleared'],
    });
    expect(clearHttpCache).toHaveBeenCalledOnce();

    await expect(clearCache()).resolves.toEqual({
      cleared: false,
      message: 'Kein aktiver Electron-Cache verfügbar',
      operations: [],
    });
  });

  it('optimizes only through real supplied operations and reports memory evidence', async () => {
    const clearHttpCache = vi.fn().mockResolvedValue(undefined);
    const flushStorage = vi.fn().mockResolvedValue(undefined);
    const previousGc = globalThis.gc;
    globalThis.gc = vi.fn();

    try {
      const result = await optimizeSystem({ clearHttpCache, flushStorage });
      expect(clearHttpCache).toHaveBeenCalledOnce();
      expect(flushStorage).toHaveBeenCalledOnce();
      expect(globalThis.gc).toHaveBeenCalledOnce();
      expect(result.optimized).toBe(true);
      expect(result.operations).toEqual([
        'http-cache-cleared',
        'storage-flushed',
        'garbage-collection',
      ]);
      expect(result.memory).toEqual(expect.objectContaining({
        beforeRss: expect.any(Number),
        afterRss: expect.any(Number),
        beforeHeapUsed: expect.any(Number),
        afterHeapUsed: expect.any(Number),
      }));
    } finally {
      if (previousGc) globalThis.gc = previousGc;
      else delete globalThis.gc;
    }

    await expect(optimizeSystem()).resolves.toMatchObject({
      optimized: false,
      operations: [],
      message: 'Keine sichere Optimierungsaktion verfügbar',
    });
  });
});
