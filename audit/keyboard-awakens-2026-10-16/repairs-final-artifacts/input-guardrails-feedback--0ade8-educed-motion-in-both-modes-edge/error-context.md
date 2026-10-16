# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: input-guardrails.spec.ts >> feedback preferences persist and outline carets respect reduced motion in both modes
- Location: e2e\input-guardrails.spec.ts:62:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.check: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('checkbox', { name: 'Reduced motion', exact: true })
    - locator resolved to <input type="checkbox" aria-label="Reduced motion" class="size-5 shrink-0 accent-[var(--forge-accent)]"/>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "SparowType home" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e8]:
          - generic [ref=e9]: Sparow
          - generic [ref=e10]: Type
      - navigation "Main navigation" [ref=e11]:
        - link "Test" [ref=e12] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e15] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e19] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e29] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e32] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e39] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e42]:
        - button "Switch to light theme" [ref=e43]
        - button "Open command palette" [ref=e50]
        - link "Settings" [ref=e53] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e57] [cursor=pointer]:
          - /url: /auth
  - main [ref=e62]:
    - paragraph [ref=e63]: Make it yours
    - heading "Your practice, your space." [level=1] [ref=e64]
    - paragraph [ref=e65]: Preferences are saved separately for each account and this device’s guest.
    - status [ref=e66]: Preferences saved on this device.
    - generic [ref=e67]:
      - heading "Appearance" [level=2] [ref=e68]
      - generic "Sparow themes" [ref=e69]:
        - button "Aa bb Sparow dark" [pressed] [ref=e70]:
          - generic [ref=e71]: Aa bb
          - generic [ref=e72]: Sparow dark
        - button "Aa bb Sparow light" [ref=e75]:
          - generic [ref=e76]: Aa bb
          - generic [ref=e77]: Sparow light
      - heading "More palettes" [level=3] [ref=e78]
      - generic "More themes" [ref=e79]:
        - button "Aa bb Graphite" [ref=e80]:
          - generic [ref=e81]: Aa bb
          - generic [ref=e82]: Graphite
        - button "Aa bb Midnight blue" [ref=e83]:
          - generic [ref=e84]: Aa bb
          - generic [ref=e85]: Midnight blue
        - button "Aa bb Ember" [ref=e86]:
          - generic [ref=e87]: Aa bb
          - generic [ref=e88]: Ember
        - button "Aa bb Mono ink" [ref=e89]:
          - generic [ref=e90]: Aa bb
          - generic [ref=e91]: Mono ink
        - button "Aa bb Paper" [ref=e92]:
          - generic [ref=e93]: Aa bb
          - generic [ref=e94]: Paper
        - button "Aa bb Aurora" [ref=e95]:
          - generic [ref=e96]: Aa bb
          - generic [ref=e97]: Aurora
    - region [ref=e98]:
      - generic [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]:
            - generic [ref=e102]: Opening animation
            - generic [ref=e103]: A brief keyboard welcome when you open SparowType. Saved on this device; reduced motion is respected.
          - checkbox "Opening animation" [ref=e104]
        - button "Replay opening animation" [ref=e105]
    - generic [ref=e108]:
      - generic [ref=e109]:
        - heading "Typing preferences" [level=2] [ref=e110]
        - generic [ref=e111]:
          - generic [ref=e112]:
            - text: Practice language
            - combobox "Practice language" [ref=e113]:
              - option "English" [selected]
              - option "Español"
              - option "Français"
              - option "Deutsch"
              - option "Português"
              - option "Italiano"
              - option "Русский"
              - option "हिन्दी"
              - option "العربية"
              - option "Gujarati transliteration (Latin)"
          - generic [ref=e114]:
            - text: Keyboard layout
            - combobox "Keyboard layout" [ref=e115]:
              - option "QWERTY" [selected]
              - option "Dvorak"
              - option "Colemak"
              - option "Colemak-DH"
              - option "Workman"
              - option "AZERTY"
              - option "QWERTZ"
              - option "Native / unmapped"
          - generic [ref=e116]:
            - text: Text size
            - generic [ref=e117]: 26px
            - slider "Text size" [ref=e118]: "26"
          - generic [ref=e119]:
            - text: Caret style
            - combobox "Caret style" [ref=e120]:
              - option "Line"
              - option "Block"
              - option "Underline"
              - option "Outline" [selected]
          - generic [ref=e121]:
            - generic [ref=e122]:
              - text: Target WPM
              - spinbutton "Target WPM" [ref=e123]: "35"
            - generic [ref=e124]:
              - text: Daily goal · min
              - spinbutton "Daily goal · min" [ref=e125]: "10"
      - generic [ref=e126]:
        - heading "Focus & feedback" [level=2] [ref=e127]
        - generic [ref=e128]:
          - generic [ref=e129]:
            - generic [ref=e130]: Live statistics
            - generic [ref=e131]: Show speed and accuracy while you type.
          - checkbox "Live statistics" [checked] [ref=e132]
        - generic [ref=e133]:
          - generic [ref=e134]:
            - generic [ref=e135]: Focus mode
            - generic [ref=e136]: Keep supporting details quiet during your test.
          - checkbox "Focus mode" [ref=e137]
        - generic [ref=e138]:
          - generic [ref=e139]:
            - generic [ref=e140]: Smooth caret
            - generic [ref=e141]: Animate the caret when reduced motion is off.
          - checkbox "Smooth caret" [checked] [ref=e142]
        - generic [ref=e143]:
          - generic [ref=e144]:
            - generic [ref=e145]: Reduced motion
            - generic [ref=e146]: Keep animation still. Your device’s reduced-motion setting always applies.
          - checkbox "Reduced motion" [ref=e147]
        - generic [ref=e148]:
          - generic [ref=e149]:
            - generic [ref=e150]: Pace guide
            - generic [ref=e151]: Show your target pace during practice.
          - checkbox "Pace guide" [ref=e152]
        - generic [ref=e153]:
          - generic [ref=e154]:
            - generic [ref=e155]: Typing sound
            - generic [ref=e156]: A subtle click. Off by default.
          - checkbox "Typing sound" [ref=e157]
        - generic [ref=e158]:
          - text: Sound pack
          - combobox "Sound pack" [ref=e159]:
            - option "Soft" [selected]
            - option "Mechanical"
            - option "Typewriter"
            - option "Arcade"
            - option "Minimal"
          - generic [ref=e160]: Five synthesized styles. Sound starts only while you type.
        - generic [ref=e161]:
          - text: Volume
          - slider "Sound volume" [ref=e162]: "0.2"
    - generic [ref=e163]:
      - heading "Your data" [level=2] [ref=e164]
      - paragraph [ref=e165]: 0 sessions in this account’s local history. Browser storage is available. Private custom text stays on this device unless you choose cloud storage. Event evidence expires after 90 days; summaries remain.
      - generic [ref=e166]:
        - button "Export my local data" [ref=e167]
        - button "Reset preferences" [ref=e171]
      - status
  - contentinfo [ref=e175]:
    - generic [ref=e176]:
      - generic [ref=e177]:
        - generic [ref=e178]:
          - generic [ref=e179]: Sparow
          - generic [ref=e180]: Type
        - text: Find your rhythm.
      - generic [ref=e181]:
        - link "About & metrics" [ref=e182] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e183] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e184] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e185] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e186] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e187] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e188]: SparowType © 2026
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
  62  | test("feedback preferences persist and outline carets respect reduced motion in both modes", async ({ page }) => {
  63  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  64  |   await page.getByRole("combobox", { name: "Caret style", exact: true }).selectOption("outline");
> 65  |   await page.getByRole("checkbox", { name: "Reduced motion", exact: true }).check();
      |                                                                             ^ Error: locator.check: Test timeout of 30000ms exceeded.
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
  153 |   await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
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
```