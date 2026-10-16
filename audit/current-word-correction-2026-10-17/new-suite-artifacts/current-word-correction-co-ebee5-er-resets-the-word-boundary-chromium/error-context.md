# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: current-word-correction.spec.ts >> composition preserves its committed prefix and Tab then Enter resets the word boundary
- Location: e2e\current-word-correction.spec.ts:333:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: getByRole('textbox', { name: 'Typing input', exact: true })
Expected: focused
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeFocused" getByRole('textbox', { name: 'Typing input', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Typing input', exact: true })

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
  - heading "Bring your own passage" [level=2]
  - paragraph: Paste up to 10,000 characters to practice. Your text stays private on this device.
  - text: Custom practice passage
  - textbox "Custom practice passage":
    - /placeholder: Add something you want to get better at typing…
    - text: cat élan dog quiet
  - button "Start private practice":
    - text: Start private practice
    - img
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
  286 |   for (const kind of ["deleteCompositionText", "deleteByComposition"]) {
  287 |     await inputFallback(input, "", kind);
  288 |     await expect(target.locator("[data-typed]")).toHaveCount(boundary + 1);
  289 |   }
  290 |   // Some keyboards report a generic composing deletion after compositionend.
  291 |   // Native isComposing ownership must win even when no compositionstart follows.
  292 |   const nativeCompositionDeletion = await input.evaluate((element) => {
  293 |     const textarea = element as HTMLTextAreaElement;
  294 |     const before = new InputEvent("beforeinput", {
  295 |       bubbles: true,
  296 |       cancelable: true,
  297 |       inputType: "deleteContentBackward",
  298 |       isComposing: true,
  299 |     });
  300 |     const allowed = textarea.dispatchEvent(before);
  301 |     Object.getOwnPropertyDescriptor(
  302 |       HTMLTextAreaElement.prototype,
  303 |       "value",
  304 |     )!.set!.call(textarea, "");
  305 |     textarea.dispatchEvent(
  306 |       new InputEvent("input", {
  307 |         bubbles: true,
  308 |         inputType: "deleteContentBackward",
  309 |         isComposing: true,
  310 |       }),
  311 |     );
  312 |     return { allowed };
  313 |   });
  314 |   expect(nativeCompositionDeletion.allowed).toBe(true);
  315 |   await expect(target.locator("[data-typed]")).toHaveCount(boundary + 1);
  316 |   await expect(
  317 |     target.locator(`[data-slot-index="${boundary}"]`),
  318 |   ).toHaveAttribute("data-typed", firstCurrentCharacter);
  319 |   await nativeDeletion(input, "deleteContentBackward");
  320 |   await expect(target.locator("[data-typed]")).toHaveCount(boundary);
  321 |   await page
  322 |     .getByRole("button", { name: "Finish practice", exact: true })
  323 |     .click();
  324 |   const result = await exportedResult(page);
  325 |   expect(result.finalText).toBe(passage.slice(0, boundary));
  326 |   expect(result.metrics.insertionAttempts).toBe(boundary + 1);
  327 |   expect(result.metrics.deletionActions).toBe(1);
  328 |   expect(
  329 |     result.events.filter((event) => event.provenance === "composition"),
  330 |   ).toHaveLength(1);
  331 | });
  332 | 
  333 | test("composition preserves its committed prefix and Tab then Enter resets the word boundary", async ({
  334 |   page,
  335 | }) => {
  336 |   const input = await customPractice(page, "cat élan dog quiet");
  337 |   await input.pressSequentially("cat ");
  338 |   await input.evaluate((element) => {
  339 |     const textarea = element as HTMLTextAreaElement;
  340 |     const setValue = Object.getOwnPropertyDescriptor(
  341 |       HTMLTextAreaElement.prototype,
  342 |       "value",
  343 |     )!.set!;
  344 |     textarea.dispatchEvent(
  345 |       new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
  346 |     );
  347 |     setValue.call(textarea, "cat e");
  348 |     textarea.dispatchEvent(
  349 |       new InputEvent("input", {
  350 |         bubbles: true,
  351 |         inputType: "insertCompositionText",
  352 |         data: "e",
  353 |         isComposing: true,
  354 |       }),
  355 |     );
  356 |     setValue.call(textarea, "cat e\u0301");
  357 |     textarea.dispatchEvent(
  358 |       new CompositionEvent("compositionend", {
  359 |         bubbles: true,
  360 |         data: "e\u0301",
  361 |       }),
  362 |     );
  363 |     textarea.dispatchEvent(
  364 |       new InputEvent("input", {
  365 |         bubbles: true,
  366 |         inputType: "insertCompositionText",
  367 |         data: "e\u0301",
  368 |       }),
  369 |     );
  370 |   });
  371 |   await expect(input).toHaveValue("cat é");
  372 |   await expect(
  373 |     page.getByTestId("typing-target").locator('[data-slot-index="4"]'),
  374 |   ).toHaveAttribute("data-status", "correct");
  375 |   await input.press("Backspace");
  376 |   await expect(input).toHaveValue("cat ");
  377 |   await input.press("Backspace");
  378 |   await expect(input).toHaveValue("cat ");
  379 |   await input.press("Tab");
  380 |   const restart = page.getByRole("button", {
  381 |     name: "Restart with new text",
  382 |     exact: true,
  383 |   });
  384 |   await expect(restart).toBeFocused();
  385 |   await restart.press("Enter");
> 386 |   await expect(input).toBeFocused();
      |                       ^ Error: expect(locator).toBeFocused() failed
  387 |   await expect(input).toHaveValue("");
  388 |   await input.press("x");
  389 |   await input.press("Backspace");
  390 |   await expect(input).toHaveValue("");
  391 |   await expect(
  392 |     page.getByTestId("typing-target").locator('[data-current="true"]'),
  393 |   ).toHaveAttribute("data-slot-index", "0");
  394 | });
  395 | 
```