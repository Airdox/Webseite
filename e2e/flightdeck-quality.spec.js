import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.describe('Flight Deck Quality', () => {
  test('analytics refuses mock data in browser mode', async ({ page }) => {
    await page.goto('/desktop.html');
    await page.getByRole('button', { name: 'Analytics', exact: true }).click();
    await page.getByRole('button', { name: /Filter anwenden/i }).first().click();

    const totalViews = page.locator('.fd-metric-value').first();
    await expect(totalViews).toHaveText('0');
    await expect(page.getByText('NO MOCK DATA')).toBeVisible();
    await expect(page.getByText(/Keine echten Play-Events geladen/i)).toBeVisible();
  });

  test('data explorer JSON export creates a downloadable file with visible rows', async ({ page }) => {
    await page.goto('/desktop.html');
    await page.getByRole('button', { name: /^Data Explorer$/i }).click();
    await expect(page.getByText('NO SQL MOCK')).toBeVisible();

    await page.getByLabel('Tabelle').selectOption('subscribers');
    await expect(page.getByText('vip@airdox.info')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^JSON$/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^subscribers-\d{4}-\d{2}-\d{2}\.json$/);
    const filePath = await download.path();
    const content = await readFile(filePath, 'utf8');
    const rows = JSON.parse(content);
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: 'vip@airdox.info', status: 'active' }),
    ]));
  });
});
