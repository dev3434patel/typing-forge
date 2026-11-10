import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
export default defineConfig({
  testDir: '.', testMatch: 'profile-reset.spec.ts', fullyParallel: false,
  workers: 1, retries: 0, timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['json', { outputFile: path.resolve('audit/2026-11-05-followup/webkit-profile-reset-probe-v3-raw.json') }]],
  outputDir: path.resolve('audit/2026-11-05-followup/.webkit-profile-reset-probe-v3-artifacts'),
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }, { name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
