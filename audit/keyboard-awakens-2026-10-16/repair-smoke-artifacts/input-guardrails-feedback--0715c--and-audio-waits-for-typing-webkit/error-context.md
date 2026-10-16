# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: input-guardrails.spec.ts >> feedback preferences persist, outline carets render in both modes, and audio waits for typing
- Location: e2e\input-guardrails.spec.ts:62:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: undefined
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - banner [ref=f2e4]:
    - link "Skip to content" [ref=f2e5]:
      - /url: "#main-content"
    - generic [ref=f2e6]:
      - link "SparowType home" [ref=f2e7]:
        - /url: /
        - generic [ref=f2e8]:
          - generic [ref=f2e9]: Sparow
          - generic [ref=f2e10]: Type
      - generic [ref=f2e11]:
        - button "Switch to light theme" [ref=f2e12]
        - button "Open command palette" [ref=f2e19]
        - link "Settings" [ref=f2e22]:
          - /url: /settings
        - link "Sign in" [ref=f2e26]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=f2e31]:
      - link "Test" [ref=f2e32]:
        - /url: /
      - link "Learn" [ref=f2e35]:
        - /url: /learn
      - link "Race" [ref=f2e39]:
        - /url: /race
      - link "Stats" [ref=f2e49]:
        - /url: /stats
      - link "Rankings" [ref=f2e52]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=f2e59]:
        - /url: /keyboard-lab
  - main [ref=f2e62]:
    - heading "Typing practice" [level=1] [ref=f2e63]
    - region "Test configuration" [ref=f2e64]:
      - group "Test mode" [ref=f2e66]:
        - button "Time" [ref=f2e67]
        - button "Words" [ref=f2e71]
        - button "Quote" [ref=f2e74]
        - button "Code" [ref=f2e78]
        - button "Custom" [pressed] [ref=f2e83]
        - button "Zen" [ref=f2e87]
      - generic [ref=f2e90]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=f2e91]:
          - checkbox "Precision mode · stop on errors" [ref=f2e92]
          - text: Precision mode · stop on errors
        - paragraph [ref=f2e93]: Your own text. Stored on this device unless you choose to upload.
    - region "Typing session" [ref=f2e94]:
      - generic [ref=f2e95]:
        - generic [ref=f2e96]:
          - generic [ref=f2e97]:
            - generic [ref=f2e98]: 0s
            - generic [ref=f2e99]: elapsed
          - generic [ref=f2e100]: —wpm
          - generic [ref=f2e101]: —acc %
        - generic [ref=f2e102]: Ready when you are
      - generic [ref=f2e104]:
        - generic [ref=f2e106]:
          - generic [ref=f2e107]:
            - generic [ref=f2e108]: c
            - generic [ref=f2e109]: a
            - generic [ref=f2e110]: t
          - generic [ref=f2e112]:
            - generic [ref=f2e113]: d
            - generic [ref=f2e114]: o
            - generic [ref=f2e115]: g
        - paragraph [ref=f2e116]: "Practice passage: cat dog"
        - textbox "Typing input" [active] [ref=f2e117]
      - generic [ref=f2e119]:
        - paragraph [ref=f2e120]: Type the text above. Wrong letters stay visible; Backspace corrects.
        - status [ref=f2e121]
      - generic [ref=f2e122]:
        - paragraph [ref=f2e123]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
        - generic [ref=f2e124]:
          - button "Restart with new text" [ref=f2e125]
          - button "Show accessible text editor" [ref=f2e129]
          - button "Finish" [disabled] [ref=f2e133]
      - status [ref=f2e136]: Ready to type
  - contentinfo [ref=f2e137]:
    - generic [ref=f2e138]:
      - generic [ref=f2e139]:
        - generic [ref=f2e140]:
          - generic [ref=f2e141]: Sparow
          - generic [ref=f2e142]: Type
        - text: Find your rhythm.
      - generic [ref=f2e143]:
        - link "About & metrics" [ref=f2e144]:
          - /url: /about
        - link "Preferences & data" [ref=f2e145]:
          - /url: /settings
        - link "Touch typing guide" [ref=f2e146]:
          - /url: /touch-typing
        - link "Privacy" [ref=f2e147]:
          - /url: /privacy
        - link "Terms" [ref=f2e148]:
          - /url: /terms
        - link "Offline" [ref=f2e149]:
          - /url: /offline
        - generic [ref=f2e150]: SparowType © 2026
```

# Test source

```ts
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
  64  |     const tracked = window as Window & {
  65  |       audioContexts: number;
  66  |       disposedAudioContexts: number;
  67  |       audioConstructorInstalled: boolean;
  68  |     };
  69  |     tracked.audioContexts = 0;
  70  |     tracked.disposedAudioContexts = 0;
  71  |     const Original = window.AudioContext;
  72  |     const instrumented = new Proxy(Original, {
  73  |       construct(target, args) {
  74  |         tracked.audioContexts++;
  75  |         const context = Reflect.construct(target, args) as AudioContext;
  76  |         const close = context.close.bind(context);
  77  |         context.close = () => { tracked.disposedAudioContexts++; return close(); };
  78  |         return context;
  79  |       },
  80  |     });
  81  |     Object.defineProperty(window, "AudioContext", { configurable: true, writable: true, value: instrumented });
  82  |     tracked.audioConstructorInstalled = window.AudioContext === instrumented && AudioContext === instrumented;
  83  |   });
  84  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  85  |   await page.getByRole("combobox", { name: "Caret style", exact: true }).selectOption("outline");
  86  |   await page.getByRole("checkbox", { name: "Reduced motion", exact: true }).check();
  87  |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  88  |   const packs = page.getByRole("combobox", { name: "Sound pack", exact: true });
  89  |   await expect(packs.getByRole("option")).toHaveCount(5);
  90  |   await packs.selectOption("mechanical");
  91  |   await page.reload({ waitUntil: "domcontentloaded" });
  92  |   await expect(packs).toHaveValue("mechanical");
  93  |   await expect(page.getByRole("checkbox", { name: "Reduced motion", exact: true })).toBeChecked();
  94  |   await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
  95  |   expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  96  | 
  97  |   const input = await customPractice(page, "cat dog");
  98  |   await page.waitForFunction(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  99  |     .some((resource) => resource.name.includes("keyboard-audio") && resource.responseEnd > 0));
  100 |   // A completed resource download can precede module evaluation and the adapter's
  101 |   // prewarm callback. Await the already requested module, without unlocking audio.
  102 |   await page.evaluate(async () => {
  103 |     const resource = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  104 |       .find((entry) => entry.name.includes("keyboard-audio") && entry.responseEnd > 0)!;
  105 |     await import(resource.name);
  106 |   });
> 107 |   expect(await page.evaluate(() => (window as Window & { audioConstructorInstalled: boolean }).audioConstructorInstalled)).toBe(true);
      |                                                                                                                            ^ Error: expect(received).toBe(expected) // Object.is equality
  108 |   expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  109 |   const caret = page.locator('[data-testid="typing-viewport"] > .caret-outline');
  110 |   await expect(caret).toBeVisible();
  111 |   await expect(caret).toHaveCSS("border-top-width", "2px");
  112 |   await expect(caret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  113 |   await expect(caret).toHaveCSS("transition-property", "none");
  114 |   await expect(page.getByTestId("typing-input-notice")).toHaveCount(0);
  115 |   await reportCapsLock(input, true);
  116 |   await expect(page.getByTestId("typing-input-notice")).toContainText("Caps Lock is on.");
  117 |   await reportCapsLock(input, false);
  118 |   await input.pressSequentially("cat");
  119 |   await expect.poll(() => page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(1);
  120 |   await page.getByRole("link", { name: "Settings", exact: true }).click();
  121 |   await expect(page.getByRole("heading", { name: "Your practice, your space.", exact: true })).toBeVisible();
  122 |   await expect.poll(() => page.evaluate(() => (window as Window & { disposedAudioContexts: number }).disposedAudioContexts)).toBe(1);
  123 |   await page.goto("/learn", { waitUntil: "domcontentloaded" });
  124 |   await page.getByRole("textbox", { name: "Type the practice text", exact: true }).focus();
  125 |   const learnCaret = page.locator(".learn-caret.caret-outline");
  126 |   await expect(learnCaret).toBeVisible();
  127 |   await expect(learnCaret).toHaveCSS("border-top-width", "2px");
  128 |   await expect(learnCaret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  129 |   await expect(learnCaret).toHaveCSS("transition-property", "none");
  130 | });
  131 | 
  132 | test("idle practice has no 100ms interval and the active deadline still persists exactly", async ({ page }) => {
  133 |   await page.clock.install();
  134 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  135 |   await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
  136 |   await page.evaluate(() => {
  137 |     const tracked = window as Window & { practiceIntervals: number };
  138 |     tracked.practiceIntervals = 0;
  139 |     const interval = window.setInterval.bind(window);
  140 |     window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  141 |       if (timeout === 100) tracked.practiceIntervals++;
  142 |       return interval(handler, timeout, ...args);
  143 |     }) as typeof window.setInterval;
  144 |   });
  145 |   await page.getByRole("group", { name: "Test duration", exact: true }).getByRole("button", { name: "15 seconds", exact: true }).click();
  146 |   const input = await focusTyping(page);
  147 |   const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
  148 |   await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  149 |   await page.clock.fastForward(60_000);
  150 |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  151 |   expect(await page.evaluate(() => (window as Window & { practiceIntervals: number }).practiceIntervals)).toBe(0);
  152 |   await input.press(first);
  153 |   await page.clock.fastForward(16_000);
  154 |   await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  155 |   const result = await exportedResult(page);
  156 |   expect(result.elapsedMs).toBe(15_000);
  157 |   expect(result.metrics.insertionAttempts).toBe(1);
  158 |   await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  159 |   await page.goto("/stats", { waitUntil: "domcontentloaded" });
  160 |   await expect(page.getByRole("table", { name: "Completed sessions, most recent first", exact: true }).getByRole("row").nth(1)).toContainText("15.0s");
  161 | });
  162 | 
```