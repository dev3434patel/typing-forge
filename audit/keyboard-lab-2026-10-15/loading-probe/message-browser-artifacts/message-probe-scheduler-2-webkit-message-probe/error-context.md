# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: message-probe.spec.ts >> scheduler-2
- Location: audit\keyboard-lab-2026-10-15\loading-probe\message-probe.spec.ts:54:30

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Test', exact: true })
Expected: "/"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Test', exact: true }) with timeout 5000ms
  - waiting for getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Test', exact: true })

```

```yaml
- status: Loading your workspace…
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
> 58 |   await expect(nav.getByRole('link', { name: 'Test', exact: true })).toHaveAttribute('href', '/');
     |                                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  59 |   await nav.getByRole('link', { name: 'Learn', exact: true }).click();
  60 |   await expect(page).toHaveURL('/learn');
  61 |   await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
  62 | });
  63 | 
```