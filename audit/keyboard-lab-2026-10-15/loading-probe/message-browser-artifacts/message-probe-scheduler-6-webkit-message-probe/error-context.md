# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: message-probe.spec.ts >> scheduler-6
- Location: audit\keyboard-lab-2026-10-15\loading-probe\message-probe.spec.ts:54:30

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
    - paragraph: "Practice passage: work come seed notion those a arise fire put hand together need week rose the set nation glass than three hand train group plain your slow free grand heart hand wish other step race up kite let three map rose our our nation sun ratio ration now us tall part yellow ante some ease queen innate fast his come main share even there eye rain rose little white water raise those strong these now build my large please shore tone snow nest retina quick start talk notion race map tell rent part dream seven nest may town same soft hope close their nation save story us summer though last can young tent show i note keen deep seven free fun"
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
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { mkdir, writeFile } from 'node:fs/promises';
  3  | 
  4  | const errors = new WeakMap<Page, string[]>();
  5  | test.beforeEach(async ({ page }) => {
  6  |   const messages: string[] = [];
  7  |   errors.set(page, messages);
  8  |   page.on('pageerror', error => messages.push(error.message));
  9  |   await page.addInitScript(() => {
  10 |     const probe = { events: [] as { kind: string; at: number; id?: number; value?: string }[] };
  11 |     Object.assign(window, { forgeMessageProbe: probe });
  12 |     const add = (kind: string, id?: number, value?: string) => { if (probe.events.length < 20000) probe.events.push({ kind, at: performance.now(), id, value }); };
  13 |     add('initial-visibility', undefined, document.visibilityState);
  14 |     const NativeMessageChannel = window.MessageChannel;
  15 |     const descriptor = Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage');
  16 |     let identifier = 0;
  17 |     window.MessageChannel = new Proxy(NativeMessageChannel, {
  18 |       construct(target, args, newTarget) {
  19 |         const channel = Reflect.construct(target, args, newTarget) as MessageChannel;
  20 |         const id = ++identifier;
  21 |         add('channel-created', id);
  22 |         const originalPost = channel.port2.postMessage.bind(channel.port2);
  23 |         channel.port2.postMessage = (...parameters: Parameters<MessagePort['postMessage']>) => {
  24 |           add('post', id);
  25 |           return Reflect.apply(originalPost, undefined, parameters);
  26 |         };
  27 |         if (descriptor?.get && descriptor.set) Object.defineProperty(channel.port1, 'onmessage', {
  28 |           configurable: true,
  29 |           get: () => descriptor.get!.call(channel.port1),
  30 |           set: (handler: MessagePort['onmessage']) => descriptor.set!.call(channel.port1, handler ? function(event: MessageEvent) {
  31 |             add('delivery-begin', id);
  32 |             try { return handler.call(channel.port1, event); } finally { add('delivery-end', id); }
  33 |           } : null),
  34 |         });
  35 |         return channel;
  36 |       },
  37 |     });
  38 |     let previous = '';
  39 |     new MutationObserver(() => {
  40 |       const identity = document.querySelector('main h1')?.textContent ?? document.querySelector('main')?.textContent?.slice(0, 40) ?? 'empty';
  41 |       if (identity !== previous) { add('view', undefined, identity); previous = identity; }
  42 |     }).observe(document, { childList: true, subtree: true, characterData: true });
  43 |   });
  44 | });
  45 | test.afterEach(async ({ page }, info) => {
  46 |   const data = await page.evaluate(() => ({
  47 |     events: (window as unknown as { forgeMessageProbe: unknown }).forgeMessageProbe,
  48 |     now: performance.now(), title: document.title, path: location.pathname, visibility: document.visibilityState,
  49 |     resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, start: entry.startTime, duration: entry.duration })),
  50 |   }));
  51 |   await mkdir('audit/keyboard-lab-2026-10-15/loading-probe/message-observations', { recursive: true });
  52 |   await writeFile(`audit/keyboard-lab-2026-10-15/loading-probe/message-observations/${info.title}.json`, JSON.stringify({ case: info.title, status: info.status, duration: info.duration, errors: errors.get(page), data }, null, 2));
  53 | });
  54 | for (let i = 1; i <= 8; i++) test(`scheduler-${i}`, async ({ page }) => {
  55 |   await page.setViewportSize({ width: 390, height: 844 });
  56 |   await page.goto('/');
  57 |   const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  58 |   await expect(nav.getByRole('link', { name: 'Test', exact: true })).toHaveAttribute('href', '/');
  59 |   await nav.getByRole('link', { name: 'Learn', exact: true }).click();
  60 |   await expect(page).toHaveURL('/learn');
> 61 |   await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
     |                                                                                                  ^ Error: expect(locator).toBeVisible() failed
  62 | });
  63 | 
```