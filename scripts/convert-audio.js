import ffmpegStatic from 'ffmpeg-static';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const inputFile = 'C:\\Users\\p_kro\\Music\\rekordbox\\Recording\\REC-2026-03-09 - Kopie.wav';
const publicDir = path.join('d:\\webseeite-main', 'public', 'sets', 'public');
const outputFile = path.join(publicDir, 'Airdox_REC_2026_03_09.mp3');

console.log(`Starting conversion using ffmpeg-static...`);
console.log(`FFmpeg Path: ${ffmpegStatic}`);
console.log(`Input: ${inputFile}`);
console.log(`Target: ${outputFile}`);

try {
  // Execute the static ffmpeg binary directly
  const command = `"${ffmpegStatic}" -y -i "${inputFile}" -codec:a libmp3lame -b:a 192k "${outputFile}"`;
  console.log(`Command: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('Successfully compressed to MP3!');
  const stats = fs.statSync(outputFile);
  console.log(`New size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} catch (error) {
  console.error('Error during conversion:', error.message);
}
