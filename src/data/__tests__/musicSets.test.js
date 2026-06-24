import { describe, expect, it } from 'vitest';
import { sets } from '../musicSets.js';
import { partitionSetsByAccess } from '../../lib/set-access.js';

describe('music set audio manifest', () => {
  it('uses mp3 filenames for public playable sets', () => {
    const { publicSets } = partitionSetsByAccess(sets);

    expect(publicSets.length).toBeGreaterThan(0);
    for (const set of publicSets) {
      expect(set.file, `${set.id} should point to an mp3 audio file`).toMatch(/\.mp3$/i);
    }
  });

  it('keeps seekable tracklists on all public sets', () => {
    const { publicSets } = partitionSetsByAccess(sets);

    for (const set of publicSets) {
      expect(Array.isArray(set.tracks), `${set.id} should expose a tracklist`).toBe(true);
      expect(set.tracks.length, `${set.id} should keep at least one seekable row`).toBeGreaterThan(0);
    }
  });
});
