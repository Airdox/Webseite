import { test, expect } from '@playwright/test';

test.describe('AIRDOX Flight Deck', () => {
  test('desktop surface loads in mock mode and demo import works', async ({ page }) => {
    await page.goto('/desktop.html');

    await expect(page.locator('h1')).toContainText('Flight Deck');
    await expect(page.getByText('Mock API')).toBeVisible();

    await page.getByRole('button', { name: /Set Import/i }).click();
    await page.getByRole('button', { name: /Demo Import/i }).click();

    await expect(page.locator('input').filter({ hasText: '' }).first()).toBeVisible();
    await expect(page.locator('input[value="recording_2026_05_01"]')).toBeVisible();
  });

  test('data explorer validates dropdowns, browser SQL blocking and table output', async ({ page }) => {
    await page.goto('/desktop.html');

    await page.getByRole('button', { name: /^Data Explorer$/i }).click();
    await expect(page.getByText('NO SQL MOCK')).toBeVisible();

    await page.getByLabel('Tabelle').selectOption('subscribers');
    await expect(page.getByText('vip@airdox.info')).toBeVisible();

    await page.getByLabel('Tabelle').selectOption('track_stats');
    await page.getByRole('button', { name: /Live \(ohne VIP\)/i }).click();
    await expect(page.locator('.fd-record-card').first()).toBeVisible();

    await page.getByRole('button', { name: /Run Query/i }).click();
    await expect(page.getByText(/Read-only SQL braucht die Windows-App/i)).toBeVisible();
  });

  test('settings, monitor and batch buttons execute visible actions', async ({ page }) => {
    await page.goto('/desktop.html');

    await page.getByRole('button', { name: /^Advanced Settings$/i }).click();
    await page.getByLabel('Deploy Strategy').selectOption('manual');
    await page.getByRole('button', { name: /^Speichern$/i }).click();
    await expect(page.getByText('Erfolgreich gespeichert!')).toBeVisible();

    await page.goto('/desktop.html');
    await page.getByRole('button', { name: /^System Monitor$/i }).dispatchEvent('click');
    await expect(page.getByRole('heading', { name: 'System Monitor' }).first()).toBeVisible();
    await page.getByRole('button', { name: /Cache löschen/i }).dispatchEvent('click');
    await expect(page.getByText(/Cache geloescht/i)).toBeVisible();
    await page.getByRole('button', { name: /Optimieren/i }).dispatchEvent('click');
    await expect(page.getByText(/System optimiert/i)).toBeVisible();

    await page.getByRole('button', { name: /^Batch Import$/i }).dispatchEvent('click');
    await expect(page.getByRole('heading', { name: 'Batch Import' }).first()).toBeVisible();
    await page.getByRole('button', { name: /Oder Dateien waehlen/i }).dispatchEvent('click');
    await expect(page.getByText(/Batch braucht echte Dateipfade/i)).toBeVisible();
  });
});
