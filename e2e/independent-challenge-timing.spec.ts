import { expect, test, type Page } from '@playwright/test';
import { phpApiBase } from './php-api-fixture';
import { exportedResult, focusTyping } from './helpers';

// Explicit intercepted API-contract tests. These exercise shipped React input,
// clocks and exports; they do not assert real server acceptance or human input.
test.use({ serviceWorkers: 'block' });
const OWNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const DUEL = '44444444-4444-4444-8444-444444444444';
type Kind = 'ranked' | 'duel';

async function fixture(page: Page, baseURL: string, kind: Kind, options: { preparationMs?: number; foreignOwner?: boolean; unknownPolicy?: boolean } = {}) {
  const deployment = await page.request.get(new URL('deployment.json', baseURL).href);
  expect(deployment.ok()).toBe(true);
  test.skip((await deployment.json()).frontendOnly === true, 'This issued-account fixture requires the PHP-enabled bundle; standalone availability has separate tests.');
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  await page.clock.install({ time: Date.parse('2026-10-22T01:00:00.000Z') });
  const api = phpApiBase(baseURL), durationMs = kind === 'ranked' ? 15000 : 30000;
  const unexpected: string[] = [], submissions: unknown[] = [], pageErrors: string[] = [];
  const expectedSessionId: { value: string | null } = { value: null };
  let issuedAt = 0, issuedCount = 0;
  page.on('pageerror', error => pageErrors.push(error.message));
  const social = { ownerId: OWNER, friends: [{ id: OTHER, handle: 'friend_fixture', activeRecently: false }], requests: [], blocked: [], duels: [{ id: DUEL, creatorId: OWNER, opponentId: OTHER, otherHandle: 'friend_fixture', state: 'accepted', expiresAt: '2026-12-01T00:00:00.000Z', ownSubmitted: false, scores: [], winnerId: null }] };
  await page.route(`${api.href}**`, async route => {
    const pathname = new URL(route.request().url()).pathname.slice(api.pathname.length - 1);
    const method = route.request().method();
    if (pathname === '/auth/session') return route.fulfill({ json: { user: { id: OWNER, handle: 'timing_fixture', email: 'timing@example.invalid', created_at: '2026-10-21T00:00:00.000Z' }, csrfToken: 'declared-timing-fixture' } });
    if (pathname === '/preferences') return route.fulfill({ json: { ownerId: OWNER, preferences: {}, version: 0 } });
    if (pathname === '/sessions' && method === 'GET') return route.fulfill({ json: { ownerId: OWNER, sessions: [], learningEvidence: [], version: 0, hasMore: false } });
    if (pathname === '/data/version') return route.fulfill({ json: { ownerId: OWNER, version: 0 } });
    if (pathname === '/profile') return route.fulfill({ json: { id: OWNER, handle: 'timing_fixture' } });
    if (pathname === '/social' && method === 'GET') return route.fulfill({ json: social });
    if (pathname === '/challenges/issue' || pathname === '/social/duel-start') {
      const body = route.request().postDataJSON();
      if (kind === 'ranked') expect(body.duration).toBe(15);
      else expect(body).toEqual({ expectedOwner: OWNER, duelId: DUEL });
      issuedCount++;
      issuedAt = await page.evaluate(() => Date.now());
      const iso = (offset: number) => new Date(issuedAt + offset).toISOString();
      const challenge = { id: '55555555-5555-4555-8555-555555555555', nonce: '66666666-6666-4666-8666-666666666666', user_id: options.foreignOwner ? OTHER : OWNER, configuration: { mode: 'time', durationMs, language: 'en', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', correctionPolicy: 'current-word', contentRevision: kind === 'ranked' ? 'forge-ranked-en-v2' : 'forge-social-duel-en-v2', settings: { timingPolicy: options.unknownPolicy ? 'unknown' : 'first-input-v1' } }, target_text: 'cat dog calm clear steady '.repeat(100), issued_at: iso(0), server_now: iso(0), starts_at: iso(3000), deadline_at: iso(3000 + durationMs), expires_at: iso(3000 + durationMs + (options.preparationMs ?? 60000)) };
      return route.fulfill({ json: kind === 'ranked' ? { challenge } : { ...social, challenge } });
    }
    if ((pathname === '/sessions' || pathname === '/social/duel-submit') && method === 'POST') {
      const candidate = route.request().postDataJSON().candidate;
      expect(candidate.ownerScope).toBe(OWNER);
      expect(candidate.clientSessionId).toBe(expectedSessionId.value);
      submissions.push(candidate);
      return route.fulfill({ status: 503, json: { error: { code: 'declared-fixture-no-server-replay', message: 'This UI fixture deliberately leaves evidence local; real PHP acceptance is tested separately.' } } });
    }
    if (pathname === '/progression/claim' && method === 'POST') {
      const body = route.request().postDataJSON();
      expect(Object.keys(body).sort()).toEqual(['expectedOwner', 'sessionId', 'timeZone']);
      expect(body.expectedOwner).toBe(OWNER);
      expect(expectedSessionId.value).not.toBeNull();
      expect(body.sessionId).toBe(expectedSessionId.value);
      expect(route.request().headers()['idempotency-key']).toBe(`session:${body.sessionId}`);
      expect(typeof body.timeZone).toBe('string');
      expect(() => new Intl.DateTimeFormat('en', { timeZone: body.timeZone })).not.toThrow();
      return route.fulfill({ status: 503, json: { error: { code: 'declared-fixture-no-verified-award', message: 'This UI fixture retains the local reference without inventing a server-verified reward.' } } });
    }
    unexpected.push(`${method} ${pathname}`);
    return route.fulfill({ status: 501, json: { error: { code: 'fixture-unhandled', message: 'Undeclared account fixture operation.' } } });
  });
  await page.goto(kind === 'ranked' ? '/ranked' : '/friends');
  if (kind === 'ranked') {
    await page.getByRole('combobox', { name: 'Challenge duration', exact: true }).selectOption('15');
    await page.getByRole('button', { name: 'Start ranked challenge', exact: true }).click();
  } else await page.getByRole('button', { name: 'Start my counted attempt', exact: true }).click();
  return { durationMs, unexpected, submissions, pageErrors, expectedSessionId, issuedAt: () => issuedAt, issuedCount: () => issuedCount };
}

for (const kind of ['ranked', 'duel'] as const) {
  test(`${kind} first-input fixture stays ready during idle, starts on a wrong key and preserves the full monotonic duration`, async ({ page, baseURL }) => {
    const state = await fixture(page, baseURL!, kind);
    await expect(page.getByText(/first character starts it|first character starts the clock|first character starts it/i).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
    await page.clock.fastForward(3100);
    const session = page.getByRole('region', { name: 'Typing session', exact: true });
    await expect(session).toHaveAttribute('data-status', 'ready');
    state.expectedSessionId.value = await session.getAttribute('data-session-id');
    await page.clock.fastForward(7000);
    await expect(session).toHaveAttribute('data-status', 'ready');
    await expect(session.locator('.typing-hud').getByText(`${state.durationMs / 1000}s`, { exact: true })).toBeVisible();
    await page.clock.setSystemTime(new Date(state.issuedAt() + 3600000));
    const input = await focusTyping(page);
    await input.press('x');
    await expect(input).toHaveValue('x');
    await expect(session).toHaveAttribute('data-status', 'running');
    await page.clock.fastForward(state.durationMs + 150);
    await expect(page.getByRole('region', { name: 'Session results', exact: true })).toBeVisible();
    const result = await exportedResult(page);
    expect(result.elapsedMs).toBe(state.durationMs);
    expect(result.finishReason).toBe('timeout');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ offsetMs: 0, text: 'x', provenance: 'keyboard' });
    expect(result.metrics.incorrectAttempts).toBe(1);
    expect(result.metrics.inputAccuracy).toBe(0);
    expect(result.startedAtWall).toBeGreaterThanOrEqual(state.issuedAt() + 10000);
    expect(result.startedAtWall).toBeLessThan(state.issuedAt() + 60000);
    // The installed clock rounds performance samples up to1ms; the calibrated
    // wall endpoints are separate reads from the monotonic duration endpoints.
    expect(Math.abs(result.finishedAtWall - result.startedAtWall! - result.wallDurationMs),
      'Wall endpoints differ from monotonic duration by at most one installed-clock tick').toBeLessThanOrEqual(1);
    expect(state.issuedCount()).toBe(1);
    expect(state.unexpected).toEqual([]);
    expect(state.pageErrors).toEqual([]);
  });

  test(`${kind} preparation expiry removes idle input without an attempt or an uncaught typing error`, async ({ page, baseURL }) => {
    const state = await fixture(page, baseURL!, kind, { preparationMs: 2000 });
    await page.clock.fastForward(3100);
    await expect(page.getByRole('region', { name: 'Typing session', exact: true })).toHaveAttribute('data-status', 'ready');
    await page.clock.fastForward(2500);
    await expect(page.getByRole('alert')).toContainText('preparation window expired');
    await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Session results', exact: true })).toHaveCount(0);
    expect(state.submissions).toEqual([]);
    expect(state.issuedCount()).toBe(1);
    expect(state.unexpected).toEqual([]);
    expect(state.pageErrors).toEqual([]);
  });

  test(`${kind} rejects an issued challenge for a different account before mounting input`, async ({ page, baseURL }) => {
    const state = await fixture(page, baseURL!, kind, { foreignOwner: true });
    await expect(page.getByRole('alert')).toContainText(kind === 'ranked' ? 'valid challenge for this account' : 'your own issued challenge');
    await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
    expect(state.submissions).toEqual([]);
    expect(state.unexpected).toEqual([]);
    expect(state.pageErrors).toEqual([]);
  });

  test(`${kind} rejects an unknown issued timing policy with an explicit error`, async ({ page, baseURL }) => {
    const state = await fixture(page, baseURL!, kind, { unknownPolicy: true });
    if (kind === 'duel') await page.clock.fastForward(3100);
    await expect(page.getByRole('alert')).toContainText('Unknown issued challenge timing policy');
    await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
    expect(state.submissions).toEqual([]);
    expect(state.unexpected).toEqual([]);
    expect(state.pageErrors).toEqual([]);
  });
}
