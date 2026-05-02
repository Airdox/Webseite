import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildSetAnchorId,
    buildSetHash,
    buildSetShareUrl,
    getSetAnchorIdFromHash,
    scrollToSetAnchor,
} from '../set-links';

describe('set-links', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        document.documentElement.style.removeProperty('--nav-height');
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
        vi.restoreAllMocks();
    });

    it('builds stable sanitized anchor ids and hashes', () => {
        expect(buildSetAnchorId('daily/mix 01')).toBe('set-daily-mix-01');
        expect(buildSetHash('future:set')).toBe('#set-future-set');
    });

    it('builds share urls from the current page path', () => {
        expect(buildSetShareUrl('daily/mix 01', {
            origin: 'https://airdox.example',
            pathname: '/en/',
        })).toBe('https://airdox.example/en/#set-daily-mix-01');
    });

    it('falls back to the production origin for non-browser locations', () => {
        expect(buildSetShareUrl('daily-mix', {})).toBe('https://airdox.info/#set-daily-mix');
    });

    it('reads only set anchors from hash values', () => {
        expect(getSetAnchorIdFromHash('#set-daily-mix')).toBe('set-daily-mix');
        expect(getSetAnchorIdFromHash('#music')).toBe('');
        expect(getSetAnchorIdFromHash('#set-%E0%A4%A')).toBe('set-%E0%A4%A');
    });

    it('scrolls to a set anchor with the shared nav offset', () => {
        const target = document.createElement('div');
        target.id = 'set-daily-mix';
        target.getBoundingClientRect = vi.fn(() => ({ top: 200 }));
        document.body.appendChild(target);
        document.documentElement.style.setProperty('--nav-height', '96px');
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 50 });
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        expect(scrollToSetAnchor('set-daily-mix', { behavior: 'auto' })).toBe(true);
        expect(scrollTo).toHaveBeenCalledWith({ top: 130, behavior: 'auto' });
    });
});
