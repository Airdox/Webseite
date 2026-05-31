#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

for (const envPath of ['.env', '.env.local', '.env.social.local']) {
  dotenv.config({ path: envPath, quiet: true, override: true });
}

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);

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

const required = [
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
  'TIKTOK_REFRESH_TOKEN',
];

const summarizeError = (data) => ({
  code: data?.error?.code || data?.error || data?.error_code || '',
  message: data?.error?.message || data?.message || data?.error_description || '',
  logId: data?.error?.log_id || data?.log_id || '',
});

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
  return { response, data };
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
  return { response, data };
};

const initializeSelfOnlyPostWithoutUpload = async (accessToken, privacyLevel) => {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: 'AIRDOX API readiness check - no media uploaded',
        privacy_level: privacyLevel,
        disable_duet: true,
        disable_comment: true,
        disable_stitch: true,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 1024,
        chunk_size: 1024,
        total_chunk_count: 1,
      },
    }),
  });
  const data = await readJsonResponse(response);
  return { response, data };
};

const missing = required.filter((key) => !getEnv(key));
if (missing.length) {
  process.stdout.write(`${JSON.stringify({
    ok: false,
    step: 'env',
    missing,
    message: 'TikTok credentials are incomplete.',
  }, null, 2)}\n`);
  process.exit(1);
}

const tokenResult = await refreshAccessToken();
const tokenData = tokenResult.data;
const scope = String(tokenData.scope || '');
const scopeChecks = {
  userInfoBasic: scope.split(',').includes('user.info.basic') || scope.split(' ').includes('user.info.basic'),
  videoUpload: scope.split(',').includes('video.upload') || scope.split(' ').includes('video.upload'),
  videoPublish: scope.split(',').includes('video.publish') || scope.split(' ').includes('video.publish'),
};

const tokenSummary = {
  step: 'refresh_token',
  httpStatus: tokenResult.response.status,
  ok: tokenResult.response.ok && !tokenData.error && Boolean(tokenData.access_token),
  error: summarizeError(tokenData),
  hasAccessToken: Boolean(tokenData.access_token),
  hasRefreshToken: Boolean(tokenData.refresh_token),
  openIdPresent: Boolean(tokenData.open_id),
  expiresIn: tokenData.expires_in || null,
  refreshExpiresIn: tokenData.refresh_expires_in || null,
  scope,
  scopeChecks,
};

const result = {
  ok: false,
  livePostAttempted: false,
  initOnlyAttempted: false,
  token: tokenSummary,
  creatorInfo: null,
  initOnly: null,
  verdict: '',
  nextAction: '',
};

if (!tokenSummary.ok) {
  result.verdict = 'blocked';
  result.nextAction = 'Refresh token is invalid or expired. Re-run TikTok OAuth.';
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(1);
}

const creatorResult = await queryCreatorInfo(tokenData.access_token);
const creatorData = creatorResult.data;
const creatorError = summarizeError(creatorData);
const creatorInfo = creatorData.data || {};
const privacyLevelOptions = Array.isArray(creatorInfo.privacy_level_options)
  ? creatorInfo.privacy_level_options
  : [];

result.creatorInfo = {
  step: 'creator_info_query',
  httpStatus: creatorResult.response.status,
  ok: creatorResult.response.ok && creatorData.error?.code === 'ok',
  error: creatorError,
  creatorUsernamePresent: Boolean(creatorInfo.creator_username),
  creatorNicknamePresent: Boolean(creatorInfo.creator_nickname),
  privacyLevelOptions,
  maxVideoPostDurationSec: creatorInfo.max_video_post_duration_sec || null,
};

if (!result.creatorInfo.ok) {
  result.verdict = 'blocked';
  result.nextAction = scopeChecks.videoPublish
    ? 'Creator info failed despite video.publish scope. Check TikTok app review status and log_id in TikTok support.'
    : 'Re-authorize TikTok OAuth after the app is approved for video.publish or video.upload. Current token cannot post.';
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(1);
}

if (hasFlag('--init-only')) {
  result.initOnlyAttempted = true;
  const privacyLevel = privacyLevelOptions.includes('SELF_ONLY')
    ? 'SELF_ONLY'
    : privacyLevelOptions[0];
  const initResult = await initializeSelfOnlyPostWithoutUpload(tokenData.access_token, privacyLevel);
  const initData = initResult.data;
  result.initOnly = {
    step: 'video_init_no_upload',
    httpStatus: initResult.response.status,
    ok: initResult.response.ok && initData.error?.code === 'ok' && Boolean(initData.data?.upload_url),
    error: summarizeError(initData),
    publishIdPresent: Boolean(initData.data?.publish_id),
    uploadUrlReceived: Boolean(initData.data?.upload_url),
    privacyLevel,
  };

  if (!result.initOnly.ok) {
    result.verdict = 'blocked';
    result.nextAction = 'TikTok accepted creator info but rejected video initialization. Check the returned error.';
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(1);
  }
}

result.ok = true;
result.verdict = hasFlag('--init-only')
  ? 'posting_init_ready_no_media_uploaded'
  : 'posting_scope_ready_no_live_post_attempted';
result.nextAction = hasFlag('--init-only')
  ? 'A real uploader can now send the approved MP4 to the returned upload URL, after explicit user approval.'
  : 'Run again with --init-only for a no-media-upload initialization proof, then implement/execute the real uploader after explicit user approval.';

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
