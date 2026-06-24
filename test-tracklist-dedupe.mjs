import { parseTracklistToCanonical } from './src/desktop/lib/tracklistCore.js';

const sample = `00:00 Artist A - Song A
00:00:30 Artist A - Song A
00:00:40 Artist A - Song A
00:10 Artist B - Song B
00:20 Artist A - Song A
`;

const canonical = parseTracklistToCanonical(sample, { audioDurationSeconds: 3600 });
console.log(JSON.stringify(canonical, null, 2));
