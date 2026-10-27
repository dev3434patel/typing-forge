import { expect, test, type Page } from '@playwright/test';
import { phpApiBase } from './php-api-fixture';
import { auditPopulatedRoute } from './route-accessibility-fixture';
// These fixtures own all account responses. Real PWA behavior is tested
// separately; a service worker must not bypass this test's intercepted account.
test.use({ serviceWorkers: 'block' });
const ALICE = '11111111-1111-4111-8111-111111111111', BOB = '22222222-2222-4222-8222-222222222222', CAROL = '33333333-3333-4333-8333-333333333333';
const DUEL = '44444444-4444-4444-8444-444444444444';
const snapshot = () => ({ ownerId: ALICE, friends: [{ id: BOB, handle: 'bob_typist', activeRecently: true, email: 'private-bob@example.invalid', events: ['private evidence must never render'] }], requests: [{ id: CAROL, handle: 'carol_typist', direction: 'incoming' }], blocked: [] as Array<{ id: string; handle: string }>, duels: [{ id: DUEL, creatorId: ALICE, opponentId: BOB, otherHandle: 'bob_typist', state: 'accepted', expiresAt: '2026-12-01T00:00:00.000Z', ownSubmitted: false, scores: [], winnerId: null }] });
const unexpectedRequests = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  const base = phpApiBase(baseURL!), unhandled: string[] = []; unexpectedRequests.set(page, unhandled);
  await page.route(`${base.href}**`, async route => {
    const pathname = new URL(route.request().url()).pathname.slice(base.pathname.length - 1);
    const response = pathname === '/auth/session' ? { user: { id: ALICE, handle: 'alice_typist', email: 'alice@example.invalid', created_at: '2026-10-21T00:00:00.000Z' }, csrfToken: 'friends-fixture' }
      : pathname === '/preferences' ? { ownerId: ALICE, preferences: {}, version: 0 }
      : pathname === '/sessions' ? { ownerId: ALICE, sessions: [], learningEvidence: [], version: 0, hasMore: false }
      : pathname === '/data/version' ? { ownerId: ALICE, version: 0 }
      : pathname === '/profile' ? { id: ALICE, handle: 'alice_typist' } : null;
    if (response) { await route.fulfill({ json: response }); return; }
    unhandled.push(`${route.request().method()} ${pathname}`);
    await route.fulfill({ status: 501, json: { error: { code: 'fixture-unhandled', message: 'This account fixture does not own that operation.' } } });
  });
});
test.afterEach(async ({ page }) => { expect(unexpectedRequests.get(page) ?? [], 'All account requests must stay inside the declared fixture').toEqual([]); });
test('owner-bound friend controls preserve private fields and block both contact and duel views', async ({ page }) => {
  const state = snapshot(), writes: Record<string, unknown>[] = [];
  await page.route('**/api/social**', async route => { if (route.request().method() === 'POST') { const body = route.request().postDataJSON(); writes.push(body); expect(body.expectedOwner).toBe(ALICE); if (route.request().url().endsWith('/block')) { state.friends = []; state.duels = []; state.blocked = [{ id: BOB, handle: 'bob_typist' }]; } } await route.fulfill({ json: state }); });
  await page.goto('/friends');
  const contact = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'bob_typist', exact: true }) });
  await expect(contact.getByText('Practiced recently', { exact: true })).toBeVisible();
  await expect(page.getByText('private-bob@example.invalid', { exact: true })).toHaveCount(0);
  await expect(page.getByText('private evidence must never render', { exact: true })).toHaveCount(0);
  await contact.getByRole('button', { name: 'Block', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'bob_typist', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Unblock', exact: true })).toBeVisible();
  await expect(page.getByText('No accepted friends yet.', { exact: false })).toBeVisible();
  expect(writes).toHaveLength(1);
});
test('an incoming request is explicitly accepted and reports carry a fixed category only', async ({ page }) => {
  const state = snapshot(), writes: { action: string; body: Record<string, unknown> }[] = [];
  await page.route('**/api/social**', async route => { if (route.request().method() === 'POST') { const action = route.request().url().split('/').at(-1)!, body = route.request().postDataJSON(); writes.push({ action, body }); if (action === 'accept') { state.requests = []; state.friends.push({ id: CAROL, handle: 'carol_typist', activeRecently: false, email: 'private-carol@example.invalid', events: [] }); } } await route.fulfill({ json: state }); });
  await page.goto('/friends'); await page.getByRole('button', { name: 'Accept request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'carol_typist', exact: true })).toBeVisible();
  const contact = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'bob_typist', exact: true }) });
  await contact.getByRole('combobox').selectOption('cheating'); await contact.getByRole('button', { name: 'Record report', exact: true }).click();
  expect(writes.at(-1)).toEqual({ action: 'report', body: { expectedOwner: ALICE, userId: BOB, reason: 'cheating' } });
  await expect(page.getByRole('textbox', { name: /message|chat/i })).toHaveCount(0);
});
test('a different owner response never becomes the current private contact list', async ({ page }) => {
  await page.route('**/api/social**', route => route.fulfill({ json: { ...snapshot(), ownerId: BOB } }));
  await page.goto('/friends'); await expect(page.getByRole('alert')).toContainText('did not match this workspace');
  await expect(page.getByRole('heading', { name: 'bob_typist', exact: true })).toHaveCount(0);
});
test('service errors remain explicit without inventing empty successful contacts', async ({ page }) => {
  await page.route('**/api/social**', route => route.fulfill({ status: 503, json: { error: { code: 'database', message: 'Private account service unavailable.' } } }));
  await page.goto('/friends'); await expect(page.getByRole('alert')).toContainText('Private account service unavailable.');
  await expect(page.getByText('No accepted friends yet.', { exact: false })).toHaveCount(0);
});
test('an actual issued duel UI waits for its countdown and uses the canonical input', async ({ page }) => {
  const instant = Date.parse('2026-10-21T12:00:00.000Z'); await page.clock.install({ time: instant });
  const state = snapshot(); let starts = 0;
  await page.route('**/api/social**', async route => {
    if (route.request().method() === 'POST' && route.request().url().endsWith('/duel-start')) { starts++; const body = route.request().postDataJSON(); expect(body).toEqual({ expectedOwner: ALICE, duelId: DUEL }); await route.fulfill({ json: { ...state, challenge: { id: '55555555-5555-4555-8555-555555555555', user_id: ALICE, configuration: { mode: 'time', durationMs: 30000, language: 'en', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', contentRevision: 'forge-social-duel-en-v1', correctionPolicy: 'current-word' }, target_text: 'clear focus steady hands', starts_at: new Date(instant + 3000).toISOString(), deadline_at: new Date(instant + 33000).toISOString(), expires_at: new Date(instant + 600000).toISOString(), server_now: new Date(instant).toISOString() } } }); return; }
    await route.fulfill({ json: state });
  });
  await page.goto('/friends'); await page.getByRole('button', { name: 'Start my counted attempt', exact: true }).click();
  await expect(page.getByText('Your independent server-timed attempt starts after the countdown.', { exact: true })).toBeVisible();
  await page.clock.fastForward(3100); const input = page.getByRole('textbox', { name: 'Typing input', exact: true }); await expect(input).toBeVisible(); await input.pressSequentially('cl'); await expect(input).toHaveValue('cl');
  expect(starts).toBe(1);
});
for (const width of [390, 1440]) test(`friends populated requests duels and report controls meet WCAG2.2AA at${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  const initial = snapshot(), writes: { action: string; body: Record<string, unknown> }[] = [];
  const populated = { ...initial,
    requests: [...initial.requests, { id: '55555555-5555-4555-8555-555555555555', handle: 'waiting_typist', direction: 'outgoing' }],
    blocked: [{ id: '66666666-6666-4666-8666-666666666666', handle: 'blocked_typist' }],
    duels: [...initial.duels, { ...initial.duels[0], id: '77777777-7777-4777-8777-777777777777', state: 'completed', ownSubmitted: true, winnerId: ALICE,
      scores: [{ userId: ALICE, handle: 'alice_typist', wpm: 68.2, accuracy: 98.4 }, { userId: BOB, handle: 'bob_typist', wpm: 61.3, accuracy: 97.1 }] }] };
  await page.route('**/api/social**', async route => {
    if (route.request().method() === 'POST') {
      const action = route.request().url().split('/').at(-1)!, body = route.request().postDataJSON();
      writes.push({ action, body });
      expect(action).toBe('report'); expect(body.expectedOwner).toBe(ALICE);
      await route.fulfill({ json: { ...populated, notice: 'Your fixed-category report was recorded.' } });
    } else await route.fulfill({ json: populated });
  });
  await page.goto('/friends');
  await expect(page.getByRole('heading', { name: 'bob_typist', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept request', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel request', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unblock', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start my counted attempt', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Server accepted private duel results', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: "Friend's username", exact: true }).fill('another_typist');
  await expect(page.getByRole('button', { name: 'Send private request', exact: true })).toBeEnabled();
  const contact = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'bob_typist', exact: true }) });
  await contact.getByRole('combobox', { name: `Report category for account ${BOB}`, exact: true }).selectOption('cheating');
  await contact.getByRole('button', { name: 'Record report', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Your fixed-category report was recorded.' })).toBeVisible();
  expect(writes).toEqual([{ action: 'report', body: { expectedOwner: ALICE, userId: BOB, reason: 'cheating' } }]);
  await expect(page.getByText('private-bob@example.invalid', { exact: true })).toHaveCount(0);
  await expect(page.getByText('private evidence must never render', { exact: true })).toHaveCount(0);
  await auditPopulatedRoute(page, info, `friends-populated-${width}`);
});
