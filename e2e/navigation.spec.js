import { test, expect } from '@playwright/test';

test.describe('AIRDOX Website E2E', () => {
  test('has standard professional metadata', async ({ page }) => {
    await page.goto('/');

    // Expect appropriate title
    await expect(page).toHaveTitle(/AIRDOX/);

    // Expect specific meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /AIRDOX liefert dunklen, industriellen Techno/);

    // Expect standard JSON-LD
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();
  });

  test('navigation sections render and scroll correctly', async ({ page }) => {
    await page.goto('/');

    // Check main sections exist
    await expect(page.locator('#home')).toBeVisible();

    // Check nav links
    const aboutLink = page.locator('.nav-link', { hasText: 'ABOUT' }).or(page.locator('.nav-link', { hasText: 'ÜBER' }));
    await expect(aboutLink).toBeVisible();

    // Because it relies on smooth scrolling and lazy loading, we wait explicitly
    await page.getByRole('button', { name: 'Go to home section' }).click();
    await expect(page.locator('.hero')).toBeVisible();
    
    // We scroll down programmatically to test section visibility
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(1000); // Give lazy load time
  });
  
  test('global player controls exist', async ({ page }) => {
    await page.goto('/');
    
    // Ensure the audio controller renders
    const playButton = page.locator('.gp-play-btn');
    // Initially mostly hidden/bottom in some responsive states but attached
    await expect(playButton).toBeAttached();
  });
});
