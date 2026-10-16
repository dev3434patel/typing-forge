import { expect, test, type Page } from "@playwright/test";
import { customPractice, focusTyping } from "./helpers";

type CaretStyle = "line" | "block" | "outline" | "underline";
type GeometryReceipt = Awaited<ReturnType<typeof readGeometry>>;

async function seedPreferences(page: Page, style: CaretStyle, language = "en") {
  test.info().annotations.push({
    type: "browser-runtime-version",
    description: page.context().browser()?.version() || "unavailable",
  });
  await page.addInitScript(
    ({ style, language }) => {
      localStorage.setItem("sparowtype.opening-animation.enabled", "false");
      localStorage.setItem(
        "typingforge:v3:guest:preferences",
        JSON.stringify({
          schemaVersion: 3,
          values: {
            caretStyle: style,
            language,
            fontSize: 28,
            smoothCaret: false,
            reducedMotion: true,
          },
        }),
      );
    },
    { style, language },
  );
}

function readGeometry(page: Page) {
  return page.getByTestId("typing-viewport").evaluate((viewport) => {
    const caret = viewport.querySelector<HTMLElement>(":scope > .forge-caret");
    const current = viewport.querySelector<HTMLElement>(
      '.typing-text [data-current="true"]',
    );
    const anchor = viewport.querySelector<HTMLElement>(
      "[data-caret-end-anchor]",
    );
    const source = current || anchor;
    if (!caret || !source) return null;
    const fragments = Array.from(source.getClientRects());
    const fragment = fragments[0];
    if (!fragment) return null;
    const bounds = (rect: DOMRect) => ({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    return {
      caret: bounds(caret.getBoundingClientRect()),
      fragment: bounds(fragment),
      fragments: fragments.map(bounds),
      viewport: bounds(viewport.getBoundingClientRect()),
      source: current ? "current-character" : "static-end-anchor",
      currentExpected: current?.getAttribute("data-expected") ?? null,
      currentIndex: current?.getAttribute("data-slot-index") ?? null,
      fontSize: parseFloat(
        getComputedStyle(viewport).getPropertyValue("--typing-size"),
      ),
      lineHeight: parseFloat(
        getComputedStyle(viewport.querySelector(".typing-text")!).lineHeight,
      ),
      direction: getComputedStyle(viewport).direction,
      promptedMovingProbes: viewport.querySelectorAll(
        ".typing-text .forge-caret",
      ).length,
      staticAnchors: viewport.querySelectorAll("[data-caret-end-anchor]")
        .length,
    };
  });
}

function geometryErrors(receipt: GeometryReceipt, style: CaretStyle) {
  if (!receipt) return ["missing actual caret or measured DOM fragment"];
  const failures: string[] = [];
  const near = (actual: number, expected: number, label: string) => {
    if (
      !Number.isFinite(actual) ||
      !Number.isFinite(expected) ||
      Math.abs(actual - expected) > 1
    )
      failures.push(`${label}: ${actual} versus ${expected}`);
  };
  const fontBox = Math.max(receipt.fragment.height, receipt.fontSize);
  near(
    receipt.caret.width,
    style === "line"
      ? 2
      : Math.max(receipt.fragment.width || receipt.fontSize * 0.6, 4),
    "width",
  );
  near(receipt.caret.height, style === "underline" ? 2 : fontBox, "height");
  if (receipt.direction === "rtl")
    near(receipt.caret.right, receipt.fragment.right, "RTL leading right edge");
  else near(receipt.caret.left, receipt.fragment.left, "LTR leading left edge");
  if (style === "underline")
    near(
      receipt.caret.bottom,
      receipt.fragment.top + fontBox,
      "single underline bottom offset",
    );
  else near(receipt.caret.top, receipt.fragment.top, "font box top");
  if (
    receipt.caret.left < receipt.viewport.left - 2 ||
    receipt.caret.right > receipt.viewport.right + 2 ||
    receipt.caret.top < receipt.viewport.top - 2 ||
    receipt.caret.bottom > receipt.viewport.bottom + 2
  )
    failures.push("actual caret exceeds the visible practice viewport");
  if (receipt.promptedMovingProbes !== 0)
    failures.push("moving hidden caret probe remains inside passage");
  if (receipt.staticAnchors !== 1)
    failures.push("expected one static end/free anchor");
  return failures;
}

async function expectGeometry(
  page: Page,
  style: CaretStyle,
  label: string,
  receipts: Array<{ label: string; geometry: GeometryReceipt }>,
): Promise<NonNullable<GeometryReceipt>> {
  let geometry: GeometryReceipt = null;
  try {
    await expect
      .poll(async () => {
        geometry = await readGeometry(page);
        return geometryErrors(geometry, style);
      })
      .toEqual([]);
    return geometry!;
  } finally {
    receipts.push({ label, geometry });
  }
}

for (const style of ["line", "block", "outline", "underline"] as const) {
  for (const language of ["en", "ar"]) {
    test(`${style} caret follows the actual ${language === "ar" ? "RTL" : "LTR"} character edge through input and rotation`, async ({
      page,
    }) => {
      await seedPreferences(page, style, language);
      await page.setViewportSize({ width: 780, height: 900 });
      const text = Array(8)
        .fill(
          language === "ar"
            ? "سلام عليكم عالم جميل"
            : "cat dog quiet calm clear focus",
        )
        .join(" ");
      const input = await customPractice(page, text);
      const receipts: Array<{ label: string; geometry: GeometryReceipt }> = [];
      try {
        const first = await expectGeometry(page, style, "initial", receipts);
        expect(first.direction).toBe(language === "ar" ? "rtl" : "ltr");
        expect(first.source).toBe("current-character");
        await input.pressSequentially(text.slice(0, 55), { delay: 2 });
        await expect(input).toHaveValue(text.slice(0, 55));
        await expectGeometry(page, style, "55 committed characters", receipts);
        await page.setViewportSize({ width: 390, height: 844 });
        await expectGeometry(page, style, "portrait", receipts);
        await page.setViewportSize({ width: 844, height: 390 });
        await expectGeometry(page, style, "landscape", receipts);
        await page.setViewportSize({ width: 320, height: 780 });
        await input.press("Backspace");
        await expect(input).toHaveValue(text.slice(0, 54));
        await expectGeometry(page, style, "narrow after deletion", receipts);
      } finally {
        await test.info().attach("actual-character-caret-geometry", {
          contentType: "application/json",
          body: JSON.stringify({ style, language, receipts }),
        });
      }
    });
  }
}

test("a prompted code newline uses its first actual client fragment before entering the next line", async ({
  page,
}) => {
  await seedPreferences(page, "outline");
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode", exact: true })
    .getByRole("button", { name: "Code", exact: true })
    .click();
  const target = await page
    .getByTestId("typing-target")
    .locator("[data-expected]")
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("data-expected") || "")
        .join(""),
    );
  const newline = target.indexOf("\n");
  expect(newline).toBeGreaterThan(0);
  const input = await focusTyping(page);
  const receipts: Array<{ label: string; geometry: GeometryReceipt }> = [];
  try {
    await input.pressSequentially(target.slice(0, newline), { delay: 2 });
    await expect(input).toHaveValue(target.slice(0, newline));
    const before = await expectGeometry(
      page,
      "outline",
      "newline first fragment",
      receipts,
    );
    expect(before.currentExpected).toBe("\n");
    expect(before.fragments.length).toBeGreaterThan(0);
    const previousGlyphTop = await page
      .getByTestId("typing-target")
      .locator(`[data-slot-index="${newline - 1}"]`)
      .evaluate((element) => element.getClientRects()[0].top);
    await input.press("Enter");
    await expect(input).toHaveValue(target.slice(0, newline + 1));
    const after = await expectGeometry(
      page,
      "outline",
      "after committed newline",
      receipts,
    );
    expect(Number(after.currentIndex)).toBe(newline + 1);
    expect(after.fragment.top).toBeGreaterThan(previousGlyphTop);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectGeometry(page, "outline", "code after narrow resize", receipts);
  } finally {
    await test.info().attach("actual-code-newline-caret-geometry", {
      contentType: "application/json",
      body: JSON.stringify({ newline, receipts }),
    });
  }
});

test("empty and multiline free writing use the same static end anchor through deletion and rotation", async ({
  page,
}) => {
  await seedPreferences(page, "underline");
  await page.setViewportSize({ width: 780, height: 900 });
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode", exact: true })
    .getByRole("button", { name: "Zen", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Zen style", exact: true })
    .getByRole("button", { name: "Free writing", exact: true })
    .click();
  const input = await focusTyping(page);
  const receipts: Array<{ label: string; geometry: GeometryReceipt }> = [];
  try {
    const empty = await expectGeometry(
      page,
      "underline",
      "empty free writing",
      receipts,
    );
    expect(empty.source).toBe("static-end-anchor");
    await page.getByTestId("typing-viewport").evaluate((element) => {
      Object.assign(window, {
        originalFreeCaretAnchor: element.querySelector(
          "[data-caret-end-anchor]",
        ),
      });
    });
    await input.pressSequentially("cat", { delay: 2 });
    await input.press("ControlOrMeta+A");
    await input.press("Backspace");
    await expect(input).toHaveValue("");
    const cleared = await expectGeometry(
      page,
      "underline",
      "empty after deleting the current word",
      receipts,
    );
    expect(cleared.source).toBe("static-end-anchor");
    await input.pressSequentially("cat", { delay: 2 });
    await input.press("Enter");
    await expect(input).toHaveValue("cat\n");
    const newline = await expectGeometry(
      page,
      "underline",
      "free writing after newline",
      receipts,
    );
    expect(newline.source).toBe("static-end-anchor");
    expect(newline.fragment.top).toBeGreaterThan(empty.fragment.top);
    await input.pressSequentially("quiet calm clear focus", { delay: 2 });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectGeometry(page, "underline", "multiline portrait", receipts);
    await page.setViewportSize({ width: 844, height: 390 });
    await expectGeometry(page, "underline", "multiline landscape", receipts);
    await input.press("ControlOrMeta+A");
    await input.press("Backspace");
    await expect(input).toHaveValue("cat\nquiet calm clear ");
    const currentWordCleared = await expectGeometry(
      page,
      "underline",
      "committed lines remain after current-word deletion",
      receipts,
    );
    expect(currentWordCleared.source).toBe("static-end-anchor");
    expect(
      await page
        .getByTestId("typing-viewport")
        .evaluate(
          (element) =>
            element.querySelector("[data-caret-end-anchor]") ===
            (window as Window & { originalFreeCaretAnchor: Element })
              .originalFreeCaretAnchor,
        ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Restart with new text", exact: true })
      .click();
    await expect(input).toHaveValue("");
    const restarted = await expectGeometry(
      page,
      "underline",
      "fresh empty session after restart",
      receipts,
    );
    expect(restarted.source).toBe("static-end-anchor");
  } finally {
    await test.info().attach("actual-static-free-anchor-geometry", {
      contentType: "application/json",
      body: JSON.stringify({ receipts }),
    });
  }
});
