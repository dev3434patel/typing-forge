import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const directory = "audit/performance-polish-2026-10-16";
const origin = "http://127.0.0.1:4175";
const framing = process.argv.includes("--framing");
const prefix = framing ? "final" : "quality";
const summary = {
  clock: "Real production clock; native workers and WebGL; no virtual clock or shader mocks.",
  cases: [],
  offline: [],
};
const deadline = setTimeout(() => process.exit(2), 85_000);
const save = () => writeFile(`${directory}/${prefix}-visual-worker-smoke.json`, JSON.stringify(summary, null, 2));
const browser = await chromium.launch();
try {
  for (const [name, viewport, touch] of [
    ["desktop", { width: 1440, height: 1000 }, false],
    framing
      ? ["landscape", { width: 844, height: 390 }, true]
      : ["mobile", { width: 390, height: 844 }, true],
  ]) {
    const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    const result = { name, viewport, workers: [], errors: [], captures: [] };
    summary.cases.push(result);
    page.on("pageerror", error => result.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") result.errors.push(message.text()); });
    page.on("worker", worker => result.workers.push(worker.url()));
    await page.addInitScript(() => {
      window.introWorkerEvents = [];
      const Original = window.Worker;
      window.Worker = new Proxy(Original, {
        construct(Target, args) {
          const worker = Reflect.construct(Target, args);
          worker.addEventListener("message", ({ data }) => {
            window.introWorkerEvents.push({ time: performance.now(), type: data.type, diagnostics: data.diagnostics, phase: data.phase, letter: data.letter });
          });
          return worker;
        },
      });
      new MutationObserver(() => {
        if (document.querySelector('[data-testid="opening-experience"]') && !window.introMountedAt)
          window.introMountedAt = performance.now();
      }).observe(document, { subtree: true, childList: true });
    });
    await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 15_000 });
    if (!summary.build) summary.build = await (await page.request.get(`${origin}/offline-build.json`)).json();
    await page.getByTestId("opening-experience").waitFor({ state: "attached", timeout: 3000 });
    for (const [targetAge, stage] of [[1850, "assembled"], [3150, "typed"]]) {
      const age = await page.evaluate(() => performance.now() - window.introMountedAt);
      if (age < targetAge) await new Promise(resolve => setTimeout(resolve, targetAge - age));
      const opening = page.getByTestId("opening-experience");
      if (!(await opening.count())) { result.captures.push({ stage, missingOpeningAtCapture: true }); continue; }
      const state = await opening.evaluate(element => {
        const underlay = element.querySelector(".awakening-title-underlay");
        return {
          renderer: element.dataset.renderer,
          age: performance.now() - window.introMountedAt,
          scene: document.querySelector(".awakening-canvas")?.dataset.scene,
          typed: document.querySelector(".awakening-title-typed")?.textContent,
          underlay: { text: underlay?.textContent, color: underlay && getComputedStyle(underlay).color, visibility: underlay && getComputedStyle(underlay).visibility },
          controls: [...element.querySelectorAll("button,.awakening-title,.awakening-caption")].map(item => {
            const r = item.getBoundingClientRect();
            return { text: item.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
          }),
          documentWidth: document.documentElement.scrollWidth,
        };
      });
      const path = `${directory}/${prefix}-front-${name}-${stage}.png`;
      await page.screenshot({ path, timeout: 6000 });
      result.captures.push({ path, ...state, scene: state.scene ? JSON.parse(state.scene) : null });
    }
    const input = page.getByRole("textbox", { name: "Typing input", exact: true });
    try {
      await input.waitFor({ state: "visible", timeout: 6000 });
      result.practice = { value: await input.inputValue(), status: await page.getByRole("region", { name: "Typing session", exact: true }).getAttribute("data-status"), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) };
    } catch (error) { result.practiceFailure = String(error); }
    result.events = await page.evaluate(() => window.introWorkerEvents);
    result.nativeWorkerReady = result.events.some(event => event.type === "ready");
    await save();
    await context.close();
  }
  for (const viewport of framing ? [] : [{ width: 320, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const context = await browser.newContext({ viewport, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${origin}/_offline-recovery.html`, { waitUntil: "load", timeout: 10_000 });
    const focused = [];
    for (let index = 0; index < 3; index++) {
      await page.keyboard.press("Tab");
      focused.push(await page.evaluate(() => {
        const node = document.activeElement;
        const style = getComputedStyle(node);
        const r = node.getBoundingClientRect();
        return { text: node.textContent, tag: node.tagName, outline: style.outlineStyle, outlineWidth: style.outlineWidth, width: r.width, height: r.height, left: r.left, right: r.right };
      }));
    }
    const geometry = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      cssEmbedded: !!document.querySelector("style[data-offline-recovery]"),
      fontsEmbedded: !!document.querySelector("style[data-inline-fonts]"),
      scripts: document.scripts.length,
      mainFont: getComputedStyle(document.querySelector("main")).fontFamily,
      titleFont: getComputedStyle(document.querySelector("h1")).fontFamily,
    }));
    const path = `${directory}/quality-offline-${viewport.width}x${viewport.height}.png`;
    await page.screenshot({ path, fullPage: true, timeout: 6000 });
    summary.offline.push({ viewport, javaScriptEnabled: false, path, focused, ...geometry });
    await save();
    await context.close();
  }
} finally {
  await save();
  await browser.close();
  clearTimeout(deadline);
}
console.log(JSON.stringify({ build: summary.build, cases: summary.cases.map(({ name, errors, nativeWorkerReady, captures, practice }) => ({ name, errors, nativeWorkerReady, captures: captures.map(({ path, age, renderer, scene, typed }) => ({ path, age, renderer, scene, typed })), practice })), offline: summary.offline }, null, 2));
