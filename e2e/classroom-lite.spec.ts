import { expect, test } from '@playwright/test';
import axe from 'axe-core';
import { readFile } from 'node:fs/promises';
import { phpApiBase } from './php-api-fixture';

test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
});
test('device-only aliases and reports stay explicitly manual and omit invitation labels from export', async ({ page }) => {
  await page.goto('/classroom');
  await page.getByLabel('Classroom title', { exact: true }).fill('Evening practice');
  await page.getByRole('button', { name: 'Create device-only classroom', exact: true }).click();
  const code = await page.getByRole('region', { name: 'New private class code', exact: true }).locator('code').innerText();
  await page.getByRole('button', { name: 'Hide code', exact: true }).click();
  await page.getByText('Add a manually reported alias', { exact: true }).click();
  await page.getByLabel('Student alias, without an email', { exact: true }).fill('Learner-01');
  await page.getByRole('button', { name: 'Add unverified manual report', exact: true }).click();
  await expect(page.getByRole('rowheader', { name: 'Learner-01', exact: true })).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export aggregates', exact: true }).click();
  const download = await pending;
  const text = await readFile((await download.path())!, 'utf8');
  expect(text).not.toContain(code);
  expect(JSON.parse(text).members[0].verification).toBe('manual-unverified');
  expect(JSON.parse(text).members[0].alias).toBe('Learner-01');
});
test('classroom ready view has a full accessible label/role surface', async ({ page }) => {
  await page.goto('/classroom');
  await expect(page.getByRole('heading', { name: 'Classroom lite', exact: true })).toBeVisible();
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => (window as typeof window & { axe: typeof axe }).axe.run(document).then(result => result.violations));
  expect(violations).toEqual([]);
});
test('explicit teacher refresh fetches new aggregates while preserving the join code and active student input', async ({ page, baseURL }) => {
  const metadata = await page.request.get(new URL('deployment.json', baseURL!).href);
  const deployment = await metadata.json() as { frontendOnly: boolean };
  test.skip(deployment.frontendOnly, 'Server-only teacher controls are explicitly unavailable in frontend-only builds.');
  const api = phpApiBase(baseURL!), owner = 'a1111111-1111-4111-8111-111111111111';
  const classId = 'b2222222-2222-4222-8222-222222222222', memberId = 'c3333333-3333-4333-8333-333333333333';
  const privateCode = '1111-2222-3333-4444-5555-6666-7777-8888';
  const room = { id: classId, title: 'Evening server practice', createdAt: '2026-10-21T00:00:00Z', members: [] as Array<{ id: string; alias: string; sessions: number; activeMs: number; insertionAttempts: number; correctAttempts: number; bestWpm: number; verification: string }> };
  let classes: typeof room[] = [], reads = 0, releaseRefresh!: () => void;
  const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
  await page.route(`${api.href}**`, async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname.slice(api.pathname.length - 1);
    if (path === '/auth/session') { await route.fulfill({ json: { user: { id: owner, handle: 'classroom_teacher', email: 'teacher@fixture.invalid', created_at: '2026-10-21T00:00:00Z' }, csrfToken: 'classroom-refresh-fixture' } }); return; }
    if (path === '/classroom' && request.method() === 'GET') { reads++; expect(url.searchParams.get('expectedOwner')).toBe(owner); if (reads > 1) await refreshGate; await route.fulfill({ json: { ownerId: owner, classes } }); return; }
    if (path === '/classroom/create') { expect(request.postDataJSON().expectedOwner).toBe(owner); classes = [room]; await route.fulfill({ json: { ownerId: owner, class: room, privateCode } }); return; }
    if (path === '/classroom/student/join') {
      await route.fulfill({ json: { student: { classId, classTitle: room.title, memberId, alias: 'Teacher Pupil', configuration: { clientSessionId: 'd4444444-4444-4444-8444-444444444444', ownerScope: memberId, initialTarget: 'calm steady hands', mode: 'custom', scoringPolicy: 'prose', correctionPolicy: 'correct-words-locked', language: 'en', keyboardLayout: 'qwerty', inputMethod: 'keyboard', privacy: 'public-corpus', settings: { review: true } } }, privacy: 'The teacher sees shared aggregates only.' } }); return;
    }
    await route.fulfill({ json: path === '/preferences' ? { preferences: {}, version: 0 } : path === '/data/version' ? { ownerId: owner, version: 0 } : path.startsWith('/sessions') ? { ownerId: owner, sessions: [], learningEvidence: [], version: 0, hasMore: false } : {} });
  });
  await page.clock.install();
  await page.goto('/classroom'); await page.getByRole('button', { name: 'Server classroom', exact: true }).click();
  await expect.poll(() => reads).toBe(1);
  await page.getByLabel('Classroom title', { exact: true }).fill(room.title);
  await page.getByRole('button', { name: 'Create private classroom', exact: true }).click();
  await expect(page.getByRole('region', { name: 'New private class code', exact: true }).locator('code')).toHaveText(privateCode);
  await page.getByRole('textbox', { name: 'Private class code', exact: true }).fill(privateCode);
  await page.getByLabel('Classroom alias', { exact: true }).fill('Teacher Pupil');
  await page.getByRole('button', { name: 'Join private classroom', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true }); await input.pressSequentially('ca');
  room.members = [{ id: 'e5555555-5555-4555-8555-555555555555', alias: 'New report pupil', sessions: 2, activeMs: 120000, insertionAttempts: 100, correctAttempts: 99, bestWpm: 42, verification: 'replay-checked-not-human-verified' }];
  await page.clock.fastForward(60000);
  expect(reads).toBe(1); await expect(page.getByRole('rowheader', { name: 'New report pupil', exact: true })).toHaveCount(0);
  const refresh = page.getByRole('button', { name: 'Refresh progress', exact: true });
  try {
    await refresh.click(); await expect.poll(() => reads).toBe(2); await expect(refresh).toBeDisabled(); await expect(input).toHaveValue('ca');
    releaseRefresh(); await expect(page.getByRole('rowheader', { name: 'New report pupil', exact: true })).toBeVisible(); await expect(refresh).toBeEnabled();
    await expect(page.getByRole('region', { name: 'New private class code', exact: true }).locator('code')).toHaveText(privateCode);
    await expect(input).toHaveValue('ca'); expect(reads).toBe(2);
    await expect(page.getByRole('status').filter({ hasText: 'Progress refreshed from the server.' })).toBeVisible();
  } finally { releaseRefresh(); }
});
test('a slow initial teacher read cannot overwrite a newer explicit progress refresh', async ({ page, baseURL }) => {
  const metadata = await page.request.get(new URL('deployment.json', baseURL!).href);
  test.skip((await metadata.json() as { frontendOnly: boolean }).frontendOnly, 'Server controls are unavailable in frontend-only builds.');
  const api = phpApiBase(baseURL!), owner = 'a1111111-1111-4111-8111-111111111111';
  let reads = 0, releaseInitial!: () => void;
  const initialGate = new Promise<void>(resolve => { releaseInitial = resolve; });
  const old = [{ id: 'old', title: 'Earlier snapshot', createdAt: '2026-10-21T00:00:00Z', members: [] }];
  const latest = [{ id: 'current', title: 'Latest shared progress', createdAt: '2026-10-21T00:00:00Z', members: [] }];
  await page.route(`${api.href}**`, async route => {
    const path = new URL(route.request().url()).pathname.slice(api.pathname.length - 1);
    if (path === '/auth/session') { await route.fulfill({ json: { user: { id: owner, handle: 'classroom_teacher', email: 'teacher@fixture.invalid', created_at: '2026-10-21T00:00:00Z' }, csrfToken: 'classroom-order-fixture' } }); return; }
    if (path === '/classroom') { const current = ++reads; if (current === 1) await initialGate; await route.fulfill({ json: { ownerId: owner, classes: current === 1 ? old : latest } }); return; }
    await route.fulfill({ json: path === '/preferences' ? { preferences: {}, version: 0 } : path === '/data/version' ? { ownerId: owner, version: 0 } : path.startsWith('/sessions') ? { ownerId: owner, sessions: [], learningEvidence: [], version: 0, hasMore: false } : {} });
  });
  try {
    await page.goto('/classroom'); await page.getByRole('button', { name: 'Server classroom', exact: true }).click(); await expect.poll(() => reads).toBe(1);
    await page.getByRole('button', { name: 'Refresh progress', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Latest shared progress', exact: true })).toBeVisible();
    const initialResponse = page.waitForResponse(response => response.url().startsWith(`${api.href}classroom?`));
    releaseInitial(); await initialResponse;
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole('heading', { name: 'Latest shared progress', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Earlier snapshot', exact: true })).toHaveCount(0); expect(reads).toBe(2);
  } finally { releaseInitial(); }
});
