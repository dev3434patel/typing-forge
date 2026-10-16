# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> deep links remain immediate and a device opt-out persists through manual replay
- Location: e2e\opening-experience.spec.ts:275:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Replay opening animation', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: 'Replay opening animation', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Replay opening animation', exact: true })
    13 × locator resolved to <button type="button" id="sparowtype-replay-opening" class="forge-button-secondary">…</button>
       - unexpected value "inactive"

```

```yaml
- button "Replay opening animation"
```

# Test source

```ts
  207 |     if (failure === "animation API") {
  208 |       await page.clock.runFor(80);
  209 |       await expect(page.locator("html")).toHaveAttribute(
  210 |         "data-handoff-animation-failure",
  211 |         "exercised",
  212 |       );
  213 |     }
  214 |     await input.pressSequentially("x");
  215 |     if (failure === "late chunk") {
  216 |       const response = page.waitForResponse(/\/assets\/caret-handoff[^/]*\.js/);
  217 |       release();
  218 |       await response;
  219 |     }
  220 |     await page.clock.runFor(100);
  221 |     await expect(input).toHaveValue("x");
  222 |     await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  223 |     await expect(
  224 |       page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  225 |     ).not.toHaveCSS("visibility", "hidden");
  226 |     expect(errors).toEqual([]);
  227 |   });
  228 | }
  229 | 
  230 | test.describe("touch entry", () => {
  231 |   test.use({ hasTouch: true });
  232 |   test("a tap on the composition skips and leaves practice ready", async ({
  233 |     page,
  234 |   }) => {
  235 |     const opening = await firstOpening(page);
  236 |     await opening.tap({ position: { x: 30, y: 100 } });
  237 |     await page.clock.runFor(200);
  238 |     await expectReadyPractice(page);
  239 |   });
  240 | });
  241 | 
  242 | for (const source of ["system", "device preference"] as const) {
  243 |   test(`${source} reduced motion uses the 300ms wordmark without downloading WebGL`, async ({
  244 |     page,
  245 |   }) => {
  246 |     const rendererRequests: string[] = [];
  247 |     page.on("request", (request) => {
  248 |       if (
  249 |         /keyboard-scene|keyboard-bloom|deps\/(three|gsap)/.test(request.url())
  250 |       )
  251 |         rendererRequests.push(request.url());
  252 |     });
  253 |     if (source === "system")
  254 |       await page.emulateMedia({ reducedMotion: "reduce" });
  255 |     else
  256 |       await page.addInitScript((key) => {
  257 |         localStorage.setItem(
  258 |           key,
  259 |           JSON.stringify({ schemaVersion: 3, values: { reducedMotion: true } }),
  260 |         );
  261 |       }, PREFERENCES_KEY);
  262 |     await holdClock(page);
  263 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  264 |     const opening = page.getByTestId("opening-experience");
  265 |     await expect(opening).toHaveAttribute("data-mode", "reduced");
  266 |     await expect(opening.locator("canvas")).toHaveCount(0);
  267 |     await page.clock.fastForward(290);
  268 |     await expect(opening).toBeVisible();
  269 |     await page.clock.runFor(11);
  270 |     await expectReadyPractice(page);
  271 |     expect(rendererRequests).toEqual([]);
  272 |   });
  273 | }
  274 | 
  275 | test("deep links remain immediate and a device opt-out persists through manual replay", async ({
  276 |   page,
  277 | }) => {
  278 |   await holdClock(page);
  279 |   await page.goto("/learn");
  280 |   await expect(
  281 |     page.getByRole("region", { name: "Adaptive typing lesson", exact: true }),
  282 |   ).toBeVisible();
  283 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  284 |   await page.addInitScript(
  285 |     (key) => localStorage.setItem(key, "false"),
  286 |     INTRO_ENABLED_STORAGE_KEY,
  287 |   );
  288 |   await page.goto("/");
  289 |   await expectReadyPractice(page);
  290 |   await page.goto("/settings");
  291 |   const toggle = page.getByRole("checkbox", {
  292 |     name: "Opening animation",
  293 |     exact: true,
  294 |   });
  295 |   await expect(toggle).not.toBeChecked();
  296 |   const replay = page.getByRole("button", {
  297 |     name: "Replay opening animation",
  298 |     exact: true,
  299 |   });
  300 |   await replay.click();
  301 |   await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  302 |     "data-mode",
  303 |     "full",
  304 |   );
  305 |   await page.getByRole("button", { name: "Skip intro", exact: false }).click();
  306 |   await page.clock.runFor(200);
> 307 |   await expect(replay).toBeFocused();
      |                        ^ Error: expect(locator).toBeFocused() failed
  308 |   await expect(toggle).not.toBeChecked();
  309 | });
  310 | 
  311 | test("blocked browser storage and unavailable WebGL retain a complete fallback keyboard", async ({
  312 |   page,
  313 | }) => {
  314 |   await page.addInitScript(() => {
  315 |     for (const name of ["localStorage", "sessionStorage"])
  316 |       Object.defineProperty(window, name, {
  317 |         configurable: true,
  318 |         get() {
  319 |           throw new DOMException("Storage unavailable", "SecurityError");
  320 |         },
  321 |       });
  322 |     const original = HTMLCanvasElement.prototype.getContext;
  323 |     HTMLCanvasElement.prototype.getContext = function (
  324 |       type: string,
  325 |       ...args: unknown[]
  326 |     ) {
  327 |       if (
  328 |         type === "webgl2" ||
  329 |         type === "webgl" ||
  330 |         type === "experimental-webgl"
  331 |       )
  332 |         return null;
  333 |       return Reflect.apply(original, this, [type, ...args]);
  334 |     } as typeof original;
  335 |   });
  336 |   const opening = await firstOpening(page);
  337 |   await page.clock.runFor(80);
  338 |   await expect(opening).toHaveAttribute("data-renderer", "fallback", {
  339 |     timeout: 15_000,
  340 |   });
  341 |   await expect(opening.locator(".awakening-key")).toHaveCount(61);
  342 |   await expect(opening.locator(".awakening-fallback")).toBeVisible();
  343 |   await completeAutomaticOpening(page);
  344 |   await expectReadyPractice(page);
  345 | });
  346 | 
  347 | test("native WebGL renders 61 instanced caps, then disposes before practice mounts", async ({
  348 |   page,
  349 | }) => {
  350 |   test.setTimeout(60_000);
  351 |   await firstOpening(page);
  352 |   const canvas = await realScene(page);
  353 |   await page.clock.fastForward(2500);
  354 |   await page.clock.runFor(50);
  355 |   const data: KeyboardSceneDiagnostics = JSON.parse(
  356 |     (await canvas.getAttribute("data-scene"))!,
  357 |   );
  358 |   expect(data).toMatchObject({
  359 |     renderer: "webgl2",
  360 |     keyCount: 61,
  361 |     keycapMeshes: 1,
  362 |     contextLost: false,
  363 |     disposed: false,
  364 |   });
  365 |   expect(data.frames).toBeGreaterThan(0);
  366 |   expect(data.drawCalls).toBeGreaterThan(0);
  367 |   expect(data.pixelRatio).toBeLessThanOrEqual(data.tier === "mobile" ? 1 : 1.5);
  368 |   if (data.tier === "desktop" && !data.degraded) expect(data.bloom).toBe(true);
  369 |   await page.getByRole("button", { name: "Skip intro", exact: false }).click();
  370 |   await expect
  371 |     .poll(
  372 |       async () =>
  373 |         JSON.parse((await canvas.getAttribute("data-scene"))!).disposed,
  374 |     )
  375 |     .toBe(true);
  376 |   await page.clock.runFor(200);
  377 |   await expectReadyPractice(page);
  378 | });
  379 | 
  380 | test("native context loss switches to fallback and preserves ready practice", async ({
  381 |   page,
  382 | }) => {
  383 |   test.setTimeout(60_000);
  384 |   const opening = await firstOpening(page);
  385 |   const canvas = await realScene(page);
  386 |   const canLoseContext = await canvas.evaluate((element) =>
  387 |     Boolean(
  388 |       (element as HTMLCanvasElement)
  389 |         .getContext("webgl2")
  390 |         ?.getExtension("WEBGL_lose_context"),
  391 |     ),
  392 |   );
  393 |   test.skip(
  394 |     !canLoseContext,
  395 |     "UNVERIFIED: this native WebGL2 runner has no WEBGL_lose_context extension.",
  396 |   );
  397 |   await canvas.evaluate((element) =>
  398 |     (element as HTMLCanvasElement)
  399 |       .getContext("webgl2")!
  400 |       .getExtension("WEBGL_lose_context")!
  401 |       .loseContext(),
  402 |   );
  403 |   await expect(opening).toHaveAttribute("data-renderer", "fallback");
  404 |   await expect
  405 |     .poll(
  406 |       async () =>
  407 |         JSON.parse((await canvas.getAttribute("data-scene"))!).contextLost,
```