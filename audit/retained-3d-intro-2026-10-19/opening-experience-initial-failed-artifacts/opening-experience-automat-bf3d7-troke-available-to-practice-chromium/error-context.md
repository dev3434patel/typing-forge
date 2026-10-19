# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> automatic caret handoff leaves the first real keystroke available to practice
- Location: e2e\opening-experience.spec.ts:196:1

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
  113 |   page,
  114 | }) => {
  115 |   const opening = await firstOpening(page);
  116 |   await expect(
  117 |     page.getByRole("textbox", { name: "Typing input", exact: true }),
  118 |   ).toHaveCount(0);
  119 |   await expect(opening).toHaveAttribute("data-closing", "false");
  120 |   await completeAutomaticOpening(page);
  121 |   await expect(await expectReadyPractice(page)).toBeFocused();
  122 |   await page.reload({ waitUntil: "domcontentloaded" });
  123 |   await expect(opening).toHaveAttribute("data-mode", "returning");
  124 |   await expect(opening.locator("canvas")).toHaveCount(0);
  125 |   await page.clock.fastForward(730);
  126 |   await expect(opening).toHaveAttribute("data-closing", "false");
  127 |   await page.clock.runFor(171);
  128 |   await expectReadyPractice(page);
  129 | });
  130 | 
  131 | test("ordinary letters, Enter, Escape and Space skip without input leakage while Tab preserves focus", async ({
  132 |   page,
  133 | }) => {
  134 |   await firstOpening(page);
  135 |   for (const key of ["a", "Enter", "Escape", "Space"]) {
  136 |     if (key !== "a") {
  137 |       await page.evaluate(
  138 |         (storageKey) => sessionStorage.removeItem(storageKey),
  139 |         INTRO_SEEN_SESSION_KEY,
  140 |       );
  141 |       await page.reload({ waitUntil: "domcontentloaded" });
  142 |       await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  143 |         "data-mode",
  144 |         "full",
  145 |       );
  146 |     }
  147 |     await page.keyboard.press(key);
  148 |     await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  149 |       "data-closing",
  150 |       "true",
  151 |     );
  152 |     await expect(
  153 |       page.getByRole("textbox", { name: "Typing input", exact: true }),
  154 |     ).toHaveCount(0);
  155 |     await page.clock.runFor(200);
  156 |     await expectReadyPractice(page);
  157 |   }
  158 |   await page.evaluate(
  159 |     (storageKey) => sessionStorage.removeItem(storageKey),
  160 |     INTRO_SEEN_SESSION_KEY,
  161 |   );
  162 |   await page.reload({ waitUntil: "domcontentloaded" });
  163 |   const opening = page.getByTestId("opening-experience");
  164 |   await expect(opening).toHaveAttribute("data-mode", "full");
  165 |   await page.keyboard.press("Tab");
  166 |   await expect(opening).toHaveAttribute("data-closing", "false");
  167 |   await expect(opening.locator("button:focus")).toHaveCount(1);
  168 |   await page.keyboard.press("Escape");
  169 |   await page.clock.runFor(200);
  170 |   await expectReadyPractice(page);
  171 | });
  172 | 
  173 | test("a replay during the closing fade owns its lifetime instead of inheriting the previous exit timer", async ({
  174 |   page,
  175 | }) => {
  176 |   const opening = await firstOpening(page);
  177 |   await page.keyboard.press("Escape");
  178 |   await expect(opening).toHaveAttribute("data-closing", "true");
  179 |   await page.evaluate(
  180 |     (name) => window.dispatchEvent(new Event(name)),
  181 |     INTRO_REPLAY_EVENT,
  182 |   );
  183 |   await expect(opening).toHaveAttribute("data-mode", "full");
  184 |   await expect(opening).toHaveAttribute("data-closing", "false");
  185 |   await page.clock.runFor(200);
  186 |   await expect(opening).toHaveAttribute("data-mode", "full");
  187 |   await expect(opening).toHaveAttribute("data-closing", "false");
  188 |   await expect(
  189 |     page.getByRole("textbox", { name: "Typing input", exact: true }),
  190 |   ).toHaveCount(0);
  191 |   await page.keyboard.press("Escape");
  192 |   await page.clock.runFor(200);
  193 |   await expectReadyPractice(page);
  194 | });
  195 | 
  196 | test("automatic caret handoff leaves the first real keystroke available to practice", async ({
  197 |   page,
  198 | }) => {
  199 |   await page.addInitScript(() => {
  200 |     const original = Element.prototype.animate;
  201 |     Element.prototype.animate = function (...args) {
  202 |       if (this.classList.contains("awakening-handoff"))
  203 |         document.documentElement.dataset.caretHandoffs = String(
  204 |           Number(document.documentElement.dataset.caretHandoffs || 0) + 1,
  205 |         );
  206 |       return Reflect.apply(original, this, args);
  207 |     };
  208 |   });
  209 |   await firstOpening(page);
  210 |   await completeAutomaticOpening(page);
  211 |   const input = await expectReadyPractice(page);
  212 |   await page.clock.runFor(80);
> 213 |   await expect(page.locator("html")).toHaveAttribute(
      |                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  214 |     "data-caret-handoffs",
  215 |     "1",
  216 |   );
  217 |   await input.pressSequentially("x");
  218 |   await expect(input).toHaveValue("x");
  219 |   await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  220 |   await expect(
  221 |     page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  222 |   ).not.toHaveCSS("visibility", "hidden");
  223 | });
  224 | 
  225 | for (const failure of [
  226 |   "blocked chunk",
  227 |   "late chunk",
  228 |   "animation API",
  229 | ] as const) {
  230 |   test(`caret handoff ${failure} preserves input and the real caret`, async ({
  231 |     page,
  232 |   }) => {
  233 |     const errors: string[] = [];
  234 |     page.on("pageerror", (error) => errors.push(error.message));
  235 |     let release = () => {};
  236 |     if (failure === "blocked chunk")
  237 |       await page.route(/\/assets\/caret-handoff[^/]*\.js/, (route) =>
  238 |         route.abort(),
  239 |       );
  240 |     if (failure === "late chunk") {
  241 |       const gate = new Promise<void>((resolve) => {
  242 |         release = resolve;
  243 |       });
  244 |       await page.route(/\/assets\/caret-handoff[^/]*\.js/, async (route) => {
  245 |         await gate;
  246 |         await route.continue();
  247 |       });
  248 |     }
  249 |     if (failure === "animation API")
  250 |       await page.addInitScript(() => {
  251 |         const original = Element.prototype.animate;
  252 |         Element.prototype.animate = function (...args) {
  253 |           if (this.classList.contains("awakening-handoff")) {
  254 |             document.documentElement.dataset.handoffAnimationFailure =
  255 |               "exercised";
  256 |             throw new Error("Unavailable animation");
  257 |           }
  258 |           return Reflect.apply(original, this, args);
  259 |         };
  260 |       });
  261 |     await firstOpening(page);
  262 |     await completeAutomaticOpening(page);
  263 |     const input = await expectReadyPractice(page);
  264 |     if (failure === "animation API") {
  265 |       await page.clock.runFor(80);
  266 |       await expect(page.locator("html")).toHaveAttribute(
  267 |         "data-handoff-animation-failure",
  268 |         "exercised",
  269 |       );
  270 |     }
  271 |     await input.pressSequentially("x");
  272 |     if (failure === "late chunk") {
  273 |       const response = page.waitForResponse(/\/assets\/caret-handoff[^/]*\.js/);
  274 |       release();
  275 |       await response;
  276 |     }
  277 |     await page.clock.runFor(100);
  278 |     await expect(input).toHaveValue("x");
  279 |     await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  280 |     await expect(
  281 |       page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  282 |     ).not.toHaveCSS("visibility", "hidden");
  283 |     expect(errors).toEqual([]);
  284 |   });
  285 | }
  286 | 
  287 | test.describe("touch entry", () => {
  288 |   test.use({ hasTouch: true });
  289 |   test("a tap on the composition skips and leaves practice ready", async ({
  290 |     page,
  291 |   }) => {
  292 |     const opening = await firstOpening(page);
  293 |     await opening.tap({ position: { x: 30, y: 100 } });
  294 |     await page.clock.runFor(200);
  295 |     await expectReadyPractice(page);
  296 |   });
  297 | });
  298 | 
  299 | for (const source of ["system", "device preference"] as const) {
  300 |   test(`${source} reduced motion uses the 300ms wordmark without downloading WebGL`, async ({
  301 |     page,
  302 |   }) => {
  303 |     const rendererRequests: string[] = [];
  304 |     page.on("request", (request) => {
  305 |       if (
  306 |         /keyboard-scene|keyboard-bloom|deps\/(three|gsap)/.test(request.url())
  307 |       )
  308 |         rendererRequests.push(request.url());
  309 |     });
  310 |     if (source === "system")
  311 |       await page.emulateMedia({ reducedMotion: "reduce" });
  312 |     else
  313 |       await page.addInitScript((key) => {
```