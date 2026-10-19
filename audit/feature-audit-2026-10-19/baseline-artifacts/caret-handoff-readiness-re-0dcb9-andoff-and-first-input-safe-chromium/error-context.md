# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: caret-handoff-readiness.spec.ts >> real delayed workspace within readiness window keeps automatic handoff and first input safe
- Location: e2e\caret-handoff-readiness.spec.ts:10:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByTestId('opening-experience')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByTestId('opening-experience') with timeout 5000ms
  - waiting for getByTestId('opening-experience')
    8 × locator resolved to 1 element
      - unexpected value "1"

```

# Page snapshot

```yaml
- main "SparowType introduction" [ref=e1]:
  - status [ref=e2]: Loading SparowType
  - generic [aria-hidden] [ref=e4]:
    - generic [ref=e5]: SPAROWTYPE / INPUT SYSTEM 01
    - generic [ref=e6]: EST. 2026 · READY FOR YOUR RHYTHM
  - generic [ref=e10]:
    - generic [ref=e11]: Sparow
    - generic [ref=e12]: Type
  - generic [aria-hidden] [ref=e14]: A signal becomes a keystroke.
  - generic [ref=e17]:
    - generic "Asset readiness" [ref=e18]:
      - generic [ref=e19]: 100%
      - generic [ref=e22]: Ready to type
    - generic [ref=e23]:
      - 'button "Sound off: enable intro sound" [ref=e24] [cursor=pointer]':
        - text: Sound off
        - generic [aria-hidden] [ref=e25]: ○
      - button "Skip intro" [ref=e26] [cursor=pointer]:
        - text: Skip intro
        - generic [aria-hidden] [ref=e27]: ↗
  - paragraph [aria-hidden] [ref=e28]: Press any key, click or tap to enter
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { selectDocumentOpeningRenderer } from "./opening-renderer";
  3   | 
  4   | test.use({ serviceWorkers: "block" });
  5   | 
  6   | for (const readiness of [
  7   |   "within readiness window",
  8   |   "after readiness deadline",
  9   | ] as const) {
  10  |   test(`real delayed workspace ${readiness} keeps automatic handoff and first input safe`, async ({
  11  |     page,
  12  |     context,
  13  |   }) => {
  14  |     // Only this clocked document-renderer fixture is selected. Native worker
  15  |     // readiness/quality remains covered separately with ordinary clocks.
  16  |     await selectDocumentOpeningRenderer(page);
  17  |     await page.addInitScript(() => {
  18  |       localStorage.setItem("sparowtype.opening-animation.enabled", "true");
  19  |       sessionStorage.removeItem("sparowtype.opening-animation.seen");
  20  |       const original = Element.prototype.animate;
  21  |       Element.prototype.animate = function (...args) {
  22  |         if (this.classList.contains("awakening-handoff"))
  23  |           document.documentElement.dataset.delayedHandoffAnimations = String(
  24  |             Number(
  25  |               document.documentElement.dataset.delayedHandoffAnimations || 0,
  26  |             ) + 1,
  27  |           );
  28  |         return Reflect.apply(original, this, args);
  29  |       };
  30  |     });
  31  |     let releaseWorkspace = () => {};
  32  |     const gate = new Promise<void>((resolve) => {
  33  |       releaseWorkspace = resolve;
  34  |     });
  35  |     let actualEntryURL = "";
  36  |     const heldRequests: string[] = [];
  37  |     await context.route(/\/assets\/App-[^/]*\.js(?:\?.*)?$/, async (route) => {
  38  |       actualEntryURL = route.request().url();
  39  |       heldRequests.push(actualEntryURL);
  40  |       await gate;
  41  |       await route.continue();
  42  |     });
  43  |     const errors: string[] = [];
  44  |     page.on("pageerror", (error) => errors.push(error.message));
  45  |     await page.clock.install();
  46  |     await page.clock.pauseAt(
  47  |       new Date((await page.evaluate(() => Date.now())) + 25),
  48  |     );
  49  | 
  50  |     try {
  51  |       await page.goto("/", { waitUntil: "domcontentloaded" });
  52  |       const opening = page.getByTestId("opening-experience");
  53  |       await expect(opening).toHaveAttribute("data-mode", "full");
  54  |       await expect(
  55  |         page.getByRole("status").filter({ hasText: "Loading SparowType" }),
  56  |       ).toBeVisible();
  57  |       await page.clock.fastForward(4500);
  58  |       await page.clock.runFor(200);
> 59  |       await expect(opening).toHaveCount(0);
      |                             ^ Error: expect(locator).toHaveCount(expected) failed
  60  |       await expect.poll(() => heldRequests.length).toBe(1);
  61  |       await expect(
  62  |         page.getByRole("status").filter({
  63  |           hasText: "Preparing your typing workspace…",
  64  |         }),
  65  |       ).toBeVisible();
  66  |       const input = page.getByRole("textbox", {
  67  |         name: "Typing input",
  68  |         exact: true,
  69  |       });
  70  |       await expect(input).toHaveCount(0);
  71  |       await expect(page.locator(".awakening-handoff")).toHaveCount(1);
  72  |       expect(
  73  |         await page
  74  |           .locator("html")
  75  |           .getAttribute("data-delayed-handoff-animations"),
  76  |       ).toBeNull();
  77  | 
  78  |       if (readiness === "after readiness deadline") {
  79  |         // The helper has a fixed 500ms target-readiness budget. The real App
  80  |         // request remains held; advancing beyond it must remove only decoration.
  81  |         await page.clock.runFor(501);
  82  |         await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  83  |         await expect(input).toHaveCount(0);
  84  |       }
  85  | 
  86  |       const workspaceResponse = page.waitForResponse(actualEntryURL);
  87  |       releaseWorkspace();
  88  |       expect((await workspaceResponse).status()).toBe(200);
  89  |       await expect(input).toBeVisible();
  90  |       await expect(input).toHaveValue("");
  91  |       await expect(
  92  |         page.getByRole("region", { name: "Typing session", exact: true }),
  93  |       ).toHaveAttribute("data-status", "ready");
  94  |       await page.clock.runFor(80);
  95  |       if (readiness === "within readiness window") {
  96  |         await expect(page.locator("html")).toHaveAttribute(
  97  |           "data-delayed-handoff-animations",
  98  |           "1",
  99  |         );
  100 |       } else {
  101 |         expect(
  102 |           await page
  103 |             .locator("html")
  104 |             .getAttribute("data-delayed-handoff-animations"),
  105 |         ).toBeNull();
  106 |       }
  107 | 
  108 |       await input.pressSequentially("x");
  109 |       await expect(input).toHaveValue("x");
  110 |       await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  111 |       await expect(
  112 |         page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  113 |       ).not.toHaveCSS("visibility", "hidden");
  114 |       expect(errors).toEqual([]);
  115 |       await test.info().attach("delayed-workspace-handoff", {
  116 |         contentType: "application/json",
  117 |         body: JSON.stringify({
  118 |           readiness,
  119 |           actualHeldAppRequests: heldRequests,
  120 |           responseStatus: 200,
  121 |           animationCount: Number(
  122 |             (await page
  123 |               .locator("html")
  124 |               .getAttribute("data-delayed-handoff-animations")) || 0,
  125 |           ),
  126 |           finalInput: await input.inputValue(),
  127 |           remainingDecorativeCarets: await page
  128 |             .locator(".awakening-handoff")
  129 |             .count(),
  130 |           pageErrors: errors,
  131 |         }),
  132 |       });
  133 |     } finally {
  134 |       releaseWorkspace();
  135 |     }
  136 |   });
  137 | }
  138 | 
  139 | test("an actual caret module arriving after its import deadline cannot revive decoration or consume the first key", async ({
  140 |   page,
  141 |   context,
  142 | }) => {
  143 |   await selectDocumentOpeningRenderer(page);
  144 |   await page.addInitScript(() => {
  145 |     const originalAnimate = Element.prototype.animate;
  146 |     const originalAppend = Element.prototype.append;
  147 |     Element.prototype.animate = function (...args) {
  148 |       if (this.classList.contains("awakening-handoff"))
  149 |         document.documentElement.dataset.expiredHandoffAnimations = String(
  150 |           Number(
  151 |             document.documentElement.dataset.expiredHandoffAnimations || 0,
  152 |           ) + 1,
  153 |         );
  154 |       return Reflect.apply(originalAnimate, this, args);
  155 |     };
  156 |     Element.prototype.append = function (...nodes) {
  157 |       for (const node of nodes)
  158 |         if (
  159 |           node instanceof Element &&
```