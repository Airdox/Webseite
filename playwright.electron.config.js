// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 180_000,
  use: {
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
});
