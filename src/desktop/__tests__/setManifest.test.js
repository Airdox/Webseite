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

  it('parses watcher json tracklists using timestamp fallback', () => {
    const tracks = parseTracklistText(JSON.stringify({
      tracks: [
        { timestamp: '0:00:00', artist: 'Airdox', title: 'Opening ID' },
        { time: '', timestamp: '0:07:15', artist: 'Alignment', title: 'Voyager' },
      ],
    }));

    expect(tracks).toEqual([
      { time: '00:00:00', artist: 'Airdox', title: 'Opening ID' },
      { time: '00:07:15', artist: 'Alignment', title: 'Voyager' },
    ]);
  });

  it('parses trailing-time tracklists with commas in artist names', () => {
    const tracks = parseTracklistText(`
      Kevin McKay, Pupa Nas T, Denise Belfon - Work (CVMPANILE & Draxx Extended Remix) - 00:10:42
      140-Airdox - MJ Lan - Generate Bodies (2000) - 00:19:23
    `);

    expect(tracks).toEqual([
      {
        time: '00:10:42',
        artist: 'Kevin McKay, Pupa Nas T, Denise Belfon',
        title: 'Work (CVMPANILE & Draxx Extended Remix)',
      },
      {
        time: '00:19:23',
        artist: '140-Airdox',
        title: 'MJ Lan - Generate Bodies (2000)',
      },
    ]);
  });

  it('parses rekordbox cue tracklists with seekable timestamps', () => {
    const tracks = parseTracklistText(`
      TITLE "REC-2026-05-01"
      PERFORMER "140-Airdox"
      FILE "01 REC-2026-05-01.wav" WAVE
        TRACK 01 AUDIO
          TITLE "Turn (Original Mix)"
          PERFORMER "Martin Books"
          INDEX 01 00:00:00
        TRACK 02 AUDIO
          TITLE "Black Church (Original Mix)"
          PERFORMER "Patrick Arbez"
          INDEX 01 00:00:37
        TRACK 03 AUDIO
          TITLE "Black Church (Original Mix)"
          PERFORMER "Patrick Arbez"
          INDEX 01 00:05:45
        TRACK 04 AUDIO
          TITLE "MJ Lan - Generate Bodies (2000)"
          FILE "G:/mp3 traktor/MJ Lan - Generate Bodies (2000).mp3" WAVE
          INDEX 01 00:19:23
    `);

    expect(tracks).toEqual([
      { time: '00:00:00', artist: 'Martin Books', title: 'Turn (Original Mix)' },
      { time: '00:00:37', artist: 'Patrick Arbez', title: 'Black Church (Original Mix)' },
      { time: '00:19:23', artist: '140-Airdox', title: 'MJ Lan - Generate Bodies (2000)' },
    ]);
  });

  it('derives dates from filename hints', () => {
    expect(parseDateHint('Airdox_REC_2026_04_12.mp3')).toEqual({
      isoDate: '2026-04-12',
      titleDate: '12.04.2026',
      label: 'APR 2026',
    });
  });

  it('rejects invalid structured date hints instead of normalizing them', () => {
    expect(parseDateHint('Airdox_REC_2026_02_31.mp3')).toBeNull();
    expect(parseDateHint('Airdox_REC_31_04_2026.mp3')).toBeNull();
    expect(parseDateHint('Airdox_REC_2026_13_01.mp3')).toBeNull();
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

  it('uses default vinyl cover when no custom cover is provided', () => {
    const draft = buildDraftFromImportedFiles({
      audioPath: 'D:\\Music\\Airdox_REC_2026_04_13.mp3',
      metadataTitle: '',
      durationSeconds: 1800,
      parsedDate: parseDateHint('2026_04_13'),
      tracklistText: '',
      imagePath: '',
      embeddedCoverDataUrl: '',
      defaultVinylColor: '#112233',
      defaultCoverPath: '/assets/airdox-vinyl.jpg',
    });

    expect(draft.cover).toBe('/assets/airdox-vinyl.jpg');
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
