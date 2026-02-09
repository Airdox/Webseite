/* global process */
import { spawnSync } from 'node:child_process';

const siteId = process.env.NETLIFY_AUDIO_SITE_ID;
const audioDir = process.env.AUDIO_DIR || 'public/sets';

if (!siteId) {
  console.error('Missing NETLIFY_AUDIO_SITE_ID. Set it to the audio site id before deploying.');
  process.exit(1);
}

const args = ['netlify', 'deploy', '--prod', '--dir', audioDir, '--site', siteId];
const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status ?? 1);
