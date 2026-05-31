import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env', quiet: true, override: true });

const videoIds = process.argv.slice(2).filter(Boolean);
if (videoIds.length === 0) {
  throw new Error('Usage: node scratch/youtube-video-status.mjs <videoId> [videoId...]');
}

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
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,processingDetails&id=${videoIds.join(',')}`,
  { headers: { authorization: `Bearer ${accessToken}` } },
);

if (!response.ok) {
  throw new Error(await response.text());
}

const data = await response.json();
process.stdout.write(`${JSON.stringify((data.items || []).map((item) => ({
  id: item.id,
  title: item.snippet?.title,
  privacyStatus: item.status?.privacyStatus,
  uploadStatus: item.status?.uploadStatus,
  processingStatus: item.processingDetails?.processingStatus || null,
  processingFailureReason: item.processingDetails?.processingFailureReason || null,
  thumbnails: item.snippet?.thumbnails,
})), null, 2)}\n`);
