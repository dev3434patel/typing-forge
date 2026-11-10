import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { focusTyping } from './helpers';
import { phpApiBase } from './php-api-fixture';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page, context, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  // Own the full API surface; the account test's page route takes precedence.
  await context.route(`${phpApiBase(baseURL!).href}**`, route => route.fulfill({ json: { user: null, csrfToken: 'owned-profile-guest-fixture' } }));
});

test('Profile retains early native confirmation after course history and paint, then completes durable reset', async ({ page }) => {
  test.setTimeout(60_000);
  const catalog = JSON.parse(readFileSync('backend/resources/typing-course-v1.json', 'utf8')) as { lessons: { id: string; variants: { id: string; text: string }[] }[] };
  const [first, second] = catalog.lessons;
  await page.goto(`/lessons?lesson=${first.id}`);
  await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
  const qualify = async (variant = 'a') => {
    const input = await focusTyping(page);
    await input.pressSequentially(first.variants.find(row => row.id === variant)!.text, { delay: 65 });
    await expect(page.getByRole('region', { name: 'Course lesson result', exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Saving this attempt' })).toHaveCount(0);
  };
  await qualify();
  await page.getByRole('button', { name: 'Repeat this passage', exact: true }).click();
  await qualify();
  await page.getByRole('button', { name: 'Start the next passage', exact: true }).click();
  await qualify('b');
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start lesson', exact: true })).toBeEnabled();
  await page.goto('/profile');
  const confirmation = page.getByLabel('Type DELETE to enable this action', { exact: true });
  await confirmation.fill('DELETE');
  await expect(confirmation).toHaveValue('DELETE');
  await expect(page.getByText(/3 saved sessions ·/)).toBeVisible();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(confirmation).toHaveValue('DELETE');
  await page.getByRole('button', { name: 'Reset guest workspace', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'This device workspace has been reset.' })).toBeVisible();
  await page.goto(`/lessons?lesson=${second.id}`);
  await expect(page.getByText('Build the previous skill first.', { exact: true })).toBeVisible();
});

test('confirmation is cleared on each real account transition, including A to B to A', async ({ page, baseURL }) => {
  const base = phpApiBase(baseURL!);
  const alice = 'a1111111-1111-4111-8111-111111111111', bob = 'b2222222-2222-4222-8222-222222222222';
  let owner = alice;
  await page.route(`${base.href}**`, async route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.slice(base.pathname.length - 1);
    const user = { id: owner, email: `${owner}@fixture.invalid`, handle: owner === alice ? 'alice' : 'bob', created_at: '2026-11-05T00:00:00Z' };
    const body = endpoint === '/auth/session' ? { user, csrfToken: 'profile-owner-fixture' }
      : endpoint === '/profile' ? { id: owner, handle: user.handle }
        : endpoint === '/preferences' ? { preferences: {}, version: 0 }
          : endpoint.startsWith('/sessions') ? { ownerId: owner, sessions: [], learningEvidence: [], version: 0, hasMore: false }
            : endpoint === '/data/version' ? { ownerId: owner, version: 0 } : {};
    await route.fulfill({ json: body });
  });
  await page.goto('/profile');
  const confirmation = page.getByLabel('Type DELETE to enable this action', { exact: true });
  const remove = page.getByRole('button', { name: 'Permanently delete account', exact: true });
  await expect(page.getByRole('heading', { name: 'alice', exact: true })).toBeVisible();
  await confirmation.fill('DELETE'); await expect(remove).toBeEnabled();
  for (const next of [bob, alice]) {
    owner = next;
    await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'sparowtype:auth-changed', newValue: 'owned-profile-transition' })));
    await expect(page.getByRole('heading', { name: next === alice ? 'alice' : 'bob', exact: true })).toBeVisible();
    await expect(confirmation).toHaveValue(''); await expect(remove).toBeDisabled();
    await confirmation.fill('DELETE'); await expect(remove).toBeEnabled();
  }
});
