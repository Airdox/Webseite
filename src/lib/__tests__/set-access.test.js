import { describe, it, expect } from 'vitest';
import {
    partitionSetsByAccess,
    normalizeAudioBaseFilename,
    buildAudioApiHref,
    formatSetDate,
    getLatestSet,
} from '../set-access';

describe('set-access', () => {
    it('keeps all sets public by default', () => {
        const sampleSets = [
            { id: 'old-1', publishedAt: '2026-01-01', file: 'old1.mp3' },
            { id: 'new-1', publishedAt: '2026-04-22', file: 'new1.mp3' },
            { id: 'new-2', publishedAt: '2026-04-25', file: 'new2.mp3' },
            { id: 'old-2', publishedAt: '2025-12-31', file: 'old2.mp3' },
        ];

        const { publicSets, restrictedSets } = partitionSetsByAccess(sampleSets);

        expect(publicSets.map((set) => set.id)).toEqual(['old-1', 'new-1', 'new-2', 'old-2']);
        expect(restrictedSets).toEqual([]);
    });

    it('can still partition a bounded public slice for internal reports', () => {
        const sampleSets = [
            { id: 'old-1', publishedAt: '2026-01-01', file: 'old1.mp3' },
            { id: 'new-1', publishedAt: '2026-04-22', file: 'new1.mp3' },
            { id: 'new-2', publishedAt: '2026-04-25', file: 'new2.mp3' },
            { id: 'old-2', publishedAt: '2025-12-31', file: 'old2.mp3' },
        ];

        const { publicSets, restrictedSets } = partitionSetsByAccess(sampleSets, 2);

        expect(publicSets.map((set) => set.id)).toEqual(['new-1', 'new-2']);
        expect(restrictedSets.map((set) => set.id)).toEqual(['old-1', 'old-2']);
    });

    it('normalizes split audio file names to a base file name', () => {
        expect(normalizeAudioBaseFilename('Airdox_Mix_part000.mp3')).toBe('airdox_mix.mp3');
        expect(normalizeAudioBaseFilename('Airdox_Mix_full.mp3')).toBe('airdox_mix.mp3');
    });

    it('builds public audio endpoint links without tokens', () => {
        expect(buildAudioApiHref('Demo Set.mp3', 'abc123')).toBe('/api/audio/Demo%20Set.mp3');
        expect(buildAudioApiHref('Demo Set.mp3')).toBe('/api/audio/Demo%20Set.mp3');
    });

    it('detects the latest set from publish metadata instead of list position', () => {
        const sampleSets = [
            { id: 'recording_2026_05_02', publishedAt: '2026-05-02', file: 'old.mp3' },
            { id: 'recording_2026_06_02', publishedAt: '2026-06-02', file: 'middle.mp3' },
            { id: 'recording_2026_06_21-5', publishedAt: '2026-06-21', file: 'latest.mp3' },
        ];

        expect(getLatestSet(sampleSets).id).toBe('recording_2026_06_21-5');
    });

    it('formats latest-set dates in the active site locale', () => {
        const set = { publishedAt: '2026-06-21' };

        expect(formatSetDate(set, 'de')).toBe('21.06.');
        expect(formatSetDate(set, 'en')).toBe('21 Jun');
    });
});
