import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import axe from "axe-core";
import { focusTyping, settlePageVisuals } from "./helpers";

const catalog = JSON.parse(readFileSync(new URL("../backend/resources/typing-course-v1.json", import.meta.url), "utf8")) as {
  lessons: { id: string; title: string; durationMs: number | null; variants: { id: string; text: string }[] }[];
};
const first = catalog.lessons[0];
const second = catalog.lessons[1];
const speed = catalog.lessons.find(lesson => lesson.durationMs !== null)!;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
});

async function start(page: Page, lesson = first) {
  await page.goto(`/lessons?lesson=${lesson.id}`);
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  return focusTyping(page);
}
async function qualify(page: Page, variant = "a") {
  const input = await focusTyping(page);
  await input.pressSequentially(first.variants.find(item => item.id === variant)!.text, { delay: 65 });
  await expect(page.getByRole("region", { name: "Course lesson result", exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Saving this attempt" })).toHaveCount(0);
}

type CourseSaveGate = {
  sessions: string[];
  settled: Record<number, string>;
  release: (index: number) => void;
  reject: (index: number) => void;
};
type CourseSaveWindow = Window & { courseSaveGate: CourseSaveGate };

async function delayCourseHashes(page: Page, count: number) {
  await page.addInitScript(({ count }) => {
    const nativeDigest = crypto.subtle.digest.bind(crypto.subtle);
    const pending: { release: () => void; reject: () => void }[] = [];
    const gate: CourseSaveGate = {
      sessions: [], settled: {},
      release: index => pending[index].release(),
      reject: index => pending[index].reject(),
    };
    (window as unknown as CourseSaveWindow).courseSaveGate = gate;
    Object.defineProperty(crypto.subtle, "digest", {
      configurable: true,
      value: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        let sessionId: string | undefined;
        try {
          const value = JSON.parse(new TextDecoder().decode(data)) as {
            schemaVersion?: number; clientSessionId?: string;
            configuration?: { privacy?: string; settings?: { course?: { courseId?: string } } };
          };
          if (value.schemaVersion === 3 && value.configuration?.privacy === "public-corpus" &&
              value.configuration.settings?.course?.courseId === "typing-course-v1") sessionId = value.clientSessionId;
        } catch { /* Other digests are unrelated to course-save ordering. */ }
        if (!sessionId || gate.sessions.length >= count) return nativeDigest(algorithm, data);
        const index = gate.sessions.length;
        gate.sessions.push(sessionId);
        return new Promise<ArrayBuffer>((resolve, reject) => {
          let settled = false;
          pending.push({
            release: () => {
              if (settled) throw new Error("This course hash already settled.");
              settled = true;
              void nativeDigest(algorithm, data).then(value => { gate.settled[index] = "resolved"; resolve(value); }, error => { gate.settled[index] = "rejected"; reject(error); });
            },
            reject: () => {
              if (settled) throw new Error("This course hash already settled.");
              settled = true;
              gate.settled[index] = "rejected";
              reject(new DOMException("The earlier course hash failed deliberately.", "OperationError"));
            },
          });
        });
      },
    });
  }, { count });
}

async function finishWhileSaveIsPending(page: Page) {
  const input = await focusTyping(page);
  const sessionId = await page.getByRole("region", { name: "Typing session", exact: true }).getAttribute("data-session-id");
  await input.pressSequentially(first.variants[0].text, { delay: 65 });
  await expect(page.getByRole("region", { name: "Course lesson result", exact: true })).toBeVisible();
  await expect(page.locator(".course-save-status")).toHaveText("Saving this attempt…");
  return sessionId!;
}

async function reopenFirstLesson(page: Page) {
  await page.getByRole("button", { name: "All lessons", exact: true }).click();
  await page.getByRole("button", { name: "Start learning", exact: true }).click();
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
}

test("an older failed course save cannot mark a newly saved result as failed", async ({ page }, info) => {
  test.setTimeout(45_000);
  await delayCourseHashes(page, 1);
  await start(page);
  const olderId = await finishWhileSaveIsPending(page);
  expect(await page.evaluate(() => (window as unknown as CourseSaveWindow).courseSaveGate.sessions)).toEqual([olderId]);
  await reopenFirstLesson(page);
  const newerId = await page.getByRole("region", { name: "Typing session", exact: true }).getAttribute("data-session-id");
  expect(newerId).not.toBe(olderId);
  await qualify(page);
  await expect(page.locator(".course-save-status")).toHaveAttribute("data-session-id", newerId!);
  await expect(page.locator(".course-save-status")).toContainText("Saved on this device.");
  await page.evaluate(() => (window as unknown as CourseSaveWindow).courseSaveGate.reject(0));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator(".course-save-status")).toContainText("Saved on this device.");
  await expect(page.getByRole("button", { name: "Retry saving", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Repeat this passage", exact: true })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Checkpoint earned.", exact: true })).toBeVisible();
  await expect(page.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible();
  await info.attach("course-save-order", { body: JSON.stringify({ olderId, newerId, oldSave: "rejected after current saved", currentStatusUnaffected: true }), contentType: "application/json" });
});

test("an older successful course save cannot finish a newer pending save or supply its status", async ({ page }, info) => {
  test.setTimeout(45_000);
  await delayCourseHashes(page, 2);
  await start(page);
  const olderId = await finishWhileSaveIsPending(page);
  await reopenFirstLesson(page);
  const newerId = await finishWhileSaveIsPending(page);
  expect(newerId).not.toBe(olderId);
  expect(await page.evaluate(() => (window as unknown as CourseSaveWindow).courseSaveGate.sessions)).toEqual([olderId, newerId]);
  await page.evaluate(() => (window as unknown as CourseSaveWindow).courseSaveGate.release(0));
  // The real repository update proves the old save finished while the new hash
  // is still held; no artificial timeout is used to assume an asynchronous save.
  await expect(page.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible();
  await expect(page.locator(".course-save-status")).toHaveText("Saving this attempt…");
  await expect(page.locator(".course-save-status")).toHaveAttribute("data-session-id", newerId);
  await expect(page.getByRole("button", { name: "Repeat this passage", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Start the next passage", exact: true })).toBeDisabled();
  await page.getByText("View full session results", { exact: true }).click();
  await expect(page.locator(".course-full-result")).toContainText("Saving this attempt on this device…");
  await expect(page.locator(".course-full-result")).not.toContainText("Saved on this device. Sign in to enable account sync.");
  await page.evaluate(() => (window as unknown as CourseSaveWindow).courseSaveGate.release(1));
  await expect(page.locator(".course-save-status")).toContainText("Saved on this device.");
  await expect(page.locator(".course-save-status")).toHaveAttribute("data-session-id", newerId);
  await expect(page.getByRole("button", { name: "Repeat this passage", exact: true })).toBeEnabled();
  await expect(page.locator(".course-full-result")).not.toContainText("This attempt has not been saved yet.");
  await expect(page.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible();
  await info.attach("course-save-order", { body: JSON.stringify({ olderId, newerId, oldSave: "resolved while current pending", scopedDetailedStatus: true, currentSaveReleasedSeparately: true }), contentType: "application/json" });
});

test("the full course has 36 lessons, two independent entry paths and honest locked previews", async ({ page }) => {
  await page.goto("/lessons");
  await expect(page.getByRole("heading", { name: /Find your rhythm/ })).toBeVisible();
  expect(await page.getByRole("heading", { name: /Find your rhythm/ }).evaluate(element => getComputedStyle(element).fontFamily.split(",")[0].replaceAll('"', "").trim())).toBe("Sora");
  await expect(page.locator(".course-chapter")).toHaveCount(6);
  await expect(page.locator(".course-lesson")).toHaveCount(36);
  await expect(page.locator(".course-lesson[data-status='available']")).toHaveCount(2);
  const lockedLesson = page.getByRole("button", { name: new RegExp(second.title) });
  await expect(lockedLesson).toHaveAttribute("data-status", "locked");
  await lockedLesson.click();
  await expect(page.getByRole("heading", { name: second.title, exact: true })).toBeFocused();
  await expect(page.getByText("Build the previous skill first.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start lesson", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "All lessons", exact: true }).click();
  await page.getByRole("button", { name: "Train your speed", exact: true }).click();
  await expect(page).toHaveURL(`/lessons?lesson=${speed.id}`);
  await expect(page.getByRole("button", { name: "Start lesson", exact: true })).toBeEnabled();
});

test("two different measured passages unlock the next lesson; repetition, reload and reset are truthful", async ({ page }) => {
  test.setTimeout(60_000);
  await start(page);
  await qualify(page);
  await expect(page.getByRole("heading", { name: "Checkpoint earned.", exact: true })).toBeVisible();
  await expect(page.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Repeat this passage", exact: true }).click();
  await qualify(page);
  await expect(page.getByRole("heading", { name: "Skill reinforced.", exact: true })).toBeVisible();
  await expect(page.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start the next passage", exact: true }).click();
  await expect(page.locator(".course-practice-top")).toContainText("passage B");
  await qualify(page, "b");
  await expect(page.getByRole("heading", { name: "Lesson complete.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next lesson", exact: true }).click();
  await expect(page.getByRole("heading", { name: second.title, exact: true })).toBeFocused();
  await page.reload();
  await expect(page.getByRole("button", { name: "Start lesson", exact: true })).toBeEnabled();
  await page.goto("/profile");
  await page.getByLabel("Type DELETE to enable this action", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Reset guest workspace", exact: true }).click();
  await page.goto(`/lessons?lesson=${second.id}`);
  await expect(page.getByText("Build the previous skill first.", { exact: true })).toBeVisible();
});

test("corrected errors retain their accuracy cost and an early finish never earns a checkpoint", async ({ page }) => {
  let input = await start(page);
  for (let index = 0; index < 4; index++) {
    await input.press("x");
    await input.press("Backspace");
  }
  await qualify(page);
  await expect(page.getByRole("heading", { name: "A useful attempt. Try again.", exact: true })).toBeVisible();
  await expect(page.locator(".course-outcome-checks li").filter({ hasText: "95% input accuracy" })).toHaveAttribute("data-passed", "false");
  await expect(page.getByText("0 of 2 checkpoints", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try the next passage", exact: true }).click();
  input = await focusTyping(page);
  await input.pressSequentially("fj jf");
  await input.press("Control+Enter");
  await expect(page.getByRole("heading", { name: "A useful attempt. Try again.", exact: true })).toBeVisible();
  await expect(page.locator(".course-outcome-checks li").first()).toHaveAttribute("data-passed", "false");
  await expect(page.getByText("0 of 2 checkpoints", { exact: true })).toBeVisible();
});

test("correct submitted words stay locked and Tab then Enter preserves the course contract with a fresh variant", async ({ page }) => {
  const input = await start(page);
  await input.pressSequentially("fj ");
  await input.press("Backspace");
  await input.press("Control+Backspace");
  await expect(input).toHaveValue("fj ");
  await input.pressSequentially("jx");
  await input.press("Backspace");
  await expect(input).toHaveValue("fj j");
  const session = page.getByRole("region", { name: "Typing session", exact: true });
  const id = await session.getAttribute("data-session-id");
  await input.press("Tab");
  const restart = page.getByRole("button", { name: "Restart with new text", exact: true });
  await expect(restart).toBeFocused();
  await restart.press("Enter");
  await expect(session).not.toHaveAttribute("data-session-id", id!);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.locator(".course-practice-top")).toContainText("passage B");
  await expect(page.getByTestId("live-keyboard-board").locator("[data-pressed-key]")).toHaveCount(0);
});

test("a real uninterrupted 30-second speed assessment includes idle time and saves its checkpoint", async ({ page }, info) => {
  test.setTimeout(50_000);
  const input = await start(page, speed);
  const text = speed.variants[0].text.slice(0, 90).split(" ").slice(0, -1).join(" ") + " ";
  const began = performance.now();
  await input.pressSequentially(text, { delay: 65 });
  await expect(page.getByRole("region", { name: "Course lesson result", exact: true })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByRole("heading", { name: "Checkpoint earned.", exact: true })).toBeVisible();
  const duration = performance.now() - began;
  expect(duration).toBeGreaterThanOrEqual(29_500);
  await expect(page.locator(".course-outcome-checks li[data-passed='true']")).toHaveCount(4);
  await info.attach("natural-speed-clock", { body: JSON.stringify({ driverWallMs: duration, characters: text.length, acceleratedClock: false }), contentType: "application/json" });
});

test("paused speed practice cannot qualify and never describes the attempt as uninterrupted", async ({ page }) => {
  await page.clock.install();
  const input = await start(page, speed);
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  await input.pressSequentially(speed.variants[0].text.slice(0, 90));
  await page.clock.fastForward(5000);
  await input.press("Escape");
  await page.clock.fastForward(2000);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.fastForward(30_000);
  await expect(page.getByRole("heading", { name: "A useful attempt. Try again.", exact: true })).toBeVisible();
  await expect(page.getByText("0 of 2 checkpoints", { exact: true })).toBeVisible();
  await expect(page.locator(".course-outcome-checks")).toContainText(/paused|pause|uninterrupted required/i);
  await expect(page.locator(".course-outcome-checks li").first()).toHaveAttribute("data-passed", "false");
});

test("lesson navigation restores focus and scroll, handles invalid links and keeps global layout preferences", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  await page.getByRole("combobox", { name: "Keyboard layout", exact: true }).selectOption("dvorak");
  await page.goto("/lessons");
  await page.locator(".course-chapter-heading").last().click();
  const speedLesson = page.getByRole("button", { name: new RegExp(speed.title) });
  await expect(speedLesson).toHaveAttribute("data-status", "available");
  await speedLesson.click();
  await expect(page.getByRole("heading", { name: speed.title, exact: true })).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeLessThan(250);
  await expect(page.getByText("This course teaches English and US QWERTY.", { exact: false })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: /Find your rhythm/ })).toBeFocused();
  await page.goto("/lessons?lesson=unlisted");
  await expect(page.getByRole("heading", { name: "This lesson is not in the current course.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to lessons", exact: true }).click();
  await page.goto("/settings");
  await expect(page.getByRole("combobox", { name: "Keyboard layout", exact: true })).toHaveValue("dvorak");
});

for (const width of [320, 1440]) {
  test(`course overview, preview, active keyboard and result fit and pass automated accessibility at ${width}px`, async ({ page }, info) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    const receipts: unknown[] = [];
    async function inspect(state: string) {
      await settlePageVisuals(page);
      await page.evaluate(axe.source);
      const receipt = await page.evaluate(async () => {
        const report = await (window as unknown as Window & { axe: typeof axe }).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } });
        const workspace = document.querySelector(".typing-workspace");
        return { workspaceOpacity: workspace ? getComputedStyle(workspace).opacity : null, overflow: document.documentElement.scrollWidth > innerWidth + 1, violations: report.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), incomplete: report.incomplete.map(rule => rule.id) };
      });
      receipts.push({ state, width, ...receipt });
      expect.soft(receipt.overflow, state).toBe(false);
      if (receipt.workspaceOpacity !== null) expect.soft(receipt.workspaceOpacity, `${state}: settled workspace`).toBe("1");
      expect.soft(receipt.violations, `${state}: ${JSON.stringify(receipt.violations)}`).toEqual([]);
    }
    await page.goto("/lessons"); await inspect("overview");
    await page.getByRole("button", { name: "Start learning", exact: true }).click(); await inspect("preview");
    await page.getByRole("button", { name: "Start lesson", exact: true }).click(); await focusTyping(page); await inspect("active");
    if (width === 1440) {
      const board = await page.getByTestId("live-keyboard-board").boundingBox();
      expect(board!.y + board!.height).toBeLessThanOrEqual(900);
    }
    await page.locator(".course-technique summary").click();
    await expect(page.locator(".course-technique-body")).toContainText("Rest your index fingers on F and J");
    await inspect("technique-disclosure");
    await page.locator(".course-technique summary").click();
    await qualify(page); await inspect("result");
    await info.attach("course-responsive-accessibility", { body: JSON.stringify(receipts), contentType: "application/json" });
  });
}
