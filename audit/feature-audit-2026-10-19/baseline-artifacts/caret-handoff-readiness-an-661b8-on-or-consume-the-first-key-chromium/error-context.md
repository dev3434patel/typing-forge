# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: caret-handoff-readiness.spec.ts >> an actual caret module arriving after its import deadline cannot revive decoration or consume the first key
- Location: e2e\caret-handoff-readiness.spec.ts:139:1

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
    11 × locator resolved to 1 element
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
  - generic [aria-hidden] [ref=e15]: A signal becomes a keystroke.
  - generic [ref=e18]:
    - generic "Asset readiness" [ref=e19]:
      - generic [ref=e20]: 100%
      - generic [ref=e23]: Ready to type
    - generic [ref=e24]:
      - 'button "Sound off: enable intro sound" [ref=e25] [cursor=pointer]':
        - text: Sound off
        - generic [aria-hidden] [ref=e26]: ○
      - button "Skip intro" [ref=e27] [cursor=pointer]:
        - text: Skip intro
        - generic [aria-hidden] [ref=e28]: ↗
  - paragraph [aria-hidden] [ref=e29]: Press any key, click or tap to enter
```

# Test source

```ts
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
  160 |           node.classList.contains("awakening-handoff")
  161 |         )
  162 |           document.documentElement.dataset.expiredHandoffAppends = String(
  163 |             Number(
  164 |               document.documentElement.dataset.expiredHandoffAppends || 0,
  165 |             ) + 1,
  166 |           );
  167 |       return Reflect.apply(originalAppend, this, nodes);
  168 |     };
  169 |   });
  170 |   let releaseCaretModule = () => {};
  171 |   const gate = new Promise<void>((resolve) => {
  172 |     releaseCaretModule = resolve;
  173 |   });
  174 |   let actualModuleURL = "";
  175 |   const heldRequests: string[] = [];
  176 |   await context.route(
  177 |     /\/assets\/caret-handoff[^/]*\.js(?:\?.*)?$/,
  178 |     async (route) => {
  179 |       actualModuleURL = route.request().url();
  180 |       heldRequests.push(actualModuleURL);
  181 |       await gate;
  182 |       await route.continue();
  183 |     },
  184 |   );
  185 |   const errors: string[] = [];
  186 |   page.on("pageerror", (error) => errors.push(error.message));
  187 |   await page.clock.install();
  188 |   await page.clock.pauseAt(
  189 |     new Date((await page.evaluate(() => Date.now())) + 25),
  190 |   );
  191 |   try {
  192 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  193 |     const opening = page.getByTestId("opening-experience");
  194 |     await expect(opening).toHaveAttribute("data-mode", "full");
  195 |     await expect(
  196 |       page.getByRole("status").filter({ hasText: "Loading SparowType" }),
  197 |     ).toBeVisible();
  198 |     await page.clock.fastForward(4500);
  199 |     await page.clock.runFor(200);
> 200 |     await expect(opening).toHaveCount(0);
      |                           ^ Error: expect(locator).toHaveCount(expected) failed
  201 |     await expect.poll(() => heldRequests.length).toBe(1);
  202 |     const input = page.getByRole("textbox", {
  203 |       name: "Typing input",
  204 |       exact: true,
  205 |     });
  206 |     await expect(input).toBeVisible();
  207 |     await expect(input).toHaveValue("");
  208 |     await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  209 | 
  210 |     // No input or pointer cancellation is sent: the actual 1000ms import
  211 |     // settlement deadline must own this cleanup before a late HTTP200 arrives.
  212 |     await page.clock.runFor(1001);
  213 |     const moduleResponse = page.waitForResponse(actualModuleURL);
  214 |     releaseCaretModule();
  215 |     expect((await moduleResponse).status()).toBe(200);
  216 |     await page.clock.runFor(80);
  217 |     await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  218 |     expect(
  219 |       await page.locator("html").getAttribute("data-expired-handoff-appends"),
  220 |     ).toBeNull();
  221 |     expect(
  222 |       await page
  223 |         .locator("html")
  224 |         .getAttribute("data-expired-handoff-animations"),
  225 |     ).toBeNull();
  226 |     await expect(input).toHaveValue("");
  227 |     await input.pressSequentially("x");
  228 |     await expect(input).toHaveValue("x");
  229 |     await expect(
  230 |       page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  231 |     ).not.toHaveCSS("visibility", "hidden");
  232 |     expect(errors).toEqual([]);
  233 |     await test.info().attach("expired-real-caret-module", {
  234 |       contentType: "application/json",
  235 |       body: JSON.stringify({
  236 |         actualHeldModuleRequests: heldRequests,
  237 |         additionalDocumentClockAdvancedWhileModuleHeldMs: 1001,
  238 |         responseStatus: 200,
  239 |         appendedDecorativeCarets: Number(
  240 |           (await page
  241 |             .locator("html")
  242 |             .getAttribute("data-expired-handoff-appends")) || 0,
  243 |         ),
  244 |         animationCount: Number(
  245 |           (await page
  246 |             .locator("html")
  247 |             .getAttribute("data-expired-handoff-animations")) || 0,
  248 |         ),
  249 |         finalInput: await input.inputValue(),
  250 |         pageErrors: errors,
  251 |       }),
  252 |     });
  253 |   } finally {
  254 |     releaseCaretModule();
  255 |   }
  256 | });
  257 | 
```