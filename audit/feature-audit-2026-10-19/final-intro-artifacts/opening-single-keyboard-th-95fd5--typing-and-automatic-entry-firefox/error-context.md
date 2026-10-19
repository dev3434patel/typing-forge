# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-single-keyboard.spec.ts >> the normal-clock production worker shows the creative 3D keyboard through wordmark typing and automatic entry
- Location: e2e\opening-single-keyboard.spec.ts:241:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByTestId('opening-experience')
Expected: "false"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByTestId('opening-experience') with timeout 5000ms
  - waiting for getByTestId('opening-experience')

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
      - button "Time" [pressed]:
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
      - button "Custom":
        - img
        - text: Custom
      - button "Zen":
        - img
        - text: Zen
    - group "Test duration":
      - button "15 seconds"
      - button "30 seconds" [pressed]
      - button "60 seconds"
      - button "120 seconds"
    - checkbox "Precision mode · stop on errors"
    - text: Precision mode · stop on errors Language
    - combobox "Language":
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
    - button "punctuation":
      - img
      - text: punctuation
    - button "# numbers"
  - region "Typing session":
    - text: 30s remaining —wpm —acc % Ready when you are
    - paragraph: "Practice passage: ready shine can run build onion there kite same for end open day why north nature task clean lane mine a ante fine for my open send though stand sort new try snow shine part tie here mean play attention neat full tall joke sure thought why even as one sore earth each which quite sun north earn sound one that land window learn has earth ration snow yet though nature run lake speed who stand sound ease for rent mean not riot feel world second six yes one eye just retain side yes are eat safe race letter black low later sure own world yellow sure she want for draw life calm door yet ear off now other mean"
    - textbox "Typing input"
    - paragraph: Type the text above. Wrong letters stay visible; Backspace corrects.
    - status
    - paragraph: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
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
  280 |         '[data-testid="opening-experience"]',
  281 |       );
  282 |       if (!opening) {
  283 |         if (receipt.startedAt !== null) {
  284 |           receipt.closedAt = performance.now();
  285 |           observer.disconnect();
  286 |         }
  287 |         return;
  288 |       }
  289 |       if (
  290 |         receipt.startedAt === null &&
  291 |         opening.getAttribute("data-mode") === "full" &&
  292 |         opening.getAttribute("data-presentation") === "playing"
  293 |       ) {
  294 |         receipt.startedAt = performance.now();
  295 |         window.setTimeout(() => {
  296 |           const current = document.querySelector(
  297 |             '[data-testid="opening-experience"]',
  298 |           );
  299 |           receipt.after2700 = {
  300 |             playing: current?.getAttribute("data-presentation") === "playing",
  301 |             closing: current?.getAttribute("data-closing") === "true",
  302 |             text:
  303 |               current?.querySelector(".awakening-title-typed")?.textContent ||
  304 |               "",
  305 |           };
  306 |         }, 2705);
  307 |       }
  308 |       if (receipt.startedAt === null) return;
  309 |       const text = opening.querySelector(".awakening-title-typed")?.textContent;
  310 |       if (text && text !== receipt.words.at(-1)?.text) {
  311 |         receipt.words.push({ text, atMs: performance.now() });
  312 |         if (text === "SparowType") receipt.completedAt = performance.now();
  313 |       }
  314 |     });
  315 |     observer.observe(document, {
  316 |       subtree: true,
  317 |       childList: true,
  318 |       characterData: true,
  319 |       attributes: true,
  320 |       attributeFilter: ["data-presentation", "data-closing"],
  321 |     });
  322 |   });
  323 |   const receipt = () =>
  324 |     page.evaluate(
  325 |       () =>
  326 |         (
  327 |           window as Window & {
  328 |             nativeKeyboardPresentation: NativePresentationReceipt;
  329 |           }
  330 |         ).nativeKeyboardPresentation,
  331 |     );
  332 |   try {
  333 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  334 |     const opening = page.getByTestId("opening-experience");
  335 |     await expect(opening).toHaveAttribute("data-mode", "full");
  336 |     await expect(opening).toHaveAttribute("data-presentation", "playing", {
  337 |       timeout: 7000,
  338 |     });
  339 |     await expect(opening).toHaveAttribute("data-renderer", "webgl");
  340 |     const diagnostics: KeyboardSceneDiagnostics = JSON.parse(
  341 |       (await opening.locator(".awakening-canvas").getAttribute("data-scene"))!,
  342 |     );
  343 |     expect(diagnostics).toMatchObject({
  344 |       renderer: "webgl2",
  345 |       thread: "worker",
  346 |       keyCount: 61,
  347 |       keycapMeshes: 1,
  348 |       tier: "desktop",
  349 |       bloom: true,
  350 |       environment: true,
  351 |       environmentIntensity: 0.35,
  352 |       degraded: false,
  353 |       contextLost: false,
  354 |       disposed: false,
  355 |     });
  356 |     expect(diagnostics.frames).toBeGreaterThan(0);
  357 |     expect(diagnostics.drawCalls).toBeGreaterThan(0);
  358 |     expect(diagnostics.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  359 |     expect(diagnostics.cameraElevationDegrees).toBeLessThanOrEqual(42);
  360 |     expect(
  361 |       page
  362 |         .workers()
  363 |         .some((worker) => /keyboard-render[.-]worker/.test(worker.url())),
  364 |     ).toBe(true);
  365 |     await expect(opening.locator(".awakening-fallback")).toHaveCSS(
  366 |       "visibility",
  367 |       "hidden",
  368 |     );
  369 |     await expect.poll(async () => (await receipt()).after2700).not.toBeNull();
  370 |     expect((await receipt()).after2700).toMatchObject({
  371 |       playing: true,
  372 |       closing: false,
  373 |     });
  374 |     await page.screenshot({
  375 |       path: info.outputPath("native-3d-wordmark-typing.png"),
  376 |     });
  377 |     await expect(opening.locator(".awakening-title-typed")).toHaveText(
  378 |       "SparowType",
  379 |     );
> 380 |     await expect(opening).toHaveAttribute("data-closing", "false");
      |                           ^ Error: expect(locator).toHaveAttribute(expected) failed
  381 |     await page.screenshot({
  382 |       path: info.outputPath("native-3d-complete-wordmark.png"),
  383 |     });
  384 |     await expect(opening).toHaveCount(0);
  385 |     const observed = await receipt();
  386 |     expect(observed.startedAt).not.toBeNull();
  387 |     expect(observed.completedAt).not.toBeNull();
  388 |     expect(observed.closedAt).not.toBeNull();
  389 |     expect(observed.words[0].text).toBe("S");
  390 |     expect(observed.words.at(-1)?.text).toBe("SparowType");
  391 |     expect(observed.completedAt! - observed.startedAt!).toBeGreaterThan(2700);
  392 |     expect(observed.closedAt! - observed.startedAt!).toBeGreaterThan(4000);
  393 |     const input = page.getByRole("textbox", {
  394 |       name: "Typing input",
  395 |       exact: true,
  396 |     });
  397 |     await expect(input).toBeVisible();
  398 |     await expect(input).toHaveValue("");
  399 |     await input.pressSequentially("x");
  400 |     await expect(input).toHaveValue("x");
  401 |     await info.attach("native-full-quality-scene", {
  402 |       contentType: "application/json",
  403 |       body: JSON.stringify(diagnostics),
  404 |     });
  405 |   } finally {
  406 |     await info.attach("native-keyboard-wordmark-timeline", {
  407 |       contentType: "application/json",
  408 |       body: JSON.stringify(await receipt()),
  409 |     });
  410 |   }
  411 | });
  412 | 
```