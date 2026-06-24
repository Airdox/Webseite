import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = resolve('.');
const outDir = join(root, 'docs', 'auth-workflow-proof');
const port = Number(process.env.AUTH_PROOF_PORT || 5179);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshot = (name) => join(outDir, name);

const waitForServer = async (url, timeoutMs = 45000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server not ready yet.
    }
    await new Promise((resolveTimer) => setTimeout(resolveTimer, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const startVite = () => {
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    env: {
      ...process.env,
      VITE_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return child;
};

const stopServer = async (server) => {
  if (!server || server.killed) return;
  server.stdout?.destroy();
  server.stderr?.destroy();
  const exited = new Promise((resolveExit) => {
    server.once('exit', resolveExit);
    server.once('error', resolveExit);
  });
  server.kill();
  await Promise.race([
    exited,
    new Promise((resolveTimer) => setTimeout(resolveTimer, 3000)),
  ]);
};

const installApiProofRoutes = async (context) => {
  await context.route('https://challenges.cloudflare.com/turnstile/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.turnstile = {
          render: function (element, options) {
            element.innerHTML = '<div style="border:1px solid #00f5ff;border-radius:8px;padding:12px;color:#00f5ff;font-family:monospace;text-align:center">Turnstile proof verified</div>';
            setTimeout(function () { options.callback && options.callback('proof-turnstile-token'); }, 80);
            return 'proof-widget';
          },
          remove: function () {}
        };
      `,
    });
  });

  await context.route('**/api/oauth/config', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, providers: ['google', 'facebook'] }),
    });
  });

  await context.route('**/api/register', async (route) => {
    const payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        message: 'User registered successfully',
        proof: {
          username: payload.username,
          email: payload.email,
          captchaToken: Boolean(payload.captchaToken),
        },
      }),
    });
  });

  await context.route('**/api/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        token: 'proof-password-token',
        user: { id: 101, username: 'proof_user', email: 'proof.user@airdox.local' },
      }),
    });
  });

  await context.route('**/api/auth', async (route) => {
    const payload = route.request().postDataJSON();
    const token = payload.token || '';
    await route.fulfill({
      status: token ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(token
        ? {
            ok: true,
            user: {
              id: token.includes('google') ? 202 : token.includes('facebook') ? 303 : 101,
              username: token.includes('google')
                ? 'google_local_dev'
                : token.includes('facebook')
                  ? 'facebook_local_dev'
                  : 'proof_user',
              email: token.includes('google')
                ? 'dev_google@social.airdox.local'
                : token.includes('facebook')
                  ? 'dev_facebook@social.airdox.local'
                  : 'proof.user@airdox.local',
            },
          }
        : { ok: false, error: 'No token provided' }),
    });
  });

  await context.route('**/api/oauth/start**', async (route) => {
    const url = new URL(route.request().url());
    const provider = url.searchParams.get('provider') || 'google';
    const origin = url.searchParams.get('origin') || baseUrl;
    const token = `proof-${provider}-token`;
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html><head><meta charset="utf-8"><title>AIRDOX ${provider} OAuth Proof</title></head><body>
        <script>
          localStorage.setItem('airdox_token', ${JSON.stringify(token)});
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              source: 'airdox-oauth',
              ok: true,
              token: ${JSON.stringify(token)},
              provider: ${JSON.stringify(provider)},
              mock: true
            }, ${JSON.stringify(origin)});
          }
          setTimeout(function () { window.close(); }, 80);
        </script>
      </body></html>`,
    });
  });

  await context.route('**/api/stats', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await context.route('**/api/audience-events', async (route) => {
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true, stored: true }) });
  });
};

const openHome = async (page) => {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.nav-action-login', { state: 'visible' });
  await page.waitForTimeout(300);
};

const openAuth = async (page, mode) => {
  await page.click(mode === 'login' ? '.nav-action-login' : '.nav-action-register');
  await page.waitForSelector('.modal-content', { state: 'visible' });
  await page.waitForTimeout(250);
};

const captureVipState = async (page, fileName) => {
  await page.locator('#vip').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#vip')?.innerText.includes('WILLKOMMEN'));
  await page.screenshot({ path: screenshot(fileName), fullPage: true });
};

await mkdir(outDir, { recursive: true });

const server = startVite();
try {
  await waitForServer(baseUrl);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  await installApiProofRoutes(context);
  const page = await context.newPage();

  await openHome(page);
  await openAuth(page, 'login');
  await page.screenshot({ path: screenshot('01-login-modal-social-options.png'), fullPage: true });

  await page.click('button.modal-tab:has-text("REGISTRIEREN")');
  await page.fill('#auth-username', 'proof_user');
  await page.fill('#auth-email', 'proof.user@airdox.local');
  await page.fill('#auth-password', 'ProofPassword123!');
  await page.waitForSelector('text=Turnstile proof verified');
  await page.screenshot({ path: screenshot('02-registration-form-captcha-verified.png'), fullPage: true });
  await page.click('button:has-text("Konto erstellen")');
  await page.waitForSelector('text=Registrierung erfolgreich');
  await page.screenshot({ path: screenshot('03-registration-success-login-ready.png'), fullPage: true });

  await page.fill('#auth-email', 'proof.user@airdox.local');
  await page.fill('#auth-password', 'ProofPassword123!');
  await page.click('button:has-text("Einloggen")');
  await page.waitForSelector('text=Anmeldung erfolgreich');
  await page.screenshot({ path: screenshot('04-password-login-success.png'), fullPage: true });
  await captureVipState(page, '05-authenticated-vip-user-password-login.png');

  await page.evaluate(() => localStorage.removeItem('airdox_token'));
  await openHome(page);
  await openAuth(page, 'login');
  await page.getByLabel('Weiter mit Google').click();
  await page.waitForFunction(() => localStorage.getItem('airdox_token') === 'proof-google-token');
  await captureVipState(page, '06-authenticated-vip-user-google-social-login.png');

  await page.evaluate(() => localStorage.removeItem('airdox_token'));
  await openHome(page);
  await openAuth(page, 'login');
  await page.getByLabel('Weiter mit Facebook').click();
  await page.waitForFunction(() => localStorage.getItem('airdox_token') === 'proof-facebook-token');
  await captureVipState(page, '07-authenticated-vip-user-facebook-social-login.png');

  await browser.close();

  const markdown = `# Auth Workflow Proof

Generated: ${new Date().toISOString()}

This proof run drives the real AIRDOX React UI in Chromium and mocks only external services: Turnstile, API auth responses, and the Google/Facebook OAuth popup callback. The screenshots prove the UI contract from registration through authenticated VIP access.

## Evidence

1. Login modal with configured social providers: [01-login-modal-social-options.png](01-login-modal-social-options.png)
2. Registration form with CAPTCHA token: [02-registration-form-captcha-verified.png](02-registration-form-captcha-verified.png)
3. Registration success and automatic return to login: [03-registration-success-login-ready.png](03-registration-success-login-ready.png)
4. Password login success: [04-password-login-success.png](04-password-login-success.png)
5. Authenticated VIP user after password login: [05-authenticated-vip-user-password-login.png](05-authenticated-vip-user-password-login.png)
6. Authenticated VIP user after Google social login callback: [06-authenticated-vip-user-google-social-login.png](06-authenticated-vip-user-google-social-login.png)
7. Authenticated VIP user after Facebook social login callback: [07-authenticated-vip-user-facebook-social-login.png](07-authenticated-vip-user-facebook-social-login.png)

## Re-run

\`\`\`powershell
node scripts/capture-auth-workflow-proof.mjs
\`\`\`
`;
  await writeFile(join(outDir, 'README.md'), markdown, 'utf8');
} finally {
  await stopServer(server);
}
