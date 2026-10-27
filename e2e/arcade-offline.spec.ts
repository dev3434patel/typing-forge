import { expect, test as base } from '@playwright/test';
import { startPwaStaticServer } from './pwa-static-server';
import { GAMES } from '../src/games/modes/catalog';

const test = base.extend<{ offlineServer: Awaited<ReturnType<typeof startPwaStaticServer>> }>({
  offlineServer: async ({ browserName: _browserName }, provide) => {
    const server = await startPwaStaticServer();
    try { await provide(server); } finally { await server.stop(); }
  },
  baseURL: async ({ offlineServer }, provide) => provide(offlineServer.origin),
});

test('all eight arcade URLs survive a real HTTP outage without caching API or private room documents', async ({ page, offlineServer }, info) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  await page.goto('/offline');
  test.skip(!(await page.evaluate(() => 'serviceWorker' in navigator && 'caches' in window)), 'UNVERIFIED: service-worker/cache APIs unavailable.');
  await expect(page.getByText(/Public download: available/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await offlineServer.stop();
  await expect(fetch(`${offlineServer.origin}/offline-build.json`, { cache: 'no-store', signal: AbortSignal.timeout(1000) })).rejects.toThrow();
  await page.goto('/arcade');
  await expect(page.getByRole('heading', { name: 'Eight ways to find your flow.', exact: true })).toBeVisible();
  for (const game of GAMES) {
    await page.goto(`/arcade/${game.id}`);
    await expect(page.getByRole('heading', { name: game.name, exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Play ${game.name}`, exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Arcade typing input', exact: true });
    await expect(input).toBeEnabled();
    await page.locator('.arcade-target-alternative summary').click();
    const word = (await page.locator('.arcade-target-alternative li').first().textContent())!.split(' · ')[0];
    await input.focus(); await input.pressSequentially(word, { delay: 20 });
    await expect(input).toHaveValue('');
    await page.getByRole('button', { name: 'End run', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Arcade result', exact: true })).toBeVisible();
  }
  for (const route of ['/arcade/not-a-game', '/arena/private-fixture-code', '/friends']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: 'This page needs a connection.', exact: true })).toBeVisible();
  }
  const paths = await page.evaluate(async () => (await Promise.all((await caches.keys()).filter(name => name.startsWith('sparowtype-public-v1-')).map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat());
  expect(paths).toContain('/index.html');
  expect(paths.some(path => /^\/(?:api|arena|friends|auth|profile)(?:\/|$)/.test(path))).toBe(false);
  await info.attach('arcade-real-outage', { contentType: 'application/json', body: JSON.stringify({ build: offlineServer.build, transport: 'Owned disposable HTTP server stopped; no offline emulation or routing.', exactPlayableUrls: GAMES.map(game => `/arcade/${game.id}`), cachedPrivateDocuments: false, cachedApis: false }) });
});
