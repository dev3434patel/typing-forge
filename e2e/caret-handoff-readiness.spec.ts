import { expect, test } from "@playwright/test";
import { completeClockedOpening, freezeOpeningClock, selectDocumentOpeningRenderer } from "./opening-renderer";

test.use({ serviceWorkers: "block" });

for (const readiness of [
  "within readiness window",
  "after readiness deadline",
] as const) {
  test(`real delayed workspace ${readiness} keeps automatic handoff and first input safe`, async ({
    page,
    context,
  }) => {
    // Only this clocked document-renderer fixture is selected. Native worker
    // readiness/quality remains covered separately with ordinary clocks.
    await selectDocumentOpeningRenderer(page);
    await page.addInitScript(() => {
      localStorage.setItem("sparowtype.opening-animation.enabled", "true");
      sessionStorage.removeItem("sparowtype.opening-animation.seen");
      const original = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        if (this.classList.contains("awakening-handoff"))
          document.documentElement.dataset.delayedHandoffAnimations = String(
            Number(
              document.documentElement.dataset.delayedHandoffAnimations || 0,
            ) + 1,
          );
        return Reflect.apply(original, this, args);
      };
    });
    let releaseWorkspace = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseWorkspace = resolve;
    });
    let actualEntryURL = "";
    const heldRequests: string[] = [];
    await context.route(/\/assets\/App-[^/]*\.js(?:\?.*)?$/, async (route) => {
      actualEntryURL = route.request().url();
      heldRequests.push(actualEntryURL);
      await gate;
      await route.continue();
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await freezeOpeningClock(page);

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const opening = page.getByTestId("opening-experience");
      await expect(opening).toHaveAttribute("data-mode", "full");
      await expect(
        page.getByRole("status").filter({ hasText: "Loading SparowType" }),
      ).toBeVisible();
      await completeClockedOpening(page);
      await expect(opening).toHaveCount(0);
      await expect.poll(() => heldRequests.length).toBe(1);
      await expect(
        page.getByRole("status").filter({
          hasText: "Preparing your typing workspace…",
        }),
      ).toBeVisible();
      const input = page.getByRole("textbox", {
        name: "Typing input",
        exact: true,
      });
      await expect(input).toHaveCount(0);
      await expect(page.locator(".awakening-handoff")).toHaveCount(1);
      expect(
        await page
          .locator("html")
          .getAttribute("data-delayed-handoff-animations"),
      ).toBeNull();

      if (readiness === "after readiness deadline") {
        // The helper has a fixed 500ms target-readiness budget. The real App
        // request remains held; advancing beyond it must remove only decoration.
        await page.clock.runFor(501);
        await expect(page.locator(".awakening-handoff")).toHaveCount(0);
        await expect(input).toHaveCount(0);
      }

      const workspaceResponse = page.waitForResponse(actualEntryURL);
      releaseWorkspace();
      expect((await workspaceResponse).status()).toBe(200);
      await expect(input).toBeVisible();
      await expect(input).toHaveValue("");
      await expect(
        page.getByRole("region", { name: "Typing session", exact: true }),
      ).toHaveAttribute("data-status", "ready");
      await page.clock.runFor(80);
      if (readiness === "within readiness window") {
        await expect(page.locator("html")).toHaveAttribute(
          "data-delayed-handoff-animations",
          "1",
        );
      } else {
        expect(
          await page
            .locator("html")
            .getAttribute("data-delayed-handoff-animations"),
        ).toBeNull();
      }

      await input.pressSequentially("x");
      await expect(input).toHaveValue("x");
      await expect(page.locator(".awakening-handoff")).toHaveCount(0);
      await expect(
        page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
      ).not.toHaveCSS("visibility", "hidden");
      expect(errors).toEqual([]);
      await test.info().attach("delayed-workspace-handoff", {
        contentType: "application/json",
        body: JSON.stringify({
          readiness,
          actualHeldAppRequests: heldRequests,
          responseStatus: 200,
          animationCount: Number(
            (await page
              .locator("html")
              .getAttribute("data-delayed-handoff-animations")) || 0,
          ),
          finalInput: await input.inputValue(),
          remainingDecorativeCarets: await page
            .locator(".awakening-handoff")
            .count(),
          pageErrors: errors,
        }),
      });
    } finally {
      releaseWorkspace();
    }
  });
}

test("an actual caret module arriving after its import deadline cannot revive decoration or consume the first key", async ({
  page,
  context,
}) => {
  await selectDocumentOpeningRenderer(page);
  await page.addInitScript(() => {
    const originalAnimate = Element.prototype.animate;
    const originalAppend = Element.prototype.append;
    Element.prototype.animate = function (...args) {
      if (this.classList.contains("awakening-handoff"))
        document.documentElement.dataset.expiredHandoffAnimations = String(
          Number(
            document.documentElement.dataset.expiredHandoffAnimations || 0,
          ) + 1,
        );
      return Reflect.apply(originalAnimate, this, args);
    };
    Element.prototype.append = function (...nodes) {
      for (const node of nodes)
        if (
          node instanceof Element &&
          node.classList.contains("awakening-handoff")
        )
          document.documentElement.dataset.expiredHandoffAppends = String(
            Number(
              document.documentElement.dataset.expiredHandoffAppends || 0,
            ) + 1,
          );
      return Reflect.apply(originalAppend, this, nodes);
    };
  });
  let releaseCaretModule = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseCaretModule = resolve;
  });
  let actualModuleURL = "";
  const heldRequests: string[] = [];
  await context.route(
    /\/assets\/caret-handoff[^/]*\.js(?:\?.*)?$/,
    async (route) => {
      actualModuleURL = route.request().url();
      heldRequests.push(actualModuleURL);
      await gate;
      await route.continue();
    },
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await freezeOpeningClock(page);
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const opening = page.getByTestId("opening-experience");
    await expect(opening).toHaveAttribute("data-mode", "full");
    await expect(
      page.getByRole("status").filter({ hasText: "Loading SparowType" }),
    ).toBeVisible();
    await completeClockedOpening(page);
    await expect(opening).toHaveCount(0);
    await expect.poll(() => heldRequests.length).toBe(1);
    const input = page.getByRole("textbox", {
      name: "Typing input",
      exact: true,
    });
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("");
    await expect(page.locator(".awakening-handoff")).toHaveCount(0);

    // No input or pointer cancellation is sent: the actual 1000ms import
    // settlement deadline must own this cleanup before a late HTTP200 arrives.
    await page.clock.runFor(1001);
    const moduleResponse = page.waitForResponse(actualModuleURL);
    releaseCaretModule();
    expect((await moduleResponse).status()).toBe(200);
    await page.clock.runFor(80);
    await expect(page.locator(".awakening-handoff")).toHaveCount(0);
    expect(
      await page.locator("html").getAttribute("data-expired-handoff-appends"),
    ).toBeNull();
    expect(
      await page
        .locator("html")
        .getAttribute("data-expired-handoff-animations"),
    ).toBeNull();
    await expect(input).toHaveValue("");
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
    await expect(
      page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
    ).not.toHaveCSS("visibility", "hidden");
    expect(errors).toEqual([]);
    await test.info().attach("expired-real-caret-module", {
      contentType: "application/json",
      body: JSON.stringify({
        actualHeldModuleRequests: heldRequests,
        additionalDocumentClockAdvancedWhileModuleHeldMs: 1001,
        responseStatus: 200,
        appendedDecorativeCarets: Number(
          (await page
            .locator("html")
            .getAttribute("data-expired-handoff-appends")) || 0,
        ),
        animationCount: Number(
          (await page
            .locator("html")
            .getAttribute("data-expired-handoff-animations")) || 0,
        ),
        finalInput: await input.inputValue(),
        pageErrors: errors,
      }),
    });
  } finally {
    releaseCaretModule();
  }
});
