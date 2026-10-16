# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: input-guardrails.spec.ts >> feedback preferences persist, outline carets render in both modes, and audio waits for typing
- Location: e2e\input-guardrails.spec.ts:62:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="typing-viewport"] > .caret-outline')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-testid="typing-viewport"] > .caret-outline') with timeout 5000ms
  - waiting for locator('[data-testid="typing-viewport"] > .caret-outline')

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "SparowType home":
    - /url: /
    - text: Sparow Type
  - navigation "Main navigation":
    - link "Test":
      - /url: /
      - img
      - text: Test
    - link "Learn":
      - /url: /learn
      - img
      - text: Learn
    - link "Race":
      - /url: /race
      - img
      - text: Race
    - link "Stats":
      - /url: /stats
      - img
      - text: Stats
    - link "Rankings":
      - /url: /leaderboard
      - img
      - text: Rankings
    - link "Keyboard Lab":
      - /url: /keyboard-lab
      - img
      - text: Keyboard Lab
  - button "Switch to light theme":
    - img
  - button "Open command palette":
    - img
  - link "Settings":
    - /url: /settings
    - img
  - link "Sign in":
    - /url: /auth
    - img
    - text: Sign in
- main:
  - heading "Typing practice" [level=1]
  - region "Test configuration":
    - group "Test mode":
      - button "Time":
        - img
        - text: Time
      - button "Words":
        - img
        - text: Words
      - button "Quote":
        - img
        - text: Quote
      - button "Code":
        - img
        - text: Code
      - button "Custom" [pressed]:
        - img
        - text: Custom
      - button "Zen":
        - img
        - text: Zen
    - checkbox "Precision mode · stop on errors"
    - text: Precision mode · stop on errors
    - paragraph: Your own text. Stored on this device unless you choose to upload.
  - region "Typing session":
    - text: 0s elapsed —wpm —acc % Ready when you are
    - paragraph: "Practice passage: cat dog"
    - textbox "Typing input"
    - paragraph: Type the text above. Wrong letters stay visible; Backspace corrects.
    - status
    - paragraph: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
    - button "Restart with new text":
      - img
    - button "Show accessible text editor":
      - img
    - button "Finish" [disabled]:
      - img
      - text: Finish
    - status: Ready to type
- contentinfo:
  - text: Sparow Type Find your rhythm.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - link "Touch typing guide":
    - /url: /touch-typing
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - link "Offline":
    - /url: /offline
  - text: SparowType © 2026
```

# Test source

```ts
  1   | import { expect, test, type Locator } from "@playwright/test";
  2   | import { customPractice, exportedResult, focusTyping } from "./helpers";
  3   | 
  4   | test.beforeEach(async ({ page }) => {
  5   |   await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  6   | });
  7   | 
  8   | async function blockedTransferEvents(input: Locator) {
  9   |   return input.evaluate((element) => [
  10  |     new Event("paste", { bubbles: true, cancelable: true }),
  11  |     new Event("drop", { bubbles: true, cancelable: true }),
  12  |     new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertFromPaste", data: "cat" }),
  13  |     new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertFromDrop", data: "cat" }),
  14  |   ].map((event) => !element.dispatchEvent(event)));
  15  | }
  16  | 
  17  | async function reportCapsLock(input: Locator, enabled: boolean) {
  18  |   await input.evaluate((element, state) => {
  19  |     const event = new KeyboardEvent("keydown", { key: "CapsLock", code: "CapsLock", bubbles: true });
  20  |     Object.defineProperty(event, "getModifierState", { value: (modifier: string) => modifier === "CapsLock" && state });
  21  |     element.dispatchEvent(event);
  22  |   }, enabled);
  23  | }
  24  | 
  25  | test("paste and drop stay outside the practice transcript and never start its clock", async ({ page }) => {
  26  |   const input = await customPractice(page, "cat");
  27  |   expect(await blockedTransferEvents(input)).toEqual([true, true, true, true]);
  28  |   await expect(input).toHaveValue("");
  29  |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  30  |   await expect(page.getByTestId("typing-input-notice")).toHaveText("Paste is disabled during typing practice.");
  31  |   // A browser that reports the transfer only at input is also rejected.
  32  |   await input.evaluate((element) => {
  33  |     const textarea = element as HTMLTextAreaElement;
  34  |     Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "cat");
  35  |     textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromDrop", data: "cat" }));
  36  |   });
  37  |   await expect(input).toHaveValue("");
  38  |   await input.pressSequentially("cat");
  39  |   await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  40  |   const result = await exportedResult(page);
  41  |   expect(result.metrics.insertionAttempts).toBe(3);
  42  |   expect(result.metrics.inputAccuracy).toBe(100);
  43  |   expect(result.events.every((event) => event.provenance === "keyboard")).toBe(true);
  44  | });
  45  | 
  46  | test("adaptive practice blocks transfer input and reports only observed Caps Lock state", async ({ page }) => {
  47  |   await page.goto("/learn", { waitUntil: "domcontentloaded" });
  48  |   const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  49  |   await expect(input).toBeVisible();
  50  |   await input.focus();
  51  |   await expect(page.getByTestId("lesson-input-notice")).toHaveCount(0);
  52  |   expect(await blockedTransferEvents(input)).toEqual([true, true, true, true]);
  53  |   await expect(input).toHaveValue("");
  54  |   await expect(page.getByRole("progressbar", { name: "Lesson progress", exact: true })).toHaveAttribute("value", "0");
  55  |   await expect(page.getByRole("status").filter({ hasText: "Paste is disabled during typing practice." })).toBeVisible();
  56  |   await reportCapsLock(input, true);
  57  |   await expect(page.getByTestId("lesson-input-notice")).toHaveText("Caps Lock is on.");
  58  |   await reportCapsLock(input, false);
  59  |   await expect(page.getByTestId("lesson-input-notice")).toHaveCount(0);
  60  | });
  61  | 
  62  | test("feedback preferences persist, outline carets render in both modes, and audio waits for typing", async ({ page }) => {
  63  |   await page.addInitScript(() => {
  64  |     const tracked = window as Window & { audioContexts: number; disposedAudioContexts: number };
  65  |     tracked.audioContexts = 0;
  66  |     tracked.disposedAudioContexts = 0;
  67  |     const Original = window.AudioContext;
  68  |     window.AudioContext = new Proxy(Original, {
  69  |       construct(target, args) {
  70  |         tracked.audioContexts++;
  71  |         const context = Reflect.construct(target, args) as AudioContext;
  72  |         const close = context.close.bind(context);
  73  |         context.close = () => { tracked.disposedAudioContexts++; return close(); };
  74  |         return context;
  75  |       },
  76  |     });
  77  |   });
  78  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  79  |   await page.getByRole("combobox", { name: "Caret style", exact: true }).selectOption("outline");
  80  |   await page.getByRole("checkbox", { name: "Reduced motion", exact: true }).check();
  81  |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  82  |   const packs = page.getByRole("combobox", { name: "Sound pack", exact: true });
  83  |   await expect(packs.getByRole("option")).toHaveCount(5);
  84  |   await packs.selectOption("mechanical");
  85  |   await page.reload({ waitUntil: "domcontentloaded" });
  86  |   await expect(packs).toHaveValue("mechanical");
  87  |   await expect(page.getByRole("checkbox", { name: "Reduced motion", exact: true })).toBeChecked();
  88  |   await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
  89  |   expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  90  | 
  91  |   const input = await customPractice(page, "cat dog");
  92  |   await page.waitForFunction(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  93  |     .some((resource) => resource.name.includes("keyboard-audio") && resource.responseEnd > 0));
  94  |   expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  95  |   const caret = page.locator('[data-testid="typing-viewport"] > .caret-outline');
> 96  |   await expect(caret).toBeVisible();
      |                       ^ Error: expect(locator).toBeVisible() failed
  97  |   await expect(caret).toHaveCSS("border-top-width", "2px");
  98  |   await expect(caret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  99  |   await expect(caret).toHaveCSS("transition-property", "none");
  100 |   await expect(page.getByTestId("typing-input-notice")).toHaveCount(0);
  101 |   await reportCapsLock(input, true);
  102 |   await expect(page.getByTestId("typing-input-notice")).toContainText("Caps Lock is on.");
  103 |   await reportCapsLock(input, false);
  104 |   await input.pressSequentially("cat");
  105 |   await expect.poll(() => page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(1);
  106 |   await page.getByRole("link", { name: "Settings", exact: true }).click();
  107 |   await expect(page.getByRole("heading", { name: "Your practice, your space.", exact: true })).toBeVisible();
  108 |   await expect.poll(() => page.evaluate(() => (window as Window & { disposedAudioContexts: number }).disposedAudioContexts)).toBe(1);
  109 |   await page.goto("/learn", { waitUntil: "domcontentloaded" });
  110 |   await page.getByRole("textbox", { name: "Type the practice text", exact: true }).focus();
  111 |   const learnCaret = page.locator(".learn-caret.caret-outline");
  112 |   await expect(learnCaret).toBeVisible();
  113 |   await expect(learnCaret).toHaveCSS("border-top-width", "2px");
  114 |   await expect(learnCaret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  115 |   await expect(learnCaret).toHaveCSS("transition-property", "none");
  116 | });
  117 | 
  118 | test("idle practice has no 100ms interval and the active deadline still persists exactly", async ({ page }) => {
  119 |   await page.clock.install();
  120 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  121 |   await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
  122 |   await page.evaluate(() => {
  123 |     const tracked = window as Window & { practiceIntervals: number };
  124 |     tracked.practiceIntervals = 0;
  125 |     const interval = window.setInterval.bind(window);
  126 |     window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  127 |       if (timeout === 100) tracked.practiceIntervals++;
  128 |       return interval(handler, timeout, ...args);
  129 |     }) as typeof window.setInterval;
  130 |   });
  131 |   await page.getByRole("group", { name: "Test duration", exact: true }).getByRole("button", { name: "15 seconds", exact: true }).click();
  132 |   const input = await focusTyping(page);
  133 |   const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
  134 |   await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  135 |   await page.clock.fastForward(60_000);
  136 |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  137 |   expect(await page.evaluate(() => (window as Window & { practiceIntervals: number }).practiceIntervals)).toBe(0);
  138 |   await input.press(first);
  139 |   await page.clock.fastForward(16_000);
  140 |   await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  141 |   const result = await exportedResult(page);
  142 |   expect(result.elapsedMs).toBe(15_000);
  143 |   expect(result.metrics.insertionAttempts).toBe(1);
  144 |   await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  145 |   await page.goto("/stats", { waitUntil: "domcontentloaded" });
  146 |   await expect(page.getByRole("table", { name: "Completed sessions, most recent first", exact: true }).getByRole("row").nth(1)).toContainText("15.0s");
  147 | });
  148 | 
```