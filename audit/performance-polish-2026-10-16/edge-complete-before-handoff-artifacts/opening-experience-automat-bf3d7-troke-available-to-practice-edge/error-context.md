# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> automatic caret handoff leaves the first real keystroke available to practice
- Location: e2e\opening-experience.spec.ts:141:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('html')
Expected: "1"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" locator('html') with timeout 5000ms
  - waiting for locator('html')
    14 × locator resolved to <html lang="en" class="dark" data-theme="sparow-dark" data-reduced-motion="false">…</html>
       - unexpected value "null"

```

```yaml
- document:
  - banner
  - main
  - contentinfo
```

# Test source

```ts
  58  |     "UNVERIFIED: this runner cannot create a native WebGL2 context.",
  59  |   );
  60  | }
  61  | async function realScene(page: Page) {
  62  |   await requireNativeWebGL(page);
  63  |   // The product waits for two paints before importing the renderer.
  64  |   await page.clock.runFor(80);
  65  |   await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  66  |     "data-renderer",
  67  |     "webgl",
  68  |     { timeout: 20_000 },
  69  |   );
  70  |   const canvas = page.locator(".awakening-canvas");
  71  |   await expect
  72  |     .poll(async () => {
  73  |       const raw = await canvas.getAttribute("data-scene");
  74  |       return raw ? JSON.parse(raw).frames : 0;
  75  |     })
  76  |     .toBeGreaterThan(0);
  77  |   return canvas;
  78  | }
  79  | 
  80  | test("full opening gates practice and returning visitors receive the 900ms wordmark", async ({
  81  |   page,
  82  | }) => {
  83  |   const opening = await firstOpening(page);
  84  |   await expect(
  85  |     page.getByRole("textbox", { name: "Typing input", exact: true }),
  86  |   ).toHaveCount(0);
  87  |   await expect(opening).toHaveAttribute("data-closing", "false");
  88  |   await completeAutomaticOpening(page);
  89  |   await expect(await expectReadyPractice(page)).toBeFocused();
  90  |   await page.reload({ waitUntil: "domcontentloaded" });
  91  |   await expect(opening).toHaveAttribute("data-mode", "returning");
  92  |   await expect(opening.locator("canvas")).toHaveCount(0);
  93  |   await page.clock.fastForward(730);
  94  |   await expect(opening).toHaveAttribute("data-closing", "false");
  95  |   await page.clock.runFor(171);
  96  |   await expectReadyPractice(page);
  97  | });
  98  | 
  99  | test("ordinary letters, Enter, Escape and Space skip without input leakage while Tab preserves focus", async ({
  100 |   page,
  101 | }) => {
  102 |   await firstOpening(page);
  103 |   for (const key of ["a", "Enter", "Escape", "Space"]) {
  104 |     if (key !== "a") {
  105 |       await page.evaluate(
  106 |         (storageKey) => sessionStorage.removeItem(storageKey),
  107 |         INTRO_SEEN_SESSION_KEY,
  108 |       );
  109 |       await page.reload({ waitUntil: "domcontentloaded" });
  110 |       await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  111 |         "data-mode",
  112 |         "full",
  113 |       );
  114 |     }
  115 |     await page.keyboard.press(key);
  116 |     await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  117 |       "data-closing",
  118 |       "true",
  119 |     );
  120 |     await expect(
  121 |       page.getByRole("textbox", { name: "Typing input", exact: true }),
  122 |     ).toHaveCount(0);
  123 |     await page.clock.runFor(200);
  124 |     await expectReadyPractice(page);
  125 |   }
  126 |   await page.evaluate(
  127 |     (storageKey) => sessionStorage.removeItem(storageKey),
  128 |     INTRO_SEEN_SESSION_KEY,
  129 |   );
  130 |   await page.reload({ waitUntil: "domcontentloaded" });
  131 |   const opening = page.getByTestId("opening-experience");
  132 |   await expect(opening).toHaveAttribute("data-mode", "full");
  133 |   await page.keyboard.press("Tab");
  134 |   await expect(opening).toHaveAttribute("data-closing", "false");
  135 |   await expect(opening.locator("button:focus")).toHaveCount(1);
  136 |   await page.keyboard.press("Escape");
  137 |   await page.clock.runFor(200);
  138 |   await expectReadyPractice(page);
  139 | });
  140 | 
  141 | test("automatic caret handoff leaves the first real keystroke available to practice", async ({
  142 |   page,
  143 | }) => {
  144 |   await page.addInitScript(() => {
  145 |     const original = Element.prototype.animate;
  146 |     Element.prototype.animate = function (...args) {
  147 |       if (this.classList.contains("awakening-handoff"))
  148 |         document.documentElement.dataset.caretHandoffs = String(
  149 |           Number(document.documentElement.dataset.caretHandoffs || 0) + 1,
  150 |         );
  151 |       return Reflect.apply(original, this, args);
  152 |     };
  153 |   });
  154 |   await firstOpening(page);
  155 |   await completeAutomaticOpening(page);
  156 |   const input = await expectReadyPractice(page);
  157 |   await page.clock.runFor(80);
> 158 |   await expect(page.locator("html")).toHaveAttribute(
      |                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  159 |     "data-caret-handoffs",
  160 |     "1",
  161 |   );
  162 |   await input.pressSequentially("x");
  163 |   await expect(input).toHaveValue("x");
  164 |   await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  165 |   await expect(
  166 |     page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  167 |   ).not.toHaveCSS("visibility", "hidden");
  168 | });
  169 | 
  170 | for (const failure of [
  171 |   "blocked chunk",
  172 |   "late chunk",
  173 |   "animation API",
  174 | ] as const) {
  175 |   test(`caret handoff ${failure} preserves input and the real caret`, async ({
  176 |     page,
  177 |   }) => {
  178 |     const errors: string[] = [];
  179 |     page.on("pageerror", (error) => errors.push(error.message));
  180 |     let release = () => {};
  181 |     if (failure === "blocked chunk")
  182 |       await page.route(/\/assets\/caret-handoff[^/]*\.js/, (route) =>
  183 |         route.abort(),
  184 |       );
  185 |     if (failure === "late chunk") {
  186 |       const gate = new Promise<void>((resolve) => {
  187 |         release = resolve;
  188 |       });
  189 |       await page.route(/\/assets\/caret-handoff[^/]*\.js/, async (route) => {
  190 |         await gate;
  191 |         await route.continue();
  192 |       });
  193 |     }
  194 |     if (failure === "animation API")
  195 |       await page.addInitScript(() => {
  196 |         const original = Element.prototype.animate;
  197 |         Element.prototype.animate = function (...args) {
  198 |           if (this.classList.contains("awakening-handoff")) {
  199 |             document.documentElement.dataset.handoffAnimationFailure =
  200 |               "exercised";
  201 |             throw new Error("Unavailable animation");
  202 |           }
  203 |           return Reflect.apply(original, this, args);
  204 |         };
  205 |       });
  206 |     await firstOpening(page);
  207 |     await completeAutomaticOpening(page);
  208 |     const input = await expectReadyPractice(page);
  209 |     if (failure === "animation API") {
  210 |       await page.clock.runFor(80);
  211 |       await expect(page.locator("html")).toHaveAttribute(
  212 |         "data-handoff-animation-failure",
  213 |         "exercised",
  214 |       );
  215 |     }
  216 |     await input.pressSequentially("x");
  217 |     if (failure === "late chunk") {
  218 |       const response = page.waitForResponse(/\/assets\/caret-handoff[^/]*\.js/);
  219 |       release();
  220 |       await response;
  221 |     }
  222 |     await page.clock.runFor(100);
  223 |     await expect(input).toHaveValue("x");
  224 |     await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  225 |     await expect(
  226 |       page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  227 |     ).not.toHaveCSS("visibility", "hidden");
  228 |     expect(errors).toEqual([]);
  229 |   });
  230 | }
  231 | 
  232 | test.describe("touch entry", () => {
  233 |   test.use({ hasTouch: true });
  234 |   test("a tap on the composition skips and leaves practice ready", async ({
  235 |     page,
  236 |   }) => {
  237 |     const opening = await firstOpening(page);
  238 |     await opening.tap({ position: { x: 30, y: 100 } });
  239 |     await page.clock.runFor(200);
  240 |     await expectReadyPractice(page);
  241 |   });
  242 | });
  243 | 
  244 | for (const source of ["system", "device preference"] as const) {
  245 |   test(`${source} reduced motion uses the 300ms wordmark without downloading WebGL`, async ({
  246 |     page,
  247 |   }) => {
  248 |     const rendererRequests: string[] = [];
  249 |     page.on("request", (request) => {
  250 |       if (
  251 |         /keyboard-scene|keyboard-bloom|deps\/(three|gsap)/.test(request.url())
  252 |       )
  253 |         rendererRequests.push(request.url());
  254 |     });
  255 |     if (source === "system")
  256 |       await page.emulateMedia({ reducedMotion: "reduce" });
  257 |     else
  258 |       await page.addInitScript((key) => {
```