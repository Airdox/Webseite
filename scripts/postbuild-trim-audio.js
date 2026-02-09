/* global process */
import fs from 'node:fs';
import path from 'node:path';

const fallbackBase = process.env.VITE_AUDIO_FALLBACK_BASE;
const distSets = path.join(process.cwd(), 'dist', 'sets');

if (!fallbackBase) {
  console.log('[audio] VITE_AUDIO_FALLBACK_BASE not set; keeping dist/sets.');
  process.exit(0);
}

if (!fs.existsSync(distSets)) {
  console.log('[audio] dist/sets not found; nothing to remove.');
  process.exit(0);
}

fs.rmSync(distSets, { recursive: true, force: true });
console.log('[audio] Removed dist/sets for external audio hosting.');
