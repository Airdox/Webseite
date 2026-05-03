import { describe, expect, it } from 'vitest';
import {
  TRACKLIST_SCHEMA,
  parseCueDocument,
  parseTracklistToCanonical,
  toMixcloudLines,
  toPipeTracklistText,
} from '../tracklistCore.js';

describe('tracklistCore', () => {
  it('builds a canonical tracklist from Rekordbox cue input', () => {
    const canonical = parseCueDocument(`
      REM RECORDED_BY "rekordbox-dj"
      TITLE "REC-2026-05-02"
      PERFORMER "140-Airdox"
      FILE "01 REC-2026-05-02.wav" WAVE
        TRACK 01 AUDIO
          TITLE "Turn (Original Mix)"
          PERFORMER "Martin Books"
          INDEX 01 00:00:00
        TRACK 02 AUDIO
          TITLE "Dense & Pika - Crispy Duck"
          FILE "G:/beuth62/Mix - Dense & Pika - Triangle/Dense & Pika - Crispy Duck.mp3" WAVE
          INDEX 01 00:16:42
    `, { sourceFile: 'D:/incoming/REC-2026-05-02.cue' });

    expect(canonical.schema).toBe(TRACKLIST_SCHEMA);
    expect(canonical.audioFile).toBe('01 REC-2026-05-02.wav');
    expect(canonical.validation.status).toBe('pass');
    expect(canonical.tracks).toMatchObject([
      {
        index: 1,
        startSeconds: 0,
        time: '00:00:00',
        artist: 'Martin Books',
        title: 'Turn (Original Mix)',
      },
      {
        index: 2,
        startSeconds: 1002,
        time: '00:16:42',
        artist: 'Dense & Pika',
        title: 'Crispy Duck',
      },
    ]);
  });

  it('exports canonical tracks to Mixcloud and pipe review formats', () => {
    const canonical = parseTracklistToCanonical(`
      time | artist | title
      00:00 | Alok, FAANGS, SCRIPT | Substance (Extended Mix)
    `);

    expect(toMixcloudLines(canonical.tracks)).toEqual([
      'Alok, FAANGS, SCRIPT - Substance (Extended Mix) - 00:00:00',
    ]);
    expect(toPipeTracklistText(canonical.tracks)).toBe([
      'time | artist | title',
      '00:00:00 | Alok, FAANGS, SCRIPT | Substance (Extended Mix)',
      '',
    ].join('\n'));
  });

  it('reports validation errors and ordering warnings', () => {
    const canonical = parseTracklistToCanonical(`
      time | artist | title
      00:10 | Artist One | Too Late
      00:05 | Artist Two | Earlier
    `, { audioDurationSeconds: 6 });

    expect(canonical.validation.status).toBe('fail');
    expect(canonical.validation.errors).toContain('Track 1 starts after the audio duration.');
    expect(canonical.validation.warnings).toContain('Track 2 starts before the previous track.');
  });
});
