import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

test.describe('Flight Deck System Monitor – real Electron host services', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let testRoot;
  let electronApp;
  let page;

  test.beforeAll(async () => {
    testRoot = await mkdtemp(path.join(tmpdir(), 'airdox-system-e2e-'));
    const electronEnv = {
      ...process.env,
      FLIGHTDECK_E2E: '1',
      VITE_DEV_SERVER_URL: 'http://127.0.0.1:4173/desktop.html',
    };
    delete electronEnv.ELECTRON_RUN_AS_NODE;

    electronApp = await electron.launch({
      args: ['.', `--user-data-dir=${path.join(testRoot, 'electron-profile')}`],
      env: electronEnv,
    });
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Flight Deck', exact: true })).toBeVisible({ timeout: 30_000 });

    const tutorialClose = page.getByRole('button', { name: 'Tutorial schliessen' });
    await tutorialClose.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    if (await tutorialClose.isVisible().catch(() => false)) {
      await tutorialClose.click();
      await expect(page.getByRole('dialog', { name: 'Interaktive Flight Deck Tour' })).toBeHidden();
    }
  });

  test.afterAll(async () => {
    await electronApp?.close().catch(() => {});
    if (testRoot) await rm(testRoot, { recursive: true, force: true });
  });

  test('reads host metrics and executes cache and storage maintenance through IPC', async () => {
    await page.getByRole('navigation', { name: 'Flight Deck tabs' })
      .getByRole('button', { name: 'System Monitor', exact: true })
      .click();
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'System Monitor', exact: true }),
    ).toBeVisible();

    const metrics = page.locator('.fd-metric-grid-large .fd-metric-value');
    await expect(metrics).toHaveCount(4);
    for (const index of [0, 1, 2]) {
      await expect(metrics.nth(index)).toHaveText(/^\d+(?:\.\d)?%$/);
    }
    await expect(metrics.nth(3)).toHaveText(/^\d+\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Top Prozesse' })).toBeVisible();
    await expect(page.locator('.fd-process-item').first()).toBeVisible();

    await page.getByRole('button', { name: 'Aktualisieren', exact: true }).click();
    await expect(page.locator('.fd-notice')).toHaveText(/System Monitor aktualisiert\./);

    await page.getByRole('button', { name: 'Cache löschen', exact: true }).click();
    await expect(page.locator('.fd-notice')).toHaveText(/Cache geloescht\./);

    await page.getByRole('button', { name: 'Optimieren', exact: true }).click();
    await expect(page.locator('.fd-notice')).toHaveText(/System optimiert\./);
  });
});
