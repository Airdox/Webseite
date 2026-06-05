import { describe, expect, it, vi } from 'vitest';
import {
    dispatchWindowEvent,
    getStorageItem,
    removeStorageItem,
    readStorageJson,
    setStorageItem,
    STORAGE_KEYS,
    WINDOW_EVENTS,
    writeStorageJson,
} from '../websiteContracts';

describe('website contracts', () => {
    it('keeps public storage keys stable', () => {
        expect(STORAGE_KEYS.globalStats).toBe('airdox_global_stats');
        expect(STORAGE_KEYS.offlineStatsQueue).toBe('airdox_offline_queue');
        expect(STORAGE_KEYS.authToken).toBe('airdox_token');
    });

    it('reads and writes JSON storage safely', () => {
        writeStorageJson(STORAGE_KEYS.userVotes, { setA: 'like' });

        expect(readStorageJson(STORAGE_KEYS.userVotes, {})).toEqual({ setA: 'like' });
    });

    it('wraps primitive storage access behind stable keys', () => {
        setStorageItem(STORAGE_KEYS.authToken, 'tok_123');

        expect(getStorageItem(STORAGE_KEYS.authToken)).toBe('tok_123');
        removeStorageItem(STORAGE_KEYS.authToken);
        expect(getStorageItem(STORAGE_KEYS.authToken)).toBe('');
    });

    it('dispatches stable window events with detail', () => {
        const listener = vi.fn();
        window.addEventListener(WINDOW_EVENTS.statsUpdated, listener);

        dispatchWindowEvent(WINDOW_EVENTS.statsUpdated, { setA: { plays: 1 } });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0][0].detail).toEqual({ setA: { plays: 1 } });
        window.removeEventListener(WINDOW_EVENTS.statsUpdated, listener);
    });
});
