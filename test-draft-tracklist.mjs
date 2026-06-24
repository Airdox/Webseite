import { buildDraftFromImportedFiles } from './src/desktop/lib/setManifest.js';

const draft = buildDraftFromImportedFiles({
  audioPath: 'D:\\Neuer Ordner (2)\\recording_2026_06_21.mp3',
  metadataTitle: 'fete de la musique',
  durationSeconds: 3600,
  parsedDate: { isoDate: '2026-06-21', label: 'JUN 2026', titleDate: '21.06.2026' },
  tracklistText: `00:00 Artist A - Song A
00:00:30 Artist A - Song A
00:00:40 Artist A - Song A
00:10 Artist B - Song B
00:20 Artist A - Song A
`,
  imagePath: '',
  embeddedCoverDataUrl: '',
});

console.log(JSON.stringify(draft.tracks, null, 2));
console.log('validation:', JSON.stringify(draft.tracklistValidation, null, 2));
