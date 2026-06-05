import { describe, expect, it, vi } from 'vitest';
import { calculateDistribution, generateHeatmap, generateTimeline } from '../analyticsStats';

describe('analyticsStats', () => {
    it('calculates sorted distributions for nested fields', () => {
        expect(calculateDistribution([
            { device: { type: 'desktop' } },
            { device: { type: 'mobile' } },
            { device: { type: 'desktop' } },
            {},
        ], 'device.type')).toEqual([
            { name: 'desktop', count: 2 },
            { name: 'mobile', count: 1 },
            { name: 'Unknown', count: 1 },
        ]);
    });

    it('generates timeline buckets for page views, downloads and plays', () => {
        vi.setSystemTime(new Date('2026-06-05T12:00:00Z'));

        const timeline = generateTimeline(
            [{ timestamp: '2026-06-05T10:00:00Z' }],
            [{ timestamp: '2026-06-05T11:00:00Z' }],
            [
                { timestamp: '2026-06-05T11:30:00Z', action: 'play' },
                { timestamp: '2026-06-05T11:45:00Z', action: 'skip' },
            ],
            '7days'
        );

        expect(timeline).toHaveLength(7);
        expect(timeline.at(-1)).toMatchObject({
            pageViews: 1,
            downloads: 1,
            audioPlays: 1,
        });

        vi.useRealTimers();
    });

    it('generates a seven-day hourly heatmap', () => {
        const heatmap = generateHeatmap([
            { timestamp: '2026-06-05T10:00:00Z' },
            { timestamp: '2026-06-05T10:30:00Z' },
        ]);

        expect(heatmap).toHaveLength(7);
        expect(heatmap.flat().reduce((total, value) => total + value, 0)).toBe(2);
    });
});
