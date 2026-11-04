import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import base from '../../../playwright.config';

export default defineConfig({
  ...base,
  testDir: fileURLToPath(new URL('.', import.meta.url)),
  testMatch: 'typing-course.spec.ts',
  grep: /two different measured passages unlock the next lesson; repetition, reload and reset are truthful$/,
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  retries: 0,
  projects: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }],
  use: { ...base.use, baseURL: process.env.PLAYWRIGHT_BASE_URL, trace: 'off', screenshot: 'only-on-failure' },
  reporter: [['list'], ['json', { outputFile: 'audit/2026-11-04/source34-course-reset-native-raw.json' }]],
  outputDir: 'audit/2026-11-04/.playwright-artifacts-course-reset-native-diagnostic',
  webServer: undefined,
});
