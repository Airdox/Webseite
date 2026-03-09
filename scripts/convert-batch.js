import ffmpegStatic from 'ffmpeg-static';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const filesToProcess = [
  { in: 'C:\\Users\\p_kro\\Music\\rekordbox\\Recording\\airdox-\\Unknown Album(6)\\01 REC-2026-03-08.wav', out: '01 REC-2026-03-08.mp3' },
  { in: 'C:\\Users\\p_kro\\Music\\rekordbox\\Recording\\airdox-\\Unknown Album(3)\\01 REC-2026-03-06.wav', out: '01 REC-2026-03-06.mp3' },
  { in: 'C:\\Users\\p_kro\\Music\\rekordbox\\Recording\\airdox-\\Unknown Album(4)\\01 REC-2026-03-07.wav', out: '01 REC-2026-03-07.mp3' }
];

const publicDir = path.join('d:\\webseeite-main', 'public', 'sets', 'public');

for (const file of filesToProcess) {
  const outputFile = path.join(publicDir, file.out);
  console.log('---');
  if (fs.existsSync(outputFile)) {
    console.log('Skipping ' + file.out + ', already exists.');
    continue;
  }
  console.log('Converting: ' + file.in);
  try {
    const command = `"${ffmpegStatic}" -y -i "${file.in}" -codec:a libmp3lame -b:a 192k "${outputFile}"`;
    console.log(`Command: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log('Success: ' + file.out);
  } catch(e) {
    console.error('Error on ' + file.in, e.message);
  }
}
console.log('All done!');
