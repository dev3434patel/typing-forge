import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'loading-probe.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: 'browser-artifacts',
  reporter: [['list'], ['json', { outputFile: 'audit/keyboard-lab-2026-10-15/loading-probe/report.json' }]],
  use: { baseURL: 'http://127.0.0.1:5190', trace: 'on', screenshot: 'only-on-failure' },
  projects: [{ name: 'webkit-probe', use: { ...devices['Desktop Safari'] } }],
});
