import { expect, test } from "@playwright/test";
import { INTRO_ENABLED_STORAGE_KEY } from "../src/lib/opening-experience";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "false"),
    INTRO_ENABLED_STORAGE_KEY,
  );
});
test("public information pages have real recovery navigation and distinct metadata", async ({
  page,
}) => {
  const descriptions = new Set<string>();
  for (const [path, heading] of [
    ["/privacy", "Privacy & your data"],
    ["/terms", "Use & service information"],
    ["/touch-typing", "Learn touch typing, one calm step at a time."],
    ["/offline", "Your offline workspace"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "SparowType home", exact: true }),
    ).toBeVisible();
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description?.length).toBeGreaterThan(30);
    descriptions.add(description!);
  }
  expect(descriptions.size).toBe(4);
});
test("intent aliases retain real workspaces and canonicalize without exposing private routes", async ({
  page,
}) => {
  await page.goto("/typing-test");
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toBeVisible();
  const origin = new URL(page.url()).origin;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/`,
  );
  await page.goto("/typing-practice");
  await expect(
    page.getByRole("region", { name: "Adaptive typing lesson", exact: true }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/learn`,
  );
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", {
      name: "Your practice, your space.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,nofollow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
});
test("unknown paths use the branded accessible recovery without an invented console error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/a-page-that-does-not-exist");
  await expect(
    page.getByRole("heading", {
      name: "This page is out of reach.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("main#main-content")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Page recovery", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,nofollow",
  );
  await page
    .getByRole("link", { name: "Return to practice", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toBeVisible();
  expect(
    errors.filter((error) => /404 Error: User attempted/.test(error)),
  ).toEqual([]);
});
