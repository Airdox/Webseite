/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/desktop/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.wrangler/**'],
    setupFiles: './src/test/setup.js',
    testTimeout: 90000,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage-desktop',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/desktop/DesktopApp.jsx',
        'src/desktop/api.js',
        'src/desktop/components/**/*.{js,jsx}',
        'src/desktop/lib/*.{js,jsx}',
        'desktop/main/index.cjs',
        'desktop/main/preload.cjs',
        'desktop/main/protocolPath.cjs',
        'desktop/main/services/**/*.{mjs,js,cjs}',
      ],
      exclude: [
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        // Pure React mount bootstrap; DesktopApp itself is measured above.
        'src/desktop/main.jsx',
        // Browser-only fixture backend is test data, not production Electron behavior.
        'src/desktop/mockApi.js',
      ],
      thresholds: {
        lines: 85,
        statements: 85,
      },
    },
  },
});
