const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
    await page.getByRole("combobox", { name: "Language", exact: true }).waitFor();
    await page.waitForFunction(() => document.fonts.status === "loaded", undefined, { timeout: 10000 });
    await page.screenshot({ path: "audit/responsive-2026-10-16/practice-390.png", fullPage: true });
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
