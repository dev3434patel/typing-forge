import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "offline-transport.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "./artifacts",
  use: {
    ...devices["Desktop Firefox"],
    baseURL: "http://127.0.0.1:4175",
    serviceWorkers: "allow",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "firefox-diagnostic" }],
});
