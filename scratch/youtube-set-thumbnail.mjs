import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true, override: true });

const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const hit = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};

const getUserEnv = (key) => {
  if (process.platform !== 'win32') return '';
  const result = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    `[Environment]::GetEnvironmentVariable('${key.replaceAll("'", "''")}','User')`,
  ], { encoding: 'utf8' });
  return result.status === 0 ? String(result.stdout || '').trim() : '';
};

const getEnv = (key) => process.env[key] || getUserEnv(key);

const videoId = getArg('--video-id');
const thumbnailPath = getArg('--thumbnail');
if (!videoId || !thumbnailPath) {
  throw new Error('Usage: node scratch/youtube-set-thumbnail.mjs --video-id=<id> --thumbnail=<jpg-or-png>');
}

const missing = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'].filter((key) => !getEnv(key));
if (missing.length) {
  throw new Error(`Missing YouTube OAuth env vars: ${missing.join(', ')}`);
}

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: getEnv('YOUTUBE_CLIENT_ID'),
    client_secret: getEnv('YOUTUBE_CLIENT_SECRET'),
    refresh_token: getEnv('YOUTUBE_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  }),
});
if (!tokenResponse.ok) {
  throw new Error(`OAuth failed (${tokenResponse.status}): ${await tokenResponse.text()}`);
}
const accessToken = (await tokenResponse.json()).access_token;

const image = readFileSync(thumbnailPath);
const contentType = /\.png$/i.test(thumbnailPath) ? 'image/png' : 'image/jpeg';
const response = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${accessToken}`,
    'content-type': contentType,
    'content-length': String(image.length),
  },
  body: image,
});

if (!response.ok) {
  throw new Error(`Thumbnail update failed (${response.status}): ${await response.text()}`);
}

process.stdout.write(`${JSON.stringify(await response.json(), null, 2)}\n`);
