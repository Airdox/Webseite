import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

for (const envPath of ['.env', '.env.local', '.env.social.local']) {
  dotenv.config({ path: envPath, quiet: true, override: true });
}

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const hit = args.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};
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
const graphVersion = getEnv('META_GRAPH_VERSION') || 'v24.0';
const graphBase = `https://graph.facebook.com/${graphVersion}`;

const required = [
  'META_PAGE_ACCESS_TOKEN',
  'FACEBOOK_PAGE_ID',
  'INSTAGRAM_BUSINESS_ACCOUNT_ID',
];

const status = Object.fromEntries(required.map((key) => [key, Boolean(getEnv(key))]));

if (hasFlag('--check')) {
  process.stdout.write(`${JSON.stringify({
    ok: Object.values(status).every(Boolean),
    graphVersion,
    env: status,
    envFiles: ['.env', '.env.local', '.env.social.local'],
    required,
  }, null, 2)}\n`);
  process.exit(0);
}

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const missing = required.filter((key) => !getEnv(key));
if (missing.length) {
  fail(`Missing Meta env vars: ${missing.join(', ')}. Run with --check for setup status.`);
}

const token = getEnv('META_PAGE_ACCESS_TOKEN');
const platform = getArg('--platform', 'instagram').toLowerCase();
const videoUrl = getArg('--video-url');
const captionPath = getArg('--caption-file');
const caption = getArg('--caption') || (captionPath ? readFileSync(captionPath, 'utf8').replace(/^# .+\r?\n\r?\n/, '').trim() : '');
const dryRun = hasFlag('--dry-run');

if (!videoUrl) fail('Missing --video-url=<public-mp4-url>. Meta publishing requires a public, direct MP4 URL.');
if (!caption) fail('Missing --caption=<text> or --caption-file=<path>.');

const postForm = async (path, body) => {
  const response = await fetch(`${graphBase}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...body, access_token: token }),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`Meta API failed ${response.status} ${path}: ${JSON.stringify(data)}`);
  }
  return data;
};

const getJson = async (path, query = {}) => {
  const url = new URL(`${graphBase}${path}`);
  for (const [key, value] of Object.entries({ ...query, access_token: token })) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`Meta API failed ${response.status} ${path}: ${JSON.stringify(data)}`);
  }
  return data;
};

const waitForInstagramContainer = async (containerId) => {
  const started = Date.now();
  const timeoutMs = Number(getArg('--timeout-ms', '600000'));
  while (Date.now() - started < timeoutMs) {
    const data = await getJson(`/${containerId}`, { fields: 'status_code,status' });
    const statusCode = data.status_code || data.status;
    if (statusCode === 'FINISHED') return data;
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw new Error(`Instagram container failed: ${JSON.stringify(data)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  throw new Error(`Instagram container did not finish within ${timeoutMs}ms.`);
};

const publishInstagramReel = async () => {
  const igId = getEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const createBody = {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    share_to_feed: getArg('--share-to-feed', 'true'),
  };

  if (dryRun) {
    return {
      dryRun: true,
      platform: 'instagram',
      endpoint: `/${igId}/media -> /${igId}/media_publish`,
      createBody: { ...createBody, caption: `${caption.slice(0, 120)}${caption.length > 120 ? '...' : ''}` },
    };
  }

  const created = await postForm(`/${igId}/media`, createBody);
  const containerId = created.id;
  if (!containerId) throw new Error(`Instagram container response did not include id: ${JSON.stringify(created)}`);

  const containerStatus = await waitForInstagramContainer(containerId);
  const published = await postForm(`/${igId}/media_publish`, { creation_id: containerId });
  return {
    platform: 'instagram',
    containerId,
    containerStatus,
    published,
  };
};

const publishFacebookReel = async () => {
  const pageId = getEnv('FACEBOOK_PAGE_ID');
  const title = getArg('--facebook-title', caption.split(/\r?\n/).find(Boolean) || 'AIRDOX update').slice(0, 255);
  const createBody = {
    file_url: videoUrl,
    description: caption,
    title,
    published: getArg('--published', 'true'),
  };
  if (dryRun) {
    return {
      dryRun: true,
      platform: 'facebook',
      endpoint: `/${pageId}/videos`,
      createBody: { ...createBody, description: `${caption.slice(0, 120)}${caption.length > 120 ? '...' : ''}` },
    };
  }

  const published = await postForm(`/${pageId}/videos`, createBody);
  return {
    platform: 'facebook',
    published,
  };
};

const results = [];
if (platform === 'instagram' || platform === 'both') {
  results.push(await publishInstagramReel());
}
if (platform === 'facebook' || platform === 'both') {
  results.push(await publishFacebookReel());
}
if (!['instagram', 'facebook', 'both'].includes(platform)) {
  fail('Unsupported --platform. Use instagram, facebook, or both.');
}

process.stdout.write(`${JSON.stringify({ status: 'ok', results }, null, 2)}\n`);
