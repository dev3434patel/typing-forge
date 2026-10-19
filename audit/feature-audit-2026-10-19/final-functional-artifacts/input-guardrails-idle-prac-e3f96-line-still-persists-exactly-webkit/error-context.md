# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: input-guardrails.spec.ts >> idle practice has no 100ms interval and the active deadline still persists exactly
- Location: e2e\input-guardrails.spec.ts:150:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('group', { name: 'Test duration', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('group', { name: 'Test duration', exact: true }) with timeout 5000ms
  - waiting for getByRole('group', { name: 'Test duration', exact: true })

```

```yaml
- main "Typing workspace":
  - status: Preparing your typing workspace…
```

# Test source

```ts
  53  |   await expect(input).toHaveValue("");
  54  |   await expect(page.getByRole("progressbar", { name: "Lesson progress", exact: true })).toHaveAttribute("value", "0");
  55  |   await expect(page.getByRole("status").filter({ hasText: "Paste is disabled during typing practice." })).toBeVisible();
  56  |   await reportCapsLock(input, true);
  57  |   await expect(page.getByTestId("lesson-input-notice")).toHaveText("Caps Lock is on.");
  58  |   await reportCapsLock(input, false);
  59  |   await expect(page.getByTestId("lesson-input-notice")).toHaveCount(0);
  60  | });
  61  | 
  62  | test("feedback preferences persist and outline carets respect reduced motion in both modes", async ({ page }) => {
  63  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  64  |   await page.getByRole("combobox", { name: "Caret style", exact: true }).selectOption("outline");
  65  |   await page.getByRole("checkbox", { name: "Reduced motion", exact: true }).check();
  66  |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  67  |   const packs = page.getByRole("combobox", { name: "Sound pack", exact: true });
  68  |   await expect(packs.getByRole("option")).toHaveCount(5);
  69  |   await packs.selectOption("mechanical");
  70  |   await page.reload({ waitUntil: "domcontentloaded" });
  71  |   await expect(packs).toHaveValue("mechanical");
  72  |   await expect(page.getByRole("checkbox", { name: "Reduced motion", exact: true })).toBeChecked();
  73  |   await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
  74  |   const input = await customPractice(page, "cat dog");
  75  |   const caret = page.locator('[data-testid="typing-viewport"] > .caret-outline');
  76  |   await expect(caret).toBeVisible();
  77  |   await expect(caret).toHaveCSS("border-top-width", "2px");
  78  |   await expect(caret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  79  |   await expect(caret).toHaveCSS("transition-property", "none");
  80  |   await expect(page.getByTestId("typing-input-notice")).toHaveCount(0);
  81  |   await reportCapsLock(input, true);
  82  |   await expect(page.getByTestId("typing-input-notice")).toContainText("Caps Lock is on.");
  83  |   await reportCapsLock(input, false);
  84  |   await input.pressSequentially("cat");
  85  |   await expect(input).toHaveValue("cat");
  86  |   await page.goto("/learn", { waitUntil: "domcontentloaded" });
  87  |   await page.getByRole("textbox", { name: "Type the practice text", exact: true }).focus();
  88  |   const learnCaret = page.locator(".learn-caret.caret-outline");
  89  |   await expect(learnCaret).toBeVisible();
  90  |   await expect(learnCaret).toHaveCSS("border-top-width", "2px");
  91  |   await expect(learnCaret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  92  |   await expect(learnCaret).toHaveCSS("transition-property", "none");
  93  | });
  94  | 
  95  | test("supported typing audio creates one context on input and disposes it on navigation", async ({ page }) => {
  96  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  97  |   const supported = await page.evaluate(() => typeof AudioContext === "function");
  98  |   test.skip(!supported, "UNVERIFIED: this browser runner exposes no standard AudioContext API; this is not a native Safari capability claim.");
  99  |   await page.addInitScript(() => {
  100 |     const tracked = window as Window & {
  101 |       audioContexts: number;
  102 |       disposedAudioContexts: number;
  103 |       audioConstructorInstalled: boolean;
  104 |     };
  105 |     tracked.audioContexts = 0;
  106 |     tracked.disposedAudioContexts = 0;
  107 |     const instrumented = new Proxy(window.AudioContext, {
  108 |       construct(target, args) {
  109 |         tracked.audioContexts++;
  110 |         const context = Reflect.construct(target, args) as AudioContext;
  111 |         const close = context.close.bind(context);
  112 |         context.close = () => { tracked.disposedAudioContexts++; return close(); };
  113 |         return context;
  114 |       },
  115 |     });
  116 |     Object.defineProperty(window, "AudioContext", { configurable: true, writable: true, value: instrumented });
  117 |     tracked.audioConstructorInstalled = window.AudioContext === instrumented && AudioContext === instrumented;
  118 |   });
  119 |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  120 |   await page.getByRole("combobox", { name: "Sound pack", exact: true }).selectOption("mechanical");
  121 |   const input = await customPractice(page, "cat dog");
  122 |   await page.waitForFunction(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  123 |     .some((resource) => resource.name.includes("keyboard-audio") && resource.responseEnd > 0));
  124 |   // Download completion alone does not establish dynamic-import evaluation.
  125 |   await page.evaluate(async () => {
  126 |     const resource = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
  127 |       .find((entry) => entry.name.includes("keyboard-audio") && entry.responseEnd > 0)!;
  128 |     await import(resource.name);
  129 |   });
  130 |   expect(await page.evaluate(() => (window as Window & { audioConstructorInstalled: boolean }).audioConstructorInstalled)).toBe(true);
  131 |   expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  132 |   await input.pressSequentially("cat");
  133 |   await expect.poll(() => page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(1);
  134 |   await page.getByRole("link", { name: "Settings", exact: true }).click();
  135 |   await expect(page.getByRole("heading", { name: "Your practice, your space.", exact: true })).toBeVisible();
  136 |   await expect.poll(() => page.evaluate(() => (window as Window & { disposedAudioContexts: number }).disposedAudioContexts)).toBe(1);
  137 | });
  138 | 
  139 | test("unavailable browser audio is explained without clearing the saved sound preference", async ({ page }) => {
  140 |   await page.addInitScript(() => Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined }));
  141 |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  142 |   const notice = page.getByRole("status").filter({ hasText: "Typing sound is unavailable in this browser." });
  143 |   await expect(notice).toBeVisible();
  144 |   await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  145 |   await page.reload({ waitUntil: "domcontentloaded" });
  146 |   await expect(notice).toBeVisible();
  147 |   await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
  148 | });
  149 | 
  150 | test("idle practice has no 100ms interval and the active deadline still persists exactly", async ({ page }) => {
  151 |   await page.clock.install();
  152 |   await page.goto("/", { waitUntil: "domcontentloaded" });
> 153 |   await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
      |                                                                                 ^ Error: expect(locator).toBeVisible() failed
  154 |   await page.evaluate(() => {
  155 |     const tracked = window as Window & { practiceIntervals: number };
  156 |     tracked.practiceIntervals = 0;
  157 |     const interval = window.setInterval.bind(window);
  158 |     window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  159 |       if (timeout === 100) tracked.practiceIntervals++;
  160 |       return interval(handler, timeout, ...args);
  161 |     }) as typeof window.setInterval;
  162 |   });
  163 |   await page.getByRole("group", { name: "Test duration", exact: true }).getByRole("button", { name: "15 seconds", exact: true }).click();
  164 |   const input = await focusTyping(page);
  165 |   const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
  166 |   await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  167 |   await page.clock.fastForward(60_000);
  168 |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  169 |   expect(await page.evaluate(() => (window as Window & { practiceIntervals: number }).practiceIntervals)).toBe(0);
  170 |   await input.press(first);
  171 |   await page.clock.fastForward(16_000);
  172 |   await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  173 |   const result = await exportedResult(page);
  174 |   expect(result.elapsedMs).toBe(15_000);
  175 |   expect(result.metrics.insertionAttempts).toBe(1);
  176 |   await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  177 |   await page.goto("/stats", { waitUntil: "domcontentloaded" });
  178 |   await expect(page.getByRole("table", { name: "Completed sessions, most recent first", exact: true }).getByRole("row").nth(1)).toContainText("15.0s");
  179 | });
  180 | 
```