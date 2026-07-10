import { describe, expect, it } from 'vitest';
import { sets } from '../musicSets.js';

describe('music set audio manifest', () => {
  it('uses mp3 filenames for every playable set', () => {
    expect(sets.length).toBeGreaterThan(0);
    for (const set of sets) {
      expect(set.file, `${set.id} should point to an mp3 audio file`).toMatch(/\.mp3$/i);
    }
  });

  it('keeps seekable tracklists on every set', () => {
    for (const set of sets) {
      expect(Array.isArray(set.tracks), `${set.id} should expose a tracklist`).toBe(true);
      expect(set.tracks.length, `${set.id} should keep at least one seekable row`).toBeGreaterThan(0);
    }
  });
});
