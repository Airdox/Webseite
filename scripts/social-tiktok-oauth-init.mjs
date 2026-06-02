#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env'), quiet: true });

const args = process.argv.slice(2);

const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};

const clientKey = process.env.TIKTOK_CLIENT_KEY || getArg('--client-key');
const clientSecret = process.env.TIKTOK_CLIENT_SECRET || getArg('--client-secret');
const redirectUri = getArg('--redirect-uri', 'https://airdox.info/oauth/tiktok/callback');
const scope = getArg('--scope', 'user.info.basic,video.upload,video.publish');
const callbackUrl = getArg('--callback-url');
const codeArg = getArg('--code');
const state = getArg('--state', randomBytes(16).toString('hex'));

const fail = (message) => {
  throw new Error(message);
};

const extractCode = () => {
  if (codeArg) return codeArg;
  if (!callbackUrl) return '';
  const parsed = new URL(callbackUrl);
  const error = parsed.searchParams.get('error') || parsed.searchParams.get('error_description');
  if (error) fail(`TikTok OAuth callback returned an error: ${error}`);
  return parsed.searchParams.get('code') || '';
};

const buildAuthUrl = () => {
  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', clientKey);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  return authUrl.toString();
};

const exchangeCode = async (code) => {
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok || data.error) {
    fail(`TikTok token exchange failed (${response.status}): ${JSON.stringify(data)}`);
  }
  if (!data.refresh_token) {
    fail(`TikTok token response did not include refresh_token: ${JSON.stringify(data)}`);
  }
  return data;
};

if (!clientKey || !clientSecret) {
  const dotenvPath = join(root, '.env');
  fail([
    'Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET.',
    `Add them to ${dotenvPath}${existsSync(dotenvPath) ? '' : ' first'}.`,
  ].join(' '));
}

const code = extractCode();

if (!code) {
  process.stdout.write('\nOpen this URL in your browser and approve access:\n');
  process.stdout.write(`${buildAuthUrl()}\n\n`);
  process.stdout.write('After TikTok redirects to AIRDOX, copy the full callback URL and run:\n');
  process.stdout.write('node scripts/social-tiktok-oauth-init.mjs --callback-url="<full callback url>"\n\n');
  process.stdout.write(`Requested scope: ${scope}\n`);
  process.stdout.write(`Redirect URI: ${redirectUri}\n`);
  process.exit(0);
}

const tokenData = await exchangeCode(code);

process.stdout.write('TikTok OAuth token setup complete.\n\n');
process.stdout.write('Add this to your environment:\n');
process.stdout.write(`TIKTOK_REFRESH_TOKEN=${tokenData.refresh_token}\n`);
process.stdout.write('\nToken metadata:\n');
process.stdout.write(`${JSON.stringify({
  open_id: tokenData.open_id || '',
  scope: tokenData.scope || scope,
  expires_in: tokenData.expires_in || null,
  refresh_expires_in: tokenData.refresh_expires_in || null,
  token_type: tokenData.token_type || '',
}, null, 2)}\n`);
