import { describe, expect, it } from 'vitest';
import { getAnalyticsDeviceInfo, getDefaultAnalyticsData, trimAnalyticsBucket } from '../analyticsRuntime';

describe('analyticsRuntime', () => {
    it('creates independent default analytics buckets', () => {
        const first = getDefaultAnalyticsData();
        const second = getDefaultAnalyticsData();
        first.pageViews.push({ page: '/' });

        expect(second.pageViews).toEqual([]);
        expect(Object.keys(second)).toEqual([
            'pageViews',
            'downloads',
            'sessions',
            'audioEvents',
            'interactions',
            'customEvents',
            'socialClicks',
        ]);
    });

    it('classifies common device and browser data', () => {
        expect(getAnalyticsDeviceInfo({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0',
            screen: { width: 1440, height: 900 },
            language: 'de-DE',
        })).toMatchObject({
            type: 'desktop',
            browser: 'Chrome',
            os: 'Windows',
            screenWidth: 1440,
            screenHeight: 900,
            language: 'de-DE',
        });

        expect(getAnalyticsDeviceInfo({
            userAgent: 'Mozilla/5.0 (iPhone) Safari/605.1',
            screen: { width: 390, height: 844 },
            language: 'en-US',
        })).toMatchObject({
            type: 'mobile',
            browser: 'Safari',
            os: 'iOS',
        });
    });

    it('trims analytics buckets to the configured limit', () => {
        const data = { pageViews: [{ id: 1 }, { id: 2 }, { id: 3 }] };
        trimAnalyticsBucket(data, 'pageViews', 2);
        expect(data.pageViews).toEqual([{ id: 2 }, { id: 3 }]);
    });
});
