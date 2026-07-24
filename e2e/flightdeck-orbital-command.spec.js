import { test, expect } from '@playwright/test';

const tabs = [
  'Overview', 'Flight Deck', 'Set Import', 'Batch Import', 'Audio Mastering',
  'Marketing Manager', 'Design Agent', 'Analytics', 'Data Explorer',
  'Advanced Settings', 'System Monitor', 'Tutorial', 'AI Assistant',
];

test.describe('Flight Deck Orbital Command shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/desktop.html');
    await expect(page.getByRole('heading', { name: 'Flight Deck' })).toBeVisible();
  });

  test('exposes the versioned shell, overview mission data and guarded live action', async ({ page }) => {
    await expect(page.locator('.fd-orbital-shell')).toHaveAttribute('data-ui-version', 'orbital-command-v1');
    await expect(page.getByText('AIRDOX / ORBITAL COMMAND')).toBeVisible();
    await expect(page.getByLabel('Globaler Systemstatus')).toBeVisible();
    await expect(page.getByRole('button', { name: /Alles ausfuehren & Live/i })).toBeDisabled();
    await expect(page.locator('.fd-orbital-overview')).toBeVisible();

    for (const heading of ['Operations Overview', 'System Readiness', 'Publish Pipeline', 'Top Sets', 'Blocker & Hinweise', 'Recent Analytics']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    for (const stage of ['Import', 'Validate', 'Manifest', 'R2 Upload', 'Build', 'Deploy', 'Live']) {
      await expect(page.getByText(stage, { exact: true }).first()).toBeVisible();
    }
  });

  test('opens every navigation tab and synchronizes the operations assistant context', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Flight Deck tabs' });
    const context = page.getByLabel('Aktueller Kontext');
    for (const label of tabs) {
      const button = nav.getByRole('button', { name: label, exact: true });
      await button.click();
      await expect(button).toHaveClass(/active/);
      await expect(context).toContainText(label);
    }
  });

  test('context actions and demo import preserve functional routing and unlock Go Live', async ({ page }) => {
    const assistant = page.getByLabel('Operations Assistant');
    await assistant.getByRole('button', { name: /Batch prüfen/i }).click();
    await expect(page.getByLabel('Aktueller Kontext')).toContainText('Batch Import');
    await assistant.getByRole('button', { name: /Performance analysieren/i }).click();
    await expect(page.getByLabel('Aktueller Kontext')).toContainText('Analytics');
    await assistant.getByRole('button', { name: /System prüfen/i }).click();
    await expect(page.getByLabel('Aktueller Kontext')).toContainText('System Monitor');

    await page.getByRole('navigation', { name: 'Flight Deck tabs' }).getByRole('button', { name: 'Set Import', exact: true }).click();
    await page.getByRole('button', { name: /Demo Import/i }).click();
    await expect(page.locator('input[value="recording_2026_05_01"]')).toBeVisible();
    const globalActions = page.getByLabel('Globale Aktionen');
    await expect(globalActions.getByRole('button', { name: /Alles ausfuehren & Live/i })).toBeEnabled();
  });
});
