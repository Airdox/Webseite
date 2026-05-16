#!/usr/bin/env node
import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { URL } from 'node:url';

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getArg = (name, fallback = '') => {
  const prefix = `${name}=`;
  const raw = args.find((entry) => entry.startsWith(prefix));
  return raw ? raw.slice(prefix.length).trim() : fallback;
};

const clientId = process.env.YOUTUBE_CLIENT_ID || getArg('--client-id');
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || getArg('--client-secret');
const port = Number(getArg('--port', '53682'));
const host = '127.0.0.1';
const redirectUri = `http://${host}:${port}/oauth2/callback`;
const scope = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
].join(' ');

if (!clientId || !clientSecret) {
  throw new Error('Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET');
}

const codeVerifier = randomBytes(48).toString('base64url');
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
const state = randomBytes(16).toString('hex');

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', scope);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

const waitForCode = () => new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${host}:${port}`);
    if (reqUrl.pathname !== '/oauth2/callback') {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const incomingState = reqUrl.searchParams.get('state');
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');

    if (error) {
      res.statusCode = 400;
      res.end(`OAuth error: ${error}`);
      server.close();
      reject(new Error(`OAuth error: ${error}`));
      return;
    }

    if (!code || incomingState !== state) {
      res.statusCode = 400;
      res.end('Invalid OAuth callback');
      server.close();
      reject(new Error('Invalid OAuth callback: missing code or state mismatch'));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h2>OAuth success. You can close this tab.</h2></body></html>');
    server.close();
    resolve(code);
  });

  server.listen(port, host, () => {});
  server.on('error', (err) => reject(err));
});

const exchangeCode = async (code) => {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }
  return response.json();
};

process.stdout.write('\nOpen this URL in your browser and approve access:\n');
process.stdout.write(`${authUrl.toString()}\n\n`);

const code = await waitForCode();
const tokenData = await exchangeCode(code);

if (!tokenData.refresh_token) {
  throw new Error('No refresh_token returned. Re-run and ensure consent prompt is granted.');
}

process.stdout.write('OAuth token setup complete.\n\n');
process.stdout.write('Add these to your environment:\n');
process.stdout.write(`YOUTUBE_CLIENT_ID=${clientId}\n`);
process.stdout.write(`YOUTUBE_CLIENT_SECRET=${clientSecret}\n`);
process.stdout.write(`YOUTUBE_REFRESH_TOKEN=${tokenData.refresh_token}\n`);
