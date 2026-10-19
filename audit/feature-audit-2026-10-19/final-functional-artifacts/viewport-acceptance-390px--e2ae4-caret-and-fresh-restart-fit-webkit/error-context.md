# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: viewport-acceptance.spec.ts >> 390px phone: intro, home, wrong-key caret and fresh restart fit
- Location: e2e\viewport-acceptance.spec.ts:227:3

# Error details

```
Error: clock.pauseAt: Error: Cannot fast-forward to the past
```

# Test source

```ts
  1   | import { expect, test, type Page, type TestInfo } from "@playwright/test";
  2   | import { focusTyping } from "./helpers";
  3   | import { waitForLayoutFonts } from "./layout-fonts";
  4   | import { selectDocumentOpeningRenderer } from "./opening-renderer";
  5   | 
  6   | const PREFERENCES_KEY = "typingforge:v3:guest:preferences";
  7   | const VIEWPORTS = [
  8   |   { name: "360px phone", width: 360, height: 800 },
  9   |   { name: "390px phone", width: 390, height: 844 },
  10  |   { name: "768px tablet", width: 768, height: 1024 },
  11  |   { name: "1024px tablet", width: 1024, height: 768 },
  12  |   { name: "1280px desktop", width: 1280, height: 800 },
  13  |   { name: "1440px desktop", width: 1440, height: 900 },
  14  |   { name: "1920px desktop", width: 1920, height: 1080 },
  15  |   { name: "2560px desktop", width: 2560, height: 1440 },
  16  |   { name: "844px phone landscape", width: 844, height: 390 },
  17  |   { name: "640px 200% zoom equivalent", width: 640, height: 450 },
  18  | ] as const;
  19  | 
  20  | async function pauseClock(page: Page) {
  21  |   await selectDocumentOpeningRenderer(page);
  22  |   await page.clock.install();
> 23  |   await page.clock.pauseAt(
      |                    ^ Error: clock.pauseAt: Error: Cannot fast-forward to the past
  24  |     new Date((await page.evaluate(() => Date.now())) + 25),
  25  |   );
  26  | }
  27  | 
  28  | async function expectNoHorizontalOverflow(page: Page) {
  29  |   const geometry = await page.evaluate(() => {
  30  |     const viewport = document.documentElement.clientWidth;
  31  |     return {
  32  |       viewport,
  33  |       document: document.documentElement.scrollWidth,
  34  |       body: document.body.scrollWidth,
  35  |       sectionsOutsideViewport: Array.from(
  36  |         document.querySelectorAll("header, main, footer"),
  37  |       )
  38  |         .filter((element) => {
  39  |           const rect = element.getBoundingClientRect();
  40  |           return (
  41  |             rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1)
  42  |           );
  43  |         })
  44  |         .map((element) => element.tagName),
  45  |     };
  46  |   });
  47  |   expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
  48  |   expect(geometry.body).toBeLessThanOrEqual(geometry.viewport + 1);
  49  |   expect(geometry.sectionsOutsideViewport).toEqual([]);
  50  |   return geometry;
  51  | }
  52  | 
  53  | async function expectIntroFits(page: Page) {
  54  |   const opening = page.getByTestId("opening-experience");
  55  |   const geometry = await opening.evaluate((element) => {
  56  |     const selectors = [
  57  |       ".awakening-title",
  58  |       ".awakening-caption",
  59  |       ".awakening-coordinates",
  60  |       ".awakening-controls",
  61  |       ".awakening-actions",
  62  |       ".awakening-actions button",
  63  |     ];
  64  |     const rect = (node: Element) => {
  65  |       const box = node.getBoundingClientRect();
  66  |       return {
  67  |         left: box.left,
  68  |         top: box.top,
  69  |         right: box.right,
  70  |         bottom: box.bottom,
  71  |         width: box.width,
  72  |         height: box.height,
  73  |       };
  74  |     };
  75  |     return {
  76  |       viewport: { width: innerWidth, height: innerHeight },
  77  |       opening: rect(element),
  78  |       elements: selectors.flatMap((selector) =>
  79  |         Array.from(element.querySelectorAll(selector)).map((node) => ({
  80  |           selector,
  81  |           ...rect(node),
  82  |         })),
  83  |       ),
  84  |       caption: rect(element.querySelector(".awakening-caption")!),
  85  |       controls: rect(element.querySelector(".awakening-controls")!),
  86  |     };
  87  |   });
  88  |   expect(geometry.opening.left).toBe(0);
  89  |   expect(geometry.opening.top).toBe(0);
  90  |   // Windows WebKit can expose fractional CSS bounds beside integer viewport APIs.
  91  |   expect(
  92  |     Math.abs(geometry.opening.width - geometry.viewport.width),
  93  |   ).toBeLessThanOrEqual(1);
  94  |   expect(
  95  |     Math.abs(geometry.opening.height - geometry.viewport.height),
  96  |   ).toBeLessThanOrEqual(1);
  97  |   for (const item of geometry.elements) {
  98  |     expect(item.left, item.selector).toBeGreaterThanOrEqual(-1);
  99  |     expect(item.top, item.selector).toBeGreaterThanOrEqual(-1);
  100 |     expect(item.right, item.selector).toBeLessThanOrEqual(
  101 |       geometry.viewport.width + 1,
  102 |     );
  103 |     expect(item.bottom, item.selector).toBeLessThanOrEqual(
  104 |       geometry.viewport.height + 1,
  105 |     );
  106 |     if (item.selector === ".awakening-actions button")
  107 |       expect(Math.round(item.height)).toBeGreaterThanOrEqual(44);
  108 |   }
  109 |   expect(geometry.caption.bottom + 4).toBeLessThanOrEqual(
  110 |     geometry.controls.top,
  111 |   );
  112 |   await expectNoHorizontalOverflow(page);
  113 |   return geometry;
  114 | }
  115 | 
  116 | async function expectMeasuredCaret(page: Page) {
  117 |   const viewport = page.getByTestId("typing-viewport");
  118 |   await expect(viewport.locator(":scope > .forge-caret")).toBeVisible();
  119 |   await expect
  120 |     .poll(() =>
  121 |       viewport.evaluate((element) => {
  122 |         const frame = element.getBoundingClientRect();
  123 |         const caret = element
```