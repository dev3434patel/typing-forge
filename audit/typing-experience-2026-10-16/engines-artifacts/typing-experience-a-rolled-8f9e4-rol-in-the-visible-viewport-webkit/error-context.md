# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: typing-experience.spec.ts >> a rolled learning lesson keeps its input and Resume control in the visible viewport
- Location: e2e\typing-experience.spec.ts:269:1

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByRole('button', { name: 'Resume practice', exact: true })
Expected: in viewport
Received: viewport ratio 0
Timeout:  5000ms

Call log:
  - Expect "toBeInViewport" getByRole('button', { name: 'Resume practice', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Resume practice', exact: true })
    9 × locator resolved to <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">…</button>
      - unexpected value "viewport ratio 0"

```

```yaml
- button "Resume practice":
  - img
  - text: Resume practice
```

# Test source

```ts
  190 |   page,
  191 | }) => {
  192 |   await page.goto("/");
  193 |   await page
  194 |     .getByRole("combobox", { name: "Language", exact: true })
  195 |     .selectOption("ar");
  196 |   const input = await focusTyping(page);
  197 |   const target = page.getByTestId("typing-target");
  198 |   await expect(page.getByTestId("typing-viewport")).toHaveAttribute(
  199 |     "dir",
  200 |     "rtl",
  201 |   );
  202 |   const first = await target
  203 |     .locator('[data-slot-index="0"]')
  204 |     .getAttribute("data-expected");
  205 |   await input.pressSequentially(first!);
  206 |   await expect(target.locator('[data-slot-index="0"]')).toHaveAttribute(
  207 |     "data-status",
  208 |     "correct",
  209 |   );
  210 |   await expectVisibleCaret(page);
  211 |   expect(await target.locator("[data-typing-word]").count()).toBeGreaterThan(1);
  212 | });
  213 | 
  214 | test("long free writing follows the visible end caret without clipping new input", async ({
  215 |   page,
  216 | }) => {
  217 |   await page.goto("/");
  218 |   await page
  219 |     .getByRole("group", { name: "Test mode" })
  220 |     .getByRole("button", { name: "Zen", exact: true })
  221 |     .click();
  222 |   await page.getByRole("button", { name: "Free writing", exact: true }).click();
  223 |   const input = await focusTyping(page);
  224 |   const content = Array(12)
  225 |     .fill("A quiet line of original writing.")
  226 |     .join("\n");
  227 |   await input.fill(content);
  228 |   await expect(input).toHaveValue(content);
  229 |   await expect
  230 |     .poll(() =>
  231 |       page
  232 |         .getByTestId("typing-viewport")
  233 |         .evaluate((element) => element.scrollTop),
  234 |     )
  235 |     .toBeGreaterThan(0);
  236 |   await expectVisibleCaret(page);
  237 |   await input.press("End");
  238 |   await input.pressSequentially(" More.");
  239 |   await expect(input).toHaveValue(content + " More.");
  240 |   await expectVisibleCaret(page);
  241 | });
  242 | 
  243 | test("learning keyboard distinguishes the next key from an actual wrong uppercase key", async ({
  244 |   page,
  245 | }, info) => {
  246 |   await page.goto("/learn?language=en&layout=qwerty");
  247 |   const input = page.getByRole("textbox", { name: "Type the practice text" });
  248 |   await expect(input).toBeFocused();
  249 |   await input.press("X");
  250 |   await expect(page.locator('.learn-keyboard [data-key="x"]')).toHaveClass(
  251 |     /learn-key-incorrect/,
  252 |   );
  253 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  254 |     "You typed X",
  255 |   );
  256 |   await expect(
  257 |     page.locator(".learn-keyboard [data-expected-key] "),
  258 |   ).toHaveCount(1);
  259 |   await page.screenshot({
  260 |     path: `audit/typing-experience-2026-10-16/learn-feedback-${info.project.name}.png`,
  261 |     fullPage: true,
  262 |   });
  263 |   await page.getByRole("button", { name: "Hide keyboard" }).click();
  264 |   await expect(page.locator(".learn-keyboard")).toHaveCount(0);
  265 |   await page.getByRole("button", { name: "Show keyboard" }).click();
  266 |   await expect(page.locator(".learn-keyboard")).toBeVisible();
  267 | });
  268 | 
  269 | test("a rolled learning lesson keeps its input and Resume control in the visible viewport", async ({
  270 |   page,
  271 | }) => {
  272 |   await page.setViewportSize({ width: 390, height: 844 });
  273 |   await page.goto("/learn?language=en");
  274 |   const input = page.getByRole("textbox", { name: "Type the practice text" });
  275 |   const target = page.locator(".learn-stream-text");
  276 |   const content = await target.textContent();
  277 |   await input.pressSequentially(
  278 |     content!.slice(0, Math.floor(content!.length * 0.7)),
  279 |   );
  280 |   await expect
  281 |     .poll(() =>
  282 |       page.locator(".learn-stream").evaluate((element) => element.scrollTop),
  283 |     )
  284 |     .toBeGreaterThan(0);
  285 |   await page.getByRole("button", { name: "Pause", exact: true }).click();
  286 |   const resume = page.getByRole("button", {
  287 |     name: "Resume practice",
  288 |     exact: true,
  289 |   });
> 290 |   await expect(resume).toBeInViewport();
      |                        ^ Error: expect(locator).toBeInViewport() failed
  291 |   await resume.click();
  292 |   await expect(input).toBeFocused();
  293 |   const expected = await target
  294 |     .locator('[data-current="true"]')
  295 |     .getAttribute("data-expected");
  296 |   const index = await target
  297 |     .locator('[data-current="true"]')
  298 |     .getAttribute("data-slot-index");
  299 |   await input.pressSequentially(expected!);
  300 |   await expect(target.locator(`[data-slot-index="${index}"]`)).toHaveAttribute(
  301 |     "data-status",
  302 |     "correct",
  303 |   );
  304 | });
  305 | 
  306 | test("learning caret follows extra letters even while the canonical cursor stays on Space", async ({
  307 |   page,
  308 | }) => {
  309 |   await page.goto("/learn?language=en");
  310 |   const input = page.getByRole("textbox", { name: "Type the practice text" });
  311 |   const target = page.locator(".learn-stream-text");
  312 |   const firstWord = (await target.textContent())!.split(" ")[0];
  313 |   await input.pressSequentially(firstWord + "xx");
  314 |   const cursor = target.locator('[data-current="true"]');
  315 |   await expect(cursor).toHaveAttribute("data-expected", " ");
  316 |   await input.press("x");
  317 |   await expect(target.locator("[data-typing-word]").first()).toHaveText(
  318 |     firstWord + "xxx",
  319 |   );
  320 |   await expect
  321 |     .poll(async () =>
  322 |       page.locator(".learn-stream").evaluate((element) => {
  323 |         const marker = element
  324 |           .querySelector('[data-current="true"]')!
  325 |           .getBoundingClientRect();
  326 |         const caret = element
  327 |           .querySelector(".learn-caret")!
  328 |           .getBoundingClientRect();
  329 |         return Math.abs(caret.left - marker.left);
  330 |       }),
  331 |     )
  332 |     .toBeLessThan(2);
  333 | });
  334 | 
  335 | test.describe("touch activation", () => {
  336 |   test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  337 |   test("touch users choose when to open the typing keyboard", async ({
  338 |     page,
  339 |   }) => {
  340 |     await page.goto("/");
  341 |     const input = page.getByRole("textbox", {
  342 |       name: "Typing input",
  343 |       exact: true,
  344 |     });
  345 |     await expect(input).toBeVisible();
  346 |     await expect(input).not.toBeFocused();
  347 |     await page
  348 |       .getByRole("button", { name: /^Click here or tab to start typing/ })
  349 |       .click();
  350 |     await expect(input).toBeFocused();
  351 |     expect(
  352 |       await page.evaluate(
  353 |         () => document.documentElement.scrollWidth <= innerWidth,
  354 |       ),
  355 |     ).toBe(true);
  356 |   });
  357 | });
  358 | 
  359 | test("Escape leaves an active learning composition under IME control", async ({
  360 |   page,
  361 | }) => {
  362 |   await page.goto("/learn?language=en");
  363 |   const input = page.getByRole("textbox", { name: "Type the practice text" });
  364 |   await expect(input).toBeFocused();
  365 |   await input.evaluate((element) =>
  366 |     element.dispatchEvent(
  367 |       new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
  368 |     ),
  369 |   );
  370 |   await input.press("Escape");
  371 |   await expect(input).toBeFocused();
  372 |   await input.evaluate((element) =>
  373 |     element.dispatchEvent(
  374 |       new CompositionEvent("compositionend", { bubbles: true, data: "" }),
  375 |     ),
  376 |   );
  377 |   await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(0);
  378 | });
  379 | 
```