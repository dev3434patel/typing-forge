import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'message-probe.spec.ts', workers: 1, retries: 0,
  outputDir: 'message-browser-artifacts',
  reporter: [['list'], ['json', { outputFile: 'audit/keyboard-lab-2026-10-15/loading-probe/message-report.json' }]],
  use: { baseURL: 'http://127.0.0.1:5190', trace: 'on' },
  projects: [{ name: 'webkit-message-probe', use: { ...devices['Desktop Safari'] } }],
});
