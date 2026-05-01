import { test, expect } from '@playwright/test';

test.describe('Flight Deck Quality', () => {
  test('analytics filters change KPI values', async ({ page }) => {
    await page.goto('/desktop.html');
    await page.getByRole('button', { name: /Analytics/i }).click();
    await page.getByRole('button', { name: /Aktualisieren/i }).click();

    const totalViews = page.locator('.fd-metric-value').first();
    await expect(totalViews).toHaveText('9');

    const selects = page.getByRole('combobox');
    await selects.nth(1).selectOption('desktop');
    await selects.nth(2).selectOption('DE');
    await expect(totalViews).toHaveText('3');

    await selects.nth(0).selectOption('play');
    await expect(totalViews).toHaveText('1');
  });
});
