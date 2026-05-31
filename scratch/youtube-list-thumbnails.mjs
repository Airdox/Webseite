import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true, override: true });

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
  throw new Error(await tokenResponse.text());
}

const accessToken = (await tokenResponse.json()).access_token;
const authHeaders = { authorization: `Bearer ${accessToken}` };

const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
  headers: authHeaders,
});
if (!channelResponse.ok) {
  throw new Error(await channelResponse.text());
}

const channels = await channelResponse.json();
const uploadsPlaylist = channels.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
if (!uploadsPlaylist) {
  throw new Error('No uploads playlist found for authenticated YouTube account.');
}

const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylist}&maxResults=50`, {
  headers: authHeaders,
});
if (!playlistResponse.ok) {
  throw new Error(await playlistResponse.text());
}

const items = (await playlistResponse.json()).items || [];
const slim = items.map((item) => ({
  title: item.snippet.title,
  videoId: item.snippet.resourceId.videoId,
  thumbnails: item.snippet.thumbnails,
}));

writeFileSync(
  'docs/agent-system/social-auto-output/recording-2026-05-24/youtube-upload-list.json',
  JSON.stringify(slim, null, 2),
);

process.stdout.write(`${JSON.stringify(slim.map((item) => ({
  title: item.title,
  videoId: item.videoId,
  bestThumbnail: Object.entries(item.thumbnails || {}).pop()?.[1]?.url || '',
})), null, 2)}\n`);
