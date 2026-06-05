import { afterEach, describe, expect, it, vi } from 'vitest';
import { toPart000, toPlayableSrc } from '../audioSources';
import { STORAGE_KEYS } from '../../utils/websiteContracts';

describe('audio source helpers', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        localStorage.clear();
    });

    it('routes audio files through the API endpoint', () => {
        expect(toPlayableSrc('/sets/live_full.mp3')).toContain('/api/audio/live_full.mp3');
    });

    it('appends auth tokens without changing the audio filename', () => {
        localStorage.setItem(STORAGE_KEYS.authToken, 'tok_123');

        const src = toPlayableSrc('/sets/live_full.mp3');

        expect(src).toContain('/api/audio/live_full.mp3');
        expect(src).toContain('token=tok_123');
    });

    it('derives part000 filenames only for full mp3 sources', () => {
        expect(toPart000('set_full.mp3')).toBe('set_part000.mp3');
        expect(toPart000('set.mp3')).toBe('set_part000.mp3');
        expect(toPart000('set_part000.mp3')).toBeNull();
    });
});
