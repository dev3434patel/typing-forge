# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-worker.spec.ts >> five consecutive live-worker reloads close each prior worker and final skip closes the last worker
- Location: e2e\opening-worker.spec.ts:529:1

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 1
Received length: 0
Received array:  []
```

# Page snapshot

```yaml
- main "SparowType introduction" [ref=f2e1]:
  - status [ref=f2e2]: Loading SparowType
  - generic [aria-hidden] [ref=f2e4]:
    - generic [ref=f2e5]: SPAROWTYPE / INPUT SYSTEM 01
    - generic [ref=f2e6]: EST. 2026 · READY FOR YOUR RHYTHM
  - generic [ref=f2e10]:
    - generic [ref=f2e11]: Sparow
    - generic [ref=f2e12]: Type
  - generic [aria-hidden] [ref=f2e14]: A signal becomes a keystroke.
  - generic [ref=f2e17]:
    - generic "Asset readiness" [ref=f2e18]:
      - generic [ref=f2e19]: 100%
      - generic [ref=f2e22]: Ready to type
    - generic [ref=f2e23]:
      - 'button "Sound off: enable intro sound" [ref=f2e24] [cursor=pointer]':
        - text: Sound off
        - generic [aria-hidden] [ref=f2e25]: ○
      - button "Skip intro" [ref=f2e26] [cursor=pointer]:
        - text: Skip intro
        - generic [aria-hidden] [ref=f2e27]: ↗
  - paragraph [aria-hidden] [ref=f2e28]: Press any key, click or tap to enter
```

# Test source

```ts
  507 |     environment: true,
  508 |     environmentIntensity: 0.35,
  509 |     contextLost: false,
  510 |     disposed: false,
  511 |   });
  512 |   expect(ready!.diagnostics!.frames).toBeGreaterThan(0);
  513 |   expect(ready!.diagnostics!.drawCalls).toBeGreaterThan(0);
  514 |   expect(ready!.diagnostics!.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  515 |   expect(ready!.diagnostics!.cameraElevationDegrees).toBeLessThanOrEqual(42);
  516 |   await info.attach("native-idle-boundary-acknowledgement", {
  517 |     body: JSON.stringify({
  518 |       scope: "Protocol-only; native RAF cadence held after actual full-quality draw",
  519 |       ready,
  520 |       idleReceipts: record.received.filter((receipt) =>
  521 |         receipt.type.startsWith("test-native-"),
  522 |       ),
  523 |       shutdown: (await records(page))[0],
  524 |     }),
  525 |     contentType: "application/json",
  526 |   });
  527 | });
  528 | 
  529 | test("five consecutive live-worker reloads close each prior worker and final skip closes the last worker", async ({
  530 |   page,
  531 | }, info) => {
  532 |   await observeNativeWorker(page, info);
  533 |   // A real document unload may mark the first visit as seen after a test removes
  534 |   // its key. Reset at the next document's start so both lifecycle passes really
  535 |   // exercise full workers; the ordinary returning-visit contract has its own test.
  536 |   await page.addInitScript(
  537 |     (key) => sessionStorage.removeItem(key),
  538 |     INTRO_SEEN_SESSION_KEY,
  539 |   );
  540 |   const live = new Set<PlaywrightWorker>();
  541 |   const closed: { sequence: number; url: string; closedAtNodeMs: number }[] =
  542 |     [];
  543 |   const started: { sequence: number; url: string; startedAtNodeMs: number }[] =
  544 |     [];
  545 |   let maximumLive = 0;
  546 |   page.on("worker", (worker) => {
  547 |     if (!workerEntry.test(worker.url())) return;
  548 |     const sequence = started.length + 1;
  549 |     started.push({
  550 |       sequence,
  551 |       url: worker.url(),
  552 |       startedAtNodeMs: performance.now(),
  553 |     });
  554 |     live.add(worker);
  555 |     maximumLive = Math.max(maximumLive, live.size);
  556 |     worker.on("close", () => {
  557 |       live.delete(worker);
  558 |       closed.push({
  559 |         sequence,
  560 |         url: worker.url(),
  561 |         closedAtNodeMs: performance.now(),
  562 |       });
  563 |     });
  564 |   });
  565 |   let initial: WorkerRecord[] = [];
  566 |   const cycles: {
  567 |     reload: number;
  568 |     records: WorkerRecord[];
  569 |     priorWorkersClosed: number;
  570 |     liveWorkers: number;
  571 |   }[] = [];
  572 |   try {
  573 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  574 |     await firstWorkerReady(page);
  575 |     initial = await records(page);
  576 |     const initialScene = initial[0].received.find(
  577 |       (receipt) => receipt.type === "ready",
  578 |     )?.diagnostics;
  579 |     if (!initialScene)
  580 |       throw new Error(
  581 |         "No full-quality initial worker receipt before reload ownership checks",
  582 |       );
  583 |     expect(initialScene).toMatchObject({
  584 |       thread: "worker",
  585 |       tier: "desktop",
  586 |       keyCount: 61,
  587 |       bloom: true,
  588 |       environment: true,
  589 |       environmentIntensity: 0.35,
  590 |       disposed: false,
  591 |     });
  592 |     expect(initialScene.frames).toBeGreaterThan(0);
  593 |     expect(initialScene.drawCalls).toBeGreaterThan(0);
  594 |     for (let reload = 1; reload <= 5; reload++) {
  595 |       await page.reload({ waitUntil: "domcontentloaded" });
  596 |       await expect(page.getByTestId("opening-experience")).toHaveAttribute(
  597 |         "data-mode",
  598 |         "full",
  599 |       );
  600 |       // These are real rapid reloads, including pending GPU preparation. The
  601 |       // independent quality case and initial document prove full PBR readiness;
  602 |       // cancellation must still close each native owner before the next one.
  603 |       await firstWorkerInitialized(page);
  604 |       await expect.poll(() => closed.length).toBe(reload);
  605 |       expect(
  606 |         page.workers().filter((worker) => workerEntry.test(worker.url())),
> 607 |       ).toHaveLength(1);
      |         ^ Error: expect(received).toHaveLength(expected)
  608 |       expect(live.size).toBe(1);
  609 |       expect(maximumLive).toBe(1);
  610 |       cycles.push({
  611 |         reload,
  612 |         records: await records(page),
  613 |         priorWorkersClosed: closed.length,
  614 |         liveWorkers: live.size,
  615 |       });
  616 |     }
  617 |     await page.keyboard.press("Escape");
  618 |     await expectWorkerClosed(page, "watchdog-allowed");
  619 |     expect(closed).toHaveLength(6);
  620 |     expect(live.size).toBe(0);
  621 |     expect(maximumLive).toBe(1);
  622 |     await readyPractice(page);
  623 |   } finally {
  624 |     info.annotations.push({
  625 |       type: "limitation",
  626 |       description:
  627 |         "Five actual reloads and native worker closure/ownership are finite lifecycle evidence, not a universal heap/GPU-memory leak guarantee.",
  628 |     });
  629 |     await info.attach("five-native-worker-reload-cycles", {
  630 |       body: JSON.stringify(
  631 |         { initial, cycles, started, closed, maximumLive },
  632 |         null,
  633 |         2,
  634 |       ),
  635 |       contentType: "application/json",
  636 |     });
  637 |   }
  638 | });
  639 | 
  640 | test("skipping while the native worker entry is blocked terminates startup and preserves the first typing key", async ({
  641 |   page,
  642 | }, info) => {
  643 |   await observeNativeWorker(page, info);
  644 |   let release = () => {};
  645 |   const gate = new Promise<void>((resolve) => {
  646 |     release = resolve;
  647 |   });
  648 |   await page.context().route(workerEntry, async (route) => {
  649 |     await gate;
  650 |     await route.continue().catch(() => undefined); // Cancellation is expected after termination.
  651 |   });
  652 |   try {
  653 |     await page.goto("/", { waitUntil: "domcontentloaded" });
  654 |     await expect
  655 |       .poll(async () =>
  656 |         (await records(page))[0]?.sent.some(
  657 |           (receipt) => receipt.type === "initialize",
  658 |         ),
  659 |       )
  660 |       .toBe(true);
  661 |     expect(
  662 |       (await records(page))[0].received.some(
  663 |         (receipt) => receipt.type === "ready",
  664 |       ),
  665 |     ).toBe(false);
  666 |     await page.keyboard.press("Escape");
  667 |     await expectWorkerClosed(page, "watchdog-allowed");
  668 |     const input = await readyPractice(page);
  669 |     await input.pressSequentially("x");
  670 |     await expect(input).toHaveValue("x");
  671 |   } finally {
  672 |     release();
  673 |   }
  674 | });
  675 | 
  676 | async function expectRecoveredDocumentScene(page: Page) {
  677 |   const opening = page.getByTestId("opening-experience");
  678 |   const canvas = page.locator(".awakening-canvas");
  679 |   await expect(opening).toHaveAttribute("data-renderer", "webgl");
  680 |   await expect
  681 |     .poll(async () => {
  682 |       const raw = await canvas.getAttribute("data-scene");
  683 |       const scene = raw
  684 |         ? (JSON.parse(raw) as KeyboardSceneDiagnostics)
  685 |         : undefined;
  686 |       return (
  687 |         scene?.thread === "main-thread" &&
  688 |         scene.keyCount === 61 &&
  689 |         scene.frames > 0 &&
  690 |         scene.drawCalls > 0
  691 |       );
  692 |     })
  693 |     .toBe(true);
  694 |   await expect(canvas).toHaveCount(1);
  695 |   await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  696 |   await page.keyboard.press("Escape");
  697 |   await readyPractice(page);
  698 | }
  699 | 
  700 | test("a native worker transport failure replaces the transferred canvas with the complete real document renderer", async ({
  701 |   page,
  702 | }, info) => {
  703 |   await observeNativeWorker(page, info);
  704 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  705 |   await firstWorkerReady(page);
  706 |   await page.evaluate(() =>
  707 |     (window as AuditedWindow).openingWorkerAudit!.workers[0].dispatchEvent(
```