import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
    // Controlled lifecycle events exercise banner ownership without requesting
    // native installation or replacing public files in this browser context.
    const installer = Object.assign(new EventTarget(), { state: "installing" });
    const registration = Object.assign(new EventTarget(), {
      installing: installer,
      waiting: null as null | { postMessage: () => void },
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: Object.assign(new EventTarget(), {
        controller: {},
        register: async () => registration,
      }),
    });
    window.addEventListener("sparowtype:test-install-offer", () => {
      const offer = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: async () => undefined,
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(offer);
    });
    window.addEventListener("sparowtype:test-update-ready", () => {
      registration.waiting = { postMessage: () => undefined };
      installer.state = "installed";
      installer.dispatchEvent(new Event("statechange"));
    });
    window.addEventListener("sparowtype:test-update-cleared", () => {
      registration.waiting = null;
      installer.state = "activated";
      installer.dispatchEvent(new Event("statechange"));
    });
  });
});

test("dismissing installation does not hide a later app update or offline information", async ({ page }) => {
  await page.goto("/offline", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Public download: preparing", { exact: false })).toBeVisible();
  const availability = page.getByRole("complementary", { name: "App availability", exact: true });
  await page.evaluate(() => window.dispatchEvent(new Event("sparowtype:test-install-offer")));
  await expect(availability.getByRole("button", { name: "Install app", exact: true })).toBeVisible();
  await availability.getByRole("button", { name: "Dismiss installation suggestion", exact: true }).click();
  await expect(availability).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("sparowtype:test-update-ready")));
  await expect(availability.getByRole("button", { name: "Reload to update", exact: true })).toBeVisible();
  await availability.getByRole("button", { name: "Remind me about the update later", exact: true }).click();
  await expect(availability).toBeHidden();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    window.dispatchEvent(new Event("offline"));
  });
  await expect(availability.getByRole("link", { name: "Offline information", exact: true })).toBeVisible();
});

test("update dismissal does not dismiss installation or a subsequent update", async ({ page }) => {
  await page.goto("/offline", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Public download: preparing", { exact: false })).toBeVisible();
  const availability = page.getByRole("complementary", { name: "App availability", exact: true });
  await page.evaluate(() => window.dispatchEvent(new Event("sparowtype:test-update-ready")));
  await availability.getByRole("button", { name: "Remind me about the update later", exact: true }).click();
  await expect(availability).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("sparowtype:test-update-cleared")));
  await expect(page.getByRole("button", { name: "Reload to apply update", exact: true })).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("sparowtype:test-install-offer")));
  await expect(availability.getByRole("button", { name: "Install app", exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("sparowtype:test-update-ready")));
  await expect(availability.getByRole("button", { name: "Reload to update", exact: true })).toBeVisible();
});
