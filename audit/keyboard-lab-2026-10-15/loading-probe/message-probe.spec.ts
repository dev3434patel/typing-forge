import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  await page.addInitScript(() => {
    const probe = { events: [] as { kind: string; at: number; id?: number; value?: string }[] };
    Object.assign(window, { forgeMessageProbe: probe });
    const add = (kind: string, id?: number, value?: string) => { if (probe.events.length < 20000) probe.events.push({ kind, at: performance.now(), id, value }); };
    add('initial-visibility', undefined, document.visibilityState);
    const NativeMessageChannel = window.MessageChannel;
    const descriptor = Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage');
    let identifier = 0;
    window.MessageChannel = new Proxy(NativeMessageChannel, {
      construct(target, args, newTarget) {
        const channel = Reflect.construct(target, args, newTarget) as MessageChannel;
        const id = ++identifier;
        add('channel-created', id);
        const originalPost = channel.port2.postMessage.bind(channel.port2);
        channel.port2.postMessage = (...parameters: Parameters<MessagePort['postMessage']>) => {
          add('post', id);
          return Reflect.apply(originalPost, undefined, parameters);
        };
        if (descriptor?.get && descriptor.set) Object.defineProperty(channel.port1, 'onmessage', {
          configurable: true,
          get: () => descriptor.get!.call(channel.port1),
          set: (handler: MessagePort['onmessage']) => descriptor.set!.call(channel.port1, handler ? function(event: MessageEvent) {
            add('delivery-begin', id);
            try { return handler.call(channel.port1, event); } finally { add('delivery-end', id); }
          } : null),
        });
        return channel;
      },
    });
    let previous = '';
    new MutationObserver(() => {
      const identity = document.querySelector('main h1')?.textContent ?? document.querySelector('main')?.textContent?.slice(0, 40) ?? 'empty';
      if (identity !== previous) { add('view', undefined, identity); previous = identity; }
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
});
test.afterEach(async ({ page }, info) => {
  const data = await page.evaluate(() => ({
    events: (window as unknown as { forgeMessageProbe: unknown }).forgeMessageProbe,
    now: performance.now(), title: document.title, path: location.pathname, visibility: document.visibilityState,
    resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, start: entry.startTime, duration: entry.duration })),
  }));
  await mkdir('audit/keyboard-lab-2026-10-15/loading-probe/message-observations', { recursive: true });
  await writeFile(`audit/keyboard-lab-2026-10-15/loading-probe/message-observations/${info.title}.json`, JSON.stringify({ case: info.title, status: info.status, duration: info.duration, errors: errors.get(page), data }, null, 2));
});
for (let i = 1; i <= 8; i++) test(`scheduler-${i}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  await expect(nav.getByRole('link', { name: 'Test', exact: true })).toHaveAttribute('href', '/');
  await nav.getByRole('link', { name: 'Learn', exact: true }).click();
  await expect(page).toHaveURL('/learn');
  await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
});
