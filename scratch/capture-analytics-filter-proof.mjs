import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd();
const outDir = path.join(root, 'docs', 'proof');
const baseUrl = 'http://127.0.0.1:4174/desktop.html';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async (retries = 50) => {
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(baseUrl, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // ignore until ready
    }
    await sleep(400);
  }
  throw new Error('Vite dev server did not start in time.');
};

const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4174'], {
  cwd: root,
  shell: true,
  stdio: 'pipe',
});

dev.stdout.on('data', () => {});
dev.stderr.on('data', () => {});

try {
  await mkdir(outDir, { recursive: true });
  await waitForServer();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Analytics' }).click();
  await page.getByRole('button', { name: 'Aktualisieren' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'analytics-filter-before.png'), fullPage: true });

  const selects = page.getByRole('combobox');
  await selects.nth(1).selectOption('desktop');
  await selects.nth(2).selectOption('DE');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, 'analytics-filter-after-country-device.png'), fullPage: true });

  await selects.nth(0).selectOption('play');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, 'analytics-filter-after-event.png'), fullPage: true });

  await browser.close();
} finally {
  dev.kill('SIGTERM');
}
