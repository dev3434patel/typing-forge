import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/accuracy-discrepancy-standalone.spec.ts',
  timeout: 120000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { channel: 'chromium' } }],
});
