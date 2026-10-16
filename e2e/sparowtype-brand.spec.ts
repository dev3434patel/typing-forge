import { expect, test, type Page } from "@playwright/test";
import { waitForLayoutFonts } from "./layout-fonts";

const INTRO_PREFERENCE_KEY = "sparowtype.opening-animation.enabled";
// Keep the existing owner-scoped key: the rebrand must retain stored choices.
const GUEST_PREFERENCES_KEY = "typingforge:v3:guest:preferences";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "false");
  }, INTRO_PREFERENCE_KEY);
});

async function expectMainTheme(page: Page, theme: "dark" | "light") {
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    `sparow-${theme}`,
  );
  await expect(
    page.getByRole("button", {
      name:
        theme === "light" ? "Switch to dark theme" : "Switch to light theme",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).colorScheme),
  ).toBe(theme);
}

test("SparowType identity and the header theme choice persist across reload", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const home = page.getByRole("link", { name: "SparowType home", exact: true });
  await expect(home).toBeVisible();
  await expect(home.locator("svg")).toHaveCount(0);
  await expect(home.locator(".brand-wordmark")).toHaveText("SparowType");
  await expect(page).toHaveTitle(
    "Typing test and deliberate practice · SparowType",
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/sparowtype.svg",
  );
  const iconResponse = await page.request.get("/sparowtype.svg");
  expect(iconResponse.ok()).toBe(true);
  const icon = await page.evaluate(
    (source) => {
      const document = new DOMParser().parseFromString(source, "image/svg+xml");
      return {
        text: Array.from(document.querySelectorAll("text")).map((node) =>
          node.textContent?.trim(),
        ),
        background: document.querySelector("rect")?.getAttribute("fill"),
        emblems: document.querySelectorAll(
          "path, polygon, circle, ellipse, line, polyline, image, use",
        ).length,
      };
    },
    await iconResponse.text(),
  );
  expect(icon).toEqual({ text: ["S"], background: "#07070A", emblems: 0 });
  await expect(page.getByTestId("opening-experience")).toHaveCount(0);

  await expectMainTheme(page, "dark");
  await page
    .getByRole("button", { name: "Switch to light theme", exact: true })
    .click();
  await expectMainTheme(page, "light");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expectMainTheme(page, "light");
  await expect(page).toHaveTitle(
    "Typing test and deliberate practice · SparowType",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#F6F7FA",
  );

  await page
    .getByRole("button", { name: "Switch to dark theme", exact: true })
    .click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expectMainTheme(page, "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#07070A",
  );
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await input.focus();
  await input.pressSequentially("a");
  await expect(page.locator("html")).toHaveClass(/forge-focused/);
  for (const selector of ["header", "footer", ".typing-controls"]) {
    await expect(page.locator(selector).first()).toHaveCSS("opacity", "1");
  }
});

test("legacy light preferences migrate without resetting language, layout or text size", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    // Seed only the first load; a later reload must read the real saved update.
    if (!localStorage.getItem(key))
      localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 3,
          values: {
            theme: "forge-light",
            language: "es",
            fontSize: 32,
            layout: "dvorak",
          },
          pending: {},
          cloudVersion: 0,
          updatedAt: 100,
        }),
      );
  }, GUEST_PREFERENCES_KEY);
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", {
      name: "Your practice, your space.",
      exact: true,
    }),
  ).toBeVisible();
  await expectMainTheme(page, "light");
  await expect(
    page.getByRole("button", { name: /Sparow light$/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const language = page.getByRole("combobox", {
    name: "Practice language",
    exact: true,
  });
  const layout = page.getByRole("combobox", {
    name: "Keyboard layout",
    exact: true,
  });
  const textSize = page.getByRole("slider", { name: "Text size", exact: true });
  await expect(language).toHaveValue("es");
  await expect(layout).toHaveValue("dvorak");
  await expect(textSize).toHaveValue("32");

  await page
    .getByRole("button", { name: "Switch to dark theme", exact: true })
    .click();
  await expectMainTheme(page, "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expectMainTheme(page, "dark");
  await expect(language).toHaveValue("es");
  await expect(layout).toHaveValue("dvorak");
  await expect(textSize).toHaveValue("32");
  await expect
    .poll(() =>
      page.evaluate((key) => {
        return JSON.parse(localStorage.getItem(key) || "null")?.values;
      }, GUEST_PREFERENCES_KEY),
    )
    .toMatchObject({
      theme: "sparow-dark",
      language: "es",
      fontSize: 32,
      layout: "dvorak",
    });
});

test("light and dark headers keep every control separate at mobile, tablet and desktop widths", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  const header = page.getByRole("banner");
  await expect(
    header.getByRole("link", { name: "SparowType home", exact: true }),
  ).toBeVisible();
  await waitForLayoutFonts(page);
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["dark", "light"] as const) {
      await test.step(`${width}px · ${theme}`, async () => {
        if (
          (await page.locator("html").getAttribute("data-theme")) !==
          `sparow-${theme}`
        ) {
          await header
            .getByRole("button", {
              name:
                theme === "dark"
                  ? "Switch to dark theme"
                  : "Switch to light theme",
              exact: true,
            })
            .click();
        }
        await expectMainTheme(page, theme);
        const dimensions = await header
          .locator(":scope > div")
          .first()
          .evaluate((row) => {
            const viewport = document.documentElement.clientWidth;
            const controls = Array.from(row.querySelectorAll("a, button"))
              .map((element) => ({
                label:
                  element.getAttribute("aria-label") ||
                  element.textContent?.trim() ||
                  element.tagName,
                rect: element.getBoundingClientRect(),
              }))
              .filter(({ rect }) => rect.width > 0 && rect.height > 0);
            const overlaps: string[] = [];
            for (let first = 0; first < controls.length; first++) {
              for (let second = first + 1; second < controls.length; second++) {
                const a = controls[first],
                  b = controls[second];
                const overlapX =
                  Math.min(a.rect.right, b.rect.right) -
                  Math.max(a.rect.left, b.rect.left);
                const overlapY =
                  Math.min(a.rect.bottom, b.rect.bottom) -
                  Math.max(a.rect.top, b.rect.top);
                if (overlapX > 0.5 && overlapY > 0.5)
                  overlaps.push(`${a.label} / ${b.label}`);
              }
            }
            return {
              viewport,
              document: document.documentElement.scrollWidth,
              rowWidth: row.clientWidth,
              rowScroll: row.scrollWidth,
              outside: controls
                .filter(
                  ({ rect }) => rect.left < -1 || rect.right > viewport + 1,
                )
                .map(({ label }) => label),
              overlaps,
            };
          });
        expect(dimensions.document).toBeLessThanOrEqual(
          dimensions.viewport + 1,
        );
        expect(dimensions.rowScroll).toBeLessThanOrEqual(
          dimensions.rowWidth + 1,
        );
        expect(dimensions.outside).toEqual([]);
        expect(dimensions.overlaps).toEqual([]);
        const toggle = header.getByRole("button", {
          name:
            theme === "light"
              ? "Switch to dark theme"
              : "Switch to light theme",
          exact: true,
        });
        const bounds = await toggle.boundingBox();
        expect(bounds).not.toBeNull();
        // WebKit's Windows scaling can report a CSS 44px box as 43.99px.
        expect(Math.round(bounds!.width)).toBeGreaterThanOrEqual(44);
        expect(Math.round(bounds!.height)).toBeGreaterThanOrEqual(44);
      });
    }
  }
});
