# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: viewport-acceptance.spec.ts >> 390px full mobile fallback contains every key and keeps controls separate
- Location: e2e\viewport-acceptance.spec.ts:264:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 340
Received: 340.3636169433594
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - status [ref=e2]: Loading SparowType
  - generic [ref=e5]: SPAROWTYPE / INPUT SYSTEM 01
  - generic [aria-hidden]:
    - generic:
      - generic:
        - generic: Esc
        - generic: "1"
        - generic: "2"
        - generic: "3"
        - generic: "4"
        - generic: "5"
        - generic: "6"
        - generic: "7"
        - generic: "8"
        - generic: "9"
        - generic: "0"
        - generic: "-"
        - generic: =
        - generic: Back
        - generic: Tab
        - generic: Q
        - generic: W
        - generic: E
        - generic: R
        - generic: T
        - generic: "Y"
        - generic: U
        - generic: I
        - generic: O
        - generic: P
        - generic: "["
        - generic: "]"
        - generic: \
        - generic: Caps
        - generic: A
        - generic: S
        - generic: D
        - generic: F
        - generic: G
        - generic: H
        - generic: J
        - generic: K
        - generic: L
        - generic: ;
        - generic: "'"
        - generic: Enter
        - generic: Shift
        - generic: Z
        - generic: X
        - generic: C
        - generic: V
        - generic: B
        - generic: "N"
        - generic: M
        - generic: ","
        - generic: .
        - generic: /
        - generic: Shift
        - generic: Ctrl
        - generic: Win
        - generic: Alt
        - generic: Space
        - generic: Alt
        - generic: Fn
        - generic: Menu
        - generic: Ctrl
  - generic [ref=e8]: Sp
  - generic [aria-hidden] [ref=e11]: Ten keystrokes. One new beginning.
  - generic [ref=e14]:
    - generic "Asset readiness" [ref=e15]:
      - generic [ref=e16]: 100%
      - generic [ref=e19]: Fallback ready
    - generic [ref=e20]:
      - button "Enable intro sound" [ref=e21] [cursor=pointer]:
        - text: Sound off
        - generic [aria-hidden] [ref=e22]: ○
      - button "Skip intro" [ref=e23] [cursor=pointer]:
        - text: Skip intro
        - generic [aria-hidden] [ref=e24]: ↗
  - paragraph [aria-hidden] [ref=e25]: Press any key, click or tap to enter
```

# Test source

```ts
  1   | import { expect, test, type Page, type TestInfo } from "@playwright/test";
  2   | import { focusTyping } from "./helpers";
  3   | 
  4   | const PREFERENCES_KEY = "typingforge:v3:guest:preferences";
  5   | const VIEWPORTS = [
  6   |   { name: "360px phone", width: 360, height: 800 },
  7   |   { name: "390px phone", width: 390, height: 844 },
  8   |   { name: "768px tablet", width: 768, height: 1024 },
  9   |   { name: "1024px tablet", width: 1024, height: 768 },
  10  |   { name: "1280px desktop", width: 1280, height: 800 },
  11  |   { name: "1440px desktop", width: 1440, height: 900 },
  12  |   { name: "1920px desktop", width: 1920, height: 1080 },
  13  |   { name: "2560px desktop", width: 2560, height: 1440 },
  14  |   { name: "844px phone landscape", width: 844, height: 390 },
  15  |   { name: "640px 200% zoom equivalent", width: 640, height: 450 },
  16  | ] as const;
  17  | 
  18  | async function pauseClock(page: Page) {
  19  |   await page.clock.install();
  20  |   await page.clock.pauseAt(
  21  |     new Date((await page.evaluate(() => Date.now())) + 25),
  22  |   );
  23  | }
  24  | 
  25  | async function expectNoHorizontalOverflow(page: Page) {
  26  |   const geometry = await page.evaluate(() => {
  27  |     const viewport = document.documentElement.clientWidth;
  28  |     return {
  29  |       viewport,
  30  |       document: document.documentElement.scrollWidth,
  31  |       body: document.body.scrollWidth,
  32  |       sectionsOutsideViewport: Array.from(
  33  |         document.querySelectorAll("header, main, footer"),
  34  |       )
  35  |         .filter((element) => {
  36  |           const rect = element.getBoundingClientRect();
  37  |           return (
  38  |             rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1)
  39  |           );
  40  |         })
  41  |         .map((element) => element.tagName),
  42  |     };
  43  |   });
  44  |   expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
  45  |   expect(geometry.body).toBeLessThanOrEqual(geometry.viewport + 1);
  46  |   expect(geometry.sectionsOutsideViewport).toEqual([]);
  47  |   return geometry;
  48  | }
  49  | 
  50  | async function expectIntroFits(page: Page) {
  51  |   const opening = page.getByTestId("opening-experience");
  52  |   const geometry = await opening.evaluate((element) => {
  53  |     const selectors = [
  54  |       ".awakening-title",
  55  |       ".awakening-caption",
  56  |       ".awakening-coordinates",
  57  |       ".awakening-controls",
  58  |       ".awakening-actions",
  59  |       ".awakening-actions button",
  60  |     ];
  61  |     const rect = (node: Element) => {
  62  |       const box = node.getBoundingClientRect();
  63  |       return {
  64  |         left: box.left,
  65  |         top: box.top,
  66  |         right: box.right,
  67  |         bottom: box.bottom,
  68  |         width: box.width,
  69  |         height: box.height,
  70  |       };
  71  |     };
  72  |     return {
  73  |       viewport: { width: innerWidth, height: innerHeight },
  74  |       opening: rect(element),
  75  |       elements: selectors.flatMap((selector) =>
  76  |         Array.from(element.querySelectorAll(selector)).map((node) => ({
  77  |           selector,
  78  |           ...rect(node),
  79  |         })),
  80  |       ),
  81  |       caption: rect(element.querySelector(".awakening-caption")!),
  82  |       controls: rect(element.querySelector(".awakening-controls")!),
  83  |     };
  84  |   });
  85  |   expect(geometry.opening.left).toBe(0);
  86  |   expect(geometry.opening.top).toBe(0);
> 87  |   expect(geometry.opening.width).toBe(geometry.viewport.width);
      |                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  88  |   expect(geometry.opening.height).toBe(geometry.viewport.height);
  89  |   for (const item of geometry.elements) {
  90  |     expect(item.left, item.selector).toBeGreaterThanOrEqual(-1);
  91  |     expect(item.top, item.selector).toBeGreaterThanOrEqual(-1);
  92  |     expect(item.right, item.selector).toBeLessThanOrEqual(
  93  |       geometry.viewport.width + 1,
  94  |     );
  95  |     expect(item.bottom, item.selector).toBeLessThanOrEqual(
  96  |       geometry.viewport.height + 1,
  97  |     );
  98  |     if (item.selector === ".awakening-actions button")
  99  |       expect(item.height).toBeGreaterThanOrEqual(44);
  100 |   }
  101 |   expect(geometry.caption.bottom + 4).toBeLessThanOrEqual(
  102 |     geometry.controls.top,
  103 |   );
  104 |   await expectNoHorizontalOverflow(page);
  105 |   return geometry;
  106 | }
  107 | 
  108 | async function expectMeasuredCaret(page: Page) {
  109 |   const viewport = page.getByTestId("typing-viewport");
  110 |   await expect(viewport.locator(":scope > .forge-caret")).toBeVisible();
  111 |   await expect
  112 |     .poll(() =>
  113 |       viewport.evaluate((element) => {
  114 |         const frame = element.getBoundingClientRect();
  115 |         const caret = element
  116 |           .querySelector(":scope > .forge-caret")!
  117 |           .getBoundingClientRect();
  118 |         const marker = element
  119 |           .querySelector(".typing-text .forge-caret")!
  120 |           .getBoundingClientRect();
  121 |         return (
  122 |           caret.width > 0 &&
  123 |           caret.height > 0 &&
  124 |           caret.left >= frame.left - 1 &&
  125 |           caret.right <= frame.right + 1 &&
  126 |           caret.top >= frame.top - 1 &&
  127 |           caret.bottom <= frame.bottom + 1 &&
  128 |           Math.abs(caret.left - marker.left) <= 1 &&
  129 |           Math.abs(caret.top - marker.top) <= 1
  130 |         );
  131 |       }),
  132 |     )
  133 |     .toBe(true);
  134 |   const caret = (await viewport
  135 |     .locator(":scope > .forge-caret")
  136 |     .boundingBox())!;
  137 |   const frame = (await viewport.boundingBox())!;
  138 |   return {
  139 |     ...caret,
  140 |     relativeX: caret.x - frame.x,
  141 |     relativeY: caret.y - frame.y,
  142 |   };
  143 | }
  144 | 
  145 | async function inspectTypingAndRestart(page: Page) {
  146 |   const input = await focusTyping(page);
  147 |   const target = page.getByTestId("typing-target");
  148 |   const session = page.getByRole("region", {
  149 |     name: "Typing session",
  150 |     exact: true,
  151 |   });
  152 |   // Check loaded font state directly; never await the browser's native FontFaceSet promise.
  153 |   await page.waitForFunction(
  154 |     () => document.fonts.status === "loaded",
  155 |     undefined,
  156 |     {
  157 |       timeout: 10_000,
  158 |     },
  159 |   );
  160 |   await page.clock.runFor(50);
  161 |   await expect(session).toHaveAttribute("data-status", "ready");
  162 |   const originalText = await target.textContent();
  163 |   const originalId = await session.getAttribute("data-session-id");
  164 |   const initialCaret = await expectMeasuredCaret(page);
  165 |   const first = target.locator('[data-slot-index="0"]');
  166 |   const expected = await first.getAttribute("data-expected");
  167 |   const wrong = expected === "x" ? "z" : "x";
  168 |   await input.pressSequentially(wrong);
  169 |   await expect(input).toHaveValue(wrong);
  170 |   await expect(first).toHaveAttribute("data-status", "incorrect");
  171 |   await expect(first.locator("[data-typed-glyph]")).toHaveText(wrong);
  172 |   await expect(target.locator('[data-current="true"]')).toHaveAttribute(
  173 |     "data-slot-index",
  174 |     "1",
  175 |   );
  176 |   await page.clock.runFor(100);
  177 |   const wrongCaret = await expectMeasuredCaret(page);
  178 |   expect(wrongCaret!.x).toBeGreaterThan(initialCaret!.x);
  179 |   const inputRect = (await input.boundingBox())!;
  180 |   const viewportRect = (await page
  181 |     .getByTestId("typing-viewport")
  182 |     .boundingBox())!;
  183 |   expect(Math.abs(inputRect.x - viewportRect.x)).toBeLessThanOrEqual(1);
  184 |   expect(Math.abs(inputRect.width - viewportRect.width)).toBeLessThanOrEqual(1);
  185 |   await expectNoHorizontalOverflow(page);
  186 |   await input.press("Tab");
  187 |   const restart = page.getByRole("button", {
```