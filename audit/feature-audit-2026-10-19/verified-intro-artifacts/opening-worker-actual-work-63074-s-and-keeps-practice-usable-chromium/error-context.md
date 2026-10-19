# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> actual worker WebGL context loss after live frames recovers with a fresh canvas and keeps practice usable
- Location: e2e\opening-worker.spec.ts:993:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByTestId('opening-experience')
Expected: "webgl"
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
    - paragraph: "Practice passage: go pretty most summer yet order than park shape page wood queen those ten learn grass one space dear i kite point thing is each open need people south life there land thought black nice yet fine never feel up yellow cold hand face zero play full jump riot house care know ration say summer off oat forge person two few down focus ground with net joy fine south window people form tent few large low over move give own nature much move very ant top then tier three safe their one dark is most here stone back our day look shine run he no state left ten need sent strong down heart soft round letter their only share full"
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
  624 |       await expect.poll(() => closed.length).toBe(reload);
  625 |       // A successful constructor/postMessage in the document can precede
  626 |       // Playwright's native worker publication, especially during rapid Edge
  627 |       // reloads. Wait for the real owner; retain the exact ownership checks.
  628 |       await expect
  629 |         .poll(
  630 |           () =>
  631 |             page.workers().filter((worker) => workerEntry.test(worker.url()))
  632 |               .length,
  633 |         )
  634 |         .toBe(1);
  635 |       expect(
  636 |         page.workers().filter((worker) => workerEntry.test(worker.url())),
  637 |       ).toHaveLength(1);
  638 |       expect(live.size).toBe(1);
  639 |       expect(maximumLive).toBe(1);
  640 |       cycles.push({
  641 |         reload,
  642 |         records: await records(page),
  643 |         priorWorkersClosed: closed.length,
  644 |         liveWorkers: live.size,
  645 |       });
  646 |     }
  647 |     await page.keyboard.press("Escape");
  648 |     await expectWorkerClosed(page, "watchdog-allowed");
  649 |     expect(closed).toHaveLength(6);
  650 |     expect(live.size).toBe(0);
  651 |     expect(maximumLive).toBe(1);
  652 |     const input = await readyPractice(page);
  653 |     await input.pressSequentially("x");
  654 |     await expect(input).toHaveValue("x");
  655 |   } finally {
  656 |     info.annotations.push({
  657 |       type: "limitation",
  658 |       description:
  659 |         "Five actual reloads and native worker closure/ownership are finite lifecycle evidence, not a universal heap/GPU-memory leak guarantee.",
  660 |     });
  661 |     await info.attach("five-native-worker-reload-cycles", {
  662 |       body: JSON.stringify(
  663 |         {
  664 |           scope: "Native startup ownership, including pending GPU preparation",
  665 |           initialOwnership,
  666 |           initial,
  667 |           cycles,
  668 |           started,
  669 |           closed,
  670 |           maximumLive,
  671 |         },
  672 |         null,
  673 |         2,
  674 |       ),
  675 |       contentType: "application/json",
  676 |     });
  677 |   }
  678 | });
  679 | 
  680 | test("skipping while the native worker entry is blocked terminates startup and preserves the first typing key", async ({
  681 |   page,
  682 | }, info) => {
  683 |   await observeNativeWorker(page, info);
  684 |   let release = () => {};
  685 |   const gate = new Promise<void>((resolve) => {
  686 |     release = resolve;
  687 |   });
  688 |   await page.context().route(workerEntry, async (route) => {
  689 |     await gate;
  690 |     await route.continue().catch(() => undefined); // Cancellation is expected after termination.
  691 |   });
  692 |   try {
  693 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  694 |     await expect
  695 |       .poll(async () =>
  696 |         (await records(page))[0]?.sent.some(
  697 |           (receipt) => receipt.type === "initialize",
  698 |         ),
  699 |       )
  700 |       .toBe(true);
  701 |     expect(
  702 |       (await records(page))[0].received.some(
  703 |         (receipt) => receipt.type === "ready",
  704 |       ),
  705 |     ).toBe(false);
  706 |     await page.keyboard.press("Escape");
  707 |     await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  708 |     // Firefox retains a protocol worker entry while its test-intercepted request
  709 |     // is pending. Release it only after native termination has been observed.
  710 |     release();
  711 |     await expectWorkerClosed(page, "watchdog-allowed");
  712 |     expect((await records(page))[0].received.some(receipt => receipt.type === 'ready')).toBe(false);
  713 |     const input = await readyPractice(page);
  714 |     await input.pressSequentially("x");
  715 |     await expect(input).toHaveValue("x");
  716 |   } finally {
  717 |     release();
  718 |   }
  719 | });
  720 | 
  721 | async function expectRecoveredDocumentScene(page: Page) {
  722 |   const opening = page.getByTestId("opening-experience");
  723 |   const canvas = page.locator(".awakening-canvas");
> 724 |   await expect(opening).toHaveAttribute("data-renderer", "webgl");
      |                         ^ Error: expect(locator).toHaveAttribute(expected) failed
  725 |   await expect
  726 |     .poll(async () => {
  727 |       const raw = await canvas.getAttribute("data-scene");
  728 |       const scene = raw
  729 |         ? (JSON.parse(raw) as KeyboardSceneDiagnostics)
  730 |         : undefined;
  731 |       return (
  732 |         scene?.thread === "main-thread" &&
  733 |         scene.keyCount === 61 &&
  734 |         scene.frames > 0 &&
  735 |         scene.drawCalls > 0
  736 |       );
  737 |     })
  738 |     .toBe(true);
  739 |   await expect(canvas).toHaveCount(1);
  740 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  741 |   await page.keyboard.press("Escape");
  742 |   await readyPractice(page);
  743 | }
  744 | 
  745 | test("a native worker transport failure replaces the transferred canvas with the complete real document renderer", async ({
  746 |   page,
  747 | }, info) => {
  748 |   await observeNativeWorker(page, info);
  749 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  750 |   await firstWorkerReady(page);
  751 |   await page.evaluate(() =>
  752 |     (window as AuditedWindow).openingWorkerAudit!.workers[0].dispatchEvent(
  753 |       new ErrorEvent("error", { message: "Injected worker transport failure" }),
  754 |     ),
  755 |   );
  756 |   await expectRecoveredDocumentScene(page);
  757 | });
  758 | 
  759 | async function nativeContextLoss(
  760 |   page: Page,
  761 |   info: TestInfo,
  762 |   phase: "preparation" | "live",
  763 | ) {
  764 |   if (phase === "live") await observeNativeFallbackAnimations(page);
  765 |   await observeNativeWorker(page, info);
  766 |   await page.context().route(workerEntry, async (route) => {
  767 |     const response = await route.fetch();
  768 |     const body = await response.text();
  769 |     const injection = `
  770 | const originalOffscreenContext = OffscreenCanvas.prototype.getContext;
  771 | let contextForNativeLoss;
  772 | function requestNativeContextLoss() {
  773 |   if (!contextForNativeLoss) return;
  774 |   postMessage({type:"test-native-context-loss-requested"});
  775 |   contextForNativeLoss.loseContext();
  776 | }
  777 | OffscreenCanvas.prototype.getContext = function (...args) {
  778 |   const context = Reflect.apply(originalOffscreenContext, this, args);
  779 |   if (args[0] === "webgl2" && context) {
  780 |     const extension = context.getExtension("WEBGL_lose_context");
  781 |     postMessage({type:"test-context-loss-capability",supported:Boolean(extension)});
  782 |     contextForNativeLoss = extension;
  783 |     if (extension && ${JSON.stringify(phase)} === "preparation")
  784 |       setTimeout(requestNativeContextLoss, 100);
  785 |   }
  786 |   return context;
  787 | };
  788 | addEventListener("message", ({data}) => {
  789 |   if (data.type === "test-request-native-context-loss") requestAnimationFrame(() => {
  790 |     postMessage({type:"test-live-animation-frame"});
  791 |     requestNativeContextLoss();
  792 |   });
  793 | });
  794 | `;
  795 |     await route.fulfill({ response, body: injection + body });
  796 |   });
  797 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  798 |   await expect
  799 |     .poll(async () =>
  800 |       (await records(page))[0]?.received.some(
  801 |         (receipt) => receipt.type === "test-context-loss-capability",
  802 |       ),
  803 |     )
  804 |     .toBe(true);
  805 |   const available = (await records(page))[0].received.find(
  806 |     (receipt) => receipt.type === "test-context-loss-capability",
  807 |   )?.supported;
  808 |   test.skip(
  809 |     !available,
  810 |     "UNVERIFIED: this native worker has no WEBGL_lose_context extension.",
  811 |   );
  812 |   if (phase === "live") {
  813 |     await firstWorkerReady(page);
  814 |     const ready = (await records(page))[0].received.find(
  815 |       (receipt) => receipt.type === "ready",
  816 |     )?.diagnostics;
  817 |     if (!ready)
  818 |       throw new Error("No native worker readiness receipt before live loss");
  819 |     expect(ready.frames).toBeGreaterThan(0);
  820 |     expect(ready.drawCalls).toBeGreaterThan(0);
  821 |     await expect
  822 |       .poll(() =>
  823 |         page.evaluate(
  824 |           () =>
```