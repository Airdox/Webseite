import { test, expect } from '@playwright/test';

test.describe('Flight Deck Assistant', () => {
  test('assistant answers tool-specific questions', async ({ page }) => {
    await page.goto('/desktop.html');
    await page.getByRole('button', { name: /AI Assistant/i }).click();
    await page.getByPlaceholder(/Frage stellen/i).fill('Wie behebe ich einen Datenbankfehler?');
    await page.getByRole('button', { name: /Senden/i }).click();

    await expect(page.getByText(/DATABASE_URL|NEON_DATABASE_URL|POSTGRES_URL/i)).toBeVisible();
  });
});

