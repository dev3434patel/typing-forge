import { expect, test, type Page } from '@playwright/test';
import { phpApiBase } from './php-api-fixture';
import type { ArenaRoom } from '../src/domain/arena';
import type { SessionResult } from '../src/lib/typing-core';
import { auditPopulatedRoute } from './route-accessibility-fixture';
test.use({ serviceWorkers: 'block' });
const owner = 'a1111111-1111-4111-8111-111111111111';
async function arenaFixture(page: Page, baseURL: string, options: { guest?: boolean; quarantine?: boolean; leaveFailure?: boolean } = {}) {
  const api = phpApiBase(baseURL), id = 'b1111111-1111-4111-8111-111111111111', code = 'ABCD1234';
  const now = Date.now(), target = Array(100).fill('calm clear river').join(' '), submissions: SessionResult[] = [];
  const room: ArenaRoom = { id, code, status: options.quarantine ? 'active' : 'waiting', version: 1, hostId: owner, serverNow: now, startsAt: options.quarantine ? now - 1000 : null, deadlineAt: options.quarantine ? now + 14000 : null, durationSeconds: 15, targetText: target,
    configuration: { mode: 'race', durationMs: 15000, language: 'en', script: 'Latin', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', contentRevision: 'sparow-arena-v1', challengeId: `arena:${id}`, correctionPolicy: 'current-word', privacy: 'public-corpus', settings: { arenaId: id, localBot: false } },
    members: Array.from({ length: 8 }, (_, index) => ({ id: index ? `fixture-member-${index}` : owner, handle: `fixture_racer_${index + 1}`, slot: index, ready: index !== 0, status: options.quarantine && index === 0 ? 'quarantined' : 'joined', progress: 0, wpm: null, accuracy: null, placement: null, rematchVote: false, ...(index === 0 && options.quarantine ? { quarantineReason: 'uniform-input-timing', appealRequested: false } : {}) })), viewerId: owner, spectator: false, rematchCode: null, reconnectWindowMs: 20000 };
  await page.route(`${api.href}**`, async route => {
    const path = new URL(route.request().url()).pathname.slice(api.pathname.length - 1), body = route.request().method() === 'POST' ? route.request().postDataJSON() : {};
    if (path.startsWith('/arena/')) {
      const action = path.slice('/arena/'.length); room.serverNow = Date.now();
      if (room.status === 'countdown' && room.startsAt! <= Date.now()) { room.status = 'active'; room.members.forEach(member => { member.status = 'racing'; }); room.version++; }
      if (room.status === 'active' && room.deadlineAt! + 1000 <= Date.now() && !options.quarantine) { room.status = 'completed'; room.members.forEach((member, index) => { member.status = 'finished'; member.placement = index + 1; }); room.version++; }
      if (action === 'ready') { room.members[0].ready = body.ready; room.status = 'countdown'; room.startsAt = Date.now() + 3000; room.deadlineAt = room.startsAt + 15000; room.version++; }
      if (action === 'submit') { submissions.push(body.candidate); room.members[0].progress = 1; room.members[0].wpm = body.candidate.metrics.wpm; room.members[0].accuracy = body.candidate.metrics.inputAccuracy; if (body.finish) room.members[0].status = 'finished'; room.version++; }
      if (action === 'appeal') { room.members[0].appealRequested = true; room.version++; }
      if (action === 'leave' && options.leaveFailure) { await route.fulfill({ status: 503, json: { error: { code: 'fixture-offline', message: 'Arena server offline fixture.' } } }); return; }
      await route.fulfill({ json: { arena: { ...room, spectator: action === 'spectate' } } }); return;
    }
    const json = path === '/auth/session' ? { user: options.guest ? null : { id: owner, email: 'arena-fixture@example.test', handle: 'fixture_racer_1', created_at: '2026-10-21T00:00:00Z' }, csrfToken: 'arena-fixture-csrf' }
      : path === '/preferences' ? { preferences: {}, version: 0 } : path === '/sessions' ? { sessions: [], learningEvidence: [], version: 0, hasMore: false }
      : path === '/data/version' ? { ownerId: owner, version: 0 } : {};
    await route.fulfill({ json });
  });
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  return { room, submissions };
}
test('arena guest entry offers real authentication and labelled bot practice without inventing peers', async ({ page, baseURL }) => {
  await arenaFixture(page, baseURL!, { guest: true }); await page.goto('/arena');
  await expect(page.getByRole('heading', { name: 'Eight-seat arena', exact: true })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create eight-seat room', exact: true })).toHaveCount(0);
});
test('eight-member UI uses actual native canonical typing after the issued countdown and preserves strict rules', async ({ page, baseURL }, info) => {
  const fixture = await arenaFixture(page, baseURL!); await page.goto('/arena');
  await page.getByRole('button', { name: 'Create eight-seat room', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Arena room', exact: true })).toContainText('8/8');
  await expect(page.getByLabel('Human racer progress').locator('strong')).toHaveCount(8);
  await page.getByRole('button', { name: 'Ready to race', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Starting in' })).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await input.pressSequentially('calm c', { delay: 60 });
  await expect(input).toHaveValue('calm c');
  await expect.poll(() => fixture.submissions.some(value => value.events.length >= 6)).toBe(true);
  const candidate = fixture.submissions.find(value => value.events.length >= 6)!;
  expect(candidate.configuration.correctionPolicy).toBe('current-word'); expect(candidate.configuration.challengeId).toBe(`arena:${fixture.room.id}`); expect(candidate.ownerScope).toBe(owner);
  expect(candidate.events.map(event => event.text).join('')).toBe('calm c'); expect(candidate.metrics.insertionAttempts).toBe(6);
  await expect(page.getByText('Session complete', { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel('Human racer progress')).toContainText('Place1');
  await info.attach('arena-ui-fixture-scope', { contentType: 'application/json', body: JSON.stringify({ actualNativeInput: true, realSharedClock: true, backend: 'mocked contract; independent PHP/DB/load acceptance separate', events: candidate.events.length }) });
});
test('quarantined own result stays visible outside placements and a bounded review request persists', async ({ page, baseURL }) => {
  await arenaFixture(page, baseURL!, { quarantine: true }); await page.goto('/arena'); await page.getByRole('button', { name: 'Create eight-seat room', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Arena room', exact: true })).toContainText('Under review');
  await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Request review', exact: true }).click(); await expect(page.getByRole('button', { name: 'Review request recorded', exact: true })).toBeDisabled();
});
test('failed leave retains room recovery and spectator view exposes public progress', async ({ page, baseURL }) => {
  await arenaFixture(page, baseURL!, { leaveFailure: true }); await page.goto('/arena');
  await page.getByLabel('Eight-character room code').fill('ABCD1234'); await page.getByRole('button', { name: 'Spectate arena', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Arena room', exact: true })).toContainText('Spectating');
  await expect(page.getByRole('region', { name: 'Arena room', exact: true })).not.toContainText('@example.test');
  await page.getByRole('button', { name: 'Leave arena', exact: true }).click(); await page.getByRole('button', { name: 'Create eight-seat room', exact: true }).click();
  await page.getByRole('button', { name: 'Leave arena', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Arena server offline fixture.');
  await expect(page.getByRole('region', { name: 'Arena room', exact: true })).toBeVisible();
});
for (const width of [390, 1440]) for (const state of ['waiting', 'quarantine', 'spectator'] as const) {
  test(`arena populated ${state} accessibility and44px controls at${width}px`, async ({ page, baseURL }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await arenaFixture(page, baseURL!, { quarantine: state === 'quarantine' });
    await page.goto('/arena');
    if (state === 'spectator') {
      await page.getByRole('textbox', { name: 'Eight-character room code', exact: true }).fill('ABCD1234');
      await page.getByRole('button', { name: 'Spectate arena', exact: true }).click();
    } else await page.getByRole('button', { name: 'Create eight-seat room', exact: true }).click();
    const room = page.getByRole('region', { name: 'Arena room', exact: true });
    await expect(room).toContainText('8/8');
    await expect(room.getByLabel('Human racer progress').locator('strong')).toHaveCount(8);
    if (state === 'waiting') await expect(room.getByRole('button', { name: 'Ready to race', exact: true })).toBeVisible();
    if (state === 'quarantine') {
      await expect(room.getByRole('button', { name: 'Request review', exact: true })).toBeVisible();
      await expect(room).toContainText('uniform-input-timing');
      await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
    }
    if (state === 'spectator') {
      await expect(room).toContainText('Spectating');
      await expect(room.getByRole('button', { name: 'Ready to race', exact: true })).toHaveCount(0);
      await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
    }
    await auditPopulatedRoute(page, info, `arena-${state}-${width}`);
  });
}
