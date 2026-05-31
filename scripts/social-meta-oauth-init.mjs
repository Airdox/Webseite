import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
for (const envPath of ['.env', '.env.local', '.env.social.local']) {
  dotenv.config({ path: join(root, envPath), quiet: true, override: true });
}

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const hit = args.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
};
const hasFlag = (name) => args.includes(name);
const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const graphVersion = process.env.META_GRAPH_VERSION || getArg('--graph-version', 'v24.0');
const appId = process.env.META_APP_ID || getArg('--app-id');
const appSecret = process.env.META_APP_SECRET || getArg('--app-secret');
const port = Number(getArg('--port', '53683'));
const host = getArg('--host', '127.0.0.1');
const redirectUri = getArg('--redirect-uri', `http://${host}:${port}/oauth/meta/callback`);
const callbackUrl = getArg('--callback-url');
const codeArg = getArg('--code');
const pageName = getArg('--page-name').toLowerCase();
const pageIdArg = getArg('--page-id');
const state = getArg('--state', randomBytes(16).toString('hex'));
const scope = getArg('--scope', [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
].join(','));

if (!appId || !appSecret) {
  fail([
    'Missing META_APP_ID or META_APP_SECRET.',
    'Add them to .env.social.local or pass --app-id=<id> --app-secret=<secret>.',
    `Expected local secret file: ${join(root, '.env.social.local')}${existsSync(join(root, '.env.social.local')) ? '' : ' (not found yet)'}`,
  ].join('\n'));
}

const graphUrl = (path) => `https://graph.facebook.com/${graphVersion}${path}`;

const parseCallbackCode = () => {
  if (codeArg) return codeArg;
  if (!callbackUrl) return '';
  const parsed = new URL(callbackUrl);
  const error = parsed.searchParams.get('error') || parsed.searchParams.get('error_message');
  if (error) fail(`Meta OAuth callback returned an error: ${error}`);
  const incomingState = parsed.searchParams.get('state');
  if (incomingState && incomingState !== state && !hasFlag('--ignore-state')) {
    fail('Meta OAuth callback state does not match. Re-run with the callback URL from the current OAuth URL, or pass --ignore-state if you verified it manually.');
  }
  return parsed.searchParams.get('code') || '';
};

const waitForCode = () => new Promise((resolveCode, reject) => {
  const server = createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${host}:${port}`);
    if (reqUrl.pathname !== new URL(redirectUri).pathname) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    const incomingState = reqUrl.searchParams.get('state');
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error') || reqUrl.searchParams.get('error_message');

    if (error) {
      res.statusCode = 400;
      res.end(`Meta OAuth error: ${error}`);
      server.close();
      reject(new Error(`Meta OAuth error: ${error}`));
      return;
    }

    if (!code || incomingState !== state) {
      res.statusCode = 400;
      res.end('Invalid Meta OAuth callback');
      server.close();
      reject(new Error('Invalid Meta OAuth callback: missing code or state mismatch'));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h2>Meta OAuth success. You can close this tab.</h2></body></html>');
    server.close();
    resolveCode(code);
  });

  server.listen(port, host, () => {
    process.stdout.write(`Waiting for Meta OAuth callback on ${redirectUri}\n`);
  });
});

const requestJson = async (url) => {
  const response = await fetch(url);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok || data.error) {
    throw new Error(`Meta API request failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
};

const exchangeCode = async (code) => {
  const url = new URL(graphUrl('/oauth/access_token'));
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);
  return requestJson(url);
};

const exchangeLongLivedUserToken = async (shortLivedToken) => {
  const url = new URL(graphUrl('/oauth/access_token'));
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortLivedToken);
  return requestJson(url);
};

const loadPages = async (accessToken) => {
  const url = new URL(graphUrl('/me/accounts'));
  url.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username}');
  url.searchParams.set('access_token', accessToken);
  return requestJson(url);
};

const selectPage = (pages) => {
  if (!Array.isArray(pages) || pages.length === 0) {
    fail('No Facebook Pages returned for this account. Confirm Page access and requested OAuth scopes.');
  }
  if (pageIdArg) {
    const page = pages.find((entry) => String(entry.id) === String(pageIdArg));
    if (!page) fail(`No returned page matched --page-id=${pageIdArg}.`);
    return page;
  }
  if (pageName) {
    const page = pages.find((entry) => String(entry.name || '').toLowerCase().includes(pageName));
    if (!page) fail(`No returned page matched --page-name=${pageName}.`);
    return page;
  }
  const withInstagram = pages.find((entry) => entry.instagram_business_account?.id);
  return withInstagram || pages[0];
};

const authUrl = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
authUrl.searchParams.set('client_id', appId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', scope);

let code = parseCallbackCode();
if (!code) {
  process.stdout.write('\nOpen this URL in your browser and approve Meta publishing access:\n');
  process.stdout.write(`${authUrl.toString()}\n\n`);
  process.stdout.write('If your Meta app does not allow the local redirect URI, copy the final callback URL and run:\n');
  process.stdout.write(`node scripts/social-meta-oauth-init.mjs --callback-url="<full callback url>" --state=${state}\n\n`);
  process.stdout.write(`Redirect URI that must be allowed in Meta App settings: ${redirectUri}\n`);
  process.stdout.write(`Requested scope: ${scope}\n\n`);
  code = await waitForCode();
}

const shortToken = await exchangeCode(code);
const longToken = await exchangeLongLivedUserToken(shortToken.access_token);
const pageData = await loadPages(longToken.access_token);
const selectedPage = selectPage(pageData.data || []);
const igAccount = selectedPage.instagram_business_account || null;

process.stdout.write('\nMeta OAuth setup complete.\n\n');
process.stdout.write('Selected page:\n');
process.stdout.write(`${JSON.stringify({
  pageId: selectedPage.id,
  pageName: selectedPage.name,
  instagramBusinessAccountId: igAccount?.id || '',
  instagramUsername: igAccount?.username || '',
}, null, 2)}\n\n`);

process.stdout.write('Add these to .env.social.local:\n');
process.stdout.write(`META_GRAPH_VERSION=${graphVersion}\n`);
process.stdout.write(`META_PAGE_ACCESS_TOKEN=${selectedPage.access_token}\n`);
process.stdout.write(`FACEBOOK_PAGE_ID=${selectedPage.id}\n`);
process.stdout.write(`INSTAGRAM_BUSINESS_ACCOUNT_ID=${igAccount?.id || ''}\n`);

if (!igAccount?.id) {
  process.stdout.write('\nWarning: selected page has no instagram_business_account. Connect the Instagram Professional account to this Facebook Page in Meta Business Suite, then rerun.\n');
}
