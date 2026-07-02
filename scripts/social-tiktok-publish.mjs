#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

for (const envPath of ['.env', '.env.local', '.env.social.local']) {
  dotenv.config({ path: envPath, quiet: true, override: true });
}

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
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

const videoArg = getArg('--video');
const caption = getArg('--caption', getArg('--title'));
const privacyArg = getArg('--privacy', 'SELF_ONLY').toUpperCase();
const coverTimestampMs = Number(getArg('--cover-ms', '1000'));
const poll = hasFlag('--poll');
const dryRun = hasFlag('--dry-run');
const confirmApproved = hasFlag('--confirm-approved');
const brandContent = hasFlag('--brand-content');
const brandOrganic = !hasFlag('--not-brand-organic');
const isAigc = hasFlag('--aigc');

if (!videoArg) fail('Missing --video=<path-to-approved-mp4>.');
const videoPath = resolve(videoArg);
if (!existsSync(videoPath)) fail(`Video file not found: ${videoPath}`);
if (!caption) fail('Missing --caption="<approved TikTok caption>".');
if (!caption.toLowerCase().includes('airdox.info')) {
  fail('Caption must include airdox.info or a concrete AIRDOX landing URL.');
}
if (!confirmApproved && !dryRun) {
  fail('Direct TikTok posting requires --confirm-approved after the user approved video, caption, privacy, target platform, timing, and landing URL.');
}

const required = ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REFRESH_TOKEN'];
const missing = required.filter((key) => !getEnv(key));
if (missing.length) fail(`Missing TikTok environment values: ${missing.join(', ')}`);

const readJsonResponse = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
};

const summarizeError = (data) => ({
  code: data?.error?.code || data?.error || data?.error_code || '',
  message: data?.error?.message || data?.message || data?.error_description || '',
  logId: data?.error?.log_id || data?.log_id || '',
});

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
  const scope = String(data.scope || '');
  const scopes = scope.split(/[,\s]+/).filter(Boolean);
  if (!scopes.includes('video.publish')) {
    fail(`Current TikTok token lacks video.publish scope. Re-run OAuth after app approval, then replace TIKTOK_REFRESH_TOKEN. Current scope: ${scope || '(empty)'}`);
  }
  return data.access_token;
};

const queryCreatorInfo = async (accessToken) => {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: '{}',
  });
  const data = await readJsonResponse(response);
  if (!response.ok || data.error?.code !== 'ok') {
    fail(`TikTok creator info failed (${response.status}): ${JSON.stringify({
      error: summarizeError(data),
      data: data.data || null,
    })}`);
  }
  return data.data || {};
};

const contentTypeByExt = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.mov' || ext === '.qt') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return 'video/mp4';
};

const initializeDirectPost = async ({ accessToken, size, privacyLevel }) => {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: privacyLevel,
        disable_duet: !hasFlag('--allow-duet'),
        disable_comment: !hasFlag('--allow-comments'),
        disable_stitch: !hasFlag('--allow-stitch'),
        video_cover_timestamp_ms: Number.isFinite(coverTimestampMs) ? coverTimestampMs : 1000,
        brand_content_toggle: brandContent,
        brand_organic_toggle: brandOrganic,
        is_aigc: isAigc,
      },
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
    fail(`TikTok direct post init failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data.data;
};

const uploadVideoChunk = async ({ uploadUrl, size }) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentTypeByExt(videoPath),
      'Content-Length': String(size),
      'Content-Range': `bytes 0-${size - 1}/${size}`,
    },
    body: createReadStream(videoPath),
    duplex: 'half',
  });
  const text = await response.text();
  if (!response.ok) fail(`TikTok video upload failed (${response.status}): ${text.slice(0, 500)}`);
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
const creatorInfo = await queryCreatorInfo(accessToken);
const privacyOptions = Array.isArray(creatorInfo.privacy_level_options)
  ? creatorInfo.privacy_level_options
  : [];
if (!privacyOptions.includes(privacyArg)) {
  fail(`Privacy level ${privacyArg} is not available for this account. Available: ${privacyOptions.join(', ') || '(none)'}`);
}

const size = statSync(videoPath).size;
if (dryRun) {
  process.stdout.write(`${JSON.stringify({
    ok: true,
    mode: 'tiktok_direct_post_dry_run',
    livePostAttempted: false,
    videoPath,
    videoSize: size,
    caption,
    privacyLevel: privacyArg,
    privacyOptions,
    creatorUsernamePresent: Boolean(creatorInfo.creator_username),
    maxVideoPostDurationSec: creatorInfo.max_video_post_duration_sec || null,
    nextAction: 'After explicit approval, re-run without --dry-run and with --confirm-approved.',
  }, null, 2)}\n`);
  process.exit(0);
}

const init = await initializeDirectPost({ accessToken, size, privacyLevel: privacyArg });
const upload = await uploadVideoChunk({ uploadUrl: init.upload_url, size });

const statusChecks = [];
if (poll) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (attempt > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
    const status = await fetchStatus(accessToken, init.publish_id);
    statusChecks.push(status);
    const statusValue = status.data?.data?.status;
    if (['PUBLISH_COMPLETE', 'FAILED'].includes(statusValue)) break;
  }
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  mode: 'tiktok_direct_post',
  livePostAttempted: true,
  approvalConfirmedByCliFlag: true,
  videoPath,
  videoSize: size,
  caption,
  privacyLevel: privacyArg,
  publishId: init.publish_id,
  upload,
  statusChecks,
  nextAction: 'Record the TikTok live URL in docs/agent-system/social-post-ledger.json after TikTok returns or displays it.',
}, null, 2)}\n`);
