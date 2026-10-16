import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "font-readiness.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "./artifacts",
  use: {
    ...devices["Desktop Safari"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4175",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "webkit-font-diagnostic" }],
});
