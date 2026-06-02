#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

for (const envPath of ['.env', '.env.local', '.env.social.local']) {
  dotenv.config({ path: envPath, quiet: true, override: true });
}

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
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
const fail = (message) => {
  throw new Error(message);
};

const videoPath = resolve(getArg('--video', 'public/social/pfingsten-full-set-now-on-youtube-instagram-facebook-reel-qr.mp4'));
const poll = args.includes('--poll');
const statusOnlyPublishId = getArg('--status');

const required = ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REFRESH_TOKEN'];
const missing = required.filter((key) => !getEnv(key));
if (missing.length) fail(`Missing TikTok environment values: ${missing.join(', ')}`);
if (!existsSync(videoPath)) fail(`Video file not found: ${videoPath}`);

const readJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
};

const refreshAccessToken = async () => {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: getEnv('TIKTOK_CLIENT_KEY'),
      client_secret: getEnv('TIKTOK_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: getEnv('TIKTOK_REFRESH_TOKEN'),
    }),
  });
  const data = await readJsonResponse(response);
  if (!response.ok || data.error || !data.access_token) {
    fail(`TikTok token refresh failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data.access_token;
};

const initializeInboxUpload = async (accessToken, size) => {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: size,
        chunk_size: size,
        total_chunk_count: 1,
      },
    }),
  });
  const data = await readJsonResponse(response);
  if (!response.ok || data.error?.code !== 'ok' || !data.data?.upload_url || !data.data?.publish_id) {
    fail(`TikTok inbox upload init failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data.data;
};

const contentTypeByExt = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.mov' || ext === '.qt') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return 'video/mp4';
};

const uploadVideoChunk = async ({ uploadUrl, videoPath: filePath, size }) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentTypeByExt(filePath),
      'Content-Length': String(size),
      'Content-Range': `bytes 0-${size - 1}/${size}`,
    },
    body: createReadStream(filePath),
    duplex: 'half',
  });
  const text = await response.text();
  if (!response.ok) {
    fail(`TikTok video upload failed (${response.status}): ${text.slice(0, 500)}`);
  }
  return { httpStatus: response.status, responseText: text.slice(0, 200) };
};

const fetchStatus = async (accessToken, publishId) => {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = await readJsonResponse(response);
  return { httpStatus: response.status, ok: response.ok && data.error?.code === 'ok', data };
};

const accessToken = await refreshAccessToken();
if (statusOnlyPublishId) {
  const status = await fetchStatus(accessToken, statusOnlyPublishId);
  process.stdout.write(`${JSON.stringify({
    ok: status.ok,
    mode: 'tiktok_status_only',
    publishId: statusOnlyPublishId,
    status,
  }, null, 2)}\n`);
  process.exit(status.ok ? 0 : 1);
}

const size = statSync(videoPath).size;
const init = await initializeInboxUpload(accessToken, size);
const upload = await uploadVideoChunk({ uploadUrl: init.upload_url, videoPath, size });

const statusChecks = [];
if (poll) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (attempt > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
    const status = await fetchStatus(accessToken, init.publish_id);
    statusChecks.push(status);
    const statusValue = status.data?.data?.status;
    if (['SEND_TO_USER_INBOX', 'PUBLISH_COMPLETE', 'FAILED'].includes(statusValue)) break;
  }
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  mode: 'tiktok_inbox_upload',
  livePostAttempted: false,
  userActionRequiredInTikTok: true,
  videoPath,
  videoSize: size,
  publishId: init.publish_id,
  upload,
  statusChecks,
  nextAction: 'Open TikTok notifications/inbox and complete or discard the uploaded draft in TikTok.',
}, null, 2)}\n`);
