# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: loading-probe.spec.ts >> foreground 2 mobile route readiness
- Location: audit\keyboard-lab-2026-10-15\loading-probe\loading-probe.spec.ts:57:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Make every key feel natural.', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Make every key feel natural.', exact: true }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Make every key feel natural.', exact: true })

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "Typing Forge home":
    - /url: /
    - img
    - text: typingforge.
  - link "Settings":
    - /url: /settings
    - img
  - link "Sign in":
    - /url: /auth
    - img
  - navigation "Mobile navigation":
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
- main:
  - paragraph: Your daily moment of focus
  - heading "Make every keystroke count." [level=1]
  - paragraph: Find your rhythm. Build your accuracy. See your progress.
  - link "Build a stronger foundation":
    - /url: /learn
    - text: Build a stronger foundation
    - img
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
    - text: 30s remaining —wpm
    - paragraph: "Practice passage: window hard five own ten lane book those quite cold map step cold our north few lean you town thank book task rain terrain old few sort hope nine rest more look said calm step fair only book rain many none south early new near find summer word only try race as send talk full side door their together give fast near my five not light wide plan stop room great gold put face voice with sore much most order short red three put the set later food walk new shape tall town care out yet later the time move said fair work play group joy out though spring terrain want short safe paper thank soot these last second red"
    - textbox "Typing input"
    - button "Click here or tab to start typing Your first character starts the clock":
      - img
      - text: Click here or tab to start typing Your first character starts the clock
    - paragraph: Esc pauses · Ctrl+Enter finishes · Tab moves focus
    - button "Show accessible text editor":
      - img
    - button "Restart with new text":
      - img
    - button "Finish" [disabled]:
      - img
      - text: Finish
    - status: Ready to type
    - paragraph: Stay relaxed. Accuracy builds speed.
  - img
  - heading "A quieter workspace" [level=2]
  - paragraph: Six practice modes. Your language, layout and pace.
  - link "Practice with purpose Adaptive lessons follow the keys that need your attention.":
    - /url: /learn
    - img
    - heading "Practice with purpose" [level=2]
    - paragraph: Adaptive lessons follow the keys that need your attention.
  - img
  - heading "Progress you can trust" [level=2]
  - paragraph: Clear metrics and local history, even without an account.
- contentinfo:
  - img
  - text: A little practice. Lasting progress.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - text: Typing Forge © 2026
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { mkdir, writeFile } from 'node:fs/promises';
  3  | 
  4  | type ProbeEvent = { kind: string; at: number; value?: string };
  5  | test.beforeEach(async ({ page }, info) => {
  6  |   if (info.title.includes('foreground')) await page.bringToFront();
  7  |   await page.addInitScript(() => {
  8  |     const probe = { events: [] as ProbeEvent[] };
  9  |     Object.assign(window, { forgeLoadingProbe: probe });
  10 |     const add = (kind: string, value?: string) => probe.events.push({ kind, at: performance.now(), value });
  11 |     add('bootstrap-visibility', document.visibilityState);
  12 |     document.addEventListener('visibilitychange', () => add('visibility', document.visibilityState));
  13 |     document.addEventListener('DOMContentLoaded', () => add('dom-content-loaded'));
  14 |     window.addEventListener('load', () => add('window-load'));
  15 |     let lastState = '';
  16 |     new MutationObserver(() => {
  17 |       const main = document.querySelector('main');
  18 |       const next = main?.textContent?.includes('Loading your workspace') ? 'fallback' : main ? 'view' : 'empty';
  19 |       if (next !== lastState) { add('root', next); lastState = next; }
  20 |     }).observe(document, { subtree: true, childList: true, characterData: true });
  21 |     requestAnimationFrame(() => add('first-animation-frame'));
  22 |     const channel = new MessageChannel();
  23 |     channel.port1.onmessage = () => { add('initial-message-channel'); channel.port1.close(); channel.port2.close(); };
  24 |     channel.port2.postMessage(null);
  25 |   });
  26 | });
  27 | 
  28 | test.afterEach(async ({ page }, info) => {
  29 |   const browserErrors: string[] = [];
  30 |   page.on('pageerror', error => browserErrors.push(error.message));
  31 |   const data = await page.evaluate(async () => {
  32 |     const probe = (window as unknown as { forgeLoadingProbe: { events: ProbeEvent[] } }).forgeLoadingProbe;
  33 |     const start = performance.now();
  34 |     const channelLatency = await new Promise<number>(resolve => {
  35 |       const channel = new MessageChannel();
  36 |       channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve(performance.now() - start); };
  37 |       channel.port2.postMessage(null);
  38 |     });
  39 |     return {
  40 |       now: performance.now(), visibility: document.visibilityState,
  41 |       events: probe?.events, postTestMessageChannelLatency: channelLatency,
  42 |       title: document.title, url: location.pathname,
  43 |       currentRoot: document.querySelector('main')?.textContent?.slice(0, 140),
  44 |       resources: performance.getEntriesByType('resource').map(entry => {
  45 |         const resource = entry as PerformanceResourceTiming;
  46 |         return { name: new URL(resource.name).pathname, start: resource.startTime, end: resource.responseEnd, duration: resource.duration, type: resource.initiatorType };
  47 |       }),
  48 |     };
  49 |   }).catch(error => ({ collectionError: String(error) }));
  50 |   const report = { case: info.title, status: info.status, duration: info.duration, browserErrors, data };
  51 |   await mkdir('audit/keyboard-lab-2026-10-15/loading-probe/observations', { recursive: true });
  52 |   await writeFile(`audit/keyboard-lab-2026-10-15/loading-probe/observations/${info.title.replace(/[^a-z0-9]/gi, '-')}.json`, JSON.stringify(report, null, 2));
  53 | });
  54 | 
  55 | for (const foreground of [false, true]) for (let iteration = 1; iteration <= 3; iteration++) {
  56 |   const label = `${foreground ? 'foreground' : 'baseline'} ${iteration}`;
  57 |   test(`${label} mobile route readiness`, async ({ page }) => {
  58 |     await page.setViewportSize({ width: 390, height: 844 });
  59 |     await page.goto('/');
  60 |     const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  61 |     await expect(nav.getByRole('link', { name: 'Test', exact: true })).toHaveAttribute('href', '/');
  62 |     await nav.getByRole('link', { name: 'Learn', exact: true }).click();
  63 |     await expect(page).toHaveURL('/learn');
> 64 |     await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
     |                                                                                                    ^ Error: expect(locator).toBeVisible() failed
  65 |   });
  66 |   test(`${label} keyboard command readiness`, async ({ page }) => {
  67 |     await page.goto('/');
  68 |     await page.keyboard.press('ControlOrMeta+k');
  69 |     const dialog = page.getByRole('dialog', { name: 'Typing Forge commands', exact: true });
  70 |     await expect(dialog).toBeVisible();
  71 |     await dialog.getByRole('combobox').fill('Aurora');
  72 |     await page.keyboard.press('Enter');
  73 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  74 |   });
  75 |   test(`${label} direct learn readiness`, async ({ page }) => {
  76 |     await page.goto('/learn');
  77 |     await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
  78 |     await expect(page.getByRole('textbox', { name: 'Type the practice text', exact: true })).toBeVisible();
  79 |   });
  80 | }
  81 | 
```