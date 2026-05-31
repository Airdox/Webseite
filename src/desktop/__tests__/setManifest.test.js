import { describe, expect, it } from 'vitest';
import {
  buildDraftFromImportedFiles,
  insertOrReplaceSet,
  parseDateHint,
  parseTracklistText,
  resolveUniqueSetDraftIdentity,
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

  it('parses pipe-delimited tracklists without treating commas as columns', () => {
    const tracks = parseTracklistText(`
      time | artist | title
      00:34:38 | Alok, FAANGS, SCRIPT | Substance (Extended Mix)
      00:55:16 | Ali Love, Vintage Culture, Max Styler | Freaky 1 (Original Mix)
    `);

    expect(tracks).toEqual([
      { time: '00:34:38', artist: 'Alok, FAANGS, SCRIPT', title: 'Substance (Extended Mix)' },
      { time: '00:55:16', artist: 'Ali Love, Vintage Culture, Max Styler', title: 'Freaky 1 (Original Mix)' },
    ]);
  });

  it('parses rekordbox history TSV tracklists', () => {
    const tracks = parseTracklistText(`
      #\tTrack Title\tArtist\tStart Time
      1\tBlack Church (Original Mix)\tPatrick Arbez\t00:37
      2\tGenerate Bodies (2000)\tMJ Lan\t19:23
    `);

    expect(tracks).toEqual([
      { time: '00:37', artist: 'Patrick Arbez', title: 'Black Church (Original Mix)' },
      { time: '19:23', artist: 'MJ Lan', title: 'Generate Bodies (2000)' },
    ]);
  });

  it('parses semicolon-delimited title artist time exports', () => {
    const tracks = parseTracklistText(`
      Track Title;Artist;Start Time
      Turn (Original Mix);Martin Books;00:00:00
    `);

    expect(tracks).toEqual([
      { time: '00:00:00', artist: 'Martin Books', title: 'Turn (Original Mix)' },
    ]);
  });

  it('drops ambiguous comma-delimited rows with comma-separated artist names', () => {
    const tracks = parseTracklistText(`
      time,artist,title
      00:34:38,Alok, FAANGS, SCRIPT,Substance (Extended Mix)
      00:55:16,Ali Love,Vintage Culture,Max Styler,Freaky 1 (Original Mix)
    `);

    expect(tracks).toEqual([]);
  });

  it('drops untimed and invalid imported track rows instead of serializing a broken tracklist', () => {
    const tracks = parseTracklistText(JSON.stringify({
      tracks: [
        { time: '', artist: 'Tanith', title: 'Triage' },
        { time: 'Alok', artist: 'FAANGS', title: 'SCRIPT - Substance' },
        { time: '00:34:38', artist: 'Alok, FAANGS', title: 'SCRIPT - Substance' },
      ],
    }));

    expect(tracks).toEqual([
      { time: '00:34:38', artist: 'Alok, FAANGS', title: 'SCRIPT - Substance' },
    ]);

    const [manifestSet] = insertOrReplaceSet([], {
      id: 'demo',
      title: 'Demo',
      file: 'demo.mp3',
      tracks: [
        { time: '', artist: 'Tanith', title: 'Triage' },
        { time: 'Ali Love', artist: 'Vintage Culture', title: 'Freaky' },
      ],
    });

    expect(manifestSet).not.toHaveProperty('tracks');
  });

  it('repairs set performer placeholders in generated tracklist json sidecars', () => {
    const tracks = parseTracklistText(JSON.stringify({
      sourceFile: 'D:\\Neuer Ordner (2)\\140-Airdox-Rauchst du Raus\\ost\\01 REC-2026-05-02.cue',
      tracks: [
        {
          time: '00:16:42',
          artist: '140-Airdox-Rauchst du Raus',
          title: 'Dense & Pika - Crispy Duck',
          sourceFile: 'G:/beuth62/Mix - Dense & Pika - Triangle/Dense & Pika - Crispy Duck.mp3',
        },
        {
          time: '01:14:17',
          artist: '140-Airdox-Rauchst du Raus',
          title: 'LxS_-_Showroom_Dummies_(Original_Mix) (1)',
          sourceFile: 'G:/beuth62/Bretter techno 2015/LxS_-_Showroom_Dummies_(Original_Mix) (1).mp3',
        },
      ],
    }));

    expect(tracks).toEqual([
      { time: '00:16:42', artist: 'Dense & Pika', title: 'Crispy Duck' },
      { time: '01:14:17', artist: 'LxS', title: 'Showroom_Dummies_(Original_Mix) (1)' },
    ]);
  });

  it('repairs generic Airdox performer placeholders from title/file metadata', () => {
    const tracks = parseTracklistText(JSON.stringify({
      tracks: [
        {
          time: '00:25:08',
          artist: 'Airdox - weg du dreck',
          title: 'Marcel Dettmann - Push',
          sourceFile: 'G:/beuth62/Berghain music/Marcel Dettmann - Push.mp3',
        },
        {
          time: '00:47:46',
          artist: '',
          title: 'Martin books -Perfection',
          sourceFile: 'G:/import/Martin books -Perfection.mp3',
        },
      ],
    }));

    expect(tracks).toEqual([
      { time: '00:25:08', artist: 'Marcel Dettmann', title: 'Push' },
      { time: '00:47:46', artist: 'Martin books', title: 'Perfection' },
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
        artist: 'MJ Lan',
        title: 'Generate Bodies (2000)',
      },
    ]);
  });

  it('parses rekordbox cue tracklists with seekable timestamps', () => {
    const tracks = parseTracklistText(`
      REM RECORDED_BY "rekordbox-dj"
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
        TRACK 05 AUDIO
          TITLE "Dense & Pika - Crispy Duck"
          FILE "G:/beuth62/Mix - Dense & Pika - Triangle/Dense & Pika - Crispy Duck.mp3" WAVE
          INDEX 01 00:16:42
    `);

    expect(tracks).toEqual([
      { time: '00:00:00', artist: 'Martin Books', title: 'Turn (Original Mix)' },
      { time: '00:00:37', artist: 'Patrick Arbez', title: 'Black Church (Original Mix)' },
      { time: '00:05:45', artist: 'Patrick Arbez', title: 'Black Church (Original Mix)' },
      { time: '00:19:23', artist: 'MJ Lan', title: 'Generate Bodies (2000)' },
      { time: '00:16:42', artist: 'Dense & Pika', title: 'Crispy Duck' },
    ]);
  });

  it('normalizes cue index frames instead of treating them as seconds', () => {
    const tracks = parseTracklistText(`
      TRACK 01 AUDIO
        TITLE "Frame Test"
        PERFORMER "Airdox"
        INDEX 01 00:19:23
    `);

    expect(tracks).toEqual([
      { time: '00:00:19', artist: 'Airdox', title: 'Frame Test' },
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
      title: 'AIRDOX SET',
      titleNeedsReview: true,
      date: 'APR 2026',
      file: 'Airdox_REC_2026_04_12.mp3',
      duration: '1:02:03',
      vinylColor: '#112233',
      cover: '/assets/cover.png',
    });
    expect(draft.tracks).toHaveLength(1);
  });

  it('skips recorder placeholder folders when deriving a set title', () => {
    const draft = buildDraftFromImportedFiles({
      audioPath: 'D:\\Neuer Ordner (2)\\Airdox - weg du dreck\\livesets\\01 REC-2026-04-12.mp3',
      metadataTitle: '',
      durationSeconds: 3600,
      parsedDate: parseDateHint('2026_04_12'),
      tracklistText: '00:00 Marcel Dettmann - Push',
      imagePath: '',
      embeddedCoverDataUrl: '',
    });

    expect(draft).toMatchObject({
      title: 'WEG DU DRECK',
      titleNeedsReview: false,
    });
  });

  it('allocates unique same-day set ids, titles and files from existing manifest entries', () => {
    const draft = buildDraftFromImportedFiles({
      audioPath: 'D:\\Sets\\Rauchst du Raus\\01 REC-2026-05-02.mp3',
      metadataTitle: '',
      durationSeconds: 1800,
      parsedDate: parseDateHint('2026_05_02'),
      tracklistText: '00:00 Airdox - Intro',
      imagePath: '',
      embeddedCoverDataUrl: '',
      existingSets: [
        {
          id: 'recording_2026_05_02',
          title: 'RAUCHST DU RAUS',
          file: '01 REC-2026-05-02.mp3',
        },
        {
          id: 'recording_2026_05_02-2',
          title: 'RAUCHST DU RAUS #2',
          file: 'recording_2026_05_02-2.mp3',
        },
      ],
    });

    expect(draft).toMatchObject({
      id: 'recording_2026_05_02-3',
      title: 'RAUCHST DU RAUS #3',
      file: 'recording_2026_05_02-3.mp3',
      titleNeedsReview: false,
    });
  });

  it('keeps a manually edited title when resolving a generated import identity', () => {
    const resolved = resolveUniqueSetDraftIdentity({
      id: 'recording_2026_05_24',
      generatedBaseId: 'recording_2026_05_24',
      generatedBaseTitle: 'AIRDOX SET',
      title: '...immer wieder Pfingsten!!!',
      file: 'recording_2026_05_24.mp3',
      isNew: true,
    });

    expect(resolved.title).toBe('...immer wieder Pfingsten!!!');
    expect(resolved.generatedBaseTitle).toBe('...immer wieder Pfingsten!!!');
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

  it('normalizes manual manifest ids before serialization', () => {
    const [manifestSet] = insertOrReplaceSet([], {
      id: ' My Set 01! ',
      title: 'Manual',
      file: 'manual.mp3',
    });

    expect(manifestSet.id).toBe('my_set_01');
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
