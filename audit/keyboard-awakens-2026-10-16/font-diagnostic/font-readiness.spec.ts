import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { waitForLayoutFonts } from "../../../e2e/layout-fonts";
import { focusTyping } from "../../../e2e/helpers";

const fonts = [
  {
    family: "Inter Variable",
    font: '400 16px "Inter Variable"',
    text: "SparowType",
  },
  { family: "Sora", font: '600 24px "Sora"', text: "Guest workspace" },
  {
    family: "JetBrains Mono Variable",
    font: '400 26px "JetBrains Mono Variable"',
    text: "typing practice",
  },
];
type BrowserFontRecord = { at: number; type: string; [key: string]: unknown };
declare global {
  interface Window {
    fontProbe: BrowserFontRecord[];
    fontReturnedFaces: FontFace[];
    fontFaceIds: Map<FontFace, number>;
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
    window.fontProbe = [];
    window.fontReturnedFaces = [];
    window.fontFaceIds = new Map();
    const record = (type: string, data: Record<string, unknown>) =>
      window.fontProbe.push({
        at: performance.now(),
        type,
        readyState: document.readyState,
        ...data,
      });
    const original = document.fonts.load.bind(document.fonts);
    document.fonts.load = (font, text) => {
      // Do not enumerate faces or read computed/layout styles before calling
      // the original method: those reads could trigger the style work that
      // this diagnostic is trying to observe.
      record("load-call", { font, text });
      const result = original(font, text);
      void result.then(
        (loaded) => {
          window.fontReturnedFaces.push(...loaded);
          record("load-fulfilled", {
            font,
            text,
            count: loaded.length,
            returnedFaces: loaded.map((face) => ({
              family: face.family,
              status: face.status,
              weight: face.weight,
            })),
          });
        },
        (error) =>
          record("load-rejected", {
            font,
            text,
            error: String(error),
          }),
      );
      return result;
    };
    for (const event of ["loading", "loadingdone", "loadingerror"])
      document.fonts.addEventListener(event, () =>
        record(event, { status: document.fonts.status }),
      );
    document.addEventListener("DOMContentLoaded", () =>
      record("domcontentloaded", {
        status: document.fonts.status,
      }),
    );
  });
});

async function snapshot(page: Page) {
  return page.evaluate((requests) => {
    const faceId = (face: FontFace) => {
      if (!window.fontFaceIds.has(face))
        window.fontFaceIds.set(face, window.fontFaceIds.size + 1);
      return window.fontFaceIds.get(face);
    };
    const currentFaces = Array.from(document.fonts);
    const styles: Record<string, { count: number; samples: string[] }> = {};
    const textNodes = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    let node: Node | null;
    let examined = 0;
    while ((node = textNodes.nextNode()) && examined++ < 1500) {
      if (
        !node.textContent?.trim() ||
        !node.parentElement ||
        !node.parentElement.closest("header,main,footer")
      )
        continue;
      const element = node.parentElement;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const computed = getComputedStyle(element);
      const key = `${computed.fontFamily} | ${computed.fontWeight} | ${computed.fontSize}`;
      const group = (styles[key] ??= { count: 0, samples: [] });
      group.count++;
      if (group.samples.length < 3)
        group.samples.push(node.textContent.trim().slice(0, 80));
    }
    return {
      url: location.href,
      visibility: document.visibilityState,
      readyState: document.readyState,
      mainText: document.querySelector("main")?.textContent?.slice(0, 180),
      mainBounds: document
        .querySelector("main")
        ?.getBoundingClientRect()
        .toJSON(),
      heading: document.querySelector("h1")?.textContent,
      status: document.fonts.status,
      checks: requests.map((request) => ({
        ...request,
        ready: document.fonts.check(request.font, request.text),
      })),
      returnedFaceReferences: window.fontReturnedFaces.map((face) => ({
        id: faceId(face),
        family: face.family,
        status: face.status,
        inSet: document.fonts.has(face),
        sameAsIterable: currentFaces.includes(face),
      })),
      faces: currentFaces.map((face) => ({
        id: faceId(face),
        family: face.family,
        status: face.status,
        weight: face.weight,
        unicodeRange: face.unicodeRange,
      })),
      calls: window.fontProbe,
      computedVisibleText: styles,
      resources: performance
        .getEntriesByType("resource")
        .filter((entry) => /fonts|woff/.test(entry.name))
        .map((entry) => ({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        })),
      stylesheets: Array.from(document.styleSheets).map((sheet) => ({
        href: sheet.href,
        disabled: sheet.disabled,
      })),
    };
  }, fonts);
}

async function diagnose(
  page: Page,
  info: TestInfo,
  exercise: (check: (label: string) => Promise<void>) => Promise<void>,
) {
  const network: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (/fonts|woff/.test(request.url()))
      network.push({
        type: "request",
        at: Date.now(),
        url: request.url(),
        resourceType: request.resourceType(),
      });
  });
  page.on("requestfailed", (request) => {
    if (/fonts|woff/.test(request.url()))
      network.push({
        type: "failed",
        at: Date.now(),
        url: request.url(),
        failure: request.failure(),
      });
  });
  page.on("response", (response) => {
    if (/fonts|woff/.test(response.url()))
      network.push({
        type: "response",
        at: Date.now(),
        url: response.url(),
        status: response.status(),
        fromWorker: response.fromServiceWorker(),
        mime: response.headers()["content-type"],
      });
  });
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      network.push({
        type: "console",
        at: Date.now(),
        message: message.text(),
      });
  });
  page.on("pageerror", (error) =>
    network.push({ type: "pageerror", at: Date.now(), error: error.message }),
  );
  const checkpoints: Record<string, unknown>[] = [];
  let originalFailure: unknown;
  try {
    await exercise(async (label) => {
      await page.locator("#main-content").waitFor();
      let helperFailure: unknown;
      try {
        await waitForLayoutFonts(page);
      } catch (error) {
        helperFailure = error;
      }
      // Computed/layout reads happen after the original helper has completed or
      // failed, so they cannot manufacture its baseline readiness outcome.
      checkpoints.push({
        label,
        helperPassed: !helperFailure,
        afterOriginalHelper: await snapshot(page),
      });
      if (helperFailure) throw helperFailure;
    });
  } catch (error) {
    originalFailure = error;
    const retry = await page.evaluate(async (requests) => {
      const results: Record<string, unknown>[] = [];
      const pending = requests.map(async (request) => {
        try {
          const returned = await document.fonts.load(
            request.font,
            request.text,
          );
          results.push({
            type: "set-retry",
            family: request.family,
            returned: returned.map((face) => ({
              family: face.family,
              status: face.status,
            })),
          });
        } catch (error) {
          results.push({
            type: "set-retry-error",
            family: request.family,
            error: String(error),
          });
        }
      });
      await Promise.race([
        Promise.all(pending),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      const direct = Array.from(document.fonts)
        .filter(
          (face) =>
            requests.some(
              (request) => face.family.replace(/["']/g, "") === request.family,
            ) && /U\+0-ff/i.test(face.unicodeRange),
        )
        .map(async (face) => {
          try {
            await face.load();
            results.push({
              type: "direct-face-load",
              family: face.family,
              status: face.status,
            });
          } catch (error) {
            results.push({
              type: "direct-face-error",
              family: face.family,
              error: String(error),
            });
          }
        });
      await Promise.race([
        Promise.all(direct),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      return results;
    }, fonts);
    checkpoints.push({
      label: "post-failure-diagnostic-only",
      retry,
      afterRetry: await snapshot(page),
    });
    const copyMetrics = await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      const samples = [
        "SparowType keyboard rhythm 0123456789 iIlWwm",
        "iiiiWWWWgypQ",
        "The quick brown fox jumps",
      ];
      const measure = (family: string) => {
        context.font = `400 32px "${family}"`;
        return samples.map((text) => {
          const m = context.measureText(text);
          return {
            width: m.width,
            ascent: m.actualBoundingBoxAscent,
            descent: m.actualBoundingBoxDescent,
          };
        });
      };
      const definitions = [
        {
          family: "Inter Variable",
          alias: "DiagnosticInter",
          file: "inter-latin-wght-normal.woff2",
          weight: "100 900",
        },
        {
          family: "Sora",
          alias: "DiagnosticSora",
          file: "sora-latin-wght-normal.woff2",
          weight: "100 800",
        },
        {
          family: "JetBrains Mono Variable",
          alias: "DiagnosticMono",
          file: "jetbrains-mono-latin-wght-normal.woff2",
          weight: "100 800",
        },
      ];
      const result: Record<string, unknown>[] = [];
      for (const definition of definitions) {
        const originalBefore = measure(definition.family);
        const bytes = await (
          await fetch(`/fonts/${definition.file}`, { cache: "no-store" })
        ).arrayBuffer();
        const copy = new FontFace(definition.alias, bytes, {
          style: "normal",
          weight: definition.weight,
        });
        await copy.load();
        document.fonts.add(copy);
        result.push({
          family: definition.family,
          originalBefore,
          independentCopy: measure(definition.alias),
          originalAfter: measure(definition.family),
          copyStatus: copy.status,
          copyInSet: document.fonts.has(copy),
          genericArial: measure("Arial"),
          genericMono: measure("monospace"),
          cssCheck: document.fonts.check(
            `400 32px "${definition.family}"`,
            samples[0],
          ),
        });
      }
      return result;
    });
    checkpoints.push({
      label: "post-failure-independent-glyph-metrics",
      copyMetrics,
      afterIndependentCopies: await snapshot(page),
    });
  }
  const artifact = path.resolve(
    import.meta.dirname,
    `${info.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`,
  );
  await writeFile(
    artifact,
    JSON.stringify(
      {
        scope:
          "Original 10s helper unchanged; passive network and exact load promise observations. Computed styles/retry collected after baseline only. Diagnostic retry never changes the original test result.",
        failure: originalFailure ? String(originalFailure) : null,
        network,
        checkpoints,
      },
      null,
      2,
    ),
  );
  await info.attach("font-readiness-observations", {
    path: artifact,
    contentType: "application/json",
  });
  if (originalFailure) throw originalFailure;
}

test("320px route sequence records exact font loads and visible text families", async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 900 });
  await diagnose(page, info, async (check) => {
    for (const route of [
      "/",
      "/learn",
      "/race",
      "/stats",
      "/settings",
      "/keyboard-lab",
      "/leaderboard",
      "/ranked",
      "/profile",
      "/auth",
      "/about",
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await check(route);
    }
  });
});

test("signed-out ranked page records unused mono versus requested font readiness", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await diagnose(page, info, async (check) => {
    await page.goto("/ranked", { waitUntil: "domcontentloaded" });
    await check("signed-out-ranked");
  });
});

test("race resize and QWERTZ learning record real font load outcomes", async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  await diagnose(page, info, async (check) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto("/race", { waitUntil: "domcontentloaded" });
    await page
      .getByRole("button", { name: "Start bot practice", exact: true })
      .click();
    const input = await focusTyping(page);
    await input.pressSequentially("test");
    await page.setViewportSize({ width: 320, height: 568 });
    await check("race-after-resize");
    await input.press("Tab");
    await page
      .getByRole("button", { name: "Restart with new text" })
      .press("Enter");
    await expect(input).toBeFocused();
    await page.goto("/learn?language=en&layout=qwertz", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("img", { name: /^QWERTZ logical keyboard/ }),
    ).toBeVisible();
    await check("qwertz-learn");
  });
});
