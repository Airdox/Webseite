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
});
