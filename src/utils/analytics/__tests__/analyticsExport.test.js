import { describe, expect, it, vi } from 'vitest';
import { buildAnalyticsCsv, buildAnalyticsExportObject } from '../analyticsExport';

describe('analyticsExport', () => {
    it('builds the JSON export payload from stats', () => {
        vi.setSystemTime(new Date('2026-06-05T12:00:00Z'));
        const payload = buildAnalyticsExportObject({
            timeRange: '7days',
            total: { pageViews: 1 },
            averages: { sessionDuration: 12 },
            rates: { bounce: 0 },
            traffic: { referrers: [] },
            downloads: { top: [] },
            audio: { top: [] },
            devices: { types: [] },
            timeline: [],
            rawData: { pageViews: [] },
        });

        expect(payload).toMatchObject({
            exportDate: '2026-06-05T12:00:00.000Z',
            timeRange: '7days',
            summary: {
                total: { pageViews: 1 },
                averages: { sessionDuration: 12 },
                rates: { bounce: 0 },
            },
        });

        vi.useRealTimers();
    });

    it('builds the CSV export rows from raw analytics buckets', () => {
        const csv = buildAnalyticsCsv({
            rawData: {
                pageViews: [{
                    timestamp: '2026-06-05T10:00:00Z',
                    page: '/',
                    sessionId: 's1',
                    device: { type: 'desktop', browser: 'Chrome' },
                }],
                downloads: [{
                    timestamp: '2026-06-05T11:00:00Z',
                    fileName: 'set.mp3',
                    category: 'public',
                    sessionId: 's1',
                    device: { type: 'desktop', browser: 'Chrome' },
                }],
                audioEvents: [{
                    timestamp: '2026-06-05T12:00:00Z',
                    action: 'play',
                    trackName: 'Set',
                    sessionId: 's1',
                }],
            },
        });

        expect(csv).toContain('Timestamp,Event Type,Value,Category,Session ID,Device,Browser');
        expect(csv).toContain('2026-06-05T10:00:00Z,pageview,/,');
        expect(csv).toContain('2026-06-05T11:00:00Z,download,set.mp3,public');
        expect(csv).toContain('2026-06-05T12:00:00Z,audio_play,Set');
    });
});
