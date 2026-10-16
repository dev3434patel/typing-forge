import { defineConfig, devices } from "@playwright/test";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const requestedBrowsers =
  process.env.PLAYWRIGHT_BROWSERS?.trim().toLowerCase() || "chromium";
const browserNames =
  requestedBrowsers === "all"
    ? ["chromium", "firefox", "webkit"]
    : [...new Set(requestedBrowsers.split(",").map((name) => name.trim()))];
const browserDevices = {
  chromium: "Desktop Chrome",
  firefox: "Desktop Firefox",
  webkit: "Desktop Safari",
  edge: "Desktop Edge",
} as const;
for (const browser of browserNames) {
  if (!Object.hasOwn(browserDevices, browser))
    throw new Error(
      `Unsupported PLAYWRIGHT_BROWSERS value: ${browser}. Use chromium, firefox, webkit, edge or all.`,
    );
}
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: externalBaseURL || "http://127.0.0.1:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: browserNames.map((name) => ({
    name,
    use: {
      ...devices[browserDevices[name as keyof typeof browserDevices]],
      ...(name === "edge" ? { channel: "msedge" } : {}),
    },
  })),
  webServer: externalBaseURL
    ? undefined
    : {
        command: process.env.CI
          ? "npm run preview -- --host 127.0.0.1 --port 8080 --strictPort"
          : "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
