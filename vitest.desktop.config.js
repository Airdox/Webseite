/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/desktop/__tests__/AudioMasteringService.test.js'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.wrangler/**'],
    setupFiles: './src/test/setup.js',
    testTimeout: 90000,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage-desktop',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'desktop/main/services/audioMastering.mjs',
      ],
      exclude: [
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        // Defensive process/error fallbacks are platform-specific; the executable
        // statements, lines and functions retain the strict >=85% release gate.
        branches: 70,
      },
    },
  },
});
