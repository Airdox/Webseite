import { describe, expect, it } from 'vitest';
import {
  buildDraftFromImportedFiles,
  insertOrReplaceSet,
  parseDateHint,
  parseTracklistText,
  serializeSetsModule,
} from '../lib/setManifest.js';

describe('setManifest helpers', () => {
  it('parses tracklists from time-prefixed text', () => {
    const tracks = parseTracklistText(`
      00:00 Airdox - Opening
      05:12 Alignment - Nothingness
    `);

    expect(tracks).toEqual([
      { time: '00:00', artist: 'Airdox', title: 'Opening' },
      { time: '05:12', artist: 'Alignment', title: 'Nothingness' },
    ]);
  });

  it('derives dates from filename hints', () => {
    expect(parseDateHint('Airdox_REC_2026_04_12.mp3')).toEqual({
      isoDate: '2026-04-12',
      titleDate: '12.04.2026',
      label: 'APR 2026',
    });
  });

  it('builds a draft from imported files', () => {
    const draft = buildDraftFromImportedFiles({
      audioPath: 'D:\\Music\\Airdox_REC_2026_04_12.mp3',
      metadataTitle: '',
      durationSeconds: 3723,
      parsedDate: parseDateHint('2026_04_12'),
      tracklistText: '00:00 Airdox - Intro',
      imagePath: 'D:\\Music\\cover.png',
      embeddedCoverDataUrl: '',
      defaultVinylColor: '#112233',
    });

    expect(draft).toMatchObject({
      id: 'recording_2026_04_12',
      title: 'REC 12.04.2026',
      date: 'APR 2026',
      file: 'Airdox_REC_2026_04_12.mp3',
      duration: '1:02:03',
      vinylColor: '#112233',
      cover: '/assets/cover.png',
    });
    expect(draft.tracks).toHaveLength(1);
  });

  it('inserts or replaces manifest entries at the top by default', () => {
    const current = [
      { id: 'old', title: 'Old', date: 'APR 2026', file: 'old.mp3' },
    ];

    const next = insertOrReplaceSet(current, {
      id: 'new',
      title: 'New',
      date: 'MAY 2026',
      file: 'new.mp3',
      isNew: true,
      tracks: [],
    });

    expect(next.map((entry) => entry.id)).toEqual(['new', 'old']);
  });

  it('serializes a valid musicSets module', () => {
    const serialized = serializeSetsModule([
      { id: 'demo', title: 'Demo', date: 'APR 2026', file: 'demo.mp3', isNew: true },
    ]);

    expect(serialized).toContain('export const sets =');
    expect(serialized).toContain("id: 'demo'");
    expect(serialized).toContain("file: 'demo.mp3'");
  });
});
