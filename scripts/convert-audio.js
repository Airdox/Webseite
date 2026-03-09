import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const inputFile = 'C:\\Users\\p_kro\\Music\\rekordbox\\Recording\\REC-2026-03-09 - Kopie.wav';
const publicDir = path.join('d:\\webseeite-main', 'public', 'sets', 'public');
const outputFile = path.join(publicDir, 'Airdox_REC_2026_03_09.mp3');

console.log(`Starting conversion of: ${inputFile}`);
console.log(`Target: ${outputFile}`);

try {
  // Use npx to download and run ffmpeg-static without requiring a global install
  const command = `npx --yes @ffmpeg-installer/ffmpeg -y -i "${inputFile}" -codec:a libmp3lame -b:a 192k "${outputFile}"`;
  console.log(`Running command: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('Conversion successful!');
  const stats = fs.statSync(outputFile);
  console.log(`New file size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} catch (error) {
  console.error('Error during conversion:', error.message);
}
